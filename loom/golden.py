"""The golden set (E1 of D-102): define "mature" by a person's ratings, before any judge may gate on it.

    py -m loom golden build [--root docs=C:/Users/Admin/Documents] [--force]   # extract + normalise the frames
    py -m loom golden serve [--port 8830]                                       # the blind rating page (local only)
    py -m loom golden report [--rater kshitij] [--judge scores.json]            # what the ratings say; judge agreement
    py -m loom golden export                                                    # the frames by opaque id, for the pod's judge

The spec is docs/research/golden/golden_set.json (sources, times, classes). Frames go to cache/golden/frames
(gitignored: reference stills are study material, kept local, never published). The page sees only opaque ids,
never a class, a key or a source. Ratings are append-only JSON lines in docs/research/golden/ratings/<rater>.jsonl;
the latest line for a presentation wins, so going back to change a score loses nothing.

Fairness rules (every frame, whatever its class): brought to 640x360 like the reference videos; any source taller
than 360 px is re-encoded once with h264 so compression is not a tell; the bottom 14 % is cut because Loom renders
burn in captions. A few frames are shown twice, far apart, to measure the rater's own consistency: a judge cannot be
asked to agree with a person more closely than the person agrees with himself.
"""
from __future__ import annotations

import json
import math
import os
import random
import re
import shutil
import tempfile
import time
from pathlib import Path

from .util import ENGINE_ROOT, LoomError, info, read_json, run, sha, which, write_json

GOLD = ENGINE_ROOT / "docs" / "research" / "golden"
SPEC = GOLD / "golden_set.json"
MANIFEST = GOLD / "manifest.json"
RATINGS = GOLD / "ratings"
CACHE = ENGINE_ROOT / "cache" / "golden"
TAGS = ["drawing", "people", "colour", "type", "layout", "density", "slides", "finish"]
GATE_RHO = 0.7


# ---------------------------------------------------------------------------------------------------------- build
def _roots(spec: dict, overrides: dict[str, str] | None) -> dict[str, Path | None]:
    out = {}
    for name, cands in (spec.get("roots") or {}).items():
        env = os.environ.get(f"LOOM_GOLDEN_ROOT_{name.upper()}")
        pick = None
        for c in ([overrides[name]] if overrides and name in overrides else []) + ([env] if env else []) + list(cands):
            p = Path(os.path.expanduser(c))
            p = p if p.is_absolute() else (ENGINE_ROOT / p)
            if p.is_dir():
                pick = p.resolve(); break
        out[name] = pick
    return out


def resolve(src: str, roots: dict[str, Path | None]) -> Path | None:
    name, _, rel = src.partition(":")
    base = roots.get(name)
    return (base / rel) if base else None


def panels(img) -> list[list[tuple[int, int, int, int]]]:
    """A lab strip's frame panels as rows of (x, y, w, h), from the layout loom/lab.py writes (keep in step with
    lab.strip: 640x360 tiles, a 6 px gutter, 46 px title band, 30 px per row for the time label, pasted 24 px down).
    Reading panels from pixels failed on dark styles (L-187), so the layout is the source of truth, and a sheet whose
    size does not match it is refused rather than cropped wrong."""
    W_, H_ = 640, 360
    cols = (img.width - 6) // (W_ + 6); rows = (img.height - 46) // (H_ + 30)
    if cols < 1 or rows < 1 or cols * (W_ + 6) + 6 != img.width or rows * (H_ + 30) + 46 != img.height:
        raise LoomError(f"not a lab strip sheet ({img.width}x{img.height}); lab.py's layout may have changed")
    return [[(6 + c * (W_ + 6), 46 + r * (H_ + 30) + 24, W_, H_) for c in range(cols)] for r in range(rows)]


def _grab(item: dict, path: Path, tmp: Path):
    from PIL import Image
    if "t" in item:
        out = tmp / "grab.png"
        run(["ffmpeg", "-v", "error", "-y", "-ss", str(item["t"]), "-i", str(path), "-frames:v", "1", str(out)])
        return Image.open(out).convert("RGB")
    img = Image.open(path).convert("RGB")
    if "panel" in item:
        r, c = item["panel"]
        P = panels(img)
        if r >= len(P) or c >= len(P[r]):
            raise LoomError(f"{item['key']}: no panel {r},{c} in {path.name} ({len(P)} rows)")
        x, y, w, h = P[r][c]
        img = img.crop((x, y, x + w, y + h))
    return img


def normalise(img, frame: dict, tmp: Path, from_small_video: bool = False):
    """Same treatment for every frame: 640x360; one h264 pass unless the frame already came out of a <=360p video
    (a still or a lab panel is cleaner than any video frame, which would be a tell); then the top 86 %."""
    from PIL import Image
    W, H = frame["width"], frame["height"]
    sharper = not (from_small_video and img.height <= H)
    img = img.resize((W, H), Image.LANCZOS)
    if sharper:
        a, v, b = tmp / "n.png", tmp / "n.mp4", tmp / "n2.png"
        img.save(a)
        run(["ffmpeg", "-v", "error", "-y", "-i", str(a), "-c:v", "libx264", "-crf", str(frame["reencode_crf"]),
             "-pix_fmt", "yuv420p", str(v)])
        run(["ffmpeg", "-v", "error", "-y", "-i", str(v), "-frames:v", "1", str(b)])
        img = Image.open(b).convert("RGB")
    return img.crop((0, 0, W, round(H * frame["keep_top"])))


def plan_order(fids: list[str], seed: int, repeats: int, min_gap: int = 20) -> list[dict]:
    """Shuffle once (seeded), then show `repeats` frames a second time, each at least min_gap places after the first."""
    rng = random.Random(seed)
    order = fids[:]; rng.shuffle(order)
    n = len(order)
    reps = rng.sample(order[: max(1, n - min_gap)], min(repeats, max(0, n - min_gap)))
    seq = [{"fid": f, "repeat": False} for f in order]
    for f in reps:
        first = next(i for i, s in enumerate(seq) if s["fid"] == f)
        lo = first + min_gap
        pos = rng.randint(lo, len(seq)) if lo <= len(seq) else len(seq)
        seq.insert(pos, {"fid": f, "repeat": True})
    for i, s in enumerate(seq):
        s["entry"] = sha("golden-entry", seed, s["fid"], i, n=12)
    return seq


def build(roots_override: dict[str, str] | None = None, force: bool = False, spec_path: Path = SPEC,
          cache: Path = CACHE, manifest_path: Path = MANIFEST) -> dict:
    spec = read_json(spec_path)
    if not spec or not spec.get("items"):
        raise LoomError(f"no items in {spec_path}")
    if not which("ffmpeg"):
        raise LoomError("ffmpeg not found")
    keys = [it["key"] for it in spec["items"]]
    if len(set(keys)) != len(keys):
        raise LoomError("duplicate keys in the golden spec")
    roots = _roots(spec, roots_override)
    fdir = cache / "frames"; fdir.mkdir(parents=True, exist_ok=True)
    frames, missing, made = [], [], 0
    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)
        for it in spec["items"]:
            fid = sha("golden", spec["seed"], it["key"], n=10)
            out = fdir / f"{fid}.jpg"
            src = resolve(it["src"], roots)
            rec = {"fid": fid, "key": it["key"], "class": it["class"], "src": it["src"], "t": it.get("t"), "panel": it.get("panel")}
            if out.exists() and not force:
                frames.append(rec); continue
            if not src or not src.exists():
                missing.append(f"{it['key']}: {it['src']} (root {it['src'].split(':')[0]} = {roots.get(it['src'].split(':')[0])})")
                continue
            raw = _grab(it, src, tmp)
            img = normalise(raw, spec["frame"], tmp, from_small_video="t" in it)
            img.save(out, quality=92)
            rec["source_bytes"] = src.stat().st_size
            frames.append(rec); made += 1
    if not frames:
        raise LoomError("no golden frame could be built:\n  " + "\n  ".join(missing))
    seq = plan_order([f["fid"] for f in frames], spec["seed"], spec.get("repeats", 0))
    man = {"version": spec["version"], "built": time.strftime("%Y-%m-%d %H:%M"), "frames": frames, "sequence": seq,
           "missing": missing, "classes": {c: sum(1 for f in frames if f["class"] == c) for c in sorted({f["class"] for f in frames})}}
    # a rebuild must not reshuffle under a rater mid-way: keep the sequence if the frame set is unchanged
    old = read_json(manifest_path, {}) or {}
    if old.get("sequence") and sorted(x["fid"] for x in old.get("frames", [])) == sorted(f["fid"] for f in frames):
        man["sequence"] = old["sequence"]
    write_json(manifest_path, man)
    _sheet(frames, fdir, cache / "sheet.jpg")
    info(f"golden: {len(frames)} frames ({made} new), {len(man['sequence'])} presentations, classes {man['classes']}")
    if missing:
        info("  missing sources:\n    " + "\n    ".join(missing))
    return man


def _sheet(frames: list[dict], fdir: Path, out: Path) -> None:
    """A local contact sheet WITH keys, for the builder to check the picks (never shown to the rater)."""
    from PIL import Image, ImageDraw
    cols, tw, th = 6, 320, 155
    rows = (len(frames) + cols - 1) // cols
    W = Image.new("RGB", (cols * (tw + 2), rows * (th + 18)), "white"); d = ImageDraw.Draw(W)
    for k, f in enumerate(frames):
        p = fdir / f"{f['fid']}.jpg"
        if not p.exists():
            continue
        x, y = (k % cols) * (tw + 2), (k // cols) * (th + 18)
        W.paste(Image.open(p).resize((tw, th)), (x, y))
        d.text((x + 3, y + th + 3), f["key"], fill="black")
    W.save(out, quality=82)


# ---------------------------------------------------------------------------------------------------------- ratings
def _rater(name: str) -> str:
    r = re.sub(r"[^a-z0-9_-]", "", (name or "").strip().lower())[:32]
    if not r:
        raise LoomError("rater name must contain letters or digits")
    return r


def load_ratings(rater: str, ratings_dir: Path = RATINGS) -> dict[str, dict]:
    """entry -> the latest rating line for it (lines are append-only; a revisit appends a new line)."""
    p = ratings_dir / f"{_rater(rater)}.jsonl"
    out = {}
    if p.exists():
        for line in p.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line:
                r = json.loads(line); out[r["entry"]] = r
    return out


def record(rater: str, body: dict, man: dict, ratings_dir: Path = RATINGS) -> dict:
    entries = {s["entry"] for s in man["sequence"]}
    e = body.get("entry")
    if e not in entries:
        raise LoomError("unknown entry")
    score = body.get("score")
    if isinstance(score, bool) or not isinstance(score, int) or not 1 <= score <= 5:
        raise LoomError("score must be an integer 1-5")
    tags = [t for t in (body.get("tags") or []) if t in TAGS]
    note = str(body.get("note") or "")[:500]
    rec = {"entry": e, "score": score, "tags": tags, "note": note, "ms": int(body.get("ms") or 0),
           "ts": time.strftime("%Y-%m-%dT%H:%M:%S")}
    ratings_dir.mkdir(parents=True, exist_ok=True)
    with open(ratings_dir / f"{_rater(rater)}.jsonl", "a", encoding="utf-8") as fh:
        fh.write(json.dumps(rec) + "\n")
    return rec


# ---------------------------------------------------------------------------------------------------------- report
def ranks(xs: list[float]) -> list[float]:
    order = sorted(range(len(xs)), key=lambda i: xs[i])
    r = [0.0] * len(xs); i = 0
    while i < len(order):
        j = i
        while j + 1 < len(order) and xs[order[j + 1]] == xs[order[i]]:
            j += 1
        for k in range(i, j + 1):
            r[order[k]] = (i + j) / 2 + 1
        i = j + 1
    return r


def spearman(a: list[float], b: list[float]) -> float | None:
    """Rank correlation with averaged ties. None when it cannot be measured (fewer than 5 pairs, or no spread)."""
    if len(a) != len(b) or len(a) < 5:
        return None
    ra, rb = ranks(a), ranks(b)
    ma, mb = sum(ra) / len(ra), sum(rb) / len(rb)
    va = sum((x - ma) ** 2 for x in ra); vb = sum((x - mb) ** 2 for x in rb)
    if va == 0 or vb == 0:
        return None
    return sum((x - ma) * (y - mb) for x, y in zip(ra, rb)) / math.sqrt(va * vb)


def set_paths(name: str | None) -> dict:
    """The E1 golden set lives at the top of docs/research/golden; any later set (E2 bake-off: `--set e2`) has its own
    folder with the same layout, so its ratings never mix with E1's (2026-10-07)."""
    if not name or name == "golden":
        return {"spec": SPEC, "manifest": MANIFEST, "ratings": RATINGS, "cache": CACHE, "out": GOLD}
    d = GOLD / "sets" / name
    return {"spec": d / "set.json", "manifest": d / "manifest.json", "ratings": d / "ratings", "cache": CACHE.parent / f"golden_{name}", "out": d}


def report(rater: str = "kshitij", judge: str | Path | None = None, manifest_path: Path = MANIFEST,
           ratings_dir: Path = RATINGS, write: bool = True, out_dir: Path = GOLD) -> dict:
    man = read_json(manifest_path)
    if not man:
        raise LoomError("no golden manifest: run `py -m loom golden build` first")
    R = load_ratings(rater, ratings_dir)
    seq = man["sequence"]; fr = {f["fid"]: f for f in man["frames"]}
    rated = [s for s in seq if s["entry"] in R]
    red = []
    if not rated:
        red.append("no ratings yet: a report on zero frames is not a result")
    per_fid: dict[str, list[int]] = {}
    for s in rated:
        per_fid.setdefault(s["fid"], []).append(R[s["entry"]]["score"])
    score = {f: sum(v) / len(v) for f, v in per_fid.items()}
    classes = {}
    for c in sorted({f["class"] for f in man["frames"]}):
        v = sorted(score[f] for f in score if fr[f]["class"] == c)
        classes[c] = {"n": len(v), "of": sum(1 for f in fr.values() if f["class"] == c),
                      "mean": round(sum(v) / len(v), 2) if v else None, "median": v[len(v) // 2] if v else None}
    # the rater's own consistency, on the frames shown twice
    pairs = []
    for s in seq:
        if s["repeat"]:
            first = next(x for x in seq if x["fid"] == s["fid"] and not x["repeat"])
            if s["entry"] in R and first["entry"] in R:
                pairs.append(abs(R[s["entry"]]["score"] - R[first["entry"]]["score"]))
    self_ = {"pairs": len(pairs), "exact": round(sum(1 for d in pairs if d == 0) / len(pairs), 2) if pairs else None,
             "within_1": round(sum(1 for d in pairs if d <= 1) / len(pairs), 2) if pairs else None}
    spread = sorted({round(v, 1) for v in score.values()})
    if rated and len(spread) < 2:
        red.append("every frame got the same score: the set cannot rank anything")
    tags = {}
    for s in rated:
        for t in R[s["entry"]].get("tags") or []:
            tags[t] = tags.get(t, 0) + 1
    out = {"rater": _rater(rater), "rated": len(rated), "of": len(seq), "complete": len(rated) == len(seq),
           "classes": classes, "self_consistency": self_, "tags": dict(sorted(tags.items(), key=lambda kv: -kv[1])),
           "frames": {fr[f]["key"]: round(v, 2) for f, v in sorted(score.items(), key=lambda kv: kv[1])}, "red": red}
    if judge:
        J = read_json(judge) or {}
        J = J.get("scores", J)
        keyed = {fr[f]["key"]: f for f in fr}
        js = {keyed.get(k, k): float(v) for k, v in J.items() if keyed.get(k, k) in score}
        common = sorted(js)
        rho = spearman([score[f] for f in common], [js[f] for f in common])
        out["judge"] = {"file": str(judge), "n": len(common), "rho": None if rho is None else round(rho, 3),
                        "gate": GATE_RHO, "may_gate": rho is not None and rho >= GATE_RHO and len(common) >= 0.8 * len(score)}
        if rho is None:
            red.append(f"judge agreement could not be measured ({len(common)} frames in common)")
    if write and rated:
        write_json(out_dir / f"report_{_rater(rater)}.json", out)
    return out


# ---------------------------------------------------------------------------------------------------------- serve
def serve(port: int = 8830, manifest_path: Path = MANIFEST, cache: Path = CACHE, ratings_dir: Path = RATINGS,
          open_browser: bool = True, ready=None) -> None:
    from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
    man = read_json(manifest_path)
    if not man:
        raise LoomError("no golden manifest: run `py -m loom golden build` first")
    by_entry = {s["entry"]: s for s in man["sequence"]}
    page = (Path(__file__).parent / "studio" / "ui" / "golden.html").read_text(encoding="utf-8")

    class H(BaseHTTPRequestHandler):
        def log_message(self, *a):  # quiet
            pass

        def _send(self, code, body, ctype="application/json"):
            b = body if isinstance(body, bytes) else (body if isinstance(body, str) else json.dumps(body)).encode("utf-8")
            self.send_response(code); self.send_header("Content-Type", ctype); self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)

        def do_GET(self):
            from urllib.parse import urlparse, parse_qs
            u = urlparse(self.path); q = parse_qs(u.query)
            if u.path in ("/", "/index.html"):
                return self._send(200, page, "text/html; charset=utf-8")
            if u.path == "/api/session":
                try:
                    R = load_ratings((q.get("rater") or ["kshitij"])[0], ratings_dir)
                except LoomError as e:
                    return self._send(400, {"error": str(e)})
                # opaque: entries only; never a class, key, source or which ones repeat
                return self._send(200, {"entries": [s["entry"] for s in man["sequence"]],
                                        "done": {e: {"score": r["score"], "tags": r.get("tags", []), "note": r.get("note", "")} for e, r in R.items()},
                                        "tags": TAGS})
            m = re.fullmatch(r"/f/([0-9a-f]{12})\.jpg", u.path)
            if m and m.group(1) in by_entry:
                p = cache / "frames" / f"{by_entry[m.group(1)]['fid']}.jpg"
                if p.exists():
                    return self._send(200, p.read_bytes(), "image/jpeg")
            return self._send(404, {"error": "not found"})

        def do_POST(self):
            if self.path != "/api/rate":
                return self._send(404, {"error": "not found"})
            try:
                n = int(self.headers.get("Content-Length") or 0)
                body = json.loads(self.rfile.read(n) or b"{}")
                rec = record(body.get("rater", ""), body, man, ratings_dir)
            except (LoomError, ValueError) as e:
                return self._send(400, {"error": str(e)})
            return self._send(200, {"ok": True, "saved": rec})

    srv = ThreadingHTTPServer(("127.0.0.1", port), H)
    url = f"http://127.0.0.1:{port}/"
    info(f"golden rating page: {url}  (ratings -> {ratings_dir}; Ctrl+C to stop)")
    if ready:
        ready(srv)
    if open_browser:
        try:
            import webbrowser; webbrowser.open(url)
        except Exception:
            pass
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        srv.server_close()


def export(out: Path = CACHE / "export", manifest_path: Path = MANIFEST, cache: Path = CACHE) -> Path:
    """The frames for a judge (the vision lab's `maturity` pass), by opaque id only: no key, class, source or order.
    Copy the folder to the pod; it holds reference stills, so it never goes anywhere public."""
    man = read_json(manifest_path)
    if not man:
        raise LoomError("no golden manifest: run `py -m loom golden build` first")
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    ids = sorted(f["fid"] for f in man["frames"])
    for fid in ids:
        src = cache / "frames" / f"{fid}.jpg"
        if not src.exists():
            raise LoomError(f"frame {fid} is missing: run `py -m loom golden build`")
        shutil.copyfile(src, out / f"{fid}.jpg")
    write_json(out / "golden_frames.json", {"version": man["version"], "frames": [{"id": i} for i in ids]})
    info(f"golden: {len(ids)} frames exported to {out} (ids only)")
    spec = read_json(SPEC, {}) or {}
    anchors = spec.get("anchors") or []
    if anchors:
        rep = read_json(GOLD / f"report_{_rater(spec.get('anchor_rater', 'kshitij'))}.json", {}) or {}
        byk = {f["key"]: f["fid"] for f in man["frames"]}
        if not rep.get("frames") or any(a not in byk or a not in rep["frames"] for a in anchors):
            raise LoomError("anchors need a complete rating report (golden report) and keys that exist in the set")
        # the judge sees these frames WITH the person's score; it is scored only on the others (held out)
        write_json(out / "anchors.json", {"rater": spec.get("anchor_rater", "kshitij"),
                                           "anchors": [{"id": byk[a], "score": rep["frames"][a]} for a in anchors],
                                           "test": sorted(set(ids) - {byk[a] for a in anchors})})
        info(f"golden: {len(anchors)} anchors with scores, {len(ids) - len(anchors)} held-out test frames")
    return out


def main(action: str, roots: list[str] | None = None, force: bool = False, port: int = 8830, rater: str = "kshitij",
         judge: str | None = None, no_open: bool = False, set_name: str | None = None) -> int:
    P = set_paths(set_name)
    if action == "build":
        ov = dict(r.split("=", 1) for r in (roots or []))
        man = build(ov, force, spec_path=P["spec"], cache=P["cache"], manifest_path=P["manifest"])
        return 3 if man["missing"] else 0
    if action == "export":
        export(manifest_path=P["manifest"], cache=P["cache"], out=P["cache"] / "export"); return 0
    if action == "serve":
        serve(port, manifest_path=P["manifest"], cache=P["cache"], ratings_dir=P["ratings"], open_browser=not no_open); return 0
    if action == "report":
        r = report(rater, judge, manifest_path=P["manifest"], ratings_dir=P["ratings"], out_dir=P["out"])
        info(json.dumps({k: v for k, v in r.items() if k != "frames"}, indent=1))
        if r["frames"]:
            info("lowest: " + ", ".join(f"{k}={v}" for k, v in list(r["frames"].items())[:5]))
            info("highest: " + ", ".join(f"{k}={v}" for k, v in list(r["frames"].items())[-5:]))
        return 1 if r["red"] else 0
    raise LoomError(f"unknown golden action {action}")

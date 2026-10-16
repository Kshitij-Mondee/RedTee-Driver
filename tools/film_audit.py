"""Film audit: measure a rendered lesson the way a viewer suffers it (2026-10-08).

    py tools/film_audit.py <project id> [--frames <dir of 2 fps PNGs>]   # writes projects/<id>/qa/film_audit.json

From the MP4 (sampled at 2 fps, 320x180) and the build's own records (probe.json, timings.json, storyboard):
- **empty**: seconds while the voice speaks in which the frame shows almost nothing (ink coverage under 3 %);
- **static**: runs of 6 s or more while the voice speaks in which nothing on screen changes;
- **lingering**: elements that stay on screen past their beat (no exit, or an exit more than 1.5 s after the beat
  ends) without being kept by the next scene; these are the "stuck" pieces that sit under the next beat. Held means
  the next beat's storyboard `keep` names it (in any case: the runtime takes "Priya" for "priya") or its scene held it
  with ctx.held (the element record's `heldBy`, 2026-10-08); a chain of holders is followed to its last beat (B5);
- **late**: elements that arrive after the beat's speech has ended (they explain nothing);
- **errors**: the check's errors grouped by kind (the decision ledger's kinds) and by beat.
Added 2026-10-07 (bench post-mortem, RC1, RC2, RC7):
- **foreign**: beats whose settled frame carries more than 300 px of other beats' pictures (the probe's foreign
  pixel pass, `qa/probe.json` foreign rows);
- **blurred**: beats whose own words measured blurred (the check's `blurred_beat` measure, `qa/report.json`);
- **preshown**: elements with no entrance at all (revealT none), not scenery, motif or presenter: before element life
  they showed from the start of their station;
- **exit_none**: elements that kept `exit: "none"` (or "held") with no later beat keeping them.
Every number has its denominator printed next to it; a zero denominator is an error (exit 2), never a pass.
"""
from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FPS = 2


def frames_from_mp4(mp4: Path) -> Path:
    d = Path(tempfile.mkdtemp(prefix="filmaudit_"))
    subprocess.run(["ffmpeg", "-v", "error", "-threads", "4", "-i", str(mp4), "-vf", f"fps={FPS},scale=320:180", str(d / "%05d.png")], check=True)
    return d


def frame_stats(d: Path):
    import numpy as np
    from PIL import Image
    files = sorted(d.glob("*.png"))
    cov, diff, prev = [], [], None
    for f in files:
        a = np.asarray(Image.open(f).convert("RGB"), dtype=np.int16)
        flat = a.reshape(-1, 3)
        q = (flat // 16)
        keys = q[:, 0] * 256 + q[:, 1] * 16 + q[:, 2]
        bg = np.bincount(keys).argmax()
        bgc = np.array([bg // 256, (bg // 16) % 16, bg % 16]) * 16 + 8
        dist = np.abs(flat - bgc).sum(axis=1)
        cov.append(float((dist > 60).mean()))
        diff.append(0.0 if prev is None else float(np.abs(a - prev).mean()))
        prev = a
    return cov, diff


def audit(pid: str, frames: Path | None = None) -> dict:
    # a project id, or a project folder (a sandbox copy, a test fixture)
    P = Path(pid) if (Path(pid) / "project.json").exists() else ROOT / "projects" / pid
    pid = P.name
    mp4 = P / "renders" / f"{pid}.mp4"
    tm = json.loads((P / "audio/timings.json").read_text(encoding="utf-8"))
    pr = json.loads((P / "qa/probe.json").read_text(encoding="utf-8"))
    sb = json.loads((P / "plan/storyboard.json").read_text(encoding="utf-8"))
    rep = json.loads((P / "qa/report.json").read_text(encoding="utf-8")) if (P / "qa/report.json").exists() else {"errors": []}
    sys.path.insert(0, str(ROOT))
    from loom.ledger import _kind_of
    beats = tm["beats"]
    scenes = {s["beat"]: s for s in sb["scenes"]}
    frames = frames or frames_from_mp4(mp4)
    cov, diff = frame_stats(frames)
    n = len(cov)
    t_of = lambda i: i / FPS

    def beat_at(t):
        return next((b for b in beats if b["start"] <= t < b["end"]), None)

    def speaking(t):
        b = beat_at(t)
        return bool(b and b["speech_start"] <= t <= b["speech_end"])

    speech_idx = [i for i in range(n) if speaking(t_of(i))]
    empty = [i for i in speech_idx if cov[i] < 0.03]
    # static runs: consecutive samples with almost no change while speaking
    static_runs, run = [], []
    for i in range(1, n):
        if speaking(t_of(i)) and diff[i] < 0.25:
            run.append(i)
        else:
            if len(run) >= 6 * FPS:
                static_runs.append((t_of(run[0]), t_of(run[-1])))
            run = []
    if len(run) >= 6 * FPS:
        static_runs.append((t_of(run[0]), t_of(run[-1])))
    # lingering and late elements, from the runtime's own element records
    bix = {b["id"]: i for i, b in enumerate(beats)}
    lingering, late, never_exit, preshown, exit_none = [], [], [], [], []
    # keep names in lower case: the runtime's ctx.held takes "Priya" for "priya" (one match), so the audit must too (B5)
    kept_names = {s["beat"]: {str(k).lower() for k in s.get("keep") or []} for s in sb["scenes"]}
    elements = pr.get("elements") or []
    held_known = any("heldBy" in e for e in elements)

    def last_holder(e) -> int:
        """the index of the last beat that shows the element: its own, then each next beat that keeps it by name
        or held it in its scene (ctx.held, the record's heldBy), followed as a chain"""
        i, nm, by = bix[e.get("beat")], str(e.get("name")).lower(), set(e.get("heldBy") or [])
        while i + 1 < len(beats) and (nm in kept_names.get(beats[i + 1]["id"], set()) or beats[i + 1]["id"] in by):
            i += 1
        return i

    for e in elements:
        b = e.get("beat")
        if b not in bix:
            continue
        if e.get("revealT") is None and e.get("kind") not in ("scenery", "motif", "presenter"):
            preshown.append({"beat": b, "name": e.get("name"), "kind": e.get("kind")})
        li = last_holder(e)
        nxt = beats[li + 1] if li + 1 < len(beats) else None   # the first beat that does not hold it
        if e.get("exitKind") in ("none", "held") and nxt and li == bix[b]:   # no later beat keeps it at all
            exit_none.append({"beat": b, "name": e.get("name"), "kind": e.get("kind"), "exitKind": e.get("exitKind")})
        bt = beats[li]
        ex = e.get("exitT")
        if ex is None:
            if nxt:
                never_exit.append({"beat": b, "name": e.get("name"), "kind": e.get("kind")})
        elif nxt and ex > bt["end"] + 1.5:
            lingering.append({"beat": b, "name": e.get("name"), "kind": e.get("kind"), "over_s": round(ex - bt["end"], 1),
                              **({"held_to": bt["id"]} if li != bix[b] else {})})
        rv = e.get("revealT")
        if rv is not None and rv > bt["speech_end"] + 0.3:
            late.append({"beat": b, "name": e.get("name"), "after_speech_s": round(rv - bt["speech_end"], 1)})
    errs = Counter()
    by_beat = defaultdict(int)
    import re
    for s in rep.get("errors") or []:
        s = str(s)
        errs[_kind_of(s)] += 1
        bm = re.search(r"\b(b\d{2,3})\b", s)
        if bm:
            by_beat[bm.group(1)] += 1
    # another beat's pixels on screen (the probe's foreign pass) and blurred beats (the check's measure): reported with
    # their denominators; a probe or check made before these measures existed says "not measured"
    fr_rows = pr.get("foreign")
    foreign = ({"beats": sorted(r["beat"] for r in fr_rows if int(r.get("px") or 0) > 300), "of": len(fr_rows),
                "max_px": max([int(r.get("px") or 0) for r in fr_rows] or [0])} if fr_rows is not None else
               {"not_measured": pr.get("foreign_error") or "this probe report has no foreign rows (made before 2026-10-07)"})
    film = (rep.get("stats") or {}).get("film") or {}
    blurred = ({"beats": film.get("blurred_beats") or [], "of": film.get("blur_measured")} if "blur_measured" in film else
               {"not_measured": "this check report has no blur measure (made before 2026-10-07)"})
    kinds = Counter(s.get("kind") for s in sb["scenes"])
    words = sum(len(" ".join(p["text"] for p in b.get("phrases") or []).split()) for b in beats)
    speech_s = sum(b["speech_end"] - b["speech_start"] for b in beats)
    out = {
        "project": pid, "duration_s": round(n / FPS, 1), "beats": len(beats), "kinds": dict(kinds),
        "requested_min": json.loads((P / "project.json").read_text(encoding="utf-8"))["request"].get("length_min"),
        "wpm": round(words / (speech_s / 60), 1) if speech_s else None,
        "speech_samples": len(speech_idx),
        "empty_while_speaking": {"samples": len(empty), "of": len(speech_idx), "share": round(len(empty) / max(1, len(speech_idx)), 3),
                                 "beats": sorted({beat_at(t_of(i))["id"] for i in empty})},
        "static_runs_6s": [{"from": a, "to": b, "beat": beat_at(a)["id"]} for a, b in static_runs],
        "static_share": round(sum(b - a for a, b in static_runs) / max(1, speech_s), 3),
        "lingering": lingering, "never_exit": never_exit, "late": late,
        # the runtime records ctx.held on each element since 2026-10-08; an older probe knows only the storyboard keep
        "held_measured": held_known or "not measured: this probe has no heldBy records (made before 2026-10-08); ctx.held counts as lingering",
        "preshown": preshown, "exit_none": exit_none, "foreign": foreign, "blurred": blurred,
        "elements": len(pr.get("elements") or []),
        "elements_with_life": sum(1 for e in pr.get("elements") or [] if e.get("lifeT")),
        "check_errors": dict(errs), "errors_by_beat": dict(sorted(by_beat.items())),
        "mean_coverage": round(sum(cov) / max(1, n), 3),
    }
    (P / "qa" / "film_audit.json").write_text(json.dumps(out, indent=1), encoding="utf-8")
    zero = [k for k, v in (("frames", n), ("speech samples", len(speech_idx)), ("elements", out["elements"]), ("beats", len(beats))) if not v]
    if zero:
        out["zero_denominators"] = zero
    return out


if __name__ == "__main__":
    pid = sys.argv[1]
    fr = Path(sys.argv[sys.argv.index("--frames") + 1]) if "--frames" in sys.argv else None
    r = audit(pid, fr)
    print(json.dumps({k: (v if not isinstance(v, list) else len(v)) for k, v in r.items()}, indent=1))
    if r.get("zero_denominators"):
        print(f"zero denominators: {', '.join(r['zero_denominators'])}: the audit measured nothing there (Rule 0)")
        raise SystemExit(2)

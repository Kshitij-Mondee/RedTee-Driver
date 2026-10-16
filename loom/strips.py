"""Film strips (D-100): look at the FILM, not three stills per beat.

    py -m loom strips <id>                 # from renders/<id>.mp4 if it exists, else from the composed build
    py -m loom strips <id> --source build  # from the build (Chrome snapshots; resumable, --budget N frames per call)
    py -m loom strips <id> --source mp4 --range 0-215   # extract part of the MP4 (sandbox calls are short)

Every beat becomes a row of 8 frames across its whole length, and every join a row of 8 frames across its window
plus 0.6 s each side, labelled with the beat, its kind, join, station and narration. Holds, late arrivals, residue,
double exposures and seams are visible here and invisible on a 3-frame contact sheet (L-172).

Output: `qa/strips/rows_NN.jpg` and `qa/strips/index.json` (rows, times, files), which a person, a review agent or
a vision critic reads. Nothing here is lesson-specific.
"""
from __future__ import annotations

import json
import shutil
from pathlib import Path

from .util import LoomError, info, read_json, run, which, write_json

N = 8           # frames per row
TW, TH = 300, 169
FPS = 4         # MP4 extraction rate
PER_SHEET = 6   # rows per sheet


def pick(spec: str | None, ids: list[str]) -> set[str] | None:
    """'b17-b21' or 'b03,b07' (or both, comma-separated) -> the beat ids it names; None means all."""
    if not spec:
        return None
    out = set()
    for part in spec.split(","):
        part = part.strip()
        if "-" in part:
            a, b = part.split("-", 1)
            if a in ids and b in ids:
                out.update(ids[ids.index(a):ids.index(b) + 1])
                continue
        if part in ids:
            out.add(part)
    if not out:
        raise LoomError(f"--beats {spec!r} names no beat of this lesson")
    return out


def plan(project, beats: str | None = None) -> list[dict]:
    m = read_json(project.path("build/manifest.json"))
    sb = {s["beat"]: s for s in (read_json(project.path("plan/storyboard.json"), {}) or {}).get("scenes", [])}
    sc = {b["id"]: b for b in (read_json(project.path("plan/script.json"), {}) or {}).get("beats", [])}
    scn = {s["beat"]: s for s in m.get("scenes", [])}
    rows = []
    keep = pick(beats, [b["id"] for b in m["beats"]])
    for b in m["beats"]:
        bid = b["id"]; s = sb.get(bid, {}); j = s.get("join_in") or {}
        if keep is not None and bid not in keep:
            continue
        a, e = float(b["start"]), float(b["end"])
        span = max(0.0, e - a - 0.5)
        times = [round(a + 0.25 + span * k / (N - 1), 2) for k in range(N)]
        kind = s.get("kind") or scn.get(bid, {}).get("kind")
        tpl = s.get("template") or s.get("blueprint")
        label = (f"{bid} [{kind}{':' + tpl if tpl else ''}] join={j.get('type')}"
                 f"{'/' + j['meaning'] if j.get('meaning') else ''} station={s.get('station') or scn.get(bid, {}).get('station')}  {a:.1f}-{e:.1f}s")
        rows.append({"kind": "beat", "beat": bid, "label": label, "narration": " ".join(sc.get(bid, {}).get("narration", []))[:230], "times": times})
        jw = scn.get(bid, {}).get("join_window") or [0, 0]
        if jw[1] - jw[0] >= 0.3:
            jt = [round(jw[0] - 0.6 + (jw[1] - jw[0] + 1.2) * k / (N - 1), 2) for k in range(N)]
            rows.append({"kind": "join", "beat": bid, "label": f"   JOIN into {bid} ({j.get('type')}) {jw[0]:.2f}-{jw[1]:.2f}s", "narration": "", "times": jt})
    return rows


def _mp4_frames(project, rng: tuple[float, float] | None) -> callable:
    mp4 = project.path(f"renders/{project.id}.mp4")
    if not mp4.exists():
        raise LoomError(f"no MP4 at {mp4}: render first, or use --source build")
    ff = which("ffmpeg")
    if not ff:
        raise LoomError("ffmpeg not found")
    d = project.path("qa/strips/frames")
    stamp = d / ".source"
    key = f"{mp4.stat().st_size}:{int(mp4.stat().st_mtime)}"
    if not stamp.exists() or stamp.read_text() != key:
        shutil.rmtree(d, ignore_errors=True)
        d.mkdir(parents=True, exist_ok=True)
        stamp.write_text(key)
    dur = float(read_json(project.path("build/manifest.json"))["duration"])
    a, e = rng or (0.0, dur)
    # frames are named by their index at FPS from t=0, so partial extractions combine into one set
    i0 = int(round(a * FPS))
    if not (d / f"f_{i0:06d}.jpg").exists() or not (d / f"f_{max(i0, int(e * FPS) - 1):06d}.jpg").exists():
        run([ff, "-v", "error", "-y", "-ss", f"{a:.3f}", "-t", f"{e - a:.3f}", "-i", str(mp4), "-vf", f"fps={FPS},scale=480:-1",
             "-q:v", "4", "-start_number", str(i0), str(d / "f_%06d.jpg")], timeout=3600)

    def frame(t: float) -> Path | None:
        i = int(round(t * FPS))
        for k in (i, i - 1, i + 1):
            f = d / f"f_{k:06d}.jpg"
            if f.exists():
                return f
        return None
    return frame


def _build_frames(project, times: list[float], budget: int | None) -> callable:
    from .qa import _snap
    got = _snap(project, sorted(set(times)), chunk_size=12, budget=budget)
    got = {round(float(k), 2): v for k, v in got.items()}

    def frame(t: float) -> Path | None:
        return got.get(round(t, 2))
    return frame


def sheets(project, source: str = "auto", rng: tuple[float, float] | None = None, budget: int | None = None, beats: str | None = None) -> dict:
    from PIL import Image, ImageDraw, ImageFont
    rows = plan(project, beats)
    if source == "auto":
        source = "mp4" if project.path(f"renders/{project.id}.mp4").exists() else "build"
    frame = _mp4_frames(project, rng) if source == "mp4" else _build_frames(project, [t for r in rows for t in r["times"]], budget)
    try:
        F = ImageFont.truetype("DejaVuSans.ttf", 16); FB = ImageFont.truetype("DejaVuSans-Bold.ttf", 18)
    except Exception:
        try:
            F = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
            FB = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 18)
        except Exception:
            F = FB = ImageFont.load_default()
    out = project.path("qa/strips"); out.mkdir(parents=True, exist_ok=True)
    for f in out.glob("rows_*.jpg"):
        f.unlink()
    RH = TH + 56
    files, missing = [], 0
    for si in range(0, len(rows), PER_SHEET):
        chunk = rows[si:si + PER_SHEET]
        S = Image.new("RGB", (N * TW + 8 * (N + 1), len(chunk) * RH + 8), (16, 16, 16)); d = ImageDraw.Draw(S)
        for r, row in enumerate(chunk):
            y = 8 + r * RH
            d.text((8, y), row["label"], fill=(120, 200, 255) if row["kind"] == "join" else (255, 210, 80), font=FB)
            d.text((8, y + 22), row["narration"], fill=(200, 200, 200), font=F)
            for k, t in enumerate(row["times"]):
                x = 8 + k * (TW + 8)
                p = frame(t)
                if p and Path(p).exists():
                    S.paste(Image.open(p).convert("RGB").resize((TW, TH)), (x, y + 46))
                else:
                    missing += 1
                    d.rectangle([x, y + 46, x + TW, y + 46 + TH], outline=(90, 30, 30))
                d.text((x + 4, y + 48), f"{t:.1f}", fill=(255, 255, 0), font=F)
            row["sheet"] = f"rows_{si // PER_SHEET + 1:02d}.jpg"
        fn = out / f"rows_{si // PER_SHEET + 1:02d}.jpg"
        S.save(fn, quality=82); files.append(str(fn))
    idx = {"source": source, "rows": rows, "sheets": files, "missing_frames": missing,
           "frames_total": sum(len(r["times"]) for r in rows)}
    write_json(out / "index.json", idx)
    info(f"strips: {len(rows)} rows on {len(files)} sheets from the {source}" + (f"; {missing} frames missing (re-run to resume)" if missing else ""))
    return idx


def preview(project, beats: str, fps: int = 12, budget: int | None = None) -> dict:
    """A watchable preview MP4 of some beats, from the build, with the lesson's own mix: watch a segment at full
    speed without rendering the lesson (D-100). Frames are snapshots, so the cache makes it resumable: re-run
    until `missing` is 0 (a sandbox call is short). Output: qa/preview/<beats>.mp4."""
    m = read_json(project.path("build/manifest.json"))
    ids = [b["id"] for b in m["beats"]]
    keep = pick(beats, ids)
    sel = [b for b in m["beats"] if b["id"] in keep]
    a, e = float(sel[0]["start"]), float(sel[-1]["end"])
    times = sorted({round(a + k / fps, 2) for k in range(int((e - a) * fps))})   # the snapshot cache keys on 2 decimals
    from .qa import _snap
    got = {round(float(k), 2): v for k, v in _snap(project, times, chunk_size=24, budget=budget).items()}
    missing = [t for t in times if t not in got]
    out = project.path("qa/preview"); out.mkdir(parents=True, exist_ok=True)
    name = beats.replace(",", "_")
    res = {"beats": beats, "start": a, "end": e, "frames": len(times), "missing": len(missing), "mp4": None}
    if missing:
        info(f"preview: {len(times) - len(missing)} of {len(times)} frames; re-run to continue")
        return res
    ff = which("ffmpeg")
    if not ff:
        raise LoomError("ffmpeg not found")
    seq = out / f".{name}_frames"
    shutil.rmtree(seq, ignore_errors=True); seq.mkdir(parents=True)
    for i, t in enumerate(times):
        shutil.copy2(got[t], seq / f"f_{i:06d}.png")
    mix = project.path("audio/mix.wav")
    mp4 = out / f"{name}.mp4"
    cmd = [ff, "-v", "error", "-y", "-framerate", str(fps), "-i", str(seq / "f_%06d.png")]
    if mix.exists():
        cmd += ["-ss", f"{a:.3f}", "-t", f"{e - a:.3f}", "-i", str(mix), "-c:a", "aac", "-b:a", "128k"]
    cmd += ["-vf", "scale=1280:-2", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "22", "-shortest", str(mp4)]
    run(cmd, timeout=600)
    shutil.rmtree(seq, ignore_errors=True)
    res["mp4"] = str(mp4)
    info(f"preview: {mp4} ({e - a:.1f} s at {fps} fps, from the build: a preview, not the render)")
    return res

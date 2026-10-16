"""Render: HyperFrames -> MP4, plus captions (SRT, VTT) and a transcript."""
from __future__ import annotations

import os
import shutil
from pathlib import Path

from .util import ENGINE_ROOT, LoomError, info, read_json, run, which


def hyperframes_cmd() -> list[str]:
    bin_ = ENGINE_ROOT / "node_modules" / "hyperframes" / "bin" / "hyperframes.mjs"
    if not bin_.exists():
        raise LoomError("HyperFrames is not installed: run `npm install` in the engine folder")
    node = which("node")
    if not node:
        raise LoomError("Node.js >= 22 is required (node not found)")
    return [node, str(bin_)]


def hf_env() -> dict:
    env = {}
    # an explicit browser (e.g. a sandbox Chromium) can be pinned; otherwise HyperFrames manages its own
    for k in ("HYPERFRAMES_BROWSER_PATH",):
        if os.environ.get(k):
            env[k] = os.environ[k]
    return env


_BROWSER: list = []


def render_webgl() -> dict:
    """{"software": {...}, "probe": {...}}: whether the render browser has WebGL in HyperFrames' software capture and in
    the probe's launch (tools/node/webgl_check.mjs). Without it every fx layer, Three.js and the brush skip or throw."""
    import json as _json
    env = hf_env()
    if not env.get("HYPERFRAMES_BROWSER_PATH"):
        bp = browser_path()
        if bp:
            env["HYPERFRAMES_BROWSER_PATH"] = bp
    r = run([which("node"), str(ENGINE_ROOT / "tools/node/webgl_check.mjs")], env=env, check=False, timeout=180)
    try:
        return _json.loads((r.stdout or "").strip().splitlines()[-1])
    except Exception:  # noqa: BLE001
        return {"software": {"webgl": False, "error": (r.stderr or "")[-300:]}, "probe": {"webgl": False}}


def browser_path() -> str | None:
    """A Chrome the engine can drive: a pinned HYPERFRAMES_BROWSER_PATH, else the one HyperFrames manages
    (`hyperframes browser path`), the way `loom doctor` and the test runner find it. A helper that read only the env
    var skipped every browser test on a PC that could render (L-127). None when there is none."""
    if os.environ.get("HYPERFRAMES_BROWSER_PATH"):
        return os.environ["HYPERFRAMES_BROWSER_PATH"]
    if not _BROWSER:
        found = None
        try:
            import subprocess
            if (ENGINE_ROOT / "node_modules" / "hyperframes").exists() and which("node"):
                r = subprocess.run(hyperframes_cmd() + ["browser", "path"], capture_output=True, text=True,
                                   env=dict(os.environ, **hf_env()), timeout=60)
                lines = [ln.strip() for ln in r.stdout.splitlines() if ln.strip()]
                if r.returncode == 0 and lines and Path(lines[-1]).exists():
                    found = lines[-1]
        except Exception:   # noqa: BLE001  (no browser is an answer, not a crash)
            found = None
        _BROWSER.append(found)
    return _BROWSER[0]


def _ts(t: float, sep: str) -> str:
    t = max(0.0, t)
    h = int(t // 3600); m = int((t % 3600) // 60); s = t % 60
    return f"{h:02d}:{m:02d}:{int(s):02d}{sep}{int(round((s - int(s)) * 1000)):03d}"


def export_captions(project) -> dict:
    mf = read_json(project.path("build/manifest.json"))
    groups = mf["captions"]["groups"]
    srt, vtt = [], ["WEBVTT", ""]
    for i, g in enumerate(groups, 1):
        text = " ".join(w["w"] for w in g["words"])
        srt += [str(i), f"{_ts(g['t0'], ',')} --> {_ts(g['t1'], ',')}", text, ""]
        vtt += [f"{_ts(g['t0'], '.')} --> {_ts(g['t1'], '.')}", text, ""]
    out = project.path("renders")
    out.mkdir(exist_ok=True)
    (out / f"{project.id}.srt").write_text("\n".join(srt), encoding="utf-8")
    (out / f"{project.id}.vtt").write_text("\n".join(vtt), encoding="utf-8")
    script = read_json(project.path("plan/script.json"))
    lines = [f"# {script['title']}", ""]
    for sec in script["sections"]:
        lines.append(f"## {sec['title']}")
        for b in script["beats"]:
            if b["section"] == sec["id"]:
                lines.append(" ".join(b["narration"]))
        lines.append("")
    (out / f"{project.id}.transcript.md").write_text("\n".join(lines), encoding="utf-8")
    return {"srt": str(out / f"{project.id}.srt"), "vtt": str(out / f"{project.id}.vtt")}


def render(project, quality: str = "high", workers: str | None = None, timeout: int | None = None, bake_poster: bool = False) -> Path:
    build = project.path("build")
    if not (build / "index.html").exists():
        raise LoomError("nothing to render: run compose first")
    drafts = (read_json(build / "manifest.json", {}) or {}).get("draft_media") or []
    if drafts:
        # a draft Manim clip (6 fps, half size) exists for fast previews only; it must never be encoded (D-39)
        raise LoomError(f"the build holds draft Manim clips ({', '.join(drafts)}): run `py -m loom run {project.id} render` "
                        f"(it re-makes them at full quality first) or `py -m loom run {project.id} compose`")
    out = project.path(f"renders/{project.id}.mp4")
    out.parent.mkdir(exist_ok=True)
    stamp_segments(build)
    cmd = hyperframes_cmd() + ["render", "--quality", quality, "--output", str(out), "--resume", "--keep-segments"]
    if workers:
        cmd += ["--workers", workers]
    env = hf_env(); env["HF_SEGMENTED_CAPTURE"] = "true"; env.setdefault("HF_SEGMENT_FRAMES", os.environ.get("HF_SEGMENT_FRAMES", "1800"))
    if os.environ.get("LOOM_SAFE_CAPTURE") == "1":
        env["PRODUCER_EXPERIMENTAL_FAST_CAPTURE"] = "false"
    info("rendering (resumable: re-run the same command if it is interrupted) ...")
    r = run(cmd, cwd=build, env=env, timeout=timeout, check=False)
    tail = (r.stdout or "")[-1200:] + (r.stderr or "")[-1200:]
    if (r.returncode != 0 or not out.exists()) and "drawElement capture failed" in tail and env.get("PRODUCER_EXPERIMENTAL_FAST_CAPTURE") != "false":
        # HyperFrames' fast capture (drawElement) refuses any JPEG frame under 20 KB as a broken capture. A lesson
        # with a flat light field (a fade join at its fullest, mfa-story at frame 236) has true frames that small.
        # Re-render once with screenshot capture: slower, never refuses a real frame (2026-10-06, L-234).
        info("[warn] fast capture refused a near-uniform frame; re-rendering with screenshot capture ...")
        env["PRODUCER_EXPERIMENTAL_FAST_CAPTURE"] = "false"
        r = run(cmd, cwd=build, env=env, timeout=timeout, check=False)
        tail = (r.stdout or "")[-1200:] + (r.stderr or "")[-1200:]
    if (r.returncode != 0 or not out.exists()) and "Navigation timeout" in tail:
        # a capture browser started for a segment and its page did not load within HyperFrames' 60 s (S0, 2026-10-09:
        # twice in Shuttle's P11, at segment 1 of 5 and at segment 4 of 5; the same segment loaded on the next try, L-364).
        # Re-run once: the render resumes from the segments it kept, with a longer page-load allowance
        info("[warn] a capture browser's page did not load in time; resuming the render once with a longer allowance ...")
        env["PRODUCER_PAGE_NAVIGATION_TIMEOUT_MS"] = os.environ.get("PRODUCER_PAGE_NAVIGATION_TIMEOUT_MS", "180000")
        r = run(cmd, cwd=build, env=env, timeout=timeout, check=False)
        tail = (r.stdout or "")[-1200:] + (r.stderr or "")[-1200:]
    if r.returncode != 0 or not out.exists():
        raise LoomError("render failed:\n" + tail)
    export_captions(project)
    info(f"rendered -> {out}")
    v = verify_render(project, out)
    if v["mismatches"]:
        info("[warn] render differs from the checked preview at: " + ", ".join(f"{m['t']:.2f}s ({m['diff']})" for m in v["mismatches"]))
    share = verify_failure(v)
    if share:
        raise LoomError(share + f" (see {project.path('qa/render_verify.json')}; the MP4 at {out} is not the checked build)")
    poster(project, out, bake=bool(bake_poster))
    return out


MISMATCH_MAX = 0.10


def verify_failure(v: dict) -> str | None:
    """A render whose frames disagree with the checked preview at more than MISMATCH_MAX of the compared moments is
    not the build that was checked (the claude-balanced MP4 was two builds spliced and only warned). Comparing nothing
    is not a pass either."""
    n = int(v.get("checked") or 0)
    if not n:
        return "render verification compared 0 frames (" + str(v.get("note") or "no preview frames") + "): a zero is not a pass"
    k = len(v.get("mismatches") or [])
    if k / n > MISMATCH_MAX:
        return f"render verification: {k} of {n} sampled frames ({k / n:.0%}) differ from the checked build (at most {MISMATCH_MAX:.0%})"
    return None


def stamp_segments(build: Path) -> str:
    """HyperFrames resumes from segments keyed by its own plan (the page), not by Loom's runtime: a render resumed
    after a runtime fix spliced segments of the old build onto the new one (bench claude-balanced, 0 to 180 s from
    before the L-246 guard). The build hash (qa.build_hash: page, runtime, templates, scenes, media, audio) is stamped
    in the segment folder; segments made from another build are deleted before the render starts."""
    from .qa import build_hash
    seg = build / "renders" / ".hf-segments"
    bh = build_hash(build)
    stamp = seg / "loom_build_hash.txt"
    if seg.exists():
        old = stamp.read_text(encoding="utf-8").strip() if stamp.exists() else None
        if old != bh:
            info(f"render: the build changed since its saved segments were made ({old or 'unstamped'} -> {bh}); starting from frame 0")
            shutil.rmtree(seg, ignore_errors=True)
    seg.mkdir(parents=True, exist_ok=True)
    stamp.write_text(bh, encoding="utf-8")
    return bh


def poster_time(project) -> float:
    """The poster is the strongest SETTLED frame (BRAG): the storyboard may name it ({"poster": {"beat": "b05"}}
    or {"poster": {"t": 12.3}}); otherwise the settled moment of the densest beat in the first half."""
    mf = read_json(project.path("build/manifest.json"))
    sb = read_json(project.path("plan/storyboard.json"), {}) or {}
    pz = sb.get("poster") or mf.get("poster") or {}
    beats = mf["beats"]
    if pz.get("t") is not None:
        return float(pz["t"])
    def settled(b):
        return round(max(b["speech_start"], b["speech_end"] - 0.15), 2)
    if pz.get("beat"):
        b = next((x for x in beats if x["id"] == pz["beat"]), None)
        if b:
            return settled(b)
    pr = read_json(project.path("qa/probe.json"), {}) or {}
    count = {}
    for e in pr.get("elements") or []:
        count[e["beat"]] = count.get(e["beat"], 0) + 1
    half = [b for b in beats if b["start"] < mf["duration"] / 2] or beats
    best = max(half, key=lambda b: (count.get(b["id"], 0), -b["start"]))
    return settled(best)


def poster(project, mp4: Path, bake: bool = False) -> Path | None:
    """Write renders/<id>.jpg (the LMS/player thumbnail). With bake=True, also make it frame 0 of the MP4 so
    every platform's idle thumbnail shows it (only frame 0 changes: same duration, audio copied)."""
    ff = which("ffmpeg")
    if not ff or not mp4.exists():
        return None
    t = poster_time(project)
    jpg = mp4.with_suffix(".jpg")
    run([ff, "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", str(mp4), "-frames:v", "1", "-q:v", "2", str(jpg)], check=False)
    if bake and jpg.exists():
        tmp = mp4.with_name(mp4.stem + ".poster.mp4")
        r = run([ff, "-v", "error", "-y", "-i", str(mp4), "-i", str(jpg), "-filter_complex", "[0:v][1:v]overlay=0:0:enable='eq(n,0)'[v]",
                 "-map", "[v]", "-map", "0:a?", "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p",
                 "-c:a", "copy", "-movflags", "+faststart", str(tmp)], check=False)
        if r.returncode == 0 and tmp.exists():
            tmp.replace(mp4)
    info(f"poster ({t:.2f}s) -> {jpg}" + (" (baked as frame 0)" if bake else ""))
    return jpg


def verify_render(project, mp4, frames_slice: tuple | None = None) -> dict:
    """Test the DELIVERY, not just the preview: sample the encoded MP4 at the times the check stage
    photographed, and compare. A layer that previews but does not render (it happened: videos
    created at runtime were invisible to the encoder) shows up here as a large difference."""
    from PIL import Image, ImageChops, ImageStat
    import tempfile
    from .util import write_json
    frames = sorted(project.path("qa/frames").glob("*.png")) if project.path("qa/frames").exists() else []
    out_json = project.path("qa/render_verify.json")
    if frames_slice:
        # a slice (`py -m loom verify <id> --from A --to B`) lets a slow machine verify in parts; each part
        # writes its own report so parts never overwrite each other
        a, b = frames_slice
        frames = frames[a:b]
        out_json = project.path(f"qa/render_verify_{a or 0}_{b if b is not None else 'end'}.json")
    ff = which("ffmpeg")
    res = {"checked": 0, "mismatches": [], "of": len(frames)}
    if not mp4.exists():
        res["note"] = f"no render at {mp4}"
        write_json(out_json, res)
        return res
    if not frames or not ff:
        res["note"] = "no preview frames to compare (run check first)"
        write_json(out_json, res)
        return res
    import time as _time
    from concurrent.futures import ThreadPoolExecutor
    tmp = Path(tempfile.mkdtemp())

    def one(f):
        """(t, worst tile difference or None when no frame came out, seconds). Each frame is its own ffmpeg calls."""
        t0 = _time.monotonic()
        t = float(f.stem)
        dst = tmp / f"{t:.2f}.png"
        run([ff, "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", str(mp4), "-frames:v", "1", str(dst)], check=False)
        if not dst.exists():
            return t, None, _time.monotonic() - t0
        a = Image.open(f).convert("L").resize((480, 270)); b = Image.open(dst).convert("L").resize((480, 270))
        diff = ImageChops.difference(a, b)
        # worst 60x54 tile, not the frame mean: a missing thin layer (a curve, a label) is local
        worst = max(ImageStat.Stat(diff.crop((x, y, x + 60, y + 54))).mean[0] for x in range(0, 480, 60) for y in range(0, 270, 54))
        if worst > 12:
            # an encoded frame sits on a 1/fps grid and a seek can land one to three frames either side of
            # the preview's exact time; during a fast move that alone reads as a big diff. A missing layer
            # differs at EVERY nearby offset, so only a diff that no nearby frame explains is a mismatch.
            for df in (-1, 1, -2, 2, -3, 3):
                alt = tmp / f"{t:.2f}_{df}.png"
                run([ff, "-v", "error", "-y", "-ss", f"{max(0.0, t + df / 30):.3f}", "-i", str(mp4), "-frames:v", "1", str(alt)], check=False)
                if not alt.exists():
                    continue
                c = Image.open(alt).convert("L").resize((480, 270))
                d2 = ImageChops.difference(a, c)
                worst = min(worst, max(ImageStat.Stat(d2.crop((x, y, x + 60, y + 54))).mean[0] for x in range(0, 480, 60) for y in range(0, 270, 54)))
                if worst <= 12:
                    break
        return t, worst, _time.monotonic() - t0

    # the frames are independent: four at a time, results in frame order (feedback-shuttle-v3's 55 comparisons took
    # 38 minutes one by one, L-375; each step's time is in the report so a slow one shows which)
    started = _time.monotonic()
    with ThreadPoolExecutor(max_workers=VERIFY_WORKERS) as pool:
        rows = list(pool.map(one, frames))
    for t, worst, _s in rows:
        if worst is None:
            continue
        res["checked"] += 1
        if worst > 12:
            res["mismatches"].append({"t": t, "diff": round(worst, 1)})
    res["seconds"] = round(_time.monotonic() - started, 1)
    res["slowest"] = [{"t": t, "s": round(s, 1)} for t, _w, s in sorted(rows, key=lambda r: -r[2])[:3]]
    shutil.rmtree(tmp, ignore_errors=True)
    write_json(out_json, res)
    return res


VERIFY_WORKERS = 4

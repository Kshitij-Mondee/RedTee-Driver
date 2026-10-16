"""What a lesson's plan will take to make (D-65, reduced by D-67).

    py -m loom cost <id>      # scene kinds, model tasks, clip seconds per renderer, shader layer, voice,
                              # and a render-time ESTIMATE from rates measured in this engine

No tiers and no budgets: the requester decided that what is costly and what is cheap will be settled with
time (D-67). This only reports the drivers, so that decision can later be made from numbers.
Numbers: the rates below were measured in the engine's sandbox (CPU only) and say where they came from;
everything computed from them is an ESTIMATE and the report says so (rule 0).
"""
from __future__ import annotations

import re

from .util import ENGINE_ROOT, read_json

# measured, with where: seconds of render per second of finished video (CPU sandbox, 2026-09-30)
RATES = {
    "page": (1.0, "blameless-postmortem: 303.8 s render for a 5:04 lesson, before the shader layer (RUN_LOG)"),
    "skia": (21.0, 90.0, "reel R-14: 0.7 s/frame (cinematic_25d) to 3 s/frame (hero_orb with motion blur) at 30 fps"),
    "three": (8.0, "reel R-14: 24 s for a 3 s device clip, render plus encode"),
}
PAID_VOICES = ("openai", "elevenlabs")
RICH = [(re.compile(r"ctx\.character\("), "characters"), (re.compile(r"ctx\.depth\("), "depth stage"),
        (re.compile(r"ctx\.iso\("), "iso kit"), (re.compile(r"ctx\.lottie\("), "lottie"), (re.compile(r"ctx\.fxMoment\("), "fx moment")]


def estimate(project) -> dict:
    sb = read_json(project.path("plan/storyboard.json"), {}) or {}
    timings = read_json(project.path("audio/timings.json"), None)
    dur_by = {}
    if timings:
        for b in timings.get("beats", []):
            dur_by[b["id"]] = b["speech_end"] - b["speech_start"] + (b.get("pause_after") or 0) + 0.6
    total_s = (timings or {}).get("duration") or float((project.request or {}).get("length_min", 4)) * 60
    scenes = sb.get("scenes", [])
    counts, clip_s, rich = {}, {"manim": 0.0, "skia": 0.0, "three": 0.0}, {}
    for sc in scenes:
        k = sc.get("kind"); counts[k] = counts.get(k, 0) + 1
        if k in clip_s:
            clip_s[k] += dur_by.get(sc["beat"], 8.0)
        f = project.path(f"scenes/{sc['beat']}.js")
        if f.exists():
            src = f.read_text(encoding="utf-8")
            for rx, name in RICH:
                if rx.search(src):
                    rich[name] = rich.get(name, 0) + 1
    style = read_json(ENGINE_ROOT / "packs/styles" / f"{sb.get('style', 'flat-cosmos')}.json", {}) or {}
    fx = dict(style.get("fx") or {}, **(sb.get("fx") or {}))
    fx_on = bool(fx) and fx.get("enabled", True) is not False
    voice = ((project.request or {}).get("voice") or {}).get("provider", "kokoro")
    build_tasks = 1 + sum(counts.get(k, 0) for k in ("bespoke", "manim", "skia", "three")) + 1   # persona + scenes + review
    lo = total_s * RATES["page"][0] + clip_s["skia"] * RATES["skia"][0] + clip_s["three"] * RATES["three"][0]
    hi = total_s * RATES["page"][0] * (1.6 if fx_on else 1.0) + clip_s["skia"] * RATES["skia"][1] + clip_s["three"] * RATES["three"][0]
    rep = {
        "scenes": counts, "rich_features": rich,
        "model_tasks": {"plan": 5 + (1 if project.mode == "topic" else 0), "build": build_tasks},
        "clip_seconds": {k: round(v, 1) for k, v in clip_s.items() if v},
        "fx_layer": fx_on, "voice": voice + (" (paid)" if voice in PAID_VOICES else " (local, free)"),
        "render_minutes_estimate": [round(lo / 60, 1), round(hi / 60, 1)],
        "estimate_basis": "ESTIMATE from measured sandbox rates: " + "; ".join(v[-1] for v in RATES.values())
                          + ("; the shader layer's slowdown (L-86) is not measured, the upper bound assumes 1.6x" if fx_on else "")
                          + ("; Manim clip time is not included (not measured here; clips are reused from the store)" if clip_s["manim"] else ""),
    }
    return rep

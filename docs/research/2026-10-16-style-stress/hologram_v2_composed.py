"""The composed-lesson proof of a WebGL hologram hero (D-188, 2026-10-16).

Builds a throwaway lesson (a temp folder, never an existing project) with one hologram beat whose storyboard scene
declares a "hero3d" rack, composes it (the hero through the clip store), renders it with HyperFrames, and pulls frames
from the MP4 into out_hologram_v2/composed/. Run twice to see the cache: the second compose renders no hero.

    py docs/research/2026-10-16-style-stress/hologram_v2_composed.py [--keep]
"""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
import time
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))
from loom.util import which, write_json  # noqa: E402

HERE = Path(__file__).resolve().parent
OUT = HERE / "out_hologram_v2" / "composed"

SCENE = """// a hologram beat with a WebGL hero behind its HUD (composed-lesson proof)
Loom.scene("b01", {
  build(ctx) {
    const H = ctx.engine.hud(ctx, { name: "hud" });
    H.stage("stage", { focus: [1000, 600], lift: 0.7, at: ctx.start });
    const R = H.hero3d("rack", { at: ctx.start + 0.2 });
    H.title("head", { x: 120, y: 92, w: 760, h: 120, kicker: "Data hall B, row 4", caps: false, text: "What one rack holds", role: "lead", at: ctx.start + 0.3 });
    H.reading("uplink", { x: 1500, y: 230, w: 330, label: "Uplink, top-of-rack switch", value: 38.4, decimals: 1, unit: "Gb/s",
      micro: ["2 links of 25 Gb/s"], to: R.anchor("switch", ctx.start + 5.0, [1, 0.5]), at: ctx.start + 5.0 });
  },
});
"""
def hero_spec(dur: float, rect=(500, 60, 1000, 880)) -> dict:
    return {"rack": {"rect": list(rect), "dur": dur, "fps": 30, "params": {
        "model": "server_rack", "opts": {"units": 8, "empty": [1, 5], "load": 1}, "yaw": -0.95, "turn": [0.4, min(4.4, dur - 1), 0.5],
        "build": [0.3, min(2.4, dur / 3)], "elevation": 14, "zoom": 0.8,
        "states": [{"key": "door", "from": 0, "to": 1, "at": min(4.4, dur * 0.55), "dur": 1.0}], "hot": [{"part": "switch", "t0": min(5.0, dur * 0.6), "t1": dur}]}}}


class TempLesson:
    """a throwaway lesson folder with the files compose and render read"""
    def __init__(self, dur: float = 8.0, hero: dict | None = None, scene: str = SCENE, pages: dict | None = None):
        self.root = Path(tempfile.mkdtemp(prefix="loom_herolesson_"))
        self.id = "hero-lesson"
        self.request = {"style": "hologram", "captions": False}
        self.cfg = {}
        words, t, wl = [], 0.6, "Say this rack is the one we watch".split()
        for w in wl:
            words.append({"w": w, "s": round(t, 3), "e": round(t + 0.4, 3)}); t += 0.45
        write_json(self.path("audio/timings.json"), {"duration": dur, "beats": [{"id": "b01", "section": "s1", "start": 0.0, "end": dur,
                   "speech_start": 0.6, "speech_end": round(t, 3), "pause_after": 0, "phrases": [{"text": " ".join(wl), "s": 0.6, "e": round(t, 3), "words": words}]}]})
        write_json(self.path("plan/script.json"), {"title": "Hero test", "sections": [{"id": "s1", "title": "The rack"}],
                   "beats": [{"id": "b01", "section": "s1", "narration": [" ".join(wl)]}]})
        write_json(self.path("plan/storyboard.json"), {"style": "hologram", "world": {"stations": [{"id": "st", "x": 0, "y": 0}]}, "chrome": {"section_labels": False},
                   "scenes": [{"beat": "b01", "kind": "bespoke", "scene": "b01", "station": "st", "join_in": {"type": "cut"}, **({"hero3d": hero} if hero else {})}]})
        self.path("scenes/b01.js").write_text(scene, encoding="utf-8")
        sr = 24000
        with wave.open(str(self.path("audio/narration.wav")), "wb") as wv:
            wv.setnchannels(1); wv.setsampwidth(2); wv.setframerate(sr); wv.writeframes(b"\x00\x00" * int(dur * sr))
        for nm, txt in (pages or {}).items():
            self.path(f"assets/pages/{nm}.page.js").write_text(txt, encoding="utf-8")

    def path(self, rel):
        p = self.root / rel
        p.parent.mkdir(parents=True, exist_ok=True)
        return p

    def close(self):
        shutil.rmtree(self.root, ignore_errors=True)


def frames_from(mp4: Path, times: list[float], out: Path, tag: str = "composed") -> list[Path]:
    out.mkdir(parents=True, exist_ok=True)
    got = []
    for t in times:
        f = out / f"hologram_v2_{tag}__{t:05.2f}.png"
        subprocess.run([which("ffmpeg") or "ffmpeg", "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", str(mp4), "-frames:v", "1", str(f)], check=True)
        got.append(f)
    return got


def main(keep: bool = False):
    from loom import compose as CO, render as RD
    L = TempLesson(dur=8.0, hero=hero_spec(8.0))
    try:
        t0 = time.time(); rep = CO.compose(L); t_compose = time.time() - t0
        t1 = time.time(); rep2 = CO.compose(L); t_compose2 = time.time() - t1
        mf = json.loads((L.root / "build" / "manifest.json").read_text(encoding="utf-8"))
        hv = mf["assets"].get("hero3d", {})
        print(json.dumps({"errors": rep["errors"], "heroes": {k: {"how": v["how"], "seconds": v["seconds"]} for k, v in hv.items()},
                          "compose_s": round(t_compose, 1), "second_compose_s": round(t_compose2, 1)}))
        t2 = time.time()
        try:
            mp4 = RD.render(L, quality="draft")
        except Exception as e:                   # the verification wants the check stage's preview frames, which a
            mp4 = L.path("renders/hero-lesson.mp4")   # throwaway lesson has not made; the MP4 itself is the HyperFrames render
            if "render verification" not in str(e) or not mp4.exists():
                raise
            print("note: render verification skipped (no check stage in a throwaway lesson)")
        t_render = time.time() - t2
        fr = frames_from(mp4, [1.6, 4.0, 7.2], OUT)
        print(json.dumps({"render_s": round(t_render, 1), "mp4": str(mp4), "frames": [str(f) for f in fr]}))
        if keep:
            shutil.copy2(mp4, OUT / "hologram_v2_composed.mp4")
    finally:
        if not keep:
            L.close()
        else:
            print("kept", L.root)


if __name__ == "__main__":
    main(keep="--keep" in sys.argv)

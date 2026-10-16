"""loom_manim: the contract between Loom and a Manim scene.

A Loom Manim scene is a normal ManimCE Scene that subclasses LoomScene. It reads everything that
varies from the injected context (never hard-codes it):

    from loom_manim import LoomScene, C, ctx
    class Main(LoomScene):
        def construct(self):
            ax = self.axes(...)
            self.play(Create(ax), run_time=0.8)
            self.wait_until("forgetting curve")      # narration cue -> clip time
            ...

- ctx.cue(anchor) -> seconds from clip start at which that word is spoken. Anchors must be string
  LITERALS in wait_until("...")/cue("...") calls, or listed in a module-level CUES = ["...", ...]
  (the bridge reads them statically to resolve their times before rendering)
- self.wait_until(anchor_or_seconds) waits exactly until then (never goes backwards)
- C.<token> -> the style pack's colours (C.accent, C.ink, C.muted, C.line, C.pos, C.neg ...)
- ctx.params -> the storyboard's params for this scene
- ctx.duration -> the clip length; the scene must not run longer (the bridge pads/holds)
Rendered with a transparent background: the Loom canvas shows through.

What a scene READS is recorded (D-37): every C.<token>, every ctx.fonts key, and any use of ctx.raw.
The bridge writes the record next to the clip and reuses the clip for any later look whose values
for exactly those reads are unchanged, so a brand or style change re-renders only the scenes whose
own colours changed. Read the look only through C and ctx (never hard-code a colour: the scenes gate
refuses literal colours, see loom/checks/manim_colours.py), and the record is complete by construction.
"""
from __future__ import annotations

import atexit
import json
import os

from manim import *  # noqa: F401,F403
from manim import Scene, config

_CTX_PATH = os.environ.get("LOOM_MANIM_CTX")
_raw = json.load(open(_CTX_PATH, encoding="utf-8")) if _CTX_PATH and os.path.exists(_CTX_PATH) else {"palette": {}, "cues": {}, "params": {}, "duration": 10, "fonts": {}}


# ---- the read record (D-37): which parts of the LOOK this scene used -------------------------------
_READS = {"palette": {}, "fonts": {}, "raw": False}


def _write_reads():
    out = os.environ.get("LOOM_MANIM_READS")
    if out:
        with open(out, "w", encoding="utf-8") as f:
            json.dump(_READS, f, sort_keys=True)


atexit.register(_write_reads)


class _RecordingFonts(dict):
    """ctx.fonts, recording every key read (a missing key is recorded too: its absence was used)."""
    def __getitem__(self, k):
        _READS["fonts"][k] = dict.get(self, k)
        return dict.__getitem__(self, k)

    def get(self, k, default=None):
        _READS["fonts"][k] = dict.get(self, k)
        return dict.get(self, k, default)

    def __iter__(self):
        _READS["raw"] = True  # iterating the whole font table depends on all of it
        return dict.__iter__(self)

    def items(self):
        _READS["raw"] = True
        return dict.items(self)

    def values(self):
        _READS["raw"] = True
        return dict.values(self)


class _Ctx:
    def __init__(self, raw):
        self._raw = raw
        self.params = raw.get("params", {})
        self.duration = float(raw.get("duration", 10))
        self.cues = raw.get("cues", {})
        self.fonts = _RecordingFonts(raw.get("fonts", {}))
        self.speech = raw.get("speech", [0, self.duration])

    @property
    def raw(self):
        # the whole context: a scene that reaches in here depends on ALL of the look, so its clip is only
        # reused when the whole look is identical (correct, just less reuse)
        _READS["raw"] = True
        return self._raw

    def cue(self, anchor):
        if anchor not in self.cues:
            raise KeyError(f"cue '{anchor}' was not resolved for this Manim scene (it must be a word spoken in the beat)")
        return float(self.cues[anchor])


ctx = _Ctx(_raw)

# register the style pack's fonts with Pango so Text() matches the canvas typography
try:
    import manimpango
    for _f in _raw.get("font_files", []):
        if os.path.exists(_f):
            manimpango.register_font(_f)
except Exception:  # pragma: no cover - fonts fall back to the system sans
    pass


class _Palette:
    def __getattr__(self, k):
        if k.startswith("__"):
            raise AttributeError(k)
        v = _raw.get("palette", {}).get(k)
        _READS["palette"][k] = v
        if v is None:
            raise AttributeError(f"style token '{k}' not in palette")
        return ManimColor(v)


C = _Palette()


class LoomScene(Scene):
    def setup(self):
        self.camera.background_opacity = 0.0

    def now(self) -> float:
        return float(self.renderer.time)

    def wait_until(self, when, min_wait: float = 1 / 30):
        t = ctx.cue(when) if isinstance(when, str) else float(when)
        dt = t - self.now()
        if dt > min_wait:
            self.wait(dt)

    def hold_to_end(self):
        dt = ctx.duration - self.now()
        if dt > 1 / 30:
            self.wait(dt)

    def text(self, s, role="label", color=None, weight=None):
        size = {"title": 56, "lead": 40, "body": 34, "label": 28, "caption": 22}.get(role, 30)
        fam = ctx.fonts.get("display" if role == "title" else "body", "Sans")
        return Text(s, font=fam, font_size=size, color=color or C.ink, weight=weight or BOLD)

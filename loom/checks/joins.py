"""The joins between beats, measured on frames (D-190). Kshitij on the four style test lessons (2026-10-16): "where a new
beat is supposed to appear, old beat is getting flashed again for like a second and sometimes some old elements flicker
in the new beats. I feel like the transitions are the worst thing in these videos." Every gate had passed them.

Around every join the frames are taken densely (JOIN_OFFS) and compared on a small grey copy, the caption band left out:
  join_flashback  the picture leaves the old beat, comes back close to it, then leaves again (the old beat shown twice:
                  st-sc-2fa b14, a cover opening on held elements; st-sc-2fa b24, a window rebuilt after a cover)
  join_blank      a frame with almost nothing on it, much emptier than both the old and the new picture, for
                  BLANK_MIN_S or longer (st-holo-ai b08: a canvas join empty for 1.2 s)
  join_pop        one frame unlike the frames on both sides (a one-frame wrong framing: st-iso-order b14)

Pure on frames ({t: 2-D grey array}), so the check stage (snapshots of the build, before the render) and a rendered MP4
(scan_mp4) use the same measure. The errors start with their code and name the NEW beat (the join belongs to the beat
it opens), which the router sends to that beat's author.
"""
from __future__ import annotations

import subprocess
from pathlib import Path

JOIN_OFFS = (-0.6, -0.35, -0.15, -0.03, 0.0, 0.03, 0.07, 0.1, 0.2, 0.33, 0.47, 0.63, 0.8, 1.0, 1.25, 1.6, 2.1)
W, H = 96, 54
CAPTION_CUT = 0.86          # rows below this share of the height are the caption band
LEAVE = 0.6                 # "left the old picture": its distance reached this share of the window's largest change
BACK = 0.3                  # "came back": the distance fell to this share of the window's largest change...
AGAIN = 0.6                 # ...and rose again to this share afterwards
MIN_CHANGE = 4.0            # a join whose largest change is under this (mean grey levels) is not measured
BLANK_RATIO = 0.35          # a frame's detail (grey spread) under this share of the emptier end
BLANK_MIN_S = 0.3
BLANK_LONG_S = 0.6          # the second rule (emptier than the old picture and than the new) needs this long
LONG_NEW = 0.7
# styles whose beats are drafted onto a clean sheet (the blank sheet IS the start of the drawing): no second rule
DRAFTING = {"whiteboard", "blueprint"}
POP = 6.0


# joins whose cover is MEANT to fill the frame for a moment (runtime/world.js SCREEN, runtime/material.js): no join_blank
# inside the cover's own window
COVER_JOINS = {"iris", "wipe", "dip", "fade", "torn", "page", "scroll", "motif", "handoff", "fill"}


def join_times(manifest: dict) -> list[tuple[str, str, float]]:
    """(previous beat, beat, start) for every join of the film"""
    bs = manifest.get("beats") or []
    return [(bs[i - 1]["id"], bs[i]["id"], float(bs[i]["start"])) for i in range(1, len(bs))]


def join_kinds(manifest: dict) -> dict[str, str]:
    """beat -> its join_in type, from the manifest's scenes"""
    return {s.get("beat"): ((s.get("join_in") or {}).get("type") if isinstance(s.get("join_in"), dict) else s.get("join_in")) or ""
            for s in manifest.get("scenes") or []}


def ffmpeg_ok() -> bool:
    import shutil
    return bool(shutil.which("ffmpeg"))


def sample_times(manifest: dict) -> list[float]:
    D = float(manifest.get("duration") or 0)
    out = set()
    for _, _, s in join_times(manifest):
        for o in JOIN_OFFS:
            t = round(s + o, 2)
            if 0 <= t <= D - 0.05:
                out.add(t)
    return sorted(out)


def grey(img):
    """a PIL image (or a path) as the small grey array the measure reads, caption band cut"""
    import numpy as np
    from PIL import Image
    im = img if hasattr(img, "convert") else Image.open(img)
    a = np.asarray(im.convert("L").resize((W, H)), dtype=np.float32)
    return a[: int(H * CAPTION_CUT), :]


def analyse(manifest: dict, frames: dict) -> tuple[list[str], list[str], dict]:
    """frames: {t (2 decimals): grey array}. (errors, warnings, stats)"""
    import numpy as np
    E, Wn = [], []
    stats = {"joins": 0, "measured": 0, "flashback": 0, "blank": 0, "pop": 0}
    d = lambda a, b: float(np.abs(a - b).mean())
    kinds = join_kinds(manifest)
    st = manifest.get("style") or {}
    drafting = (st.get("id") if isinstance(st, dict) else st) in DRAFTING
    for prev, beat, s in join_times(manifest):
        stats["joins"] += 1
        ts = [round(s + o, 2) for o in JOIN_OFFS if round(s + o, 2) in frames]
        if len(ts) < 6:
            continue
        F = [frames[t] for t in ts]
        old, new = F[0], F[-1]
        do = np.array([d(f, old) for f in F])
        top = float(do.max())
        if top < MIN_CHANGE:
            continue
        stats["measured"] += 1
        # left, came back, left again
        left = np.where(do >= LEAVE * top)[0]
        if len(left):
            i0 = int(left[0])
            back = [i for i in range(i0 + 1, len(F)) if do[i] <= BACK * top]
            if back:
                j = back[0]
                if any(do[k] >= AGAIN * top for k in range(j + 1, len(F))):
                    stats["flashback"] += 1
                    E.append(f"join_flashback: {beat} (the join from {prev} at {s:.2f}s): the old picture comes back at {ts[j]:.2f}s "
                             f"after the frame had left it at {ts[i0]:.2f}s, then leaves again: the old beat shows twice. Usually an "
                             f"element of {prev} held and then sent away (it rides the join and leaves after), or the same thing "
                             f"drawn again from nothing: hold it and change it, or let the join take it")
        # empty frames between two pictures
        spread = np.array([float(f.std()) for f in F])
        base = min(float(old.std()), float(new.std()))
        if max(float(old.std()), float(new.std())) > 4:
            # a cover join is MEANT to fill the frame while it is closed: its own window is left out, not the frames after
            # it (st-sc-2fa b04: the cover opened on an empty frame for 1.2 s more)
            cov = None
            if kinds.get(beat) in COVER_JOINS:
                from ..timing import JOIN_DUR
                half = float(JOIN_DUR.get(kinds.get(beat)) or 0.9) / 2
                cov = (s - half - 0.05, s + half + 0.05)
            keep = lambda i: ts[i] > s - 0.5 and not (cov and cov[0] <= ts[i] <= cov[1])
            low = [ts[i] for i in range(len(F)) if spread[i] < BLANK_RATIO * base and keep(i)]
            # a light, sparse new picture (a screencast page still empty): far emptier than the old picture and emptier than
            # the new one, for longer (st-sc-2fa b04: 1.1 s with only the chapter label while the voice went on)
            long_ = [ts[i] for i in range(len(F)) if spread[i] < BLANK_RATIO * float(old.std()) and spread[i] < LONG_NEW * float(new.std()) and keep(i)]
            if not drafting and not (low and max(low) - min(low) >= BLANK_MIN_S) and long_ and max(long_) - min(long_) >= BLANK_LONG_S:
                low = long_
            if low and (max(low) - min(low) >= BLANK_MIN_S):
                stats["blank"] += 1
                E.append(f"join_blank: {beat} (the join from {prev} at {s:.2f}s): the frame is nearly empty from {min(low):.2f}s to "
                         f"{max(low):.2f}s between two full pictures: the old picture left before the new one arrived. Bring the new "
                         f"beat's first element in at the join, or hold something across it")
        # one frame unlike both neighbours: the frames one frame either side of it are taken (-0.03, +0.03, +0.07), so a
        # wrong first frame of a cut (unlike the old picture before it AND the new one after it, which agree with each
        # other a frame later) is seen
        for i in range(1, len(F) - 1):
            if ts[i + 1] - ts[i - 1] > 0.12:
                continue
            a, b = d(F[i - 1], F[i]), d(F[i], F[i + 1])
            nxt = d(F[i + 1], F[i + 2]) if i + 2 < len(F) and ts[i + 2] - ts[i + 1] <= 0.06 else None
            c = d(F[i - 1], F[i + 1])
            alone = c < 0.35 * min(a, b)                                   # both neighbours alike: a flash
            first = nxt is not None and nxt < 0.35 * b and c > POP         # at a cut: the new picture settles a frame later
            if a > POP and b > POP and (alone or first):
                stats["pop"] += 1
                E.append(f"join_pop: {beat} (the join from {prev} at {s:.2f}s): the frame at {ts[i]:.2f}s is unlike the frames on "
                         f"both sides: a one-frame wrong picture (a framing or state applied a frame late, an element shown for "
                         f"one frame). Set the opening framing so it holds AT the beat's first frame (a camera dur of 0 is a cut)")
                break
    return E, Wn, stats


def scan_frames(manifest: dict, paths: dict) -> tuple[list[str], list[str], dict]:
    """paths: {t: image path} (the check stage's join snapshots)"""
    return analyse(manifest, {round(float(t), 2): grey(p) for t, p in paths.items()})


def scan_mp4(manifest: dict, mp4: Path, ffmpeg: str = "ffmpeg") -> tuple[list[str], list[str], dict]:
    """the same measure on a rendered film: every frame decoded small, the join times read from it"""
    import numpy as np
    fps = float(manifest.get("fps") or 30)
    raw = subprocess.run([ffmpeg, "-loglevel", "error", "-i", str(mp4), "-vf", f"scale={W}:{H},format=gray", "-f", "rawvideo", "-"],
                         capture_output=True, check=True).stdout
    A = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)[:, : int(H * CAPTION_CUT), :]
    frames = {}
    for t in sample_times(manifest):
        i = int(round(t * fps))
        if 0 <= i < len(A):
            frames[round(t, 2)] = A[i]
    return analyse(manifest, frames)

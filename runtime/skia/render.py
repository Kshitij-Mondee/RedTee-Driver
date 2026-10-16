"""Render a Loom Skia scene to a transparent WebM (called by loom/skia_bridge.py as a subprocess).

    python render.py <scene.py> <out.webm> <fps> <scale> <mb_samples> <mb_shutter>

Frames are drawn at the design size (loom_skia.W x H) scaled by <scale>, cleared to transparent, and piped
as RGBA to ffmpeg (VP9 with alpha). Motion blur, when asked for, averages <mb_samples> sub-frames spread over
<mb_shutter> of the frame interval (a 180-degree shutter is 0.5): real temporal blur, still a pure function
of the frame index.
"""
import importlib.util
import os
import subprocess
import sys

import numpy as np
import skia

scene_path, out, fps, scale, mbs, shutter = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), int(sys.argv[5]), float(sys.argv[6])
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import loom_skia as L  # noqa: E402

spec = importlib.util.spec_from_file_location("scene", scene_path)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
if not hasattr(mod, "frame"):
    sys.exit("a Loom Skia scene must define frame(c, t)")

w, h = max(2, int(L.W * scale)) // 2 * 2, max(2, int(L.H * scale)) // 2 * 2
n = int(round(L.ctx.duration * fps))
ff = os.environ.get("LOOM_FFMPEG", "ffmpeg")
proc = None if (os.environ.get("LOOM_STILLS") or os.environ.get("LOOM_FRAMES_DIR")) else subprocess.Popen([ff, "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{w}x{h}", "-r", f"{fps:g}", "-i", "-",
                         "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "24", "-row-mt", "1", "-auto-alt-ref", "0", out],
                        stdin=subprocess.PIPE)
surf = skia.Surface.MakeRaster(skia.ImageInfo.Make(w, h, skia.kRGBA_8888_ColorType, skia.kPremul_AlphaType))


def draw(t):
    c = surf.getCanvas()
    c.clear(skia.ColorTRANSPARENT)
    c.save(); c.scale(w / L.W, h / L.H)
    mod.frame(c, t)
    c.restore()
    img = surf.makeImageSnapshot().toarray(colorType=skia.kRGBA_8888_ColorType, alphaType=skia.kUnpremul_AlphaType)
    L._end_frame()
    return img


def frame_at(t):
    if mbs <= 1:
        return draw(t)
    acc = np.zeros((h, w, 4), dtype=np.float32)
    for k in range(mbs):
        sub = draw(t + (k / (mbs - 1) - 0.5) * shutter / fps).astype(np.float32)
        sub[..., :3] *= sub[..., 3:4] / 255.0
        acc += sub
    acc /= mbs
    a = acc[..., 3:4]
    acc[..., :3] = np.where(a > 0, acc[..., :3] * 255.0 / np.maximum(a, 1e-6), 0)
    return np.clip(acc, 0, 255).astype(np.uint8)


# stills mode (the motion lab): only the requested times, as PNGs, no video
if os.environ.get("LOOM_STILLS"):
    from PIL import Image
    for t in [float(x) for x in os.environ["LOOM_STILLS"].split(",")]:
        Image.fromarray(frame_at(t), "RGBA").save(os.path.join(os.path.dirname(out), f"still_{t:.2f}.png"))
    sys.exit(0)

# resumable mode: LOOM_FRAMES_DIR keeps finished frames as PNGs, so an interrupted render continues where it
# stopped (a long motion-blurred clip can outlive one session or one command's time limit)
FD = os.environ.get("LOOM_FRAMES_DIR")
if FD:
    from PIL import Image
    os.makedirs(FD, exist_ok=True)
    for i in range(n):
        fp = os.path.join(FD, f"{i:05d}.png")
        if os.path.exists(fp):
            continue
        Image.fromarray(frame_at(i / fps), "RGBA").save(fp + ".tmp.png", compress_level=1)
        os.replace(fp + ".tmp.png", fp)
    if proc is not None:
        proc.stdin.close(); proc.wait()
    r = subprocess.run([ff, "-v", "error", "-y", "-framerate", f"{fps:g}", "-i", os.path.join(FD, "%05d.png"), "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p",
                        "-b:v", "0", "-crf", "24", "-row-mt", "1", "-auto-alt-ref", "0", out])
    sys.exit(r.returncode)

for i in range(n):
    t = i / fps
    if mbs > 1:
        acc = np.zeros((h, w, 4), dtype=np.float32)
        for k in range(mbs):
            sub = draw(t + (k / (mbs - 1) - 0.5) * shutter / fps if mbs > 1 else t).astype(np.float32)
            # accumulate premultiplied so transparent edges do not darken
            sub[..., :3] *= sub[..., 3:4] / 255.0
            acc += sub
        acc /= mbs
        a = acc[..., 3:4]
        acc[..., :3] = np.where(a > 0, acc[..., :3] * 255.0 / np.maximum(a, 1e-6), 0)
        frame_px = np.clip(acc, 0, 255).astype(np.uint8)
    else:
        frame_px = draw(t)
    proc.stdin.write(frame_px.tobytes())
proc.stdin.close()
if proc.wait() != 0:
    sys.exit("ffmpeg failed")

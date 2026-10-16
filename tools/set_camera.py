"""Plan-check a set's camera (D-149, L-366): project points from a floor plan into the 1920 x 1080 frame, so every
frame position a set prompt states is computed, not guessed.

    py tools/set_camera.py spec.json

spec.json:
    {"camera": {"x": 1.0, "y": 0.4, "eye": 1.15, "yaw": 25, "hfov": 55, "horizon_pct": 46},
     "walls": [{"name": "window wall", "axis": "x", "at": 4.3}, {"name": "end wall", "axis": "y", "at": 5.2}],
     "points": {"screen_centre": [2.15, 5.2, 1.3], "presenter_head": [2.95, 4.7, 1.75]},
     "behind": ["presenter_head"]}

Plan coordinates in metres: x to the right, y away from the camera's side of the room, z up. yaw is degrees from the
+y axis toward +x (the direction the camera looks). The horizon sits at horizon_pct of the frame height (a shifted
lens: no tilt, verticals stay vertical). For each point it prints the frame position, whether it is in the frame or
only in the overscan (the 2400 x 1350 canvas: frame x -240..2160, y -135..1215), and its distance along the view. For
the points listed in "behind" it also prints which wall a ray from the eye through the point meets next, and where:
what a character's head will be seen against. The two vanishing points (along +y and along +x) are printed too.
"""
from __future__ import annotations

import json
import math
import sys


def setup(cam: dict):
    W, H = 1920, 1080
    hf = math.radians(cam.get("hfov", 55))
    f = (W / 2) / math.tan(hf / 2)
    hy = H * cam.get("horizon_pct", 46) / 100
    a = math.radians(cam["yaw"])
    fwd = (math.sin(a), math.cos(a))
    right = (math.cos(a), -math.sin(a))
    return W, H, f, hy, fwd, right


def project(cam: dict, p) -> dict:
    W, H, f, hy, fwd, right = setup(cam)
    dx, dy, dz = p[0] - cam["x"], p[1] - cam["y"], p[2] - cam["eye"]
    d = dx * fwd[0] + dy * fwd[1]
    r = dx * right[0] + dy * right[1]
    if d <= 0.05:
        return {"behind_camera": True}
    x, y = W / 2 + f * r / d, hy - f * dz / d
    where = "frame" if 0 <= x <= W and 0 <= y <= H else ("overscan" if -240 <= x <= W + 240 and -135 <= y <= H + 135 else "outside")
    return {"x": round(x), "y": round(y), "where": where, "depth": round(d, 2)}


def behind(cam: dict, p, walls: list) -> dict | None:
    dx, dy, dz = p[0] - cam["x"], p[1] - cam["y"], p[2] - cam["eye"]
    best = None
    for w in walls:
        if w["axis"] == "x" and abs(dx) > 1e-9:
            t = (w["at"] - cam["x"]) / dx
        elif w["axis"] == "y" and abs(dy) > 1e-9:
            t = (w["at"] - cam["y"]) / dy
        else:
            continue
        if t > 1.0 and (best is None or t < best[0]):
            best = (t, w["name"])
    if not best:
        return None
    t, name = best
    return {"wall": name, "at": [round(cam["x"] + dx * t, 2), round(cam["y"] + dy * t, 2), round(cam["eye"] + dz * t, 2)]}


def vanishing(cam: dict) -> dict:
    W, H, f, hy, fwd, right = setup(cam)
    out = {}
    for name, v in (("along_y", (0.0, 1.0)), ("along_x", (1.0, 0.0))):
        d = v[0] * fwd[0] + v[1] * fwd[1]
        r = v[0] * right[0] + v[1] * right[1]
        out[name] = round(W / 2 + f * r / d) if abs(d) > 1e-9 else "at infinity (parallel to the frame)"
    out["horizon_y"] = round(hy)
    return out


def run(spec: dict) -> dict:
    cam = spec["camera"]
    res = {"vanishing": vanishing(cam), "points": {}}
    for k, p in (spec.get("points") or {}).items():
        res["points"][k] = project(cam, p)
        if k in (spec.get("behind") or []):
            res["points"][k]["behind"] = behind(cam, p, spec.get("walls") or [])
    return res


if __name__ == "__main__":
    spec = json.loads(open(sys.argv[1], encoding="utf-8").read()) if len(sys.argv) > 1 else json.load(sys.stdin)
    print(json.dumps(run(spec), indent=1))

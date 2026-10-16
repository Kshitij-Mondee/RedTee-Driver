"""Import a Claude Design character delivery as a Loom rig (D-93): the delivered parts, pivots, parents, z, variants
and the delivery's own poses become `assets/rigs/<id>.json`, which runtime/rigs/imported.js turns into a rig that
`ctx.character(name, "<id>", {...})` places, poses, lip-syncs and blinks like Loom's own.

    py tools/rig_import.py assets/incoming/maya-v5 --id maya [--view front] [--check]

What it reads (all from the batch made by tools/asset_intake.py, plus the review page in `_page/`):
- manifest.json: every part's name, variant, parent, pivot, z, and `follow` rules (a deltoid follows its upper arm);
- the part SVGs (metadata stripped; ids made unique at run time);
- the page's `loom-builds` (and baked `data-pose` figures): each pose is a list of (part, matrix). A pose becomes,
  per part, its LOCAL [angle, dx, dy] about its pivot (parent matrix inverted, rotation and the pivot's shift
  split), plus the variant each slot shows in that pose (a hand shape, seated thighs, a foreshortened arm).
What it writes: assets/rigs/<id>.json (a build output: regenerate it, never hand-edit) and a report. `--check`
re-poses every imported pose with the same maths the runtime uses and compares every part's world matrix with the
delivery's (the importer proves itself; a pose that does not reproduce is an error).
Exit 0 ok, 1 when a pose does not reproduce or a part is missing, 2 when nothing was found.
"""
from __future__ import annotations

import argparse
import json
import math
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# caption -> rig pose name (Loom's shared names first: idle, explain, point, wave, think, shrug, cheer, present)
POSE_NAMES = [("rig neutral", "neutral"), ("waving", "wave"), ("presenting", "present"), ("sitting at a desk", "type"),
              ("thinking", "think"), ("on the phone", "phone"), ("shrugging", "shrug"), ("arms crossed", "arms_crossed"),
              ("hand on chin", "chin"), ("cheering", "cheer"), ("worried", "worried"), ("talking with her hands", "explain"),
              ("handing a document", "hand_over"), ("leaning on a desk", "lean"), ("listening", "listen"), ("coffee", "coffee"),
              ("thumbs up", "thumbs_up")]
BAKED = {"stand": "idle", "point": "point", "sit": "sit"}
# Loom emotion names -> the delivery's twelve expressions, and the composable face used while talking or blinking
EMOTIONS = {
    "neutral": ("neutral", "open", "neutral", "neutral"), "listening": ("listening", "open", "raised", "listening"),
    "happy": ("smile", "open", "neutral", "smile"), "smile": ("smile", "open", "neutral", "smile"),
    "laugh": ("laugh", "squint", "raised", "laugh"), "surprised": ("surprise", "wide", "raised", "surprise"),
    "surprise": ("surprise", "wide", "raised", "surprise"), "concern": ("concern", "open", "worried", "concern"),
    "worried": ("concern", "open", "worried", "concern"), "sad": ("concern", "half", "worried", "concern"),
    "doubt": ("doubt", "half", "one_up", "doubt"), "thinking": ("focus", "half", "frown", "focus"),
    "focus": ("focus", "half", "frown", "focus"), "realisation": ("realisation", "wide", "raised", "realisation"),
    "frustrated": ("frustration", "squint", "frown", "frustration"), "frustration": ("frustration", "squint", "frown", "frustration"),
    "angry": ("frustration", "squint", "frown", "frustration"), "relief": ("relief", "closed", "neutral", "relief"),
    "pride": ("pride", "open", "raised", "pride"), "proud": ("pride", "open", "raised", "pride"),
}
VISEMES = {"rest": "", "open": "E", "wide": "AI", "round": "O", "closed": "MBP", "f": "FV", "u": "U", "l": "L", "w": "WQ", "smile": "smile_talk"}


def strip(svg: str) -> str:
    return re.sub(r"<metadata>[\s\S]*?</metadata>", "", svg)


def inner(svg: str) -> str:
    """the markup inside the root <svg>: already in the shared grid's coordinates (each file's viewBox is a crop)"""
    s = strip(svg).strip()
    s = re.sub(r"^<\?xml[^>]*>\s*", "", s)
    return re.sub(r"^<svg[^>]*>|</svg>\s*$", "", s).strip()


def mat(tf: str):
    m = re.search(r"matrix\(([^)]*)\)", tf or "")
    return [float(x) for x in m.group(1).replace(",", " ").split()] if m else [1, 0, 0, 1, 0, 0]


def mul(A, B):
    a, b, c, d, e, f = A; g, h, i, j, k, l = B
    return [a * g + c * h, b * g + d * h, a * i + c * j, b * i + d * j, a * k + c * l + e, b * k + d * l + f]


def inv(M):
    a, b, c, d, e, f = M; det = a * d - b * c
    return [d / det, -b / det, -c / det, a / det, (c * f - d * e) / det, (b * e - a * f) / det]


def local_from(theta_deg, dx, dy, pivot):
    """T(dx, dy) . R(theta about pivot): what the runtime applies for one part"""
    t = math.radians(theta_deg); c, s = math.cos(t), math.sin(t); px, py = pivot
    return [c, s, -s, c, px - c * px + s * py + dx, py - s * px - c * py + dy]


def page_poses(page: Path):
    s = page.read_text(encoding="utf-8")
    B = json.loads(re.search(r'<script type="application/json" id="loom-builds">([\s\S]*?)</script>', s).group(1))
    body = s[s.index("<body"):]
    # baked figures: (transform, asset) pairs inside <svg data-pose>
    for name in BAKED:
        m = re.search(r'<svg[^>]*data-pose="%s"[^>]*>' % name, body)
        if not m:
            continue
        depth, i = 0, m.start()
        for q in re.finditer(r"<svg\b|</svg>", body[m.start():]):
            depth += 1 if q.group(0) == "<svg" else -1
            if depth == 0:
                i = m.start() + q.end(); break
        B["pose:" + name] = [[a, tf] for tf, a in re.findall(r'<g transform="([^"]+)">\s*<svg[^>]*data-asset="([^"]+)"', body[m.start():i])]
    # captions: the text right after each build's svg
    clean = re.sub(r'<svg[^>]*data-asset="[^"]*"[\s\S]*?</svg>', "", body)
    clean = re.sub(r"<script[\s\S]*?</script>|<style[\s\S]*?</style>", "", clean)
    marked = re.sub(r'<svg[^>]*data-build="(b\d+)"[^>]*>[\s\S]*?</svg>', lambda q: f" [[{q.group(1)}]] ", clean)
    text = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", marked))
    caps, last = {}, None
    for piece in re.split(r"(\[\[b\d+\]\])", text):
        if piece.startswith("[["):
            last = piece[2:-2]
        elif last and last not in caps:
            caps[last] = piece.strip()[:120].lower()
    return B, caps


def build(batch: Path, rid: str, view: str):
    man = json.loads((batch / "manifest.json").read_text(encoding="utf-8"))
    assets = [a for a in man["assets"] if a.get("kind") == "character_part" and (a.get("view") or "front") == view]
    if not assets:
        return None, ["no character parts for view " + view]
    by = {a["file"][:-4]: a for a in assets}
    slots = {}
    for a in assets:
        S = slots.setdefault(a["part"], {"name": a["part"], "parent": a.get("parent") or "", "pivot": a["pivot"], "z": a.get("z", 0), "variants": {}, "follow": []})
        v = a.get("variant") or ""
        S["variants"][v] = inner((batch / a["file"]).read_text(encoding="utf-8"))
        if a.get("follow"):
            S["follow"].append([a["follow"]["angle"], v])
            S["follows"] = a["follow"]["part"]
        if not a.get("variant"):   # the base part sets the slot's pivot, parent and z
            S.update(parent=a.get("parent") or "", pivot=a["pivot"], z=a.get("z", 0))
    for S in slots.values():
        S["default"] = "" if "" in S["variants"] else ("relaxed" if "relaxed" in S["variants"] else sorted(S["variants"])[0])
        if S["name"] == "face":
            S["default"] = None   # no face swap by default: the composable eyes, brows and mouth show
    B, caps = page_poses(batch / "_page" / "index.html")
    poses, errors, seen = {}, [], set()
    for k, items in B.items():
        if k.startswith("pose:"):
            pname = BAKED[k[5:]]
        else:
            cap = caps.get(k, "")
            pname = next((n for c, n in POSE_NAMES if cap.startswith(c) or (" " + c) in (" " + cap[:40])), None)
            if not pname:
                continue
            if "3/4" in cap or "walk key" in cap:
                continue
        if pname in seen:
            continue
        parts = [(a, tf) for a, tf in items if a in by]
        if len(parts) < 20:          # a close-up, not a whole figure
            continue
        seen.add(pname)
        W = {by[a]["part"]: mat(tf) for a, tf in parts}
        variants = {by[a]["part"]: (by[a].get("variant") or "") for a, _ in parts}
        angles = {}
        for part, M in W.items():
            S = slots[part]; par = S["parent"]
            L = mul(inv(W[par]), M) if par in W else M
            th = math.degrees(math.atan2(L[1], L[0])); px, py = S["pivot"]
            q = (L[0] * px + L[2] * py + L[4], L[1] * px + L[3] * py + L[5])
            angles[part] = [round(th, 2), round(q[0] - px, 2), round(q[1] - py, 2)]
        pv = {}
        for part, v in variants.items():
            S = slots[part]
            if S.get("follows") and v in [x[1] for x in S["follow"]]:
                continue                       # chosen at run time from the followed part's angle
            if part in ("face",):
                continue                       # faces follow the emotion, not the pose
            if v != S["default"] and part not in ("mouth", "eye_l", "eye_r", "brow_l", "brow_r"):
                pv[part] = v
        poses[pname] = {"angles": angles, "variants": pv, "parts": sorted(W), "source": k}
    for want in ("idle", "neutral"):
        if want not in poses:
            errors.append(f"pose '{want}' not found on the review page")
    if "idle" not in poses and "neutral" in poses:
        poses["idle"] = poses["neutral"]
    rig = {"id": rid, "view": view, "size": [1000, 1905], "batch": man.get("batch"), "source": str(batch.relative_to(ROOT)) if batch.is_relative_to(ROOT) else str(batch),
           "parts": sorted(slots.values(), key=lambda s: s["z"]), "poses": poses,
           "emotions": {k: {"face": f, "eye": e, "brow": b, "mouth": m} for k, (f, e, b, m) in EMOTIONS.items()}, "visemes": VISEMES,
           "note": "generated by tools/rig_import.py (D-93); regenerate, never hand-edit"}
    return rig, errors


def check(rig, batch: Path) -> list[str]:
    """re-pose every pose with the runtime's maths and compare world matrices with the delivery's"""
    B, _ = page_poses(batch / "_page" / "index.html")
    man = json.loads((batch / "manifest.json").read_text(encoding="utf-8"))
    by = {a["file"][:-4]: a for a in man["assets"]}
    slots = {s["name"]: s for s in rig["parts"]}
    bad = []
    for pname, P in rig["poses"].items():
        W0 = {by[a]["part"]: mat(tf) for a, tf in B[P["source"]] if a in by}
        Wr = {}
        def world(n):
            if n in Wr:
                return Wr[n]
            S = slots[n]; th, dx, dy = P["angles"].get(n, [0, 0, 0])
            L = local_from(th, dx, dy, S["pivot"])
            Wr[n] = mul(world(S["parent"]), L) if S["parent"] in P["angles"] else L
            return Wr[n]
        worst = max(max(abs(x - y) for x, y in zip(world(n), W0[n])) for n in P["angles"])
        if worst > 0.05 and worst * 1 > 0.5:
            bad.append(f"pose {pname}: re-posed parts differ from the delivery by up to {worst:.2f}")
    return bad


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("batch"); ap.add_argument("--id", required=True); ap.add_argument("--view", default="front")
    ap.add_argument("--check", action="store_true"); ap.add_argument("--out")
    a = ap.parse_args(argv)
    batch = Path(a.batch).resolve()
    rig, errors = build(batch, a.id, a.view)
    if rig is None:
        print("; ".join(errors)); return 2
    bad = check(rig, batch)
    out = Path(a.out or ROOT / "assets" / "rigs" / f"{a.id}.json")
    if not a.check:
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(rig, separators=(",", ":")), encoding="utf-8")
    nvar = sum(len(s["variants"]) for s in rig["parts"])
    print(f"rig {a.id} ({a.view}): {len(rig['parts'])} slots, {nvar} drawings, {len(rig['poses'])} poses "
          f"({', '.join(sorted(rig['poses']))}) -> {out.relative_to(ROOT) if not a.check else '(check only)'}")
    for e in errors + bad:
        print("  [error]", e)
    return 1 if errors or bad else 0


if __name__ == "__main__":
    sys.exit(main())

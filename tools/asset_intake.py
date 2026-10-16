"""Bring assets made in Claude Design into Loom, and check them against the asset contract before anyone uses them.

    py tools/asset_intake.py <export.zip | export.html | folder> --batch <name> [--out assets/incoming]

Claude Design exports a project as a .zip, a standalone .html, PDF, PPTX, Canva or a Claude Code handoff; it
has no "export SVG" button (support.claude.com, "Get started with Claude Design", read 2026-10-01). So the
return prompt in docs/ASSET_WISHLIST.md asks it to keep every asset as its own .svg file in the project, with a
manifest.json, and to show them on a review page where each <svg> carries data-asset="<path>". This tool reads
any of the three shapes:
  - a .zip or a folder: every *.svg in it, plus manifest.json if present;
  - a standalone .html: every inline <svg data-asset="..."> (svgs without data-asset are skipped and counted).

It writes <out>/<batch>/<asset path>.svg, <out>/<batch>/manifest.json (as received, or built from the files)
and <out>/<batch>/INTAKE.md, and checks each file against Prompt 0 of docs/ASSET_WISHLIST.md:
  - parses as SVG; no <text>, <image>, <foreignObject>, <script>, external references;
  - colours only from the contract's slots (props and sets: the base slots; characters: the slot families);
    #000000 is allowed only as a shade (fill-opacity set);
  - filters, masks and gradients flagged (allowed only when the prompt asked for them);
  - size within budget (props and icons 80 KB; characters and textures 400 KB; world-pack sets 700 KB, their
    props 120 KB);
  - world-pack sets and their props (kind set or set_prop, docs/assets/world_prompts): every colour from the set
    style's palette (packs/set_styles.json, named by the manifest's set_style or the file's __<style>), and a set
    has far, mid and near in that order, frame_safe, anchor_floor_y, the 2400 x 1350 canvas, and at least some curved
    shapes (a set of straight-edged polygons only was modelled from boxes, not drawn);
  - characters: every part listed in the manifest has a pivot;
  - an accessory listed with a parent part (a tote on the torso) may use the character's palette.
When a manifest exists, only the files it lists are checked and imported; files under preview/, screenshots/ or
review/ are review copies, and other unlisted files (composite sheets) are reported, not imported.
Exit 0 when every asset passes, 1 when any fails, 2 when nothing was found (a zero is not a result).
Nothing here is wired into rendering: the importer, ctx.asset and the rig importer are still to be built.
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
import tempfile
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

BASE = {"#101010", "#ffffff", "#e6e6e6", "#cfcfcf", "#8a8a8a", "#ff0000", "#00c000", "#0000ff", "#ffd000",
        "#606060", "#f2c7a5", "#d9a784", "#3b2a20", "#7a0000"}
CHARACTER = {"#f2c7a5", "#d9a784", "#fbe3cf", "#c98e70", "#3b2a20", "#24180f", "#6a4a36", "#4a6a8a", "#1a1a1a",
             "#ffffff", "#b8645a", "#e8998a", "#2f4a7a", "#22365c", "#4a6aa0", "#d8d2c4", "#b8b0a0", "#f0ece2",
             "#5a4636", "#3e3024", "#7a6250", "#9aa0a6", "#6e747a", "#d0d4d8", "#101010"}
BUDGET = {"prop": 80_000, "icon": 80_000, "character": 400_000, "character_part": 400_000, "set": 700_000,
          "set_prop": 120_000, "texture": 400_000}
SET_KINDS = ("set", "set_prop")      # world-pack sets and their props: checked against their set style's palette


def set_style_of(path, entry):
    """a set's style: the manifest's set_style, else the file name's __<style> part"""
    sid = (entry or {}).get("set_style")
    if not sid:
        stem = path.rsplit("/", 1)[-1]
        parts = stem.split("__")
        sid = parts[1] if len(parts) > 1 else None
    return sid
REVIEW_DIRS = {"preview", "screenshots", "review"}
# the contract's base slots by name (Prompt 0), for --declared-slots
SLOT_HEX = {"ink": "#101010", "surface": "#ffffff", "surface2": "#e6e6e6", "field2": "#cfcfcf", "muted": "#8a8a8a",
            "line": "#606060", "accent": "#ff0000", "accent2": "#00c000", "accent3": "#0000ff", "accent4": "#ffd000"}


def declared_remap(manifest) -> dict:
    """{delivered hex: contract hex} from a manifest's own `base_slots` {slot name: hex}, for slot names the
    contract knows. Only used with --declared-slots (opt-in): the delivery said which slot each colour means."""
    out = {}
    for name, hx in ((manifest or {}).get("base_slots") or {}).items():
        if name in SLOT_HEX and isinstance(hx, str) and HEX.fullmatch(hx.strip()):
            out[_hex6(hx.strip())] = SLOT_HEX[name]
    return out


def apply_remap(text: str, remap: dict) -> tuple[str, int]:
    n = 0
    def sub(m):
        nonlocal n
        h = _hex6(m.group(0))
        if h in remap and remap[h] != h:
            n += 1; return remap[h].upper()
        return m.group(0)
    return HEX.sub(sub, text), n
BANNED = {"text", "image", "foreignObject", "script"}
FLAGGED = {"filter", "mask", "linearGradient", "radialGradient"}
HEX = re.compile(r"#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b")
SVG_INLINE = re.compile(r"<svg\b[^>]*\bdata-asset\s*=\s*\"([^\"]+)\"[^>]*>.*?</svg>", re.S | re.I)
SVG_ANY = re.compile(r"<svg\b", re.I)


def _hex6(h):
    h = h.lower()
    return "#" + "".join(c * 2 for c in h[1:]) if len(h) == 4 else h


def _local(tag):
    return tag.rsplit("}", 1)[-1]


def gather(src: Path, work: Path):
    """-> ({asset_path: svg_text}, manifest or None, note)"""
    found, manifest, note = {}, None, ""
    if src.suffix.lower() in (".html", ".htm"):
        html = src.read_text(encoding="utf-8", errors="replace")
        for m in SVG_INLINE.finditer(html):
            found[m.group(1).strip("/").removesuffix(".svg")] = m.group(0)
        unnamed = len(SVG_ANY.findall(html)) - len(found)
        if unnamed:
            note = f"{unnamed} inline svg(s) without data-asset were skipped"
        mm = re.search(r"<script[^>]*id=\"loom-manifest\"[^>]*>(.*?)</script>", html, re.S)
        if mm:
            manifest = json.loads(mm.group(1))
        return found, manifest, note
    root = src
    if src.suffix.lower() == ".zip":
        with zipfile.ZipFile(src) as z:
            z.extractall(work)
        root = work
    mf = sorted(root.rglob("manifest.json"), key=lambda p: len(p.parts))
    if mf:
        manifest = json.loads(mf[0].read_text())
        root = mf[0].parent                        # paths in the manifest are relative to where it sits
    for f in sorted(root.rglob("*.svg")):
        found[f.relative_to(root).with_suffix("").as_posix()] = f.read_text(encoding="utf-8", errors="replace")
    return found, manifest, note


def kind_of(path, entry):
    if entry and entry.get("kind"):
        return entry["kind"]
    p = path.lower()
    for k in ("character_part", "character", "texture", "icon", "set_prop", "set", "prop"):
        if f"/{k}" in "/" + p or p.startswith(k):
            return k
    return "set"                                   # unknown: the larger budget, and the base palette


def check(path, text, entry):
    kind = kind_of(path, entry)
    problems, flags = [], []
    try:
        root = ET.fromstring(text)
    except ET.ParseError as e:
        return kind, [f"does not parse: {e}"], flags, set()
    if _local(root.tag) != "svg":
        problems.append("root element is not <svg>")
    # an accessory parented to a character part (a tote on the torso) is dressed from the character's palette
    accessory = bool(entry and entry.get("parent")) and kind in ("prop", "icon")
    allowed = CHARACTER if kind.startswith("character") or accessory else BASE
    if kind in SET_KINDS:
        # world-pack sets (docs/assets/world_prompts): the style's material palette, exact, and the set's structure
        sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
        from loom import set_styles as SS
        sid = set_style_of(path, entry)
        try:
            allowed = {h.lower() for h in SS.hexes(sid)} if sid else set()
        except Exception:  # noqa: BLE001
            allowed = set()
        if not allowed:
            problems.append(f"no known set_style for this {kind} ('{sid}'); name it in the manifest (packs/set_styles.json)")
        if kind == "set":
            ids = {el.attrib.get("id") for el in root.iter()}
            tops = [el.attrib.get("id") for el in list(root) if _local(el.tag) == "g"]
            order = [t for t in tops if t in ("far", "mid", "near")]
            if order != ["far", "mid", "near"]:
                problems.append(f"top-level layers must be far, mid, near in that order (found {tops[:6]})")
            if "frame_safe" not in ids:
                problems.append("no frame_safe rect (the visible 1920 x 1080 area)")
            if "anchor_floor_y" not in ids:
                problems.append("no anchor_floor_y")
            # drawn, not modelled: a set made only of straight-edged polygons was built by a program projecting boxes
            # (the meeting-room pilot, 2026-10-09: 3,075 polygons, no curve), and its chairs and cloth read as blocks
            shapes = [el for el in root.iter() if _local(el.tag) in ("path", "polygon", "polyline", "rect", "ellipse", "circle")]
            curved = [el for el in shapes if _local(el.tag) == "ellipse"
                      or (_local(el.tag) == "path" and re.search(r"[CcQqSsAa]", el.attrib.get("d", "")))]
            drawn = [el for el in shapes if not str(el.attrib.get("id", "")).startswith(("anchor_", "slot_", "frame_safe"))]
            if drawn and not curved:
                # a note, not a failure (D-151): Kshitij accepted the box-built meeting room ("they look enough chair
                # like in the human eyes"), so the look is his call at review, not the intake's
                flags.append(f"drawn only with straight-edged shapes ({len(drawn)} shapes, 0 curves): built from boxes; "
                             "judge the look at review")
            elif drawn:
                flags.append(f"{len(curved)} of {len(drawn)} shapes have curves")
            vb = (root.attrib.get("viewBox") or "").split()
            if vb[2:4] != ["2400", "1350"]:
                problems.append(f"viewBox must be 0 0 2400 1350 (found '{root.attrib.get('viewBox')}')")
    used = set()
    for el in root.iter():
        tag = _local(el.tag)
        if tag in BANNED:
            problems.append(f"<{tag}> is not allowed (text goes in slot_ rects; no images or scripts)")
        if tag in FLAGGED:
            flags.append(f"<{tag}> used (only allowed when the prompt asked for it)")
        for k, v in el.attrib.items():
            if _local(k) == "href" and not v.startswith("#"):
                problems.append(f"external reference {v[:60]}")
        style = " ".join(str(el.attrib.get(a, "")) for a in ("fill", "stroke", "stop-color", "style", "color"))
        for h in HEX.findall(style):
            h = _hex6(h)
            used.add(h)
            if h == "#000000" and kind not in SET_KINDS:
                if not (el.attrib.get("fill-opacity") or "fill-opacity" in el.attrib.get("style", "")
                        or el.attrib.get("opacity")):
                    problems.append("#000000 without fill-opacity (black is only for shade shapes)")
            elif h not in allowed:
                problems.append(f"colour {h} is not a contract slot for a {kind}")
    size = len(text.encode("utf-8"))
    if size > BUDGET.get(kind, 400_000):
        problems.append(f"{size // 1000} KB is over the {BUDGET.get(kind, 400_000) // 1000} KB budget for a {kind}")
    if kind == "character_part" and not (entry and entry.get("pivot")):
        problems.append("character part has no pivot in the manifest")
    return kind, sorted(set(problems)), sorted(set(flags)), used


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("src"); ap.add_argument("--batch", required=True)
    ap.add_argument("--out", default="assets/incoming")
    ap.add_argument("--declared-slots", action="store_true",
                    help="for props and sets, map colours to contract slots using the manifest's own base_slots "
                         "{name: hex} before checking; each remap is reported (opt-in, default off)")
    a = ap.parse_args(argv)
    src = Path(a.src)
    with tempfile.TemporaryDirectory(prefix="loom_intake_") as td:
        found, manifest, note = gather(src, Path(td))
    if not found:
        print(f"no assets found in {src} (a zero is not a result)" + (f"; {note}" if note else ""))
        return 2
    entries = {}
    for e in (manifest or {}).get("assets", []):
        entries[str(e.get("file", "")).strip("/").removesuffix(".svg")] = e
    dest = Path(a.out) / a.batch
    dest.mkdir(parents=True, exist_ok=True)
    rows, failed, review_only, unlisted = [], 0, [], []
    remap = declared_remap(manifest) if a.declared_slots else {}
    remapped = {}
    for path, text in sorted(found.items()):
        if path.split("/")[0] in REVIEW_DIRS:
            review_only.append(path); continue           # preview-coloured copies for people, never imported
        if entries and path not in entries:
            unlisted.append(path); continue              # composites and sheets the manifest does not list
        if remap and kind_of(path, entries.get(path)) in ("prop", "set", "icon") and not (entries.get(path) or {}).get("parent"):
            text, n = apply_remap(text, remap)
            if n:
                remapped[path] = n
        kind, probs, flags, used = check(path, text, entries.get(path))
        f = dest / f"{path}.svg"
        f.parent.mkdir(parents=True, exist_ok=True)
        f.write_text(text, encoding="utf-8")
        ids = re.findall(r'id="((?:slot|anchor)_[^"]+)"', text)
        failed += bool(probs)
        rows.append((path, kind, "FAIL" if probs else "PASS", probs, flags, ids, len(used)))
    missing = sorted(set(entries) - set(found))
    if manifest is None:
        manifest = {"batch": a.batch, "assets": [{"file": f"{p}.svg", "kind": k} for p, k, *_ in rows],
                    "note": "built by tools/asset_intake.py: no manifest.json was supplied"}
    (dest / "manifest.json").write_text(json.dumps(manifest, indent=1))
    lines = [f"# Intake: {a.batch}", "", f"Source: `{src.name}`. {len(rows)} asset(s), {failed} failing."
             + (f" {note}." if note else ""), ""]
    if a.declared_slots:
        lines += [f"**--declared-slots:** the manifest's base_slots gave {len(remap)} colour(s) a contract slot "
                  f"({', '.join(f'{k}->{v}' for k, v in sorted(remap.items()))}); recoloured: "
                  + (", ".join(f"`{p}` ({n})" for p, n in sorted(remapped.items())) or "none") + ".", ""]
    if missing:
        lines += [f"**In the manifest but not delivered:** {', '.join(missing)}", ""]
    if review_only:
        lines += [f"**Review copies, not checked or imported ({len(review_only)}):** files under "
                  f"{', '.join(sorted({p.split('/')[0] + '/' for p in review_only}))} (preview colours, for people only).", ""]
    if unlisted:
        lines += [f"**Not in the manifest, so not imported ({len(unlisted)}):** {', '.join(unlisted)}. If any of these "
                  "should be used by the engine (a hand, a mouth, an expression), ask for it as its own listed part.", ""]
    for path, kind, verdict, probs, flags, ids, ncol in rows:
        lines.append(f"- **{verdict}** `{path}` ({kind}, {ncol} colours; {len(ids)} slot/anchor ids)")
        lines += [f"  - {p}" for p in probs] + [f"  - note: {fl}" for fl in flags]
    (dest / "INTAKE.md").write_text("\n".join(lines) + "\n")
    print("\n".join(lines))
    if not rows:
        print("nothing importable was found (only review copies or unlisted files): a zero is not a result")
        return 2
    return 1 if failed or missing else 0


if __name__ == "__main__":
    sys.exit(main())

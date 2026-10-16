"""Visual storytelling (D-62): the storyboard says what the lesson LOOKS like as a story, and the engine
checks it and shows it before anyone builds a scene.

Fields (all optional, all in plan/storyboard.json; see docs/STORYBOARD_GUIDE.md "Visual storytelling"):
  story: {metaphor, setting, arc, cast: [{name, rig, role}]}   the one visual idea the lesson lives inside
  scenes[].shot.size   establishing | wide | medium | close | insert | overhead | pov
  scenes[].depth       flat | layered | iso | 3d                how deep the picture is
  scenes[].light       even | key | spotlight | silhouette | night | dawn | glow
  scenes[].story_role  hook | setup | turn | reveal | payoff | practice   what this beat does in the story

story_warnings() never blocks. It returns two kinds of note:
  - CORRECTNESS notes: the plan asks for something the engine cannot draw (depth on a flat template, a
    rig that does not exist). These are facts about the build.
  - SUGGESTIONS, prefixed "story (suggestion)": questions a storyteller would ask. They are REFERENCES,
    not rules (D-64). Every kind of video gets them, because every learning video should be interesting as
    well as sound (D-67); the kind of video only changes which form of story is suggested (STORY_FORM).
    `story.dial: "off"` switches them off for one lesson.
animatic() draws one panel per beat from the plan alone (no scene code needed), timed to the narration
when it exists, so the story can be reviewed before the build.
"""
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

from .util import ENGINE_ROOT, read_json, info

SHOTS = ("establishing", "wide", "medium", "close", "insert", "overhead", "pov")
DEPTHS = ("flat", "layered", "iso", "3d")
LIGHTS = ("even", "key", "spotlight", "silhouette", "night", "dawn", "glow")
ROLES = ("hook", "setup", "turn", "reveal", "payoff", "practice")
DEEP_KINDS = {"layered": ("bespoke", "skia"), "iso": ("bespoke", "three"), "3d": ("three",)}


# Every kind of video should be interesting and easy to follow (D-67): attention is scarce today, and the
# classic principles are respected but not the whole story. What CHANGES by kind is the form the story takes,
# so the suggestion names the form that usually fits (packs/genres/*.md say more). References, not rules.
STORY_FORM = {
    "policy": "a realistic workplace moment with a decision and its consequence, and a character the learner recognises",
    "compliance": "a realistic workplace moment with a decision and its consequence, and a character the learner recognises",
    "teaching": "a running example or character the idea happens to, and one picture for the part that moves",
    "onboarding": "a place to find your way around, with the new starter as the character",
    "soft-skills": "people doing the thing: a small cast, a scenario with a turn, reactions on the key moment",
    "explainer": "a governing metaphor or a mechanism shown running, with one depth or 3D moment where there is a place",
}


def story_warnings(sb: dict, beats: list[str], genre: str | None = None, look: dict | None = None) -> list[str]:
    W = []
    scenes = [s for s in sb.get("scenes", []) if s.get("beat") in beats]
    n = len(scenes)
    story = sb.get("story") or {}
    look = look or {}
    # the person's own answer wins: a lesson they asked to keep plain gets no story suggestions (D-70)
    quiet = story.get("dial") == "off" or look.get("story") == "plain"
    form = STORY_FORM.get(str(genre or "").lower(), STORY_FORM["teaching"])
    S = "story (suggestion): "
    if not quiet:
        if n >= 4 and not (story.get("metaphor") or story.get("setting") or story.get("cast")):
            W.append(S + f"no story is named yet (story.metaphor, setting or cast). For this kind of video that is often {form} "
                     "(skill lnd-visual-storyteller)")
        sizes = [(s.get("shot") or {}).get("size") for s in scenes]
        declared = [z for z in sizes if z]
        if n >= 6 and not declared:
            W.append(S + "no shot sizes are planned (scenes[].shot.size); planning wide, medium and close keeps the "
                     "picture changing and helps the camera follow the argument")
        elif len(declared) >= 6:
            top = max(set(declared), key=declared.count)
            if declared.count(top) / len(declared) > 0.7:
                W.append(S + f"{declared.count(top)}/{len(declared)} shots are '{top}'; would a wider or closer shot help "
                         "the learner see where they are or what matters?")
        depths = [s.get("depth") or "flat" for s in scenes]
        if n >= 8 and all(d == "flat" for d in depths):
            W.append(S + "every scene is flat; a depth moment (a layered hook, an iso system, a 3D object) can lift the "
                     "places where the story has a setting")
    roles = [s.get("story_role") for s in scenes if s.get("story_role")]
    if roles and "payoff" not in roles and not quiet:
        W.append(S + "story roles are declared but no beat is the payoff: which beat lands the idea?")
    for s in scenes:
        d = s.get("depth")
        if d in DEEP_KINDS and s.get("kind") not in DEEP_KINDS[d]:
            W.append(f"{s['beat']}: depth '{d}' on a {s.get('kind')} scene cannot be drawn: templates are flat; build it as "
                     f"{' or '.join(DEEP_KINDS[d])} (ctx.depth, ctx.iso or a three clip), or plan it flat")
    rigs = {p.stem for p in (ENGINE_ROOT / "runtime" / "rigs").glob("*.js")}
    have = set()
    for f in rigs:
        have |= set(re.findall(r'person\("(\w+)"', (ENGINE_ROOT / "runtime" / "rigs" / f"{f}.js").read_text(encoding="utf-8")))
        have |= set(re.findall(r'rig\.define\("(\w+)"', (ENGINE_ROOT / "runtime" / "rigs" / f"{f}.js").read_text(encoding="utf-8")))
        # outlined people are declared through a helper, bean("pip", ...): the list missed them (L-140)
        have |= set(re.findall(r'\bbean\("(\w+)"', (ENGINE_ROOT / "runtime" / "rigs" / f"{f}.js").read_text(encoding="utf-8")))
    have |= {p.stem for p in (ENGINE_ROOT / "assets" / "rigs").glob("*.json")}   # imported rigs (D-93)
    for c in story.get("cast") or []:
        if c.get("rig") and c["rig"] not in have:
            W.append(f"story.cast {c.get('name')}: no rig '{c['rig']}' (have: {', '.join(sorted(have)) or 'none'})")
    # reference-first (D-87): every drawn beat should name what it took its design from (a board in docs/references/,
    # a reference URL, or a local study frame). A note, never a rule: it names the beats that have none.
    drawn = [s for s in scenes if s.get("kind") in ("bespoke", "blueprint", "manim", "skia", "three", "page")]
    unref = [s.get("beat") for s in drawn if not ((s.get("design") or {}).get("references") or s.get("references"))]
    if drawn and unref and not sb.get("references"):
        W.append(f"reference (suggestion): {len(unref)} of {len(drawn)} drawn beats name no design reference "
                 f"({', '.join(unref[:8])}). Look at existing work first and record it in design.references "
                 "(docs/REFERENCE_FIRST.md)")
    # draw the subject (D-90, B1): a drawn beat names the noun it shows ("subject": "data centre"), and the scene
    # draws THAT, not a pill or a card that says it. A world per shot (B2): "world" names the setting; one world for
    # the whole lesson reads as one slide deck. Notes, never rules.
    nosub = [s.get("beat") for s in drawn if not (s.get("subject") or (s.get("design") or {}).get("subject"))]
    if drawn and nosub:
        W.append(f"subject (suggestion): {len(nosub)} of {len(drawn)} drawn beats name no subject ({', '.join(nosub[:8])}). "
                 "Name the noun the beat shows and draw it as a thing (Loom.obj, Loom.art, a place, a data picture), "
                 "not as a pill or a card (docs/styles/CINEMA_PLAN.md, B1)")
    worlds = [s.get("world") or (s.get("design") or {}).get("world") for s in drawn]
    named = [w for w in worlds if w]
    if len(drawn) >= 4 and named and len(set(named)) == 1 and len(named) == len(drawn):
        W.append(f"world (suggestion): every drawn beat is set in '{named[0]}'. A new world every 15 to 20 s keeps the "
                 "picture changing (CINEMA_PLAN B2)")
    # openings and closings (B9): the ending calls back to the opening image (the same subject or world)
    def _key(s_):
        return (s_.get("subject") or (s_.get("design") or {}).get("subject"), s_.get("world") or (s_.get("design") or {}).get("world"))
    if len(drawn) >= 4:
        (s0, w0), (s1, w1) = _key(drawn[0]), _key(drawn[-1])
        if (s0 or w0) and (s1 or w1) and not ((s0 and s0 == s1) or (w0 and w0 == w1)):
            W.append(f"callback (suggestion): the last drawn beat ({drawn[-1].get('beat')}) does not return to the opening's "
                     "subject or world. The reference films close on the opening image, changed by what was learned (CINEMA_PLAN B9)")
    return W


# --------------------------------------------------------------------------- animatic
def _font(size: int, bold=False):
    from PIL import ImageFont
    for f in (["inter-latin-700-normal.ttf"] if bold else []) + ["inter-latin-500-normal.ttf", "nunito-latin-700-normal.ttf"]:
        p = ENGINE_ROOT / "models" / "fonts" / f
        if p.exists():
            return ImageFont.truetype(str(p), size)
    for p in ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
              "C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/arial.ttf"):
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def _text(v) -> str:
    """narration and intents may be a string or a list of phrases"""
    if isinstance(v, list):
        return " ".join(x if isinstance(x, str) else str(x.get("text", "")) for x in v)
    return str(v or "")


def _wrap(d, text, font, width):
    out, line = [], ""
    for w in str(text).split():
        t = (line + " " + w).strip()
        if d.textlength(t, font=font) > width and line:
            out.append(line); line = w
        else:
            line = t
    if line:
        out.append(line)
    return out


def _panel(scene: dict, beat: dict, story: dict, style: dict, dur: float, idx: int, total: int, frame: Path | None):
    """One animatic panel (1280 x 720): the shot drawn as a frame guide over the plan, with its notes."""
    from PIL import Image, ImageDraw
    pal = style["palette"]
    hexc = lambda h: tuple(int(h.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4))
    W, H = 1280, 720
    im = Image.new("RGB", (W, H), hexc(pal["field"]))
    d = ImageDraw.Draw(im)
    ink, muted, acc = hexc(pal["ink"]), hexc(pal["muted"]), hexc(pal["accent"])
    # the picture area: a built frame when one exists, else a sketch of the shot
    box = (40, 40, 840, 490)
    if frame and frame.exists():
        fr = Image.open(frame).convert("RGB").resize((800, 450)); im.paste(fr, (40, 40))
    else:
        d.rectangle(box, outline=muted, width=3)
        size = (scene.get("shot") or {}).get("size") or "medium"
        inset = {"establishing": 0, "wide": 30, "medium": 90, "close": 150, "insert": 190, "overhead": 40, "pov": 60}.get(size, 90)
        d.rectangle((box[0] + inset, box[1] + inset * 0.56, box[2] - inset, box[3] - inset * 0.56), outline=acc, width=4)
        depth = scene.get("depth") or "flat"
        if depth == "layered":
            for k, y in enumerate((330, 380, 430)):
                d.line([(box[0] + 10, y + 20), (300, y - 10), (560, y + 15), (box[2] - 10, y - 5)], fill=muted, width=3 + k)
        elif depth == "iso":
            cx, cy = 440, 300
            d.polygon([(cx, cy - 70), (cx + 120, cy), (cx, cy + 70), (cx - 120, cy)], outline=muted)
        elif depth == "3d":
            d.rectangle((380, 200, 500, 320), outline=muted, width=3); d.line([(380, 200), (420, 170), (540, 170), (500, 200)], fill=muted, width=3)
            d.line([(540, 170), (540, 290), (500, 320)], fill=muted, width=3)
        what = scene.get("template") or scene.get("blueprint") or scene.get("scene") or scene.get("kind")
        f = _font(30, True)
        d.text(((box[0] + box[2]) / 2, (box[1] + box[3]) / 2), str(what), font=f, fill=ink, anchor="mm")
        declared = (scene.get("shot") or {}).get("size")
        d.text((box[0] + 16, box[1] + 12), f"{size} shot" if declared else "shot size not declared", font=_font(22), fill=muted)
    # the notes column
    x = 870
    d.text((x, 44), f"{beat['id']}  ({idx}/{total})", font=_font(30, True), fill=ink)
    d.text((x, 88), f"{dur:.1f} s   {scene.get('kind')}", font=_font(22), fill=muted)
    y = 130
    for label, val in (("role", scene.get("story_role")), ("shot", (scene.get("shot") or {}).get("size")),
                       ("depth", scene.get("depth")), ("light", scene.get("light")), ("join", (scene.get("join_in") or {}).get("type")),
                       ("station", scene.get("station"))):
        if val:
            d.text((x, y), f"{label}:", font=_font(22), fill=muted); d.text((x + 110, y), str(val), font=_font(22, True), fill=ink); y += 34
    ft = _font(20)
    for line in _wrap(d, _text(scene.get("rationale") or beat.get("visual_intent") or ""), ft, 370)[:8]:
        d.text((x, y + 8), line, font=ft, fill=muted); y += 28
    # narration under the picture
    fn = _font(24)
    for i, line in enumerate(_wrap(d, _text(beat.get("narration")), fn, 1180)[:4]):
        d.text((50, 520 + i * 34), line, font=fn, fill=ink)
    # the story strip along the bottom
    d.rectangle((0, H - 50, W, H), fill=hexc(pal["field2"]))
    s = " | ".join(v for v in (story.get("metaphor"), story.get("setting")) if v) or "no story.metaphor declared"
    d.text((40, H - 38), s[:120], font=_font(22), fill=muted)
    d.rectangle((0, H - 6, int(W * idx / total), H), fill=acc)
    return im


def animatic(project, use_frames: bool = True) -> dict:
    """Write qa/animatic/ (one panel per beat), qa/animatic.jpg (the sheet) and qa/animatic.mp4 (timed)."""
    from PIL import Image
    sb = read_json(project.path("plan/storyboard.json"))
    script = read_json(project.path("plan/script.json"))
    style = read_json(ENGINE_ROOT / "packs/styles" / f"{sb['style']}.json")
    timings = (read_json(project.path("audio/timings.json")) if project.path("audio/timings.json").exists() else None)   # L-171: read_json(p, None) raises on a missing file
    tb = {b["id"]: b for b in (timings or {}).get("beats", [])}
    by = {s["beat"]: s for s in sb["scenes"]}
    frames = sorted(project.path("qa/frames").glob("*.png"), key=lambda p: float(p.stem)) if use_frames and project.path("qa/frames").exists() else []
    out = project.path("qa/animatic"); out.mkdir(parents=True, exist_ok=True)
    for old in out.glob("*.png"):
        old.unlink()
    panels, durs = [], []
    beats = script["beats"]
    for i, b in enumerate(beats, 1):
        t = tb.get(b["id"])
        if t:
            dur = max(1.5, t["speech_end"] - t["speech_start"] + (t.get("pause_after") or 0) + 0.6)
            mid = (t["speech_start"] + t["speech_end"]) / 2
            fr = min(frames, key=lambda p: abs(float(p.stem) - mid)) if frames else None
            if fr and not (t["speech_start"] - 0.5 <= float(fr.stem) <= t["speech_end"] + 1.0):
                fr = None
        else:
            dur = max(2.5, len(_text(b.get("narration")).split()) / 2.6)
            fr = None
        im = _panel(by.get(b["id"], {"kind": "?"}), b, sb.get("story") or {}, style, dur, i, len(beats), fr)
        p = out / f"{i:03d}_{b['id']}.png"; im.save(p); panels.append(p); durs.append(dur)
    # the sheet
    cols = 4; rows = (len(panels) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * 646 + 6, rows * 370 + 6), (17, 17, 17))
    for k, p in enumerate(panels):
        sheet.paste(Image.open(p).resize((640, 360)), (6 + (k % cols) * 646, 6 + (k // cols) * 370))
    sheet_path = project.path("qa/animatic.jpg"); sheet.save(sheet_path, quality=88)
    # the timed video: panels for their durations, with the narration when it exists
    lst = out / "concat.txt"
    lst.write_text("".join(f"file '{p.name}'\nduration {d:.3f}\n" for p, d in zip(panels, durs)) + f"file '{panels[-1].name}'\n")
    mp4 = project.path("qa/animatic.mp4")
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(lst)]
    wav = project.path("audio/narration.wav")
    if timings and wav.exists():
        cmd += ["-i", str(wav), "-c:a", "aac", "-b:a", "128k", "-shortest"]
    # an explicit length: -shortest alone ends at the AUDIO on newer FFmpeg builds (Windows, L-125: 249.75 s of
    # video for 242.85 s of panels), so the animatic would run past its last panel
    cmd += ["-t", f"{sum(durs):.3f}", "-vf", "fps=24,format=yuv420p", "-c:v", "libx264", "-preset", "veryfast", "-crf", "24", str(mp4)]
    ok = subprocess.run(cmd).returncode == 0
    brief = read_json(project.path("plan/brief.json"), {}) or {}
    genre = brief.get("genre") or (project.request or {}).get("genre")
    W = story_warnings(sb, [b["id"] for b in beats], genre=genre, look=brief.get("look"))
    rep = {"panels": len(panels), "duration": round(sum(durs), 2), "sheet": str(sheet_path), "video": str(mp4) if ok else None,
           "timed_by": "narration" if timings else "estimate (2.6 words/s)", "warnings": W}
    (project.path("qa/animatic.json")).write_text(json.dumps(rep, indent=1))
    return rep

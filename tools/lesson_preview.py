"""Approximate frames of a COMPOSED lesson's bespoke beats WITHOUT a browser (a design aid, never the render).

    py tools/lesson_preview.py <project id> [--beats b03,b04,b05] [--at 18,22,27] [--out <dir>]

It reads the project's composed `build/manifest.json` (run `py -m loom run <id> compose` first): the beats, their
times, and the cue table compose resolved. It builds the chosen bespoke beats IN ORDER into one picture, as a
station would (a `continue` beat's `ctx.held(name)` returns the element the earlier beat built), and rasterises
the chosen times through `tools/node/svg_preview.mjs` (the same browser-free harness as tools/lab_preview.py).
Default times: one frame at the end of each beat's speech, where its picture is whole.

What it does NOT show: the world camera (each beat is drawn in its own station's 1920 x 1080), joins, exits of
elements at a join, templates and blueprints, captions, the presenter, WebGL fx. Text widths are estimated. It is
for judging a bespoke scene's composition and timing in the sandbox; `py -m loom run <id> check` and
`snapshot` on a machine with a browser are the truth (L-135, L-141).
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

_JS = r"""
(function () {
  const Loom = window.Loom, M = window.__LAB;
  Loom.assets = M.assets;
  if (Loom.rigImported) Loom.rigImported.install();   // imported rigs (D-93)
  Loom.style.install(M.style, "fonts");
  const root = document.getElementById("root");
  (async function () {
    await Loom.style.ready();
    Loom.tl = gsap.timeline({ paused: true });
    const svg = Loom.svg("svg", { width: 1920, height: 1080, viewBox: "0 0 1920 1080", style: "position:absolute;left:0;top:0" }, root);
    Loom.svg("rect", { x: 0, y: 0, width: 1920, height: 1080, fill: Loom.style.c("field") }, svg);
    const g = Loom.svg("g", {}, svg);
    const byName = {}, owners = new Map();   // element -> indexes of the beats that show it (its own, and any that hold it)
    const own = (E, i) => { if (!E) return; if (!owners.has(E)) owners.set(E, new Set()); owners.get(E).add(i); };
    M.beats.forEach((b, bi) => b.__i = bi);
    for (const b of M.beats) {
      const beat = b.beat;
      const cues = M.cues[beat.id] || {};
      const ctx = { beat, def: {}, props: {}, g, box: Object.assign({}, Loom.kit.SAFE), kit: Loom.kit, m: Loom.motion, ui: Loom.ui,
        style: Loom.style, c: (t) => Loom.style.c(t), start: beat.start, end: beat.end, speechStart: beat.speech_start, speechEnd: beat.speech_end,
        cue(a) { if (!(a in cues)) { Loom.error("cue_missing", beat.id + ": " + a); return beat.speech_start; } return cues[a]; },
        has(a) { return a in cues; }, at(f) { return beat.start + f * (beat.end - beat.start); },
        el(name, o) { const E = Loom.kit.element((o && o.parent) || g, name, o); byName[name] = E; own(E, b.__i); return E; },
        held(name) { const E = byName[name]; if (!E) Loom.error("held_missing", beat.id + ": " + name); own(E, b.__i); return E || Loom.kit.element(g, name, {}); },
        group() { return Loom.svg("g", { class: "lm-block" }, g); }, shift(grp, dx, dy) { grp.setAttribute("transform", `translate(${dx} ${dy})`); } };
      ctx.use = (ref, p, o) => Loom.useComponent(ctx, ref, p, o);
      ctx.character = (name, rig, o) => { const c = Loom.rig.place(ctx, name, rig, o); if (c) { byName[name] = c.E; own(c.E, b.__i); } return c; };
      ctx.depth = (name, o) => Loom.depth.stage(ctx, name, o);
      ctx.iso = (o) => Loom.iso.plane(ctx, o);
      ctx.scenery = (kind, name, o) => Loom.scenery[kind](ctx, name, o);
      ctx.crowd = (name, o) => Loom.scenery.crowd(ctx, name, o);
      ctx.narrationCard = (name, text, t, o) => Loom.scenery.narrationCard(ctx, name, text, t, o);
      ctx.fxMoment = (kind, t0, t1) => t1;
      Loom.ctxBeat = beat;
      try { Loom.scenes[b.scene].build(ctx, {}); } catch (e) { Loom.error("scene_threw", beat.id + ": " + String(e && e.stack || e)); }
      Loom.ctxBeat = null;
    }
    Loom.tl.set({}, {}, M.dur);
    window.__cases = 1; window.__times = M.times;
    // only the beat on screen at t is shown (a stand-in for the joins and the camera, which are not previewed)
    window.__show = (i, t) => {
      Loom.tl.seek(t, false);
      for (const [E, set] of owners) {
        const on = [...set].some((k) => M.beats[k].beat.start <= t && t < M.beats[k].beat.end);
        E.outer.style.display = on ? "" : "none";
      }
      return null;
    };
    window.__sheet_ready = true;
  })();
})();
"""


def main(argv=None):
    from loom.compose import RUNTIME_ORDER, load_style
    from loom.util import read_json
    from PIL import Image, ImageDraw
    import cairosvg
    sys.path.insert(0, str(ROOT / "tools"))
    from lab_preview import install_fonts
    ap = argparse.ArgumentParser()
    ap.add_argument("id"); ap.add_argument("--beats"); ap.add_argument("--at"); ap.add_argument("--out")
    a = ap.parse_args(argv)
    proj = ROOT / "projects" / a.id
    man = read_json(proj / "build" / "manifest.json")
    if not man:
        print("no build/manifest.json: compose the lesson first"); return 2
    beats = {b["id"]: b for b in man["beats"]}
    scenes = [s for s in man["scenes"] if s.get("kind") == "bespoke"]
    if a.beats:
        want = a.beats.split(",")
        scenes = [s for s in scenes if s["beat"] in want]
    if not scenes:
        print("no bespoke beat matches (a zero is not a result)"); return 2
    times = [float(x) for x in a.at.split(",")] if a.at else [round(beats[s["beat"]]["speech_end"] - 0.1, 2) for s in scenes]
    # the composed style carries the lesson's design seed and brand: use it as built (fall back to the pack by id)
    style = man["style"] if isinstance(man["style"], dict) and man["style"].get("palette") else load_style(man["style"]["id"] if isinstance(man["style"], dict) else man["style"])
    install_fonts(style)
    tmp = Path(tempfile.mkdtemp(prefix="lmlesson_"))
    nm = ROOT / "node_modules"
    (tmp / "rt").mkdir(); (tmp / "fonts").mkdir()
    files = [nm / "gsap/dist/gsap.min.js"] + [ROOT / "runtime" / x for x in RUNTIME_ORDER if x != "boot.js"]
    files += sorted((ROOT / "runtime" / "rigs").glob("*.js")) + [ROOT / "runtime/templates/_helpers.js"]
    files += [proj / "scenes" / f"{s['scene']}.js" for s in scenes]
    tags = []
    for i, f in enumerate(files):
        shutil.copy2(f, tmp / "rt" / f"{i:02d}_{f.name}"); tags.append(f'<script src="rt/{i:02d}_{f.name}"></script>')
    M = {"style": style, "dur": man["duration"], "times": times, "cues": man["cues"],
         "beats": [{"beat": beats[s["beat"]], "scene": s["scene"]} for s in scenes],
         # the composed manifest's own assets (icons, peeps, vendor art, geography, imported rigs), so the preview
         # draws what the build draws (D-93: the scene authors had to patch this to see Maya)
         "assets": dict({"icons": read_json(ROOT / "assets/icons/lucide.json")["icons"], "peeps": read_json(ROOT / "assets/peeps/peeps.json")["peeps"], "lottie": {}},
                        **{k: v for k, v in (man.get("assets") or {}).items() if k in ("art", "geo", "rigs", "icons")})}
    html = ("<!doctype html><html><head><meta charset='utf-8'></head><body><div id='root'></div>" + "".join(tags)
            + f"<script>window.__LAB={json.dumps(M)};</script><script>{_JS}</script></body></html>")
    (tmp / "lab.html").write_text(html, encoding="utf-8")
    r = subprocess.run([shutil.which("node") or "node", str(ROOT / "tools/node/svg_preview.mjs"), str(tmp), str(tmp / "pv")], capture_output=True, text=True, timeout=600)
    if r.returncode != 0:
        print(r.stderr[-1500:]); return 1
    rep = json.loads((tmp / "pv" / "report.json").read_text())
    out = Path(a.out or ROOT / "cache" / "preview" / a.id); out.mkdir(parents=True, exist_ok=True)
    W_, H_ = 640, 360
    shots = rep["shots"]; cols = min(4, len(shots)); rows = (len(shots) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * (W_ + 6) + 6, rows * (H_ + 30) + 64), (17, 17, 17)); d = ImageDraw.Draw(sheet)
    d.text((10, 10), f"{a.id}: bespoke beats {', '.join(s['beat'] for s in scenes)}", fill=(255, 220, 90))
    d.text((10, 30), "PREVIEW (no browser): no camera, joins, templates, captions, blur or WebGL; text widths estimated. Not the render.", fill=(255, 120, 120))
    for i, s in enumerate(shots):
        png = Path(s["file"]).with_suffix(".png")
        cairosvg.svg2png(url=s["file"], write_to=str(png), output_width=1920, output_height=1080)
        x, y = 6 + (i % cols) * (W_ + 6), 64 + (i // cols) * (H_ + 30)
        sheet.paste(Image.open(png).convert("RGB").resize((W_, H_)), (x, y + 24))
        d.text((x + 4, y + 4), f"t = {s['t']:.2f}s", fill=(220, 220, 220))
        shutil.copy2(png, out / f"t{s['t']:06.2f}.png")
    f = out / "PREVIEW.jpg"; sheet.save(f, quality=88)
    shutil.rmtree(tmp, ignore_errors=True)
    errs = [f"{e.get('code')}: {e.get('msg')}" for e in rep.get("errors") or []]
    print(f"preview: {len(shots)} frames -> {f}")
    for e in errs[:30]:
        print("  runtime:", e[:300])
    return 0


if __name__ == "__main__":
    sys.exit(main())

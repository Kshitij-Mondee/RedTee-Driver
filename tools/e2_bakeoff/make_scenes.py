"""E2 bake-off (D-102): one 20 s corporate beat made four ways, with the SAME layout, camera and motion.

Only the art source differs:
  e2_a  today's engine drawing (Loom.place, rigged characters, Loom.obj): what a scene gets now
  e2_b  a kit designed by Claude in Cowork (assets/vendor/e2kit/*.svg), styleframe first, iterated on renders
  e2_c  AI-generated raster layers (assets/vendor/e2gen/*.png), made on Kshitij's PC by tools/e2_bakeoff/generate.py
  e2_d  the editorial register: no people, the document is the hero

Run: py tools/e2_bakeoff/make_scenes.py   (writes scenes_examples/lab/e2_*.js; the choreography is one string here,
so the four files cannot drift). Then: py -m loom lab e2_b --style corporate-clean
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LAB = ROOT / "scenes_examples" / "lab"
META = '{"title": "E2 bake-off %s: %s", "styles": ["corporate-clean"], "dur": 20.0, "times": [2.5, 6.0, 9.0, 14.0, 18.5]}'

# The beat (hypothetical, no facts): "Priya slides the quarterly report across the desk. Page four: the numbers are
# right, but the chart tells the wrong story. Dev leans in, and sees it."
CORE = r"""
  // ---- the shared choreography (identical in e2_a .. e2_d): ONE clock drives every move (seekable in any order)
  const W = 1920, H = 1080, sv = (t, a, p) => Loom.svg(t, a, p);
  const lerp = (a, b, v) => a + (b - a) * v;
  const io = (v) => (v <= 0 ? 0 : v >= 1 ? 1 : v < 0.5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2);
  const win = (t, t0, d) => io((t - t0) / d);
  const world = sv("g", {}, ctx.g);
  const L = { bg: sv("g", {}, world), back: sv("g", {}, world), people: sv("g", {}, world), desk: sv("g", {}, world), top: sv("g", {}, world) };
  const SEAT_L = [560, 770], SEAT_R = [1370, 770], DOC0 = [760, 688], DOC1 = [1150, 688];
  const parts = ART.build({ L, W, H, SEAT_L, SEAT_R });
  const doc = sv("g", {}, L.top);
  ART.doc(doc);
  // the insert: page four, close (the same in every variant: it is not what E2 tests)
  const ins = sv("g", { opacity: 0 }, ctx.g);
  sv("rect", { x: 0, y: 0, width: W, height: H, fill: "#1b1a18", opacity: 0.55 }, ins);
  const pg = sv("g", { transform: "translate(560 110)" }, ins);
  sv("rect", { x: 8, y: 12, width: 800, height: 860, rx: 6, fill: "#000", opacity: 0.18 }, pg);
  sv("rect", { x: 0, y: 0, width: 800, height: 860, rx: 6, fill: "#FBF8F2" }, pg);
  const tx = (s, x, y, size, fill, weight) => { const t = sv("text", { x, y, "font-family": "Inter, sans-serif", "font-size": size, fill: fill || "#3A3530", "font-weight": weight || 400 }, pg); t.textContent = s; return t; };
  tx("Quarterly report", 56, 92, 40, "#3A3530", 700); tx("Page 4  |  Customer renewals", 56, 136, 26, "#7C746B");
  sv("line", { x1: 120, y1: 640, x2: 744, y2: 640, stroke: "#3A3530", "stroke-width": 3 }, pg);
  sv("line", { x1: 120, y1: 250, x2: 120, y2: 640, stroke: "#3A3530", "stroke-width": 3 }, pg);
  [0.62, 0.64, 0.66, 0.65, 0.67].forEach((b, i) => sv("rect", { x: 160 + i * 116, y: 640 - (b - 0.6) * 5200, width: 72, height: (b - 0.6) * 5200, fill: i === 4 ? "#C9743F" : "#9DB3BC" }, pg));
  tx("60%", 52, 646, 24, "#7C746B"); tx("68%", 52, 262, 24, "#7C746B");
  const ring = sv("ellipse", { cx: 90, cy: 640, rx: 70, ry: 38, fill: "none", stroke: "#E2B13C", "stroke-width": 7, "stroke-dasharray": 460, "stroke-dashoffset": 460 }, pg);
  tx("The axis starts at 60%.", 56, 730, 30, "#3A3530", 600);
  tx("A one-point change looks like a jump.", 56, 772, 30, "#3A3530");
  function at(t) {
    // camera: wide (1.0) -> two-shot push on the desk (1.16) -> lean push on Dev (1.34)
    const a = win(t, 1.5, 3.0), b = win(t, 11.0, 4.0);
    const s = lerp(lerp(1, 1.16, a), 1.34, b), cx = lerp(960, 1180, b), cy = lerp(lerp(540, 600, a), 560, b);
    world.setAttribute("transform", `translate(${(960 - cx * s).toFixed(2)} ${(540 - cy * s).toFixed(2)}) scale(${s.toFixed(4)})`);
    // Priya's small push of the report, Dev leans in (whole figures about the hip, as a kit or a raster layer allows)
    if (parts.priya) parts.priya.setAttribute("transform", `rotate(${(4 * Math.sin(Math.PI * win(t, 4.2, 0.6))).toFixed(3)} ${SEAT_L[0]} ${SEAT_L[1]})`);
    if (parts.dev) parts.dev.setAttribute("transform", `rotate(${(-7 * win(t, 11.6, 1.0)).toFixed(3)} ${SEAT_R[0]} ${SEAT_R[1]})`);
    // the report slides across the desk
    const d = win(t, 4.5, 2.0);
    doc.setAttribute("transform", `translate(${lerp(DOC0[0], DOC1[0], d).toFixed(2)} ${lerp(DOC0[1], DOC1[1], d).toFixed(2)}) rotate(${lerp(-6, 5, d).toFixed(3)})`);
    // the insert in and out, the ring drawn on "page four"
    ins.setAttribute("opacity", (win(t, 7.4, 0.5) * (1 - win(t, 10.6, 0.45))).toFixed(3));
    ring.setAttribute("stroke-dashoffset", (460 * (1 - win(t, 8.6, 0.9))).toFixed(1));
  }
  const clock = { t: 0 };
  Loom.tween(clock, { t: 0 }, { t: 20, duration: 20, ease: "none", onUpdate: () => at(clock.t) }, 0, { kind: "reveal", name: "e2_clock" });
  at(0);
"""

ART = {
    "a": ("today's engine drawing", r"""
  const ART = {
    build({ L, SEAT_L, SEAT_R }) {
      const room = Loom.place.office(ctx, "room", { side: "left", facing: "viewer", parent: L.bg });
      const pri = ctx.character("priya", "ava", { x: SEAT_L[0], y: 1120, scale: 0.9, top: "accent", parent: L.people });
      const dev = ctx.character("dev", "sam", { x: SEAT_R[0], y: 1120, scale: 0.9, flip: true, parent: L.people });
      if (pri) pri.pose("explain", 4.0); if (dev) dev.pose("think", 11.6);
      const desk = sv("g", {}, L.desk);
      Loom.kit.rect(desk, 300, 690, 1320, 44, { fill: "surface", r: 8, crisp: true });
      Loom.kit.rect(desk, 340, 734, 1240, 400, { fill: "surface2", r: 0, crisp: true });
      return { priya: pri && pri.E && pri.E.g, dev: dev && dev.E && dev.E.g };
    },
    doc(g) { Loom.obj.shape(g, "document", 0, 0, 170, { key: "e2doc", detail: 2, shadow: false }); },
  };""", 'ava'),
    "b": ("a kit designed by Claude in Cowork", r"""
  const ART = {
    build({ L }) {
      Loom.art.shape(L.bg, "e2kit:room", 960, 540, 1920, { colors: "keep" });
      const pri = sv("g", {}, L.people), dev = sv("g", {}, L.people);
      Loom.art.shape(pri, "e2kit:priya", 560, 520, 600, { colors: "keep" });
      Loom.art.shape(dev, "e2kit:dev", 1370, 520, 600, { colors: "keep" });
      Loom.art.shape(L.desk, "e2kit:desk", 960, 860, 1560, { colors: "keep" });
      return { priya: pri, dev };
    },
    doc(g) { Loom.art.shape(g, "e2kit:report", 0, 0, 190, { colors: "keep" }); },
  };""", None),
    "c": ("AI-generated raster layers", r"""
  const ART = {
    build({ L }) {
      Loom.art.shape(L.bg, "e2gen:room", 960, 540, 1920, { colors: "keep" });
      const pri = sv("g", {}, L.people), dev = sv("g", {}, L.people);
      Loom.art.shape(pri, "e2gen:priya", 560, 520, 600, { colors: "keep" });
      Loom.art.shape(dev, "e2gen:dev", 1370, 520, 600, { colors: "keep" });
      Loom.art.shape(L.desk, "e2gen:desk", 960, 860, 1560, { colors: "keep" });
      return { priya: pri, dev };
    },
    doc(g) { Loom.art.shape(g, "e2gen:report", 0, 0, 190, { colors: "keep" }); },
  };""", None),
    "d": ("the editorial register (no people)", r"""
  const ART = {
    build({ L, W, H, SEAT_L, SEAT_R }) {
      sv("rect", { x: -400, y: -400, width: W + 800, height: H + 800, fill: "#EFEAE1" }, L.bg);
      for (let i = 0; i < 14; i++) sv("line", { x1: -400, y1: 60 + i * 80, x2: W + 400, y2: 60 + i * 80, stroke: "#E2DBCF", "stroke-width": 2 }, L.bg);
      sv("rect", { x: 260, y: 640, width: 1400, height: 6, fill: "#3A3530" }, L.desk);
      const name = (s, x, role, g, col) => {
        sv("circle", { cx: x, cy: 430, r: 58, fill: col }, g);
        const i = sv("text", { x, y: 452, "text-anchor": "middle", "font-family": "Inter, sans-serif", "font-size": 58, "font-weight": 700, fill: "#FBF8F2" }, g); i.textContent = s[0];
        const t = sv("text", { x, y: 560, "text-anchor": "middle", "font-family": "Inter, sans-serif", "font-size": 64, "font-weight": 700, fill: "#3A3530" }, g); t.textContent = s;
        const r = sv("text", { x, y: 612, "text-anchor": "middle", "font-family": "Inter, sans-serif", "font-size": 28, fill: "#7C746B" }, g); r.textContent = role; };
      const pri = sv("g", {}, L.people), dev = sv("g", {}, L.people);
      name("Priya", SEAT_L[0], "wrote the report", pri, "#2F5560"); name("Dev", SEAT_R[0], "presents it tomorrow", dev, "#C9743F");
      return { priya: pri, dev };
    },
    doc(g0) {
      const g = sv("g", { transform: "scale(1.25)" }, g0);
      sv("rect", { x: -78, y: -104, width: 156, height: 208, rx: 4, fill: "#FBF8F2", stroke: "#3A3530", "stroke-width": 3 }, g);
      [0, 1, 2, 3].forEach((i) => sv("rect", { x: -54, y: -70 + i * 26, width: i === 0 ? 90 : 108, height: 8, fill: "#B9B1A6" }, g));
      [0.5, 0.55, 0.6, 0.9].forEach((b, i) => sv("rect", { x: -50 + i * 26, y: 80 - b * 60, width: 18, height: b * 60, fill: i === 3 ? "#C9743F" : "#9DB3BC" }, g));
    },
  };""", None),
}

for k, (title, art, _) in ART.items():
    src = ("// @lab " + META % (k.upper(), title) + "\n"
           "// Generated by tools/e2_bakeoff/make_scenes.py: edit the generator, not this file.\n"
           f'Loom.scene("e2_{k}", {{\n  build(ctx) {{' + art + CORE + "  },\n});\n")
    (LAB / f"e2_{k}.js").write_text(src, encoding="utf-8")
    print("wrote", LAB / f"e2_{k}.js")

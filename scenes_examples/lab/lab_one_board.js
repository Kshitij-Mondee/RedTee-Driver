// @lab {"title": "One board changed by additions: the system drawn once, then a highlight, a value and a note are added; nothing is replaced", "styles": ["chalk-lab", "dark-technical"], "dur": 7.0, "times": [0.6, 1.8, 3.0, 4.2, 5.4, 6.6]}
// A lab scene for the math-or-system register (docs/research/2026-10-01-visual-study.md): set the board up once,
// then change it by small additions (a highlight, a number, an annotation), so the learner never loses their
// bearings. Thin strokes, the parts in accent colours, serif symbols for the names of things.
Loom.scene("lab_one_board", {
  build(ctx) {
    const { kit, m } = ctx;
    const boxes = [["Request", 220], ["Review", 760], ["Release", 1300]];
    boxes.forEach(([label, x], i) => {
      const b = ctx.el(`stage_${i + 1}`, { x, y: 380, w: 400, h: 200, kind: "card" });
      kit.rect(b.inner, 0, 0, 400, 200, { fill: "surface", stroke: ["accent", "accent3", "accent2"][i], sw: 3 });
      kit.text(b.inner, label, { role: "title", x: 20, y: 40, w: 360, h: 120, align: "center", valign: "middle", weight: 700 });
      m.reveal(b, 0.3 + i * 0.35);
    });
    const a1 = ctx.el("flow_1", { x: 0, y: 0, w: 1920, h: 1080, kind: "connector" });
    const A1 = kit.arrow(a1.inner, 630, 480, 750, 480, { stroke: "line" });
    const a2 = ctx.el("flow_2", { x: 0, y: 0, w: 1920, h: 1080, kind: "connector" });
    const A2 = kit.arrow(a2.inner, 1170, 480, 1290, 480, { stroke: "line" });
    m.draw(A1, 1.2, { dur: 0.4 }); m.reveal(a1, 1.2, { dy: 0 });
    m.draw(A2, 1.5, { dur: 0.4 }); m.reveal(a2, 1.5, { dy: 0 });
    // addition 1: the step that matters gets a ring, nothing else changes
    const ring = ctx.el("focus", { x: 740, y: 360, w: 440, h: 240, kind: "shape" });
    kit.rect(ring.inner, 0, 0, 440, 240, { fill: "none", stroke: "accent4", sw: 4, r: 18 });
    m.reveal(ring, 2.4, { dy: 0 });
    // addition 2: the value lives on the board, under the step it describes
    const val = ctx.el("value", { x: 760, y: 640, w: 400, h: 110, kind: "text" });
    const V = kit.text(val.inner, "48 h", { role: "title", x: 0, y: 0, w: 400, h: 110, align: "center", valign: "middle", weight: 700, color: "accent4" });
    m.reveal(val, 3.3); m.count(V, 3.3, { from: 0, to: 48, fmt: (v) => `${Math.round(v)} h` });
    // addition 3: a note with a pointer, in the serif of the symbols
    const note = ctx.el("note", { x: 1240, y: 650, w: 520, h: 100, kind: "label" });
    kit.text(note.inner, "the wait sits here", { role: "label", x: 0, y: 0, w: 520, h: 100, valign: "middle" });
    const pn = ctx.el("note_arrow", { x: 0, y: 0, w: 1920, h: 1080, kind: "connector" });
    const P = kit.arrow(pn.inner, 1240, 700, 1170, 700, { stroke: "accent4", bend: 0 });
    m.reveal(note, 4.8); m.reveal(pn, 4.8, { dy: 0 }); m.draw(P, 4.8, { dur: 0.3 });
  },
});

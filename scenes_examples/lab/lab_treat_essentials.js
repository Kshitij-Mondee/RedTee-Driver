// @lab {"title": "Treatments: the same essentials (speech, panel, ticks, icons, labels, thought) drawn in each lesson's own form", "styles": ["glow-flat", "flat-cosmos"], "dur": 11.0, "times": [0.5, 1.4, 2.8, 4.6, 6.6, 8.2, 9.4, 10.6], "seeds": [{"name": "classic"}, {"name": "body", "shape": "organic", "label": "tag", "bubble": "wobble", "panel": "glass", "icon": "duotone", "mark": "brush", "texture": "grain", "entrance": "unfold"}, {"name": "rules", "shape": "architectural", "label": "stamp", "bubble": "note", "panel": "paper", "icon": "seal", "mark": "stamp", "texture": "paper", "entrance": "typeset"}, {"name": "tech", "shape": "angular", "label": "flag", "bubble": "chat", "panel": "frame", "icon": "tile", "mark": "box", "texture": "halftone", "entrance": "draw"}, {"name": "ops", "shape": "angular", "label": "ribbon", "bubble": "comic", "panel": "cutout", "icon": "ring", "mark": "stamp", "texture": "hatch", "entrance": "slide"}]}
// A lab scene for the design seed (D-80, D-81; docs/styles/DISTINCTNESS_PLAN.md step 3). ONE composition, the
// essentials a lesson keeps needing, drawn only through Loom.treat. Rendered once per seed, the same scene must
// read as five different lessons: same content, same layout, different FORM. "classic" is no seed at all, which
// must look like the engine did before (the pill, the round bubble, the card, the disc, the pop).
// Original content; absolute times; the handover is a made-up example.
Loom.scene("lab_treat_essentials", {
  build(ctx) {
    const T = Loom.treat, K = Loom.kit, M = Loom.motion;
    const floor = ctx.el("floor", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery" });
    K.line(floor.inner, 96, 930, 1824, 930, { stroke: "line", sw: 3, crisp: true });
    const ava = ctx.character("ava", "ava", { x: 330, y: 930, scale: 0.7, skin: 1, top: "accent" });
    const head = [ava.E.x + ava.E.w * 0.6, ava.E.y + ava.E.h * 0.14];
    M.reveal(ava.E, 0.1);
    // speech: someone asks for the handover
    const say = T.bubble(ctx, "ask", { x: 760, y: 220, w: 600, text: "Can you take the handover tonight?", tail: head, t: 0.5 });
    M.exit(say, 6.9, "recede");
    // a panel with three items, each ticked or crossed on its own beat
    const P = T.panel(ctx, "handover", { x: 1100, y: 300, w: 640, h: 450, title: "Handover", t: 1.4 });
    const rows = ["Open tickets listed", "Owner named", "Deadline agreed"];
    rows.forEach((r, i) => {
      const ry = P.content.y + 14 + i * 96;
      const tx = K.text(P.inner, r, { role: "body", x: P.content.x, y: ry, w: P.content.w - 110, h: 60, maxLines: 1, valign: "middle" });
      if (P.ink) tx.setAttribute("fill", P.ink);
      T.mark(ctx, "m" + i, { x: P.x + P.w - 78, y: P.y + ry + 30, size: 64, kind: i < 2 ? "yes" : "no", on: P, t: 2.8 + i * 0.6 });
    });
    // icons that stand for objects
    T.badge(ctx, "cal", { x: 700, y: 590, icon: "calendar", size: 132, tone: "accent4", t: 4.6, object: true });   // drawn objects are opt-in (D-100)
    T.badge(ctx, "mail", { x: 890, y: 590, icon: "mail", size: 132, tone: "accent3", t: 5.0, object: true });
    // small icons stay icons, in the seed's icon treatment (hero-size ones above become drawn objects, D-83)
    T.badge(ctx, "who", { x: 1200, y: 850, icon: "users", size: 84, tone: "accent4", t: 5.2 });
    T.badge(ctx, "talk", { x: 1320, y: 850, icon: "message-circle", size: 84, tone: "accent3", t: 5.4 });
    // a label on a part
    T.label(ctx, "due", { x: 720, y: 820, text: "Due Friday", to: [700, 664], tone: "accent2", t: 5.8 });
    // a thought, after the speech has gone
    T.bubble(ctx, "doubt", { x: 760, y: 230, w: 560, kind: "thought", text: "Who owns the deadline?", tail: head, t: 7.4 });
    // a second label on the crossed item
    T.label(ctx, "gap", { x: 1480, y: 850, text: "Missing", to: [P.x + P.w - 78, P.y + P.content.y + 14 + 2 * 96 + 60], tone: "neg", t: 8.6 });
  },
});

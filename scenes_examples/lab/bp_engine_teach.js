// @lab {"title": "blueprint ENGINE, the teaching register: a calm sheet that explains (three cards, two connectors, a revision cloud, a tracing overlay with the proposal, general notes)", "styles": ["blueprint"], "dur": 22.0, "times": [2.4, 6.0, 9.6, 13.4, 17.2, 21.4]}
/* The blueprint engine's TEACHING register (2026-10-16): the same sheet language (paper, drafted outlines, the technical
 * hand, cyan for what the narration names) at the density of a lesson that explains: one idea a frame, a few large
 * cards, connectors that carry a label, no dimensions unless a measure is the point. Signature moves of Loom's blueprint:
 * a revision cloud with its delta to say "this changed", a tracing overlay to show a proposal laid over today's
 * process, and a general-notes column that collects the lesson's points as it goes. */
Loom.scene("bp_engine_teach", {
  build(ctx) {
    const W = ctx.engine, D = W.sheet(ctx);

    const head = ctx.el("heading", { x: 120, y: 90, w: 1200, h: 80, kind: "text", exit: "wipe" });
    let t = D.letter(head, "How a change reaches production", { role: "title", at: 0.4, by: 2.2 });

    // ---- three cards, left to right, lettered large
    const cards = [
      { k: "request", x: 120, title: "Request", body: "a ticket says what changes and why", idx: 1 },
      { k: "review", x: 640, title: "Review", body: "a second engineer reads the diff", idx: 2 },
      { k: "release", x: 1160, title: "Release", body: "it ships behind a flag", idx: 3 },
    ];
    const C = {};
    for (const c of cards) {
      C[c.k] = ctx.el("card_" + c.k, { x: c.x, y: 320, w: 420, h: 210, kind: "card", exit: "recede" });
      t = D.card(C[c.k], c.title, { body: c.body, index: c.idx, at: t + 0.3 });
    }

    // ---- connectors between them, the label on the line's middle
    const flow = ctx.el("flow", { x: 0, y: 0, w: 1920, h: 1080, kind: "connector", exit: "recede" });
    t = D.connect(flow, 548, 425, 632, 425, { at: t + 0.2 });
    t = D.connect(flow, 1068, 425, 1152, 425, { at: t + 0.1 });

    // ---- what changed: a revision cloud round the review card, revision B
    const rev = ctx.el("rev_cloud", { x: 0, y: 0, w: 1920, h: 1080, kind: "mark", exit: "recede" });
    t = D.cloud(rev, 616, 296, 468, 258, { rev: "B", at: 10.4, by: 12.0 });

    // ---- the proposal on tracing paper, laid over the flow: an automatic check before review
    const ov = ctx.el("overlay_proposal", { x: 470, y: 600, w: 760, h: 210, kind: "panel", exit: "recede" });
    t = D.overlay(ov, { tag: "Proposed", at: 13.0 });
    const auto = ctx.el("card_auto", { x: 170, y: 60, w: 420, h: 120, kind: "card", parent: ov.inner, exit: "recede" });
    t = D.card(auto, "Automatic check", { index: "2a", at: 13.8, pen: "accent" });
    t = D.connect(flow, 850, 650, 850, 560, { at: t + 0.1, pen: "accent", label: "runs first", labelDx: 150, labelDy: 50 });

    // ---- general notes: the lesson's points, lettered as it goes
    const notes = ctx.el("notes", { x: 1500, y: 640, w: 360, h: 280, kind: "text", exit: "wipe" });
    const N = D.notes(notes, { at: 17.0, lines: 2 });
    let tn = N.add("Every change has a ticket", 17.8);
    N.add("Rev B adds a check", tn + 0.3);
  },
});

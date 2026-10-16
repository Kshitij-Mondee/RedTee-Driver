// @design held_question: the whole picture stands still while one question arrives beside it and waits
// Treatments: (1) static composition, diagram held and one question in accent (chosen: a held frame is the space to think);
// (2) question typed letter by letter (rejected: slow reading, nothing to see after); (3) dim the diagram under a panel (rejected: diagram must stay).
Loom.scene("b22", { build(ctx, props) {
  var kit = ctx.kit, m = ctx.m;
  // b21's real element names (its storyboard lists circle_a/b/c and phone_pt, but b21 drew one "circles" element)
  var dusk = ctx.held("dusk"), ground = ctx.held("ground"), sats = ctx.held("sats");
  var circles = ctx.held("circles"), patch = ctx.held("patch");

  var tWrong = ctx.cue("Every distance is wrong by the same amount");
  var tQ = ctx.cue("what would fix it");

  // faint patch breathe on the held patch: whole slow cycles from the first words to the end, 0.88..1 opacity
  var n = Math.max(1, Math.round((ctx.end - tWrong) / 4.5)), D = Math.min(n * 4.5, ctx.end - tWrong);
  var pg = patch && patch.inner;
  if (pg && typeof pg.setAttribute === "function") {
    Loom.drive(function (e) {
      var s = Math.sin(Math.PI * n * e);
      pg.setAttribute("opacity", (1 - 0.12 * s * s).toFixed(3));
    }, tWrong, D, "linear");
  }

  // the question, upper left, x 120-700, y 380-520
  // @form question_card: the one question the frame waits on
  var Q = ctx.el("question", { x: 120, y: 390, w: 520, h: 130, kind: "text", exit: "recede" });
  var fit = kit.fit("What would fix it?", { role: "body", w: 440, h: 70, maxLines: 1, weight: 700 });
  // a field-coloured card so the swollen circles never run through the words
  kit.card(Q.inner, 0, 0, 520, 130, { fill: "field", r: 26, shadow: true });
  var tx = kit.text(Q.inner, "What would fix it?", { role: "body", x: 40, y: 20, w: 440, h: 80, align: "left", valign: "middle", color: "accent", weight: 700, maxLines: 1 });
  kit.line(Q.inner, 40, 106, 40 + Math.min(440, fit.width + 8), 106, { stroke: "accent", sw: 4 });
  m.settle(Q, tQ, { dur: 0.7 });
} });

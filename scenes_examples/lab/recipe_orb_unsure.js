// @lab {"title": "Loom.orb.unsure: a fluent answer is composed into a real Loom.ui.chat, checked (the orb's scan ring and a band over the answer move together), then the orb goes unsure, the answer dims and the flag appears; the scene pairs it with a verdict mark. Sample words only", "styles": ["corporate-clean", "dark-technical"], "dur": 7.5, "times": [1.0, 2.6, 3.4, 4.2, 5.6, 7.3]}
// A lab scene for the unsure recipe. The question, the answer, the flag and the captions are inputs (SAMPLE words).
// The recipe returns the answer's rect and a time for the verdict; the scene draws its own verdict there (a cross).
Loom.scene("recipe_orb_unsure", {
  build(ctx) {
    const { kit } = ctx;
    const R = Loom.orb.unsure(ctx, "assistant", { x: 160, y: 200, size: 360, until: 7.5,
      at: { compose: 0.3 },
      question: "What can I spend on a hotel night in Lisbon?",
      answer: "The limit for Lisbon is 180 euros a night.",
      flag: "Not in the travel policy",
      chat: { x: 660, y: 220, w: 1100, title: "Travel assistant" },
      captions: { compose: "Answering", check: "Checking the source", unsure: "Not grounded" } });
    const c = R.claim;
    const V = ctx.el("verdict", { x: c.x + c.w + 30, y: c.y + c.h / 2 - 50, w: 100, h: 100, kind: "icon", exit: "recede" });
    kit.mark(V.inner, "no", 50, 50, 90);
    Loom.motion.stamp(V, R.verdictAt);
  },
});

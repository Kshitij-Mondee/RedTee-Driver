// @lab {"title": "Loom.orb (thinking-orbs engine, a pure function of t): an assistant listens, searches, then composes the answer; the orb is the AI at work. Sample words only", "styles": ["corporate-clean", "glow-flat"], "dur": 6.0, "times": [0.6, 1.8, 2.8, 3.8, 4.8, 5.8]}
// A lab scene for Loom.orb: one orb that changes state on the words, beside a chat panel that shows what it does.
Loom.scene("lab_orb", {
  build(ctx) {
    const { kit } = ctx;
    Loom.orb(ctx, "assistant_orb", { x: 260, y: 300, size: 480, t: 0.2, until: 6.0, tint: "accent",
      states: [{ at: 0.2, state: "listening" }, { at: 2.0, state: "searching" }, { at: 3.8, state: "composing" }] });
    const cap = ctx.el("orb_state", { x: 220, y: 820, w: 560, h: 60, kind: "label", exit: "recede" });
    const words = ["Listening", "Searching the policy", "Writing the answer"];
    const tx = words.map((w, i) => {
      const t = kit.text(cap.inner, w, { x: 0, y: 0, w: 560, h: 60, role: "label", align: "center", color: "muted" });
      t.setAttribute("opacity", i === 0 ? 1 : 0);
      return t;
    });
    Loom.motion.reveal(cap, 0.4, { dy: 6 });
    [2.0, 3.8].forEach((at, i) => {
      Loom.tween(tx[i], { opacity: 1 }, { opacity: 0, duration: 0.25 }, at, { kind: "swap", beat: ctx.beat.id, name: "orb_state", content: true });
      Loom.tween(tx[i + 1], { opacity: 0 }, { opacity: 1, duration: 0.25 }, at + 0.15, { kind: "swap", beat: ctx.beat.id, name: "orb_state", content: true });
    });
    const panel = ctx.el("chat_panel", { x: 980, y: 260, w: 760, h: 560, kind: "card", exit: "recede" });
    kit.rect(panel.inner, 0, 0, 760, 560, { fill: "surface", stroke: "line", r: 22 });
    kit.text(panel.inner, "How many days can I carry over?", { x: 40, y: 40, w: 680, h: 60, role: "body", color: "ink" });
    Loom.motion.reveal(panel, 0.3, { dy: 10 });
    const ans = ctx.el("chat_answer", { x: 1020, y: 420, w: 680, h: 140, kind: "text", exit: "recede" });
    kit.rect(ans.inner, 0, 0, 680, 140, { fill: "field2", r: 16 });
    kit.text(ans.inner, "Up to five days, used by the end of March (sample answer).", { x: 24, y: 20, w: 632, h: 100, role: "body", color: "ink" });
    Loom.motion.reveal(ans, 4.6, { dy: 8 });
  },
});

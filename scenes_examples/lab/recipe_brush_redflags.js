// @lab {"title": "Loom.brush.redFlags: pencil rings round the red flags of a real Loom.ui.mail in spoken order, a hatched pennant beside each, a wash under the one the lesson stresses. Sample words only", "styles": ["whiteboard", "glow-flat"], "dur": 6.0, "times": [0.9, 1.6, 2.4, 3.5, 4.4, 5.8]}
// A lab scene for the redFlags recipe. The scene lays out the real email first, then passes the rects of the parts it
// flags (Loom.ui.at for a whole part, Loom.ui.phrase for words inside a part). The marks are painted once and revealed
// in the order given; every word on screen is the mail's own SVG text. The email's words are SAMPLE words.
Loom.scene("recipe_brush_redflags", {
  build(ctx) {
    const A = Loom.ui.mail(ctx, "message", { x: 300, y: 120, w: 1320, display: 0.85,
      subject: "Action required: your mailbox will be closed today",
      from: { name: "IT Service Desk", address: "it-desk@company-support.co" }, to: "you", time: "09:12",
      paragraphs: ["Your access ends within 2 hours unless you confirm your password."],
      link: { text: "Confirm my password" } });
    Loom.ui.build(ctx, A, 0.0, { whole: true });
    Loom.brush.redFlags(ctx, "flags", { seed: 11, flags: [
      { rect: Loom.ui.at(A, "address"), at: 0.6 },
      { rect: Loom.ui.phrase(A, "subject", "closed today"), at: 1.6 },
      { rect: Loom.ui.phrase(A, "body_0", "within 2 hours"), at: 2.6 },
      { rect: Loom.ui.at(A, "link"), at: 3.6 },
    ], wash: { rect: Loom.ui.at(A, "link"), at: 4.7 } });
  },
});

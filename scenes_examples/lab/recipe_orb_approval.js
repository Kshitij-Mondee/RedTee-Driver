// @lab {"title": "Loom.orb.approval: the assistant drafts (composing, the draft types into a real Loom.ui.doc), pauses beside an approve button while a ring waits with it, a person presses it (cursor tap), then the assistant works. Sample words only", "styles": ["corporate-clean", "glow-flat"], "dur": 8.0, "times": [1.2, 3.0, 4.2, 5.4, 6.2, 7.8]}
// A lab scene for the approval recipe. The draft's title and words, the button label and the captions are inputs
// (SAMPLE words); the recipe adds no word of its own.
Loom.scene("recipe_orb_approval", {
  build(ctx) {
    Loom.orb.approval(ctx, "assistant", { x: 160, y: 220, size: 360, until: 8.0,
      at: { compose: 0.3, pause: 3.3, press: 5.5 },
      title: "Reply to Dana Okafor",
      draft: "Thanks for your message. Your refund of 42 euros will reach your card within five working days.",
      button: "Approve and send",
      panel: { x: 660, y: 200, w: 1000 },
      captions: { compose: "Drafting the reply", pause: "Waiting for your approval", work: "Sending" } });
  },
});

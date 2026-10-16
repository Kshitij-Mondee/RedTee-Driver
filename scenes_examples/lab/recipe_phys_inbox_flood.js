// @lab {"title": "Loom.physics.inboxFlood (inbox_flood): reply-all doubles the messages until the inbox tray spills. Sample words only", "styles": ["corporate-clean", "dark-technical"], "dur": 9.4, "times": [0.5, 1.3, 2.1, 3.0, 4.4, 9.3]}
// A lab scene for the inboxFlood recipe (runtime/recipes_physics.js). The message words are SAMPLE inputs.
Loom.scene("recipe_phys_inbox_flood", {
  build(ctx) {
    Loom.physics.inboxFlood(ctx, "reply_all", {
      seed: "Lunch on Friday?", replies: ["Re: Lunch", "Re: Re: Lunch", "Please remove me", "Me too", "Stop replying all", "Re: Re: Re:"],
      capacity: 6, count: 15, trayLabel: "Your inbox", showCount: true, t: 0.3,
    });
  },
});

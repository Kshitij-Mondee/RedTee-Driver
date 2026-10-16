// @lab {"title": "Loom.orb.toolLoop: an agent plans (solving), calls a tool (working, the card lights and a dotted call runs to it), reads the result (searching), decides again; tool names and captions are inputs. Sample words only", "styles": ["corporate-clean", "glow-flat"], "dur": 6.5, "times": [0.6, 1.7, 2.9, 4.0, 5.2, 6.3]}
// A lab scene for the toolLoop recipe. Every word (the tools, the captions) is passed in; these are SAMPLE words.
Loom.scene("recipe_orb_toolloop", {
  build(ctx) {
    Loom.orb.toolLoop(ctx, "agent", { x: 780, y: 230, size: 360, until: 6.5,
      tools: ["Search the wiki", "Calendar", "Send email"], icons: ["search", "calendar", "mail"],
      caption: { y: 880 },
      steps: [
        { at: 0.3, state: "solving", caption: "Plans the steps" },
        { at: 1.3, state: "working", tool: "Calendar", caption: "Checks the calendar" },
        { at: 2.5, state: "searching", tool: "Search the wiki", caption: "Reads the result" },
        { at: 3.7, state: "solving", caption: "Decides again" },
        { at: 4.7, state: "working", tool: "Send email", caption: "Sends the invite" },
      ] });
  },
});

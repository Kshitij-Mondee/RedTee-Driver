// @lab {"title": "Loom.orb.retrieval: the assistant listens, searches (chunk cards fly in from the library), composes the answer into a real Loom.ui.chat with a citation chip led from its chunk; every word is an input. Sample words only", "styles": ["corporate-clean", "glow-flat"], "dur": 7.0, "times": [0.8, 1.9, 2.8, 3.9, 5.0, 6.8]}
// A lab scene for the retrieval recipe. The question, the chunks, their sources, the answer and the citation are all
// passed in; these are SAMPLE words. `from` is where the chunks come from (a cabinet or library the scene draws).
Loom.scene("recipe_orb_retrieval", {
  build(ctx) {
    Loom.orb.retrieval(ctx, "rag", { x: 150, y: 120, size: 340, until: 7.0,
      at: { listen: 0.2, search: 1.3, compose: 3.3 },
      question: "How many days of leave can I carry over?",
      chunks: [
        { text: "Up to five unused days carry over to the next year.", source: "Leave policy, section 4.2" },
        { text: "Carried-over days must be used by 31 March.", source: "Leave policy, section 4.3" },
        { text: "Managers approve leave in the HR portal.", source: "HR portal guide" },
      ],
      cite: [0, 1], from: { x: -460, y: 700 },
      answer: "You can carry over up to five unused days. Use them by 31 March.",
      citation: "Leave policy, sections 4.2 and 4.3",
      chat: { x: 640, y: 150, w: 1150, title: "HR assistant" },
      captions: { listen: "Listening", search: "Searching the policy", compose: "Writing the answer" } });
  },
});

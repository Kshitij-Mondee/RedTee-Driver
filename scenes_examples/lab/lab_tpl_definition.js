// @lab {"title": "Templates under a seed: the definition template (term, rule, definition, example card, hero icon) in each lesson's own form", "styles": ["glow-flat", "flat-cosmos"], "dur": 5.0, "times": [4.8], "seeds": [{"name": "classic"}, {"name": "body", "shape": "organic", "label": "tag", "bubble": "wobble", "panel": "glass", "icon": "duotone", "mark": "brush", "texture": "grain", "entrance": "unfold"}, {"name": "rules", "shape": "architectural", "label": "stamp", "bubble": "note", "panel": "paper", "icon": "seal", "mark": "stamp", "texture": "paper", "entrance": "typeset"}, {"name": "tech", "shape": "angular", "label": "flag", "bubble": "chat", "panel": "frame", "icon": "tile", "mark": "box", "texture": "halftone", "entrance": "draw"}]}
// The definition template was in every lesson (variety ledger, D-79). Under a seed its example card takes the
// panel treatment and its hero icon becomes a drawn object (D-82, D-83). Same props, four seeds. Original text.
Loom.scene("lab_tpl_definition", {
  build(ctx) {
    Loom.templates["definition"].build(ctx, { kicker: "Key term", term: "Handover", say_term: "0.3",
      definition: "Passing open work to someone else with everything they need to finish it.", say_definition: "1.0",
      example: "A note listing the open tickets, the owner and the deadline.", say_example: "2.2", icon: "clipboard-list" });
  },
});

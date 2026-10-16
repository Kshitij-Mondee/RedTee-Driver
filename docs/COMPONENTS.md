# Components and the element library

Loom reuses **small elements**, not whole scenes. A scene stays bespoke; the parts it is built from
(a condition card, a strike-and-replace mark, a row of heads that turn) can become **components** once
they have proved they recur and are worth reusing.

## What a component fixes, and what stays open

| Fixed (the idea) | Open at the point of use (no regeneration) |
|---|---|
| `idea`: one sentence, with no lesson nouns | `params`: geometry, tokens, emphasis, timing anchors (defaulted) |
| `outline`: the parts and their arrangement | CONTENT params: the words and numbers on screen (always passed, never defaulted) |
| how the parts are drawn, so they read in every style pack | `slots`: redraw a named part (`slots: { icon: (g, p, ctx) => ... }`) |
| | returned `parts`: animate or restyle any part afterwards |
| | `Loom.component.variant(base, id, { defaults, slots })`: a local variant inside one scene |

**Versions.** `"id"` resolves to the newest version and `"id@1"` pins one. A breaking change registers
`version: 2` beside the old one, so older lessons re-compose unchanged.

## Using one in a scene

```js
Loom.scene("b20", {
  build(ctx, props) {
    const { m } = ctx;
    const c = ctx.use("condition_card", { label: "Staging setting differs", icon: "sliders-horizontal" },
                      { x: 380, y: 620, name: "cond_staging", exit: "recede" });
    m.settle(c.el, ctx.cue("lacked production's payment setting"));
    m.highlight(c.parts.label, ctx.cue("Several conditions"));   // a returned part, animated by the scene
  },
});
```

`ctx.use(ref, params, opts)` returns `{ el, parts, p, def, size }`. `opts` takes:
- `name`, `x`, `y`, `w`, `h`, `kind` and `exit` for the new element;
- `parent`, to draw into an existing element instead of making one.

Unknown params, missing content, a wrong type or an unknown slot are runtime errors that `check` reports.
A scene that calls `ctx.use` on a component that does not exist fails the scenes gate.

## Writing one (the promotion task does this)

```js
Loom.component("demo_badge", {
  version: 1,
  idea: "A labelled badge: an icon disc beside a short label, on a card.",
  outline: ["card", "icon disc at the left", "label to the right of the disc"],
  params: {
    label: { type: "str", content: true },           // on-screen words: required, never defaulted
    icon: { type: "str", default: "info" },
    w: { type: "number", default: 420 }, minH: { type: "number", default: 120 },
    inset: { type: "number", default: 20 },
    accent: { type: "token", default: "accent2" },
  },
  slots: { icon: "draw the glyph inside the disc: (g, p, ctx) => void" },
  parts: ["card", "disc", "label"],
  promoted_from: ["lesson-a/b20", "lesson-a/b23", "lesson-b/b07"],
  example: 'ctx.use("demo_badge", { label: "Staging differs", icon: "sliders-horizontal" }, { x: 700, y: 400 })',
  // MEASURE, THEN DRAW: the card's height comes from the label's real, measured height (kit.fit), so every
  // label the schema allows fits in every style's fonts and type floors (docs/LAYOUT.md)
  size: (p) => ({ w: p.w, h: Math.max(p.minH, Loom.kit.fit(p.label, { role: "body", w: p.w - 140, maxLines: 3 }).height + 2 * p.inset) }),
  build(ctx, g, p, slots) {
    const { kit } = ctx;
    const f = kit.fit(p.label, { role: "body", w: p.w - 140, maxLines: 3 });
    const h = Math.max(p.minH, f.height + 2 * p.inset);
    const card = kit.rect(g, 0, 0, p.w, h, { fill: "surface", r: 20 });
    const disc = Loom.svg("g", {}, g);
    kit.disc(disc, 62, h / 2, 38, { fill: p.accent });
    if (slots.icon) slots.icon(disc, p, ctx);
    else kit.icon(disc, p.icon, { x: 62, y: h / 2, size: 40, color: Loom.style.pickTokenOn(p.accent) });
    const label = kit.text(g, p.label, { role: "body", x: 118, y: p.inset, w: p.w - 140, h: h - 2 * p.inset, maxLines: 3, valign: "middle" });
    return { card, disc, label };
  },
});
```

> **Superseded example (kept for the record, L-51):** the first version of this example drew a fixed
> 420x120 card and a text box as tall as the card (`y: 0, h: p.h`). A 7-word label then overflowed in 4
> of 5 styles and touched the card edge in the fifth. `text_overflow` flagged it, and `tight_inset` now
> flags the edge contact too.

Param types are `str`, `number`, `int`, `bool`, `token` (a style colour token), `anchor` (spoken words),
`enum` (with `choices`), `list`, `obj` and `fn`. The component also needs a fixture file,
`runtime/components/fixtures/<id>.json`, with **at least 3 cases whose content differs**:

```json
{"cases": [{"label": "short", "params": {"label": "Staging differs"}, "opts": {"x": 700, "y": 400}}]}
```

## How a form becomes a component (automatic, but never blind)

1. **Tag.** Scene authors write `// @form snake_id: one-line idea` above each small element they build.
   - Reuse an id from `library/FORMS.md` when the idea is the same.
   - Do not tag elements that are only held from the previous scene.
2. **Count.** `py -m loom library harvest` runs after every render through `loom go`.
   - Each scene that builds a form counts as one use, from any lesson.
   - Its results are generated files: `library/forms.json`, `library/FORMS.md` and `library/scenes/`.
3. **Assess** (plan tier) once a form reaches `library.promote_after` uses (default 3; set it in
   `loom.config.json`). The count only opens the door. To promote, the assessment must show all of these:
   - the idea is topic-independent;
   - it varied across the uses;
   - at least 3 concrete future topics need it;
   - it is small (an element, not a scene);
   - reuse beats writing it inline;
   - and it needs `confidence: high`.

   Otherwise the form is **deferred** or **rejected** with a `revisit_when` threshold, so it is not
   re-assessed on every lesson. Near-duplicate names can be **merged** so their counts add up.
4. **Promote** (build tier). The model writes `runtime/components/<id>.js` plus fixtures, and they must pass
   `py -m loom library accept <id>`:
   - no content defaults;
   - no banned JS or literal colours;
   - `promoted_from` names the real uses;
   - 3 or more fixture cases with distinct content;
   - every case renders in **every style pack** with zero runtime errors. The result is
     `library/sheets/<id>.jpg`: look at it.

   Existing scenes are never rewritten.

## Beat designs become templates (the same library, one level up)
- **Tag:** the whole beat's design, once per scene, on line 1: `// @design snake_id: the beat's visual
  argument`. A scene that only extends the previous scene's held picture uses `<id>_continued`, which is
  not counted.
- **Count:** same-lesson scenes that re-draw the same content (2 or more identical content strings)
  count once. That heuristic applies to forms too (`uses` in FORMS.md; the raw count is in brackets).
- **Assess** at `library.template_promote_after` distinct uses (default 2, "a couple"), on the plan tier,
  strictly. To promote it must name:
  - the closest existing template and why it falls short;
  - the script `jobs` and the content shape;
  - 3 future topics;
  - a blind `selection_test` of 3 targets and 2 decoys.
- **Build** (build tier, `loom-template-author`): `runtime/templates/<id>.js` with
  `promoted_from_design`, plus fixtures. `library accept design:<id>` requires:
  - no text defaults except chrome;
  - an example and fixtures that match the schema;
  - every case rendered in every style pack with 0 errors and 0 leaked words. That includes an
    automatic max-words stress case.
- **Pick:** a blind storyboard-tier model stages the 5 test beats from the catalogue. It must choose the
  template for at least 2 of 3 targets and no decoy, and its props must validate and render. Until then
  the template is a hidden candidate: listed in `catalog.json`, absent from `catalog.md`, and refused by
  the storyboard gate. A template edited after it was built is fully re-proved before the pick is judged.
- **Promoted:** it appears in `runtime/catalog.md` for every storyboard.
- **Worked example:** `library/proofs/2026-09-30-template-promotion/`.

## Sample text never reaches a slide
`check` audits every word a template, blueprint or avatar beat DREW against the props it was given
(`loom/checks/text_audit.py`). A word no prop supplied is an error. Templates declare the structural words
they own: `chrome: ["Why not"]`, or `chrome: true` on a prop with a structural default ("Your turn").
Bespoke scenes are out of scope.

## Locking
`library accept` writes `library/decisions.json` under a lock (`library/.decisions.lock`), so parallel
agents can each accept their own form. A lock left by a killed process is broken after 10 minutes.

Commands: `py -m loom library status | harvest | tasks [--api] | check <id> | accept <id> | sheet <id> |
backfill [designs] | verify-backfill`, where `<id>` is a form id or `design:<id>`.
`library/decisions.json` is written only by `library accept`; do not hand-edit it.

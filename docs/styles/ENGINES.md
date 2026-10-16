# Style engines (D-175)

A style pack (`packs/styles/<id>.json`) is data, its guide (`docs/styles/guides/<id>.md`) is the rules, and its
engine is the working code that solves the style's hard part once, so a scene author stages the story instead of
re-inventing the medium every beat.

**Status (2026-10-15): the slot is built; no style has an engine.** Kshitij decides which style gets one, and each is
built with that style (his direction that day: "for specific styles, don't do anything else").

**Status (2026-10-16): two engines exist.**
- **whiteboard** (D-179, on by default for new whiteboard lessons, D-181). How a scene uses it:
  `docs/styles/engines/whiteboard.md`.
- **blueprint** (D-183, a drafted sheet in two registers, teaching and detail). How a scene uses it:
  `docs/styles/engines/blueprint.md`.

**Three more, 2026-10-16 (D-185),** each a new style with its engine: **isometric** (a diorama board),
**hologram** (a HUD in two registers) and **screencast** (an app shell with a walkthrough layer). How a scene uses each:
`docs/styles/engines/<id>.md`.

A lesson turns its style's engine off with `"engine": "off"` in its request.

## The contract
- File: `runtime/engines/<style id>.js`, named after an existing pack's `id`.
- It registers itself once:
  ```js
  Loom.engines.define("<style id>", {
    version: "1",
    summary: "what it solves",
    api: { mark(ctx, name, opts) { /* draw through ctx.el, kit and motion */ return E; } },
  });
  ```
- compose (and the lab) load it only for a lesson in that style; a scene calls `ctx.engine.mark(ctx, "x", {...})`.
  A scene in a style with no engine that touches `ctx.engine` gets an `engine_missing` error.
- It draws through Loom's elements (`ctx.el`, `kit`, `m.*`), so held parts, joins, layout checks, brands and restyles
  keep working.
- Frames stay a pure function of time: no `Math.random` (use `Loom.rng`), no `Date`, timers, `requestAnimationFrame` or
  network. `loom/engines.py` lints every engine (compose reports its errors), and the tests run the lint.

## Building one
1. Kshitij names the style and what its hard part is.
2. Write the engine and a lab scene that uses it (`scenes_examples/lab/<name>.js`, `// @lab {"styles": ["<id>"]}`);
   look at `py -m loom lab <name> --style <id>`.
3. Add an "Engine" section to the style's guide (what each api call is for, with one example) and a test.

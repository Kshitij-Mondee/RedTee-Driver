/* Loom style engines (D-175): a style may carry a working engine next to its written rules.
 *
 * A pack (packs/styles/<id>.json) is data and a guide (docs/styles/guides/<id>.md) is the rules; an engine is the code
 * that solves the style's hard part once (how its marks are made, timed and laid down), so a scene stages the story
 * instead of re-inventing the medium. The file is runtime/engines/<style id>.js; compose and the lab load it only for
 * a lesson in that style. It registers itself:
 *
 *   Loom.engines.define("<style id>", {
 *     version: "1",
 *     summary: "what it solves",
 *     api: { draw(ctx, name, opts) { ... return element }, ... },   // what scenes call, as ctx.engine.draw(...)
 *   });
 *
 * Rules (checked by loom/engines.py lint and the tests): the id is the pack's id; the api is an object of functions;
 * frames stay a pure function of time (no Math.random, Date, timers, requestAnimationFrame or network: Loom.rng and the
 * timeline only); the engine draws through Loom's elements (ctx.el, kit, motion) so held parts, joins, the layout
 * checks and restyle keep working. A scene in a style with no engine that touches ctx.engine gets a clear error.
 */
// @capability style_engine | style | ctx.engine; Loom.engines.define | The style's engine | call the working code that solves the style's hard part (runtime/engines/<style>.js); whiteboard, blueprint, isometric, hologram and screencast exist (D-179, D-183, D-185)
(function () {
  "use strict";
  const Loom = window.Loom;
  const reg = {};
  Loom.engines = {
    define(id, def) {
      if (!id || typeof id !== "string") throw new Error("Loom.engines.define: an engine needs its style id");
      if (!def || typeof def.api !== "object" || !def.api) throw new Error(`engine ${id}: define(id, {api: {...}}) needs an api object`);
      for (const [k, v] of Object.entries(def.api)) {
        if (typeof v !== "function") throw new Error(`engine ${id}: api.${k} is not a function`);
      }
      if (reg[id]) throw new Error(`engine ${id} is defined twice`);
      reg[id] = Object.freeze({ id, version: String(def.version || "1"), summary: def.summary || "", api: def.api });
      return reg[id];
    },
    get(id) { return reg[id] || null; },
    list() { return Object.keys(reg).sort(); },
    // the engine of the style in use; null when the style has none
    current() {
      const pk = Loom.style && Loom.style.pack;
      return pk && pk.id ? reg[pk.id] || null : null;
    },
  };
})();

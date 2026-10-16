/* Loom sets (D-152): a drawn place from the set library (assets/sets/<world>/<scene>/<set_style>.svg, loom/sets.py)
 * as a place on the in-scene camera, the same shape Loom.place.office returns, so Loom.cam.push / pan / pull work on it.
 *
 *   const R = Loom.place.set(ctx, "room");                         // the storyboard scene's set (its "set" field)
 *   const R = Loom.place.set(ctx, "room", "office/meeting_room");  // or an exact library id, literal in the code
 *   R.anchors.stand_screen, R.anchors.seat_near ...                // frame coordinates, from the set's card
 *   const S = R.slot("screen");                                   // {g, x, y, w, h}: draw the screen's content in S.g at
 *                                                                  // (0, 0, w, h); it rides its depth layer with the camera
 *   Loom.cam.push(R, { to: R.anchors.screen_centre, scale: 1.6, t0, t1 });
 *   R.relight("evening", t0, dur);                                 // cross-fade the light setups the set carries
 *
 * Compose puts only the sets a lesson uses into Loom.assets.sets (loom/sets.py embed): the storyboard's set, resolved
 * strictly (an exact id or a perfect description match in the lesson's own set style), and literal ids in scene code.
 * The set is parsed once from its own markup (no network), its ids are prefixed so two sets or two beats never clash,
 * and its canvas (2400 x 1350, the 1920 x 1080 frame at 240, 135) is shifted so the frame fills the screen and the
 * overscan is there for the camera.
 */
// @capability set_library | world | Loom.place.set(ctx, name, id?) with R.anchors, R.slot(name), R.relight(setup, t0, dur) and the place camera | Drawn sets from the library | a beat that happens in a designed place from the set library (office/meeting_room ...), with characters at its anchors and content in its screen slot
(function () {
  "use strict";
  const Loom = window.Loom;
  const P = Loom.place;
  const svg = (...a) => Loom.svg(...a);
  const DEPTH = { far: 0.35, mid: 0.7, near: 1.15 };      // the same depths as Loom.place's own places
  const OFF = [240, 135];
  const NS = "http://www.w3.org/2000/svg";

  function prefixed(markup, pre) {
    return markup
      .replace(/\bid="([^"]+)"/g, (m, id) => `id="${pre}${id}"`)
      .replace(/url\(#([^)]+)\)/g, (m, id) => `url(#${pre}${id})`)
      .replace(/(xlink:)?href="#([^"]+)"/g, (m, x, id) => `${x || ""}href="#${pre}${id}"`);
  }

  P.set = function (ctx, name, id, o) {
    o = o || {};
    const lib = (Loom.assets && Loom.assets.sets) || {};
    const want = id || (ctx.def && ctx.def.set_id);
    const S = want && lib[want];
    if (!S) {
      Loom.error("set_missing", `${(ctx.beat && ctx.beat.id) || "?"}: set "${want || "(none)"}" is not in this build; name it in the storyboard ("set") or as a literal id`, { beat: ctx.beat && ctx.beat.id });
      return null;
    }
    const card = S.card, pre = `set-${String(name).replace(/[^\w-]/g, "_")}-`;
    const E = ctx.el(name, { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", parent: o.parent });
    const doc = new DOMParser().parseFromString(prefixed(S.svg, pre), "image/svg+xml");
    const root = doc.documentElement;
    if (!root || root.nodeName !== "svg") {
      Loom.error("set_parse", `${want}: the set's markup did not parse as SVG`);
      return null;
    }
    const layers = {};
    ["far", "mid", "near"].forEach((nm) => {
      const cam = svg("g", { class: "lm-cam", "data-layer": nm }, E.inner);
      const g = svg("g", {}, cam);
      const art = svg("g", { transform: `translate(${-OFF[0]} ${-OFF[1]})`, "data-set-layer": nm }, g);
      layers[nm] = { cam, g, art, depth: DEPTH[nm] };
    });
    for (const ch of Array.from(root.childNodes)) {
      if (ch.nodeType !== 1) continue;
      const own = (ch.getAttribute("id") || "").slice(pre.length);
      const imp = document.importNode(ch, true);
      if (ch.nodeName === "defs") layers.far.art.appendChild(imp);
      else if (layers[own]) {
        // the layer's own content goes in as it is (its classed light groups, setups, objects)
        while (imp.firstChild) layers[own].art.appendChild(imp.firstChild);
        for (const a of Array.from(imp.attributes)) if (a.name !== "id") layers[own].art.setAttribute(a.name, a.value);
      }
      // frame_safe, anchors and slots at the top level are data, read from the card instead
    }
    // light setups: show the one asked for (default the first the card lists, normally "day"), hide the others
    const setups = card.setups || ["day"];
    const start = o.setup || setups[0];
    const groupsOf = (su) => Array.from(E.inner.querySelectorAll(`[id^="${pre}setup_${su}"]`));
    setups.forEach((su) => groupsOf(su).forEach((g) => { if (su !== start) g.setAttribute("display", "none"); }));
    const R = { E, layers, anchors: {}, slots: {}, kind: "set:" + want, W: 1920, H: 1080, cams: [], ctx, card, setup: start };
    for (const k in card.anchors || {}) R.anchors[k] = card.anchors[k].slice();
    R.floorY = (card.anchors.floor_y || [0, 1000])[1];
    for (const k in card.slots || {}) R.slots[k] = Object.assign({}, card.slots[k]);
    /** a group to draw a slot's content in (0..w, 0..h), inside the layer that holds the slot, above its art */
    R.slot = function (nm) {
      const s = R.slots[nm];
      if (!s) { Loom.error("set_slot_missing", `${want}: no slot "${nm}" (has ${Object.keys(R.slots).join(", ") || "none"})`); return null; }
      const el = E.inner.querySelector(`[id="${pre}slot_${nm}"]`);
      const host = el && el.closest("[data-set-layer]");
      const lay = host ? layers[host.getAttribute("data-set-layer")] : layers.far;
      const g = svg("g", { transform: `translate(${s.x} ${s.y})`, "data-slot": nm }, lay.g);
      return Object.assign({ g }, s);
    };
    /** cross-fade from the current light setup to another between t0 and t0 + dur (a pure function of time) */
    R.relight = function (to, t0, dur) {
      if (setups.indexOf(to) < 0) { Loom.error("set_setup_missing", `${want}: no light setup "${to}" (has ${setups.join(", ")})`); return t0; }
      const from = R.setup, A = groupsOf(from), B = groupsOf(to);
      B.forEach((g) => { g.removeAttribute("display"); g.setAttribute("opacity", "0"); });
      Loom.drive((p) => {
        A.forEach((g) => g.setAttribute("opacity", String(Math.round((1 - p) * 1000) / 1000)));
        B.forEach((g) => g.setAttribute("opacity", String(Math.round(p * 1000) / 1000)));
      }, t0, dur, "move", { kind: "ambient", beat: E.beat, name: `${E.name}.relight` });
      R.setup = to;
      return t0 + dur;
    };
    (Loom.report.treatments = Loom.report.treatments || []).push({ beat: Loom.ctxBeat && Loom.ctxBeat.id, axis: "place", as: "set/" + want, name, seeded: false });
    return R;
  };
})();

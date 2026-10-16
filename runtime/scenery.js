/* Loom scenery (D-74): sets that fill the frame, so a beat happens SOMEWHERE instead of on an empty field.
 *
 * Why: the reference channels (docs/research/2026-10-01-visual-study.md) draw something across 34 to 46% of
 * the frame (16 px blocks with a strong edge); Loom lessons drew on 13 to 28%. Their scenes are places (a room,
 * a stage, a street) with props that carry the information. These builders draw such places in the style's
 * own tokens and shading (toon outlines, sketch, flat, line all apply, because everything goes through kit).
 *
 *   const room = ctx.scenery("room", "set", { window: true, door: true, frame: true });   // returns {E, floorY}
 *   const desk = Loom.scenery.desk(room.E.inner, 1060, room.floorY, 520, { monitor: true });
 *   ctx.crowd("crowd", { y: room.floorY + 40, count: 9, scale: 0.42 });                  // grey extras, behind
 *   Loom.scenery.sign(room.E.inner, 1320, 360, 360, 150, "BUDGET: 40% USED");             // the number lives on a prop
 *   ctx.narrationCard("turn", "But the review never happened.", 3.2);                     // a black turn card
 * Every builder is deterministic (positions come from arguments and a seeded spread, never Math.random).
 */
// @capability scenery_sets | world | ctx.scenery("room" or "stage" or "street", name, o), ctx.crowd, ctx.narrationCard | Scenery | a set that fills the frame, grey extras for a crowd, a black narration card for a turn in the story
(function () {
  "use strict";
  const Loom = window.Loom;
  const S = () => Loom.style;
  const K = () => Loom.kit;
  const svg = (...a) => Loom.svg(...a);
  const Sc = (Loom.scenery = {});

  /** an interior: back wall, floor, skirting, optional window, door, picture frame and shelf. */
  Sc.room = function (ctx, name, o) {
    o = o || {};
    const W = o.w || 1920, H = o.h || 1080, fy = Math.round(H * (o.floor || 0.74));
    const E = ctx.el(name, { x: o.x || 0, y: o.y || 0, w: W, h: H, kind: "scenery" });
    const g = E.inner, k = K();
    k.rect(g, 0, 0, W, fy, { fill: o.wall || "surface2", r: 0, flat: true, crisp: true });
    k.rect(g, 0, fy, W, H - fy, { fill: o.floorFill || "field2", r: 0, flat: true, crisp: true });
    k.line(g, 0, fy, W, fy, { stroke: S().pack.shape.outline || "line", sw: (S().pack.shape.stroke || 3) + 1, crisp: true });
    k.rect(g, 0, fy - 18, W, 18, { fill: o.skirting || "surface", r: 0, flat: true });
    if (o.window) {                                     // a window: frame, glass in the field colour, two bars
      const wx = o.windowX != null ? o.windowX : W * 0.12, wy = H * 0.14, ww = W * 0.22, wh = H * 0.36;
      k.rect(g, wx, wy, ww, wh, { fill: o.glass || "field", r: 6 });
      k.line(g, wx + ww / 2, wy, wx + ww / 2, wy + wh, { stroke: S().pack.shape.outline || "line", sw: 6 });
      k.line(g, wx, wy + wh * 0.52, wx + ww, wy + wh * 0.52, { stroke: S().pack.shape.outline || "line", sw: 6 });
      k.rect(g, wx - 14, wy + wh, ww + 28, 18, { fill: "surface", r: 4 });
    }
    if (o.door) {
      const dx = o.doorX != null ? o.doorX : W * 0.8, dw = W * 0.1, dh = H * 0.5;
      k.rect(g, dx, fy - dh, dw, dh, { fill: o.doorFill || "surface", r: 4 });
      k.disc(g, dx + dw * 0.82, fy - dh * 0.48, 9, { fill: "accent2" });
    }
    if (o.frame) {                                      // a picture frame: something on the wall, no content
      const fx = o.frameX != null ? o.frameX : W * 0.5, fw = W * 0.12, fh = H * 0.16;
      k.rect(g, fx, H * 0.16, fw, fh, { fill: "surface", r: 4 });
      k.rect(g, fx + 14, H * 0.16 + 14, fw - 28, fh - 28, { fill: o.frameFill || "accent4", r: 2, flat: true });
    }
    if (o.shelf) {
      const sx = o.shelfX != null ? o.shelfX : W * 0.62;
      k.rect(g, sx, H * 0.38, W * 0.16, 16, { fill: "surface", r: 3 });
      const BK = Loom.style.materialList("books", ["accent", "accent3", "accent2", "accent4"]);   // the pack's books, else every accent as before
      [0, 1, 2, 3].forEach((i) => k.rect(g, sx + 18 + i * 34, H * 0.38 - 70 + (i % 2) * 12, 26, 70 - (i % 2) * 12, { fill: BK[i % BK.length], r: 3 }));
    }
    return { E, floorY: fy, w: W, h: H };
  };

  /** a stage: dark ground, two curtains, a floor and an optional spotlight cone on spotX. */
  Sc.stage = function (ctx, name, o) {
    o = o || {};
    const W = o.w || 1920, H = o.h || 1080, fy = Math.round(H * (o.floor || 0.8));
    const E = ctx.el(name, { x: o.x || 0, y: o.y || 0, w: W, h: H, kind: "scenery" });
    const g = E.inner, k = K();
    k.rect(g, 0, 0, W, H, { fill: o.back || "ink", r: 0, flat: true, crisp: true });
    k.rect(g, 0, fy, W, H - fy, { fill: o.floorFill || "surface2", r: 0, flat: true, crisp: true });
    const cw = W * 0.16, curtain = o.curtain || "accent3";
    [0, W - cw].forEach((x) => {
      k.rect(g, x, 0, cw, fy + 20, { fill: curtain, r: 0 });
      for (let i = 1; i < 4; i++) k.line(g, x + (cw / 4) * i, 0, x + (cw / 4) * i, fy + 20, { stroke: S().darken(S().c(curtain), 0.25), sw: 4, crisp: true });
    });
    if (o.spotX != null) {                              // the light that says "this one"
      const sx = o.spotX;
      svg("polygon", { points: `${sx - 60},0 ${sx + 60},0 ${sx + 260},${fy + 40} ${sx - 260},${fy + 40}`, fill: S().c(o.light || "accent2"), opacity: 0.28 }, g);
      svg("ellipse", { cx: sx, cy: fy + 40, rx: 260, ry: 34, fill: S().c(o.light || "accent2"), opacity: 0.35 }, g);
    }
    return { E, floorY: fy, w: W, h: H };
  };

  /** a street: sky, a skyline of blocks with windows, a pavement. Blocks come from a seeded spread. */
  Sc.street = function (ctx, name, o) {
    o = o || {};
    const W = o.w || 1920, H = o.h || 1080, fy = Math.round(H * (o.floor || 0.78));
    const E = ctx.el(name, { x: o.x || 0, y: o.y || 0, w: W, h: H, kind: "scenery" });
    const g = E.inner, k = K();
    k.rect(g, 0, 0, W, fy, { fill: o.sky || "field2", r: 0, flat: true, crisp: true });
    const rng = Loom.rng ? Loom.rng(o.seed || name) : (() => { let s = 7; return () => (s = (s * 9301 + 49297) % 233280) / 233280; })();
    let x = -20;
    while (x < W) {
      const bw = 140 + rng() * 140, bh = H * (0.25 + rng() * 0.32);
      const tone = ["surface2", "muted", "surface"][Math.floor(rng() * 3)];
      k.rect(g, x, fy - bh, bw, bh, { fill: tone, r: 2 });
      for (let wy = fy - bh + 30; wy < fy - 40; wy += 54) for (let wx = x + 22; wx < x + bw - 30; wx += 44) k.rect(g, wx, wy, 22, 28, { fill: o.lit && rng() > 0.6 ? "accent2" : "field", r: 2, flat: true });
      x += bw + 8;
    }
    k.rect(g, 0, fy, W, H - fy, { fill: o.ground || "surface", r: 0, flat: true, crisp: true });
    k.line(g, 0, fy, W, fy, { stroke: S().pack.shape.outline || "line", sw: (S().pack.shape.stroke || 3) + 1, crisp: true });
    return { E, floorY: fy, w: W, h: H };
  };

  /** a desk standing on floorY (x = left edge), optionally with a monitor; drawn into a parent node. */
  Sc.desk = function (p, x, floorY, w, o) {
    o = o || {};
    const k = K(), top = floorY - 190;
    const g = svg("g", { class: "lm-desk" }, p);
    const cs = Loom.style.pack.shape && Loom.style.pack.shape.contact_shadow;   // story-cartoon guide s15 E11
    if (cs) svg("ellipse", { cx: x + w / 2, cy: floorY - 4, rx: w * 0.56, ry: 12, fill: Loom.style.c("shadow"), opacity: cs, class: "lm-contact" }, g);
    k.rect(g, x + 24, top + 30, 22, 160, { fill: o.legs || "muted", r: 3 });
    k.rect(g, x + w - 46, top + 30, 22, 160, { fill: o.legs || "muted", r: 3 });
    k.rect(g, x, top, w, 34, { fill: o.top || "surface", r: 6 });
    if (o.monitor) {
      const mx = x + w * 0.3, mw = w * 0.4;
      k.rect(g, mx + mw / 2 - 10, top - 50, 20, 50, { fill: "muted", r: 3 });
      k.rect(g, mx, top - 230, mw, 180, { fill: Loom.style.material("monitor", "ink"), r: 10 });   // the body: ink is LIGHT in a dark pack (materials.monitor, A4 proof)
      k.rect(g, mx + 14, top - 216, mw - 28, 152, { fill: o.screen || Loom.style.material("screen", "accent"), r: 4, flat: true });
    }
    return { g, top };
  };

  /** a sign or note on a wall or a stand, with the words ON it: the number lives on a prop. */
  Sc.sign = function (p, x, y, w, h, text, o) {
    o = o || {};
    const k = K(), g = svg("g", { class: "lm-sign" }, p);
    if (o.post) k.rect(g, x + w / 2 - 10, y + h, 20, o.post, { fill: "muted", r: 3 });
    k.rect(g, x, y, w, h, { fill: o.fill || "surface", r: o.r != null ? o.r : 8 });
    const pad = Math.max(16, h * 0.16);
    k.text(g, text, { role: o.role || "label", x: x + pad, y: y + pad * 0.7, w: w - 2 * pad, h: h - pad * 1.4, align: "center", valign: "middle", weight: o.weight || 700, color: o.color });
    return g;
  };

  /** background people in rows; seeded positions, never random. Returns the rigs.
   *  What an extra IS comes from the pack (`characters.extras`, D-100), so a register decides it once for every
   *  lesson: "silhouette" is the grey bean (runtime/rigs/beans.js "extra", for story and cartoon registers), "people"
   *  is the cast's own rigs in muted clothes (corporate registers: step 7's beans read as a cartoon in an office),
   *  "none" draws no crowd. o.as overrides it for one call. */
  Sc.crowd = function (ctx, name, o) {
    o = o || {};
    const mode = o.as || ((S().pack.characters || {}).extras) || "silhouette";
    if (mode === "none") return [];
    const n = o.count || 8, rows = o.rows || 2, sc = o.scale || 0.4, y0 = o.y || 1000, x0 = o.x || 120, span = o.w || 1680;
    const people = ["ava", "sam"].filter((id) => Loom.rig.defs[id]);
    const out = [];
    for (let i = 0; i < n; i++) {
      const row = i % rows, col = Math.floor(i / rows), per = Math.ceil(n / rows);
      const x = x0 + (span / Math.max(1, per - 1 || 1)) * col + (row ? span / per / 2 : 0);
      const at = { x, y: y0 + row * 40, scale: sc * (1 - row * 0.12), flip: (i % 3) === 1, parent: o.parent, extra: true };   // parent: a place's layer, so people stand in depth (behind the near furniture)
      const c = mode === "people" && people.length
        ? Loom.rig.place(ctx, `${name}_${i + 1}`, people[i % people.length], Object.assign(at, { skin: (i * 3 + row) % 4, top: ["muted", "surface2", "line"][i % 3], bottom: i % 2 ? "ink" : "muted" }))
        : Loom.rig.place(ctx, `${name}_${i + 1}`, "extra", Object.assign(at, { top: row ? "surface2" : (o.tone || "muted") }));
      if (c) out.push(c);
    }
    return out;
  };

  /** a black turn card: one short line on the darkest ground, typed in. Returns the time the line is complete. */
  Sc.narrationCard = function (ctx, name, text, t, o) {
    o = o || {};
    const E = ctx.el(name, { x: 0, y: 0, w: 1920, h: 1080, kind: "card" });
    // the card's ground: the pack's roles.turn_card, else ink as before (a dark card on a light pack). In a dark pack
    // ink is LIGHT, so the "black" card was a full-frame cream flash; noir says turn_card: shadow (A4 proof 2026-10-08)
    const ground = o.ground || Loom.style.role("turn_card", "ink");
    K().rect(E.inner, 0, 0, 1920, 1080, { fill: ground, r: 0, flat: true, crisp: true });
    const T = K().text(E.inner, text, { role: o.role || "title", x: 240, y: 380, w: 1440, h: 320, align: "center", valign: "middle", weight: o.weight || 700,
      // a resolved colour, not a token: kit.text maps knockout tokens to ink in an outlined pack (words on hachure), which
      // drew the whiteboard card's words ink on ink (A4 proof 2026-10-08)
      color: o.color || (ground === "ink" ? Loom.style.c("field") : Loom.style.on(ground)) });
    Loom.motion.reveal(E, t - 0.25, { dur: 0.25 });
    return Loom.motion.typewriter(T, t, { cps: o.cps || 24 });
  };
})();

/* Loom character rigs (D-59): 2D characters that act, not stickers that slide.
 *
 * A RIG is data: parts with a pivot and a parent (forward kinematics), named POSES (angles per part),
 * FACES (eye, brow and mouth shapes) and a palette of SLOTS (skin, hair, top, bottom, shoe) resolved from
 * the style (skin tones from style.characters, clothes from tokens), so a brand re-dresses every character.
 * A CHARACTER is an instance on the timeline: every frame is evaluated from (t) by one driver:
 *   pose blend (spring between keyed poses) + additive layers (breathing, gestures, walk cycle)
 *   + face (blink on a seeded schedule, mouth shapes from the narration's word timings, emotion).
 *
 *   const ava = ctx.character("ava", "ava", { x: 600, y: 900, scale: 0.9, skin: 1, top: "accent" });
 *   ava.pose("explain", ctx.cue("here is the plan"));   ava.gesture("wave", t0, t1);
 *   ava.talk();  // lip-sync to this beat's narration     ava.emotion("happy", t);   ava.walk(t0, t1, 300)
 *
 * Rigs are registered with Loom.rig.define(id, def) in runtime/rigs/*.js (Loom's own characters are CC0).
 */
// @capability character_rigs | people | ctx.character(name, rigId, {x, y, scale, pose, emotion}) | Characters | a person who acts (poses, gestures, lip flaps, a walk) from a designed rig; story.cast fixes each person's look
(function () {
  "use strict";
  const Loom = window.Loom;
  const S = () => Loom.style;
  const R = (Loom.rig = { defs: {} });

  R.define = function (id, def) { def.id = id; R.defs[id] = def; return def; };

  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  function springK(p) { p = clamp(p, 0, 1); const w = Math.log(1000); return 1 - Math.exp(-w * p) * (1 + w * p) + Math.exp(-w) * (1 + w) * p; }
  const lerp = (a, b, k) => a + (b - a) * k;

  // natural hair colours; a pack may give its own list as characters.hair_colors
  const HAIR = (ch) => ch.hair_colors || ["#2A1E17", "#4A2F1D", "#1C1A1E", "#6B4226", "#8A5A33"];
  /** the palette a rig draws with: slot name -> colour */
  function slots(def, o) {
    const ch = S().pack.characters || {};
    const skins = ch.skin || ["#E0B08A"];
    const tok = (v, fb) => S().c(v || fb);
    return {
      skin: skins[(o.skin || 0) % skins.length],
      skin2: S().darken(skins[(o.skin || 0) % skins.length], 0.12),
      // hair is a natural colour (like skin), never the ink token: ink is light on dark styles (L-92)
      hair: typeof o.hair === "string" ? S().c(o.hair) : HAIR(ch)[(o.hair == null ? (o.skin || 0) : o.hair) % HAIR(ch).length], top: tok(o.top, ch.cloth || "accent"), top2: S().darken(tok(o.top, ch.cloth || "accent"), 0.14),
      // trousers and eye whites come from the pack when it says (characters.bottom, characters.white; WS6 2026-10-08)
      bottom: tok(o.bottom, ch.bottom || "field2"), bottom2: S().darken(tok(o.bottom, ch.bottom || "field2"), 0.14), shoe: tok(o.shoe, "ink"),
      ink: tok(ch.ink, "ink"), eye: tok(o.eye, ch.ink || "ink"), white: tok(ch.white, "surface"), mouth: tok(ch.mouth, "accent3"),
      // background extras (runtime/rigs/beans.js "extra"): one muted grey so a crowd never competes with the cast
      extra: tok(o.top || ch.extra, "muted"), extra2: S().darken(tok(o.top || ch.extra, "muted"), 0.12),
    };
  }

  /** vowels of a word, mapped to mouth shapes, so a flap follows the word a little (deterministic) */
  function shapesFor(word) {
    const v = String(word).toLowerCase().replace(/[^a-z]/g, "").match(/[aeiouy]+/g) || ["a"];
    return v.map((s) => (/o|u/.test(s) ? "round" : /a/.test(s) ? "wide" : "open"));
  }

  R.place = function (ctx, name, rigId, o) {
    o = o || {};
    const def = R.defs[rigId];
    if (!def) { Loom.error("rig_missing", `${ctx.beat ? ctx.beat.id + ": " : ""}no rig "${rigId}" (have: ${Object.keys(R.defs).join(", ")})`); return null; }
    const sc = o.scale || 1;
    const [RW, RH] = def.size;
    // (x, y) is where the FEET stand (bottom centre): characters stand on things
    const E = ctx.el(name, { x: (o.x || 0) - (RW * sc) / 2, y: (o.y || 0) - RH * sc, w: RW * sc, h: RH * sc, kind: "character", exit: o.exit || "recede", parent: o.parent });
    // the scale check compares objects to the people beside them (objects.js O.REAL); seated or partial rigs say so
    (Loom.report.figures = Loom.report.figures || []).push({ beat: ctx.beat && ctx.beat.id, name, rig: rigId, h: Math.round(RH * sc * (def.standing_share || 1)), extra: rigId === "extra" || !!o.extra });
    // a figure whose head rises above the station's top edge is cut off at the frame (bench claude-balanced: 21
    // figures in 10 beats, 2026-10-07). Measured in station space: the drawn figure's top (not its box: rigs keep
    // headroom) plus the translations of the element groups it sits in. A parent with any other transform (a scaled
    // depth layer) cannot be resolved here and is not judged. Checked once the figure is drawn, below.
    let figTop = (o.y || 0) - RH * sc, figLeft = (o.x || 0) - (RW * sc) / 2, figKnown = true;
    const pnode = o.parent && !o.parent.appendChild && o.parent.inner ? o.parent.inner : o.parent;   // an element passed whole
    for (let n = pnode || null; n && ctx.g && n !== ctx.g && n.getAttribute; n = n.parentNode) {
      // the mover / life / inner layers carry animation offsets (an entrance's from-state), not placement
      const cls = n.getAttribute("class") || "";
      // inside a clip (a portrait cut to a circle, mfa-story) the figure is MEANT to be cut: the probe judges it on
      // screen, through the clip; here it cannot be judged
      if (n.getAttribute("clip-path")) { figKnown = false; break; }
      const tr = /\blm-(mv|life|in)\b/.test(cls) ? null : n.getAttribute("transform");
      if (!tr) continue;
      const m = /^\s*translate\(\s*(-?[\d.]+)[\s,]+(-?[\d.]+)\s*\)\s*$/.exec(tr);
      if (m) { figLeft += parseFloat(m[1]); figTop += parseFloat(m[2]); } else { figKnown = false; break; }
    }
    const P = slots(def, o);
    const flip = !!o.flip;
    // a contact shadow under a standing figure when the pack asks (shape.contact_shadow, story-cartoon guide s15 E11,
    // 2026-10-08): people stood on nothing in flat rooms
    const cs = S().pack.shape && S().pack.shape.contact_shadow;
    if (cs && (def.standing_share || 1) >= 1 && o.contact !== false) {
      const ry = Math.max(5, 12 * sc);
      Loom.svg("ellipse", { cx: (RW * sc) / 2, cy: RH * sc - ry * 0.6, rx: RW * sc * 0.3, ry, fill: S().c("shadow"), opacity: cs, class: "lm-contact" }, E.inner);
    }
    const root = Loom.svg("g", { transform: `scale(${sc})${flip ? ` translate(${RW} 0) scale(-1 1)` : ""}` }, E.inner);
    const walker = Loom.svg("g", {}, root);
    // build the part tree: each part is a <g> that rotates about its pivot, children nested inside
    const G = {};
    const byParent = {};
    for (const p of def.parts) (byParent[p.parent || ""] = byParent[p.parent || ""] || []).push(p);
    const build = (parentName, host) => {
      for (const p of (byParent[parentName] || []).slice().sort((a, b) => (a.z || 0) - (b.z || 0))) {
        const g = Loom.svg("g", { "data-part": p.name }, host);
        G[p.name] = { g, p };
        if (p.draw) p.draw(g, P, Loom.svg);
        build(p.name, g);
        if (p.drawAfter) p.drawAfter(g, P, Loom.svg);
      }
    };
    if (def.flat) {
      // an imported rig (D-93): every slot drawn FLAT in global z order (a child may sit behind its parent, as the
      // delivery's legs sit behind the pelvis), each a group of its variants; the world matrix is composed per frame
      for (const p of def.parts.slice().sort((a, b) => (a.z || 0) - (b.z || 0))) {
        const g = Loom.svg("g", { "data-part": p.name }, walker);
        const vars = {};
        for (const v in p.variants) { const vg = Loom.svg("g", { "data-variant": v || "base", display: "none" }, g); p.drawVariant(vg, v); vars[v] = vg; }
        G[p.name] = { g, p, vars, cur: null };
      }
    } else build("", walker);
    // the face: swappable eyes, brows and mouths drawn by the rig into named layers
    const face = def.flat ? null : (def.face ? def.face(G, P, Loom.svg) : null);

    const keys = [{ t: -1, pose: o.pose || "idle", dur: 0.01 }];
    const gestures = [], walks = [], emotions = [{ t: -1, e: o.emotion || "neutral" }];
    let talkWin = null, looks = [{ t: -1, dx: 0, dy: 0 }];
    const rng = Loom.rng(`blink:${ctx.beat ? ctx.beat.id : ""}:${name}`);
    const blinks = []; for (let t = ctx.start + 0.6 + rng() * 1.5; t < ctx.end + 2; t += 2.4 + rng() * 2.4) blinks.push(t);
    const words = [];
    for (const ph of (ctx.beat && ctx.beat.phrases) || []) for (const w of ph.words || []) words.push({ s: w.s, e: w.e, shapes: shapesFor(w.w) });

    const poseAt = (t) => {
      let i = 0; while (i + 1 < keys.length && keys[i + 1].t <= t) i++;
      const a = keys[i], prev = keys[i - 1];
      const A = def.flat ? ((def.poses[a.pose] || {}).angles || {}) : (def.poses[a.pose] || {}), B = prev ? (def.flat ? ((def.poses[prev.pose] || {}).angles || {}) : def.poses[prev.pose] || {}) : A;
      const k = springK((t - a.t) / Math.max(0.01, a.dur));
      const out = {};
      if (def.flat) {
        const v3 = (x) => (Array.isArray(x) ? x : [x || 0, 0, 0]);
        for (const p of def.parts) { const a = v3(A[p.name]), b = v3(B[p.name]); const u = prev ? k : 1; out[p.name] = [lerp(b[0], a[0], u), lerp(b[1], a[1], u), lerp(b[2], a[2], u)]; }
        out.__pose = prev && k < 0.5 ? prev.pose : a.pose;
        return out;
      }
      for (const p of def.parts) out[p.name] = lerp(B[p.name] || 0, A[p.name] || 0, prev ? k : 1);
      return out;
    };
    const lastBefore = (arr, t) => { let r = arr[0]; for (const x of arr) if (x.t <= t) r = x; return r; };

    // ---- imported rigs: world matrices, variants by pose / by followed angle / by override, the composable face
    const holds = [];
    const show = (slot, v) => { const S = G[slot]; if (!S) return; if (v === undefined || !(v in S.vars)) v = S.p.default; if (S.cur === v) return; if (S.cur != null && S.vars[S.cur]) S.vars[S.cur].setAttribute("display", "none"); if (v != null && S.vars[v]) S.vars[v].setAttribute("display", "inline"); S.cur = v; };
    const mmul = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]];
    function flatFrame(t, ang) {
      // secondary motion: a breath in the torso, a slow sway of the head
      const add = (n, d) => { if (ang[n]) ang[n] = [ang[n][0] + d, ang[n][1], ang[n][2]]; };
      add(def.breathe || "torso", Math.sin(t * 2.1) * 0.5); add(def.head || "head", Math.sin(t * 1.3 + 0.7) * 1.2);
      for (const gx of gestures) {
        if (t < gx.t0 || t > gx.t1) continue;
        const env = Math.min(1, (t - gx.t0) / 0.25, (gx.t1 - t) / 0.25), fn = (def.gestures || {})[gx.kind];
        if (fn) { const d = fn(t - gx.t0, env); for (const k in d) add(k, d[k] * env); }
      }
      const W = {};
      const world = (n) => {
        if (W[n]) return W[n];
        const S = G[n]; if (!S) return [1, 0, 0, 1, 0, 0];
        const [th, dx, dy] = ang[n] || [0, 0, 0], r = th * Math.PI / 180, c = Math.cos(r), sn = Math.sin(r), [px, py] = S.p.pivot;
        const L = [c, sn, -sn, c, px - c * px + sn * py + dx, py - sn * px - c * py + dy];
        return (W[n] = S.p.parent && G[S.p.parent] ? mmul(world(S.p.parent), L) : L);
      };
      const pose = def.poses[ang.__pose] || {};
      for (const n in G) {
        const M = world(n);
        G[n].g.setAttribute("transform", `matrix(${M.map((v) => v.toFixed(4)).join(" ")})`);
        const S = G[n].p;
        let v = (pose.variants || {})[n];
        if (v === undefined && S.follows && S.follow && S.follow.length) {   // nearest drawing to the followed angle
          const a = (ang[S.follows] || [0])[0]; let best = null, bd = 1e9;
          for (const [fa, fv] of S.follow) { const d = Math.abs(fa - a); if (d < bd) { bd = d; best = fv; } }
          v = best;
        }
        const h = holds.find((x) => x.slot === n && t >= x.t0 && t < x.t1);
        if (h) v = h.v;
        if (!["face", "eye_l", "eye_r", "brow_l", "brow_r", "mouth"].includes(n)) show(n, v);
      }
      // the face: the delivered expression when quiet; while talking or blinking, the composable eyes, brows, mouth
      const em = (def.emotions || {})[lastBefore(emotions, t).e] || (def.emotions || {}).neutral || {};
      const blink = blinks.some((b) => t >= b && t < b + 0.13);
      let mouth = null;
      if (talkWin && t >= talkWin[0] && t <= talkWin[1]) {
        const w = words.find((x) => t >= x.s && t < x.e);
        if (w) { const k = Math.floor((t - w.s) / 0.12); let m = w.shapes[k % w.shapes.length]; if (k % 3 === 2) m = "open"; mouth = (def.visemes || {})[m]; }
        else mouth = (def.visemes || {}).rest;
      }
      if (mouth == null && !blink && G.face && em.face && G.face.vars[em.face]) {
        show("face", em.face); ["eye_l", "eye_r", "brow_l", "brow_r", "mouth"].forEach((x) => show(x, null));
      } else {
        show("face", null);
        show("eye_l", blink ? "closed" : em.eye); show("eye_r", blink ? "closed" : em.eye);
        show("brow_l", em.brow); show("brow_r", em.brow);
        show("mouth", mouth != null ? mouth : em.mouth);
      }
    }

    Loom.drive((e, raw) => {
      const t = ctx.start + raw * (ctx.end + 1.5 - ctx.start);
      const ang = poseAt(t);
      if (def.flat) { flatFrame(t, ang); return; }
      // breathing (always, tiny): a character that is perfectly still reads as a cut-out
      const br = Math.sin(t * 2.1) * 1.2;
      ang[def.breathe || "torso"] = (ang[def.breathe || "torso"] || 0) + br * 0.4;
      ang[def.head || "head"] = (ang[def.head || "head"] || 0) + Math.sin(t * 1.3 + 0.7) * 1.5;
      // additive gestures
      for (const g of gestures) {
        if (t < g.t0 || t > g.t1) continue;
        const env = Math.min(1, (t - g.t0) / 0.25, (g.t1 - t) / 0.25);
        const fn = (def.gestures || {})[g.kind];
        if (fn) { const add = fn(t - g.t0, env); for (const k in add) ang[k] = (ang[k] || 0) + add[k] * env; }
      }
      // walk cycle: legs and arms swing in opposition, the body bobs, the root travels
      let wx = 0, wy = 0;
      for (const w of walks) {
        if (t < w.t0) continue;
        const u = clamp((t - w.t0) / (w.t1 - w.t0), 0, 1);
        wx += w.dx * u;
        if (t <= w.t1) {
          const ph = (t - w.t0) * 2 * Math.PI * (w.steps || 1.8);
          const add = (def.walkCycle || (() => ({})))(ph);
          for (const k in add) ang[k] = (ang[k] || 0) + add[k];
          wy = -Math.abs(Math.sin(ph)) * 8;
        }
      }
      // walk distances are SCREEN pixels: undo the rig scale and the mirror
      walker.setAttribute("transform", `translate(${((flip ? -1 : 1) * wx / sc).toFixed(2)} ${wy.toFixed(2)})`);
      for (const n in G) {
        const { g, p } = G[n];
        const a = clamp(ang[n] || 0, (p.limits || [-360])[0], (p.limits || [0, 360])[1]);
        g.setAttribute("transform", `rotate(${a.toFixed(2)} ${p.pivot[0]} ${p.pivot[1]})`);
      }
      if (face) {
        const em = lastBefore(emotions, t).e;
        const blink = blinks.some((b) => t >= b && t < b + 0.13);
        let mouth = (def.emotionMouth || {})[em] || "rest";
        if (talkWin && t >= talkWin[0] && t <= talkWin[1]) {
          const w = words.find((x) => t >= x.s && t < x.e);
          if (w) { const k = Math.floor((t - w.s) / 0.12); mouth = w.shapes[k % w.shapes.length]; if (k % 3 === 2) mouth = "open"; }
        }
        const lk = lastBefore(looks, t);
        face(em, blink, mouth, lk.dx, lk.dy);
      }
    }, ctx.start, ctx.end + 1.5 - ctx.start, "linear", { kind: "character", beat: E.beat, name: E.name, content: true });

    const api = {
      E,
      /** move to a named pose over dur seconds (a spring, no overshoot) */
      pose(poseName, t, o2) { if (!def.poses[poseName]) Loom.error("rig_pose", `${rigId}: no pose ${poseName}`); keys.push({ t, pose: poseName, dur: (o2 && o2.dur) || 0.45 }); keys.sort((a, b) => a.t - b.t); return t + ((o2 && o2.dur) || 0.45); },
      /** an additive gesture between t0 and t1 (wave, nod, shrug, beat) */
      gesture(kind, t0, t1) { if (!(def.gestures || {})[kind]) Loom.error("rig_gesture", `${rigId}: no gesture ${kind}`); gestures.push({ kind, t0, t1: t1 || t0 + 1.2 }); return t1; },
      /** lip-sync to the narration words inside [t0, t1] (default: the whole beat) */
      talk(t0, t1) { talkWin = [t0 == null ? ctx.speechStart : t0, t1 == null ? ctx.speechEnd : t1]; return api; },
      emotion(e, t) { emotions.push({ t, e }); emotions.sort((a, b) => a.t - b.t); return api; },
      look(dx, dy, t) { looks.push({ t, dx, dy }); looks.sort((a, b) => a.t - b.t); return api; },
      walk(t0, t1, dx, steps) { walks.push({ t0, t1, dx, steps }); return t1; },
      /** imported rigs: show a slot's drawing for a while, e.g. hold("hand_r", "point", t0, t1) */
      hold(slot, variant, t0, t1) { if (!G[slot] || !(variant in G[slot].vars)) Loom.error("rig_variant", `${rigId}: no ${slot} "${variant}"`); holds.push({ slot, v: variant, t0, t1: t1 == null ? 1e9 : t1 }); return api; },
      poses() { return Object.keys(def.poses); },
    };
    // grey extras fill crowds and bleed past the frame on purpose (phishing-report b34); only cast figures are judged
    if (figKnown && rigId !== "extra" && !o.extra) {
      // the drawn figure (not its box: rigs keep headroom and elbow room), mirrored when flipped
      let cy = 0, x0 = 0, x1 = RW * sc;
      try {
        const cb = walker.getBBox();
        if (cb && cb.height > 0) {
          cy = cb.y * sc;
          x0 = (flip ? RW - cb.x - cb.width : cb.x) * sc; x1 = x0 + cb.width * sc;
        }
      } catch (e) { cy = 0; }
      const top = figTop + cy, left = figLeft + x0, right = figLeft + x1, SW = (ctx.station && ctx.station.w) || Loom.W;
      const cut = [top < -1 ? `top at y ${Math.round(top)}` : null, left < -1 ? `left side at x ${Math.round(left)}` : null,
        right > SW + 1 ? `right side at x ${Math.round(right)} (frame ${SW})` : null].filter(Boolean);
      if (cut.length) Loom.warn("figure_cropped", `${ctx.beat ? ctx.beat.id + ": " : ""}character "${name}" (${rigId}) is cut off at the frame: ${cut.join(", ")} in station space (move its feet in, or lower its scale)`, { beat: ctx.beat && ctx.beat.id, name, top: Math.round(top), left: Math.round(left), right: Math.round(right) });
    }
    if (o.talk !== false && o.talk) api.talk();
    (Loom.report.characters = Loom.report.characters || []).push({ beat: ctx.beat ? ctx.beat.id : null, name, rig: rigId });
    return api;
  };
})();

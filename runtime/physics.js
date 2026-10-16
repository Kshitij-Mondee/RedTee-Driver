/* Loom physics: real gravity, collisions and stacking, BAKED (2026-10-08, docs/research/2026-10-08-motion-libraries.md).
 *
 * Matter.js (MIT) simulates a small world ONCE when the scene is built: a fixed 1/60 s step, its own seeded random
 * (never Math.random), never its Runner (that one runs on the wall clock). Every body's pose is recorded per output
 * frame, and one drive on the timeline reads the table: each frame is a pure function of t, so seeking forward,
 * backward or sparsely gives the same picture, and parallel renders are byte-identical.
 *
 *   const w = Loom.physics.world(ctx, "pile", {x, y, w, h, t, seconds: 4, gravity: 1, seed: 7,
 *                                               walls: {floor: true, left: true, right: true}});
 *   w.static({shape: "rect", x, y, w, h, angle})                 // a ramp, a shelf, a peg (world-local, centre)
 *   const E = w.body("card_a", {shape: "rect", x, y, w, h, angle, at, restitution, friction, density,
 *                               draw: (g, W, H) => { kit.rect(g, 0, 0, W, H, {...}) }});   // returns the element
 *   w.run();                                                    // bake and drive; call once, after every body
 *
 * Shapes: rect (w, h, chamfer), circle (r), polygon (sides, r). Coordinates are the world's own (0..w, 0..h, y
 * down), each body by its centre. A body exists from `at` (default t): it appears there (a quick fade) and falls.
 * After `seconds` everything holds its last pose. Use it where the motion IS the meaning: a backlog piling up, a
 * stack that topples, a chain reaction, items sorted into bins. Not for decoration (the motion budget still holds).
 */
// @capability physics | motion | Loom.physics.world(ctx, name, {...}).body(...).run() | Real physics, baked | things that fall, pile up, collide, topple or roll (a backlog piling into a bin, a stack that topples, a chain reaction), simulated once with Matter.js and replayed frame-exactly
(function () {
  "use strict";
  const Loom = window.Loom;
  const P = (Loom.physics = {});
  const FPS_OUT = 30, STEP = 1000 / 60;
  const f2 = (v) => Math.round(v * 100) / 100;

  P.world = function (ctx, name, o) {
    o = o || {};
    const M = window.Matter;
    const t0 = o.t == null ? ctx.start + 0.2 : o.t;
    const seconds = Math.max(0.2, Math.min(o.seconds || 4, 20));
    const box = { x: o.x || 0, y: o.y || 0, w: o.w || 1200, h: o.h || 700 };
    const bodies = [], statics = [];
    let ran = false;
    const api = {
      static(s) { statics.push(s || {}); return api; },
      body(bname, b) {
        b = Object.assign({ shape: "rect" }, b || {});
        const bw = b.shape === "circle" || b.shape === "polygon" ? 2 * (b.r || 40) : (b.w || 120);
        const bh = b.shape === "circle" || b.shape === "polygon" ? 2 * (b.r || 40) : (b.h || 80);
        const E = ctx.el(bname, { x: box.x + (b.x || 0) - bw / 2, y: box.y + (b.y || 0) - bh / 2, w: bw, h: bh, kind: b.kind || "object", exit: b.exit || "recede" });
        const g = Loom.svg("g", {}, E.inner);
        if (typeof b.draw === "function") b.draw(g, bw, bh);
        else Loom.kit.rect(g, 0, 0, bw, bh, { fill: b.fill || "surface", stroke: b.stroke || "ink", r: b.radius == null ? 8 : b.radius });
        bodies.push({ name: bname, spec: b, E, g, w: bw, h: bh, at: b.at == null ? t0 : Math.max(t0, b.at) });
        return E;
      },
      run() {
        if (ran) return api;
        ran = true;
        if (!M) { Loom.error("physics_missing", `${name}: Matter.js is not loaded (compose loads it when a scene calls Loom.physics)`); return api; }
        // a fresh, seeded world: Matter's own seeded random and a reset id counter, so the bake is the same every load
        M.Common._seed = (o.seed == null ? Loom.hash(name) : o.seed) >>> 0 || 1;
        M.Common._nextId = 0;
        const engine = M.Engine.create({ enableSleeping: false });
        engine.gravity.y = o.gravity == null ? 1 : o.gravity;
        engine.gravity.x = o.gravityX || 0;
        const wl = Object.assign({ floor: true, left: true, right: true, ceiling: false }, o.walls || {});
        const T = 200, add = [];
        if (wl.floor) add.push(M.Bodies.rectangle(box.w / 2, box.h + T / 2, box.w + 2 * T, T, { isStatic: true }));
        if (wl.left) add.push(M.Bodies.rectangle(-T / 2, box.h / 2, T, box.h * 3, { isStatic: true }));
        if (wl.right) add.push(M.Bodies.rectangle(box.w + T / 2, box.h / 2, T, box.h * 3, { isStatic: true }));
        if (wl.ceiling) add.push(M.Bodies.rectangle(box.w / 2, -T / 2, box.w + 2 * T, T, { isStatic: true }));
        for (const s of statics) {
          const opt = { isStatic: true, angle: s.angle || 0, friction: s.friction == null ? 0.5 : s.friction };
          add.push(s.shape === "circle" ? M.Bodies.circle(s.x, s.y, s.r || 10, opt) : M.Bodies.rectangle(s.x, s.y, s.w || 100, s.h || 20, opt));
        }
        M.Composite.add(engine.world, add);
        const made = bodies.map((b) => {
          const s = b.spec;
          const opt = { angle: s.angle || 0, restitution: s.restitution == null ? 0.15 : s.restitution, friction: s.friction == null ? 0.4 : s.friction,
                        frictionAir: s.frictionAir == null ? 0.01 : s.frictionAir, density: s.density || 0.001,
                        chamfer: s.shape === "rect" && s.chamfer ? { radius: s.chamfer } : undefined };
          const mb = s.shape === "circle" ? M.Bodies.circle(s.x || 0, s.y || 0, s.r || 40, opt)
            : s.shape === "polygon" ? M.Bodies.polygon(s.x || 0, s.y || 0, s.sides || 6, s.r || 40, opt)
            : M.Bodies.rectangle(s.x || 0, s.y || 0, b.w, b.h, opt);
          if (s.vx || s.vy) M.Body.setVelocity(mb, { x: s.vx || 0, y: s.vy || 0 });
          if (s.spin) M.Body.setAngularVelocity(mb, s.spin);
          return { b, mb, added: false, x0: s.x || 0, y0: s.y || 0, a0: s.angle || 0 };
        });
        // bake: one row per output frame, every body [dx, dy, angle] relative to its own start pose
        const frames = Math.ceil(seconds * FPS_OUT) + 1, perOut = (1000 / FPS_OUT) / STEP;
        const table = made.map(() => new Float32Array(frames * 3));
        let simT = 0;   // ms since t0
        for (let f = 0; f < frames; f++) {
          const until = f * (1000 / FPS_OUT);
          while (simT < until - 1e-6) {
            for (const m of made) {
              if (!m.added && t0 + simT / 1000 >= m.b.at - 1e-6) { M.Composite.add(engine.world, m.mb); m.added = true; }
            }
            // the last quarter brings everything to rest (air friction rises), so the beat ends on a finished frame
            // that can hold; the lab's first queue never settled (a card on its end kept sliding). `rest: false` opts out
            if (o.rest !== false && simT > 0.75 * seconds * 1000) {
              const k = (simT - 0.75 * seconds * 1000) / (0.25 * seconds * 1000);
              for (const m of made) if (m.added) m.mb.frictionAir = Math.max(m.mb.frictionAir, (m.b.spec.frictionAir || 0.01) + 0.3 * k);
            }
            M.Engine.update(engine, STEP);
            simT += STEP;
          }
          made.forEach((m, i) => {
            const p = m.mb.position;
            table[i][f * 3] = p.x - m.x0; table[i][f * 3 + 1] = p.y - m.y0; table[i][f * 3 + 2] = m.mb.angle - m.a0;
          });
        }
        void perOut;
        const apply = (fr) => {
          const i0 = Math.max(0, Math.min(frames - 1, Math.floor(fr))), i1 = Math.min(frames - 1, i0 + 1), k = Math.max(0, Math.min(1, fr - i0));
          made.forEach((m, i) => {
            const T3 = table[i];
            const dx = T3[i0 * 3] + (T3[i1 * 3] - T3[i0 * 3]) * k, dy = T3[i0 * 3 + 1] + (T3[i1 * 3 + 1] - T3[i0 * 3 + 1]) * k;
            const da = T3[i0 * 3 + 2] + (T3[i1 * 3 + 2] - T3[i0 * 3 + 2]) * k;
            m.b.g.setAttribute("transform", `translate(${f2(dx)} ${f2(dy)}) rotate(${f2(da * 180 / Math.PI)} ${f2(m.b.w / 2)} ${f2(m.b.h / 2)})`);
          });
        };
        apply(0);
        // the baked poses, readable by code (recipes check their outcome on them; D-139): p 0..1 over the world's
        // seconds -> {name: {x, y, a}} in world-local coordinates (body centres), interpolated exactly as drawn
        api.frames = frames;
        api.posesAt = (p) => {
          const fr = Math.max(0, Math.min(1, p)) * (frames - 1);
          const i0 = Math.floor(fr), i1 = Math.min(frames - 1, i0 + 1), k = fr - i0, out = {};
          made.forEach((m, i) => {
            const T3 = table[i], L = (j) => T3[i0 * 3 + j] + (T3[i1 * 3 + j] - T3[i0 * 3 + j]) * k;
            out[m.b.name] = { x: m.x0 + L(0), y: m.y0 + L(1), a: m.a0 + L(2) };
          });
          return out;
        };
        Loom.drive((_e, p) => apply(p * (frames - 1)), t0, seconds, "linear", { kind: "physics", beat: ctx.beat && ctx.beat.id, name, key: `physics.${name}`, content: true });
        // each body appears at its own time (an entrance, so it is hidden before)
        for (const m of made) {
          Loom.tween(m.b.E.life, { opacity: 0 }, { opacity: 1, duration: 0.18, ease: Loom.ease.enter }, m.b.at, { kind: "enter", beat: ctx.beat && ctx.beat.id, name: m.b.name, content: true });
        }
        const last = frames - 1;
        // settled: under about 15 px a second over the last 0.1 s (a resting pile keeps a sub-pixel shiver)
        const moving = made.filter((m, i) => {
          const T3 = table[i], a = (last - 3) * 3;
          return !(Math.hypot(T3[last * 3] - T3[a], T3[last * 3 + 1] - T3[a + 1]) < 1.5);
        }).map((m) => m.b.name);
        const still = moving.length === 0;
        // a body that left the world's box (fell past the floor or out at a side) is lost from the picture
        const lost = made.filter((m, i) => {
          const T3 = table[i], x = m.x0 + T3[last * 3], y = m.y0 + T3[last * 3 + 1];
          return y > box.h + 200 || x < -400 || x > box.w + 400;
        }).map((m) => m.b.name);
        if (!still) Loom.warn("physics_not_settled", `${name}: still moving at the end of ${seconds} s: ${moving.join(", ")}; give the world more seconds or more friction`);
        if (lost.length) Loom.warn("physics_lost", `${name}: left the world: ${lost.join(", ")}; add a wall or a floor`);
        (Loom.report.physics = Loom.report.physics || []).push({ beat: ctx.beat && ctx.beat.id, name, bodies: made.length, seconds, frames, settled: still, moving, lost });
        return api;
      },
      get t0() { return t0; },
    };
    return api;
  };
})();

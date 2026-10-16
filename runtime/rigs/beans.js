/* Loom's own outlined cartoon people (CC0, drawn by code): "pip", "tess" and "extra". The story-cartoon look:
 * a big round head, a bean-shaped body, single-stroke limbs, dot eyes, a dark outline round everything and one
 * crisp cel shade per volume. Designed for Loom (no existing character is copied): what the study of story
 * channels showed is the register (outline + flat + small cast + grey extras), not any one character.
 * Same 400 x 900 design box, feet at y = 900, and the same part names and pose angles as runtime/rigs/people.js,
 * so every pose, gesture and walk works on these too. "extra" is a grey background figure for crowds: no face
 * detail, no colour, so it never competes with the cast (the de-emphasis the reference channels use).
 */
(function () {
  "use strict";
  const Loom = window.Loom;
  const OUT = 7;                                         // outline width in design units (about 5 px at scale 0.75)
  const limb = (g, s, x1, y1, x2, y2, P) =>               // a stick limb: one round-capped stroke in the ink colour
    s("line", { x1, y1, x2, y2, stroke: P.ink, "stroke-width": 12, "stroke-linecap": "round" }, g);

  function bean(id, o) {
    const grey = !!o.grey;
    const parts = [
      { name: "thigh_l", parent: "", pivot: [180, 640], z: 1, limits: [-60, 60], draw: (g, P, s) => limb(g, s, 180, 640, 178, 770, P) },
      { name: "shin_l", parent: "thigh_l", pivot: [178, 770], z: 1, limits: [-5, 110], draw: (g, P, s) => {
        limb(g, s, 178, 770, 177, 878, P); s("ellipse", { cx: 166, cy: 884, rx: 26, ry: 12, fill: P.ink }, g); } },
      { name: "thigh_r", parent: "", pivot: [220, 640], z: 1, limits: [-60, 60], draw: (g, P, s) => limb(g, s, 220, 640, 222, 770, P) },
      { name: "shin_r", parent: "thigh_r", pivot: [222, 770], z: 1, limits: [-110, 5], draw: (g, P, s) => {
        limb(g, s, 222, 770, 223, 878, P); s("ellipse", { cx: 234, cy: 884, rx: 26, ry: 12, fill: P.ink }, g); } },
      { name: "torso", parent: "", pivot: [200, 640], z: 2, limits: [-25, 25], draw: (g, P, s) => {
        const body = "M132 430 q0 -58 68 -58 q68 0 68 58 l10 150 q0 64 -78 64 q-78 0 -78 -64 z";
        const fill = grey ? P.extra : P.top;
        s("path", { d: body, fill }, g);
        s("path", { d: "M232 380 q36 14 36 50 l10 150 q0 52 -54 62 q22 -40 18 -110 z", fill: grey ? P.extra2 : P.top2 }, g);   // cel shade
        if (!grey && o.collar) s("path", { d: "M176 376 l24 40 l24 -40", fill: "none", stroke: P.ink, "stroke-width": 5, "stroke-linejoin": "round" }, g);
        s("path", { d: body, fill: "none", stroke: P.ink, "stroke-width": OUT, "stroke-linejoin": "round" }, g);
      } },
      { name: "upper_l", parent: "torso", pivot: [148, 430], z: 1, limits: [-40, 190], draw: (g, P, s) => limb(g, s, 148, 430, 136, 520, P) },
      { name: "fore_l", parent: "upper_l", pivot: [136, 520], z: 1, limits: [-10, 160], draw: (g, P, s) => {
        limb(g, s, 136, 520, 132, 604, P); s("circle", { cx: 132, cy: 612, r: 13, fill: P.ink }, g); } },
      { name: "upper_r", parent: "torso", pivot: [252, 430], z: 3, limits: [-190, 40], draw: (g, P, s) => limb(g, s, 252, 430, 264, 520, P) },
      { name: "fore_r", parent: "upper_r", pivot: [264, 520], z: 3, limits: [-160, 10], draw: (g, P, s) => {
        limb(g, s, 264, 520, 268, 604, P); s("circle", { cx: 268, cy: 612, r: 13, fill: P.ink }, g); } },
      { name: "head", parent: "torso", pivot: [200, 378], z: 4, limits: [-20, 20], draw: (g, P, s) => {
        const skin = grey ? P.extra : P.skin;
        if (!grey && o.hairBack) s("path", { d: o.hairBack, fill: P.hair, stroke: P.ink, "stroke-width": OUT, "stroke-linejoin": "round" }, g);
        s("circle", { cx: 200, cy: 250, r: 124, fill: skin }, g);
        const id = "lmbean" + (Loom.__beanN = (Loom.__beanN || 0) + 1);
        const cp = s("clipPath", { id }, g); s("circle", { cx: 200, cy: 250, r: 124 }, cp);
        s("circle", { cx: 300, cy: 280, r: 110, fill: grey ? P.extra2 : P.skin2, "clip-path": `url(#${id})` }, g);      // cel shade on the far side
        s("circle", { cx: 200, cy: 250, r: 124, fill: "none", stroke: P.ink, "stroke-width": OUT }, g);
        g.__face = s("g", { class: "lm-face" }, g);
        if (!grey && o.hairFront) s("path", { d: o.hairFront, fill: P.hair, stroke: P.ink, "stroke-width": OUT, "stroke-linejoin": "round" }, g);
      } },
    ];
    const poses = {
      idle: { upper_l: 10, upper_r: -10, fore_l: 6, fore_r: -6 },
      explain: { upper_l: 24, fore_l: 70, upper_r: -28, fore_r: -78, head: 3 },
      point: { upper_l: 10, fore_l: 6, upper_r: -96, fore_r: -8, torso: -3, head: -4 },
      wave: { upper_l: 10, fore_l: 6, upper_r: -150, fore_r: -30, head: 4 },
      think: { upper_l: 26, fore_l: 110, upper_r: -24, fore_r: -150, head: 7 },
      shrug: { upper_l: 42, fore_l: 95, upper_r: -42, fore_r: -95, head: -6 },
      cheer: { upper_l: 160, fore_l: 20, upper_r: -160, fore_r: -20, head: -3 },
      present: { upper_l: 10, fore_l: 6, upper_r: -60, fore_r: -55, torso: -4 },
    };
    const gestures = {
      wave: (u) => ({ fore_r: 22 * Math.sin(u * 2 * Math.PI * 2.2) }),
      nod: (u) => ({ head: 7 * Math.sin(u * 2 * Math.PI * 1.6) }),
      shake: (u) => ({ head: 0, torso: 2.5 * Math.sin(u * 2 * Math.PI * 2.4) }),
      beat: (u) => ({ fore_r: -10 * Math.max(0, Math.sin(u * 2 * Math.PI * 1.4)), fore_l: 10 * Math.max(0, Math.sin(u * 2 * Math.PI * 1.4 + 1)) }),
      shrug: (u) => ({ upper_l: 6 * Math.sin(u * Math.PI * 2), upper_r: -6 * Math.sin(u * Math.PI * 2) }),
    };
    const walkCycle = (ph) => ({ thigh_l: 22 * Math.sin(ph), thigh_r: -22 * Math.sin(ph), shin_l: 18 * Math.max(0, -Math.sin(ph)), shin_r: -18 * Math.max(0, Math.sin(ph)),
      upper_l: -16 * Math.sin(ph), upper_r: -16 * Math.sin(ph), torso: 1.5 * Math.sin(ph * 2) });
    const face = (G, P, s) => {
      const f = G.head.g.__face;
      if (grey) return () => {};                         // extras have no face: they are the crowd, not the cast
      const eyes = [162, 238].map((x) => {
        const pupil = s("circle", { cx: x, cy: 244, r: 11, fill: P.ink }, f);
        const lid = s("rect", { x: x - 16, y: 228, width: 32, height: 0, fill: P.skin }, f);
        return { pupil, lid, x };
      });
      const brows = [162, 238].map(() => s("path", { d: "", stroke: P.ink, "stroke-width": 6, "stroke-linecap": "round", fill: "none" }, f));
      const mouth = s("path", { d: "", fill: P.mouth, stroke: P.ink, "stroke-width": 5, "stroke-linejoin": "round", "stroke-linecap": "round" }, f);
      const MOUTH = {
        rest: "M184 300 q16 7 32 0", smile: "M178 294 q22 22 44 0 q-22 8 -44 0 z", open: "M186 292 q14 -4 28 0 q-2 18 -14 18 q-12 0 -14 -18 z",
        wide: "M178 290 q22 -6 44 0 q-4 22 -22 22 q-18 0 -22 -22 z", round: "M190 290 q10 -5 20 0 q2 18 -10 18 q-12 0 -10 -18 z", oh: "M188 286 q12 -7 24 0 q3 24 -12 24 q-15 0 -12 -24 z",
      };
      const BROW = { neutral: [-2, 0], happy: [-6, 3], surprised: [-14, 0], concerned: [-5, -7], focused: [3, 6] };
      return (em, blink, mouthName, dx, dy) => {
        for (const e of eyes) {
          e.pupil.setAttribute("cx", (e.x + dx * 5).toFixed(1)); e.pupil.setAttribute("cy", (244 + dy * 4).toFixed(1));
          e.lid.setAttribute("height", blink ? 32 : 0);
        }
        const [lift, tilt] = BROW[em] || BROW.neutral;
        brows[0].setAttribute("d", `M146 ${214 + lift + tilt} q16 -8 30 ${-tilt}`);
        brows[1].setAttribute("d", `M224 ${214 + lift} q16 -8 30 ${tilt}`);
        const m = mouthName === "rest" ? (em === "happy" ? "smile" : em === "surprised" ? "oh" : "rest") : mouthName;
        mouth.setAttribute("d", MOUTH[m] || MOUTH.rest);
        mouth.setAttribute("fill", m === "rest" ? "none" : P.mouth);
      };
    };
    Loom.rig.define(id, { size: [400, 900], parts, poses, gestures, walkCycle, face, breathe: "torso", head: "head",
      emotionMouth: { happy: "rest", surprised: "rest" }, doc: o.doc, outlined: true });
  }

  bean("pip", {
    doc: "Pip: outlined cartoon person, short side-swept hair, collar. Story-cartoon look; same poses as ava and sam.",
    collar: true,
    hairFront: "M80 236 q-6 -120 120 -112 q118 -4 124 104 q-40 -50 -112 -52 q-40 30 -132 60 z",
  });
  bean("tess", {
    doc: "Tess: outlined cartoon person with a bob. Story-cartoon look; same poses as ava and sam.",
    hairBack: "M70 260 q-10 -150 130 -150 q140 0 130 150 l6 96 q-40 10 -52 -20 l-8 -70 h-152 l-8 70 q-12 30 -52 20 z",
    hairFront: "M80 228 q16 -112 120 -112 q106 0 120 112 q-60 -46 -120 -56 q-50 36 -120 56 z",
  });
  bean("extra", { doc: "Extra: a grey background figure for crowds (no face, no colour). Use many, small and behind the cast.", grey: true });
})();

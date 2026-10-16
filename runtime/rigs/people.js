/* Loom's own rigged people (CC0, drawn by code): "ava" and "sam", front view, 400 x 900 design box,
 * feet at y = 900. Flat shapes with one darker shade per volume (the explainer look), colours from slots.
 * Angles are degrees, clockwise positive (SVG). Viewer's left arm rotates OUT with +, right arm with -.
 */
(function () {
  "use strict";
  const Loom = window.Loom;
  const cap = (g, svg, x1, y1, x2, y2, w, fill, shade) => {       // a limb: a capsule from (x1,y1) to (x2,y2)
    svg("line", { x1, y1, x2, y2, stroke: fill, "stroke-width": w, "stroke-linecap": "round" }, g);
    if (shade) svg("line", { x1: x1 + w * 0.18, y1, x2: x2 + w * 0.18, y2, stroke: shade, "stroke-width": w * 0.36, "stroke-linecap": "round", opacity: 0.55 }, g);
  };

  function person(id, o) {
    const hairBack = o.hairBack, hairFront = o.hairFront;
    const parts = [
      // legs (behind the torso)
      { name: "thigh_l", parent: "", pivot: [178, 540], z: 1, limits: [-60, 60], draw: (g, P, s) => cap(g, s, 178, 540, 176, 705, 46, P.bottom, P.bottom2) },
      { name: "shin_l", parent: "thigh_l", pivot: [176, 705], z: 1, limits: [-5, 110], draw: (g, P, s) => { cap(g, s, 176, 705, 175, 860, 40, P.bottom, P.bottom2); s("path", { d: "M150 850 h52 q18 0 18 18 v14 h-78 v-14 q0 -18 8 -18 z", fill: P.shoe }, g); } },
      { name: "thigh_r", parent: "", pivot: [222, 540], z: 1, limits: [-60, 60], draw: (g, P, s) => cap(g, s, 222, 540, 224, 705, 46, P.bottom, P.bottom2) },
      { name: "shin_r", parent: "thigh_r", pivot: [224, 705], z: 1, limits: [-110, 5], draw: (g, P, s) => { cap(g, s, 224, 705, 225, 860, 40, P.bottom, P.bottom2); s("path", { d: "M198 850 h52 q8 0 8 18 v14 h-78 v-14 q0 -18 18 -18 z", fill: P.shoe }, g); } },
      // the torso rotates about the hips; arms and head hang from it
      { name: "torso", parent: "", pivot: [200, 540], z: 2, limits: [-25, 25], draw: (g, P, s) => {
        s("path", { d: o.torsoPath, fill: P.top }, g);
        s("path", { d: o.torsoShade, fill: P.top2, opacity: 0.8 }, g);
        s("rect", { x: 186, y: 318, width: 28, height: 30, rx: 10, fill: P.skin }, g);        // neck
      } },
      { name: "upper_l", parent: "torso", pivot: [146, 372], z: 1, limits: [-40, 190], draw: (g, P, s) => cap(g, s, 146, 372, 132, 492, 38, P.top, P.top2) },
      { name: "fore_l", parent: "upper_l", pivot: [132, 492], z: 1, limits: [-10, 160], draw: (g, P, s) => { cap(g, s, 132, 492, 128, 600, 30, P.skin, P.skin2); s("circle", { cx: 128, cy: 612, r: 20, fill: P.skin }, g); } },
      { name: "upper_r", parent: "torso", pivot: [254, 372], z: 3, limits: [-190, 40], draw: (g, P, s) => cap(g, s, 254, 372, 268, 492, 38, P.top, P.top2) },
      { name: "fore_r", parent: "upper_r", pivot: [268, 492], z: 3, limits: [-160, 10], draw: (g, P, s) => { cap(g, s, 268, 492, 272, 600, 30, P.skin, P.skin2); s("circle", { cx: 272, cy: 612, r: 20, fill: P.skin }, g); } },
      { name: "head", parent: "torso", pivot: [200, 330], z: 4, limits: [-20, 20], draw: (g, P, s) => {
        if (hairBack) s("path", { d: hairBack, fill: P.hair }, g);
        s("ellipse", { cx: 200, cy: 250, rx: 64, ry: 74, fill: P.skin }, g);
        s("path", { d: "M136 262 q64 70 128 0 q-6 58 -64 66 q-58 -8 -64 -66 z", fill: P.skin2, opacity: 0.35 }, g); // jaw shade
        s("ellipse", { cx: 136, cy: 258, rx: 10, ry: 16, fill: P.skin }, g); s("ellipse", { cx: 264, cy: 258, rx: 10, ry: 16, fill: P.skin }, g);
        g.__face = s("g", { class: "lm-face" }, g);
        if (hairFront) s("path", { d: hairFront, fill: P.hair }, g);
      } },
    ];
    const poses = {
      idle: { upper_l: 8, upper_r: -8, fore_l: 6, fore_r: -6 },
      explain: { upper_l: 22, fore_l: 70, upper_r: -26, fore_r: -78, head: 3 },
      point: { upper_l: 8, fore_l: 6, upper_r: -96, fore_r: -8, torso: -3, head: -4 },
      wave: { upper_l: 8, fore_l: 6, upper_r: -150, fore_r: -30, head: 4 },
      think: { upper_l: 26, fore_l: 110, upper_r: -24, fore_r: -150, head: 7 },
      shrug: { upper_l: 40, fore_l: 95, upper_r: -40, fore_r: -95, head: -6, torso: 0 },
      cheer: { upper_l: 160, fore_l: 20, upper_r: -160, fore_r: -20, head: -3 },
      present: { upper_l: 8, fore_l: 6, upper_r: -60, fore_r: -55, torso: -4 },
    };
    const gestures = {
      wave: (u) => ({ fore_r: 22 * Math.sin(u * 2 * Math.PI * 2.2) }),
      nod: (u) => ({ head: 7 * Math.sin(u * 2 * Math.PI * 1.6) }),
      shake: (u) => ({ head: 0, torso: 2.5 * Math.sin(u * 2 * Math.PI * 2.4) }),
      beat: (u) => ({ fore_r: -10 * Math.max(0, Math.sin(u * 2 * Math.PI * 1.4)), fore_l: 10 * Math.max(0, Math.sin(u * 2 * Math.PI * 1.4 + 1)) }),
      shrug: (u) => ({ upper_l: 6 * Math.sin(u * Math.PI * 2), upper_r: -6 * Math.sin(u * Math.PI * 2) }),
    };
    const walkCycle = (ph) => ({ thigh_l: 22 * Math.sin(ph), thigh_r: -22 * Math.sin(ph), shin_l: 18 * Math.max(0, -Math.sin(ph)), shin_r: -18 * Math.max(0, Math.sin(ph)),
      upper_l: -14 * Math.sin(ph), upper_r: -14 * Math.sin(ph), torso: 1.5 * Math.sin(ph * 2) });
    const face = (G, P, s) => {
      const f = G.head.g.__face;
      const eyes = [178, 222].map((x) => {
        const w = s("ellipse", { cx: x, cy: 246, rx: 11, ry: 13, fill: P.white }, f);
        const pupil = s("circle", { cx: x, cy: 248, r: 6.5, fill: P.eye }, f);
        const lid = s("rect", { x: x - 13, y: 232, width: 26, height: 0, fill: P.skin }, f);
        return { w, pupil, lid, x };
      });
      const brows = [178, 222].map((x) => s("path", { d: "", stroke: P.hair, "stroke-width": 5, "stroke-linecap": "round", fill: "none" }, f));
      const mouth = s("path", { d: "", fill: P.mouth, stroke: P.ink, "stroke-width": 2.5, "stroke-linejoin": "round" }, f);
      const MOUTH = {
        rest: "M186 290 q14 6 28 0", smile: "M182 286 q18 16 36 0 q-18 8 -36 0 z", open: "M188 286 q12 -4 24 0 q-2 14 -12 14 q-10 0 -12 -14 z",
        wide: "M182 285 q18 -5 36 0 q-4 18 -18 18 q-14 0 -18 -18 z", round: "M192 284 q8 -4 16 0 q2 16 -8 16 q-10 0 -8 -16 z", oh: "M190 282 q10 -6 20 0 q2 20 -10 20 q-12 0 -10 -20 z",
      };
      const BROW = { neutral: [-2, 0], happy: [-5, 3], surprised: [-12, 0], concerned: [-4, -6], focused: [2, 5] };
      return (em, blink, mouthName, dx, dy) => {
        for (const e of eyes) {
          e.pupil.setAttribute("cx", (e.x + dx * 4).toFixed(1)); e.pupil.setAttribute("cy", (248 + dy * 3).toFixed(1));
          e.lid.setAttribute("height", blink ? 30 : 0);
        }
        const [lift, tilt] = BROW[em] || BROW.neutral;
        brows[0].setAttribute("d", `M164 ${226 + lift + tilt} q14 -8 26 ${-tilt}`);
        brows[1].setAttribute("d", `M210 ${226 + lift} q14 -8 26 ${tilt}`);
        const m = mouthName === "rest" ? (em === "happy" ? "smile" : em === "surprised" ? "oh" : "rest") : mouthName;
        mouth.setAttribute("d", MOUTH[m] || MOUTH.rest);
        mouth.setAttribute("fill", m === "rest" ? "none" : P.mouth);
      };
    };
    Loom.rig.define(id, { size: [400, 900], parts, poses, gestures, walkCycle, face, breathe: "torso", head: "head",
      emotionMouth: { happy: "rest", surprised: "rest" }, doc: o.doc });
  }

  person("ava", {
    doc: "Ava: a woman with a bob, fitted top. Poses idle, explain, point, wave, think, shrug, cheer, present.",
    torsoPath: "M150 356 q50 -30 100 0 l10 190 q-60 18 -120 0 z",
    torsoShade: "M222 346 q20 4 28 10 l10 190 q-18 6 -36 8 z",
    hairBack: "M128 250 q-4 -104 72 -106 q76 2 72 106 l4 70 q-18 6 -26 -10 l-4 -60 h-92 l-4 60 q-8 16 -26 10 z",
    hairFront: "M134 232 q10 -84 66 -84 q58 0 68 84 q-30 -40 -70 -46 q-26 26 -64 46 z",
  });
  person("sam", {
    doc: "Sam: a man with short hair, loose shirt. Poses idle, explain, point, wave, think, shrug, cheer, present.",
    torsoPath: "M144 352 q56 -26 112 0 l6 196 q-62 14 -124 0 z",
    torsoShade: "M226 344 q22 4 30 8 l6 196 q-18 6 -36 6 z",
    hairBack: null,
    hairFront: "M136 236 q-2 -92 64 -94 q70 -2 70 88 q-24 -30 -60 -34 q-30 18 -74 40 z",
  });
})();

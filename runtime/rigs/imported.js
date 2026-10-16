/* Imported character rigs (D-93): assets/rigs/<id>.json, written by tools/rig_import.py from a Claude Design delivery,
 * become rigs here. Compose and the lab embed a rig's data only when a scene casts it (ctx.character(name, "<id>")),
 * as Loom.assets.rigs[id]. The rig is FLAT (runtime/rig.js): every slot drawn in the delivery's z order, its world
 * matrix composed from the delivery's pivots and parents, its drawing picked by pose, by the followed angle (a
 * deltoid follows its arm) or by ctx hold(slot, variant, t0, t1). Faces: the delivered expression when quiet, the
 * composable eyes, brows and mouth (visemes from the narration) while talking or blinking.
 *   const maya = ctx.character("maya", "maya", { x: 700, y: 1000, scale: 0.46 });
 *   maya.pose("explain", ctx.cue("one piece of work")); maya.talk(); maya.emotion("concern", t); maya.hold("hand_r", "point", t0, t1);
 */
(function () {
  "use strict";
  const Loom = window.Loom;
  let n = 0;
  const GESTURES = {
    nod: (u) => ({ head: 5 * Math.sin(u * 9) }),
    beat: (u) => ({ forearm_r: 8 * Math.sin(u * 7), forearm_l: -6 * Math.sin(u * 7 + 1) }),
    wave: (u) => ({ forearm_r: 18 * Math.sin(u * 10) }),
    shrug: (u) => ({ upper_arm_r: 8 * Math.sin(Math.min(1, u * 2) * Math.PI), upper_arm_l: -8 * Math.sin(Math.min(1, u * 2) * Math.PI), head: -4 }),
    tilt: (u) => ({ head: 6 * Math.min(1, u * 3) }),
  };
  function install() {
    const R = (Loom.assets || {}).rigs || {};
    for (const id in R) {
      const d = R[id];
      const parts = d.parts.map((p) => Object.assign({}, p, {
        drawVariant(g, v) {
          const uid = `rg${n++}_`;
          g.innerHTML = String(p.variants[v] || "").replace(/id="([^"]+)"/g, (m, x) => `id="${uid}${x}"`)
            .replace(/url\(#([^)]+)\)/g, (m, x) => `url(#${uid}${x})`).replace(/href="#([^"]+)"/g, (m, x) => `href="#${uid}${x}"`);
        },
      }));
      Loom.rig.define(id, { flat: true, size: d.size, parts, poses: d.poses, emotions: d.emotions, visemes: d.visemes,
        gestures: GESTURES, breathe: "torso", head: "head", imported: { batch: d.batch, source: d.source } });
    }
  }
  if (Loom.rig) install();
  Loom.rigImported = { install };
})();

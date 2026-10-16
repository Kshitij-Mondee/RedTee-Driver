// Assemble a Claude Design character delivery from ITS OWN FILES, posed by ITS OWN pose data, for review.
//   node tools/node/rig_review.mjs <engine dir> <batch dir> <out dir>
// <engine dir> holds the delivery's engine/maya_story.js and engine/maya_views.js (the pose and joint data).
// <batch dir> is the intake batch (assets/incoming/<batch>/) with the delivered part SVGs and manifest.json.
// The delivery's engine supplies only TRANSFORMS (placeList / jointList); every drawing comes from the delivered
// part file, so what we review is what the importer would import. Writes one SVG per pose and per joint angle,
// and report.json: the poses, the parts each one uses, and any part a pose needs that the delivery lacks.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const [engineDir, batchDir, outDir] = process.argv.slice(2);
if (!engineDir || !batchDir || !outDir) { console.error("usage: rig_review.mjs <engine dir> <batch dir> <out dir>"); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });
const ctx = vm.createContext({ console, Math, JSON, Object, Array, Number, String, Set, Map, RegExp });
ctx.globalThis = ctx; ctx.window = ctx;
for (const f of ["maya_story.js", "maya_views.js"]) {
  const p = path.join(engineDir, f);
  if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, "utf8"), ctx, { filename: f });
}
const MS = ctx.MayaStory, MV = ctx.MayaViews;
if (!MS) { console.error("no MayaStory in the engine dir"); process.exit(2); }
// a measure that never clips: the delivered files carry their own viewBoxes, used below
const built = MS.buildParts(() => ({ x: 0, y: 0, width: 1000, height: 2000 }));
const fileCache = {};
function part(p) {
  if (p in fileCache) return fileCache[p];
  const f = path.join(batchDir, p + ".svg");
  if (!fs.existsSync(f)) return (fileCache[p] = null);
  const s = fs.readFileSync(f, "utf8").replace(/<metadata>[\s\S]*?<\/metadata>/g, "");
  const vb = (s.match(/viewBox="([^"]+)"/) || [])[1];
  return (fileCache[p] = { svg: s, vb: vb ? vb.split(/[\s,]+/).map(Number) : [0, 0, 1000, 2000] });
}
function compose(list, viewBox) {
  const missing = [], used = [];
  const body = list.map(([p, tf]) => {
    const P = part(p);
    if (!P) { missing.push(p); return ""; }
    used.push(p);
    const m = (tf.match(/matrix\(([^)]*)\)/) || [])[1] || "1 0 0 1 0 0";
    return `<g transform="matrix(${m}) translate(${P.vb[0]} ${P.vb[1]})">${P.svg}</g>`;
  }).join("");
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="1000" height="2000"><rect x="-500" y="-500" width="2000" height="3000" fill="#F4F1EA"/>${body}</svg>`, missing, used };
}
const report = { poses: [], joints: [], missing: {} };
const poseSets = [["front", MS.POSE3, null], ["34front", (MV && MV.POSES34) || {}, (MV && MV.POSES34) || null]];
for (const [view, set, arg] of poseSets) {
  for (const name of Object.keys(set)) {
    let list;
    try { list = MS.placeList(name, built, arg || undefined); } catch (e) { report.poses.push({ name, view, error: String(e.message) }); continue; }
    const C = compose(list, "0 0 1000 2000");
    const f = path.join(outDir, `pose_${view}_${name}.svg`);
    fs.writeFileSync(f, C.svg);
    report.poses.push({ name, view, label: set[name].label || "", parts: C.used.length, missing: C.missing, file: f, expr: set[name].expr || null, hands: set[name].hands || null });
    for (const m of C.missing) report.missing[m] = (report.missing[m] || 0) + 1;
  }
}
// the joint test the v1 review asked for: the right arm raised 0..170, then the elbow bent 0..150
const grid = [[0, 0], [45, 0], [90, 0], [135, 0], [170, 0], [20, 60], [20, 120], [20, 150]];
for (const [up, fore] of grid) {
  const C = compose(MS.jointList(up, fore, built), "150 500 520 760");
  const f = path.join(outDir, `joint_up${up}_fore${fore}.svg`);
  fs.writeFileSync(f, C.svg.replace('width="1000" height="2000"', 'width="520" height="760"'));
  report.joints.push({ up, fore, file: f, missing: C.missing });
}
fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(report, null, 1));
console.log(`rig_review: ${report.poses.length} poses, ${report.joints.length} joint frames, ${Object.keys(report.missing).length} missing part file(s)`);

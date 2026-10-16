// Extract template/blueprint metadata from the runtime (no browser needed): writes runtime/catalog.json
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..", "..");
const rt = path.join(root, "runtime");
const stubEl = () => ({ getContext: () => ({ measureText: () => ({ width: 0 }) }), setAttribute() {}, appendChild() {}, style: {} });
const ctx = { console, Math, JSON, Object, Array, String, Number, Promise, WeakMap, Map, Set };
ctx.window = ctx;
ctx.document = { createElement: stubEl, createElementNS: stubEl, head: { appendChild() {} }, fonts: { ready: Promise.resolve() } };
vm.createContext(ctx);
const order = ["core.js", "style.js", "kit.js", "motion.js", "world.js", "overlay.js", "components.js", "boot.js"];
for (const f of order) vm.runInContext(fs.readFileSync(path.join(rt, f), "utf8"), ctx, { filename: f });
for (const dir of ["templates", "blueprints", "components"]) {
  if (!fs.existsSync(path.join(rt, dir))) continue;
  const files = fs.readdirSync(path.join(rt, dir)).filter((f) => f.endsWith(".js")).sort((a, b) => (a.startsWith("_") ? -1 : b.startsWith("_") ? 1 : a.localeCompare(b)));
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(rt, dir, f), "utf8"), ctx, { filename: `${dir}/${f}` });
}
const L = ctx.Loom;
const pick = (d) => ({ chrome: d.chrome || [], promoted_from_design: d.promoted_from_design || null, doc: d.doc || "", job: d.job || [], register: d.register || "productive", motion_is: d.motion_is || "staging", props: d.props || {}, defaults: d.defaults || {}, example: d.example || null });
const out = { generated_by: "tools/node/catalog.mjs (do not hand-edit)", templates: {}, blueprints: {}, components: {} };
for (const c of L.component.list()) out.components[c.id] = { version: c.version, idea: c.idea, outline: c.outline, params: Object.fromEntries(Object.entries(c.params || {}).map(([k, s]) => [k, Object.fromEntries(Object.entries(s).filter(([kk]) => kk !== "fn"))])), slots: c.slots || {}, parts: c.parts || [], promoted_from: c.promoted_from || [], commissioned_by: c.commissioned_by || null, styles: c.styles || null, family: c.family || null, tags: c.tags || [], example: c.example || null, versions: Object.keys(L.components).filter((k) => k.startsWith(c.id + "@")) };
for (const [k, v] of Object.entries(L.templates)) out.templates[k] = pick(v);
for (const [k, v] of Object.entries(L.blueprints)) out.blueprints[k] = pick(v);
// the avatar (presenter) kind's props (runtime/overlay.js AVATAR_PROPS): the storyboard gate validates avatar beats
// against them, and a key outside them is the runtime's avatar_props_unknown error (RC17)
if (L.presenter && L.presenter.props) out.avatar = { doc: "A code-drawn presenter in a disc beside a kicker and title; with `card`, up to three short lines (or one rule) fill the empty side and the disc steps back.", props: L.presenter.props };
const regErrs = ((L.report || {}).errors || []).filter((e) => String(e.code || e).startsWith("component"));
if (regErrs.length) { console.error("catalog: component registration errors:\n" + regErrs.map((e) => "  " + (e.msg || JSON.stringify(e))).join("\n")); process.exit(2); }
fs.writeFileSync(path.join(rt, "catalog.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`catalog: ${Object.keys(out.templates).length} templates, ${Object.keys(out.blueprints).length} blueprints, ${Object.keys(out.components).length} components`);

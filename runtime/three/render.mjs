// Render a Loom Three.js scene to a transparent WebM (called by loom/three_bridge.py). D-55.
// usage: node render.mjs <scene.js> <ctx.json> <out.webm> <reads.json> <fps> <scale> <mb_samples> <mb_shutter>
//
// The scene module exports build(ctx, THREE, extras) -> { scene, camera, update(t) }. Every frame is
// update(t) then one render: a pure function of time (no clock, no Math.random; the scenes gate checks).
// Colours come from ctx.c("token") (a THREE.Color from the style + brand); every read is recorded so the
// shared clip store reuses the clip while those colours are unchanged. Motion blur averages sub-frames.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import { execFileSync } from "node:child_process";

const here = path.dirname(fileURLToPath(import.meta.url));
const engine = path.resolve(here, "..", "..");
const [, , scenePath, ctxPath, out, readsPath, fpsS, scaleS, mbsS, shutS] = process.argv;
const fps = +fpsS, scale = +scaleS, mbs = Math.max(1, +mbsS), shutter = +shutS;
const ctx = JSON.parse(fs.readFileSync(ctxPath, "utf8"));
const W = Math.max(2, Math.floor((ctx.size[0] * scale) / 2) * 2), H = Math.max(2, Math.floor((ctx.size[1] * scale) / 2) * 2);
const n = Math.round(ctx.duration * fps);

function chromePath() {
  if (process.env.HYPERFRAMES_BROWSER_PATH) return process.env.HYPERFRAMES_BROWSER_PATH;
  const bin = path.join(engine, "node_modules", "hyperframes", "bin", "hyperframes.mjs");
  return execFileSync(process.execPath, [bin, "browser", "path"], { encoding: "utf8" }).trim().split(/\r?\n/).pop();
}

// a tiny static server: ES modules (three, its addons, the scene) cannot load from file://
const files = { "/scene.js": scenePath };
(ctx.faces || []).forEach((f, i) => { files[`/face/${i}`] = f.path; });
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split("?")[0]);
  let f = files[u];
  if (!f && u.startsWith("/three/")) f = path.join(engine, "node_modules", "three", u.slice(7));
  // the 3D model library and its toolkit (D-138): /kit3d.js and /models/<id>.js
  if (!f && u === "/kit3d.js") f = path.join(here, "kit3d.js");
  if (!f && u === "/holo.js") f = path.join(here, "holo.js");          // the hologram look for heroes (hologram v2)
  if (!f && /^\/models\/[a-z0-9_]+\.js$/.test(u)) f = path.join(engine, "assets", "models3d", u.slice(8));
  if (u === "/") { res.writeHead(200, { "Content-Type": "text/html" }); return res.end(PAGE); }
  if (!f || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": f.endsWith(".js") || f.endsWith(".mjs") ? "text/javascript" : "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});
const PAGE = `<!doctype html><html><head><style>html,body{margin:0;background:transparent}</style>
<script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script></head>
<body><script type="module">
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import * as S from "/scene.js";
import * as KIT from "/kit3d.js";
import * as HOLO from "/holo.js";
const C = ${JSON.stringify(ctx)};
// the style's faces, loaded before anything draws text (canvas textures use them)
await Promise.all((C.faces || []).map((f, i) => new FontFace(f.family, "url(/face/" + i + ")", { weight: String(f.weight) }).load().then((ff) => document.fonts.add(ff)).catch(() => null)));
const reads = { palette: {}, fonts: {}, raw: false };
const ctx = { params: C.params || {}, duration: C.duration, size: C.size, speech: C.speech, geo: C.geo || null,
  cue(a) { if (!(a in C.cues)) throw new Error("cue not resolved: " + a); return C.cues[a]; },
  c(tok) { const v = (C.palette || {})[tok]; reads.palette[tok] = v === undefined ? null : v; if (!v) throw new Error("unknown token " + tok); return new THREE.Color(v); },
  hex(tok) { const v = (C.palette || {})[tok]; reads.palette[tok] = v === undefined ? null : v; return v; },
  // light only: a neutral white for lights and fills (a light is not a design colour; surfaces use tokens)
  neutral(k) { const v = k == null ? 1 : k; return new THREE.Color(v, v, v); },
  font(role) { const k = role === "title" || role === "display" ? "display" : "body"; reads.fonts[k] = (C.fonts || {})[k]; return (C.fonts || {})[k] || "sans-serif"; } };
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(${W}, ${H}); renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const pmrem = new THREE.PMREMGenerator(renderer);
const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
const X = { env, RoundedBoxGeometry, renderer, W: ${W}, H: ${H}, kit: KIT, holo: HOLO };
// a library model: await X.model("phone", opts) -> handle {group, parts, size, set(key, value), keys}
X.model = async (id, opts) => {
  if (!/^[a-z0-9_]+$/.test(String(id))) throw new Error("model id must be a library id: " + id);
  const M = await import("/models/" + id + ".js").catch(() => { throw new Error("no model '" + id + "' in assets/models3d"); });
  const h = await M.make(ctx, THREE, X, opts || {});
  h.id = id; return h;
};
const built = await S.build(ctx, THREE, X);
const acc = document.createElement("canvas"); acc.width = ${W}; acc.height = ${H}; const a2 = acc.getContext("2d");
window.__frame = (t, samples, shutter, fps) => {
  a2.clearRect(0, 0, ${W}, ${H});
  for (let k = 0; k < samples; k++) {
    const tk = samples > 1 ? t + (k / (samples - 1) - 0.5) * shutter / fps : t;
    built.update(tk);
    if (built.render) built.render(); else renderer.render(built.scene, built.camera);   // a scene may own its passes (bloom)
    a2.globalCompositeOperation = "lighter"; a2.globalAlpha = 1 / samples; a2.drawImage(renderer.domElement, 0, 0);
  }
  if (built.lightAlpha) {
    // light over the page: a scene rendered on black becomes straight alpha = its brightest channel, so it lays on any
    // field as added light (no black box), in the lesson's compositor as in the lab
    // the faintest haze (bloom's long tail) is dropped and the clip's edges are feathered, so its rectangle never shows
    const im = a2.getImageData(0, 0, ${W}, ${H}), d = im.data, FE = Math.round(Math.min(${W}, ${H}) * 0.06);
    for (let i = 0, px = 0; i < d.length; i += 4, px++) {
      const x = px % ${W}, y = (px - x) / ${W};
      const e = Math.min(1, Math.min(x, ${W} - 1 - x, y, ${H} - 1 - y) / FE), f = e * e * (3 - 2 * e);
      const m0 = Math.max(d[i], d[i + 1], d[i + 2]), a = Math.max(0, (m0 - 5) * 255 / 250) * f;
      if (a < 0.5) { d[i + 3] = 0; continue; }
      const k = 255 / m0; d[i] = Math.min(255, d[i] * k); d[i + 1] = Math.min(255, d[i + 1] * k); d[i + 2] = Math.min(255, d[i + 2] * k); d[i + 3] = a;
    }
    a2.putImageData(im, 0, 0);
  }
  return acc.toDataURL("image/png").split(",")[1];
};
window.__reads = () => reads;
// a hero's named parts on screen over time (px in the clip), for the HUD's locks and datums: [[t, {part: [x, y, w, h]}]]
window.__anchors = (times) => (built.anchors ? times.map((t) => { built.update(t); return [t, built.anchors()]; }) : null);
window.__ready = true;
</script></body></html>`;

await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;
const browser = await puppeteer.launch({ executablePath: chromePath(), headless: "shell", args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
let code = 0;
try {
  const p = await browser.newPage();
  const errs = [];
  let failed; const failure = new Promise((r) => { failed = r; });
  // a scene or model that throws while building fails the render at once (it used to wait out the 120 s timeout)
  p.on("pageerror", (e) => { errs.push(String(e)); failed(); });
  p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  await p.setViewport({ width: W, height: H });
  await p.goto(`http://127.0.0.1:${port}/`);
  await Promise.race([p.waitForFunction("window.__ready === true", { timeout: 120000 }).catch(() => {}), failure]);
  if (errs.length || !(await p.evaluate(() => !!window.__ready))) throw new Error("three scene failed: " + errs.join(" | "));
  let anchors = null;
  if (process.env.LOOM_ANCHORS) {   // "t0,t1,step": sample the hero's part boxes (no render) before any frame is drawn
    const [a0, a1, st] = process.env.LOOM_ANCHORS.split(",").map(Number), ts = [];
    for (let t = a0; t <= a1 + 1e-9; t += st) ts.push(+t.toFixed(3));
    anchors = await p.evaluate((ts) => window.__anchors(ts), ts);
  }
  const withAnchors = (r) => (anchors ? Object.assign({}, r, { anchors }) : r);
  if (process.env.LOOM_STILLS) {   // stills mode (the motion lab): only the requested times, as PNGs
    for (const ts of process.env.LOOM_STILLS.split(",")) {
      const b64 = await p.evaluate((t, s, sh, f) => window.__frame(t, s, sh, f), +ts, mbs, shutter, fps);
      fs.writeFileSync(path.join(path.dirname(out), `still_${(+ts).toFixed(2)}.png`), Buffer.from(b64, "base64"));
    }
    fs.writeFileSync(readsPath, JSON.stringify(withAnchors(await p.evaluate(() => window.__reads()))));
    await browser.close(); server.close(); process.exit(0);
  }
  const VP9 = ["-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "24", "-row-mt", "1", "-auto-alt-ref", "0", out];
  const FFM = process.env.LOOM_FFMPEG || "ffmpeg";
  // resumable mode (as the Skia renderer, D-138): LOOM_FRAMES_DIR keeps every finished frame as a PNG and encodes
  // only when all exist, so an interrupted render continues where it stopped (frames are a pure function of t, so a
  // kept frame is the frame). Without it, frames stream straight into the encoder.
  const FD = process.env.LOOM_FRAMES_DIR;
  if (FD) {
    fs.mkdirSync(FD, { recursive: true });
    let rendered = 0;
    for (let i = 0; i < n; i++) {
      const keep = path.join(FD, String(i).padStart(5, "0") + ".png");
      if (fs.existsSync(keep) && fs.statSync(keep).size > 0) continue;
      const buf = Buffer.from(await p.evaluate((t, s, sh, f) => window.__frame(t, s, sh, f), i / fps, mbs, shutter, fps), "base64");
      fs.writeFileSync(keep + ".tmp", buf); fs.renameSync(keep + ".tmp", keep); rendered++;
    }
    if (!rendered) await p.evaluate((t, s, sh, f) => window.__frame(t, s, sh, f), 0, 1, shutter, fps);   // so the reads are complete
    const ff = spawn(FFM, ["-v", "error", "-y", "-framerate", String(fps), "-i", path.join(FD, "%05d.png"), "-frames:v", String(n), ...VP9],
      { stdio: ["ignore", "inherit", "inherit"] });
    code = await new Promise((r) => ff.on("close", r));
  } else {
    const ff = spawn(FFM, ["-v", "error", "-y", "-f", "image2pipe", "-c:v", "png", "-r", String(fps), "-i", "-", ...VP9], { stdio: ["pipe", "inherit", "inherit"] });
    for (let i = 0; i < n; i++) {
      const b64 = await p.evaluate((t, s, sh, f) => window.__frame(t, s, sh, f), i / fps, mbs, shutter, fps);
      if (!ff.stdin.write(Buffer.from(b64, "base64"))) await new Promise((r) => ff.stdin.once("drain", r));
    }
    ff.stdin.end();
    code = await new Promise((r) => ff.on("close", r));
  }
  fs.writeFileSync(readsPath, JSON.stringify(withAnchors(await p.evaluate(() => window.__reads()))));
  if (errs.length) throw new Error(errs.join(" | "));
} catch (e) {
  console.error(String(e && e.stack || e)); code = 1;
} finally {
  await browser.close(); server.close();
}
process.exit(code);

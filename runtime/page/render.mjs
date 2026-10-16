// Render a Loom page scene to a transparent WebM (called by loom/page_bridge.py). D-176.
// usage: node render.mjs <scene.js> <ctx.json> <out.webm> <reads.json> <fps> <scale>
//
// The scene module exports `async build(ctx, P)` -> { render(t) } and draws into P.root with Canvas 2D, SVG, DOM or the
// libraries the beat names in page.libs (runtime/page/kit.js). Every frame is render(t), a settle, then one screenshot
// of the root with a transparent ground: a pure function of time. Libraries and data come from this engine's own
// node_modules through a local server; nothing reaches the network.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const here = path.dirname(fileURLToPath(import.meta.url));
const engine = path.resolve(here, "..", "..");
const nm = path.join(engine, "node_modules");
const [, , scenePath, ctxPath, out, readsPath, fpsS, scaleS] = process.argv;
const fps = +fpsS, scale = +scaleS;
const ctx = JSON.parse(fs.readFileSync(ctxPath, "utf8"));
const [W, H] = ctx.size;
const n = Math.round(ctx.duration * fps);

// the approved libraries (2026-10-15, Kshitij): runtime/page/libs.json, also read by loom/page_bridge.py
const LIBS = JSON.parse(fs.readFileSync(path.join(here, "libs.json"), "utf8"));
delete LIBS._doc;
const want = ctx.libs || [];
const js = [], css = [];
for (const l of want) {
  const L = LIBS[l];
  if (!L) { console.error(`unknown page library '${l}' (have: ${Object.keys(LIBS).join(", ")})`); process.exit(2); }
  for (const f of L.js || []) if (!js.includes(f)) js.push(f);
  for (const f of L.css || []) if (!css.includes(f)) css.push(f);
}

function chromePath() {
  if (process.env.HYPERFRAMES_BROWSER_PATH) return process.env.HYPERFRAMES_BROWSER_PATH;
  const bin = path.join(nm, "hyperframes", "bin", "hyperframes.mjs");
  return execFileSync(process.execPath, [bin, "browser", "path"], { encoding: "utf8" }).trim().split(/\r?\n/).pop();
}

const TYPES = { ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml",
  ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf" };
const DATA = { world: path.join(nm, "world-atlas"), hershey: path.join(nm, "hersheytext", "svg_fonts") };
const files = { "/scene.js": scenePath, "/page/kit.js": path.join(here, "kit.js") };
(ctx.faces || []).forEach((f, i) => {
  files[`/face/${i}`] = f.path;
  // opentype.js reads WOFF and TTF, not WOFF2: the @fontsource packages ship a .woff beside every .woff2
  const woff = f.path.replace(/\.woff2$/, ".woff");
  files[`/face-sfnt/${i}`] = fs.existsSync(woff) ? woff : f.path;
});
const inside = (base, rel) => { const p = path.resolve(base, rel); return p.startsWith(path.resolve(base) + path.sep) ? p : null; };
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split("?")[0]);
  if (u === "/") { res.writeHead(200, { "Content-Type": "text/html" }); return res.end(PAGE); }
  let f = files[u];
  if (!f && u.startsWith("/lib/")) f = inside(nm, u.slice(5));                       // a library (and its fonts, css)
  if (!f && u.startsWith("/data/")) {                                                // world-atlas and the stroke fonts
    const [k, ...rest] = u.slice(6).split("/");
    if (DATA[k]) f = inside(DATA[k], rest.join("/"));
  }
  if (!f || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});

const PAGE = `<!doctype html><html><head><meta charset="utf-8">
<style>html,body{margin:0;background:transparent}#root{position:relative;width:${W}px;height:${H}px;overflow:hidden}</style>
${css.map((c) => `<link rel="stylesheet" href="/lib/${c}">`).join("\n")}
${js.map((s) => `<script src="/lib/${s}"></script>`).join("\n")}
</head><body><div id="root"></div><script type="module">
import * as K from "/page/kit.js";
import * as S from "/scene.js";
const C = ${JSON.stringify(ctx)};
await Promise.all((C.faces || []).map((f, i) => new FontFace(f.family, "url(/face/" + i + ")", { weight: String(f.weight) }).load().then((ff) => document.fonts.add(ff)).catch(() => null)));
const root = document.getElementById("root");
root.style.fontFamily = C.fonts && C.fonts.body ? JSON.stringify(C.fonts.body) : "sans-serif";
const P = await K.make(C, root);
const built = await S.build(P.ctx, P);
if (!built || typeof built.render !== "function") throw new Error("a page scene's build() must return { render(t) }");
window.__frame = async (t) => { await built.render(t); await K.settle(); return true; };
window.__reads = () => P.reads;
window.__ready = true;
</script></body></html>`;

await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;
const EXE = chromePath();
const browsers = [];
const launch = async () => { const b = await puppeteer.launch({ executablePath: EXE, headless: "shell",
  args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--font-render-hinting=none"] }); browsers.push(b); return b; };
const errs = [];
const timing = { frame: 0, shot: 0, n: 0 };

// one browser = one worker (its only page, in the foreground): the scene built once, then any frame on request.
// Frames are a pure function of t, so workers render different frames at the same time. Pages sharing one browser
// share its capture (no faster) and a background page's frames lag behind its state, so each worker has its own.
async function openPage() {
  const p = await (await launch()).newPage();
  let failed; const failure = new Promise((r) => { failed = r; });
  p.on("pageerror", (e) => { errs.push(String(e)); failed(); });
  p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  p.on("requestfailed", (r) => errs.push("request failed: " + r.url()));
  // the network is the local server only: any other request fails the render (a page scene stays offline)
  await p.setRequestInterception(true);
  p.on("request", (r) => (r.url().startsWith(`http://127.0.0.1:${port}/`) || r.url().startsWith("data:") ? r.continue() : (errs.push("blocked request: " + r.url()), r.abort())));
  await p.setViewport({ width: W, height: H, deviceScaleFactor: scale });
  await p.goto(`http://127.0.0.1:${port}/`);
  await Promise.race([p.waitForFunction("window.__ready === true", { timeout: 120000 }).catch(() => {}), failure]);
  if (errs.length || !(await p.evaluate(() => !!window.__ready))) throw new Error("page scene failed: " + errs.join(" | "));
  // a fixed clip of the root's box (no element lookup or scroll per frame), the fast capture path, a transparent ground
  const cdp = await p.createCDPSession();
  await cdp.send("Emulation.setDefaultBackgroundColorOverride", { color: { r: 0, g: 0, b: 0, a: 0 } });
  const shot = async (t) => {
    const a = Date.now();   // timing report only; never frame state
    await p.evaluate((tt) => window.__frame(tt), t);
    if (errs.length) throw new Error(errs.join(" | "));
    const b = Date.now();
    const r = await cdp.send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: W, height: H, scale: 1 }, optimizeForSpeed: true, captureBeyondViewport: false });
    timing.frame += b - a; timing.shot += Date.now() - b; timing.n++;
    return Buffer.from(r.data, "base64");
  };
  return { p, shot };
}

let code = 0;
try {
  const first = await openPage();
  if (process.env.LOOM_STILLS) {   // stills mode (the lab): only the requested times, as PNGs
    for (const ts of process.env.LOOM_STILLS.split(",")) fs.writeFileSync(path.join(path.dirname(out), `still_${(+ts).toFixed(2)}.png`), await first.shot(+ts));
    fs.writeFileSync(readsPath, JSON.stringify(await first.p.evaluate(() => window.__reads())));
    await Promise.all(browsers.map((b) => b.close())); server.close(); process.exit(0);
  }
  // frames go to a directory (the bridge's, kept between attempts so an interrupted render resumes; else a temporary
  // one), then one encode
  const FD = process.env.LOOM_FRAMES_DIR || fs.mkdtempSync(path.join(path.dirname(out), ".frames-"));
  const keepFD = !!process.env.LOOM_FRAMES_DIR;
  fs.mkdirSync(FD, { recursive: true });
  const file = (i) => path.join(FD, String(i).padStart(5, "0") + ".png");
  const todo = [];
  for (let i = 0; i < n; i++) if (!(fs.existsSync(file(i)) && fs.statSync(file(i)).size > 0)) todo.push(i);
  const WK = Math.max(1, Math.min(+(process.env.LOOM_PAGE_WORKERS || 4), Math.ceil(todo.length / 30) || 1));
  const pages = [first];
  for (let k = 1; k < WK; k++) pages.push(await openPage());
  let next = 0;
  await Promise.all(pages.map(async (pg) => {
    while (next < todo.length) {
      const i = todo[next++];
      const buf = await pg.shot(i / fps);
      fs.writeFileSync(file(i) + ".tmp", buf); fs.renameSync(file(i) + ".tmp", file(i));
    }
  }));
  if (!todo.length) await first.shot(0);   // so the reads are complete
  const VP9 = ["-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2", "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "24", "-row-mt", "1", "-auto-alt-ref", "0", out];
  const ff = spawn(process.env.LOOM_FFMPEG || "ffmpeg", ["-v", "error", "-y", "-framerate", String(fps), "-i", path.join(FD, "%05d.png"), "-frames:v", String(n), ...VP9],
    { stdio: ["ignore", "inherit", "inherit"] });
  code = await new Promise((r) => ff.on("close", r));
  if (!keepFD) fs.rmSync(FD, { recursive: true, force: true });
  fs.writeFileSync(readsPath, JSON.stringify(await first.p.evaluate(() => window.__reads())));
  if (timing.n) console.log(`page: ${timing.n} frames on ${WK} worker(s), ${(timing.frame / timing.n).toFixed(0)} ms drawing and ${(timing.shot / timing.n).toFixed(0)} ms capturing a frame`);
  if (errs.length) throw new Error(errs.join(" | "));
} catch (e) {
  console.error(String((e && e.stack) || e)); code = 1;
} finally {
  await Promise.all(browsers.map((b) => b.close().catch(() => null))); server.close();
}
process.exit(code);

// The layout guard's solve step (D-169): load a composed build in headless Chrome, wait for Loom, run
// Loom.layout.solve() and write its moves and residual conflicts as JSON. Reads the page; changes nothing.
// usage: node layout_solve.mjs <build/index.html> <out.json>   (LOOM_LAYOUT_SOLVE_STEP: seconds between samples;
// LOOM_LAYOUT_SOLVE_BEATS=b03,b04: only those beats' windows)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL, fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const here = path.dirname(fileURLToPath(import.meta.url));
const engine = path.resolve(here, "..", "..");
function chromePath() {
  if (process.env.HYPERFRAMES_BROWSER_PATH) return process.env.HYPERFRAMES_BROWSER_PATH;
  const bin = path.join(engine, "node_modules", "hyperframes", "bin", "hyperframes.mjs");
  return execFileSync(process.execPath, [bin, "browser", "path"], { encoding: "utf8" }).trim().split(/\r?\n/).pop();
}

const [, , page, outFile] = process.argv;
const opts = {};
if (process.env.LOOM_LAYOUT_SOLVE_STEP) opts.step = +process.env.LOOM_LAYOUT_SOLVE_STEP;
if (process.env.LOOM_LAYOUT_SOLVE_BEATS) opts.beats = process.env.LOOM_LAYOUT_SOLVE_BEATS.split(",").filter(Boolean);
const browser = await puppeteer.launch({ executablePath: chromePath(), headless: "shell",
  args: ["--no-sandbox", "--disable-gpu", "--allow-file-access-from-files", "--autoplay-policy=no-user-gesture-required"] });
let out;
try {
  const p = await browser.newPage();
  await p.setViewport({ width: 1920, height: 1080 });
  const logs = [];
  p.on("pageerror", (e) => logs.push(`pageerror: ${String(e).slice(0, 400)}`));
  await p.goto(pathToFileURL(path.resolve(page)).href, { waitUntil: "load", timeout: 120000 });
  await p.waitForFunction("window.__loom_ready === true", { timeout: 120000 }).catch(() => logs.push("timeout: Loom never became ready"));
  out = await p.evaluate((o) => {
    if (!window.Loom || !Loom.layout || !Loom.layout.solve) return { error: "this build has no layout guard (runtime/layout.js)" };
    const r = Loom.layout.solve(o);
    r.applied = (Loom.report.layout || {}).applied || [];
    r.errors = (Loom.report.errors || []).map((e) => ({ code: e.code, beat: e.beat, msg: String(e.msg || "").slice(0, 160) }));
    r.warnings = (Loom.report.warnings || []).filter((w) => w.code === "text_box_grown").map((w) => ({ code: w.code, beat: w.beat, msg: String(w.msg || "").slice(0, 160) }));
    return r;
  }, opts);
  out.logs = logs;
} catch (e) {
  out = { error: String(e).slice(0, 800) };
} finally {
  await browser.close();
}
fs.writeFileSync(outFile, JSON.stringify(out, null, 1));
process.exit(out && !out.error ? 0 : 1);

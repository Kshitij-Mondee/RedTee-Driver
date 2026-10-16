// The frames around every join, small and fast, for loom/checks/joins.py (D-190): seeks a build in time order and saves
// one small JPEG per time. `hyperframes snapshot` takes minutes per 30 frames; a join needs about 17, so a 25-join film
// needs about 425: here they take under a minute.
//   node join_frames.mjs <index.html> <times file: one time per line> <out dir>
// Writes <out dir>/<t with 2 decimals>.jpg and prints one line of JSON {shots, ms}.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import puppeteer from "puppeteer-core";

const [, , page, timesFile, outDir] = process.argv;
if (!process.env.HYPERFRAMES_BROWSER_PATH) { console.error("join_frames: set HYPERFRAMES_BROWSER_PATH"); process.exit(2); }
const times = fs.readFileSync(timesFile, "utf-8").split(/\s+/).filter(Boolean).map(Number).sort((a, b) => a - b);
fs.mkdirSync(outDir, { recursive: true });
const t0 = Date.now();
const b = await puppeteer.launch({ executablePath: process.env.HYPERFRAMES_BROWSER_PATH, headless: "shell", args: ["--no-sandbox", "--allow-file-access-from-files"] });
try {
  const p = await b.newPage(); await p.setViewport({ width: 1920, height: 1080 });
  await p.goto(pathToFileURL(path.resolve(page)).href, { waitUntil: "load" });
  await p.waitForFunction("window.__loom_ready === true", { timeout: 120000 });
  let n = 0;
  for (const t of times) {
    // forward seeks only, as a render reaches its frames (boot.js: every later seek arrives moving forward)
    await p.evaluate((t) => { window.__timelines.main.seek(t, false); return 1; }, t);
    await p.screenshot({ path: path.join(outDir, `${t.toFixed(2)}.jpg`), type: "jpeg", quality: 70, clip: { x: 0, y: 0, width: 1920, height: 1080, scale: 0.1 } });
    n++;
  }
  console.log(JSON.stringify({ shots: n, ms: Date.now() - t0 }));
} finally {
  await b.close();
}

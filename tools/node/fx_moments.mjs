// Where each fx moment (a light sweep or a spotlight) lands on screen, in a composed build (2026-10-07, RC13).
// usage: node fx_moments.mjs <build/index.html>   -> JSON on stdout: [{kind, t0, t1, beat, rect, on_frame}]
// on_frame is the share of the moment's screen rect inside the 1920x1080 frame. A spotlight whose rect is off the frame
// dims the whole picture for its length and lights nothing (the bench's "unmotivated dim flashes": the rect was
// resolved before the camera existed). The rect is read at the moment's own time, as the fx layer reads it.
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
const [, , page] = process.argv;
const browser = await puppeteer.launch({ executablePath: chromePath(), headless: "shell",
  args: ["--no-sandbox", "--disable-gpu", "--allow-file-access-from-files", "--autoplay-policy=no-user-gesture-required"] });
try {
  const p = await browser.newPage();
  await p.setViewport({ width: 1920, height: 1080 });
  await p.goto(pathToFileURL(path.resolve(page)).href, { waitUntil: "load", timeout: 120000 });
  await p.waitForFunction("window.__loom_ready === true", { timeout: 120000 });
  const out = await p.evaluate(() => {
    const W = 1920, H = 1080;
    return (Loom.manifest.fx_moments || []).map((mo) => {
      window.__timelines.main.seek((mo.t0 + mo.t1) / 2, false);
      const r = mo.rect || [96, 84, 1728, 846];
      const ix = Math.max(0, Math.min(W, r[0] + r[2]) - Math.max(0, r[0])), iy = Math.max(0, Math.min(H, r[1] + r[3]) - Math.max(0, r[1]));
      const area = Math.max(1, r[2] * r[3]);
      return { kind: mo.kind, t0: +mo.t0.toFixed(2), t1: +mo.t1.toFixed(2), beat: mo.beat || null, rect: r.map((v) => Math.round(v)),
               on_frame: +((ix * iy) / area).toFixed(3) };
    });
  });
  process.stdout.write(JSON.stringify(out));
} finally {
  await browser.close();
}

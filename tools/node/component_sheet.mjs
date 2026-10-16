// Render component fixture cases to PNGs in headless Chrome.
// usage: node component_sheet.mjs <sheet.html> <out_dir>
// The page exposes window.__cases (count), window.__times (list) and window.__show(i, t).
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
const [, , page, outDir] = process.argv;
fs.mkdirSync(outDir, { recursive: true });
const browser = await puppeteer.launch({ executablePath: chromePath(), headless: "shell",
  args: ["--no-sandbox", "--disable-gpu", "--allow-file-access-from-files"] });
try {
  const p = await browser.newPage();
  await p.setViewport({ width: 1920, height: 1080 });
  const logs = [];
  p.on("pageerror", (e) => logs.push(`pageerror: ${String(e).slice(0, 400)}`));
  p.on("console", (m) => { if (m.type() === "error") logs.push(`console: ${m.text().slice(0, 300)}`); });
  await p.goto(pathToFileURL(path.resolve(page)).href, { waitUntil: "load", timeout: 120000 });
  await p.waitForFunction("window.__sheet_ready === true", { timeout: 60000 }).catch(() => logs.push("timeout: sheet never became ready"));
  const n = await p.evaluate(() => window.__cases || 0);
  const times = await p.evaluate(() => window.__times || []);
  const shots = [];
  for (let i = 0; i < n; i++) {
    for (const t of times) {
      const bbox = await p.evaluate((i, t) => window.__show(i, t), i, t);
      const f = path.join(outDir, `case${i}_t${t.toFixed(2)}.png`);
      await p.screenshot({ path: f });
      shots.push({ i, t, file: f, bbox });
    }
  }
  const rep = await p.evaluate(() => ({ errors: (window.Loom && window.Loom.report.errors) || [], warnings: (window.Loom && window.Loom.report.warnings) || [], components: (window.Loom && window.Loom.report.components) || [], texts: (window.Loom && window.Loom.report.texts) || [], sfx: (window.Loom && window.Loom.report.sfx) || [], treatments: (window.Loom && window.Loom.report.treatments) || [], objects: (window.Loom && window.Loom.report.objects) || [], figures: (window.Loom && window.Loom.report.figures) || [], tweens: ((window.Loom && window.Loom.report.tweens) || []).filter((t) => t.kind === "exit" || t.kind === "camera"), case_texts: window.__case_texts || [], skins: (window.Loom && window.Loom.report.skins) || [] }));
  rep.console = logs; rep.shots = shots; rep.cases = n;
  fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(rep, null, 1));
  console.log(`sheet: cases=${n} shots=${shots.length} errors=${rep.errors.length} page_errors=${logs.length}`);
} finally {
  await browser.close();
}

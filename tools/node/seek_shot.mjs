// debug helper: node seek_shot.mjs <index.html> <t1,t2,...> <out prefix>  (screenshots after seeking; same launch as seek_debug)
import path from "node:path";
import { pathToFileURL } from "node:url";
import puppeteer from "puppeteer-core";
const [, , page, ts, out] = process.argv;
if (!process.env.HYPERFRAMES_BROWSER_PATH) { console.error("seek_shot: set HYPERFRAMES_BROWSER_PATH"); process.exit(2); }
const b = await puppeteer.launch({ executablePath: process.env.HYPERFRAMES_BROWSER_PATH, headless: "shell", args: ["--no-sandbox", "--allow-file-access-from-files"] });
const p = await b.newPage(); await p.setViewport({ width: 1920, height: 1080 });
await p.goto(pathToFileURL(path.resolve(page)).href, { waitUntil: "load" });
await p.waitForFunction("window.__loom_ready === true", { timeout: 60000 });
for (const t of ts.split(",")) {
  await p.evaluate((t) => { window.__timelines.main.seek(+t, false); return 1; }, t);
  await p.screenshot({ path: `${out}_${t}.jpg`, type: "jpeg", quality: 72 });
  console.log("shot", t);
}
await b.close();

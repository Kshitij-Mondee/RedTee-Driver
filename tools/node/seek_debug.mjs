// debug helper: node seek_debug.mjs <index.html> <t> "<js expression evaluated after seek>"
import path from "node:path";
import { pathToFileURL } from "node:url";
import puppeteer from "puppeteer-core";
const [, , page, t, expr] = process.argv;
if (!process.env.HYPERFRAMES_BROWSER_PATH) {
  console.error("seek_debug: set HYPERFRAMES_BROWSER_PATH to a Chrome (npx hyperframes browser path prints the managed one)");
  process.exit(2);
}
const b = await puppeteer.launch({ executablePath: process.env.HYPERFRAMES_BROWSER_PATH, headless: "shell", args: ["--no-sandbox", "--allow-file-access-from-files"] });
const p = await b.newPage(); await p.setViewport({ width: 1920, height: 1080 });
await p.goto(pathToFileURL(path.resolve(page)).href, { waitUntil: "load" });
await p.waitForFunction("window.__loom_ready === true", { timeout: 60000 });
const out = await p.evaluate((t, expr) => { window.__timelines.main.seek(+t, false); return eval(expr); }, t, expr);
console.log(JSON.stringify(out, null, 1));
await b.close();

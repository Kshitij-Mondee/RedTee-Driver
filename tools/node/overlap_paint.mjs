// Is a text overlap the HyperFrames check reports really SEEN? (2026-10-09, after R-35's verification run)
// usage: node overlap_paint.mjs <build/index.html> <findings.json> <out.json>
// findings.json: [{time, selector, containerSelector}, ...] (the check's content_overlap findings, in order).
// For each: seek to its time, find both text elements, sample points inside the intersection of their boxes, and ask
// the page what is painted on top there. A text counts as seen at a point when, from the top of the paint stack down,
// it comes before any opaque shape (fill not none, effective opacity >= 0.95). The overlap is real when both texts are
// seen at one point at least; otherwise one of them is hidden under a later layer (an outgoing beat under the next
// beat's opaque world, which a box-only check reports as two colliding texts: feedback-relay-v2 b09/b10).
// Out: [{real: true|false|null, why}], null when it cannot be decided (an element not found): the caller keeps it.
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
const [, , page, findingsFile, outFile] = process.argv;
const findings = JSON.parse(fs.readFileSync(findingsFile, "utf8"));
const b = await puppeteer.launch({ executablePath: chromePath(), headless: "shell", args: ["--no-sandbox", "--allow-file-access-from-files"] });
const out = [];
try {
  const p = await b.newPage();
  await p.setViewport({ width: 1920, height: 1080 });
  await p.goto(pathToFileURL(path.resolve(page)).href, { waitUntil: "load", timeout: 120000 });
  await p.waitForFunction("window.__loom_ready === true", { timeout: 120000 });
  for (const f of findings) {
    out.push(await p.evaluate((f) => {
      if (window.__timelines && window.__timelines.main) window.__timelines.main.seek(+f.time, false);
      const A = document.querySelector(f.selector), B = document.querySelector(f.containerSelector);
      if (!A || !B) return { real: null, why: "an element of the pair was not found" };
      const ra = A.getBoundingClientRect(), rb = B.getBoundingClientRect();
      const x0 = Math.max(ra.left, rb.left), x1 = Math.min(ra.right, rb.right), y0 = Math.max(ra.top, rb.top), y1 = Math.min(ra.bottom, rb.bottom);
      if (x1 <= x0 || y1 <= y0) return { real: false, why: "the boxes do not intersect at this time" };
      const SHAPES = new Set(["rect", "path", "circle", "ellipse", "polygon", "polyline", "image", "use", "line", "foreignObject", "canvas", "img", "video"]);
      const opacity = (e) => { let o = 1; for (let n = e; n && n.nodeType === 1; n = n.parentElement) { o *= +getComputedStyle(n).opacity; } return o; };
      const opaque = (e) => {
        const tag = e.tagName;
        if (!SHAPES.has(tag) && !SHAPES.has(tag.toLowerCase())) return false;
        const cs = getComputedStyle(e);
        if (tag.toLowerCase() !== "image" && tag.toLowerCase() !== "img" && tag.toLowerCase() !== "video" && tag.toLowerCase() !== "canvas"
            && (cs.fill === "none" || cs.fill === "transparent" || +cs.fillOpacity < 0.95)) return false;
        return opacity(e) >= 0.95;
      };
      const mine = (T, e) => e === T || T.contains(e) || (e.contains && e.contains(T) && (e.tagName.toLowerCase() === "text"));
      const seen = (T, stack) => { for (const e of stack) { if (mine(T, e)) return true; if (opaque(e)) return false; } return false; };
      let both = 0, onlyOne = 0;
      for (let i = 1; i <= 3; i++) for (let j = 1; j <= 3; j++) {
        const x = x0 + (x1 - x0) * i / 4, y = y0 + (y1 - y0) * j / 4;
        const stack = document.elementsFromPoint(x, y);
        const sa = seen(A, stack), sb = seen(B, stack);
        if (sa && sb) both++; else if (sa || sb) onlyOne++;
      }
      return both ? { real: true, why: `both texts painted at ${both} of 9 points` }
                  : { real: false, why: `one text is under an opaque layer at every sampled point (${onlyOne} of 9 show one text)` };
    }, f));
  }
} finally {
  await b.close();
}
fs.writeFileSync(outFile, JSON.stringify(out, null, 1));

// Look at what the probe's foreign-pixel and off-frame passes measured, beat by beat (2026-10-07).
// usage: node foreign_view.mjs <build/index.html> <out dir> <beat,beat,...> [t]
// For each beat, at its settled moment (as tools/node/probe.mjs picks it, or at t when one beat is given): frame.png,
// alone.png (every scene group but this beat's hidden, its held elements kept) and diff.png (the frame with the
// pixels that changed tinted red, the boxes of the beat's own elements outlined). A finding is looked at before it is
// believed: these three pictures say whether it is another beat's picture or the instrument's mistake.
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
const [, , page, outDir, beatList, tArg] = process.argv;
fs.mkdirSync(outDir, { recursive: true });
const browser = await puppeteer.launch({ executablePath: chromePath(), headless: "shell",
  args: ["--no-sandbox", "--disable-gpu", "--allow-file-access-from-files", "--autoplay-policy=no-user-gesture-required"] });
try {
  const p = await browser.newPage();
  await p.setViewport({ width: 1920, height: 1080 });
  await p.goto(pathToFileURL(path.resolve(page)).href, { waitUntil: "load", timeout: 120000 });
  await p.waitForFunction("window.__loom_ready === true", { timeout: 120000 });
  // two animation frames after a DOM change before a screenshot (an unsettled compositor frame is not the DOM)
  const settle = () => p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))));
  for (const id of beatList.split(",")) {
    // LOOM_VIEW_WALK=1 first seeks every earlier beat's settled moment in order, as a render (and the probe) does: a
    // frame that differs from the direct seek is a determinism bug (seek-order dependence)
    const t = await p.evaluate((id, tArg, walk) => {
      const B = Loom.manifest.beats, b = B.find((x) => x.id === id);
      const at = (x) => Math.max(x.speech_start + 0.3, x.speech_end - 0.25);
      const t = tArg != null && tArg !== "" ? +tArg : at(b);
      if (walk) for (const x of B) {
        if (at(x) >= t) break;
        window.__timelines.main.seek(at(x), false);
        if (walk === "probe") {   // replay what the probe's foreign pass does at every earlier beat: hide, keep, restore
          const r = (Loom.world.sceneRecs || []).find((q) => q.beat && q.beat.id === x.id);
          const keep = ((r && r.els) || []).map((E) => E.outer).filter(Boolean);
          const groups = Array.from(document.querySelectorAll("#lm-world .lm-scene"));
          for (const g of groups) if (g.getAttribute("data-beat") !== x.id) g.style.visibility = "hidden";
          for (const o of keep) { o.__lmPv = o.style.visibility; o.style.visibility = "visible"; }
          for (const g of groups) g.style.visibility = "";
          for (const o of keep) { o.style.visibility = o.__lmPv; o.__lmPv = undefined; }
        }
      }
      window.__timelines.main.seek(t, false);
      return t;
    }, id, tArg || "", process.env.LOOM_VIEW_WALK === "probe" ? "probe" : process.env.LOOM_VIEW_WALK === "1");
    await settle();
    const A = Buffer.from(await p.screenshot({ type: "png" }));
    const info = await p.evaluate((id) => {
      const rec = (Loom.world.sceneRecs || []).find((r) => r.beat && r.beat.id === id);
      const keep = ((rec && rec.els) || []).map((E) => E.outer).filter(Boolean);   // owned or held, wherever it sits (as probe.mjs)
      const groups = Array.from(document.querySelectorAll("#lm-world .lm-scene"));
      for (const g of groups) if (g.getAttribute("data-beat") !== id) g.style.visibility = "hidden";
      for (const o of keep) o.style.visibility = "visible";
      const own = ((rec && rec.els) || []).filter((E) => E.outer).map((E) => { const r = E.outer.getBoundingClientRect();
        return { name: E.name, kind: E.kind, held: keep.includes(E.outer), r: [r.left, r.top, r.right, r.bottom].map(Math.round) }; });
      const stations = Object.values(Loom.world.stations).filter((s) => s.div.style.visibility !== "hidden").map((s) => s.id);
      return { own, held: keep.map((o) => o.getAttribute("data-name")), stations };
    }, id);
    await settle();
    const B = Buffer.from(await p.screenshot({ type: "png" }));
    await p.evaluate(() => { for (const g of document.querySelectorAll("#lm-world .lm-scene")) g.style.visibility = ""; for (const o of document.querySelectorAll(".lm-el")) o.style.visibility = ""; });
    // the diff picture, drawn in the page (no image library needed here)
    const D = await p.evaluate(async (a, b, own) => {
      const load = async (x) => { const img = new Image(); img.src = "data:image/png;base64," + x; await img.decode(); return img; };
      const ia = await load(a), ib = await load(b);
      const c = document.createElement("canvas"); c.width = 1920; c.height = 1080; const g = c.getContext("2d");
      g.drawImage(ib, 0, 0); const db = g.getImageData(0, 0, 1920, 1080);
      g.drawImage(ia, 0, 0); const da = g.getImageData(0, 0, 1920, 1080);
      let n = 0;
      for (let i = 0; i < da.data.length; i += 4) {
        if (Math.abs(da.data[i] - db.data[i]) + Math.abs(da.data[i + 1] - db.data[i + 1]) + Math.abs(da.data[i + 2] - db.data[i + 2]) > 40) {
          n++; da.data[i] = 255; da.data[i + 1] = 0; da.data[i + 2] = 0;
        }
      }
      g.putImageData(da, 0, 0);
      g.lineWidth = 3; g.strokeStyle = "#00c0ff"; g.font = "20px sans-serif"; g.fillStyle = "#00c0ff";
      for (const o of own) { const [l, t, r, bb] = o.r; if (r - l > 0 && bb - t > 0) { g.strokeRect(l, t, r - l, bb - t); g.fillText(o.name, Math.max(2, l + 4), Math.max(22, t + 22)); } }
      return { png: c.toDataURL("image/png").split(",")[1], n };
    }, A.toString("base64"), B.toString("base64"), info.own);
    const base = path.join(outDir, `${id}_${t.toFixed(2)}`);
    fs.writeFileSync(base + "_frame.png", A); fs.writeFileSync(base + "_alone.png", B); fs.writeFileSync(base + "_diff.png", Buffer.from(D.png, "base64"));
    fs.writeFileSync(base + ".json", JSON.stringify({ beat: id, t, changed_px: D.n, ...info }, null, 1));
    console.log(`${id} @ ${t.toFixed(2)}s: ${D.n} px change when other beats are hidden; stations visible ${info.stations.join(",")}; held ${info.held.join(",") || "none"}`);
  }
} finally {
  await browser.close();
}

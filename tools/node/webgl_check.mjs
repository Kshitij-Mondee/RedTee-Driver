// Is WebGL available to the render browser, in the modes the engine uses? usage: node webgl_check.mjs
// software: HyperFrames' deterministic capture (--use-gl=angle --use-angle=swiftshader); probe: the runtime probe's
// launch (--disable-gpu). Both fall back to SwiftShader; when it fails, every fx layer (a pack's vignette, paper, grain),
// Three.js and the brush skip or throw, and a film renders without its finish (2026-10-10: WebGL lost mid-afternoon,
// D-154). Prints one JSON line.
import puppeteer from "puppeteer-core";
const modes = { software: ["--use-gl=angle", "--use-angle=swiftshader"], probe: ["--disable-gpu"] };
const out = {};
for (const [name, flags] of Object.entries(modes)) {
  let b;
  try {
    b = await puppeteer.launch({ executablePath: process.env.HYPERFRAMES_BROWSER_PATH, headless: "shell", args: ["--no-sandbox", ...flags] });
    const p = await b.newPage();
    out[name] = await p.evaluate(() => { const g = document.createElement("canvas").getContext("webgl"); const g2 = document.createElement("canvas").getContext("webgl2");
      const d = g && g.getExtension("WEBGL_debug_renderer_info"); return { webgl: !!g, webgl2: !!g2, renderer: d ? g.getParameter(d.UNMASKED_RENDERER_WEBGL) : null }; });
  } catch (e) { out[name] = { webgl: false, webgl2: false, error: String(e).slice(0, 200) }; }
  finally { if (b) await b.close(); }
}
console.log(JSON.stringify(out));

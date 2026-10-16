"""Experiment 4: which GPU sync point makes lab_brush's fill deterministic?
usage: py brush_exp4.py <mode> [loads] [K]
modes: none | finish_after_upload | finish_after_blit | finish_after_draw | finish_end | flush_after_upload
Per load: the page's 8 layer hashes, then K rebakes of layer 2's draw. Prints distinct outcomes."""
import json, os, shutil, subprocess, sys
from pathlib import Path

ENGINE = Path(__file__).resolve().parents[4]   # docs/research/determinism/brush_fill -> the engine
sys.path.insert(0, str(ENGINE))
from loom import lab
from loom.render import browser_path

INSTR = r"""
() => {
  const MODE = %(mode)s;
  const PG = WebGL2RenderingContext.prototype;
  const wrap = (k, after) => { const f = PG[k]; PG[k] = function (...a) { const r = f.apply(this, a); after(this, a); return r; }; };
  if (MODE === "finish_after_upload") wrap("texSubImage2D", (gl) => gl.finish());
  if (MODE === "flush_after_upload") wrap("texSubImage2D", (gl) => gl.flush());
  if (MODE === "finish_after_blit") wrap("blitFramebuffer", (gl) => gl.finish());
  if (MODE === "finish_after_draw") wrap("drawArrays", (gl) => gl.finish());
  window.__rp = []; window.__patched = 0;
  if (MODE === "shader_patch") {
    const ss = PG.shaderSource;
    PG.shaderSource = function (sh, src) {
      const ER = "if(maskColor.a==0.0){outColor=source;return;}", BG = "vec3 bgColor=mix(vec3(1.0),source.rgb,source.a);";
      if (src.includes(ER) && src.includes(BG)) { src = src.replace(ER, "").replace(BG, ER + BG); window.__patched++; }
      return ss.call(this, sh, src);
    };
  }
  if (MODE === "finish_end" || MODE === "readpixels_end") {
    const P2 = CanvasRenderingContext2D.prototype, di = P2.drawImage;
    P2.drawImage = function (src, ...a) {
      if (src instanceof HTMLCanvasElement && src.width === 1920 && src.height === 1080) {
        const gl = src.getContext("webgl2"); gl.finish();
        if (MODE === "readpixels_end") { const px = new Uint8Array(1640 * 640 * 4); gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null); gl.readPixels(0, 1080 - 640, 1640, 640, gl.RGBA, gl.UNSIGNED_BYTE, px); let x = 0; for (let i = 0; i < px.length; i++) x = (Math.imul(x, 31) + px[i]) >>> 0; window.__rp.push(x); }
      }
      return di.call(this, src, ...a);
    };
  }
}
"""

NODE = r"""
const { createRequire } = require("module");
const req = createRequire(%(engine)s + "/tools/node/x.js");
const puppeteer = req("puppeteer-core");
(async () => {
  const b = await puppeteer.launch({ executablePath: %(chrome)s, headless: "shell",
    args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--allow-file-access-from-files"] });
  try {
    const p = await b.newPage();
    await p.setViewport({ width: 1920, height: 1080 });
    await p.evaluateOnNewDocument(%(instr)s);
    const logs = [];
    p.on("pageerror", (e) => logs.push(String(e).slice(0, 300)));
    await p.goto("file://" + %(page)s, { waitUntil: "load", timeout: 120000 });
    await p.waitForFunction("window.__sheet_ready === true", { timeout: 90000 });
    const res = await p.evaluate(`(function () {
      const h = (s) => { let x = 2166136261 >>> 0; for (let i = 0; i < s.length; i += 1) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; };
      const urls = [...document.querySelectorAll("image")].map((im) => im.getAttribute("href") || "").filter((s) => s.startsWith("data:image/png"));
      const fillDraw = (b) => { b.fill("#c0504d", 120); b.fillBleed(0.12); b.noStroke(); b.rect(610, 190, 420, 240); };
      const re = [];
      const U = []; for (let k = 0; k < %(K)s; k++) { const u = Loom.brush.bake(1640, 640, (21 + 2 * 7919) >>> 0, 4.5, fillDraw); U.push(u); re.push(h(u)); } window.__U = [U[0], U[1], urls[2]];
      return { hashes: urls.map(h), rebake: re, rp: window.__rp, patched: window.__patched, U: window.__U };
    })()`);
    res.logs = logs;
    console.log(JSON.stringify(res));
  } finally { await b.close(); }
})().catch((e) => { console.error(String(e && e.stack || e)); process.exit(1); });
"""


def one_load(mode, K):
    tmp, *_ = lab.page("lab_brush", "editorial-paper", times=[0.0])
    try:
        js = NODE % {"engine": json.dumps(str(ENGINE)), "chrome": json.dumps(browser_path()), "instr": INSTR % {"mode": json.dumps(mode)},
                     "K": K, "page": json.dumps(str(tmp / "lab.html").replace("\\", "/"))}
        r = subprocess.run(["node", "-e", js], capture_output=True, text=True, timeout=170, cwd=str(ENGINE))
        assert r.returncode == 0, r.stderr[-1500:]
        return json.loads(r.stdout.strip().splitlines()[-1])
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    mode = sys.argv[1]; n = int(sys.argv[2]) if len(sys.argv) > 2 else 3; K = int(sys.argv[3]) if len(sys.argv) > 3 else 8
    runs = [one_load(mode, K) for _ in range(n)]
    if os.environ.get("EXP_DUMP"): Path(os.environ["EXP_DUMP"]).write_text(json.dumps(runs), encoding="utf-8")
    l2 = [r["hashes"][2] for r in runs]
    others = {tuple(r["hashes"][:2] + r["hashes"][3:]) for r in runs}
    reb = [x for r in runs for x in r["rebake"][1:]]   # rebake 0 follows a different layer; 1.. follow a fill
    print(f"{mode}: page layer 2 over {n} loads: {len(set(l2))} distinct {l2}; other layers identical: {len(others) == 1}; "
          f"rebakes 1..{K-1} over loads: {len(set(reb))} distinct of {len(reb)}; rebake 0s: {[r['rebake'][0] for r in runs]}; logs {[r['logs'][:1] for r in runs if r['logs']]}")
    print("  shaders patched per load:", [r.get("patched") for r in runs])
    if runs[0]["rp"]:
        for r in runs: print("  readPixels at end: page layer 2", r["rp"][2], "rebakes", r["rp"][8:], " png", r["hashes"][2], r["rebake"])

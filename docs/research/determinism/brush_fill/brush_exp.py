"""Experiment: where does lab_brush's layer 2 (watercolour fill) take randomness from?
usage: py brush_exp.py <out.json> [loads]
Each load: counts Math.random calls during the page's build (with stacks), hashes the 8 layers, then in the same page
rebakes layer 2's draw 3 times with the same seed and hashes each, and keeps layer 2's data URL for a pixel diff."""
import json, os, shutil, subprocess, sys
from pathlib import Path

ENGINE = Path(__file__).resolve().parents[4]   # docs/research/determinism/brush_fill -> the engine
sys.path.insert(0, str(ENGINE))
from loom import lab
from loom.render import browser_path

NODE = r"""
const { createRequire } = require("module");
const req = createRequire(%(engine)s + "/tools/node/x.js");
const puppeteer = req("puppeteer-core");
(async () => {
  const b = await puppeteer.launch({ executablePath: %(chrome)s, headless: "shell",
    args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--allow-file-access-from-files"].concat(%(extra)s) });
  try {
    const p = await b.newPage();
    await p.setViewport({ width: 1920, height: 1080 });
    await p.evaluateOnNewDocument(() => {
      const orig = Math.random; window.__rnd = []; window.__rndOn = true;
      Math.random = function () { const v = orig(); if (window.__rndOn) window.__rnd.push(String(new Error().stack).split("\n").slice(1, 5).join(" | ").slice(0, 400)); return v; };
    });
    const logs = [];
    p.on("pageerror", (e) => logs.push(String(e).slice(0, 300)));
    await p.goto("file://" + %(page)s, { waitUntil: "load", timeout: 120000 });
    await p.waitForFunction("window.__sheet_ready === true", { timeout: 90000 });
    const res = await p.evaluate(`(function () {
      const h = (s) => { let x = 2166136261 >>> 0; for (let i = 0; i < s.length; i += 1) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; };
      const urls = [...document.querySelectorAll("image")].map((im) => im.getAttribute("href") || "").filter((s) => s.startsWith("data:image/png"));
      const rnd = window.__rnd.slice();
      const ctxc = (n) => getComputedStyle(document.documentElement).getPropertyValue(n);
      const acc2 = window.__acc2 || "#c0504d";
      const fillDraw = (b) => { b.fill(acc2, 120); b.fillBleed(0.12); b.noStroke(); b.rect(620 - 10, 200 - 10, 420, 240); };
      const re = [0, 1, 2].map(() => h(Loom.brush.bake(1640, 640, (21 + 2 * 7919) >>> 0, 4.5, fillDraw)));
      return { hashes: urls.map(h), rnd_count: rnd.length, rnd_first: rnd.slice(0, 6), fill_url: urls[2], rebake: re };
    })()`);
    res.logs = logs;
    console.log(JSON.stringify(res));
  } finally { await b.close(); }
})().catch((e) => { console.error(String(e && e.stack || e)); process.exit(1); });
"""


EXTRA = json.loads(os.environ.get('EXP_ARGS', '[]'))


def one_load():
    tmp, *_ = lab.page("lab_brush", "editorial-paper", times=[0.0])
    try:
        js = NODE % {"engine": json.dumps(str(ENGINE)), "chrome": json.dumps(browser_path()),
                     "page": json.dumps(str(tmp / "lab.html").replace("\\", "/")), "extra": json.dumps(EXTRA)}
        r = subprocess.run(["node", "-e", js], capture_output=True, text=True, timeout=170, cwd=str(ENGINE))
        assert r.returncode == 0, r.stderr[-1500:]
        return json.loads(r.stdout.strip().splitlines()[-1])
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    out = Path(sys.argv[1]); n = int(sys.argv[2]) if len(sys.argv) > 2 else 2
    runs = [one_load() for _ in range(n)]
    out.write_text(json.dumps(runs), encoding="utf-8")
    print("extra args", EXTRA)
    for i, r in enumerate(runs):
        print(f"load {i}: layer2 {r['hashes'][2]} others-same-as-load0 {r['hashes'][:2]+r['hashes'][3:] == runs[0]['hashes'][:2]+runs[0]['hashes'][3:]} rebakes {r['rebake']} rnd {r['rnd_count']} logs {r['logs'][:1]}")

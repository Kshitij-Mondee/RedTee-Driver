"""(1) guard control: a p5.brush whose fill shader no longer has the anchor -> Loom reports brush_shader_changed.
(2) the fixed layer 2 against the old loads' layer 2 (exp1.json): how many pixels the fix moves."""
import base64, io, json, os, shutil, subprocess, sys
from pathlib import Path

ENGINE = Path(__file__).resolve().parents[4]   # docs/research/determinism/brush_fill -> the engine
sys.path.insert(0, str(ENGINE))
from loom import lab
from loom.render import browser_path
from PIL import Image, ImageChops

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
    await p.goto("file://" + %(page)s, { waitUntil: "load", timeout: 120000 });
    await p.waitForFunction("window.__sheet_ready === true", { timeout: 90000 });
    const res = await p.evaluate(`(function () {
      const urls = [...document.querySelectorAll("image")].map((im) => im.getAttribute("href") || "").filter((s) => s.startsWith("data:image/png"));
      return { errors: Loom.report.errors.map((e) => e.code + ": " + e.msg), fill: urls[2], n: urls.length };
    })()`);
    console.log(JSON.stringify(res));
  } finally { await b.close(); }
})().catch((e) => { console.error(String(e && e.stack || e)); process.exit(1); });
"""


def load(mutate=None):
    tmp, *_ = lab.page("lab_brush", "editorial-paper", times=[0.0])
    try:
        if mutate:
            f = next((tmp / "rt").glob("*_brush.js"))
            s = f.read_text(encoding="utf-8")
            assert s.count(mutate[0]) == 1, "anchor not found in the bundle copy"
            f.write_text(s.replace(*mutate), encoding="utf-8")
        js = NODE % {"engine": json.dumps(str(ENGINE)), "chrome": json.dumps(browser_path()),
                     "page": json.dumps(str(tmp / "lab.html").replace("\\", "/"))}
        r = subprocess.run(["node", "-e", js], capture_output=True, text=True, timeout=170, cwd=str(ENGINE))
        assert r.returncode == 0, r.stderr[-1500:]
        return json.loads(r.stdout.strip().splitlines()[-1])
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


S = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).parent   # where exp1.json (from brush_exp.py, on the runtime before the fix) is, and the images go
changed = load(("if(maskColor.a==0.0){outColor=source;return;}", "if(maskColor.a<=0.0){outColor=source;return;}"))
print("(1) bundle with a changed fill shader:", changed["errors"])
fixed = [load() for _ in range(2)]
print("    real bundle, errors:", [f["errors"] for f in fixed], "layers:", [f["n"] for f in fixed])
dec = lambda u: Image.open(io.BytesIO(base64.b64decode(u.split(",", 1)[1]))).convert("RGB")
print("    fixed layer 2 identical across 2 loads:", fixed[0]["fill"] == fixed[1]["fill"])
new = dec(fixed[0]["fill"])
for i, old in enumerate(json.load(open(S / "exp1.json"))):
    d = ImageChops.difference(new, dec(old["fill_url"]))
    px = [p for p in d.getdata() if any(p)]
    print(f"(2) fixed vs old load {i}: {len(px)} of {new.size[0] * new.size[1]} px differ, max channel {max((max(p) for p in px), default=0)}, bbox {d.getbbox()}")
new.save(S / "fill_fixed.png"); dec(json.load(open(S / "exp1.json"))[0]["fill_url"]).save(S / "fill_old0.png")

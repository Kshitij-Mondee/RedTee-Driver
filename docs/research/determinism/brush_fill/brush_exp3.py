"""Experiment 3: is the fill's JS command stream deterministic, and is the nondeterminism in the 2D mask or in WebGL?
Instrument CanvasRenderingContext2D and WebGL2RenderingContext calls during K rebakes of lab_brush's layer 2 draw
in one page; per rebake record: output hash, 2D command hash, WebGL call hash (non-upload), upload-source pixel hashes.
usage: py brush_exp3.py <out.json> [K] (EXP_ARGS env: extra chrome flags as JSON list)"""
import json, os, shutil, subprocess, sys
from pathlib import Path

ENGINE = Path(__file__).resolve().parents[4]   # docs/research/determinism/brush_fill -> the engine
sys.path.insert(0, str(ENGINE))
from loom import lab
from loom.render import browser_path

INSTR0 = r"""
() => {
  const READBACK = %(readback)s;
  const BISECT = %(bisect)s;
  const H = { texsz: new Map(), ops: [], on: false, c2: 2166136261 >>> 0, gl: 2166136261 >>> 0, n2: 0, ngl: 0, ups: [], log2: [] };
  window.__H = H;
  const mix = (k, s) => { for (let i = 0; i < s.length; i++) { H[k] ^= s.charCodeAt(i); H[k] = Math.imul(H[k], 16777619) >>> 0; } };
  const ser = (a) => { try { if (a && a.buffer instanceof ArrayBuffer) { let x = 0; const v = new Uint8Array(a.buffer, a.byteOffset, a.byteLength); for (let i = 0; i < v.length; i++) x = (Math.imul(x, 31) + v[i]) >>> 0; return "ta" + v.length + ":" + x; }
    if (a instanceof HTMLCanvasElement || (typeof OffscreenCanvas !== "undefined" && a instanceof OffscreenCanvas)) return "canvas" + a.width + "x" + a.height;
    if (a && typeof a === "object") return "obj"; return String(a); } catch (e) { return "?"; } };
  for (const P2 of [CanvasRenderingContext2D.prototype, OffscreenCanvasRenderingContext2D.prototype])
  for (const k of Object.getOwnPropertyNames(P2)) {
    const d = Object.getOwnPropertyDescriptor(P2, k);
    if (typeof d.value === "function" && k !== "constructor" && !/^get|^is/.test(k)) {
      const f = d.value; P2[k] = function (...a) { if (H.on) { const s = k + "(" + a.map(ser).join(",") + ")"; mix("c2", s); H.n2++; } return f.apply(this, a); };
    } else if (d.set) {
      const set = d.set; Object.defineProperty(P2, k, { ...d, set: function (v) { if (H.on) { mix("c2", k + "=" + ser(v)); H.n2++; } return set.call(this, v); } });
    }
  }
  const PG = WebGL2RenderingContext.prototype;
  for (const k of Object.getOwnPropertyNames(PG)) {
    const d = Object.getOwnPropertyDescriptor(PG, k);
    if (typeof d.value !== "function" || k === "constructor" || /^get|^is|^check/.test(k)) continue;
    const f = d.value;
    PG[k] = function (...a) {
      if (H.on) {
        if ((k === "texSubImage2D" || k === "texImage2D") && a.length && (a[a.length - 1] instanceof HTMLCanvasElement || a[a.length - 1] instanceof OffscreenCanvas)) {
          const c = a[a.length - 1]; let x = 0;
          if (!READBACK) x = -2; else try { const px = c.getContext("2d").getImageData(0, 0, c.width, c.height).data; for (let i = 0; i < px.length; i++) x = (Math.imul(x, 31) + px[i]) >>> 0; } catch (e) { x = -1; }
          H.ups.push([k, a.slice(0, -1).map(ser).join(","), c.width + "x" + c.height, x]);
        } else { mix("gl", k + "(" + a.map(ser).join(",") + ")"); H.ngl++; }
      }
      const r = f.apply(this, a);
      if (H.on && BISECT && /^(drawArrays|drawElements|blitFramebuffer|clear|texSubImage2D|texImage2D|copyTexSubImage2D)$/.test(k)) {
        const gl = this; const df = gl.getParameter(gl.DRAW_FRAMEBUFFER_BINDING); const rf = gl.getParameter(gl.READ_FRAMEBUFFER_BINDING);
        let tgt = k.startsWith("tex") || k.startsWith("copy") ? "tex" : (df ? "fbo" : "default");
        let x = 0, w = 0, hh = 0, err = 0;
        if (tgt !== "tex") {
          gl.bindFramebuffer(gl.READ_FRAMEBUFFER, df);
          w = df ? 0 : gl.drawingBufferWidth; hh = df ? 0 : gl.drawingBufferHeight;
          if (df) { const t = gl.getFramebufferAttachmentParameter(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME); w = H.texsz.get(t) ? H.texsz.get(t)[0] : 0; hh = H.texsz.get(t) ? H.texsz.get(t)[1] : 0; }
          if (w && hh) { const px = new Uint8Array(w * hh * 4); gl.readPixels(0, 0, w, hh, gl.RGBA, gl.UNSIGNED_BYTE, px); for (let i = 0; i < px.length; i += 1) x = (Math.imul(x, 31) + px[i]) >>> 0; }
          err = gl.getError();
          gl.bindFramebuffer(gl.READ_FRAMEBUFFER, rf);
        }
        const sc = gl.isEnabled(gl.SCISSOR_TEST) ? Array.from(gl.getParameter(gl.SCISSOR_BOX)).join(",") : "-";
        H.ops.push([k, tgt, w + "x" + hh, x, err, sc, gl.getParameter(gl.BLEND)]);
      }
      if (k === "texStorage2D") H.texsz.set(this.getParameter(this.TEXTURE_BINDING_2D), [a[3], a[4]]);
      if (k === "texImage2D" && typeof a[3] === "number" && typeof a[4] === "number") H.texsz.set(this.getParameter(this.TEXTURE_BINDING_2D), [a[3], a[4]]);
      return r;
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
    args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--allow-file-access-from-files"].concat(%(extra)s) });
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
      const fillDraw = (b) => { b.fill("#c0504d", 120); b.fillBleed(0.12); b.noStroke(); b.rect(610, 190, 420, 240); };
      const out = [];
      for (let k = 0; k < %(K)s; k++) {
        const H = window.__H; H.c2 = 2166136261 >>> 0; H.gl = 2166136261 >>> 0; H.n2 = 0; H.ngl = 0; H.ups = []; H.ops = []; H.on = true;
        const url = Loom.brush.bake(1640, 640, (21 + 2 * 7919) >>> 0, 4.5, fillDraw);
        H.on = false;
        out.push({ out: h(url), c2: H.c2, n2: H.n2, gl: H.gl, ngl: H.ngl, ups: H.ups, ops: H.ops });
      }
      return out;
    })()`);
    console.log(JSON.stringify({ res, logs }));
  } finally { await b.close(); }
})().catch((e) => { console.error(String(e && e.stack || e)); process.exit(1); });
"""

INSTR = None
EXTRA = json.loads(os.environ.get("EXP_ARGS", "[]"))


def one_load(K):
    tmp, *_ = lab.page("lab_brush", "editorial-paper", times=[0.0])
    try:
        js = NODE % {"engine": json.dumps(str(ENGINE)), "chrome": json.dumps(browser_path()), "instr": INSTR0 % {"readback": os.environ.get("EXP_READBACK", "false"), "bisect": os.environ.get("EXP_BISECT", "false")}, "K": K,
                     "page": json.dumps(str(tmp / "lab.html").replace("\\", "/")), "extra": json.dumps(EXTRA)}
        r = subprocess.run(["node", "-e", js], capture_output=True, text=True, timeout=170, cwd=str(ENGINE))
        assert r.returncode == 0, r.stderr[-1500:]
        return json.loads(r.stdout.strip().splitlines()[-1])
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    out = Path(sys.argv[1]); K = int(sys.argv[2]) if len(sys.argv) > 2 else 6
    r = one_load(K)
    out.write_text(json.dumps(r), encoding="utf-8")
    print("extra", EXTRA, "logs", r["logs"][:2])
    for i, x in enumerate(r["res"]):
        print(f"rebake {i}: out {x['out']} 2d {x['c2']} ({x['n2']} calls) gl {x['gl']} ({x['ngl']} calls) uploads {[(u[0], u[2], u[3]) for u in x['ups']]}")

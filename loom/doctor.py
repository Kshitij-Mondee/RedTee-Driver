"""Doctor: is this machine ready to make videos?"""
from __future__ import annotations

import importlib
import os
import sys

from .narrate.providers import KOKORO_DIR
from .util import ENGINE_ROOT, run, which


def doctor() -> int:
    ok = True
    def row(good, name, detail):
        nonlocal ok
        ok = ok and (good or good is None)
        mark = "ok " if good else ("-- " if good is None else "XX ")
        print(f"  [{mark}] {name:<22} {detail}")
    print(f"Loom engine: {ENGINE_ROOT}")
    row(sys.version_info >= (3, 10), "python >= 3.10", sys.version.split()[0])
    for mod, why in [("numpy", "audio maths"), ("PIL", "contact sheets (pillow)"), ("jsonschema", "schema validation (optional)"),
                     ("kokoro_onnx", "local voice (kokoro-onnx)"), ("faster_whisper", "speech check in narrate (faster-whisper, D-174)"), ("manim", "Manim scenes (optional)"), ("pdfplumber", "PDF ingest (source mode)")]:
        try:
            importlib.import_module(mod); row(True, mod, why)
        except Exception:
            row(None if mod in ("jsonschema", "manim", "pdfplumber") else False, mod, f"missing: {why}")
    node = which("node")
    if node:
        v = run([node, "--version"], check=False).stdout.strip()
        row(int(v.lstrip("v").split(".")[0]) >= 22, "node >= 22", v)
    else:
        row(False, "node", "not found (https://nodejs.org)")
    row(which("ffmpeg") is not None, "ffmpeg", which("ffmpeg") or "not found")
    row((ENGINE_ROOT / "node_modules/hyperframes").exists(), "hyperframes", "npm install" if not (ENGINE_ROOT / "node_modules/hyperframes").exists() else "installed")
    km = any((KOKORO_DIR / f).exists() for f in ("kokoro-v1.0.onnx", "kokoro-v1.0.int8.onnx", "kokoro-q8.onnx"))
    row(km, "kokoro model", str(KOKORO_DIR) if km else "missing: py -m loom setup voice")
    if (ENGINE_ROOT / "node_modules/hyperframes").exists() and node:
        from .render import hf_env, hyperframes_cmd
        r = run(hyperframes_cmd() + ["browser", "path"], check=False, env=hf_env())
        good = r.returncode == 0 and r.stdout.strip() != ""
        row(good or bool(os.environ.get("HYPERFRAMES_BROWSER_PATH")), "render browser", (r.stdout.strip().splitlines() or ["run: npx hyperframes browser ensure"])[-1][:90])
        if good or os.environ.get("HYPERFRAMES_BROWSER_PATH"):
            from .render import render_webgl
            w = render_webgl()
            row(bool((w.get("software") or {}).get("webgl")), "render WebGL",
                "software capture " + ("ok" if (w.get("software") or {}).get("webgl") else "NONE (fx, Three.js, brush will not draw: restart the machine)")
                + "; probe " + ("ok" if (w.get("probe") or {}).get("webgl") else "none"))
    row((ENGINE_ROOT / "runtime/catalog.json").exists(), "catalog", "py -m loom catalog" if not (ENGINE_ROOT / "runtime/catalog.json").exists() else "built")
    row(True if os.environ.get("ANTHROPIC_API_KEY") else None, "ANTHROPIC_API_KEY", "set (API mode available)" if os.environ.get("ANTHROPIC_API_KEY") else "not set (agent mode only)")
    print("\nready." if ok else "\nfix the XX rows above.")
    return 0 if ok else 1

"""Download the local Kokoro voice (Apache-2.0) into <engine>/models/kokoro."""
from __future__ import annotations

import hashlib
import json
import shutil
import subprocess
import tarfile
import tempfile
import urllib.request
from pathlib import Path

from .narrate.providers import KOKORO_DIR
from .util import LoomError, info, which

RELEASE = "https://github.com/thewh1te/kokoro-onnx/releases/download/model-files-v1.0"
FILES = [("kokoro-v1.0.int8.onnx", None), ("voices-v1.0.bin", None)]
Q8_SHA = "fbae9257e1e05ffc727e951ef9b9c98418e6d79f1c9b6b13bd59f5c9028a1478"


def _get(url, dst):
    info(f"downloading {url}")
    with urllib.request.urlopen(url, timeout=600) as r, open(dst, "wb") as f:
        shutil.copyfileobj(r, f)


def setup_voice():
    KOKORO_DIR.mkdir(parents=True, exist_ok=True)
    try:
        for name, _ in FILES:
            if not (KOKORO_DIR / name).exists():
                _get(f"{RELEASE}/{name}", KOKORO_DIR / name)
        info(f"kokoro ready in {KOKORO_DIR}")
        return
    except Exception as e:
        info(f"release download failed ({e}); falling back to npm-hosted weights")
    npm = which("npm")
    if not npm:
        raise LoomError("neither the GitHub release nor npm is reachable")
    tmp = Path(tempfile.mkdtemp())
    try:
        for pkg in ("kokoro-q8-shards", "kokoro-js"):
            subprocess.run([npm, "pack", pkg, "--silent"], cwd=tmp, check=True, capture_output=True)
        for t in tmp.glob("*.tgz"):
            with tarfile.open(t) as tf:
                tf.extractall(tmp / t.stem)
        q = next(tmp.glob("kokoro-q8-shards*/package"))
        data = b"".join((q / f"kokoro-q8.part{i}.bin").read_bytes() for i in range(6))
        if hashlib.sha256(data).hexdigest() != Q8_SHA:
            raise LoomError("kokoro q8 weights failed their checksum")
        (KOKORO_DIR / "kokoro-q8.onnx").write_bytes(data)
        import numpy as np
        vdir = next(tmp.glob("kokoro-js*/package/voices"))
        voices = {f.stem: np.fromfile(f, dtype=np.float32).reshape(-1, 1, 256) for f in vdir.glob("*.bin")}
        np.savez(KOKORO_DIR / "voices.npz", **voices)
        info(f"kokoro ready in {KOKORO_DIR} ({len(voices)} voices)")
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

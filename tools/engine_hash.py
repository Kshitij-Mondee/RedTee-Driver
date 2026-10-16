"""Fingerprint the ENGINE (not the lessons): used by the frozen-engine protocol of a clean run.

    py tools/engine_hash.py      ->  16-hex hash of loom/, runtime/ (minus generated catalogs), prompts/,
                                     docs/, packs/, skills/, tools/, assets/, tests/

Record it at the start of a run (RUN_LOG.md) and again at the end: any engine change in between must be
logged as a deliberate, disclosed fix.
"""
from __future__ import annotations

import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIRS = ["loom", "runtime", "prompts", "docs", "packs", "skills", "tools", "assets", "tests"]
SKIP = {"catalog.json", "catalog.md", "redtee_catalog.md"}


def engine_hash() -> str:
    h = hashlib.sha256()
    for d in DIRS:
        for p in sorted((ROOT / d).rglob("*")):
            if p.is_file() and "__pycache__" not in p.parts and p.name not in SKIP and p.suffix != ".pyc":
                h.update(str(p.relative_to(ROOT)).replace("\\", "/").encode())
                h.update(p.read_bytes().replace(b"\r\n", b"\n"))
    return h.hexdigest()[:16]


if __name__ == "__main__":
    print(engine_hash())

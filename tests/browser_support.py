"""One answer to "is there a Chrome here?" for every browser test (L-127, L-297, and again on 2026-10-15).

A pinned HYPERFRAMES_BROWSER_PATH wins; else the browser HyperFrames manages (`npx hyperframes browser ensure`),
found by the engine's own `loom.render.browser_path()`, the way `loom doctor` finds it. A test that read only the env
var skipped on a PC that could render. A found browser is pinned in this process's environment, so the node harnesses
the tests spawn (they launch `process.env.HYPERFRAMES_BROWSER_PATH`) drive the same Chrome; the engine reads the env
var first, so it finds the same one either way.

Suites import it with `sys.path` holding tests/ (run_tests.py's own folder):  from browser_support import browser
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

ENGINE = Path(__file__).resolve().parents[1]

SKIP = "skipped (no browser here; set HYPERFRAMES_BROWSER_PATH or run `npx hyperframes browser ensure`)"


def browser() -> str | None:
    """the Chrome the engine would render with, or None (a skip, never a pass)"""
    if str(ENGINE) not in sys.path:
        sys.path.insert(0, str(ENGINE))
    try:
        from loom.render import browser_path
        found = browser_path()
    except Exception:  # noqa: BLE001  (no browser is an answer, not a crash)
        found = None
    if found and not os.environ.get("HYPERFRAMES_BROWSER_PATH"):
        os.environ["HYPERFRAMES_BROWSER_PATH"] = found
    return found

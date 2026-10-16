"""Caption contrast per style pack (RC20, 2026-10-07): the active word and the caption text against the caption pill
composited over the field, as the viewer sees it (loom/checks/style_lint.py caption_ratios; runtime/overlay.js does the
same sum).

  py tools/caption_contrast.py          print the table
  py tools/caption_contrast.py --fix    for a pack whose active word is under 4.5:1, add a palette token
                                        `caption_active` (the least tint of its own active colour toward white that
                                        reaches 4.8:1, so the hue stays the pack's) and point captions.active at it
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from loom.checks.style_lint import caption_ratios, contrast  # noqa: E402

TARGET = 4.8   # 4.5 is the bar; a little margin for anti-aliased edges


def mix(a: str, b: str, k: float) -> str:
    a, b = a.lstrip("#"), b.lstrip("#")
    ca = [int(a[i:i + 2], 16) for i in (0, 2, 4)]
    cb = [int(b[i:i + 2], 16) for i in (0, 2, 4)]
    return "#" + "".join(f"{round(x + (y - x) * k):02X}" for x, y in zip(ca, cb))


def main(argv: list[str]) -> int:
    fix = "--fix" in argv
    rows = []
    for f in sorted((ROOT / "packs" / "styles").glob("*.json")):
        pack = json.loads(f.read_text(encoding="utf-8"))
        if not pack.get("captions"):
            continue
        before = caption_ratios(pack)
        after = before
        if fix and before["active_ratio"] < 4.5:
            base = before["active"]
            tint = next((mix(base, "#FFFFFF", k / 100) for k in range(5, 101, 5) if contrast(mix(base, "#FFFFFF", k / 100), before["pill"]) >= TARGET), "#FFFFFF")
            pack["palette"]["caption_active"] = tint
            pack["captions"]["active"] = "caption_active"
            f.write_text(json.dumps(pack, indent=2, ensure_ascii=False), encoding="utf-8")
            after = caption_ratios(pack)
        rows.append((f.stem, before, after))
    print(f"{'pack':18s} {'pill':8s} {'active before':>22s} {'active after':>22s} {'fg':>7s}")
    bad = 0
    for name, b, a in rows:
        print(f"{name:18s} {b['pill']:8s} {b['active']:>9s} {b['active_ratio']:5.2f}:1  {a['active']:>9s} {a['active_ratio']:5.2f}:1 {a['fg_ratio']:5.2f}:1")
        bad += a["active_ratio"] < 4.5 or a["fg_ratio"] < 7.0
    print(f"{len(rows)} packs; {bad} below the bar (active 4.5:1, text 7:1)")
    return 1 if bad else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))

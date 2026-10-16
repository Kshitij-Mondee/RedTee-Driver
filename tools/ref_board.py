"""Reference boards (docs/REFERENCE_FIRST.md, D-87): look at existing work before drawing anything.

    py tools/ref_board.py new places/server [--title "server room"]   # writes docs/references/places/server.md
    py tools/ref_board.py check [--baseline]                            # what the runtime draws without a board

`new` writes a board from the template: the searches made, 3-6 references with what to take and what not to
take, the design rules derived, and what it still lacks. `check` lists every place (`Loom.place.*`) and object
(`Loom.obj` kinds) the runtime draws that has no board at docs/references/places/<kind>.md or
docs/references/objects/<kind>.md. It FAILS only when that list grows past the recorded baseline (a ratchet,
Rule 0 addendum 5), so new work needs a board and the old gaps close one by one. A board must name at least one
reference link; an empty template does not count.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REFS = ROOT / "docs" / "references"
BASELINE = REFS / "_baseline.json"

TEMPLATE = """# Reference board: {title}

STATUS: DRAFT {date}. For: <the code or scene it designs>.

## What was searched
- Web: "<subject> flat illustration", "<subject> isometric illustration", "<subject> line art" (where, when).
- Our studies: <docs/research/... frames that show this kind of thing>.

## References (3 to 6; links only, nothing downloaded without approval)
1. **<title>** by <author>: <url>
   - Take: <composition / perspective / value plan / palette ratio / detail density / light / shape language / motion>.
   - Do not take: <its layout, colours, drawings>.

## Design rules derived (copy them into the code header)
1. ...

## What it still lacks (honest)
- ...
"""


def drawn_kinds() -> dict[str, list[str]]:
    places = re.findall(r'P\.KINDS = \[([^\]]*)\]', (ROOT / "runtime" / "places.js").read_text(encoding="utf-8"))
    objs = re.search(r"O\.FAMILIES = \{([\s\S]*?)\};", (ROOT / "runtime" / "objects.js").read_text(encoding="utf-8"))
    return {
        "places": re.findall(r'"(\w+)"', places[0]) if places else [],
        "objects": re.findall(r"^\s*(\w+):", objs.group(1), re.M) if objs else [],
    }


def has_board(area: str, kind: str) -> bool:
    f = REFS / area / f"{kind}.md"
    return f.exists() and bool(re.search(r"https?://", f.read_text(encoding="utf-8")))


def missing() -> list[str]:
    out = []
    for area, kinds in drawn_kinds().items():
        out += [f"{area}/{k}" for k in kinds if not has_board(area, k)]
    return out


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    n = sub.add_parser("new"); n.add_argument("path"); n.add_argument("--title")
    c = sub.add_parser("check"); c.add_argument("--baseline", action="store_true")
    a = ap.parse_args(argv)
    if a.cmd == "new":
        f = REFS / (a.path if a.path.endswith(".md") else a.path + ".md")
        if f.exists():
            print(f"{f.relative_to(ROOT)} exists; edit it"); return 2
        f.parent.mkdir(parents=True, exist_ok=True)
        import datetime
        f.write_text(TEMPLATE.format(title=a.title or Path(a.path).stem, date=datetime.date.today().isoformat()), encoding="utf-8")
        print(f"written {f.relative_to(ROOT)}: fill it in before drawing (docs/REFERENCE_FIRST.md)"); return 0
    kinds = drawn_kinds()
    total = sum(len(v) for v in kinds.values())
    if not total:
        print("found no places or objects in the runtime (a zero is not a result)"); return 2
    M = missing()
    print(f"reference boards: {total - len(M)} of {total} drawn places and objects have one")
    for m in M:
        print(f"  no board: docs/references/{m}.md")
    if a.baseline:
        BASELINE.write_text(json.dumps({"missing": M}, indent=1)); print(f"baseline written ({len(M)} missing)"); return 0
    base = json.loads(BASELINE.read_text()) if BASELINE.exists() else {"missing": M}
    grew = [m for m in M if m not in base["missing"]]
    if grew:
        print("NEW work without a reference board (look first, then draw): " + ", ".join(grew)); return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())

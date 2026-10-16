"""Scratch: render catalog templates in the engine styles, keeping the mid-build AND the end frame (the library
sheet keeps only the end). Read-only on the repo; writes to the scratchpad."""
import inspect, json, sys
from pathlib import Path
import loom.library as L
src = inspect.getsource(L.render_sheet).replace('for s in rep["shots"] if s["t"] == times[-1]]', 'for s in rep["shots"]]')
ns = dict(vars(L)); exec(src, ns); rs = ns["render_sheet"]
cat = json.loads(Path("runtime/catalog.json").read_text(encoding="utf-8"))
out = Path(sys.argv[1]); styles = sys.argv[3].split(",")
for tid in sys.argv[2].split(","):
    ex = json.loads(Path(sys.argv[4]).read_text())[tid]
    rep = rs(tid, styles=styles, kind="template", cases=[{"label": "catalog example", "params": ex}], sheet_name=f"now-{tid}", out_dir=out)
    print(tid, rep["sheet"], {k: [e.get("code") for e in v["errors"]][:4] for k, v in rep["styles"].items()})

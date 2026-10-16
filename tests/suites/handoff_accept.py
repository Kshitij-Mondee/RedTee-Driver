"""A commissioned component is accepted by `loom library accept` (batch-01 of the asset hand-off, 2026-10-16): every item
failed "unknown form ... run harvest first", because accept() routed only harvested forms, while check_component already
took a component with `commissioned_by`. Run on a temporary library folder (the real decisions are never touched); the
component check itself is stubbed: what is tested is the route and the record.
"""
from __future__ import annotations

import shutil
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def check_library_accept_routes_a_commissioned_component():
    """app_x with `commissioned_by` and no lesson uses: accept runs check_component and records it promoted, naming who
    commissioned it. Control: the same file without `commissioned_by` is still "unknown form"."""
    import loom.library as L
    import loom.catalog as CAT
    d = Path(tempfile.mkdtemp(prefix="loom_accept_"))
    saved = (L.LIB, L.COMP, L.harvest, L.check_component, L._components, CAT.build_catalog)
    try:
        (d / "lib").mkdir(); (d / "comp").mkdir()
        (d / "comp" / "app_x.js").write_text('Loom.component("app_x", {});', encoding="utf-8")
        L.LIB, L.COMP = d / "lib", d / "comp"
        L.harvest = lambda write=True: {"forms": {}}
        calls = []
        L.check_component = lambda fid, sheet=True: (calls.append(fid) or ([], {"sheet": "x.jpg"}))
        L._components = lambda: {"app_x": {"version": 2}}
        spec = {"commissioned_by": "Kshitij 2026-10-16 (hand-off sheet T-149)"}
        CAT.build_catalog = lambda: {"components": {"app_x": spec}}
        E = L.accept("app_x")
        rec = L.read_json(d / "lib" / "decisions.json", {}).get("app_x") or {}
        assert not E and calls == ["app_x"], (E, calls)
        assert rec.get("status") == "promoted" and rec.get("component") == "app_x@2" and "T-149" in rec.get("commissioned_by", ""), rec
        spec.clear()
        (d / "lib" / "decisions.json").unlink()
        E2 = L.accept("app_x")
        assert E2 and "unknown form" in E2[0], f"control: an uncommissioned file must stay unknown: {E2}"
        return "commissioned component checked and recorded promoted (app_x@2, T-149); uncommissioned stays unknown"
    finally:
        L.LIB, L.COMP, L.harvest, L.check_component, L._components, CAT.build_catalog = saved
        shutil.rmtree(d, ignore_errors=True)

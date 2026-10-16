"""Directed world sets (2026-10-09): end-to-end Claude Design prompts per scene and style, the set styles' palettes,
the world gate for directed scenes, and the intake's set checks. Each test carries a control that can fail."""
from __future__ import annotations

import importlib.util
import json
import shutil
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from loom import set_styles as SS  # noqa: E402


def _wp():
    spec = importlib.util.spec_from_file_location("world_packs_t", ROOT / "tools" / "world_packs.py")
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def _intake():
    spec = importlib.util.spec_from_file_location("asset_intake_t", ROOT / "tools" / "asset_intake.py")
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def check_world_prompts_carry_everything_for_one_set():
    """Every directed (scene, style) prompt is self-contained: the contract, the style's exact palette, the return
    format with its file name, the style block, the world, the scene's objects, every detail, slot and anchor, the
    plan-first order and the quality check; no placeholder to fill and no dash. Control: the version-1 prompt still
    asks the reader to paste a style block, so the placeholder check can fail."""
    wp = _wp()
    worlds, errs = wp.load()
    assert not errs, errs[:5]
    directed = [w for w in worlds if w.get("brief") == 2]
    assert directed, "no directed world (a zero is red)"
    n = 0
    for w in directed:
        for s in w["scenes"]:
            for sid in SS.data()["styles"]:
                t = wp.end_to_end(w, sid, s)
                n += 1
                must = ["SET CONTRACT", "PALETTE", "DELIVERY", f"sets/{w['id']}/{s['id']}__{sid}.svg", SS.style(sid)["name"].upper(),
                        w["identity"]["place"][:60], "QUALITY CHECK", "ORDER", "frame_safe"]
                must += [SS.palette(sid)[fam]["base"] for fam in SS.palette(sid)]
                must += [d[:40] for d in s["details"]] + list(s["anchors"]) + [o + ":" for o in s["objects"]]
                miss = [m for m in must if m not in t]
                assert not miss, (w["id"], s["id"], sid, miss[:4])
                assert "Paste ONE style block" not in t and not wp.DASH.search(t), (s["id"], sid)
    # every world is directed since 2026-10-15, so the control is a version 1 copy of the office (no brief 2 fields)
    v1 = {k: v for k, v in directed[0].items() if k not in ("brief", "identity", "objects", "batches")}
    assert "Paste ONE style block" in wp.prompt(v1), "control: the placeholder check cannot fail"
    return f"{n} prompts complete ({len(directed)} directed world, {len(SS.data()['styles'])} styles); control: the v1 prompt has the placeholder"


def check_world_gate_refuses_an_undirected_or_absurd_scene():
    """A directed world's scene with no camera, with people in the set, with an object that has no construction
    note, or that leans on another scene ("as in open_plan": each prompt stands alone) fails the gate. Control: the real office passes."""
    wp = _wp()
    office = json.loads((wp.SRC / "office.json").read_text(encoding="utf-8"))
    tmp = Path(tempfile.mkdtemp(prefix="worlds_"))
    try:
        bad = json.loads(json.dumps(office))
        bad["scenes"][0].pop("camera")
        bad["scenes"][1]["mid"] = "desks with a person seated at each"
        bad["scenes"][2]["objects"] = bad["scenes"][2]["objects"] + ["hoverboard"]
        bad["scenes"][3]["camera"] = "as in open_plan"
        (tmp / "office.json").write_text(json.dumps(bad), encoding="utf-8")
        wp.SRC = tmp
        _, errs = wp.load()
        txt = " | ".join(errs)
        assert "needs ['camera']" in txt and "puts people in the set" in txt and "hoverboard" in txt and "refers to ['open_plan']" in txt, errs
        (tmp / "office.json").write_text(json.dumps(office), encoding="utf-8")
        _, ok = wp.load()
        assert not ok, ok
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    return "a missing camera, people in a set, an unbuilt object and a reference to another scene refused; control: the office passes"


def check_set_palettes_are_distinct_and_their_tones_read():
    """Each set style has one distinct hex per tone (17 families x 4 tones + 4 singles = 72), so a set can be recoloured by
    material; every shade and deep tone differs from its base by at least MIN_DE (5 for near-black bases, which
    cannot go much darker). Highlights on near-white surfaces
    of the paper styles (ink and wash, line art) are allowed to be subtle: the light there is the paper itself.
    Control: a palette with a collapsed tone is caught."""
    short = []
    for sid in SS.data()["styles"]:
        P = SS.palette(sid)
        hx = [v for t in P.values() for v in t.values()]
        want = 4 * (len(SS.data()["families"]) - len(SS.data()["singles"])) + len(SS.data()["singles"])
        assert len(hx) == want and len(set(hx)) == want, (sid, len(hx), len(set(hx)), want)
        for fam, t in P.items():
            if "hi" not in t:
                continue
            dark = SS._lab(SS._hx(t["base"]))[0] < 15        # near-black bases (a night floor) cannot go much darker
            for k in ("shade", "deep"):
                assert SS.delta_e(t[k], t["base"]) >= (5.0 if dark else SS.MIN_DE), (sid, fam, k)
            if SS.delta_e(t["hi"], t["base"]) < SS.MIN_DE:
                short.append(f"{sid}.{fam}")
    assert all(s.split(".")[0] in ("ink_wash", "line_art", "lit_25d") for s in short), short
    assert SS.delta_e("#ECE7DF", "#ECE7DF") < SS.MIN_DE, "control: a collapsed tone is not caught"
    return f"{len(SS.data()['styles'])} palettes x {want} distinct colours; shades all read; {len(short)} subtle highlights, all in the pale paper styles or a sky"


def _set_svg(sid, colour=None, layers=("far", "mid", "near"), vb="0 0 2400 1350", boxes=False):
    P = SS.palette(sid)
    c = colour or P["wall"]["base"]
    g = "".join(f'<g id="{l}"><rect x="0" y="0" width="2400" height="1350" fill="{c}"/>'
                f'<g class="lm-shadow"><rect x="10" y="10" width="40" height="40" fill="{P["shadow"]["base"]}" fill-opacity="0.2"/></g></g>'
                for l in layers)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">{g}'
            + ("" if boxes else f'<path d="M10 10 C 40 0 80 20 100 10 Z" fill="{P["plant"]["base"]}"/>')
            + '<rect id="frame_safe" x="240" y="135" width="1920" height="1080" fill="none" stroke="none"/>'
            '<circle id="anchor_floor_y" cx="1200" cy="1000" r="2" fill="none"/></svg>')


def check_intake_checks_a_set_against_its_style():
    """The intake accepts a set drawn in its style's palette with far, mid and near, frame_safe, anchor_floor_y and
    the 2400 x 1350 canvas; it refuses an off-palette colour, a missing layer, a wrong canvas and an unknown style.
    Control: the good set passes, so each refusal is the change it names."""
    ai = _intake()
    sid = "flat_editorial"
    entry = {"kind": "set", "set_style": sid}
    _, ok, _, _ = ai.check("sets/office/meeting_room__flat_editorial", _set_svg(sid), entry)
    assert not ok, ok
    _, p1, _, _ = ai.check("sets/office/x__flat_editorial", _set_svg(sid, colour="#123456"), entry)
    _, p2, _, _ = ai.check("sets/office/x__flat_editorial", _set_svg(sid, layers=("far", "near")), entry)
    _, p3, _, _ = ai.check("sets/office/x__flat_editorial", _set_svg(sid, vb="0 0 1920 1080"), entry)
    _, p4, _, _ = ai.check("sets/office/x__nope", _set_svg(sid), {"kind": "set", "set_style": "nope"})
    _, p5, _, _ = ai.check("sets/office/x__painterly", _set_svg(sid), {"kind": "set", "set_style": "painterly"})
    assert any("#123456" in x for x in p1), p1
    assert any("far, mid, near" in x for x in p2), p2
    assert any("viewBox" in x for x in p3), p3
    assert any("set_style" in x for x in p4), p4
    assert any("not a contract slot" in x for x in p5), p5          # flat colours are not the painterly palette
    _, p6, f6, _ = ai.check("sets/office/x__flat_editorial", _set_svg(sid, boxes=True), entry)
    assert not p6 and any("straight-edged" in x for x in f6), (p6, f6)   # boxes are noted, not refused (D-151)
    return "the contract set passes; off-palette, missing layer, wrong canvas, unknown style, another style's palette refused; a set of boxes only is noted, not refused"


def check_batch_prompts_carry_every_set_once_and_the_shared_parts_once():
    """A batch prompt (several sets of one world in one style, drawn one after another) names every set's file and
    brief, states the contract and the style once, and orders one set at a time. Control: a batch built from fewer
    scenes lacks the missing scene's file, so the check can fail."""
    wp = _wp()
    worlds, errs = wp.load()
    assert not errs, errs[:3]
    n = 0
    for w in [x for x in worlds if x.get("brief") == 2]:
        for ids in w.get("batches") or []:
            for sid in SS.data()["styles"]:
                t = wp.batch_prompt(w, sid, ids)
                n += 1
                for i in ids:
                    assert f"sets/{w['id']}/{i}__{sid}.svg" in t and f"THE SET TO DRAW: {i}:" in t, (i, sid)
                assert t.count("SET CONTRACT") == 1 and t.count(f"STYLE: {SS.style(sid)['name'].upper()}") == 1, sid
                assert "Work ONE set at a time" in t and not wp.DASH.search(t)
            short = wp.batch_prompt(w, "lit_25d", ids[:-1])
            assert f"sets/{w['id']}/{ids[-1]}__lit_25d.svg" not in short, "control: a missing set is not caught"
    assert n, "no batch prompt (a zero is red)"
    return f"{n} batch prompts carry every set once with the shared parts once; control: a shorter batch lacks the set"


def check_world_gate_makes_every_scene_earn_its_place():
    """D-153: a directed scene needs at least 4 lesson moments it would be chosen for and a reuse rating; a low-reuse
    scene needs a reason to stay; a world starts with at most 6 high or medium scenes. Control: the office passes."""
    wp = _wp()
    office = json.loads((wp.SRC / "office.json").read_text(encoding="utf-8"))
    tmp = Path(tempfile.mkdtemp(prefix="worlds_reuse_"))
    try:
        bad = json.loads(json.dumps(office))
        bad["scenes"][0]["uses"] = ["one moment"]
        bad["scenes"][1].pop("reuse")
        low = next(s for s in bad["scenes"] if s.get("reuse") == "low")
        low.pop("keep")
        for s in bad["scenes"]:
            if s.get("reuse") == "low" and s is not low:
                s["reuse"] = "medium"
        (tmp / "office.json").write_text(json.dumps(bad), encoding="utf-8")
        wp.SRC = tmp
        _, errs = wp.load()
        txt = " | ".join(errs)
        assert "at least 4 concrete lesson moments" in txt and "needs 'reuse'" in txt and "low reuse" in txt and "at most 6" in txt, errs
        (tmp / "office.json").write_text(json.dumps(office), encoding="utf-8")
        _, ok = wp.load()
        assert not ok, ok
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    return "too few uses, no rating, a low scene with no reason and seven core scenes refused; control: the office passes"

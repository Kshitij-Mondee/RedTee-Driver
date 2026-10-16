"""The set library (D-152): sets filed by world and scene, chosen only on an exact id or a perfect description match in
the lesson's own set style, promoted only from a passed intake with an approver, and drawn by Loom.place.set on the
place camera. Each test has a control that can fail."""
from __future__ import annotations

import json
import shutil
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))   # tests/: one browser check for every suite
from browser_support import browser  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from loom import sets as ST  # noqa: E402
from loom.util import LoomError  # noqa: E402


def check_set_selection_loads_only_an_exact_or_a_perfect_match():
    """With the meeting room in the library (2.5D lit, for cinematic-dawn): its exact id and words that contain its
    whole name or alias load it; a partial word, a different world named in the words, another lesson style, a scene
    not drawn yet and an unknown id are all refused with a reason. Control: the loads happen (a matcher that refuses
    everything would fail the first block)."""
    style = "cinematic-dawn"
    ok = ["office/meeting_room", "a meeting room where a manager gives feedback", "the conference room",
          {"want": "a meeting room at the office"}, {"world": "office", "scene": "meeting_room"}]
    for w in ok:
        r = ST.resolve(w, style)
        assert r["ok"] and r["id"] == "office/meeting_room", (w, r)
    refused = {"meeting": "no scene name", "a meeting room in a hospital": "names the world",
               "the bank's meeting room": "names the world", "the evening floor": "not in the set library",
               "office/no_such_scene": "not a world/scene id", "": "no set asked"}
    for w, why in refused.items():
        r = ST.resolve(w, style)
        assert not r["ok"] and why in r["reason"], (w, r)
    other = ST.resolve("office/meeting_room", "corporate-clean")   # no flat_editorial meeting room is drawn yet
    assert not other["ok"] and "never borrowed across styles" in other["reason"], other
    return f"{len(ok)} exact or perfect asks load; {len(refused) + 1} near, wrong-world, missing or other-style asks refused"


def check_set_selection_refuses_a_name_two_worlds_share():
    """A scene name shared by two worlds loads nothing until the words name the world. Control: naming the world
    narrows it to that world's scene."""
    tmp = Path(tempfile.mkdtemp(prefix="sets_worlds_"))
    keep = ST.WORLDS
    try:
        for wid, name in (("alpha", "Alpha offices"), ("beta", "Beta clinics")):
            (tmp / f"{wid}.json").write_text(json.dumps({"id": wid, "name": name, "aliases": [wid],
                                                         "scenes": [{"id": "kitchen", "aliases": ["staff kitchen"]}]}), encoding="utf-8")
        ST.WORLDS = tmp
        r = ST.resolve("the staff kitchen", "cinematic-dawn")
        assert not r["ok"] and "several worlds" in r["reason"] and len(r["candidates"]) == 2, r
        r2 = ST.resolve("the staff kitchen at beta", "cinematic-dawn")
        assert not r2["ok"] and "beta/kitchen" in r2["reason"] and "not in the set library" in r2["reason"], r2
    finally:
        ST.WORLDS = keep
        shutil.rmtree(tmp, ignore_errors=True)
    return "a shared name refused with both candidates; naming the world narrows it to one"


def check_sets_enter_the_library_only_after_a_passed_intake_and_an_approver():
    """sets add copies a PASS set to assets/sets/<world>/<scene>/<set_style>.svg with a card whose anchors and slots are
    in frame coordinates (canvas minus 240, 135); it refuses a FAIL and an add with no approver. Control: the real
    meeting-room card agrees with its svg (check)."""
    src = ROOT / "assets" / "sets" / "office" / "meeting_room" / "lit_25d.svg"
    assert src.exists(), "the accepted meeting room is not in the library"
    tmp = Path(tempfile.mkdtemp(prefix="sets_lib_"))
    keep = (ST.ROOT, ST.INDEX)
    try:
        inc = tmp / "incoming" / "b1"
        (inc / "sets" / "office").mkdir(parents=True)
        shutil.copy2(src, inc / "sets" / "office" / "meeting_room__lit_25d.svg")
        (inc / "manifest.json").write_text(json.dumps({"assets": [{"file": "sets/office/meeting_room__lit_25d.svg", "kind": "set",
                                                                  "world": "office", "scene": "meeting_room", "set_style": "lit_25d"}]}), encoding="utf-8")
        ST.ROOT, ST.INDEX = tmp / "sets", tmp / "sets" / "INDEX.md"
        (inc / "INTAKE.md").write_text("- **FAIL** `sets/office/meeting_room__lit_25d` (set)\n", encoding="utf-8")
        for by, why in (("Kshitij", "not a PASS"), ("", "needs --by")):
            try:
                ST.add("b1", by, src_root=tmp / "incoming"); raise AssertionError(f"added with by={by!r}")
            except LoomError as e:
                assert why in str(e), e
            (inc / "INTAKE.md").write_text("- **PASS** `sets/office/meeting_room__lit_25d` (set)\n", encoding="utf-8")
        got = ST.add("b1", "Kshitij", src_root=tmp / "incoming")
        card = json.loads((tmp / "sets" / "office" / "meeting_room" / "lit_25d.json").read_text(encoding="utf-8"))
        svg = src.read_text(encoding="utf-8")
        import re
        cx = float(re.search(r'id="anchor_seat_near"[^>]*\bcx="([-\d.]+)"', svg).group(1))
        assert card["anchors"]["seat_near"][0] == round(cx - 240, 1) and card["approved_by"] == "Kshitij" and got, card
    finally:
        ST.ROOT, ST.INDEX = keep
        shutil.rmtree(tmp, ignore_errors=True)
    assert not ST.check(), ST.check()
    return "FAIL and no approver refused; PASS added with frame anchors and the approver; the real library checks clean"


def check_sets_add_only_promotes_the_named_scenes_of_a_batch():
    """--only (2026-10-13): a batch whose one set is held at review promotes only the named scenes; a name that matches
    nothing is refused. Control: without --only both enter."""
    src = ROOT / "assets" / "sets" / "office" / "meeting_room" / "lit_25d.svg"
    tmp = Path(tempfile.mkdtemp(prefix="sets_only_"))
    keep = (ST.ROOT, ST.INDEX)
    try:
        inc = tmp / "incoming" / "b2"
        (inc / "sets" / "office").mkdir(parents=True)
        ents = []
        for scene in ("meeting_room", "one_to_one"):
            shutil.copy2(src, inc / "sets" / "office" / f"{scene}__lit_25d.svg")
            ents.append({"file": f"sets/office/{scene}__lit_25d.svg", "kind": "set", "world": "office", "scene": scene, "set_style": "lit_25d"})
        (inc / "manifest.json").write_text(json.dumps({"assets": ents}), encoding="utf-8")
        (inc / "INTAKE.md").write_text("".join(f"- **PASS** `{e['file'][:-4]}` (set)\n" for e in ents), encoding="utf-8")
        ST.ROOT, ST.INDEX = tmp / "sets", tmp / "sets" / "INDEX.md"
        got = ST.add("b2", "Kshitij", src_root=tmp / "incoming", only=["meeting_room"])
        assert got == ["office/meeting_room [lit_25d]"] and not (tmp / "sets" / "office" / "one_to_one").exists(), got
        try:
            ST.add("b2", "Kshitij", src_root=tmp / "incoming", only=["no_such_scene"]); raise AssertionError("a wrong --only was accepted")
        except LoomError as e:
            assert "matched" in str(e), e
        both = ST.add("b2", "Kshitij", src_root=tmp / "incoming")
        assert len(both) == 2, both
    finally:
        ST.ROOT, ST.INDEX = keep
        shutil.rmtree(tmp, ignore_errors=True)
    return "only the named scene promoted, a wrong name refused; control: without --only both enter"


def check_the_more_specific_scene_name_wins_and_a_world_word_inside_a_name_is_not_a_world():
    """2026-10-15: 'market street' names that scene, not the scene called 'street' inside it; 'office exterior' is a
    city scene even though 'office' is a world's name. Control: a world named OUTSIDE the scene's words still refuses
    a scene of another world."""
    tmp = Path(tempfile.mkdtemp(prefix="sets_specific_"))
    keep = ST.WORLDS
    try:
        worlds = {"city": ("City", ["city"], [{"id": "street"}, {"id": "office_exterior", "aliases": ["office entrance"]}]),
                  "history": ("History", ["history"], [{"id": "market_street", "aliases": ["market street"]}]),
                  "office": ("Office", ["office"], [{"id": "meeting_room"}])}
        for wid, (name, al, scenes) in worlds.items():
            (tmp / f"{wid}.json").write_text(json.dumps({"id": wid, "name": name, "aliases": al, "scenes": scenes}), encoding="utf-8")
        ST.WORLDS = tmp
        r = ST.resolve("the market street", "cinematic-dawn")
        assert not r["ok"] and "history/market_street" in r["reason"] and "not in the set library" in r["reason"], r
        r = ST.resolve("the office entrance", "cinematic-dawn")
        assert "city/office_exterior" in r["reason"] and "not in the set library" in r["reason"], r
        r = ST.resolve("a street", "cinematic-dawn")
        assert "city/street" in r["reason"], r
        r = ST.resolve("a street outside the office", "cinematic-dawn")
        assert "names the world" in r["reason"], r                      # control: office named outside the scene name
    finally:
        ST.WORLDS = keep
        shutil.rmtree(tmp, ignore_errors=True)
    return "the longer name wins, a world word inside a name is not a world; control: a world named outside still refuses"


def check_every_scene_name_and_alias_loads_its_own_scene():
    """The delivery, not the items: every scene id and alias across packs/worlds resolves to exactly its own scene
    (465 phrases on 2026-10-15). Control: a zero is red."""
    W, C = ST._worlds(), ST.cards()
    kw, kc = ST._worlds, ST.cards
    ST._worlds, ST.cards = (lambda: W), (lambda: C)
    try:
        n, bad = 0, []
        for wid, w in W.items():
            for s in w.get("scenes") or []:
                for ph in [s["id"].replace("_", " ")] + list(s.get("aliases") or []):
                    n += 1
                    r = ST.resolve(ph, "cinematic-dawn")
                    tgt = f"{wid}/{s['id']}"
                    ok = (r["ok"] and r["id"].startswith(tgt)) or (tgt in (r.get("reason") or "") and
                                                                  ("not in the set library" in r["reason"] or "exists only in" in r["reason"]))
                    if not ok:
                        bad.append((ph, tgt, (r.get("reason") or "")[:80]))
    finally:
        ST._worlds, ST.cards = kw, kc
    assert n > 100, f"only {n} phrases (a zero is red)"
    assert not bad, bad[:6]
    return f"{n} scene names and aliases each load their own scene"


def pipeline_storyboard_gate_names_a_set_that_would_not_load():
    """The storyboard gate reports a scene whose set words are not a perfect match; a good one passes. Control: the
    good scene gives no error."""
    sb = {"scenes": [{"beat": "b01", "set": {"want": "a meeting room"}}, {"beat": "b02", "set": {"want": "meeting"}},
                     {"beat": "b03", "set": "office/meeting_room"}]}
    E = ST.storyboard_errors(sb, "cinematic-dawn")
    assert len(E) == 1 and E[0].startswith("b02:"), E
    return "the near ask refused at the gate; the exact and perfect asks pass"


def _browser() -> str | None:
    return browser()   # the shared check (tests/browser_support.py): env var, else the HyperFrames Chrome (L-127)


def primitive_set_loader_draws_the_set_moves_it_and_carries_slot_content():
    """Loom.place.set draws the library set on the place camera: the lab strip renders with no runtime problem, and
    the frame after the push differs from the first (the camera moved). Control: a scene asking for a set with no id
    and no storyboard set reports set_missing."""
    if not _browser():
        return "skipped (no browser here)"
    from loom import lab as LB
    tmp = Path(tempfile.mkdtemp(prefix="sets_lab_"))
    try:
        r = LB.strip("lab_set_meeting_room", times=[0.6, 5.6], out_dir=tmp, frames_dir=tmp / "f")
        assert not r["errors"], r["errors"][:3]
        fr = sorted((tmp / "f").glob("*.png"))
        assert len(fr) == 2 and fr[0].read_bytes() != fr[1].read_bytes(), fr
        bad = tmp / "bad_set.js"
        bad.write_text('// @lab {"styles": ["cinematic-dawn"], "dur": 2, "times": [1]}\nLoom.scene("bad_set", { build(ctx) { Loom.place.set(ctx, "r"); } });\n', encoding="utf-8")
        r2 = LB.strip("bad_set", file=bad, out_dir=tmp)
        assert any("set_missing" in e for e in r2["errors"]), r2["errors"]
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    return "the set renders and moves with no problem; control: a scene with no set reports set_missing"


def pipeline_compose_carries_the_storyboard_set_into_the_build():
    """A storyboard scene asking for "a meeting room" in a cinematic-dawn lesson gets the set's markup in the build's
    assets and its resolved id on the scene (ctx.def.set_id, what Loom.place.set(ctx, name) reads). Control: a build
    whose scenes ask for no set carries none."""
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from agents_runtime import fresh_project
    from relay_improvements import _copy_demo
    from loom import flow
    from loom.util import read_json, write_json
    import contextlib
    import io
    with fresh_project() as p:
        _copy_demo(p)
        f = p.path("plan/storyboard.json")
        sb = read_json(f)
        sb["style"] = "cinematic-dawn"
        write_json(f, sb)
        with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            flow.run_code(p, "compose", manim_quality="draft", strict=False, mix=False)
        m0 = read_json(p.path("build/manifest.json"))
        assert "sets" not in (m0.get("assets") or {}), "control: a build with no set asked for carries one"
        sb = read_json(f)
        sc = next(s for s in sb["scenes"] if s["kind"] == "bespoke")
        sc["set"] = {"want": "a meeting room"}
        write_json(f, sb)
        with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            flow.run_code(p, "compose", manim_quality="draft", strict=False, mix=False)
        m = read_json(p.path("build/manifest.json"))
        sets = (m.get("assets") or {}).get("sets") or {}
        assert list(sets) == ["office/meeting_room"] and sets["office/meeting_room"]["svg"].startswith("<"), list(sets)
        d = next(s for s in m["scenes"] if s["beat"] == sc["beat"])
        assert d.get("set_id") == "office/meeting_room", d.get("set_id")
    return "the asked set travels in the build with its id on the scene; control: no ask, no set"

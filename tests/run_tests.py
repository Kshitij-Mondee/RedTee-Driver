"""Loom offline test suite: no network, no API key, no browser (browser tests are opt-in: --browser).

Every gate is proven able to FAIL: each test feeds a deliberately broken artifact and asserts the
specific error appears, then feeds the fixed artifact and asserts it passes.
Run:  py tests/run_tests.py            (python3 on Linux/macOS)
"""
from __future__ import annotations

import copy

import numpy as np
import json
import os
import shutil
import subprocess
import sys
import tempfile
import traceback
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "tests"))
from browser_support import SKIP as SKIP_NO_BROWSER, browser  # noqa: E402  (one browser check for every test)
# the Shuttle launcher's WebGL preflight (D-154) launches the render browser; the tests that drive the launcher stub its
# sessions and need no WebGL. check_shuttle_refuses_a_run_without_webgl removes this and proves the refusal
os.environ.setdefault("LOOM_ALLOW_NO_WEBGL", "1")

from loom import cues as C  # noqa: E402
from loom.allocate import allocate  # noqa: E402
from loom.checks import gates  # noqa: E402
from loom.checks.style_lint import lint_all, lint_style  # noqa: E402
from loom.project import Project  # noqa: E402
from loom.util import LoomError, read_json, which, write_json  # noqa: E402

DEMO = ROOT / "projects" / "spacing-sticks"
RESULTS = []


def test(fn):
    RESULTS.append(fn)
    return fn


class TmpProject:
    """A throwaway copy of the demo project's plan (so tests never touch real projects)."""
    def __enter__(self):
        self.dir = Path(tempfile.mkdtemp(prefix="loomtest_"))
        (self.dir / "plan").mkdir()
        for f in ("project.json", "state.json"):
            shutil.copy2(DEMO / f, self.dir / f)
        for f in (DEMO / "plan").glob("*.json"):
            shutil.copy2(f, self.dir / "plan" / f.name)
        (self.dir / "scenes").mkdir()
        for f in (DEMO / "scenes").glob("*"):
            shutil.copy2(f, self.dir / "scenes" / f.name)
        return Project(self.dir)

    def __exit__(self, *a):
        shutil.rmtree(self.dir, ignore_errors=True)


def edit(p, rel, fn):
    d = read_json(p.path(rel)); fn(d); write_json(p.path(rel), d)


def must_fail(errs, needle):
    assert any(needle in e for e in errs), f"expected an error containing {needle!r}, got: {errs[:6]}"


# ------------------------------------------------------------------ gates pass on the demo
@test
def demo_artifacts_pass_every_gate():
    with TmpProject() as p:
        for g in ("brief", "knowledge", "pedagogy", "persona", "script", "storyboard", "scenes"):
            E, _ = gates.GATES[g](p)
            assert not E, f"{g}: {E[:5]}"


# ------------------------------------------------------------------ gates can fail
@test
def brief_gate_rejects_unanchored_fact_and_template_names():
    with TmpProject() as p:
        edit(p, "plan/brief.json", lambda d: d["must_cover"].append({"what": "70 percent is forgotten in a day"}))
        must_fail(gates.check_brief(p)[0], "has no source_anchor")
        edit(p, "plan/brief.json", lambda d: d.__setitem__("visual_direction", "use title.card and hero.meter"))
        must_fail(gates.check_brief(p)[0], "names a template/blueprint")


@test
def knowledge_gate_rejects_unlisted_number_and_uncaveated_contested_claim():
    with TmpProject() as p:
        edit(p, "plan/knowledge.json", lambda d: d["facts"].append({"id": "F99", "statement": "People forget 70 percent within 24 hours.", "kind": "number", "confidence": "contested"}))
        E = gates.check_knowledge(p)[0]
        must_fail(E, "numbers[] does not list it"); must_fail(E, "needs a caveat")


@test
def pedagogy_gate_rejects_bloom_jumps_forbidden_verbs_and_peak_endings():
    with TmpProject() as p:
        def bad(d):
            s = d["arc"]["sections"]
            s[0]["goal"] = "the viewer can understand the forgetting curve"
            s[1]["bloom"] = "evaluate"
            s[-1]["energy"] = "peak"
        edit(p, "plan/teaching_plan.json", bad)
        E = gates.check_pedagogy(p)[0]
        must_fail(E, "forbidden verb"); must_fail(E, "jumps more than one level"); must_fail(E, "endings settle")


@test
def script_gate_rejects_dashes_ungrounded_numbers_long_phrases_and_transcripts():
    with TmpProject() as p:
        def bad(d):
            b = d["beats"][3]
            b["narration"] = ["You have felt this — everyone has.", "Studies show 70 percent is gone in 24 hours, which is a lot to lose so quickly, honestly."]
            b["on_screen"] = ["Studies show 70 percent is gone in 24 hours, which is a lot"]
        edit(p, "plan/script.json", bad)
        E = gates.check_script(p)[0]
        must_fail(E, "em/en dash"); must_fail(E, "the number '70'"); must_fail(E, "split it"); must_fail(E, "screens carry anchors")


@test
def script_gate_rejects_quiz_without_pause():
    with TmpProject() as p:
        edit(p, "plan/script.json", lambda d: [b.__setitem__("pause_after_s", 0) for b in d["beats"] if (b.get("recall") or {}).get("kind") == "quiz"])
        must_fail(gates.check_script(p)[0], "real silent pause")


@test
def storyboard_gate_rejects_bad_kind_props_joins():
    with TmpProject() as p:
        def bad(d):
            d["scenes"][1]["kind"] = "template"; d["scenes"][1]["template"] = "title.card"; d["scenes"][1]["props"] = {"title": "x"}
            d["scenes"][3]["props"]["label"] = "far too many words for this label"
            d["scenes"][5]["join_in"] = {"type": "continue"}
            d["scenes"][6]["station"] = "st_nowhere"
        edit(p, "plan/storyboard.json", bad)
        E = gates.check_storyboard(p)[0]
        must_fail(E, "allocation says 'motion'"); must_fail(E, "max 4"); must_fail(E, "needs the same station"); must_fail(E, "unknown station")


@test
def scenes_gate_rejects_nondeterminism_and_literal_colours():
    with TmpProject() as p:
        f = p.path("scenes/b05.js")
        f.write_text(f.read_text(encoding="utf-8").replace('"accent2"', '"#ff0000"') + "\nconst r = Math.random(); setTimeout(()=>{}, 5);\n", encoding="utf-8")
        E = gates.check_scenes(p)[0]
        must_fail(E, "Math.random"); must_fail(E, "timers"); must_fail(E, "literal hex")


# ------------------------------------------------------------------ cues
@test
def cue_resolution_exact_prefix_and_missing():
    beat = {"phrases": [{"words": [{"w": "Rereading", "s": 1.0, "e": 1.4}, {"w": "feels", "s": 1.4, "e": 1.6}, {"w": "familiar,", "s": 1.6, "e": 2.0}]}]}
    w = C.beat_words(beat)
    assert C.resolve("feels familiar", w) == (1.4, "exact")
    assert C.resolve("reread", w)[1] == "prefix"
    assert C.resolve("spacing", w)[0] is None
    assert set(C.collect_anchors({"say": "a", "x": {"fade_say": "b", "title_cue": "c", "say_title": "d", "note": "e"}}, [])) == {"a", "b", "c", "d"}


# ------------------------------------------------------------------ allocation
@test
def allocation_hits_the_mix_and_breaks_template_runs():
    with TmpProject() as p:
        res = allocate(p)
        a = res["actual"]
        assert 0.03 <= a["avatar"] <= 0.16, a
        assert 0.3 <= a["motion_effective"] <= 0.52, a
        seq = [res["beats"][b["id"]]["treatment"] for b in read_json(p.path("plan/script.json"))["beats"]]
        run = 0
        for t in seq:
            run = run + 1 if t == "template" else 0
            assert run <= 3, seq


@test
def allocation_rhythm_rule_can_fail_without_the_fix():
    with TmpProject() as p:
        edit(p, "plan/script.json", lambda d: [b.update({"treatment_hint": "template", "animate_score": 0.1, "change_over_time": False}) for b in d["beats"]])
        res = allocate(p)
        assert any(v["treatment"] == "hybrid" for v in res["beats"].values()), "a long template run must be broken by a hybrid"


@test
def cinema_mix_is_opt_in_and_the_picture_tells_measure_words_worlds_and_density():
    """D-90/D-91 (CINEMA_PLAN B11, B1, B2, B12): the default mix is unchanged; `mix: "cinema"` gives far less
    template time; an unknown mix name is an error; the ledger counts a beat whose picture is only words, the
    share of beats in one world, and scene lines per second (report only)."""
    from loom.allocate import resolve_mix
    from loom.checks import variety as V
    with TmpProject() as p:
        classic = allocate(p)["actual"]
        edit(p, "project.json", lambda d: d["request"].__setitem__("mix", "cinema"))
        p2 = Project(p.root)
        cinema = allocate(p2)["actual"]
        assert cinema["template"] < classic["template"] - 0.1, (classic, cinema)       # the cinema mix draws more
        assert cinema["motion_effective"] > classic["motion_effective"], (classic, cinema)
    assert resolve_mix(None)["template"] == 0.5                                          # the default stays
    from loom.compose import join_for_meaning                                            # B7: a meaning picks its join
    st = {"inner": {"id": "inner", "parent": "outer"}, "outer": {"id": "outer"}}
    assert [join_for_meaning(m, "x", "y", st) for m in ("into", "time", "era", "meanwhile", "shock")] == ["iris", "wipe", "dip", "fade", "cut"]
    assert join_for_meaning("into", "inner", "outer", st) == "zoom"                       # a portal stays a zoom
    try:
        resolve_mix("cinematic"); raise AssertionError("an unknown mix must fail")
    except LoomError:
        pass
    tmp = Path(tempfile.mkdtemp(prefix="lmt_pic_"))
    try:
        d = tmp / "l"; (d / "plan").mkdir(parents=True); (d / "scenes").mkdir(); (d / "audio").mkdir()
        (d / "project.json").write_text(json.dumps({"created": "2026-01-01"}))
        (d / "plan" / "storyboard.json").write_text(json.dumps({"scenes": [{"beat": b, "kind": "bespoke"} for b in ("b01", "b02", "b03")]}))
        (d / "audio" / "timings.json").write_text(json.dumps({"beats": [{"id": b, "start": i * 10.0, "end": i * 10.0 + 10} for i, b in enumerate(("b01", "b02", "b03"))]}))
        (d / "scenes" / "b01.js").write_text('kit.text(g, "Cortisol", {});\npill(g, "Adrenaline", {});\n')           # words only
        (d / "scenes" / "b02.js").write_text('// a comment\nLoom.obj.draw(ctx, "doc", "document", {});\npill(g, "Form", {});\n')
        (d / "scenes" / "b03.js").write_text('const P = Loom.place.office(ctx, "o", {});\nLoom.cam.push(P, {t0: 1, t1: 2});\n')
        P = V.profile(d); T = V.tells(P)
        assert T["labels_over_objects_share"] == round(1 / 3, 3) and P["culprits"]["labels_over_objects_share"] == ["b01"], (T, P["culprits"])
        assert T["one_world_share"] == round(2 / 3, 3) and P["worlds"]["office"] == 1, (T, P["worlds"])   # 2 on the ground, 1 office
        assert T["lines_per_s"] == round(6 / 30, 2), T                                    # 6 code lines (comment skipped) / 30 s
        assert "lines_per_s" not in "".join(V.judge(P, {"metrics": {"lines_per_s": {"worst": 0.0, "median": 0.0}}})[0])   # never a ratchet
        return f"cinema template {cinema['template']} vs classic {classic['template']}; words-only, one-world and lines/s measured"
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def _no_cairo():
    """The browser-free preview rasterises with cairosvg, which needs the cairo library. Windows has none by
    default (Kshitij's PC, 2026-10-02: 4 FAILs that were an install, not a defect). Name the skip (L-126)."""
    try:
        import cairosvg  # noqa: F401
        return None
    except OSError as e:
        return f"skipped: no cairo library here ({str(e).splitlines()[0]}); install it to run the preview tests"
    except ImportError:
        return "skipped: cairosvg is not installed"


@test
def cinema_house_upgrades_draw_and_report_in_the_preview():
    """D-90/D-91 (CINEMA_PLAN B3, B4, B7, B9, B10): screen joins close and open (the iris is shut at the middle and
    open before it); a map floods Indonesia in the neg colour by its time, from real Natural Earth outlines; data
    pictures, chapters and arrays report what they drew; an unknown country and an unknown join are errors, not gaps."""
    if _no_cairo():
        return _no_cairo()
    import importlib.util
    from PIL import Image
    spec = importlib.util.spec_from_file_location("lab_preview", ROOT / "tools" / "lab_preview.py"); LP = importlib.util.module_from_spec(spec); spec.loader.exec_module(LP)
    geo = read_json(ROOT / "assets/geo/world110m.json")
    assert len(geo["countries"]) == 177 and len(geo["rings"]) == 288 and any(c["iso"] == "IDN" for c in geo["countries"]), "the Natural Earth asset is incomplete"
    def px(png, x, y):
        im = Image.open(png).convert("RGB"); return im.getpixel((x, y))
    j = LP.preview("lab_joins", "glow-flat", times=[0.6, 2.0])
    assert not j["errors"], j["errors"]
    open_, shut = px(j["pngs"][0], 140, 120), px(j["pngs"][1], 140, 120)   # inside the iris quadrant, near its top-left
    assert sum(shut) < 30 and sum(open_) > 30, (open_, shut)                    # shut (black) at the middle, open before
    g = LP.preview("lab_geo", "glow-flat", times=[0.2, 5.6])
    assert not g["errors"], g["errors"]
    neg = tuple(int("FF5A6E"[i:i + 2], 16) for i in (0, 2, 4))
    after = px(g["pngs"][1], 874, 396)                                            # Borneo/Sumatra on the map, in station px
    near = lambda a, b: sum(abs(x - y) for x, y in zip(a, b)) < 90
    assert near(after, neg) and not near(px(g["pngs"][0], 874, 396), neg), (px(g["pngs"][0], 874, 396), after)
    assert any(x["kind"] == "map" and "IDN" in x["flood"] for x in g["geo"]), g["geo"]
    d = LP.preview("lab_data", "glow-flat", times=[4.6])
    assert not d["errors"], d["errors"]
    kinds = {x["builder"] for x in d["data"]}
    assert {"counter", "unitGrid", "barsOn", "dipLine"} <= kinds, kinds
    assert next(x for x in d["data"] if x["builder"] == "counter")["values"]["text"] == "125,000"
    bad = ROOT / "scenes_examples" / "lab" / "lab__tmp_bad.js"
    bad.write_text('// @lab {"title": "t", "styles": ["glow-flat"], "dur": 1.0, "times": [0.5]}\nLoom.scene("lab__tmp_bad", { build(ctx) {\n'
                   '  Loom.geo.map(ctx, "m", { x: 0, y: 0, w: 600, flood: [{ c: "Atlantis", t: 0.1 }] });\n  Loom.world.coverAt("spiral", 0.5, {}, {});\n} });\n')
    try:
        b = LP.preview("lab__tmp_bad", "glow-flat", times=[0.5])
    finally:
        bad.unlink()
    assert any("geo_unknown" in e for e in b["errors"]) and any("join_unknown" in e for e in b["errors"]), b["errors"]
    return f"iris shut {shut} / open {open_}; Indonesia {after} after flooding; data builders {sorted(kinds)}; bad country and join reported"


@test
def rig_import_reproduces_the_delivery_and_maya_poses_in_the_preview():
    """D-93: tools/rig_import.py turns a Claude Design delivery into assets/rigs/<id>.json; its own check re-poses
    every pose with the runtime's maths and must match the delivery's world matrices; a pose that is broken on
    purpose must FAIL the check; the lab preview draws Maya with no runtime error and her face changes with emotion."""
    if _no_cairo():
        return _no_cairo()
    import importlib.util, copy as _copy
    batch = ROOT / "assets/incoming/maya-v5"
    if not (batch / "_page" / "index.html").exists():
        return "skipped: no maya-v5 batch on this machine"
    sp = importlib.util.spec_from_file_location("rig_import", ROOT / "tools" / "rig_import.py"); RI = importlib.util.module_from_spec(sp); sp.loader.exec_module(RI)
    rig, errs = RI.build(batch, "maya", "front")
    assert not errs, errs
    assert {"idle", "explain", "point", "think", "present", "listen"} <= set(rig["poses"]), sorted(rig["poses"])
    assert not RI.check(rig, batch), RI.check(rig, batch)                  # every pose reproduces the delivery
    bad = _copy.deepcopy(rig); bad["poses"]["explain"]["angles"]["upper_arm_r"][0] += 40
    assert any("explain" in e for e in RI.check(bad, batch)), "a broken pose must fail the check"
    sp2 = importlib.util.spec_from_file_location("lab_preview", ROOT / "tools" / "lab_preview.py"); LP = importlib.util.module_from_spec(sp2); sp2.loader.exec_module(LP)
    r = LP.preview("lab_maya", "corporate-clean", times=[0.6, 2.2])
    assert not r["errors"], r["errors"]
    from PIL import Image
    import numpy as np
    a, b = [np.asarray(Image.open(f).convert("L").crop((610, 200, 790, 380)), dtype=float) for f in r["pngs"]]
    assert a.std() > 20 and np.abs(a - b).mean() > 2, (a.std(), np.abs(a - b).mean())   # she is drawn, and her face changed
    return f"{len(rig['poses'])} poses reproduce; a broken pose fails; Maya drawn and her face changes"


# ------------------------------------------------------------------ style packs
@test
def style_packs_pass_contrast_and_the_lint_can_fail():
    assert all(not v for v in lint_all().values()), lint_all()
    bad = read_json(ROOT / "packs/styles/corporate-clean.json")
    bad["palette"]["muted"] = "#E9EEF5"
    must_fail(lint_style(bad), "muted on field")


@test
def scene_gate_rejects_a_non_literal_cue_and_props_gate_rejects_a_dead_prop():
    # compose can only resolve cue anchors it reads as literals (found live: b20 of blameless-postmortem)
    with TmpProject() as p:
        assert not gates.check_scenes(p)[0], gates.check_scenes(p)[0]
        js = next(p.path("scenes").glob("*.js"))
        js.write_text(js.read_text(encoding="utf-8").replace("ctx.cue(\"", "ctx.cue(ANCHOR || \"", 1), encoding="utf-8")
        must_fail(gates.check_scenes(p)[0], "needs a string literal")
    # a prop that the template ignores unless another is set must not pass silently (found live: b22)
    schema = {"why_not": {"type": "str", "requires": "tempting"}, "tempting": {"type": "int"}}
    must_fail(gates._props_errors(schema, {"why_not": "x"}), "is ignored unless")
    assert not gates._props_errors(schema, {"why_not": "x", "tempting": 1})


@test
def component_registry_rejects_content_defaults_and_bad_params():
    # node: load the runtime core + components.js, register good and bad components, use them
    node = which("node")
    js = r"""
const vm = require("vm"), fs = require("fs"), path = require("path");
const rt = process.argv[1];
const stub = () => ({ getContext: () => ({ measureText: () => ({ width: 0 }) }), setAttribute() {}, appendChild() {}, style: {} });
const ctx = { console, Math, JSON, Object, Array, String, Number, Promise, WeakMap, Map, Set };
ctx.window = ctx; ctx.document = { createElement: stub, createElementNS: stub, head: { appendChild() {} }, fonts: { ready: Promise.resolve() } };
vm.createContext(ctx);
for (const f of ["core.js", "style.js", "kit.js", "motion.js", "components.js"]) vm.runInContext(fs.readFileSync(path.join(rt, f), "utf8"), ctx);
const L = ctx.Loom; L.style.pack = { palette: { ink: "#000", accent: "#f00" } };
L.component("bad_default", { idea: "x", outline: ["a"], params: { label: { type: "str", content: true, default: "Build the mental model" } }, build() {} });
L.component("no_outline", { idea: "x", params: {}, build() {} });
L.component("ok_one", { idea: "x", outline: ["a"], params: { label: { type: "str", content: true }, tone: { type: "token", default: "accent" } }, build(c, g, p) { return { p }; } });
L.component("ok_one", { version: 2, idea: "x", outline: ["a"], params: { label: { type: "str", content: true } }, build() { return {}; } });
const fake = { beat: { id: "t" }, el: () => ({ inner: {}, name: "n" }) };
L.useComponent(fake, "ok_one@1", { tone: "nope" });
L.useComponent(fake, "ok_one@1", { label: "fine", colour: "accent" });
const v2 = L.component.resolve("ok_one").version, v1 = L.component.resolve("ok_one@1").version;
console.log(JSON.stringify({ codes: L.report.errors.map((e) => e.code + ":" + e.msg), v2, v1 }));
"""
    r = subprocess.run([node, "-e", js, str(ROOT / "runtime")], capture_output=True, text=True)
    assert r.returncode == 0, r.stderr[-400:]
    out = json.loads(r.stdout.strip().splitlines()[-1])
    codes = " | ".join(out["codes"])
    assert "component_content_default" in codes and "bad_default.label" in codes, codes
    assert "component_incomplete" in codes and "no_outline" in codes, codes
    assert "\"label\" is required" in codes and "not a style token" in codes, codes
    assert "unknown param \"colour\"" in codes, codes
    assert out["v2"] == 2 and out["v1"] == 1, out


@test
def library_counts_forms_and_only_a_strict_assessment_promotes():
    from loom import library as L
    src = "// @form condition_card: an icon card naming one condition\n// @form bad tag here\nctx.use(\"strike_mark\", {})\n"
    tags, uses, bad = L.scene_forms(src)
    assert tags == {"condition_card": "an icon card naming one condition"} and uses == {"strike_mark"} and len(bad) == 1, (tags, uses, bad)
    tmp = Path(tempfile.mkdtemp(prefix="loomlib_"))
    try:
        projs = []
        for i, (pid, forms) in enumerate([("p1", ["condition_card", "room_heads"]), ("p2", ["condition_card"]), ("p3", ["room_heads"])]):
            d = tmp / "projects" / pid
            (d / "scenes").mkdir(parents=True)
            write_json(d / "project.json", {"id": pid, "request": {"style": "whiteboard"}})
            (d / "scenes" / "b01.js").write_text("".join(f"// @form {f}: idea {f}\n" for f in forms), encoding="utf-8")
            (d / "scenes" / "b02.js").write_text("// @form condition_card: another card\n" if pid == "p1" else "", encoding="utf-8")
            projs.append(d)
        old = (L.LIB, L._projects, L._components)
        L.LIB = tmp / "library"; L._projects = lambda: iter(projs); L._components = lambda: {}
        try:
            t = L.harvest()
            F = t["forms"]
            assert F["condition_card"]["count"] == 3 and F["condition_card"]["lessons"] == 2 and F["condition_card"]["status"] == "candidate", F["condition_card"]
            assert F["room_heads"]["count"] == 2 and F["room_heads"]["status"] == "counting", F["room_heads"]
            # the count opens the door; the assessment decides. A medium-confidence promote is refused:
            a = {"form": "condition_card", "decision": "promote", "confidence": "medium", "topic_independent": True, "idea": "i", "outline": ["a"],
                 "variation_seen": ["labels"], "future_uses": [{"topic": "onboarding", "shows": "x"}, {"topic": "security", "shows": "y"}],
                 "params_sketch": {"content": ["label"]}, "reason": "r"}
            write_json(L.LIB / "assessments/condition_card.json", a)
            E = L.check_assessment("condition_card")
            must_fail(E, "confidence high"); must_fail(E, ">= 3 future_uses")
            a.update(confidence="high", future_uses=a["future_uses"] + [{"topic": "sales", "shows": "z"}])
            write_json(L.LIB / "assessments/condition_card.json", a)
            assert not L.check_assessment("condition_card"), L.check_assessment("condition_card")
            # a reject is sticky until its revisit threshold
            write_json(L.LIB / "decisions.json", {"condition_card": {"decision": "reject", "confidence": "high", "revisit_when": {"uses": 5}}})
            assert L.harvest()["forms"]["condition_card"]["status"] == "rejected"
            write_json(L.LIB / "decisions.json", {"condition_card": {"decision": "reject", "confidence": "high", "revisit_when": {"uses": 3}}})
            assert L.harvest()["forms"]["condition_card"]["status"] == "candidate"
            write_json(L.LIB / "decisions.json", {"condition_card": {"decision": "promote", "confidence": "high"}})
            assert L.harvest()["forms"]["condition_card"]["status"] == "approved"
            tasks = L.write_tasks()
            assert any(p.name == "promote-condition_card.md" for p in tasks), tasks
        finally:
            L.LIB, L._projects, L._components = old
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


@test
def scenes_gate_rejects_unknown_components_and_malformed_form_tags():
    with TmpProject() as p:
        js = next(p.path("scenes").glob("*.js"))
        s = js.read_text(encoding="utf-8")
        js.write_text(s + "\n// @form Bad Tag\nctx.use(\"no_such_component\", {});\n// ctx.use(\"commented_out_use\", {})\n", encoding="utf-8")
        E = gates.check_scenes(p)[0]
        must_fail(E, "malformed form tag")
        must_fail(E, "no such component")
        assert not any("commented_out_use" in e for e in E), E


@test
def check_flags_leftover_sample_text_that_no_prop_supplied():
    # The RedTee defect: a template printing a hard-coded sample string onto a real slide. The detector reads
    # what the runtime DREW (report texts), not the code, so it cannot be fooled by where the string lives.
    from loom.checks.text_audit import audit
    cat = read_json(ROOT / "runtime/catalog.json")
    sb = {"scenes": [{"beat": "b01", "kind": "template", "template": "quiz.answer",
                      "props": {"question": "Which step failed?", "options": [{"text": "Deploy"}, {"text": "Test"}], "answer": 1,
                                "explanation": "The test never ran.", "tempting": 0, "why_not": "It shipped fine."}}]}
    drawn = [{"beat": "b01", "text": "Which step failed?"}, {"beat": "b01", "text": "Why not A? It shipped fine."}]
    assert not audit(drawn, sb, cat), audit(drawn, sb, cat)                           # props + declared chrome ("Why not")
    leaked = drawn + [{"beat": "b01", "text": "Build the mental model"}]              # a leftover sample string
    lk = audit(leaked, sb, cat)
    assert len(lk) == 1 and lk[0]["words"] == ["build", "mental", "model"], lk
    # a CONTENT default leaks too: only defaults declared chrome:true are allowed
    cat2 = json.loads(json.dumps(cat)); cat2["templates"]["quiz.answer"]["props"]["explanation"]["default"] = "Spacing beats cramming"
    assert audit([{"beat": "b01", "text": "Spacing beats cramming"}], sb, cat2), "content default passed the audit"
    # bespoke scenes are out of scope (their words are authored per lesson)
    assert not audit([{"beat": "b02", "text": "Anything at all"}], {"scenes": [{"beat": "b02", "kind": "bespoke"}]}, cat)


@test
def design_promotion_needs_two_distinct_uses_a_strict_assessment_and_a_blind_pick():
    from loom import library as L
    tmp = Path(tempfile.mkdtemp(prefix="loomdes_"))
    try:
        projs = []
        for pid, body in [("p1", ['// @design cause_convergence: several conditions converge on one failure\nconst a = "no checkout test", b = "staging setting differs";',
                                  '// @design cause_convergence: again\nconst a = "no checkout test", b = "staging setting differs";',
                                  '// @design cause_convergence_continued: the same picture, next step\nconst c = "a new label here";']),
                          ("p2", ['// @design cause_convergence: causes meet\nconst a = "no badge access", b = "manager on leave";'])]:
            d = tmp / "projects" / pid; (d / "scenes").mkdir(parents=True)
            write_json(d / "project.json", {"id": pid, "request": {"style": "whiteboard"}})
            for i, src in enumerate(body):
                (d / "scenes" / f"b0{i + 1}.js").write_text(src, encoding="utf-8")
            projs.append(d)
        old = (L.LIB, L._projects, L._components, L.design_template)
        L.LIB = tmp / "library"; L._projects = lambda: iter(projs); L._components = lambda: {}
        L.design_template = lambda did: (None, None, None)
        try:
            D = L.harvest()["designs"]["cause_convergence"]
            # p1/b02 re-draws p1/b01's content and p1/b03 only continues it: 3 raw tags, 2 distinct uses
            assert D["raw_count"] == 3 and D["count"] == 2 and D["status"] == "candidate", D
            a = {"form": "design:cause_convergence", "decision": "promote", "confidence": "high", "topic_independent": True,
                 "idea": "i", "outline": ["effect", "causes", "arrows"], "variation_seen": ["labels"],
                 "future_uses": [{"topic": t, "shows": "x"} for t in ("security", "onboarding", "sales")],
                 "params_sketch": {"content": ["effect"]}, "reason": "r", "jobs": ["relate"], "content_shape": "3-5 causes, one effect"}
            write_json(L.LIB / "assessments/design-cause_convergence.json", a)
            E = L.check_design_assessment("cause_convergence")
            must_fail(E, "closest_existing"); must_fail(E, "selection_test needs 3 targets and 2 decoys")
            nar = "Three separate things went wrong at once, and each one alone would have been caught, but together they let the failure through."
            a["closest_existing"] = {"id": "process.flow", "falls_short": "a flow is a sequence, not a convergence"}
            a["selection_test"] = {"targets": [{"id": f"t{i}", "job": "relate", "narration": nar, "visual_intent": "v"} for i in range(3)],
                                   "decoys": [{"id": f"d{i}", "job": "sequence", "narration": nar, "visual_intent": "v"} for i in range(2)]}
            write_json(L.LIB / "assessments/design-cause_convergence.json", a)
            assert not L.check_design_assessment("cause_convergence"), L.check_design_assessment("cause_convergence")
            # the blind pick: >= 2 of 3 targets and no decoy
            L.design_template = lambda did: ("template", "diagram.converge", {"props": {"effect": {"type": "str", "required": True}}})
            write_json(L.LIB / "selection/cause_convergence.key.json", {"key": {"s1": "t0", "s2": "d0", "s3": "t1", "s4": "t2", "s5": "d1"}})
            pick = lambda beats: {"scenes": [{"beat": b, "kind": "template", "template": "diagram.converge", "props": {"effect": "Orders stopped"}} for b in beats]}
            write_json(L.LIB / "selection/cause_convergence.json", pick(["s1"]))
            must_fail(L.check_selection("cause_convergence", sheet=False), "for 1 of 3 target beats")
            write_json(L.LIB / "selection/cause_convergence.json", pick(["s1", "s3", "s2"]))
            must_fail(L.check_selection("cause_convergence", sheet=False), "decoy beat")
            write_json(L.LIB / "selection/cause_convergence.json", pick(["s1", "s3"]))
            assert not L.check_selection("cause_convergence", sheet=False), L.check_selection("cause_convergence", sheet=False)
            # a text default that is not declared chrome is refused at promotion
            assert L._str_defaults({"title": {"type": "str", "default": "Build the mental model"}, "k": {"type": "str", "default": "Your turn", "chrome": True}}) == ["title"]
        finally:
            L.LIB, L._projects, L._components, L.design_template = old
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


@test
def library_accept_lock_is_exclusive_and_breaks_stale_locks():
    from loom import library as L
    tmp = Path(tempfile.mkdtemp(prefix="loomlock_"))
    old = L.LIB; L.LIB = tmp
    try:
        (tmp / ".decisions.lock").write_text("999 0")
        try:
            with L._locked(timeout=0.4):
                raise AssertionError("entered a held lock")
        except LoomError:
            pass
        os.utime(tmp / ".decisions.lock", (1, 1))            # abandoned by a killed process
        with L._locked(timeout=0.4):
            with L._locked(timeout=0.4):                     # re-entrant within one process
                assert (tmp / ".decisions.lock").exists()
        assert not (tmp / ".decisions.lock").exists()
    finally:
        L.LIB = old; shutil.rmtree(tmp, ignore_errors=True)


@test
def draw_accepts_a_whole_arrow_and_lands_its_head():
    node = which("node")
    js = r"""
const vm = require("vm"), fs = require("fs"), path = require("path"); const rt = process.argv[1];
const ctx = { console, Math, JSON, Object, Array, String, Number, Promise, WeakMap, Map, Set };
ctx.window = ctx; const stub = () => ({ getContext: () => ({ measureText: () => ({ width: 0 }) }), setAttribute() {}, appendChild() {}, style: {} });
ctx.document = { createElement: stub, createElementNS: stub, head: { appendChild() {} }, fonts: { ready: Promise.resolve() } };
vm.createContext(ctx);
for (const f of ["core.js", "style.js", "kit.js", "motion.js"]) vm.runInContext(fs.readFileSync(path.join(rt, f), "utf8"), ctx);
const L = ctx.Loom, calls = [];
L.style.pack = { motion: { draw: 0.9, move: 0.36 }, palette: {} }; L.style.intensity = 1;
L.tween = (target, from, to, t) => calls.push({ target: target.id, t, dur: to.duration, ease: to.ease });
const mk = (id) => ({ id, tagName: "path", getTotalLength: () => 100, setAttribute() {}, querySelectorAll: () => [] });
const arrow = { g: mk("g"), path: mk("shaft"), head: mk("head") };
L.motion.draw(arrow, 2.0, { dur: 0.5 });
console.log(JSON.stringify(calls));
"""
    r = subprocess.run([node, "-e", js, str(ROOT / "runtime")], capture_output=True, text=True)
    assert r.returncode == 0, r.stderr[-400:]
    calls = json.loads(r.stdout.strip().splitlines()[-1])
    head = [c for c in calls if c["target"] == "head"]
    assert any(c["target"] == "shaft" for c in calls), calls
    # identical to the hand-written version it replaces in the flow template: at t + 0.45, 0.12 s, default ease
    assert len(head) == 1 and abs(head[0]["t"] - 2.45) < 1e-9 and head[0]["dur"] == 0.12 and head[0].get("ease") is None, head


@test
def context_layer_agrees_with_the_code():
    # docs drift silently (the README said "15 offline tests" when there were 23): the context check turns it red
    r = subprocess.run([sys.executable, str(ROOT / "tools/context_check.py")], capture_output=True, text=True)
    assert r.returncode == 0, r.stdout[-1500:] + r.stderr[-500:]


@test
def text_fit_uses_real_font_metrics_and_tracking():
    # kit.fit/kit.text measure with the face's own metrics: tracking widens lines (it was ignored: L-48) and a tall
    # face's ascent+descent grows the block (it was assumed 0.8 x size: L-49)
    node = which("node")
    js = r"""
const vm = require("vm"), fs = require("fs"), path = require("path"); const rt = process.argv[1];
const ctx2 = { font: "", measureText(s) { return { width: 10 * s.length, fontBoundingBoxAscent: 1.05 * parseFloat(this.font.split(" ")[1]), fontBoundingBoxDescent: 0.35 * parseFloat(this.font.split(" ")[1]) }; } };
const ctx = { console, Math, JSON, Object, Array, String, Number, Promise, WeakMap, Map, Set };
ctx.window = ctx; const stub = () => ({ getContext: () => ctx2, setAttribute() {}, appendChild() {}, style: {} });
ctx.document = { createElement: stub, createElementNS: stub, head: { appendChild() {} }, fonts: { ready: Promise.resolve() } };
vm.createContext(ctx);
for (const f of ["core.js", "style.js", "kit.js"]) vm.runInContext(fs.readFileSync(path.join(rt, f), "utf8"), ctx);
const K = ctx.Loom.kit; ctx.Loom.style.pack = { type: { body: [30, 40], label: [24, 28] }, fonts: { body: { family: "X", weights: [400] } }, palette: {}, shape: {} };
const a = K.fit("ABCDEFGHIJ", { role: "label", w: 1000, maxLines: 1 });
const b = K.fit("ABCDEFGHIJ", { role: "label", w: 1000, maxLines: 1, tracking: "0.2em" });
const c = K.fit("one two three", { role: "body", w: 1000, maxLines: 1 });
const d = K.fit("one two three four five six seven", { role: "body", w: 120, h: 60, maxLines: 3 });
console.log(JSON.stringify({ a: a.width, b: b.width, bsize: b.size, c: c.height, csize: c.size, dfit: d.fitted }));
"""
    r = subprocess.run([node, "-e", js, str(ROOT / "runtime")], capture_output=True, text=True)
    assert r.returncode == 0, r.stderr[-400:]
    o = json.loads(r.stdout.strip().splitlines()[-1])
    assert o["a"] == 100 and abs(o["b"] - (100 + 0.2 * o["bsize"] * 10)) < 1e-6, o      # tracking counted per character
    assert abs(o["c"] - 1.4 * o["csize"]) < 1e-6, o                                      # ascent+descent (1.4) > line box (1.36)
    assert o["dfit"] is False, o                                                         # too much text for the box is reported, not squeezed


@test
def line_art_draws_outlines_and_packs_can_map_roles_to_faces():
    # line grammar: a coloured fill becomes the OUTLINE colour and the inside is the field; text on it is ink.
    # fonts.roles: engineering sets labels in the mono face.
    node = which("node")
    js = r"""
const vm = require("vm"), fs = require("fs"), path = require("path"); const rt = process.argv[1];
const made = [];
const mk = (tag) => { const e = { tagName: tag, attrs: {}, children: [], classList: { contains: () => false }, setAttribute(k, v) { this.attrs[k] = v; }, appendChild(c) { this.children.push(c); } }; made.push(e); return e; };
const ctx = { console, Math, JSON, Object, Array, String, Number, Promise, WeakMap, Map, Set };
ctx.window = ctx;
ctx.document = { createElement: () => ({ getContext: () => ({ measureText: () => ({ width: 0 }) }), style: {} }), createElementNS: (ns, tag) => mk(tag), head: { appendChild() {} }, fonts: { ready: Promise.resolve() } };
vm.createContext(ctx);
for (const f of ["core.js", "style.js", "kit.js"]) vm.runInContext(fs.readFileSync(path.join(rt, f), "utf8"), ctx);
const L = ctx.Loom; const pack = JSON.parse(fs.readFileSync(path.join(rt, "..", "packs/styles/line-art.json"), "utf8"));
L.style.pack = pack;
const g = mk("g"); L.kit.rect(g, 0, 0, 100, 50, { fill: "accent" });
const rect = made.find((e) => e.tagName === "rect");
const eng = JSON.parse(fs.readFileSync(path.join(rt, "..", "packs/styles/engineering.json"), "utf8"));
L.style.pack = eng;
console.log(JSON.stringify({ fill: rect.attrs.fill, stroke: rect.attrs.stroke, field: pack.palette.field, accent: pack.palette.accent,
  onAccentInLine: (L.style.pack = pack, L.style.on("accent")), ink: pack.palette.ink,
  engLabel: (L.style.pack = eng, L.style.font("label").family), engBody: L.style.font("body").family }));
"""
    r = subprocess.run([node, "-e", js, str(ROOT / "runtime")], capture_output=True, text=True)
    assert r.returncode == 0, r.stderr[-500:]
    o = json.loads(r.stdout.strip().splitlines()[-1])
    assert o["fill"] == o["field"] and o["stroke"] == o["accent"], o          # colour moved from fill to line
    assert o["onAccentInLine"] == o["ink"], o                                # text on an outlined shape is ink
    assert o["engLabel"] == "JetBrains Mono" and o["engBody"] == "Inter", o


@test
def brand_layers_on_any_style_and_its_suggested_fixes_really_fix():
    from loom import brand as B
    from loom.checks.style_lint import lint_style
    tmp = Path(tempfile.mkdtemp(prefix="loombrand_"))
    old = B.BRANDS; B.BRANDS = tmp
    try:
        b = B.blank("test-co", "Test Co")
        b["colors"].update(primary="#FFEE00", secondary="#0B6E6E")
        b["fonts"]["display"] = {"family": "Nunito", "weight": 800}
        B.save_brand(b)
        st = read_json(ROOT / "packs/styles/corporate-clean.json")
        m = B.apply_brand(st, b)
        assert m["palette"]["accent"] == "#FFEE00" and m["palette"]["accent2"] == "#0B6E6E", m["palette"]
        assert m["palette"]["ink"] == st["palette"]["ink"], "a role left null must keep the style's colour"
        assert m["fonts"]["display"]["family"] == "Nunito" and any(f["family"] == "Nunito" for f in m["fonts"]["faces"])
        assert m["shape"] == st["shape"], "the brand must never change the style's grammar"
        # a pale yellow primary fails on a light style; the suggested shade must actually pass
        issues = B.lint_matrix(b)["corporate-clean"]["issues"]
        fx = next(i["fix"] for i in issues if i["fix"] and i["fix"]["role"] == "primary")
        b2 = json.loads(json.dumps(b)); b2["colors"]["primary"] = fx["to"]
        assert not [e for e in lint_style(B.apply_brand(st, b2)) if e.startswith("accent on")], lint_style(B.apply_brand(st, b2))
        # validation: bad hex, a logo taller than the band above the content
        bad = json.loads(json.dumps(b)); bad["colors"]["text"] = "red"
        must_fail(B.validate(bad), "must be #RRGGBB")
        (tmp / "test-co" / "logo.svg").write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 80"></svg>')
        tall = json.loads(json.dumps(b)); tall["logo"] = {"file": "logo.svg", "placement": "top-right", "height": 90, "show": "always"}
        must_fail(B.validate(tall), "must stay outside the content area")
        tall["logo"]["height"] = 48
        assert not B.validate(tall), B.validate(tall)
        assert abs(B.logo_payload(tall)["aspect"] - 3.75) < 1e-6
        # a locked brand refuses changes to its locked fields
        b["locks"] = {"locked": True, "by": "t", "at": "now", "fields": ["colors"]}
        B.save_brand(b, force_locked=True)
        b3 = json.loads(json.dumps(b)); b3["colors"]["primary"] = "#123456"
        try:
            B.save_brand(b3); raise AssertionError("locked brand accepted a colour change")
        except LoomError as e:
            assert "locked" in str(e)
    finally:
        B.BRANDS = old; shutil.rmtree(tmp, ignore_errors=True)


@test
def studio_api_serves_brands_and_refuses_paths_outside_the_engine():
    import threading, urllib.request, urllib.error
    from http.server import ThreadingHTTPServer
    from loom import brand as B
    from loom.studio.server import Handler
    tmp = Path(tempfile.mkdtemp(prefix="loomstudio_"))
    old = B.BRANDS; B.BRANDS = tmp
    httpd = ThreadingHTTPServer(("127.0.0.1", 0), Handler); port = httpd.server_address[1]
    threading.Thread(target=httpd.serve_forever, daemon=True).start()

    def call(m, u, body=None):
        req = urllib.request.Request(f"http://127.0.0.1:{port}{u}", method=m, data=json.dumps(body).encode() if body is not None else None,
                                     headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req) as r:
                raw = r.read(); return r.status, (json.loads(raw) if r.headers.get("Content-Type", "").startswith("application/json") else raw)
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read())
    try:
        assert call("GET", "/")[0] == 200
        assert len(call("GET", "/api/styles")[1]) >= 7
        assert call("POST", "/api/brands", {"id": "demo-co", "name": "Demo Co"})[0] == 200
        s, r = call("GET", "/api/brands/demo-co"); assert s == 200 and set(r["lint"]) >= {"engineering", "line-art"}, r
        b = r["brand"]; b["colors"]["primary"] = "#0B6E6E"
        assert call("PUT", "/api/brands/demo-co", b)[0] == 200
        assert call("POST", "/api/brands/demo-co/lock", {"by": "t"})[0] == 200
        b["colors"]["primary"] = "#FF0000"; b["locks"] = call("GET", "/api/brands/demo-co")[1]["brand"]["locks"]
        s, r = call("PUT", "/api/brands/demo-co", b); assert s == 400 and "locked" in r["error"], r
        assert call("GET", "/files?path=../../../etc/passwd")[0] == 404
        assert call("POST", "/api/brands/demo-co/upload", {"kind": "logo", "filename": "x.exe", "data": ""})[0] == 400
    finally:
        httpd.shutdown(); B.BRANDS = old; shutil.rmtree(tmp, ignore_errors=True)


# ------------------------------------------------------------------ runtime code
@test
def runtime_js_parses_and_catalog_is_complete():
    node = which("node")
    assert node, "node is required"
    for f in list((ROOT / "runtime").rglob("*.js")) + list((ROOT / "scenes_examples").glob("*.js")):
        r = subprocess.run([node, "--check", str(f)], capture_output=True, text=True)
        assert r.returncode == 0, f"{f.name}: {r.stderr[-300:]}"
    subprocess.run([node, str(ROOT / "tools/node/catalog.mjs")], check=True, capture_output=True)
    cat = read_json(ROOT / "runtime/catalog.json")
    src = "".join(p.read_text(encoding="utf-8") for p in (ROOT / "runtime").rglob("*.js"))
    declared = src.count("Loom.template(\"") + src.count("Loom.blueprint(\"")
    listed = len(cat["templates"]) + len(cat["blueprints"])
    assert listed == declared and listed >= 20, f"catalog lists {listed} of {declared} declared (delivery check)"


@test
def compose_is_deterministic():
    if not (DEMO / "audio/timings.json").exists():
        return "skipped (demo has no narration)"
    from loom.compose import compose
    p = Project(DEMO)
    compose(p)
    a = (DEMO / "build/index.html").read_bytes()
    compose(p)
    b = (DEMO / "build/index.html").read_bytes()
    assert a == b, "two composes of the same inputs must be byte-identical"


@test
def api_mode_round_trip_against_a_mock_server():
    """API mode end to end against a local mock of the Messages API: request shape (cached system,
    model id, inputs inlined), reply parsing, the accept gate, and one repair round."""
    import http.server, threading
    good = read_json(DEMO / "plan/brief.json")
    bad = dict(good); bad = {k: v for k, v in good.items() if k != "outcome"}
    calls = []
    class H(http.server.BaseHTTPRequestHandler):
        def log_message(self, *a): pass
        def do_POST(self):
            body = json.loads(self.rfile.read(int(self.headers["content-length"])))
            calls.append(body)
            art = bad if len(calls) == 1 else good
            txt = "Here is the brief.\n```json\n" + json.dumps(art) + "\n```"
            out = json.dumps({"content": [{"type": "text", "text": txt}], "usage": {"input_tokens": 10, "output_tokens": 20}}).encode()
            self.send_response(200); self.send_header("content-type", "application/json"); self.end_headers(); self.wfile.write(out)
    srv = http.server.HTTPServer(("127.0.0.1", 0), H)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    os.environ["LOOM_ANTHROPIC_URL"] = f"http://127.0.0.1:{srv.server_port}/v1/messages"
    os.environ.setdefault("ANTHROPIC_API_KEY", "test-key-not-real")
    import importlib
    from loom.agent import api
    importlib.reload(api)
    from loom import flow
    with TmpProject() as p:
        (p.path("plan/brief.json")).unlink()
        api.run_stage(p, "brief", lambda: flow.accept(p, "brief")[0])
        assert read_json(p.path("plan/brief.json"))["outcome"] == good["outcome"]
    srv.shutdown()
    assert len(calls) == 2, f"expected one repair round, saw {len(calls)} calls"
    first = calls[0]
    assert first["model"].startswith("claude-opus"), first["model"]
    assert first["system"][0]["cache_control"]["type"] == "ephemeral"
    assert "lnd-creative-director" in first["system"][0]["text"]
    assert "failed these gates" in json.dumps(calls[1]["messages"][-1])


# ------------------------------------------------------------------ Manim clip store (D-37..D-40)
class _FakeManim:
    """Stands in for ManimCE: 'draws' a clip whose bytes name the colours it used, and records reads the way
    loom_manim does (every C.<token> the scene source mentions). Counts calls, so reuse is measurable."""
    def __init__(self, delay=0.0):
        import threading
        self.calls = []; self.delay = delay; self._lock = threading.Lock()

    def __call__(self, job, quality, work):
        import re as _re
        import time as _t
        toks = sorted(set(_re.findall(r"\bC\.([a-z0-9_]+)", job["src"].read_text(encoding="utf-8"))))
        reads = {"palette": {k: job["look"]["palette"].get(k) for k in toks}, "fonts": {}, "raw": False}
        if self.delay:
            _t.sleep(self.delay)
        clip = Path(work) / "clip.webm"
        clip.write_text(json.dumps({"q": quality, "beat": job["beat"], "colours": reads["palette"]}))
        with self._lock:
            self.calls.append((job["beat"], quality))
        return clip, reads


class ManimSandbox:
    """A temp project (demo plan + timings) and a temp clip store, with the fake renderer patched in."""
    def __init__(self, delay=0.0):
        self.delay = delay

    def __enter__(self):
        from loom import manim_bridge as M
        self.M = M
        self.tp = TmpProject(); self.p = self.tp.__enter__()
        (self.p.root / "audio").mkdir(exist_ok=True)
        shutil.copy2(DEMO / "audio/timings.json", self.p.path("audio/timings.json"))
        self.cache = Path(tempfile.mkdtemp(prefix="loomcache_"))
        self.old_env = os.environ.get("LOOM_CACHE_DIR"); os.environ["LOOM_CACHE_DIR"] = str(self.cache)
        self.fake = _FakeManim(self.delay); self.real = M._invoke_manim; M._invoke_manim = self.fake
        return self

    def style(self, **tokens):
        from loom.compose import load_style
        st = load_style(read_json(self.p.path("plan/storyboard.json")).get("style"))
        st["palette"].update(tokens)
        return st

    def scene(self, beat, project=None):
        p = project or self.p
        s = next(x for x in read_json(p.path("plan/storyboard.json"))["scenes"] if x["beat"] == beat)
        b = next(x for x in read_json(p.path("audio/timings.json"))["beats"] if x["id"] == beat)
        return s, b

    def render(self, beat, style, quality="final", project=None):
        s, b = self.scene(beat, project)
        return self.M.render_one(project or self.p, s, b, style, quality=quality)

    def __exit__(self, *a):
        self.M._invoke_manim = self.real
        if self.old_env is None:
            os.environ.pop("LOOM_CACHE_DIR", None)
        else:
            os.environ["LOOM_CACHE_DIR"] = self.old_env
        shutil.rmtree(self.cache, ignore_errors=True)
        self.tp.__exit__(*a)


@test
def manim_clips_are_reused_when_the_colours_a_scene_reads_are_unchanged():
    import re as _re
    with ManimSandbox() as S:
        used = sorted(set(_re.findall(r"\bC\.([a-z0-9_]+)", S.p.path("scenes/b14.py").read_text(encoding="utf-8"))))
        assert used and "accent3" not in used, f"test premise: b14 uses some tokens and not accent3: {used}"
        base = S.style()
        r = S.render("b14", base); assert r["how"] == "rendered" and len(S.fake.calls) == 1, r
        r = S.render("b14", base); assert r["how"] == "store" and len(S.fake.calls) == 1, "the same look must be reused"
        r = S.render("b14", S.style(accent3="#123456"))
        assert r["how"] == "store" and len(S.fake.calls) == 1, "a colour the scene never reads must not cost a render"
        r = S.render("b14", S.style(accent="#0B6E6E"))
        assert r["how"] == "rendered" and len(S.fake.calls) == 2, "a colour the scene reads must re-render"
        assert "#0B6E6E" in S.p.path("media/b14.webm").read_text(), "media must hold the clip for the NEW look"
        r = S.render("b14", base); assert r["how"] == "store" and len(S.fake.calls) == 2, "going back to a look is free"
        assert "#0B6E6E" not in S.p.path("media/b14.webm").read_text(), "media must switch back to the earlier clip"
        # the store is shared: another lesson with the same scene and timing reuses it
        with TmpProject() as q:
            (q.root / "audio").mkdir(exist_ok=True); shutil.copy2(DEMO / "audio/timings.json", q.path("audio/timings.json"))
            r = S.render("b14", base, project=q)
            assert r["how"] == "store" and len(S.fake.calls) == 2, "the store must be shared between lessons"
        # a scene that reached into ctx.raw depends on everything: only an identical context matches
        s, b = S.scene("b14")
        job = S.M._prepare(S.p, s, b, base)
        e = S.M.lookup(job, "final"); assert e and not e["reads"].get("raw")
        raw_entry = dict(e, reads={"palette": {}, "fonts": {}, "raw": True}, full="not-this-context")
        assert not S.M._matches(raw_entry, job) and S.M._matches(dict(raw_entry, full=job["full"]), job)
        # a changed timing is a different clip, never a reuse
        def longer(d):
            bt = next(x for x in d["beats"] if x["id"] == "b14"); bt["end"] = bt["end"] + 1
        edit(S.p, "audio/timings.json", longer)
        r = S.render("b14", base); assert r["how"] == "rendered" and len(S.fake.calls) == 3, "a new timing must re-render"
    return "3 renders for 7 requests"


@test
def manim_drafts_are_for_previews_only_and_never_reach_a_render():
    from loom import flow
    import loom.render as _R
    with ManimSandbox() as S:
        base = S.style()
        r = S.render("b14", base, quality="draft"); assert r["quality"] == "draft" and S.fake.calls[-1] == ("b14", "draft")
        assert S.M.has_draft(S.p) and read_json(S.p.path("media/b14.json"))["quality"] == "draft"
        r = S.render("b14", base, quality="final"); assert r["how"] == "rendered" and r["quality"] == "final", r
        assert not S.M.has_draft(S.p)
        # a draft request is served by the final clip when one exists (better, and free)
        n = len(S.fake.calls); r = S.render("b14", base, quality="draft")
        assert r["how"] == "store" and r["quality"] == "final" and len(S.fake.calls) == n, r
        # render refuses a build that still holds a draft
        (S.p.root / "build").mkdir(exist_ok=True)
        S.p.path("build/index.html").write_text("<html></html>")
        write_json(S.p.path("build/manifest.json"), {"draft_media": ["b14"]})
        try:
            _R.render(S.p)
            raise AssertionError("render accepted a build with a draft Manim clip")
        except LoomError as e:
            assert "draft" in str(e), e
        # the render stage re-makes drafts at full quality (compose) before it renders
        meta = S.p.path("media/b14.json")
        meta.write_text(json.dumps(dict(read_json(meta), quality="draft")))
        seen = []
        real_run, real_render = flow.run_code, _R.render

        def spy(project, name, **kw):
            if name == "compose":
                seen.append("compose"); meta.write_text(json.dumps(dict(read_json(meta), quality="final")))
                return None
            return real_run(project, name, **kw)
        import loom.qa as _Q
        real_sync = _Q.sync_sfx
        try:
            flow.run_code = spy
            _R.render = lambda project, **kw: seen.append("render")
            _Q.sync_sfx = lambda project, probe_rep=None: seen.append("sfx")
            # L-168: a render needs a passing check; without one it refuses, and --force goes on (and says so)
            S.p.set_stage("check", status="rejected", errors=["planted"])
            try:
                real_run(S.p, "render"); refused = False
            except LoomError:
                refused = True
            assert refused and seen == [], ("render ran past a failed check", seen)
            # a forced render says why and renders the build its check saw (D-124; its own test is in checks_film_defects)
            from loom.qa import build_hash
            write_json(S.p.path("qa/report.json"), {"errors": ["planted"], "build_hash": build_hash(S.p.path("build"))})
            real_run(S.p, "render", force=True, reason="test: the draft path is under test, not the check")
        finally:
            flow.run_code, _R.render, _Q.sync_sfx = real_run, real_render, real_sync
        assert seen == ["compose", "sfx", "render"], seen


@test
def manim_scenes_render_in_parallel_with_the_same_result():
    import time as _t
    with ManimSandbox(delay=0.4) as S:
        n = len([s for s in read_json(S.p.path("plan/storyboard.json"))["scenes"] if s["kind"] == "manim"])
        t0 = _t.time(); rs = S.M.render_all(S.p, jobs=2); par = _t.time() - t0
        assert n >= 2 and len(rs) == n and all(r["how"] == "rendered" for r in rs), rs
        clips = {r["beat"]: S.p.path(f"media/{r['beat']}.webm").read_text() for r in rs}
        shutil.rmtree(S.cache); S.cache.mkdir()
        for f in S.p.path("media").glob("*"):
            f.unlink()
        t0 = _t.time(); S.M.render_all(S.p, jobs=1); ser = _t.time() - t0
        assert clips == {b: S.p.path(f"media/{b}.webm").read_text() for b in clips}, "parallel and serial must give the same clips"
        assert par < ser * 0.8, f"parallel {par:.2f}s is not faster than serial {ser:.2f}s"
    return f"{n} scenes: parallel {par:.1f}s, serial {ser:.1f}s"


@test
def manim_colour_check_refuses_fixed_colours_and_passes_every_shipped_scene():
    from loom.checks.manim_colours import check_file, check_source
    bad = (
        "from loom_manim import *\n"
        "class Main(LoomScene):\n"
        "    def construct(self):\n"
        "        a = Dot(color=WHITE)\n"
        "        b = Square(fill_color='#FF0000')\n"
        "        c = Circle(stroke_color='red')\n"
        "        d = ManimColor('#00ff00')\n"
        "        e = Line(color=BLUE_E)\n"
        "        f = Dot(color=ManimColor.from_rgb((1, 0, 0)))\n")
    E = check_source(bad)
    for needle in ("WHITE", "'#FF0000'", "'red'", "ManimColor(...)", "BLUE_E", "ManimColor.from_rgb"):
        assert any(needle in e for e in E), f"not flagged: {needle}\n{E}"
    good = (
        '"""A docstring may say #FF0000 and WHITE freely."""\n'
        "from loom_manim import *\n"
        "class Main(LoomScene):\n"
        "    def construct(self):\n"
        "        a = Dot(color=C.accent); b = Square(fill_color=C.ink)\n"
        "        c = Text('hex', color=C.muted)\n"
        "        d = Dot(color='#FF0000')  # loom: literal-colour the lesson is about this exact hex value\n")
    assert check_source(good) == [], check_source(good)
    assert any("needs a reason" in e for e in check_source("x = Dot(color='#FF0000')  # loom: literal-colour\n"))
    # every shipped Manim scene passes; the denominator must not be zero (Rule 0 addendum 1)
    files = [f for f in list(ROOT.glob("projects/*/scenes/*.py")) + list(ROOT.glob("runtime/manim/blueprints/*.py"))
             + list(ROOT.glob("scenes_examples/*.py")) if not f.parent.parent.name.startswith("_")]
    assert files, "no Manim scenes found to check"
    for f in files:
        assert check_file(f) == [], (f, check_file(f))
    # and the scenes gate uses it
    with TmpProject() as p:
        f = p.path("scenes/b14.py"); f.write_text(f.read_text(encoding="utf-8") + "\nX = WHITE\n", encoding="utf-8")
        must_fail(gates.check_scenes(p)[0], "Manim colour constant WHITE")
    return f"{len(files)} shipped scene(s) clean"


@test
def manim_records_what_a_scene_really_reads():
    try:
        import manim  # noqa: F401
    except Exception:
        return "skipped (Manim is not installed on this machine)"
    from loom import manim_bridge as M
    from loom.compose import load_style
    work = Path(tempfile.mkdtemp(prefix="loommanim_"))
    try:
        src = work / "s.py"
        src.write_text("from loom_manim import *\nclass Main(LoomScene):\n    def construct(self):\n"
                       "        name = 'accent' + '2'\n        self.add(Dot(color=getattr(C, name)), Dot(color=C.ink))\n"
                       "        self.wait(0.4)\n", encoding="utf-8")
        st = load_style("flat-cosmos")
        job = {"beat": "t", "src": src, "ctxd": {"beat": "t", "duration": 0.4, "cues": {}, "params": {}, "palette": st["palette"],
               "fonts": {}, "font_files": [], "speech": [0, 0.4], "size": [64, 36]}, "w": 64, "h": 36, "scene_class": "Main"}
        (work / "w").mkdir()
        clip, reads = M._invoke_manim(job, "draft", work / "w")
        assert clip.exists()
        assert sorted(reads["palette"]) == ["accent2", "ink"] and not reads["raw"], reads
    finally:
        shutil.rmtree(work, ignore_errors=True)
    return "a dynamic getattr(C, name) read was recorded"


@test
def manim_clips_get_the_brand_colours_like_the_canvas_does():
    # L-68: before 2026-09-30 the bridge loaded the style WITHOUT the brand, so Manim kept the style's colours
    from loom.brand import apply_brand, load_brand
    from loom.compose import load_style
    with ManimSandbox() as S:
        edit(S.p, "plan/storyboard.json", lambda d: d.update(brand="harbor-labs"))
        seen = []
        inner = S.M._invoke_manim

        def spy(job, quality, work):
            seen.append(job["look"]["palette"]); return inner(job, quality, work)
        S.M._invoke_manim = spy
        S.M.render_all(S.p, jobs=1)
        want = apply_brand(load_style(read_json(S.p.path("plan/storyboard.json"))["style"]), load_brand("harbor-labs"))["palette"]
        assert seen and all(pal == want for pal in seen), "Manim must see the same merged palette as compose"
        assert want["accent"].upper() == load_brand("harbor-labs")["colors"]["primary"].upper()


# ------------------------------------------------------------------ expressive motion, sound, trailer (D-43..D-50)
_VM_HEAD = r"""
const vm = require("vm"), fs = require("fs"), path = require("path");
const rt = process.argv[1];
const stub = () => ({ getContext: () => ({ measureText: () => ({ width: 0 }) }), setAttribute() {}, appendChild() {}, style: {} });
const ctx = { console, Math, JSON, Object, Array, String, Number, Promise, WeakMap, Map, Set };
ctx.window = ctx; ctx.document = { createElement: stub, createElementNS: stub, head: { appendChild() {} }, fonts: { ready: Promise.resolve() } };
vm.createContext(ctx);
for (const f of ["core.js", "style.js", "kit.js", "motion.js", "expressive.js"]) vm.runInContext(fs.readFileSync(path.join(rt, f), "utf8"), ctx);
const L = ctx.Loom;
"""


def _node(js):
    r = subprocess.run([which("node"), "-e", _VM_HEAD + js, str(ROOT / "runtime")], capture_output=True, text=True)
    assert r.returncode == 0, r.stderr[-600:]
    return json.loads(r.stdout.strip().splitlines()[-1])


@test
def springs_are_exact_at_both_ends_and_only_bounce_where_the_style_allows():
    out = _node(r"""
const res = {};
for (const over of [true, false]) {
  L.style.pack = { palette: {}, motion: { enter: 0.5, overshoot: over } };
  L.report.warnings = [];
  const r = {};
  for (const k of ["gentle", "snappy", "lively"]) {
    const s = L.spring(L.springs[k]); let mx = 0;
    for (let i = 0; i <= 400; i++) mx = Math.max(mx, s.ease(i / 400));
    r[k] = { start: s.ease(0), end: s.ease(1), max: mx, dur: s.dur, bounce: s.bounce };
  }
  r.clamped = L.report.warnings.filter((w) => w.code === "spring_bounce_clamped").length;
  res[over ? "overshoot" : "none"] = r;
}
console.log(JSON.stringify(res));
""")
    for mode, r in out.items():
        for k in ("gentle", "snappy", "lively"):
            assert r[k]["start"] == 0 and r[k]["end"] == 1, (mode, k, r[k])
            assert r[k]["dur"] > 0.5, (mode, k, r[k])     # settle time is longer than the perceived arrival
    assert out["overshoot"]["lively"]["max"] > 1.02, out["overshoot"]["lively"]
    assert out["overshoot"]["gentle"]["max"] <= 1.0005, out["overshoot"]["gentle"]
    assert out["none"]["lively"]["max"] <= 1.0005 and out["none"]["clamped"] == 2, out["none"]   # snappy + lively clamped
    assert out["overshoot"]["clamped"] == 0


@test
def groups_compress_their_stagger_and_leave_in_reverse_order():
    out = _node(r"""
L.style.pack = { palette: { accent: "#f00" }, motion: { enter: 0.5, exit: 0.3, stagger: 0.3, overshoot: false }, shape: { radius: 8 } };
L.tl = { fromTo() {}, set() {} };
const mk = (n) => ({ name: n, inner: {}, life: { setAttribute() {} }, w: 10, h: 10, beat: "t" });
const Es = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => mk("c" + i));
const seen = [];
L.motion.pop = (E, t) => seen.push([E.name, +t.toFixed(3)]);
const last = L.motion.group(Es, 1.0, { enter: "pop", order: "center", sfx: "card" });
const exits = [];
L.motion.exit = (E, t) => exits.push([E.name, +t.toFixed(3)]);
L.motion.groupExit(Es.slice(0, 3), 5.0);
console.log(JSON.stringify({ seen, last, exits, sfx: L.report.sfx }));
""")
    times = [t for _, t in out["seen"]]
    assert times[-1] - times[0] <= 1.2 + 1e-6, times             # 7 x 0.3 s would be 2.1 s: compressed to 1.2 s
    assert out["seen"][0][0] in ("c3", "c4"), out["seen"]          # centre-out starts in the middle
    assert [n for n, _ in out["exits"]] == ["c2", "c1", "c0"], out["exits"]
    assert [e["kind"] for e in out["sfx"]] == ["card", "card"], out["sfx"]   # first and last only


@test
def sound_events_are_collected_per_build_and_synthesised_in_key():
    import numpy as np
    from loom.narrate import mix as MX
    from loom import qa
    # every kind renders a non-silent, bounded signal
    sig = {}
    def add(at, s):
        sig.setdefault(round(at, 3), []).append(s)
    kinds = ["click", "key", "card", "land", "reveal", "success", "error", "whoosh", "pop", "tick", "chime"]
    MX.place_events(add, [{"kind": k, "t": 1.0 + i, "i": i} for i, k in enumerate(kinds)], 55, lambda t: [0, 7, 12, 16])
    assert len(sig) == len(kinds), sorted(sig)
    for at, ss in sig.items():
        peak = max(float(np.max(np.abs(s))) for s in ss)
        assert 0.005 < peak < 0.6, (at, peak)
    # a sparse register thins keypresses
    few = {}
    MX.place_events(lambda at, s: few.setdefault(at, s), [{"kind": "key", "t": i * 0.05, "i": i} for i in range(12)], 55, lambda t: [0], "sparse")
    assert len(few) == 2, len(few)
    # sync_sfx writes the events for THIS build and re-mixes only when they change (a lesson with none: untouched)
    with TmpProject() as p:
        (p.root / "build").mkdir(); p.path("build/index.html").write_text("<html>v1</html>")
        calls = []
        real = MX.mix
        import loom.narrate.mix as _m
        _m.mix = lambda project: calls.append(1)
        try:
            assert qa.sync_sfx(p, {"sfx": []}) == 0 and calls == [], "no events must not re-mix"
            assert qa.sync_sfx(p, {"sfx": [{"kind": "click", "t": 1.0}]}) == 1 and calls == [1]
            assert qa.sync_sfx(p, {"sfx": [{"kind": "click", "t": 1.0}]}) == 1 and calls == [1], "same events: no re-mix"
            assert MX.runtime_events(p) == [{"kind": "click", "t": 1.0}]
            p.path("build/index.html").write_text("<html>v2</html>")
            assert MX.runtime_events(p) == [], "events of another build must not be mixed"
        finally:
            _m.mix = real
    # the music follows the edit: chord changes land exactly on the given boundaries
    ts = MX.chord_times(30, "upbeat", [7.3, 19.1])
    assert 7.3 in ts and 19.1 in ts and ts[0] == 0.0, ts


@test
def reading_floor_and_double_exposure_are_measured_from_the_runtime_report():
    from loom import qa
    manifest = {"beats": [{"id": "b01", "speech_start": 0, "speech_end": 9, "start": 0, "end": 9},
                          {"id": "b02", "speech_start": 9, "speech_end": 18, "start": 9, "end": 18}],
                "scenes": [{"beat": "b01", "station": "s", "kind": "bespoke"}, {"beat": "b02", "station": "s", "kind": "bespoke", "join_in": {"type": "cut"}}]}
    pr = {"ready": True, "errors": [], "warnings": [], "console": [],
          "elements": [{"beat": "b01", "name": "a", "kind": "text", "revealT": 1.0, "exitT": 1.9},
                       {"beat": "b01", "name": "held", "kind": "text", "revealT": 1.0, "exitT": 1.2}],
          "texts": [{"beat": "b01", "text": "Five words on this card", "element": {"name": "a"}},
                    {"beat": "b01", "text": "Held into the next scene", "element": {"name": "held"}}],
          "tweens": [{"t0": 1.9, "t1": 2.2, "kind": "exit", "beat": "b01", "name": "a"},
                     {"t0": 8.8, "t1": 9.4, "kind": "exit", "beat": "b01", "name": "x"},
                     {"t0": 9.0, "t1": 9.5, "kind": "reveal", "beat": "b02", "name": "y", "content": True}]}
    with TmpProject() as p:
        E, W, st = qa.lints(p, pr, manifest)
    assert st["reading_floor_short"] == 1 and any("Five words" in w and "reading floor" in w for w in W), W
    assert not any("Held into" in w for w in W), "an element with no exit tween stays on screen (L-74)"
    assert st["double_exposures"] == 1 and any("double exposure" in w for w in W), W
    # L-164: text the CAMERA carries away has no exit tween but is gone at its exitT, and a 1.2 s unmask is not
    # readable 0.45 s in. phishing-report b01 printed its headline 0.2 s before the camera left, unflagged.
    pr2 = {"ready": True, "errors": [], "warnings": [], "console": [],
           "elements": [{"beat": "b01", "name": "title", "kind": "text", "revealT": 5.7, "exitT": 7.1, "exitKind": "camera"},
                        {"beat": "b01", "name": "stays", "kind": "text", "revealT": 1.0, "exitT": 7.1}],
           "texts": [{"beat": "b01", "text": "They want you to hurry.", "element": {"name": "title"}},
                     {"beat": "b01", "text": "No exit of any kind", "element": {"name": "stays"}}],
           "tweens": [{"t0": 5.7, "t1": 6.9, "kind": "unmask", "beat": "b01", "name": "title"}]}
    with TmpProject() as p:
        E2, W2, st2 = qa.lints(p, pr2, manifest)
    assert any("They want you" in w and "readable for 0.20s" in w for w in W2), W2   # 7.1 - 6.9, not 7.1 - 6.15
    assert not any("No exit" in w for w in W2), "an element with no exit at all is still held, not short (L-74)"


@test
def declared_intents_excuse_only_what_they_declare_and_tone_is_measured():
    """D-112 (TED-Ed study): good films hold FINISHED frames for 7 to 24 s, use 0.6 to 1.2 s punctuation beats,
    callbacks and ghost overlaps. A declared intent excuses exactly that; without the declaration every gate still
    fails. Tone: a value script is checked against measured brightness, more than two saturated hue families warn,
    and only an illustrated pack is compared with its TED-Ed tone reference."""
    from loom import qa
    from loom.checks import film as F
    from loom.checks.gates import _plan_checks
    from loom.checks.style_lint import lint_style
    from PIL import Image
    tmp = Path(tempfile.mkdtemp(prefix="loomtest_int_"))
    try:
        def png(name, rgb=None, draw=None):
            im = Image.new("RGB", (480, 270), rgb or (240, 240, 240))
            if draw:
                draw(im)
            p = tmp / f"{name}.png"; im.save(p); return p
        from PIL import ImageDraw
        def busy(im):
            d = ImageDraw.Draw(im)
            for i in range(0, 480, 12):
                d.line([(i, 20), (i, 200)], fill=(20, 20, 20), width=2)
        def rainbow(im):
            d = ImageDraw.Draw(im)
            for k, c in enumerate([(230, 30, 30), (30, 200, 40), (30, 60, 230), (240, 220, 20)]):
                d.rectangle([k * 120, 0, k * 120 + 110, 269], fill=c)
        blank = png("blank", (250, 250, 250)); dense = png("dense", draw=busy); dark = png("dark", (12, 12, 20), busy)
        multi = png("multi", draw=rainbow)
        man = {"beats": [{"id": "b01", "speech_start": 0, "speech_end": 4}, {"id": "b02", "speech_start": 4, "speech_end": 8},
                         {"id": "b03", "speech_start": 8, "speech_end": 12}],
               "scenes": [{"beat": "b01", "station": "s"}, {"beat": "b02", "station": "s"}, {"beat": "b03", "station": "s"}]}
        frames = {round(t * 0.5, 2): blank for t in range(0, 24)}            # empty everywhere
        E, W, _ = F.frame_checks(man, frames, {"scenes": []})
        assert sum("empty frame" in e for e in E) == 3, E                     # undeclared: fails
        sb = {"scenes": [{"beat": "b01", "intent": "rest"}, {"beat": "b02", "intent": "punctuation"}, {"beat": "b03"}]}
        E, W, _ = F.frame_checks(man, frames, sb)
        assert not any(e.startswith("b01") for e in E), E                    # rest excuses emptiness
        assert any(e.startswith("b02") for e in E), "a 3 s empty run is not a punctuation beat"
        fr2 = {**{round(t * 0.5, 2): dense for t in range(0, 24)}, 5.0: blank}   # one 0.5 s empty sample in b02
        E, W, _ = F.frame_checks(man, fr2, sb)
        assert not any(e.startswith("b02") for e in E), E                    # a short punctuation beat passes
        # repeated frame: the same picture twice warns, unless it is a declared callback
        fr3 = {round(t * 0.5, 2): dense for t in range(0, 24)}
        _, W, _ = F.frame_checks(man, fr3, {"scenes": []})
        assert any("the same frame as" in w for w in W), W
        _, W, _ = F.frame_checks(man, fr3, {"scenes": [{"beat": "b02", "intent": "callback"}, {"beat": "b03", "intent": "callback"}]})
        assert not any("the same frame as" in w for w in W), W
        # diegetic text: a tiny sign warns instead of failing, only where declared
        pr = {"screen_text": [{"beat": "b01", "t": 1.0, "min_px": 12, "small": [{"text": "OPEN", "px": 12}]}]}
        E, W, _ = F.screen_text_checks(pr, None, {"scenes": []})
        assert E and not W, (E, W)
        E, W, _ = F.screen_text_checks(pr, None, {"scenes": [{"beat": "b01", "intent": "diegetic_text"}]})
        assert not E and W, (E, W)
        # tone: value script against measured brightness; hue families; reference only for illustrated packs
        frt = {**{round(t * 0.5, 2): dense for t in range(0, 8)}, **{round(t * 0.5, 2): multi for t in range(8, 24)}}
        sbt = {"value_script": [{"from": "b01", "band": "dark"}], "scenes": []}
        _, W, st = F.tone_checks(man, frt, sbt, {"look_family": "editorial"})
        assert any(w.startswith("b01") and "value script" in w for w in W), W   # light frames under a 'dark' script
        assert any("saturated hue families" in w for w in W), W                 # four hues in b02 and b03
        assert "tone_vs_reference" not in st
        ref = {"family": "dark_void_single_light", "brightness": 0.37, "saturation": 0.30, "dark_share": 0.37,
               "light_share": 0.11, "warm": 0.2, "cool": 0.1, "accent_shots": 0.27, "tolerance": 0.15}
        _, W, st = F.tone_checks(man, {round(t * 0.5, 2): dense for t in range(0, 24)}, {"scenes": []},
                                 {"look_family": "illustrated", "tone_reference": ref})
        assert "tone_vs_reference" in st and any(w.startswith("tone: lesson brightness") for w in W), W
        _, W, _ = F.tone_checks(man, {round(t * 0.5, 2): dark for t in range(0, 24)}, {"value_script": [{"from": "b01", "band": "dark"}], "scenes": []}, None)
        assert not any("value script" in w for w in W), W
        # static hold: 10 s of nothing errors; a declared rest does not (up to pace.rest_max_s)
        m2 = {"beats": [{"id": "b01", "speech_start": 0, "speech_end": 12, "start": 0, "end": 12}],
              "scenes": [{"beat": "b01", "station": "s", "kind": "bespoke"}]}
        pr2 = {"ready": True, "errors": [], "warnings": [], "console": [], "elements": [], "texts": [],
               "tweens": [{"t0": 0.5, "t1": 1.0, "kind": "reveal", "beat": "b01", "name": "x", "content": True}]}
        with TmpProject() as p:
            write_json(p.path("plan/storyboard.json"), {"scenes": [{"beat": "b01"}]})
            E, W, _ = qa.lints(p, pr2, m2)
            assert any("nothing developing" in e for e in E), E
            write_json(p.path("plan/storyboard.json"), {"scenes": [{"beat": "b01", "intent": "rest"}]})
            E, W, st = qa.lints(p, pr2, m2)
            assert not any("nothing developing" in e for e in E), E
            assert st["static_holds"][0].get("declared") == "rest"
            # double exposure: a declared ghost overlap is not flagged; the same overlap undeclared is
            m3 = {"beats": [{"id": "b01", "speech_start": 0, "speech_end": 9, "start": 0, "end": 9},
                            {"id": "b02", "speech_start": 9, "speech_end": 18, "start": 9, "end": 18}],
                  "scenes": [{"beat": "b01", "station": "s", "kind": "bespoke"},
                             {"beat": "b02", "station": "s", "kind": "bespoke", "join_in": {"type": "fade", "overlap": "ghost"}}]}
            pr3 = {"ready": True, "errors": [], "warnings": [], "console": [], "elements": [], "texts": [],
                   "tweens": [{"t0": 8.8, "t1": 9.4, "kind": "exit", "beat": "b01", "name": "x"},
                              {"t0": 9.0, "t1": 9.5, "kind": "reveal", "beat": "b02", "name": "y", "content": True}]}
            write_json(p.path("plan/storyboard.json"), {"scenes": []})
            _, W, st = qa.lints(p, pr3, m3)
            assert st["double_exposures"] == 0, W
            m3["scenes"][1]["join_in"] = {"type": "fade"}
            _, W, st = qa.lints(p, pr3, m3)
            assert st["double_exposures"] == 1, W
        # the plan: devices and value script; references to unknown beats are errors
        E, W = _plan_checks({"scenes": [{"beat": "b01"}]}, ["b01", "b02"])
        assert not E and any("no device set" in w for w in W) and any("no value script" in w for w in W), (E, W)
        E, W = _plan_checks({"devices": [{"id": "d", "what": "x", "beats": ["b09"]}],
                             "value_script": [{"from": "b02", "band": "mid"}, {"from": "b01", "band": "dark"}], "scenes": []}, ["b01", "b02"])
        must_fail(E, "unknown beats"); must_fail(E, "beat order")
        # packs: every pack has a look family; a tone reference only on an illustrated pack
        bad = read_json(ROOT / "packs/styles/corporate-clean.json"); bad["tone_reference"] = ref
        must_fail(lint_style(bad), "only an illustrated pack")
        del bad["look_family"]
        must_fail(lint_style(bad), "look_family")
        fams = {p.stem: read_json(p)["look_family"] for p in (ROOT / "packs/styles").glob("*.json")}
        assert {k for k, v in fams.items() if v == "illustrated"} == {"story-cartoon", "flat-cosmos", "glow-flat", "whiteboard",
                                                                      "cinematic-noir", "cinematic-dawn"}, fams
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    return "intents excuse only what they declare; tone, plan and pack families checked, each able to fail"


@test
def travel_moves_the_elements_own_origin_whatever_it_draws_and_whatever_order_frames_are_seen():
    """L-166: m.travel(E, t, {x, y, scale}) puts E's local (0, 0) at (x, y) scaled by `scale`. GSAP's origin
    options shifted it by an amount set by the element's bbox (or by where it was before), so an element drawing
    above or left of its origin landed elsewhere. A red mark at local (20, 20) inside a wide faint panel that starts
    at (-300, -300) must end at (500 + 2*20, 300 + 2*20) = (540, 340)."""
    if _no_cairo():
        return _no_cairo()
    import importlib.util
    from PIL import Image
    spec = importlib.util.spec_from_file_location("lab_preview", ROOT / "tools" / "lab_preview.py"); LP = importlib.util.module_from_spec(spec); spec.loader.exec_module(LP)
    tmp = ROOT / "scenes_examples" / "lab" / "lab__tmp_travel.js"
    tmp.write_text('// @lab {"title": "t", "styles": ["glow-flat"], "dur": 2.0, "times": [1.6]}\nLoom.scene("lab__tmp_travel", { build(ctx) {\n'
                   '  const E = ctx.el("mover", { x: 0, y: 0, w: 40, h: 40, kind: "shape" });\n'
                   '  Loom.svg("rect", { x: -300, y: -300, width: 360, height: 360, fill: "#000000", "fill-opacity": 0.02 }, E.inner);\n'
                   '  Loom.svg("rect", { x: 10, y: 10, width: 20, height: 20, fill: "#ff0000" }, E.inner);\n'
                   '  ctx.m.reveal(E, 0.05, { dy: 0, dur: 0.1 });\n'
                   '  ctx.m.travel(E, 0.3, { x: 500, y: 300, scale: 2, dur: 1.0 });\n} });\n')
    try:
        r = LP.preview("lab__tmp_travel", "glow-flat", times=[1.6])
    finally:
        tmp.unlink()
    assert not r["errors"], r["errors"]
    im = Image.open(r["pngs"][0]).convert("RGB")
    red = lambda xy: (lambda c: c[0] > 200 and c[1] < 60 and c[2] < 60)(im.getpixel(xy))
    assert red((540, 340)) and red((522, 322)) and red((558, 358)), [im.getpixel(xy) for xy in ((540, 340), (522, 322), (558, 358))]
    assert not red((840, 640)) and not red((518, 318)), "the mark moved by the panel's corner, not by its own origin"
    return "local (20, 20) landed at (540, 340) with a panel drawn from (-300, -300) (preview harness)"


@test
def travel_lands_on_its_own_origin_in_chrome_too():
    """L-166, the half that can fail: the preview harness has no GSAP origin maths, so the test above passed with
    the broken travel as well (checked by putting the old tween back). Only Chrome reproduces the defect, so this
    runs the same scene through the real lab in Chrome and reads the frame."""
    import os, tempfile
    from PIL import Image
    if not _browser():
        return SKIP_NO_BROWSER
    from loom import lab as LAB
    tmp = ROOT / "scenes_examples" / "lab" / "lab__tmp_travel_chrome.js"
    tmp.write_text('// @lab {"title": "t", "styles": ["glow-flat"], "dur": 2.0, "times": [1.6]}\nLoom.scene("lab__tmp_travel_chrome", { build(ctx) {\n'
                   '  const E = ctx.el("mover", { x: 0, y: 0, w: 40, h: 40, kind: "shape" });\n'
                   '  Loom.svg("rect", { x: -300, y: -300, width: 360, height: 360, fill: "#000000", "fill-opacity": 0.02 }, E.inner);\n'
                   '  Loom.svg("rect", { x: 10, y: 10, width: 20, height: 20, fill: "#ff0000" }, E.inner);\n'
                   '  ctx.m.reveal(E, 0.05, { dy: 0, dur: 0.1 });\n'
                   '  ctx.m.travel(E, 0.3, { x: 500, y: 300, scale: 2, dur: 1.0 });\n} });\n')
    d = Path(tempfile.mkdtemp())
    try:
        r = LAB.strip("lab__tmp_travel_chrome", "glow-flat", times=[1.6], out_dir=d, frames_dir=d)
        assert not r["errors"], r["errors"]
        png = next(d.glob("lab__tmp_travel_chrome__*__01.60.png"))
        im = Image.open(png).convert("RGB")
        red = lambda xy: (lambda c: c[0] > 200 and c[1] < 60 and c[2] < 60)(im.getpixel(xy))
        assert red((540, 340)) and not red((840, 640)), [im.getpixel(xy) for xy in ((540, 340), (840, 640))]
        return "Chrome: local (20, 20) landed at (540, 340)"
    finally:
        tmp.unlink(); shutil.rmtree(d, ignore_errors=True)


@test
def decision_ledger_logs_routing_tooling_and_outcomes_and_keeps_every_version():
    """D-97: the ledger is the training data for later routers, decision models and fine-tunes, so it must really be
    written where decisions happen. An accept that FAILS is logged with its errors and its rejected version is kept;
    a passing storyboard accept logs one shot_plan per beat with the features a router would see; allocation logs
    one treatment per beat; check outcomes land on the right beats (by id and by time); the same record twice is
    one decision; backfill runs once; an empty lesson reports zeros rather than pretending."""
    from loom import ledger as L
    from loom import flow
    with TmpProject() as p:
        n_beats = len(read_json(p.path("plan/storyboard.json"))["scenes"])
        assert n_beats > 0
        # a failing accept: plant a storyboard error the gate rejects
        good = p.path("plan/storyboard.json").read_text(encoding="utf-8")
        edit(p, "plan/storyboard.json", lambda d: d["scenes"][0].update(kind="nonsense"))
        E, _ = flow.accept(p, "storyboard")
        assert E, "the planted storyboard error was not rejected"
        p.path("plan/storyboard.json").write_text(good, encoding="utf-8")
        E2, _ = flow.accept(p, "storyboard")
        assert not E2, E2
        R = L.read(p)
        gates = [r for r in R if r["event"] == "gate" and r["node"] == "storyboard"]
        assert [g["choice"] for g in gates] == ["fail", "pass"] and gates[0]["data"]["errors"], gates
        plans = [r for r in R if r.get("decision") == "shot_plan"]
        assert len(plans) == n_beats and all(r["by"]["kind"] == "agent" and r["by"].get("tier") == "plan" for r in plans)
        assert any("job" in (r.get("features") or {}) for r in plans), "shot plans carry no router features"
        vers = sorted(x.name for x in (p.root / "logs/versions/storyboard").iterdir())
        assert len(vers) == 2 and any("_rejected_" in v for v in vers) and any("_accepted_" in v for v in vers), vers
        # allocation decisions, one per beat, by code
        nA = L.allocation_decisions(p)
        assert nA == len(read_json(p.path("plan/allocation.json"))["beats"]) > 0
        # check outcomes: by beat id and by time
        write_json(p.path("build/manifest.json"), {"beats": [{"id": "b01", "start": 0, "end": 5}, {"id": "b02", "start": 5, "end": 9}]})
        L.check_outcomes(p, {"errors": ["b02: 9.3s with nothing developing", "hf layout content_overlap @ 2.5: overlap"], "warnings": ["runtime literal_colour: x"]})
        oc = {r["node"]: r for r in L.read(p) if r["event"] == "outcome"}
        assert oc["check"]["choice"] == "fail" and oc["check:b02"]["choice"] == "fail" and oc["check:b01"]["choice"] == "fail", sorted(oc)
        # duplicates collapse; backfill runs once
        a = L.log(p, "note", node="x", decision="fix", choice="same"); b = L.log(p, "note", node="x", decision="fix", choice="same")
        assert a["id"] == b["id"] and len([r for r in L.unique(L.read(p)) if r["id"] == a["id"]]) == 1
        first = L.backfill(p); again = L.backfill(p)
        assert "skipped" not in first and again == {"skipped": "already backfilled"}, (first, again)
    tmp = Path(tempfile.mkdtemp(prefix="loomtest_empty_"))
    try:
        out = L.backfill(tmp)
        assert all(v == 0 for k, v in out.items() if k != "versions"), out
        assert L.stats(tmp)["records"] == 1   # only the backfill marker: a zero is reported, not hidden
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    return f"{n_beats} shot plans, fail+pass gates with both versions kept, outcomes on b01/b02, dedupe and one-time backfill"


@test
def trailer_plan_is_cut_from_the_lessons_own_beats_and_fits_the_target():
    from loom import trailer as TR
    lesson = ROOT / "projects" / "blameless-postmortem"
    if not (lesson / "build/manifest.json").exists():
        return "skipped (blameless-postmortem is not composed here)"
    p = Project(lesson)
    P = TR.plan(p)
    assert TR.TARGET[0] <= P["duration"] <= TR.TARGET[1], P["duration"]
    script = read_json(lesson / "plan/script.json")
    beats = {b["id"]: b for b in script["beats"]}
    assert beats[P["why"]["hook"]]["job"] == "hook"
    # every spoken word in the trailer is the lesson's own narration, cut at phrase boundaries
    tm = {b["id"]: b for b in read_json(lesson / "audio/timings.json")["beats"]}
    for s in P["spoken"]:
        phrases = [ph["text"] for ph in tm[s["beat"]]["phrases"]]
        assert s["text"] in " ".join(phrases), s
    # segments are real lesson windows, back to back with the cards, and the cuts are where the music changes
    for s in P["segments"]:
        b = tm[s["beat"]]
        assert b["start"] - 1e-6 <= s["a"] < s["b"] <= b["end"] + 1e-6, s
    spans = sorted([(s["t0"], s["t1"]) for s in P["segments"]] + [(c["t0"], c["t1"]) for c in P["cards"]])
    for (a0, a1), (b0, b1) in zip(spans, spans[1:]):
        assert abs(a1 - b0) < 1e-3, spans
    assert abs(spans[-1][1] - P["duration"]) < 1e-3
    # the card copy carries no digits except the computed duration
    import re as _re
    assert _re.findall(r"\d+", P["card_copy"]) == [str(max(1, round(read_json(lesson / "build/manifest.json")["duration"] / 60)))], P["card_copy"]
    return f"{P['duration']:.1f}s from {', '.join(s['beat'] for s in P['segments'])}"


# ------------------------------------------------------------------ shaders, Skia, Three.js, Lottie (D-52..D-56)
def _browser():
    """A browser the engine can render with: a pinned HYPERFRAMES_BROWSER_PATH, or the one HyperFrames manages
    (`npx hyperframes browser ensure`), found the same way `loom doctor` finds it. Checking only the env var made
    every browser test skip on a PC that could render (L-127); every suite now asks tests/browser_support.py."""
    return browser()


def _own_browser_checks(src: str) -> list[str]:
    """lines of a test file that decide "is there a browser?" themselves instead of asking tests/browser_support.py:
    reading the env var in Python, or calling the engine's finder directly (the JS harnesses' process.env is fine)"""
    import re
    env = "HYPERFRAMES_" + "BROWSER_PATH"
    own = re.compile(r"environ(\.get\(\s*|\[\s*)[\"']" + env + r"|\bbrowser" + r"_path\b|[\"']--browser[\"']\s+in\s+sys\.argv\)?\s*:")
    return [ln.strip() for ln in src.splitlines() if own.search(ln)]


@test
def browser_tests_ask_one_shared_check():
    """37 browser tests skipped on a PC that could render: their suites read only HYPERFRAMES_BROWSER_PATH (L-127 three
    times over). Every test file now asks tests/browser_support.py; a file that decides for itself is red. Control:
    the old checks are caught."""
    for bad in ('    if not os.environ.get("HYPERFRAMES_' 'BROWSER_PATH"):', '    return os.environ["HYPERFRAMES_' 'BROWSER_PATH"]',
                '    from loom.render import browser' '_path', '    if not (x or "--brow' 'ser" in sys.argv):'):
        assert _own_browser_checks(bad), f"the scan missed: {bad}"
    assert not _own_browser_checks('  const b = await puppeteer.launch({ executablePath: process.env.HYPERFRAMES_' 'BROWSER_PATH });'), "a JS harness flagged"
    files = [ROOT / "tests" / "run_tests.py"] + sorted((ROOT / "tests" / "suites").glob("*.py"))
    found = {f.name: hits for f in files if (hits := _own_browser_checks(f.read_text(encoding="utf-8")))}
    assert not found, f"browser checks outside tests/browser_support.py: {found}"
    return f"{len(files)} test files ask the shared check; browser here: {'yes' if _browser() else 'no'}"


@test
def fx_shaders_compile_and_the_layer_renders_in_a_real_browser():
    if not _browser():
        return "skipped (no browser here; set HYPERFRAMES_BROWSER_PATH)"
    from loom import lab
    T = tempfile.mkdtemp(prefix="lmt_lab_")
    r = lab.strip("lab_fx", "engineering", [0.3, 2.9], out_dir=T)
    assert not r["errors"], r["errors"]
    r = lab.strip("lab_lottie", "flat-cosmos", [0.2, 1.0], out_dir=T)
    assert not r["errors"], r["errors"]
    return "fx and lottie lab strips clean"


@test
def skia_colour_dialect_refuses_fixed_colours():
    from loom.checks.manim_colours import check_source
    bad = "import skia\na = skia.ColorWHITE\nb = skia.Color(255, 0, 0)\nc = 0xFF00FF00\nd = skia.ColorSetRGB(1, 2, 3)\n"
    E = check_source(bad, "s.py", "skia")
    for needle in ("ColorWHITE", "Color(...)", "0xFF00FF00", "ColorSetRGB(...)"):
        assert any(needle in e for e in E), (needle, E)
    ok = "from loom_skia import *\ndef frame(c, t):\n    c.drawCircle(1, 2, 3, paint('accent'))\n    x = skia.ColorTRANSPARENT\n"
    assert check_source(ok, "s.py", "skia") == [], check_source(ok, "s.py", "skia")
    f = ROOT / "scenes_examples" / "skia" / "hero_orb.py"
    assert check_source(f.read_text(encoding="utf-8"), f.name, "skia") == []


@test
def clip_store_keys_separate_renderers_and_keep_manim_keys():
    from loom import manim_bridge as M
    from loom.util import sha
    job = {"src_sha": "s", "timing": {"d": 1}, "runtime_sha": "r"}
    old = sha("s", {"d": 1}, "r", M._manim_version(), M.QUALITY["final"])     # the key before D-53
    assert M._base(job, "final") == old, "Manim keys must not change (existing stores stay valid)"
    assert M._base(dict(job, engine="skia-144"), "final") != old
    assert M._base(dict(job, engine="skia-144"), "final") != M._base(dict(job, engine="three-0.186"), "final")


@test
def skia_renderer_is_deterministic_records_reads_and_blurs_motion():
    from loom import skia_bridge as S
    if not S.available():
        return "skipped (skia-python is not installed here)"
    from loom.compose import load_style
    st = load_style("flat-cosmos")
    work = Path(tempfile.mkdtemp(prefix="loomskia_"))
    try:
        src = work / "s.py"
        src.write_text("from loom_skia import *\ndef frame(c, t):\n    x = 20 + 400 * t\n"
                       "    c.drawRect(skia.Rect.MakeXYWH(x, 20, 24, 24), paint('accent'))\n", encoding="utf-8")
        base = {"beat": "t", "src": src, "w": 96, "h": 64, "ctxd": {"beat": "t", "duration": 0.2, "cues": {}, "params": {}, "palette": st["palette"],
                "fonts": {}, "font_files": [], "speech": [0, 0.2], "size": [96, 64]}}
        outs = {}
        for tag, mb in (("a", (1, 0.5)), ("b", (1, 0.5)), ("blur", (6, 1.0))):
            d = work / tag; d.mkdir()
            _, reads = S._invoke(dict(base, mb=mb, stills=[0.1]), "final", d)
            outs[tag] = (d / "still_0.10.png").read_bytes()
        assert outs["a"] == outs["b"], "the same frame twice must be the same pixels"
        assert outs["blur"] != outs["a"], "motion blur must change a moving frame"
        assert sorted(reads["palette"]) == ["accent"] and not reads["raw"], reads
    finally:
        shutil.rmtree(work, ignore_errors=True)


@test
def three_renderer_is_deterministic_and_records_reads():
    if not _browser():
        return "skipped (no browser here)"
    from loom import three_bridge as T
    if T.three_version() == "none":
        return "skipped (three is not installed)"
    from loom.compose import load_style
    st = load_style("engineering")
    work = Path(tempfile.mkdtemp(prefix="loomthree_"))
    try:
        src = work / "s.js"
        src.write_text("export function build(ctx, THREE, X) { const scene = new THREE.Scene(); const cam = new THREE.PerspectiveCamera(40, X.W / X.H, 0.1, 50);"
                       " cam.position.z = 5; const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: ctx.c('accent') }));"
                       " scene.add(m); return { scene, camera: cam, update(t) { m.rotation.y = t; } }; }\n", encoding="utf-8")
        base = {"beat": "t", "src": src, "w": 96, "h": 64, "mb": (1, 0.5),
                "ctxd": {"beat": "t", "duration": 0.2, "cues": {}, "params": {}, "palette": st["palette"], "fonts": {}, "faces": [], "speech": [0, 0.2], "size": [96, 64]}}
        outs = []
        for tag in ("a", "b"):
            d = work / tag; d.mkdir()
            _, reads = T._invoke(dict(base, stills=[0.1]), "final", d)
            outs.append((d / "still_0.10.png").read_bytes())
        assert outs[0] == outs[1], "the same 3D frame twice must be the same pixels"
        assert sorted(reads["palette"]) == ["accent"], reads
    finally:
        shutil.rmtree(work, ignore_errors=True)


@test
def trailer_keeps_and_retimes_only_the_clips_it_shows():
    from loom.trailer import retime_videos
    html = ('<video id="media-b16" class="lm-media" src="media/b16.webm" data-start="150.0" data-duration="10.0" data-track-index="20"></video>\n'
            '<video id="media-b06" class="lm-media" src="media/b06.webm" data-start="60" data-duration="12" data-track-index="21"></video>\n')
    out = retime_videos(html, [{"beat": "b16", "a": 152.0, "b": 157.0, "t0": 12.0, "t1": 17.0}],
                        {"b16": {"start": 150.0, "duration": 10.0}, "b06": {"start": 60, "duration": 12}})
    assert "media-b06" not in out, out
    assert 'data-start="12.0"' in out and 'data-duration="5.0"' in out and 'data-playback-start="2.0"' in out, out


@test
def lottie_auto_recolouring_maps_the_animations_colours_to_tokens():
    js = r"""
const vm = require("vm"), fs = require("fs"), path = require("path");
const rt = process.argv[1];
const stub = () => ({ getContext: () => ({ measureText: () => ({ width: 0 }) }), setAttribute() {}, appendChild() {}, style: {} });
const ctx = { console, Math, JSON, Object, Array, String, Number, Promise, WeakMap, Map, Set };
ctx.window = ctx; ctx.document = { createElement: stub, createElementNS: stub, head: { appendChild() {} }, fonts: { ready: Promise.resolve() } };
vm.createContext(ctx);
for (const f of ["core.js", "style.js", "kit.js", "motion.js", "lottie.js"]) vm.runInContext(fs.readFileSync(path.join(rt, f), "utf8"), ctx);
const data = JSON.parse(fs.readFileSync(path.join(rt, "..", "assets", "lottie", "check_success.json"), "utf8"));
console.log(JSON.stringify(ctx.Loom.lottie.colours(data)));
"""
    r = subprocess.run([which("node"), "-e", js, str(ROOT / "runtime")], capture_output=True, text=True)
    assert r.returncode == 0, r.stderr[-400:]
    cols = json.loads(r.stdout.strip().splitlines()[-1])
    assert len(cols) == 2 and sum(cols.values()) == 3, cols      # teal (ring stroke + disc fill) and gold (check)


# ------------------------------------------------------------------ characters, depth, iso, storytelling, reel (D-59..D-63)
@test
def characters_depth_and_iso_render_clean_and_a_missing_rig_is_an_error():
    if not _browser():
        return "skipped (no browser here; set HYPERFRAMES_BROWSER_PATH)"
    from loom import lab
    T = tempfile.mkdtemp(prefix="lmt_lab_")
    for sc, st, at in (("lab_characters", "flat-cosmos", [1.1, 3.4]), ("lab_depth", "cinematic-noir", [0.2, 4.8]), ("lab_iso", "whiteboard", [4.0])):
        r = lab.strip(sc, st, at, out_dir=T)
        assert not r["errors"], (sc, r["errors"])
    planted = ROOT / "scenes_examples" / "lab" / "_planted_rig.js"
    planted.write_text('// @lab {"dur": 1.0, "times": [0.5]}\nLoom.scene("_planted_rig", { build(ctx) { ctx.character("x", "nobody", { x: 900, y: 900 }); } });\n', encoding="utf-8")
    try:
        r = lab.strip("_planted_rig", "flat-cosmos", [0.5], out_dir=T)
        assert any("rig_missing" in e for e in r["errors"]), r["errors"]
    finally:
        planted.unlink()
        shutil.rmtree(T, ignore_errors=True)
    return "3 lab scenes clean; an unknown rig is reported"


@test
def story_warnings_are_a_ratchet_that_can_fire():
    from loom.story import story_warnings
    beats = [f"b{i}" for i in range(1, 9)]
    bare = {"scenes": [{"beat": b, "kind": "template", "station": "s"} for b in beats]}
    W = story_warnings(bare, beats, genre="explainer")
    for needle in ("metaphor", "shot sizes", "every scene is flat"):
        assert any(needle in w for w in W), (needle, W)
    assert all(w.startswith("story (suggestion): ") for w in W), W       # suggestions are labelled as such (D-64)
    # every kind of video gets suggestions (D-67); the kind only changes the form of story suggested
    P = story_warnings(bare, beats, genre="policy")
    assert any("decision and its consequence" in w for w in P), P
    assert any("governing metaphor" in w for w in W), W
    assert story_warnings(dict(bare, story={"dial": "off"}), beats, genre="explainer") == []
    good = {"story": {"metaphor": "a harbour at night", "cast": [{"name": "Ava", "rig": "ava"}]},
            "scenes": [{"beat": b, "kind": "bespoke" if i == 0 else "template", "station": "s", "shot": {"size": sz},
                        "depth": "layered" if i == 0 else "flat", "story_role": "payoff" if i == 5 else "setup"}
                       for i, (b, sz) in enumerate(zip(beats, ["establishing", "wide", "medium", "close", "medium", "establishing"]))]}
    good["scenes"][0]["design"] = {"references": ["docs/references/places/office.md"]}   # reference-first (D-87)
    good["scenes"][0]["subject"] = "harbour office"                                   # draw the subject (D-90, B1)
    assert story_warnings(good, beats, genre="explainer") == [], story_warnings(good, beats, genre="explainer")
    nosub = json.loads(json.dumps(good)); del nosub["scenes"][0]["subject"]
    assert any(w.startswith("subject (suggestion)") for w in story_warnings(nosub, beats, genre="explainer"))
    noref = json.loads(json.dumps(good)); noref["scenes"][0]["design"] = {}
    assert any(w.startswith("reference (suggestion)") and "b1" in w for w in story_warnings(noref, beats, genre="explainer"))
    bad = json.loads(json.dumps(good))
    bad["scenes"][1]["depth"] = "iso"; bad["scenes"][5]["story_role"] = "reveal"; bad["story"]["cast"][0]["rig"] = "nobody"
    for s_ in bad["scenes"]:
        s_["shot"]["size"] = "medium"
    W = story_warnings(bad, beats, genre="explainer")
    for needle in ("depth 'iso' on a template", "no beat is the payoff", "no rig 'nobody'", "shots are 'medium'"):
        assert any(needle in w for w in W), (needle, W)
    # correctness notes stay whatever the dial: the engine cannot draw depth on a template
    assert any("cannot be drawn" in w for w in story_warnings(bad, beats, genre="policy"))
    return f"{len(W)} notes on the planted storyboard, 0 on the good one; policy gets a scenario, not silence"


@test
def cost_reports_drivers_without_tiers():
    from loom import cost
    r = cost.estimate(Project(DEMO))
    assert "tier" not in r and "budget" not in r, r                       # D-67: no tier labels for now
    assert r["scenes"].get("manim") == 2 and r["clip_seconds"].get("manim", 0) > 0, r
    assert "ESTIMATE" in r["estimate_basis"] and r["render_minutes_estimate"][0] > 0, r
    return f"{r['scenes']}, render {r['render_minutes_estimate']} min (estimate)"

@test
def every_style_pack_passes_the_lint_including_the_cinematic_ones():
    from loom.checks.style_lint import lint_all
    L = lint_all()
    assert {"cinematic-noir", "cinematic-dawn"} <= set(L), sorted(L)
    bad = {k: v for k, v in L.items() if v}
    assert not bad, bad
    return f"{len(L)} packs clean"


@test
def animatic_has_one_panel_per_beat_timed_by_the_narration():
    from loom import story
    p = Project(ROOT / "projects" / "spacing-sticks")
    r = story.animatic(p, use_frames=False)
    beats = read_json(p.path("plan/script.json"))["beats"]
    assert r["panels"] == len(beats), r
    assert r["timed_by"] == "narration" and r["video"], r
    got = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", r["video"]], capture_output=True, text=True).stdout)
    assert abs(got - r["duration"]) < 1.0, (got, r["duration"])
    return f"{r['panels']} panels, {r['duration']} s"


@test
def reel_segments_are_keyed_by_what_they_read():
    from loom import reel
    seg = {"kind": "lab", "scene": "lab_iso", "style": "corporate-clean", "from": 0, "to": 1, "label": "x"}
    k = reel._key(seg)
    assert reel._key(dict(seg, style="whiteboard")) != k
    assert reel._key(dict(seg, to=2)) != k
    assert reel._key(dict(seg)) == k
    try:
        reel._key(dict(seg, scene="no_such_scene"))
        raise AssertionError("an unknown scene must be refused")
    except Exception as e:
        assert "no lab scene" in str(e), e
    return "style, window and source change the key"


@test
def fx_overlays_are_translucent_so_the_layout_check_sees_through_them():
    """L-104: HyperFrames counts any CANVAS with an opacity chain >= 0.6 as opaque, so the grain/vignette
    overlay made every word read as hidden. Overlays now render at a gain and show at CSS opacity < 0.6."""
    if not _browser():
        return "skipped (no browser here; set HYPERFRAMES_BROWSER_PATH)"
    from loom import flow
    flow.run_code(Project(DEMO), "compose")                                # this runtime, not a stale build
    idx = DEMO / "build" / "index.html"
    js = ("(() => [...document.querySelectorAll('canvas[data-loom-overlay]')].map(c => +getComputedStyle(c).opacity))()")
    # seek_debug launches puppeteer directly, so hand it the browser _browser() found (on the PC it comes from
    # HyperFrames, not from the env var: L-129)
    r = subprocess.run([which("node"), str(ROOT / "tools/node/seek_debug.mjs"), str(idx), "2.0", js], capture_output=True, text=True, timeout=180,
                       env=dict(os.environ, HYPERFRAMES_BROWSER_PATH=_browser()))
    assert r.returncode == 0, r.stderr[-400:]
    ops = json.loads(r.stdout)
    assert ops, "no overlay canvas found: the check measured nothing"          # a zero denominator is red
    assert all(o < 0.6 for o in ops), ops
    return f"{len(ops)} overlay canvas(es) at opacity {ops}"

@test
def switching_a_beat_keeps_both_ways_and_switches_back_exactly():
    from loom import options
    src = ROOT / "projects" / "_ss_story"
    if not src.exists():
        return "skipped (no _ss_story fork here)"
    tmp = Path(tempfile.mkdtemp(prefix="lmt_opt_"))
    try:
        (tmp / "plan").mkdir()
        shutil.copy2(src / "plan" / "storyboard.json", tmp / "plan" / "storyboard.json")
        class P:
            id = "tmp"
            def path(self, rel): return tmp / rel
        before = read_json(tmp / "plan" / "storyboard.json")
        L = options.listing(P())
        assert {r["beat"] for r in L} >= {"b02", "b11", "b22"}, L
        options.switch(P(), "b02", "illustrated bust")
        mid = read_json(tmp / "plan" / "storyboard.json")
        b02 = next(s_ for s_ in mid["scenes"] if s_["beat"] == "b02")
        assert b02["kind"] == "blueprint" and b02["blueprint"] == "hero.character_moment" and "design" not in b02, b02
        assert "acting character" in b02["alternatives"], b02["alternatives"]
        try:
            options.switch(P(), "b02", "no such look")
            raise AssertionError("an unknown option must be refused")
        except LoomError as e:
            assert "no option" in str(e), e
        options.switch(P(), "b02", "acting character")
        assert read_json(tmp / "plan" / "storyboard.json") == before, "switching back must restore the storyboard exactly"
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    # the gate refuses an alternative that could not be built
    assert options.validate(before) == [], options.validate(before)
    bad = {"scenes": [{"beat": "b01", "alternatives": {"x": {"props": {}}, "y": {"kind": "blueprint"}}}]}
    E = options.validate(bad)
    assert len(E) == 2 and "needs a kind" in E[0] and "names no blueprint" in E[1], E
    # the person's own answer wins: a lesson they asked to keep plain gets no story suggestions
    from loom.story import story_warnings
    beats = [f"b{i}" for i in range(1, 9)]
    bare = {"scenes": [{"beat": b, "kind": "template", "station": "s"} for b in beats]}
    assert story_warnings(bare, beats, genre="explainer")
    assert story_warnings(bare, beats, genre="explainer", look={"story": "plain"}) == []
    return "bust <-> acting character round trip exact; plain look is respected"

@test
def palette_study_finds_real_colours_and_keeps_near_accents_apart():
    """tools/palette_study.py on a synthetic video with a known palette: two close accents (orange and yellow)
    on a navy field must come back separately, as colours that exist in the video."""
    import importlib.util
    sp = importlib.util.spec_from_file_location("palette_study", ROOT / "tools" / "palette_study.py")
    P = importlib.util.module_from_spec(sp); sp.loader.exec_module(P)
    tmp = Path(tempfile.mkdtemp(prefix="lmt_pal_"))
    try:
        v = tmp / "synthetic.mp4"
        vf = "drawbox=x=200:y=200:w=400:h=300:color=0xFF8A3D:t=fill,drawbox=x=800:y=200:w=400:h=300:color=0xFFC94A:t=fill,drawbox=x=200:y=700:w=1200:h=80:color=0xFFF6E6:t=fill"
        r = subprocess.run([which("ffmpeg"), "-v", "error", "-y", "-f", "lavfi", "-i", "color=c=0x1B1F4B:s=1920x1080:d=3:r=10", "-vf", vf,
                            "-pix_fmt", "yuv420p", "-c:v", "libx264", "-crf", "18", str(v)], capture_output=True, text=True)
        assert r.returncode == 0, r.stderr[-300:]
        rep = P.study(v, 2.0)
        de = lambda a, b: float(np.linalg.norm(P.srgb_to_lab(P.rgbof(a)[None])[0] - P.srgb_to_lab(P.rgbof(b)[None])[0]))
        assert de(rep["field"], "#1B1F4B") < 5, rep["field"]
        acc = [a["hex"] for a in rep["accents"]]
        assert any(de(a, "#FF8A3D") < 5 for a in acc) and any(de(a, "#FFC94A") < 5 for a in acc), acc
        assert de(rep["ink"], "#FFF6E6") < 5, rep["ink"]
        assert rep["accent_pairs"] and rep["accent_pairs"][0]["frames_share"] > 0.9, rep["accent_pairs"]
        return f"field {rep['field']}, accents {acc[:2]}, ink {rep['ink']}"
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

@test
def video_note_checker_rejects_template_filler_and_keeps_real_notes():
    """tools/check_video_notes.py: the 2026-10-01 Gemini file was one template copied under 14 titles."""
    import importlib.util
    sp = importlib.util.spec_from_file_location("cvn", ROOT / "tools" / "check_video_notes.py")
    C = importlib.util.module_from_spec(sp); sp.loader.exec_module(C)
    seg = lambda a, b, txt: {"t_start": a, "t_end": b, "narration_paraphrase": txt, "role": "hook"}
    real = [{"video": {"title": t, "channel": "Ch", "url": "https://youtu.be/AAAAAAAAAA" + str(i), "published": d, "duration": dur},
             "learning": {"the_one_idea": idea},
             "segments": [seg("00:00", "01:00", idea + " opens"), seg("01:00", "03:00", idea + " develops"), seg("03:00", dur, idea + " lands")]}
            for i, (t, d, dur, idea) in enumerate([("How maglev trains float", "2024-03-01", "05:12", "magnets repel along a guideway"),
                                                     ("Why castles had moats", "2023-07-19", "04:48", "water slowed siege engines and mining"),
                                                     ("Your sense of direction", "2025-01-09", "05:31", "the hippocampus keeps a map of places")])]
    assert all(r["verdict"] == "usable" for r in C.check(real)), C.check(real)
    filler = [{"video": {"title": f"Channel Lesson {i}", "channel": "Ch", "url": "https://youtu.be/BBBBBBBBBB" + str(i), "published": "2023-01-01", "duration": "05:00"},
               "learning": {"the_one_idea": "Complex concepts can be understood through structured visual metaphors."},
               "segments": [seg("00:00", "00:45", "Opening hook introducing the core question.")]} for i in range(5)]
    rows = C.check(filler)
    assert all(r["verdict"] == "reject" for r in rows), rows
    assert any("near-identical" in f for f in rows[0]["flags"]) and any("placeholder" in f for f in rows[0]["flags"]), rows[0]
    sim = json.loads(json.dumps(real[0])); sim["could_not_see"] = "Actual video frames (simulated due to platform access limitations)."
    assert C.check([sim])[0]["verdict"] == "reject", C.check([sim])      # notes that admit they never saw the video
    got = C.check(json.loads((ROOT / "docs/research/gemini/_rejected/2026-10-01_master_video_analysis.json").read_text(encoding="utf-8")))
    assert len(got) == 14 and all(r["verdict"] == "reject" for r in got), [r["verdict"] for r in got]
    return "3 varied notes usable; template filler rejected (14 of 14 in the real file)"


@test
def video_study_finds_known_cuts_holds_and_quiet_and_reads_words():
    """tools/video_study.py on a synthetic 6 s video with hard cuts at 2 s and 4 s, a slow fade that is NOT a cut,
    a still stretch, and silence from 2 to 4 s. Also proves the gate can fail: a cut-free video must report 0 cuts,
    and the speech numbers must come from a words file that exists (a zero denominator is red, not green)."""
    import importlib.util
    sp = importlib.util.spec_from_file_location("video_study", ROOT / "tools" / "video_study.py")
    V = importlib.util.module_from_spec(sp); sp.loader.exec_module(V)
    tmp = Path(tempfile.mkdtemp(prefix="lmt_vs_"))
    try:
        ff = which("ffmpeg")
        cut = tmp / "cuts.mp4"
        # red 0-2 s, then green 2-4 s (fading slowly brighter), then blue 4-6 s; tone except 2-4 s
        vf = ("geq=r='if(lt(T,2),220,if(lt(T,4),20,20))':g='if(lt(T,2),30,if(lt(T,4),120+30*(T-2),30))':b='if(lt(T,4),30,220)'")
        r = subprocess.run([ff, "-v", "error", "-y", "-f", "lavfi", "-i", "color=c=black:s=320x180:d=6:r=10",
                            "-f", "lavfi", "-i", "aevalsrc='0.5*sin(440*2*PI*t)*(lt(t,2)+gte(t,4))':s=16000:d=6",
                            "-vf", vf, "-pix_fmt", "yuv420p", "-c:v", "libx264", "-crf", "18", "-c:a", "aac", "-shortest", str(cut)],
                           capture_output=True, text=True)
        assert r.returncode == 0, r.stderr[-300:]
        words = {"engine": "test", "rough": False,
                 "words": [{"w": f"w{i}", "s": 0.2 + i * 0.4, "e": 0.5 + i * 0.4} for i in range(10)],
                 "segments": [{"s": 0.2, "e": 4.1, "text": "One two three. Four five six seven? Eight nine ten."}]}
        (tmp / "cuts.words.json").write_text(json.dumps(words))
        rep = V.study(cut, tmp, sheet_every=2.0, words_dir=tmp)
        got = rep["cuts"]["times"]
        assert len(got) == 2 and abs(got[0] - 2.0) <= 0.4 and abs(got[1] - 4.0) <= 0.4, got   # the fade is not a cut
        assert rep["holds"]["count"] >= 1, rep["holds"]                                          # the red stretch is still
        q = rep["audio"]["quiet_gaps"]
        assert q and any(abs(g["start"] - 2.0) <= 0.5 and g["seconds"] >= 1.5 for g in q), q
        spc = rep["speech"]
        assert spc["words"] == 10 and spc["sentences"] == 3 and spc["questions"] == 1, spc
        assert abs(spc["wpm"] - 10 / ((0.5 + 9 * 0.4 - 0.2) / 60)) < 1, spc
        assert list(tmp.glob("cuts.sheet-*.jpg")), "no contact sheet"
        still = tmp / "still.mp4"
        subprocess.run([ff, "-v", "error", "-y", "-f", "lavfi", "-i", "color=c=0x334455:s=320x180:d=4:r=10", "-pix_fmt", "yuv420p", str(still)], check=True)
        rep2 = V.study(still, tmp, sheet_every=2.0, words_dir=tmp)
        assert rep2["cuts"]["count"] == 0 and "speech" not in rep2, rep2["cuts"]   # no words file, no speech numbers
        return f"cuts {got}, quiet {q[0]}, {spc['wpm']} wpm; still video 0 cuts"
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

@test
def transcribe_resumes_from_chunk_cache_and_splits_on_pauses():
    """tools/transcribe_videos.py: a run that was interrupted continues from the cached 60 s chunks (no engine
    needed), and the rough engine splits segments where the voice pauses for more than 0.6 s."""
    import importlib.util
    sp = importlib.util.spec_from_file_location("transcribe_videos", ROOT / "tools" / "transcribe_videos.py")
    T = importlib.util.module_from_spec(sp); sp.loader.exec_module(T)
    tmp = Path(tempfile.mkdtemp(prefix="lmt_tr_"))
    try:
        v = tmp / "talk.mp4"
        subprocess.run([which("ffmpeg"), "-v", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=16000:cl=mono", "-t", "70", str(v)], check=True)
        cdir = tmp / ".chunks" / "talk"; cdir.mkdir(parents=True)
        (cdir / "0000.json").write_text(json.dumps([{"w": "hello", "s": 1.0, "e": 1.4}, {"w": "there", "s": 1.5, "e": 1.9},
                                                    {"w": "again", "s": 3.0, "e": 3.4}]))
        (cdir / "0001.json").write_text(json.dumps([{"w": "later", "s": 61.0, "e": 61.5}]))
        rep = T.transcribe(v, tmp, engine="sphinx")
        assert rep["rough"] is True and [w["w"] for w in rep["words"]] == ["hello", "there", "again", "later"], rep["words"]
        assert [s["text"] for s in rep["segments"]] == ["hello there", "again", "later"], rep["segments"]
        assert (tmp / "talk.words.json").exists()
        return f"{len(rep['words'])} words from cache, {len(rep['segments'])} segments"
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


@test
def toon_shading_outlines_shapes_and_other_packs_are_untouched():
    """story-cartoon's toon shading puts an ink outline on rects, discs and polygons; a flat pack draws none (the
    change is opt-in, D-70). The same harness as the line-art test."""
    node = which("node")
    js = r"""
const vm = require("vm"), fs = require("fs"), path = require("path"); const rt = process.argv[1];
let made = [];
const mk = (tag) => { const e = { tagName: tag, attrs: {}, children: [], classList: { contains: () => false }, setAttribute(k, v) { this.attrs[k] = v; }, appendChild(c) { this.children.push(c); } }; made.push(e); return e; };
const ctx = { console, Math, JSON, Object, Array, String, Number, Promise, WeakMap, Map, Set };
ctx.window = ctx;
ctx.document = { createElement: () => ({ getContext: () => ({ measureText: () => ({ width: 0 }) }), style: {} }), createElementNS: (ns, tag) => mk(tag), head: { appendChild() {} }, fonts: { ready: Promise.resolve() } };
vm.createContext(ctx);
for (const f of ["core.js", "style.js", "kit.js"]) vm.runInContext(fs.readFileSync(path.join(rt, f), "utf8"), ctx);
const L = ctx.Loom; const load = (id) => JSON.parse(fs.readFileSync(path.join(rt, "..", "packs/styles", id + ".json"), "utf8"));
const draw = (id) => { L.style.pack = load(id); made = []; const g = mk("g");
  L.kit.rect(g, 0, 0, 100, 50, { fill: "accent" }); L.kit.disc(g, 50, 50, 20, { fill: "accent3" }); L.kit.polygon(g, [[0, 0], [10, 0], [5, 9]], { fill: "accent2" });
  const strokes = made.filter((e) => ["rect", "circle", "polygon"].includes(e.tagName) && e.attrs.stroke && e.attrs.stroke !== "none").map((e) => e.tagName + ":" + e.attrs.stroke);
  return { strokes, ink: L.style.pack.palette.ink }; };
console.log(JSON.stringify({ toon: draw("story-cartoon"), flat: draw("corporate-clean") }));
"""
    r = subprocess.run([node, "-e", js, str(ROOT / "runtime")], capture_output=True, text=True)
    assert r.returncode == 0, r.stderr[-500:]
    o = json.loads(r.stdout.strip().splitlines()[-1])
    ink = o["toon"]["ink"]
    for shape in ("rect", "circle", "polygon"):
        assert f"{shape}:{ink}" in o["toon"]["strokes"], (shape, o["toon"])      # every shape gets the outline
    assert o["flat"]["strokes"] == [], o["flat"]                                    # a flat pack draws no outline
    return f"toon outlines {len(o['toon']['strokes'])} shapes in {ink}; corporate-clean draws none"

@test
def outlined_people_have_every_pose_and_gesture_of_the_first_rigs():
    """runtime/rigs/beans.js: pip, tess and extra must accept every pose, gesture and part a scene can ask of ava,
    or a storyboard that switches cast would break at build time."""
    node = which("node")
    js = r"""
const vm = require("vm"), fs = require("fs"), path = require("path"); const rt = process.argv[1];
const ctx = { console, Math, JSON, Object, Array, String, Number }; ctx.window = ctx; ctx.Loom = { };
vm.createContext(ctx);
vm.runInContext("window.Loom.rig = { defs: {}, define(id, d) { d.id = id; this.defs[id] = d; return d; } };", ctx);
for (const f of ["rigs/people.js", "rigs/beans.js"]) vm.runInContext(fs.readFileSync(path.join(rt, f), "utf8"), ctx);
const D = ctx.Loom.rig.defs, k = (o) => Object.keys(o).sort().join(",");
console.log(JSON.stringify(Object.fromEntries(Object.entries(D).map(([id, d]) => [id, { poses: k(d.poses), gestures: k(d.gestures), parts: d.parts.map((p) => p.name).sort().join(","), size: d.size }]))));
"""
    r = subprocess.run([node, "-e", js, str(ROOT / "runtime")], capture_output=True, text=True)
    assert r.returncode == 0, r.stderr[-500:]
    D = json.loads(r.stdout.strip().splitlines()[-1])
    assert {"pip", "tess", "extra"} <= set(D), sorted(D)
    # the storyboard's cast check must know every rig the runtime defines (it missed the bean() rigs, L-140)
    from loom import story as _story
    W = [w for w in _story.story_warnings({"story": {"cast": [{"name": n, "rig": n} for n in sorted(D)] + [{"name": "x", "rig": "nobody"}]}, "scenes": []}, []) if "no rig" in w]
    assert len(W) == 1 and "'nobody'" in W[0], W                                    # every real rig known; a fake one flagged
    for rid in ("pip", "tess", "extra"):
        for key in ("poses", "gestures", "parts", "size"):
            assert D[rid][key] == D["ava"][key], (rid, key, D[rid][key], D["ava"][key])
    return f"{len(D)} rigs, pip/tess/extra match ava's {D['ava']['poses'].count(',') + 1} poses"

@test
def new_registers_render_clean_in_the_lab():
    if not _browser():
        return "skipped (no browser here; set HYPERFRAMES_BROWSER_PATH)"
    from loom import lab
    T = tempfile.mkdtemp(prefix="lmt_reg_")
    try:
        cases = (("lab_story_set", "story-cartoon"), ("lab_matrix_build", "presenter-pop"), ("lab_one_board", "chalk-lab"), ("lab_story_set", "corporate-clean"),
                 ("lab_glow_inside", "glow-flat"), ("lab_glow_pressure", "glow-flat"), ("lab_glow_world", "glow-flat"))   # D-78
        for sc, st in cases:
            r = lab.strip(sc, st, [1.6, 5.4], out_dir=T, frames_dir=Path(T) / "frames")
            assert not r["errors"], (sc, st, r["errors"])
        assert len(list((Path(T) / "frames").glob("*.png"))) == 2 * len(cases)
        planted = ROOT / "scenes_examples" / "lab" / "_planted_scenery.js"
        planted.write_text('// @lab {"dur": 1.0, "times": [0.5]}\nLoom.scene("_planted_scenery", { build(ctx) { Loom.scenery.sign(ctx.g, 0, 0, 60, 40, "A sign far too long to fit in a box this small"); } });\n', encoding="utf-8")
        try:
            r = lab.strip("_planted_scenery", "story-cartoon", [0.5], out_dir=T)
            assert any("text_overflow" in e for e in r["errors"]), r["errors"]          # props are held to the text gates too
        finally:
            planted.unlink()
        return "4 registers (incl. glow-flat x3) + an existing pack clean; an overfull sign is reported"
    finally:
        shutil.rmtree(T, ignore_errors=True)

@test
def glow_builders_run_clean_and_deterministic_in_glow_flat_and_in_another_pack():
    """runtime/glow.js (D-78) through the browser-free preview harness (tools/node/svg_preview.mjs): the three glow
    lab scenes build with no runtime error in glow-flat AND flat-cosmos (glow-only tokens fall back), and the same
    build twice gives byte-identical frames (determinism). A planted Math.random scene must differ between runs,
    so the determinism check can fail."""
    from loom import lab
    node = which("node")
    def run(scene, style):
        tmp, meta, st, times = lab.page(scene, style, [1.6, 5.4])
        out = tmp / "pv"
        r = subprocess.run([node, str(ROOT / "tools/node/svg_preview.mjs"), str(tmp), str(out)], capture_output=True, text=True, timeout=300)
        assert r.returncode == 0, r.stderr[-800:]
        rep = json.loads((out / "report.json").read_text())
        frames = [Path(x["file"]).read_bytes() for x in rep["shots"]]
        shutil.rmtree(tmp, ignore_errors=True)
        return rep, frames
    n = 0
    for sc in ("lab_glow_inside", "lab_glow_pressure", "lab_glow_world"):
        for st in ("glow-flat", "flat-cosmos"):
            rep, a = run(sc, st)
            errs = [e for e in rep["errors"] if e.get("code") != "font_not_loaded"]
            assert not errs, (sc, st, errs[:3])
            assert len(a) == 2 and all(len(x) > 2000 for x in a), (sc, st, [len(x) for x in a])
            if st == "glow-flat":
                _, b = run(sc, st)
                assert a == b, f"{sc} is not deterministic"
            n += 1
    planted = ROOT / "scenes_examples" / "lab" / "_planted_random.js"
    planted.write_text('// @lab {"dur": 1.0, "times": [0.5]}\nLoom.scene("_planted_random", { build(ctx) { Loom.kit.rect(ctx.g, Math.random() * 900, 0, 50, 50, {}); } });\n', encoding="utf-8")
    try:
        _, a = run("_planted_random", "glow-flat"); _, b = run("_planted_random", "glow-flat")
        assert a != b, "the determinism check cannot tell a random scene from a seeded one"
    finally:
        planted.unlink()
    return f"{n} scene/pack builds clean; glow scenes byte-identical across runs; a Math.random scene is caught"


@test
def variety_ledger_sees_repetition_and_the_tells_ratchet_can_fail():
    """loom/checks/variety.py (D-79): two lessons built from the same components overlap fully, a different one
    barely; pointer pills, hero icons, pops and wallpaper grounds are measured; a lesson worse than the baseline's
    worst fails while one inside it passes; and a ledger of one lesson is not a result."""
    from loom.checks import variety as V
    tmp = Path(tempfile.mkdtemp(prefix="lmt_var_"))
    try:
        def lesson(name, created, scenes, js):
            d = tmp / name; (d / "plan").mkdir(parents=True); (d / "scenes").mkdir()
            (d / "project.json").write_text(json.dumps({"created": created, "request": {"style": "glow-flat"}}))
            (d / "plan" / "storyboard.json").write_text(json.dumps({"style": "glow-flat", "scenes": scenes}))
            for k, v in js.items():
                (d / "scenes" / f"{k}.js").write_text(v)
            return d
        same_js = {"b01": '// @design label_board: x\n// @form pointer_label: x\nG.ground(ctx, "bg", {});\nG.pill(g, 1, 2, "A", { point: [1, 2] });\nk.icon(g, "mail", { size: 80 });\nm.pop(E, 1);\n'}
        sb = [{"beat": "b01", "kind": "bespoke"}, {"beat": "b02", "kind": "template", "template": "definition"}]
        a = lesson("a", "2026-01-01", sb, same_js)
        b = lesson("b", "2026-01-02", sb, same_js)
        c = lesson("c", "2026-01-03", [{"beat": "b01", "kind": "bespoke"}],
                   {"b01": '// @design inner_city: y\nG.coral(g, 1, 2, 3, {});\nG.ground(ctx, "bg", {});\nG.pill(g, 1, 2, "B", {});\nm.draw(E, 1);\n'})
        dirs = V.lessons(tmp)
        assert [d.name for d in dirs] == ["a", "b", "c"], dirs                 # ordered by creation
        P = [V.profile(d) for d in dirs]
        rep = V.ledger(P)
        rows = {r["id"]: r for r in rep["lessons"]}
        assert rows["b"]["overlaps"]["a"] == 1.0, rows["b"]                    # same components: full overlap
        assert rows["c"]["max_overlap"] < 0.3, rows["c"]                       # different look: low overlap
        T = V.tells(P[0])
        assert T["pointer_pill_share"] == 1.0 and T["hero_icon_rate"] == 1.0 and T["pop_settle_share"] == 1.0, T
        assert T["wallpaper_share"] == 1.0 and T["template_share"] == 0.5, T
        assert V.tells(P[2])["wallpaper_share"] == 0.0                         # coral is a place, not wallpaper
        base = V.baseline_from([P[2]])                                         # a clean baseline
        E, W = V.judge(P[0], base)
        assert any("pointer_pill_share" in e for e in E), E                     # worse than the worst: fails
        assert V.judge(P[2], base)[0] == [], V.judge(P[2], base)                # inside the baseline: passes
        orig = V.lessons
        try:
            V.lessons = lambda root=None, include_demo=False: [a]               # one lesson only
            assert V.main() == 2                                                # a ledger of one is not a result
        finally:
            V.lessons = orig
        return f"overlap a/b {rows['b']['overlaps']['a']}, c {rows['c']['max_overlap']}; ratchet fails a worse lesson"
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


@test
def design_seed_changes_the_form_of_the_essentials_and_the_ledger_keys_them_by_treatment():
    """D-80/D-81: the essentials stay, their FORM varies per lesson.
    - the runtime's option lists (runtime/treat.js) match the vocabulary (packs/seeds/treatments.json);
    - the chooser is deterministic, follows the subject's material, moves AWAY from the previous lesson's seed,
      honours the person's override, rejects an unknown option and respects the style's shading;
    - the treatments lab scene builds clean under every seed in its meta, the seeds draw DIFFERENT frames, a seed
      twice draws the same bytes, the report records what was drawn, and a seed of only defaults leaves a glow
      scene byte-identical to no seed (D-70: nothing changes without a seed);
    - the ledger keys essentials by treatment: two lessons with speech bubbles in different treatments share no
      bubble key, the same treatment does, and a bespoke @form bubble counts as the classic look."""
    import re as _re
    from loom import lab, seed as SD
    from loom.checks import variety as V
    from loom.util import LoomError
    voc = SD.vocabulary()
    src = (ROOT / "runtime" / "treat.js").read_text(encoding="utf-8")
    block = src[src.index("T.OPTIONS = {"):src.index("};", src.index("T.OPTIONS = {"))]
    rt = {m.group(1): _re.findall(r'"(\w+)"', m.group(2)) for m in _re.finditer(r"(\w+): \[([^\]]*)\]", block)}
    assert rt == {k: list(v) for k, v in voc["axes"].items()}, (rt, list(voc["axes"]))
    # the chooser
    tmp = Path(tempfile.mkdtemp(prefix="lmt_seed_"))
    try:
        d = tmp / "x"; (d / "plan").mkdir(parents=True)
        (d / "project.json").write_text(json.dumps({"topic": "Why stress hits the body at night", "created": "2026-01-02"}))
        A = SD.choose(d, recent=[], shading="gloss")
        assert A["material"] == "body" and A["seed"]["shape"] == "organic" and A["seed"]["label"] == "tag", A["seed"]
        assert SD.choose(d, recent=[], shading="gloss")["seed"] == A["seed"]                       # deterministic
        B = SD.choose(d, recent=[("prev", A["seed"])], shading="gloss")
        moved = [k for k in SD.AXES if B["seed"][k] != A["seed"][k]]
        assert len(moved) >= 8, (moved, B["seed"])                                                # away from the last lesson
        C = SD.choose(d, overrides={"bubble": "chat"}, recent=[], shading="gloss")
        assert C["seed"]["bubble"] == "chat" and C["reasons"]["bubble"] == "chosen by the person"
        try:
            SD.choose(d, overrides={"bubble": "balloon"}, recent=[]); raise AssertionError("an unknown option was accepted")
        except LoomError:
            pass
        assert SD.choose(d, recent=[], shading="line", text="glass glass")["seed"]["panel"] not in ("glass", "cutout")
        # the ledger keys essentials by treatment
        def lesson(name, created, js, seed=None):
            p = tmp / "L" / name; (p / "plan").mkdir(parents=True); (p / "scenes").mkdir()
            (p / "project.json").write_text(json.dumps({"created": created}))
            (p / "plan" / "storyboard.json").write_text(json.dumps({"style": "glow-flat", "scenes": [{"beat": "b01", "kind": "bespoke"}]}))
            (p / "scenes" / "b01.js").write_text(js)
            if seed:
                (p / "plan" / "design_seed.json").write_text(json.dumps({"seed": seed}))
            return p
        js = 'T.bubble(ctx, "say", { x: 1, y: 2, text: "Hi" });\n'
        P1 = V.profile(lesson("a", "2026-01-01", js, {"bubble": "chat"}))
        P2 = V.profile(lesson("b", "2026-01-02", js, {"bubble": "note"}))
        P3 = V.profile(lesson("c", "2026-01-03", js, {"bubble": "chat"}))
        P4 = V.profile(lesson("d", "2026-01-04", "// @form speech_bubble: a bubble drawn by hand\n"))
        assert "essential:bubble@chat" in P1["signature"] and "essential:bubble@note" in P2["signature"], (P1["signature"], P2["signature"])
        assert not [s for s in P1["signature"] & P2["signature"] if s.startswith("essential:")]     # different forms: nothing shared
        assert "essential:bubble@chat" in P1["signature"] & P3["signature"]                          # same form: shared
        assert "essential:bubble@classic" in P4["signature"] and V.tells(P4)["classic_share"] == 1.0
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    # the runtime, through the browser-free preview
    node = which("node")
    def run(scene, style, seed):
        tmp2, meta, st, times = lab.page(scene, style, [2.8, 10.6] if scene == "lab_treat_essentials" else [1.6, 5.4], seed=seed)
        out = tmp2 / "pv"
        r = subprocess.run([node, str(ROOT / "tools/node/svg_preview.mjs"), str(tmp2), str(out)], capture_output=True, text=True, timeout=300)
        assert r.returncode == 0, r.stderr[-800:]
        rep = json.loads((out / "report.json").read_text())
        frames = [Path(x["file"]).read_bytes() for x in rep["shots"]]
        shutil.rmtree(tmp2, ignore_errors=True)
        return rep, frames
    meta = lab._meta((lab.LAB / "lab_treat_essentials.js").read_text(encoding="utf-8"))
    seen = {}
    for sd in meta["seeds"]:
        s = {k: v for k, v in sd.items() if k != "name"} or None
        rep, fr = run("lab_treat_essentials", "glow-flat", s)
        errs = [e for e in rep["errors"] if e.get("code") != "font_not_loaded"]
        assert not errs, (sd["name"], errs[:3])
        drawn = {(t["axis"], t["as"]) for t in rep.get("treatments", [])}
        want = {(ax, (s or {}).get(ax, voc["defaults"][ax])) for ax in ("label", "bubble", "panel", "icon", "mark")}
        if s:
            want.add(("icon", "object"))   # the hero-size calendar and mail ask for drawn objects (object: true; opt-in since D-100)
        assert want <= drawn, (sd["name"], want - drawn)
        seen[sd["name"]] = fr
    names = list(seen)
    assert len({tuple(f) for f in seen.values()}) == len(names), "two seeds drew the same frames"
    _, again = run("lab_treat_essentials", "glow-flat", {k: v for k, v in meta["seeds"][1].items() if k != "name"})
    assert again == seen[meta["seeds"][1]["name"]], "a seed is not deterministic"
    _, plain = run("lab_glow_inside", "glow-flat", None)
    _, dflt = run("lab_glow_inside", "glow-flat", {"label": "pill"})
    assert plain == dflt, "a seed of only defaults changed a glow scene"
    return f"vocabulary == runtime; chooser moves {len(moved)}/9 axes away from the last lesson; {len(names)} seeds draw {len(names)} different frames; ledger keys bubbles by treatment"


@test
def objects_places_and_seeded_templates_draw_clean_vary_by_seed_and_stay_deterministic():
    """D-82 to D-84 through the browser-free preview:
    - lab_objects: twelve objects build clean under every seed; the seeds draw different frames and pick different
      families; a seed twice gives the same bytes; an unknown object kind is an error (the check can fail);
    - lab_places: five places build clean, five camera moves are recorded, the camera really moves the picture
      (the frame mid-push differs from the frame before it) and the build is deterministic;
    - lab_tpl_definition: the definition template under a seed differs from the classic one and builds clean."""
    from loom import lab
    node = which("node")
    def run(scene, style, seed, times):
        tmp, meta, st, _ = lab.page(scene, style, times, seed=seed)
        out = tmp / "pv"
        r = subprocess.run([node, str(ROOT / "tools/node/svg_preview.mjs"), str(tmp), str(out)], capture_output=True, text=True, timeout=300)
        assert r.returncode == 0, r.stderr[-800:]
        rep = json.loads((out / "report.json").read_text())
        frames = [Path(x["file"]).read_bytes() for x in rep["shots"]]
        shutil.rmtree(tmp, ignore_errors=True)
        return rep, frames
    clean = lambda rep: [e for e in rep["errors"] if e.get("code") != "font_not_loaded"]
    meta = lab._meta((lab.LAB / "lab_objects.js").read_text(encoding="utf-8"))
    frames, fams = {}, {}
    for sd in meta["seeds"]:
        s = {k: v for k, v in sd.items() if k != "name"} or None
        rep, fr = run("lab_objects", "glow-flat", s, [5.8])
        assert not clean(rep), (sd["name"], clean(rep)[:3])
        fams[sd["name"]] = {t["as"] for t in rep["treatments"] if t["axis"] == "object"}
        assert len(fams[sd["name"]]) == 12, fams[sd["name"]]
        frames[sd["name"]] = fr
    assert len({tuple(v) for v in frames.values()}) == len(frames), "two seeds drew the same objects"
    assert len(fams["classic"] ^ fams["tech"]) >= 6, (fams["classic"], fams["tech"])        # families really change
    s1 = {k: v for k, v in meta["seeds"][3].items() if k != "name"}
    assert run("lab_objects", "glow-flat", s1, [5.8])[1] == frames[meta["seeds"][3]["name"]], "objects are not deterministic"
    planted = ROOT / "scenes_examples" / "lab" / "_planted_object.js"
    planted.write_text('// @lab {"dur": 1.0, "times": [0.5]}\nLoom.scene("_planted_object", { build(ctx) { Loom.obj.draw(ctx, "x", "spaceship", { x: 500, y: 500 }); } });\n', encoding="utf-8")
    try:
        rep, _ = run("_planted_object", "glow-flat", None, [0.5])
        assert any(e.get("code") == "object_missing" for e in rep["errors"]), rep["errors"][:3]
    finally:
        planted.unlink()
    rep, a = run("lab_places", "glow-flat", None, [1.1, 3.0, 6.8, 11.6, 19.2])
    assert not clean(rep), clean(rep)[:3]
    cams = [t for t in rep.get("tweens", []) if t.get("kind") == "camera"]
    assert len(cams) == 5, cams
    assert a[0] != a[1], "the push did not move the picture"
    _, b = run("lab_places", "glow-flat", None, [1.1, 3.0, 6.8, 11.6, 19.2])
    assert a == b, "places are not deterministic"
    tm = lab._meta((lab.LAB / "lab_tpl_definition.js").read_text(encoding="utf-8"))
    r0, f0 = run("lab_tpl_definition", "glow-flat", None, [4.8])
    r1, f1 = run("lab_tpl_definition", "glow-flat", {k: v for k, v in tm["seeds"][2].items() if k != "name"}, [4.8])
    assert not clean(r0) and not clean(r1), (clean(r0)[:2], clean(r1)[:2])
    assert f0 != f1, "the definition template ignores the seed"
    return f"12 objects x {len(frames)} seeds clean and distinct; unknown object caught; 5 camera moves move the picture; template follows the seed"


@test
def ai_tells_lint_names_the_beats_and_the_seed_defaults_for_new_lessons_only():
    """D-82, D-85: the one-radius and still-beat tells are measured and name their beats; a lesson outside the
    baseline with no seed is warned, a cleared one is not; a seed whose camera habit is never used is warned;
    `go` gives a NEW lesson the engine's seed, never an existing lesson, and --clear blocks it."""
    from loom.checks import variety as V
    from loom import seed as SD
    tmp = Path(tempfile.mkdtemp(prefix="lmt_tells_"))
    try:
        def lesson(name, created, js, seed=None, cleared=False, storyboard=True):
            d = tmp / name; (d / "plan").mkdir(parents=True); (d / "scenes").mkdir()
            (d / "project.json").write_text(json.dumps({"created": created, "topic": "server incident handover"}))
            if storyboard:
                (d / "plan" / "storyboard.json").write_text(json.dumps({"style": "glow-flat", "scenes": [{"beat": b, "kind": "bespoke"} for b in js]}))
            for b, code in js.items():
                (d / "scenes" / f"{b}.js").write_text(code)
            if seed or cleared:
                (d / "plan" / "design_seed.json").write_text(json.dumps({"seed": seed, "cleared": cleared}))
            return d
        flat = 'k.rect(g, 0, 0, 100, 100, {});\nk.rect(g, 0, 0, 100, 100, {});\nk.card(g, 0, 0, 90, 90, { r: 30 });\n'
        A = V.profile(lesson("a", "2026-01-01", {"b01": flat, "b02": flat + "Loom.cam.push(P, { t0: 1, t1: 2 });\n"}))
        T = V.tells(A)
        assert abs(T["one_radius_share"] - 4 / 6) < 0.01, T                                   # 4 of 6 boxes share the default
        assert T["still_share"] == 0.5 and A["culprits"]["still_share"] == ["b01"], (T, A["culprits"])
        base = {"metrics": {"still_share": {"worst": 0.9, "median": 0.2}}, "lessons": []}
        E, W = V.judge(A, base)
        assert any("still_share" in w and "b01" in w for w in W), W                              # names the beat
        assert any("no design seed" in w for w in W), W                                          # a new lesson with no seed
        Bc = V.profile(lesson("b", "2026-01-02", {"b01": flat}, cleared=True))
        assert not any("no design seed" in w for w in V.judge(Bc, base)[1])                     # cleared on purpose: fine
        Cp = V.profile(lesson("c", "2026-01-03", {"b01": flat, "b02": flat}, seed={"camera": "push", "bubble": "chat"}))
        assert any("camera habit" in w for w in V.judge(Cp, base)[1]), V.judge(Cp, base)[1]     # a habit never used
        new = lesson("n", "2026-01-04", {}, storyboard=False)
        D = SD.ensure_default(new)
        assert D and (new / "plan" / "design_seed.json").exists() and D["material"] == "tech", D and D["material"]
        assert SD.ensure_default(new) is None                                                    # never twice
        old = lesson("o", "2026-01-05", {"b01": flat})
        assert SD.ensure_default(old) is None and not (old / "plan" / "design_seed.json").exists()   # existing lesson: untouched
        clr = lesson("x", "2026-01-06", {}, cleared=True, storyboard=False)
        assert SD.ensure_default(clr) is None and SD.seed_of(clr) is None                         # the opt-out holds
        return "radius and still tells measured with beats named; seed warnings fire and respect --clear; default seed only for new lessons"
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


@test
def rig_review_measures_expressions_from_the_files_and_refuses_an_empty_delivery():
    """tools/rig_review.py (D-86): two face variants that differ are measured apart, two identical ones measure 0
    (the measure can tell), a batch without the delivery's engine says so instead of inventing poses, and an
    empty manifest is not a result (exit 2)."""
    if _no_cairo():
        return _no_cairo()
    import importlib.util
    spec = importlib.util.spec_from_file_location("rig_review", ROOT / "tools" / "rig_review.py"); RR = importlib.util.module_from_spec(spec); spec.loader.exec_module(RR)
    tmp = Path(tempfile.mkdtemp(prefix="lmt_rig_"))
    try:
        b = tmp / "batch"; (b / "maya").mkdir(parents=True)
        def part(name, body):
            (b / "maya" / f"{name}.svg").write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 2000" width="1000" height="2000">{body}</svg>')
        part("head", '<circle cx="500" cy="470" r="120" fill="#E8B894"/>')
        part("face_neutral", '<rect x="440" y="540" width="120" height="10" fill="#222"/>')
        part("face_smile", '<path d="M430 520 Q500 600 570 520" stroke="#222" stroke-width="14" fill="none"/><circle cx="455" cy="455" r="14" fill="#222"/>')
        part("face_same", '<rect x="440" y="540" width="120" height="10" fill="#222"/>')
        man = {"assets": [{"file": "maya/head.svg", "part": "head", "view": "front", "kind": "character_part"}] +
               [{"file": f"maya/face_{v}.svg", "part": "face", "variant": v, "view": "front", "kind": "character_part"} for v in ("neutral", "smile", "same")]}
        (b / "manifest.json").write_text(json.dumps(man))
        assert RR.main([str(b), "--out", str(tmp / "out")]) == 0
        d = json.loads((tmp / "out" / "expression_distance.json").read_text())["all"]
        assert d["neutral / same"] == 0.0, d                                  # identical faces: zero
        assert d["neutral / smile"] > 2.0, d                                  # different faces: measured apart
        r = json.loads((tmp / "out" / "review.json").read_text())
        assert r["poses"] is None and r["joints"] is None, r                  # no engine: no invented poses
        # the second delivery shape (v3): builds as data on the review page, plus a figure baked into the page.
        # Each is rebuilt from the delivered files; a part the delivery lacks and a baked part nested some other way
        # are both counted, never dropped silently
        pg = b / "_page"; pg.mkdir()
        builds = {"b0": [["maya/head", "matrix(1 0 0 1 0 0)"], ["maya/face_smile", "matrix(1 0 0 1 0 0)"], ["maya/arm_gone", "matrix(1 0 0 1 0 0)"]]}
        nested = lambda a: f'<svg data-asset="{a}" viewBox="0 0 1000 2000" width="1000" height="2000"><rect width="1" height="1" fill="#222"/></svg>'
        (pg / "index.html").write_text('<html><body><h2>1 · TURNAROUND</h2><svg viewBox="0 0 1000 2000" data-build="b0"></svg> front neutral'
            f'<h2>2 · STAND</h2><svg viewBox="0 0 1000 2000" data-pose="stand"><g transform="rotate(2)">{nested("maya/head")}</g><g><g transform="x">{nested("maya/face_smile")}</g></g><g id="odd">{nested("maya/face_neutral")}</g></svg> idle'
            f'<script type="application/json" id="loom-builds">{json.dumps(builds)}</script></body></html>')
        man["assets"] = man["assets"]
        (b / "manifest.json").write_text(json.dumps(man))
        assert RR.main([str(b), "--out", str(tmp / "out3")]) == 0
        pb = json.loads((tmp / "out3" / "review.json").read_text())["page_builds"]
        assert pb["rebuilt"] == 2 and pb["baked_figures"] == 1, pb              # the build and the baked figure
        assert pb["missing_parts"] == {"maya/arm_gone": 1}, pb                 # a part the delivery lacks is named
        assert pb["baked_parts_unread"] == {"pose:stand": 1}, pb               # the oddly nested part is counted
        assert pb["sheets"], pb
        (b / "manifest.json").write_text(json.dumps({"assets": []}))
        assert RR.main([str(b), "--out", str(tmp / "out2")]) == 2             # an empty delivery is not a result
        return (f"distance neutral/smile {d['neutral / smile']}, identical 0.0; no engine -> no poses; page builds rebuilt "
                f"{pb['rebuilt']} with the missing part named; empty -> exit 2")
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


@test
def reference_boards_are_a_ratchet_new_drawn_work_needs_one():
    """tools/ref_board.py (D-87): the office has a real board (a link, not an empty template); the check passes at the
    baseline; a NEW place added to the runtime without a board makes it fail; an empty template does not count."""
    import importlib.util
    spec = importlib.util.spec_from_file_location("ref_board", ROOT / "tools" / "ref_board.py"); RB = importlib.util.module_from_spec(spec); spec.loader.exec_module(RB)
    assert RB.has_board("places", "office"), "the office board is missing or has no reference link"
    assert RB.main(["check"]) == 0
    orig = RB.drawn_kinds
    try:
        RB.drawn_kinds = lambda: {"places": orig()["places"] + ["lighthouse"], "objects": orig()["objects"]}
        assert RB.main(["check"]) == 1, "a new place without a board must fail the ratchet"
    finally:
        RB.drawn_kinds = orig
    tmp = RB.REFS / "places" / "_tmp_empty.md"
    try:
        tmp.write_text(RB.TEMPLATE.format(title="x", date="2026-01-01").replace("<url>", "no link"), encoding="utf-8")
        assert not RB.has_board("places", "_tmp_empty"), "an empty template counted as a board"
    finally:
        tmp.unlink()
    return f"office board real; {len(RB.missing())} gaps recorded; a new board-less place fails; an empty template does not count"


@test
def vendor_art_comes_only_from_approved_sets_and_builds_clean():
    """loom/vendor_art.py + runtime/art.js (D-88): every approved set names a licence and where it was verified, and
    none is paid, share-alike or attribution-only; a Fluent reference resolves; an unknown set and an unknown piece are
    errors, not gaps; refs in an array are embedded; the lab scene builds clean;
    the fetch tool refuses a set that is not approved."""
    from loom import vendor_art as VA, lab
    VA.sources.cache_clear()
    S = VA.sources()
    assert {"fluent", "doodles", "lukasz", "kenney"} <= set(S), S.keys()
    # the licence is a closed value (the fetch tool writes it into LICENSE.txt, `loom art` prints it); provenance goes in
    # `origin`. A set registered for a lab bake-off whose licence is not cleared says so (`cleared: false`) and a lesson
    # build refuses it (B6, 2026-10-08: e2kit wrote "CC0 1.0 (Loom's own)", e2gen's model output is not cleared)
    for sid, s_ in S.items():
        if s_.get("cleared") is False:
            assert s_.get("cleared_note") and s_.get("verified_from"), (sid, s_)
            continue
        assert s_.get("licence") in ("MIT", "CC0 1.0") and s_.get("verified_from") and s_.get("licence_url"), (sid, s_)
    for sid in [k for k, v in S.items() if v.get("cleared") is False]:
        ref = f"{sid}:{(S[sid].get('files') or ['x'])[0]}"
        _, err = VA.resolve(ref, lesson=True)
        assert err and "not cleared for a lesson" in err, (ref, err)
        assert any("not cleared" in x for x in VA.embed([f'Loom.art.shape(g, "{ref}", 0, 0, 9)'], lesson=True)[1]), ref
    a, e = VA.resolve("fluent:light-bulb")
    if e and "not installed" in e:
        return "SKIP: run npm install (Fluent Emoji is an npm dependency)"
    assert a and a["licence"] == "MIT" and "<path" in a["body"], (a, e)
    assert VA.resolve("openmoji:apple")[1], "an unapproved set resolved"
    assert VA.resolve("fluent:no-such-thing")[1], "an unknown piece resolved"
    refs = VA.refs_in(['const xs = ["fluent:books", "fluent:key"]; Loom.art.shape(g, "nope:thing", 1, 2, 3);'])
    assert refs == {"fluent:books", "fluent:key", "nope:thing"}, refs
    art, errs = VA.embed(['["fluent:books", "nope:thing"]; Loom.art.shape(g, "nope:thing", 0, 0, 9)'])
    assert "fluent:books" in art and any("not an approved set" in x for x in errs), (list(art), errs)
    node = which("node")
    def run(scene):
        tmp, meta, st, _ = lab.page(scene, "glow-flat", [3.6])
        out = tmp / "pv"
        r = subprocess.run([node, str(ROOT / "tools/node/svg_preview.mjs"), str(tmp), str(out)], capture_output=True, text=True, timeout=300)
        assert r.returncode == 0, r.stderr[-800:]
        rep = json.loads((out / "report.json").read_text()); svgt = Path(rep["shots"][0]["file"]).read_text()
        shutil.rmtree(tmp, ignore_errors=True)
        return rep, svgt
    rep, svgt = run("lab_vendor_art")
    errs = [x for x in rep["errors"] if x.get("code") != "font_not_loaded"]
    assert not errs, errs[:3]
    used = {t["as"] for t in rep.get("treatments", []) if t["axis"] == "art"}
    assert len(used) >= 12, used
    import importlib.util
    spec = importlib.util.spec_from_file_location("fetch_assets", ROOT / "tools" / "fetch_assets.py"); FA = importlib.util.module_from_spec(spec); spec.loader.exec_module(FA)
    assert FA.main(["openmoji"]) == 2, "the fetch tool accepted a set that is not approved"
    assert FA.main(["--check"]) == 0
    lab_only = sorted(k for k, v in S.items() if v.get("cleared") is False)
    return (f"{len(S) - len(lab_only)} approved sets, all MIT/CC0 with a verified source; {lab_only} lab-only, refused in a lesson; "
            f"{len(used)} pieces placed clean; unknown set and piece refused")


@test
def style_fingerprint_tells_a_cartoon_from_a_slide_from_a_board():
    """tools/style_fingerprint.py on three synthetic frames with known answers, and a zero-frame source is an
    error, not a pass (Rule 0: a zero denominator is red)."""
    import importlib.util
    from PIL import Image, ImageDraw
    sp = importlib.util.spec_from_file_location("style_fingerprint", ROOT / "tools" / "style_fingerprint.py")
    F = importlib.util.module_from_spec(sp); sp.loader.exec_module(F)
    tmp = Path(tempfile.mkdtemp(prefix="lmt_fp_"))
    try:
        def save(name, draw, bg):
            d = tmp / name; d.mkdir()
            im = Image.new("RGB", (1280, 720), bg); draw(ImageDraw.Draw(im)); im.save(d / "f.png"); return d
        def cartoon(D):   # a set: wall, floor, furniture and people, all outlined
            D.rectangle([0, 520, 1280, 720], fill=(200, 180, 150), outline=(40, 30, 25), width=6)
            for i in range(6):
                D.rectangle([60 + i * 200, 200 + (i % 2) * 60, 200 + i * 200, 520], fill=[(190, 90, 60), (90, 150, 140), (220, 170, 70)][i % 3], outline=(40, 30, 25), width=6)
                D.ellipse([80 + i * 200, 90, 180 + i * 200, 190], fill=(230, 190, 150), outline=(40, 30, 25), width=6)
        slide = lambda D: D.rounded_rectangle([540, 300, 740, 400], 12, fill=(240, 240, 245))
        board = lambda D: [D.line([200 + i * 160, 200, 260 + i * 160, 520], fill=(235, 235, 235), width=2) for i in range(6)]
        c = F.fingerprint(save("cartoon", cartoon, (236, 228, 214)))
        s = F.fingerprint(save("slide", slide, (252, 252, 252)))
        b = F.fingerprint(save("board", board, (10, 10, 12)))
        assert c["outline"] > 5 * max(s["outline"], 1e-4), (c["outline"], s["outline"])
        assert c["drawn"] > 0.3 and s["drawn"] < 0.1, (c["drawn"], s["drawn"])
        assert c["covered"] > 0.4 and s["covered"] < 0.1 and s["sparse"] == 1.0, (c["covered"], s["covered"])
        assert b["dark"] > 0.9 and b["lightline"] > 0 and b["light"] < 30, b
        empty = tmp / "empty"; empty.mkdir()
        e = F.fingerprint(empty)
        assert e.get("error") and e["measured"] == 0, e                                 # nothing measured is a failure
        # one label for several inputs renamed the first and read like a pooled row (L-130): refused now
        two = [str(tmp / "slide"), str(tmp / "board")]
        assert F.main(two + ["--label", "all"]) == 2
        assert F.main(two + ["--label", "s", "--label", "b"]) == 0
        return f"outline {c['outline']:.3f} vs {s['outline']:.4f}, drawn {c['drawn']:.2f} vs {s['drawn']:.2f}, board dark {b['dark']:.2f}"
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

@test
def explain_study_finds_the_analogy_window_and_refuses_an_empty_transcript():
    """tools/explain_study.py: a synthetic transcript with an analogy cluster at 40-55 s must rank that window first;
    an empty transcript returns 2 (nothing ranked is not a result)."""
    import importlib.util
    sp = importlib.util.spec_from_file_location("explain_study", ROOT / "tools" / "explain_study.py")
    X = importlib.util.module_from_spec(sp); sp.loader.exec_module(X)
    filler = [{"w": w, "s": 2.0 * i, "e": 2.0 * i + 0.4} for i, w in enumerate(("the team ships every week and the plan holds " * 6).split())]
    cluster = [{"w": w, "s": 40 + 0.5 * i, "e": 40.3 + 0.5 * i} for i, w in enumerate("imagine it's like a queue in other words think of a lock".split())]
    words = sorted(filler + cluster, key=lambda w: w["s"])
    R = X.rank(words, window=30, top=3)
    assert R and R[0]["start"] <= 40 <= R[0]["end"] and R[0]["families"].get("analogy", 0) >= 3, R
    tmp = Path(tempfile.mkdtemp(prefix="lmt_ex_"))
    try:
        (tmp / "w.json").write_text(json.dumps({"words": [], "rough": True}))
        assert X.main(["cues", "v.mp4", "--words", str(tmp / "w.json")]) == 2
        # moments (L-134): continuous motion at 30-40 s wins; the busier 60-70 s is a montage (5 cuts) and loses
        ps = [0.05] * 120
        for s in range(30, 40): ps[s] = 0.5
        for s in range(60, 70): ps[s] = 0.9
        st = {"duration_s": 120, "visual_change": {"per_second": ps}, "cuts": {"times": [61, 63, 65, 67, 69]}}
        M = X.moments(st, top=1)
        assert M and M[0]["start"] == 30 and M[0]["cuts"] == 0, M
        (tmp / "s.json").write_text(json.dumps(dict(st, duration_s=20)))           # too short: nothing qualifies
        assert X.main(["moments", str(tmp / "s.json")]) == 2
        return (f"top window {R[0]['start']}-{R[0]['end']} s with {R[0]['families']}; empty transcript refused; "
                f"moment at {M[0]['start']} s, not the montage")
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

@test
def asset_intake_reads_zip_and_html_exports_and_enforces_the_contract():
    """tools/asset_intake.py: a Claude Design .zip with a good prop and a bad one (off-contract colour, <text>),
    a character part without a pivot, a standalone .html with data-asset svgs, and an empty export (exit 2)."""
    import importlib.util, zipfile
    sp = importlib.util.spec_from_file_location("asset_intake", ROOT / "tools" / "asset_intake.py")
    A = importlib.util.module_from_spec(sp); sp.loader.exec_module(A)
    tmp = Path(tempfile.mkdtemp(prefix="lmt_ai_"))
    try:
        good = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect id="slot_label" fill="none" width="5" height="2"/><rect fill="#FF0000" width="4" height="4"/><g class="lm-shade"><rect fill="#000000" fill-opacity="0.14" width="2" height="2"/></g></svg>'
        bad = '<svg xmlns="http://www.w3.org/2000/svg"><rect fill="#123456" width="4" height="4"/><text>Hi</text></svg>'
        part = '<svg xmlns="http://www.w3.org/2000/svg"><circle fill="#F2C7A5" r="3"/></svg>'
        man = {"assets": [{"file": "props/mug.svg", "kind": "prop"}, {"file": "props/sign.svg", "kind": "prop"},
                          {"file": "maya/head.svg", "kind": "character_part"},
                          {"file": "props/tote.svg", "kind": "prop", "parent": "torso"}]}   # an accessory: character palette
        tote = '<svg xmlns="http://www.w3.org/2000/svg"><rect fill="#D8D2C4" width="4" height="4"/></svg>'
        zp = tmp / "export.zip"
        with zipfile.ZipFile(zp, "w") as z:
            z.writestr("project/props/mug.svg", good); z.writestr("project/props/sign.svg", bad)
            z.writestr("project/maya/head.svg", part); z.writestr("project/manifest.json", json.dumps(man))
            z.writestr("project/props/tote.svg", tote)
            z.writestr("project/preview/props/mug.svg", bad)                   # a review copy: never checked
            z.writestr("project/assets/sheet.svg", bad)                        # a composite the manifest does not list
        out = tmp / "in"
        assert A.main([str(zp), "--batch", "b1", "--out", str(out)]) == 1      # failures must fail the intake
        rep = (out / "b1" / "INTAKE.md").read_text()
        # paths are read relative to the manifest, so a zip's top project folder does not break the match
        assert "PASS** `props/mug" in rep and "#123456" in rep and "<text>" in rep and "pivot" in rep, rep
        assert "not delivered" not in rep, rep
        assert "PASS** `props/tote" in rep and "Review copies, not checked or imported (1)" in rep, rep
        assert "Not in the manifest, so not imported (1):** assets/sheet" in rep and "preview/props/mug`" not in rep, rep
        assert (out / "b1" / "props" / "mug.svg").exists()
        # the same good prop alone passes, from a standalone html with data-asset and one unnamed svg
        html = tmp / "review.html"
        named = good.replace("<svg ", '<svg data-asset="props/mug" ', 1)
        html.write_text("<html><body>" + named + "<svg></svg></body></html>")
        assert A.main([str(html), "--batch", "b2", "--out", str(out)]) == 0
        assert "1 inline svg(s) without data-asset" in (out / "b2" / "INTAKE.md").read_text()
        # a character part needs a pivot
        k, probs, *_ = A.check("maya/head", part, {"kind": "character_part"})
        assert any("pivot" in p for p in probs), probs
        k, probs, *_ = A.check("maya/head", part, {"kind": "character_part", "pivot": [3, 3]})
        assert not probs, probs
        empty = tmp / "empty"; empty.mkdir()
        assert A.main([str(empty), "--batch", "b3", "--out", str(out)]) == 2   # nothing found is red
        # --declared-slots (opt-in): a prop drawn in the delivery's OWN slot hexes fails by default and passes when
        # the manifest's base_slots says which slot each hex is; a character part is never remapped
        warm = '<svg xmlns="http://www.w3.org/2000/svg"><rect fill="#F4F1EA" width="4" height="4"/><rect fill="#5B5850" width="1" height="1"/></svg>'
        man2 = {"base_slots": {"surface": "#F4F1EA", "line": "#5B5850", "nonsense": "#123456"},
                "assets": [{"file": "props/desk.svg", "kind": "prop"}, {"file": "maya/head.svg", "kind": "character_part", "pivot": [1, 1]}]}
        zp2 = tmp / "warm.zip"
        with zipfile.ZipFile(zp2, "w") as z:
            z.writestr("d/props/desk.svg", warm); z.writestr("d/maya/head.svg", part); z.writestr("d/manifest.json", json.dumps(man2))
        assert A.main([str(zp2), "--batch", "w1", "--out", str(out)]) == 1     # default: off-contract colours fail
        assert A.main([str(zp2), "--batch", "w2", "--out", str(out), "--declared-slots"]) == 0
        desk = (out / "w2" / "props" / "desk.svg").read_text()
        assert "#FFFFFF" in desk and "#606060" in desk and "#F4F1EA" not in desk, desk
        assert "#F2C7A5" in (out / "w2" / "maya" / "head.svg").read_text()      # the character is untouched
        assert "recoloured: `props/desk` (2)" in (out / "w2" / "INTAKE.md").read_text()
        return "zip with mixed assets fails, html passes, pivot enforced, empty export refused, declared slots opt-in"
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


# ------------------------------------------------------------------ film checks, UI artefacts, props (D-100)
@test
def film_checks_fail_on_planted_empty_repeat_overlay_cut_small_scale_and_grain():
    """D-100: every new film check must fail on a planted defect and stay quiet on the good case (a gate that cannot
    fail checks nothing). Frames are synthetic PNGs; probe reports are hand-built."""
    import numpy as np
    from PIL import Image
    from loom.checks import film as F
    from loom.checks.style_lint import lint_style
    tmp = Path(tempfile.mkdtemp(prefix="lmt_film_"))
    try:
        rng = np.random.default_rng(7)
        def png(name, rich):
            a = (rng.integers(0, 255, (270, 480)) if rich else np.full((270, 480), 40)).astype("uint8")
            p = tmp / name; Image.fromarray(a).convert("RGB").save(p); return p
        rich, blank = png("rich.png", True), png("blank.png", False)
        man = {"beats": [{"id": "b1", "speech_start": 0, "speech_end": 4}, {"id": "b2", "speech_start": 4, "speech_end": 8},
                         {"id": "b3", "speech_start": 8, "speech_end": 12}],
               "scenes": [{"beat": b, "station": "s1"} for b in ("b1", "b2", "b3")]}
        frames = {1.0: blank, 3.0: blank, 5.0: rich, 7.0: rich, 9.0: rich, 11.0: rich}
        E, W, st = F.frame_checks(man, frames, {"scenes": []})
        assert any(e.startswith("b1: empty frame") for e in E), E
        assert any(w.startswith("b3: the same frame as b2") for w in W), W
        assert st["measured_beats"] == 3, st                                     # the denominator is not zero
        E2, _, _ = F.frame_checks(man, frames, {"scenes": [{"beat": "b1", "intent": "hold"}]})
        assert not any(e.startswith("b1:") for e in E2), E2                      # a declared hold is exempt
        # overlay order: a reveal under a chapter card is red, one after it is not
        ov = {"overlays": [{"beat": "b1", "name": "chapter", "t0": 1.0, "t1": 3.0}],
              "tweens": [{"beat": "b1", "kind": "reveal", "name": "card", "t0": 2.0}, {"beat": "b1", "kind": "reveal", "name": "late", "t0": 3.4}]}
        oe = F.overlay_checks(ov)
        assert len(oe) == 1 and "'card'" in oe[0], oe
        # on-screen words: cut by the frame edge and too small are errors; small is a warning
        rows = {"screen_text": [{"beat": "b1", "t": 2.0, "n": 3, "min_px": 10, "small": [{"px": 10, "text": "speck"}], "cut": []},
                                {"beat": "b2", "t": 6.0, "n": 3, "min_px": 22, "small": [{"px": 22, "text": "smallish"}], "cut": []},
                                {"beat": "b3", "t": 10.0, "n": 3, "min_px": 40, "small": [], "cut": [{"text": "Thanks, it is", "rect": [1830, 1020, 2010, 1110]}]}]}
        te, tw, _ = F.screen_text_checks(rows)
        assert any(e.startswith("b1: text too small") for e in te) and any(e.startswith("b3: words cut") for e in te), te
        assert any(w.startswith("b2: small text") for w in tw), tw
        # scale: a laptop drawn the size of a person warns; a declared close-up and a beat with no people do not
        sc = {"figures": [{"beat": "b1", "h": 500}, {"beat": "b1", "h": 900, "extra": True}],
              "objects": [{"beat": "b1", "kind": "laptop", "size": 400, "real_m": 0.36, "name": "lap"},
                          {"beat": "b1", "kind": "phone", "size": 400, "real_m": 0.15, "hero": True, "name": "ph"},
                          {"beat": "b2", "kind": "laptop", "size": 900, "real_m": 0.36, "name": "alone"}]}
        _, sw = F.scale_checks(sc)
        assert len(sw) == 1 and "laptop 'lap'" in sw[0], sw
        assert not F.scale_checks({"figures": sc["figures"], "objects": [dict(sc["objects"][0], size=120)]})[1]
        # finish: a planted grain fails the pack lint; every shipped pack passes
        pack = read_json(ROOT / "packs/styles/corporate-clean.json")
        assert not lint_style(pack), lint_style(pack)
        pack["fx"] = dict(pack.get("fx") or {}, grain=0.06)
        assert any("fx.grain" in e for e in lint_style(pack)), lint_style(pack)
        return "empty, repeat, overlay, cut, small, scale and grain each fail on a planted case; holds and heroes pass"
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


@test
def strips_pick_the_named_beats_and_refuse_a_spec_that_names_none():
    """loom/strips.py --beats: a range and a list select exactly those beats; a spec naming no beat is an error, not
    an empty sheet (a zero is not a result)."""
    from loom.strips import pick
    ids = ["b01", "b02", "b03", "b04", "b05"]
    assert pick("b02-b04", ids) == {"b02", "b03", "b04"}
    assert pick("b01,b05", ids) == {"b01", "b05"}
    assert pick(None, ids) is None
    try:
        pick("b09", ids)
        raise AssertionError("a spec that names no beat must fail")
    except LoomError:
        pass
    return "range, list and all; an empty pick is refused"

@test
def ui_artefacts_and_props_build_clean_record_scale_and_tags_leave_with_their_lines():
    """D-100: Loom.ui mail/inbox/chat build with no layout problem in two registers; a label's lead line exits with
    the label (step 7 left lines pointing at nothing); the props lab records objects and figures for the scale check
    and passes it (its close-ups are declared hero)."""
    if not _browser():
        return "skipped (no browser here; set HYPERFRAMES_BROWSER_PATH)"
    from loom import lab
    from loom.checks import film as F
    T = tempfile.mkdtemp(prefix="lmt_ui_")
    try:
        r = lab.strip("lab_ui_artefacts", "corporate-clean", [4.4, 9.6], out_dir=T)
        assert not r["errors"], r["errors"]
        exits = {t.get("name"): t["t0"] for t in r["tweens"] if t.get("kind") == "exit"}
        assert exits, "no exit tweens reported: the check measured nothing"
        assert abs(exits.get("t_addr.lead", -1) - 7.6) < 0.01 and abs(exits.get("t_out.lead", -1) - 7.6) < 0.01, exits
        r2 = lab.strip("lab_ui_artefacts", "cinematic-noir", [9.6], out_dir=T)
        assert not r2["errors"], r2["errors"]
        p = lab.strip("lab_props_people", "corporate-clean", [8.6], out_dir=T)
        assert not p["errors"], p["errors"]
        assert p["figures"] and p["objects"], (p["figures"], p["objects"])        # zero records would pass anything
        assert any(o["kind"] == "laptop" and not o["hero"] for o in p["objects"]), p["objects"]
        _, sw = F.scale_checks(p)
        assert not sw, sw
        return f"{len(exits)} exits incl. both lead lines at 7.6 s; {len(p['objects'])} objects, {len(p['figures'])} figures, scale clean"
    finally:
        shutil.rmtree(T, ignore_errors=True)


def _no_cv2():
    """The vision lab's prepare step measures motion with OpenCV (tools/vision_lab/vl.py, `cv2`), which the pod installs
    (requirements, vl.py's preflight) and this Windows PC does not: a named skip, not a failure (B6, 2026-10-08)"""
    import importlib.util
    return None if importlib.util.find_spec("cv2") else "skipped: no OpenCV (cv2) here; pip install opencv-python-headless to run the vision lab end to end"


def _no_symlinks():
    """find_model --link makes a symlink; a Windows account without Developer Mode may not (WinError 1314): a named skip
    (B6, 2026-10-08)"""
    d = Path(tempfile.mkdtemp(prefix="lmt_ln_"))
    try:
        (d / "a").write_text("x")
        os.symlink(d / "a", d / "b")
        return None
    except OSError as e:
        return f"skipped: this account may not create symlinks here ({e.__class__.__name__} {getattr(e, 'winerror', '') or e.errno}); turn on Windows Developer Mode to run it"
    finally:
        shutil.rmtree(d, ignore_errors=True)


@test
def vision_lab_runs_end_to_end_on_a_mock_server_and_its_checks_can_fail():
    """tools/vision_lab (D-101): select -> prepare -> selftest -> shots -> videos -> synthesize -> validate -> pack ->
    ingest against the mock server, on a synthetic film with three hard cuts. The code must find the cuts; the
    validator must REJECT the mock's invented evidence; a verbatim narration string must be redacted in the bundle;
    the bundle must hold no media and no transcript."""
    import importlib.util, re, socket, threading, zipfile, yaml
    if not which("ffmpeg"):
        return "skipped (no ffmpeg)"
    if _no_cv2():
        return _no_cv2()
    lab = ROOT / "tools" / "vision_lab"
    sp = importlib.util.spec_from_file_location("vl", lab / "vl.py"); VL = importlib.util.module_from_spec(sp); sp.loader.exec_module(VL)
    sp2 = importlib.util.spec_from_file_location("mock_server", lab / "mock_server.py"); MS = importlib.util.module_from_spec(sp2); sp2.loader.exec_module(MS)
    from http.server import ThreadingHTTPServer
    tmp = Path(tempfile.mkdtemp(prefix="lmt_vl_"))
    try:
        vids = tmp / "videos"; vids.mkdir()
        f = vids / "2025-05-01 - Synthetic [SYNTHvid001].mp4"
        # four 3-second solid colour shots with a moving box: three hard cuts at 3, 6 and 9 s
        parts = ";".join(f"color=c={c}:s=640x360:d=3:r=25[c{i}]" for i, c in enumerate(["red", "navy", "green", "white"]))
        subprocess.run([which("ffmpeg"), "-v", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=16000:cl=mono", "-filter_complex",
                        parts + ";[c0][c1][c2][c3]concat=n=4:v=1,drawbox=x='40+t*30':y=150:w=60:h=60:color=yellow:t=fill[v]",
                        "-map", "[v]", "-map", "0:a", "-t", "12", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", str(f)], check=True)
        (vids / (f.stem + ".info.json")).write_text(json.dumps({"title": "Synthetic", "duration": 12, "upload_date": "20250501",
                                                                "description": "Animation by Test Studio"}))
        (vids / (f.stem + ".en.srt")).write_text("1\n00:00:00,500 --> 00:00:05,000\nthe quick brown fox jumps over the lazy sleeping dog today\n")
        with socket.socket() as so:
            so.bind(("127.0.0.1", 0)); port = so.getsockname()[1]
        MS.H.model = "mock-model"
        srv = ThreadingHTTPServer(("127.0.0.1", port), MS.H)
        threading.Thread(target=srv.serve_forever, daemon=True).start()
        cfg = yaml.safe_load((lab / "config.yaml").read_text())
        cfg.update(work_dir=str(tmp / "work"), videos_dir=str(vids), run_id="t")
        cfg["server"].update(base_url=f"http://127.0.0.1:{port}/v1", workers=2, retries=1)
        cfg["models"]["a"]["name"] = "mock-model"; cfg["models"]["c"]["name"] = "mock-model"
        cfg["select"]["min_duration_s"] = 5; cfg["prepare"]["whisper_model"] = ""
        cp = tmp / "cfg.yaml"; cp.write_text(yaml.safe_dump(cfg))
        run_ = lambda *a: VL.main(["--config", str(cp), *a])
        assert run_("select") == 0 and run_("prepare") == 0
        m = json.loads((tmp / "work/prep/SYNTHvid001/measure.json").read_text())
        starts = [s["t0"] for s in m["shots"] if s["cut_in"] == "hard"]
        assert len(starts) == 3 and all(abs(a - b) <= 0.3 for a, b in zip(starts, [3, 6, 9])), m["shots"]
        assert m["words_source"] == "srt_approx" and m["speech"]["words"] == 11, m["speech"]
        assert run_("selftest") == 0 and json.loads((tmp / "work/selftest.json").read_text())["video_correct"]
        # full-frame-rate movement and sound measures are in the record; the ears pass runs
        assert "moves" in m["shots"][0] and "sound" in m and "smoothness" in m, list(m)
        assert run_("sound") == 0 and (tmp / "work/out/t/sound/SYNTHvid001.json").exists()
        assert run_("shots") == 0 and run_("videos") == 0 and run_("synthesize", "--batch", "1") == 0
        out = tmp / "work/out/t"
        assert len(list((out / "shots/SYNTHvid001").glob("*.json"))) == len(m["shots"])
        # a model answer that copies the narration must be redacted in the bundle
        sh = out / "shots/SYNTHvid001" / f"{m['shots'][0]['id']}.json"
        o = json.loads(sh.read_text()); o["narration_link"]["gist"] = "The quick brown fox jumps over the lazy sleeping dog"; sh.write_text(json.dumps(o))
        assert run_("validate") == 1                              # the mock's invented evidence must be rejected
        rep = json.loads((out / "validation.json").read_text())
        assert any("evidence items do not exist" in e for e in rep["errors"]) and rep["redact"], rep
        # every call carried its skills, the rules first, a schema and its media (L-197) ...
        R = VL.receipts_summary(VL.Paths(yaml.safe_load(cp.read_text())))
        assert R["calls"] > 0 and R["problem_count"] == 0, R["problems"][:3]
        for kind, need in (("shots", "10_shot_annotator.md"), ("videos", "20_video_analyst.md"), ("sound", "25_sound_listener.md"),
                           ("synthesize", "30_style_distiller.md")):
            row = R["by_kind"][kind]
            assert need in row["skills_seen"] and "00_rules.md" in row["skills_seen"] and "loom_capabilities.md" in row["skills_seen"], (kind, row)
            assert row["rules_first"] == row["calls"] == row["schema_enforced"], (kind, row)
        # ... and the check can fail: a call that lost its skill is reported
        rp = tmp / "work/raw/t/receipts.jsonl"
        good = rp.read_text()
        r0 = next(json.loads(l) for l in good.splitlines() if json.loads(l)["kind"] == "shots")
        r0["skills"] = ["00_rules.md"]; rp.write_text(good + json.dumps(r0) + "\n")     # a shot call without its annotator skill
        assert run_("receipts") == 1
        rp.write_text(good)
        assert run_("receipts") == 0
        # D-113: the run_full steps that were new or broken in the TED-Ed run, each shown to pass AND to fail
        assert run_("preflight") == 0, json.loads((tmp / "work/preflight.json").read_text())
        c2 = yaml.safe_load(cp.read_text()); c2["models"]["a"]["context"] = 0; cp2 = tmp / "cfg_bad.yaml"; cp2.write_text(yaml.safe_dump(c2))
        assert VL.main(["--config", str(cp2), "preflight"]) == 1                 # a missing context is caught before pod time
        (tmp / "work/server.log").write_text("INFO max_seq_len=65536 ...\nINFO GPU KV cache size: 300,000 tokens\n")
        assert run_("preflight") == 1                                             # the config promises more context than the server has
        assert VL.server_facts({"work_dir": str(tmp / "work")}) == {"kv_tokens": 300000, "max_model_len": 65536}
        (tmp / "work/server.log").unlink()
        mp = tmp / "work/prep/SYNTHvid001/measure.json"; mm = json.loads(mp.read_text()); mm["measure_version"] = 1; mp.write_text(json.dumps(mm))
        run_("preflight")
        assert any("older version" in w for w in json.loads((tmp / "work/preflight.json").read_text())["warnings"])
        run_("remeasure")
        assert json.loads(mp.read_text())["measure_version"] == VL.MEASURE_VERSION
        for step in ("plant", "judge-planted", "consistency", "report"):
            assert run_("calibrate", step) in (0, None), step
        crep = json.loads((out / "calibration/report.json").read_text())
        assert set(crep["gates"]) >= set(cfg["calibration"]["gates"]), (sorted(crep["gates"]), sorted(cfg["calibration"]["gates"]))
        assert run_("distill-prep") in (0, None) and (out / "distill/films_01.md").exists() and (out / "distill/shots/SYNTHvid001.md").exists()
        # a style guide that does not cover this run is refused and left out of the bundle (L-212)
        st = out / "synthesis_status.json"; good_st = st.read_text()
        st.write_text(json.dumps({"complete": False}))
        assert run_("validate") == 1 and json.loads((out / "validation.json").read_text()).get("stale_style_guide")
        run_("pack", "--force")
        assert "t/style_guide.json" not in zipfile.ZipFile(tmp / "work/bundle_t.zip").namelist()
        st.write_text(good_st)
        assert run_("pack", "--force") in (0, None)
        z = zipfile.ZipFile(tmp / "work/bundle_t.zip"); names = z.namelist()
        assert "t/prompt_receipts.json" in names and "t/style_guide.json" in names and "t/distill/films_01.md" in names, names
        rz = zipfile.ZipFile(tmp / "work/raw_t.zip").namelist()               # the raw side: every answer and calls.jsonl
        assert "raw_t/calls.jsonl" in rz and any(n.startswith("raw_t/shots/") for n in rz), rz[:10]
        assert not [n for n in names if re.search(r"\.(mp4|jpg|png|srt)$|words\.json$", n)], names
        assert "redacted" in json.loads(z.read(f"t/shots/SYNTHvid001/{m['shots'][0]['id']}.json"))["narration_link"]["gist"]
        VL.main(["--config", str(cp), "ingest", str(tmp / "work/bundle_t.zip"), "--into", str(tmp / "in")])
        assert (tmp / "in/t/INGEST.md").exists()
        srv.shutdown()
        return f"{len(m['shots'])} shots, 3 cuts found, fake evidence rejected, verbatim gist redacted, bundle media-free"
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


@test
def vision_lab_synthesize_packs_batches_to_the_context_and_merges_in_levels():
    """L-209: ten films per synthesize batch were about three times the 131k context on the pod, and every batch
    failed with a 400 after four identical retries. Batches are now packed by measured size; a context refusal is
    never retried; a merge too big for one call is done in groups first. Proven against a mock that refuses, like
    vLLM, any prompt past its context."""
    import importlib.util, socket, threading, yaml
    lab = ROOT / "tools" / "vision_lab"
    sp = importlib.util.spec_from_file_location("vl", lab / "vl.py"); VL = importlib.util.module_from_spec(sp); sp.loader.exec_module(VL)
    sp2 = importlib.util.spec_from_file_location("mock_server", lab / "mock_server.py"); MS = importlib.util.module_from_spec(sp2); sp2.loader.exec_module(MS)
    from http.server import ThreadingHTTPServer
    # the packer itself
    assert VL.pack_by_budget([5, 5, 5, 5], 10) == [[0, 1], [2, 3]]
    assert VL.pack_by_budget([5, 5, 5], 100, cap=2) == [[0, 1], [2]]
    assert VL.pack_by_budget([50, 5], 10) == [[0], [1]]          # an item over budget gets its own group (the caller shrinks it)
    tmp = Path(tempfile.mkdtemp(prefix="lmt_vls_"))
    try:
        with socket.socket() as so:
            so.bind(("127.0.0.1", 0)); port = so.getsockname()[1]
        MS.H.model = "mock-model"; MS.H.overflows = 0
        srv = ThreadingHTTPServer(("127.0.0.1", port), MS.H)
        threading.Thread(target=srv.serve_forever, daemon=True).start()
        cfg = yaml.safe_load((lab / "config.yaml").read_text())
        cfg.update(work_dir=str(tmp / "work"), videos_dir=str(tmp), run_id="t")
        cfg["server"].update(base_url=f"http://127.0.0.1:{port}/v1", workers=4, retries=3)
        cfg["models"]["a"]["name"] = "mock-model"; cfg["models"]["a"]["max_tokens"]["synthesize"] = 2000
        P = VL.Paths(cfg)
        ids = [f"vid{i:03d}xx" for i in range(9)]
        (P.work / "selection.json").write_text(json.dumps({"videos": [{"id": v} for v in ids]}))
        note = "A warm cream subject isolated on a cool field so the eye locks on the moving shape. " * 3
        for v in ids:
            VL.wj(P.out / "videos" / f"{v}.json", {"video_id": v, "steal": [note] * 4})
            for k in range(20):
                VL.wj(P.out / "shots" / v / f"s{k:03d}.json", {"shot_id": f"s{k:03d}", "_t0": k, "_t1": k + 1, "visual_idea": note,
                                                              "craft": [note, note], "narration_link": {"gist": note}})
        system = VL.skill_text("30_style_distiller.md", "loom_capabilities.md")
        J = lambda o: json.dumps(o, ensure_ascii=False, separators=(",", ":"))
        film = VL.est_tokens(J({"video": VL.rj(P.out / "videos" / f"{ids[0]}.json"), "sound": None,
                                "shots": [VL.condense_shot(s) for s in VL.load_shots(P, ids[0])]}))
        fixed = 131072 - VL.synth_budget(cfg, system)                # everything but the records
        cfg["models"]["a"]["context"] = fixed + 3000 + int(2.6 * film)  # room for two films a batch, not three
        MS.H.context = cfg["models"]["a"]["context"]
        cp = tmp / "cfg.yaml"; cp.write_text(yaml.safe_dump(cfg))
        # a prompt that cannot fit is refused BEFORE it is sent (D-113): zero requests, not four identical refusals
        cl = VL.Client(cfg, P, "a")
        seen0 = MS.H.requests_seen
        try:
            cl.call("synthesize", system, [VL.Client.text("x" * (4 * MS.H.context))], "style_guide", key="too_long")
            assert False, "an over-long prompt must raise"
        except VL.ContextOverflow:
            pass
        assert MS.H.overflows == 0 and MS.H.requests_seen == seen0, (MS.H.overflows, MS.H.requests_seen - seen0)
        MS.H.overflows = 0
        assert VL.main(["--config", str(cp), "synthesize"]) in (0, None)
        batches = sorted((P.out / "batches").glob("batch_*.json"))
        assert len(batches) == 5 and MS.H.overflows == 0, (len(batches), MS.H.overflows)
        assert json.loads((P.out / "style_guide.json").read_text())["videos"] == ids
        # the merge in levels, with a stand-in client that records each prompt's size
        seen = []

        class FakeCl:
            def call(self, kind, system_, content, schema_name, key):
                seen.append((key, VL.est_tokens(content[0]["text"])))
                return {"videos": [], "technique_library": [{"id": f"t{i}", "name": key, "description": note * 2} for i in range(12)]}
        big = [{"videos": [v], "technique_library": [{"id": f"t{i}", "name": "n", "description": note * 2} for i in range(12)]} for v in ids]
        part = VL.est_tokens(J(VL.condense_guide(big[0])))
        VL.merge_guides(FakeCl(), system, big, {}, ids, P, budget=3 * part + 900, workers=2)
        keys = [k for k, _ in seen]
        assert keys[-1] == "corpus" and any(k.startswith("merge_L1_") for k in keys), keys
        assert all(n <= 3 * part + 900 for _, n in seen), seen
        srv.shutdown()
        return f"{len(batches)} batches of <=2 films, 0 refusals, an oversized prompt costs 0 requests, merge took {len(keys)} calls in levels"
    finally:
        MS.H.context = None
        shutil.rmtree(tmp, ignore_errors=True)


def _vl_modules():
    import importlib.util
    lab = ROOT / "tools" / "vision_lab"
    sp = importlib.util.spec_from_file_location("vl", lab / "vl.py"); VL = importlib.util.module_from_spec(sp); sp.loader.exec_module(VL)
    sp2 = importlib.util.spec_from_file_location("mock_server", lab / "mock_server.py"); MS = importlib.util.module_from_spec(sp2); sp2.loader.exec_module(MS)
    return lab, VL, MS


@test
def vision_lab_measures_v2_fix_the_instrument_bugs_of_the_run():
    """L-212 / D-113: pacing over real shots (sub-shot splits folded back), the longest still RUN (not a count), short
    linear moves classified (boil on fours, cycles, swaps, pans, jitter), colour-free gradual cuts marked as likely
    continuations, impossible Whisper words dropped. Each fix is shown on a record the old code got wrong."""
    _, VL, _ = _vl_modules()
    boil = [{"t": round(1 + 0.167 * k, 3), "dur": 0.13, "peak": 0.6, "peak_at": 0.5, "shape": "linear"} for k in range(6)]
    ev = boil + [{"t": 3.0, "dur": 0.13, "peak": 4.0, "peak_at": 0.5, "shape": "linear"},       # a swap
                 {"t": 4.0, "dur": 2.4, "peak": 3.0, "peak_at": 0.5, "shape": "linear"},       # a pan
                 {"t": 7.0, "dur": 0.6, "peak": 5.0, "peak_at": 0.1, "shape": "ease_out"},     # a move
                 {"t": 9.3, "dur": 0.13, "peak": 0.5, "peak_at": 0.5, "shape": "linear"}]      # jitter
    kinds = [e["kind"] for e in VL.classify_moves(ev)]
    assert kinds[:6] == ["boil"] * 6 and kinds[6:] == ["swap", "pan", "move", "jitter"], kinds
    pal_a = [{"hex": "#202020", "share": 0.7}, {"hex": "#E03030", "share": 0.3}]
    pal_b = [{"hex": "#F0F0F0", "share": 0.8}, {"hex": "#3060E0", "share": 0.2}]
    shots = [
        {"id": "s001", "t0": 0, "t1": 20, "len": 20, "cut_in": "first", "parent": "s001", "palette": pal_a, "motion": {"per_second": [0] * 12 + [0.2] * 8}, "moves": {"events": ev}},
        {"id": "s001b", "t0": 20, "t1": 40, "len": 20, "cut_in": "continued", "parent": "s001", "palette": pal_a, "motion": {"per_second": [0.2] * 20}, "moves": {"events": []}},
        {"id": "s002", "t0": 40, "t1": 50, "len": 10, "cut_in": "gradual", "parent": "s002", "palette": pal_a, "motion": {"per_second": [0.2] * 10}, "moves": {"events": []}},
        {"id": "s003", "t0": 50, "t1": 60, "len": 10, "cut_in": "hard", "parent": "s003", "palette": pal_b, "motion": {"per_second": [0.2] * 10}, "moves": {"events": []}}]
    m = {"probe": {"duration": 60}, "cuts": {"hard": 3, "gradual": 1, "per_minute": 3.0}, "shots": shots,
         "motion_per_second": [0] * 12 + [0.2] * 48, "holds": [{"t": 0, "s": 12}], "black_seconds": 2.0}
    VL.derive_measures(m)
    assert m["shot_len"]["max"] == 40 and m["shot_len"]["n"] == 3, m["shot_len"]                # the 20 s split is folded back
    assert m["cuts"]["per_minute"] == 2.0 and m["cuts"]["records_per_minute"] == 3.0, m["cuts"]
    assert m["cuts"]["hard"] == 1 and m["cuts"]["hard_raw"] == 3                                  # merged vs raw kept apart
    assert shots[2]["continuation_likely"] and not shots[3]["continuation_likely"], (shots[2]["palette_delta_in"], shots[3]["palette_delta_in"])
    assert m["cuts"]["real_joins_per_minute"] == 1.0, m["cuts"]
    assert m["longest_still_s"] == 12 and shots[0]["motion"]["longest_still_run_s"] == 12
    assert "dark_seconds" in m and "black_seconds" not in m and m["measure_version"] == VL.MEASURE_VERSION
    words = [{"w": "a", "s": 1.0, "e": 1.3}] + [{"w": "x", "s": 5.0 + k * 0.01, "e": 5.0 + k * 0.01 + 0.005} for k in range(40)] + [{"w": "b", "s": 9.0, "e": 9.4}]
    kept, dropped = VL.clean_words(words, 7)
    assert [w["w"] for w in kept] == ["a", "b"] and dropped == 40, (len(kept), dropped)
    return "boil/swap/pan/move/jitter told apart, pacing over real shots, continuations found, still runs, Whisper bursts dropped"


@test
def vision_lab_client_survives_load_thinking_caps_and_timeouts():
    """L-210 / L-213 / D-113, on a mock that behaves like the pod under load: a KV cache that queues what does not fit,
    slow answers, thinking that eats the whole budget. With the admission gate no call times out and the server's
    in-flight tokens stay under the cache; without it (control) the same load times out, so the test can fail.
    Thinking to the cap is retried with room (not called a grammar runaway); a timeout is never resent unchanged;
    the thinking text is kept; usage accumulates across invocations."""
    import socket, threading, yaml
    from concurrent.futures import ThreadPoolExecutor
    lab, VL, MS = _vl_modules()
    from http.server import ThreadingHTTPServer
    tmp = Path(tempfile.mkdtemp(prefix="lmt_vlc_"))
    try:
        with socket.socket() as so:
            so.bind(("127.0.0.1", 0)); port = so.getsockname()[1]
        MS.H.model = "mock-model"; MS.H.kv = 30000; MS.H.delay = 1.0; MS.H.inflight = 0; MS.H.peak_inflight = 0; MS.H.think_cap_once = False
        srv = ThreadingHTTPServer(("127.0.0.1", port), MS.H)
        threading.Thread(target=srv.serve_forever, daemon=True).start()
        cfg = yaml.safe_load((lab / "config.yaml").read_text())
        cfg.update(work_dir=str(tmp / "work"), videos_dir=str(tmp), run_id="t")
        cfg["server"].update(base_url=f"http://127.0.0.1:{port}/v1", timeout_s=2.5, timeout_max_s=2.5, retries=1, timeout_retries=0,
                             kv_tokens=30000, kv_fraction=0.9, progress_every_s=1)
        cfg["models"]["a"]["name"] = "mock-model"
        P = VL.Paths(cfg)
        VL._schema_cache["_tiny"] = {"type": "object", "additionalProperties": False, "required": ["answer"], "properties": {"answer": {"type": "string"}}}

        def burst(client, n=8):
            ok = fail = 0
            def one(i):
                return client.call("selftest", "Answer with JSON.", [VL.Client.text(f"q{i} " + "w " * 300)], "_tiny", key=f"b{i}", max_tokens=9000)
            with ThreadPoolExecutor(8) as ex:
                for f in [ex.submit(one, i) for i in range(n)]:
                    try:
                        f.result(); ok += 1
                    except Exception:  # noqa: BLE001
                        fail += 1
            return ok, fail
        cl = VL.Client(cfg, P, "a")
        ok, fail = burst(cl)
        assert ok == 8 and fail == 0 and cl.usage["timeouts"] == 0, (ok, fail, dict(cl.usage))
        assert MS.H.peak_inflight <= 30000, MS.H.peak_inflight
        # control: no admission gate (a huge cache on the client side): the server queues, and the queue eats the timeout
        VL.ADMIT.by.clear(); cfg2 = dict(cfg, server=dict(cfg["server"], kv_tokens=10 ** 9))
        cl2 = VL.Client(cfg2, P, "a")
        ok2, fail2 = burst(cl2)
        assert fail2 > 0 and cl2.usage["timeouts"] > 0, ("the control must time out, or this test proves nothing", ok2, fail2)
        VL.ADMIT.by.clear()
        # a timeout is never resent unchanged: with timeout_retries 0 one request per call, then CallTimeout
        MS.H.kv = None; MS.H.delay = 4.0
        seen = MS.H.requests_seen
        try:
            VL.Client(cfg, P, "a").call("selftest", "x", [VL.Client.text("slow")], "_tiny", key="slow", max_tokens=100)
            assert False, "must time out"
        except VL.CallTimeout:
            pass
        assert MS.H.requests_seen - seen == 1, MS.H.requests_seen - seen
        # thinking that eats the whole budget: retried with room, counted as a thinking cap, never as a grammar runaway
        MS.H.delay = 0.0; MS.H.think_cap_once = True
        cl3 = VL.Client(cfg, P, "a"); cl3.m = dict(cl3.m, thinking={"selftest": True})
        out = cl3.call("selftest", "x", [VL.Client.text("think about this")], "_tiny", key="think", max_tokens=400)
        assert out.get("answer") and cl3.usage["thinking_caps"] == 1 and cl3.usage["grammar_runaways"] == 0, dict(cl3.usage)
        MS.H.think_cap_once = False
        raws = sorted((P.raw / "selftest").glob("think.*.json"))
        assert len(raws) == 2 and any(json.loads(r.read_text())["reasoning"] for r in raws), raws   # the thinking text is kept
        calls = [json.loads(l) for l in (P.raw / "calls.jsonl").read_text().splitlines()]
        assert any(c["key"] == "think" and c["reasoning_tokens"] == 400 for c in calls), calls[-3:]
        # usage accumulates across invocations
        cl3.save_usage("selftest"); cl.save_usage("selftest")
        u = json.loads((P.out / "usage_selftest.json").read_text())
        assert len(u["invocations"]) == 2 and u["total"]["completion_tokens"] == cl3.usage["completion_tokens"] + cl.usage["completion_tokens"], u["total"]
        srv.shutdown()
        return f"8 parallel calls under load: 0 timeouts (control {fail2} failed); peak in flight {MS.H.peak_inflight} <= 30000; thinking cap retried; timeout not resent"
    finally:
        MS.H.kv = None; MS.H.delay = 0.0; MS.H.think_cap_once = False
        shutil.rmtree(tmp, ignore_errors=True)


@test
def vision_lab_calibration_scores_by_time_and_place_and_never_drops_a_gate():
    """L-212: the scorer credited only a fixed list of labels (39 of 50 plants, while the judge had described 46), and a
    configured gate vanished from the report while all_pass counted ">= 6". Now a plant is found by any defect at
    its time and place, label agreement is reported beside it, and every configured gate is run, skipped by config,
    or marked NOT RUN (which fails all_pass)."""
    import yaml
    lab, VL, _ = _vl_modules()
    tmp = Path(tempfile.mkdtemp(prefix="lmt_vlcal_"))
    try:
        cfg = yaml.safe_load((lab / "config.yaml").read_text())
        cfg.update(work_dir=str(tmp / "work"), videos_dir=str(tmp), run_id="t")
        P = VL.Paths(cfg)
        (P.work / "selection.json").write_text(json.dumps({"videos": [{"id": "v1"}]}))
        cd = P.out / "calibration"
        VL.wj(cd / "planted_truth.json", {"films": [{"video_id": "v1", "plants": [
            {"type": "seam", "t0": 10.0, "t1": 12.5, "class": "subtle", "box": [0.56, 0, 1, 1]},
            {"type": "placeholder", "t0": 30.0, "t1": 32.5, "class": "gross", "box": [0.30, 0.25, 0.70, 0.75]},
            {"type": "black", "t0": 50.0, "t1": 52.5, "class": "gross", "box": [0, 0, 1, 1]}]}]})
        def win(i, t0, defects):
            VL.wj(cd / "planted" / "planted_v1" / f"w{i:03d}.json", {"t0": t0, "t1": t0 + 6, "defects": defects, "scores": {}})
        d = lambda typ, t, box, sev="major": {"type": typ, "t": t, "dur": 2.0, "box": box, "severity": sev}
        win(1, 6, [d("placeholder_content", 10.1, [0.55, 0.0, 1.0, 1.0])])       # the seam, under another label: FOUND
        win(2, 30, [d("text_too_small", 30.2, [0.0, 0.0, 0.1, 0.1])])           # right time, wrong place: NOT found
        win(3, 48, [d("black_frame", 50.0, [0, 0, 1, 1], "blocker")])           # found, label agrees
        win(4, 70, [d("double_exposure", 71.0, [0, 0, 1, 1])])                  # a clean window flagged major
        win(5, 80, [])
        rep = VL.calibration_report(cfg, P)
        pt = rep["planted"]["per_type"]
        assert pt["seam"]["found"] == 1 and pt["seam"]["label_agrees"] == 0, pt["seam"]
        assert pt["placeholder"]["found"] == 0 and pt["black"]["found"] == 1 and pt["black"]["label_agrees"] == 1, pt
        assert rep["planted"]["clean_flagged_major"] == 1 and rep["planted"]["blocker_precision"] == 1.0, rep["planted"]
        assert rep["gates"]["loom_beat_recall"]["status"] == "skipped by config", rep["gates"]["loom_beat_recall"]
        assert rep["gates"]["consistency_enum_agreement"]["pass"] is False                     # ran with n = 0: a fail, not a pass
        cfg["calibration"]["skip_gates"] = []
        rep2 = VL.calibration_report(cfg, P)
        assert "family_purity" in rep2["not_run"] and rep2["all_pass"] is False, rep2["not_run"]
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    return "found by time and place under any label; label agreement apart; skipped and NOT RUN gates visible"


@test
def vision_lab_rerun_uses_the_true_previous_shot_and_keeps_its_own_raw():
    """L-212: the consistency re-run told each sampled shot about the previous SAMPLED shot (12 to 15 mid-film shots
    per part were called the first shot) and its raw files overwrote the original calls'."""
    import yaml
    lab, VL, _ = _vl_modules()
    tmp = Path(tempfile.mkdtemp(prefix="lmt_vlprev_"))
    try:
        cfg = yaml.safe_load((lab / "config.yaml").read_text())
        cfg.update(work_dir=str(tmp / "work"), videos_dir=str(tmp), run_id="t")
        P = VL.Paths(cfg)
        sh = [{"id": f"s00{i}", "t0": i * 3.0, "t1": i * 3.0 + 3, "len": 3, "cut_in": "hard" if i else "first", "parent": f"s00{i}",
               "palette": [{"hex": "#808080", "share": 1.0}], "look": {"brightness": 0.5, "saturation": 0.1, "detail": 0.01},
               "motion": {"per_second": [0.1, 0.1, 0.1], "still_s": 0}, "moves": {"events": []}, "stills_t": [0.1, 1.5, 2.9]} for i in range(4)]
        VL.wj(P.vprep("v1") / "measure.json", {"video_id": "v1", "probe": {"width": 640, "height": 360, "duration": 12}, "shots": sh})
        for i in range(4):
            VL.wj(P.out / "shots" / "v1" / f"s00{i}.json", {"shot_id": f"s00{i}", "visual_idea": f"IDEA OF s00{i}"})
        seen = []

        class Fake:
            raw_dir = ""
            def media(self, k, p): return {"type": f"{k}_url", f"{k}_url": {"url": "file:///x"}}
            def call(self, kind, system, content, schema, key, **kw):
                seen.append(content[0]["text"]); return {"visual_idea": "x"}
        VL.annotate_video_shots({"id": "v1"}, cfg, P, Fake(), P.out / "calib_consistency", sample={"v1/s002"})
        assert len(seen) == 1 and "Previous shot: IDEA OF s001" in seen[0], seen[0][:400]       # not "none (first shot)"
        assert "MEASURED BY CODE" in seen[0] and "texture, not events" in seen[0]
        cl = VL.Client(cfg, P, "a"); cl.raw_dir = "calib_consistency"
        cl._raw("shots", "v1_s002", {"max_tokens": 1}, "{}", "why", {}, 0.1, 0, None)
        assert list((P.raw / "calib_consistency" / "shots").glob("v1_s002.*.a0.json")) and not (P.raw / "shots").exists()
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    return "the true previous shot is passed; the re-run's raw lives apart"


@test
def vision_lab_maturity_pass_rates_golden_frames_blind_and_flags_a_flat_judge():
    """vl.py maturity (D-102 E3): every exported frame is rated with repeats, the runs validate against the schema,
    scores.json carries opaque ids only, and the mock (which always answers 3) is reported FLAT with exit 1, so a
    judge that cannot rank can never look like a pass. Spearman of a flat judge is None, never a number."""
    import importlib.util, socket, threading, yaml
    from PIL import Image
    from loom import golden as G
    lab = ROOT / "tools" / "vision_lab"
    sp = importlib.util.spec_from_file_location("vl", lab / "vl.py"); VL = importlib.util.module_from_spec(sp); sp.loader.exec_module(VL)
    sp2 = importlib.util.spec_from_file_location("mock_server", lab / "mock_server.py"); MS = importlib.util.module_from_spec(sp2); sp2.loader.exec_module(MS)
    from http.server import ThreadingHTTPServer
    tmp = Path(tempfile.mkdtemp(prefix="lmt_mat_"))
    try:
        fr = tmp / "golden"; fr.mkdir()
        ids = [f"{i:010x}" for i in range(6)]
        for i, f in enumerate(ids):
            Image.new("RGB", (640, 310), (40 * i, 20, 20)).save(fr / f"{f}.jpg")
        (fr / "golden_frames.json").write_text(json.dumps({"version": 1, "frames": [{"id": f} for f in ids]}))
        with socket.socket() as so:
            so.bind(("127.0.0.1", 0)); port = so.getsockname()[1]
        MS.H.model = "mock-model"
        srv = ThreadingHTTPServer(("127.0.0.1", port), MS.H)
        threading.Thread(target=srv.serve_forever, daemon=True).start()
        cfg = yaml.safe_load((lab / "config.yaml").read_text())
        cfg.update(work_dir=str(tmp / "work"), videos_dir=str(tmp), run_id="t")
        cfg["server"].update(base_url=f"http://127.0.0.1:{port}/v1", workers=2, retries=1)
        cfg["models"]["a"]["name"] = "mock-model"
        cp = tmp / "cfg.yaml"; cp.write_text(yaml.safe_dump(cfg))
        # a server started with VLLM_API_KEY refuses keyless calls (L-198): without the key the selftest stops with the
        # reason; with the same variable set here, every call carries it
        MS.H.key = "k-123"
        os.environ.pop("VLLM_API_KEY", None)
        try:
            VL.main(["--config", str(cp), "selftest"]); raise AssertionError("selftest passed without the key")
        except SystemExit as e:
            assert "401" in str(e) and "VLLM_API_KEY" in str(e), e
        os.environ["VLLM_API_KEY"] = "k-123"
        try:
            rc = VL.main(["--config", str(cp), "maturity", "--frames", str(fr), "--repeats", "2"])
        finally:
            os.environ.pop("VLLM_API_KEY", None); MS.H.key = None
        out = tmp / "work/out/t/maturity"
        S = json.loads((out / "scores.json").read_text())
        assert rc == 1 and S["flat"] and set(S["scores"]) == set(ids) and S["repeats"] == 2, (rc, S)
        assert all(len(json.loads((out / f"{f}.json").read_text())["runs"]) == 2 for f in ids)
        rep = VL.validate_outputs(cfg, tmp / "work/out/t", None, [], {})
        assert rep["counts"]["maturity"] == 6 and not [e for e in rep["errors"] if "maturity" in e], rep["errors"]
        assert G.spearman(list(S["scores"].values()), [1, 2, 3, 4, 5, 5]) is None
        # a grammar runaway (L-199: on the pod, '{"answer":' then whitespace to max_tokens) is retried without the grammar,
        # with the schema still in the prompt, and counted
        cl = VL.Client(yaml.safe_load(cp.read_text()), VL.Paths(yaml.safe_load(cp.read_text())))
        VL._schema_cache["_runaway"] = {"type": "object", "additionalProperties": False, "required": ["answer"],
                                        "properties": {"answer": {"type": "string"}}}
        cfg2 = yaml.safe_load(cp.read_text()); cfg2["server"]["retries"] = 2; cl.cfg = cfg2
        o = cl.call("selftest", "Answer with JSON.", [VL.Client.text("What is 17 + 25?")], "_runaway", key="ra", max_tokens=300)
        assert o == {"answer": "hello"} and cl.usage["grammar_runaways"] == 1, (o, dict(cl.usage))
        R = VL.receipts_summary(VL.Paths(yaml.safe_load(cp.read_text())))
        assert all(json.loads(l)["schema_in_prompt"] for l in (tmp / "work/raw/t/receipts.jsonl").read_text().splitlines()
                   if json.loads(l)["schema"]), "a call went out without its schema in the prompt"
        row = R["by_kind"]["maturity"]
        assert R["problem_count"] == 0 and row["calls"] == 12 and "45_maturity_rater.md" in row["skills_seen"] and row["thinking"] == 12, row
        # a server that refuses do_sample_frames (L-200): selftest falls back to another way of passing fps, keeps it,
        # and the stored error keeps the CAUSE (the tail), not only the head of an array dump
        MS.H.reject_sample = True
        try:
            (tmp / "work/selftest.json").unlink(missing_ok=True)
            VL.main(["--config", str(cp), "selftest"])
            st = json.loads((tmp / "work/selftest.json").read_text())
            assert st["video_mode"] == "fps" and st["video_correct"] and not st["video_modes"]["fps+sample"]["accepted"], st.get("video_modes")
            errs = [json.loads(p_.read_text())["error"] or "" for p_ in (tmp / "work/raw/t/selftest").glob("vid_fps_sample*.json")]
            assert errs and all("mock cause" in e for e in errs), errs[:1]
            assert VL.Client(yaml.safe_load(cp.read_text()), VL.Paths(yaml.safe_load(cp.read_text()))).video_mode == "fps"
            # the frame-rate probe (L-201): a server sampling at 4 fps passes, one left at vLLM's default of 2 fps fails
            MS.H.video_fps = 4
            (tmp / "work/selftest.json").unlink(missing_ok=True); VL.main(["--config", str(cp), "selftest"])
            st = json.loads((tmp / "work/selftest.json").read_text())
            assert st["video_rate_ok"] is True, st["video_rate"]
            MS.H.video_fps = 2
            (tmp / "work/selftest.json").unlink(missing_ok=True); VL.main(["--config", str(cp), "selftest"])
            st = json.loads((tmp / "work/selftest.json").read_text())
            assert st["video_rate_ok"] is False and any("wrong rate" in r for r in st["recommend"]), st["video_rate"]
        finally:
            MS.H.reject_sample = False; MS.H.video_fps = None
        # pairwise variant (L-202): Bradley-Terry recovers a known order, and a judge that always picks the first frame
        # shows position bias 1.0, order consistency 0 and a FLAT ranking (so it can never pass the gate)
        import random as _r
        rr = _r.Random(3); true = {f"x{i}": i for i in range(12)}; games = []
        for _ in range(400):
            a, b = rr.sample(sorted(true), 2)
            pa = 1 / (1 + 10 ** ((true[b] - true[a]) / 4)); games.append((a, b, 1.0 if rr.random() < pa else 0.0))
        bt = VL.bradley_terry(sorted(true), games)
        assert G.spearman([true[k] for k in sorted(true)], [bt[k] for k in sorted(true)]) > 0.9, bt
        assert VL.main(["--config", str(cp), "maturity", "--frames", str(fr), "--variant", "pairs", "--pairs", "2"]) == 0
        SP = json.loads((tmp / "work/out/t/maturity_pairs/scores.json").read_text())
        assert SP["first_frame_win_share"] == 1.0 and SP["order_consistency"] == 0.0, SP
        assert G.spearman([1, 2, 3, 4, 5, 6], [SP["scores"][f] for f in ids]) is None, SP["scores"]
        assert VL.main(["--config", str(cp), "maturity", "--frames", str(fr), "--variant", "styled", "--repeats", "1"]) == 1   # mock is flat
        R2 = VL.receipts_summary(VL.Paths(yaml.safe_load(cp.read_text())))
        assert R2["problem_count"] == 0 and "47_maturity_pairwise.md" in R2["by_kind"]["maturity_pair"]["skills_seen"], R2["problems"][:2]
        assert "00_rules.md" not in R2["by_kind"]["maturity_styled"]["skills_seen"], R2["by_kind"]["maturity_styled"]
        assert not [e for e in VL.validate_outputs(cfg, tmp / "work/out/t", None, [], {})["errors"] if "maturity" in e]
        # anchored variant (D-108): rated anchors go in front of every call; only the held-out frames are scored
        (fr / "anchors.json").write_text(json.dumps({"rater": "t", "anchors": [{"id": ids[0], "score": 1.0}, {"id": ids[1], "score": 5.0}],
                                                     "test": ids[2:]}))
        VL.main(["--config", str(cp), "maturity", "--frames", str(fr), "--variant", "anchored", "--repeats", "1"])
        SA = json.loads((tmp / "work/out/t/maturity_anchored/scores.json").read_text())
        assert sorted(SA["scores"]) == sorted(ids[2:]) and SA["anchors"] == ids[:2], SA
        R3 = VL.receipts_summary(VL.Paths(yaml.safe_load(cp.read_text())))
        assert R3["problem_count"] == 0 and R3["by_kind"]["maturity_anchored"]["calls"] == 4, R3["by_kind"].get("maturity_anchored")
        rec = [json.loads(l) for l in (tmp / "work/raw/t/receipts.jsonl").read_text().splitlines() if json.loads(l)["kind"] == "maturity_anchored"]
        assert all(r["media"].get("image") == 3 for r in rec), rec[:1]
        # L-206: an even, deterministic shot sample per film, first and last kept; null keeps every shot
        mm = {"shots": [{"id": f"s{i:03d}"} for i in range(10)]}
        assert [x["id"] for x in VL.shots_to_annotate(mm, {"media": {"max_shots_per_film": 4}})] == ["s000", "s003", "s006", "s009"]
        assert len(VL.shots_to_annotate(mm, {"media": {"max_shots_per_film": None}})) == 10
        # L-205: the prompt carries the schema's limits (the grammar does not); over-long arrays are trimmed and counted
        vs = VL.inline_refs(VL.schema("video"))
        o = {"best_moments": [{"t0": 0, "t1": 1}] * 9}
        assert VL.trim_to_limits(o, vs) == ["/best_moments: 9 > 6"] and len(o["best_moments"]) == 6
        assert '"maxItems"' in json.dumps(VL.prompt_schema("video")) and '"maxItems"' not in json.dumps(VL.model_schema("video"))
        # a missing frame is refused before any call
        (fr / f"{ids[0]}.jpg").unlink()
        try:
            VL.main(["--config", str(cp), "maturity", "--frames", str(fr)]); raise AssertionError("missing frame accepted")
        except SystemExit as e:
            assert "missing" in str(e)
        srv.shutdown()
        return "6 frames x 2 runs; schema-valid; flat mock judge flagged (exit 1); missing frame refused"
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


@test
def vision_lab_finds_weights_already_on_the_volume_and_only_trusts_complete_ones():
    """tools/vision_lab/find_model.py: weights left on the volume by another run are found in an HF cache anywhere or
    as a plain folder; a missing shard or an unfinished download makes a copy INCOMPLETE; --link makes a complete
    cache usable by setup.sh (symlink) or a plain folder usable by serve.sh (local_model_path), and refuses to link
    nothing."""
    import importlib.util, io, contextlib
    if _no_symlinks():
        return _no_symlinks()
    lab = ROOT / "tools" / "vision_lab"
    sp = importlib.util.spec_from_file_location("find_model", lab / "find_model.py"); FM = importlib.util.module_from_spec(sp); sp.loader.exec_module(FM)
    tmp = Path(tempfile.mkdtemp(prefix="lmt_fm_"))

    def snapshot(base: Path, shards: int, have: int, incomplete=False) -> Path:
        c = base / "models--Qwen--Qwen3.8-27B"; s = c / "snapshots" / "abc123"; s.mkdir(parents=True); (c / "blobs").mkdir()
        names = [f"model-{i + 1:05d}-of-{shards:05d}.safetensors" for i in range(shards)]
        (s / "model.safetensors.index.json").write_text(json.dumps({"weight_map": {f"w{i}": n for i, n in enumerate(names)}}))
        (s / "config.json").write_text("{}")
        for n in names[:have]:
            (s / n).write_bytes(b"x" * 10)
        if incomplete:
            (c / "blobs" / "deadbeef.incomplete").write_bytes(b"x")
        return c

    def run(*a):
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            rc = FM.main(list(a))
        return rc, buf.getvalue()
    try:
        empty = tmp / "empty"; empty.mkdir()
        rc, out = run("--root", str(empty), "--link")
        assert rc == 1 and "not found" in out and not (empty / "hf").exists(), out
        part = tmp / "partial"; snapshot(part / ".cache/huggingface/hub", 4, 3)
        rc, out = run("--root", str(part)); assert rc == 1 and "INCOMPLETE" in out and "1 of 4 shards missing" in out, out
        unf = tmp / "unfinished"; snapshot(unf / "x/hub", 2, 2, incomplete=True)
        rc, out = run("--root", str(unf)); assert rc == 1 and "unfinished downloads" in out, out
        good = tmp / "good"; c = snapshot(good / ".cache/huggingface/hub", 3, 3)
        rc, out = run("--root", str(good), "--link")
        link = good / "hf/hub/models--Qwen--Qwen3.8-27B"
        assert rc == 0 and "COMPLETE" in out and link.is_symlink() and link.resolve() == c.resolve(), out
        rc, out = run("--root", str(good), "--link"); assert rc == 0, out          # a second run is harmless
        plain = tmp / "plain"; d = plain / "models/Qwen3.8-27B"; d.mkdir(parents=True)
        (d / "config.json").write_text(json.dumps({"_name_or_path": "Qwen/Qwen3.8-27B"})); (d / "model.safetensors").write_bytes(b"x")
        rc, out = run("--root", str(plain), "--link")
        lp = plain / "hf/local_model_path__Qwen--Qwen3.8-27B"
        assert rc == 0 and lp.read_text().strip() == str(d), out
        return "absent, partial, unfinished, cached and plain layouts told apart; link and path written only for complete copies"
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


@test
def vision_lab_prepare_keeps_stills_inside_the_picture_and_fails_loudly_without_words():
    """L-193, L-194 (found on the pod, 2026-10-04): a film whose audio runs past its picture made the last shot's last
    still come out EMPTY (ffmpeg writes nothing past the last frame), failing 3 of 5 pilot films; and a Whisper
    failure silently produced films with no words. Now shots end with the picture, stills step back until a frame
    exists, and a film whose words were wanted but could not be made FAILS instead of passing half-blind."""
    import importlib.util, yaml
    if not which("ffmpeg"):
        return "skipped (no ffmpeg)"
    if _no_cv2():
        return _no_cv2()
    lab = ROOT / "tools" / "vision_lab"
    sp = importlib.util.spec_from_file_location("vl", lab / "vl.py"); VL = importlib.util.module_from_spec(sp); sp.loader.exec_module(VL)
    T = Path(tempfile.mkdtemp(prefix="lmt_prep_"))
    try:
        vids = T / "videos"; vids.mkdir()
        f = vids / "2025-05-01 - Synth [SYNTHvid002].mp4"
        parts = ";".join(f"color=c={c}:s=854x480:d=2:r=24[c{i}]" for i, c in enumerate(["red", "navy", "green"]))
        subprocess.run([which("ffmpeg"), "-v", "error", "-y", "-f", "lavfi", "-i", "sine=f=440:d=8:r=44100", "-filter_complex",
                        parts + ";[c0][c1][c2]concat=n=3:v=1[v]", "-map", "[v]", "-map", "0:a", "-c:v", "libx264", "-pix_fmt", "yuv420p",
                        "-c:a", "aac", str(f)], check=True, stdin=subprocess.DEVNULL)
        (vids / (f.stem + ".info.json")).write_text(json.dumps({"title": "Synth", "duration": 8, "upload_date": "20250501"}))
        pr = VL.probe(f)
        assert pr["duration"] >= 7.9 and abs(pr["video_duration"] - 6.0) < 0.1, pr
        cfg = yaml.safe_load((lab / "config.yaml").read_text())
        cfg.update(work_dir=str(T / "work"), videos_dir=str(vids), run_id="t"); cfg["select"]["min_duration_s"] = 1
        cfg["prepare"]["whisper_model"] = ""
        cp = T / "cfg.yaml"; cp.write_text(yaml.safe_dump(cfg))
        assert VL.main(["--config", str(cp), "select"]) == 0
        VL.main(["--config", str(cp), "prepare"])
        m = json.loads((T / "work/prep/SYNTHvid002/measure.json").read_text())
        last = m["shots"][-1]
        assert last["t1"] <= 6.05, m["shots"]
        assert len(list((T / "work/prep/SYNTHvid002/shots" / last["id"]).glob("k*.jpg"))) == 3
        a = VL.load_wav16(T / "work/prep/SYNTHvid002/audio.wav")
        assert a.dtype.name == "float32" and 7.5 * 16000 < len(a) < 8.5 * 16000, len(a)
        shutil.rmtree(T / "work/prep")
        cfg["prepare"]["whisper_model"] = "no-such-model"; cp.write_text(yaml.safe_dump(cfg))
        VL.main(["--config", str(cp), "prepare"])
        assert not (T / "work/prep/SYNTHvid002/measure.json").exists(), "a film without words passed while words were wanted"
        return f"picture 6 s inside an 8 s file: {len(m['shots'])} shots end at {last['t1']} s, 3 stills each; no-words film refused"
    finally:
        shutil.rmtree(T, ignore_errors=True)


@test
def golden_set_builds_blind_and_its_report_and_judge_gate_can_fail():
    """loom/golden.py (D-102 E1): frames from a video, a still and a lab strip panel are normalised alike; the page's
    session reveals no key, class or source; repeats sit far apart; bad ratings are refused; the report is RED on zero
    ratings and on a flat rater; Spearman is 1 for a judge that agrees, -1 for one that inverts, and only the first may
    gate."""
    from PIL import Image
    from loom import golden as G
    if not which("ffmpeg"):
        return "skipped (no ffmpeg)"
    T = Path(tempfile.mkdtemp(prefix="gold_"))
    try:
        src = T / "src"; src.mkdir()
        items = []
        for i in range(24):                      # 24 stills, each a different grey, so a judge can be built from them
            Image.new("RGB", (1920, 1080), (10 * i, 10 * i, 10 * i)).save(src / f"s{i}.png")
            items.append({"key": f"still_{i:02d}", "class": "a" if i < 12 else "b", "src": f"t:src/s{i}.png"})
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "color=c=red:s=640x360:d=3", "-pix_fmt", "yuv420p",
                        str(src / "v.mp4")], check=True, stdin=subprocess.DEVNULL)
        items.append({"key": "video_red", "class": "a", "src": "t:src/v.mp4", "t": 1.5})
        sheet = Image.new("RGB", (2 * 646 + 6, 2 * 390 + 46), (17, 17, 17))      # lab.py's strip layout, 2 x 2
        sheet.paste(Image.new("RGB", (640, 360), (0, 0, 255)), (6 + 646, 46 + 390 + 24))
        sheet.save(src / "strip.jpg", quality=95)
        items.append({"key": "panel_blue", "class": "b", "src": "t:src/strip.jpg", "panel": [1, 1]})
        spec = {"version": 1, "seed": 5, "repeats": 3, "items": items, "roots": {"t": [str(T)]},
                "frame": {"width": 640, "height": 360, "keep_top": 0.86, "reencode_crf": 26}}
        write_json(T / "spec.json", spec)
        man = G.build(spec_path=T / "spec.json", cache=T / "cache", manifest_path=T / "man.json")
        fr = {f["key"]: f for f in man["frames"]}
        assert len(fr) == 26 and not man["missing"], man["missing"]
        for k, rgb in (("video_red", (1, 0, 0)), ("panel_blue", (0, 0, 1))):
            im = Image.open(T / "cache/frames" / f"{fr[k]['fid']}.jpg")
            assert im.size == (640, 310), im.size
            px = im.getpixel((320, 150)); dom = max(range(3), key=lambda c: px[c])
            assert rgb[dom] == 1 and px[dom] > 150, (k, px)       # the right panel, not the dark gutter or another tile
        seq = man["sequence"]
        assert len(seq) == 29 and len({s["entry"] for s in seq}) == 29
        pos = {}
        for i, s in enumerate(seq):
            pos.setdefault(s["fid"], []).append(i)
        gaps = [v[1] - v[0] for v in pos.values() if len(v) > 1]
        assert len(gaps) == 3 and min(gaps) >= 20, gaps
        # the rater sees opaque entries only
        blob = json.dumps([s["entry"] for s in seq])
        assert not any(f["key"] in blob or f["fid"] in blob for f in man["frames"])
        R = T / "ratings"
        for bad in ({"entry": seq[0]["entry"], "score": 6}, {"entry": seq[0]["entry"], "score": True},
                    {"entry": "nope", "score": 3}):
            try:
                G.record("tester", bad, man, R); raise AssertionError(f"accepted {bad}")
            except LoomError:
                pass
        # zero ratings is red, not a pass
        rep = G.report("tester", manifest_path=T / "man.json", ratings_dir=R, write=False)
        assert rep["red"] and rep["rated"] == 0, rep
        # a flat rater is red
        for s in seq:
            G.record("flat", {"entry": s["entry"], "score": 3}, man, R)
        assert any("same score" in r for r in G.report("flat", manifest_path=T / "man.json", ratings_dir=R, write=False)["red"])
        # a real rater: brighter stills score higher (1..5), repeats answered consistently
        def truth(f):
            k = f["key"]
            return 1 + int(k[-2:]) * 4 // 23 if k.startswith("still") else 3
        byfid = {f["fid"]: f for f in man["frames"]}
        for s in seq:
            G.record("tester", {"entry": s["entry"], "score": truth(byfid[s["fid"]]), "tags": ["type"]}, man, R)
        good = {k: float(int(k[-2:])) for k in fr if k.startswith("still")}
        write_json(T / "judge_good.json", {"scores": good})
        write_json(T / "judge_bad.json", {k: -v for k, v in good.items()})
        g = G.report("tester", judge=T / "judge_good.json", manifest_path=T / "man.json", ratings_dir=R, write=False)
        b = G.report("tester", judge=T / "judge_bad.json", manifest_path=T / "man.json", ratings_dir=R, write=False)
        assert g["complete"] and g["self_consistency"]["exact"] == 1.0, g["self_consistency"]
        assert g["judge"]["rho"] > 0.95 and g["judge"]["may_gate"], g["judge"]
        assert b["judge"]["rho"] < -0.95 and not b["judge"]["may_gate"], b["judge"]
        assert G.spearman([1, 1, 1, 1, 1], [1, 2, 3, 4, 5]) is None and G.spearman([1, 2], [1, 2]) is None
        assert abs(G.spearman([1, 2, 3, 4, 5], [2, 1, 4, 3, 5]) - 0.8) < 1e-9
        return f"26 frames, 29 presentations, repeat gaps {sorted(gaps)}; rho good {g['judge']['rho']}, bad {b['judge']['rho']}"
    finally:
        shutil.rmtree(T, ignore_errors=True)


def _register_suites():
    """Test suites in tests/suites/*.py (D-114): each module's public functions with a known prefix are tests, so a
    new area adds a file instead of editing this one. A module that fails to import is itself a failing test (never a
    silent zero)."""
    import importlib.util
    sdir = ROOT / "tests" / "suites"
    prefixes = ("primitive_", "mock_llm_", "agents_", "check_", "pipeline_")
    for f in sorted(sdir.glob("*.py")) if sdir.exists() else []:
        try:
            spec = importlib.util.spec_from_file_location(f"suite_{f.stem}", f)
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)
        except Exception as e:  # noqa: BLE001
            def broken(e=e, f=f):
                raise AssertionError(f"suite {f.name} does not import: {e}")
            broken.__name__ = f"suite_import_{f.stem}"
            RESULTS.append(broken)
            continue
        for name in sorted(n for n in vars(mod) if n.startswith(prefixes) and callable(getattr(mod, n))):
            fn = getattr(mod, name)
            if getattr(fn, "__module__", None) == mod.__name__:
                RESULTS.append(fn)


@test
def suites_are_registered_and_none_is_empty():
    """the suite loader itself: every file in tests/suites contributes at least one test (a zero is red)"""
    sdir = ROOT / "tests" / "suites"
    files = sorted(p.stem for p in sdir.glob("*.py"))
    assert files, "no suites found"
    got = {fn.__module__.replace("suite_", "", 1) for fn in RESULTS if fn.__module__.startswith("suite_")}
    empty = [f for f in files if f not in got]
    assert not empty, f"suites with no registered test: {empty}"
    return f"{len(files)} suites, {sum(1 for fn in RESULTS if fn.__module__.startswith('suite_'))} tests"


def main():
    _register_suites()
    browser = "--browser" in sys.argv
    # --only a,b / --exclude a,b: run a subset by name substring (a sandbox call is capped near 3 minutes, L-132)
    arg = lambda k: next((sys.argv[i + 1] for i, a in enumerate(sys.argv[:-1]) if a == k), None)
    only, excl = [x for x in (arg("--only") or "").split(",") if x], [x for x in (arg("--exclude") or "").split(",") if x]
    picked = [fn for fn in RESULTS if (not only or any(o in fn.__name__ for o in only)) and not any(x in fn.__name__ for x in excl)]
    if (only or excl) and not picked:
        print("no test matches the filter (a zero is not a result)"); return 2
    ok = fail = 0
    skipped = []
    for fn in picked:
        try:
            r = fn()
            if isinstance(r, str) and r.startswith("skipped"):
                # a skip is not a pass: name it, so a machine that cannot render is visible (L-126)
                print(f"  SKIP  {fn.__name__}  ({r})")
                skipped.append(fn.__name__)
                continue
            print(f"  PASS  {fn.__name__}" + (f"  ({r})" if r else ""))
            ok += 1
        except Exception as e:
            print(f"  FAIL  {fn.__name__}: {e}")
            traceback.print_exc(limit=2)
            fail += 1
    if browser:
        from loom import qa
        rep = qa.probe(Project(DEMO))
        print("  PASS  browser probe" if rep.get("ready") and not rep.get("errors") else f"  FAIL  browser probe {rep.get('errors')}")
    print(f"\n{ok} passed, {fail} failed, {len(skipped)} skipped" + (f" ({', '.join(skipped)})" if skipped else "")
          + (f"  [subset: {len(picked)} of {len(RESULTS)}]" if len(picked) != len(RESULTS) else ""))
    return 1 if fail else 0


if __name__ == "__main__":
    raise SystemExit(main())

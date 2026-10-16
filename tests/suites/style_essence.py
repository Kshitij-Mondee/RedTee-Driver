"""Each style's essence (D-192). Kshitij: "every video style is not just a different STYLE, but also should have different
visualization techniques and different foundations for explaining ... They all can't just keep reusing the same assets
... we will also be recommending users what style to use after the user interview".

  cards      one essence per style pack, the fields the planners and the recommender read, no em or en dash, a fit per
             kind of video; a distinct style names its own techniques and calls, and what it must not borrow
  reach      Relay's script, outline, storyboard and critic tasks, Shuttle's P4, P5 and P10 and get_style_pack (`essence`
             first) carry it; a mix of "auto" takes the style's native mix, "classic" stays classic (both ways kept)
  checks     a distinct style's storyboard of mostly templates warns `style_borrowed`; a bespoke beat using none of the
             style's calls warns `scene_off_style`; controls: a simple style and an on-style beat are quiet
  recommend  the four test topics get the style they were made in (hologram, screencast, isometric) among the top 3
"""
from __future__ import annotations

import re
import shutil
import sys
import tempfile
from contextlib import contextmanager
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from loom import essence as S  # noqa: E402
from loom.project import Project  # noqa: E402
from loom.util import write_json  # noqa: E402

KINDS = ("explainer", "teaching", "onboarding", "policy", "soft-skills")


@contextmanager
def _lesson(style: str, scenes: list | None = None, files: dict | None = None):
    d = Path(tempfile.mkdtemp(prefix="loom_essence_"))
    try:
        write_json(d / "project.json", {"id": "ess-test", "topic": "How an online order reaches a customer's door", "mode": "topic",
                                        "request": {"style": style, "genre": "explainer", "mix": "auto"}})
        src = ROOT / "projects" / "st-iso-order" / "plan"
        (d / "plan").mkdir(parents=True)
        for f in src.glob("*.json"):
            shutil.copy2(f, d / "plan" / f.name)
        if scenes is not None:
            write_json(d / "plan/storyboard.json", {"style": style, "scenes": scenes})
        for name, code in (files or {}).items():
            (d / "scenes").mkdir(exist_ok=True)
            (d / "scenes" / name).write_text(code, encoding="utf-8")
        yield Project(d)
    finally:
        shutil.rmtree(d, ignore_errors=True)


def check_essence_one_per_style_with_its_own_techniques():
    packs = sorted(p.stem for p in (ROOT / "packs/styles").glob("*.json"))
    assert packs and S.styles() == packs, f"an essence per style pack: {sorted(set(packs) ^ set(S.styles()))}"
    E = []
    for sid in packs:
        e = S.load(sid)
        txt = (ROOT / "packs/essence" / f"{sid}.json").read_text(encoding="utf-8")
        if re.search("[–—]", txt):
            E.append(f"{sid}: an em or en dash")
        for k in ("essence", "explains_by", "techniques", "vocabulary", "fits", "tier"):
            if not e.get(k):
                E.append(f"{sid}: no {k}")
        if set((e.get("fits") or {}).get("kinds") or {}) != set(KINDS):
            E.append(f"{sid}: a fit for every kind of video ({KINDS})")
        if e.get("tier") == "distinct":
            if len(e.get("techniques") or []) < 3 or not e.get("avoid"):
                E.append(f"{sid}: a distinct style names at least 3 techniques and what it must not borrow")
    assert not E, E
    distinct = [s for s in packs if S.load(s)["tier"] == "distinct"]
    for must in ("hologram", "isometric", "screencast", "cinematic-dawn", "cinematic-noir", "flat-cosmos"):
        assert must in distinct, f"{must} is a distinct style"
    return f"{len(packs)} essences ({len(distinct)} distinct), every field and kind present"


def check_essence_reaches_the_planners_and_the_native_mix():
    from loom.agents.conductor import task_message
    from loom.allocate import resolve_mix
    from loom.shuttle import launch as LA
    with _lesson("hologram") as p:
        for role in ("script", "storyboard_outline", "storyboard"):
            assert "STYLE ESSENCE (hologram" in task_message(p, role, {}), f"Relay's {role} lacks the essence"
        for grp in (("P1", "P4"), ("P5", "P6"), ("P10", "P10")):
            assert "STYLE ESSENCE (hologram" in LA.start_message(p, grp, {}), f"Shuttle {grp} lacks the essence"
    m = resolve_mix("auto", "hologram")
    assert m.get("name") == "native" and m["template"] <= 0.2, m
    assert resolve_mix("classic", "hologram")["template"] == 0.5, "control: classic stays the person's choice"
    assert resolve_mix("auto", "corporate-clean").get("name") == "classic", "a simple style's auto is the classic mix"
    return "Relay script, outline, storyboard and Shuttle P1-P4, P5-P6, P10 carry it; auto is native for hologram, classic for corporate-clean"


def check_essence_checks_borrowed_templates_and_off_style_beats():
    tpl = [{"beat": f"b{i:02d}", "kind": "template" if i % 2 else "bespoke"} for i in range(1, 11)]
    with _lesson("hologram", tpl) as p:
        assert any(w.startswith("style_borrowed") for w in S.storyboard_warnings(p, {"style": "hologram", "scenes": tpl}))
    with _lesson("corporate-clean", tpl) as p:
        assert not S.storyboard_warnings(p, {"style": "corporate-clean", "scenes": tpl}), "control: a simple style may share"
    sc = [{"beat": "b01", "kind": "bespoke"}, {"beat": "b02", "kind": "bespoke"}]
    files = {"b01.js": "Loom.scene('b01', { build(ctx) { const H = ctx.engine.hud(ctx, {}); H.trace('x', {}); } });",
             "b02.js": "Loom.scene('b02', { build(ctx) { const E = ctx.el('box', {}); ctx.kit.rect(E.inner, 0, 0, 9, 9, {}); } });"}
    with _lesson("hologram", sc, files) as p:
        W = S.scene_warnings(p, {"scenes": sc})
        assert W and "b02" in W[0] and "b01" not in W[0], W
    return "style_borrowed for a template-heavy hologram (quiet for corporate-clean); b02 off style, b01 on"


def check_essence_recommends_the_style_a_topic_speaks():
    cases = {"How an AI model turns a question into an answer": "hologram",
             "Setting up two-step sign-in and a password manager at work": "screencast",
             "How an online order reaches a customer's door": "isometric",
             "Giving feedback to a colleague": "story-cartoon"}
    bad = {t: [r["style"] for r in S.recommend(t)] for t, want in cases.items() if want not in [r["style"] for r in S.recommend(t)]}
    assert not bad, f"the style that fits is not in the top 3: {bad}"
    r = S.recommend("How an AI model turns a question into an answer")[0]
    assert r["why"] and r["essence"], r
    return "the four topics get their style in the top 3, each with reasons"


_COMP = r"""
Loom.component("t_inbox", { version: 1, idea: "an inbox", outline: ["rows"], styles: ["screencast"],
  params: { title: { type: "str", content: true } },
  build(ctx, g, p) { ctx.kit.rect(g, 0, 0, 300, 100, { fill: "surface" }); return {}; } });
Loom.scene("b1", { build(ctx) { ctx.use("t_inbox", { title: "Mail" }, { x: 100, y: 100, name: "inbox" }); } });
"""


def primitive_runtime_a_component_is_used_only_in_its_own_styles():
    """A component declaring `styles: ["screencast"]` (D-193; Kshitij: "does hologram even need an email?") is an error,
    `component_off_style`, in a hologram lesson; control: the same scene in screencast raises nothing of the kind."""
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from runtime_film_defects import _ONE, _SKIP, _browser, _lesson as _page, _run
    if not _browser():
        return _SKIP
    codes = {}
    for style in ("hologram", "screencast"):
        out = _run(_page(_COMP, [{"kind": "bespoke"}], _ONE, 1, style=style), "function () { return 1; }", [1.0])
        codes[style] = [e["code"] for e in out["report"]["errors"]]
    assert "component_off_style" in codes["hologram"], codes
    assert "component_off_style" not in codes["screencast"], f"control: its own style must pass: {codes}"
    return f"off style in hologram, clean in screencast ({codes})"


def check_catalog_search_offers_a_component_only_to_its_styles():
    from loom.agents import tools as T
    saved = T._catalog
    try:
        T._catalog = lambda: {"components": {"app_inbox": {"doc": "an email inbox", "styles": ["screencast"], "job": ["email"]}}}
        class C:
            pass
        for style, want in (("hologram", 0), ("screencast", 1)):
            c = C(); c.project = type("P", (), {"request": {"style": style}})()
            got = len(T.t_catalog_search(c, "email inbox")["results"])
            assert got == want, f"{style}: {got} results (wanted {want})"
    finally:
        T._catalog = saved
    return "an email inbox made for screencast is offered there, not to a hologram lesson"

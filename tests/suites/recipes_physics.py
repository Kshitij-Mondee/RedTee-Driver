"""Physics recipes (runtime/recipes_physics.js, D-139): each recipe's lab scene (scenes_examples/lab/recipe_phys_*.js)
is loaded in headless Chrome, and the outcome the lesson states is read back from the BAKED world, the same poses the
frames show: the counts each sieve layer stops, the bin each item lands in, the token the ball lands on, the shares
in each bin, which tiles a full window keeps. Every test has controls that show it can fail: the recipe's own check
against other numbers must report problems, and the same recipe built again with other inputs must land on those
other numbers (so the probe is not reading a constant). A third check: every word the scene draws is an input.
Browser tests skip without a browser (tests/browser_support.py)."""
from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))   # tests/: one browser check for every suite
from browser_support import browser  # noqa: E402

ENGINE = Path(__file__).resolve().parents[2]
if str(ENGINE) not in sys.path:
    sys.path.insert(0, str(ENGINE))

_NODE = r"""
const { createRequire } = require("module");
const req = createRequire(%(engine)s + "/tools/node/x.js");
const puppeteer = req("puppeteer-core");
(async () => {
  const b = await puppeteer.launch({ executablePath: process.env.HYPERFRAMES_BROWSER_PATH, headless: "shell",
    args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--allow-file-access-from-files"] });
  try {
    const p = await b.newPage();
    await p.setViewport({ width: 1920, height: 1080 });
    const logs = [];
    p.on("pageerror", (e) => logs.push(String(e).slice(0, 300)));
    await p.goto("file://" + %(page)s, { waitUntil: "load", timeout: 120000 });
    await p.waitForFunction("window.__sheet_ready === true", { timeout: 90000 });
    const res = await p.evaluate(`(function () {
      const R = Loom.report;
      const first = { recs: JSON.parse(JSON.stringify(R.physics_recipes || [])), physics: JSON.parse(JSON.stringify(R.physics || [])),
                      errors: R.errors.slice(), warnings: R.warnings.slice(), texts: R.texts.map((t) => t.text) };
      // a context for building the same recipe again with other inputs (the control), drawn into a hidden group
      const svg = document.querySelector("svg"), G = Loom.svg("g", { opacity: 0 }, svg);
      const ctx = { beat: { id: "probe" }, start: 0, end: 20, box: Object.assign({}, Loom.kit.SAFE), kit: Loom.kit, g: G,
        el(n, o) { return Loom.kit.element((o && o.parent) || G, n, o); }, group() { return Loom.svg("g", {}, G); } };
      const control = (%(control)s)(ctx);
      const after = { warnings: R.warnings.slice(first.warnings.length), errors: R.errors.slice(first.errors.length) };
      return { first, control: JSON.parse(JSON.stringify(control)), after };
    })()`);
    res.logs = logs;
    console.log(JSON.stringify(res));
  } finally { await b.close(); }
})().catch((e) => { console.error(String(e && e.stack || e)); process.exit(1); });
"""


def _browser() -> str | None:
    return browser()   # the shared check (tests/browser_support.py): env var, else the HyperFrames Chrome (L-127)


def _run(scene: str, control_js: str, style: str = "corporate-clean") -> dict:
    from loom import lab
    tmp, _meta, _st, _t = lab.page(scene, style, times=[0.0])
    try:
        js = _NODE % {"engine": json.dumps(str(ENGINE).replace("\\", "/")), "page": json.dumps(str(tmp / "lab.html").replace("\\", "/")),
                      "control": control_js}
        r = subprocess.run(["node", "-e", js], capture_output=True, text=True, timeout=170, cwd=str(ENGINE), env=dict(os.environ))
        assert r.returncode == 0, f"harness failed: {r.stderr[-800:]}"
        return json.loads(r.stdout.strip().splitlines()[-1])
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def _scene_inputs(scene: str) -> set[str]:
    """every string literal in the lab scene (the sample inputs): the only words its picture may carry"""
    src = (ENGINE / "scenes_examples" / "lab" / f"{scene}.js").read_text(encoding="utf-8")
    body = src.split("Loom.scene(", 1)[1]
    return set(re.findall(r'"([^"\\]*)"', body))


_NUMBER = re.compile(r"^\d+(\.\d+)?%?$")


def _common(res: dict, scene: str, names: list[str]) -> dict:
    """no runtime errors; each named recipe reported ok, its world settled and nothing lost; every word drawn is an
    input (or a number made from the inputs)"""
    first = res["first"]
    assert not res.get("logs"), res["logs"][:3]
    assert not first["errors"], first["errors"][:3]
    recs = {r["name"]: r for r in first["recs"]}
    missing = [n for n in names if n not in recs]
    assert not missing, f"no report for {missing} (have {sorted(recs)})"
    for n in names:
        r = recs[n]
        assert r["ok"] and not r["problems"], f"{n}: {r['problems']}"
        assert r["expected"] == r["got"], f"{n}: expected {r['expected']} got {r['got']}"
        assert r.get("settled") is not False, f"{n}: the world did not settle"
        assert not r.get("lost"), f"{n}: bodies left the world: {r['lost']}"
    assert not [w for w in first["warnings"] if w["code"].startswith("physics")], [w for w in first["warnings"] if w["code"].startswith("physics")][:3]
    allowed = _scene_inputs(scene)
    stray = [t for t in first["texts"] if t not in allowed and not _NUMBER.match(t.strip())]
    assert first["texts"], "the probe saw no text at all (blind?)"
    assert not stray, f"words on the picture that are not inputs: {stray[:5]}"
    return recs


def _controls(res: dict, recs: dict, name: str) -> dict:
    """the recipe's own check against other numbers reports problems (and warns by name); the rebuilt recipe with other
    inputs is ok against ITS inputs and lands somewhere else than the lab's"""
    c = res["control"]
    assert c["checkProblems"], "check() against other numbers found nothing: the comparison cannot fail"
    assert any(w["code"] == "physics_recipe_outcome" for w in res["after"]["warnings"]), "a failed check did not warn physics_recipe_outcome"
    other = c["other"]
    assert other and other["ok"], f"the rebuilt recipe disagrees with its own inputs: {other and other['problems']}"
    assert other["got"] != recs[name]["got"], "other inputs gave the same outcome: the probe reads a constant"
    assert not res["after"]["errors"], res["after"]["errors"][:3]
    return other


def _ctl(recipe: str, name: str, opts: dict, bad_expected: dict) -> str:
    return ("function (ctx) { const P = Loom.physics; const h = P.recipes[%s];"
            " const checkProblems = h.check(%s);"
            " const o = P.%s(ctx, 'probe_other', %s);"
            " return { checkProblems, other: o && { ok: o.ok, problems: o.problems, expected: o.expected, got: o.got } }; }"
            % (json.dumps(name), json.dumps(bad_expected), recipe, json.dumps(opts)))


def _test(scene: str, recipe: str, names: list[str], opts: dict, bad: dict) -> str:
    if not _browser():
        return "skipped (no browser here)"
    res = _run(scene, _ctl(recipe, names[0], opts, bad))
    recs = _common(res, scene, names)
    other = _controls(res, recs, names[0])
    seen = "; ".join(n + " " + json.dumps(recs[n]["got"]) for n in names)
    return f"{seen}; control {json.dumps(other['got'])}"


def primitive_recipe_sieve_stops_the_given_counts_per_layer():
    """sieve: each layer stops exactly the count given and the rest reach the bottom; control: 6, 4, 2 of 15 land as 6, 4, 2"""
    return _test("recipe_phys_sieve", "sieve", ["phish_layers"],
                 {"layers": ["A", "B", "C"], "stopped": [6, 4, 2], "total": 15, "t": 0.2, "seed": 9, "x": 96, "y": 84, "w": 1728, "h": 846},
                 {"layer 1": 11, "layer 2": 4, "layer 3": 3, "bottom": 3})


def primitive_recipe_sort_into_bins_lands_every_item_in_its_bin():
    """sortIntoBins: every item ends in the bin the input names; control: three bins, items to the outer ones"""
    return _test("recipe_phys_sort_into_bins", "sortIntoBins", ["paste_sort"],
                 {"bins": ["X", "Y", "Z"], "items": [["one", 2], ["two", 0], ["three", 2], ["four", 1], ["five", 0]], "t": 0.2},
                 {"Public blog post #0": "Never paste"})


def primitive_recipe_next_token_draw_lands_in_the_chosen_token():
    """nextTokenDraw: each ball lands in its chosen candidate; control: high temperature, a draw of the smallest bin"""
    return _test("recipe_phys_next_token_draw", "nextTokenDraw", ["next_word"],
                 {"candidates": ["p", "q", "r"], "probs": [0.7, 0.2, 0.1], "temperature": "high", "chosen": ["r", "p"], "t": 0.2},
                 {"draw 1": "moon", "draw 2": "sofa"})


def primitive_recipe_pue_pour_splits_beads_by_share():
    """puePour: beads per bin are the shares of the total (largest remainder); control: other shares, other counts"""
    return _test("recipe_phys_pue_pour", "puePour", ["pue"],
                 {"itShare": 0.5, "itLabel": "IT", "overheads": [["Cool", 0.4], ["Other", 0.1]], "beads": 20, "t": 0.2},
                 {"IT equipment": 10, "Cooling": 8, "Power conversion": 1, "Lighting": 1})


def primitive_recipe_train_test_split_counts_and_lock():
    """trainTestSplit: the shares of the examples land in the three bins and the lid locks the test bin; control: 60/20/20"""
    return _test("recipe_phys_train_test_split", "trainTestSplit", ["split"],
                 {"examples": 20, "split": [0.6, 0.2, 0.2], "labels": ["a", "b", "c"], "t": 0.2},
                 {"Train": 16, "Validate": 4, "Test": 4, "lid on Test": 1})


def primitive_recipe_biased_funnel_output_has_the_out_shares():
    """biasedFunnel: the output tray holds the out-share counts per group; control: three groups, other shares"""
    return _test("recipe_phys_biased_funnel", "biasedFunnel", ["sample_bias"],
                 {"groups": ["g1", "g2", "g3"], "inShares": [0.4, 0.3, 0.3], "outShares": [0.2, 0.3, 0.5], "total": 20, "t": 0.2},
                 {"Group A": 6, "Group B": 6})


def primitive_recipe_priority_jar_fits_only_big_first():
    """priorityJar: big first, every rock and brick is inside the rim; small first, no rock is; control: 2 rocks, 9 bricks,
    small first"""
    return _test("recipe_phys_priority_jar", "priorityJar", ["jar_small_first", "jar_big_first"],
                 {"big": ["Aa", "Bb"], "small": 9, "order": "big_first", "t": 0.2, "x": 300, "y": 100, "w": 900, "h": 800},
                 {"big inside the rim": 3, "small inside the rim": 12})


def primitive_recipe_redundancy_topple_holds_only_with_a_spare():
    """redundancyTopple: one support, the beam falls; two, it stands; control: a second single-support world falls too
    (and differs from the lab's two-support one)"""
    if not _browser():
        return "skipped (no browser here)"
    names = ["two_feeds", "one_feed"]
    res = _run("recipe_phys_redundancy_topple", _ctl("redundancyTopple", "two_feeds",
               {"supports": 1, "labels": ["P"], "t": 0.2, "knockAt": 0.9, "x": 96, "y": 300, "w": 1728, "h": 500},
               {"pillar A knocked out": 1, "the beam still stands": 0}))
    recs = _common(res, "recipe_phys_redundancy_topple", names)
    other = _controls(res, recs, "two_feeds")
    assert recs["one_feed"]["got"]["the beam still stands"] == 0 and recs["two_feeds"]["got"]["the beam still stands"] == 1
    return f"one support falls, two hold; control (one support) {other['got']}"


def primitive_recipe_inbox_flood_fills_the_tray_then_spills():
    """inboxFlood: the first `capacity` envelopes stay in the tray, the rest spill; control: capacity 4 of 9"""
    return _test("recipe_phys_inbox_flood", "inboxFlood", ["reply_all"],
                 {"seed": "s", "replies": ["r1", "r2"], "capacity": 4, "count": 9, "t": 0.2},
                 {"in the tray": 7, "spilled over the edge": 8})


def primitive_recipe_context_window_keeps_the_right_tiles():
    """contextWindow: oldest_out keeps the last `capacity` tiles and drops the oldest; refuse keeps the first and holds the
    rest on the lid; control: capacity 3 of 5, oldest out"""
    if not _browser():
        return "skipped (no browser here)"
    names = ["window_oldest", "window_refuse"]
    res = _run("recipe_phys_context_window", _ctl("contextWindow", "window_oldest",
               {"capacity": 3, "tiles": ["a1", "b2", "c3", "d4", "e5"], "policy": "oldest_out", "t": 0.2, "gap": 0.8, "x": 96, "y": 300, "w": 1728, "h": 440},
               {"The #0": "in the window"}))
    recs = _common(res, "recipe_phys_context_window", names)
    other = _controls(res, recs, "window_oldest")
    return f"oldest out and refuse as stated; control {other['got']}"

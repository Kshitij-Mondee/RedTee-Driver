"""The four pieces Kshitij asked for on 2026-10-15 after the lemo-opuscar study (D-173 to D-176), each with a control
that shows the test can fail:

  timing grid    one join table everywhere; narrate sizes silences for the join compose settles on; the grid's
                 sections tile the lesson and start on bar lines; storyboard sounds on cues are planned (they were
                 dropped before); the mix places exactly the planned sounds and records them; music.enabled false is
                 honoured; the grid check fails on a dropped sound, a stale mix and an unresolved sound cue
  speech check   numbers, names and plain words compared with a transcription; filler at the edges and spelling
                 variants ignored; a misread number fails with its phrase id; a person's acceptance is tied to the
                 phrase's text; asr off is a warning; 0 phrases is red
  style engines  an engine is linted (its id, no clock or random, a pack of that id); the runtime registry defines,
                 refuses bad engines and serves the current style's
  page clips     scene lint and library checks; every approved library's files exist; a page renders the same frame
                 twice and the same video with 1 or 2 workers; a scene that asks for the network fails
"""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))   # tests/: one browser check for every suite
from browser_support import browser  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from loom.util import read_json, which, write_json  # noqa: E402


class FakeProject:
    """a throwaway project folder with only the files a test writes"""
    def __init__(self, request=None):
        self.root = Path(tempfile.mkdtemp(prefix="loomgrid_"))
        self.request = request or {}
        self.id = "fake"

    def path(self, rel):
        p = self.root / rel
        p.parent.mkdir(parents=True, exist_ok=True)
        return p

    def close(self):
        shutil.rmtree(self.root, ignore_errors=True)


def _wav(path, seconds, sr=24000, tone=False):
    x = np.zeros(int(seconds * sr), np.float32)
    if tone:
        x += 0.2 * np.sin(2 * np.pi * 220 * np.arange(len(x)) / sr).astype(np.float32)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((x * 32767).astype(np.int16).tobytes())


def _tm():
    def ph(text, s, e):
        ws = text.split(); d = (e - s) / len(ws)
        return {"text": text, "s": s, "e": e, "words": [{"w": w, "s": round(s + i * d, 3), "e": round(s + (i + 1) * d, 3)} for i, w in enumerate(ws)]}
    beats = [
        {"id": "b01", "section": "s1", "start": 0.0, "speech_start": 0.6, "speech_end": 4.0, "pause_after": 0, "phrases": [ph("Say the signal arrives late.", 0.6, 4.0)]},
        {"id": "b02", "section": "s1", "start": 4.5, "speech_start": 5.0, "speech_end": 9.0, "pause_after": 2.0, "phrases": [ph("Which clock is right?", 5.0, 9.0)]},
        {"id": "b03", "section": "s2", "start": 11.5, "speech_start": 12.0, "speech_end": 18.0, "pause_after": 0, "phrases": [ph("The one in orbit runs fast.", 12.0, 18.0)]},
    ]
    for i, b in enumerate(beats):
        b["end"] = beats[i + 1]["start"] if i + 1 < len(beats) else 20.0
    return {"duration": 20.0, "beats": beats}


SCRIPT = {"sections": [{"id": "s1", "title": "One"}, {"id": "s2", "title": "Two"}]}


def _scenes():
    return [{"beat": "b01", "join_in": {"type": "cut"}, "join_window": [0.0, 0.0]},
            {"beat": "b02", "join_in": {"type": "camera"}, "join_window": [4.02, 4.97], "sfx": [{"kind": "pop", "cue": "clock"}, {"kind": "tick", "cue": "never said"}]},
            {"beat": "b03", "join_in": {"type": "wipe"}, "join_window": [11.0, 11.9]}]


# ------------------------------------------------------------------ the timing grid (D-173)
def check_grid_one_join_table_and_narrate_uses_the_settled_join():
    """compose, narrate, the runtime and the mix share loom/timing.py's join table; narrate's silence before a beat is
    sized for the join compose settles on (a storyboard that names only a meaning, "time", gets a wipe, and the wipe's
    silence, not the 0.62 s default). Control: the raw storyboard type gives the old gap."""
    from loom import compose as CO, timing as TG
    from loom.narrate import settled_joins
    assert CO.JOIN_DUR is TG.JOIN_DUR and CO.captions_from is TG.captions_from
    assert "manifest.grid.join_dur" in (ROOT / "runtime/world.js").read_text(encoding="utf-8"), "world.js does not read the grid's join table"
    for j in TG.SCREEN_JOINS + TG.MOVE_JOINS:
        assert TG.join_gap(j) >= TG.JOIN_DUR[j], f"the silence before a {j} ({TG.join_gap(j)}) is shorter than the join ({TG.JOIN_DUR[j]})"
    assert TG.join_gap(None) == TG.BEAT_GAP == 0.62                     # control: no join keeps the old default
    p = FakeProject()
    try:
        write_json(p.path("plan/storyboard.json"), {"style": "corporate-clean", "world": {"stations": [{"id": "a"}]},
                   "scenes": [{"beat": "b01", "station": "a", "kind": "template"}, {"beat": "b02", "station": "a", "kind": "template", "join_in": {"meaning": "time"}}]})
        j = settled_joins(p, {"beats": [{"id": "b01"}, {"id": "b02"}]})
        assert j["b02"] == "wipe", j
        assert TG.join_gap(j["b02"]) == round(TG.JOIN_DUR["wipe"] + 0.05, 3) > TG.BEAT_GAP
    finally:
        p.close()
    return "one join table; a meaning join's silence fits its wipe"


def check_grid_sections_tempo_hits_and_planned_sounds():
    """build_grid: sections tile [0, duration] on exact beat boundaries; each section is a whole number of bars at a
    tempo near the mood's, so every section starts on a bar line; a storyboard sound on a spoken cue is planned at the
    cue minus the runtime's lead; one on an unspoken cue is planned with no time (the check fails it); quiz-pause ticks
    and the end chime are planned. Control: a section boundary moved off a bar is caught by the invariant."""
    from loom import timing as TG
    tm = _tm()
    cue_table = {"b02": {"clock": 6.0}}
    g = TG.build_grid(tm, SCRIPT, _scenes(), cue_table, {"mood": "warm_curious"})
    secs = g["sections"]
    assert secs[0]["t0"] == 0.0 and secs[-1]["t1"] == 20.0 and secs[0]["t1"] == secs[1]["t0"] == 11.5, secs
    bars = g["tempo"]["bars"]
    assert all(any(abs(s["t0"] - b) < 1e-6 for b in bars) for s in secs), "a section does not start on a bar line"
    for seg in g["tempo"]["segments"]:
        assert abs(seg["bpm"] - TG.TEMPO["warm_curious"]) / TG.TEMPO["warm_curious"] < 0.35, seg
    snd = {s["id"]: s for s in g["sounds"]}
    assert abs(snd["sfx:b02:0"]["t"] - (6.0 - TG.CUE_LEAD)) < 1e-9 and snd["sfx:b02:0"]["sound"] == "pop"
    assert snd["sfx:b02:1"]["t"] is None, "a sound on an unspoken cue must be planned without a time, never silently skipped"
    assert "join:b02" in snd and "join:b03" in snd and snd["join:b03"]["sound"] == "whoosh"
    assert any(i.startswith("pause:b02:") for i in snd) and "end" in snd
    assert any(h["id"] == "cue:b02:clock" for h in g["hits"])
    moved = dict(secs[1], t0=secs[1]["t0"] + 0.37)                        # control: off the grid
    assert not any(abs(moved["t0"] - b) < 1e-6 for b in bars)
    assert g == TG.build_grid(tm, SCRIPT, _scenes(), cue_table, {"mood": "warm_curious"}), "the grid is not deterministic"
    return f"{len(secs)} sections on bars, {len(g['sounds'])} planned sounds, the unspoken cue kept as a hole"


def _grid_project(placed_ids=None, build_sha=True, with_grid=True):
    from loom import timing as TG
    from loom.util import file_sha
    p = FakeProject()
    (p.path("build/index.html")).write_text("<html>build</html>", encoding="utf-8")
    tm = _tm()
    g = TG.build_grid(tm, SCRIPT, _scenes(), {"b02": {"clock": 6.0, "never said": 7.0}}, {})
    mf = {"beats": tm["beats"], "scenes": _scenes(), "style": {}, **({"grid": g} if with_grid else {})}
    write_json(p.path("plan/storyboard.json"), {})
    placed = [{"id": s["id"], "t": s["t"], "sound": s["sound"]} for s in g["sounds"] if s["t"] is not None and (placed_ids is None or s["id"] in placed_ids)]
    write_json(p.path("audio/mix_events.json"), {"build": file_sha(p.path("build/index.html")) if build_sha else "other", "placed": placed, "music": {}})
    return p, mf


def check_grid_check_fails_on_a_dropped_sound_a_stale_mix_and_no_grid():
    """grid_checks: a mix that placed every planned sound for this build passes; one that dropped the pop fails naming
    it; a mix made for another build fails; a build with no grid is reported as not checked (a warning, never clean)"""
    from loom.checks.grid import grid_checks
    p, mf = _grid_project()
    try:
        E, W, S = grid_checks(p, mf)
        assert not E and S["dropped"] == 0 and S["placed"] == S["planned"], (E, S)
    finally:
        p.close()
    p, mf = _grid_project(placed_ids={"end"})
    try:
        E, W, S = grid_checks(p, mf)
        assert any("sfx:b02:0" in e and "not in the mix" in e for e in E), E
    finally:
        p.close()
    p, mf = _grid_project(build_sha=False)
    try:
        E, W, S = grid_checks(p, mf)
        assert any("another build" in e for e in E), E
    finally:
        p.close()
    p, mf = _grid_project(with_grid=False)
    try:
        E, W, S = grid_checks(p, mf)
        assert not E and S["checked"] is False and any("not checked" in w for w in W), (E, W)
    finally:
        p.close()
    return "passes when placed, fails on dropped and stale, says not checked without a grid"


def check_mix_places_the_grid_sounds_and_honours_music_off():
    """mix(): with a grid it places exactly the grid's sounds (recorded in audio/mix_events.json for this build) and a
    storyboard's music.enabled false gives no bed (the flag was never read before D-173). Control: with music on the
    mood is kept."""
    if not which("ffmpeg"):
        return "skipped (no ffmpeg)"
    from loom import timing as TG
    from loom.narrate.mix import mix
    for enabled, want in ((False, "none"), (True, "warm_curious")):
        p = FakeProject()
        try:
            tm = _tm()
            _wav(p.path("audio/narration.wav"), 20.0, tone=True)
            p.path("build/index.html").write_text("<html>x</html>", encoding="utf-8")
            g = TG.build_grid(tm, SCRIPT, _scenes(), {"b02": {"clock": 6.0}}, {})
            write_json(p.path("build/manifest.json"), {"duration": 20.0, "style": {"music": {"mood": "warm_curious"}}, "scenes": _scenes(),
                                                     "beats": tm["beats"], "cues": {}, "sections": [], "grid": g})
            write_json(p.path("plan/storyboard.json"), {"music": {"enabled": enabled}})
            mix(p)
            me = read_json(p.path("audio/mix_events.json"))
            want_ids = {s["id"] for s in g["sounds"] if s["t"] is not None}
            assert {x["id"] for x in me["placed"]} == want_ids, me["placed"]
            assert me["music"]["mood"] == want, me["music"]
        finally:
            p.close()
    return "every planned sound placed and recorded; music off is off"


# ------------------------------------------------------------------ the speech check (D-174)
def check_speech_compare_numbers_names_filler_and_spelling():
    """compare(): a misread number or a mangled name fails; digits and words for the same number agree; a filler word
    Whisper adds at the edges and British or American spelling are not errors; one ordinary word in a long phrase is a
    minor difference (a warning). Control: the same phrase with its number changed fails."""
    from loom.narrate.asr import compare
    assert compare("Each about 20,200 kilometres up.", "Each about 20,200 kilometers up.")["ok"]
    assert compare("In 1990 the system went live.", "In nineteen ninety the system went live.")["ok"]
    assert compare("Nothing goes up.", "And nothing goes up.")["ok"]
    assert compare("it gets 40% faster", "it gets 40 percent faster")["ok"]
    bad = compare("Light covers about 300 metres in a microsecond.", "Light covers about 30 meters in a microsecond.")
    assert not bad["ok"] and bad["critical"], bad
    assert not compare("Ask Maya about the Kubernetes rollout.", "Ask Maya about the Cooper Nettie's rollout.")["ok"]
    minor = compare("the phone takes the arrival time and works out a distance", "the phone takes the arrival time and works out the distance")
    assert minor["ok"] and minor["minor"], minor
    return "numbers and names fail, filler and spelling pass, small slips warn"


def check_speech_check_names_the_phrase_accepts_after_listening_and_is_red_when_blind():
    """check_speech() with a stand-in transcriber: a phrase heard with a different number is an error naming b02.1;
    after `accept` (a person listened) the same audio passes; a changed phrase text is checked again; request asr off
    is a warning that says the narration was not checked; a lesson with no phrases is red"""
    from loom.narrate import asr as A
    p = FakeProject()
    try:
        tm = {"duration": 6.0, "beats": [
            {"id": "b01", "section": "s", "start": 0, "end": 3, "speech_start": 0.2, "speech_end": 2.8, "pause_after": 0,
             "phrases": [{"text": "Say the signal arrives.", "s": 0.2, "e": 2.8, "words": []}]},
            {"id": "b02", "section": "s", "start": 3, "end": 6, "speech_start": 3.2, "speech_end": 5.8, "pause_after": 0,
             "phrases": [{"text": "It takes 0.07 seconds.", "s": 3.2, "e": 5.8, "words": []}]}]}
        write_json(p.path("audio/timings.json"), tm)
        _wav(p.path("audio/narration.wav"), 6.0, tone=True)
        heard = iter(["Say the signal arrives.", "It takes zero zero seven seconds."])
        E, W, S = A.check_speech(p, transcriber=lambda a: next(heard))
        assert len(E) == 1 and "b02.1" in E[0], E
        A.accept(p, "b02.1")
        heard = iter(["Say the signal arrives.", "It takes zero zero seven seconds."])
        E, W, S = A.check_speech(p, transcriber=lambda a: next(heard))
        assert not E, E
        tm["beats"][1]["phrases"][0]["text"] = "It takes 0.08 seconds."            # a changed phrase is checked again
        write_json(p.path("audio/timings.json"), tm)
        heard = iter(["Say the signal arrives.", "It takes zero zero seven seconds."])
        E, W, S = A.check_speech(p, transcriber=lambda a: next(heard))
        assert len(E) == 1, E
    finally:
        p.close()
    q = FakeProject({"asr": "off"})
    try:
        E, W, S = A.check_speech(q, transcriber=lambda a: "")
        assert not E and any("NOT checked" in w for w in W) and S["checked"] is False
    finally:
        q.close()
    r = FakeProject()
    try:
        write_json(r.path("audio/timings.json"), {"duration": 1.0, "beats": []}); _wav(r.path("audio/narration.wav"), 1.0)
        E, W, S = A.check_speech(r, transcriber=lambda a: "")
        assert any("blind" in e for e in E), E
    finally:
        r.close()
    return "misread number named; accepted after listening; changed text rechecked; off warns; blind is red"


# ------------------------------------------------------------------ style engines (D-175)
def check_style_engine_lint_and_runtime_registry():
    """loom/engines.lint: an engine named after a real pack that defines itself passes; one using Math.random or the
    clock, defining another id, or named after no pack fails. The runtime registry (runtime/engines.js, run in node)
    defines an engine, refuses a non-function api member and a second definition, and serves the current style's."""
    from loom import engines as EN
    d = Path(tempfile.mkdtemp(prefix="loomeng_"))
    try:
        good = d / "whiteboard.js"
        good.write_text('Loom.engines.define("whiteboard", { version: "1", api: { mark(ctx, name) { return ctx.el(name, {}); } } });\n', encoding="utf-8")
        assert EN.lint(good) == [], EN.lint(good)
        rnd = d / "corporate-clean.js"
        rnd.write_text('Loom.engines.define("corporate-clean", { api: { a() { return Math.random() + Date.now(); } } });', encoding="utf-8")
        assert len(EN.lint(rnd)) == 2, EN.lint(rnd)
        wrong = d / "story-cartoon.js"
        wrong.write_text('Loom.engines.define("whiteboard", { api: {} });', encoding="utf-8")
        assert any("must call" in e for e in EN.lint(wrong))
        nopack = d / "no-such-style.js"
        nopack.write_text('Loom.engines.define("no-such-style", { api: {} });', encoding="utf-8")
        assert any("no style pack" in e for e in EN.lint(nopack))
    finally:
        shutil.rmtree(d, ignore_errors=True)
    assert EN.lint_all() == [], EN.lint_all()   # the engines that exist (none yet) are clean
    node = which("node")
    if not node:
        return "lint checked; skipped the runtime registry (no node)"
    js = (ROOT / "runtime/engines.js").read_text(encoding="utf-8")
    prog = ("global.window = { Loom: { style: { pack: { id: 'whiteboard' } } } };\n" + js +
            "\nconst L = window.Loom; L.engines.define('whiteboard', { api: { mark() { return 1; } } });"
            "\nlet bad = 0; try { L.engines.define('x', { api: { a: 1 } }); } catch (e) { bad++; }"
            "\ntry { L.engines.define('whiteboard', { api: {} }); } catch (e) { bad++; }"
            "\nconsole.log(JSON.stringify({ cur: L.engines.current() && L.engines.current().api.mark(), bad, list: L.engines.list() }));")
    r = subprocess.run([node, "-e", prog], capture_output=True, text=True, timeout=60)
    out = json.loads(r.stdout.strip().splitlines()[-1])
    assert out == {"cur": 1, "bad": 2, "list": ["whiteboard"]}, (out, r.stderr)
    return "lint catches random, clock, wrong id, no pack; the registry defines, refuses and serves"


# ------------------------------------------------------------------ page clips (D-176)
def check_page_scene_lint_and_approved_libraries():
    """lint_scene: Math.random, fetch and a missing build export fail; a clean scene passes. spec_errors: an unknown
    library fails. Every library in runtime/page/libs.json has its files in node_modules (an approved library that
    cannot load is red), and every capability scene in scenes_examples/page passes the lint."""
    from loom import page_bridge as PB
    ok = "export async function build(ctx, P) { return { render(t) { P.root.textContent = String(t); } }; }"
    assert PB.lint_scene(ok) == []
    assert len(PB.lint_scene(ok.replace("String(t)", "String(Math.random())"))) == 1
    assert any("network" in e for e in PB.lint_scene(ok + "\nfetch('https://x');"))
    assert any("export build" in e for e in PB.lint_scene("function build() {}"))
    assert any("unknown library" in e for e in PB.spec_errors({"page": {"libs": ["leaflet"]}}))
    assert PB.spec_errors({"page": {"libs": ["d3", "dagre", "katex"]}}) == []
    missing = [f for L in PB.libs().values() for f in (L.get("js") or []) + (L.get("css") or []) if not (ROOT / "node_modules" / f).exists()]
    assert not missing, f"approved libraries not installed: {missing} (npm install)"
    bad = {f.name: PB.lint_scene(f.read_text(encoding="utf-8"), f.name) for f in (ROOT / "scenes_examples/page").glob("*.js")}
    assert len(bad) >= 8 and not any(bad.values()), bad
    return f"{len(PB.libs())} libraries installed; {len(bad)} capability scenes lint clean"


_SCENE = """export async function build(ctx, P) {
  const g = P.canvas();
  return { render(t) { g.clearRect(0, 0, P.w, P.h); g.fillStyle = P.c("accent"); g.fillRect(10 + t * 60, 20, 40, 40); } };
}"""


def check_page_renders_the_same_frames_twice_and_with_two_workers():
    """the page renderer (runtime/page/render.mjs): the same still twice is byte-identical; a 1 s video with 1 and with
    2 workers decodes to the same frames (frames are a pure function of t, whichever worker draws them); a scene that
    requests the network fails the render. Control: two different times differ."""
    if not browser():
        return "skipped (no browser here)"
    from loom import page_bridge as PB
    from loom.compose import load_style
    st = load_style("corporate-clean")
    work = Path(tempfile.mkdtemp(prefix="loompage_"))
    try:
        src = work / "s.js"; src.write_text(_SCENE, encoding="utf-8")
        ctxd = PB.make_ctx(st, 1.0, (320, 180), {}, {}, [0, 1], [])
        shots = []
        for k in range(2):
            d = work / f"st{k}"; d.mkdir()
            PB._invoke({"beat": "t", "src": src, "ctxd": ctxd, "stills": [0.5, 0.9]}, "final", d)
            shots.append(((d / "still_0.50.png").read_bytes(), (d / "still_0.90.png").read_bytes()))
        assert shots[0] == shots[1], "the same page frame rendered twice differs"
        assert shots[0][0] != shots[0][1], "control: two times gave the same picture"
        import os
        md5 = []
        for wk in ("1", "2"):
            d = work / f"v{wk}"; d.mkdir()
            os.environ["LOOM_PAGE_WORKERS"] = wk
            try:
                out, _ = PB._invoke({"beat": "t", "src": src, "ctxd": ctxd}, "final", d)
            finally:
                os.environ.pop("LOOM_PAGE_WORKERS", None)
            r = subprocess.run([which("ffmpeg"), "-v", "error", "-i", str(out), "-f", "framemd5", "-"], capture_output=True, text=True)
            md5.append([ln for ln in r.stdout.splitlines() if not ln.startswith("#")])
        assert md5[0] and md5[0] == md5[1], "1 and 2 workers rendered different frames"
        net = work / "n.js"; net.write_text(_SCENE.replace("const g = P.canvas();", "const g = P.canvas(); await import('https://example.com/x.js');"), encoding="utf-8")
        d = work / "net"; d.mkdir()
        try:
            PB._invoke({"beat": "t", "src": net, "ctxd": ctxd, "stills": [0.5]}, "final", d)
            raise AssertionError("a page that imports from the network rendered")
        except Exception as e:  # noqa: BLE001
            assert "network" in str(e) or "blocked" in str(e) or "failed" in str(e), e
    finally:
        shutil.rmtree(work, ignore_errors=True)
    return "stills identical twice; 1 and 2 workers identical; the network refused"


def check_page_every_clip_kind_is_placed_by_the_runtime():
    """every clip kind the bridges render (manim_bridge.CLIP_KINDS) is placed by the runtime (world.js's media branch)
    and copied by compose. A page clip rendered and composed but was invisible in the lesson until world.js listed it
    (L-451, seen only on the frames). Control: a made-up kind is not in the branch."""
    import re
    from loom import manim_bridge as MB
    src = (ROOT / "runtime/world.js").read_text(encoding="utf-8")
    branch = re.search(r'else if \((def\.kind === "manim"[^)]*)\)', src).group(1)
    placed = set(re.findall(r'def\.kind === "(\w+)"', branch))
    missing = [k for k in MB.CLIP_KINDS if k not in placed]
    assert not missing, f"clip kinds the runtime never places: {missing}"
    assert "nosuchkind" not in placed
    comp = (ROOT / "loom/compose.py").read_text(encoding="utf-8")
    assert all(f'"{k}"' in comp for k in MB.CLIP_KINDS)
    return f"{len(MB.CLIP_KINDS)} clip kinds placed by world.js and copied by compose"


# ------------------------------------------------------------------ the whiteboard engine (D-179)
def check_whiteboard_engine_lints_its_font_parses_and_the_switch_holds():
    """the whiteboard engine passes the engine lint; EMS Tech parses to strokes (curves flattened, the drawn cap height
    of "H", every stroke whole x,y pairs); a lesson uses the engine unless its request says engine off, and only then
    does get_style_pack carry the engine's guide; the designed hand is embedded only when its art exists (a stand-in
    here). Control: engine off gives no guide and no assets."""
    from loom import engines as EN
    from loom.stroke_fonts import load
    assert EN.lint(EN.ENGINES_DIR / "whiteboard.js") == [], EN.lint(EN.ENGINES_DIR / "whiteboard.js")
    F = load("EMSTech")
    assert 600 < F["cap"] < 760 and len(F["glyphs"]) > 90, (F["cap"], len(F["glyphs"]))
    assert all(len(st) % 2 == 0 and len(st) >= 4 for g in F["glyphs"].values() for st in g["s"])
    class P_:
        def __init__(self, req): self.request = req
    assert EN.enabled_for(P_({}), "whiteboard") and not EN.enabled_for(P_({"engine": "off"}), "whiteboard")
    assert not EN.enabled_for(P_({}), "corporate-clean")
    from loom.agents import tools as T
    class C_:
        def __init__(self, req): self.project = P_(dict(req, style="whiteboard"))
    on, off = T.t_get_style_pack(C_({})), T.t_get_style_pack(C_({"engine": "off"}))
    assert "ctx.engine" in on.get("engine_text", "") and "engine_text" not in off
    d = Path(tempfile.mkdtemp(prefix="loomhand_"))
    try:
        assert "wbHand" not in EN.engine_assets("whiteboard", hand_dir=d) and "strokeFonts" in EN.engine_assets("whiteboard", hand_dir=d)
        (d / "write.svg").write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 640" data-anchor="170,20"><path class="pen" d="M0 0L1 1"/></svg>', encoding="utf-8")
        A = EN.engine_assets("whiteboard", hand_dir=d)
        assert A["wbHand"]["write"]["anchor"] == [170.0, 20.0] and 'class="pen"' in A["wbHand"]["write"]["body"]
    finally:
        shutil.rmtree(d, ignore_errors=True)
    assert EN.engine_assets("corporate-clean") == {}
    return "lint clean; EMS Tech parsed; the switch and the guide follow the request; the hand only with its art"


def check_whiteboard_board_has_two_faces_and_headings_are_written_by_the_hand():
    """Kshitij, 2026-10-15, "Two faces" (film A showed three typefaces on one board): on a whiteboard engine board every
    word is written by the engine (board.write) or is a heading in the pack's display face (board.heading, or a kit part
    set in that face). A planted word in the body face is the one wb_face error; the heading, the engine's words, a
    display-face kit word and a character's words are quiet. The heading is revealed under the hand: hidden before its
    time, whole after it. The clean board lab scene (wb_engine_board) has no problem."""
    if not browser():
        return "skipped (no browser here)"
    from loom import lab as LB
    from PIL import Image, ImageChops
    d = Path(tempfile.mkdtemp(prefix="loomwbf_"))
    try:
        fx = d / "wb_faces_test.js"
        fx.write_text('''// @lab {"title": "test: two faces", "styles": ["whiteboard"], "dur": 4, "times": [0.2, 3.8]}
Loom.scene("wb_faces_test", { build(ctx) {
  const W = ctx.engine, B = W.board(ctx);
  const h = ctx.el("head", { x: 200, y: 120, w: 900, h: 110, kind: "text" });
  B.heading(h, "A heading in the display face", { at: 0.6, by: 2.0 });
  const w = ctx.el("words", { x: 200, y: 300, w: 700, h: 80, kind: "text" });
  B.write(w, "Words in the marker hand", { at: 2.1, by: 3.2 });
  const k = ctx.el("kit_head", { x: 200, y: 450, w: 700, h: 80, kind: "text" });
  Loom.svg("text", { x: 0, y: 60, "font-family": Loom.style.font("display").family, "font-weight": 700, "font-size": 56, fill: "#222" }, k.inner).textContent = "Kit heading";
  const b = ctx.el("kit_body", { x: 200, y: 580, w: 700, h: 80, kind: "label" });
  Loom.svg("text", { x: 0, y: 60, "font-family": Loom.style.font("body").family, "font-size": 40, fill: "#222" }, b.inner).textContent = "Planted body face";
  const c = ctx.el("person", { x: 1200, y: 300, w: 300, h: 300, kind: "character" });
  Loom.svg("text", { x: 0, y: 60, "font-family": Loom.style.font("body").family, "font-size": 40, fill: "#222" }, c.inner).textContent = "a character's";
}});
''', encoding="utf-8")
        r = LB.strip("wb_faces_test", "whiteboard", [0.2, 3.8], out_dir=d / "s", frames_dir=d / "s" / "f", file=fx)
        txt = lambda e: e if isinstance(e, str) else f"{e.get('code')}: {e.get('msg')}"  # noqa: E731
        faces = [txt(e) for e in r["errors"] if "wb_face" in txt(e)]
        assert len(faces) == 1 and "Planted body face" in faces[0], f"one wb_face, the planted body-face word: {faces}"
        assert len(r["errors"]) == 1, f"no other problem: {r['errors']}"
        fa, fb = sorted((d / "s" / "f").glob("*.png"))
        box = (200, 120, 1100, 230)   # the heading's box: empty before its time, written after
        ink = lambda f: sum(1 for px in Image.open(f).convert("L").crop(box).getdata() if px < 120)  # noqa: E731
        assert ink(fa) < 50 and ink(fb) > 1500, f"the heading is revealed under the hand: {ink(fa)} dark pixels before, {ink(fb)} after"
        r2 = LB.strip("wb_engine_board", "whiteboard", [20.6], out_dir=d / "b", frames_dir=d / "b" / "f")
        assert not r2["errors"], f"the clean board lab scene: {r2['errors']}"
    finally:
        shutil.rmtree(d, ignore_errors=True)
    return "one wb_face (the planted body-face word); the heading, engine words, a display-face kit word and a character quiet; the heading revealed under the hand; the clean board has no problem"


def check_whiteboard_hand_keeps_pace_with_the_voice():
    """Film A wrote words up to 6 s behind their spoken cue (17 wb_pen_late at b02 to b13): the hand wrote 1.8 words a
    second, slower than speech. Now: a seven-word sentence is written in less time than it is spoken (about 2.6 s at 2.7
    words a second); a part asked while the hand is busy catches up (drawn faster); and a part that still starts more
    than 1.5 s late is an error (planted: a second sentence asked a second into the first, then a third with the first)."""
    if not browser():
        return "skipped (no browser here)"
    from loom import lab as LB
    d = Path(tempfile.mkdtemp(prefix="loomwbp_"))
    try:
        fx = d / "wb_pace_test.js"
        fx.write_text('''// @lab {"title": "test: pace", "styles": ["whiteboard"], "dur": 20, "times": [19]}
Loom.scene("wb_pace_test", { build(ctx) {
  const W = ctx.engine, B = W.board(ctx);
  const s = "I'm on the budget report this week.";
  const a = ctx.el("a", { x: 100, y: 100, w: 900, h: 80, kind: "text" });
  const t1 = B.write(a, s, { role: "body", at: 1 });
  const b = ctx.el("b", { x: 100, y: 250, w: 900, h: 80, kind: "text" });
  const t2 = B.write(b, s, { role: "body", at: 2 });
  const c = ctx.el("c", { x: 100, y: 400, w: 900, h: 80, kind: "text" });
  B.write(c, s, { role: "body", at: 1 });
  Loom.warn("measure", `${(t1 - 1).toFixed(3)} ${(t2 - t1).toFixed(3)}`);
}});
''', encoding="utf-8")
        r = LB.strip("wb_pace_test", "whiteboard", [19], out_dir=d / "s", file=fx)
        txt = lambda e: e if isinstance(e, str) else f"{e.get('code')}: {e.get('msg')}"  # noqa: E731
        m = [txt(w) for w in r["warnings"] if "measure" in txt(w)]
        one, two = (float(v) for v in m[0].split("measure: ", 1)[1].split())
        assert one < 2.6, f"seven words written in {one:.2f} s: slower than they are spoken"
        assert two < one * 0.85, f"the late second sentence catches up: {two:.2f} s against {one:.2f} s"
        errs = [txt(e) for e in r["errors"]]
        assert len(errs) == 1 and "wb_pen_late" in errs[0] and '"c"' in errs[0], f"the third sentence, too late, is the one error: {errs}"
        lates = [txt(w) for w in r["warnings"] if "wb_pen_late" in txt(w)]
        assert len(lates) == 1 and '"b"' in lates[0], f"the second, a little late, a warning: {lates}"
    finally:
        shutil.rmtree(d, ignore_errors=True)
    return f"seven words in {one:.2f} s; a late part catches up ({two:.2f} s); the one far behind is an error"


def check_whiteboard_plan_warns_a_section_that_carries_too_much():
    """D-182 at plan time: the whiteboard pack's board.carry.max_kept warns a scene that opens a new section keeping
    more than it (wb-prioritise's plan: b03, b10 and b11, the three openings the render check flags as board_carry).
    Control: the same plan with those keep lists cut to 3 is quiet."""
    from loom.project import Project
    from loom.checks import story as SB
    from loom.util import read_json
    root = ROOT / "projects" / "wb-prioritise"
    if not (root / "plan" / "storyboard.json").exists():
        return "skipped (the comparison's plan is not in this folder)"
    p = Project.open(str(root))
    sb = read_json(p.path("plan/storyboard.json")); beats = [b["id"] for b in read_json(p.path("plan/script.json"))["beats"]]
    W = SB.carry_warnings(p, sb, beats)
    assert [w.split(":", 1)[0] for w in W] == ["b03", "b10", "b11"], W
    import copy
    sb2 = copy.deepcopy(sb)
    for sc in sb2["scenes"]:
        if sc.get("beat") in ("b03", "b10", "b11"):
            sc["keep"] = (sc.get("keep") or [])[:3]
    assert not SB.carry_warnings(p, sb2, beats), "control: three kept elements are quiet"
    return "b03, b10, b11 warned (10, 18, 18 kept, at most 8); the control with 3 kept is quiet"


def check_whiteboard_hand_draws_lucide_icons_outline_first_and_dots_last():
    """W.icon (2026-10-16, Kshitij: "Are lucide icons not good for this?"): a Lucide icon becomes marks the hand draws
    stroke by stroke. The lightbulb's outline is its first stroke; the server's two dots are its last two marks, as dots,
    and alert-octagon's dot, first in Lucide's file, is drawn last;
    the icon's box is empty before its time and inked after; an unknown name is the one error (wb_icon_unknown)."""
    if not browser():
        return "skipped (no browser here)"
    from loom import lab as LB
    from PIL import Image
    d = Path(tempfile.mkdtemp(prefix="loomwbi_"))
    try:
        fx = d / "wb_icon_test.js"
        fx.write_text('''// @lab {"title": "test: icons", "styles": ["whiteboard"], "dur": 6, "times": [0.3, 5.8]}
Loom.scene("wb_icon_test", { build(ctx) {
  const W = ctx.engine, B = W.board(ctx);
  const a = ctx.el("bulb", { x: 300, y: 300, w: 260, h: 260, kind: "icon" });
  const bulb = W.icon("lightbulb", 0, 0, 260);
  B.draw(a, bulb, { at: 0.6, dur: 1.4 });
  const b = ctx.el("server", { x: 900, y: 300, w: 260, h: 260, kind: "icon" });
  const srv = W.icon("server", 0, 0, 260);
  B.draw(b, srv, { at: 2.4, dur: 1.4 });
  const alert = W.icon("alert-octagon", 0, 0, 200);   // Lucide lists its dot FIRST: the hand still draws it last
  W.icon("no-such-icon", 0, 0, 100);
  const L = (ms) => ms.map((m) => Math.round(m.len));
  Loom.warn("measure", JSON.stringify({ bulb: L(bulb), srv: L(srv), alert: L(alert) }));
}});
''', encoding="utf-8")
        r = LB.strip("wb_icon_test", "whiteboard", [0.3, 5.8], out_dir=d / "s", frames_dir=d / "s" / "f", file=fx)
        txt = lambda e: e if isinstance(e, str) else f"{e.get('code')}: {e.get('msg')}"  # noqa: E731
        import json as _json
        m = _json.loads([txt(w) for w in r["warnings"] if "measure" in txt(w)][0].split("measure: ", 1)[1])
        bulb, srv, alert = m["bulb"], m["srv"], m["alert"]
        assert alert and alert[-1] < 2 and all(v >= 2 for v in alert[:-1]), f"alert-octagon: its dot (first in the file) drawn last: {alert}"
        assert bulb and bulb[0] == max(bulb), f"the lightbulb's outline first: {bulb}"
        assert len(srv) >= 4 and all(v < 2 for v in srv[-2:]) and all(v >= 2 for v in srv[:-2]), f"the server's two dots last: {srv}"
        errs = [txt(e) for e in r["errors"]]
        assert len(errs) == 1 and "wb_icon_unknown" in errs[0], f"the unknown icon is the one error: {errs}"
        fa, fb = sorted((d / "s" / "f").glob("*.png"))
        ink = lambda f, box: sum(1 for v in Image.open(f).convert("L").crop(box).getdata() if v < 120)  # noqa: E731
        for box in ((300, 300, 560, 560), (900, 300, 1160, 560)):
            assert ink(fa, box) < 30 and ink(fb, box) > 600, f"an icon drawn on its time: {ink(fa, box)} dark pixels before, {ink(fb, box)} after"
    finally:
        shutil.rmtree(d, ignore_errors=True)
    return f"lightbulb outline first ({bulb[0]} px of {sum(bulb)}), the server's dots last, drawn on time; the unknown name an error"


def check_whiteboard_hand_is_one_on_top_and_rises_from_the_bottom():
    """Kshitij, 2026-10-15: text showed through the hand, the arm sometimes left by the side, two hands showed at a join.
    In the lab's handover with the installed hand: exactly one sleeve crosses the frame's bottom row, none crosses the
    right edge above it, and no ink shows inside the sleeve where it covers words (t 10.5 and 11.5: over "Who owns it now"
    and the note under it; the times moved with the faster lettering, 2026-10-16)."""
    if not browser():
        return "skipped (no browser here)"
    if not (ROOT / "assets/engines/whiteboard/hand/write.svg").exists():
        return "skipped (no hand installed)"
    from loom import lab as LB
    from PIL import Image
    d = Path(tempfile.mkdtemp(prefix="loomwbh_"))
    try:
        r = LB.strip("wb_engine_handover", "whiteboard", [10.5, 11.5], out_dir=d, frames_dir=d / "f")
        assert not r["errors"], r["errors"]
        fs = sorted((d / "f").glob("*.png")); assert len(fs) == 2
        sleeve = lambda c: abs(c[0] - 202) < 26 and abs(c[1] - 80) < 26 and abs(c[2] - 47) < 26  # noqa: E731
        for f in fs:
            im = Image.open(f).convert("RGB"); W, H = im.size; px = im.load()
            row = [sleeve(px[x, H - 2]) for x in range(W)]
            runs = sum(1 for x in range(1, W) if row[x] and not row[x - 1]) + (1 if row[0] else 0)
            assert runs == 1, f"{f.name}: {runs} arms cross the bottom edge (one hand, from the bottom)"
            side = [y for y in range(0, H - 4) if sleeve(px[W - 2, y])]
            assert not side, f"{f.name}: the arm leaves by the right edge at y {side[0]}"
            # the sleeve alone: from 80 px below its first row (above that the palm and the marker share its rows)
            top = next((y for y in range(H) if sum(1 for x in range(0, W, 2) if sleeve(px[x, y])) >= 20), H)
            for y in range(top + 80, H - 2, 3):
                # the arm: the widest run of the sleeve's colour on the row (the accent ink is near that colour: a circle
                # or the nib is a thin run of its own)
                runs_, x0 = [], None
                for x in range(W + 1):
                    on = x < W and sleeve(px[x, y])
                    if on and x0 is None: x0 = x
                    if not on and x0 is not None: runs_.append((x0, x - 1)); x0 = None
                if not runs_:
                    continue
                k = max(range(len(runs_)), key=lambda i: runs_[i][1] - runs_[i][0])
                a0, a1 = runs_[k]
                # a word painted over the sleeve splits it: neighbours across a short gap with no board showing in it are
                # the same arm (the board's field is light; a gap of field is a separate mark, such as the accent circle)
                light = lambda x: min(px[x, y]) > 225  # noqa: E731
                for j in range(k - 1, -1, -1):
                    g0, g1 = runs_[j][1] + 1, a0 - 1
                    if g1 - g0 > 40 or any(light(x) for x in range(g0, g1 + 1)): break
                    a0 = runs_[j][0]
                for j in range(k + 1, len(runs_)):
                    g0, g1 = a1 + 1, runs_[j][0] - 1
                    if g1 - g0 > 40 or any(light(x) for x in range(g0, g1 + 1)): break
                    a1 = runs_[j][1]
                if a1 - a0 < 60:
                    continue
                inside = [x for x in range(a0 + 4, a1 - 4) if sum(px[x, y]) < 240]
                assert not inside, f"{f.name}: ink shows through the sleeve at ({inside[0]}, {y})"
        # on top of what comes later: a lesson adds later beats after the hand exists. A dark band is added to the hand's
        # own layer after its first stroke; the arm must still show across it
        fx = d / "wb_hand_cover_test.js"
        fx.write_text('''// @lab {"title": "test: the hand over a later layer", "styles": ["whiteboard"], "dur": 4, "times": [2.0]}
Loom.scene("wb_hand_cover_test", { build(ctx) {
  const W = ctx.engine, B = W.board(ctx);
  const a = ctx.el("a", { x: 300, y: 480, w: 1200, h: 40, kind: "mark" });
  B.draw(a, W.line(0, 20, 1200, 20), { at: 0.5, by: 3.5 });
  const host = (ctx.station && ctx.station.svg) || ctx.g;
  Loom.svg("rect", { x: 600, y: 700, width: 1100, height: 200, fill: "#1E2430" }, Loom.svg("g", {}, host));
}});
''', encoding="utf-8")
        r = LB.strip("wb_hand_cover_test", "whiteboard", [2.0], out_dir=d / "c", frames_dir=d / "c" / "f", file=fx)
        assert not r["errors"], r["errors"]
        im = Image.open(sorted((d / "c" / "f").glob("*.png"))[0]).convert("RGB"); px = im.load()
        band = sum(1 for y in range(710, 890, 4) for x in range(600, 1700) if sleeve(px[x, y]))
        assert band > 400, f"the arm is under a layer added after it ({band} sleeve pixels across the band)"
    finally:
        shutil.rmtree(d, ignore_errors=True)
    return "one arm from the bottom edge in each frame, none by the side, nothing drawn through it, above later layers"


def check_whiteboard_engine_draws_with_one_hand_the_same_twice():
    """the engine's lab scene (the handover, every mark and word through ctx.engine) renders with no problem, the same
    frame twice, with at most the one sound the scene asked for (never a sound per stroke). Control: two times differ."""
    if not browser():
        return "skipped (no browser here)"
    from loom import lab as LB
    from PIL import Image, ImageChops
    outs = []
    for k in range(2):
        d = Path(tempfile.mkdtemp(prefix="loomwb_"))
        r = LB.strip("wb_engine_handover", "whiteboard", [6.1, 12.1], out_dir=d, frames_dir=d / "f")
        assert not r["errors"], r["errors"]
        outs.append(d)
    try:
        fa = sorted((outs[0] / "f").glob("*.png")); fb = sorted((outs[1] / "f").glob("*.png"))
        assert len(fa) == 2 and [f.name for f in fa] == [f.name for f in fb]
        for a, b in zip(fa, fb):
            assert ImageChops.difference(Image.open(a).convert("RGB"), Image.open(b).convert("RGB")).getbbox() is None, f"{a.name} differs between renders"
        assert ImageChops.difference(Image.open(fa[0]).convert("RGB"), Image.open(fa[1]).convert("RGB")).getbbox() is not None
        src = (ROOT / "runtime/engines/whiteboard.js").read_text(encoding="utf-8")
        assert src.count('Loom.sfx(') == 1 and "if (o.sound)" in src, "the engine sounds only when a draw asks for it"
    finally:
        for d in outs:
            shutil.rmtree(d, ignore_errors=True)
    return "no problems; the same frames twice; sound only on request"

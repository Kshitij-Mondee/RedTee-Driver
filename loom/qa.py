"""The check stage: prove the composed lesson before anyone renders it.

1. runtime probe  - load the build in headless Chrome; read Loom's own report (text fit,
                    unresolved cues, scene errors, every tween's time window)
2. overlap and contrast - HyperFrames' check (lint, runtime, layout, contrast), Loom's own audits in the probe's
                    page load, or both with HyperFrames gating (checker_mode: hyperframes | loom | shadow)
3. lesson lints   - static holds, late reveals, element budget, treatment mix, caption band
4. contact sheets - three frames per beat (arrival, development, settled) for a visual review
"""
from __future__ import annotations

import json
import os
import shutil
from pathlib import Path

from .render import hf_env, hyperframes_cmd
from .util import ENGINE_ROOT, LoomError, info, read_json, run, warn, which, write_json

IGNORE_HF = {"escaped_container", "canvas_overflow"}  # the world is larger than the frame by design
NODE_BUDGET = 20000   # DOM nodes a page may have before the check warns; v3 4,324, https-private 98,958 (2026-10-10)


def probe(project) -> dict:
    return probe_build(project.path("build"), project.path("qa/probe.json"))


def probe_build(build: Path, out: Path, env: dict | None = None) -> dict:
    """The runtime probe of one composed build (the lesson's, or a private copy of it). `env` adds probe settings
    (LOOM_PROBE_BEATS: only those beats, as a scene author's look asks)."""
    out = Path(out)
    out.parent.mkdir(parents=True, exist_ok=True)
    run([which("node"), str(ENGINE_ROOT / "tools/node/probe.mjs"), str(Path(build) / "index.html"), str(out)], env=dict(hf_env(), **(env or {})), timeout=600)
    return read_json(out)


def private_build(project) -> Path:
    """A copy of the composed build in its own temporary folder (outputs left out: renders, snapshots), so a worker can
    photograph and probe it while other workers compose. Snapshots used to run one at a time on the shared build/:
    102 of them at about 50 s each in the Opus run, the scene authors queueing behind each other (2026-10-08)."""
    import tempfile
    dst = Path(tempfile.mkdtemp(prefix="loom_build_")) / "build"
    shutil.copytree(project.path("build"), dst, ignore=shutil.ignore_patterns("renders", "snapshots"))
    return dst


SNAP_TIMEOUT_S = 420      # one capture call (a look's 4 frames, or a chunk of the sheets); healthy: 1 to 2 min under load


def _hf_snapshot(build: Path, times: list[float]) -> None:
    """`hyperframes snapshot` at these times into build/snapshots, bounded: a capture is minutes, not an hour. Three
    parallel looks of https-slice-terra sat in a hung capture until the 30 to 60 min timeout and their beats never got a
    returned look; they all ended in the same second, so they were held by one shared hang (L-434). util.run kills the
    whole browser tree on a timeout, which also frees anything waiting on it; the capture is tried once more, and a second
    hang is said as such."""
    import subprocess
    snapdir = Path(build) / "snapshots"
    limit = SNAP_TIMEOUT_S + 10 * max(0, len(times) - 4)     # a sheets chunk of 30 frames gets about 11 minutes
    for attempt in (1, 2):
        try:
            run(hyperframes_cmd() + ["snapshot", "--at", ",".join(f"{t:.2f}" for t in times)], cwd=build, env=hf_env(), timeout=limit)
            return
        except subprocess.TimeoutExpired:
            shutil.rmtree(snapdir, ignore_errors=True)
            if attempt == 2:
                raise LoomError(f"the snapshot timed out twice ({limit} s each, the browser was killed both times)")
            warn(f"snapshot: no answer in {limit} s; the browser was killed, trying once more")


def snapshot_sheet_build(build: Path, times: list[float], out: Path, missing: list | None = None) -> str:
    """snapshot_sheet for a private build: frames from it (not the lesson's frame cache), one sheet at `out`. Each frame
    carries its time; one or two frames are drawn large (stacked), three or four in a 2 x 2 grid (R-46: always three 640 x 360
    tiles, so about 520 px a frame once the model's reader scaled the sheet, too small for 20 px text, and unlabelled).
    A time whose frame did not come back is added to `missing` (it used to vanish without a word)."""
    from PIL import Image, ImageDraw, ImageFont
    build = Path(build)
    snapdir = build / "snapshots"
    shutil.rmtree(snapdir, ignore_errors=True)
    _hf_snapshot(build, times)
    got = {round(float(f.stem.split("-at-")[1].rstrip("s")), 2): f for f in snapdir.glob("frame-*-at-*.png")}
    have = [t for t in times if round(t, 2) in got]
    if missing is not None:
        missing.extend(t for t in times if round(t, 2) not in got)
    if not have:
        raise LoomError("the snapshot wrote no frame")
    n = len(have)
    cols = 1 if n <= 2 else 2           # two frames stack: 1284 x 1448 stays under the readers' 1568 px
    w, h = (1280, 720) if n <= 2 else (960, 540)
    rows = (n + cols - 1) // cols
    sh = Image.new("RGB", (cols * (w + 4), rows * (h + 4)), (17, 17, 17))
    try:
        font = ImageFont.truetype("arial.ttf", 30)
    except OSError:
        font = ImageFont.load_default()
    for i, t in enumerate(have):
        im = Image.open(got[round(t, 2)]).convert("RGB").resize((w, h))
        d = ImageDraw.Draw(im)
        label = f"t = {t:.2f} s"
        d.rectangle([0, 0, 190, 44], fill=(17, 17, 17))
        d.text((10, 6), label, fill=(255, 220, 90), font=font)
        sh.paste(im, ((i % cols) * (w + 4), (i // cols) * (h + 4)))
    out = Path(out)
    out.parent.mkdir(parents=True, exist_ok=True)
    sh.save(out, quality=88)
    return str(out)


def hf_check_build(build: Path, samples: int = 24) -> dict:
    """HyperFrames' check (lint, runtime, layout, contrast, motion) of one composed build."""
    r = run(hyperframes_cmd() + ["check", "--json", "--samples", str(samples)], cwd=Path(build), env=hf_env(), timeout=1200, check=False)
    try:
        return json.loads(r.stdout[r.stdout.find("{"):])
    except Exception:
        raise LoomError("hyperframes check produced no JSON:\n" + (r.stderr or "")[-1500:])


def sync_sfx(project, probe_rep: dict | None = None) -> int:
    """Collect the runtime's sound events for THIS build (D-47) into qa/sfx_events.json and re-mix when they
    changed. A build that records no events (every lesson made before D-47) leaves the mix untouched."""
    from .util import file_sha
    from .narrate.mix import mix
    f = project.path("qa/sfx_events.json")
    build = file_sha(project.path("build/index.html"))
    if probe_rep is None and f.exists() and (read_json(f, {}) or {}).get("build") == build:
        return len(read_json(f).get("events", []))   # already collected for this build: no browser needed
    pr = probe_rep if probe_rep is not None else probe(project)
    ev = sorted(pr.get("sfx") or [], key=lambda e: (e["t"], e["kind"], e.get("i") or 0))
    old = read_json(f, {}) if f.exists() else {}
    new = {"build": build, "events": ev}
    # the timing grid (D-173): the mix records what it placed for one build; a mix made for another build (compose
    # without the mix, a re-compose) is re-made so the grid check reads this build's sounds
    mf = read_json(project.path("build/manifest.json"), {}) or {}
    me = read_json(project.path("audio/mix_events.json"), {}) if project.path("audio/mix_events.json").exists() else {}
    stale_mix = bool(mf.get("grid")) and (me or {}).get("build") != build
    if old == new and not stale_mix:
        return len(ev)
    had = bool(old.get("events"))
    write_json(f, new)
    if ev or had or stale_mix:
        info(f"check: {len(ev)} sound event(s) from the motion; re-mixing" + (" (the mix was made for another build)" if stale_mix else ""))
        mix(project)
    return len(ev)


def hf_check(project, samples: int = 24) -> dict:
    r = run(hyperframes_cmd() + ["check", "--json", "--samples", str(samples)], cwd=project.path("build"), env=hf_env(), timeout=1200, check=False)
    try:
        d = json.loads(r.stdout[r.stdout.find("{"):])
    except Exception:
        raise LoomError("hyperframes check produced no JSON:\n" + (r.stderr or "")[-1500:])
    write_json(project.path("qa/hf_check.json"), d)
    return d


# Who judges text overlap and contrast (D-154, 2026-10-10): "loom" (the probe's own layout and contrast audits,
# tools/node/probe.mjs: seconds, in the page load the probe already makes; the default since its corpus and planted-defect
# record, docs/research/2026-10-10-loom-checker-reliability.md), "hyperframes" (its check, the way it was), or "shadow"
# (both run; HyperFrames gates and qa/checker_shadow.json records where they agree). LOOM_CHECKER overrides the lesson's
# project.json "check": {"checker": ...}; else CHECKER_DEFAULT.
CHECKERS = ("hyperframes", "loom", "shadow")
CHECKER_DEFAULT = "loom"


def checker_mode(project=None) -> str:
    m = (os.environ.get("LOOM_CHECKER") or ((project.cfg.get("check") or {}).get("checker") if project is not None else None)
         or CHECKER_DEFAULT).strip().lower()
    if m not in CHECKERS:
        raise LoomError(f"unknown checker '{m}' (one of {', '.join(CHECKERS)})")
    return m


def lc_line(sec: str, f: dict) -> str:
    """One layout or contrast finding of the probe as a check line ("lc <section> <code> @ <time>: <beat> ...")."""
    code = f["code"]
    if code == "text_covered":
        msg = (f"{f.get('beat') or '?'} \"{f['text'][:60]}\" is partly covered by an opaque shape ({int(f['share'] * 100)} % of it, its words "
               f"cut) from {f['t0']} to {f['t1']} s [{f.get('el') or f.get('tag') or ''}]")
    elif code == "text_off_card":
        msg = (f"{f.get('beat') or '?'} \"{f['text'][:60]}\" " + ("runs onto another fill of its card (a band or strip)" if f.get("across") else
               "runs past the edge of its card") + f" ({int(f['share'] * 100)} % of it) from {f['t0']} to {f['t1']} s: give it room or shorten it "
               f"[{f.get('el') or f.get('tag') or ''}]")
    elif code == "line_into_object":
        ln, ob = f.get("line") or {}, f.get("object") or {}
        msg = (f"{ln.get('beat') or ob.get('beat') or '?'}: a line of {ln.get('el') or ln.get('tag')} ({ln.get('beat') or '?'}) runs into "
               f"{ob.get('el') or ob.get('tag')} ({ob.get('beat') or '?'}) at {f['rect']} from {f['t0']} to {f['t1']} s; end it at the "
               f"object's edge or route it around [{ln.get('el') or ''} / {ob.get('el') or ''}]")
    elif code == "line_through_text":
        ln = f.get("line") or {}
        msg = (f"{f.get('beat') or '?'} \"{f['text'][:60]}\": a line of {ln.get('el') or ln.get('tag')} ({ln.get('beat') or '?'}) runs through its "
               f"letters at {f['rect']} from {f['t0']} to {f['t1']} s; give the words room (move or shorten them, or move the line) "
               f"[{f.get('el') or f.get('tag') or ''} / {ln.get('el') or ''}]")
    elif code == "board_carry":
        msg = (f"{f.get('beat') or '?'}: section {f.get('section')} opens with {int(f['share'] * 100)} % of the frame and {f['words']} words carried "
               f"from earlier sections (at most {int(f['max_share'] * 100)} % and {f['max_words']} words): carry only what this section builds on "
               f"and let the rest leave at the end of its section, so the new explanation has room [{', '.join(str(x) for x in f.get('elements') or [])}]")
    elif code == "full_frame_veil":
        msg = (f"{f.get('beat') or '?'}: a translucent shape (alpha {f.get('alpha')}) of {f.get('el') or f.get('tag')} covers "
               f"{int(f['share'] * 100)} % of the frame and changes (by {f.get('change')}) from {f['t0']} to {f['t1']} s "
               f"({round(f['held_ms'] / 1000, 1)} s): it re-tints the whole field, a second background moving over the style's own; "
               "keep it steady (a set's wall), keep a dim under 10 s, or carry the mood inside the station's objects "
               f"[{f.get('el') or ''}]")
    elif code == "text_redrawn":
        a, b = f["a"], f["b"]
        msg = (f"{b.get('beat') or a.get('beat') or '?'}: {f['why'][:200]}, from {f['t0']} to {f['t1']} s "
               f"[{', '.join(str(x) for x in (f.get('elements') or [])[:4])}]")
    elif code == "content_overlap":
        a, b = f["a"], f["b"]
        msg = (f"{a.get('beat') or '?'} \"{a['text'][:50]}\" and {b.get('beat') or '?'} \"{b['text'][:50]}\" overlap at {f['rect']} "
               f"from {f['t0']} to {f['t1']} s ({f['why']}) [{a.get('el') or a.get('tag')} / {b.get('el') or b.get('tag')}]")
    else:
        msg = (f"{f.get('beat') or '?'} \"{f['text'][:60]}\" contrast {f['ratio']}:1 (needs {f['required']}:1), {f['fg']} on {f['bg']}, "
               f"failing at {f['samples']} sample(s) [{f.get('el') or ''}]")
    return f"lc {sec} {code} @ {f['time']}: {msg}"


def lc_findings(pr: dict) -> tuple[list[tuple[dict, str]], list[str]]:
    """([(finding, line)] for every error and warning, [audit failures]): a probe whose audit failed or is missing
    measured nothing, which is an error, never a pass. Info findings (a passing crossing never seen, a text under an
    opaque layer) are left out."""
    out, failed = [], []
    for sec in ("layout", "contrast"):
        if pr.get(f"{sec}_error"):
            failed.append(f"lc {sec} audit_failed @ 0: the {sec} audit did not run ({pr[f'{sec}_error'][:160]})")
            continue
        d = pr.get(sec)
        if d is None:
            failed.append(f"lc {sec} audit_failed @ 0: no {sec} audit in the probe (LOOM_PROBE_LAYOUT=0?)")
            continue
        for f in d.get("findings") or []:
            if f["severity"] in ("error", "warning"):
                out.append((f, lc_line(sec, f)))
    return out, failed


def lc_lines(pr: dict) -> tuple[list[str], list[str]]:
    """The probe's layout and contrast findings as check lines, (errors, warnings); an audit that did not run is an
    error."""
    out, failed = lc_findings(pr)
    return failed + [ln for f, ln in out if f["severity"] == "error"], [ln for f, ln in out if f["severity"] == "warning"]


def _finding_beats(f: dict) -> set:
    """The beats a layout or contrast finding involves (one for a text's own finding, two for a pair)."""
    out = set()
    for k in ("a", "b", "line", "object"):
        if isinstance(f.get(k), dict) and f[k].get("beat"):
            out.add(f[k]["beat"])
    if f.get("beat"):
        out.add(f["beat"])
    return out


def beat_findings(project, pr: dict, beat: str) -> dict:
    """What the check would say about one beat, from a probe of the lesson (D-154, the check at draw time): its OWN errors
    and warnings (every text involved is the beat's: overlap within the beat, covered, off card, line into an object,
    contrast; and the film's type size, words cut and off frame), and the findings it SHARES with another beat, named,
    which never hold the scene (the author may not be able to change the other beat, L-335)."""
    out, failed = lc_findings(pr)
    own_e, own_w, shared = list(failed), [], []
    for f, ln in out:
        bs = _finding_beats(f)
        if beat not in bs:
            continue
        if bs == {beat}:
            (own_e if f["severity"] == "error" else own_w).append(ln)
        else:
            shared.append(ln + f" (shared with {', '.join(sorted(bs - {beat}))})")
    try:
        from .checks import film as FILM
        man = read_json(project.path("build/manifest.json"), {}) or {}
        te, tw, _ = FILM.screen_text_checks(pr, man.get("style"), read_json(project.path("plan/storyboard.json"), {}) or {}, lesson=project.id)
        own_e += [e for e in te if e.startswith(f"{beat}:")]
        own_w += [w for w in tw if w.startswith(f"{beat}:")]
    except Exception as e:  # noqa: BLE001  (the measure says it did not run, never passes blind)
        own_w.append(f"the on-screen type check did not run in this look ({str(e)[:120]})")
    return {"errors": own_e[:20], "warnings": own_w[:20], "shared": shared[:20]}


def _norm_text(x) -> str:
    import re as _re
    return _re.sub(r"\s+", " ", str(x or "")).strip().lower()[:30]


def same_finding(h: dict, o: dict) -> bool:
    """A HyperFrames finding {code, time, text} and a Loom one name the same defect: same code, the text matches (a
    prefix of 20 characters either way), and for an overlap the time falls within its run (1.5 s slack)."""
    oc = "content_overlap" if o["code"] == "text_redrawn" else o["code"]   # a redrawn text is the overlap HyperFrames names
    if h["code"] != oc:
        return False
    ht = _norm_text(h.get("text"))
    if not ht:
        return False
    texts = [_norm_text(o["a"]["text"]), _norm_text(o["b"]["text"])] if oc == "content_overlap" else [_norm_text(o["text"])]
    near = oc != "content_overlap" or o["t0"] - 1.5 <= float(h["time"]) <= o["t1"] + 1.5
    return near and any(x and (x.startswith(ht[:20]) or ht.startswith(x[:20])) for x in texts)


HF_GATE_LINE = r"hf (layout|contrast) (content_overlap|contrast_aa_failure) @ ([\d.]+): .*?\[(.*?)\]"


def hf_gating(hf: dict, error_lines: list[str]) -> list[dict]:
    """HyperFrames' overlap and contrast findings that were errors in a check (its report lines, after the painted
    test), as {code, time, text, selector}."""
    import re as _re
    hff = [f for sec in ("layout", "contrast") for f in (hf.get(sec) or {}).get("findings", []) if f.get("code") in ("content_overlap", "contrast_aa_failure")]
    out = []
    for ln in error_lines:
        m = _re.match(HF_GATE_LINE, str(ln))
        if not m:
            continue
        code, t, sel = m.group(2), float(m.group(3)), m.group(4)
        c = [f for f in hff if f.get("code") == code and abs(float(f.get("time") or 0) - t) < 0.01 and sel and str(f.get("selector") or "").startswith(sel[:40])]
        out.append({"code": code, "time": t, "text": (c[0].get("text") if c else "") or "", "selector": sel})
    return out


def checker_shadow(project, hf: dict, hf_errors: list[str], pr: dict) -> dict:
    """Where HyperFrames' gating overlap and contrast errors and Loom's agree, appended to qa/checker_shadow.json once
    per build (the record that decides when Loom's checker gates alone)."""
    gate = hf_gating(hf, hf_errors)
    ours = (pr.get("layout") or {}).get("findings", []) + (pr.get("contrast") or {}).get("findings", [])
    ours_err = [o for o in ours if o["severity"] == "error"]
    rec = {"build_hash": build_hash(project.path("build")), "hf_errors": len(gate),
           "found": sum(1 for h in gate if any(same_finding(h, o) for o in ours_err)),
           "missed": [h for h in gate if not any(same_finding(h, o) for o in ours_err)],
           "loom_errors": len(ours_err), "loom_only": [o for o in ours_err if not any(same_finding(h, o) for h in gate)],
           "loom_ms": ((pr.get("layout") or {}).get("ms") or 0) + ((pr.get("contrast") or {}).get("ms") or 0)}
    f = project.path("qa/checker_shadow.json")
    hist = read_json(f, []) if f.exists() else []
    if not hist or hist[-1].get("build_hash") != rec["build_hash"]:
        hist.append(rec)
        write_json(f, hist)
    return rec


def painted_overlaps(project, findings: list) -> dict:
    """{id(finding): {real, why}} for HyperFrames content_overlap findings: whether both texts are painted where their
    boxes meet (tools/node/overlap_paint.mjs). Empty when there is nothing to judge; a finding the tool cannot decide
    keeps its severity."""
    findings = [f for f in findings if f.get("selector") and f.get("containerSelector")]
    if not findings:
        return {}
    import tempfile
    tmp = Path(tempfile.mkdtemp(prefix="loom_overlap_"))
    try:
        fin, out = tmp / "findings.json", tmp / "out.json"
        write_json(fin, [{"time": f.get("time"), "selector": f["selector"], "containerSelector": f["containerSelector"]} for f in findings])
        run([which("node"), str(ENGINE_ROOT / "tools/node/overlap_paint.mjs"), str(project.path("build/index.html")), str(fin), str(out)],
            env=hf_env(), timeout=600)
        verdicts = read_json(out, [])
    except Exception as e:  # noqa: BLE001
        # fail closed: an overlap nobody could judge stays an error, as before this check existed (L-346)
        warn(f"check: the painted-overlap pass failed ({str(e)[:160]}); {len(findings)} overlap(s) kept as errors")
        return {}
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    return {id(f): v for f, v in zip(findings, verdicts) if isinstance(v, dict)}


def _intervals_moving(project, probe_rep, manifest):
    iv = []
    for t in probe_rep.get("tweens", []):
        if t.get("kind") in ("ambient",):
            continue
        iv.append((t["t0"], t["t1"]))
    for s in manifest["scenes"]:
        jw = s.get("join_window") or [0, 0]
        if jw[1] > jw[0]:
            iv.append((jw[0], jw[1]))
        b = next(x for x in manifest["beats"] if x["id"] == s["beat"])
        if s["kind"] in ("manim", "skia", "three", "page", "media", "avatar"):
            iv.append((b["start"], b["end"]))
        if (s.get("shot") or {}).get("move") in ("push", "pull"):
            iv.append((b["start"], b["start"] + min(6, (b["speech_end"] - b["start"]) * 0.6)))
    return sorted(iv)


def _max_gap(iv, a, b):
    cur, gap, at = a, 0.0, a
    for s, e in iv:
        if e < a or s > b:
            continue
        if s > cur and s - cur > gap:
            gap, at = s - cur, cur
        cur = max(cur, e)
    if b - cur > gap:
        gap, at = b - cur, cur
    return gap, at


def lints(project, probe_rep, manifest) -> tuple[list[str], list[str], dict]:
    E, W = [], []
    for e in probe_rep.get("errors") or []:
        E.append(f"runtime {e.get('code')}: {e.get('msg')}")
    for w in probe_rep.get("warnings") or []:
        W.append(f"runtime {w.get('code')}: {w.get('msg')}")
    for c in probe_rep.get("console") or []:
        (E if c.startswith("pageerror") else W).append(f"browser {c}")
    if not probe_rep.get("ready"):
        E.append("the composition never finished building (see qa/probe.json)")
    iv = _intervals_moving(project, probe_rep, manifest)
    holds = []
    # D-112: a declared rest on a finished frame may hold up to pace.rest_max_s (TED-Ed: 7 to 24 s teaching holds)
    sb_scenes = (read_json(project.path("plan/storyboard.json"), {}) or {}).get("scenes", [])
    intent_of = {s.get("beat"): s.get("intent") for s in sb_scenes}
    from .checks import film as _FILM
    rest_max = _FILM.thresholds(manifest.get("style")).get("rest_max_s", 20.0)
    for b in manifest["beats"]:
        g, at = _max_gap(iv, b["speech_start"], b["speech_end"])
        if intent_of.get(b["id"]) in ("hold", "rest", "process_hold"):
            if g > rest_max:
                W.append(f"{b['id']}: {g:.1f}s declared rest ({intent_of[b['id']]}) is longer than pace.rest_max_s {rest_max:.0f}s")
            holds.append({"beat": b["id"], "max_static_s": round(g, 2), "declared": intent_of[b["id"]]})
            continue
        if g > 8.0:
            E.append(f"{b['id']}: {g:.1f}s with nothing developing on screen (from {at:.1f}s); reveal the next idea on its words")
        elif g > 5.0:
            W.append(f"{b['id']}: {g:.1f}s static hold from {at:.1f}s")
        holds.append({"beat": b["id"], "max_static_s": round(g, 2)})
    per_beat = {}
    for el in probe_rep.get("elements") or []:
        per_beat.setdefault(el["beat"], []).append(el)
    import re as _re
    for bid, els in per_beat.items():
        own = [e for e in els if e["kind"] not in ("connector", "shape", "motif", "scenery", "mark")]
        # working memory holds CHUNKS: a family of peers (card_1..card_8) is one chunk
        chunks = {_re.sub(r"_\d+$", "", e["name"] or "") for e in own}
        if len(chunks) > 7:
            W.append(f"{bid}: {len(chunks)} chunks on screen ({', '.join(sorted(chunks))}); the budget is ~5-6")
    # BRAG's reading floor (D-48): text the viewer must read stays fully visible long enough to read it.
    # Fast in, then HOLD. Settled time = from the end of its entrance to the start of its exit.
    elx = {(e["beat"], e["name"]): e for e in probe_rep.get("elements") or []}
    # the exit that COUNTS is an exit tween: an element "exited" as held or none stays on screen (a first
    # version read exitT alone and flagged held text as readable for 0.0 s; L-74)
    exit_at = {}
    for tw in probe_rep.get("tweens") or []:
        if tw.get("kind") == "exit" and tw.get("name"):
            k = (tw.get("beat"), tw["name"]); exit_at[k] = min(exit_at.get(k, 1e9), tw["t0"])
    # an element the camera or a screen cover carries away has no exit tween, but it IS gone from frame at its
    # exitT: count it (b01 of phishing-report printed its headline 0.2 s before the camera left, unflagged; L-164)
    for e in probe_rep.get("elements") or []:
        k = (e["beat"], e["name"])
        if k not in exit_at and e.get("exitKind") == "camera" and e.get("exitT") is not None:
            exit_at[k] = float(e["exitT"])
    # the entrance ends when its tween ends (a 1.2 s unmask is not readable 0.45 s in)
    enter_end = {}
    for tw in probe_rep.get("tweens") or []:
        if tw.get("kind") not in ("exit", "ambient") and tw.get("name"):
            k = (tw.get("beat"), tw["name"]); el0 = elx.get(k)
            if el0 and el0.get("revealT") is not None and abs(float(tw["t0"]) - float(el0["revealT"])) < 0.05:
                enter_end[k] = max(enter_end.get(k, 0.0), float(tw["t1"]))
    short = []
    for tx in probe_rep.get("texts") or []:
        key = (tx.get("beat"), (tx.get("element") or {}).get("name"))
        el = elx.get(key)
        if not el or el.get("revealT") is None or key not in exit_at:
            continue
        words = len(str(tx.get("text") or "").split())
        need = 0.8 if words <= 3 else max(1.2, 0.3 * words)
        settled = float(exit_at[key]) - max(float(el["revealT"]) + 0.45, enter_end.get(key, 0.0))
        if settled < need:
            short.append(tx["beat"])
            W.append(f"{tx['beat']}: \"{str(tx.get('text'))[:50]}\" is readable for {max(0, settled):.2f}s but {words} word(s) need {need:.2f}s "
                     "(reading floor: fast in, then hold; cut words or hold it longer)")
    # BRAG's double exposure (D-48): on one station, new content arriving before the old has finished leaving
    # reads as a muddy crossfade. Stagger it (old out, then new in) or dip through the field.
    by_beat = {}
    for tw in probe_rep.get("tweens") or []:
        by_beat.setdefault(tw.get("beat"), []).append(tw)
    crossings = []
    scenes = manifest["scenes"]
    for a, b in zip(scenes, scenes[1:]):
        if a.get("station") != b.get("station") or ((b.get("join_in") or {}).get("type") in ("continue",)):
            continue
        # D-112: a declared ghost (an authored overlap: ghost hold, in-place redraw) is not an accident
        if (b.get("join_in") or {}).get("overlap") == "ghost" or intent_of.get(b.get("beat")) == "ghost":
            continue
        outs = [t["t1"] for t in by_beat.get(a["beat"], []) if t.get("kind") == "exit"]
        ins = [t["t0"] for t in by_beat.get(b["beat"], []) if t.get("content")]
        if outs and ins and min(ins) < max(outs) - 0.12:
            crossings.append(b["beat"])
            W.append(f"{b['beat']}: new content arrives at {min(ins):.2f}s while {a['beat']} is still leaving (until {max(outs):.2f}s) "
                     "on the same station: a double exposure. Let the old leave first, or dip through the field")
    alloc = read_json(project.path("plan/allocation.json"), {"actual": {}})
    stats = {"reading_floor_short": len(short), "double_exposures": len(crossings), "static_holds": holds, "allocation": alloc.get("actual"), "elements": {k: len(v) for k, v in per_beat.items()}}
    # variety (D-79): how this lesson compares with the recent ones; warnings only, the ratchet runs in `loom variety`
    try:
        from .checks import variety as VR
        base = VR.read_json(VR.BASELINE, {})
        P = VR.profile(project.root)
        if base and P["beats"]:
            e2, w2 = VR.judge(P, base)
            W += [f"variety: {m}" for m in e2 + w2]
            stats["variety"] = VR.tells(P)
    except Exception as ex:   # the variety report must never break a check
        W.append(f"variety: not measured ({ex})")
    return E, W, stats


def snapshot_times(manifest) -> list[tuple[str, str, float]]:
    out = []
    for b in manifest["beats"]:
        s0, s1 = b["speech_start"], b["speech_end"]
        out += [(b["id"], "arrive", round(max(b["start"] + 0.35, s0 + 0.2), 2)),
                (b["id"], "develop", round(s0 + (s1 - s0) * 0.55, 2)),
                (b["id"], "settled", round(max(s0, s1 - 0.15), 2))]
    # mid-join frames (BRAG: look at stills from mid-transition too; that is where double exposures live)
    for s in manifest.get("scenes") or []:
        jw = s.get("join_window") or [0, 0]
        if jw[1] - jw[0] >= 0.3:
            out.append((s["beat"], "join", round((jw[0] + jw[1]) / 2, 2)))
    return out


_BUILD_HASHES: dict = {}          # build folder -> (file signature, hash): see build_hash


def build_hash(build: Path) -> str:
    """One hash of everything a frame depends on: the page, the runtime, templates, blueprints, scenes, media
    and audio. The frame cache used to key on index.html + mix.wav alone, so a fixed blueprint (a runtime file)
    kept returning the OLD frames (L-76): a check that looked at stale pictures."""
    import hashlib
    # renders/ holds HyperFrames' segment cache and the render stamp (render.py): outputs, not inputs. Hashing it
    # made every render change the hash (the check's frames went stale after each render, and a stamp written there
    # could never match itself).
    # a compose in another process can rewrite the build while this reads it: a file that vanishes between the listing
    # and the read is skipped (the next call sees the new build). The measured Shuttle run's launcher died on one
    # (FileNotFoundError: build/runtime/ui_artefacts.js, 2026-10-09, L-350)
    # The same build hashes the same on every machine. It used to hash str(relative path), which is "runtime\x.js" on
    # Windows and "runtime/x.js" elsewhere, and to sort by the OS's Path order (case-folded on Windows only): every
    # lesson made on the team's Windows PCs read "check stale" when opened on Linux or in a sandbox, with its build
    # untouched (feedback-relay-v2 and feedback-shuttle-v2, 2026-10-09). The canonical form is the one Windows already
    # wrote (backslash-joined parts, ordered by case-folded parts as Python 3.12's WindowsPath sorts), so no hash a
    # Windows lesson recorded changes.
    # Each file is asked on its own: a whole-listing retry that gave up hashed an EMPTY build (a wrong hash that looks
    # right), which is what a vanishing file inside is_file() produced (mutation check, 2026-10-09).
    def _keep(f):
        try:
            return f.is_file() and "snapshots" not in f.parts and f.relative_to(build).parts[0] != "renders" and not f.name.endswith(".mp4")
        except OSError:
            return False
    files = []
    for _ in range(3):
        try:
            files = [f for f in Path(build).rglob("*") if _keep(f)]
            break
        except OSError:          # a folder removed during the walk: walk again
            continue
    files.sort(key=lambda f: [p.lower() for p in f.relative_to(build).parts])
    rel = lambda f: "\\".join(f.relative_to(build).parts)
    entries = []
    for f in files:
        try:
            entries.append((f, f.stat()))
        except OSError:
            continue
    # flow.status asks for this on every stage it lists (compose's output, L-339): the files' names, sizes and times
    # decide whether the last answer still holds, so an unchanged build is not read again (L-346)
    sig = tuple((rel(f), st.st_size, st.st_mtime_ns) for f, st in entries)
    key = str(Path(build).resolve())
    hit = _BUILD_HASHES.get(key)
    if hit and hit[0] == sig:
        return hit[1]
    h = hashlib.sha256()
    for f, _ in entries:
        try:
            data = f.read_bytes()
        except OSError:
            continue
        h.update(rel(f).encode()); h.update(data)
    out = h.hexdigest()[:16]
    _BUILD_HASHES[key] = (sig, out)
    return out


def _snap(project, times: list[float], chunk_size: int = 30, budget: int | None = None) -> dict[float, Path]:
    """Snapshot frames at times; frames are cached per build (resumable), keyed by the build hash."""
    from .util import file_sha
    build = project.path("build")
    snapdir = build / "snapshots"
    fdir = project.path("qa/frames"); fdir.mkdir(parents=True, exist_ok=True)
    bh = build_hash(build)
    stamp = fdir / ".build"
    if not stamp.exists() or stamp.read_text() != bh:
        for f in fdir.glob("*.png"):
            f.unlink()
        stamp.write_text(bh)
    got = {round(float(f.stem), 2): f for f in fdir.glob("*.png")}
    todo = [t for t in times if round(t, 2) not in got]
    if budget is not None:
        todo = todo[:budget]
    for i in range(0, len(todo), chunk_size):
        chunk = todo[i:i + chunk_size]
        shutil.rmtree(snapdir, ignore_errors=True)
        _hf_snapshot(build, chunk)
        for f in snapdir.glob("frame-*-at-*.png"):
            t = float(f.stem.split("-at-")[1].rstrip("s"))
            dst = project.path(f"qa/frames/{t:.2f}.png"); dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(f, dst); got[round(t, 2)] = dst
    return {t: got[round(t, 2)] for t in times if round(t, 2) in got} if budget is None else got


def contact_sheets(project, manifest) -> list[str]:
    from PIL import Image, ImageDraw
    ts = snapshot_times(manifest)
    frames = _snap(project, sorted({t for _, _, t in ts}))
    sheets = project.path("qa/sheets"); shutil.rmtree(sheets, ignore_errors=True); sheets.mkdir(parents=True)
    by = {}
    for bid, label, t in ts:
        by.setdefault(bid, []).append((label, t))
    out = []
    overview = []
    for bid, items in by.items():
        W_, H_ = 640, 360
        items.sort(key=lambda it: ["join", "arrive", "develop", "settled"].index(it[0]))
        sheet = Image.new("RGB", (W_ * len(items) + 8 * (len(items) - 1), H_ + 44), (17, 17, 17))
        d = ImageDraw.Draw(sheet)
        for i, (label, t) in enumerate(items):
            f = frames.get(round(t, 2))
            if f:
                im = Image.open(f).convert("RGB").resize((W_, H_))
                sheet.paste(im, (i * (W_ + 8), 40))
                if label == "settled":
                    overview.append((bid, im.copy()))
            d.text((i * (W_ + 8) + 8, 10), f"{bid}  {label}  {t:.2f}s", fill=(255, 220, 90))
        p = sheets / f"{bid}.jpg"; sheet.save(p, quality=86); out.append(str(p))
    if overview:
        cols = 4; rows = (len(overview) + cols - 1) // cols
        ov = Image.new("RGB", (cols * 484, rows * 292), (17, 17, 17)); d = ImageDraw.Draw(ov)
        for i, (bid, im) in enumerate(overview):
            x, y = (i % cols) * 484, (i // cols) * 292
            ov.paste(im.resize((480, 270)), (x + 2, y + 20)); d.text((x + 6, y + 4), bid, fill=(255, 220, 90))
        ov.save(sheets / "_overview.jpg", quality=86)
    return out


def check(project, sheets: bool = True, samples: int = 24, run_hf: bool = True) -> dict:
    """The check stage. run_hf=False and sheets=False give the QUICK check used by restyle: the runtime probe,
    measured layout, sample-text audit and lints, without the HyperFrames sampling pass or contact sheets."""
    if not project.path("build/index.html").exists():
        raise LoomError("run compose first")
    # the layout guard (D-169) moves flexible elements before anything is measured; off, it does nothing
    from . import layout_guard as LG
    guard = LG.guard_build(project.path("build"), project=project)
    manifest = read_json(project.path("build/manifest.json"))
    info("check: runtime probe ...")
    pr = probe(project)
    stats_sfx = sync_sfx(project, pr)
    E, W, stats = lints(project, pr, manifest)
    stats["sfx_events"] = stats_sfx
    comp = read_json(project.path("qa/compose.json"), {"errors": [], "warnings": []})
    E = [f"compose: {e}" for e in comp.get("errors", [])] + E
    W = [f"compose: {w}" for w in comp.get("warnings", [])] + W
    mode = checker_mode(project)
    stats["checker"] = mode
    if guard is not None:
        stats["layout_guard"] = {"moved": len(guard["moved"]), "residual": len(guard["residual"]), "converged": guard["converged"]}
    hf = {}
    if run_hf and mode in ("hyperframes", "shadow"):
        info("check: hyperframes check ...")
        hf = hf_check(project, samples)
    # a text overlap is an error only when both texts are painted where they overlap: HyperFrames compares boxes, so an
    # outgoing beat's text under the next beat's opaque world read as two colliding texts and stopped a run no worker
    # could fix (feedback-relay-v2 b09/b10, L-335); a hidden one is kept as a warning that says so
    seen = painted_overlaps(project, [f for f in (hf.get("layout") or {}).get("findings", [])
                                      if f.get("code") == "content_overlap" and f.get("severity") == "error"])
    for sec in ("lint", "runtime", "layout", "contrast", "motion"):
        for f in (hf.get(sec) or {}).get("findings", []):
            if f.get("code") in IGNORE_HF:
                continue
            msg = f"hf {sec} {f.get('code')} @ {f.get('time')}: {(f.get('message') or '')[:160]} [{(f.get('selector') or '')[:60]}]"
            verdict = seen.get(id(f))
            if verdict is not None and verdict.get("real") is False:
                W.append(msg + f" (not seen: {verdict.get('why')})")
                continue
            (E if f.get("severity") == "error" else W).append(msg)
    # Loom's own overlap and contrast audits (the probe's): they gate in "loom" mode; in "shadow" mode they are listed
    # as warnings and recorded against HyperFrames' gating errors (qa/checker_shadow.json)
    if mode in ("loom", "shadow"):
        le_, lw_ = lc_lines(pr)
        lay, con = pr.get("layout") or {}, pr.get("contrast") or {}
        stats["loom_checker"] = {"ms": (lay.get("ms") or 0) + (con.get("ms") or 0), "layout_samples": lay.get("samples"), "texts": lay.get("texts"),
                                 "contrast_checked": con.get("checked"), "errors": len(le_), "warnings": len(lw_)}
        if mode == "loom":
            E += le_; W += lw_
        else:
            W += [f"(shadow) {x}" for x in le_]
            if hf:
                sh = checker_shadow(project, hf, [e for e in E if e.startswith("hf ")], pr)
                stats["loom_checker"].update(hf_errors=sh["hf_errors"], found=sh["found"], missed=len(sh["missed"]), loom_only=len(sh["loom_only"]))
    # a page this size makes every browser pass that walks the DOM slow (https-private: 98,958 nodes, 96,163 of them
    # background dots, 13-minute HyperFrames checks); the background is one pattern now, so a big page is a scene's own
    stats["nodes"] = pr.get("nodes")
    if (pr.get("nodes") or 0) > NODE_BUDGET:
        W.append(f"page_size: the page has {pr['nodes']} DOM nodes (budget {NODE_BUDGET}); draw repeated decoration as one pattern or path")
    # sample-text detector: every word a template draws must come from its props (or declared chrome)
    from .checks.text_audit import audit
    leaks = audit(pr.get("texts") or [], read_json(project.path("plan/storyboard.json")), read_json(ENGINE_ROOT / "runtime/catalog.json", {}))
    for lk in leaks:
        E.append(f"sample_text: {lk['beat']} ({lk['template']}) drew words no prop supplied {lk['words']}: \"{lk['text'][:80]}\" "
                 "(a hard-coded sample string or content default; pass it as a prop, or declare it chrome in the template)")
    stats["sample_text_leaks"] = len(leaks)
    # bespoke scenes (2026-10-07): every word they draw must be in the lesson's own vocabulary (script, storyboard,
    # knowledge); a fallback that invents "In yesterday's release planning meeting" fails here. A ratchet for the
    # lessons made before it (loom/checks/film_baseline.json, gate `vocab`)
    from .checks.text_audit import vocab_check
    ve_, vw_ = vocab_check(project, pr.get("texts") or [])
    E += ve_; W += vw_; stats["vocabulary_leaks"] = len(ve_) + sum(1 for w in vw_ if "lesson_vocabulary" in w)
    from .checks import film as FILM
    E += FILM.overlay_checks(pr)
    se, sw = FILM.scale_checks(pr, manifest.get("style"))
    E += se; W += sw
    sb_ = read_json(project.path("plan/storyboard.json"), {})
    te, tw, ts = FILM.screen_text_checks(pr, manifest.get("style"), sb_, lesson=project.id)
    E += te; W += tw; stats["screen_text"] = ts
    # 2026-10-07: another beat's pixels on screen (stuck or preshown elements) and the element life records
    fe_, fw_, fs_ = FILM.foreign_checks(pr, manifest.get("style"), sb_, manifest)
    E += fe_; W += fw_; stats["foreign"] = fs_
    re_, rw_, rs_ = FILM.record_checks(pr)
    E += re_; W += rw_; stats["records"] = rs_
    # 2026-10-15 (P-c): every caption cue on screen long enough to read; a ratchet for finished lessons
    ce_, cw_, cs_ = FILM.caption_hold_checks(manifest, manifest.get("style"), lesson=project.id)
    E += ce_; W += cw_; stats["caption_hold"] = cs_
    # 2026-10-15 (D-173): the timing grid: every planned sound placed in the mix, every join inside its silence
    from .checks.grid import grid_checks
    ge_, gw_, gs_ = grid_checks(project, manifest)
    E += ge_; W += gw_; stats["grid"] = gs_
    files = []
    if sheets:
        info("check: contact sheets ...")
        files = contact_sheets(project, manifest)
        # D-100: film checks on the frames just taken (empty, sparse, repeated); a pipeline with nobody watching
        # cannot ship the step 7 failure kinds silently (L-172)
        try:
            fr = {round(float(f.stem), 2): f for f in project.path("qa/frames").glob("*.png")}
            fe, fw, fs = FILM.frame_checks(manifest, fr, read_json(project.path("plan/storyboard.json")), manifest.get("style"), probe_rep=pr)
            E += fe; W += fw; stats["film"] = fs
        except Exception as ex:   # the measure must never pass silently: say it did not run
            W.append(f"film checks did not run ({ex})")
        try:   # D-112: tone as a plan (value script), accent discipline, and illustrated packs against their reference
            oe, ow, os_ = FILM.tone_checks(manifest, fr, read_json(project.path("plan/storyboard.json"), {}), manifest.get("style"))
            E += oe; W += ow; stats["tone"] = {k: v for k, v in os_.items() if k != "per_beat"}
        except Exception as ex:
            W.append(f"tone checks did not run ({ex})")
    # the build this report is about: render --force refuses a build that changed after its check (flow.py)
    rep = {"ok": not E, "errors": E, "warnings": W, "stats": stats, "sheets": files, "build_hash": build_hash(project.path("build"))}
    write_json(project.path("qa/report.json"), rep)
    info(f"check: {len(E)} error(s), {len(W)} warning(s); sheets in {project.path('qa/sheets')}")
    return rep


def snapshot_sheet(project, times: list[float], name: str = "snapshot") -> str:
    frames = _snap(project, times)
    from PIL import Image
    ims = [Image.open(frames[round(t, 2)]).convert("RGB").resize((640, 360)) for t in times if round(t, 2) in frames]
    cols = 3; rows = (len(ims) + cols - 1) // cols
    sh = Image.new("RGB", (cols * 644, rows * 364), (17, 17, 17))
    for i, im in enumerate(ims):
        sh.paste(im, ((i % cols) * 644, (i // cols) * 364))
    # one file per caller: parallel scene workers each get their own sheet (one shared qa/snapshot.jpg could be
    # overwritten by another worker before the model saw it)
    p = project.path(f"qa/{name}.jpg"); p.parent.mkdir(parents=True, exist_ok=True); sh.save(p, quality=88)
    return str(p)

"""Film checks (D-100): the failure kinds of the step 7 audit, measured on the frames the check already takes,
so a pipeline with no person watching (outside Cowork) cannot ship them silently. Keyless and deterministic.

What is measured (thresholds come from the style pack's `pace` block when it has one, else the defaults below,
calibrated on the audited MP4s; a beat may declare `intent: "hold"` or `intent: "sparse"` in the storyboard to
say an emptier frame is meant, and the reason goes to the ledger):

- empty frame: a frame during speech whose edge density is below `empty_edges` (0.003). On the audit frames,
  empty gradients and black measured 0.0000 to 0.0025; a slide with one line 0.012 to 0.02; drawn scenes 0.08+.
- sparse beat: a beat whose median edge density is below `sparse_edges` (0.02): a slide-like frame (warning).
- repeated frame: two consecutive beats whose settled frames differ by less than `same_frame` (1.5 levels mean
  absolute difference on a 160x90 grey thumbnail): the same picture twice (phishing b15 and b16).
- overlay order: a reveal on the same beat that starts while a chapter or overlay is on screen (phishing b09).
- on-screen type: every visible text line measured in the browser at each beat's settled moment, with station
  scale, camera zoom and travel scale included; below `text_min_px` (18 px at 1080p) is an error, below
  `text_warn_px` (26 px) a warning (the specks of phishing b17 to b21).

Added 2026-10-15 (P-c, the lemo-opuscar study): caption hold. Every caption cue of the manifest (the cues
`captions.srt` is written from) stays on screen at least max(`caption_min_s` 1.8 s, its spoken words + `caption_tail_s`
0.6 s). Measured that day: 22 to 28 % of the cues of three finished lessons ran under 1.8 s (shortest 0.64 s), and every
cue of every lesson misses the 0.6 s tail, because compose holds a cue 0.06 s before its first word to 0.3 s after its
last (less when the next cue starts). A RATCHET: finished lessons are recorded per beat in `film_caption_baseline.json`.

Added 2026-10-07 (bench audit of five lessons, each defect shipped with every check green):
- off frame: an element of the beat (its own, or one it holds) more than 15 % outside the frame or carrying a word
  wholly outside it, and a character cropped more than 24 px at the top or a side (openai-balanced compare.two put
  its whole left column off-frame; the probe skipped wholly-off words). A RATCHET before a gate: lessons made before
  the check are recorded in `film_offframe_baseline.json` (beats flagged then); they fail only on growth.
- foreign pixels: at each beat's settled moment, pixels that change when every scene group but the active beat's
  (and what it holds) is hidden: another beat's picture on screen (claude-balanced b01 to b04 showed b52 under them).
  More than `foreign_px` (300 px at 1080p, an absolute count) is an error.
- blurred beat: the beat's own text on the settled frame has no sharp edges (normalised Laplacian below
  `blur_sharp`): a backplate blur landed on the beat's own words (openai-balanced: 15 beats). It was measured as edge
  density 0.0, reported as an "empty frame", and then excused by intent hold or rest. A blurred beat is never excused.
- element records: every element has its life window (lifeT) in the runtime report.
"""
from __future__ import annotations

from pathlib import Path

DEFAULTS = {"empty_edges": 0.003, "sparse_edges": 0.02, "same_frame": 1.5, "text_min_px": 18, "text_warn_px": 26, "scale_warn": 2.0,
            "rest_max_s": 20.0, "punctuation_max_s": 1.2, "max_hues": 2, "hue_min_share": 0.015, "tone_tol": 0.15,
            # 2026-10-07: foreign pixels (absolute count at 1080p) and the blur floor. On the five bench lessons the
            # beats with no foreign picture measured 0 to 129 px (anti-aliasing at held edges), the defects 697 to
            # 400000+; the normalised Laplacian of a beat's own text measured 0.03 to 0.11 when blurred, 0.82 to 1.07
            # when sharp.
            "foreign_px": 300, "blur_sharp": 0.3, "blur_min_range": 24,
            # 2026-10-15 (P-c, lemo-opuscar study section 12): a caption cue stays on screen at least caption_min_s and
            # at least its spoken words plus caption_tail_s, so it can be read to the end
            "caption_min_s": 1.8, "caption_tail_s": 0.6}
# D-112: what a declared intent excuses. Our failures were long holds on EMPTY frames; good films hold FINISHED ones
# (TED-Ed study, 96 films: 7 to 24 s teaching holds, 0.6 to 1.2 s punctuation beats, callbacks, ghost overlaps).
# A declaration is a claim the frames must bear out; nothing here is excused without one.
EMPTY_OK = ("hold", "sparse", "dark", "rest")          # plus punctuation when the empty run is short
SPARSE_OK = ("hold", "sparse", "dark", "rest", "process_hold", "punctuation")
REPEAT_OK = ("hold", "rest", "process_hold", "callback")
REVEAL_KINDS = {"reveal", "pop", "settle", "drop", "unmask", "draw", "stamp", "iris", "grow", "converge", "assemble", "typewriter", "count"}


def _edges(png: Path) -> float:
    from PIL import Image, ImageFilter
    import numpy as np
    im = Image.open(png).convert("L").resize((480, 270))
    a = np.asarray(im.filter(ImageFilter.FIND_EDGES)).astype(float)
    h, w = a.shape
    a = a[int(h * 0.03):int(h * 0.80), int(w * 0.03):int(w * 0.97)]   # not the caption band, not the border
    return float((a > 40).mean())


def _thumb(png: Path):
    from PIL import Image
    import numpy as np
    return np.asarray(Image.open(png).convert("L").resize((160, 90))).astype(float)


def thresholds(style: dict | None) -> dict:
    t = dict(DEFAULTS)
    t.update({k: v for k, v in ((style or {}).get("pace") or {}).items() if k in DEFAULTS})
    return t


def _lap_abs(a):
    import numpy as np
    return np.abs(4 * a[1:-1, 1:-1] - a[:-2, 1:-1] - a[2:, 1:-1] - a[1:-1, :-2] - a[1:-1, 2:])


def sharpness(png: Path, boxes: list | None = None) -> dict | None:
    """How sharp the beat's own words are on a frame: the 99th percentile of the absolute Laplacian over the text
    boxes (the probe's own readable lines, in 1080p pixels), divided by the intensity range there. Crisp anti-aliased
    type measures about 0.8 to 1.1; type under a 9 px backplate blur 0.03 to 0.11. Without boxes (an older probe) the
    content area is measured (not the caption band, not the section chrome) with the 99.9th percentile. None when
    there is nothing with contrast to measure (a blank frame is the empty-frame check's business)."""
    from PIL import Image
    import numpy as np
    a = np.asarray(Image.open(png).convert("L")).astype(float)
    H, W = a.shape
    sx, sy = W / 1920.0, H / 1080.0
    if boxes:
        L, I = [], []
        for l, t, r, b in boxes:
            l, t = max(0, int((l - 4) * sx)), max(0, int((t - 4) * sy))
            r, b = min(W, int((r + 4) * sx)), min(H, int((b + 4) * sy))
            if r - l < 6 or b - t < 6:
                continue
            c = a[t:b, l:r]
            L.append(_lap_abs(c).ravel()); I.append(c.ravel())
        if not L:
            return None
        L, I = np.concatenate(L), np.concatenate(I)
        rng = float(np.percentile(I, 99) - np.percentile(I, 1))
        hi = float(np.percentile(L, 99))
        where = "text"
    else:
        c = a[int(H * 0.06):int(H * 0.82), int(W * 0.03):int(W * 0.97)]
        rng = float(np.percentile(c, 99.5) - np.percentile(c, 0.5))
        hi = float(np.percentile(_lap_abs(c), 99.9))
        where = "frame"
    return {"norm": round(hi / max(rng, 1.0), 3), "range": round(rng, 1), "where": where}


def frame_checks(manifest: dict, frames: dict, storyboard: dict, style: dict | None = None, probe_rep: dict | None = None) -> tuple[list, list, dict]:
    """frames: {time: png}. Returns (errors, warnings, stats). probe_rep (the runtime probe's report) says what is
    meant to be on screen at each beat's settled moment (visible text lines and the beat's own text boxes)."""
    T = thresholds(style)
    intent = {s.get("beat"): (s.get("intent") or "") for s in (storyboard or {}).get("scenes", [])}
    joins = [(s.get("join_window") or [0, 0]) for s in manifest.get("scenes", [])]
    in_join = lambda t: any(a - 0.05 <= t <= b + 0.05 for a, b in joins if b > a)
    rows = {r.get("beat"): r for r in (probe_rep or {}).get("screen_text") or []}
    E, W = [], []
    per_beat, settled, blur, blurred = {}, {}, {}, []
    ts = sorted(frames)
    for b in manifest["beats"]:
        bt = [t for t in ts if b["speech_start"] + 0.5 <= t <= b["speech_end"] and not in_join(t)]
        row = rows.get(b["id"]) or {}
        # something is meant to be on screen when the probe saw text lines there (blurred words still count: blur
        # does not change what the page draws)
        meant = bool(row.get("n"))
        # the blur measure, on the settled frame (the last sampled moment of the speech), while text is visible
        sh = None
        if bt and (meant or not rows):
            try:
                sh = sharpness(frames[bt[-1]], row.get("boxes") or None)
            except Exception:   # an unreadable frame is reported by the callers' "did not run"
                sh = None
        if sh is not None:
            blur[b["id"]] = sh["norm"]
            if sh["range"] >= T["blur_min_range"] and sh["norm"] < T["blur_sharp"]:
                blurred.append(b["id"])
                # never excused by a declared intent: a hold or a rest is a finished frame, not an unreadable one
                E.append(f"{b['id']}: blurred_beat: the beat's own {'words are' if sh['where'] == 'text' else 'picture is'} blurred at "
                         f"{bt[-1]:.1f}s (sharpness {sh['norm']:.3f} < {T['blur_sharp']}, measured on the {sh['where']}); a backplate "
                         "blur or a filter landed on the active beat. Its words must be crisp (intent does not excuse it)")
        vals, empty = [], []
        for t in bt:
            e = _edges(frames[t]); vals.append(e)
            if e < T["empty_edges"]:
                empty.append(t)
        dt = (ts[-1] - ts[0]) / max(1, len(ts) - 1) if len(ts) > 1 else 0.5
        punct_ok = intent.get(b["id"]) == "punctuation" and len(empty) * dt <= T["punctuation_max_s"] + 1e-6
        # a declared rest or hold excuses an empty frame only when nothing is meant to be on screen; with text drawn
        # and an empty picture, the words are lost (blurred, occluded or off-frame), which no intent asks for
        excused = intent.get(b["id"]) in EMPTY_OK and not meant
        if empty and b["id"] not in blurred and not excused and not punct_ok:
            why = (f" (declared {intent.get(b['id'])}, but {row.get('n')} text line(s) are drawn: they are not seen)"
                   if intent.get(b["id"]) in EMPTY_OK else "")
            E.append(f"{b['id']}: empty frame for {len(empty)} sampled moment(s) from {empty[0]:.1f}s to {empty[-1]:.1f}s "
                     f"(edge density < {T['empty_edges']}) while the voice is speaking{why}; something the words are about must be "
                     "on screen (or declare intent: rest / hold, or punctuation for a run of 1.2 s or less)")
        if vals:
            vals.sort(); med = vals[len(vals) // 2]
            per_beat[b["id"]] = round(med, 4)
            if med < T["sparse_edges"] and intent.get(b["id"]) not in SPARSE_OK and b["id"] not in blurred:
                W.append(f"{b['id']}: sparse frame (median edge density {med:.4f} < {T['sparse_edges']}): reads as a slide; give it a picture or fill the frame")
        if bt:
            settled[b["id"]] = frames[bt[-1]]
    ids = [b["id"] for b in manifest["beats"]]
    st = {s["beat"]: s.get("station") for s in manifest.get("scenes", [])}
    repeats = 0
    for a, b in zip(ids, ids[1:]):
        if a in settled and b in settled and st.get(a) == st.get(b):
            import numpy as np
            d = float(np.abs(_thumb(settled[a]) - _thumb(settled[b])).mean())
            if d < T["same_frame"] and intent.get(b) not in REPEAT_OK:
                repeats += 1
                W.append(f"{b}: the same frame as {a} (difference {d:.2f} < {T['same_frame']}): a new beat needs a visible change")
    sparse = sum(1 for v in per_beat.values() if v < T["sparse_edges"])
    return E, W, {"edge_density": per_beat, "sparse_beats": sparse, "repeated_frames": repeats, "thresholds": T,
                  "measured_beats": len(per_beat), "sharpness": blur, "blurred_beats": blurred, "blur_measured": len(blur)}


def overlay_checks(probe_rep: dict) -> list[str]:
    """errors: a scene that builds underneath a chapter or overlay while it is on screen."""
    E = []
    for o in probe_rep.get("overlays") or []:
        for tw in probe_rep.get("tweens") or []:
            if tw.get("beat") != o.get("beat") or tw.get("kind") not in REVEAL_KINDS:
                continue
            nm = str(tw.get("name") or "")
            if nm.startswith(str(o.get("name"))):
                continue
            if o["t0"] < float(tw["t0"]) < o["t1"] - 0.05:
                E.append(f"{o['beat']}: '{nm or tw.get('kind')}' builds at {tw['t0']:.2f}s under the overlay '{o['name']}' "
                         f"({o['t0']:.2f}-{o['t1']:.2f}s); start it after the overlay (chapter E.after)")
                break
    return E


OFFFRAME_BASELINE = Path(__file__).with_name("film_offframe_baseline.json")


def offframe_baseline() -> dict:
    """{lesson id: [beats flagged off frame when the check was introduced]}: the ratchet's memory, recorded with the
    investigation that decided each beat (tool bug or real; see the file's _note). Empty since 2026-10-07: every
    finished lesson measured 0. A lesson not in it (every new lesson) is gated."""
    import json
    try:
        return json.loads(OFFFRAME_BASELINE.read_text(encoding="utf-8")).get("lessons") or {}
    except FileNotFoundError:
        return {}


def offframe_rows(probe_rep: dict) -> dict[str, list[str]]:
    """beat -> what is off frame in it (the beat's own elements and wholly-off words), from the probe's rows."""
    out = {}
    for row in probe_rep.get("screen_text") or []:
        msgs = []
        for x in row.get("off") or []:
            if x.get("kind") == "character" and x.get("crop"):
                msgs.append(f"character '{x.get('name')}' cropped {x['crop'].get('top', 0)} px at the top and {x['crop'].get('side', 0)} px at the sides")
            else:
                msgs.append(f"{x.get('kind')} '{x.get('name')}' {int(round(100 * float(x.get('share') or 0)))}% outside the frame"
                            + (f" ({x['words']} word(s) wholly off)" if x.get("words") else ""))
        for x in row.get("off_text") or []:
            msgs.append(f"\"{x.get('text')}\" wholly outside the frame at {x.get('rect')}")
        if msgs:
            out[row["beat"]] = msgs
    return out


def screen_text_checks(probe_rep: dict, style: dict | None = None, storyboard: dict | None = None, lesson: str | None = None) -> tuple[list[str], list[str], dict]:
    T = thresholds(style)
    # D-112: signage and texture text in the world (intent: diegetic_text) may be small, as in studio films; it warns
    # instead of failing. Never for a term the narration says (the storyboard author declares it, the review checks it).
    diegetic = {s.get("beat") for s in (storyboard or {}).get("scenes", []) if s.get("intent") == "diegetic_text"}
    E, W, worst = [], [], {}
    if probe_rep.get("screen_text_error"):
        W.append(f"on-screen type not measured ({probe_rep['screen_text_error'][:120]})")
    for row in probe_rep.get("screen_text") or []:
        sm = [x for x in row.get("small") or [] if x.get("px") is not None]
        if row.get("min_px") is not None:
            worst[row["beat"]] = row["min_px"]
        tiny = [x for x in sm if x["px"] < T["text_min_px"]]
        small = [x for x in sm if T["text_min_px"] <= x["px"] < T["text_warn_px"]]
        if tiny and row["beat"] in diegetic:
            W.append(f"{row['beat']}: small diegetic text at {row['t']:.1f}s: " + ", ".join(f"\"{x['text']}\" {x['px']}px" for x in tiny[:3])
                     + " (declared diegetic_text; make sure no narrated term is among them)")
        elif tiny:
            E.append(f"{row['beat']}: text too small to read on screen at {row['t']:.1f}s: " + ", ".join(f"\"{x['text']}\" {x['px']}px" for x in tiny[:3])
                     + f" (< {T['text_min_px']} px at 1080p, after camera and scale)")
        elif small:
            W.append(f"{row['beat']}: small text on screen at {row['t']:.1f}s: " + ", ".join(f"\"{x['text']}\" {x['px']}px" for x in small[:3])
                     + f" (< {T['text_warn_px']} px)")
        cut = row.get("cut") or []
        if cut:
            E.append(f"{row['beat']}: words cut by the frame edge at {row['t']:.1f}s: " + ", ".join(f"\"{x['text']}\" at {x['rect']}" for x in cut[:3])
                     + " (move or shrink the element, or declare a deliberate bleed with data-bleed)")
        for x in (row.get("held_off") or [])[:2]:
            W.append(f"{row['beat']}: a held element is off frame at {row['t']:.1f}s: "
                     + (f"{x.get('kind')} '{x.get('name')}' {int(round(100 * float(x.get('share') or 0)))}% outside" if x.get("off") else f"\"{x.get('text')}\" wholly outside")
                     + " (it was placed by an earlier beat; move it there or stop holding it)")
    # off frame (2026-10-07): a ratchet before a gate (Rule 0). Lessons made before the check fail only on growth.
    offs = offframe_rows(probe_rep)
    base = set((offframe_baseline().get(lesson) or [])) if lesson else set()
    known = lesson in offframe_baseline() if lesson else False
    tmap = {r["beat"]: r.get("t") for r in probe_rep.get("screen_text") or []}
    for bid, msgs in offs.items():
        line = f"{bid}: off frame at {float(tmap.get(bid) or 0):.1f}s: " + "; ".join(msgs[:3]) + \
            " (move or shrink it so it sits inside the frame, or declare a deliberate bleed with data-bleed)"
        if known and bid in base:
            W.append(line + " [known before the off-frame check: film_offframe_baseline.json]")
        else:
            E.append(line + (" [new since the baseline]" if known else ""))
    rows = probe_rep.get("screen_text") or []
    blank, blank_measured = blank_rows(rows)
    for bid, t, n, why in blank:
        line = (f"{bid}: blank beat at {float(t or 0):.1f}s: none of its {n} own element(s) is seen in the frame while the voice "
                f"speaks ({why}); the beat's picture is off frame or absent (lay it out inside the frame, or reveal it)")
        if known and bid in base:
            W.append(line + " [known before the off-frame check: film_offframe_baseline.json]")
        else:
            E.append(line + (" [new since the baseline]" if known else ""))
    if rows and not blank_measured and sum(int(r.get("n_own") or 0) for r in rows):
        E.append(f"blank-beat measure: 0 of {len(rows)} beats measured although the probe saw "
                 f"{sum(int(r.get('n_own') or 0) for r in rows)} of the beats' own words: the measure is blind, not the lesson clean")
    # Rule 0: a zero denominator is red. The lesson drew text (the runtime's own text records) yet the probe saw
    # none on screen: the measure is blind (an empty station <svg> taken as paint made every word "occluded").
    if rows and probe_rep.get("texts") and not any(r.get("n") for r in rows):
        E.append(f"on-screen type measured 0 visible lines across {len(rows)} beats although the lesson draws "
                 f"{len(probe_rep.get('texts') or [])} text(s): the measure is blind, not the lesson clean (see tools/node/probe.mjs)")
    return E, W, {"min_text_px": worst, "off_frame_beats": sorted(offs), "off_frame_baselined": sorted(set(offs) & base) if known else [],
                  "measured_beats": len(rows), "lines_seen": sum(int(r.get("n") or 0) for r in rows),
                  "blank_beats": [b[0] for b in blank], "blank_measured": blank_measured}


def blank_rows(rows: list[dict]) -> tuple[list[tuple], int]:
    """A blank beat (B4, 2026-10-08): none of the beat's OWN elements is seen in the frame at its settled moment, which
    the probe takes inside the speech. gemini b16 and b31 laid their whole picture outside the frame; the edge-density
    "empty" measure saw the held background and passed both. Returns ([(beat, t, own elements, why)], beats measured).

    The probe's own count (`own_measured`, `own_in_frame`, `absent`: visible >= 0.6, painting, at most half outside or
    a declared bleed) is used when the row has it. A probe from before 2026-10-08 has only the off-frame rows: then
    half or more of the beat's elements more than half outside, and no own word seen uncut, is blank."""
    blank, measured = [], 0
    for row in rows:
        if "own_measured" in row:
            n = int(row.get("own_measured") or 0)
            if not n:
                continue     # nothing of its own to see (a beat of held, scenery or presenter elements only)
            measured += 1
            if not int(row.get("own_in_frame") or 0):
                blank.append((row["beat"], row.get("t"), n, ", ".join(f"{x.get('kind')} '{x.get('name')}' {x.get('why')}"
                                                                     for x in (row.get("absent") or [])[:4]) or "none seen"))
            continue
        els = int(row.get("els") or 0)
        if not els:
            continue
        measured += 1
        far = [x for x in row.get("off") or [] if float(x.get("share") or 0) > 0.5 or x.get("words")]
        if len(far) / els >= 0.5 and int(row.get("n_own") or 0) - len(row.get("cut") or []) <= 0:
            blank.append((row["beat"], row.get("t"), els, ", ".join(f"{x.get('kind')} '{x.get('name')}' "
                                                                    f"{int(round(100 * float(x.get('share') or 0)))}% off frame" for x in far[:4])))
    return blank, measured


def foreign_checks(probe_rep: dict, style: dict | None = None, storyboard: dict | None = None, manifest: dict | None = None) -> tuple[list[str], list[str], dict]:
    """Pixels of another beat on screen at a beat's settled moment (tools/node/probe.mjs `foreign`). An authored ghost
    (storyboard intent ghost, or join_in.overlap ghost on the beat) is a warning; anything else above `foreign_px` is
    an error. Not measured at all is said, never passed."""
    T = thresholds(style)
    E, W = [], []
    rows = probe_rep.get("foreign")
    if rows is None:
        W.append("foreign pixels not measured (" + (probe_rep.get("foreign_error") or "this probe report has no foreign rows")[:160] + ")")
        return E, W, {"measured_beats": 0}
    nb = len((manifest or {}).get("beats") or []) or None
    if not rows or (nb and len(rows) != nb):
        E.append(f"foreign pixels measured on {len(rows)} beat(s) of {nb if nb else '?'}: the measure did not cover the lesson")
    ghost = {s.get("beat") for s in (storyboard or {}).get("scenes", []) if s.get("intent") == "ghost" or (s.get("join_in") or {}).get("overlap") == "ghost"}
    bad = []
    for r in rows:
        px = int(r.get("px") or 0)
        if px <= T["foreign_px"]:
            continue
        by = ", ".join(f"{k} {v} px" for k, v in sorted((r.get("by") or {}).items(), key=lambda kv: -kv[1])[:4]) or "beats not separable"
        msg = (f"{r['beat']}: foreign pixels at {float(r.get('t') or 0):.1f}s: {px} px of other beats' pictures on screen (from {by}; "
               f"box {r.get('box')}). An element outlived its beat or showed before it; every element belongs to the beats that own or hold it")
        if r["beat"] in ghost:
            W.append(msg + " [declared ghost]")
        else:
            E.append(msg); bad.append(r["beat"])
    return E, W, {"measured_beats": len(rows), "foreign_beats": bad,
                  "max_px": max([int(r.get("px") or 0) for r in rows] or [0])}


# kinds the runtime never gates by life (world.js planLife): they travel, persist or are the presenter
LIFE_EXEMPT = ("motif", "presenter", "scenery")


def record_checks(probe_rep: dict) -> tuple[list[str], list[str], dict]:
    """Every element's life window is in the report (lifeT, from world.js planLife). A runtime made before planLife
    has no lifeT at all: the check says so and skips (a skip is not a pass)."""
    els = probe_rep.get("elements") or []
    if not els:
        return ["element records: the report lists 0 elements (a zero denominator: the build or the probe is broken)"], [], {"elements": 0}
    if not any("lifeT" in e for e in els) or not any(e.get("lifeT") for e in els):
        return [], ["element records: lifeT not checked: this runtime records no element life windows yet (world.js "
                    "Wd.planLife); re-compose with a runtime that has it"], {"elements": len(els), "skipped": True}
    missing = [e for e in els if not e.get("lifeT") and e.get("kind") not in LIFE_EXEMPT]
    E = []
    if missing:
        E.append(f"element records: {len(missing)} of {len(els)} element(s) have no life window (lifeT), so nothing switches them "
                 "off outside their beats: " + ", ".join(f"{e.get('beat')}/{e.get('name')} ({e.get('kind')})" for e in missing[:6]))
    # words with no entrance show from the beat's start, not on their word, and paint over anything drawn before them
    # (claude fork b12: "to whom" on its own black narration card for 7 s, 2026-10-08). A warning: a label meant to
    # be there from the start is fine; one meant for a later word needs a reveal.
    byname = {(e.get("beat"), e.get("name")): e for e in els}
    W, seen = [], set()
    for t in probe_rep.get("texts") or []:
        el = (t.get("element") or {}).get("name")
        e = byname.get((t.get("beat"), el))
        if not e or e.get("revealT") is not None or e.get("kind") in LIFE_EXEMPT or e.get("kind") in ("scenery", "chapter") or (t.get("beat"), el) in seen:
            continue
        seen.add((t.get("beat"), el))
        W.append(f"{t.get('beat')}: no_entrance_words: element '{el}' ({e.get('kind')}) shows \"{str(t.get('text'))[:40]}\" from the beat's "
                 "start with no entrance: reveal it on its word (m.reveal, m.pop) or it sits over whatever came before")
    return E, W, {"elements": len(els), "without_life": len(missing), "no_entrance_words": len(W)}


def scale_checks(probe_rep: dict, style: dict | None = None) -> tuple[list[str], list[str]]:
    """Objects next to people at a believable size (D-100). Step 7 drew a laptop as big as the desk beside a person.

    The runtime records each known object's drawn size with its real size (runtime/objects.js O.REAL) and each
    figure's height. In a beat with people, an object drawn more than `scale_warn` times its real share of the
    tallest person is a warning (depth can explain some of it; a close-up says `hero: true`). Background extras do
    not set the scale. Warnings, not errors: the picture is the judge, this points at where to look."""
    T = thresholds(style)
    lim = T.get("scale_warn", 2.0)
    figs: dict[str, float] = {}
    for f in probe_rep.get("figures") or []:
        if f.get("beat") and not f.get("extra"):
            figs[f["beat"]] = max(figs.get(f["beat"], 0), float(f.get("h") or 0))
    W, seen = [], set()
    for o in probe_rep.get("objects") or []:
        b, ph = o.get("beat"), figs.get(o.get("beat"))
        if not b or not ph or o.get("hero") or not o.get("real_m"):
            continue
        want = o["real_m"] / 1.7 * ph
        k = (b, o.get("kind"))
        if o["size"] > lim * want and k not in seen:
            seen.add(k)
            W.append(f"{b}: {o.get('kind')} '{o.get('name')}' drawn {o['size']} px beside a {int(ph)} px person; about {int(want)} px is real size "
                     f"({o['size'] / want:.1f}x). Shrink it, put it nearer the camera than the person, or mark the close-up hero: true")
    return [], W


# ---------------------------------------------------------------- tone (D-112): colour grading as a plan, measured
BANDS = {"light": (0.55, 1.01), "mid": (0.30, 0.70), "dark": (0.0, 0.40)}


def _tone(png: Path) -> dict:
    """The same measure the vision lab used on 96 TED-Ed films (`still_stats`): mean RGB brightness and mean HSV
    saturation, plus the saturated hue families that cover a visible share of the frame."""
    from PIL import Image
    import numpy as np
    a = np.asarray(Image.open(png).convert("RGB").resize((240, 135))).astype(np.float32)
    mx, mn = a.max(2), a.min(2)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0)
    hsv = np.asarray(Image.fromarray(a.astype("uint8")).convert("HSV")).astype(np.float32)
    vivid = (sat > 0.5) & (mx > 90)
    hues = hsv[..., 0][vivid] / 256.0
    return {"brightness": float(a.mean() / 255), "saturation": float(sat.mean()), "hues": hues, "pixels": int(sat.size)}


def _hue_families(hues, pixels: int, min_share: float) -> int:
    """Saturated hue families with at least min_share of the frame: 12 hue bins, neighbouring bins merged (a
    gradient of one hue is one family)."""
    import numpy as np
    if len(hues) == 0:
        return 0
    h, _ = np.histogram(hues, bins=12, range=(0, 1))
    on = [c / pixels >= min_share for c in h]
    if all(on):
        return 1
    fam, i0 = 0, on.index(False)
    for k in range(1, 13):                      # walk the circle once, starting after an empty bin
        i = (i0 + k) % 12
        if on[i] and not on[(i - 1) % 12]:
            fam += 1
    return fam


def tone_checks(manifest: dict, frames: dict, storyboard: dict, style: dict | None = None) -> tuple[list, list, dict]:
    """Warnings only (D-112). Three measures, each on the frames the check already took:
    1. value script: each beat's measured brightness against the band the storyboard declared for it;
    2. accent discipline: more than `max_hues` saturated hue families in a beat's settled frame (every look family:
       96 of 96 TED-Ed films kept one accent on the named thing);
    3. illustrated packs only: the lesson's brightness, saturation and dark and light shares against the pack's
       `tone_reference` (TED-Ed family means; a reference, never a target)."""
    T = thresholds(style)
    sb = storyboard or {}
    W, per = [], {}
    ts = sorted(frames)
    beats = manifest.get("beats") or []
    for b in beats:
        bt = [t for t in ts if b["speech_start"] + 0.5 <= t <= b["speech_end"]]
        if not bt:
            continue
        ms = [_tone(frames[t]) for t in bt]
        last = ms[-1]
        per[b["id"]] = {"brightness": round(sorted(m["brightness"] for m in ms)[len(ms) // 2], 3),
                        "saturation": round(sorted(m["saturation"] for m in ms)[len(ms) // 2], 3),
                        "hue_families": _hue_families(last["hues"], last["pixels"], T["hue_min_share"])}
    ids = [b["id"] for b in beats]
    band_of, cur = {}, None
    script = {v.get("from"): v for v in (sb.get("value_script") or []) if v.get("from")}
    for bid in ids:
        cur = script.get(bid, cur)
        if cur:
            band_of[bid] = cur
    for bid, v in band_of.items():
        m = per.get(bid)
        lo, hi = BANDS.get(v.get("band"), (0, 1.01))
        if m and not lo <= m["brightness"] < hi:
            W.append(f"{bid}: value script says '{v.get('band')}' but the frames measure brightness {m['brightness']:.2f} "
                     f"(band {lo:.2f} to {min(hi, 1):.2f}); regrade the beat or change the script")
    for bid, m in per.items():
        if m["hue_families"] > T["max_hues"]:
            W.append(f"{bid}: {m['hue_families']} saturated hue families in the settled frame (more than {T['max_hues']}): "
                     "one accent on the element the narration names (accent_on), the rest quieter")
    stats = {"per_beat": per, "value_script_beats": len(band_of)}
    ref = (style or {}).get("tone_reference")
    if ref and (style or {}).get("look_family") == "illustrated" and per:
        vals = list(per.values())
        got = {"brightness": sum(v["brightness"] for v in vals) / len(vals),
               "saturation": sum(v["saturation"] for v in vals) / len(vals),
               "dark_share": sum(1 for v in vals if v["brightness"] < 0.25) / len(vals),
               "light_share": sum(1 for v in vals if v["brightness"] > 0.7) / len(vals)}
        tol = float(ref.get("tolerance") or T["tone_tol"])
        for k, g in got.items():
            r = ref.get(k)
            lim = tol if k in ("brightness", "saturation") else max(tol, 0.25)
            if isinstance(r, (int, float)) and abs(g - r) > lim:
                W.append(f"tone: lesson {k} {g:.2f} against the pack's reference {r:.2f} ({ref.get('family')}, +/- {lim:.2f}); "
                         "a reference measured on TED-Ed films, not a target: look at the frames before changing anything")
        stats["tone_vs_reference"] = {k: round(v, 3) for k, v in got.items()}
    return [], W, stats


# ---------------------------------------------------------------- caption hold (2026-10-15, P-c)
CAPTION_BASELINE = Path(__file__).with_name("film_caption_baseline.json")


def caption_baseline() -> dict:
    """{lesson id: {beat: short cues then}}: the caption-hold ratchet's memory. A lesson not in it (every new lesson) is
    gated; a listed lesson fails only where a beat has more short cues than recorded."""
    import json
    try:
        return json.loads(CAPTION_BASELINE.read_text(encoding="utf-8")).get("lessons") or {}
    except FileNotFoundError:
        return {}


def short_cues(manifest: dict, style: dict | None = None) -> tuple[dict[str, list[dict]], dict]:
    """beat -> the caption cues shown for less than they need, from the manifest's caption groups. A cue needs
    max(caption_min_s, its spoken words + caption_tail_s); its beat is the beat its first word is spoken in."""
    T = thresholds(style)
    cap = manifest.get("captions") or {}
    groups = cap.get("groups") or []
    beats = sorted(manifest.get("beats") or [], key=lambda b: float(b.get("start") or 0))
    def beat_of(t):
        hit = None
        for b in beats:
            if float(b.get("start") or 0) <= t + 1e-6:
                hit = b.get("id")
        return hit or "?"
    out, holds = {}, []
    # the tail past the last word is owed only where the voice pauses (D-180, Kshitij 2026-10-15: "Merge + tail at
    # pauses"): in running speech the next words start sooner, and a caption that waited would lag the voice
    firsts = [float((g.get("words") or [{}])[0].get("s", 0)) for g in groups if g.get("words")]
    # a cue is shown for whole frames: a shortfall under one frame is not on screen (st-sc-2fa, 2026-10-16: 1.78 s of
    # 1.80 s stopped a lesson for a person over 20 ms)
    frame = 1.0 / float(manifest.get("fps") or 30)
    k = 0
    for g in groups:
        ws = g.get("words") or []
        if not ws:
            continue
        k += 1
        hold = float(g["t1"]) - float(g["t0"])
        spoken = float(ws[-1]["e"]) - float(ws[0]["s"])
        room = (firsts[k] - 0.06 - float(ws[-1]["e"])) if k < len(firsts) else T["caption_tail_s"]
        need = max(T["caption_min_s"], spoken + max(0.0, min(T["caption_tail_s"], room)))
        holds.append(hold)
        if hold < need - frame + 1e-6:
            text = " ".join(w["w"] for w in ws)
            out.setdefault(beat_of(float(ws[0]["s"])), []).append(
                {"t": round(float(g["t0"]), 2), "hold": round(hold, 2), "need": round(need, 2), "spoken": round(spoken, 2),
                 "under_min": hold < T["caption_min_s"] - frame + 1e-6, "text": text})
    n = sum(len(v) for v in out.values())
    return out, {"enabled": cap.get("enabled", True) is not False, "cues": len(holds), "short": n,
                 "under_min": sum(1 for v in out.values() for c in v if c["under_min"]),
                 "min_hold_s": round(min(holds), 2) if holds else None}


def caption_hold_checks(manifest: dict, style: dict | None = None, lesson: str | None = None) -> tuple[list[str], list[str], dict]:
    """Caption hold (P-c): one line per beat with the cues it shows too briefly to read, each with its time. A ratchet
    for the lessons in film_caption_baseline.json (a beat at or under its recorded count is a warning), an error
    for any other lesson. A lesson with captions off shows no cues and is not judged."""
    T = thresholds(style)
    short, stats = short_cues(manifest, style)
    if not stats["enabled"]:
        return [], [], stats
    spoken = sum(len(ph.get("words") or []) for b in manifest.get("beats") or [] for ph in (b.get("phrases") or []) if isinstance(ph, dict))
    if not stats["cues"] and spoken:
        # Rule 0: a zero denominator is red
        return [f"caption hold: 0 caption cues measured although captions are on and the narration speaks {spoken} word(s): "
                "the measure is blind, not the lesson clean"], [], stats
    base_all = caption_baseline()
    known = bool(lesson) and lesson in base_all
    base = (base_all.get(lesson) or {}) if known else {}
    E, W = [], []
    for bid in sorted(short, key=lambda b: short[b][0]["t"]):
        cues = short[bid]
        line = (f"{bid}: caption_hold: {len(cues)} caption cue(s) on screen too briefly to read: "
                + "; ".join(f"{c['t']:.2f}s \"{c['text'][:32]}\" {c['hold']:.2f}s of {c['need']:.2f}s" for c in cues[:4])
                + (f"; and {len(cues) - 4} more" if len(cues) > 4 else "")
                + f" (a cue needs max({T['caption_min_s']} s, its spoken words + up to {T['caption_tail_s']} s where the voice pauses); merge it with its "
                  "neighbour or hold it longer)")
        if known and len(cues) <= int(base.get(bid) or 0):
            W.append(line + " [known before the caption-hold check: film_caption_baseline.json]")
        else:
            E.append(line + (f" [new since the baseline: {int(base.get(bid) or 0)} recorded]" if known else ""))
    stats["baselined"] = known
    return E, W, stats


def record_caption_baseline(projects: list) -> dict:
    """Write film_caption_baseline.json for these FINISHED lessons (their short cues per beat today). Never for a lesson
    being made: that would hide its defects. Re-record a lesson after its captions are fixed so the ratchet shrinks."""
    import datetime
    import json
    from ..util import read_json, write_json
    try:
        old = json.loads(CAPTION_BASELINE.read_text(encoding="utf-8"))
    except FileNotFoundError:
        old = {}
    lessons = dict(old.get("lessons") or {})
    for p in projects:
        mf = read_json(p.path("build/manifest.json"))
        short, _ = short_cues(mf, mf.get("style"))
        lessons[p.id] = {b: len(v) for b, v in sorted(short.items())}
    write_json(CAPTION_BASELINE, {"_note": old.get("_note") or "", "recorded": datetime.date.today().isoformat(), "lessons": lessons})
    return lessons


def promise_checks(project, storyboard: dict, probe_rep: dict) -> tuple[list[str], dict]:
    """D-194, Kshitij: "Nothing should be forgotten or not done. I want everything to happen as supposed." Every element a
    bespoke beat's design promises (`design.elements`) is delivered: drawn in the beat, held from an earlier one, or named in
    the beat's code (each word of its name: "url_callout" by A.callout("url", ...)). A promise nobody wrote is
    `design_element_missing`, for the beat's author. (errors, stats)"""
    import re as _re
    order = [s.get("beat") for s in storyboard.get("scenes") or []]
    drawn = {}
    for e in (probe_rep or {}).get("elements") or []:
        drawn.setdefault(e.get("beat"), set()).add(str(e.get("name") or "").lower())
    E, n, missing = [], 0, 0
    for i, s in enumerate(storyboard.get("scenes") or []):
        if s.get("kind") != "bespoke":
            continue
        have = set().union(*[drawn.get(b, set()) for b in order[: i + 1]]) if order else set()
        f = project.path(f"scenes/{s.get('scene') or s.get('beat')}.js")
        code = f.read_text(encoding="utf-8").lower() if f.exists() else ""
        lost = []
        for el in ((s.get("design") or {}) if isinstance(s.get("design"), dict) else {}).get("elements") or []:
            name = str((el.get("name") if isinstance(el, dict) else el) or "").lower().split(":")[0].strip()
            if not name:
                continue
            n += 1
            words = [w for w in _re.split(r"[_\s\-]+", name) if len(w) > 1]
            if name in have or any(name in h for h in have if h) or (words and all(w in code or any(w in h for h in have) for w in words)):
                continue
            lost.append(name)
        if lost:
            missing += len(lost)
            E.append(f"design_element_missing: {s['beat']}: the storyboard's design promises {', '.join(lost)}, and the beat neither draws, "
                     f"holds nor names {'it' if len(lost) == 1 else 'them'}: build it (or patch the design if the plan changed)")
    return E, {"promised": n, "missing": missing}

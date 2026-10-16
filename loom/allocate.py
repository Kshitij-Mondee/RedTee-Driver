"""Treatment allocation (deterministic): which beats are avatar, template, motion or hybrid.

Targets come from the request (default avatar 10%, template 50%, motion 40% of running time).
Motion goes where the congruence principle says motion IS the content (change over time,
process, causality, quantity), ranked by the script's animate_score. Rhythm rules stop the
lesson from sagging into a slideshow: no run of more than three plain template beats.
"""
from __future__ import annotations

from .checks.text import words
from .util import info, read_json, write_json

# named mixes (D-91). "classic" is the default; "cinema" is opt-in (`loom new --mix cinema`): the picture is a drawn
# world nearly all the time, with overlays on it instead of slide templates (docs/styles/CINEMA_PLAN.md, B11).
MIXES = {
    "classic": {"avatar": 0.10, "template": 0.50, "motion": 0.40},
    "cinema": {"avatar": 0.10, "template": 0.10, "motion": 0.80, "min_score": 0.0},
}


def resolve_mix(m) -> dict:
    """a mix is a name from MIXES or a dict of shares; an unknown name is an error, never a silent default"""
    if m is None:
        return dict(MIXES["classic"])
    if isinstance(m, str):
        if m not in MIXES:
            from .util import LoomError
            raise LoomError(f"unknown mix '{m}' (known: {', '.join(MIXES)})")
        return dict(MIXES[m], name=m)
    return dict(m)


MOTION_JOBS = {"demonstrate", "sequence", "relate", "quantify", "scenario", "refute", "hook", "practice"}
STATIC_JOBS = {"define", "check", "consolidate"}


def _dur(beat, wpm):
    return len(words(" ".join(beat["narration"]))) / wpm * 60 + 0.8 + float(beat.get("pause_after_s") or 0)


def allocate(project) -> dict:
    s = read_json(project.path("plan/script.json"))
    req = project.request
    mix = resolve_mix(req.get("mix"))
    min_score = float(mix.get("min_score", 0.45))
    avatar_on = (req.get("avatar") or {}).get("provider", "presenter") != "none"
    wpm = float(s.get("wpm_target") or 150)
    beats = s["beats"]
    D = {b["id"]: _dur(b, wpm) for b in beats}
    total = sum(D.values())
    out = {b["id"]: {"treatment": None, "reason": ""} for b in beats}

    # 1) avatar: hinted beats, capped; default to the first orient/hook beat and the last beat
    av = [b for b in beats if b["treatment_hint"] == "avatar"] if avatar_on else []
    if avatar_on and not av:
        first = next((b for b in beats[:2] if b["job"] in ("orient", "hook")), None)
        av = [x for x in (first, beats[-1]) if x]
    cap = total * min(0.16, mix.get("avatar", 0.1) * 1.6)
    keep, used = [], 0.0
    for b in sorted(av, key=lambda b: (b is not beats[0] and b is not beats[-1], beats.index(b))):
        if used + D[b["id"]] <= cap or not keep:
            keep.append(b); used += D[b["id"]]
    for b in keep:
        out[b["id"]] = {"treatment": "avatar", "reason": "presenter bookend (intro/outro)"}

    # 2) motion by congruence score
    def score(b):
        sc = float(b["animate_score"]) + (0.25 if b["change_over_time"] else 0) + (0.15 if b["job"] in MOTION_JOBS else 0) - (0.3 if b["job"] in STATIC_JOBS else 0)
        sc += {"motion": 0.3, "template": -0.3, "hybrid": 0.1}.get(b["treatment_hint"], 0)
        if (b.get("recall") or {}).get("kind") in ("quiz", "pause_predict"):
            sc -= 1.0  # checks are read, not watched
        return round(sc, 3)
    rest = [b for b in beats if out[b["id"]]["treatment"] is None]
    ranked = sorted(rest, key=lambda b: (-score(b), beats.index(b)))
    target = total * mix.get("motion", 0.4)
    mused = 0.0
    for b in ranked:
        sc = score(b)
        # "must": the thing taught IS a change over time and the writer rated it near-certain
        must = b["change_over_time"] and float(b["animate_score"]) >= 0.9
        if (mused + D[b["id"]] * 0.5 <= target and sc >= min_score) or (must and mused < total * 0.48):
            out[b["id"]] = {"treatment": "motion", "reason": f"motion carries the meaning (score {sc})"}
            mused += D[b["id"]]
    for b in rest:
        if out[b["id"]]["treatment"] is None:
            out[b["id"]] = {"treatment": "template", "reason": f"static composition with signalling (score {score(b)})"}

    # 3) rhythm: break runs of >3 template beats by upgrading the best one to hybrid
    ids = [b["id"] for b in beats]
    run = []
    for i, bid in enumerate(ids + [None]):
        if bid and out[bid]["treatment"] == "template":
            run.append(bid); continue
        while len(run) > 3:
            seg = run[:4]
            best = max(seg, key=lambda x: score(next(b for b in beats if b["id"] == x)))
            out[best] = {"treatment": "hybrid", "reason": "breaks a run of 4+ template beats (template + motion layer)"}
            run = run[seg.index(best) + 1:]
        run = []
    share = {k: 0.0 for k in ("avatar", "template", "motion", "hybrid")}
    for b in beats:
        share[out[b["id"]]["treatment"]] += D[b["id"]]
    actual = {k: round(v / total, 3) for k, v in share.items()}
    actual["motion_effective"] = round((share["motion"] + 0.5 * share["hybrid"]) / total, 3)
    for b in beats:
        out[b["id"]]["score"] = score(b)
        out[b["id"]]["est_s"] = round(D[b["id"]], 2)
    res = {"targets": mix, "actual": actual, "est_duration_s": round(total, 1), "beats": out}
    write_json(project.path("plan/allocation.json"), res)
    info("allocation: " + ", ".join(f"{k} {v:.0%}" for k, v in actual.items()))
    return res

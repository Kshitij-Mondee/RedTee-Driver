"""What kind of video this is, and what that changes in every planning stage (D-191).

Kshitij on the 2026-10-16 test lessons: "are we using different skills for storyboarding for different kinds of videos?
Like for explainer videos, EXPLAINER SKILL and for Teaching videos, TEACHING SKILL. Because it is asking questions in
explainer videos which it shouldn't." Before this, the kind (`request.genre`, default "teaching") reached only the brief
writer; every later stage read the same skills, and the pedagogy and script gates demanded a recall moment in any video.
All four test lessons (three of them "how X works" explainers) were "teaching" by default and each asked its viewer a
quiz question ("Now you. Which do you check first?").

A PROFILE per kind says what the viewer is asked to do and which craft leads each stage. It reaches:
  - Relay: the task message of the brief, pedagogy, script, outline, storyboard and critic roles (agents/conductor.py);
  - Shuttle: the start message of P1 to P6 and P9 (shuttle/launch.py) and `read_artifact("genre")`;
  - the gates: the pedagogy and script recall rules follow the profile, and `script_errors` refuses what the kind refuses
    (a quiz or a "now you" prompt in an explainer).
`request.genre` "auto" (the default now) is read from the topic and the notes (`infer`), and the brief can settle it; a
kind the person names always wins. The genre craft files `packs/genres/<kind>.md` stay the long reference.
"""
from __future__ import annotations

import re

from .util import ENGINE_ROOT, read_json

GENRES_DIR = ENGINE_ROOT / "packs" / "genres"
ALL_GAGNE = ("attention", "recall_prior", "present", "guidance", "practice", "transfer")

# recall: "required" (at least one recall moment), "optional", "none" (the video asks the viewer nothing)
# quiz: a stopping quiz or pause-and-predict beat is allowed; prompts: direct asks of the viewer ("now you", "your turn",
# "what would you do") are allowed; questions_max: the narration's own questions (rhetorical) at most, None = no cap
PROFILES = {
    "teaching": {
        "recall": "required", "quiz": True, "prompts": True, "questions_max": None, "gagne": ALL_GAGNE,
        "lead": {"pedagogy": "lnd-learning-pedagogy", "script": "lnd-learning-pedagogy", "storyboard": "lnd-visual-storyteller"},
        "says": "a lesson: the viewer should be able to DO or DECIDE something after it. Plan a real check they can pass "
                "(one stopping check per 5 minutes at most), a worked example, and practice where the plan calls for it.",
    },
    "explainer": {
        "recall": "none", "quiz": False, "prompts": False, "questions_max": 2, "gagne": ("attention", "present", "guidance"),
        "lead": {"pedagogy": "lnd-explainer-craft", "script": "lnd-explainer-craft", "storyboard": "lnd-explainer-craft"},
        "says": "an explainer: the viewer should UNDERSTAND how something works, not be tested on it. No quiz, no recall "
                "prompt, no pause-and-predict, no 'now you' or 'your turn', no question put to the viewer to answer. The "
                "narrator may ask at most two questions of their own (the opening gap, one turn) and answers them at once. "
                "Understanding comes from the mechanism shown running, one picture that builds and returns, and the "
                "ending that replays the whole mechanism in one move.",
    },
    "onboarding": {
        "recall": "optional", "quiz": False, "prompts": True, "questions_max": None, "gagne": ("attention", "present", "guidance", "transfer"),
        "lead": {"pedagogy": "lnd-learning-pedagogy", "script": "lnd-explainer-craft", "storyboard": "lnd-visual-storyteller"},
        "says": "onboarding: a welcome and a map of day one. Orient, reassure and point to help; no quiz. A light 'you will' "
                "address is fine; a recall moment only where the plan needs it.",
    },
    "policy": {
        "recall": "required", "quiz": True, "prompts": True, "questions_max": None, "gagne": ALL_GAGNE,
        "lead": {"pedagogy": "lnd-learning-pedagogy", "script": "lnd-learning-pedagogy", "storyboard": "lnd-visual-storyteller"},
        "says": "a policy video: the rule verbatim, what it looks like at work, the grey areas, who to ask, and a check on "
                "a real decision.",
    },
    "soft-skills": {
        "recall": "required", "quiz": True, "prompts": True, "questions_max": None, "gagne": ALL_GAGNE,
        "lead": {"pedagogy": "lnd-learning-pedagogy", "script": "lnd-learning-pedagogy", "storyboard": "lnd-visual-storyteller"},
        "says": "a soft-skills video: the moment it goes wrong, the model, the model applied, then the viewer's turn "
                "(practice is the point here).",
    },
    # a product video (2026-10-16): introduce a product, site or feature, sell it honestly, make it make sense. Its own
    # skill (skills/product/product-explainer), not teaching or explainer craft. The viewer is addressed directly and the
    # film ends on one ask ("try it free"), so prompts are allowed; nothing is tested, so no quiz or recall.
    "product": {
        "recall": "none", "quiz": False, "prompts": True, "questions_max": 2, "gagne": ("attention", "present", "guidance"),
        "lead": {"pedagogy": "product-explainer", "script": "product-explainer", "storyboard": "product-explainer"},
        "says": "a product video: it introduces a product, site or feature, sells it honestly and makes it make sense. "
                "The viewer is the hero and the product their tool. Hook in the first 3 seconds (readable muted), the "
                "status quo, the shift, 2 or 3 value moments (benefit said, feature shown, result held; the aha first), "
                "proof from the proof inventory, then ONE ask and the end card. No quiz, no recall, no feature tour; every "
                "claim, number, quote, logo and badge traces to the product's own material.",
    },
}

# direct asks of the viewer: refused where the kind takes no prompts
PROMPT_RE = re.compile(r"\b(now you|your turn|over to you|pause (the video|here|now)|try it|have a go|ask yourself|"
                       r"what would you|which would you|which (one )?do you|what do you think|can you (spot|tell|guess|name|say)|"
                       r"take a (second|moment) to|before (i|we) (tell|show) you)\b", re.I)


def known() -> list[str]:
    return sorted(PROFILES)


# ---------------------------------------------------------------- reading the kind from the request
_RULES = (
    # a product video first: "explainer video for our site" and "walkthrough of our app" are product films, not lessons
    ("product", r"\bproduct (demo|tour|video|explainer|launch|overview|walkthrough)s?\b|\bdemo video\b|\bfeature (launch|tour|announcement|release)\b|"
                r"\blaunch (video|film|teaser)\b|\bintroducing (the|our|a)\b|\bhomepage (video|explainer|hero)\b|\b(hero|landing page|sales|promo|pitch) video\b|"
                r"\bsales follow-?up\b|\brolling out the new\b|\broll-?out of (the|our) new\b|"
                r"\b(explainer|video) for (our|the) (site|website|app|platform|product|software|tool|saas)\b"),
    ("explainer", r"\bexplain(er|ing)?\b|\bhow (an?|the)? ?[\w' -]{2,40}\b(works?|work)\b|\bwhat happens (when|inside|between)\b|"
                  r"\bbehind the scenes\b|\bunder the hood\b"),
    ("policy", r"\bpolic(y|ies)\b|\bcompliance\b|\bregulat|\bcode of conduct\b|\bgdpr\b|\banti-?bribery\b"),
    ("onboarding", r"\bonboard|\bwelcome to\b|\bnew (joiner|starter|hire)s?\b|\bfirst (day|week)\b"),
    ("soft-skills", r"\b(feedback|difficult|hard) conversations?\b|\bconflict\b|\bnegotiat|\bcoaching\b|\bactive listening\b|"
                    r"\b(give|giving|receive|receiving) feedback\b|\bempathy\b"),
    ("teaching", r"\bhow to\b|\bhow (do|can|should|would) (i|you|we)\b|\breset\b|\buse an?\b|\busing\b|\bset(ting)? ?up\b|\bconfigur|\bturn(ing)? on\b|\bstep[- ]by[- ]step\b|\bwalkthrough\b|\bsteps? to\b|"
                 r"\bdo it\b|\bpractice\b|\bchecklist\b"),
    # a "how X verbs Y" or "why X" topic without a task: an explainer (how an order reaches a door, how a model answers)
    ("explainer", r"^\s*(how|why|what)\b(?!.*\bto\b)"),
)


def infer(topic: str | None, notes: str | None = None) -> tuple[str, str]:
    """(kind, why) from the topic and the notes; the first rule that matches wins, "teaching" when none does"""
    text = " ".join(x for x in (topic, notes) if x)
    for kind, rx in _RULES:
        m = re.search(rx, text, re.I)
        if m:
            return kind, f'"{m.group(0).strip()}" in the request reads as {kind}'
    return "teaching", "nothing in the request names another kind (the default)"


def resolve(project) -> tuple[str, str]:
    """(kind, why). A kind the request names wins; with "auto" (or none), the brief's kind if it set a known one, else
    the request read by `infer`."""
    req = getattr(project, "request", None) or {}
    g = str(req.get("genre") or "auto").strip().lower()
    if g in PROFILES:
        return g, "the request names it"
    if g not in ("", "auto"):
        return "teaching", f'the request names "{g}", which has no profile ({", ".join(known())}); read as teaching'
    try:
        b = read_json(project.path("plan/brief.json"), {}) or {}
    except Exception:
        b = {}
    bg = str(b.get("genre") or "").strip().lower()
    if bg in PROFILES:
        return bg, "the brief settled it (the request said auto)"
    cfg = getattr(project, "cfg", None) or {}
    return infer(cfg.get("topic") or getattr(project, "topic", None), req.get("notes"))


def of(project) -> str:
    return resolve(project)[0]


def profile(project) -> dict:
    return PROFILES[of(project)]


def craft_file(kind: str) -> str | None:
    f = GENRES_DIR / f"{kind}.md"
    return f.read_text(encoding="utf-8") if f.exists() else None


# ---------------------------------------------------------------- the prompt block, per stage
STAGE_NOTES = {
    "brief": "Set `genre` to this kind (change it only if the request clearly means another, and say why in the brief). "
             "Follow the genre file's arc: its starred roles are required.",
    "pedagogy": "Plan the recall moments as the kind says. {recall_line} Mandatory Gagne events for this kind: {gagne}.",
    "script": "{recall_line} {prompt_line}",
    "outline": "Shape the sections to the kind's arc; {quiz_line}",
    "storyboard": "{quiz_line} Direct each beat for this kind of film.",
    "critic": "Judge the film as {article} {kind}: {prompt_line}",
}


def _lines(kind: str) -> dict:
    P = PROFILES[kind]
    recall = {"required": "At least one recall moment is required (a stopping check at most once per 5 minutes).",
              "optional": "A recall moment only where the plan needs one; none is fine.",
              "none": "No recall moment of any kind: recall_moments is an empty list and no beat carries `recall`."}[P["recall"]]
    prompt = ("Questions put to the viewer are fine where the plan places them."
              if P["prompts"] else
              f"Never ask the viewer to answer, guess, pause or try ('now you', 'your turn', 'which do you', 'what would you'). "
              f"The narrator asks at most {P['questions_max']} question(s) of their own and answers each at once.")
    quiz = "a quiz or check beat fits where the plan has one." if P["quiz"] else "no quiz, check or practice beat, and no quiz template."
    return {"recall_line": recall, "prompt_line": prompt, "quiz_line": quiz, "gagne": ", ".join(P["gagne"]), "kind": kind,
            "article": "an" if kind[0] in "aeiou" else "a"}


def block(project, stage: str) -> str:
    """The kind as a prompt block for one stage (brief, pedagogy, script, outline, storyboard, critic)."""
    kind, why = resolve(project)
    P, L = PROFILES[kind], _lines(kind)
    lead = P["lead"].get({"outline": "storyboard", "critic": "storyboard", "brief": "storyboard"}.get(stage, stage))
    out = [f"VIDEO KIND: {kind} ({why}). This film is {P['says']}"]
    if stage in STAGE_NOTES:
        out.append(STAGE_NOTES[stage].format(**L))
    if lead:
        out.append(f"The craft that leads this stage for this kind: skill `{lead}`.")
    if stage == "brief":
        cf = craft_file(kind)
        if cf:
            out.append("GENRE CRAFT FILE:\n" + cf.strip())
    return "\n".join(out)


# ---------------------------------------------------------------- gates
def plan_errors(project, plan: dict) -> list[str]:
    """the teaching plan against the kind (check_pedagogy)"""
    kind, P = of(project), profile(project)
    rm = ((plan.get("pacing") or {}).get("recall_moments")) or []
    E = []
    if P["recall"] == "required" and not rm:
        E.append(f"no recall moment at all (a {kind} needs one)")
    if P["recall"] == "none" and rm:
        E.append(f"{len(rm)} recall moment(s) in a {kind}: an explainer asks the viewer nothing (recall_moments must be empty); "
                 "understanding comes from the mechanism shown running and the replay at the end")
    if not P["quiz"]:
        q = [r for r in rm if r.get("kind") in ("quiz", "pause_predict")]
        if q and P["recall"] != "none":
            E.append(f"a {kind} has no stopping quiz or pause-and-predict ({len(q)} planned)")
    return E


def gagne_required(project) -> tuple[str, ...]:
    return profile(project)["gagne"]


def script_errors(project, script: dict) -> list[str]:
    """the script against the kind (check_script): recall beats, quiz beats, direct asks of the viewer, question count"""
    kind, P = of(project), profile(project)
    beats = script.get("beats") or []
    E = []
    rec = [b.get("id") for b in beats if b.get("recall")]
    if P["recall"] == "required" and not rec:
        E.append(f"no recall moment in the script (a {kind} needs one)")
    if P["recall"] == "none" and rec:
        E.append(f"recall beats in a {kind} ({', '.join(rec)}): an explainer asks the viewer nothing; drop the recall and "
                 "let the picture carry the understanding")
    if not P["quiz"]:
        qz = [b.get("id") for b in beats if (b.get("recall") or {}).get("kind") in ("quiz", "pause_predict") or b.get("job") in ("check", "practice")]
        if qz:
            E.append(f"quiz, check or practice beats in a {kind} ({', '.join(qz)})")
    if not P["prompts"]:
        asks, n_q = [], 0
        for b in beats:
            line = " ".join(b.get("narration") or [])
            m = PROMPT_RE.search(line)
            if m:
                asks.append(f'{b.get("id")} "{m.group(0)}"')
            n_q += line.count("?")
        if asks:
            E.append(f"the narration puts questions to the viewer in a {kind}: {'; '.join(asks[:6])}. Say it, show it, and "
                     "answer your own question at once")
        if P["questions_max"] is not None and n_q > P["questions_max"]:
            E.append(f"{n_q} questions in a {kind}'s narration (at most {P['questions_max']}, the narrator's own, each answered at once)")
    return E

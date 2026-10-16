"""The stage graph. A stage is either AGENT (a model writes the artifact, in agent mode via a
task file or in API mode via the Anthropic API) or CODE (deterministic).

Tiers: plan = Opus (deciding what and how to teach), build = Sonnet (writing scene code,
personas, reviews), tweak = a cheap model for later file-scoped edits.
"""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class Stage:
    name: str
    kind: str                  # "agent" | "code"
    out: str                   # artifact path relative to the project
    needs: list[str] = field(default_factory=list)   # upstream stages
    tier: str | None = None    # plan | build | tweak (agent stages)
    schema: str | None = None  # schema name for JSON artifacts
    skills: list[str] = field(default_factory=list)  # skill files (engine-relative) the model must read
    prompt: str | None = None  # engine prompt pack (engine-relative)
    only_mode: str | None = None  # "topic" | "source"
    optional: bool = False
    desc: str = ""


LND = "skills/lnd"
STAGES: list[Stage] = [
    Stage("ingest", "code", "source/dossier.json", only_mode="source",
          desc="Parse source documents into page-anchored chunks (LLM-free)."),
    Stage("brief", "agent", "plan/brief.json", needs=["ingest"], tier="plan", schema="brief",
          skills=[f"{LND}/lnd-creative-director/SKILL.md", f"{LND}/lnd-creative-director/reference/rubric.md",
                  f"{LND}/lnd-creative-director/reference/project-interview.md"],
          prompt="prompts/brief.md", desc="Decide what the video IS: outcome, through-line, arc, must-cover, postures."),
    Stage("knowledge", "agent", "plan/knowledge.json", needs=["brief"], tier="plan", schema="knowledge", only_mode="topic",
          prompt="prompts/knowledge.md", desc="Topic mode: a reviewed fact sheet that becomes the lesson's source."),
    Stage("pedagogy", "agent", "plan/teaching_plan.json", needs=["brief", "knowledge", "ingest"], tier="plan", schema="teaching_plan",
          skills=[f"{LND}/lnd-learning-pedagogy/SKILL.md", f"{LND}/lnd-learning-pedagogy/reference/teaching-plan.md",
                  f"{LND}/lnd-learning-pedagogy/reference/rubric.md"],
          prompt="prompts/pedagogy.md", desc="Design HOW it teaches: performance, strategy, arc, misconceptions, practice, recall."),
    Stage("persona", "agent", "plan/persona.json", needs=["brief"], tier="build", schema="persona",
          skills=[f"{LND}/lnd-narrator-persona/SKILL.md", f"{LND}/lnd-narrator-persona/reference/persona-format.md",
                  f"{LND}/lnd-narrator-persona/reference/rubric.md"],
          prompt="prompts/persona.md", desc="The narrator's character, measurable (or copy one from packs/personas)."),
    Stage("script", "agent", "plan/script.json", needs=["pedagogy", "persona", "knowledge", "ingest"], tier="plan", schema="script",
          skills=[f"{LND}/lnd-learning-pedagogy/SKILL.md", f"{LND}/lnd-visual-design/SKILL.md", f"{LND}/lnd-explainer-craft/SKILL.md"],
          prompt="prompts/script.md", desc="Narration as short phrases grouped into beats, each with a job and a visual intent."),
    Stage("allocate", "code", "plan/allocation.json", needs=["script"],
          desc="Deterministic treatment mix: avatar ~10%, templates ~50%, motion ~40%, with rhythm rules."),
    Stage("storyboard", "agent", "plan/storyboard.json", needs=["script", "allocate"], tier="plan", schema="storyboard",
          skills=[f"{LND}/lnd-visual-design/SKILL.md", f"{LND}/lnd-motion-fit/SKILL.md", f"{LND}/lnd-motion-craft/SKILL.md",
                  f"{LND}/lnd-visual-storyteller/SKILL.md", f"{LND}/lnd-explainer-craft/SKILL.md",
                  f"{LND}/lnd-character-design/SKILL.md", "docs/STORYBOARD_GUIDE.md", "runtime/catalog.md", "docs/TOOLBOX.md"],
          prompt="prompts/storyboard.md", desc="The world, stations, camera, continuity and one scene spec per beat."),
    Stage("narrate", "code", "audio/timings.json", needs=["script", "storyboard"],
          desc="TTS per phrase with exact timings; gaps sized to the joins."),
    Stage("scenes", "agent", "scenes", needs=["storyboard", "narrate"], tier="build",
          skills=[f"{LND}/lnd-motion-choreography-loop/SKILL.md", f"{LND}/lnd-motion-fit/SKILL.md",
                  f"{LND}/lnd-visual-design/SKILL.md", f"{LND}/lnd-explainer-craft/SKILL.md", "docs/SCENE_API.md", "docs/TOOLBOX.md"],
          prompt="prompts/scene_author.md", desc="Write the bespoke motion scenes (JS) and Manim scenes the storyboard asks for."),
    Stage("compose", "code", "build/index.html", needs=["storyboard", "narrate", "scenes"],
          desc="Resolve cues, bundle runtime + scenes, mix sound, write the HyperFrames project."),
    Stage("check", "code", "qa/report.json", needs=["compose"],
          desc="Gates: script, storyboard, grounding, runtime report, HyperFrames check, contact sheets."),
    Stage("review", "agent", "qa/review.json", needs=["check"], tier="build", schema="review", optional=True,
          skills=[f"{LND}/lnd-visual-design/SKILL.md"], prompt="prompts/review.md",
          desc="Look at the contact sheets like a director; list concrete fixes."),
    Stage("render", "code", "renders", needs=["check"], desc="Render MP4 + captions + transcript."),
]
BY_NAME = {s.name: s for s in STAGES}


# stages whose author draws frames in the lesson's style: they read the style's guide (docs/styles/guides/<id>.md,
# the pack's `guide` key) after the stage's skills (WS6 pipeline wiring, 2026-10-08)
GUIDED_STAGES = ("storyboard", "scenes")


def style_guide(style: str | None) -> str | None:
    """The engine-relative path of a style's guide (its pack's `guide` key), or None."""
    from .util import ENGINE_ROOT, read_json
    if not style:
        return None
    g = (read_json(ENGINE_ROOT / "packs" / "styles" / f"{style}.json", {}) or {}).get("guide")
    return g if g and (ENGINE_ROOT / g).exists() else None


def reading_list(stage: Stage, style: str | None = None, kind: str | None = None) -> list[str]:
    """The files a stage's author reads: the kind of video's lead craft for the stage first (D-191: an explainer's
    pedagogy and script lead with lnd-explainer-craft), its skills, then (storyboard and scenes) the style's guide."""
    g = style_guide(style) if stage.name in GUIDED_STAGES else None
    out = list(stage.skills)
    if kind:
        from .genre import PROFILES
        from .util import ENGINE_ROOT
        lead = (PROFILES.get(kind) or {}).get("lead", {}).get(stage.name)
        f = f"{LND}/{lead}/SKILL.md" if lead else None
        if f and (ENGINE_ROOT / f).exists():
            out = [f] + [x for x in out if x != f]
    return out + ([g] if g and g not in out else [])


def active(project) -> list[Stage]:
    mode = project.mode
    return [s for s in STAGES if not s.only_mode or s.only_mode == mode]


def needs(project, stage: Stage) -> list[str]:
    names = {s.name for s in active(project)}
    return [n for n in stage.needs if n in names]

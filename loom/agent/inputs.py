"""What each model stage must read. Paths are ABSOLUTE in task files so any agent can open them."""
from __future__ import annotations

from ..util import ENGINE_ROOT


def stage_inputs(project, stage: str) -> list[tuple[str, str]]:
    P = lambda rel: str(project.path(rel))
    E = lambda rel: str(ENGINE_ROOT / rel)
    req = project.request
    from ..genre import of as _kind     # the kind of video as the engine reads it ("auto" included, D-191)
    genre = E(f"packs/genres/{_kind(project)}.md")
    src = [(P("source/digest.md"), "digest of the source documents (headings, captions, page anchors)"),
           (P("source/chunks.json"), "page-anchored source chunks (the only facts you may use)")] if project.mode == "source" else []
    kn = [(P("plan/knowledge.json"), "the APPROVED knowledge sheet: in topic mode this IS the source")] if project.mode == "topic" else []
    style = E(f"packs/styles/{req.get('style', 'flat-cosmos')}.json")
    table = {
        "brief": [(P("project.json"), "the request: topic, audience, genre, length, style, notes"), (genre, "the genre craft file")] + src,
        "knowledge": [(P("project.json"), "the request"), (P("plan/brief.json"), "the Production Brief")],
        "pedagogy": [(P("plan/brief.json"), "the Production Brief")] + kn + src,
        "persona": [(P("plan/brief.json"), "the Production Brief"), (P("project.json"), "the request (persona wishes in notes)"),
                    (E("packs/personas"), "finished example personas: copy one if it fits")],
        "script": [(P("plan/brief.json"), "the Production Brief"), (P("plan/teaching_plan.json"), "the teaching plan"),
                   (P("plan/persona.json"), "the narrator persona you must BECOME")] + kn + src,
        "storyboard": [(P("plan/brief.json"), "brief (visual_direction)"), (P("plan/teaching_plan.json"), "teaching plan (carriers, energy)"),
                       (P("plan/script.json"), "the script"), (P("plan/allocation.json"), "the treatment each beat MUST get"),
                       (style, "the style pack"), (E("runtime/catalog.md"), "templates + blueprints you can use, with their props")],
        "scenes": [(P("plan/storyboard.json"), "the storyboard (your scene specs are the entries with kind bespoke|manim)"),
                   (P("audio/timings.json"), "exact narration timings: cue anchors must be words spoken in the beat"),
                   (style, "the style pack"), (E("docs/SCENE_API.md"), "the scene API contract"), (E("scenes_examples"), "example bespoke scenes")],
        "review": [(P("qa/report.json"), "the gate report"), (P("qa/sheets"), "contact sheets: one image per beat (start, reveal, settled)"),
                   (P("plan/storyboard.json"), "the storyboard"), (P("plan/script.json"), "the script")],
    }
    return table.get(stage, [])

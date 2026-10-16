"""The scenes stage: one task per bespoke motion scene (they are independent: run them in parallel)."""
from __future__ import annotations

import json

from ..checks.gates import check_scenes
from ..util import ENGINE_ROOT, read_json, run, which
from .tasks import TIER_TEXT, read_prompt


def _scene_brief(project, sc, beat):
    words = " ".join(w["w"] for p in beat["phrases"] for w in p["words"])
    lines = [f"### Beat `{sc['beat']}` ({beat['speech_start']:.2f}s - {beat['speech_end']:.2f}s of speech; the beat owns {beat['start']:.2f}s - {beat['end']:.2f}s)", "",
             "Narration (the ONLY words you may use as cue anchors):", "", "> " + words, "",
             "Phrase timings:", ""]
    for p in beat["phrases"]:
        lines.append(f"- {p['s']:.2f}-{p['e']:.2f}s: \"{p['text']}\"")
    lines += ["", "Storyboard spec for this scene:", "", "```json", json.dumps(sc, indent=1, ensure_ascii=False), "```", ""]
    return "\n".join(lines)


def write_scene_tasks(project) -> list[str]:
    sb = read_json(project.path("plan/storyboard.json"))
    tm = read_json(project.path("audio/timings.json"))
    beats = {b["id"]: b for b in tm["beats"]}
    models = project.cfg.get("models", {})
    paths = []
    for sc in sb["scenes"]:
        if sc["kind"] == "bespoke":
            name = sc.get("scene") or sc["beat"]
            out = project.path(f"scenes/{name}.js"); kind = "JavaScript scene (Loom scene API)"
        elif sc["kind"] == "manim" and not (sc.get("manim") or {}).get("blueprint"):
            out = project.path(f"scenes/{sc['beat']}.py"); kind = "Manim scene (loom_manim.LoomScene)"
        else:
            continue
        body = [f"# Loom task - scene `{sc['beat']}` for `{project.id}`", "",
                f"**Recommended model:** {TIER_TEXT['build']} - `{models.get('build', '')}`", "",
                "## 1. Read these first", "",
                f"- `{ENGINE_ROOT / 'skills/lnd/lnd-motion-choreography-loop/SKILL.md'}` (the working method: treatments, beat sheet, stress test, proof)",
                f"- `{ENGINE_ROOT / 'skills/lnd/lnd-motion-fit/SKILL.md'}` (which motion each form needs, and the build order)",
                f"- `{ENGINE_ROOT / 'docs/SCENE_API.md'}` (the contract your code must follow)",
                f"- `{ENGINE_ROOT / 'scenes_examples'}` (finished example scenes: imitate their structure)",
                f"- the style pack `{ENGINE_ROOT / 'packs/styles' / (sb['style'] + '.json')}` (type ranges: " + ", ".join(f"{k} {v[0]}-{v[1]}px" for k, v in read_json(ENGINE_ROOT / 'packs/styles' / (sb['style'] + '.json'))['type'].items()) + ")",
                f"- `{ENGINE_ROOT / 'runtime/catalog.md'}` Components section (reusable elements: `ctx.use`) and `{ENGINE_ROOT / 'library/FORMS.md'}` (form ids to tag with)", "",
                "## 2. Engine instructions", "", read_prompt("prompts/scene_author.md").strip(), "",
                "## 3. This scene", "", _scene_brief(project, sc, beats[sc["beat"]]),
                "## 4. Output", "", f"Write exactly ONE file: `{out}` - a {kind}.", "",
                "## 5. Prove it", "", f"From `{ENGINE_ROOT}`:", "", "```", f"py -m loom accept {project.id} scenes", f"py -m loom run {project.id} compose",
                f"py -m loom snapshot {project.id} --at {beats[sc['beat']]['speech_start'] + 0.5:.1f},{(beats[sc['beat']]['speech_start'] + beats[sc['beat']]['speech_end']) / 2:.1f},{beats[sc['beat']]['speech_end'] - 0.2:.1f}",
                "```", "", "LOOK at the snapshot image before you claim it works.", ""]
        tp = project.path(f"tasks/scenes/{sc['beat']}.md"); tp.parent.mkdir(parents=True, exist_ok=True)
        tp.write_text("\n".join(body), encoding="utf-8")
        paths.append(str(tp))
    return paths


def syntax_errors(project) -> list[str]:
    errs = []
    node = which("node")
    for f in sorted(project.path("scenes").glob("*.js")):
        r = run([node, "--check", str(f)], check=False)
        if r.returncode != 0:
            errs.append(f"{f.name}: syntax error: {(r.stderr or '').strip().splitlines()[-1] if r.stderr else ''}")
    return errs


def run_scenes_api(project):
    from . import api
    from .. import flow
    sb = read_json(project.path("plan/storyboard.json"))
    tm = read_json(project.path("audio/timings.json"))
    beats = {b["id"]: b for b in tm["beats"]}
    for sc in sb["scenes"]:
        if sc["kind"] == "bespoke":
            target = project.path(f"scenes/{sc.get('scene') or sc['beat']}.js"); want = "js"
        elif sc["kind"] == "manim" and not (sc.get("manim") or {}).get("blueprint"):
            target = project.path(f"scenes/{sc['beat']}.py"); want = "py"
        else:
            continue
        if target.exists():
            continue
        extra = _scene_brief(project, sc, beats[sc["beat"]])
        def gate(t=target):
            E, _ = check_scenes(project)
            E += syntax_errors(project)
            return [e for e in E if t.stem in e]
        api.run_stage(project, "scenes", gate, extra=extra, target=target, want=want)
    E, W = flow.accept_scenes(project)
    return E

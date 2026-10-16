"""Tweaks: small, scoped changes for a cheap model after the first build.

A tweak names what to change in plain words; the engine decides which files are in scope
(one storyboard entry, one scene file, or the script lines of one beat), writes a task that
forbids touching anything else, and re-runs the gates afterwards.
"""
from __future__ import annotations

import json

from ..util import ENGINE_ROOT, LoomError, info, read_json


def _scope(project, beat):
    files = []
    if beat:
        sb = read_json(project.path("plan/storyboard.json"))
        sc = next((s for s in sb["scenes"] if s["beat"] == beat), None)
        if not sc:
            raise LoomError(f"no storyboard scene for beat {beat}")
        files.append((project.path("plan/storyboard.json"), f"ONLY the scene entry whose beat is \"{beat}\""))
        js = project.path(f"scenes/{sc.get('scene') or beat}.js")
        if js.exists():
            files.append((js, "the scene code"))
        py = project.path(f"scenes/{beat}.py")
        if py.exists():
            files.append((py, "the Manim scene"))
        files.append((project.path("plan/script.json"), f"ONLY beat \"{beat}\" (and only if the instruction is about words)"))
    else:
        files.append((project.path("plan/storyboard.json"), "the storyboard"))
    return files


def tweak(project, instruction: str, beat: str | None = None, api_mode: bool = False):
    files = _scope(project, beat)
    n = len(list(project.path("tasks").glob("tweak-*.md"))) + 1
    tp = project.path(f"tasks/tweak-{n:02d}.md")
    lines = [f"# Loom tweak {n:02d} - `{project.id}`" + (f" beat `{beat}`" if beat else ""), "",
             f"**Recommended model:** a cheap model (Haiku) - `{project.cfg.get('models', {}).get('tweak', '')}`", "",
             "## The change", "", instruction, "",
             "## Files you may edit (nothing else)", ""] + [f"- `{p}` - {why}" for p, why in files] + [
             "", "## Rules", "",
             "- Change the smallest thing that satisfies the request. Keep ids, names, anchors and structure.",
             "- Every `say` anchor must stay words the beat's narration speaks. No em/en dashes.",
             "- Never add a fact, number or claim that is not already in the knowledge sheet / source.",
             f"- Read `{ENGINE_ROOT / 'docs/SCENE_API.md'}` before editing scene code.", "",
             "## Prove it", "", "```", f"py -m loom accept {project.id} storyboard", f"py -m loom accept {project.id} scenes",
             f"py -m loom go {project.id} --until check", "```", ""]
    tp.write_text("\n".join(lines), encoding="utf-8")
    from .. import ledger as L
    L.log(project, "override", node=f"tweak:{beat}" if beat else "tweak", decision="tweak", choice=instruction,
          by={"kind": "human"}, data={"task": tp.name, "files": [str(x) for x, _ in files], "api": api_mode})
    info(f"tweak task: {tp}")
    if api_mode:
        _api_tweak(project, instruction, beat)
    return tp


def _api_tweak(project, instruction, beat):
    """Cheap-model tweak via the API: the model returns the replaced scene entry (and scene code)."""
    import re
    from . import api
    from ..util import write_json
    if not beat:
        raise LoomError("API tweaks are scoped to one beat: pass --beat bXX")
    sbp = project.path("plan/storyboard.json")
    sb = read_json(sbp)
    i = next(k for k, s in enumerate(sb["scenes"]) if s["beat"] == beat)
    sc = sb["scenes"][i]
    js = project.path(f"scenes/{sc.get('scene') or beat}.js")
    tm = read_json(project.path("audio/timings.json"))
    words = " ".join(w["w"] for b in tm["beats"] if b["id"] == beat for p in b["phrases"] for w in p["words"])
    sys_txt = (ENGINE_ROOT / "prompts/tweak.md").read_text(encoding="utf-8") + "\n\n" + (ENGINE_ROOT / "docs/SCENE_API.md").read_text(encoding="utf-8")
    user = [f"Instruction: {instruction}", f"Beat narration (anchors must be these words): {words}",
            "Current scene entry:", "```json", json.dumps(sc, indent=1), "```"]
    if js.exists():
        user += ["Current scene code:", "```js", js.read_text(encoding="utf-8"), "```"]
    user.append("Return the full updated scene entry in a ```json block" + (" and the full updated scene code in a ```js block." if js.exists() else "."))
    model = project.cfg.get("models", {}).get("tweak")
    res = api._call(model, [{"type": "text", "text": sys_txt, "cache_control": {"type": "ephemeral"}}], [{"role": "user", "content": "\n".join(user)}], max_tokens=16000)
    api._ledger(project, "tweak", model, res.get("usage"))
    text = "".join(b.get("text", "") for b in res.get("content", []) if b.get("type") == "text")
    new_sc = json.loads(api._extract(text, "json"))
    if new_sc.get("beat") != beat:
        raise LoomError("tweak model changed the beat id; refusing")
    sb["scenes"][i] = new_sc
    write_json(sbp, sb)
    m = re.findall(r"```(?:js|javascript)\s*\n(.*?)```", text, re.S)
    if m and js.exists():
        js.write_text(max(m, key=len).strip() + "\n", encoding="utf-8")
    info(f"tweak applied to {beat}; re-run: py -m loom go {project.id} --until check")

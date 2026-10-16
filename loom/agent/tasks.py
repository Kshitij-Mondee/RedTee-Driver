"""Agent mode: write a self-contained task file a coding agent (Claude Code, Cowork) can follow."""
from __future__ import annotations

from pathlib import Path

from ..stages import BY_NAME
from ..util import ENGINE_ROOT, read_json
from .inputs import stage_inputs

TIER_TEXT = {"plan": "Opus (planning: deciding what and how to teach)", "build": "Sonnet (building: code, personas, reviews)",
             "tweak": "a cheap model (Haiku) - small, file-scoped edits"}


def read_prompt(rel: str | None) -> str:
    if not rel:
        return ""
    p = ENGINE_ROOT / rel
    return p.read_text(encoding="utf-8") if p.exists() else f"(missing prompt pack {rel})"


def write_task(project, stage_name: str, extra: str = "", suffix: str = "") -> Path:
    st = BY_NAME[stage_name]
    models = project.cfg.get("models", {})
    out = project.path(st.out)
    lines = [f"# Loom task - `{stage_name}` for `{project.id}`", "",
             f"**Recommended model:** {TIER_TEXT.get(st.tier, st.tier)} - `{models.get(st.tier, '')}`  ",
             f"**What this stage does:** {st.desc}", ""]
    from ..stages import reading_list
    read = reading_list(st, project.request.get("style"))
    if read:
        lines += ["## 1. Read these skills first, in order (and the style's guide, for frames in this style)", ""]
        lines += [f"- `{ENGINE_ROOT / s}`" for s in read] + [""]
    lines += ["## 2. Engine instructions for this stage", "", read_prompt(st.prompt).strip(), ""]
    if extra:
        lines += ["## Additional instructions", "", extra.strip(), ""]
    lines += ["## 3. Inputs (read all of them)", ""]
    lines += [f"- `{p}` - {why}" for p, why in stage_inputs(project, stage_name)] + [""]
    lines += ["## 4. Output", ""]
    if st.schema:
        lines += [f"Write exactly ONE file: `{out}`", f"It must be JSON valid against `{ENGINE_ROOT / 'loom/schemas' / (st.schema + '.schema.json')}`.", ""]
    else:
        lines += [f"Write your files under `{out}` as described above.", ""]
    lines += ["## 5. Prove it", "", f"Run (from `{ENGINE_ROOT}`):", "", "```", f"py -m loom accept {project.id} {stage_name}", "```", "",
              "Fix every error it reports and run it again until it passes. Do not edit files outside this stage's output.", ""]
    tp = project.path(f"tasks/{stage_name}{suffix}.md")
    tp.parent.mkdir(parents=True, exist_ok=True)
    tp.write_text("\n".join(lines), encoding="utf-8")
    return tp

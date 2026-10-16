"""The kit preview (D-135, design section 3.1 P7 "kit lab strip looked at"): a draft lesson kit drawn on its own, before
any beat uses it.

Relay's kit worker could not see its kit (role card kit.md: "You cannot snapshot the kit on its own yet"). Here the draft
is checked statically first (`checks/kit.kit_errors`, `node --check`), then concatenated with a generated lab scene that
builds every declared part in a grid and steps each through its declared states, and rendered by the lab
(`loom/lab.py`, the real runtime, the lesson's style). The strip and the runtime errors go back to the kit-builder;
`submit_kit` accepts only a source that was previewed. Without a browser the static checks still run and the reply says
the picture is missing (nothing is claimed as seen).
"""
from __future__ import annotations

import json
import subprocess
import tempfile
from pathlib import Path

from ..util import read_json, which

PREVIEW_ID = "shuttle_kit_preview"


def preview_scene(parts: list[dict]) -> tuple[str, float, list[float]]:
    """The lab scene that draws each part: a grid cell per part, its id above it, its states set one second apart."""
    n = max(1, len(parts))
    cols = 1 if n == 1 else 2 if n <= 4 else 3
    states = max([len(p.get("states") or []) for p in parts] or [0])
    dur = round(1.0 + states * 1.0 + 1.0, 2)
    times = [0.6] + [round(1.0 + k * 1.0 + 0.6, 2) for k in range(states)]
    spec = [{"id": p.get("id"), "states": p.get("states") or []} for p in parts]
    js = f"""
// @lab {json.dumps({"title": "Kit preview (Shuttle P7)", "dur": dur, "times": times[:8]})}
Loom.scene("{PREVIEW_ID}", {{
  build(ctx) {{
    const parts = {json.dumps(spec)};
    const cols = {cols}, rows = Math.ceil(parts.length / cols);
    const cw = 1920 / cols, ch = 1080 / rows;
    parts.forEach((p, i) => {{
      const x = (i % cols) * cw, y = Math.floor(i / cols) * ch;
      const cell = Loom.svg("g", {{ transform: `translate(${{x + 40}} ${{y + 70}})` }}, ctx.g);
      const label = Loom.svg("text", {{ x: 0, y: -24, fill: ctx.c("muted"), "font-size": 26, "font-family": "sans-serif" }}, cell);
      label.textContent = p.id + (p.states.length ? "  [" + p.states.join(", ") + "]" : "");
      const inner = Loom.svg("g", {{}}, cell);
      const fn = Loom.lesson && Loom.lesson[p.id];
      if (typeof fn !== "function") {{ Loom.error("kit_part_missing", "Loom.lesson." + p.id + " is not a function"); return; }}
      // containment (L-319): a part draws ONLY into the parent it is given. The Opus run's first desk_set drew its wall
      // and table straight into the station, so the composed beats showed an empty wall; found 85 minutes later.
      const root = ctx.g.ownerSVGElement || ctx.g;
      const before = new Set(root.querySelectorAll("*"));
      let h = null;
      try {{ h = fn(ctx, inner, {{ w: cw - 80, h: ch - 120 }}); }}
      catch (e) {{ Loom.error("kit_part_threw", p.id + ": " + String(e && e.message || e)); return; }}
      const stray = [...root.querySelectorAll("*")].filter((el) => !before.has(el) && !inner.contains(el) && !el.closest("defs"));
      if (stray.length) Loom.error("kit_part_outside_parent", p.id + ": drew " + stray.length + " element(s) outside the parent it was given ("
        + stray.slice(0, 3).map((el) => el.tagName).join(", ") + "): a part draws only into `parent`, so a beat can hold it and a continue beat finds it");
      if (p.states.length && !(h && typeof h.setState === "function")) {{
        Loom.warn("kit_no_setState", p.id + " declares states but its handle has no setState(name, t)");
        return;
      }}
      p.states.forEach((s, k) => {{
        try {{ h.setState(s, 1.0 + k * 1.0); }} catch (e) {{ Loom.error("kit_state_threw", p.id + "." + s + ": " + String(e && e.message || e)); }}
      }});
    }});
  }}
}});
"""
    return js, dur, times


def preview(project, source: str) -> dict:
    """{image, errors, warnings, static_errors}. Static errors (the kit gate, syntax) come first; the picture needs a browser."""
    from ..checks.kit import declared, kit_errors
    parts = declared(project)
    if not parts:
        return {"error": "the storyboard declares no kit parts (storyboard.kit.parts): there is no kit to preview"}
    E, W = kit_errors(project, source=source)
    tmp = Path(tempfile.mkdtemp(prefix="loom_kitprev_"))
    draft = tmp / "_kit_draft.js"
    draft.write_text(source.rstrip() + "\n", encoding="utf-8")
    node = which("node")
    if node:
        r = subprocess.run([node, "--check", str(draft)], capture_output=True, text=True)
        if r.returncode != 0:
            E.append("syntax: " + (r.stderr or r.stdout).strip().splitlines()[-1][:300] if (r.stderr or r.stdout).strip() else "syntax error")
    if E:
        return {"static_errors": E, "warnings": W, "note": "fix these first: nothing was drawn"}
    js, dur, times = preview_scene(parts)
    scene_file = tmp / f"{PREVIEW_ID}.js"
    from ..kept import parts_js as _kept_parts     # reused parts (D-163) the kit's own parts may call
    kept_js, _ = _kept_parts(project)
    scene_file.write_text(kept_js + source.rstrip() + "\n\n" + js, encoding="utf-8")
    out_dir = project.path("qa/kit_preview")
    style = (read_json(project.path("plan/storyboard.json"), {}) or {}).get("style") or project.request.get("style")
    try:
        from ..lab import strip
        rep = strip(PREVIEW_ID, style=style, times=times, out_dir=out_dir, file=scene_file)
    except Exception as e:  # noqa: BLE001  (no browser on this machine, or the page failed)
        return {"static_errors": [], "warnings": W, "error": f"the preview could not be drawn: {str(e)[:400]}",
                "note": "the static checks passed; nothing was seen"}
    return {"image": rep["sheet"], "errors": rep.get("errors") or [], "warnings": W + (rep.get("warnings") or []),
            "parts": [p.get("id") for p in parts], "times": times,
            "note": "each part in its cell, stepped through its states one second apart; fix what looks wrong, preview again, then submit_kit"}

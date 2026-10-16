"""Catalog of templates and blueprints, extracted from the runtime (single source of truth: the JS)."""
from __future__ import annotations

import json

from .util import ENGINE_ROOT, info, read_json, run, which, write_json


def _fmt_props(props: dict, indent: str = "") -> list[str]:
    out = []
    for k, v in props.items():
        bits = [v.get("type", "?")]
        if v.get("required"): bits.append("required")
        if v.get("content"): bits.append("CONTENT (on-screen words: always pass it; never defaulted)")
        if v.get("choices"): bits.append("one of " + "/".join(v["choices"]))
        if v.get("max_words"): bits.append(f"<= {v['max_words']} words")
        if v.get("min") or v.get("max"): bits.append(f"{v.get('min', 0)}-{v.get('max', 'n')} items")
        if "default" in v: bits.append(f"default {json.dumps(v['default'])}")
        out.append(f"{indent}- `{k}`: " + ", ".join(bits))
        if v.get("of"):
            out += _fmt_props(v["of"], indent + "  ")
    return out


def _mark_candidates(cat: dict) -> dict:
    """A template promoted from a design is a CANDIDATE until its blind selection test passes: listed in
    catalog.json (so the gates can find it) but hidden from catalog.md and refused by the storyboard gate."""
    dec = read_json(ENGINE_ROOT / "library/decisions.json", {}) or {}
    for kind in ("templates", "blueprints"):
        for tid, e in (cat.get(kind) or {}).items():
            did = e.get("promoted_from_design")
            e["candidate"] = bool(did) and (dec.get(f"design:{did}") or {}).get("status") != "promoted"
    return cat


def catalog_markdown(include_candidates: bool = False) -> str:
    cat = read_json(ENGINE_ROOT / "runtime/catalog.json")
    md = ["# Loom catalog (generated - do not hand-edit)", "",
          "Every anchor prop (`say`, `say_*`, `*_say`, `*_cue`) is an ANCHOR: a run of words the narration of THAT beat actually speaks.",
          "The element is revealed ON those words. Anchors that are not spoken fail compose.", ""]
    for kind in ("templates", "blueprints"):
        md += [f"## {kind.title()}", ""]
        for k, v in sorted(cat[kind].items()):
            if v.get("candidate") and not include_candidates:
                continue
            md += [f"### `{k}`  ({v['register']}, motion is {v['motion_is']}; jobs: {', '.join(v['job'])})", "", v["doc"], "", "Props:"]
            md += _fmt_props(v["props"]) + [""]
            if v.get("example"):
                md += ["Example:", "```json", json.dumps(v["example"], indent=1), "```", ""]
    if cat.get("avatar"):
        md += ["## Avatar (storyboard kind `avatar`)", "", cat["avatar"].get("doc", ""), "", "Props (any other key is an error):"]
        md += _fmt_props(cat["avatar"]["props"]) + [""]
    comps = cat.get("components") or {}
    md += ["## Components (small reusable elements for bespoke scenes: `ctx.use(id, params, opts)`)", "",
           "Reuse these inside `scenes/<beat>.js` instead of redrawing them. The idea and outline are fixed;",
           "params, slots and the returned parts are yours to adjust. Content params never have defaults.", ""]
    if not comps:
        md += ["(none promoted yet)", ""]
    for k, v in sorted(comps.items()):
        origin = f"commissioned: {v['commissioned_by']}" if v.get("commissioned_by") and not v.get("promoted_from") else \
            f"promoted from {', '.join(v.get('promoted_from') or []) or 'n/a'}"
        md += [f"### `{k}`  (v{v['version']}; {origin})", "", v["idea"], "",
               *([f"Family: {v['family']}. Tags: {', '.join(v.get('tags') or [])}", ""] if v.get("family") or v.get("tags") else []),
               "Outline: " + " -> ".join(v["outline"]), "", "Params:"]
        md += _fmt_props(v["params"])
        if v.get("slots"):
            md += ["Slots: " + "; ".join(f"`{s}`: {d}" for s, d in v["slots"].items())]
        if v.get("parts"):
            md += ["Parts returned: " + ", ".join(f"`{x}`" for x in v["parts"])]
        if v.get("example"):
            md += ["Example:", "```js", v["example"], "```"]
        md += [""]
    return "\n".join(md)


def build_catalog() -> dict:
    node = which("node")
    run([node, str(ENGINE_ROOT / "tools/node/catalog.mjs")], cwd=ENGINE_ROOT)
    cat = _mark_candidates(read_json(ENGINE_ROOT / "runtime/catalog.json"))
    write_json(ENGINE_ROOT / "runtime/catalog.json", cat)
    (ENGINE_ROOT / "runtime/catalog.md").write_text(catalog_markdown(), encoding="utf-8")
    info(f"wrote runtime/catalog.md")
    # what the engine can draw beyond the catalogue (rigs, places, objects, data, depth, fx, primitives, clips): read
    # from each runtime module's @capability line (WS5, 2026-10-07)
    from .capabilities import write as write_capabilities
    caps = write_capabilities()
    if caps["missing_tags"]:
        info(f"[warn] runtime modules without a @capability line: {', '.join(caps['missing_tags'])}")
    info(f"wrote runtime/capabilities.json ({len(caps['capabilities'])} capabilities)")
    return cat

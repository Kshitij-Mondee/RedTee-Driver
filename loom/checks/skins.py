"""The skin_formed check (D-198): in a lesson whose catalog templates take the style's skin, every template beat is made
the style's way, not faded in whole.

The runtime records, per template beat, what each element became (`Loom.report.skins`, runtime/skins.js): who made it
(the skin's name, "drawn", "carried" or "classic"), when its part was due (`t`), when the performer started it (`at`)
and finished it (`by`). This check reads that record from the probe; it costs no frames and gives the same answer on
every build. A lesson without the switch (classic templates, or a lesson made before skins) is not checked.

Errors (the film would show the classic way where the lesson asked for the style's):
  - skin_missing: a template beat with no skin record (built the classic way although the lesson's templates take a skin);
  - skin_not_formed: a template beat where nothing was made by the skin (every element entered by its classic verb).
Warnings:
  - skin_part_late: a part that started more than 0.6 s after its word (the performer was busy);
  - skin_classic_parts: elements of a skinned beat that entered the classic way (an image, a person, a lottie).
"""
from __future__ import annotations

LATE_S = 0.6


def skin_checks(manifest: dict, probe_rep: dict) -> tuple[list[str], list[str]]:
    E: list[str] = []
    W: list[str] = []
    if (manifest or {}).get("template_skin") != "style":
        return E, W
    recs = {r.get("beat"): r for r in (probe_rep or {}).get("skins") or []}
    for sc in (manifest.get("scenes") or []):
        if sc.get("kind") != "template" or sc.get("skin") == "classic":
            continue
        b = sc.get("beat")
        r = recs.get(b)
        if not r:
            E.append(f"skin_missing: {b} ({sc.get('template')}) was built the classic way, but this lesson's templates take its style's skin")
            continue
        els = r.get("elements") or []
        made = [e for e in els if e.get("made") != "classic"]
        if els and not made:
            E.append(f"skin_not_formed: {b} ({sc.get('template')}): no part was made the {r.get('style')} way; every element entered by its classic verb")
        classic = [e.get("name") for e in els if e.get("made") == "classic"]
        if classic and made:
            W.append(f"skin_classic_parts: {b} ({sc.get('template')}): {', '.join(classic[:6])} entered the classic way")
        for e in made:
            if (e.get("late") or 0) > LATE_S:
                W.append(f"skin_part_late: {b}: \"{e.get('name')}\" started {e['late']:.2f}s after its word (the {r.get('style')} performer was busy)")
    return E, W

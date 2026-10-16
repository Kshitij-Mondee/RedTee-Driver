"""Devices and screens are variables (D-140): swap a three beat's device, screen or mood after the storyboard.

A storyboard beat of kind "three" that names the `device_shot` preset carries its device in params:

    {"kind": "three", "three": {"preset": "device_shot", "rect": [...], "params": {"device": "phone", "screen": {...}}}}

`swap()` changes any of device, screen, notify, mood or other params, validates the result against the preset's card,
writes the storyboard, and logs the change (a person through `py -m loom device`, an agent through its tool). The
clip is stored by its params, so the next compose re-renders only this beat; nothing is hand-edited.

    py -m loom device <id> <beat> laptop
    py -m loom device <id> <beat> tablet --screen '{"kind": "notification", "title": "..."}' --mood warm_office
    py -m loom device <id> <beat> --list            (the devices, moods and screen kinds)
"""
from __future__ import annotations

import json

from .util import LoomError, info, read_json, write_json

PRESET = "device_shot"


def choices() -> dict:
    from .three_bridge import SCREEN_KINDS, preset_card
    c = preset_card(PRESET)["params"]
    return {"devices": c["device"]["choices"], "moods": c["mood"]["choices"], "screen_kinds": list(SCREEN_KINDS)}


def swap(project, beat: str, device: str | None = None, screen=None, mood: str | None = None, params: dict | None = None,
         by: dict | None = None, why: str | None = None) -> dict:
    from .three_bridge import preset_errors
    p = project.path("plan/storyboard.json")
    sb = read_json(p)
    sc = next((s for s in sb.get("scenes") or [] if s.get("beat") == beat), None)
    if not sc:
        raise LoomError(f"no storyboard scene for beat {beat}")
    spec = sc.get("three") or {}
    if sc.get("kind") != "three" or spec.get("preset") != PRESET:
        raise LoomError(f"{beat}: not a device beat (kind three with preset {PRESET}); it is {sc.get('kind')}"
                        + (f" with {spec.get('file') or spec.get('preset')}" if sc.get("kind") == "three" else "")
                        + ". A device beat is planned as {\"kind\": \"three\", \"three\": {\"preset\": \"device_shot\", ...}}")
    old = json.loads(json.dumps(spec.get("params") or {}))
    new = dict(old)
    if device:
        new["device"] = device
    if screen is not None:
        new["screen"] = json.loads(screen) if isinstance(screen, str) else screen
    if mood:
        new["mood"] = mood
    new.update(params or {})
    if new.get("device") not in ("phone", "tablet"):
        for k in ("notify", "notify_say", "notify_at"):
            if k in new and device:
                new.pop(k)                  # a banner belongs to a phone or a tablet; dropping it is said below
    trial = dict(sc, three=dict(spec, params=new))
    E = preset_errors(trial)
    if E:
        raise LoomError(f"{beat}: " + "; ".join(E))
    if new == old:
        info(f"{beat}: nothing changed"); return {"beat": beat, "changed": []}
    changed = sorted(k for k in set(old) | set(new) if old.get(k) != new.get(k))
    sc["three"] = dict(spec, params=new)
    write_json(p, sb)
    from . import ledger as L
    L.log(project, "override", node=f"storyboard:{beat}", decision="device_swap", choice={k: new.get(k) for k in changed},
          by=by or {"kind": "human"}, why=why or f"{beat}: {', '.join(changed)} changed after the storyboard",
          data={"from": {k: old.get(k) for k in changed}})
    dropped = [k for k in ("notify", "notify_say", "notify_at") if k in old and k not in new]
    info(f"{beat}: {', '.join(changed)} changed" + (f" (dropped {', '.join(dropped)}: a banner needs a phone or a tablet)" if dropped else "")
         + f". Next: py -m loom go {project.id} --until check, then look at qa/sheets/{beat}.jpg")
    return {"beat": beat, "changed": changed, "dropped": dropped, "params": new}


def cli(args) -> int:
    from .project import Project
    if args.list:
        print(json.dumps(choices(), indent=1)); return 0
    p = Project.open(args.id)
    swap(p, args.beat, device=args.device, screen=args.screen, mood=args.mood,
         params=json.loads(args.params) if args.params else None)
    return 0

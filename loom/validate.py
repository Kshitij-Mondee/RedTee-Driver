"""Schema validation (jsonschema when installed, a strict minimal validator otherwise)."""
from __future__ import annotations

from pathlib import Path

from .util import read_json

SCHEMA_DIR = Path(__file__).resolve().parent / "schemas"


def schema(name: str) -> dict:
    return read_json(SCHEMA_DIR / f"{name}.schema.json")


def _mini(inst, sch, path="$"):
    errs = []
    t = sch.get("type")
    types = t if isinstance(t, list) else ([t] if t else [])
    pymap = {"object": dict, "array": list, "string": str, "number": (int, float), "integer": int, "boolean": bool, "null": type(None)}
    if types and not any(isinstance(inst, pymap[x]) and not (x in ("number", "integer") and isinstance(inst, bool)) for x in types):
        return [f"{path}: expected {t}, got {type(inst).__name__}"]
    if "enum" in sch and inst not in sch["enum"]:
        errs.append(f"{path}: {inst!r} not in {sch['enum']}")
    if isinstance(inst, dict):
        for k in sch.get("required", []):
            if k not in inst:
                errs.append(f"{path}: missing required '{k}'")
        for k, sub in sch.get("properties", {}).items():
            if k in inst:
                errs += _mini(inst[k], sub, f"{path}.{k}")
    if isinstance(inst, list):
        if "minItems" in sch and len(inst) < sch["minItems"]:
            errs.append(f"{path}: needs at least {sch['minItems']} items")
        if "maxItems" in sch and len(inst) > sch["maxItems"]:
            errs.append(f"{path}: at most {sch['maxItems']} items")
        if "items" in sch:
            for i, it in enumerate(inst):
                errs += _mini(it, sch["items"], f"{path}[{i}]")
    if isinstance(inst, str):
        if "minLength" in sch and len(inst) < sch["minLength"]:
            errs.append(f"{path}: shorter than {sch['minLength']}")
        if "pattern" in sch:
            import re
            if not re.search(sch["pattern"], inst):
                errs.append(f"{path}: does not match /{sch['pattern']}/")
    if isinstance(inst, (int, float)) and not isinstance(inst, bool):
        if "minimum" in sch and inst < sch["minimum"]:
            errs.append(f"{path}: below minimum {sch['minimum']}")
        if "maximum" in sch and inst > sch["maximum"]:
            errs.append(f"{path}: above maximum {sch['maximum']}")
    return errs


def validate(obj, name: str) -> list[str]:
    sch = schema(name)
    try:
        import jsonschema  # type: ignore
        v = jsonschema.Draft7Validator(sch)
        return [f"$.{'.'.join(str(p) for p in e.absolute_path)}: {e.message}" for e in sorted(v.iter_errors(obj), key=lambda e: list(e.absolute_path))]
    except ImportError:
        return _mini(obj, sch)

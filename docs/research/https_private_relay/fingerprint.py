"""Fingerprint the shared engine files (loom/, runtime/, tools/node/, packs/styles/, the role cards and the models config
are inside loom/): one sha256 per file and one over all of them. Usage: fingerprint.py <out.json> [--compare <earlier.json>]
Run from the engine root. Byte-compiled caches are left out."""
import hashlib
import json
import sys
from pathlib import Path

ROOTS = ("loom", "runtime", "tools/node", "packs/styles")
out = Path(sys.argv[1])
files = {}
for r in ROOTS:
    for f in sorted(Path(r).rglob("*")):
        if f.is_file() and "__pycache__" not in f.parts and f.suffix not in (".pyc",):
            files[f.as_posix()] = hashlib.sha256(f.read_bytes()).hexdigest()
total = hashlib.sha256("".join(f"{k}:{v}\n" for k, v in sorted(files.items())).encode()).hexdigest()
rec = {"roots": list(ROOTS), "files": len(files), "sha256": total, "per_file": files}
if "--compare" in sys.argv:
    old = json.loads(Path(sys.argv[sys.argv.index("--compare") + 1]).read_text(encoding="utf-8"))
    changed = sorted(k for k in set(files) | set(old["per_file"]) if files.get(k) != old["per_file"].get(k))
    rec["changed_since"] = changed
    print(f"{len(changed)} file(s) changed since {sys.argv[sys.argv.index('--compare') + 1]}: {changed[:20]}")
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(rec, indent=1), encoding="utf-8")
print(f"{len(files)} files, sha256 {total}")

"""A Loom project is a folder. Every stage reads and writes plain files in it, so any agent,
any model, or a human can pick up where the last one stopped."""
from __future__ import annotations

import datetime as _dt
import re
from dataclasses import dataclass
from pathlib import Path

from .util import ENGINE_ROOT, LoomError, read_json, sha, write_json

DEFAULT_MODELS = {
    # tiers, not vendors: agent mode shows the tier; API mode sends the id.
    "plan": "claude-opus-5-5",     # brief, knowledge, pedagogy, script, storyboard
    "build": "claude-sonnet-5-5",  # persona, bespoke scene code, visual review
    "tweak": "claude-haiku-4-5-20251001",  # small, file-scoped edits later
}

DEFAULT_REQUEST = {
    "audience": "",
    "genre": "auto",          # the kind of video: auto reads it from the topic (loom/genre.py, D-191); a named kind wins
    "length_min": 4,
    "style": "flat-cosmos",
    "persona": None,
    "voice": {"provider": "kokoro", "voice": "af_heart", "speed": 1.0},
    "captions": True,
    "avatar": {"provider": "presenter", "member": "woman"},
    "mix": "auto",            # the style's native mix (loom/essence.py, D-192); "classic" or "cinema" by name, or shares
    "notes": "",
}


def projects_root() -> Path:
    return ENGINE_ROOT / "projects"


@dataclass
class Project:
    root: Path

    # ---------- construction ----------
    @classmethod
    def open(cls, ref: str) -> "Project":
        p = Path(ref)
        if not (p / "project.json").exists():
            p = projects_root() / ref
        if not (p / "project.json").exists():
            raise LoomError(f"no Loom project at '{ref}' (looked in {p})")
        return cls(p.resolve())

    @classmethod
    def create(cls, pid: str, topic: str | None, sources: list[str] | None, request: dict) -> "Project":
        if not re.fullmatch(r"[a-z0-9][a-z0-9\-]{1,60}", pid):
            raise LoomError("project id must be kebab-case: a-z, 0-9, '-' (2-61 chars)")
        root = projects_root() / pid
        if (root / "project.json").exists():
            raise LoomError(f"project '{pid}' already exists at {root}")
        for d in ("plan", "audio", "scenes", "build", "qa", "renders", "tasks", "sources", "media"):
            (root / d).mkdir(parents=True, exist_ok=True)
        req = dict(DEFAULT_REQUEST)
        req.update({k: v for k, v in request.items() if v is not None})
        cfg = {
            "id": pid,
            "created": _dt.datetime.now().isoformat(timespec="seconds"),
            # planned under the kind-of-video rules (D-191): a lesson without this stamp (made before them, or a clone of
            # one) keeps the rules it was made and approved under (loom/checks/gates.py _kind_legacy)
            "kind_rules": 1,
            "engine": "loom",
            "mode": "source" if sources else "topic",
            "topic": topic or "",
            "sources": sources or [],
            "request": req,
            "models": dict(DEFAULT_MODELS),
        }
        write_json(root / "project.json", cfg)
        write_json(root / "state.json", {"stages": {}})
        return cls(root)

    # ---------- config ----------
    @property
    def cfg(self) -> dict:
        return read_json(self.root / "project.json")

    def save_cfg(self, cfg: dict) -> None:
        write_json(self.root / "project.json", cfg)

    @property
    def id(self) -> str:
        return self.cfg["id"]

    @property
    def mode(self) -> str:
        return self.cfg["mode"]

    @property
    def request(self) -> dict:
        return self.cfg["request"]

    def path(self, rel: str) -> Path:
        return self.root / rel

    # ---------- state ----------
    @property
    def state(self) -> dict:
        return read_json(self.root / "state.json", {"stages": {}})

    def set_stage(self, name: str, **kv) -> None:
        st = self.state
        cur = st["stages"].get(name, {})
        cur.update(kv)
        cur["at"] = _dt.datetime.now().isoformat(timespec="seconds")
        st["stages"][name] = cur
        write_json(self.root / "state.json", st)

    def stage_info(self, name: str) -> dict:
        return self.state["stages"].get(name, {})

    def artifact_hash(self, rel: str) -> str | None:
        p = self.root / rel
        if not p.exists():
            return None
        if p.is_dir():
            parts = []
            for f in sorted(p.rglob("*")):
                if f.is_file():
                    parts.append(f.relative_to(p).as_posix())
                    parts.append(f.read_bytes())
            return sha(*parts)
        return sha(p.read_bytes())

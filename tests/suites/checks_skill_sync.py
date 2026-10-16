"""Skill sync (B7, 2026-10-08): the repo `skills/` are canonical and the Cowork account copies must follow them
(CLAUDE.md rule 10). On 2026-10-08, 15 of 16 account copies had drifted and nothing checked it (L-267).

  drift            a changed line in an account copy is reported; frontmatter quoting, blank lines, CRLF and the
                   account's location line are not
  packages         a .skill package is the repo folder plus the location line after the frontmatter; installed, it
                   reads as in sync (the round trip)
  context check    tools/context_check.py compares the copies when LOOM_ACCOUNT_SKILLS is set, and says it skipped
                   (with the reason) when it is not
"""
from __future__ import annotations

import importlib.util
import os
import shutil
import sys
import tempfile
import zipfile
from pathlib import Path

ENGINE = Path(__file__).resolve().parents[2]
if str(ENGINE) not in sys.path:
    sys.path.insert(0, str(ENGINE))


def _load(name: str, rel: str):
    spec = importlib.util.spec_from_file_location(name, ENGINE / rel)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


_SKILL = """---
name: demo-skill
description: Draw a demo lesson - use when asked for a demo. It has a colon: inside.
---

# Demo skill

Read `docs/styles/guides/<id>.md` before you draw a frame.
1. Ground everything.
2. Gates are the definition of done.
"""


def check_skill_sync_reports_a_changed_line_but_not_quoting_or_the_location_line():
    """tools/skill_sync.py on a fixture repo: the package of a skill, installed as the account copy, is in sync; quoted
    frontmatter, extra blank lines and CRLF are not drift; one changed line is (both sides named), and so are a
    reference file the account lacks and a skill not installed at all"""
    SS = _load("skill_sync_t", "tools/skill_sync.py")
    tmp = Path(tempfile.mkdtemp(prefix="lm_skills_"))
    try:
        root = tmp / "repo"
        sk = root / "skills" / "loom" / "demo-skill"
        (sk / "references").mkdir(parents=True)
        (sk / "SKILL.md").write_text(_SKILL, encoding="utf-8")
        (sk / "references" / "a.md").write_text("# A\n\nreference text\n", encoding="utf-8")
        made = SS.package(tmp / "out", root, engine_path=r"C:\Users\Admin\Desktop\Video-Engine")
        assert [m.name for m in made] == ["demo-skill.skill"], made
        z = zipfile.ZipFile(made[0])
        assert sorted(z.namelist()) == ["demo-skill/", "demo-skill/SKILL.md", "demo-skill/references/a.md"], z.namelist()
        packed = z.read("demo-skill/SKILL.md").decode("utf-8")
        head, after = packed.split("\n---\n", 1)
        assert after.lstrip("\n").startswith(SS.LOCATION_PREFIX) and "skills/loom/demo-skill/SKILL.md" in after.split("\n\n")[0], packed[:400]
        acct = tmp / "account"
        z.extractall(acct)
        z.close()
        assert SS.drift(acct, root) == {}, f"the installed package must read as in sync: {SS.drift(acct, root)}"
        # the account's own form: quoted frontmatter, more blank lines, CRLF line ends: not drift
        a_md = acct / "demo-skill" / "SKILL.md"
        quoted = packed.replace("name: demo-skill", 'name: "demo-skill"').replace(
            "description: Draw a demo lesson - use when asked for a demo. It has a colon: inside.",
            "description: 'Draw a demo lesson - use when asked for a demo. It has a colon: inside.'").replace("\n\n", "\n\n\n")
        assert quoted != packed
        a_md.write_bytes(quoted.replace("\n", "\r\n").encode("utf-8"))
        assert SS.drift(acct, root) == {}, f"quoting, blank lines and CRLF are not drift: {SS.drift(acct, root)}"
        # one changed line is drift, with both sides
        a_md.write_text(quoted.replace("2. Gates are the definition of done.", "2. Gates are optional."), encoding="utf-8")
        d = SS.drift(acct, root)
        ch = (d.get("demo-skill") or {}).get("changed") or {}
        assert list(ch) == ["SKILL.md"] and "-2. Gates are the definition of done." in ch["SKILL.md"] and "+2. Gates are optional." in ch["SKILL.md"], d
        # a missing reference file and a skill not installed
        (acct / "demo-skill" / "references" / "a.md").unlink()
        (root / "skills" / "lnd" / "other-skill").mkdir(parents=True)
        (root / "skills" / "lnd" / "other-skill" / "SKILL.md").write_text("---\nname: other-skill\n---\nbody\n", encoding="utf-8")
        d = SS.drift(acct, root)
        assert d["demo-skill"]["missing_files"] == ["references/a.md"] and d["other-skill"] == {"not_installed": True}, d
        text = "\n".join(SS.lines(d, 2))
        assert "2 of 2" in text and "references/a.md" in text and "not installed" in text, text
        return f"package round trip in sync; quoting, blank lines, CRLF quiet; changed line {ch['SKILL.md'][:2]}; missing file and uninstalled skill named"
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def check_context_check_compares_account_skills_or_says_it_skipped():
    """tools/context_check.py: without LOOM_ACCOUNT_SKILLS the skills check is a named skip (a note naming the env
    variable, no problem and no pass claimed); with it pointing at an empty folder every repo skill is reported not
    installed (a problem); a path that is not a folder is a problem"""
    CC = _load("context_check_t", "tools/context_check.py")
    saved = os.environ.pop("LOOM_ACCOUNT_SKILLS", None)
    tmp = Path(tempfile.mkdtemp(prefix="lm_acct_"))
    try:
        E, N = CC.skills_check()
        assert E == [] and len(N) == 1 and "skipped" in N[0] and "LOOM_ACCOUNT_SKILLS" in N[0], (E, N)
        n = len(list((ENGINE / "skills").glob("*/*/SKILL.md")))
        assert n > 0, "no repo skills: the check would compare nothing"
        E2, N2 = CC.skills_check(str(tmp))
        assert N2 == [] and sum("not installed" in e for e in E2) == n and f"{n} of {n}" in E2[0], (E2[:3], N2)
        E3, _ = CC.skills_check(str(tmp / "nope"))
        assert E3 and "not a folder" in E3[0], E3
        return f"unset: named skip; empty account: {n} of {n} not installed; a missing folder is a problem"
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
        if saved is not None:
            os.environ["LOOM_ACCOUNT_SKILLS"] = saved

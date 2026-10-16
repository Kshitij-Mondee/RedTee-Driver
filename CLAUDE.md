# Loom Video-Engine - instructions for agents

This folder is the Loom L&D video engine. When asked to make, continue or change a lesson, use the
`loom-director` skill (`skills/loom/loom-director/SKILL.md`). For bespoke scenes use
`loom-scene-author`; for new looks `loom-style-pack`; for library additions `loom-template-author`; for
small edits `loom-tweak`. The L&D craft skills are in `skills/lnd/` and each task file names the ones
its stage needs.

Rules that matter most:
1. **Ground everything.** Every claim and number traces to the approved knowledge sheet (topic mode) or
   a source anchor (source mode), or sits inside explicit hypothetical framing ("say", "imagine").
2. **Gates are the definition of done.** `py -m loom accept <id> <stage>` must pass; `check` must pass;
   look at the contact sheets before claiming anything renders well.
3. **Determinism.** Frames are a pure function of (manifest, time): no Math.random, Date, timers, rAF,
   network in scene code; seeded `Loom.rng` only.
4. **Never hand-edit generated files:** `runtime/catalog.json|md`, `runtime/redtee_catalog.md`,
   `projects/*/build/`, `audio/`, `qa/`, `projects/*/layout/` (the layout guard's plan, D-169), and the library's `forms.json`, `FORMS.md`, `scenes/`, `tasks/`,
   `sheets/` (`library/decisions.json` is written only by `py -m loom library accept`), `docs/assets/WORLD_PACKS.md` and `docs/assets/world_prompts/` (from `packs/worlds/*.json` and `packs/set_styles.json` by `py tools/world_packs.py`), `docs/assets/models3d/*.jpg` (turntable sheets, by `py -m loom models sheet`), `assets/sets/INDEX.md` and the set cards `assets/sets/*/*/*.json` (by `py -m loom sets add`), the style library `assets/kept/` (by the engine when a film is approved, or `py -m loom kept`), `datasets/`
   (written by `py -m loom ledger export`), and Shuttle's sub-agent files `.claude/agents/shuttle-*.md` and `shuttle/build/`
   (from `shuttle/agents/*.md` by `py -m loom shuttle agents`).
5. **No em or en dashes** in scripts, storyboards or scene text.
6. **The RedTee_V1_Video repo is read-only** from here: the bridge imports its blueprints, never writes.
7. **Windows-first:** use `py`, forward slashes in Git Bash.
8. **Learn from past runs:** read `docs/AGENT_LEARNINGS.md` before a run; after one, add what went wrong,
   why, and the gate or instruction that now prevents it (and log each run's deviations in its RUN_LOG.md).
9. **Context is managed, logs are append-only.** Start at `docs/context/README.md` (STATE, DECISIONS,
   RUNS). Never delete or rewrite a logged entry (CHANGELOG, AGENT_LEARNINGS, DECISIONS, RUNS, RUN_LOGs,
   library decisions/assessments/proofs, `projects/*/logs/` decision ledgers and versions): supersede it with a new one. Run `py tools/context_check.py`
   before claiming docs are current; it fails when a living doc disagrees with the code.
10. **Everything lives in this folder.** Video-Engine is the canonical copy. Write every finding, decision,
    plan and prompt here, not only in a chat, a sandbox or an account skill. Sync a sandbox copy after each
    finished piece (L-123). The repo `skills/` are canonical, and the Cowork account copies follow them.
11. **The requester's standing direction** (STATE.md, "Open work"):
    - research is a reference, never a checklist;
    - interesting and learner-friendly while respecting pedagogy;
    - keep both the classic and the new ways, and let the person choose;
    - corporate adults, not teacher-like;
    - think long term, including running outside Cowork;
    - downloads need his approval;
    - study reference videos, never republish them;
    - **styles are never compared with each other** (D-122): every style (flat 2D, 2.5D, painterly, hand-drawn,
      isometric, editorial and more) has its own purpose; a test compares versions WITHIN one style;
    - **characters are needed in every style** (people and any living character): they come from designed kits
      (Claude Design first) following `skills/lnd/lnd-character-design`, never improvised in scene code.
12. **Verify, never assume** (as in RedTee's Rule 0): a claim needs a run; a zero denominator is red; when the
    numbers and the frames disagree, the frames win; say what is unverified.
13. **Log every decision, never cut a step for cost** (D-97, final-goal rule 0): the engine logs stages itself;
    log your own fixes and routing or tooling choices with `py -m loom note`. A cheaper model, a lower effort or a
    decision model replaces a call only after shadow mode shows no loss.

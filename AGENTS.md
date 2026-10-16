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
   `projects/*/build/`, `audio/`, `qa/`, and the library's `forms.json`, `FORMS.md`, `scenes/`, `tasks/`,
   `sheets/` (`library/decisions.json` is written only by `py -m loom library accept`).
5. **No em or en dashes** in scripts, storyboards or scene text.
6. **The RedTee_V1_Video repo is read-only** from here: the bridge imports its blueprints, never writes.
7. **Windows-first:** use `py`, forward slashes in Git Bash.
8. **Learn from past runs:** read `docs/AGENT_LEARNINGS.md` before a run; after one, add what went wrong,
   why, and the gate or instruction that now prevents it (and log each run's deviations in its RUN_LOG.md).
9. **Context is managed, logs are append-only.** Start at `docs/context/README.md` (STATE, DECISIONS,
   RUNS). Never delete or rewrite a logged entry (CHANGELOG, AGENT_LEARNINGS, DECISIONS, RUNS, RUN_LOGs,
   library decisions/assessments/proofs): supersede it with a new one. Run `py tools/context_check.py`
   before claiming docs are current; it fails when a living doc disagrees with the code.

# Brief for the showcase planners (2026-10-06, overnight showcase, D-116)

Kshitij asked for 2 to 3 good 2 to 3 minute videos on corporate topics, in different styles, made in Cowork mode,
showing Loom's range in style, storyboarding and visualization. You plan ONE lesson from brief to script.

## How to run
- Shell (bash tool): `cd /sessions/practical-funny-cannon/mnt/Video-Engine` and use `python3 -m loom ...`
  (the docs say `py`, which is the Windows form). Each shell call is capped near 3 minutes.
- Windows paths for Read/Write/Edit: `C:\Users\Admin\Desktop\Video-Engine\...`. Task files print sandbox paths
  (`/sessions/practical-funny-cannon/mnt/Video-Engine/...`); map them to the Windows path for the Read tool.
- Follow `skills/loom/loom-director/SKILL.md` (read it first) and `CLAUDE.md`. Read `docs/AGENT_LEARNINGS.md`
  (search it for the stage you are on) before each stage.
- Loop: `python3 -m loom go <id>` prints the next task file. Read it fully, do exactly what it says (read the skills
  it names), write the artifact, then `python3 -m loom accept <id> <stage>`; fix every error and re-accept until it
  passes. Then `go` again.
- Stages you own: brief, knowledge, pedagogy, persona, script. STOP when `go` reaches the storyboard (it will print a
  design seed and a storyboard task): do not write the storyboard.
- Knowledge (topic mode): conservative facts only, each checkable; contested claims caveated; no invented numbers.
  Kshitij is asleep and asked for these videos tonight, so after the knowledge gate passes, approve it with:
  `python3 -m loom approve <id> knowledge --by "agent, unattended per Kshitij (overnight showcase, 2026-10-06)"`
- Persona: copy the pack persona the project names (`packs/personas/<name>.json`) into `plan/persona.json` unless
  the brief clearly needs another; then accept.
- Length: about 2.5 minutes of narration. Corporate adults, a capable colleague's voice, never teacherly.
- No em or en dashes anywhere. Never edit engine files, other projects, or generated files.

## Log your approach (it becomes a rubric)
Append to `projects/<id>/RUN_LOG.md` (create it; append-only) a short entry per stage: the 2 to 4 decisions that
mattered, why, what you rejected, and what the gate taught you. Be concrete (beat ids, fields). This is used to
write a craft rubric, so record judgement, not narration.

## Report back
Stage results (accepted, with how many gate rounds), the lesson's through-line in one sentence, the script's beat
count and estimated duration, anything you were unsure about.

# Brief for the showcase scene authors (2026-10-06, D-116)

You write the bespoke motion scenes for a GROUP of beats of one lesson. Other authors write other beats of the same
lesson at the same time, so you work in a private fork for previews and copy only your own files back.

## Setup (once)
```
cd /sessions/practical-funny-cannon/mnt/Video-Engine
export HYPERFRAMES_BROWSER_PATH=/sessions/practical-funny-cannon/chromebin/chrome
F=/sessions/practical-funny-cannon/mnt/outputs/forks/<lesson>-<your group letter>
rm -rf $F && mkdir -p $F && cp -r projects/<lesson>/{project.json,state.json,plan,audio,scenes,media,sources} $F/ 2>/dev/null; mkdir -p $F/{build,qa,renders,tasks,logs}
```
In the fork, create a STUB for every bespoke beat that is not yours and has no file yet, so compose works:
`Loom.scene("<beat>", { build(ctx) {} });` written to `$F/scenes/<beat>.js` (check the storyboard for the scene
file name: `scene` field, else the beat id).

## Write each of your beats
- Read the task file `projects/<lesson>/tasks/scenes/<beat>.md` in full, and every doc and skill it names
  (`skills/loom/loom-scene-author/SKILL.md` first, `docs/SCENE_API.md` including "Primitives from the TED-Ed study
  (D-114)", `docs/primitives/*.md` for the primitives your design uses, `skills/lnd/lnd-motion-choreography-loop`,
  `lnd-motion-fit`, `lnd-motion-craft`, two examples in `scenes_examples/`, the style pack). Read
  `projects/<lesson>/plan/storyboard.json` for the world, the stations, the devices and value script, and the
  neighbouring beats (what is held into your beat and what your beat must leave for the next).
- Write the scene into the FORK first: `$F/scenes/<file>.js`.
- Prove it in the fork:
  `python3 -m loom accept $F scenes` (fix every error naming your files),
  `python3 -m loom run $F compose`,
  `python3 -m loom strips $F --beats <your beats> --source build` (or `python3 -m loom snapshot $F --at t1,t2,t3`),
  then LOOK at the images (Read tool on the jpgs; Windows path of the fork is
  `C:\Users\Admin\AppData\Local\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Roaming\Claude\local-agent-mode-sessions\076b4394-fb26-4da7-b38f-4718690cecb3\f6167fbc-df11-4e25-851e-e1752bb12a7a\f035b1ff\outputs\forks\...`).
  Iterate until the frames are right: composition fills the frame with one clear idea, nothing clipped or
  overlapping, text legible (type floors), reveals land on their words, held elements and exits behave, the accent
  sits only on `accent_on`, and the motion reads as designed. Each shell call is capped near 3 minutes: run compose
  and strips as separate calls.
- When a beat is right, copy it into the real project: `cp $F/scenes/<file>.js projects/<lesson>/scenes/`.
  Never write any other file in `projects/<lesson>/`, and never run compose, check or render on the real project.
- Rules: deterministic (no Math.random, Date, timers); tokens only for colour; cue anchors are words spoken in the
  beat; no em or en dashes; tag `// @design` on line 1 and `// @form` on small built elements (see the skill).
  Hands and footage are not allowed (placeholder only). Use the D-114 primitives where the design asks for them.

## Log your approach (it becomes a rubric)
Append to `projects/<lesson>/RUN_LOG.md` one short entry per beat: what you chose, what the frames showed, what you
changed after looking. Concrete, not narration.

## Report back
Per beat: written and copied (yes/no), what you looked at and saw, what is still unverified or rough.

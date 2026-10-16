# Brief for the showcase storyboard planners (2026-10-06, D-116)

You write ONE lesson's storyboard (the plan tier, full thinking). The script, teaching plan, allocation and design
seed are done and accepted. Kshitij wants these lessons to SHOW Loom's range in style, storyboarding and
visualization, so the storyboard is the most important artifact of the night.

## How to run
- Shell: `cd /sessions/practical-funny-cannon/mnt/Video-Engine`; `python3 -m loom ...`; each call under 3 minutes.
  For anything that renders: `export HYPERFRAMES_BROWSER_PATH=/sessions/practical-funny-cannon/chromebin/chrome`.
- Windows paths for Read/Write/Edit: `C:\Users\Admin\Desktop\Video-Engine\...`.
- Your task file is `projects/<id>/tasks/storyboard.md`: read ALL of it and every skill and doc it names
  (`docs/REFERENCE_FIRST.md`, `skills/lnd/lnd-visual-storyteller`, `lnd-explainer-craft`, `docs/STORYBOARD_GUIDE.md`,
  `runtime/catalog.md`, `lnd-visual-design`, `lnd-motion-fit`, `lnd-motion-craft`). Also read
  `docs/SCENE_API.md` section "Primitives from the TED-Ed study (D-114)" and `docs/primitives/*.md`: these new
  primitives (path morph and fill join, stepped time and boil, swap-in-place slot, magnifier and cutaway, data as
  objects, material joins torn/page/scroll/motif/handoff/fill) exist now and the storyboard should use them where
  they are the right tool. Hands and footage are NOT usable in a shipped lesson (placeholder art, no footage).
- Search `docs/AGENT_LEARNINGS.md` for storyboard lessons (density, slide runs, held stations, joins, residue).
- Write `plan/storyboard.json`, then `python3 -m loom accept <id> storyboard`; fix every error and re-accept.
- Then run `python3 -m loom animatic <id>` and LOOK at the sheet it writes (Read the image). Fix the plan if the
  sequence reads as a slide deck, if worlds repeat, or if any beat has no subject. Re-accept.
- Use the D-112 fields: `devices` (3 to 5 plus one join material), `value_script`, `accent_on` per scene, scene
  `intent` where a frame is deliberately at rest or a punctuation beat; chapter boundaries are hard cuts or a card.
- Scenes: the storyboard decides template / blueprint / bespoke per beat within the allocation. Keep bespoke beats to
  what the lesson needs (they are written next by scene authors), and give each bespoke beat a complete `design`
  (treatment, why_motion, elements, beat_sheet tied to spoken words) so a scene author can build it without guessing.
- No em or en dashes. Do not touch other projects or engine files. Do not write scenes.

## Log your approach (it becomes a rubric)
Append to `projects/<id>/RUN_LOG.md`: the storyboard decisions that mattered (concept, world, devices, value script,
which beats are bespoke and why, joins, what the animatic showed and what you changed), and what you rejected.

## Report back
Accept result and rounds; the concept in one sentence; the device set; the join material; bespoke beat ids with one
line each; what the animatic showed; anything you were unsure about.

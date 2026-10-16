# RUN_LOG - dc-cooling ("Where the heat goes: how AI data centres keep servers cool")

2026-10-08 to 09, Cowork (Opus orchestrator). Request: Kshitij, "make me a 4 minute video on any AI/ML or datacenter
concept. Use the style you find the most suitable. Go ahead... give me the command I'll render".

## Choices
- Topic mode, genre explainer, persona analyst, style corporate-clean, mix cinema, no avatar.
- Knowledge sheet (21 facts) approved "agent, unattended per Kshitij (go ahead, 2026-10-08)".
- 32 beats, 481 words. 9 three beats as the `model_shot` preset (D-147): b01 gpu_server, b02 dc_hall, b12 and b16
  dc_aisle_pair, b13 and b15 server_rack, b20 accelerator_chip, b21 gpu_server (liquid), b22 cdu.
- b26 uses `Loom.physics.puePour` with illustrative shares and prints no number.

## Who wrote what
- Opus sub-agents: brief, knowledge, pedagogy, script, storyboard. Sonnet: persona, the lesson kit (scenes/_kit.js,
  logs/kit_api.md) and the 23 bespoke scenes (5 parallel agents, logs/scene_author_brief.md).
- Orchestrator (deviations from task-file-only authoring, all listed): model_shot preset and its gate; overlay.js
  clamp (L-342); b27 named region elements and the readout name (L-343); b32 title boxes 66 to 84 px, moved up
  (L-344).

## Deviations and incidents
- Narration timed out the sandbox call about 20 times; `go` is resumable and was re-run. The engine re-synthesised
  at speed 0.7 (215 to 139.7 wpm), 254.1 s.
- The first draft compose stalled with no frames; the 9 draft clips were rendered beat by beat with
  three_bridge.render_one instead.
- A scene agent's cleanup removed other agents' private builds under tmp/ (harmless; they rebuild).
- Kit gaps worked around in scenes (reported by their authors): b11 shifts the aisle labels with a translate, b18
  rewraps the panel fade, b14 clips the leak with a polygon, b29 hard-codes the new_block geometry.

## State at hand-over
- `py -m loom accept dc-cooling scenes`: accepted (2 warnings: b03 and b11 carry no @form tags).
- Strict compose with draft 3D clips; probe 0 errors, 0 warnings, 157 elements, 32 scenes.
- Looked at: b01, b27 (three moments), b28, b29, b32.
- Not done here: final 30 fps clips, the mix, check, render. `check` re-makes the drafts at final quality itself.

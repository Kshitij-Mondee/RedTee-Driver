# RUN_LOG: stress-signal (R-23, 2026-10-01)

A one-minute glow-flat showcase, asked for by Kshitij ("a 1 minute video in this style explaining anything").
The agent chose the topic, a wellbeing explainer about the stress response, because it uses the glow builders
(an alarm inside the body, a status panel, pressures closing in).

## Stages
- **brief:** accepted. The "pause before replying" must_cover was first marked `from_user` though Kshitij never
  said it; it was corrected to `from_knowledge` before accept.
- **knowledge:** 12 facts with no numbers, plus 6 claims the script must not use. Approved by Kshitij on his PC
  (`review.by: Kshitij`).
- **pedagogy:** scenario_led, three sections (understand, understand, apply), one recall_prompt.
- **persona:** adapted from the spacing-sticks mentor.
- **script:** 10 beats, about 128 words. Kokoro measured 76.7 s, over the one-minute target; kept, because
  every line carries an approved fact.
- **allocation:** the director changed `request.mix` to motion 0.8 / template 0.2. The default mix is
  50% templates and the glow-flat register lives in moving scenes. Logged in `project.json` notes.
- **storyboard:** 8 bespoke beats and 2 templates (definition, title.card); accepted. The cast warning
  "no rig 'tess'" was a gate bug: the check could not see `bean()` rigs. Fixed with a test (L-140).
- **scenes:** written from the storyboard and judged on browser-free previews (`tools/lesson_preview.py`, new).
  Fixes after looking:
  - b01: the Urgent pill was moved off her face.
  - b03 to b05: the labels and status panel no longer overlap.
  - b07: "A sharp message" was moved clear of the orbit.
  - b09: alarm and calm are now named at the ends of the gauge.
  - b10: the reply flies out of frame instead of over the steps.
- **compose:** 10 scenes, 76.7 s.

## Not verified yet
- `check` and `render` need a browser (Kshitij's PC).
- The camera, joins, templates and captions have only been seen in the animatic plan, not in frames.

## Check on Kshitij's PC
- **First run:** 0 errors, 6 warnings. The contact sheet showed b08's title card hidden by b09's scenery
  (L-142). Also fixed: the b08 subtitle anchor (reading floor) and the icon anchor.
- **Second run:** 0 errors, 4 warnings. All four are `rotation_pivot_drift` on b07's orbiting props, a false
  positive (they travel on purpose).
- **Sheets:** all ten beats looked at; b08 now shows "Not a fault".

## Render on Kshitij's PC
- **Output:** `renders/stress-signal.mp4`, 1920x1080, 30 fps, 76.7 s, with SRT, VTT, transcript and poster
  (b05).
- **Checks:** `qa/render_verify.json` checked 36 of 36 frames with 0 mismatches. Audio mean -19.4 dB, max -1.5 dB.
- **Looked at:** 14 frames sampled from the MP4 plus the poster. Every beat reads as planned.
- **Still open:**
  - It runs 77 s, not 60.
  - The b02 definition card reads as a slide in this register.
  - The character is the simple code rig (Maya v2 from Claude Design is pending).

# https-private on Relay (API) against the two Shuttle runs (2026-10-12)

The https-private request word for word (`--isolated`), through Relay on the Anthropic API with profile
`claude-core-opus-sb` (D-162: Opus 5.5 writes the storyboard outline and the storyboard, Sonnet 5.5 every other written
role, Haiku 4.5 the persona pick, Gemini 3.8 Flash the skeptic and the critic), against Shuttle's `https-private` and
`https-private-v2` (one lead on rails on the subscription). Prompt: `docs/prompts/2026-10-12-relay-https-private-api.md`.
As Kshitij asked, nothing from the other two lessons was read before this film was made; the request blocks were compared
afterwards: the same but the calibrated voice speed (0.739 against v2's 0.701).

Film: `projects/https-private-relay/renders/https-private-relay.mp4`, 142.8 s, 18 beats. The run ended exit 2 (4 check
errors left, one defect) and the film was rendered with `--force` by the operator, logged as an override (below).

## 1. Cost, time, calls, tokens, checks (`py tools/run_compare.py`)

Shuttle's USD is the engine's table on the subscription (notional, list price); Relay's is billed on the API at the same
table. Relay's phases are read from its roles (`tools/run_compare.py` RELAY_PHASE): a role's first task in its stage's
phase, rework before the first critic in P9, after it in P10; the code stages (P6 narration, P9 check, P11 render) have
no calls and their minutes come from stage and check times. Relay's P11 is the forced render after the run.

| phase | https-private: min / calls / in M (cached) / out k / USD (lead+sub) / looks / checks | https-private-v2: min / calls / in M (cached) / out k / USD (lead+sub) / looks / checks | https-private-relay: min / calls / in M (cached) / out k / USD (lead+sub) / looks / checks |
| --- | --- | --- | --- |
| P1 | 1 / 5 / 0.14 (77%) / 4 / 0.18 (0.18+0.00) / 0 / 0 | 0 / 4 / 0.11 (73%) / 1 / 0.14 (0.14+0.00) / 0 / 0 | 0 / 2 / 0.01 (44%) / 3 / 0.05 (0.00+0.05) / 0 / 0 |
| P2 | 4 / 7 / 0.19 (88%) / 8 / 0.18 (0.14+0.03) / 0 / 0 | 2 / 7 / 0.18 (88%) / 7 / 0.17 (0.13+0.04) / 0 / 0 | 0 / 2 / 0.01 (0%) / 2 / 0.04 (0.00+0.04) / 0 / 0 |
| P3 | 1 / 5 / 0.24 (94%) / 2 / 0.12 (0.12+0.00) / 0 / 0 | 0 / 3 / 0.12 (95%) / 1 / 0.05 (0.05+0.00) / 0 / 0 | 1 / 2 / 0.02 (45%) / 7 / 0.10 (0.00+0.10) / 0 / 0 |
| P4 | 2 / 4 / 0.25 (96%) / 4 / 0.13 (0.13+0.00) / 0 / 0 | 1 / 3 / 0.15 (94%) / 4 / 0.10 (0.10+0.00) / 0 / 0 | 1 / 3 / 0.04 (34%) / 14 / 0.21 (0.00+0.21) / 0 / 0 |
| P5 | 6 / 23 / 1.32 (92%) / 25 / 1.47 (1.47+0.00) / 0 / 0 | 3 / 10 / 0.49 (84%) / 11 / 0.84 (0.84+0.00) / 0 / 0 | 6 / 6 / 0.29 (65%) / 51 / 1.62 (0.00+1.62) / 0 / 0 |
| P6 | 7 / 5 / 0.35 (84%) / 23 / 0.93 (0.93+0.00) / 0 / 0 | 7 / 6 / 0.37 (87%) / 18 / 0.77 (0.77+0.00) / 0 / 0 | 11 / 0 / 0.00 (0%) / 0 / 0.00 (0.00+0.00) / 0 / 0 |
| P7 | 12 / 20 / 1.33 (87%) / 86 / 1.59 (0.36+1.23) / 0 / 0 | 43 / 31 / 2.44 (88%) / 163 / 2.92 (0.80+2.11) / 0 / 0 | 10 / 16 / 1.60 (86%) / 76 / 1.59 (0.00+1.59) / 8 / 0 |
| P8 | 231 / 420 / 22.86 (91%) / 715 / 16.51 (2.59+13.92) / 215 / 1 | 36 / 255 / 13.51 (90%) / 280 / 8.59 (0.74+7.86) / 79 / 2 | 16 / 95 / 5.35 (87%) / 61 / 3.30 (0.00+3.30) / 50 / 0 |
| P9 | 188 / 154 / 5.40 (89%) / 29 / 2.86 (1.29+1.58) / 0 / 12 | 22 / 41 / 2.10 (93%) / 34 / 1.27 (1.08+0.18) / 0 / 5 | 15 / 0 / 0.00 (0%) / 0 / 0.00 (0.00+0.00) / 0 / 3 |
| P10 | 50 / 33 / 1.73 (94%) / 13 / 0.84 (0.75+0.09) / 0 / 0 | 11 / 42 / 1.56 (90%) / 55 / 1.34 (0.79+0.55) / 0 / 0 | 13 / 102 / 4.94 (81%) / 78 / 3.71 (0.00+3.71) / 48 / 0 |
| P11 | 14 / 4 / 0.18 (83%) / 1 / 0.16 (0.16+0.00) / 0 / 0 | 3 / 3 / 0.11 (69%) / 1 / 0.16 (0.16+0.00) / 0 / 0 | 6 / 0 / 0.00 (0%) / 0 / 0.00 (0.00+0.00) / 0 / 0 |
| other (reviewers) | 15 calls, 0.19 | 10 calls, 0.16 | 0 calls, 0.00 |
| **total** | **273 min wall, 695 calls, 34.0 M in, 909 k out, $25.16, 215 looks, 13 checks** | **71 min wall, 415 calls, 21.1 M in, 575 k out, $16.50, 79 looks, 7 checks** | **71 min wall, 228 calls, 12.3 M in, 293 k out, $10.62, 106 looks, 3 checks** |

Engine time per phase (the three longest tools, minutes summed across parallel callers):

- https-private: P1 submit_brief 0.0; P2 skeptic_review 0.5, submit_knowledge 0.0; P3 submit_teaching_plan 0.0; P4 submit_script 0.0, patch_script 0.0, choose_persona 0.0; P5 submit_storyboard 0.0, submit_outline 0.0; P6 narrate 6.0, animatic 0.1; P7 kit_preview 0.4, submit_kit 0.0; P8 lab_snapshot 145.9, pilot_check 11.1, submit_scene 3.2; P9 check 132.9; P10 critic_review 2.2, submit_review 0.0; P11 render 13.5
- https-private-v2: P1 submit_brief 0.0; P2 skeptic_review 0.6, submit_knowledge 0.0; P3 submit_teaching_plan 0.0; P4 submit_script 0.0, choose_persona 0.0; P5 submit_storyboard 0.0, submit_outline 0.0; P6 narrate 6.2, animatic 0.1; P7 kit_preview 0.5, submit_kit 0.0; P8 lab_snapshot 24.9, submit_scene 0.7, pilot_check 0.7; P9 check 3.9; P10 critic_review 1.4, submit_review 0.0; P11 render 3.0
- https-private-relay: P1 submit_brief 0.0; P2 submit_skeptic_verdict 0.0, submit_knowledge 0.0; P3 submit_teaching_plan 0.0, get_skill_section 0.0; P4 submit_script 0.0, patch_script 0.0, submit_persona_pick 0.0; P5 submit_storyboard 0.0, submit_outline 0.0, get_catalog_entry 0.0; P7 kit_preview 0.8, submit_kit 0.0, get_example_scene 0.0; P8 lab_snapshot 11.7, submit_scene 0.2, read_artifact 0.0; P10 lab_snapshot 11.5, submit_scene 0.6, kit_preview 0.2

Checks (errors, and their kinds):

- https-private: 06:37 27 {'hf layout content_overlap': 21, 'text_too_small': 6}; 07:11 15 {'hf layout content_overlap': 14, 'text_too_small': 1}; 07:32 8 {'hf layout content_overlap': 6, 'runtime scene_threw': 1, 'text_too_small': 1}; 07:52 7 {'hf layout content_overlap': 5, 'text_too_small': 1, 'words_cut': 1}; 08:09 3 {'hf layout content_overlap': 3}; 08:26 3 {'hf layout content_overlap': 3}; 08:42 0 {}; 09:02 0 {}; 09:17 2 {'blank_beat': 1, 'foreign_pixels': 1}; 09:31 0 {}
- https-private-v2: 21:08 1 {'lc contrast contrast_aa_failure': 1}; 21:11 1 {'lc contrast contrast_aa_failure': 1}; 21:19 0 {}; 21:27 0 {}; 21:28 0 {}
- https-private-relay: 14:47 33 {'other': 24, 'lc layout line_into_object': 4, 'runtime held_missing': 2, 'lc layout content_overlap': 1, 'lc layout text_covered': 1}; 14:54 26 {'other': 21, 'lc layout line_into_object': 4, 'lc layout text_covered': 1}; 15:02 4 {'lc layout line_into_object': 4}


Relay by model: Sonnet 5.5 $8.56, Opus 5.5 $1.87, Gemini 3.8 Flash $0.18, Haiku 4.5 $0.01: **$10.62 billed** (the cap was
$25). 54 tasks, 14 repairs, 12.3 M input tokens of which 10.2 M cached (83 %), 293 k output.

| | https-private (Shuttle) | https-private-v2 (Shuttle) | https-private-relay (Relay, API) |
|---|---|---|---|
| Wall time | 273 min | 71 min | 65 min to exit 2, plus a 6 min forced render |
| USD | $25.16 notional | $16.50 notional | $10.62 billed |
| Calls | 695 | 415 | 228 |
| Looks (snapshots, kit previews) | 215 | 79 | 106 |
| Checks and errors | 10 checks: 27, 15, 8, 7, 3, 3, 0, 0, 2, 0 | 5 checks: 1, 1, 0, 0, 0 | 3 checks: 33, 26, 4 (exit 2) |
| Beats (bespoke / template) | 17 (15 / 2) | 17 (15 / 2) | 18 (17 / 1) |
| Kit parts | 9 | 9 | 6 |
| Near-empty frames (edge scan, under 1 %) | 1.9 s | 1.8 s | 2.2 s |
| Frames moving | not measured | 38 % | 45 % |
| Loudness (music mixed) | not measured | -16.1 LUFS | -16.2 LUFS |

Where the time and money went:
- Relay planned in about 11 minutes of wall time (13:58 to 14:09) for $2.02 (P1 to P5; Shuttle v2 $1.30 with an Opus lead) and drew cheaply (P8 $3.30 in 16
  minutes against v2's $8.59 and 36), but spent $3.71 on rework (P10), more than v2's $1.34, and still did not converge.
- The check errors that drove the rework: 24 of the first 33 were `lesson_vocabulary`, one cause: the kit's login form drew
  invented sample words ("alex", "oak7", "Signed in") and the router sent them to the seven beats that showed them, whose
  fixers cannot edit the kit. One scene worker reported it to the kit (fix_route kit) and the kit fixed it in round 2: one
  round of scene fixes was spent on errors only the kit could fix.
- The 4 errors left at the end are one defect: b12's board path line runs into b11's packet, still on screen from b11
  (83 to 87 s). It went to b12 twice; b12 cannot change b11's element. Both are cross-owner routing gaps, the same class
  as L-409 (held_missing).

## 2. What Relay did differently in the script and the storyboard

- **Script.** The same arc (a login seen on the path, identity, a shared key, scrambling, a check, the padlock). Relay's
  sections are named for the story (exposed, identity, shared key, scrambled data, the check, the habit) where Shuttle's
  frame is "three moves: prove who, agree a key, scramble", repeated as a progress bar on screen. Relay ends on a habit the
  viewer can do ("read the site name exactly; check that no certificate warning shows; look-alike names are a common trick")
  and its check is about behaviour (what should the browser do when the names differ?); Shuttle's check is about which
  site gets the password. Relay leaves out what Shuttle says about integrity ("any change in transit is detected") and that
  recorded traffic cannot yield the key; it adds that the watcher still sees which server. 14 of 18 beats change over time
  (Shuttle 11 of 17).
- **Storyboard.** All three plans chose the same picture: one board, the browser at left, the server at right, a watcher on
  the path. Shuttle locks the wide shot for the whole film and keeps a three-step bar at the bottom; Relay moves the camera
  (a close certificate card that ticks its three checks, a zoom on the key exchange, a close HTTPS form, the address bar
  full width for the habit) and labels its chapters at the top left. Relay drew 17 of 18 beats (one template, the quiz),
  with a 6-part kit (path board, packet, certificate card, key slots, padlock, address bar).

## 3. The film, within corporate-clean (D-122)

Looked at: the 18 contact sheets, a 24-frame grid of the render and four frames at full size.
- **Good:** one system from the first frame to the last; the certificate check is the clearest single beat (three labelled
  ticks); the scrambled blocks passing the watcher read at a glance; the habit beats put the address bar full width with a
  look-alike name struck out; the payoff returns to the opening board with the padlock closed. Crisp shapes and readable
  labels in the close shots; more motion than v2 (45 % of frames moving against 38 %).
- **Defects:** b07 pushes in so far that the browser and server cards are cut at the frame edges with half-words ("ple",
  "accou"); b12's "Noise" tag sits over the scrambled blocks and the key; b10 leaves an empty dashed box cut by the bottom
  edge; b08's key exchange is small parts in a large empty field for about 1.4 s; the b12 line into b11's packet (83 to 87
  s) that ended the run; the wide shots' small labels.
- Shuttle v2 by comparison: a calmer, locked diagram with a structure device (the three-step bar) that makes the lesson's
  shape visible, an honest check, fewer layout defects; smaller type and less motion.

## 4. What I would fix

1. Route a kit part's words to the kit (lesson_vocabulary on text a kit part drew), not to every beat that shows it.
2. Route a defect between two beats' elements (line_into_object, overlap) to the beat that owns the lingering element, or
   to the storyboard's exit plan, not only to the later beat.
3. A framing check: text cut by the frame edge in a pushed-in shot.
4. Keep Relay's habit section and close shots; borrow Shuttle's on-screen structure device.

## Not verified

- One run each; the audio was measured, not listened to.
- Shuttle's runs were on the subscription and Relay's on the API: the USD is the same price table, but Shuttle's was never
  billed.
- The film was rendered past a failing check (one defect, 4 s); the rating is the operator's eye on frames, not a viewer
  study.

# Claims ledger for the stack review (2026-10-07)

Every claim in `docs/strategy/2026-10-07-stack-review.md`, with how it was checked, in this session, and what came
out. **Run** = executed here today. **Sourced** = read from a public page today (not executed). **Judgement** = an
opinion, labelled as one. **Untested** = waiting for the E2 rating.

| # | Claim | How checked | Status |
|---|---|---|---|
| 1 | Code-drawn people and places rate about 1.9 of 5, against 3.8 for studio frames | `py -m loom golden report` (E1, 66 of 66 rated); split recomputed from `report_kshitij.json` with the labels now saved in `docs/research/golden/labels_figurative.json` | **Run, confirmed:** figurative 1.86 (14 frames), non-figurative 2.91 (22), studio 3.78 (20); Mann-Whitney p = 1.6e-6. The 2026-10-03 note said 1.93: its label list was never saved, so the exact 14 differ by one frame (a Rule 0 gap, L-245). One rater. |
| 2 | HyperFrames renders deterministically | the same 5 times of `spacing-sticks` snapshotted twice in two separate processes, PNG hashes compared | **Run, confirmed:** all 5 identical (20.5 s and 17.0 s) |
| 3 | HyperFrames is Apache-2.0 | `node_modules/hyperframes/package.json` | **Run, confirmed:** 0.8.91, Apache-2.0. "Maintained by HeyGen, 33k stars": **sourced** |
| 4 | Remotion costs at least $100 a month for 4 or more people | remotion.dev pricing page | **Sourced** |
| 5 | Remotion renders by the same technique (screenshots of headless Chrome) | general knowledge of Remotion's renderer | **Not re-checked today** |
| 6 | Models write web code (HTML, SVG, CSS, GSAP) better than any other animation language | none | **Judgement, untested.** Stated too strongly in the review; it is a reason to prefer the stack, not a measured fact |
| 7 | The reuse library has promoted nothing | `py -m loom library status` | **Run, confirmed:** 0 promoted (14 candidates, 2 rejected, 2 deferred, 459 still counting); 213 bespoke scenes written across all projects |
| 8 | 4 runtime crash errors across 24 Sonnet scenes | `qa/probe.json` of bench 151439 | **Run, confirmed:** claude-balanced b01, b03, b17, b46 (all bespoke); mixed-value 1 of 3; openai-balanced 1 of 1; budget 0 of 10 |
| 9 | Skia and Three.js clips appear in one demo only | every `plan/storyboard.json` | **Run, confirmed:** skia and three only in `_fxdemo`; Manim in `_fxdemo`, `_ss_story`, `spacing-sticks` |
| 10 | The ElevenLabs adapter exists, with timings | `loom/narrate/providers.py` | **Run (read), confirmed:** uses the with-timestamps endpoint; not called (no network from the sandbox; the key is in `.env`) |
| 11 | Planning on Sol costs about $0.17 | `llm_calls.jsonl` of bench 20261007-003835 smart-mix | **Run, confirmed:** brief, knowledge, skeptic, pedagogy, persona = $0.165 |
| 12 | Style-referenced vector generation costs about $0.05 an image | Replicate and OpenRouter pages for Recraft V4 Styles | **Sourced** |
| 13 | Generative video costs about $0.10 to $0.40 a second | comparison pages (Veo 3.1, Kling 3) | **Sourced** |
| 14 | A designed kit lifts people-and-places frames to 3.3 or more | the E2 bake-off (below) | **Refuted for a kit drawn as SVG by Claude:** 1.0 (A 1.67, editorial D 3.0). Other kit sources and image models untested. `docs/research/golden/2026-10-07-e2-findings.md` |

## E2 bake-off, built in Cowork on 2026-10-07
One 20 s corporate beat ("Priya slides the quarterly report across the desk ... Dev leans in, and sees it"), with
ONE shared layout, camera and motion (`tools/e2_bakeoff/make_scenes.py` generates all four scene files from one
choreography; a single clock drives every move). Only the art source differs:
- **A:** today's engine drawing (`Loom.place.office`, rigged characters, `Loom.obj`), as a scene gets it now.
- **B:** a kit drawn by Claude in Cowork (`assets/vendor/e2kit/`): palette and light decided first, then drawn,
  rendered, looked at and revised twice (the plant behind Dev's head moved, the print moved, the report redrawn
  lying flat).
- **C:** AI-generated raster layers: `tools/e2_bakeoff/generate.py` on Kshitij's PC (OpenAI image API; the sandbox
  cannot reach it). The placement path was tested with stand-in layers, which were then deleted.
- **D:** the editorial register, no people.

Rating: `tools/e2_bakeoff/prepare_rating.py` renders three frames per variant and writes a blind set with six E1
anchors; `py -m loom golden build|serve|report --set e2`. The A, B and D frames are already built. My own view is that
B reads clearly more mature than A, but my eye is not the gate (the vision judge reached rho 0.34 against Kshitij,
D-106 to D-109); his blind rating is.

# Review: Maya model sheet v1 from Claude Design (2026-10-01)

STATUS: REVIEWED 2026-10-01 (PDF, then the .zip files: see the section added at the end). Verdict: **not approved yet. Keep the face, hands and colour work; redo the
body acting, the joints and the expressions, and deliver the missing views as files.**

**Input:** `Maya Model Sheet.pdf` (one tall page, vector, Chromium print).

**How it was judged:**
- rendered at 150 and 300 dpi and looked at in full, with close-ups of the face, shoulder and elbow joints,
  poses, expressions and hands (renders in `cache/review/maya/`, gitignored);
- the PDF text was extracted to compare captions with drawings;
- the 12 expression heads were compared by a pixel-distance measure (below);
- the brief was Prompts 0, A0 and A1 in `docs/ASSET_WISHLIST.md`.

**What a PDF cannot show:** whether the parts are separate SVGs, whether ids, pivots and slots follow the
contract, and file sizes. That needs the .zip export and `py tools/asset_intake.py` (Prompt R).

## What is good (keep it)
- **Face construction meets the bible.** Upper lid line, lower lid hint, iris, pupil and catch-light; a nose
  bridge with nostrils; two-shape lips; ears with an inner fold; blush; a heart-shaped jaw. Nothing is a dot.
  The front head reads as a specific person, not clip-art.
- **Line weight varies:** a heavier outer contour and lighter inner lines.
- **Hands:** all 20, right and left, five fingers with knuckle hints, never mittens. The props (phone, cup,
  paper, pen) are drawn in the hand.
- **Details asked for are there:** lanyard and badge, sweater ribbing at hem and cuffs, collar, gold hoops,
  tote with stitching, trainer laces.
- **Colour discipline:** the callout uses exactly the contract's character slot families (all 25 hexes
  checked against Prompt 0). Preview colours are labelled as preview only.
- **Proportions:** about 6 heads tall to the scalp; arms reach mid-thigh; shoulders wider than the head.

## What fails the brief (and the quality bar in Prompt A1)

| # | issue | evidence | brief |
|---|---|---|---|
| 1 | **The pose is stiff and symmetrical.** The "standing idle (weight on right leg)" drawing is symmetrical: level hips, level shoulders, both legs straight. The caption claims a contrapposto the drawing does not have. | front and rig-neutral panels are near mirror images apart from the tote | A1 reject-if: "the pose is stiff and symmetrical"; A0: "every standing pose has a slight contrapposto" |
| 2 | **Poses move one arm only.** In waving, pointing and presenting, the head, torso, hips and legs are identical to the neutral. Only the eyes turn toward the target; the head does not. | the three pose panels | A1 d) poses must be acted, full body |
| 3 | **3 of 18 poses delivered.** Missing: idle variant, walk (4 keys), sit typing, sit thinking, phone reading, phone call, shrug, arms crossed, hand on chin, cheer, worried, two-hand talk, handing over a document, leaning, listening and nodding. | section D | A1 d) |
| 4 | **1 of 5 turnaround views.** Only the front: no 3/4 front, side, 3/4 back or back. The 3/4 view is the one animation uses most. | section A | A1 a) |
| 5 | **The shoulder shows a cut-out seam.** The upper arm is a tube laid over the torso. When it rotates (wave, present), its rounded cap sits on top of the torso outline like a paper-doll pin. The elbow join is cleaner but also visibly segmented. | close-ups `wave_arm.png`, `point_present.png`, `point_elbow.png` | A1 b) "overlapping joints drawn so rotation ... never shows a gap" (and should not show a seam) |
| 6 | **Several expressions are too close to tell apart at video size.** At a 120 px face (a medium shot), the closest pairs differ by 3 to 5 on a 0-255 pixel scale (`expression_distance.json`): relief and pride 3.1, listening and concern 3.8, focus and frustration 3.9, focus and pride 4.6. For comparison, laugh vs neutral is 20.7. Doubt vs neutral is only 6.7. Brows and lids barely move; the mouth does most of the work. | expression heads, measured | A0: "brows, lids and mouth working together" |
| 7 | **The caption and drawings disagree.** The caption lists 11 expressions ("concern / doubt" merged); 12 heads are drawn. By their faces they follow the bible order with concern and doubt separate, but nothing says so. | section C text vs drawings | A1 c) each expression as a named group |
| 8 | **The hair puff reads as one dark mass.** It has a bumpy outline and a few curl marks, but no clear 5 to 12 clumps with direction, no highlight band, and the "few loose curls" barely break the silhouette. | `face_front.png` | A0 hair rules; A1 reject-if "the hair is one flat shape" (borderline) |
| 9 | **A new class, `lm-taper`, is not in the contract.** Code that hides or recolours `lm-outline` will miss tapered lines. | colour panel text | Prompt 0 classes |
| 10 | **Delivered as PDF, not files.** A PDF cannot be rigged or recoloured. | the upload | Prompt R |

**About the measure in row 6:** it is a pixel distance between aligned face crops (grey, 120 px and 40 px). It
says two drawings look alike; it cannot say whether an expression is right. The eye check agrees with it: relief
and pride, and listening and concern, read as the same face in a medium shot.

## Paste this back to Claude Design (after Prompt 0, A0 and Prompt R)
```
Maya v1 review. Keep: the face construction, line weights, the 20 hands, the colour slots, all the costume
details. Fix the following, then re-export as described in DELIVERY (Download as .zip, not PDF).

1. IDLE WITH WEIGHT. Redraw the front idle with real contrapposto: weight on her right leg (straight), left
   knee relaxed and slightly forward, hips tilted down to the left, shoulders tilted the opposite way, head
   tilted 3 to 5 degrees, one hand slightly forward. It must not be a mirror image of itself.
2. TURNAROUND. Add 3/4 front, side, 3/4 back and back, same height lines, 1000 x 2000 per view, and split the
   3/4 front into the same rig parts as the front.
3. SHOULDERS AND ELBOWS. Rebuild the joints so no seam shows at any angle: the sweater's shoulder/deltoid
   shape belongs to the torso and covers the upper-arm root; the elbow has an overlapping sleeve fold. Prove it
   with an overlay sheet: the right arm at 0, 45, 90, 135 and 170 degrees, and the forearm at 0, 60, 120 and 150.
4. ACTED POSES. Every pose changes the whole body, not one arm: head turn or tilt toward what she attends to,
   torso lean or twist, a hip shift, both arms placed, and the legs supporting the weight. Redo waving, pointing
   and presenting this way, and add the missing 15 from the brief (walk as 4 keys).
5. EXPRESSIONS. Twelve, labelled separately in the bible order. Push brows (height and angle), upper lids
   (lift or drop), lower lids (squint or flat), cheeks (raise on smile, laugh and pride) and mouth corners
   together. These pairs must be unmistakable apart at a 120 px face: relief vs pride, listening vs concern,
   focus vs frustration, doubt vs neutral. Show all twelve also at 120 px wide to prove it.
6. HAIR. Build the puff from 8 to 12 curl clumps with direction, a shade layer under the clumps, a highlight
   band on the top-left clumps, and 2 or 3 loose curls that break the silhouette.
7. CLASSES. Mark tapered lines class="lm-outline lm-taper" (both classes), so code that toggles outlines
   catches them.
Report what you changed against each number.
```

## Added the same day: the files (maya-v1.zip, through `tools/asset_intake.py`)

Kshitij exported the project as a .zip and ran the intake. It contains:
- 33 manifest-listed SVGs: 31 character parts and 2 props;
- 11 composite sheets under `assets/maya/` (face kit, expressions, hands, poses);
- 11 preview-coloured copies under `preview/`;
- screenshots, `index.html`, and Claude Design's own builder scripts (`engine/maya_story.js`).

**Prompt R works.** The .zip keeps every asset as its own file, with a manifest giving part, parent, pivot and
anchors in one shared 1000 x 2000 frame. This was "not verified" before; it is verified now.

**First run: "24 failing", mostly a tool problem.**
- 11 of the 24 were the preview copies. They are meant to be off-contract colours.
- 11 were composite sheets. The manifest does not list them, so the tool guessed the "set" palette for them.

The intake was fixed to skip `preview/`, `screenshots/` and `review/`, and to list unlisted files rather than
check them as importable assets. It now also lets an accessory with a parent part (the tote on the torso) use
the character palette. A test covers all three. Re-run: **32 of 33 pass**:

| finding | from the files |
|---|---|
| `props/chair` fails | It uses Maya's character colours (cloth2, metal). A chair is a prop and must use the base slots, so each style pack recolours it. |
| No draw order in the manifest | Parts have parents but no `z`. Assembled by parent order (`cache/review/maya/assembled_neutral.png`), the thighs land over the sweater hem and the legs look as if they pop out of the upper body (Kshitij spotted this). Drawn behind the pelvis and torso, the same parts read correctly (`cache/review/maya/hip_order.png`, A against B). So it is the missing order, not the drawing. The rig importer needs an explicit order. |
| Hands, mouths and expressions are not swappable parts | The 20 hands, 9 visemes and 12 expressions exist only inside composite sheets. As parts there are only `hand_*_relaxed`, `hand_l_point`, one `mouth`, two `eye`s and two `brow`s. The rig needs each variant as its own listed part with the same pivot. |
| The shoulder seam is real | Re-assembled from the files, the right arm was rotated to 0, 45, 90, 135 and 170 degrees about its pivot, and the elbow bent to 60, 120 and 150 degrees (`cache/review/maya/joint_test.png`). From 45 degrees on, the round arm cap sits on top of the torso outline and the shoulder contour stays drawn, so the joint reads as a pin. The elbow is acceptable for a cut-out rig, with a small notch at rest. Row 5 above stands, now proved from the parts. |
| Tapered lines are correct | The files use `class="lm-outline lm-taper"` (both classes). Row 9 above came from the PDF's caption; the files are right, so row 9 is withdrawn. |
| Metadata | Each part carries about 8 KB of C2PA content-credential metadata. It is harmless; the importer will strip it. |

**Add to the paste-back prompt above:**
```
8. MANIFEST. Give every part a "z" (draw order, back to front) in manifest.json.
9. SWAPPABLE PARTS. Deliver each hand (20 x 2), each mouth (9 visemes + 12 expression mouths), each eye state
   (5) and each brow state (5) as its own SVG listed in the manifest, same part name with a variant suffix
   (hand_r_point, mouth_O, eye_l_wide ...), drawn in the shared frame with the same pivot as its base part.
10. CHAIR. Redraw props/chair.svg in the base slots only (surface, surface2, muted, line, ink, field2), not
    Maya's colours: it is a prop every style recolours.
```

## Next step on our side
When the .zip arrives: `py tools/asset_intake.py <zip> --batch maya-v2`, then read `INTAKE.md`. Re-run
this review against the new sheet, including the expression measure.

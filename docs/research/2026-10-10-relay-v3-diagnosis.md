# feedback-relay-v3: full test, reflection and diagnosis (2026-10-10)

Asked (Kshitij): "run proper test on this new lesson, it's not bad but nothing great either. I want you to reflect on
this lesson and also see why there are a few blank cut offs in the middle of the video sometimes. I want all issues to
be identified and first of all check if our changes introduced anything. If not then do a deep diagnosis."

What was run on the rendered film (`projects/feedback-relay-v3/renders/feedback-relay-v3.mp4`, 140.6 s), the same
measures on `feedback-relay-v2`, `feedback-shuttle-v2` and the Cowork `groupthink-trap` for scale:
- the check's report (0 errors, 19 warnings) and render verification (40 of 40);
- a blank scan (10 fps; share of pixels away from the frame's median) and an edge scan (share of pixels with a strong
  gradient: text and outlines, not the vignette), both with the caption band cropped, mapped to beats and joins;
- a motion scan (share of frames that change from the one before; the longest still run per beat);
- audio: loudness (EBU R128) and what the soundtrack is made of;
- every beat's contact sheet and the overview at full size.
Scripts: `docs/research/relay_v3_diagnosis/` (blank_scan.py, edge_scan.py, motion_scan.py).

## 1. Did our changes introduce anything?

| Change (D-155, R-49) | What the film shows | Verdict |
|---|---|---|
| Film card, whole brief, look to the script, craft notes | 9 of 12 beats drawn, one world, one cast; nothing traced to them | no regression |
| Snapshot on the lesson clock, edits, runtime hold, kit route, kit preview, pilot pair | 0 snapshots outside their beat; kit previewed 5 times; workers reported real defects | no regression |
| Gate one_world | b02/b06-style template rooms gone | no regression |
| Seam substitute is a fade (R-49) | 118.1 to 118.6 s is bare paper where it was 0.4 s of black | **not a regression and not a fix**: the same gap in another colour (cause B2 below) |
| Last scene leaves with the frame (R-49) | the frame fades as one; 0.1 s of field at 140.5 s is the outro itself | intended |
| Continue chains in order (R-49) | not exercised by this render (only single-beat fixes ran) | untested on a film |

The missing music (A1) and the 95-minute check hang (A2) are older than the upgrade: the code paths that cause them
are unchanged by it (lab_snapshot has composed with `mix=False` since L-238; `util.run` has always used
`subprocess.run(timeout=...)`). v2 got its mix by the order its last fixes happened to run in.

## 2. Breaks (engine bugs)

**A1. The film has no music or sound effects.** `audio/` has no `mix.wav`; the check warns "no audio/mix.wav yet:
using the bare narration"; loudness -18.4 LUFS against v2's -16.2 with its bed. Cause: `flow.run_code` marks any stage
done at its end, so a scene worker's snapshot compose (lenient, `mix=False`) marks the compose stage done with fresh
inputs, and the conductor then skips its own compose (and with it the mix). In this run compose was marked done at
20:09:58, inside b11's fix session; the run log goes narrate, check, render with no compose. It happens whenever the
last change before the check is a scene fix. Shuttle is not hit: its check tool always composes with the mix (checked by the session running Shuttle: https-private and https-private-v2 both carry mix.wav and a stereo track); the skip is on Relay's conductor path. Fix: only a full compose (strict, with
the mix) marks the stage done; a snapshot compose leaves it stale.

**A2. The check hung for about 95 minutes (run 1).** The scenes ended at 15:51, the probe's 600 s timeout surfaced at
17:26. `util.run` calls `subprocess.run(..., timeout=600, capture_output=True)`: on a timeout Python kills `node` and
then waits for its output pipes, which the browser `node` started still holds, so it waits until that browser dies (the
probe script was being edited by another session at the time; run alone it takes 48 s). Fix: start the child in its
own process group, kill the whole tree on a timeout (`taskkill /T /F` on Windows), never block on a pipe a grandchild
holds.

## 3. The blank moments, by cause

Edge scan, stretches with under 1 % edges: v3 5 stretches, 2.1 s; v2 12 stretches, 6.5 s.

| When (v3) | What | Cause |
|---|---|---|
| 68.5 to 69.5 s (1.0 s) | bare paper after the cut into the check (b07) | **B3** |
| 103.7 s (0.1 s) | the presenter beat's first frame | B3 (avatar entrance) |
| 118.1 to 118.6 s (0.5 s) | bare paper between the presenter and the coffee corner | **B1 + B2** |
| 124.8 to 125.2 s (0.4 s) | black, the storyboard's dip into the last beat | **B1** |
| 35.9 to 42.2 s (6.3 s) | an empty ruled whiteboard while the narration talks (not blank by pixels, empty by meaning) | **B4** |
| 140.5 s (0.1 s) | the outro fade | intended |

- **B1. Screen joins are covers with a flat top.** Every screen join (dip, fade, wipe, iris, the material joins) hides
  the frame completely so the camera's jump at the middle is never seen (`runtime/world.js` `coverAt`: covered from
  0.42 to 0.58 of the join, on steep ramps). On a 0.8 to 1.0 s join that is 0.3 to 0.5 s of solid paper or black: a
  viewer reads it as the film stopping (R-41 found the same in both pipelines). Fix: cover fully only at the frames
  around the jump (the ramps already reach 99 % a frame either side), so a dip still reads as a dip but never holds.
- **B2. Compose adds a cover where the storyboard asked for none.** A camera pan between two different worlds would
  show the seam, so compose substitutes a screen join (a dip until R-49, a fade since). Both pass through an empty frame.
  Fix: substitute a cut (no empty frame) unless the storyboard asked for a cover.
- **B3. A template's first element arrives late after an instant join.** Templates put their first element on screen
  by the lead time, the speech start plus 0.6 s (`runtime/templates/_helpers.js` `H.leadAt`, D-100). After a cut the
  new beat starts 0.3 s before its speech, so the frame is bare for about 0.9 s (b07; v2 b14 the same). Fix: when the
  beat's join is instant (cut, continue), the first element (or the template's scaffold: kicker, card, question frame)
  is on screen at the beat's start; its words still land when spoken.
- **B4. A structure that waits empty.** b04 zooms into the whiteboard and holds ruled lines and a camera icon for 6 s
  until "one-word answers on vendors" is spoken; b05 and b06 then fill one line each (33 s of board in all). Cause: the
  storyboard planned the demonstration as writing on a board instead of showing the behaviour happening; the scene
  wrote the slot to fill on its word, which is right for a slot and wrong for 6 s. Fix: storyboard and scene guidance:
  a slot waits empty for at most about 1.5 s; show the moment the line describes (Dev answering in one word in the
  meeting) before or while it is written.

## 4. Why it is "not bad but nothing great"

1. **It hardly moves.** 33 % of frames change from the one before (v2 35 %, Shuttle v2 68 %, Cowork groupthink-trap
   81 %). Elements arrive and freeze: no ambient life (the clock does not tick, no light drifts, no steam), the people
   are busts whose only motion is the mouth, no gestures, no camera move inside a beat. The scene code is thin (about
   3 KB a beat against about 10 KB in the Cowork lesson) and the kit's sets are static. The check's variety measure
   agrees: still_share 0.8, the worst of any lesson measured (baseline worst 0.636).
2. **It tells more than it shows.** The lesson's core (behaviour, effect, next step) is three lines written on a board
   (b04 to b06), not three moments acted out; the meeting where Dev gave one-word answers is never shown. labels over
   objects 0.7 (worst on record): signs and tags explain the picture ("calm", "soon after", "private", "an impression",
   "good terms") instead of the picture doing it; four beats are over the 5 to 6 chunk budget (b03 8, b06 11, b09 10,
   b12 9).
3. **It is pale.** Saturation 0.14 against the style's reference 0.39; the board beats measure brightness 0.82 where
   the value script planned mid (0.30 to 0.70). The same in v2 and Shuttle v2, so it is the pipeline's habit with this
   style (paper ground, accent rationed), not this lesson's alone.
4. **No soundtrack** (A1): narration only, so nothing carries the emotional turns (the hook, the label, the payoff).
5. **Smaller things:** the presenter (b10) looks like the manager (same member and colouring), so the narrator and the
   character blur; the nameplate "Dev" and the board's part labels are about 20 px; b06 redraws the board's text from
   b05 instead of holding it (text_redrawn: the beats were written in parallel; the ordered chains fix it from the next
   run).

What is good and should be protected: one world and one cast from start to end; the cloud that dissolves at the
callback; the three-line sheet that comes back on the coffee table and in the last beat; the check that shows both
options in full with a reason; the payoff on the same frame as the hook.

## 5. Fix plan, ranked

| # | Fix | Where | Effect |
|---|---|---|---|
| 1 | Only a full compose marks the compose stage done (A1) | `loom/flow.py` | music and sound back in every Relay film |
| 2 | Kill the whole process tree on a timeout (A2) | `loom/util.py` | a hung probe costs 10 minutes, not 95 |
| 3 | Seam substitute is a cut (B2); covers hold only at the jump (B1) | `loom/compose.py`, `runtime/world.js` | blank joins from 0.4 to 0.5 s to about one frame |
| 4 | Template scaffold on screen at the beat start after an instant join (B3) | `runtime/templates/_helpers.js` and the templates | no empty paper after a cut |
| 5 | Ambient and idle motion by default: set loops in the kit, blink and breath for people (C1) | runtime, kit role card, a motion-share check | the film stops freezing between reveals |
| 6 | Show, then write: storyboard guidance and a gate on empty slots held over about 1.5 s (B4, C2) | storyboard cards, a check | the demonstration acted out, no empty board |
| 7 | Presenter look differs from the cast; labels at least 24 px (C5) | cast gate, text check | minor |

1 and 2 are bugs with a known cause; 3 and 4 are small runtime changes with a measurable effect (the edge scan); 5 and
6 change how the film is made and need a run to judge.

## Not verified

- The audio was measured, not listened to.
- One lesson is one sample: the variety numbers vary with the plan.
- That A2's browser was hung by the probe edit in flight: inferred from the timing and the 48 s rerun.

## 6. Fixes 1 to 4 done (R-53, D-160)

Kshitij: "go ahead"; transitions only where they make sense and look good; each style its own kind (cinematic smooth,
corporate plain). Done: A1 (compose bookkeeping), A2 (process-tree timeout), B1 (covers full only at the middle), B2 (the
style's seam join: fade, wipe or cut), B3 (template first element at once after a cut or cover). On the re-render:
- **Run 4 result (2026-10-11):** exit 0 in 1889 s. The conductor ran its own compose (the mix) before the check; the
  critic's first pass found 3 (b09, b11, and the b11 join as an empty mid-join frame), fixed by b09, b11 and the kit
  (the storyboard set b11's join to a cut); final review "the last fixes look right"; render 140.2 s.
- **Measured:** soundtrack back (audio/mix.wav, music warm_curious, a stereo track, -16.2 LUFS against -18.4 bare);
  fully blank 0.1 s (was 0.7 s: one black frame at the dip's middle); under 1 % edges 0.5 s (was 2.1 s): b07 0.2 s after
  the cut (was 1.0 s; the kicker's own entrance), b10 0.1 s, the dip's middle frame, the outro's last frame. Seen at full
  size: the dip darkens and lifts with no hold; 1:58 is a clean cut. Motion unchanged (33 % of frames moving).
- **Cost:** run 4 $1.52 notional, of it Gemini $0.24 billed; the lesson in all $11.50 notional, Gemini $0.52 billed.
Left: B4 and section 4 (motion, show-don't-tell, colour), fixes 5 to 7 of the plan; the critic reads a join's middle
frame as blank (L-415).

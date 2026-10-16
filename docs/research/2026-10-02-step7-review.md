# Step 7 review: two corporate lessons, made and judged (2026-10-02)

STATUS: REVIEWED 2026-10-02, from Chrome frames in the sandbox. The MP4s are not rendered yet (PC), so sound,
pacing and motion have not been watched or measured. Every number below names the command behind it.

**The two lessons:**

| | lesson 1 | lesson 2 |
|---|---|---|
| id | `feedback-that-lands` | `phishing-report` |
| topic | giving feedback that lands (manager to report) | spot and report phishing |
| look | `corporate-clean` (plain), classic mix | `cinematic-noir`, `--mix cinema` |
| people | code presenter bookends, Maya v5 as the manager | code presenter bookends, rig characters Jo and Ravi |
| length | 47 beats, 429.6 s (7:10, 10 s over the 7 min target) | 42 beats, 420.5 s (7:00) |
| allocation (`plan/allocation.json`) | avatar 11 %, template 36 %, hybrid 18 %, motion 35 % | avatar 5 %, template 24 %, motion 72 % |
| check (probe + lints, Chrome) | 0 errors, 17 warnings | 0 errors, 38 warnings |
| knowledge approval | unattended, as asked | unattended, as asked |

Sheets: `projects/<id>/qa/sheets/_overview.jpg` and one sheet per beat.

## 1. The short answer
- **The writing is right. The pictures are not yet good enough to sell to a corporate buyer.**
  - The narration speaks like a colleague, not a teacher. For example: "That update wasn't great.", "It also tends
    to get defended. Not fixed.", "Unsure? Ask them by a separate route." It is short, concrete and adult.
- **Your read is correct: Loom has no mature, non-cartoony way to show people and things.**
  - The 13 packs change colour, type, corner radius and finish.
  - None of them changes how things are DRAWN. A person is a round head on a bean body. A clock or calendar is an
    icon-detail clip-art object.
  - "Plain" in `corporate-clean` means a plain palette, not a mature drawing. That is why both lessons read as
    cartoons, one light and one dark.
- **The best frames in both lessons have no characters at all.** They show the real artefact, annotated:
  - the email, with its address pushed in until one letter is visibly different (phishing b19);
  - the supplier message with its three signs pinned on (b24 to b27);
  - the funnel over the city, with its counts (b09 to b13);
  - the worksheet being filled in at a desk (feedback b37 to b41).

  That is the mature register to build: **artefact first** (section 5).
- **Six real defects were found by looking at frames, not by the checks.** Four were engine bugs and are fixed
  (section 3). The checks are not yet a substitute for looking.

## 2. Lesson by lesson

### Lesson 1: feedback that lands (corporate-clean)
**What works:**
- **The story:** one manager, one update, a bad first try, then the four moves applied to the same piece of work.
  This is the right shape for adults.
- **The desk sequence (b37 to b41)** is the most mature minute in either lesson. It shows a real worksheet, one
  line written at a time, a pen, a laptop and coffee. One thing changes per beat, and nothing is cartoon.
- **The quiz pair (b29, b30)** is clean, and its answer marks the right option on its word.

**What is wrong or feels off:**
1. **The middle is a slide deck.**
   - 19 of 47 beats are templates (storyboard `kind`). 17 of them are cards on the same pastel gradient: b08, b09,
     b11 to b18, b22, b23, b25, b31, b42 to b44. Only the quiz pair is not.
   - Ten of the eleven beats from b08 to b18 are cards, eight of them in a row (b11 to b18). The four moves are
     taught as a stack of title cards, each with one icon, small text and two thirds of the frame empty.
   - The look is plain, but it reads as unfinished, not calm.
2. **The opening and closing image is the most cartoony thing in the film.**
   - It is a code-drawn bust in a circle, mouth open, on a pastel blob background (b01 to b03, b46, b47).
   - It is the first impression a buyer gets.
3. **Maya and the office are two drawing languages in one frame.**
   - Maya is illustrated and outlined. The room is flat, outline-free primitives.
   - Her scale does not fit the room: she stands behind the table with her head in the whiteboard chart (b19 to
     b28).
   - She holds the same standing pose for about 10 beats. The delivery has no walk or seated pose yet.
4. **One room, one shot, ten beats** (b19 to b36), in front of royal-blue cube chairs.
   - `places.js` hard-codes the accent colour for furniture, so the chairs are the loudest thing in the frame.
5. **Labels on labels** in b33 to b35: the old note, the new note, a "Thursday" tag, a speech bubble and a
   "chose together" tag overlap. In b35 the caption sits over the note's last line.
6. **Measured (`check`, `py -m loom variety`):**
   - 7 texts short of their reading floor; 4 beats over the chunk budget; 3 static holds over 5 s (b07, b17, b23);
   - the AI-tells ratchet fails on `one_radius_share` 0.702 (one corner radius on 70 % of boxes; the worst earlier
     lesson was 0.4) and on `still_share` 0.652;
   - the seed's camera habit (push) is unused in 15 of 23 bespoke beats.

### Lesson 2: spot and report phishing (cinematic-noir, cinema mix)
**What works:**
- **It looks designed.** The dark palette, serif headings and warm light read as a grown-up register.
- **The data and world beats (b09 to b13)** are proper explainer frames: a funnel over a city, an inbox grid, and
  counts that land on their words.
- **The evidence board (b17 to b21)** builds one picture across five beats. Pressure, authority, mismatch and
  request are each pinned to the actual message.
- **The push into the address (b19)** shows the one changed letter at full size. It now works (section 3).
- **The split screen (b34, b35)** shows two outcomes of the same click side by side.

**What is wrong or feels off:**
1. **The people are beans.**
   - Jo and Ravi have flat round heads; the crowd is grey bean heads; b33 has a cartoon thought cloud.
   - Against the mature palette they look like a children's explainer.
2. **Clip-art on the walls:**
   - a clock and a calendar at icon detail float on the office wall (b02, b07, b32);
   - the laptop in b32 and b33 is the size of a television.
3. **Too much on screen:**
   - 14 beats are over the chunk budget (`check`), and 9 texts are short of their reading floor;
   - the evidence board carries about ten labelled chips at once.
4. **The same frame twice:** b15 and b16 are the same message card, back to back. Callbacks to the message are
   deliberate, but two identical frames in a row are not.
5. **Measured (`py -m loom variety`):**
   - ratchet fails on `pop_settle_share` 0.549, `one_radius_share` 0.433 and `still_share` 0.688;
   - camera habit (pan) unused in 21 of 32 bespoke beats;
   - `lines_per_s` 10.3, which is denser than the explainer skill's films (7.5 to 7.8);
   - 9 `literal_colour` warnings (`#855b24`, `#493214`, `#da953b`). No scene file contains these values. They are
     most likely token shades from `S.lighten`/`S.darken` passed back through `S.c`, so this is probably the
     warning's blind spot, not a scene fault. Which call made them is unverified.

### Tone and style, together
- **Tone of voice:** right for corporate adults in both lessons. Keep the persona and the script stage as they are.
- **Visual tone:**
  - lesson 2 has a mature palette carrying immature drawings;
  - lesson 1 has a plain palette carrying sparse slides and one illustrated character that does not belong to its
    room.
- **Neither visual tone is yet what a corporate L&D buyer would put in front of staff without asking for changes.**

## 3. Defects found by looking, and what was done
Each was invisible to every check, and each was found on a contact sheet.

| # | where | what the frame showed | cause | fix | proof |
|---|---|---|---|---|---|
| 1 | phishing b42 | the closing headline printed over the opening headline | **engine.** An element the camera carries away is out of frame, not gone. Returning to the station found it still there | `world.js` switches camera-carried elements off once out of sight (`hideAfter`; motifs excepted) | b42 sheet clean |
| 2 | phishing b01 | the hook headline readable for 0.2 s before the camera left | **check.** The reading floor ignored camera exits, and it counted a 1.2 s unmask as readable 0.45 s in | `qa.py` counts camera exits and the real end of the entrance; b01 got a 1.4 s pause | extended test `reading_floor_...`. The fixed check now finds 16 short texts across the two lessons that it missed before |
| 3 | phishing b19, b21, motif chip | the push landed on empty board; in b21 the board slid 1187 px depending on which frames were seen before | **engine, and a determinism break.** `m.travel` used GSAP's origin, which is the corner of the element's bbox (or, with svgOrigin, a hidden offset that depends on history) | `motion.js` writes the travel matrix directly from one progress value. Holds moved to the `life` group so they cannot fight it | new Chrome test `travel_lands_on_its_own_origin_in_chrome_too` **fails on the old code** (checked); preview test added; seek order 90, 171, 183.4, 195, 60 gives exact matrices |
| 4 | phishing b39 | 9.3 s with nothing developing (the quiz answer's tail) | **template.** `quiz.answer` had one why-not slot, so the second wrong option and the takeaway were spoken over a still frame | `quiz.answer` gains `also` / `also_why` and `takeaway` (replaces the question on its words) | check error gone; catalog rebuilt |
| 5 | feedback b24 | the struck word, cooled to the surface colour, stayed on top of the new line and ate its letters | scene | the word fades after its strike | b24 sheet clean |
| 6 | phishing b22 | a template title printed over the evidence board kept under it | scene/storyboard (the board's `exit: "none"` outlived its run) | b21 gives the board a real exit | b22 sheet clean |

An engine attempt that was wrong, and was reverted: making every `exit: "none"` element fade when the next beat did
not claim it. That emptied b19, b33 and b36, which rely on the place persisting. The frames showed it at once.

## 4. Why everything comes out cartoony (the cause, not the symptom)
1. **One construction for every pack.**
   - People come from `rig.js` rigs (Ava, Sam, Pip, Tess, Extra): round heads, bean torsos, stick limbs.
   - Objects come from `objects.js`, places from `places.js`, all at icon fidelity.
   - The packs restyle colour and finish on top of the same drawings, so every lesson inherits the same childish
     shapes.
2. **The prompts ask for a drawn world** (B12, D-92), and the only drawing vocabulary is that kit. More density
   with the same kit gives more cartoon.
3. **Mixed sources.** Maya (commissioned, illustrated, outlined) sits in code-drawn rooms. Two languages in one
   frame look amateur, whichever one is better.
4. **Templates are slides.**
   - The 17 templates lay text on a field with one icon. In a plain pack the field is a gradient blob, which is
     the most "template" look there is.
   - Nothing makes a template fill its frame.

## 5. What a mature, plain register looks like (to build; the plan has the steps)
**Artefact first.** Show the real thing the job involves, drawn faithfully, and annotate it:
- the email, chat, document, spreadsheet, calendar invite, dashboard or form;
- type that moves: highlight, strike, replace, the line being written;
- thin-stroke diagrams and real data;
- people only when the lesson is about people, and then drawn by one designed family that matches the register.

This is what the best frames already do, by accident. The plan makes it a register:
`docs/strategy/2026-10-02-corporate-readiness-plan.md`.

## 6. Not verified
- **Not rendered to MP4** (the sandbox caps a call near 3 minutes). Narration, music, sound effects, pacing and
  lip sync have not been heard or watched.
- **Motion and timing not measured** on these lessons: motion share, event gap, frozen share (`tools/video_study.py`
  needs the MP4).
- **The HyperFrames layout and contrast check was not run.** The sandbox check used probe + lints + snapshots only
  (`run_hf=False`). On the PC, `py -m loom run <id> check` runs it.
- **Maya's lip sync and blinks** are seen in stills only.
- **The knowledge sheets** were approved unattended, as asked. No human has read the facts.

## 7. Added after the PC run (2026-10-02, evening): full check and render on Kshitij's PC
**What ran:** `py -m loom run <id> check` for both lessons (with the HyperFrames layout pass the sandbox skipped),
then `render` for both, then `py tests/run_tests.py --browser`.

**Results:**
- **Check:** feedback 7 errors and 29 warnings; phishing 47 errors and 42 warnings.
- **Both MP4s rendered anyway** (`renders/*.mp4`, 184 MB and 287 MB). That was a gate hole: `run <id> render` did
  not require a passing check. It is fixed now (L-168).
- **Tests:** 73 passed and 4 failed. All four failures were the same missing library: cairo, which the
  browser-free preview needs on Windows. Those tests now name a skip instead (L-170).

**What the errors are**, read from the PC's report and from frames cut out of the rendered MP4s
(`docs/research/step7/pc_check_error_frames.jpg`):

| errors | beat | what the frame shows | real? |
|---|---|---|---|
| 40 of phishing's 47 | b05, b09, b23, b31 (10 each) | a big chapter or title line laid over its dimmed scene (`Four moves`, `Why move three matters`, `A name you know`, `After a click`) | **mostly by design:** the chapter sting is meant to sit over the shot. The overlap rule counts every faint text behind it. But in b09 the "Report it" chip is cut at the left edge mid-travel. The instrument needs to know an overlay from a collision (L-169) |
| 1 | phishing b04 | the title card's frame is nearly empty: a kicker, and the message pushed off-left | real (weak beat) |
| 1 | phishing b19 | the REAL SPELLING panel covers the subject line ("C ... ur passw") during the push | real |
| 5 | phishing text spills ("written perfectly", "fools even experts", "within the hour") | text 4 px past its box | real, and invisible in the sandbox's Chrome: font metrics differ between the two machines (L-169) |
| 4 | feedback "Nothing changed" (b07), spill and inset | the tag fix made in the sandbox does not hold on the PC | real, the same cause |
| 2 | feedback b20 | the teal "While you both r..." tag sits in the caption band, under the caption | real |
| 1 | feedback b04 | nothing visible overlaps at that time on the frame | **unverified**, possibly hidden text; to look at in the HTML |

**Not yet done:** the two MP4s have not been watched end to end with sound, and `tools/video_study.py` has not
been run on them. On the PC:
`py tools/video_study.py projects/phishing-report/renders/phishing-report.mp4 --out docs/research/step7/phishing`
and the same for feedback.

### 7b. The delivered phishing MP4, measured (`tools/video_study.py`, run on the PC)
| measure | phishing-report (MP4) | stress-signal | the explainer skill's films |
|---|---|---|---|
| seconds with motion | **47 %** | 67 % | 83 to 85 % |
| median gap between visual events | **9.0 s** (p90 17.3 s) | 7 s | 2 to 4 s |
| holds | **46 holds, 177 s of 420 s** (longest 10 s at 265 s) | 7 holds, 17 s of 77 s | 2 to 5 holds |

**Reading:** the cinema-mix lesson moves LESS than the earlier glow-flat lesson.
- The beats are dense with drawn detail (10.3 lines of scene code per second), but much of it builds and then
  holds.
- The 9 s median gap matches the static-hold warnings, while the check's error bar is 8 s per beat.

**Caveat (unverified):** the measure is pixel change. On a near-black palette, slow camera drifts and small glows
change few pixels, so motion may be under-counted. Look at the sheets in `docs/research/step7/phishing/` before
trusting the size of the gap. The feedback lesson has not been measured yet.

**Looked at** (`docs/research/step7/phishing/phishing-report.sheet-01.jpg`, one frame every 10 s): the gap is real,
not only a measurement effect.
- **01:15:** nearly empty. The chapter sting is dimmed over a blank city, with only an ellipse visible.
- **04:25:** three empty device outlines.
- **05:45:** the frame is blank while "Say a colleague's chat message says" is spoken.
- **02:15 and 02:25:** the same message card twice.

These go into the quality work: no frame may be emptier than its words (an empty-frame check, corporate plan phase
4), and the beat before a quiz must not hand over an empty field.

### 7c. The delivered feedback MP4, measured (PC, 2026-10-03)
| measure | feedback-that-lands | phishing-report | stress-signal | the skill's films |
|---|---|---|---|---|
| seconds with motion | **59 %** | 47 % | 67 % | 83 to 85 % |
| median gap between visual events | **7.0 s** (p90 10.1 s) | 9.0 s | 7 s | 2 to 4 s |
| holds | **48, 120 s of 430 s** (longest 6 s) | 46, 177 s | 7, 17 s | 2 to 5 |

The plain lesson moves more than the cinematic one, and neither is near the reference films. Densely drawn frames
did not buy motion: building a rich frame and then holding it is still holding. This goes into the storyboard rule
for the remakes: every 2 to 4 s a visual event on the voice (an event-gap budget at plan time, V5 in the brain
design).

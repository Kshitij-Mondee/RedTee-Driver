# The TED-Ed vision run: everything we got back, and what it means for Loom (2026-10-05)

**Status:** the complete read. It supersedes the summaries in `2026-10-05-tedEd-study.md` where they differ (see
section 9). Everything here is a finding or a proposal. Nothing is built, and Kshitij chooses what is.

## 0. How this was read
- **What was read, every line:**
  - 96 films: 6,307 shot records, 96 whole-film records and the code's measurements of every shot;
  - the planted-defect test: 590 judge windows and 10 whole-film judges;
  - the 630-shot consistency re-run;
  - every golden-frame answer: 348 single-frame answers and 692 pair comparisons;
  - the run logs, server log, receipts, usage files and the metadata of every model call.
- **Who read it:** 43 Claude Opus readers, working in parallel:
  - 32 readers took 3 films each;
  - 11 took the calibration, consistency, golden-frame and log records.
  - Each reader checked Qwen against the code by script.
  - I read all 43 reports and checked the key numbers again by code (section 3 table).
  - I also read Loom's architecture, state, gates (`loom/checks/film.py`, `loom/qa.py`, `loom/checks/gates.py`), the
    storyboard schema and the frame audit.
- **The working files** are in `cache/vision_study/deep/` (gitignored):
  - per-group reports: `out/group_01.md` to `out/group_32.md`;
  - the special reports: `out/special_*.md`.
- **What could not be read:** Qwen's thinking. The lab kept only its length (`reasoning_chars`), never the text, so
  "how it thought" can only be inferred from length, time, tokens and its answers (section 4).

## 1. The short version
1. **What the pod bought:**
   - **Bought:** a complete, mostly accurate description of how 96 professional explainers are built, and a measured
     view of their colour, tone, timing and structure.
   - **Not bought:** a working judge. Qwen cannot judge taste, and its defect verdicts are unusable without code
     beside them.
2. **Qwen sees well and weighs badly.**
   - **Descriptions:** its descriptions of what is in a frame are right far more often than wrong.
   - **Timings:** 81 % of its motion-event times were copied from the code's list in its prompt.
   - **Joins:** it labels gradual joins as hard cuts (378 of 1,784).
   - **Motion:** it writes motion onto shots the code measures as still (126 of 180).
   - **Flaws:** it almost never criticises a film (2 flaws in 6,307 shots).
   - **As a judge:** it calls professional work broken (79 % of clean windows "fix").
3. **Our own instruments have real bugs** (section 5). Several numbers in the earlier style guide inherit them: cut
   rate, shot length, holds, "linear moves are jitter".
4. **The films share one grammar under twelve looks:**
   - one accent on the thing named, on a quiet field;
   - a still camera and a moving drawing;
   - one layout held while its state changes;
   - joins made from the material in the frame;
   - text on objects;
   - people small, posed or as hands;
   - deliberate rest.

   None of it is a house number: pacing runs from about 1 to 31 real joins a minute.
5. **Loom can already express a good share of that grammar.** The pieces that would matter most are missing:
   - a shape-to-shape morph, the most-cited gap in all 32 groups;
   - stepped time (drawing on fours);
   - a swap-in-place primitive;
   - material and motif wipes;
   - a magnifier;
   - a footage layer;
   - hands, and profile figures.
6. **Loom's gates would fail many of the best films.** They measure time and pixels, not intent. The rules taken from
   the frame audit (an event every 2 to 4 s, a hold over 4 s needs work, motion 83 to 85 %) are true of our failures,
   not of good films. They need declared intents and per-register thresholds.
7. **The run cost far more than it needed to.**
   - **Logged pod time:** 23.5 hours, plus the pilot and the taste experiments.
   - **Lost:** about 4.9 hours to running synthesize beside the judge, and 42.7 request-hours to timeouts that
     returned nothing.
   - **The same scope next time:** about 14 to 18.5 hours, an estimate.

## 2. What came back
| record | count | kept? |
|---|---|---|
| shot records (Qwen, thinking off) | 6,307 | yes |
| whole-film records (Qwen, thinking on) | 96 | yes |
| code measurements per shot (palette, brightness, saturation, detail, motion, moves) | 6,307 | yes |
| planted-defect judge windows and film judges | 577 + 10 | yes |
| consistency re-run | 630 | yes |
| golden-frame answers (v1, styled, anchored, pairs) | 348 + 692 | yes |
| Qwen's own synthesis | 1 of 35 batches (3 films) | yes |
| per-call metadata (time, tokens, thinking length, finish, errors) | 8,779 receipts | partly: usage files and some raw attempts were overwritten (section 5) |
| Qwen's thinking text | none | **never saved** (a design choice in `vl.py`, to keep the bundle small; a mistake for this question) |
| sound records | none | the sound pass was never run |
| media, transcripts | stay on the pod volume | by design (copyright) |

## 3. Qwen as a describer: the numbers (checked by code over all 96 films)
| check | result |
|---|---|
| hard cuts the code found, labelled hard cut by Qwen | 4,055 of 4,150 (97.7 %) |
| gradual joins the code found, labelled hard cut by Qwen | 378 of 1,784 (21 %) |
| sub-shot splits (pipeline artefacts) given a real join label | 69 of 277 |
| Qwen motion events whose time equals a code move time (within 0.06 s) | 15,952 of 19,776 (81 %) |
| its own (not copied) event times that sit on a 0.1 s grid | 3,757 of 3,824 (98 %) |
| shots the code measures as still (motion max under 0.01) that Qwen gave motion events | 126 of 180 |
| shots with a flaw listed | 2 of 6,307 |
| sync offset written as 0.0 | 6,116 of 6,307 |
| confidence "high" | 5,430 of 6,307 |

**What the readers found it does well:**
- **Devices:** it names what a shot does and why, specifically. Examples: a cutaway per claim; a colour handoff into
  the next shot; a morph chain; a callback.
- **Colour scripts:** they match the code's brightness and saturation in most films (27 of 29 windows in one group;
  every segment in another).
- **Hard cuts:** in clean flat films it labels every join correctly.
- **Changes the code missed:** in several films it is the only record of picture changes the cut detector did not
  see (BSdEiOYvKpE, m2BE9GZJJbs, Q9Vt6NGBVBc s027b, the live overlays in the musician film).
- **Text:** it reads large text exactly.

**What it does badly:**
- **Timing is not its own.** The shot prompt handed it the code's move list, word timings and palette
  (`shot_context` in `vl.py`). So it labelled the list, including measurement jitter. Where the list was empty, it
  filled the silence from the narration:
  - a pure white frame described as a living room (JJdoAMiaLZo s053);
  - a black frame described as a sketched room (0RiDPisQAzM s007) or as specks (QIqKGMM8ivM s005);
  - eleven identical "small movement" lines in one shot.
- **Its whole-film summaries contradict its own shot records** in nearly every film. Examples:
  - "exactly one red accent", against shots it describes with other accents;
  - "never returns to the opening" in films whose palettes prove a bookend;
  - "always faceless" beside shots with mouths;
  - longest stills of 17 to 24 s where the code's longest hold is 3 to 6 s.

  The shot records are the better source.
- **It treats the channel's furniture as each film's own idea.** Every film opens with the same 6 s card: identical
  code events at 1.17 s and 5.76 s in every film. Several share an end card. Qwen gave the same card different
  stories in different films.
- **It does not criticise.** Asked to describe, it finds no flaws. Its sync offset (0.0) and confidence ("high")
  are defaults, not measurements.
- **Its labels drift** for one object (3D, 2.5D or flat), for one figure's proportions, and for pack mappings.
  "Dissolve" became Loom's "dip" in 10 of 12 cases in one group.

**Consistency (630 shots described twice):**
- **The 0.82 agreement on categorical fields is confounded by a harness bug.** The re-run fed each shot the previous
  *sampled* shot as its predecessor (`annotate_video_shots`, `prev`). So 12 to 15 mid-film shots per part were called
  `first_shot`, and the join descriptions followed the wrong predecessor. Corrected, transition agreement is about
  0.82, not 0.74.
- **The look is stable;** kappa is 0.76 to 0.88 on outline, background and technique.
- **The content is not.** At the same copied time, the two runs agree on what moved only 44 to 66 % of the time. By
  the readers' reading, about a quarter to a third of the pairs describe a materially different action or detail:
  push in against pull out, a cup against a bucket, who hits whom, sunlit against night.
- **Its "unsure" list and its confidence do not predict which answers flip.**

## 4. Qwen as a judge, and how it thought
**Defects (the planted test):**
- **It finds them.** Reading its words, it found 46 of 50 planted defects: gross 23 of 26, subtle 23 of 24.
  - Its timing is within a median 0.18 s.
  - Its boxes overlap the plant at 0.92 to 0.98.
  - Its "blocker" severity was right 14 times in 17.
- **Why the score said otherwise:** the code's scorer credited only 39. It accepts a fixed list of labels, and Qwen
  called the blue block "placeholder", "empty frame" or "other", and tiny text a "debug string". The gross gate
  "failed" (0.846 against 0.85) because of that list.
- **True misses:** three freezes and one grain plant. The planting code also never checks that a freeze lands on
  moving footage.
- **It condemns professional work:**
  - 174 of 493 clean windows got a major or blocker;
  - 391 of 493 got "fix";
  - false alarms ran from 9 % to 63 % per film, worst on the most varied films.
- **Most false alarms are authored craft read through our own house rubric:**
  - mid-dissolve frames;
  - "one drawing language" applied to deliberate mixed media;
  - static holds;
  - real graphics misread as broken (a pupil read as a "missing image X-box");
  - and, because the planted films had their audio stripped, "no narration".
- **Text it cannot read:** it confabulates it the same way twice. The planted "review notes for the team" became
  "review notes for the board".
- **A narrow gate works:** text legibility, cut-off text and placeholder blocks at major or above gave 1 false window
  in 197, with all plants of those types found.

**Taste (the golden frames, E3):**
- **It describes the frames correctly** (checked by eye on 12 of 60) but values them by countable things:
  - legible type, alignment, one accent and a glow score up;
  - empty areas, simple faces and "stock" icons score down.
- **It gave one 5 in 348 answers,** to a frame Kshitij rated 3.
- **Head to head, his 4.5s and 5s lost to rejected Loom frames:**
  - 21 of 52 against the rejected class;
  - 26 of 66 against frames he rated 3;
  - the TED-Ed platform frame lost to our rejected quiz slide in both orders.
- **Every rubric revision fixed the bottom of the scale and broke the top.** Its error on his 5s went from -1.3 to
  -1.8 to -2.3 across the three versions.
- **It copied the nearest anchor** in 19 of 108 anchored answers.
- **The style label it chose decided the verdict:** the same frame got 2 as "corporate flat" and 4 as "editorial UI".
- **The conclusion:** a selection loop using this judge would push Loom toward slides. D-109 stands, and this is why.

**How it thought (from length, time and tokens; the text was not kept):**
- **Thinking is most of what it writes:**

  | task | share of tokens spent thinking |
  |---|---|
  | whole-film analysis | 61.5 % |
  | judge windows | 84 % |
  | maturity | 83.5 % |

- **Thinking is budget-shaped, not evidence-shaped.**
  - Its length does not follow the input: r = -0.19 against prompt size for whole films.
  - A 3 s credit card got 11,562 thinking tokens; 1 s tails got 5,000 to 6,000.
- **Longer thinking went with fewer false alarms.** Within each film, the false-alarm rate on clean windows fell
  50 %, 45 %, 26 %, 19 % by quartile of thinking length, in all 10 films.
  - Detection itself did not need more thought.
  - Read: it sees fast and condemns on first impression, and longer deliberation talks it out of some condemnations.
  - This is a correlation only.
- **For taste, thinking length carried no signal** (rho -0.095 against error).
- **Some "grammar runaway" retries were mislabelled.** Four of them were really thinking that ran to the 4,000-token
  cap and wrote nothing. The detector only checks for empty content.
- **The one synthesis that finished was the one that thought least:** 2,362 thinking tokens, 16 % of its output.
  - Its structure was sound: 123 evidence references, all real.
  - It invented 9 timings and wrote house rules that its own records break.
  - It marked 24 of 27 techniques as already in Loom; 16 of those notes name a missing piece.
  - Claude's distillation found the same devices, and more.

## 5. Our instruments: bugs the readers found (each checked in code or data)
**In the measurements (`vl.py` prepare):**
1. **`cuts.per_minute` counts the 20 s sub-shot splits.** It equals (records - 1) / minutes. Recomputed over real
   shots:
   - median 10.9 real joins a minute, range 0 to 30.7;
   - the overstatement is small in most films and threefold in long-take films.
2. **`shot_len` is computed over sub-shots, so it caps near 20 s.**
   - Recomputed: 69 of 96 films have a stretch over 20 s with no detected cut.
   - The longest is 346 s (jLOuMXnM5wk, where the detector found nothing).
3. **Film-level hard-cut counts exceed the shot-list joins in most films; gradual counts match exactly.**
   - Likely cause: cuts under 0.5 s apart are merged in the shot list but not in the count.
   - Not proven.
4. **`look` (brightness, saturation, detail) is measured on the middle still only** (line 909). So "dark" or "grey"
   can be wrong for the shot; brightness reads 0.00 or 1.00 on some fades.
5. **`saturation` behaves like a median.** It reads 0.0 on a frame that is 17 % pure red. Small accents can only be
   judged from the palette, and accents under about 2 % fall below the 6-colour palette.
6. **`still_s` is a count of still seconds, not the longest run,** and can exceed the shot length.
   `black_seconds` counts dark content.
7. **`moves.events` stops at 20 per shot** (123 shots), so later motion is unmeasured.
8. **"Linear moves are jitter" (my CODE_FACTS) was wrong as a blanket rule:**
   - 2,569 of 7,320 short linear events (35 %) sit in regular runs;
   - 0.167 s spacing is drawing on fours (line or texture boil), 0.25 s is drawing on threes or a cycle;
   - shrinking gaps are authored swaps;
   - high-peak singles are real instant changes the cut detector missed;
   - long linear moves are real constant-speed pans.

   Classify by spacing and peak, not by shape.
9. **The cut detector:**
   - misses changes on pale or hand-drawn frames and montages inside a fixed border;
   - splits continuous moves and overlay pops into "gradual cuts" (half the gradual cuts in one group);
   - in one film, Whisper produced 248 impossible words.

**In the harness:**

10. **The shot prompt gives Qwen the code's moves and word timings as prose,** so its timing and sync are circular.
11. **The consistency re-run fed the wrong previous shot** (above).
12. **Raw attempt files and usage files are overwritten across invocations:**
    - the first synthesize failures left no record;
    - `usage_shots.json` is empty;
    - the consistency re-run overwrote the original calls' metadata.
13. **`validate` passed and the bundle packed after synthesize failed** (1 of 35 batches).
14. **The configured `loom_beat_recall` gate silently disappeared** from the calibration report, and failed gates did
    not stop the run.
15. **Timeouts are still retried with the identical request.** My own L-210 rule is not in the code.
16. **The planted films had no audio,** and redaction ran only on `shots` and `videos`, not on the consistency
    outputs.

## 6. The run: where the time and money went
| phase | time | note |
|---|---|---|
| shots | 8.6 h | 11.3 shots a minute, thinking off, 0 errors |
| whole films | 3.9 h | 5 then 12 workers: 48 % more films an hour for 2.4 times the workers |
| synthesize | 92 s, then about 5.5 h in parallel | context overflow (L-209), then 64 timeouts (42.7 request-hours, nothing returned) |
| judge-planted | 10.0 h | about 4.9 h of it lost to synthesize filling the KV cache (estimate) |
| consistency | 0.85 h | |
| total logged | 23.5 h | plus the pilot and E3 before it |

**My mistakes, plainly:**
- **Estimates I never checked:** I gave time estimates without arithmetic, more than once.
- **Co-scheduling:** I started synthesize beside the judge. The binding limit was the KV cache (622,215 tokens), not
  per-stream speed, so L-210's diagnosis was incomplete.
- **Pod-time fixes:** I let several fixes be found on paid pod time.

**The next run, with the same scope:**
- run one heavy phase at a time;
- do synthesis off the pod;
- set max_tokens for videos to 24k;
- plant 15 defects per film, not 5;
- never retry a timeout identically;
- keep cumulative usage;
- log progress every 5 minutes.

My estimate for that run is about 14 to 18.5 hours.

## 7. What the films teach (corrected)
These are references, not rules (D-64). Each holds across most of the 96 films, and the counts come from the
readers' scripts.
1. **One accent, placed, not sized.**
   - A saturated accent sits on the element being named, on a quiet field, in every style.
   - It is often tiny: under 2 % of the frame in many films, below the palette's resolution.
   - It may change per section, and in some films it is the field itself.
   - The rule is about where colour goes, not how much.
2. **Tone is a script.**
   - A film holds one value band and breaks it once or twice for meaning: a dark beat for the key mechanism, a flood
     of colour at a turn, colour withheld until the payoff.
   - The pattern is a pale open, a slightly darker middle and a lift at the close (`tedEd_2026-10/colour_and_tone.md`).
3. **A still camera, a moving drawing.**
   - Most shots are static.
   - When the camera moves, it is one long eased move, sometimes 10 to 20 s under a whole explanation, and it may
     cross a join.
4. **Hold the layout, change its state.** One cutaway, panel or held object changes by swaps, recolours and
   relabels on the spoken word. One leg diagram runs 44 s this way. This is the opposite of Loom's
   station-per-beat habit.
5. **Joins come from the material in the frame:**
   - a shape morph;
   - a destination drawn inside the source object;
   - a wipe shaped like the topic's own motif;
   - a colour handoff, where the next field grows in the last 0.2 to 0.6 s;
   - a fill join, where a shape grows to become the next field;
   - page turns and torn paper.

   Chapter boundaries are mostly hard cuts (26 of 33 in one group); gradual joins live inside topics.
6. **Lists and numbers are objects:**
   - one slot that swaps its contents;
   - items arriving on their words;
   - a grid of units stamped to show a share;
   - a counter on a pile.

   Never an icon grid, never a number card.
7. **Text lives on things:** badges, signs, tags, the object itself. Labels at 0.03 to 0.05 of frame height are
   normal in studio work. There are no boxes on gradients.
8. **People:**
   - small in a composed place, faceless or posed, often seen from the side or back;
   - often only hands (hands appear as presenters in many films);
   - big cartoon faces are the minority and rely on designed acting.
   - Featureless "beans" do appear, but only small, in rooms with the film's highest detail.
9. **Hand-made time.** Texture and drawings change on fours (every 0.167 s) or on threes. This is the cheapest visible
   difference between hand-made and code motion.
10. **Reuse is a device:** returning sets, callbacks, bookends, recaps that replay the lesson's own images.
11. **Rest is deliberate.**
    - Holds of 7 to 24 s on a finished diagram while the voice explains.
    - Motion share from 0.60 to 0.99; good films sit at 0.60.
    - Pacing follows the content.
12. **Live-footage hybrids** (about 10 films): a speaker in a plain room with saturated overlays on the spoken
    nouns. Several readers call it the most corporate-ready format they saw.
13. **Mixed media works** when one framing system ties it together: border, palette, label style and grain.

## 8. What it means for Loom
**What is right:**
- **Loom's core already fits this grammar.** It has deterministic word cues, stations and joins, hold-and-transform,
  `Loom.ui`, iso and depth stages, places, seeded arrays and palette tokens. Zoom into nested child stations was
  built after the frame audit.
- **The non-figurative path Kshitij rated highest is exactly where the transferable craft is.** Readers named these
  films and devices as the most corporate-ready, and none of them needs a code-drawn person:
  - JOs-q7rXqdk, with no people;
  - the lit brass mechanism (XNEHP6qFeCs);
  - the editorial museum plane in the hat film (-Tw81EQYV_Y);
  - travel through artefacts (_gTgloPR0Aw);
  - the ink-on-paper saffron film.
- **The figurative freeze (D-102) is confirmed.** The story films rest on designed casts with acting and profile
  views, which code cannot draw.

**What is wrong:**
1. **The gates measure symptoms, not intent.** Here is what each would do to a good TED-Ed film:

   | gate (where) | today | what it would do to a good TED-Ed film |
   |---|---|---|
   | static hold (`qa.py`) | warns over 5 s, errors over 8 s | errors on 9 to 24 s teaching holds |
   | empty frame (`film.py`) | error unless intent hold, sparse or dark | flags 0.6 to 1.2 s punctuation beats and void staging unless declared |
   | sparse frame (`film.py`) | warns under 0.02 edge density | warns on glow-on-dark and paper films (43 % of one film's narrated time) |
   | double exposure (`qa.py`) | warns unless the join is `continue` | warns on deliberate ghost holds and dissolves |
   | repeated frame (`film.py`) | flags near-identical neighbours unless intent hold | flags word swaps and callbacks |
   | type size (`film.py`, frame-audit plan) | 18 / 26 px, plan 28 px | flags labels at 0.03 of height, diegetic signs |
   | frame-audit time rules | an event every 2 to 4 s, holds over 4 s need work, motion 83 to 85 % | true of our failures, false of many good films |
   | pedagogy wpm (`gates.py`) | 130 to 160 | two studio films sit at 125.7 and 129.3 |

   **The fix is not to loosen them.** Our failures were long holds on *empty* frames; TED-Ed's are long holds on
   *finished* ones. The fix has four parts:
   - **declared intents:** rest, process hold, punctuation, ghost dissolve, callback, diegetic label;
   - **content-aware conditions:** a hold is fine when the frame is dense and complete;
   - **per-register thresholds;**
   - **a calibration rule:** run Loom's own film checks on reference films before trusting a threshold. The 7 local
     TED-Ed videos are enough to start, on the PC, at no pod cost.
2. **Missing primitives, by how many groups asked for them:**

   | primitive | need | kind |
   |---|---|---|
   | shape-to-shape path morph | the top gap in all 32 groups; `runtime/` has none (grep) | new primitive |
   | stepped time | hold each drawing or boil step 4 or 6 frames; cycles | parameter |
   | swap in place | a slot whose contents change on cue words, with a rhythm curve; "state on a fixed layout" as a scene type | component |
   | material and motif wipes | torn, scroll, page turn, motif-shaped mattes, colour handoff, fill join, scale-to-fill exit; today: iris, wipe, dip, fade | joins |
   | magnifier inset with a leader line, and a cutaway mask | | components |
   | data as objects | unit grids stamped to a share, glyph floods, counters on piles | data forms |
   | accent token | a per-beat target, with a lint on how many saturated hues, not on saturation | pack rule + check |
   | value script | a section colour field in the storyboard | storyboard field |
   | text-on-object labels with leader lines | | component |
   | footage layer | grade, duotone, anchored overlays | new layer; needs consented footage, and downloads need approval |
   | hands asset family; profile and back-view figures; silhouette crowds | | designed assets (D-102 part 2) |
3. **Finish.** D-100 turned grain off by default after the phishing film's noise, vignette and leak looked cheap.
   About 60 TED-Ed films run a visible finish, but it is material texture (paper, brush, boil), not a noise overlay,
   and Kshitij's 5s share "light, texture, depth". So finish should come back as material, judged on the encoded MP4,
   not as full-frame grain.
4. **Planning.** TED-Ed films are built from a few devices repeated, one join material and one value script. Loom
   asks a scene agent to invent each beat alone. Proposal: the storyboard declares a **device set** per lesson (3 to 5
   devices, one join material, one accent token, a value script), and beats draw from it.
5. **Taste stays with Kshitij.** A model in the loop would pull toward slides (section 4).

## 9. Corrections to what I said earlier today
These are superseded here; the earlier files stay as written, because logs are append-only.
- **Linear moves:** "linear moves are jitter" (CODE_FACTS, the study doc) is wrong as a blanket rule (section 5,
  item 8).
- **Pacing:** the guide's pacing numbers use `per_minute` and `shot_len`, which count sub-shots. The corrected
  figures are in section 5.
- **L-210:** the binding limit was the KV cache, not per-stream speed.
- **The 0.82 consistency figure** is confounded by the harness bug.
- **The planted recall "fail" (0.846)** is a scorer artefact. By reading, recall is 0.88 gross and 0.96 subtle.
- **Gate conflicts:** the earlier note "double exposure would flag dissolves" is right but mild. It is a warning, and
  it exempts only `continue` joins.

## 10. How to move forward (proposed order; Kshitij decides)
1. **No pod (now):**
   - fix the instrument and harness bugs in section 5;
   - recompute the corrected pacing, hold and cadence tables from the data we already have;
   - add them to the guide as a superseding section.
2. **Gates (no pod):**
   - run Loom's film checks on the local reference videos;
   - add declared intents and per-register thresholds;
   - record a baseline and fail only on growth (Rule 0 addendum 5).
3. **Primitives, non-figurative first,** in this order:
   - path morph;
   - stepped time;
   - swap-in-place;
   - material and motif joins plus colour handoff;
   - magnifier;
   - data-as-objects;
   - accent token and value script;
   - text-on-object labels.

   Each one gets proven in the motion lab with strips Kshitij looks at.
4. **E2 bake-off,** reshaped by this study:
   - one corporate beat made with these devices on the editorial path;
   - against a designed-kit version;
   - hands first, as the cheapest figurative asset.
5. **Footage spike:** whether HyperFrames can play a graded video plate deterministically, before any decision on
   the presenter-plus-overlay format.
6. **Qwen, if used again:**
   - **as a describer only;**
   - **give it facts separately:** code facts as hard fields, not prose it can echo;
   - **run twice** and keep only what agrees;
   - **keep the thinking text;**
   - **defect passes:** blocker or narrow types only, beside code detectors for freeze, black and flat blocks;
   - **never** as a taste judge or a selector.

## 11. Unverified
- No frames were viewed for the film reports. Every picture claim is Qwen's, checked only against code numbers.
- Which run is right in the consistency pairs that disagree.
- The cause of the hard-cut count excess.
- Whether the regular short-event runs are boil, held drawings or cycles in each case; they need frames to settle.
- Every sync claim. No word-to-picture timing was measured by code; it can be, from Whisper words and picture-change
  times.
- The H100 hourly rate, so there is no dollar total.

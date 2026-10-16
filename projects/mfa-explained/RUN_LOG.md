# RUN_LOG: mfa-explained (overnight showcase, D-116, 2026-10-06)

Planner: Opus sub-agent, brief to script, per `docs/primitives/BRIEF_PLANNER.md`. Style `dark-technical`,
genre explainer, persona analyst, about 2.5 minutes. Append-only.

## brief (accepted, 1 gate round)
- **Through-line is a comparison of what can be handed over, not a topic.** "Nothing to hand over" names the
  property that separates the three cases (password copied and replayed, code relayed in real time, passkey
  answer bound to the real site). Rejected "MFA protects your accounts" (a title, true of any video) and a
  through-line that ends at "turn on MFA" (stops before the requester's passkey point).
- **One exchange re-run, not new diagrams.** `arc_plan[2]` (how it works) is written as the same login exchange
  run four times with one change each run (password only, plus code, fake page in the middle, passkey). The
  requester's notes listed four mechanisms; making them four runs of one schematic is what lets an analyst voice
  say "the difference is" each time. Rejected a separate diagram per idea (the genre's "three metaphors" failure).
- **Statistics pushed to knowledge, by name.** `must_cover[4]` says "how much MFA reduces takeover, only as the
  knowledge sheet states it, with source and limits" and `must_avoid` bans vendor figures as fact. The well-known
  headline percentage is a vendor claim; the explainer genre forbids vendor claims as fact.
- **Gate lesson:** the brief gate substring-matches catalog ids in the whole lowercase JSON (`cycle`,
  `definition`, `quote`, `recap`, `timeline` are ids), so ordinary words like "recap" or "timeline" in prose
  fail the brief. Checked the id list first and wrote around them.

## knowledge (accepted, 1 gate round; approved "agent, unattended per Kshitij (overnight showcase, 2026-10-06)")
- **Every source was fetched and read this session, not recalled.** CISA phishing-resistant MFA fact sheet
  (2022), CISA Secure Our World MFA page, Google security blog 2019 study (with NYU and UC San Diego), Meyer et
  al. arXiv 2305.00945 (Microsoft authors), MDN Passkeys, FIDO Alliance passkeys. The passkey mechanism facts
  (F13, F14: no shared secret; the signed answer carries the asking page's address; a look-alike site cannot use
  the passkey) come from MDN's "passkey scope" and "origin verification" sections, which is the exact relay
  argument the requester asked for.
- **Numbers kept are attributed and caveated as the platform's own data** (F5 Microsoft 99.22 / 98.56, F6 and
  F7 Google text code vs phone prompt against bots, bulk and targeted phishing). F5 lists "99" as well so the
  script may say "a little over 99 percent" truthfully. The F6/F7 pair is chosen because it shows the lesson's
  argument as data: both factors stop bots, the gap opens on targeted phishing (76 vs 90), and F8 (no
  security-key-only user fell to targeted phishing) is the passkey end of the same line.
- **Rejected:** the "99.9 percent" headline (a vendor blog figure, put in `not_claimed`), and the FIDO page's
  stat strip (3,000 percent AI phishing, 99.99 percent from a key vendor, all third-party marketing).
- **Gate lesson:** years count as numbers; every year in a statement must be in `numbers[]`.

## pedagogy (accepted, 1 gate round)
- **`contrast_led`, with the signature move "same exchange, one change, then name it".** The knowledge sheet
  defines every method by its difference from the previous one (F2, F4, F9, F14), so the contrast is the
  content. Rejected `analogy_led` (a lock-and-key metaphor breaks exactly at the relay, which is the point of
  the lesson) and `scenario_led` (a character would add load the brief bans: no people, no thief on screen).
- **The single stopping check is a `pause_predict` after sec1, aimed at misconception 1.** "MFA is on; you type
  password and code into a page that only looks real; does the thief get in?" Most viewers will predict no; sec2
  breaks that. Spending the one check here (not on a closing quiz) puts it right before the hardest idea, and
  the closing decision on an unexpected prompt is done as an independent-practice beat instead of a quiz.
- **Bloom path understand -> understand -> apply.** sec2 is the peak by load (energy `peak`) but stays at
  `understand` ("explain why a code can be relayed and a passkey answer cannot"); "distinguish" (analyze) would
  jump two levels from sec1. sec3 ends on `rest` energy at `apply` (three rules on their own sign-ins).
- **One slowdown only:** the address stamp on the passkey answer (F14). It is the idea that turns the relay
  picture into the passkey picture.

## persona (accepted, 1 gate round)
- **Copied `packs/personas/analyst.json` unchanged except `voice_casting`.** The brief's voice note (calm,
  exact, finding first, the limit straight after) is the analyst's character. The pack suggests `am_michael`;
  `project.json` requests Kokoro `af_heart`, so `voice_casting.tts_voice` now matches the request, to stop the
  two disagreeing downstream. Recorded in `provenance.adapted_from`.

## script (accepted, 3 gate rounds: rejected, accepted with a length warning, accepted clean)
- **Round 1 was 595 words, ~277 s against 150 s (x1.85).** The first draft wrote every knowledge fact a beat
  and every run two beats. Cut to 22 beats, 359 words, est 171 s (narration alone ~154 s at 140 wpm). What went:
  the F3 "bots replay leaked passwords" beat (folded into b04's grounding as the reason run one is shown, no
  longer spoken), the separate factor and MFA beats (merged into b05), the F17 limit beat (one phrase in b17),
  the closing recall beat after sec2 (its prompt now rides on b15, run four). Lesson: draft at
  `target_s * wpm / 60 - beats * 0.8 * wpm / 60` words from the start (here about 300 to 320), not by trimming.
- **The four runs are the beat spine, and each is named on screen** (`run one` b04, `run two` b06, `run three`
  b08, `run four` b15). One held exchange (laptop, line, door) is the motif from b01 to b22; b19 calls back run
  three ("It is run three, asking you to finish their sign-in") so the unexpected-prompt rule is the relay seen
  from the other end, not a new tip.
- **The pause_predict (b09, `pause_after_s` 3) freezes the picture, not a quiz card.** Both tokens stop at the
  look-alike box; b10 answers "Yes." first (finding first), then shows the relay. b11 states why the code felt
  safe (the plan's `why_tempting`) before b12 introduces the passkey.
- **Numbers spoken with their owner and their limit in the same beat:** b07 (Microsoft, "their own data, not a
  guarantee"), b16 and b17 (Google, "their accounts, so read the direction"). b16 says "a phone prompt, 90"
  without repeating "percent"; on screen it is "90%". Rejected: putting the Google ladder before the passkey
  runs (it would spend the passkey reveal on a statistic before the mechanism).
- **Deviation from the teaching plan:** the plan's `recall_prompt` after sec2 was a separate beat; it is now the
  `recall` on b15 (run four) to save a beat. Recorded with `loom note`.

## storyboard (accepted, 2 gate rounds; Opus storyboard planner, 2026-10-06)
- **Concept:** one held schematic on a dark bench (laptop and phone left, the site as a door right, one line
  between) re-runs the same sign-in four times with one change each run; lenses and a phone cutaway open the
  detail that decides each run; a four-cell tally keeps the verdicts side by side. Stations: `bench`, and a
  `study` wall directly below it (down is deeper: the evidence, b16 and b17).
- **The allocation was the hard constraint.** 12 of 22 beats must be templates (b02, b03, b05, b09, b11, b12, b14,
  b16, b17, b20 to b22), including beats the script imagined as lenses on the held picture. Resolved by keeping
  every bench template beat ON the bench: `keep` holds the schematic and the template backplate dims it to a
  veil, so the bench steps back and never leaves. Two cards in a row also keep `template_backplate` (otherwise the
  second card has no backplate and the veil would vanish). Logged with `loom note` (deviation). Rejected: a
  separate card station with a camera move per template beat (about 9 round trips, a slideshow by another name);
  `backplate: false` over the bench (templates are full-frame and vertically centred, collisions certain); a
  nested child station per card (template text shrinks below the 18 px floor when the parent stays in view).
- **Devices (5 + join):** `bench` (held schematic, state changes on the word), `run_tally` (Loom.slot run label +
  four stamped cells ACCEPTED/DENIED), `lens_and_cutaway` (Loom.magnify on the meter's 0.78 sliver b07, the box
  relaying both chips b10, the look-alike address b15; cutaway of the phone b13), `term_card` (template over the
  dimmed bench), `number_on_the_thing` (meter on the door b07, Google bars on the study wall b16). Join material:
  `fill` (the look-alike box grows into the relay at b10, token surface, never a red flood per must_avoid; the phone
  that refused grows into the cyan payoff at b20).
- **Bespoke beats (10):** b01 (bench built, plain sign-in), b04 (run one: copy replayed, ACCEPTED), b06 (run two:
  two locks, DENIED), b07 (meter on the door to 99.22, lens on the gap), b08 (run three: look-alike box spliced
  in, chips poised), b10 (relay under the lens, route turns red, ACCEPTED), b13 (cutaway: the key signs and never
  leaves), b15 (run four: lens on the address, no answer forms, DENIED), b18 (camera back up, laptop closed,
  prompts stack), b19 (hybrid: Deny tapped, ghost of run three). Each bespoke design names the held element
  contract (laptop, screen, phone, line, door, door_plate, run_slot, tally, plus per-run names) because the
  template `keep` lists depend on exact names.
- **Joins:** 16 continue, chapter cuts at b03 and b16, fill at b10 and b20, one camera pan at b18 with
  `continuous: true` (a camera join between two named worlds becomes a dip otherwise). Pushes only in b15, because
  a push followed by a continue join snaps the camera back at the boundary (world.js camKeys), and the fill boxes
  are screen pixels.
- **Colour:** threat accent3 only on the copy, the distant laptop and the exposed box; passkey cyan withheld until
  b13; accent2 is the one moving accent; stamps ACCEPTED neg / DENIED pos, the word carries the meaning.
- **Numbers:** b07 shows 99.22% (F5) with owner and limit on screen; b16 keys bar labelled "none fell", not 100,
  because F8 states no key-only user fell, not a rate.
- **Gate rounds:** round 1 accepted with a callback warning (b19's world string differed from b01's although it is
  the same bench): set b18 and b19 world to "the sign-in bench". Remaining warnings, deliberate: three bespoke in a
  row b06 to b08 (they are runs on one held picture) and every scene flat (a technical schematic; depth would be
  decoration). Checked all 76 anchors against the narration by script: 0 missing.
- **Animatic:** `loom animatic` crashed (no audio/timings.json; `read_json(p, None)` raises, the L-171 trap); ran
  it through a wrapper, engine untouched, logged as a finding. The plan-only sheet reads picture, card, card,
  picture, card, picture x4, card, picture, card, card, picture, card, picture, card, card, picture, picture,
  card x3: every beat has a subject, two worlds, no repeated world. It cannot show the veil, so on panels the
  template beats look like slides; whether they read as cards over a held picture is only provable on the build
  strips. Nothing changed after it beyond the world fix.
- **Unverified, for the scene and compose stages:** a slot held across beats (run_slot relabel; fallback named in
  b04), the veil chain through `keep: template_backplate`, a template backplate exiting cleanly into a held bespoke
  scene, the fill join on the same station with held elements, Loom.magnify on a station the camera later leaves,
  and a login-page artefact (Loom.ui has none: built from ui.card/ui.doc parts). No web reference board was made
  for the bench schematic; designs cite the local studies, so scene authors should run the reference loop.

## scenes (orchestrator, after the spend limit stopped the scene authors; 2026-10-06)
- **Kept:** b01, b04 (author A, verified in its fork); b10, b13, b15, b18, b19 (author B drafts, unverified by B).
- **Written by the orchestrator:** b06 (two lock plates with open/close methods that b10 calls; the same copy on the
  same route; DENIED), b07 (meter beside the door, instrument law, lens on the unfilled 0.78 sliver), b08 (look-alike
  page swapped in place, grey replica spliced onto the line, chips resting at its edge; the code chip rests on top of
  the password because two chips do not fit between the junction and the replica).
- **Found by looking at the overview sheet:** b07's lens never closed and sat over b08 to b20 (no gate caught it);
  fixed with `mg.exit`. b07's numeral and caption overlapped the door; moved left. Text floors and insets fixed in
  b06, b08, b13, b15; b19 held a `thief_line` that b18 never made.
- **Engine bug found:** `Loom.slot` compared a later relabel with the end of the beat that BUILT the slot, so every
  relabel in a later beat warned `slot_too_fast`; fixed in `runtime/slot.js`.
- **Check now:** 2 tight-inset errors (lock labels, 0.5 px) and about 20 `content_overlap` errors, all on deliberate
  stacks: template cards over the dimmed bench (b09, b11 to b14) and the stacked sign-in prompts (b18 to b20).
- **Render:** not possible in this sandbox (3 frames in 170 s; L-106). On the PC:
  `py -m loom run mfa-explained check` then `py -m loom run mfa-explained render --force` (forced past the
  deliberate overlaps; the override is logged).

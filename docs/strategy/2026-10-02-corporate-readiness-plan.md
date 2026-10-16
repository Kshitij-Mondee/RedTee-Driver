# Plan: make Loom sellable to corporate L&D, as soon as possible (DESIGN)

STATUS: DESIGN 2026-10-02 (D-94). **Priority set by Kshitij the same day:** the quality phases (0 to 4) come first, until
the videos reach at least 95 % of their potential, visually and as L&D. Speed, cost and the modular brain are the
recorded final goal (`docs/strategy/2026-10-02-final-goal.md`, D-95) and are not to be built yet. Written after step 7: two 7-minute corporate lessons made and reviewed
(`docs/research/2026-10-02-step7-review.md`). Nothing below is built yet unless it says so. Each phase ends in a
proof that can fail and a sheet or render Kshitij looks at.

## Where we are (from the step 7 review)
**Strong already (keep, and sell on it):**
- **Grounding:** every claim traces to an approved fact sheet or source.
- **Pedagogy and voice:** a colleague's voice, not a teacher's.
- **Determinism:** a frame is a pure function of time, and is now proven so for travel too.
- **Brand engine, captions, local narration**, and a runtime that can build real explainer frames: the funnel city,
  the annotated email, the push into one changed letter.

**Not good enough yet:**
1. **Drawing fidelity.** Every pack draws people as beans and objects at icon detail. There is no mature,
   non-cartoony register. This is the main blocker for a corporate buyer.
2. **Template beats are slides.** In the plain lesson, 17 of 47 beats were near-empty cards on a gradient.
3. **Mixed drawing languages.** A commissioned character in code-drawn rooms.
4. **Checks miss what eyes see.** Six frame defects this run were caught only on contact sheets.
5. **Not yet proven as a product.** No MP4 of either lesson has been watched. There is no LMS packaging, no
   turnaround or cost figure, and no demo kit.

## What a corporate L&D buyer judges (the bar each phase is measured against)
1. **It looks grown-up and on-brand**: their colours, type and logo, and nothing childish.
2. **It is correct**: built from their own documents, with every claim traceable (Loom's strongest card).
3. **It teaches**: practice, feedback and a job behaviour at the end (already in the pipeline).
4. **It fits their stack**: MP4, captions (SRT/VTT), transcript, and a SCORM or xAPI package for the LMS;
   accessible (captions, contrast, no flashing).
5. **It is fast and cheap to change**: a tweak in one sentence, re-rendered the same day.
6. **Their data is safe**: runs locally, no source leaves the machine except to the chosen model provider.

## Phase 0: watch what we made (this week, on the PC)
- **Render both lessons:**
  - `py -m loom run feedback-that-lands check` (full check, including HyperFrames layout and contrast);
  - `py -m loom run feedback-that-lands render`;
  - the same two commands for `phishing-report`.
- **Watch both** start to finish, with sound. Note pacing, voice, music, lip sync, and anything the sheets could not
  show.
- **Measure** with `py tools/video_study.py` against the reference films: motion share, event gap, frozen share.
- **Proof:** two MP4s and a watched-notes section added to the step 7 review. Every finding is either fixed or
  becomes an item below.

## Phase 1: a mature, plain register, "artefact first" (weeks 1 to 2) [the main blocker]
**Idea:** show the real thing the job involves, drawn faithfully, and annotate it.
- **What is shown:** the email, chat, document, spreadsheet, calendar invite, dashboard or form. Type moves with the
  voice. Diagrams are thin-stroke. Real data is a picture.
- **People:** by default only as hands, a cursor or a silhouette. A full figure only when the lesson is about a
  person, and then from one designed family (phase 3).
- **Kept beside the existing packs, not replacing them** (D-70). The person chooses it in the `look` question as
  "plain and mature".

**Build:**
1. **`Loom.ui`: a UI-mock kit at real fidelity.**
   - mail client and message, chat thread, document page, sheet grid, calendar invite, dashboard tile, form, browser
     bar and phone frame;
   - real type sizes, real spacing, brand tokens, no icon clip-art.

   The phishing lesson's best beats were hand-built versions of this. Promote them, with a reference board first
   (D-87).
2. **`Loom.type`: kinetic typography.**
   - line by line on the voice; highlight; strike and replace; redact; the cursor writing; a quote that builds
     word by word;
   - all measured with the existing text fitting.
3. **A plain pack, `briefing`.**
   - neutral greys with one brand accent, a serif or grotesk pair, hairline strokes, soft real shadows;
   - no gradient blobs, no bean rigs, no emoji or icon art at hero size.

   The pack lint enforces the bans (a "maturity" section).
4. **Maturity tells in the variety ledger** (ratchet, like D-85):
   - `cartoon_share`: beats with kit rigs or bean extras;
   - `clipart_share`: icon-detail objects at hero size;
   - `blob_field_share`: template beats on a gradient field.
5. **The step 7 lessons, remade** in `briefing` (feedback) and as a cinema version with artefacts (phishing). The
   same script and narration; only the pictures change.

**Proof:**
- the maturity tells fall to 0 on the remade lessons, and a planted bean rig turns them red;
- Kshitij compares the old and new sheets side by side;
- a non-Loom person shown one minute of each says which looks corporate.

## Phase 2: templates that fill the frame (weeks 2 to 3)
- **Rebuild the eight templates the lessons use most** as artefact compositions in every register: `title.card`,
  `definition`, `list.steps`, `icon.grid`, `quote`, `recap`, `quiz.question`, `quiz.answer`.
  - A definition becomes a glossary entry on a real page.
  - Steps become a checklist on the document the learner will use.
  - A quote becomes a message in the tool where it was said.
- **Fill rule (a gate):** content occupies at least 45 % of the safe box. Hero type is at least the pack's lead size.
  An empty card is a lint error, not a style.
- **Templates join their world.** A template beat may sit on the previous beat's station (the desk, the inbox)
  instead of a blank field.
- **Proof:** the fill gate fails on today's `definition` card and passes on the new one; lesson 1's middle
  third is re-sheeted.

## Phase 3: people, done once and well (weeks 2 to 4, with Claude Design)
- **Decide per register** (Kshitij):
  - `briefing`: no faces by default (hands, cursor, silhouettes);
  - cinema: one designed cast;
  - classic packs: keep the existing rigs.
- **Commission one cast in ONE drawing language that matches the rooms** (Prompt R contract, D-77):
  - Maya plus three more: a peer, a manager and an IT or security person;
  - poses: walk, sit, type at a laptop, point at a screen, listen, plus the expressions she has;
  - matching rooms and props in the same line and fill, so no frame mixes two languages.
- **Import** through `tools/rig_import.py` (D-93), with its self-check. Placement rules: feet on the floor line,
  head below the board, scale from the furniture.
- **The presenter:** the code bust is retired from corporate packs. The options:
  - a typographic opener;
  - a designed presenter from the same cast;
  - or, opt-in, a licensed avatar or recorded presenter as `kind: media` (licence check first).
- **Proof:** a cast sheet and one lesson with the cast, reviewed with `tools/rig_review.py`.

## Phase 4: checks that see what eyes saw (weeks 1 to 3, alongside)
Each check is proven able to fail on the real defect it was born from (Rule 0).
1. **Occlusion check.** Text covered by anything drawn later or above it, measured per snapshot from element
   boxes and paint order. It would have caught feedback b24, phishing b22 and b42, and the b35 caption over a note.
2. **Station residue check.** On every return to a station, elements of earlier beats still visible. It would have
   caught b42.
3. **Empty-frame and same-frame checks.** Content area ratio per settled frame, and two consecutive settled frames
   that are nearly identical (phishing b15 and b16).
4. **Auto-hold.** Compose extends a beat's tail when its last text reveal misses its reading floor, instead of
   warning. 16 texts across the two lessons qualify today.
5. **Literal colour, made truthful.** `S.c` accepts shades it derived. The warning stays for typed hex.
6. **Chrome tests in CI on the PC.** The travel test, the lab strips and a two-beat lesson check run whenever
   Chrome is present (a skip is named, never a pass).

## Phase 5: the product around the video (weeks 3 to 5)
1. **LMS packaging:** a SCORM 1.2 and xAPI wrapper around the MP4, with captions, transcript and the quiz items
   as real questions (they exist in the script). Proof: it loads and reports completion in a SCORM test player (which one is to be chosen; none is installed yet).
2. **Brand onboarding in one step:** logo, palette and fonts from a brand file or a website, through the existing
   brand engine. Restyle any lesson with `py -m loom restyle`.
3. **Source mode front and centre:** the buyer's policy PDF in, a page-anchored lesson out. This is Loom's
   differentiator: show the anchors in the review page.
4. **Accessibility:**
   - captions (done) and the contrast lint (done);
   - a flash check;
   - an audio-description track from the storyboard's `subject` and `world` fields (new).
5. **Voice options:** Kokoro locally (free). A licensed premium voice as an adapter (cost recorded per minute).
6. **Turnaround and cost, measured:** model tokens, render minutes and human review minutes per finished minute,
   for both lessons. A number with a command behind it, for the pitch.
7. **Data handling note:** what runs locally, what goes to the model provider, and what is stored. One page.

## Phase 6: the demo kit (weeks 4 to 6)
- **Three showcase lessons, each in two registers** (briefing and cinema): phishing, feedback and one compliance
  topic from a public policy document (source mode).
- **A 30 s trailer for each** (`py -m loom trailer`) and one 90 s reel across registers (`py -m loom reel`).
- **A one-page case:**
  - what Loom does;
  - the grounding proof;
  - turnaround and cost from phase 5;
  - what the buyer supplies.
- **A pilot offer shape**: one lesson from their document, in their brand, inside two weeks. Pricing is
  Kshitij's call; this plan only supplies the measured costs.

## Order and what can run in parallel
| week | main line | alongside |
|---|---|---|
| 0 | Phase 0 (render, watch, measure) | Claude Design brief for the cast (phase 3) |
| 1 | Phase 1: `Loom.ui`, `Loom.type`, `briefing` pack | Phase 4 items 1, 2 and 4 |
| 2 | Phase 1: remake lesson 1; Phase 2 starts | cast delivery and import |
| 3 | Phase 2: eight templates and the fill gate | Phase 4 items 3, 5 and 6; Phase 5 starts |
| 4 | Phase 3: remake phishing with the cast, cinema version | Phase 5: SCORM, voice, costs |
| 5 | Phase 5 finished; third lesson from a public policy PDF | Track A cinema pilot (D-91), if time allows |
| 6 | Phase 6: demo kit, trailers, case page | |

The Track A cinema pilot (D-91) stays planned. It moves behind phases 1 and 2, because the buyer's first question
is "does it look grown-up", and Track A does not answer it on its own.

## Decisions for Kshitij
1. **The plain register:** build `briefing` as "artefact first, no faces by default"? Or should it carry a cast
   from day one?
2. **The cast:** commission Maya's family (four characters) in ONE language that matches new rooms, and retire
   the code presenter bust from corporate packs (kept for the classic packs)?
3. **Presenter option:** look into a licensed avatar or recorded presenter as an opt-in `media` beat, yes or no?
4. **First buyer profile:** compliance and security, or soft skills? It picks the third demo lesson and the
   template order.
5. **LMS target:** SCORM 1.2 first, or xAPI first?

## Not verified (as of this plan)
- The two lessons have not been rendered or watched. Phase 0 may move items up or down.
- The week estimates are estimates (no command behind them). They assume one agent session a day and a Claude
  Design turnaround of about a week for the cast.

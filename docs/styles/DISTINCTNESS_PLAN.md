# Distinct, non-repeating code-drawn visuals: critique of stress-signal and a plan (2026-10-01)

STATUS: PARTIAL 2026-10-01. Steps 1 to 5 are built (D-79 to D-85). Step 6 (Maya v2) waits on Claude Design; step 7 (prove with lessons of different intents and styles) comes after Kshitij's pause. Earlier status: "DESIGN 2026-10-01. Nothing here is built."

**Why this exists.** Kshitij watched `projects/stress-signal` and said the storytelling is promising, but:
- the visuals are not there;
- the components look AI-made;
- ten videos in a row must not show the same components again and again.

This doc records the agent's own critique of the frames and a plan. The person chooses what is built (D-70).

## The agent's verdict on stress-signal (from the rendered frames)
- **Story: about 7/10.** One worker, one alarm, one bookend. The idea became a story; the pacing works.
- **Visuals: about 5/10.** Specific faults, worst first:
  1. **The character is a placeholder.** A capsule body, stick arms with ball ends, a round head and a flat bob.
     She is on screen in 7 of 10 beats, so she sets the quality ceiling.
  2. **We said "inside her" and never went inside.** The storyboard promised a move into the body, but the
     frame only put a diamond on her chest. A zoom into a drawn inner world (the system doing its jobs) is
     where this register earns its look. This is the biggest gap between the story and the picture.
  3. **The AI tells:**
     - the same pill label with a pointer line everywhere;
     - rounded panels with a cyan border (the status panel reads as a dashboard, not an illustration);
     - generic line icons in a disc, standing in for real objects (calendar, chat, mail, brain);
     - one corner radius for everything.
  4. **Grounds that are wallpaper, not places.** Six of eight scenes used the same blob field, stars and light
     shafts. Only the desk and the grass were places.
  5. **One entrance verb.** Almost everything pops or settles, and there are few continuous camera moves. The
     Kurzgesagt study found camera moves replacing cuts inside an idea.
  6. **No small detail.** No props on the desk, no room, no texture; the gloss shading barely shows at this scale.
  7. **The definition beat is a slide** (b02).

## Why the visuals repeat (root causes, not symptoms)
1. **A tiny vocabulary.** Every builder draws with the same few primitives (rounded rect, pill, disc, a stock
   icon), so different subjects come out looking the same.
2. **Builders vary position and colour, not form.** A status panel is always the same panel; only its tint
   changes.
3. **Objects are icons.** With no drawn props, a stock icon stands in for every thing.
4. **The author repeats a layout.** The agent defaulted to "character on the left, labels on the right with
   pointer lines" in four beats.
5. **Nothing measures repetition across lessons.** Each lesson is checked alone.

## The plan (mechanisms, cheapest first; each proven before the next)
1. **Measure repetition before fixing it.**
   - Use the `@form` and `@design` tags the library already harvests, plus a fingerprint of each lesson's
     frames.
   - A "variety ledger" across the last N lessons reports which forms, layouts and entrance verbs repeat, and
     warns when a new lesson reuses too many (a ratchet, not a hard gate).
2. **An "AI tells" lint**, from this critique:
   - share of labels that are pointer pills;
   - stock icons used as hero objects;
   - one radius everywhere;
   - share of entrances that are pop or settle;
   - beats on a generic ground with no place.

   Recorded as a baseline; it fails only on growth (Rule 0 addendum, item 5).
3. **The look comes from the subject, per lesson.**
   - TED-Ed's finding: seven lessons, seven looks, each from its subject's material.
   - Each lesson gets a design seed chosen from the topic and its governing metaphor:
     - shape language (round, angular, organic, architectural);
     - label treatment (pill, tag, ribbon, hand-lettered, stencil);
     - panel treatment (none, paper, glass, frame);
     - texture;
     - an entrance family;
     - a camera habit.
   - Builders read the seed, so the same `hud` call draws a different FORM in two lessons.
   - The storyboard records the seed and the ledger checks it against recent lessons.
4. **Objects instead of icons.**
   - Code-drawn object grammars for the things lessons keep needing: documents, devices, calendars, organs,
     buildings, vehicles, containers. Each has silhouette families and detail levels, so the same object is
     drawn differently per seed.
   - Drawn props from Claude Design come in through `tools/asset_intake.py`.
   - Stock icons stay for small UI marks only.
5. **Places and camera.**
   - Every motion beat happens somewhere (a room, a body interior, a street, a machine), not on wallpaper.
   - At least one continuous camera move per idea (push through layers, pan along a process, zoom into a
     part), using the depth stage that exists.
6. **The character.** Maya v2 from Claude Design (fixes 1 to 10 in
   `docs/assets/reviews/2026-10-01-maya-model-sheet-v1.md`), then the rig importer. The code rigs stay for
   crowds and pictograms.
7. **Prove it.** Remake stress-signal with steps 3 to 6:
   - go inside the body;
   - real props;
   - no wallpaper grounds.

   Then make two more short lessons on different topics, and run the variety ledger across all three. The test
   is Kshitij watching them back to back.

## The essentials principle (Kshitij, 2026-10-01; D-80)
- Some things are essentials: speech and chat bubbles, some kinds of icons, labels, panels, tick marks.
- They are never excluded for having appeared in earlier videos.
- What changes is their shape, design and style, chosen for the topic and its visual needs.
- That is what keeps frames from feeling the same.
- So the ledger measures the treatment of an essential, not its presence (`essential:bubble@chat` and
  `essential:bubble@note` are different looks).

## What this plan does not do
- **No changes to existing packs or lessons by default** (D-70); the seed is opt-in per lesson.
- **No ban on pills or icons.** They are fine in moderation; the lint measures share, not presence.

## Step 1, built (2026-10-01; D-79)
- **Commands:** `py -m loom variety` (the ledger over all lessons), `py -m loom variety <id>` (one lesson
  against the baseline), and `--baseline` to record the present state. `check` now adds the lesson's variety
  as warnings.
- **Code and data:**
  - `loom/checks/variety.py`;
  - the baseline in `loom/checks/variety_baseline.json` (written only by `--baseline`);
  - the last ledger in `cache/variety/ledger.json`.
- **First reading** (spacing-sticks, blameless-postmortem, stress-signal):
  - **Recurring in all three lessons:** stock icons, the `definition` template, the `title.card` template and
    the pop entrance.
  - **Recurring in two:** the character_moment blueprint, a presenter, speech bubbles, verdict stamps, tick
    marks, the quiz pair and the recap.
  - **Signature overlap between lessons:** 0.07 to 0.27. Low so far, because only three lessons exist and the
    styles differ. The same-style repetition is the one to watch.
  - **stress-signal against the other two:** above their median on pointer pills (0.22), pop or settle
    entrances (0.54) and wallpaper grounds (0.25); below them on templates (0.20) and hero icons (0.13).
- **Limits of the measure:**
  - pills and icons are counted by call site in the scene code, not by instances on screen;
  - "a place" is recognised by builder or element names (desk, coral, scenery, depth...);
  - a template's internals count only through the probe's entrance verbs.

  So this is a ledger to steer by, not a verdict. The frames still decide.

## Step 3, built (2026-10-01; D-81): the design seed
- **Choose:** `py -m loom seed <id>` writes `plan/design_seed.json`.
  - It picks one option per axis, giving 9 axes and 4 to 6 options each (`packs/seeds/treatments.json`):
    shape language, label, bubble, panel, icon, mark, texture, entrance family and camera habit.
  - `--show` prints the reasons and the alternatives; `--set axis=option` is the person's choice; `--clear` opts
    out.
  - How it picks:
    - from the subject's material (body, money, rules, tech, people, operations, nature, learning; matched by
      keywords in the topic, brief and metaphor);
    - away from the recent lessons (an option the last lesson used loses most);
    - never an option the pack's shading cannot draw;
    - ties break on a hash of the lesson id, so the same lesson always gets the same seed.
  - On today's lessons:
    - stress-signal would get organic, tag, cloud, glass, duotone, brush, grain, unfold and push;
    - blameless-postmortem would get angular and flag, among others (shown with `--show`, nothing written).
- **Draw:** `runtime/treat.js`.
  - `Loom.treat.label`, `bubble` (speech or thought), `panel`, `badge` (an icon as an object) and `mark` (tick or
    cross) draw in the seed's treatment.
  - `Loom.treat.enter` uses the seed's entrance family per role, and `Loom.glow.pill` follows the seed's label.
  - Compose passes the seed to the runtime as `style.seed`.
  - With no seed, every builder draws the classic form, so existing lessons are untouched.
- **Proof** (preview, no browser; sheets in `docs/styles/demos/preview/lab_treat_essentials__*__SEEDS.jpg`):
  - one composition (a person asks for a handover, a panel of three items ticked or crossed, two icons, two
    labels, a thought) drawn under five seeds in glow-flat and in flat-cosmos;
  - the five rows read as five different lessons with the same content;
  - the test checks that the seeds draw different frames, that a seed is deterministic, that the report records
    what was drawn, and that a seed of only defaults leaves a glow scene byte-identical;
  - with the seed ignored, the test fails.
- **What the seed does not do yet:**
  - the camera habit is guidance for the storyboard only;
  - bespoke code that draws its own bubble or label ignores the seed, so the ledger counts it as the classic look.
    That is the incentive to use `Loom.treat`;
  - object grammars (step 4) and places (step 5) are the next sources of sameness;
  - not yet rendered in Chrome: `py -m loom lab lab_treat_essentials` on the PC renders all ten strips.

## Steps 2, 4 and 5, and the rest of step 3, built (2026-10-01; D-82 to D-85)
- **Step 2, the AI-tells lint (D-85):**
  - eight tells: pointer pills, hero icons, pop/settle entrances, wallpaper grounds, template share, classic
    essentials, one radius everywhere, and still beats (no camera move);
  - each warning names the beats that cause it, for example "pointer_pill_share ... (beats: b03, b04)";
  - a new lesson with no seed is warned (unless cleared on purpose), and so is a seed whose push or pan habit is
    never used;
  - the baseline was re-recorded on purpose from the same three lessons. Today's worst still-beat share is 0.64,
    and the worst one-radius share is 0.40.
- **Step 3, the seed reaches everything (D-82):**
  - `go` gives a new lesson the engine's seed before its storyboard;
  - under a seed, `kit.card`, `kit.mark` and the templates' icon discs follow it (cards only in text-safe forms);
  - the definition template under four seeds: `docs/styles/demos/preview/lab_tpl_definition__glow-flat__SEEDS.jpg`.
  - Its layout is still the same slide, so the template share stays a tell to keep low. Per-seed template
    layouts are not built.
- **Step 4, objects (D-83):**
  - 12 objects, 2 or 3 families each, picked by the seed: `lab_objects__glow-flat__SEEDS.jpg`;
  - a hero icon in a seeded lesson becomes the object; small icons keep the icon treatment;
  - no object draws a word or a number of its own.
- **Step 5, places and camera (D-84):**
  - five places: office, inside, server, meeting and warehouse. Each has three layers, objects as props, and a
    wall, floor pattern, trim and side from the seed;
  - `Loom.cam.push` and `pan` give parallax: `lab_places__flat-cosmos__SEEDS.jpg`.
  - The places are simple. They give a beat a somewhere and a camera move, but they are not illustrations at
    the level of the reference channels; drawn sets from Claude Design are still the upgrade path
    (`docs/ASSET_WISHLIST.md`).
- **Seen in the frames and fixed** (L-146 to L-148):
  - a muddy bulb glow;
  - a pan showing the edge of the world;
  - a cream floor from a signed hash shift;
  - clock hands that the preview could not turn.
- **Chrome (Kshitij's PC, 2026-10-01):** `py -m loom lab all` rendered every lab scene in every style and seed. All
  were clean except four strips with tight text on stamps and a frame title. Fixed (L-150; the single-scene
  command's seed gap is L-151), then re-rendered: 10 of 10 clean.

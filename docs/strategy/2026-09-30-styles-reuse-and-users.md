# Styles, reuse and users: where Loom goes next (2026-09-30)

**Status:** a PROPOSAL for Kshitij to decide on. Nothing in sections 5 to 8 is built unless it says so.
This is a strategy document, not a log: when a decision is made, it goes into
`docs/context/DECISIONS.md`, and this file stays as the reasoning behind it.

**Evidence labels.** Every claim is marked:
- **[measured]**: run in this session;
- **[reported]**: taken from a named doc, often RedTee's own;
- **[assumed]**: reasoning. Any number marked assumed is an estimate.

---

## 1. Styles today

**Loom has 5 style packs [measured]** (`packs/styles/*.json`):

| pack | reads as | shading grammar | type faces | motion | ambient |
|---|---|---|---|---|---|
| `flat-cosmos` | Kurzgesagt-like flat vector, deep indigo | crescent (lower shade plus highlight) | Fredoka / Nunito | smooth | stars |
| `editorial-paper` | print editorial, warm paper | paper (inner keyline) | Fraunces / Inter | calm | paper grain |
| `whiteboard` | hand-drawn marker sketch | sketch (seeded rough.js) | Caveat / Patrick Hand | lively | none |
| `corporate-clean` | light, neutral business | flat | Space Grotesk / Inter | smooth | dots |
| `dark-technical` | dark engineering console | flat | Space Grotesk / Inter | smooth | grid |

Both finished lessons use only two of these: flat-cosmos and whiteboard. The other three have been proven
only on component and template sheets and, today, on one restyle experiment (section 3).

**Are they templatised and parameterised?** Mostly yes, with one important exception.

- **A style is data.** One JSON file sets:
  - the palette (14 tokens) and fonts;
  - type ranges per role (the size floors);
  - shape radius and stroke;
  - the shading grammar;
  - shadow;
  - motion personality and durations;
  - ambient field and captions;
  - icon stroke and character colours;
  - music mood and the default join.
  
  Templates and scenes may only use tokens: literal hex colours are rejected by the scenes gate
  [measured, gate]. A new look *within an existing grammar* is a new JSON file, with no code.
- **A grammar is code.** There are four shading grammars in `runtime/kit.js`: flat, crescent, paper
  and sketch. A genuinely new look (isometric, cut-paper, line-art, code-native) means new drawing code.
- **The exception: bespoke scenes bake style in.** When blameless (a whiteboard lesson) was recomposed as
  corporate-clean, 3 of its 11 bespoke scenes called `kit.sketch` directly and broke with 23 errors
  [measured]. That is fixed now: `kit.sketch` draws the crisp equivalent in non-sketch styles. What remains
  is 5 layout errors, where corporate's wider Inter face overflows boxes sized for Patrick Hand
  [measured]. See the evidence folder.
- **Not parameterised yet:**
  - spacing (there is no spacing scale: L-54);
  - brand overlays (no "extends a base pack plus an org's colours, fonts and logo");
  - aspect ratio (16:9 only);
  - the character set (Open Peeps) and the icon set (Lucide) are fixed;
  - there is no per-course style lock;
  - sound is only a mood string [measured by reading the pack schema].

## 2. Where the model spends its time (the "re-inventing" question)

- **Planning** (brief, knowledge, pedagogy, script, storyboard) is one Opus pass per lesson. This is
  real invention: the lesson is new.
- **Bespoke scenes are where the same things get re-invented.** In blameless, 11 of 29 beats (38%) were
  bespoke. Every one was a fresh Sonnet authoring task, and the later fixes cost about 50-135k tokens per
  agent [measured, from agent usage].
  - The library found that what recurs is mostly parts: cards, owner chips, sight lines, strike-throughs.
    Nothing has qualified for promotion yet [measured, `library/FORMS.md`].
  - Whole-scene designs have only one near-repeat so far.
- **Styles are not re-invented.** A pack is picked, not written. So the invention cost is in scenes, not
  looks.
- **Fixes are the hidden cost.** Of the run-2 to run-5 fix work, much came from layout geometry typed by
  hand. The measured-layout checks (R-6) now turn those fixes into gate failures before a human sees them.

## 3. What RedTee meant to be, and what it taught us [reported: RedTee docs, read-only]

**Vision.** RedTee wanted to be a code-rendered engine, with a Studio (interview, brief, storyboard,
slides, video), then a multi-tenant Studio, a grounded course platform and an evidence LMS with an
instrumented player.
- The LMS, player, variants, course service and Manim are designed but frozen or unbuilt
  (`LMS_SESSION_CONTEXT.md`; `docs/product/2026-09-review/00`).
- The wedge moved twice: from corporate L&D, to datacenter operations, to the current proposal, "AI
  upskilling for engineering teams" (review 00, D-01).

**Users.**
- **Hero creator:** an engineering manager or tech lead (D-MANAGER-FIRST), at a company with 50-500
  engineers building LLM features.
- **Learners:** engineers watching 5-20 minute lessons.
- **Also named:** L&D managers, SMEs, HR/compliance, instructional designers, PMs, org admins.
  Downmarket authors (team leads, PMs, HR making videos for colleagues) and mixed-role courses are
  explicitly in scope.
- **The job, in their words:** "My team is about to build X with LLMs. Get them to competent on the
  parts they don't already do, in our context, within a sprint, with material I'd defend"
  (review 01 §3).
- **Pain points they cite:**
  - no relevant training;
  - no work time for learning;
  - one voice is wrong for the room;
  - N audiences means N courses to maintain;
  - Studio interview friction: the summary was repeated 4-6 times, and 0 of 39 briefs captured the
    "musts".
- **Evidence gap, the biggest risk in the whole plan:** "No customer conversation is recorded in any
  repo" (review 00). Buyer, price and demand are all unverified.

**Lessons about styles and reuse that Loom must not repeat:**
1. **Style fragmentation.** RedTee grew four overlapping style systems:
   - 11 palettes (picked per video, sometimes by an LLM);
   - 5 token schemes;
   - 12 style presets that appear to be off the live path;
   - 7 delivery registers.

   Its own docs contradict each other on which is live. Loom keeps one style system (packs), with
   delivery (persona and register) as a separate axis.
2. **Built but never picked.** 74 of 133 blueprints were never chosen; whole families went 0 for 14.
   Selection needs to be tested, not assumed. Loom now does this with a blind pick (D-17).
3. **Sample text reached real slides** (48 designs). Loom now audits drawn text (D-16).
4. **Hand-typed counts drifted.** Loom has `context_check`.

## 4. Who Loom serves (multi-dimensional)

| who | what they need from a video tool | what "style" means to them | evidence |
|---|---|---|---|
| Eng manager or tech lead (hero creator) | speed, credibility with engineers, their own context (codebase, runbooks, incidents) | technical and honest: diagrams, code, terminals, architecture; nothing cartoonish | reported (RedTee), no interviews |
| Senior developer teaching the team | explain their system and decisions once, reuse the explanation often | architecture diagrams, sequence flows, code diffs | assumed |
| PM | roadmap, decision and product-walkthrough briefs | editorial or deck-like, calm | assumed |
| L&D / HR / compliance | brand compliance, accessibility, audit trail, many audiences | THEIR brand (colours, fonts, logo), high contrast, consistent across a course | reported (RedTee persona list) |
| Learner (in the LMS and player) | short, relevant, skippable, checks that count, captions, mobile | consistency across a course, readability, pace | assumed |
| Admin / reviewer | approve, trace sources, update when the source changes | predictable output, no surprises | reported |

**The implication:** the next styles should be chosen by who picks them, not by novelty. Engineers
want a credible technical register. L&D wants their brand applied to any style. Learners want the whole
course to look like one course.

## 5. Brainstorm: ways to make the model invent less (diverge, then stress-test)

**Diverged (15):**
1. brand overlay on any pack;
2. restyle an existing lesson with no model calls;
3. scene "recipes": give the scene author the 3 most similar past scenes as a starting point;
4. a bespoke-text grounding audit, so recipes cannot leak one lesson's words into another;
5. the persona library as the default, not a fresh persona per lesson;
6. genre "arc templates" pre-filling brief and pedagogy;
7. the component and template library (running);
8. layout "compositions" (a named arrangement of components) between templates and bespoke scenes;
9. per-audience variants (re-script only the beats that change; RedTee shipped this);
10. a course-level style lock;
11. an "engineering register": code, diff, terminal and architecture templates;
12. new grammars: isometric, cut-paper, line-art;
13. an LLM picks the style by topic;
14. a user-uploaded style reference image turned into a pack by a model;
15. 9:16 vertical cuts of each lesson for mobile micro-learning.

**Stress-tested, and the ones cut:**
- **#13 cut.** RedTee did this, then made a deterministic default the house setting (paper_cream,
  2026-08-14). It is unpredictable for the brand-compliance buyer.
- **#14 deferred.** It is exciting, but its output needs the same contrast lint and review. It is easier
  after #1 exists, since an image-to-pack step is just #1 with an extractor.
- **#12 deferred, except line-art.** Isometric is expensive and only engineering wants it.
  Line-art is a cheap variant of flat and suits technical diagrams.
- **#8 merged into #3.** Compositions will emerge from recipes plus the library. Designing them up
  front repeats RedTee's never-picked problem.
- **#9 kept, but after #1-#3.** It is high value for mixed-role teams, but it needs an audience model
  and the LMS to matter.

## 6. Decision (decide-loop)

**Criteria, weighted before scoring:**
- Critical: cuts repeat model work. Critical: serves the hero user.
- Important: reversible and cheap to test. Important: builds toward the LMS and player.
- Nice: novelty.

**The presumed favourite was "new styles".** It loses: novelty is the lowest criterion, and the evidence
says invention cost lives in scenes, not looks.

**Recommendation, in order:**

1. **Portable styles: brand overlay plus zero-model restyle** (#1, #2, #10).
   - **What:**
     - `packs/brands/<org>.json` extends any pack with palette, fonts and logo, and the contrast lint
       rejects bad brand colours;
     - a `loom restyle <lesson> --style X [--brand Y]` command, which is recompose plus measured check;
     - a course-level style lock.
   - **Why:**
     - the L&D buyer's first question is "can it be our brand";
     - the restyle experiment shows it already mostly works: about 24 of 29 beats needed nothing, and the
       5 errors were caught by the gates [measured].
   - **Tripwire:** if a restyle of each existing lesson into every pack still needs more than 3 manual
     beat fixes per lesson after P0, stop and put the per-scene fixes into measure-then-draw first.
2. **Scene recipes plus a bespoke grounding audit** (#3, #4).
   - **What:**
     - the scene task file includes the nearest 3 past scenes by `@design` tag and storyboard spec, as
       code to adapt;
     - `check` extends the sample-text audit to bespoke scenes, so their drawn words must come from the
       narration, the knowledge sheet or props.
   - **Why:** this attacks the 38% bespoke cost directly, and it is how the library's counts grow
     honestly.
   - **Tripwire:** if Sonnet tokens per bespoke scene do not fall at least 30% on the next lesson
     (measured through the API ledger or agent usage), recipes are noise: remove them from the task file.
3. **An engineering register** (#11 plus a line-art grammar).
   - **What:**
     - a `dev` pack family (dark-technical refined, plus line-art);
     - templates for code-with-diff reveal, terminal session, sequence and request flow, and
       architecture boxes-and-arrows.
   - **Why:** this is the hero user and RedTee's current wedge.
   - **Condition:** only after the interviews (section 8) confirm that engineers would learn from it
     rather than skip it.

**Deliberately not doing now:** isometric and cut-paper grammars, LLM style picking,
reference-image-to-pack, and vertical 9:16.

**Confidence:** medium. The engine evidence is measured; the user evidence is reported or assumed.
**What would raise it:** 5 interviews with engineering managers (section 8).

## 7. Feature sketch for #1 (feature-loop, P0 only)

- **Problem:** a lesson is locked to the look it was made in, and nothing expresses an organisation's
  brand. The L&D and HR buyer cannot adopt it, and a team cannot keep a course consistent.
  Evidence: RedTee persona docs [reported]; the restyle experiment [measured].
- **P0 flow:**
  1. `loom restyle <id> --style corporate-clean --brand acme`;
  2. recompose;
  3. measured check;
  4. the failing beats listed as tweak tasks;
  5. render.
- **Out of scope:** logo animation, custom fonts not in the font registry, per-beat style mixing.
- **Success metric:** every existing lesson restyles into every pack with 0 errors after at most one
  tweak pass per failing beat, and no model calls for beats that pass.
- **Technical risks:**
  - hand-sized boxes in scenes (mitigated by measure-then-draw, L-24);
  - sketch-only scene code (fixed, L-55);
  - brand colours failing contrast (the lint exists).
- **Phases:**
  - P0: restyle plus brand overlay plus a lint;
  - P1: course style lock, and the Studio "look" picker;
  - P2: image-to-brand extractor.

## 8. The research the whole plan depends on (user-research)

**Riskiest assumption:** that engineering managers and tech leads will author videos for their team,
rather than wanting a ready-made catalogue. No customer conversation exists in either repo.

**Cheapest test:** 5 interviews of 45 minutes each with engineering managers or tech leads at 50-500
person engineering companies.
1. **Context:** "Walk me through the last time you got your team up to speed on something new. What did
   you use? How long did it take you?"
2. **Pain:** "What did you end up doing yourself that you wish you hadn't? What did the team skip?"
3. **Artefacts:** "Show me the doc, recording or deck you used." (Look for their real visual register.)
4. **Reaction:** show the same lesson (blameless) in whiteboard, corporate-clean and dark-technical.
   Ask "which would your team take seriously, and why?"
5. **Personalisation:** "If the video used your own incident or codebase, would that change anything?
   What would you need to trust it?"

**Stop condition, written before we start:** if 4 of 5 say they would not author it themselves, the
creator is not the manager, and the Studio should target L&D or a done-for-you service instead.

## 9. Critique of the current looks (design-critique, brief)

| pack | works | biggest issue | fix |
|---|---|---|---|
| whiteboard | warm, human, reads as a workshop; the strongest lesson so far | dense hachure competes with text; the handwriting faces are tall and cramp boxes | lighter hachure (done: 0.45); measured layout (done) |
| flat-cosmos | polished, and characters read well | close to a famous studio's look, and cartoonish for a senior engineering audience | keep it for learners and onboarding, not the hero user |
| corporate-clean | legible and neutral; the restyle held up | generic; it needs the org's brand to feel owned | brand overlay (#1) |
| dark-technical | fits engineers | never used in a full lesson; no code or terminal primitives | the engineering register (#3) |
| editorial-paper | calm and premium | never used in a full lesson | trial on a PM-style briefing lesson |

## 10. Decisions this needs from Kshitij
1. Approve bet #1 (portable styles and brand overlay) as the next build?
2. Who runs the 5 interviews in section 8, and do we freeze bet #3 until they are done?
3. Is the hero creator still the engineering manager (RedTee D-MANAGER-FIRST), or is Loom aimed at L&D
   first?

---

## Addendum, 2026-09-30 (R-8): the requester's answers, and brand-on-any-style in detail

**Answers:**
1. **Q1, P-1 brand-on-any-style:** explained below. Awaiting confirmation.
2. **Q2:** do not wait for interviews. Add the Engineering and Line Art styles now; the interviews will be
   run by showing the engineering style (D-28). **Done:** the `engineering` and `line-art` packs, plus the
   new `line` grammar. Both lessons restyled into both with 0 errors and no model calls. Demo frames are in
   `docs/styles/demos/`.
3. **Q3:** a mix of users (engineering managers, PMs, L&D) all create in the final product, and TOOLING is
   the long-term edge: a smooth, frictionless interface to change anything and correct errors (D-29).
   This moves "edit anything" from nice-to-have to the core product surface.

### Brand-on-any-style (P-1), in detail

**The idea.** Separate the *look* (a style pack: shapes, drawing grammar, motion, type sizes) from the
*brand* (an organisation's colours, fonts, logo and a few rules). A brand is a small file layered on
top of any style, so Acme's lessons can be whiteboard-Acme, engineering-Acme or line-art-Acme, and every
lesson in a course stays on-brand without anyone re-picking colours.

**What a brand file would hold** (`packs/brands/acme.json`, a proposal):
- `palette`: the org's colours mapped onto Loom's tokens. For example the primary becomes `accent`,
  the secondary `accent2`, the dark text colour `ink`. Only the tokens given are overridden.
- `fonts`: the org's typefaces (for example `display: "Acme Sans"`), from the font registry or uploaded
  woff2 files, with the same per-role mapping as `fonts.roles`.
- `logo`: an SVG or PNG, with placement rules (the corner bug, the intro and outro card) and a minimum
  clear space.
- `rules`: optional house rules. For example "never use accent3", "captions always on", "no characters",
  or "formal register only".
- `locks`: what an editor may not change (for example the logo and primary colour), versus what they may
  change (for example the style).

**How it combines with a style** (deterministic, no model):
- `effective look = style pack` (shapes, grammar, motion, type ranges), `+ brand palette` (overrides
  tokens), `+ brand fonts` (override faces), `+ logo layer`.
- The style keeps everything that is not brand: whiteboard stays hand-drawn, line-art stays monoline.
- **Guarded by the existing gates:**
  - the contrast lint re-runs on the merged palette, and a brand colour that makes text unreadable in
    that style is rejected, with the nearest passing shade suggested;
  - the measured-layout checks re-run, because brand fonts change widths;
  - the sample-text audit is unchanged.

**What users would do** (in the Studio, and on the command line as `loom restyle <lesson> --style X
--brand acme`):
1. **L&D or admin**, once per organisation: upload the brand kit, preview it on a 6-frame sheet in
   every style, fix any contrast rejection, and lock it.
2. **Any creator**, each lesson: pick a style, and the brand applies automatically. They can switch
   style at any time and re-see the frames in seconds, with no model cost.
3. **Course lock:** every lesson in a course shares one style and brand, so a learner in the LMS sees
   one consistent course.

**What it costs and what it saves:**
- **Build:** the overlay merge, the lint, the logo layer and the CLI are small engine work (assumed
  about a week). The Studio picker and preview is UI work.
- **Saves:** re-making a lesson for a different look or client. Today that is a new authoring run;
  after this it is a recompose.
- **Evidence it works:** two lessons restyled into two new styles with 0 errors today [measured].
- **Risk:** brand fonts with unusual widths, which the measured checks catch.

**What it is NOT:**
- It is not an AI inventing a new look each time; the look comes from the style.
- It does not change the teaching: script, pedagogy and narration are untouched.
- It does not mix styles within one lesson.

**To confirm:** yes or no to P-1 as described. And do you want the Studio brand-kit screen in P0, or the
engine and CLI first?

---

## Addendum 2, 2026-09-30 (R-9): decided and built
- **P-1: YES** (D-32), with the Studio screen in the first version (D-33).
- **Built as described,** with these changes found while building:
  - the logo band rule and the dark variant or plate (D-34);
  - brand contrast gated per style (D-35);
  - restyle keeps narration and runs a quick check (D-36).
- **Out of P0:** a per-course style lock and per-style colour overrides (L-67).

See `docs/BRANDS.md`.


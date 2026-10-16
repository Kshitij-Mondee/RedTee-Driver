# Direction per style: how Loom should storyboard isometric, hologram, screencast and the rest (2026-10-16)

STATUS: DESIGN (2026-10-16). Nothing built. Kshitij asked: "I think the director and the entire storyboarding to some
extent will be different for each of these styles... how does LOOM tackle that?? Do we have different directors for
each of these style? or do we have like a better way of handling it?" Method: a brainstorm loop (diverge, cluster,
stress-test, converge), a critique loop on the survivor, and a design critique of the three new lab strips as Chrome
rendered them.

UPDATE (later 2026-10-16, D-189, L-475): a first slice is built: a short direction card per engine style
(`packs/direction/<style>.md`) read by the outline and storyboard planners in Relay and Shuttle, the schema's `hero3d`,
and two soft storyboard warnings (`holo_no_hero`, `bp_one_layout`). Not built: the structured module (registers as
data, `stage` block, engine storyboard lint, critic checklist, memory), golden storyboards and code directors.

## 1. How Loom handles it today (read from the code)

- **One director and one storyboard for every style.**
  - The brief role (`lnd-creative-director`) decides what the video is.
  - Then `storyboard_outline` plans the beats, and `storyboard` stages them.
  - Their role cards (`loom/agents/roles/storyboard_outline.md`, `storyboard.md`) preload generic craft notes:
    visual storyteller, explainer craft, STORYBOARD_GUIDE.
- **Style knowledge arrives only on request.** The agent must call `get_style_pack()`, which returns:
  - the pack;
  - the whole style guide (`guide_text`, 20 to 65 KB);
  - for an engine style, the engine guide (`engine_text`) and a one-line `engine_note` (made per engine today; it
    served the whiteboard wording to every engine until this morning).
- **Nothing checks that a storyboard used its style's grammar.**
  - The storyboard gate is style-neutral.
  - The density limits written in each engine guide (at most 1 detail beat in 3, 7 pins, 4 dimensions) are prose
    only.
  - The critic judges frames, not the plan.
- **Each style already carries its direction, as prose.** Guide sections 17 to 21 (registers, camera grammar, native
  moves, variation space) and each engine guide's planning section and beat recipes.

So the direction exists, but it reaches the planner late, too long, unchecked, and as a tool call the planner may
not make.

## 2. Brainstorm

**Ideas (15, unjudged at this stage):**
1. Keep one director and one storyboard; the style comes from the guide on request (today).
2. A director agent per style.
3. A director per style family: board worlds, interfaces, story scenes, editorial slides, process media.
4. A **direction module** per style: a small, structured file that is injected automatically. It holds:
   - the registers and their share of the lesson;
   - the shot vocabulary;
   - beat recipes;
   - density limits;
   - the plan shape;
   - what the style cannot show.
5. **Two passes:** a style-neutral teaching plan, then a style staging pass.
6. **A plan shape per engine:** the storyboard declares its board, app shell, sheet or HUD in a `stage` block that the
   engine's own schema validates.
7. **An engine storyboard lint:** each engine checks the plan (density, register share, camera budget, a shell
   declared) at the storyboard gate.
8. **A style critic rubric:** the guide's polish checklist and failure modes go to the critic.
9. **Golden storyboards:** one or two rated exemplar storyboards per style as references.
10. **A style chooser:** the brief proposes a style from the content (software lessons suit screencast), and the
    person decides.
11. **Mixed-style lessons:** a style per chapter (screencast for the how, isometric for the system), with a join.
12. **Code directors:** the engine stages the routine parts from the plan by rule (a procedure becomes a walkthrough,
    stations become a camera path), and the model edits them.
13. **Style memory:** what Kshitij's ratings taught about a style, appended and fed to its storyboards.
14. **A direction card:** 1 to 2 KB per style in the prompt instead of 50 KB of guide.
15. **A style animatic:** the plan previewed in the style's own register before scenes are written.

**Clusters, by mechanism:**
- **Who directs:** 1, 2, 3.
- **What the director knows, and when:** 4, 9, 13, 14.
- **How the plan is shaped:** 5, 6, 11, 12.
- **How it is checked:** 7, 8, 15.
- **Which style:** 10.

## 3. Stress test

**A director per style (idea 2): cut.**
- **Demand:** the parts that differ by style are staging and camera, not what to teach. The teaching plan, the
  grounding and the narrator are style-independent by design (rules 1 and 11).
- **Second order:**
  - 17 directors drift apart in pedagogy and voice;
  - every pedagogy fix must be made 17 times;
  - each new style needs a new agent.
- **Repair tried:** making them "stagers only". That is idea 5, so it merges into the survivor.

**Family directors (idea 3): cut as directors, kept as a grouping.**
- **Feasibility:** the families blur. Blueprint is both a board and a drawing; hologram is both an interface and a
  diagram.
- **Kept:** useful for sharing recipes between styles, so it lives on inside the modules (a module may extend a family
  module).

**A direction module plus two passes plus an engine lint (ideas 4, 5, 6, 7 and 14 together): survives.**
- **Demand:**
  - R-63 measured that a style-native build costs less: the engine arm was 32 % cheaper and preferred;
  - the recurring complaint is lessons that read as slides (D-99);
  - Kshitij asked for direction per style in so many words.
- **Feasibility:** Loom already has both passes. The outline is the teaching plan and the storyboard is the staging.
  The engines exist and their guides already hold the content of a module.
- **Second order:** a third home for direction knowledge (guide, engine guide, module) risks drift. Repair: the
  module is the single source; the guides render from it or point to it, and `context_check` compares them.
- **Graveyard:** the storyboard role card has a token budget (D-163 kept its reuse rule out of the card for that
  reason). Repair: the card injected is at most 2 KB; the full engine guide stays on demand for the scene authors.

**Code directors (idea 12): survives, as a second step.**
- **Feasibility:** proven in small form. The screencast engine already frames the action and its reaction itself, and
  the isometric engine places pins itself.
- **Risk:** sameness, every lesson staged alike. Repair: the code proposes a default staging that the storyboard
  agent may change, and the variety ledger (D-79) watches for repetition.

**Style memory (idea 13): survives, cheaply.** One appended file per style, read by the module.

**Style chooser (idea 10): survives, separately.** It changes the brief, not the storyboard; it is listed and not
designed here.

**Mixed styles (idea 11): deferred.**
- **Demand:** real; a software lesson often needs one system picture.
- **Feasibility:** the runtime loads one pack per lesson today, so this is a large change. Revisit after the module
  works.

## 4. The recommendation: one director, a direction module per style, checked at the gate

```
brief (one director: what the video is)            unchanged
  -> knowledge, pedagogy, script                   unchanged
  -> storyboard_outline (the teaching plan)        + the style's CAPABILITY card: what it can show and its register
                                                     budget; each beat gets a register (teach or detail) and a teaching job
  -> storyboard (the staging)                      + the style's DIRECTION card injected (2 KB): shot vocabulary,
                                                     recipes, density, plan shape; a `stage` block (board, app shell,
                                                     sheet, HUD) validated by the engine's schema
       gate: the engine's storyboard lint          + density, register share, camera budget, stage declared
  -> kit                                           builds the stage once (the board, the shell, the sheet)
  -> scenes                                        engine guide in full, as today
  -> critic                                        + the style's polish checklist and failure modes
```

**A module is one file per style,** `packs/direction/<style>.json`, plus an optional family file it extends. It holds:
- `capability`: what the style can and cannot show, in 5 to 10 lines;
- `registers`: each register with its purpose, its share of the lesson (for example detail at most 1 in 3) and the beat
  jobs it serves;
- `shots`: the camera grammar as data (each move with what it says and when to use it);
- `recipes`: beat recipes per common topic, each a short list of steps that name engine calls;
- `density`: limits, as numbers;
- `stage`: the plan shape (board, shell, sheet or HUD) and its JSON schema;
- `lint`: the rules the gate runs, as data;
- `critic`: checklist items;
- `memory`: what ratings taught.

Both Relay and Shuttle read it through the shared task builder and tools.

**What changes in code:**
- **Direction cards:** a loader and the two card renderers (capability and direction); `get_style_pack` returns the
  card first and the guide second.
- **Schema:** the `stage` block in `storyboard.schema.json`, validated per engine.
- **Gate:** `loom/checks/gates.py` calls the engine's storyboard lint.
- **Kit:** the kit task builds the declared stage.
- **Critic:** the critic receives the checklist items.
- **Modules:** five to write first (whiteboard, blueprint, isometric, hologram, screencast), from their guides; the
  other styles get a family module.

**Second step: code directors.**
- Screencast first: a procedure list becomes a default walkthrough.
- Then isometric: stations and a route become a default camera path.

## 5. Critique of the recommendation (critique loop)

**What it is for:** each lesson is staged in its style's native grammar, while one director keeps the teaching plan and
grounding consistent, at equal or lower cost.

**Major (1): the outline is not truly style-neutral.**
- The assumption that teaching can be planned before staging is only partly true: a screencast lesson's beats follow
  the software's procedure, and an isometric lesson's follow the system's topology.
- **Fix (already in the design):** the outline receives the capability card and plans registers, not shots.
- **The cheapest test:** outline one software topic with and without the card, and count the beats the storyboard has
  to restructure.

**Major (2): nothing would prove the staging used the style.**
- Without a check, agents fall back on generic templates; this was seen before the whiteboard engine.
- **Fix:** the engine storyboard lint, plus one golden storyboard per style, plus the variety ledger.
- **Proof that the lint can fail:** a storyboard in the screencast style with no app shell, or more than 1 detail beat
  in 3, must be refused.

**Major (3): direction knowledge would live in three places.**
- The guide sections 17 to 21, the engine guide and the module.
- **Fix:** the module is the source. The guide's direction sections and the engine guide's planning section are
  generated from it, or reduced to a pointer, and `context_check` fails on disagreement (as it does for palettes).

**Minor:**
- Prompt cost: cap each card at 2 KB and measure it.
- Mixed-style lessons are not covered (deferred, section 3).
- The style chooser is a separate design.
- Existing lessons are untouched: the module applies to new lessons only.

**Strengths to protect:**
- one director owning what the video is;
- pedagogy first;
- engines as code, not prompts;
- gates that can fail;
- both pipelines sharing one task builder.

**Verdict:** build it, in the order given in section 7.

## 6. Design critique of the three new lab strips (direction lens, Chrome renders of 2026-10-16)

**Isometric (`iso_lesson`)**
- **First impression:**
  - one board that the lesson lives on, with a clear subject;
  - the strongest storytelling of the three;
  - the opening frame (2.2 s) is about 70 % empty board.
- **Hierarchy:** the right things lead (the tracked request, the tally). The pins are small next to the objects.
- **Moderate:**
  - **The opening.** Open closer: frame the first station at about 1.6x, then pull back as stations are added. That
    is a camera-path rule for the module.
  - **The data-centre hall at 10.8 s** is a plain grey box before its cutaway, and it reads as unfinished. A facade
    (doors, roof units, a sign plate) belongs in the object library.
  - **The tally's tick icons** don't read as "requests". The module's recipe should name the icon from the noun.
- **Works:** focus and context, the strata pins, and a calm return to teaching.

**Hologram (`holo_lesson`)**
- **First impression:** restrained, legible, and adult.
- **Moderate:**
  - **Briefing frames are top-heavy:** the content ends about 60 % down the frame. Briefing should centre vertically
    above the caption band (a layout rule in the engine).
  - **The push-through at 15.6 s** crops the title mid-word ("il, three hundred inboxes"), which reads as an error.
    Fade the title first, or keep it out of the near layer.
  - **The globe has no land,** so the positions of relay, HQ and sender look arbitrary. Add a faint continent outline
    from the geo data Loom already has (`runtime/geo.js`).
- **Fixed today:** the WARN tags (`tight_inset`) and the block caret that covered the letters it had passed.

**Screencast (`sc_lesson`)**
- **First impression:** the most finished of the three; it reads as real software training.
- **Moderate:**
  - **The tour register at zoom 1** puts table text at about 14 px on a phone. Tours could sit at 1.15x, or name fewer
    regions bigger. Watch it in the first lesson.
- **Fixed today:**
  - the zoomed frames sliced the KPI cards under the chapter pills; the engine now eases the zoom (`sc_zoom_eased`),
    and a page-coloured band sits behind the pills;
  - the status pills (`tight_inset`).
- **Works:**
  - one held shell;
  - the action and its reaction framed together;
  - the time-lapse tag;
  - the chapter card.

## 7. Next steps (waiting on Kshitij's go-ahead)

1. Write the five direction modules from the existing guides, and the loader, the cards and the schema `stage` block.
2. The engine storyboard lint, proven red on a planted storyboard.
3. One golden storyboard per engine style, from the lab scenes.
4. Measure:
   - one new lesson per style, comparing cards with no cards, on the plan's restructuring, the critic findings, the cost
     and Kshitij's rating;
   - within one style only (D-122).
5. Code directors: screencast first, then isometric.

# Does Loom's direction adapt to each style? An honest assessment (2026-10-16)

STATUS: ASSESSMENT (2026-10-16, evening). Read from the code as it stood at commit 163459e plus the uncommitted D-194
work in the tree. Kshitij asked: "sincerely assess if the skills and direction rules and storyboarding really adapt
nicely to different styles like hologram, screencast, isometric, kurzgesagt, ted-ed style and whiteboard style
because they all are different and unique ... they are supposed to show stuff differently and visualization needs to
be better for each of them."

Each style is judged against its own purpose, never against another style (D-122). "Kurzgesagt-like" means the
packs `flat-cosmos` and `glow-flat`; "TED-Ed-like" means `story-cartoon`. Loom studies those channels and never copies
them.

## Verdict in one paragraph

Loom has moved from "one director for every style" (this morning) to "one director, told each style's way of
showing". The planning layer now adapts reasonably for the five engine styles. Below the plan it does not: the
shared templates and most assets look the same in every style, the voice is never matched to the style, the brief is
written without knowing the style, and the Kurzgesagt-like and TED-Ed-like styles get only a 2 KB essence. Those two
styles depend most on bespoke pictures and characters, so they are the least supported. The adaptation is real in
the prompts and thin in what actually draws the frame.

## What adapts today (checked by reading and running, this session)

| Layer | Adapts per style? | Evidence |
|---|---|---|
| Style essence (D-192) | yes, all 17 packs | `packs/essence/*.json`: how the style explains, its techniques, its vocabulary, what it avoids, its fit per kind. Reaches script, outline, storyboard and critic (`conductor.py` 311, 334, 510; Shuttle `launch.py` 609). |
| Direction cards (D-189) | 5 engine styles only | `packs/direction/{blueprint,hologram,isometric,screencast,whiteboard}.md`; `direction.card_for` returns nothing when the style has no engine. |
| Engines (D-175) | 5 styles | `runtime/engines/*.js`: whiteboard, blueprint, isometric, hologram, screencast. |
| Storyboard checks | 2 styles, plus a share rule | `holo_no_hero`, `bp_one_layout` (warnings); `style_borrowed` when a distinct style puts more than 30 % of its beats on shared templates. |
| Components (D-193) | partly | `styles:` scoping exists; only the five app shells declare it (all screen-like styles). |
| Brief (director) | no | `lnd-creative-director` names no style; the essence block is not given to the brief, pedagogy or persona stages (`STAGE_LINES` has script, outline, storyboard, critic). |
| Narrator voice | no | `lnd-narrator-persona` has 0 style mentions; persona choice does not read the style. |
| Motion craft skills | no | `lnd-motion-choreography-loop` 0 mentions, `lnd-motion-fit` 1, `lnd-motion-craft` 1. Motion per style lives only in the five direction cards' "Motion in this style" lines. |
| Templates (17) | no | Rendered `lab_tpl_definition` in corporate-clean, hologram, isometric and story-cartoon: the same layout, only colours and fonts change. `runtime/templates/*.js` contain no `engine` reference, so in a whiteboard or blueprint lesson a template beat is not drawn by the hand or the pen. |
| Critic | thin | generic rubric plus one essence line ("judge whether each beat looks like this style"); no per-style checklist. |
| Golden storyboards | none | no reference storyboard per style for the planner to imitate. |
| Characters | thin | `assets/rigs/maya.json` (one rig) and Open Peeps. |

## Per style

### Hologram: adapts well at the plan level
- **Good:** engine, card, essence, the hero rule (D-194: at least one hero per 8 beats), `hero3d` in the schema.
- **Gaps:**
  - A borrowed template in a console still reads as a slide in cyan.
  - The 3D hero library limits which subjects get a real hero.
  - The voice should brief like an operator (calm, present tense, short readouts), and nothing asks for that.
- **Unverified:** no composed hologram lesson has been rendered to MP4 and rated after the fixes.

### Screencast: adapts well for teaching, poorly for selling
- **Good:** engine, card, five app shells, tour versus walkthrough, the pointer and zoom rules.
- **Gaps:**
  - The card is written for software lessons: "Not this style: no real product's logo, chrome or palette".
  - That is right for a generic lesson and wrong for a company showing its own product, which has no path today
    (no product kind; see `skills/product/product-explainer`).
  - Every shell shares one look family, so the viewer cannot tell that two lessons show two products.

### Isometric: adapts at the plan level, assets are the limit
- **Good:** engine, card, diorama, tallies, height cues, the scale reveal.
- **Gaps:**
  - People on the board are engine primitives, not designed isometric figures.
  - There are no isometric prop sets beyond the engine's own blocks.
  - Templates on an isometric lesson drop out of the board entirely, which breaks "one board is its grammar".

### Whiteboard: the grammar is planned, but templates break it
- **Good:** engine, card, the board grows within a section and is wiped between sections, Open Peeps for people.
- **Gaps:**
  - Whiteboard is a "simple" style (template share 0.3), so templates are expected. A template beat appears fully
    formed instead of drawn, which is the one thing this style must never do.
  - I found no plan-level check that ties a line's length to the time its drawing takes (searched the storyboard
    gate and the whiteboard card; the engine may still stretch strokes at render, unverified).

### Kurzgesagt-like (flat-cosmos, glow-flat): the weakest support relative to need
- **Good:** essence with real techniques that map to real calls (`Loom.morph`, `Loom.data.flood`, `Loom.glow`), a
  study in `docs/research/kurz/`, and the `glow-flat` guide.
- **Gaps:**
  - No engine, no direction card (cards need an engine), and no style guide for `flat-cosmos`.
  - The look is carried almost entirely by bespoke scenes, so quality depends on each scene author improvising a world.
  - The scale journey (the signature move) has no builder: it is "nested stations and a zoom join" assembled by hand
    each time.
  - Personified agents need a designed cast in this style; there is none.
  - The voice should be wry and wonder-first, and nothing asks for it.

### TED-Ed-like (story-cartoon): planned as a story, built without its actors
- **Good:** essence (acted scene, thought bubble, before and after, stepped time), guide, the 96-film TED-Ed study,
  `Loom.treat.bubble`, `Loom.stepped`.
- **Gaps:**
  - The style is people acting, and there is one designed rig. Every other character is improvised or missing.
    This blocks the style more than any prompt does.
  - The narrative form (a protagonist, a question, a turn) comes from the kind of video (`story.STORY_FORM`), never
    from the style.
  - Without a direction card, the outline is not asked to cast the film or to plan the before-and-after replay.
  - The narrator should tell a story, not brief.

## What would make each style show things its own way (ranked by effect)

1. **Templates per style, drawn by the style.** Give each engine a "paint" hook for templates: the whiteboard hand
   draws the template's strokes, the blueprint pen inks it, isometric places it as a board on the plane, hologram
   projects it as a panel with a scan. For non-engine styles, add per-style template variants where the essence's
   `avoid` list says the neutral one is wrong (story-cartoon: a template becomes a prop in the set: a note on a
   desk, a sign on a wall). This is the largest visible gap.
2. **Direction cards for the non-engine distinct styles.** Write cards for `flat-cosmos`, `glow-flat`,
   `story-cartoon`, `cinematic-dawn` and `cinematic-noir`, and let `card_for` serve a card without an engine. This
   is a small change with a large effect on planning.
3. **Style reaches the brief and the voice.** Add `brief` and `persona` to `essence.STAGE_LINES`, and add a
   `voice` field to each essence (operator, storyteller, wry guide, colleague at a whiteboard) that the persona stage
   reads.
4. **Builders for the signature moves without one:** the scale journey (flat-cosmos), the acted before-and-after
   (story-cartoon), and a drawing-time budget check for whiteboard.
5. **Casts per style.** Characters stay the bottleneck for story-cartoon and flat-cosmos. Commission them through
   `lnd-character-design` and Claude Design, not scene code.
6. **One golden storyboard per distinct style,** from an approved lesson, preloaded as the planner's example.
7. **A per-style critic checklist** drawn from each card's "Not this style" and each essence's `avoid`.
8. **A product line on the screencast card** and the `product` kind (built today, see below).

## What was built today in response

- The product explainer skill and the `product` kind of video: `skills/product/product-explainer/`,
  `packs/genres/product.md` and the profile in `loom/genre.py`. This is separate from teaching and explainer.
- Items 1 to 7 above are proposals. They wait for Kshitij's go-ahead, like the earlier style-direction design
  (`docs/strategy/2026-10-16-style-direction.md`).

## Unverified

- No lesson in any of the six styles has been composed and rendered to MP4 since D-189 to D-194, so whether the
  cards and essences change the films (rather than the plans) is not measured.
- Whether a template beat inside a whiteboard lesson appears all at once was read from the code (no `engine` reference
  in `runtime/templates/`), not seen in a rendered frame.

# Skills comparison: what public storyboard, explainer and teaching skills have that Loom could borrow (2026-10-16)

STATUS: STUDY 2026-10-16. Research only. No other file changed. Requested by Kshitij: "for more skills, search them,
find them. Compare all these skills and see if our storyboarding skills are missing something that we can borrow."

**Stance.** Every source below is a reference for understanding and L&D fit, never a benchmark, and nothing is copied.
Pages were read only (WebSearch, WebFetch); nothing was downloaded, cloned or installed. Loom's direction stays its own:
corporate adults, not teacher-like; classic and new ways both kept, the person chooses; styles are never compared with
each other (D-122), so every proposal that touches style works WITHIN one style.

**What was read in Loom:** `skills/lnd/*/SKILL.md` (all eleven; lnd-visual-design and lnd-motion-fit by section),
`skills/lnd/lnd-creative-director/reference/genres/*.md` and `project-interview.md`,
`skills/lnd/lnd-learning-pedagogy/reference/teaching-plan.md`, `docs/STORYBOARD_GUIDE.md`,
`loom/agents/roles/storyboard_outline.md`, `storyboard.md`, `script.md`, `packs/direction/*.md` (blueprint, hologram,
isometric, screencast, whiteboard), `packs/genres/*.md`, and the earlier `docs/research/2026-10-02-explainer-skill-study.md`.

**Headline.** Loom is already deeper than every public skill found on shot grammar, joins, reveal order, motion,
cognitive load, recall budgets and grounding. Most public skills are thin (a five-step workflow and a template). The
gaps are narrower and specific: Loom has no map from "what question is this beat answering" to "which picture answers
it"; only five of seventeen styles have a direction card that says how that style explains; there is no step that
generates several visual metaphors before choosing one; the explainer has one fixed arc where public skills offer
several shapes; the animatic is never read with the sound off; and the teaching side lacks subgoal labels,
consequence-first checks and a traceable list of what the viewer should be able to say afterwards.

---

## 1. Sources (23)

Public agent skills (SKILL.md and their references):

| # | source | one line |
|---|---|---|
| S1 | [alexknowshtml/claude-skills `teach`](https://github.com/alexknowshtml/claude-skills/blob/main/teach/SKILL.md) | Socratic session-review tutor: concrete checklist in problem, solution and context groups; one targeted question at a time, never multi-part; a miss is explained then re-asked in a new form; "why" drilling; depth levels (eli5, eli14, intern); multiple choice with the correct position rotated and hidden; a teach-someone-else mode. |
| S2 | [inbharatai/claude-skills `explainer-writer`](https://github.com/inbharatai/claude-skills/blob/main/skills/explainer-writer/SKILL.md) | Thin: names analogies, Feynman and layered explanations but defines none of them. Useful only as the label for "layered explanation". |
| S3 | [adithya-s-k/manim_skill `manim-composer`](https://github.com/adithya-s-k/manim_skill/tree/main/skills/manim-composer) (SKILL via [mcp.directory mirror](https://mcp.directory/skills/manim-composer)), [`narrative-patterns.md`](https://github.com/adithya-s-k/manim_skill/blob/main/skills/manim-composer/references/narrative-patterns.md), [`visual-techniques.md`](https://github.com/adithya-s-k/manim_skill/blob/main/skills/manim-composer/references/visual-techniques.md) | Idea to scenes.md plan before code. Six explainer narrative patterns (mystery, build-up, two perspectives to unity, wrong to less wrong to right, specific to general, history); transform rather than replace; colour as meaning; position as meaning; a named rhythm "fast-fast-SLOW"; asks the requester whether they have a visual metaphor in mind. |
| S4 | [NousResearch/hermes-agent `manim-video`](https://github.com/NousResearch/hermes-agent/blob/main/skills/creative/manim-video/SKILL.md) | Plan names the misconception corrected and the aha moment; geometry before algebra; opacity tiers (primary 1.0, context about 0.4, structure about 0.15); pause after every reveal; per-scene variation of dominant colour, layout and entry inside one palette; SCAMPER and assumption reversal for creative divergence on request. |
| S5 | [calesthio/OpenMontage explainer pipeline](https://github.com/calesthio/OpenMontage/tree/main/skills/pipelines/explainer): [`scene-director.md`](https://github.com/calesthio/OpenMontage/blob/main/skills/pipelines/explainer/scene-director.md), [`script-director.md`](https://github.com/calesthio/OpenMontage/blob/main/skills/pipelines/explainer/script-director.md) | Five-aspect scene record (subject, subject motion, scene, spatial framing, camera, with explicit N/A; silent omission named as the main failure); named visual technique library; anti-slideshow variety rules; script sections linked by "therefore / but", never "and then"; enhancement cues every 8 to 10 s; analogies must not introduce a false claim. |
| S6 | [Alisa0808/vox-director](https://github.com/Alisa0808/vox-director/blob/main/SKILL.md), [`references/beat-layer.md`](https://github.com/Alisa0808/vox-director/blob/main/references/beat-layer.md) | Paper-collage explainers: 14 named arcs with a topic-to-arc heuristic (how_it_works, man_in_hole, myth_buster, timeline...); nine hook types; each beat as two shots (establishing wide with headline, then a detail cut-in); camera move and element motion as separate axes; no two adjacent beats share a camera move; static saved for the payoff; move-rhythm presets per arc; a look bake-off picked by eye. |
| S7 | [heygen-com/hyperframes `hyperframes-creative`](https://github.com/heygen-com/hyperframes/blob/main/skills/hyperframes-creative/SKILL.md), [`references/beat-direction.md`](https://github.com/heygen-com/hyperframes/blob/main/skills/hyperframes-creative/references/beat-direction.md), [`motion-graphics`](https://skills.sh/heygen-com/hyperframes/motion-graphics) | Each beat starts as a two or three sentence concept (world, driving metaphor, feeling), then mood references, then one motion verb per element grouped by physical character, at least two depth layers, a declared rhythm string per film, centrepiece transitions rationed to one or two, velocity-matched cuts. "This isn't a slide, it's a moment." |
| S8 | [nexu-io/open-design `create-video-storyboard`](https://github.com/nexu-io/open-design/blob/main/plugins/spec/examples/create-video-storyboard/SKILL.md) | Thin (26 lines): clarify, beat sheet, prompt pack, shot list with motion, camera, type and audio notes, critique for feasibility. Confirms the common skeleton; nothing new. |
| S9 | [neurofoo/agent-skills `feynman`](https://github.com/neurofoo/agent-skills/blob/main/feynman/SKILL.md) | Explain plainly, then a gap table (vague part, what was said, the open question) and a jargon list marked "can it be said simply?", fill gaps, refine the analogy, three takeaways and a 30-second version. |
| S10 | [socratic-teaching-scaffolds (lyndonkl)](https://github.com/majiayu000/claude-skill-registry/blob/a9dde03250f2a2e4b45a3af84ba5d81a032637e9/skills/design/socratic-teaching-scaffolds-lyndonkl-claude/SKILL.md) | Question ladders; five scaffold levels from full modelling down to transfer (teach others, spot misconceptions in others' work); prediction, surprise, explanation for misconceptions; a depth ladder (plain, functional, precise) with the learner choosing the entry point. |
| S11 | [obra/superpowers `brainstorming`](https://github.com/obra/superpowers/blob/main/skills/brainstorming/SKILL.md) | One question per message, open first, options only when stuck; alternatives weighed privately and shown only when they help the person decide; play back in short chunks with guesses labelled as guesses. |
| S12 | [anthropics/skills `canvas-design`](https://github.com/anthropics/skills/blob/main/skills/canvas-design/SKILL.md) (repo checked: no video, storyboard or teaching skill) | A short written design philosophy before any picture; refine what is there rather than add more. |
| S13 | [nolanx-ai `shot-size-and-angle-language`](https://tessl.io/registry/skills/github/nolanx-ai/nolanx.ai/shot-size-and-angle-language) | Angle meanings (low: power; high: vulnerability, surveillance; eye level: neutral; overhead: pattern, tactics; canted: instability); every shot change needs a dramatic reason; keep screen direction across cuts. |

Published methods and practice:

| # | source | one line |
|---|---|---|
| S14 | [Bret Victor, Up and Down the Ladder of Abstraction](http://worrydream.com/LadderOfAbstraction/) | Run one concrete case; step up by showing all values of a variable at once (the whole trajectory, a grid of cases); step down by pointing at one point of the abstraction to see that case; insight lives in the moves between levels. |
| S15 | [Nicky Case, Explorable explanations: 4 more design patterns](https://blog.ncase.me/explorable-explanations-4-more-design-patterns/) | Puzzle it out, place your bets (commit to a prediction, then see the data), role play a dilemma, sandbox last after the parts are known; questions before answers. |
| S16 | [Kurzgesagt, Our video process](https://kurzgesagt.org/youtube/) | Research and about a dozen script drafts, then a dedicated sketch phase to find the best visual metaphor for each scene and decide which scenes get the most attention, then illustration; the voice sets the animation timing. (Loom already studied their frames: `docs/research/2026-10-01-kurzgesagt-study.md`.) |
| S17 | [3Blue1Brown, SoME announcement](https://3blue1brown.com/blog/some1) and [SoME1 results](https://3blue1brown.com/blog/some1-results) | Four criteria: clarity (jargon explained, goals graspable with little background), motivation (why care within 30 s), novelty (a common topic explained better counts), memorability (recalled weeks later); a single visual intuition can carry a whole piece. |
| S18 | [Dan Roam, The Back of the Napkin (summary)](https://www.antoinebuteau.com/lessons-from-dan-roam/) | Six ways of seeing, each with one picture: who/what as a portrait, how much as a chart, where as a map, when as a timeline, how as a flowchart, why as a multi-variable plot. Look, see, imagine, show. (Secondary summary; the book was not read.) |
| S19 | [Scott McCloud's panel transitions (commentary)](https://www.hoodedutilitarian.com/tag/understanding-comics/) | Moment-to-moment (one instant slowed), action-to-action, subject-to-subject (same scene, new subject), scene-to-scene, aspect-to-aspect (facets of one moment or mood); closure is what the reader fills in between panels. (Secondary sources.) |
| S20 | [Cathy Moore, eager feedback](https://blog.cathy-moore.com/scenario-mistakes-to-avoid-1-eager-feedback/) and [mini-scenario posts](https://blog.cathy-moore.com/?p=1466) | Show, don't tell: each choice plays out as a realistic consequence instead of "Correct!" or "Incorrect"; a mini-scenario is one scene, one choice, one consequence; if correction is needed, a coaching question rather than a verdict; trust adults to extrapolate. |
| S21 | Subgoal labels: [Margulieux and Catrambone, programming review (PDF)](https://www.raspberrypi.org/app/uploads/2020/07/Using-subgoal-labels-to-reduce-cognitive-load-in-introductory-programming.pdf), [Georgia Tech video thesis](https://repository.gatech.edu/server/api/core/bitstreams/2646e8fd-08ac-4f89-83aa-bc124c40efa8/content) | Label each group of steps in a worked example by its purpose (what it achieves), not by the action; improves applying the procedure to new problems; one video study (a thesis, not replicated) found the same effect with a worked example first. |
| S22 | [TechSmith, How to storyboard a video for workplace training](https://www.techsmith.com/blog/how-to-storyboard-a-video/) | Panel fields: visual, narration, on-screen text, annotations and cursor path, transition, accessibility notes; a new panel whenever screen, focus or instructional context changes; one primary action per panel; "if a colleague can't explain the panel back to you, add detail". |
| S23 | [StudioBinder, camera shots](https://studiobinder.com/blog/ultimate-guide-to-camera-shots/) | Shot size works with angle, framing, movement and lens; push-in focuses and builds tension; pan reveals context; static suits a performance or a line landing. |

Searched and found thin or unreachable: `inference-sh/skills explainer-video-guide` (listing only, page 404),
ClaudSkills "explainer-video-scripter", "instructional-design", "learning-transfer-design" (registry blurbs, no
method), Remotion and HyperFrames code skills (render practice, not storyboarding), RSA Animate / Cognitive Media
(no published method beyond "repurpose drawn elements as the talk continues"), Vox (no first-party method page).

---

## 2. What each source has, against Loom

Loom already holds (so these are NOT gaps): performance first and action mapping
(`lnd-learning-pedagogy` section 1); one strategy with a mechanical signature move (section 4); worked examples,
fading, expertise reversal, refutation of misconceptions, concreteness fading, analogy with a stated breaking point
(section 6); a stopping-check budget and three recall kinds (section 8); the governing metaphor test of structural fit,
change, scale and safety (`lnd-visual-storyteller` section 1); shot grammar and stepping in (section 3); joins with
meaning, hold the layout and change its state, rest, punctuation, value script, one accent, device sets
(`lnd-visual-storyteller` sections 2 to 4, `STORYBOARD_GUIDE` "Devices, value script, accent"); fifteen explaining
moves including personify then reveal, everyday before formal, expected then actual, recap by replay
(`lnd-explainer-craft` section 1); reveal order frame, structure, focus, detail, consequence (`lnd-visual-design`
section 7); a named motion vocabulary (`lnd-motion-fit` section 2); an animatic before the build (`py -m loom
animatic`); options and alternatives so the person chooses (`STORYBOARD_GUIDE` "Options"). No public skill found does
these as thoroughly.

Per source, the techniques and where Loom stands:

- **S1 teach.** Concrete checklist of items (Loom: partial, `must_cover` in the brief and observable section goals, but
  no item-level trace to the beat that shows it and the check that covers it). One question at a time, never multi-part
  (missing as a rule for quiz cards). Re-ask a miss in a new form (partial: spacing and interleaving exist; "a new
  surface for the second ask" does not). Why-drilling (present: elaborative interrogation, section 6). Depth levels
  (partial: `audience.level`; no depth choice offered to the person). Rotated, hidden answer position (missing). Teach
  someone else (missing as a transfer form).
- **S2 explainer-writer.** Layered explanation (partial, see S10).
- **S3 manim-composer.** Six narrative patterns (partial: seven teaching strategies, but the explainer genre has one
  fixed arc). Transform, don't replace (present: hold and change, `Loom.morph`). Colour and position as meaning
  (present: accent rules, stations "right is forward, down is deeper"). Named rhythm (missing as a declared field).
  Metaphor intake question (missing from `project-interview.md`).
- **S4 manim-video.** Misconception and aha moment named in the plan (present in pedagogy; the aha is the `turn`).
  Opacity tiers (partial: "everything else grey or dimmed", `lnd-explainer-craft` section 2, without context and
  structure levels). Per-scene variation inside one palette (present: variety rules, value script). SCAMPER divergence
  (missing).
- **S5 OpenMontage.** Five aspects with explicit N/A (mostly present: `subject`, `world`, `shot`, `depth`, `light`,
  `shot.move`; no explicit "none"). Technique library (present as devices and explaining moves). Variety rules
  (present, stronger). "Therefore / but" links (missing). Analogy accuracy (present).
- **S6 vox-director.** Arc menu with heuristic (missing for explainers). Hook types (partial: five `hook.kind`s; no
  `mistake_callout` or `outcome_tease`). Establishing then detail cut-in as one beat (partial: shot steps exist, not the
  two-shot beat). Adjacent camera moves differ, static saved for the payoff, move-rhythm per arc (missing; Loom has
  "camera mostly still", which these rules can live inside). Look bake-off (present within one style as options and the
  design seed; across styles it would break D-122).
- **S7 hyperframes.** Beat concept before layout (partial: `subject` and `world`, not a feeling line). Motion verb per
  element from the content (present: `lnd-motion-fit` vocabulary and `beat_sheet`). Two depth layers (present as
  `depth`, by meaning). Declared rhythm (missing). Rationed centrepiece transitions (present: skia at most one or two).
- **S9 Feynman.** Plain version and gap table (partial: "say the point first", "name an idea only after the viewer has
  seen it" in `loom/agents/roles/script.md`; no jargon list with "can it be said simply").
- **S10 Socratic scaffolds.** Scaffold levels (present as fading and expertise reversal). Transfer by spotting faults
  in others' work (partial: only blueprint and isometric direction cards say "the check is a fault found on a sheet /
  board"; the pedagogy skill has no such check kind). Depth ladder (partial).
- **S11 brainstorming.** One question at a time with the requester, guesses labelled (partial: Loom's interview and
  seed show choices; not a rule).
- **S13 shot angle.** Angle meanings (missing: `shot` has size, no angle).
- **S14 Ladder of abstraction.** One case, then all cases at once, then back to one (missing as an explaining move;
  concreteness fading is the nearest).
- **S15 Explorables.** Place your bets (present: `pause_predict`). Sandbox last (present in spirit: pre-training
  principle).
- **S16 Kurzgesagt.** A sketch phase to find the best metaphor PER SCENE and to choose which scenes get the most
  attention (partial: one governing metaphor per lesson; hologram alone plans a hero).
- **S17 3Blue1Brown.** Why care within 30 s (present: hook and promise). Memorability (present: callbacks, bookends).
  "A single visual intuition can carry a piece" (present as the governing picture).
- **S18 Dan Roam.** Question to picture (missing; Loom's builder table in `storyboard.md` maps needs to builders, not
  the beat's question to the kind of picture).
- **S19 McCloud.** Moment-to-moment, aspect-to-aspect and closure (missing; join meanings cover scene-to-scene and
  zoom-into).
- **S20 Cathy Moore.** Consequence-first feedback, mini-scenario, coaching question (partial: "scenarios with
  consequences", section 6; but the quiz answer card is a verdict with an explanation).
- **S21 Subgoal labels.** Missing everywhere (`subgoal` has no hit in the skills).
- **S22 TechSmith.** One primary action per panel (screencast allows up to 5 actions a walkthrough beat). Explain-back
  test per panel (missing). Accessibility note per panel (missing at storyboard level; present as gates in
  `lnd-visual-design` section 8).
- **S23 StudioBinder.** Push-in for focus, pan for context (present in `lnd-visual-storyteller` section 3 and joins).

---

## 3. Gap table

Verdict: HAS (no work), PARTIAL (exists, weaker or scattered), MISSING.

### A. Making the storyboard more visual and expressive

| technique | where externally | Loom today | verdict | proposal, in Loom's words |
|---|---|---|---|---|
| Question to picture: who/what, how much, where, when, how, why each has its own kind of picture | S18 | `storyboard.md` section 4 table maps needs to builders; `lnd-explainer-craft` section 1 has moves, not the question | MISSING | Every beat names the question its line answers (`asks: who \| how_much \| where \| when \| how \| why`). Each has a picture family: who/what as the thing itself with its properties on it; how much as a quantity you can see (units, a pile, a fill), never a floating number; where as a map or a set; when as a line the camera travels; how as a mechanism running; why as forces or a cause and its effect side by side. A lesson that answers "how" with a portrait, or "how much" with an icon, is the slideshow. |
| Visual vocabulary per style (how THIS style draws each of the six questions) | S18 crossed with S7 (concept and mood per beat), S16 | five direction cards (`packs/direction/*.md`) state signature moves, not a six-question row | PARTIAL | Each direction card gains a short "how this style shows it" block, one line per question (see section 4 below). It tells the outline writer what this style reaches for, and it never ranks one style against another. |
| Metaphor divergence before choosing | S16 sketch phase, S4 SCAMPER, S3 intake | `lnd-visual-storyteller` section 1 tests one governing metaphor; no step generates alternatives per key idea | MISSING | For the lesson's world and for each `turn` beat, write three candidate pictures from different starting points (the thing personified; the thing at another scale; the thing reversed or broken; an everyday twin), test each with the four questions, keep one and record the others as `alternatives` the person can switch to. Reject any candidate that is a stock icon or a word in a box. |
| Ask the person for a picture they already have in mind | S3, S11 | `project-interview.md` has no such question | MISSING | One optional interview question: "Is there a picture, comparison or place you already use when you explain this to colleagues?" Their answer is the first candidate in the divergence, recorded `from_user`. |
| One case, all cases at once, back to one (ladder of abstraction) | S14 | concreteness fading (`lnd-learning-pedagogy` section 6) is concrete, abstract, concrete; not "many cases" | MISSING | New explaining move 16: follow one invoice, then show two hundred as dots on the same route so the pile-up at one desk appears by itself, then point at one dot and return to its story. Many cases as a held layout (a grid of small copies, a trail over time); stepping down is a zoom into one. Fits isometric, hologram, blueprint and data beats in every pack. |
| Analogy drawn as a mapping, with the break shown | S5, S9, Loom's own rule | rule exists (`lnd-learning-pedagogy` section 6, rubric line 98, `packs/genres/explainer.md`), no visual device for it | PARTIAL | A device: the everyday twin and the real system side by side, a thin line joining each mapped part as it is said, and the one line that does not hold drawn in the accent and struck. The break becomes a picture the viewer remembers, not a caveat in narration. |
| Context and structure tiers, not only "the one accent and grey" | S4 opacity tiers | `lnd-explainer-craft` section 2 ("one saturated thing; everything else grey or dimmed") | PARTIAL | Name three levels in the visual design section: what is being said now (full), what it sits in (quiet), the scaffold (faint). The faint level lets a held layout stay on screen across many beats without competing. |
| Beat-to-beat transition kinds from comics: moment-to-moment, aspect-to-aspect, closure | S19 | join meanings in `storyboard_outline.md` method 4 (into, time, era, meanwhile, shock, chapter) | PARTIAL | Add two meanings: `slow` (moment-to-moment: the key instant split into two or three beats, the click before the wrong payment goes out) for the one moment that matters; `facets` (aspect-to-aspect: three inserts of one moment, for a mood or the cost of a mistake). Add the closure rule: a step may be left for the viewer to infer only when it is obvious; the mechanism step is never skipped. |
| Camera angle with a meaning | S13, S23 | `shot.size` only | MISSING | Optional `shot.angle`: eye level by default; high for a person under pressure; low for the system that dwarfs them; overhead already exists for plans. Illustrated and cinematic packs only, and only where it carries the meaning. |
| Camera move rhythm: neighbours differ, static saved for the line that lands | S6, S7 | "the camera is mostly still" (`lnd-visual-storyteller` section 3); seed camera habit | MISSING | Inside Loom's still-camera habit: no two neighbouring moving beats use the same move (push, pan, pull); the payoff and the rule line hold still; a list pans one way; a timeline pans in one direction throughout. Write it as one line per section in the outline. |
| Declared rhythm per section (quick, quick, slow, rest) | S3, S7 | energy curve per section (`lnd-learning-pedagogy` section 7), pace per content | PARTIAL | The outline writes a rhythm line per section derived from its energy, e.g. "quick quick SLOW rest", so the animatic can be judged against it. A description, not a target. |
| Establishing wide, then detail cut-in as one beat | S6 | shot steps (wide to medium to close) across beats | PARTIAL | Allow a beat to carry two framings of the same station (wide while the place is named, closer on the part), one cut, same narration. This adds shot variety without a new world. |
| Beat concept as a feeling line, before layout | S7 | `subject`, `world` per drawn beat | PARTIAL | One optional line per `turn`, `hook` and `payoff` beat: what the viewer should feel ("the queue suddenly looks dangerous"). Only on those three roles, to keep the plan small. |
| Five aspects with an explicit "none" | S5 | subject, world, shot, depth, light, move; omissions are silent | PARTIAL | The outline's beat line says "still" when there is no camera move and "flat" when there is no depth, so an omission is a choice the reviewer can see. Low priority. |

### B. Style-specific explaining foundations

| technique | where externally | Loom today | verdict | proposal |
|---|---|---|---|---|
| Each style's own way of explaining, written down | S7 (per-project design spec), S12 (philosophy before picture), S16 | direction cards exist for blueprint, hologram, isometric, screencast, whiteboard only; twelve packs have none (story-cartoon, flat-cosmos, glow-flat, cinematic-noir, cinematic-dawn, editorial-paper, presenter-pop, corporate-clean, chalk-lab, line-art, engineering, dark-technical) | PARTIAL | Write a direction card for each remaining pack in the existing card shape (signature moves, outline, storyboard, not this style, motion, by kind of video, soft check) plus the six-question block. Start with the packs most used for explainers (story-cartoon, the saturated flat packs, cinematic-noir and cinematic-dawn, editorial-paper, chalk-lab), each built from that style's own studies in `docs/research/`. |
| The explainer and teaching variant per style | S6 (arc to move presets), Loom cards' "By kind of video" | present in the five cards | HAS for five | Keep the "By kind of video" block in every new card. |

### C. Explainer structure

| technique | where externally | Loom today | verdict | proposal |
|---|---|---|---|---|
| A choice of explainer shapes | S3 (six patterns), S6 (fourteen arcs) | `packs/genres/explainer.md` one arc: hook, what it is, how it works, why it matters, payoff | PARTIAL | Keep the current arc as the classic default and offer five more shapes the person can pick: the puzzle (a result that seems wrong, investigated, resolved); first guess, better guess, right (successive refinement, for a belief most colleagues hold); one case, then the rule (specific to general); two views of one thing (the finance view and the operations view turn out to be the same flow); before, the fall, the climb out (for a change or incident story). Each names its hook kind and where the mechanism runs. |
| Sections joined by "but" and "therefore", never "and then" | S5 | absent from `loom/agents/roles/script.md` and the craft skills | MISSING | A script self-check: read the section openers in order; each must follow from the last by "but" (a complication) or "therefore" (a consequence). An "and then" chain is a tour. The storyboard can mirror it: a "but" opener is a turn card or a state reversal on the held layout; a "therefore" opener keeps the layout and adds the consequence. |
| Hook types | S6 (mistake callout, outcome tease, pattern interrupt) | five `hook.kind`s (`lnd-learning-pedagogy` section 5) | PARTIAL | Add `mistake` (the common error, shown) and `outcome` (the finished result first, then rewind; already a Crayon habit in `lnd-visual-storyteller` section 9). |
| Plain version and jargon list | S9, S17 (clarity) | "say the point first" (`lnd-explainer-craft` section 4) | PARTIAL | Before the script, the through-line and each section's point written as one sentence a colleague from another team would follow, and a list of the terms the viewer must keep, each with the beat that shows it before it is named. |
| Layered explanation: plain, working, precise | S2, S10, S1 depth levels | everyday then formal (move 5); pre-training principle | PARTIAL | Offer the person a depth choice in the brief (plain, working, precise), the classic default being the current behaviour. Inside one beat the layers arrive in that order: the picture, the working words, the precise term on the object. |
| Acknowledge the hard part honestly | S3 (engagement) | not stated | MISSING | One narration move for the peak section: "this is the step most people get wrong", said once, as a colleague would. Not "don't worry, this is tricky". |

### D. Teaching structure

| technique | where externally | Loom today | verdict | proposal |
|---|---|---|---|---|
| A list of what the viewer can say afterwards, traced to beats and checks | S1 (checklist confirmed item by item), S9 (three takeaways) | `must_cover` (brief), observable section goals (`lnd-learning-pedagogy` section 5), narration contract (section 10) | PARTIAL | The teaching plan carries `takeaways[]`: five to ten concrete statements grouped as the problem, what to do, and when it applies. Each names `shown_in` (the beat that shows it) and, in teaching, policy and soft-skills films, `recalled_in` or `checked_in`. The script gate warns on a takeaway nobody shows. Explainers keep `shown_in` only (D-191). |
| Consequence-first checks, not verdicts | S20 | quiz answer card "reveals the answer AND explains why" (`lnd-learning-pedagogy` section 8) | PARTIAL | For practitioners, the default check is a mini-scenario: one moment at work, two or three things a colleague could do, then each choice played out as what happens next (the payment goes, the client calls back). Correction, when needed, is a coaching question ("what would have told you the sender was new?"), never "Incorrect". The classic quiz card stays as an option. |
| One question at a time, never multi-part; answer position varies; distractors are real misconceptions | S1 | quiz built as two scenes, no answer before the pause | PARTIAL | Add to the quiz rules in `lnd-learning-pedagogy` section 8 and `script.md` non-negotiable 6: one question per card; the right option is not always first or last across a lesson; every wrong option is a listed misconception or the tempting move, never a joke option. |
| Re-ask in a new form | S1 | spacing and interleaving (section 6) | PARTIAL | A later recall of an idea changes its surface: taught as a rule, recalled as a case; taught on the desk, recalled in the meeting. Never the same picture asked again. In an interactive player, a missed answer branches to a short re-explanation and a second question in a new form. |
| Spot the fault in someone else's work | S10 (transfer level), Loom blueprint and isometric cards | only in two direction cards | PARTIAL | A named check kind `spot_fault` in the pedagogy skill: a colleague's finished work (an email, a form, a board) with one mistake; the viewer finds it during the pause; the reveal circles it and plays out its consequence. Adults find this respectful and it is not a quiz. |
| Subgoal labels in worked examples | S21 | worked examples and fading (section 6); screencast step pills (`packs/direction/screencast.md`) | MISSING | Group the steps of every worked example and walkthrough into two to five stages and label each by what it achieves ("find the record", "prove who asked"), not by the click. On screen the label is the step pill; in narration it opens the group. The same labels return in the faded example and the check. |
| Teach a colleague, as the transfer | S1 teaching mode | transfer tasks and pocket rule (section 6) | PARTIAL | One transfer form: the one line you would use to brief your team on this, shown at the end as the pocket rule. Corporate and peer-to-peer, not "now you try". |

### E. Review of the plan

| technique | where externally | Loom today | verdict | proposal |
|---|---|---|---|---|
| Read the panels with the sound off | S22 (explain-back test), S7 ("a moment, not a slide") | animatic review asks whether the learning lands (`lnd-visual-storyteller` section 7; `storyboard.md` method 7) | MISSING | One animatic pass with the narration muted: for each panel, can a colleague say what the beat is about from the picture alone? A panel that only works with its words is a slide with a voice-over; it gets a picture or a stronger subject. The second pass, with sound, stays as now. |
| One primary action per panel (procedures) | S22 | screencast walkthrough beat allows up to 5 actions | PARTIAL | Keep 5 as the ceiling, and add: one action that changes the screen per reveal moment, so each change has its own word. |
| Accessibility note per panel | S22 | gates in `lnd-visual-design` section 8 | PARTIAL | Optional: what a sound-off viewer or a screen-reader user misses on this panel; the sound-off pass above produces it for free. |

---

## 4. Style explaining foundations (proposal for the missing direction cards)

The five existing cards already say how their styles explain. For the rest, a first draft of the six-question block,
to be confirmed against each style's own studies and frames before a card is written. Each line says what that style
reaches for; none of it compares one style with another.

- **story-cartoon** (studied in `docs/research/crayon/`): who/what as a labelled character with a prop; how much as the
  number on a ledger, tag or contract; where as a room or street the cast walks into; when as a flip calendar or a
  black card; how as a transaction between two desks; why as the label on the object against what it really is.
- **saturated flat packs** (flat-cosmos, glow-flat; the register measured from newer Kurzgesagt in
  `lnd-explainer-craft` section 3): who/what as one small figure in a vast field; how much as scale (the camera
  pulling out until the pile becomes a mountain); where as a journey across scale; when as the same scene redrawn,
  changed; how as a running comparison pair that returns with one new number; why as the same pose in two contexts with
  the threat swapped.
- **cinematic-noir, cinematic-dawn**: who as a silhouette or one lit face; why as light (night for risk, dawn for the
  change); where as a layered place with depth; when as a slow push across one held set; how is handed to a plainer
  insert, then the film returns to the place; how much stays rare and on a prop in the scene.
- **editorial-paper**: who/what as the real document or quote with one phrase highlighted; when as a timeline on paper;
  how much as a printed chart redrawn changed; where as a paper map; why as the claim beside its source.
- **presenter-pop**: one big diagram built in steps and returned to with new information; the pointer pill as the
  question being asked; the physical thing before the abstract one.
- **chalk-lab**: one board changed by small additions; how much exact (the number written, then reused as a symbol);
  how as the board's state changing; who/what as a running symbol.
- **corporate-clean, line-art, engineering, dark-technical**: need their own study first; until then they inherit the
  explaining moves of `lnd-explainer-craft` section 1 with no style-specific claims.

---

## 5. Top 10 to borrow, ranked

Ranked by how much each makes storyboards more visual and expressive, then by teaching and explaining value, then by
cost. Each lands in Loom's own words, with the classic way kept beside it.

| rank | what to borrow | from | target file (section) |
|---|---|---|---|
| 1 | **Question to picture.** Every beat names the question its line answers (who, how much, where, when, how, why) and draws that question's kind of picture; a lesson answering "how much" with an icon is caught at outline. | S18 | `skills/lnd/lnd-explainer-craft/SKILL.md` (new section 1a); `loom/agents/roles/storyboard_outline.md` (method step 5, beat line) |
| 2 | **Direction cards for the twelve packs without one,** each with a "how this style shows it" block of six lines. | S7, S12, S16, Loom's own cards | new `packs/direction/<style>.md` for story-cartoon, flat-cosmos, glow-flat, cinematic-noir, cinematic-dawn, editorial-paper, presenter-pop, chalk-lab first; the six-question block added to the five existing cards |
| 3 | **Metaphor divergence.** Three candidate pictures for the world and for each turn beat, from different starting points, tested by the four questions; the rest kept as alternatives; plus one optional interview question for the person's own picture. | S16, S4, S3, S11 | `skills/lnd/lnd-visual-storyteller/SKILL.md` (section 1); `loom/agents/roles/storyboard_outline.md` (method step 1); `skills/lnd/lnd-creative-director/reference/project-interview.md` |
| 4 | **The sound-off read of the animatic.** Each panel must say its point from the picture alone before the sound-on pass. | S22, S7 | `skills/lnd/lnd-visual-storyteller/SKILL.md` (section 7); `loom/agents/roles/storyboard.md` (method step 7) |
| 5 | **Explainer shapes,** offered beside the classic arc, plus the "but / therefore" check on section openers mirrored by turn cards and held-layout consequences. | S3, S6, S5 | `packs/genres/explainer.md` and `skills/lnd/lnd-creative-director/reference/genres/explainer.md`; `skills/lnd/lnd-explainer-craft/SKILL.md` (new section); `loom/agents/roles/script.md` (method) |
| 6 | **One case, all cases at once, back to one,** as explaining move 16 (with the analogy mapping board and its struck line as move 17). | S14, S5, S9 | `skills/lnd/lnd-explainer-craft/SKILL.md` (section 1) |
| 7 | **Takeaways traced to beats.** Five to ten concrete statements, each with `shown_in` and, outside explainers, `recalled_in` or `checked_in`. | S1, S9 | `skills/lnd/lnd-learning-pedagogy/SKILL.md` (sections 5 and 8); `skills/lnd/lnd-learning-pedagogy/reference/teaching-plan.md` |
| 8 | **Checks adults respect:** the mini-scenario with consequences played out, a coaching question instead of a verdict, `spot_fault` on a colleague's work, one question per card with real misconceptions as options, and a later recall in a new surface. | S20, S10, S1 | `skills/lnd/lnd-learning-pedagogy/SKILL.md` (section 8); `loom/agents/roles/script.md` (non-negotiable 6) |
| 9 | **Subgoal labels** on every worked example and walkthrough: two to five stages named by what they achieve, as the step pills and the narration openers, returning in the faded example and the check. | S21 | `skills/lnd/lnd-learning-pedagogy/SKILL.md` (section 6); `packs/direction/screencast.md` (signature moves) |
| 10 | **Join kinds and camera rhythm:** `slow` (moment-to-moment) and `facets` (aspect-to-aspect) join meanings with the closure rule; neighbouring moving beats differ in move; the payoff holds still; an optional `shot.angle` in illustrated and cinematic packs; a rhythm line per section. | S19, S6, S7, S13 | `skills/lnd/lnd-visual-storyteller/SKILL.md` (section 3, Joins); `docs/STORYBOARD_GUIDE.md` (Joins); `loom/agents/roles/storyboard_outline.md` (method step 4) |

Also worth doing, below the cut: three attention tiers (S4) in `lnd-visual-design`; the depth choice (plain, working,
precise) in the brief; the "most people get this wrong" line for the peak section; two new hook kinds (`mistake`,
`outcome`); a two-framing beat (wide, then the detail, one cut); explicit "still" and "flat" in beat lines.

---

## 6. Limits of this study

- Several sources were read through mirrors or secondary summaries (S3's SKILL.md via mcp.directory, S10 via a
  registry copy, S13 via a listing, S18 and S19 via commentary). Their substance is consistent across copies, but the
  books behind S18 and S19 were not read.
- No source was run or rendered; nothing here is a measured claim about quality. The proposals are unverified until a
  lesson is made with them and its frames are looked at (Rule 12).
- The style foundation lines in section 4 are drafts from Loom's own skills and studies, not from new frame study; each
  needs its style's frames before it becomes a card.
- Public skill registries change quickly; listings that were thin or unreachable on 2026-10-16 are named in section 1.

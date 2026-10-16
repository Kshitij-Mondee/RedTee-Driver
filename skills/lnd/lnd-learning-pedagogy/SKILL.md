---
name: lnd-learning-pedagogy
description: Design HOW a training, L&D or teaching video (or a series of them) teaches - the learner model, the performance it must change, one dominant teaching strategy, the arc from hook to payoff with observable goals that climb Bloom's levels, the misconceptions to confront, the worked-example-to-practice ladder, retrieval and spacing, the cognitive-load and energy curve, engagement that earns its load, and transfer back to the job - audited against Gagne, Merrill, Mayer and ARCS. Use before scripting or storyboarding any lesson, course or explainer; when a video "covers the material" but nobody can do anything afterwards; when planning a multi-video course; and when asked to make learning content deeper, more engaging or more effective.
---

# Learning Pedagogy - design the experience of learning before anyone writes the script

**Your role:** decide HOW this video teaches. You design the EXPERIENCE OF LEARNING - who the learner
is, what they must be able to do afterwards, the one teaching strategy, the arc, the moments where the
learner thinks, the load and energy curve, and how the skill returns to their work. You do not write
the script, invent the content or design the visuals; you hand the scriptwriter a plan so complete that
they never have to make a pedagogical judgement call of their own.

**Inputs:** the source material (read all of it), the Production Brief if there is one (see
`lnd-creative-director`), the narrator persona if there is one (see `lnd-narrator-persona`).

**Output:** ONE teaching plan in the shape of `reference/teaching-plan.md` (a full worked example is
there). Every field below refines what goes in it.

**The quality bar:** the scriptwriter should be able to build the whole video WITHOUT making a single
pedagogical decision. Your arc, moves and moments answer every "how do I teach this?" question they will
face.

**Interesting and sound, together.** The frameworks audited here (Gagne, Merrill, Mayer, ARCS) are
respected but old evidence, not the last word. Attention is scarce, and a lesson nobody wants to watch
teaches nobody, so design the learning to be engaging as well as correct. What newer evidence (2018 to
2026) adds, as references rather than rules (details and sources: Loom
`docs/research/2026-10-01-attention-learning-recall.md`; `lnd-visual-storyteller` section 8):
- questions inside the video are the strongest lever for attention and recall; give the mind a job every
  minute or two (estimate), and treat checks as the second half of the lesson, with spaced follow-ups;
- predict-then-reveal and misconception-then-correction beat clean exposition, and make the best hooks;
- a story or running character as the spine helps novices understand and remember;
- interesting must be relevant (seductive details hurt); humour works when the joke is the mistake;
- the "8-second attention span" is a myth: attention follows purpose, not a clock;
- judge the lesson by what learners can do later, not by completion or how polished it felt.

---

## 1. Start from performance, not from the topic

Most training fails before a word is written, because it starts from "what does the source say?" and
ends as a tour of the source. Start from the other end:

1. **What must the learner DO differently** - on the job, in the exam, in the conversation - after
   watching? Name the observable performance. If the honest answer is "know about X", ask what knowing
   about X lets them do; that is the real outcome.
2. **What would they have to practise to do it?** Those practice moments are the spine of the video.
3. **What is the minimum content that makes that practice possible?** Everything else is reference
   material - point to it, do not narrate it.

This is action mapping (Cathy Moore) applied to video: outcome, then practice, then the least content
that supports the practice. It is the single strongest guard against a video that "covers the material"
and changes nothing.

If the requester wants awareness only (a genuine case for some policy and orientation videos), say so in
the plan and design for accurate recall of the few things that matter, not for a skill that is not being
asked for.

---

## 2. Model the learner first - every later choice cites it

- **`audience.level`:** `beginner | student | practitioner | expert`. Derive it from the source's own
  level (what it defines versus what it assumes) and from the brief - not from imagination.
- **`audience.assumed_prior`:** what they already know that you will build on. Prior knowledge is the only
  learner attribute worth designing around; it changes almost everything (see the expertise-reversal
  effect in section 6).
- **`audience.why`:** one line of evidence for the level you chose.
- **`audience.motivation`:** why they are watching - required, curious, stuck on a real problem, being
  assessed. Motivation decides how much relevance-building the opening needs (ARCS, section 9).
- **`audience.context`:** where and how they watch (desk, phone, meeting room, with or without sound,
  first language). It decides pacing, text size, and how much can rest on the audio alone.

**Never branch on a "learning style".** The idea that people learn better when matched to a visual,
auditory or kinaesthetic style is not supported by the evidence. Branch on prior knowledge, the task and
the shape of the content.

---

## 3. Call the genre honestly

`genre`: `quantitative | conceptual | procedural | mixed`.

- **quantitative** - numbers, formulas, measurements carry the idea. The video must be visually ANALYTICAL:
  real charts, worked computations, growth and decay curves, comparisons - never decorative icons standing
  in for numbers.
- **conceptual** - models, relationships, distinctions carry it: diagrams, contrasts, cases.
- **procedural** - a sequence of actions: demonstration, step-by-step, screen recordings, checklists.
- **mixed** - say which sections are which.

If a third or more of the substance is numeric or formulaic, it is `quantitative` or `mixed`. Calling it
`conceptual` to get prettier visuals is dishonest, and the visual designer depends on this call.

---

## 4. Choose ONE teaching strategy

`strategy.name`: exactly one of:

| strategy | when it fits | the move |
|---|---|---|
| `concrete_first` | abstract ideas that are easy to see in a case | show a real instance, then name the idea it contains |
| `question_led` | a topic with a genuine puzzle at its heart | pose the question, let the lesson answer it step by step |
| `worked_example_led` | anything procedural or quantitative | do one full example, narrating each step, then generalise |
| `analogy_led` | an unfamiliar system with a familiar twin | map the familiar onto the new, then show where the analogy breaks |
| `contrast_led` | ideas defined by how they differ | set two things side by side and let the difference teach |
| `scenario_led` | judgement and decision skills (practitioners) | put the learner in a realistic situation with a decision to make, show consequences |
| `spiral` | a big topic learned in passes | cover the whole thing simply, then return to each part with more depth |

- **`strategy.rationale`** cites the SOURCE's shape - how the material already teaches itself - not taste.
- **`strategy.signature_move`** is the repeatable per-concept move the scriptwriter applies again and
  again. Make it mechanical: a verb sequence a stranger could apply to any concept ("state the question in
  the concrete case, do the step, THEN name the concept just used").

One dominant strategy per video. Variety comes from the arc, the examples and the visuals - not from
switching strategy every section, which leaves the video with no identity.

---

## 5. Design the arc

`arc` = `hook` -> `sections[]` -> `payoff`, plus the bridges between them.

**Sections** - group the source's concepts into 2-8 sections (see the size guide in the rubric). Each has:

- **`goal`:** an OBSERVABLE capability, always starting "the viewer can ...". "Understands", "appreciates",
  "knows about" and "is aware of" are forbidden verbs.
- **`bloom`:** the goal's level on the revised Bloom taxonomy - `remember | understand | apply | analyze |
  evaluate | create` - and the goal's VERB must belong to that level (verb table in the rubric). The arc
  should CLIMB: the peak section reaches at least `apply` for student and practitioner audiences, and the
  last section may drop one level to consolidate. If every goal is "can state", you designed a glossary,
  not a lesson.
- **`concepts`:** the ideas the section teaches, in the SOURCE's own terminology.
- **`energy`:** `build | steady | peak | rest` - the cognitive-load curve (section 7).
- **`carrier`:** what should carry this section on screen - chart, comparison, process, worked example,
  scenario, dialogue, demonstration, diagram. Vary it: consecutive sections leaning on the same kind of
  visual read as monotonous however correct they are.
- **`recap_after`:** whether a one-line consolidation follows.

**Order** - sequence sections in the order each idea becomes USABLE, which is not always the order the
source presents them. Map which idea depends on which; teach prerequisites first. For a complex process,
introduce the names and roles of the parts before showing the process running (the pre-training
principle), so the learner is not decoding vocabulary and following a sequence at the same time.

**The hook** - `hook.kind`: `question | surprising_fact | stakes | misconception | scenario`. One or two
sentences, concrete, and it defines NOTHING yet. It must be answerable by the payoff, and its essence must
survive compression to about eight words on screen (the narration carries the rest). A hook that is the
title restated is not a hook. A hook that needs a fact the source does not contain is not allowed - pick
another kind. **Write the hook LAST**, once you know what the payoff pays off.

**The promise** - right after the hook, state (or clearly imply) what the viewer will be able to do by the
end. People learn better when they know where they are going.

**The bridge from prior knowledge** - the first section opens from something the viewer already knows
(`assumed_prior`), so new ideas have somewhere to attach.

**The payoff** - the ending cashes the hook's cheque: return to the opening situation, now handled with the
new skill. Name exactly how.

---

## 6. The teaching moves that make a video better than a summary

These are the well-established effects from learning research that separate a video people can act on
from one they merely watched. Plan where each lands; you do not need all of them in every video, but you
must decide.

**Worked examples, then fading, then practice.** For novices, studying a fully worked example beats solving
the problem unaided (the worked-example effect). Then remove steps: show the next example with the last
step left for the viewer, then the last two (fading, or completion problems), then a full problem. Plan this
ladder explicitly in `practice_ladder`.

**Expertise reversal.** The guidance that helps novices gets in experts' way. For practitioners and experts,
cut the fully worked examples short, move sooner to problems and decisions, and trust them with density.

**Confront misconceptions head-on.** List the misconceptions this audience is likely to hold
(`misconceptions[]`, from the source, the brief or the requester - never invented). For each: state the
misconception fairly, show why it is tempting, then show the evidence that breaks it, then the correct idea.
This refutation pattern works better than presenting the correct idea alone and hoping the wrong one fades.

**Concrete, then abstract, then concrete again.** Start with a tangible case, extract the general idea, then
apply it to a different concrete case (concreteness fading). A second, deliberately different example is
what lets the learner separate the idea from the first example's surface details.

**Analogies with a stated breaking point.** When you use an analogy, map it explicitly (this part is that
part) and say where it stops being true. An analogy left unbounded becomes a misconception.

**Retrieval, not re-reading.** Making the learner pull an idea back out of memory strengthens it more than
showing it again (the testing effect). Plan retrieval moments (section 8).

**Spacing and interleaving.** Return to an important idea after a gap rather than all at once, and in longer
videos or series, mix earlier ideas into later practice so the learner has to decide which idea applies
(interleaving helps discrimination between similar ideas).

**Elaboration.** Ask "why is that true?" and "how does this connect to what you already do?" at key points
(elaborative interrogation). A question the narrator asks and then answers well is still useful; one the
viewer answers first is better.

**Make the learner do something with it.** Watching is passive; noting, predicting, deciding, explaining
back and applying are progressively more active - and more active engagement generally produces more
learning (the ICAP framework: passive < active < constructive < interactive). Design moments that move the
viewer up that ladder, even inside a linear video.

**Scenarios with consequences** (practitioners). Put the learner at a realistic decision point, let them
choose (a pause, or a real branch in an interactive player), then show the consequence of each option -
including the tempting wrong one. Consequences teach judgement; lectures about judgement do not.

**Transfer.** End with at least one application to the learner's own world: "the next time X happens at
your desk, do Y". Where the video is part of a course, give a job aid or a one-line pocket rule they can
keep.

---

## 7. Cognitive load and the energy curve

Working memory is the scarce resource every other choice spends. It holds only a few new items at once.

- **SEGMENT:** one new idea per step. A section introducing more than about four new terms needs an interior
  rest or a split.
- **SIGNAL:** mark where the ONE emphasis of each section lands (`slowdown_at`). Keep it scarce so it stays
  loud; marking half the lesson slows nothing.
- **WEED:** everything that is neither the idea nor its necessary context is extraneous load. A story, a
  running gag or a flashy device that does not serve a section goal is load, not engagement - cut it
  (the coherence principle; interesting-but-irrelevant details measurably reduce learning).
- **PAIR, DO NOT DUPLICATE:** narration and screen complement each other (dual coding). A screen that
  transcribes the voice adds load, not redundancy. Design assuming the screen shows anchors - labels,
  keywords, structure, numbers - while the voice explains.
- **CONTIGUITY:** a label sits next to what it labels; a visual appears when its words are spoken.
- **CONVERSATIONAL VOICE:** a warm, human, second-person narrator ("you") helps more than a formal, detached
  one (the personalization and voice principles).

**The energy curve.** `energy` per section: `build | steady | peak | rest`.
- At least one `rest` in any video over about three minutes.
- Never two `peak` sections back to back.
- The last section is never `peak` - endings settle.
- Peak sections tolerate dense visuals; rest sections want light visuals and a warmer pace. Design the curve
  knowing it will be realised on screen, not just admired.

---

## 8. Retrieval and checks - placed where they pay

`recall_moments[]`: each tied to a section that has already taught what it asks (never test material taught
later). Three kinds, and know how each is built:

- **`quiz`** becomes TWO scenes: a question card (question + options, NO answer) whose narration ends "pause
  the video and decide", then a real silent pause, then an answer card that reveals the answer AND explains
  why - including why the most tempting wrong option is wrong. The answer is never spoken before the pause.
  Needs an answer that can be stated; a quiz whose honest answer is "it depends" cannot be built.
- **`pause_predict`** - the prompt on screen, the narration stops ("before I show you - what happens next?"),
  and the reveal comes in the NEXT scene. Needs a genuine fork the viewer can predict.
- **`recall_prompt`** - a spoken callback with minimal screen support ("remember the three checks from
  earlier? The second one is where this goes wrong."). It stops nothing. Use it freely for reinforcement and
  spacing.

**The budget: about ONE stopping check (quiz or pause_predict) per five minutes of video.** It is a cap, not a
target. A video that stops for a quiz every minute is an exam interrupted by teaching, and viewers hate it.

| video length | quiz + pause_predict, maximum |
|---|---|
| under 4 min | 1 |
| ~8 min | 1-2 |
| ~16 min | 3 |
| ~30 min | 6 |

So do NOT place one per section; a section is not a reason. Spend the stopping checks right after the hardest
idea, and where a misconception would otherwise survive to the end. For everything else, use `recall_prompt`s
and questions inside teaching scenes - a video can ask the viewer things constantly without ever stopping.

**In an interactive player** (an LMS, a branching video), the same moments can become real questions with
recorded answers, and scenarios can branch. Design them so the linear version still works if the
interaction is removed.

---

## 9. Motivation that earns its place (ARCS)

Keller's ARCS model is a useful check on whether the learner will stay with you:

- **Attention** - the hook, and variety across sections (carrier, pace, energy).
- **Relevance** - why this matters to THIS learner, in their terms, early. The more required and the less
  voluntary the viewing, the more relevance the opening needs.
- **Confidence** - achievable early checks, clear goals, a visible sense of progress.
- **Satisfaction** - the payoff actually pays; the learner can do the thing and sees that they can.

Every engagement device must serve a named section goal. A device you cannot tie to a goal is extraneous load.

---

## 10. The narration contract (binding on the scriptwriter)

The spoken track is a warm human teacher, never a screen-reader. It does NOT recite on-screen definitions
word for word; it explains them in its own words. BUT whenever a scene shows an enumerated set (bullets,
compared columns, steps, keyword tiles), the narration must ADDRESS every one of those points, in order - even
one that is out of scope, which it names with a brief "more on that later" - so each point on screen has words
that land with it. Cover the points; do not read the prose.

Speaking rate: plan for about 130-160 words per minute; slower for dense or second-language audiences.

`delivery_notes`: performable instructions for the narrator ("curious on questions, slower and warmer on
definitions, brisk on recaps"), never adjectives like "engaging" or "dynamic". If a narrator persona exists,
defer to it and add only what this video needs.

---

## 11. Audit the plan against the frameworks - by POINTING, not by quoting

`framework_audit` points at where each principle LANDS in your plan ("practice -> recall moments after sec1
and sec3"). If you cannot point at something, the design is missing it: fix the design, not the audit.

**Gagne's Nine Events of Instruction** -> your fields:
1 gain attention -> `hook` | 2 inform the objective -> the promise | 3 stimulate recall of prior learning -> the
bridge from `assumed_prior` | 4 present the content -> `sections` | 5 provide guidance -> `signature_move` and
the worked examples | 6 elicit performance -> `recall_moments` and `practice_ladder` | 7 provide feedback -> how
answers are explained | 8 assess -> the final check | 9 enhance retention and transfer -> `payoff`,
`transfer_tasks`, callbacks. Events 1, 3, 4, 5, 6 and 9 are mandatory; 2, 7 and 8 are expected but may be marked
absent with a reason.

**Merrill's First Principles:** learning is promoted when it is (a) PROBLEM-CENTRED - a real task or dispute runs
through the lesson, not topic slides in a row; (b) prior knowledge is ACTIVATED; (c) the skill is DEMONSTRATED -
shown, not only told; (d) the learner APPLIES it; (e) it is INTEGRATED into the learner's own world. All five
appear; at most one may be marked absent, with a reason.

**Bloom (revised):** `bloom_path` lists the sections' levels in order, and it matches what the sections declare.

**Mayer's multimedia principles:** name where coherence, signalling, redundancy, contiguity, segmenting and
pre-training are applied.

**ARCS:** one line each for attention, relevance, confidence and satisfaction.

---

## 12. Series and courses - when one video is not enough

For a multi-video course, add a `series` block:

- **One course outcome**, and each video's outcome as a step towards it.
- **A prerequisite map** - which video depends on which. No video assumes something a later one teaches.
- **Spacing across videos** - each video opens with a short retrieval of the previous one's key idea, and later
  videos interleave earlier ideas into their practice.
- **Rising Bloom across the series** - early videos may sit at `understand`; the course should end at `apply` or
  above, ideally with a capstone scenario that combines several videos' skills.
- **Length per video** set by what one coherent step needs, not by a fixed number. Segment for working-memory
  reasons (one main idea per video), not because of a mythical attention span.

---

## 13. Procedure

1. Read the whole source; note how it already sequences ideas and what it assumes.
2. Name the performance (section 1) and model the learner (section 2).
3. Call the genre (section 3) and choose ONE strategy with a mechanical signature move (section 4).
4. Map the misconceptions and plan the worked-example-to-practice ladder (section 6).
5. Design the arc: 2-8 sections with observable goals and Bloom levels, the carrier per section, the energy curve
   and the recaps; make one section carry the peak level (sections 5 and 7).
6. Place the recall moments where the load pattern needs them, within the budget (section 8).
7. Plan transfer: the payoff, `transfer_tasks`, the pocket rule.
8. Write the hook LAST.
9. Fill `framework_audit` by pointing (section 11).
10. Check the plan against `reference/rubric.md` before handing it over.

---

## 14. Never justify a design with these

- **Learning styles / VARK matching** - the meshing hypothesis is unsupported.
- **Retention percentages by modality** ("we remember 10% of what we read, 90% of what we do") - a fabrication.
- **"Attention span is 10-15 minutes"** - not supported; segment for working-memory reasons.
- **"More animation or more interactivity always means more learning"** - only when it serves a goal.
- **Any statistic, study or quote not in the source** - the plan never adds facts. Hooks, examples and prompts
  use only the source's material, or scenes clearly framed as invented ("say", "imagine").

## Files

- `reference/teaching-plan.md` - the output shape, with a full worked example.
- `reference/rubric.md` - the hard rules, size guide, Bloom verb table, flags and traps.

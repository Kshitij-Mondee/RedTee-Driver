# Loom library - assess the beat design `attention_converges` for promotion to a TEMPLATE

**Recommended model:** Opus (planning / judgment) - `claude-opus-5-5`

`attention_converges` has been built as a bespoke scene 2 time(s) in 1 lesson(s) (raw tags: 2). The count only opens the door: YOU decide whether it becomes a
storyboard-selectable template. Be strict. The requester wants templates only for designs that will
really be reused. A template nobody picks is catalogue noise every storyboard author has to read, and
a template that bakes in one lesson's words leaks them into other lessons.

## Read these uses (whole scene files)

- `/sessions/practical-funny-cannon/work/loom/library/scenes/blameless-postmortem/b02.js` (project `blameless-postmortem`, scene `b02`, line 1, style `whiteboard`)
- `/sessions/practical-funny-cannon/work/loom/library/scenes/blameless-postmortem/b28.js` (project `blameless-postmortem`, scene `b28`, line 1, style `whiteboard`)

Tagged ideas: "a group of figures turn one by one to face a single focus while dashed sight lines converge on it"

Existing templates and blueprints (read `/sessions/practical-funny-cannon/work/loom/runtime/catalog.md`): calendar.plan, chart.bars, compare.two, cycle, definition, document.page, hero.character_moment, hero.hub, hero.journey, hero.meter, hero.portal, icon.grid, list.steps, process.flow, quiz.answer, quiz.question, quote, recap, scenario.dialogue, stat.hero, timeline, title.card.
Existing components and forms: `/sessions/practical-funny-cannon/work/loom/library/FORMS.md`.

## Decide

Promote ONLY if every one of these holds (otherwise defer, reject or merge):
1. **Topic-independent design.** Said without this lesson's nouns it still describes a beat ("several
   conditions converge on one failure" yes; "the checkout outage map" no).
2. **A real repeat, not a continuation.** Two scenes that extend the same held picture are one use.
3. **Not already covered** by an existing template or blueprint (name the closest and why it falls short).
4. **Selectable:** name the script `job`(s) it serves and the content shape a storyboard author would
   recognise ("3-5 causes and one effect").
5. **Concrete future demand:** at least 3 different lesson topics, each with what the beat would show.
6. **Better as a template than as components.** If only its parts recur, say so and reject: the element
   library handles parts.
Confidence must be `high` to promote.

## The selection test you must also write (promote only)

`selection_test` is a blind test storyboard: 3 `targets` (beats from 3 DIFFERENT future topics that this
template should serve) and 2 `decoys` (beats that look related but a different existing template or a
bespoke scene should serve). Each is `{"id": "t1", "job": <script job>, "narration": "what the
narrator says, 20-45 words", "visual_intent": "one line"}`. No em or en dashes. After the template is
built, a separate storyboard model sees only these 5 beats and the catalogue, and must pick it for at
least 2 targets and for no decoy.

## Output

Write exactly ONE file: `/sessions/practical-funny-cannon/work/loom/library/assessments/design-attention_converges.json`:

```json
{
 "form": "design:attention_converges",
 "decision": "promote | defer | reject | merge",
 "confidence": "high | medium | low",
 "topic_independent": true,
 "idea": "one sentence, no lesson nouns",
 "outline": [
  "the fixed parts, in build order"
 ],
 "variation_seen": [
  "what differed between the uses"
 ],
 "closest_existing": {
  "id": "an existing template",
  "falls_short": "why"
 },
 "jobs": [
  "relate"
 ],
 "content_shape": "e.g. 3-5 causes and one effect",
 "future_uses": [
  {
   "topic": "a different lesson",
   "shows": "what the beat would show"
  }
 ],
 "params_sketch": {
  "content": [
   "effect",
   "causes[].label"
  ],
  "adjustable": [
   "layout",
   "accent"
  ]
 },
 "selection_test": {
  "targets": [
   {
    "id": "t1",
    "job": "relate",
    "narration": "...",
    "visual_intent": "..."
   }
  ],
  "decoys": [
   {
    "id": "d1",
    "job": "sequence",
    "narration": "...",
    "visual_intent": "..."
   }
  ]
 },
 "reason": "why, in two sentences",
 "merge_into": null,
 "revisit_when": {
  "uses": 4,
  "lessons": 3
 }
}
```

## Prove it

From `/sessions/practical-funny-cannon/work/loom`:

```
py -m loom library check design:attention_converges
py -m loom library accept design:attention_converges
```

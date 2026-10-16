# Loom library - promote the beat design `cause_convergence` to a template

**Recommended model:** Sonnet (building) - `claude-sonnet-5-5`

Use the **loom-template-author** skill: `/sessions/practical-funny-cannon/work/loom_proof/skills/loom/loom-template-author/SKILL.md`. Read it first,
then `/sessions/practical-funny-cannon/work/loom_proof/docs/STORYBOARD_GUIDE.md`, `/sessions/practical-funny-cannon/work/loom_proof/docs/SCENE_API.md` and two existing templates in
`/sessions/practical-funny-cannon/work/loom_proof/runtime/templates` to match their structure. Do NOT rewrite any existing scene.

## The bespoke scenes it is promoted from

- `/sessions/practical-funny-cannon/work/loom_proof/library/scenes/blameless-postmortem/b20.js` (project `blameless-postmortem`, scene `b20`, line 1, style `whiteboard`)

## The assessment

```json
{
 "form": "design:cause_convergence",
 "decision": "promote",
 "confidence": "high",
 "topic_independent": true,
 "proof_note": "PROOF FIXTURE written by the orchestrator in an isolated engine copy (template_promote_after lowered to 1) to exercise the build -> gates -> blind-selection path end to end. Not a real library decision.",
 "idea": "Several separate conditions each arrive and draw an arrow into one outcome, so the outcome reads as their joint result.",
 "outline": [
  "the outcome card at the centre",
  "condition cards arriving one by one around it",
  "an arrow from each condition drawing into the outcome",
  "an optional label naming that they combined"
 ],
 "variation_seen": [
  "three conditions in the source; the count and wording vary by lesson"
 ],
 "closest_existing": {
  "id": "hero.hub",
  "falls_short": "a hub radiates spokes outward from a centre; here causes converge inward on an effect and arrive on their own words"
 },
 "jobs": [
  "relate",
  "refute"
 ],
 "content_shape": "2 to 5 contributing conditions and one outcome they produce together",
 "future_uses": [
  {
   "topic": "workplace safety",
   "shows": "a fall caused by a wet floor, no sign, and poor lighting"
  },
  {
   "topic": "customer churn",
   "shows": "a lost account from slow support, a price rise and a missing feature"
  },
  {
   "topic": "project delays",
   "shows": "a late launch from unclear scope, one reviewer, and a vendor slip"
  }
 ],
 "params_sketch": {
  "content": [
   "outcome",
   "conditions[].label",
   "summary"
  ],
  "adjustable": [
   "conditions[].icon",
   "accent"
  ]
 },
 "selection_test": {
  "targets": [
   {
    "id": "t1",
    "job": "relate",
    "narration": "The fall was not caused by one thing. The floor was wet, no warning sign was out, and the corridor light had failed. Together they made the slip almost certain.",
    "visual_intent": "three conditions pointing into one incident"
   },
   {
    "id": "t2",
    "job": "relate",
    "narration": "The client did not leave over one bad week. Support replies were slow, the renewal price went up, and the feature they asked for never shipped. All three pushed them out.",
    "visual_intent": "several reasons combining into one lost account"
   },
   {
    "id": "t3",
    "job": "refute",
    "narration": "It is tempting to blame the vendor for the late launch. But the scope was unclear, only one person could review, and the vendor slipped too. The delay came from all of them.",
    "visual_intent": "several causes feeding one late launch, not a single culprit"
   }
  ],
  "decoys": [
   {
    "id": "d1",
    "job": "sequence",
    "narration": "First the request is logged, then it is triaged by the on call engineer, then it is fixed and tested, and finally the customer is told it is resolved.",
    "visual_intent": "steps in order"
   },
   {
    "id": "d2",
    "job": "define",
    "narration": "A service level objective is a target for how reliable a service should be, such as ninety nine point nine percent of requests succeeding over a month.",
    "visual_intent": "a term and its meaning"
   }
  ]
 },
 "reason": "The convergence of several conditions on one outcome recurs in any lesson about incidents, risk or root causes, and no existing template draws causes converging inward. It is a whole-beat argument, not just a part.",
 "merge_into": null,
 "revisit_when": {
  "uses": 3,
  "lessons": 2
 }
}
```

## Output (exactly these two files)

1. `/sessions/practical-funny-cannon/work/loom_proof/runtime/templates/cause_convergence.js` registering ONE `Loom.template("<family>.<name>", {...})` (or `Loom.blueprint` for a
   motion-hero beat) with `doc` (when to use it, in the storyboard author's words), `job` (from the assessment),
   `register`, `motion_is`, `props`, `example` (valid props), and `promoted_from_design: "cause_convergence"`.
   - **All on-screen text comes in through props.** No sample words in the code. A str prop may have a default
     only if it is structural chrome and marked `chrome: true`; template-owned words go in `chrome: [...]`.
     The sample-text audit renders your fixtures and fails on any drawn word no prop supplied.
   - Reveals anchored to `say_*` props; deterministic; tokens only; reads in every style pack.
2. `/sessions/practical-funny-cannon/work/loom_proof/runtime/templates/fixtures/cause_convergence.json`: `{"cases": [{"label": "...", "params": {...props}}]}`, 3+ cases whose
   CONTENT differs: the uses above generalised, plus one future topic from the assessment.

## Prove it

From `/sessions/practical-funny-cannon/work/loom_proof`:

```
py -m loom library accept design:cause_convergence
```
It renders every case in every style pack to `/sessions/practical-funny-cannon/work/loom_proof/library/sheets/design-cause_convergence.jpg` (LOOK at it) and then
writes the blind selection task. The design is promoted only when the selection test passes.

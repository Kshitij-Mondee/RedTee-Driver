# Loom storyboard check - stage five beats

**Recommended model:** Opus (storyboard tier) - `claude-opus-5-5`

You are the storyboard author. Read `/sessions/practical-funny-cannon/work/loom_proof/docs/STORYBOARD_GUIDE.md` and the catalogue `/sessions/practical-funny-cannon/work/loom_proof/library/selection/cause_convergence.catalog.md`.
For each beat below, choose how to stage it exactly as you would in a real storyboard: a template, a
blueprint, or `bespoke` if nothing in the catalogue fits well. Fill the props from the narration (anchors must
be words the narration says). Do not choose a template just to use it.

## Beats

```json
[
 {
  "beat": "s1",
  "job": "relate",
  "narration": "The fall was not caused by one thing. The floor was wet, no warning sign was out, and the corridor light had failed. Together they made the slip almost certain.",
  "visual_intent": "three conditions pointing into one incident"
 },
 {
  "beat": "s2",
  "job": "refute",
  "narration": "It is tempting to blame the vendor for the late launch. But the scope was unclear, only one person could review, and the vendor slipped too. The delay came from all of them.",
  "visual_intent": "several causes feeding one late launch, not a single culprit"
 },
 {
  "beat": "s3",
  "job": "relate",
  "narration": "The client did not leave over one bad week. Support replies were slow, the renewal price went up, and the feature they asked for never shipped. All three pushed them out.",
  "visual_intent": "several reasons combining into one lost account"
 },
 {
  "beat": "s4",
  "job": "define",
  "narration": "A service level objective is a target for how reliable a service should be, such as ninety nine point nine percent of requests succeeding over a month.",
  "visual_intent": "a term and its meaning"
 },
 {
  "beat": "s5",
  "job": "sequence",
  "narration": "First the request is logged, then it is triaged by the on call engineer, then it is fixed and tested, and finally the customer is told it is resolved.",
  "visual_intent": "steps in order"
 }
]
```

## Output

Write `/sessions/practical-funny-cannon/work/loom_proof/library/selection/cause_convergence.json`:

```json
{
 "scenes": [
  {
   "beat": "s1",
   "kind": "template | blueprint | bespoke",
   "template": "id (or blueprint: id)",
   "props": {},
   "why": "one line"
  }
 ]
}
```

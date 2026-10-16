# The teaching plan - output shape, with a worked example

Produce exactly this shape (JSON shown; the same fields in a document are fine). The example plans a
~5-minute student video on hypothesis testing from a source that teaches through one running example.

```json
{
  "title": "Is the coin fair? Hypothesis testing in five minutes",
  "performance": "given a small experiment and a significance level, the viewer can run a one-sided test and say whether to reject the null hypothesis",
  "audience": {
    "level": "student",
    "assumed_prior": "knows mean and standard deviation; has never run a formal test",
    "why": "the source defines basic terms from scratch but uses algebra freely",
    "motivation": "required for a course assessment; mildly anxious about statistics",
    "context": "laptop, with sound, first-language English"
  },
  "genre": "quantitative",
  "strategy": {
    "name": "worked_example_led",
    "rationale": "the source itself teaches through one running example; abstractions land only after the case",
    "signature_move": "state the question in the concrete case, do the step, THEN name the concept just used"
  },
  "misconceptions": [
    {"belief": "a p-value is the probability the null hypothesis is true",
     "why_tempting": "it is a probability, and it is small when the null looks wrong",
     "refuted_in": "sec2",
     "source_anchor": "p.4, box 'What a p-value is not'"}
  ],
  "arc": {
    "hook": {"kind": "misconception", "sketch": "You flip a coin 8 times, get 6 heads, and cry foul. Are you right?"},
    "promise": "by the end you can settle the coin argument yourself",
    "bridge_from_prior": "sec1 opens from the mean and spread the viewer already knows",
    "sections": [
      {"id": "sec1", "goal": "the viewer can state what a null hypothesis is", "bloom": "understand",
       "concepts": ["null hypothesis", "alternative hypothesis"], "energy": "build",
       "carrier": "worked example", "recap_after": false},
      {"id": "sec2", "goal": "the viewer can use a p-value to decide whether to reject the null", "bloom": "apply",
       "concepts": ["p-value", "significance level"], "energy": "peak",
       "carrier": "chart", "recap_after": true},
      {"id": "sec3", "goal": "the viewer can give an example of each of the two error types", "bloom": "understand",
       "concepts": ["type I error", "type II error"], "energy": "rest",
       "carrier": "comparison", "recap_after": true}
    ],
    "payoff": "return to the coin: the viewer runs the full test and settles the opening question"
  },
  "practice_ladder": [
    {"stage": "worked", "where": "sec1-sec2", "what": "the coin test, every step narrated"},
    {"stage": "faded", "where": "sec2 end", "what": "a second test (a die) with the final decision left to the viewer"},
    {"stage": "independent", "where": "payoff", "what": "the viewer decides the coin case before the narrator does"}
  ],
  "pacing": {
    "target_duration_s": 300,
    "words_per_minute": 145,
    "slowdown_at": ["p-value"],
    "recall_moments": [
      {"after_section": "sec1", "kind": "recall_prompt",
       "prompt_sketch": "Which hypothesis does the researcher hope to reject? Keep it in mind."},
      {"after_section": "sec2", "kind": "quiz",
       "prompt_sketch": "p = 0.03 at alpha 0.05: reject or not?",
       "answer": "reject - 0.03 is below 0.05",
       "tempting_wrong": "'accept the alternative as proven' - rejecting the null is evidence, not proof"}
    ]
  },
  "transfer_tasks": ["the next time someone says a result is 'significant', ask what the significance level was and what the null hypothesis was"],
  "persona": {
    "voice": "a calm, slightly playful tutor who respects the viewer's intelligence",
    "delivery_notes": "curious on questions, slower and warmer on definitions, brisk on recaps"
  },
  "framework_audit": {
    "gagne": {
      "attention": "hook: the suspicious coin",
      "objective": "promise: you can settle this yourself",
      "recall_prior": "sec1 opens from mean and spread",
      "present": "sections in dependency order",
      "guidance": "signature move + the worked coin example",
      "practice": "practice ladder; quiz after sec2",
      "feedback": "quiz answer explained, including the tempting wrong reading",
      "assess": "payoff: the viewer decides the coin case first",
      "transfer": "transfer task: question the next 'significant' claim"
    },
    "merrill": {
      "problem_centered": "the coin dispute IS the running problem",
      "activation": "sec1 bridges from mean and spread",
      "demonstration": "the coin test shows each step before naming it",
      "application": "faded die example and the quiz make the viewer do the step",
      "integration": "payoff and transfer task hand the method back"
    },
    "mayer": {
      "coherence": "no side stories; the coin is the only example until the faded die",
      "signalling": "one slowdown, on the p-value",
      "redundancy": "screen shows numbers and labels only; narration explains",
      "contiguity": "each number appears as it is spoken",
      "segmenting": "three short sections, one idea each",
      "pre_training": "sec1 names null and alternative before the test runs"
    },
    "arcs": {
      "attention": "the coin argument",
      "relevance": "assessment-relevant; everyday 'significant' claims",
      "confidence": "a worked example before any question",
      "satisfaction": "the viewer settles the opening argument"
    },
    "bloom_path": "understand -> apply -> understand (consolidation)"
  },
  "series": null,
  "flags": []
}
```

For a multi-video course, `series` becomes:

```json
{
  "course_outcome": "...",
  "videos": [{"id": "v1", "outcome": "...", "depends_on": [], "opens_with_retrieval_of": null},
             {"id": "v2", "outcome": "...", "depends_on": ["v1"], "opens_with_retrieval_of": "v1 key idea"}],
  "interleaving": "where earlier ideas return in later practice",
  "capstone": "the scenario that combines the videos' skills"
}
```

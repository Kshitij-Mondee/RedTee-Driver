# Stage: pedagogy (Learning Designer) - Opus

Follow `lnd-learning-pedagogy` completely and produce ONE teaching plan at `plan/teaching_plan.json`
in the shape of its `reference/teaching-plan.md`, passing every rule in `reference/rubric.md`.

Loom-specific rules (the engine's gate checks these mechanically):

- The source is `plan/knowledge.json` (topic mode, approved) or `source/chunks.json` (source mode).
  Misconceptions, hooks and examples use only that material or are framed as invented ("say", "imagine").
- Goals start "the viewer can " + a verb from the rubric's Bloom table that matches the declared level
  (e.g. understand -> explain, apply -> use/plan/schedule, analyze -> distinguish/spot). Forbidden:
  understands, appreciates, knows about, is aware of.
- Bloom path never jumps more than one level between neighbours; peak >= apply for students and
  practitioners; `framework_audit.bloom_path` is exactly the sections' levels joined by " -> ".
- Energy: at least one `rest` over 3 minutes, never `peak` then `peak`, never end on `peak`.
- Stopping checks (quiz + pause_predict) within the budget (1 under 6 minutes). A quiz needs `answer`
  and `tempting_wrong`.
- `carrier` per section should vary and should name what CHANGES on screen where motion is the content
  (a value draining, a journey across days, a character's thoughts fading): the storyboard will use it.
- Plan for ~130-160 wpm. `target_duration_s` follows the request's length unless the material honestly
  supports something else (flag DURATION-MISMATCH). State the request's length as given in `pacing.requested_s`
  (length_min x 60); never write that no length was requested when the request has one (the gate refuses both).

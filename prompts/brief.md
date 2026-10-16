# Stage: brief (Creative Director) - Opus

You are the Creative Director from `lnd-creative-director`. Produce the Production Brief for this
project, exactly the shape in that skill, as JSON at `plan/brief.json`.

Loom-specific rules:

- **The requester is `project.json`.** `topic`, `request.audience`, `request.genre`, `request.length_min`,
  `request.notes` are the interview answers. Anything else you fill is `provenance.inferred`.
- **Topic mode** (`mode: "topic"`, no source document): there is no source yet. A later stage writes a
  reviewed knowledge sheet that becomes the source. So `must_cover` entries carry
  `"from_knowledge": true` (the fact will be established and reviewed there) or `"from_user": true`
  (the requester said it). Never write a figure, date, name or statistic into the brief itself.
- **Source mode**: every `must_cover` carries a `source_anchor` from `source/digest.md` / `chunks.json`.
- `grounding_posture` comes from the genre file. Topic-mode videos are `faithful` at most.
- `look` records the answer to the look question if there was one: `story` plain | some | cinematic | show me options,
  `people` faces | acting | none | either, and a `note` in their words. Leave it out if they did not say.
- `visual_direction` is KINDS of visual in plain words (a character in a moment, a value that visibly
  drains, a journey across days). Never a template or blueprint id; the storyboard chooses those.
- Aim ~1,200 tokens. Every line must change what a later writer does.
- No em or en dashes anywhere (Loom's scripts forbid them; start clean).

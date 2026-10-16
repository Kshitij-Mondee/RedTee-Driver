# Stage: knowledge (topic mode only) - Opus

In topic mode there is no document, so YOU write the lesson's source: a short, conservative
**knowledge sheet** at `plan/knowledge.json` (schema: `loom/schemas/knowledge.schema.json`).
A human approves it (`py -m loom approve <id> knowledge --by NAME`) before any script is written.
The script may then state only what this sheet states. That is how a topic-mode lesson stays grounded.

Write it like a careful subject-matter expert who will be checked:

- 8-20 facts, each ONE claim, in plain words, with `id` F1..Fn, `kind`, `confidence`:
  - `established` - textbook consensus you would bet your reputation on;
  - `mainstream` - broadly accepted, with known nuance (give a `caveat`);
  - `contested` - only if the lesson must mention the debate; always with a `caveat`.
- **Numbers are dangerous.** Include a number only if it is well established and you can name where it
  comes from (`reference_hint`, e.g. "Ebbinghaus (1885)"). Every digit in a statement is listed in
  `numbers[]`. Prefer shapes and directions ("forgetting is fastest soon after learning") over
  percentages that circulate without a source.
- Add `not_claimed[]`: popular claims on this topic that are myths or unsupported, so the scriptwriter
  knows not to use them (e.g. retention percentages by modality, learning styles).
- Cover every `must_cover` entry of the brief that is `from_knowledge`.
- `review.status` = "draft". Never set "approved" yourself.
- No em or en dashes.

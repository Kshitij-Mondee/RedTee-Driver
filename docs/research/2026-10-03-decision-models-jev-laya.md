# Decision models for Loom: Jev and Laya (research note, 2026-10-03)

STATUS: RESEARCH. Nothing is wired in. This feeds the parked final goal (D-95, D-97, D-98) and rule 0 of
`docs/strategy/2026-10-02-final-goal.md`.

## Laya, in short
- **What it is:** an open-source, non-autoregressive "System One" decision model from Convai Innovations, released
  in September 2026 under Apache 2.0 with weights on Hugging Face. It answers the same three question types as Jev:
  Choice, Score and Noul (true or false with a probability).
- **Size:** an English checkpoint of about 421M parameters (ModernBERT-large plus a decision head), a multilingual
  checkpoint of about 322M (mmBERT-base, 100+ languages), and a third checkpoint fine-tuned on a typed-decisions
  benchmark's training split.
- **Speed:** about 33 to 40 ms per query on one GPU (a T4 is quoted), and about 7 ms per question when batched. These
  figures are vendor and secondary.
- **Why it matters for us:** it runs on our own hardware, client state never leaves the machine, and **it can be
  fine-tuned on our own labelled decisions**. Convai ships a notebook that fine-tunes it in about 4 hours on free
  GPUs (secondary source). Jev's weights are closed and cannot be tuned.

## How hyped (as of 2026-10-03, about two weeks after launch)
- **Fast attention:** reports say its GitHub repository (created 2026-09-18) reached about 7,900 stars and 667 forks
  in three days. That is a secondary source and I have not checked the repository itself. Comparison posts on DEV,
  Medium, personal blogs, AI Weekly and DataCamp's "open-source Jev alternatives" followed within a week.
- **Real counterweights in the same coverage:**
  - **Few options only.** All candidate options share a fixed token budget of about 192 to 256. Past about 20
    options each gets only a few tokens. On Banking77 (77 labels) Laya scored 0.425 against Jev's 0.870. For more
    options you need a coarse-to-fine hierarchy.
  - **Calibration is weaker out of the box:** expected calibration error 0.213 against Jev's 0.144.
  - **Zero-shot can fail completely.** In one routing benchmark, the untuned 322M base got 0 % of multi-turn
    routing decisions right, against Jev's 61.4 %.
  - **Confident on input it cannot read.** The English checkpoint scored 0.080 on Bengali script while reporting
    0.945 confidence. Route by script first.
  - **Benchmarks are mostly self-reported.** The benchmark where Laya beats Jev used a checkpoint tuned on that
    benchmark's own training split.
  - **A public origin dispute** (who had the idea first) is unresolved. It does not change the engineering.
- **My reading:** the hype is about the category, "most AI pipeline work is classification dressed as generation",
  and Laya is the open, trainable way in. Out of the box it is weaker than Jev. Fine-tuned on a task's own labelled
  data, it can match or beat it. That is exactly the data the decision ledger (D-97) now collects.

## What it means for Loom (later, under rule 0)
| Loom decision | options | fits a decision model? |
|---|---|---|
| treatment (avatar, template, motion, hybrid) | 4 | yes, Choice; code does it today, and the ledger has 152 labelled examples |
| join type and meaning | 6 and 5 | yes, Choice |
| shot size and move | about 5 each | yes, Choice |
| template id | 17 and growing | borderline for Laya (about 20); do it coarse-to-fine (family, then template) |
| blueprint or bespoke | 2 | yes |
| check warning: severity, and fix route (prop, scene, storyboard, engine) | 3 and 4 | yes, Score and Choice |
| "is this line on screen when it is said" | yes or no | Noul, as a cheap first pass before the V5 code check |
| the storyboard itself, the script, scene code | open-ended | **no**: these stay with LLMs and full thinking |

**Path, when the time comes:**
1. Export the ledger to Laya's training format, one set per decision.
2. Fine-tune per decision.
3. Run in **shadow mode** beside the current decider and log both.
4. Measure agreement, outcome quality and calibration (is 0.9 confidence right 9 times in 10?) on held-out lessons.
5. Switch a decision only when it matches, with Kshitij's yes.

Jev stays as a zero-ops comparison for wide option sets.

## Sources
- [Jev vs Laya: the same AI idea, one closed and one open (DEV, 2026-09-22)](https://dev.to/jamilxt/jev-vs-laya-the-same-ai-idea-one-closed-and-one-open-3c6e)
- [Laya AI: the open 33 ms decision model (eesel)](https://www.eesel.ai/blog/laya-ai)
- [Laya on Learn AI wiki](https://ai.miraheze.org/wiki/Laya)
- [What is Laya? (Medium)](https://medium.com/data-science-in-your-pocket/what-is-laya-3d9f3b60f384)
- [Jev vs Laya (Wilson Wu)](https://wilsonwu.me/en/blog/2026/jev-vs-laya/)
- [Convai ships Laya, a 421M ModernBERT decision model (AI Weekly)](https://aiweekly.co/alerts/convai-ships-laya-a-421m-modernbert-decision-model-apache-20)
- [Top open-source Jev alternatives (DataCamp)](https://www.datacamp.com/es/blog/top-open-source-jev-alternatives)
- Jev: `docs/strategy/2026-10-02-final-goal.md` section 2.1

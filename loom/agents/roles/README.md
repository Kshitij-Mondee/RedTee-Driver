# Role cards for the API agent pipeline

A role card is the SYSTEM prompt core of one API agent: `_shared.md` plus the role's card. Depth comes on demand
through `get_skill_section(skill, section_id)`, where `section_id` is the exact `##` or `###` heading text cited in
the card's section 5. Tokens are approximate: characters / 3.8, measured on 2026-10-06.

| role card | stage | artifact | ~tokens | distils | date |
|---|---|---|---|---|---|
| `_shared.md` | every stage | (rules only) | 435 | CLAUDE.md rules 1, 5, 11, 12; brain architecture 2.3 | 2026-10-06 |
| `brief.md` | brief | `plan/brief.json` | 1475 | lnd-creative-director (+ reference/rubric.md), prompts/brief.md, gates `check_brief` | 2026-10-06 |
| `knowledge.md` | knowledge (topic mode) | `plan/knowledge.json` | 1312 | prompts/knowledge.md, gates `check_knowledge`, myth lists of lnd-learning-pedagogy and lnd-visual-design | 2026-10-06 |
| `skeptic.md` | knowledge, verifier (new) | skeptic verdict (no engine file yet) | 1359 | brain architecture V2, gates `check_knowledge`, the same myth lists | 2026-10-06 |
| `pedagogy.md` | pedagogy | `plan/teaching_plan.json` | 1587 | lnd-learning-pedagogy (+ rubric, teaching-plan), prompts/pedagogy.md, gates `check_pedagogy` | 2026-10-06 |
| `persona_pick.md` | persona (bounded pre-step) | pick: a `packs/personas` id or `none` | 696 | lnd-narrator-persona, prompts/persona.md | 2026-10-06 |
| `script.md` | script | `plan/script.json` | 1584 | prompts/script.md, lnd-explainer-craft, lnd-learning-pedagogy 8 and 10, lnd-visual-design 3, gates `check_script` | 2026-10-06 |
| `storyboard_outline.md` | storyboard, pass 1 (new) | outline: devices, value script, accent and treatment per section, beat lines (no schema yet) | 1595 | lnd-visual-storyteller, lnd-visual-design 5a and 5b, lnd-explainer-craft 3, STORYBOARD_GUIDE, TED-Ed learnings plan, loom-director (D-112), brain architecture 3 | 2026-10-06 |
| `storyboard.md` | storyboard, pass 2 | `plan/storyboard.json` | 1678 | prompts/storyboard.md, STORYBOARD_GUIDE, lnd-motion-fit, lnd-visual-design, lnd-motion-craft, lnd-explainer-craft, gates `check_storyboard` | 2026-10-06 |
| `scene.md` | scenes (one bespoke beat per call) | `scenes/<beat>.js` | 1670 | prompts/scene_author.md, loom-scene-author, lnd-motion-choreography-loop, lnd-motion-fit, lnd-motion-craft, docs/SCENE_API.md, gates `check_scenes` | 2026-10-06 |
| `critic.md` | review (V4 picture) | `qa/review.json` | 1701 | prompts/review.md, lnd-visual-design, lnd-motion-craft, lnd-explainer-craft 3, RATING_INTENT (D-107), D-109, brain architecture V4 | 2026-10-06 |
| `tweak.md` | tweak | complete updated files in scope, with a proof checklist | 1048 | loom-tweak, prompts/tweak.md | 2026-10-06 |

Every card has the same seven sections, in this order: role, inputs, non-negotiables, method, skill sections,
output contract, common failures.

`STORYBOARD_GUIDE#...` cites `docs/STORYBOARD_GUIDE.md`, which is not a skill: the runtime must serve it through
`get_skill_section` too. `get_api_section(name)` matches the leading words of a `##` heading in `docs/SCENE_API.md`.

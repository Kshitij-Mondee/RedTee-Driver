# Five styles for the stable version (2026-10-13)

Kshitij: "I want to focus primarily for the stable version on 5 styles. 2 proper corporate clean styles (example -
whiteboard/sketched), 1 semi corporate with some motion and maybe a bit hand drawn, 1 pure motion graphics professional
corporate clean style with a lot of motion and clean background and lastly 1 cinematic style (any). ... go through all the
styles we have and decide which ones would be the best ... Also report how mature and ready to use they are."

Styles are never ranked against each other (D-122): each slot is judged by what it is for. Evidence gathered 2026-10-13 from
packs/styles/*.json, docs/styles/guides, the style lint, tests/suites/style_system_golden.json, assets/sets, assets/rigs,
docs/styles/demos, every lesson's storyboard style, approvals and render dates, and AGENT_LEARNINGS.

## The thirteen packs

| style | reads as (short) | guide | golden test | lessons (approved) | newest film | demos |
|---|---|---|---|---|---|---|
| corporate-clean | calm corporate, light cool field, navy ink, one blue | 55 k | yes | 7 (3) | 2026-10-12 (Shuttle API) | 52 |
| story-cartoon | outlined story cartoon, paper ground, hand lettering | 61 k | yes | 9 (3) | 2026-10-11 (Relay) | 25 |
| flat-cosmos | Kurzgesagt-like flat night illustration | none | no | 2 (1) | 2026-10-11 (gps, rated 8.5) | 30 |
| whiteboard | hand-drawn marker on a white board (rough.js) | 59 k | no | 1 | 2026-09-30 (Cowork) | 25 |
| cinematic-noir | film-noir 2.5D, one warm key light, haze | 64 k | yes | 1 | 2026-10-02 (Cowork) | 23 |
| glow-flat | saturated flat world that glows, indigo | 54 k | yes | 1 | 2026-10-01 (Cowork) | 63 |
| editorial-paper | Vox-like paper, serif display, one red | none | no | 1 | 2026-10-06 (Cowork) | 12 |
| dark-technical | 3Blue1Brown-like, near-black, precise strokes | none | no | 3 (one film) | 2026-10-06 | 16 |
| line-art | monoline outlines on warm white, colour in lines | none | no | 0 | none | 3 |
| engineering | architecture-diagram, blueprint blue, dot grid | none | no | 0 | none | 8 |
| presenter-pop | presenter documentary, sage, cobalt and orange | none | no | 0 | none | 1 |
| cinematic-dawn | hopeful 2.5D sunrise, hills, light cones | none | no | 0 | none | 2 |
| chalk-lab | math on a near-black board, chalk strokes | none | no | 0 | none | 1 |

Every pack passes the style lint. Characters: one designed rig exists (Maya, for story-cartoon); every other style draws people
from the shared peeps coloured by its tokens, which CLAUDE.md rule 11 does not count as a designed kit. Drawn sets: one
(office/meeting_room in lit_25d, which serves cinematic-noir and cinematic-dawn).

## The five slots

| slot | pick | why it fits | readiness |
|---|---|---|---|
| 1. corporate clean, sketched | **whiteboard** | a marker drawing on white for working adults: onboarding, soft skills, how-to; one seeded line, identical every render | **Nearly ready.** Full guide, 25 demos; one film, from the Cowork era (2026-09-30), never made by Shuttle or Relay; no golden test; no designed people; no set |
| 2. corporate clean, sketched (second) | **line-art** (or editorial-paper) | line-art is clean monoline drawing with white space: concepts, processes, policy explainers, the truest "sketched and clean" partner to the whiteboard. Editorial-paper (Vox paper-cut, policy and leadership) is more proven but reads editorial, not sketched | **line-art: prototype** (no guide, no film, 3 demos). **editorial-paper: early** (no guide, one Cowork film 2026-10-06, 12 demos) |
| 3. semi-corporate, some motion, a bit hand drawn | **story-cartoon** | outlined cartoon, hand lettering, people in scenes: soft skills, case stories, policy in practice | **Ready.** Full guide, golden test, 9 lessons and 3 approved films through Shuttle and Relay, the one designed character rig (Maya); open: stacked-part and continuity fixes of today apply here first |
| 4. pure motion graphics, clean background | **corporate-clean** | calm corporate field, one confident blue for what is named, the system itself in motion: compliance, product, process | **Ready.** Full guide, golden test, 7 lessons, 3 approved films (Shuttle subscription and API), rated 8; open: no designed people, no sets for flat_editorial |
| 5. cinematic | **cinematic-noir** | 2.5D night, one key light, silhouettes, slow dolly: case studies, risk, security, ethics | **Nearly ready.** Full guide (the longest), golden test, 23 demos, the meeting-room set; one film from the Cowork era (2026-10-02); not yet made by an agent pipeline; its mood is dark, so it is not for cheerful onboarding (cinematic-dawn is the hopeful one, but a prototype) |

Not picked, and why: **flat-cosmos** made the best-rated film (8.5) but is a consumer space look the pack itself says to avoid
for sober compliance; **glow-flat** (saturated and glowing, wellbeing) fits none of the five; **dark-technical, chalk-lab,
engineering** are technical niches; **presenter-pop** and **cinematic-dawn** are prototypes. All stay available (D-70: keep
both ways), outside the stable five.

## What "stable" needs, per pick
- **Every pick:** a designed character kit (Claude Design first, `skills/lnd/lnd-character-design`), and one measured lesson
  through Shuttle on today's engine, rated by Kshitij.
- **whiteboard:** a golden test; a set style's sets (ink_wash has none).
- **line-art:** a style guide, a golden test, demos (or editorial-paper: a guide, a golden test).
- **cinematic-noir:** an agent-pipeline lesson (only Cowork has made one); more lit_25d sets beyond the meeting room.
- **story-cartoon, corporate-clean:** sets (story_cartoon and flat_editorial have none); corporate-clean's people kit.

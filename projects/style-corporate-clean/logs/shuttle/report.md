# Shuttle report: style-corporate-clean

Mode: api; lead: sonnet; written 2026-10-14T08:52:31.

Shuttle: style-corporate-clean  current P8
      P1   brief                    accepted  
      P2   facts                    accepted  
      P3   pedagogy                 accepted  
      P4   persona and script       accepted  
      P5   storyboard               accepted  
      P6   narration and animatic   accepted  
      P7   lesson kit               accepted  
      P8   beats                    open      stage scenes is pending; beat files not accepted yet: scenes/b02.js, scenes/b03.js, scenes/b04.js, scenes/b05.js, scenes/b06.js, scenes/b07.js, scenes/b08.js, scenes/b09.js ...
      P9   compose and check        open      stage compose is pending; stage check is pending
      P10  critique and fix         open      critic_review of the current build; stage review is pending
      P11  render                   open      stage render is pending
      spent: $7.7377, 7651642 tokens, 131 calls; limits {'usd': 10.0}; reopens 0 of 3; for named beats 1 of 8

## Cost (USD at the engine's price table)
- total $7.7377, 7651642 tokens, 131 model calls; cache reads 6838158 of 7437364 input tokens (92 %)
- by phase: - $0.0306 (1), P1 $0.3206 (10), P2 $0.2049 (10), P3 $0.3383 (9), P4 $0.4375 (6), P5 $4.0958 (54), P6 $0.3888 (11), P7 $1.6759 (25), P8 $0.2453 (5)
- by agent: lead $6.1957 (108), shuttle-fact-finder $0.0912 (5), shuttle-kit-builder $1.4202 (17), skeptic $0.0306 (1)
- models: claude-opus-5-5 x87, claude-sonnet-5-5 x43, gemini-3.8-flash x1
- sessions (the CLI's own figures; a resumed session's are cumulative): P1-P4 success 33 turns $1.4335 (0 cache misses); P6 success 5 turns $0.0932 (0 cache misses); P5 success 13 turns $0.6128 (0 cache misses); P6 success 4 turns $0.0448 (0 cache misses); P7 success 12 turns $1.9120 (0 cache misses)
- the CLI's own total, each session counted once: $4.0963 (the table above prices the same tokens from the engine's table)

## Reopens
- used: 0 of 3; for named beats 1 of 8
- 2026-10-14T08:38:10 P5 for b01, b14 by lead: Animatic shows b01 and b14 as presenter avatar beats, but the request notes say "pure motion graphics ... no presenter" and the brief must_avoid people. Both storyboard scenes already carry a "motion graphics, no presenter" alternative; patch them to bespoke board scenes (b01: laptop + Report + Due tomorrow tag, held into b02; b14: the persistent 3/2/1 system board as a checklist, closing on the opening laptop/Report changed by what was learned). Also record design.references for the drawn beats per REFERENCE_FIRST. (stale P5; voided none)

## Delegations
- own-fact-finder-091308b5 fact-finder  collected: 5 calls, accepted ['submit_knowledge'], refused 0, snapshots 0
- own-kit-builder-f3cb7ee1 kit-builder  collected: 10 calls, accepted [], refused 0, snapshots 0
- own-kit-builder-2799db47 kit-builder  collected: 13 calls, accepted ['submit_kit'], refused 0, snapshots 3

## Tool calls (tool, outcome, count)
- animatic ok: 2
- catalog_search ok: 1
- choose_persona ok: 1
- collect ok: 3
- delegate ok: 3
- get_api_section error: 2
- get_api_section ok: 11
- get_beat ok: 6
- get_example_scene ok: 3
- get_skill_section ok: 22
- get_source_chunks ok: 2
- get_style_pack ok: 4
- kit_preview error: 1
- kit_preview ok: 3
- lesson_status ok: 4
- list_skill_sections ok: 8
- narrate ok: 2
- note ok: 5
- patch_storyboard ok: 2
- patch_storyboard refused: 1
- read_artifact error: 3
- read_artifact ok: 11
- reopen ok: 1
- report_finding ok: 1
- request_approval ok: 2
- skeptic_review ok: 1
- submit_brief ok: 4
- submit_kit ok: 1
- submit_knowledge ok: 2
- submit_outline ok: 3
- submit_script ok: 3
- submit_storyboard ok: 4
- submit_teaching_plan ok: 3

## Refusals by the rails
- patch_storyboard (lead): a reopen for named beats changes those beats' scenes; the kit and the value script are not theirs (reopen without beats)

## What the lead looked at
- animatic 2 (lead)
- animatic 2 (lead)
- kit_preview  (lead)

## Hook denials
- none

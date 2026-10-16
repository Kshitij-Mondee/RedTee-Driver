# Shuttle report: style-line-art

Mode: api; lead: sonnet; written 2026-10-13T18:05:40.

Shuttle: style-line-art  current P8
      P1   brief                    accepted  
      P2   facts                    accepted  
      P3   pedagogy                 accepted  
      P4   persona and script       accepted  
      P5   storyboard               accepted  
      P6   narration and animatic   accepted  
      P7   lesson kit               accepted  
      P8   beats                    open      stage scenes is pending; beat files not accepted yet: scenes/b01.js, scenes/b03.js, scenes/b04.js, scenes/b05.js, scenes/b06.js, scenes/b07.js, scenes/b08.js, scenes/b09.js ...
      P9   compose and check        open      stage compose is pending; stage check is pending
      P10  critique and fix         open      critic_review of the current build; stage review is pending
      P11  render                   open      stage render is pending
      spent: $5.4365, 4237616 tokens, 108 calls; limits {'usd': 8.0}; reopens 0 of 3; for named beats 0 of 8

## Cost (USD at the engine's price table)
- total $5.4365, 4237616 tokens, 108 model calls; cache reads 3505551 of 4013832 input tokens (87 %)
- by phase: - $0.0640 (2), P1 $0.2676 (7), P2 $0.2514 (10), P3 $0.2921 (6), P4 $0.5303 (11), P5 $1.2854 (19), P6 $0.2938 (6), P7 $2.2611 (42), P8 $0.1907 (5)
- by agent: lead $3.3090 (71), shuttle-fact-finder $0.1269 (5), shuttle-kit-builder $1.9367 (30), skeptic $0.0640 (2)
- models: claude-opus-5-5 x51, claude-sonnet-5-5 x55, gemini-3.8-flash x2
- sessions (the CLI's own figures; a resumed session's are cumulative): P1-P4 success 32 turns $1.4724 (0 cache misses); P5 success 19 turns $1.3355 (0 cache misses); P6 success 5 turns $0.1313 (1 cache misses); P7 success 15 turns $2.4334 (1 cache misses)
- the CLI's own total, each session counted once: $5.3725 (the table above prices the same tokens from the engine's table)

## Reopens
- used: 0 of 3; for named beats 0 of 8
- none

## Delegations
- own-fact-finder-742403ed fact-finder  collected: 4 calls, accepted ['submit_knowledge'], refused 0, snapshots 0
- own-kit-builder-b8990711 kit-builder ['b01', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09', 'b10', 'b11', 'b12', 'b13'] collected: 18 calls, accepted [], refused 0, snapshots 0
- own-kit-builder-14b2a9cf kit-builder ['b01', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09', 'b10', 'b11', 'b12', 'b13'] collected: 11 calls, accepted [], refused 0, snapshots 0
- own-kit-builder-20623a36 kit-builder ['b01', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09', 'b10', 'b11', 'b12', 'b13'] collected: 14 calls, accepted ['submit_kit'], refused 0, snapshots 5

## Tool calls (tool, outcome, count)
- animatic ok: 1
- budget_status ok: 1
- catalog_search ok: 2
- choose_persona ok: 1
- collect ok: 4
- delegate ok: 4
- get_api_section ok: 25
- get_example_scene error: 1
- get_example_scene ok: 4
- get_skill_section ok: 12
- get_source_chunks ok: 1
- get_style_pack ok: 4
- kit_preview error: 1
- kit_preview ok: 5
- lesson_status ok: 4
- list_skill_sections ok: 6
- narrate ok: 1
- note ok: 7
- read_artifact error: 4
- read_artifact ok: 11
- request_approval ok: 2
- skeptic_review ok: 1
- submit_brief ok: 3
- submit_kit ok: 1
- submit_knowledge ok: 2
- submit_outline ok: 3
- submit_script ok: 3
- submit_storyboard ok: 3
- submit_teaching_plan ok: 3

## Refusals by the rails
- none

## What the lead looked at
- animatic 2 (lead)
- kit_preview  (lead)

## Hook denials
- none

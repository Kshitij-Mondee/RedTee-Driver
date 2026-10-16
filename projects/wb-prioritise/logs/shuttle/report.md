# Shuttle report: wb-prioritise

Mode: api; lead: sonnet; written 2026-10-15T20:05:06.

Shuttle: wb-prioritise  current P8
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
      spent: $6.8655, 5762701 tokens, 103 calls; limits {'usd': 8.0}; reopens 0 of 3; for named beats 1 of 8

## Cost (USD at the engine's price table)
- total $6.8655, 5762701 tokens, 103 model calls; cache reads 4673446 of 5585063 input tokens (84 %)
- by phase: - $0.0237 (1), P1 $0.2666 (7), P2 $0.2447 (9), P3 $0.2661 (6), P4 $0.5656 (10), P5 $2.3143 (31), P6 $0.4240 (11), P7 $2.4701 (22), P8 $0.2904 (6)
- by agent: lead $4.4160 (79), shuttle-fact-finder $0.1228 (4), shuttle-kit-builder $2.3029 (19), skeptic $0.0237 (1)
- models: claude-opus-5-5 x62, claude-sonnet-5-5 x40, gemini-3.8-flash x1
- sessions (the CLI's own figures; a resumed session's are cumulative): P1-P4 success 27 turns $1.3140 (0 cache misses); P5 success 24 turns $1.9539 (0 cache misses); P6 success 5 turns $0.0844 (0 cache misses); P1-P4 success 5 turns $0.1860 (0 cache misses); P5 success 6 turns $0.5045 (0 cache misses); P6 success 4 turns $0.0471 (0 cache misses); P7 success 8 turns $2.7517 (1 cache misses)
- the CLI's own total, each session counted once: $6.8417 (the table above prices the same tokens from the engine's table)

## Reopens
- used: 0 of 3; for named beats 1 of 8
- 2026-10-15T19:52:44 P4 for b01, b13 by lead: TTS/ASR mismatch: 'Every one' heard as 'Everyone', 're-sort' heard as 'resort'. Reword to unambiguous lines. (stale P4; voided none)

## Delegations
- own-fact-finder-d7fd3cb2 fact-finder  collected: 3 calls, accepted ['submit_knowledge'], refused 0, snapshots 0
- own-kit-builder-89ece483 kit-builder ['b02', 'b05', 'b08'] collected: 21 calls, accepted ['submit_kit'], refused 0, snapshots 9

## Tool calls (tool, outcome, count)
- animatic ok: 1
- catalog_search ok: 1
- choose_persona ok: 1
- collect ok: 2
- delegate ok: 2
- get_api_section ok: 6
- get_beat ok: 4
- get_catalog_entry error: 1
- get_example_scene ok: 3
- get_skill_section ok: 14
- get_source_chunks ok: 1
- get_style_pack ok: 3
- kit_preview error: 1
- kit_preview ok: 9
- lesson_status ok: 4
- list_skill_sections ok: 3
- narrate error: 1
- narrate ok: 1
- note ok: 8
- patch_script ok: 1
- read_artifact error: 1
- read_artifact ok: 12
- reopen ok: 1
- request_approval ok: 2
- skeptic_review ok: 1
- submit_brief ok: 3
- submit_kit ok: 1
- submit_knowledge ok: 2
- submit_outline ok: 4
- submit_script ok: 2
- submit_storyboard ok: 4
- submit_teaching_plan ok: 3

## Refusals by the rails
- none

## What the lead looked at
- animatic 2 (lead)
- kit_preview  (lead)

## Hook denials
- none

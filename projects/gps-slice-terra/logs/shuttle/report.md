# Shuttle report: gps-slice-terra

Mode: api; lead: sonnet; written 2026-10-12T22:25:21.

Shuttle: gps-slice-terra  current P10
      P1   brief                    accepted  
      P2   facts                    accepted  
      P3   pedagogy                 accepted  
      P4   persona and script       accepted  
      P5   storyboard               accepted  
      P6   narration and animatic   accepted  
      P7   lesson kit               accepted  
      P8   beats                    accepted  
      P9   compose and check        accepted  
      P10  critique and fix         open      critic_review of the current build; stage review is pending
      P11  render                   open      stage render is pending
      spent: $2.7246, 4101065 tokens, 124 calls; limits {'usd': 6.0}; reopens 0 of 3; for named beats 0 of 8

## Cost (USD at the engine's price table)
- total $2.7246, 4101065 tokens, 124 model calls; cache reads 3389780 of 4044504 input tokens (84 %)
- by phase: P10 $0.0506 (5), P8 $2.3763 (114), P9 $0.2976 (5)
- by agent: lead $0.6422 (18), shuttle-scene-author $2.0824 (106)
- models: claude-sonnet-5-5 x18, gpt-5.6-terra x106
- sessions (the CLI's own figures; a resumed session's are cumulative): P8 success 12 turns $2.6262 (1 cache misses); P9 success 6 turns $0.0984 (0 cache misses)
- the CLI's own total, each session counted once: $2.7246 (the table above prices the same tokens from the engine's table)

## Reopens
- used: 0 of 3; for named beats 0 of 8
- none

## Delegations
- own-scene-author-87a03b71 scene-author ['b08'] collected: 16 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-scene-author-8a849250 scene-author ['b09'] collected: 17 calls, accepted ['submit_scene'], refused 0, snapshots 5
- own-scene-author-d55b5524 scene-author ['b10'] collected: 10 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-4ce59a94 scene-author ['b11'] collected: 13 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-scene-author-15da92c1 scene-author ['b12'] collected: 12 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-78b4bbda scene-author ['b13'] collected: 18 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-6956ec0a scene-author ['b14'] collected: 12 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-scene-author-b0a7b1b3 scene-author ['b15'] collected: 20 calls, accepted ['submit_scene'], refused 0, snapshots 6
- own-scene-author-60d15423 scene-author ['b16'] collected: 19 calls, accepted ['submit_scene'], refused 0, snapshots 8
- own-scene-author-44b8122c scene-author ['b17'] collected: 8 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-scene-author-db18b91e scene-author ['b18'] collected: 8 calls, accepted ['submit_scene'], refused 0, snapshots 1

## Tool calls (tool, outcome, count)
- check ok: 1
- collect ok: 2
- contact_sheet ok: 2
- delegate ok: 2
- get_api_section error: 3
- get_api_section ok: 49
- get_example_scene ok: 6
- get_skill_section ok: 4
- get_style_pack ok: 4
- lab_snapshot ok: 34
- lesson_status ok: 3
- note ok: 2
- pilot_check ok: 1
- read_artifact error: 11
- read_artifact ok: 35
- report_finding ok: 8
- strips ok: 1
- submit_scene ok: 11

## Refusals by the rails
- none

## What the lead looked at
- strips b10-b12 (lead)
- contact_sheet ['b08', 'b09', 'b10', 'b11', 'b12', 'b13', 'b14', 'b15', 'b16'] (lead)
- contact_sheet ['b17', 'b18'] (lead)

## Hook denials
- none

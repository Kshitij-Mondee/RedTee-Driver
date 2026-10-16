# Shuttle report: wb-prioritise-engine

Mode: api; lead: sonnet; written 2026-10-15T22:11:57.

Shuttle: wb-prioritise-engine  current done
      P1   brief                    accepted  
      P2   facts                    accepted  
      P3   pedagogy                 accepted  
      P4   persona and script       accepted  
      P5   storyboard               accepted  
      P6   narration and animatic   accepted  
      P7   lesson kit               accepted  
      P8   beats                    accepted  
      P9   compose and check        accepted  
      P10  critique and fix         accepted  
      P11  render                   accepted  
      spent: $4.6408, 7264464 tokens, 204 calls; limits {'usd': 10.0}; reopens 0 of 3; for named beats 0 of 8

## Cost (USD at the engine's price table)
- total $4.6408, 7264464 tokens, 204 model calls; cache reads 5892545 of 7129485 input tokens (83 %)
- by phase: - $0.3632 (25), P10 $0.6543 (48), P11 $0.0657 (3), P8 $3.3655 (115), P9 $0.1921 (13)
- by agent: critic $0.3566 (24), lead $1.0138 (57), shuttle-fixer $1.0113 (54), shuttle-scene-author $2.2591 (69)
- models: claude-sonnet-5-5 x57, gpt-5.6-terra x123, gemini-3.8-flash x24
- sessions (the CLI's own figures; a resumed session's are cumulative): P8 success 10 turns $2.6076 (0 cache misses); P9 success 2 turns $0.0550 (0 cache misses); P9 success 4 turns $0.0272 (0 cache misses); P10 success 20 turns $1.2845 (0 cache misses); P10 success 12 turns $0.1844 (0 cache misses); P10 success 6 turns $0.0622 (0 cache misses); P11 success 3 turns $0.0633 (0 cache misses)
- the CLI's own total, each session counted once: $4.2842 (the table above prices the same tokens from the engine's table)

## Reopens
- used: 0 of 3; for named beats 0 of 8
- none

## Delegations
- own-scene-author-33cc9d43 scene-author ['b02', 'b03'] collected: 12 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 3
- own-scene-author-a15f27ec scene-author ['b04', 'b05', 'b06'] collected: 21 calls, accepted ['submit_scene', 'submit_scene', 'submit_scene', 'submit_scene'], refused 0, snapshots 7
- own-scene-author-e9eb46cf scene-author ['b07', 'b08', 'b09'] collected: 19 calls, accepted ['submit_scene', 'submit_scene', 'submit_scene'], refused 0, snapshots 6
- own-scene-author-27778588 scene-author ['b10', 'b11', 'b12'] collected: 22 calls, accepted ['submit_scene', 'submit_scene', 'submit_scene'], refused 0, snapshots 10
- own-scene-author-613c2871 scene-author ['b13'] collected: 15 calls, accepted ['submit_scene'], refused 0, snapshots 5
- own-fixer-9b7f0938 fixer ['b05'] collected: 4 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-43fafdff fixer ['b08', 'b09'] collected: 8 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 2
- own-fixer-c2badaf3 fixer ['b10', 'b11'] collected: 19 calls, accepted [], refused 0, snapshots 10
- own-fixer-a1710dcc fixer ['b12', 'b13'] collected: 10 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 4
- own-fixer-36ded82f fixer ['b10', 'b11'] collected: 8 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 3
- own-fixer-ea22a1db fixer ['b07', 'b08', 'b09'] collected: 9 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 3
- own-fixer-a5a5b917 fixer ['b07'] collected: 4 calls, accepted ['submit_scene'], refused 0, snapshots 1

## Tool calls (tool, outcome, count)
- check ok: 5
- collect ok: 6
- contact_sheet ok: 10
- critic_review ok: 4
- delegate ok: 6
- get_api_section error: 3
- get_api_section ok: 20
- get_example_scene ok: 1
- get_style_pack ok: 6
- lab_snapshot ok: 55
- lesson_status ok: 6
- note ok: 6
- pilot_check ok: 1
- read_artifact error: 1
- read_artifact ok: 43
- render ok: 1
- report_finding ok: 5
- request_approval ok: 1
- submit_review ok: 6
- submit_scene ok: 24

## Refusals by the rails
- none

## What the lead looked at
- contact_sheet ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09'] (lead)
- contact_sheet ['b10', 'b11', 'b12', 'b13'] (lead)
- contact_sheet ['b12', 'b13', 'b06'] (lead)
- contact_sheet ['b05', 'b08', 'b10', 'b11', 'b12', 'b13'] (lead)
- contact_sheet ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09'] (lead)
- contact_sheet ['b10', 'b11', 'b12', 'b13'] (lead)
- contact_sheet ['b07', 'b10', 'b12'] (lead)
- contact_sheet ['b07', 'b08', 'b09'] (lead)
- contact_sheet ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09'] (lead)
- contact_sheet ['b10', 'b11', 'b12', 'b13'] (lead)

## Hook denials
- none

## Defects from the last check, by owner
- script: 0
- storyboard: 0
- kit: 0
- scene: 0
- engine: 13

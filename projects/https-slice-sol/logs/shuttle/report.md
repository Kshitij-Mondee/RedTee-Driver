# Shuttle report: https-slice-sol

Mode: api; lead: sonnet; written 2026-10-13T15:22:20.

Shuttle: https-slice-sol  current P10
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
      spent: $3.6328, 8917567 tokens, 239 calls; limits {'usd': 5.0}; reopens 0 of 3; for named beats 0 of 8

## Cost (USD at the engine's price table)
- total $3.6328, 8917567 tokens, 239 model calls; cache reads 7829550 of 8857533 input tokens (88 %)
- by phase: P10 $0.0342 (3), P8 $3.3615 (214), P9 $0.2371 (22)
- by agent: lead $0.7597 (29), shuttle-fixer $0.5298 (72), shuttle-scene-author $2.3432 (138)
- models: claude-sonnet-5-5 x29, gpt-6.1-sol x210
- sessions (the CLI's own figures; a resumed session's are cumulative): P8 success 21 turns $3.4090 (1 cache misses); P9 success 8 turns $0.2238 (0 cache misses)
- the CLI's own total, each session counted once: $3.6328 (the table above prices the same tokens from the engine's table)

## Reopens
- used: 0 of 3; for named beats 0 of 8
- none

## Delegations
- own-scene-author-a46081dc scene-author ['b01'] collected: 14 calls, accepted [], refused 0, snapshots 2
- own-scene-author-f6508c15 scene-author ['b02'] collected: 18 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-fixer-d9ccebde fixer ['b01'] collected: 10 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-71079948 scene-author ['b03'] collected: 15 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-ddde6634 scene-author ['b04'] collected: 16 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-a9f7ebf1 scene-author ['b05'] collected: 21 calls, accepted [], refused 0, snapshots 4
- own-scene-author-c8b21bf9 scene-author ['b06'] collected: 23 calls, accepted ['submit_scene'], refused 0, snapshots 5
- own-scene-author-6768a072 scene-author ['b07'] collected: 16 calls, accepted [], refused 0, snapshots 2
- own-scene-author-b17b410f scene-author ['b08'] collected: 18 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-scene-author-cfa49221 scene-author ['b09'] collected: 25 calls, accepted [], refused 0, snapshots 3
- own-scene-author-89bfe1d5 scene-author ['b10'] collected: 21 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-scene-author-3d429a41 scene-author ['b11'] collected: 11 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-0891f83a scene-author ['b12'] collected: 12 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-a5833ea2 fixer ['b05'] collected: 21 calls, accepted [], refused 0, snapshots 4
- own-fixer-3bea24f9 fixer ['b07'] collected: 10 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-fixer-e4f7aff2 fixer ['b09'] collected: 15 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-fixer-c5a26f51 fixer ['b05'] collected: 10 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-fixer-2520044c fixer ['b02'] collected: 6 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-575e2888 fixer ['b07'] collected: 7 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-95026b5f fixer ['b10'] collected: 4 calls, accepted ['submit_scene'], refused 0, snapshots 1

## Tool calls (tool, outcome, count)
- budget_status ok: 1
- check ok: 2
- collect ok: 6
- contact_sheet error: 1
- contact_sheet ok: 2
- delegate ok: 6
- get_api_section error: 5
- get_api_section ok: 75
- get_beat ok: 3
- get_example_scene ok: 11
- get_style_pack ok: 12
- lab_snapshot ok: 49
- lesson_status ok: 4
- note ok: 2
- pilot_check ok: 1
- read_artifact error: 15
- read_artifact ok: 84
- report_finding ok: 23
- submit_scene ok: 20

## Refusals by the rails
- none

## What the lead looked at
- contact_sheet ['b02', 'b07', 'b10'] (lead)
- contact_sheet ['b04', 'b05', 'b06'] (lead)

## Hook denials
- none

## Defects from the last check, by owner
- script: 0
- storyboard: 2
- kit: 0
- scene: 1
- engine: 0

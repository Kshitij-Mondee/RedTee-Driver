# Shuttle report: lg-trial-share-links

Mode: api; lead: sonnet; written 2026-10-16T03:36:48.

Shuttle: lg-trial-share-links  current P8
      P1   brief                    accepted  
      P2   facts                    accepted  
      P3   pedagogy                 accepted  
      P4   persona and script       accepted  
      P5   storyboard               accepted  
      P6   narration and animatic   accepted  
      P7   lesson kit               accepted  
      P8   beats                    open      stage scenes is pending; beat files not accepted yet: scenes/b01.js, scenes/b02.js, scenes/b04.js, scenes/b05.js, scenes/b06.js, scenes/b07.js, scenes/b08.js, scenes/b09.js ...
      P9   compose and check        open      stage compose is pending; stage check is pending
      P10  critique and fix         open      critic_review of the current build; stage review is pending
      P11  render                   open      stage render is pending
      spent: $5.1124, 7360728 tokens, 119 calls; limits {'usd': 25.0}; reopens 0 of 3; for named beats 1 of 8

## Cost (USD at the engine's price table)
- total $5.1124, 7360728 tokens, 119 model calls; cache reads 6674013 of 7223125 input tokens (92 %)
- by phase: - $0.0234 (1), P1 $0.2365 (7), P2 $0.1650 (9), P3 $0.1979 (6), P4 $1.1008 (26), P5 $2.2281 (29), P6 $0.4712 (12), P7 $0.5909 (24), P8 $0.0987 (5)
- by agent: lead $4.6297 (93), shuttle-fact-finder $0.0725 (4), shuttle-kit-builder $0.3868 (21), skeptic $0.0234 (1)
- models: claude-sonnet-5-5 x68, gemini-3.8-flash x1, claude-opus-5-5 x29, gpt-6.1-sol x21
- sessions (the CLI's own figures; a resumed session's are cumulative): P1-P4 success 43 turns $1.7276 (0 cache misses); P5 success 23 turns $2.1155 (0 cache misses); P6 success 5 turns $0.1279 (1 cache misses); P1-P4 success 5 turns $0.1090 (0 cache misses); P5 success 6 turns $0.2746 (0 cache misses); P6 success 4 turns $0.0545 (0 cache misses); P7 success 7 turns $0.6799 (0 cache misses)
- the CLI's own total, each session counted once: $5.0889 (the table above prices the same tokens from the engine's table)

## Reopens
- used: 0 of 3; for named beats 1 of 8
- 2026-10-16T03:29:33 P4 for b16, b25 by lead: Narration ASR check refuses two phrases. b16.1 'Same forward, on named people.' heard as 'unnamed people': reword e.g. 'Same forward, but the link is set to named people.' (keep the timing close). b25.3 'View or edit?' heard as 'Review or edit.': reword e.g. 'Can they view it, or edit it?' (on_screen card text 'View or edit?' may stay). Patch only those two lines, then P6 narrate again. Note: I have no patch_script tool in this session. (stale P4; voided none)

## Delegations
- own-fact-finder-513658ca fact-finder  collected: 3 calls, accepted ['submit_knowledge'], refused 0, snapshots 0
- own-kit-builder-a638e3f4 kit-builder ['b01', 'b04', 'b07', 'b12'] collected: 25 calls, accepted ['submit_kit'], refused 0, snapshots 4

## Tool calls (tool, outcome, count)
- accept_phase ok: 2
- animatic ok: 1
- capabilities ok: 3
- catalog_search ok: 1
- choose_persona ok: 1
- collect ok: 2
- delegate ok: 2
- get_api_section error: 2
- get_api_section ok: 8
- get_beat ok: 2
- get_catalog_entry error: 1
- get_catalog_entry ok: 2
- get_example_scene error: 1
- get_example_scene ok: 1
- get_skill_section ok: 21
- get_style_pack ok: 4
- kit_preview error: 1
- kit_preview ok: 4
- lesson_status ok: 5
- list_skill_sections error: 1
- list_skill_sections ok: 7
- narrate error: 1
- narrate ok: 1
- note ok: 9
- patch_script ok: 1
- read_artifact error: 4
- read_artifact ok: 15
- reopen ok: 1
- report_finding ok: 1
- request_approval ok: 2
- skeptic_review ok: 1
- submit_brief ok: 3
- submit_kit ok: 2
- submit_knowledge ok: 1
- submit_outline ok: 5
- submit_script ok: 10
- submit_storyboard ok: 2
- submit_teaching_plan ok: 2

## Refusals by the rails
- none

## What the lead looked at
- animatic 3 (lead)
- kit_preview  (lead)

## Hook denials
- none

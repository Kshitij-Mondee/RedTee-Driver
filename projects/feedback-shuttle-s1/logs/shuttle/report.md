# Shuttle report: feedback-shuttle-s1

Mode: subscription; lead: sonnet; written 2026-10-08T15:59:26.

Shuttle: feedback-shuttle-s1  current P6  WAITING plan
      P1   brief                    accepted  
      P2   facts                    accepted  
      P3   pedagogy                 accepted  
      P4   persona and script       accepted  
      P5   storyboard               accepted  
      P6   narration and animatic   stale     reopened at 2026-10-08T15:57:46: redo it, or accept_phase('P6') if it still holds; approval: plan (request_approval('plan', ...), then a person approves)
      P7   lesson kit               stale     reopened at 2026-10-08T15:57:46: redo it, or accept_phase('P7') if it still holds
      P8   beats                    stale     reopened at 2026-10-08T15:57:46: redo it, or accept_phase('P8') if it still holds; stage scenes is stale
      P9   compose and check        stale     reopened at 2026-10-08T15:57:46: redo it, or accept_phase('P9') if it still holds; stage compose is stale
      P10  critique and fix         stale     reopened at 2026-10-08T15:57:46: redo it, or accept_phase('P10') if it still holds; critic_review of the current build
      P11  render                   stale     reopened at 2026-10-08T15:57:46: redo it, or accept_phase('P11') if it still holds; stage render is pending
      spent: $9.7683 (notional), 14773003 tokens, 185 calls; limits {'usd': 25.0}; reopens 1 of 3

## Cost (USD at the engine's price table; notional in subscription mode)
- total $9.7683, 14773003 tokens, 185 model calls; cache reads 13557399 of 14607013 input tokens (93 %)
- by phase: - $0.0182 (1), P1 $0.2922 (14), P2 $0.2277 (12), P3 $0.4921 (11), P4 $0.2529 (11), P5 $2.1515 (33), P6 $3.0327 (15), P8 $2.7472 (74), P9 $0.5538 (14)
- by agent: lead $5.6892 (124), reconcile $2.0951 (1), shuttle-fact-finder $0.0462 (3), shuttle-scene-author $1.9195 (56), skeptic $0.0182 (1)
- models: claude-sonnet-5 x184, gemini-3.8-flash x1
- sessions (the CLI's own figures): P1-P4 success 30 turns $0.7692 (1 cache misses); P1-P4 success 40 turns $1.1574 (0 cache misses); P5-P6 success 60 turns $2.2862 (0 cache misses); P7-P9 success 59 turns $5.7866 (1 cache misses)

## Reopens
- 2026-10-08T15:57:46 P5 by lead: check found 5 storyboard-owned defects: b01/b14 avatar `card` prop was passed as a plain string array but the avatar schema requires an object ({lines, title, rule, say}) - avatar_props_unknown on card.0/1/2; b02/b06 hero.character_moment item labels ("Same update", "Still confused", "What differently?") overflow the 30px label floor - need shorter label text (the spoken "say" anchors are unaffected); b11 quiz.question's option B "say" anchor pointed at the tail of its own narration ("what got left out", ~96.5s) leaving a 10.1s static gap after option A reveals (~86.4s) - re-anchoring option B's "say" to the start of its own narration ("when the blockers were mixed into the timeline", ~90.2s) closes the gap. No visual-intent or device changes; bespoke scene files (P8) are unaffected by any of these five fixes. (stale P5, P6, P7, P8, P9, P10, P11; voided plan, final)

## Delegations
- own-fact-finder-110b0fcd fact-finder  collected: 4 calls, accepted ['submit_knowledge'], refused 0, snapshots 0
- own-scene-author-bab494de scene-author ['b04'] collected: 18 calls, accepted ['submit_scene'], refused 0, snapshots 5
- own-scene-author-9fede4f9 scene-author ['b13'] collected: 26 calls, accepted ['submit_scene'], refused 0, snapshots 6
- own-scene-author-5099c5d8 scene-author ['b05'] collected: 9 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-48da3e49 scene-author ['b07'] collected: 17 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-cdfafa73 scene-author ['b08'] collected: 13 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-f04eedc1 scene-author ['b10'] collected: 8 calls, accepted ['submit_scene'], refused 0, snapshots 1

## Tool calls (tool, outcome, count)
- animatic ok: 2
- capabilities ok: 5
- catalog_search ok: 7
- check ok: 1
- choose_persona ok: 1
- collect ok: 7
- compose ok: 1
- delegate ok: 7
- get_api_section error: 2
- get_api_section ok: 32
- get_api_section refused: 4
- get_beat ok: 14
- get_catalog_entry error: 1
- get_catalog_entry ok: 11
- get_example_scene error: 3
- get_example_scene ok: 8
- get_skill_section error: 2
- get_skill_section ok: 30
- get_source_chunks ok: 1
- get_style_pack ok: 4
- lab_snapshot ok: 19
- lesson_status ok: 8
- list_skill_sections error: 3
- list_skill_sections ok: 13
- narrate ok: 2
- note ok: 4
- patch_script refused: 1
- patch_storyboard ok: 1
- patch_storyboard refused: 1
- read_artifact error: 2
- read_artifact ok: 22
- reopen ok: 1
- request_approval ok: 3
- skeptic_review ok: 1
- submit_brief ok: 2
- submit_knowledge ok: 2
- submit_outline ok: 1
- submit_scene ok: 6
- submit_script ok: 1
- submit_storyboard ok: 2
- submit_teaching_plan ok: 3

## Refusals by the rails
- patch_script (lead): P4 (persona and script) is accepted; to change it call reopen('P4', reason): that marks P4 and every later phase stale and counts against the reopen cap
- get_api_section (lead): a sub-agent (scene-author) called without its owner token: pass `owner`
- get_api_section (lead): a sub-agent (scene-author) called without its owner token: pass `owner`
- get_api_section (lead): a sub-agent (scene-author) called without its owner token: pass `owner`
- get_api_section (lead): a sub-agent (scene-author) called without its owner token: pass `owner`
- patch_storyboard (lead): P5 (storyboard) is accepted; to change it call reopen('P5', reason): that marks P5 and every later phase stale and counts against the reopen cap

## What the lead looked at
- animatic 2 (lead)
- animatic 2 (lead)

## Hook denials
- none

## Defects from the last check, by owner
- script: 0
- storyboard: 6
- scene: 2
- engine: 0

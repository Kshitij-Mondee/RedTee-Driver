---
name: loom-tweak
description: Make a small, scoped change to an existing Loom lesson with a cheap model - move or resize an element, change a word on screen, swap an icon, retime a reveal to a different spoken word, change a join, adjust a colour token - without breaking anchors, determinism or grounding. Use for review findings, requester notes on a rendered lesson ("make the title bigger in b07", "use the calendar icon"), and any edit that touches one beat.
---

# Loom tweak

1. `py -m loom tweak <id> "<the change>" --beat bXX` writes `tasks/tweak-NN.md` listing the ONLY files
   you may edit (the beat's storyboard entry, its scene file, its script lines if words change).
   (`--api` sends it to the configured cheap model directly.)
2. Change the smallest thing that satisfies the request. Keep ids, element names, anchors and structure.
3. Anchors must stay words the beat's narration speaks (check `audio/timings.json`). Changing narration
   words means re-running narrate, which re-times everything downstream automatically.
4. Never add a fact, number or claim; no em/en dashes; colours are tokens.
5. Prove: `py -m loom accept <id> storyboard`, `py -m loom accept <id> scenes`, `py -m loom go <id>
   --until check`, then look at `qa/sheets/<beat>.jpg`.

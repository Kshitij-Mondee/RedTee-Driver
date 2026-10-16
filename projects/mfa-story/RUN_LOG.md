# mfa-story run log (2026-10-06)

Why: Kshitij watched `mfa-explained` and said the concept was not explained the right way, the style was wrong and
there were random dots. Review: `projects/mfa-explained/REVIEW_2026-10-06.md`. He approved a rebuild.

What was carried over: the approved knowledge sheet (unchanged facts; approval recorded as carried over), the teaching
plan (carriers rewritten for the story), the analyst persona. Rewritten: brief posture and visual direction (an
invented thief is allowed, never a hooded hacker), the script (one story in four turns, 380 words), the storyboard.

Deviations and decisions:
- Mix set to 95 % drawn so the allocation left one template (the three rules); the pause-and-predict beat is drawn in
  the story, not a quiz card.
- The library of drawings (sign-in page, phone, laptop, monitor, the person from behind, split frame, chips) is at
  the top of `scenes/b01.js` because compose loads only beat files; promote it to the runtime if a second lesson needs it.
- Camera joins were turned into light fades: compose turned pans between different places into dips to black, seven
  of them in three minutes.
- Bugs found by looking at frames and fixed: the portrait rig left at joins (hold its `_rig` element), the relay chips
  visible from load (L-228), tags placed over screens, the b19 code chip hidden behind its monitor, a tight inset on the
  closing line.

Proof: `accept` for every stage; compose; runtime report 0 errors and 0 warnings in a headless seek; frames looked at
for every beat (sheets in the session outputs). Not run here: `check` and render (L-224). Render on the PC:
`py -m loom run mfa-story check` then `py -m loom run mfa-story render`.

## Check on the PC (2026-10-06, Kshitij): 10 errors, fixed
- 7 x text under 18 px: the small phones' labels (now only the code, 62 px at 0.57 scale) and b07's scaled-down page
  (now a small screen with only "Enter the code" and the empty boxes); the b19 code chip's role capped it at 30 px.
- 3 x text over text: the sign-in page's hidden states were opacity 0 but still laid out (now visibility hidden as
  well, autoAlpha); the look-alike page sat under the message in b08 (now hidden until the link is pressed); the b09
  question card moved below the screens and the large address steps away under it.
- The value script said 'mid' for every beat but the frames are light (0.81 to 0.95): it now says light throughout.
- Remaining warnings looked at and left: 24 px address bars (a browser's own size), chunk counts in the split frames
  (two screens, two people), no camera moves in bespoke beats.

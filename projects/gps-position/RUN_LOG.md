# RUN_LOG: gps-position (Shuttle, opus-plan, a 4-minute flat-cosmos explainer), 2026-10-10

Written by the session that runs it as operator. Kshitij: "use the shuttle pipeline once again and this time render a new
kind of video in a different style ... choose a topic and then accordingly choose the right style and then make the video.
I am hoping to see how this entire pipeline works with different styles and topics and scripts. I want a 4 min video."
Operator rule: no edits or context mid-run; a fault that would cost the run a lot of time is fixed and logged as an
intervention.

## Setup

- Topic "How GPS knows where you are": a mechanism everyone uses and few can explain (time signals, distance from travel
  time, intersecting spheres, the fourth satellite fixing the receiver's clock, the orbiting clocks' relativity correction);
  well-established facts, so the knowledge sheet grounds easily; it gives the explaining Kshitij found lacking room to work.
- Style flat-cosmos (Kurzgesagt-like flat illustration on a deep night field, orbiting discs, parallax stars): made for this
  kind of topic, and Shuttle had never run a dark illustrated style (flat-cosmos was used once, spacing-sticks, before Shuttle).
- Genre explainer (hook, what it is, how it works shown running, why it matters, payoff), persona mentor (shows before it
  names), corporate employees, 4 minutes, no presenter, mix cinema, `--isolated`, request notes on what to show.
- Models: the new default `opus-plan` (D-158): Opus leads P1 to P5, Sonnet P6 to P11; sub-agents Sonnet; skeptic and critic
  Gemini. Subscription mode (`claude -p`), budget $80 notional, unattended approvals in Kshitij's name.
- Engine: as after R-50 (Loom's checker, the check at draw time, the one-node backgrounds) plus D-158. Shared files
  fingerprinted at launch. The other open session was told the run is in flight.
- Launch: `py -m loom shuttle run gps-position --mode subscription --budget 80 --approve-as "agent, unattended per Kshitij
  (gps-position, flat-cosmos 4-minute explainer, 2026-10-10)"` (no --preset: the default applies).

## Result

- **Exit 0 at 00:38 (2026-10-11), every phase accepted, three reopens (P5 once, P7 twice), no operator intervention.** Film
  `renders/gps-position.mp4`, 4:41 (280.9 s), stereo audio. No shared engine file changed during the run.
- **Numbers** (`docs/research/2026-10-11-gps-position-comparison.md`, engine's table, notional): 159 min, $36.52, 1,000 calls,
  339 looks, 34 beats. Planning on Opus (P1 to P5) $4.92 with the storyboard reopen; drawing (P8) $23.48, about $0.69 a beat;
  check and fix (P9) $2.20; review (P10) $0.55; render 14 min.
- **Checks:** 26 (22 held_missing, 4 tight_inset), 4, 4, 0, 5 (held_missing after the review's fixes), 0.
- **Rework, measured:** the held_missing round (six fixers who could not clear it, the lead, a scoped storyboard reopen for 9
  beats, re-verification) about $3.5 and 23 min; the chip's tight_inset two kit reopens (the first fix widened the pill; the
  inset check had measured the text against the chip's unlabelled shadow rect, so only a class fixed it) under $1, about
  20 min; 40 looks refused because authors had not read part 1 of a two-part brief.
- **The script (Opus):** explains each step's why (time difference times light speed, spheres to a circle to two points,
  the cheap clock as 300 m per microsecond, four unknowns, both relativity effects with their numbers and the pre-launch
  fix), with one prediction pause. Compare https-private-v2's Sonnet script, which named steps more than it explained them.
- **The film, looked at (20 frames, within flat-cosmos):** a different picture for each idea (map, orbits, broadcast, signal
  and running timer, distance, intersecting spheres, atomic and quartz clocks, the four unknowns, a gravity-well grid, the
  rocket with the pre-set clock, the city at the end). The timer at 75 s counts 0.00 to 0.07 by design. Not looked at
  closely: the small orange "net about 38 microseconds" pill. Not listened to.

## Kshitij's review (2026-10-11)

"I rate this video a solid 8.5. Could've been a 9.5 but the background was moving to much and at places it felt too odd
and distracting as well. Moving background is not bad, especially it was trying to show space so I understand but at
times a completely different shade dividing the entire canvas into do different backgrounds slowly started growing from
top to bottom. Also, some places the transitions weren't smooth and felt laggy."

What the render shows (measured, not yet fixed):
- The moving background is flat-cosmos's nebula shader at intensity 0.75, drifting through the whole film (a slit scan at
  x = 500 shows the clouds sweeping across every station).
- The "different shade" is a scene's own veil: b21 lays a full-frame shadow rect (element "dusk") over the canvas at 25 %
  and deepens it to 75 % on "every sphere swells together", held through b24 (147 to 187 s). Hiding the nebula, the stars,
  the field or the overlay does not remove it; it is the scene.
- The lag is not dropped frames (0 repeats inside motion of 8,427 frames): every fade join goes fully to the field colour
  and holds motionless about 5 frames (b20: 134.100 to 134.233 s), after the outgoing beat has already settled; b20 and
  b21's fades have 13 and 12 still frames of 36. The other session's world.js coverAt fix narrows that plateau.

## Fixes after the review (2026-10-11, D-159, D-161)

- Continuity names are a contract at draw time (L-409); the inset check knows an unclassed drop shadow (L-410); a later brief
  part asked first returns the first unread one (L-411); `fx.drift` and flat-cosmos at intensity 0.45 and drift 0.4; a
  `full_frame_veil` check (L-412) that reports a translucent full-frame shape only when it changes while held.
- Veil scan of six built lessons with the final rule: gps-position b21 `dusk` (alpha up to 0.75, changing by 0.5, 36 s) is the
  only finding; feedback-relay-v3, dc-cooling, feedback-relay-v2, feedback-shuttle-v3 and https-private-v2 are quiet. The
  first rule had also flagged steady room walls in dc-cooling and feedback-relay-v2 (L-416).
- Full suite: 424 passed, 0 failed, 9 skipped (no cairo, OpenCV or symlinks here). Not re-rendered: the calmer nebula and
  the veil check have not yet been seen on a new film.

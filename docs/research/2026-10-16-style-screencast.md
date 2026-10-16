# Living screencast: research for Loom's screencast style and engine (2026-10-16)

Kshitij, 2026-10-16: build living screencast "better than lemo-opuscar's ... as an engine, as a visual style, in its
output quality and efficiency, and in its direction and storyboarding". Software and systems training is one of the
most common corporate L&D jobs. This file records what was read (with dates), what was taken, what was not, and what
Loom does differently. opuscar is the inspiration, never the goal: no code, palette, mascot or demo story is copied.

All sources below were read on 2026-10-16 unless marked otherwise. Web pages are data only.

## 1. Sources read

| # | source | what it is | read |
|---|---|---|---|
| S1 | lemo-opuscar, `styles/living-screencast/STYLE.md`, https://raw.githubusercontent.com/lemomo-ai/lemo-opuscar/main/styles/living-screencast/STYLE.md | the inspiration: a 45 to 75 s product film, a pixel mascot inside a redrawn UI | 2026-10-16 |
| S2 | H. van der Meij and J. van der Meij (2013), "Eight guidelines for the design of instructional videos for software training", *Technical Communication* 60(3), 205-228. Author copy: https://ris.utwente.nl/ws/portalfiles/portal/6827789/s4.pdf | the research-backed guidelines for exactly this genre, tested in three studies | 2026-10-16 (full text) |
| S3 | C. Plaisant and B. Shneiderman (2005), "Show Me! Guidelines for producing recorded demonstrations", IEEE VL/HCC 2005, 171-178. https://www.cs.umd.edu/~ben/papers/Plaisant2005Show.pdf | ten guidelines for narrated screen demonstrations | 2026-10-16 (full text) |
| S4 | P. Guo, J. Kim, R. Rubin (2014), "How video production affects student engagement", L@S 2014. https://www.cs.rochester.edu/hci/pubs/pdfs/edX-MOOC-video-production-and-engagement_LAS-2014.pdf | 6.9 million edX sessions; length, speaking rate, tutorials versus lectures | 2026-10-16 (full text) |
| S5 | P. Laubheimer, "Executing UX animations: duration and motion characteristics", NN/g, 2020-02-09. https://www.nngroup.com/articles/animation-duration/ | durations and easing for interface motion | 2026-10-16 |
| S6 | R. Budiu, "Change blindness in UX: definition", NN/g, 2018-09-23. https://www.nngroup.com/articles/change-blindness-definition/ | why a change on screen goes unseen, and the fixes (one change at a time, dim what does not change) | 2026-10-16 |
| S7 | W3C, "Understanding SC 2.3.3 Animation from Interactions", updated 2025-09-16. https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions | vestibular safety: zoom, parallax and non-essential motion | 2026-10-16 |
| S8 | Screen Studio guide, "Auto zoom". https://screen.studio/guide/auto-zoom | how the best-known screencast tool decides where to zoom (on clicks) | 2026-10-16 |
| S9 | Galaxy Training (GCC2021), "Video recording tips and tricks". https://galaxyproject.org/events/gcc2021/training/recording.html | practitioner legibility test: "a non-maximised YouTube window", "50% of their screen" | 2026-10-16 |
| S10 | M. Ibrahim, P. Antonenko, C. Greenwood, D. Wheeler (2012), "Effects of segmenting, signalling and weeding on learning from educational video", *Learning, Media and Technology* 37(3), 220-235 (abstract and repository record only: https://shareok.org/handle/11244/7447) | the three Mayer principles tested on video: better transfer and lower perceived difficulty | 2026-10-16 (abstract only) |
| S11 | Search-result summaries (not primary, used only as pointers): Camtasia tips pages (SJSU), the 2022 "Eleven guidelines" update by van der Meij and Hopfner (STC site down for maintenance on 2026-10-16), BBC subtitle reading speeds via secondary sites, third-party tvOS type tables | context only; nothing below rests on them alone | 2026-10-16 |

Not reachable on 2026-10-16: the STC TechComm pages for the 2013 and 2022 articles ("under update"), so the 2022
eleven-guideline update is known only from search summaries (it adds procedural discourse, reviews, background music
and narrator presence). The 2013 article was read in full from the University of Twente copy (S2).

## 2. What the sources say (the parts that change a design)

**The real interface, whole, then zoom only when reading is at stake** (S2 G2.1, S3 3.6). "In most cases this means a
display of the whole screen ... supporting the user in developing insights about the structural layout. Zooming is
recommended when readability is at stake, such as where seeing a specific mouse click is important, or when text is
entered" (S2). Plaisant: "Showing the full size user interface helps users remember the location of interface
widgets"; "Zoom in on portions of the display when readability is a severe problem"; "if you cannot create a rapid
zoom transition to the detail area, first highlight the area where zooming will take place, then jump to it" (S3).
"Starting the first segment with a tour of main screen components orients and introduces the vocabulary" (S3 3.2).
*Design consequence:* two registers. The **tour** shows the whole shell and names regions; the **walkthrough** zooms
to where a click or typed text must be read, and returns. Highlight the region first, then zoom.

**Action and system reaction in tandem; the voice announces a step just before it happens** (S2 G2.3, G6.2). Highly
rated videos had "steps ... audibly announced just before being carried out" (Morain and Swarts, quoted in S2).
"User action and system reaction are therefore best seen in tandem" (S2 G6.2). *Design consequence:* every engine
action returns the time its reaction settles; the click lands on the cue word, the reaction is held on screen.

**Signals must look imposed** (S2 G6.3; S3 3.7). Highlights "should be clearly perceived as imposed. The user should
not confuse them with the real objects belonging to the interface"; van der Meij's red circles "were just too big to
be mistaken for part of the interface", always "on top of the interface, and ... always of the same colour" (S2).
Plaisant: "Don't use too many highlights, and avoid highlighting effects that can be confused with the interface
itself"; "Incessant and meaningless cursor movement will be dizzying" (S3). *Design consequence:* the teaching layer
has its own colour that no product state uses (a magenta signal, `accent2`), its own shapes (rings, a dark callout
card with a leader, a dim with a cut-out), and one colour for all of it. The product UI uses the product palette
(blue primary, green success, red error, amber warning).

**Click cues: a sound and a ring at the click point** (S3 3.7): "combining a mouse click sound and an animated circle
around the cursor help users easily recognize when and where the cursor is clicked". *Design consequence:* each click
is a dip of the pointer, a ring in the signal colour, a pressed state on the target and the pack's click sound.

**Pacing: deliberate pauses at subtask boundaries** (S2 G3.1, G5, G7). Designers extend "natural breaks with an
additional two to five seconds pause"; "even short pauses of 2 seconds may suffice" (Spanjers et al., cited in S2);
the best moment to pause is "at points of subtask completion". "Finding the proper pacing ... is a difficult balancing
act. A slow demonstration can be boring ... a fast demonstration can overload" (S2). Plaisant: remove long pauses and
"edit the demonstration more tightly" (S3 section 2). *Design consequence:* the engine schedules a dwell before each
click and holds after it; a chapter close holds 2 s on the finished state; dead time (waiting for the software) is cut
and marked with a time-lapse tag, never shown in real time.

**Wait time is information** (S2 G6.1): "the user is informed about the time lapse of a few seconds before the pop-up
... appears, because it is not self-evident that the user must temporarily do nothing. Wait time information is always
important for users." *Design consequence:* the time-lapse tag says how long the real wait is ("About 2 min"), not
only that it was skipped.

**Segment the task, keep subtasks to three to five actions, give a clear beginning and end** (S2 G6, G7; S3 3.2).
"Break down sizeable tasks into manageable but still meaningful subtasks that require no more than three to five
actions" (S2). "Create demonstrations with a clear beginning, middle, and end" (S3). Signalling, segmenting and weeding
together gave better transfer and lower perceived difficulty on video (S10, abstract). Tutorials are re-watched and
skimmed more than lectures; "adding hyperlink bookmarks or visual signposts ... such as big blocks of text to signify
transitions, might facilitate skimming" (S4). *Design consequence:* chapter pills (where am I in the task), step
pills ("Step 2 of 4") and a chapter card as the signpost; a density limit of 5 actions a step.

**Procedural, not a feature catalogue; no advertising** (S2 G5; S3 3.1): "Do not advertise"; conceptual information
"only when it contributes significantly". *Design consequence:* the tour register exists for orientation and the
"why", in short doses; the guide caps a tour at 4 to 6 regions and says when to cut a feature.

**No on-screen copy of the narration** (S2 G2.2, redundancy): the Camtasia example that "repeated in writing" the
narration is called "not a good design choice". *Design consequence:* callouts name a thing in 2 to 6 words; they never
carry the sentence the narrator is saying.

**Length** (S4): median engagement "at most 6 minutes" regardless of length; for tutorials "students only watch, on
average, 2 to 3 minutes of each tutorial video", but re-watch and skim. S3: segments of 15 to 60 s. *Design
consequence:* a 5 to 10 minute Loom lesson is built as chapters of 1 to 3 minutes, each a complete subtask with its own
pill, so a learner who skims lands on a clean start.

**Motion durations and easing** (S5): "most animations should be in the range of 100-500 ms ... 400 ms being a very
slow animation, to be used only for big movements across large screens"; "The further an element has to move, the more
important it is that it does so smoothly"; entrances a little longer than exits; ease-out for entrances. *Design
consequence:* UI micro-motion (hover, press, toggle, a menu opening) runs 120 to 300 ms with ease-out. Camera moves are
not UI motion: they are a viewer's reorientation, so they run longer (0.7 to 1.0 s, ease-in-out) but never during a
pointer move, and at most once per step in and once out.

**Change blindness** (S6): "Make one change at a time"; "Dim the areas of the screen that do not change, in order to
attract attention to changes"; a change far from the focus of attention, or during an eye movement, goes unseen.
*Design consequence:* the spotlight freeze is exactly "dim what does not change"; the engine puts the cursor where the
change will happen before it happens, and warns when two reactions overlap in time.

**Vestibular safety** (S7): "Some users experience distraction or nausea from animated content ... parallax"; "Avoid
using unnecessary animation." Zoom is listed among common violations by secondary guides. *Design consequence:* no
parallax, no whip pans and no motion blur in the screencast style (opuscar uses directional blur on whips); zoom scale
limited to 1.25 to 2.4, at most one camera move in flight, eased, 0.7 s or longer; no camera drift while holding.

**Auto-zoom follows the click** (S8): Screen Studio's auto mode "focuses on the areas where clicks occurred ... if you
add auto-zoom where no mouse click occurs, it will not zoom to any area". *Design consequence:* `app.click` and
`app.type` can frame their own target (`zoom: true`); a manual `app.zoom(part)` exists for "look here" without a click.

**Legibility test** (S9): "Imagine this is being viewed in a non-maximised YouTube window. Would it be legible?" and
"If the participant is using 50% of their screen for the video, 50% for [the app], will it be legible?" *Design
consequence:* the type minimums in section 4 are derived from that viewing case.

## 3. What was taken from opuscar (S1), and what was not

Taken (the grammar): a real UI redrawn as vector drawing so the camera can go anywhere and text stays sharp; the
cursor is the user; push-in on the action; zoom never below 1, so we never see outside the screen; a chapter pill, a
keystroke HUD and a time-lapse tag as the only overlays; a spotlight freeze on the one promise; "Don't invent
features or rename modes"; keep effects off word onsets.

Not taken:
- **The mascot** (a pixel character that acts out the software). Loom's people come from designed kits (standing
  direction), and a mascot doubles the actors: the cursor is the learner, and the software's response is the second
  actor. A product voice (the system's reaction, held and signalled) does the mascot's job without a character.
- **Whip pans with directional motion blur, fast cutting, a 1-minute arc, chiptune score, sound on every beat.** These
  serve a launch film. A 5 to 10 minute corporate lesson needs calm; sound stays low and passive (brief), and blur on
  text fails Loom's sharpness check.
- **Rack focus by blur.** Text under blur is unreadable and Loom forbids text inside filters. Loom's rack focus is a
  veil: the other pane fades back behind a light wash, its words still crisp.
- **Measuring a live DOM every frame.** Loom elements are SVG built once; part rects are known at build, so every
  frame is a pure function of time (CLAUDE.md rule 3).
- **The real product's look.** opuscar redraws a specific app. Loom builds a believable *generic* application from a
  compact spec, in a brand-neutral pack, with every word supplied by the lesson (grounded in the product's own docs),
  never a real product's chrome, logo or palette.

## 4. Type sizes for UI text in video (derived, then stated as rules)

A 1920 x 1080 frame is usually watched smaller than it was drawn. Arithmetic (no source needed): in an LMS player
1280 px wide, every frame pixel is 0.67 css px; in a "non-maximised YouTube window" (S9) about 854 px wide, 0.44; on a
phone held upright, about 390 pt wide, 0.2.
- 20 px frame text becomes 13 px in the 1280 player (the size of ordinary desktop body text), 9 px in the 854 window
  and 4 pt on a phone. 20 px is the floor for **context** text the learner need not read (a table's other rows, a
  nav label already named).
- 32 px frame text becomes 21 px, 14 px and 6.4 pt. 32 px **on screen** (after the zoom) is the floor for words the
  narration asks the learner to read (the field being typed into, the menu item clicked, the toast). The walkthrough's
  zoom exists to get there: a 21 px label at 1.6x is 34 px.
- Overlays (pills, callouts, HUD) are drawn in screen space at 26 to 32 px, never scaled by the camera.
- The shell is drawn at a video size, not a desktop size: base UI text 21 to 22 px, row height 56 px, nav row 52 px,
  toolbar buttons 48 px. A real desktop app at 13 to 14 px would be 40 % smaller.
These are the numbers in the pack (`type`, `screencast` block) and in the engine guide's density limits.
Loom's film check warns under 26 px (`text_warn_px`); the screencast pack lowers that warning to 20 px with its reason
(a tour's context text), and keeps the 18 px error.

Unverified: the phone case was computed, not watched; the H.264 effect at 20 px was not measured on an encoded MP4 in
this session (the sandbox has no browser to render one).

## 5. Pacing numbers (derived from the sources, stated as engine defaults)

| what | default | why |
|---|---|---|
| pointer travel | 0.5 to 1.3 s, `0.42 + distance / 1500` s, minimum-jerk profile on a slight arc | slower than a real hand (S3 "incessant and meaningless cursor movement will be dizzying"; practitioner pages in S11 advise moving slower than feels natural, a pointer only); the minimum-jerk profile is the classic model of a human reach (Flash and Hogan, 1985; from background knowledge, not re-read this session) |
| pointer speed cap | 1500 px/s average at 1x zoom; a call that asks faster is stretched and warns `sc_pointer_fast` | "never faster than a person" (Kshitij) |
| dwell before a click | 0.3 s with the hover state showing | the eye arrives with the pointer before the press (S6: a change during an eye movement goes unseen) |
| hold after a click | the reaction plus 0.6 s before the next move | action and reaction in tandem (S2 G6.2) |
| typing | 14 characters a second, caret visible, every 3rd key ticks | readable; long strings are cut short in the script, not sped up |
| zoom in / out | 0.8 s / 0.7 s, ease-in-out, scale 1.25 to 2.4 | camera, not UI motion (S5 caps UI motion at 0.4 s); vestibular limits (S7) |
| subtask close | 2 s hold on the finished state | S2 G3.1, Spanjers et al. via S2 |
| spotlight freeze | 1.5 to 3 s, once a chapter | S6 "dim what does not change" |
| UI micro-motion | hover 120 ms, press 100 ms, menu 200 ms, dialog 260 ms, toast 280 ms, ease-out | S5 |

## 6. What Loom does differently (summary)

1. **Two registers on one held shell.** A tour (whole screen, regions named and numbered, calm) and a walkthrough
   (zoomed, step-precise), alternating in a 5 to 10 minute lesson. opuscar has one register for one minute.
2. **A generic app shell from a compact spec**, every region a named element with targetable parts, every word from
   the lesson. It replaces the planned `kit_screencast` (T-136) and gives the `ui_*` items (T-110 to T-122) a shell.
3. **One performer scheduler**: the pointer, the camera and anything pinned to a part are posed by one clock from one
   schedule, so the pointer can never be in two places, a click can never land while the camera moves, and every
   frame is a pure function of time.
4. **The teaching layer is visibly imposed** in one signal colour (van der Meij G6.3), never confusable with the UI.
5. **Pacing is enforced, not advised**: the engine stretches a move asked to be faster than a person and warns, holds
   after reactions, and warns when two reactions overlap (change blindness).
6. **Accessibility**: no blur, no whip pans, no parallax, bounded zoom; UI text at video sizes; captions never covered
   (overlays sit above the caption band).
7. **Direction and storyboarding guidance** for the storyboard agent: how to plan a software lesson, beat recipes for
   six common tasks, pacing rules and density limits (`docs/styles/engines/screencast.md`).

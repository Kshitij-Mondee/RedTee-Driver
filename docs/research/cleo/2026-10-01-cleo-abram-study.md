# Cleo Abram (Huge If True): what five videos actually do (study, 2026-10-01)

STATUS: SHIPPED 2026-10-01. Research reference, not a rule. Method, tools and limits are the same as the
Crayon Capital study (`docs/research/crayon/2026-10-01-crayon-capital-study.md`): the requester's own files
(`C:\Users\Admin\Documents\Cleo Abram`), measured by `tools/video_study.py`, roughly transcribed by
`tools/transcribe_videos.py` (pocketsphinx; speech rate reads about 10% high), contact sheets every 10 s looked
at in order. Notes paraphrase; nothing is republished. Cache: `cache/research/cleo/` (gitignored).

**Detector check for live action.** 8 random cuts in the quantum video were looked at frame by frame: 7 were
clear cuts and 1 (319.4 s) was a fast camera move inside a 3D scene. Handheld footage did not produce false
cuts in that sample. Palette "field" reads black for four of five: letterboxed footage and dark screen
recordings dominate area. The accents are the signal: a lime near #C4FC04 appears in four of five and a
saturated blue near #0454FC in the internet video; both are the channel's brand colours on labels and cards.

| file | length | video (identified by content) |
|---|---|---|
| `videoplayback.mp4` | 15:13 | Undersea cables versus satellite internet |
| `videoplayback (1).mp4` | 14:32 | Fusion power, with an inventor guest in a workshop |
| `videoplayback (2).mp4` | 17:00 | Quantum computing, with a tech-video guest, filmed at a lab |
| `videoplayback (5).mp4` | 25:16 | Designing a new moon spacesuit, filmed at the maker |
| `videoplayback (6).mp4` | 20:09 | Artificial wombs |

## Measured craft numbers

| video | cuts/min | cuts in first min | median shot s (p25-p75) | seconds with motion | holds >= 2 s (total s) | longest hold | speech wpm measured (about -10%) | pauses > 1.5 s |
|---|---|---|---|---|---|---|---|---|
| Internet | 17.3 | 40 | 2.0 (0.8-4.0) | 87% | 23 (84) | 11 s | 179 (161) | 5 |
| Fusion | 16.5 | 35 | 2.0 (1.2-4.6) | 82% | 26 (119) | 14 s | 174 (156) | 7 |
| Quantum | 22.1 | 51 | 1.4 (0.8-2.6) | 96% | 9 (21) | 4 s | 172 (155) | 2 |
| Spacesuit | 21.1 | 38 | 1.6 (1.2-3.0) | 95% | 20 (50) | 5 s | 178 (160) | 11 |
| Artificial wombs | 14.0 | 24 | 2.4 (1.2-4.8) | 82% | 42 (161) | 21 s | 152 (137) | 23 |

What the numbers say, with the frames:
- **Twice Crayon's cut rate in the opening.** 24 to 51 cuts in the first minute (Crayon: 10 to 27), then 14 to
  22 a minute; the median shot is 1.4 to 2.4 s. The pace is carried by footage, screenshots and the host's
  own jump cuts at her desk.
- **The long holds are the diagrams.** Frames grabbed at the start of the longest holds (8 of them, in three
  videos) were all flat diagrams: the confinement types and the fusion 2x2 (fusion video, 5:44 to 12:01), the
  womb anatomy and the prenatal timeline (womb video, 3:18 to 11:44), the broadband maps (internet video,
  8:15 to 8:30). The host shots are never still (a handheld camera and constant gesture). The frame rests
  where the learner has to read. (An earlier draft of this note said the holds were on the host's face; it
  was written from the numbers before the frames were checked, and the frames showed otherwise.)
- **Fast talk, few long pauses.** About 155 to 160 wpm corrected, and the womb video (the most reflective
  topic) is the slowest (137) with the most long pauses (23). Pace follows the subject.

## Per-video notes

### Undersea cables versus satellite internet (15:13)
- **Cold open (0:00-0:45):** a rocket launch, a satellite launch party, then the host at her desk looking
  sceptical, then the branded title card as a claim with an asterisk ("if true"). The asterisk card is the
  channel's signature: the promise and its caveat in one frame.
- **Evidence on screen (0:55, 1:25):** a real social post, then the public cable map with a highlighted
  count. Claims are backed by the actual source, shown briefly with a lime highlight.
- **Field trip (2:25):** the host on a cable ship in a hard hat. The learner is taken to the place.
- **Questions in the viewer's voice (3:45, 4:15):** an email she writes to a cable company; a wall of viewer
  comments asking the same question. The video is framed as answering real people's questions.
- **Plain animated diagrams (3:55-4:05, 6:05-7:45):** a flat cross-section with a cross and a tick, a light
  pulse along a line, a data-size table, a pipe with a label, tanks on a map. Simple shapes, brand blue and
  lime, 5 to 10 s each.
- **Comparison as a chart built from objects (11:45):** a cost-versus-speed plot where each option is a pipe
  of different width, labelled.
- **Payoff (14:15-15:05):** two words on screen in contrasting colours sum up the trade-off; archive footage
  of an old technology arriving; the host closes at the desk. The ending returns to the stakes, not a recap.

### Fusion power (14:32)
- **Cold open (0:00-0:55):** the guest at a workbench, the host's reaction, an interview call with a named
  company CEO on screen as a video call with a lime nameplate, a plasma image, a reactor interior.
- **The edit shown as part of the story (0:35, 1:25, 1:35):** editing-software timelines and file browsers
  appear on screen. The making of the video is part of its honesty.
- **A 2x2 that builds (4:05-5:55):** fusion and fission against controlled and uncontrolled, first as Lego
  baseplates on the workshop table with the guest, then as a flat graphic that fills cell by cell, then
  returned to with the open question written in the empty cell. The most instructive device in the set: a
  physical model, then the diagram, then the diagram used to ask the question.
- **Payoff (13:15-14:15):** back at the workshop table with the guest, laughing; then the credits card with the
  asterisk brand. The relationship with the guest is the bookend.

### Quantum computing (17:00)
- **Cold open (0:00-0:55):** host and guest in a lab corridor, the guest's channel page, a news anchor, an
  opinion headline with a lime highlight, then the host close to camera.
- **Car conversations (2:05-3:05, 5:45):** host and guest talk while driving; the guest plays the curious
  learner. The dialogue replaces narration for long stretches.
- **A metaphor world in 3D (4:05-5:35, 12:05-12:15, 15:55-16:05):** a low-poly isometric island that grows
  from a village to a city, with a cursor pointing at parts, a boat, a submarine standing for the quantum
  machine, a label announcing new maths unlocked. The same world returns three times across the video.
- **The real machine (12:35-14:45):** the dilution refrigerator in the lab with the guide, then the machine
  equated with the submarine from the metaphor world (14:35). The metaphor is tied back to the object.
- **Payoff (16:35-16:55):** the asterisk credits card, then the host to camera.

### Designing a moon spacesuit (25:16)
- **Cold open (0:00-1:25):** a person being lowered into a suit on a rig, archival moon footage, a 3D suit
  turning, a glove close-up, the lander, then the asterisk card.
- **The host as the stand-in for the learner:** she arrives at the building (1:35), is fitted, asks the
  engineers, tries on gloves (12:15-12:25), and finally wears the suit (24:05-24:25). The hook image of a
  person going into the suit is paid off by the host going in herself.
- **Hazards as an animated character (3:55-5:05):** a simple orange suited figure floating above Earth, with
  arrows for pressure, a cutaway of the body, a temperature label, a radiation band. One figure carries five
  hazards in a minute.
- **Layer diagrams on blueprint blue (5:55, 12:05, 12:35, 14:55, 17:05-17:35):** suit types side by side, an
  exploded stack of layers with labels, a restraint layer called out, a pie of fit coverage, three sizes. The
  graphics return to the same blue page and lime label style every time.
- **Numbers on physical meaning (13:55):** pressure values drawn as depth under water.

### Artificial wombs (20:09)
- **Cold open (0:00-0:55):** a dark close shot, the editing timeline, two real social posts setting up the
  debate (one with a chart), the host at her desk reacting.
- **Evidence ladder (1:15-3:45):** a news clip of a lamb in a fluid bag, a hospital shot, the brand word card,
  an interview with a researcher, an anatomy diagram, a prenatal timeline where each study is placed as a
  labelled marker on the weeks axis, then headlines. The timeline returns three times, gaining markers.
- **Both sides on screen (4:15-4:45):** the host between two coloured labels asking whether it does more harm
  or more good; then real replies arguing each side, each titled by the objection it raises.
- **Payoff (19:15-19:55):** a numbered list of reasons with the last one highlighted, archival newspaper pages
  from the IVF debate with a highlighted line, the host to camera. The present debate is closed by an old one.

## The channel's signature (one channel's choices, not a template)
1. **A host who is the learner's proxy.** She visits, asks, tries things on, and reacts; guests and engineers
   explain. The viewer learns by watching someone like them find out.
2. **Promise with its caveat.** The asterisk card says the idea is big and that it depends on being true;
   the videos then check the claim.
3. **Show the source.** Real posts, papers, headlines, maps, with the key phrase highlighted in lime, on
   screen for 2 to 5 s. Credibility is visual.
4. **One simple diagram that builds and returns.** The 2x2, the prenatal timeline, the island world. It is
   built in steps and revisited with new information, rather than replaced.
5. **Physical before abstract.** Lego boards before the 2x2; the real refrigerator after the submarine; the
   glove in the hand before the layer diagram.
6. **A tight brand kit.** Lime and saturated blue labels, a flat sans, the same card layouts, reused across
   every video.
7. **Fast edit, still diagram.** Cuts every 1.5 to 2.5 s on footage; a diagram is where the frame rests, for 7 to 21 s.

## What transfers to workplace learning (judgement, not rules)
- **The learner's proxy.** A character who asks the learner's question and tries the thing (Loom's running
  character, or a presenter) makes a procedure feel discovered rather than recited.
- **Build one diagram and come back to it.** A matrix or timeline that gains a cell or a marker each time is
  both a signalling device and spaced retrieval. It is also cheap: one scene, revisited.
- **Show the source line.** For policy and compliance lessons, a highlighted line from the actual document
  on screen is the most direct way to ground a claim (Loom already page-anchors claims; this is the visual
  form of that anchor).
- **State the caveat.** "This applies if X" on screen next to the promise is honest and memorable.
- **Where not to copy.** 20 cuts a minute of live footage is not available to a code-rendered engine, and not
  needed; the diagrams, source highlights and proxy character are the transferable parts.

## What Loom would need
- A **source highlight card**: a document excerpt (from the lesson's own source pages) with one phrase
  marked, animated in. Loom has the page anchors; the card is the missing piece.
- **Diagram revisit** in the storyboard: mark that a scene returns to an earlier diagram with one change, so
  the builder reuses its state instead of redrawing.
- A **brand label style** (tight pill labels in the brand accent) as a style-pack token set.
- A **presenter proxy** mode for the character rig: reacts, asks, points at the diagram.

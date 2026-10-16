# Frame-by-frame audit of the two step 7 lessons (2026-10-03)

STATUS: REVIEWED 2026-10-03.

**Method:**
- The audit is of the rendered MP4s, not the preview.
- Both films were cut to 4 frames a second. Every beat was laid out as 8 frames across its length, and every join
  as 8 frames across its window plus 0.6 s each side.
- Sheets: `docs/research/step7/audit/<lesson>/rows_*.jpg`; 9 for phishing and 11 for feedback.
- Kshitij's verdict after watching both: "AWFUL". His three screenshots are phishing b22 (03:20), b14 (02:05) and
  b08 (01:06).

**My verdict:** he is right.
- Both films fail as products. Not in one place, but in every layer: art direction, composition, timing, joins,
  characters and process.
- The earlier review (`2026-10-02-step7-review.md`) said "not sellable", but it underrated how bad they are to
  watch. It was built from three still frames per beat, which cannot show holds, joins or residue.

## 1. The failures, by kind (each with where it shows)

### A. No art direction: things that do not belong together
| problem | where |
|---|---|
| **Icons from different families in one frame:** a detailed emoji-style alarm clock (Fluent) next to flat line icons in dark tiles (Lucide) | phishing b22 (Kshitij's screenshot 1); feedback b14 (a 3D-ish calendar), b15 (a teal eye), b16 (blue line icons): three families across four beats |
| **Bean people:** grey round-headed extras, flat-faced Jo and Ravi, a back-of-head grey bean as "the report" | phishing b02, b07, b08, b32 to b36, b41; feedback b04 to b06, b19 to b36 |
| **Two drawing languages in one frame:** outlined, illustrated Maya in flat, outline-free rooms | feedback b04, b05, b19 to b36 |
| **Props with no viewpoint or scale rules:** the laptop faces the viewer and is as big as the desk (Kshitij's screenshot 3); clocks, calendars and charts float on walls with no plane or shadow | phishing b02, b07, b08, b32, b33; feedback b04, b05, b10, b19 |
| **Placeholder content shown as content:** grey bars for document text; "xxx" on a calendar; the address as invented glyph tiles (`oLVLLxiIxVLL`) | feedback b07 (the update is lines with no words, so "nothing changed" cannot be seen); feedback b04, b10; phishing b19 |
| **Loud colour where it means nothing:** royal-blue cube chairs and desks (hard-coded place accent) | feedback b10, b19 to b36 |
| **A cartoon bust as presenter,** on a pastel blob or a dark void | feedback b01 to b03 (27 s) and b46, b47 (21 s); phishing b01 and b42 |

### B. Composition: frames that are empty, or full of the wrong things
| problem | where |
|---|---|
| **Near-empty frames:** a kicker or one line on a gradient for 3 to 6 s before the title arrives | feedback b08, b09, b12, b13, b18, b22, b23, b25, b31, b42, b43; phishing b04, b30 (an empty card for 4 s), b38 (4 s black) |
| **Templates laid over a busy cinematic scene with no backplate,** so neither reads (Kshitij's screenshot 2) | phishing b14 (recap icons over the building of people), b37 (a list over the Ravi room), b06 (an icon grid over leftover message lines) |
| **Type far too small for 1080p:** chips, tags and labels read as specks; the content sits in the middle 40 % of the frame | phishing b11, b13, b17 to b21, b25 to b29, b34 to b36; feedback b19 checklist, b45 (two small panels in a big empty field) |
| **Labels on everything** (pills naming the place: "Corridor", "Quiet room", "Maya") | feedback b04, b10, b19; phishing b09, b10, b17 to b21 |
| **Crops that cut the subject:** the push crops "Confirm your passw", and a panel covers the subject line | phishing b19, b20 |

### C. Time: the picture stops while the voice goes on
- **Measured:**
  - feedback: motion 59 %, median gap between visual events 7 s, 48 holds;
  - phishing: motion 47 %, gap 9 s, 46 holds;
  - the reference films: 83 to 85 % and 2 to 4 s.
- **The same frame twice:** phishing b15 and b16 are 15 s of one message card; feedback b26 to b28 are about 30 s of
  one meeting-room shot.
- **The story is told, not shown:**
  - phishing b07 and b08 (moves one to four are spoken over a static wide office; only a "Report it" chip floats
    in the air);
  - phishing b02 ("a message lands": the laptop stays black);
  - feedback b05 ("she walks past": Maya pops between positions, cropped at the frame edge, never walks);
  - feedback b22 ("her first draft, in her head": 6 s of empty pastel).
- **Long static framing even where the content is good:** feedback b37 to b41 is 36 s of the same top-down desk.

### D. Joins: what Kshitij describes, and it is everywhere
"When you change screens or zoom into another screen, the frame sits there blocking the visuals, then you zoom."

What the frames show:
1. **The zoom does not go INTO the object.**
   - The camera pushes toward a drawn laptop or monitor, then the next station (drawn separately, elsewhere in the
     world) pops in.
   - The two drawings do not match (a different monitor, a different desk): phishing b02 to b03, b06 to b07;
     feedback b05 to b06, b06 to b07.
   - A zoom only works if the destination is drawn inside the source object.
2. **The outgoing beat's elements stay through the move.**
   - The "Phishing" icon grid stays on screen, then appears inside the laptop (phishing b06 to b07).
   - The speech bubble rides the zoom (feedback b05 to b06).
   - The message card appears over the office during a wipe (phishing b39 to b40).
   - A list drifts into the next room (feedback b25 to b26).
3. **Station edges show during pans.** A hard vertical edge slices across the frame, and the old station's headline
   is cut in half ("They / to hu"): phishing b01 to b02; feedback b03 to b04, b28 to b29, b31 to b32, b41 to b42.
4. **Residue nobody owns:**
   - a mouse cursor parked at the bottom-left from b04 to b06 and in b22;
   - a sliver of the old message at the left edge in b04;
   - the "Report it" chip cut off at the frame edge in b09.
5. **Blank gaps:**
   - 0.5 to 1 s of empty gradient or grey between template stations (feedback b10 to b11, b13 to b16, b21 to b22);
   - a black frame for 4 s at the start of phishing b38.

### E. Characters do not act
- No walking, sitting or typing. Extras are static bean silhouettes. Ravi holds one wide-armed pose.
- Maya stands behind a table with her head in the whiteboard chart (feedback b19 to b28).
- Jo is a tiny figure in a wide shot whenever something happens to her.

## 2. Beat by beat

### Phishing (42 beats)
| beat | what is wrong |
|---|---|
| b01 | bust on a dark void for 6 s; the headline appears for 1 s, then a station edge slices it in the pan |
| b02 | 11 s static wide office; "a message lands" but the laptop stays black; Jo tiny |
| b02 to b03 | the zoom does not enter the laptop; a message card pops in with a red sliver at its edge |
| b03 | the message mock is fine; the cursor drifts; the best of the opening |
| b04 | 3 to 4 s of kicker only; a sliver of b03's message at the left edge; a stray cursor |
| b05 | double exposure (old message and new title on top of each other); four empty boxes for 9 s |
| b06 | icon grid over b05's leftover lines; three tiny icons in an empty frame |
| b06 to b07 | the grid sits, appears inside the laptop at a close-up, then the camera pulls out (the join Kshitij describes) |
| b07 | 7 s static wide office; nothing shows "look for the signs" or "do not click" |
| b08 | 12 s static; the laptop faces the viewer and is huge; grey bean extras; the "Report it" chip floats above the bookcase (screenshot 3) |
| b09 | 3 s of near-black city; chapter over an empty frame; the chip cut at the edge |
| b10 | **the best beat:** the funnel fills, counters land on the numbers. The labels are still too small |
| b11 | 9.6 s of little change; tiny "25 reported" tags |
| b12 | the arc to the team box works; small |
| b13 | the cutaway building is a good idea; labels are specks |
| b14 | the recap icons and a red bar laid over the building full of people: unreadable (screenshot 2) |
| b15 | the same message card for 7 s while "bad spelling" and "sloppy scams" are spoken: nothing shown |
| b16 | the same frame as b15 for another 8 s |
| b17, b18 | the message shrinks to the centre of a dark board; tiny flags; 60 % of the frame is empty glow |
| b19 | the push into the address is the right idea, but it crops the subject; the REAL SPELLING panel covers the subject line; gibberish glyph tiles |
| b20, b21 | the board pulled back: a dense cluster of specks; 10 s each with little change |
| b22 | three icons from two families (clock vs line icons), small, in an empty frame for 7 s; the title only at the end; a stray cursor (screenshot 1) |
| b23 | 3 s of inbox list, then a big title laid over it |
| b24 | the supplier message is mostly empty card; small text |
| b25, b26 | tags pop onto the message one by one; tiny; long |
| b27 | the message shrinks left; phone and building icons right; busy and tiny |
| b28, b29 | three skeletal device outlines; a tiny bar chart "40 % higher" that cannot be read; 12 s near-static |
| b30 | an empty dark card for 4 s, then one small line |
| b31 | funnel callback; chapter over it; static |
| b32, b33 | the Ravi office: the laptop faces us; a bean crowd; floating calendar and clock cut at the frame edge; a cartoon thought cloud |
| b34 to b36 | split screen: the right idea, but miniature and dark; tiny tags |
| b37 | a list template over the Ravi room |
| b38 | 4 s of black, then the question builds |
| b39 | readable, but small and dim |
| b39 to b40 | the wipe shows the message card over the office (double exposure) |
| b40, b41 | the board again with tiny tags; "the afternoon carries on" over a dimmed, near-empty frame |
| b42 | bust in a void for 10 s; the title only in the last 4 s |

### Feedback (47 beats)
| beat | what is wrong |
|---|---|
| b01 to b03 | 27 s of the same cartoon bust on a pastel blob, with one line of text at a time |
| b03 to b04 | a hard station slide; the old headline sliced |
| b04 | Maya by a wall, the colleague as a back-of-head bean; a floating clock and "xxx" calendar; a "Maya" label; 10 s static |
| b05 | "walks past their desk": Maya teleports, cropped at the edge, never walks; the bubble then rides the zoom |
| b05 to b06 | the zoom lands on a different desk drawing (no continuity) |
| b06 | the seat point of view from behind a grey bean; a tiny thought note in the corner; 10 s |
| b06 to b07 | a cut to a different, larger monitor |
| b07 | the "update" is grey bars with no words, so "what changed? nothing" cannot be seen; a tiny tag |
| b08 | two tiny icons on a pastel gradient for 10 s |
| b09 | kicker only for 4 s; a page-peel transition that belongs to no idea |
| b10 | saturated blue furniture; a tiny figure at the window; "Days late" and "Corridor" pills |
| b11 | recap icons on a dotted line: acceptable, small |
| b12, b13 | 3 s empty, then one small line each |
| b14 to b16 | definition cards: an icon and small text top-left in a vast gradient; three icon families; 1 s blank pans between |
| b17 | two icons and an arrow; the push crops the top |
| b18 | 4 s empty, then one line |
| b19 to b21 | the meeting room: Maya's head in the whiteboard chart; blue cube chairs; a tiny checklist; a bubble |
| b20 | the teal tag sits in the caption band under the caption (the PC check caught it) |
| b21 to b22 | the camera pans down onto a table crop, then an empty pastel; 6 s of nothing for "her first draft" |
| b22, b23 | a quote and a definition, small, on a gradient with a ghost circle |
| b24 | Maya floating in a pastel void beside a text box |
| b25 | 3 s kicker only; faint list rows |
| b25 to b26 | the list drifts into the room |
| b26 to b28 | the same room shot for about 30 s; small props; an empty dashed thought ellipse |
| b29, b30 | the quiz is readable, small |
| b31 | 6 s empty, then three tiny icons; the room's figure enters from the left before the cut |
| b32 to b35 | the room again; notes and tags overlap; "Thursday" tag over note text |
| b36 | the room fades to grey for 10 s |
| b37 to b41 | **the best sequence:** a real worksheet filled line by line. But 36 s of one top-down framing, and the text is small |
| b42 to b44 | lists on a gradient, faint rows, top-left |
| b45 | two small panels in a big empty field |
| b46, b47 | the bust again for 21 s; the ending frame empty |

### F. Added from Kshitij's second set of screenshots
| problem | where | cause |
|---|---|---|
| **Grain and grit over everything,** so the film looks low quality and compression makes it blotchier | phishing throughout (the cinematic-noir pack: grain 0.06, vignette 0.6, a nebula background, a light leak); feedback lighter (grain 0.012) | the finish was set on by default (D-92, B6), copied from the explainer skill's films, and never judged on a compressed 1080p MP4 |
| **The email is not an email.** Grey bars where the sender, address, date and body should be; random dots; the subject typeset like a poster; no real client layout | phishing b03, b15, b16 and every later message | the reference-first rule (D-87) only covered places and objects. UI artefacts never got a reference board, so the mock was drawn from memory |
| **The scene starts drawing under the chapter sting:** the funnel's orange rim ellipse appears over "Why move three matters" before the title has gone | phishing b09 (01:15) | the chapter overlay and the scene build run at the same time. There is no rule that an overlay must fully leave before the scene underneath reveals |

## 3. Why it happened (my process, not only the engine)
1. **I judged stills, not films.** Three frames per beat cannot show holds, joins, residue or late arrivals. I told
   Kshitij "0 errors" and treated the gates passing as progress, when the gates do not measure what a viewer sees.
2. **The pipeline asks scene agents to code beats one at a time, and none of them ever watches the result.**
   Nobody owns how beats meet, so joins are left to engine defaults.
3. **There is no art direction layer:**
   - nothing stops two icon families in one frame;
   - nothing sets a viewpoint or scale for props;
   - nothing stops templates being laid over busy scenes.

   The packs only set colours and fonts.
4. **Templates are slides by design:** a kicker first, then text, in an empty field.
5. **Joins are camera moves between separately drawn stations.** A "zoom into the screen" has no screen to zoom
   into.
6. **I spent most of the 7 hours making the engine pass its own gates** (travel maths, residue, reading-floor
   counts). That work was needed, but it was not the work that makes a film good.

## 4. What changes (proposed; Kshitij decides the order)
1. **No more full lessons until one minute is excellent.**
   - Rebuild one 60 s segment per lesson to the bar: phishing b17 to b21 (the evidence board) and feedback b37 to
     b41 (the worksheet).
   - Watch them at full speed. Kshitij signs off before anything scales.
2. **An art-direction rulebook, enforced in code:**
   - one icon family per lesson (lint);
   - no emoji art in corporate packs;
   - props drawn from the character's viewpoint (screens face the person using them unless it is a point-of-view
     shot);
   - a scale table (laptop to person, chair to table);
   - wall items sit on the wall plane with a shadow;
   - no bean extras in corporate registers;
   - no placeholder bars or "xxx" where the content is the point (the document must say its words).
3. **Composition rules, enforced:**
   - a template never sits over a busy scene without a solid backplate, or a move to a clean field;
   - content fills at least 45 % of the safe area;
   - chip and label type at least 28 px, body at least 34 px at 1080p;
   - the title is on screen within 0.5 s of its first word (no kicker-only frames longer than 1 s);
   - no place-name pills.
4. **Join grammar, rebuilt:**
   - a zoom or portal join must target a child station drawn INSIDE the source object, so the camera enters the
     real screen;
   - the outgoing beat's elements exit before the move begins (except the object being entered);
   - stations sit in a continuous world, so no edge ever shows, or the join is a cut or dip;
   - cursors and chips are motifs that are handed over or removed, never left behind.
5. **Time rules:**
   - a visual event on the voice every 2 to 4 s;
   - no two consecutive near-identical frames;
   - a hold over 4 s needs development (light, data, camera, character).
6. **Review the film, not stills:**
   - every check run makes these 4 fps beat and join strips;
   - the picture critic (brain B1) is calibrated first on the findings in this file;
   - Kshitij's verdict on the strips is logged as the label.
7. **Finish and references:**
   - grain off by default (the person may turn it on), and no paper or leak in corporate packs;
   - judge the finish on the compressed MP4 at 100 %, not on a preview frame;
   - every UI artefact (email client, chat, document, calendar invite) gets a reference board from real product
     layouts before it is drawn, and the board check covers UI artefacts too;
   - an overlay (chapter, title over a shot) holds the scene's reveals until it has fully left.
8. **Characters:**
   - until a matching designed cast exists, corporate lessons show people only as hands, cursors, silhouettes or
     one well-drawn figure at a time;
   - Maya stays out of code-drawn rooms until the rooms are drawn in her style.

All findings above are logged in the decision ledger as `review_finding` records, labelled by beat and kind, so the
critic and later decision models train on them.

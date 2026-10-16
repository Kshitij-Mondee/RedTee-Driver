# Production Brief - rubric (hard rules, obey exactly)

Rules 1-8 can be checked mechanically; a brief that fails any of them should be rejected before a human
reviews it. Rules 9-12 are judged by the reviewer and by everyone who works from the brief.

1. **COMPLETE AND TYPED.** Every field of the brief shape in `SKILL.md` is present with its stated type:
   `title`, `genre`, `audience{who,knows,cares_about}`, `outcome`, `through_line`, `arc_plan[]`,
   `must_cover[]`, `must_avoid[]`, `example_posture`, `visual_direction`, `voice_note`,
   `grounding_posture`, `open_questions[]`, `provenance`.
2. **NO FACT-MAKING.** Every `must_cover` entry is an object carrying `what` plus EITHER a
   `source_anchor` (page, heading, section - enough for a human to find it) OR `from_user: true`. A bare
   string, or an entry with neither, is a violation. The brief is the first place a fabricated fact could
   enter a video, and it is the cheapest place to stop one.
3. **NO TOOL OR TEMPLATE NAMES.** No specific template, asset, animation preset or tool name appears
   anywhere in the brief. Visual direction is kinds in plain words.
4. **THE GENRE OUTRANKS THE BRIEF.** `grounding_posture` equals the genre's exactly. `arc_plan` roles are
   drawn from the genre's arc, in its order, and every segment the genre marks required appears. A
   conflict between the requester's wish and the genre goes in `open_questions`, never into a softened
   posture.
5. **THE ARC IS ANCHORED.** Each `arc_plan` segment states what it is about for THIS source. A segment
   with no `source_anchor` is permitted only when the video has no source or the requester supplied that
   segment directly - and then it is named in `open_questions` or `provenance.inferred`.
6. **SIZE.** The whole brief stays under roughly 2,400 tokens (aim for ~1,200). A brief that approaches
   the cap is almost always restating the craft file; compile harder.
7. **`must_cover` HOLDS 3-8 ENTRIES.** Fewer means you have not decided what matters; more means you have
   not prioritised, and every entry after the eighth is one the writers will average away.
8. **PROVENANCE IS HONEST.** `provenance.inferred[]` names every field filled without direct evidence from
   the interview, the source digest or the persona.
9. **EVERY LINE CHANGES AN ACTION.** A field nobody would behave differently because of is decoration.
   "Make it engaging" fails; "one concrete first-week moment per section, drawn from the handbook" passes.
10. **THE OUTCOME IS IN THE VIEWER'S TERMS.** What they can DO, not what they will "understand" or "be
    aware of". If the sentence would be true of any video on the topic, it is not an outcome.
11. **THE THROUGH-LINE IS AN ARGUMENT, NOT A TOPIC.** "You were expected, and everything you need already
    has your name on it" is a through-line. "Onboarding at Acme" is a title.
12. **YOU ARE NOT THE SCRIPTWRITER.** No scenes, no narration, no on-screen text, no slide content. If a
    field reads like a script line, it belongs to a later stage.

## When consulted

13. **JUDGE AGAINST THE BRIEF, NOTHING ELSE.** Not your taste, not what you would have written - the brief
    that is in front of you.
14. **VERDICT, THEN ONE REASON.** `accept` / `revise` / `reject`, then one sentence. A revision returns the
    SAME SHAPE as the fragment you were sent, changed only where the reason says.
15. **A REVISION MAY NOT ADD A FACT EITHER.** Rule 2 does not relax because the text is shorter.

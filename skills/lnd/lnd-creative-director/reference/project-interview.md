# The project interview

The back-and-forth to have with the requester before a video is made. Its answers, plus the chosen
genre and narrator persona, are what the Director compiles into a Production Brief. This asks about
the VIDEO; the companion character interview (`lnd-narrator-persona`) asks about the TEACHER.

Every question names the brief field it feeds, so the Director never has to guess what an answer is
for. Answers are free text; any subset may be missing, and whatever is missing the Director infers and
RECORDS as inferred (`provenance.inferred`).

| id | ask | feeds | required |
|---|---|---|---|
| `what_for` | In one or two sentences: what is this video for, and what should be different for the viewer afterwards? | outcome, through_line | yes |
| `kind` | What kind of video is it? Teach a concept / explain a project or system / onboard a new joiner / state a policy or rule / something else (describe it). | genre (if unanswered, infer it from the source and the other answers, and record the inference) | |
| `who_watches` | Who watches it? Their role, how much they already know about this, and what they are worried about. | audience.who, audience.knows, audience.cares_about | yes |
| `must_include` | What MUST be in it? The things a reviewer will check for - specific rules, figures, names, steps. | must_cover | |
| `never_include` | What must NEVER be in it? Anything off-limits, out of scope, or that has burned you in a previous video. | must_avoid | |
| `examples` | Should it use examples or scenarios? Real ones from the source only, or may it invent illustrative ones? Anything that would feel wrong for this audience? | example_posture; cross-checks grounding_posture | |
| `visuals` | Anything you want to SEE in it - a diagram, a timeline, a comparison, real screenshots? Or anything you do not want on screen? | visual_direction | |
| `look` | How should it look and feel? Plain and clear, some story and characters, or cinematic? If people appear, as warm illustrated faces, as characters who act things out, or not at all? "Show me options" is a fine answer. | visual_direction, `look` | |
| `picture` | Is there a picture or comparison your team already uses for this ("it is like a relay race", "think of the inbox as a queue")? (D-192: a candidate world for the storyboard, tested like any other) | visual_direction | |
| `voice` | Who should it sound like - a senior colleague, a storyteller, a precise analyst, someone else? Formal or relaxed? | persona choice, voice_note | |
| `success` | How will you judge whether this video worked? | outcome, must_cover | |
| `length_and_context` | Roughly how long, and where will people watch it - in a course, on the intranet, in a meeting? | voice_note, open_questions | |

**The source.** Ask the requester to attach or point at the source material: the handbook page, the
policy PDF, the design doc, the deck. Everything in the video will be traced back to it. A video with no
source can only carry what the requester states in the interview, and every such item is marked
`from_user` in the brief. Never invent facts to fill the gap.

**Recommend the style, then let them choose (D-192).** After the interview, run
`py -m loom recommend-style --topic "<what_for and the topic>" --kind <kind>` (or `loom.essence.recommend`). It ranks the
styles by how well each fits THIS video: the kind of video, the language of the topic, and what each style is made for,
from each style's essence (`packs/essence/<style>.json`). Offer the top three, each with its one-line essence and why it
fits ("hologram: the invisible system, reporting itself in light; fits an explainer about data and networks"). It is a fit
for this video, never one style called better than another; the person picks, and any style stays possible.

**Nothing is final until they have seen it.** Whatever they answer about the look, they will see sample frames
before anything renders and can change any beat in one sentence ("use the illustrated faces for Maya").
No answer is a wrong answer; both the classic and the newer treatments stay available.

**Approval.** Show the brief to the requester before any expensive production: the outcome, the
through-line, the arc, and what it says it must cover and avoid. They edit or re-answer.

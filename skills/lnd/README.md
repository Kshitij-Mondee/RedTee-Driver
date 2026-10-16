# L&D video skills - general edition

Eleven skills for planning, writing and animating learning-and-development videos with any AI or any
toolset. They are general copies of skills built for a private video engine, with everything
engine-specific removed and the craft kept.

| skill | what it does | use it when |
|---|---|---|
| `lnd-creative-director` | Compiles the requester's answers, the genre and the source into a one-page Production Brief (outcome, through-line, arc, must-cover, visual and voice direction) | at the very start of a video |
| `lnd-learning-pedagogy` | Designs HOW the video teaches: performance, learner model, one strategy, arc with Bloom-levelled goals, misconceptions, worked-example ladder, retrieval, load and energy, transfer, series design | before the script |
| `lnd-narrator-persona` | Writes the narrator's character as a file a scriptwriter can become: voice rules, rhythm targets, signature moves, refusals, examples | once per voice, before narration |
| `lnd-visual-design` | The LXD standard for every visual and animated element: the animation gate, cognitive budget, type/colour/grid numbers, reveal order, joins between scenes, accessibility, verification | designing any slide, diagram or effect |
| `lnd-motion-fit` | Which motion each kind of diagram needs and in what order its parts arrive; the instrument law; exits | animating a specific diagram |
| `lnd-motion-craft` | Easing law, curve library, timing, transitions, word-synced captions | choosing curves and durations |
| `lnd-visual-storyteller` | Turns the concept into a visual story: one metaphor world, cast, a shot list wide to close, where depth and light mean something, the style family per beat, an animatic | before storyboarding |
| `lnd-explainer-craft` | Explaining visually for adult, workplace viewers: how a concept becomes a picture, how to emphasise and why, how full the frame should be per register, a colleague's voice not a teacher's | scripting and storyboarding any explainer, and the explaining parts of a lesson |
| `lnd-motion-choreography-loop` | The design loop: three treatments, a timed beat sheet, a 13-point stress test, a declared contract, layered proof | building any animated visual or template |
| `lnd-reference-research` | Looks at existing drawn work first: searches, a 3 to 6 reference board of what to take and not take, derived rules, side-by-side comparison, and the licence check for free asset sets | before composing any complex scene, setting, situation or asset, or anything you are unsure how to picture |
| `lnd-character-design` | Briefs, commissions, places and reviews any living character (people, animals, mascots, personified objects, cells, robots) in any style: the brief, construction, faces, hands, wardrobe, non-human anatomy, each style's rules, cast variations, rig readiness, who draws, the reject list | whenever a lesson needs a character, before any character prompt, and when reviewing one |

**The usual order:** director -> pedagogy -> persona -> (script, with explainer craft) -> visual storyteller -> reference research -> visual design -> motion fit ->
motion craft, with the choreography loop as the working method for every animated visual. Each skill
names its companions, and each works on its own.

**How to use them**
- **In Claude (claude.ai, Claude Code, Cowork):** add each folder as a skill (zip the folder and upload
  it, or place it in your skills directory). The `description` in each `SKILL.md` tells Claude when to
  use it.
- **In any other AI:** paste the `SKILL.md` (and the files in its `reference/` folder that it names) into
  the conversation or the system prompt, then give it your source material and request.

**The one rule they all share:** never invent a fact. Every figure, name and claim in a video traces to
the source material or to something the requester stated, and anything invented for illustration is
framed as invented ("say", "imagine").

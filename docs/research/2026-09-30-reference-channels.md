# Reference channels research: what puts an explainer in the top class, and what Loom needs to get there

Prepared 2026-09-30 for the Loom L&D video engine. Channels: 3Blue1Brown, TED-Ed, Kurzgesagt - In a Nutshell, Cleo Abram (Huge If True), Crayon Capital.

## How to read this report (verification legend)

I could not watch any video. Everything below is built from pages I fetched or search results I read in this session: channel sites, the 3Blue1Brown written lesson versions of his videos, TED and TED-Ed lesson pages (which carry credits and exact durations), creator interviews, making-of material, analytics pages and, for Crayon Capital, YouTube's own auto-caption tracks as republished on a transcript site. Every claim carries one of these tags where it matters:

- **[V]** verified from a source read in this session (the source is in the Sources list).
- **[I]** inferred by me from verified material (for example, act structure inferred from a caption track, or a visual inferred from a written lesson that reproduces the video's frames).
- **[U]** unverified: my general familiarity with the channel, not checked in this session. Treat as a hypothesis to confirm by watching.

Access notes: two attempts to fetch YouTube watch pages returned HTTP 429 (rate limited). Per instructions I did not retry or route around it, so no video page, description or view count was read from YouTube directly. Where a YouTube URL is given, it came from a verified third-party page (TED-Ed, Our World in Data, the YouTube Official Blog, OutlierKit, Prepublish) unless marked otherwise. Transcripts were summarised, not reproduced; each source contributes at most one short quote.

**Videos actually studied:** 3Blue1Brown 6, Kurzgesagt 7 (one is their making-of), TED-Ed 6 lessons plus 2 TED-Ed making-of lessons, Cleo Abram 6, Crayon Capital 6 (2 studied in depth through the full caption track, 4 at the level of title, hook, length, date and performance only).

---

## 1. 3Blue1Brown (Grant Sanderson)

### Channel facts
- Math explained visually; goal stated on his About page is to make more people love math, "whether for its utility or its beauty" [V].
- Almost all animation is Manim, his own open-source Python library; he also says Manim is only for making clips, and narration sync and assembly belong in a normal video editor [V].
- The team page now lists animators and illustrators (Paul Dancstep, Aaron Gostein, Nishad Deulkar, Mitchell Zemil, Claire Vermillion), operations, and Vincent Rubinetti for music and web [V]. So the channel is no longer a one-person shop.
- Every major video has a written, interactive lesson version on 3blue1brown.com with the same frames and argument, which is why the structural notes below are more precise than for other channels [V].

### Videos studied

**1. Linear transformations and matrices (Essence of Linear Algebra, chapter 3)**, 7 Aug 2016, roughly 10-11 min [length U]. https://www.3blue1brown.com/lessons/linear-transformations
- Hook: reframes a thing students have memorised. The claim is that matrices make sense once you see them as moving space, not as grids of numbers [V]. Opens on a movie quote about having to see the Matrix for yourself [V].
- Arc: "transformation" means function, but chosen to suggest movement -> watch every vector move -> too crowded, so show vectors as points -> use a whole grid, keeping a faint static copy of the original grid behind it for reference -> define linear visually (lines stay lines, origin fixed, grid lines stay parallel and evenly spaced) -> show near-miss counterexamples (a transformation that looks linear until a diagonal line curves) -> payoff: only two vectors need recording, and those two columns are the matrix [V].
- Turn: the matrix-vector formula is derived, then he jokes you could make high schoolers memorise it "for no apparent reason" [V], contrasting rote learning with the picture.
- Visual world: an infinite coordinate grid that is itself the protagonist. Technique: a ghost grid stays behind the moving one so the viewer can measure change [V]. Colour-coded basis vectors [U: green and red].
- Learner agency: "pause and ponder" questions at the key step [V in the written lesson; the video version uses on-screen prompts, U].
- Why it is top quality: the one governing visual (moving grid) is held for the whole chapter and the formula falls out of it, so the viewer feels they could have derived it.

**2. But what is a neural network? (Deep Learning chapter 1)**, 2017, roughly 19 min [length U]. https://www.3blue1brown.com/lessons/neural-networks
- Hook: recognising a sloppy handwritten 3 is effortless for your brain but nearly impossible to describe as a program [V].
- Running example: one network reading 28x28 = 784 pixel digits, each pixel a brightness value, output one of 10 digits [V]. The whole series stays on this single example [V that the example is the basis of the series; I that it is held throughout].
- Arc: neurons as numbers holding activations -> layers -> the hope that middle layers detect edges then loops -> weights and biases as dials (roughly 13,000 of them) [dial count U] -> the whole network as one function -> sets up training for chapter 2 [I].
- Visual: pixel grid lighting up, columns of circles, weighted connections coloured by sign [U for colours].
- Quality driver: an honest "the hope is" framing, stating what the network might do before admitting it does not quite do it [U], which is a misconception-then-correction delivered gently.

**3. But what is the Fourier Transform? A visual introduction**, 26 Jan 2018, roughly 20 min [length U]. https://www.3blue1brown.com/lessons/fourier-transforms (YouTube id spUNpyF58BY [V via search])
- Hook: how do you pull apart a sound made of several notes into the notes? [I from topic; exact opening line U].
- Governing metaphor: a "winding machine" that wraps the signal around a circle at an adjustable winding frequency and tracks the centre of mass of the wrapped curve [V]. When the winding frequency matches a frequency in the signal, the centre of mass lurches off-centre [V].
- Arc: build the machine, play with it, notice the spike, then name it (this is the transform) and only at the end show the formula as a description of the machine [I].
- Numbers: the example signal is 3 beats per second wound at 0.5 cycles per second, stated as concrete values before generalising [V].
- Quality driver: a mechanical metaphor the viewer can "operate" in imagination, introduced before any notation.

**4. The colliding blocks that compute pi (the "clacks" series, problem and solution)**, 2019, problem video about 5 min and solution about 15 min [lengths U]. https://www.3blue1brown.com/lessons/clacks-solution
- Hook: a pure puzzle. Two blocks, a wall, no friction; count the collisions and the digits of pi appear when the mass ratio is a power of 100 [V].
- Arc: pose the absurd result in the first video and stop (a cliffhanger across uploads) -> solution video turns physics into geometry: plot the two velocities as a point, conservation of energy makes an ellipse, rescale the axes by the square roots of the masses to make it a circle, and each collision becomes a bounce of fixed angle around the circle [V].
- Quality driver: the "shift in perspective" he says he looks for, where a hard problem becomes obvious once drawn in the right space [V, via the Buteau profile of his interviews].

**5. Bayes theorem, the geometry of changing beliefs**, 22 Dec 2019, roughly 15 min [length U]. https://www.3blue1brown.com/lessons/bayes-theorem
- Hook: a named character. "Steve" is shy, tidy, detail-loving; is he more likely a librarian or a farmer? The viewer answers before being told [V].
- Misconception then correction: most people say librarian; Kahneman and Tversky called that irrational because people ignore that farmers outnumber librarians about 20 to 1 [V].
- Representative-sample device: picture 200 farmers and 10 librarians; 40% of librarians and 10% of farmers fit the description; that is 4 librarians and 20 farmers, so 4 of 24, about 16.7% [V]. People are drawn as small figures [V from the lesson images].
- Then abstraction: the same reasoning redrawn as a 1x1 square where areas are probabilities, so evidence "restricts the space" and the new probability is a proportion of the restricted area [V]. Colour-coding holds throughout: hypothesis in one colour, evidence in another [V, the lesson uses fixed colours for H and E].
- Aside that is itself a technique: the Linda problem, where asking "how many of 100 people" instead of "which is more likely" drops the error dramatically, per the lesson [V]. The lesson draws the lesson from its own device: counts beat percentages for intuition.
- Ending: returns to Steve and admits the controversy about the prior, then shows the debate fits inside the same diagram [V]. The opening character is paid off.
- Quality driver: four layers of understanding stated up front and tackled in reverse order (when to use it, why it is true, what the parts mean) [V].

**6. Transformers, the tech behind LLMs (Deep Learning chapter 5)**, 1 Apr 2024, roughly 27 min [length U]. https://www.3blue1brown.com/lessons/gpt
- Hook: what is actually happening inside a chatbot when it predicts the next word [I; exact line U].
- Visual world: words as vectors in a high-dimensional space where directions carry meaning (word embeddings), and data flowing through stacked blocks [V for embeddings as a core topic; directions carrying meaning U].
- Quality driver: continuity with the 2017 series (same visual grammar for neurons and weights) so returning viewers already own the vocabulary [I].

### 3Blue1Brown signature
- **Concrete before abstract**, stated by him as advice to other creators: give examples before the general framework, because a new learner has to build the framework from somewhere [V].
- **Open with the key exercise or puzzle** rather than saving it for the end [V].
- **Story matters**: he names comedy, characters you care about and a mystery you need resolved as the neglected ingredient [V, TEDxBerkeley via profile].
- **"You could have invented this"**: the stated goal of his calculus series was that you finish feeling you could have invented calculus [V].
- **Visual grammar**: dark background, a small set of saturated colours used semantically, LaTeX typesetting that transforms term by term, the "pi creature" characters as a stand-in audience [colours and pi creatures U in this session; the Bayes lesson confirms semantic colour, V].
- **Music**: Vincent Rubinetti composes nearly all of it [V]; its role is quiet, reflective beds [U].

### Production approach
- Tooling: Manim for clips, traditional editor for assembly and narration [V]. Written lessons adapted by collaborators [V].
- Team: Grant plus a handful of animators, illustrators, an operations lead and a composer [V].
- Time per video: not found in this session [U].

### Transferable to short corporate L&D
- Transferable: concrete-first sequencing; the named running example; the "wrong answer first" hook; representative samples instead of percentages; a single visual world per lesson; semantic colour; pause-and-ponder prompts. All are script and storyboard skills Loom can encode.
- Partly transferable: Manim-style precise transforms. Loom already has Manim; the lesson is to use a transform as the explanation, not as decoration.
- Not transferable: 15-30 minute runtimes and the assumption of a self-selected, curious audience. Corporate lessons must reach the payoff in 3-6 minutes.

---

## 2. TED-Ed (study of variety)

### How TED-Ed is made
- An educator's words and ideas are paired with professional animators; the lesson page credits an educator, a director or animator, a narrator, a content producer, an editorial producer, an associate producer and a **fact-checker** [V, imposter syndrome credits].
- TED-Ed recruits filmmakers by inviting treatment proposals for topics, then awards lessons to the most fitting proposal (Animafest Zagreb 2016 session) [V]. So each lesson's style is chosen per topic, not imposed by a house style.
- TED-Ed's own making-of says a visual metaphor can tie an idea as large as Big Data to a familiar image such as a growing tree [V]. The same series covers timing and spacing, pop-up book, puppet and rotoscope approaches [V from the collection list].
- Recurring constants across studios: a stable narrator pool (Addison Anderson on three of the six lessons below [V]), credited composers per lesson [V], and a length of about 4-5 minutes [V for three lessons with exact durations].

### Lessons studied

**1. How playing an instrument benefits your brain**, Anita Collins; directed by Sharon Colman Graham; narrated by Addison Anderson; music by Peter Gosling. July 2014, 4:29 [V]. https://www.ted.com/talks/anita_collins_how_playing_an_instrument_benefits_your_brain
- Hook: listening to music lights up several brain areas, but playing is like a full-body workout for the brain; why? [V from description].
- Governing metaphor: fireworks going off in the brain [V from description], and the brain as a gym or workout [V].
- Style: [U] soft hand-drawn 2D look with a warm palette.
- Quality driver: one vivid physical metaphor (fireworks) for invisible neural activity, then a claimed long-term payoff.

**2. The benefits of a bilingual brain**, Mia Nacamulli; narrated by Pen-Pen Chen; June 2015 [V]; animation credit not confirmed in this session [U]. https://www.ted.com/talks/mia_nacamulli_the_benefits_of_a_bilingual_brain
- Structure: a taxonomy lesson, three types of bilingual brain, then health benefits [V].
- Quality driver: classification made visual (three brain "types" side by side) [I].

**3. Can you solve the prisoner hat riddle?**, Alex Gendler; directed by Artrake Studio; narrated by Addison Anderson; music by WORKPLAYWORK and Cem Misirlioglu; October 2015 [V]. https://www.ted.com/talks/alex_gendler_can_you_solve_the_prisoner_hat_riddle
- Hook: you and nine others are captured by aliens and will live only if at least nine guess their own hat colour [V].
- Structure: stakes, rules, an explicit invitation to pause and solve, then the solution [V for the riddle series format; pause prompt U].
- Style: Gendler retrofits classic puzzles into blockbuster-style sci-fi predicaments, and Artrake animates the series [V, Open Culture].
- Quality driver: an absurd high-stakes frame around a dry logic problem, plus a pause that makes the viewer an active solver.

**4. How to manage your time more effectively (according to machines)**, Brian Christian; animated by Marko Djeska; narrated by Addison Anderson; January 2018 [V]. A TV listing gives 10 minutes [V as listed, but I suspect a listing artefact; U].
- Hook: humans and computers share the problem of doing as much as possible in limited time [V].
- Governing metaphor: your day as a computer's scheduler, with interruptions, context switching and error-fixing [V].
- Why it matters for Loom: this is a workplace-skills lesson (time management) delivered through a borrowed technical metaphor. It is the closest TED-Ed analogue to a corporate L&D lesson.

**5. What is imposter syndrome and how can you combat it?**, Elizabeth Cox; directed by Sharon Colman; narrated by Christina Greer; fact-checker Francisco Diez; August 2018, 4:02 [V]. https://ed.ted.com/lessons/what-is-imposter-syndrome-and-how-can-you-combat-it-elizabeth-cox
- Hook: Maya Angelou, after eleven books and several awards, still doubted she had earned them [V].
- Structure: a famous counter-intuitive case -> name the phenomenon -> psychology behind it -> what you can do [V from description].
- Quality driver: opens on a person, not a definition; ends on action. A pattern directly usable for soft-skills lessons.

**6. How does the stock market work?**, Oliver Elfenbaum; directed by Tom Gran and Madeleine Grossi; narrated by Addison Anderson; music by Euan James-Richards; April 2019, 4:09 [V]. https://www.ted.com/talks/oliver_elfenbaum_how_does_the_stock_market_work
- Hook: origin story. In the 1600s the Dutch East India Company funded voyages by selling citizens a share of profits, and so invented the stock market [V].
- Structure: history as the explanation of mechanism (why shares exist), then how companies and investors use the market today [V].
- Quality driver: a historical "first case" makes an abstract instrument concrete. Directly comparable with Crayon Capital's VOC video (section 5).

Making-of lessons also read: "Making a TED-Ed Lesson: Creative process" (educator George Zaidan, animation director Biljana Labovic, animator Lisa LaBracio) and "Making a TED-Ed Lesson: Visualizing complex ideas" (5:04) [V].

### TED-Ed signature
- Short (about 4-5 min), one question in the title, one educator's argument, one visual metaphor chosen by the animator for this topic [V for length and credits; I for the pattern].
- Variety is the point: studios pitch treatments, so style follows content [V].
- A rigour layer: named fact-checker and editorial producer on each lesson [V], plus Think, Dig Deeper and Discuss questions attached to each lesson page [V].

### Production approach
- Educator script, TED-Ed editorial and fact-check, a commissioned director or studio, a stable narrator pool, a commissioned composer [V]. Team size and weeks per lesson: not found [U].

### Transferable to L&D
- Highly transferable: the 4-5 minute single-question format; case-first hooks (Maya Angelou); a workplace concept explained by a borrowed metaphor (time management as scheduling); a fact-check role; attached questions. This is the format closest to what Loom produces.
- The variety model transfers as "style follows content": Loom's style packs can be chosen per lesson by topic.
- Not transferable: the hand-crafted uniqueness of each studio's art. That needs human artists, or a much larger library of style packs and shading grammars.

---

## 3. Kurzgesagt - In a Nutshell

### Channel facts
- Munich design studio founded 2013; flat, minimalist style, sometimes with 3D [V, Wikipedia]. About 70 people now [V, Forbes 2024 and Wikipedia]; narrator Steve Taylor since the first video [V].
- Values stated as aesthetic, fun, accessible; objective and rigorous; optimism [V].
- Research first from papers and primary sources; for complex topics they contact several experts and usually work with two or three, sending the script back and forth; then an internal clarity round [V, Forbes]. Dettmer describes the aim as "a fine line between over-simplifying and making things overly-complicated" [V].
- Trust history: they removed two 2015 videos that did not meet later standards and republished a 2024 exercise video after expert criticism [V]. Sources are given for statements [V].
- The birds: Dettmer drew simple ducks and birds with big white eyes because they were easy to draw and funny, and they saved time when he did most of the work alone [V].

### Videos studied

**1. The Immune System Explained I - Bacteria Infection ("Why you are still alive")**, 2014 [year U], about 6-7 min [U]. https://laughingsquid.com/why-you-are-still-alive-a-simple-explanation-of-how-the-human-immune-system-works/
- Hook: every second you are under attack by bacteria, viruses and spores that want your body's resources [V].
- Governing metaphor: the immune system as an army with guards, soldiers, intelligence, weapon factories and communicators [V]. Macrophages are border guards that can each devour up to about 100 intruders; neutrophils leave their patrol to join the battle [V].
- Characters: cells as simple cartoon characters with faces [U].
- Music by Thomas Veith [V].
- Quality driver: a sustained military world where every cell type gets a role, so a list of 12 jobs and 21 cell types becomes a cast [V for 12 and 21 as the video's framing].

**2. Loneliness**, 2019, about 9 min [length U]. https://kurzgesagt.org/projects/loneliness
- Hook: everyone feels lonely; few know why the feeling mattered to our ancestors [V].
- Arc: evolutionary story (bands of 50-150 people, alone meant death) -> social pain as an early-warning system -> the modern mismatch -> health risk (they report loneliness as deadly as obesity and smoking) -> what to do [V].
- Production note: two years to make because they wanted the tone "100% right" for a personal topic [V].
- Quality driver: tone management. Science delivered with care for how the viewer feels.

**3. The Egg - A Short Story**, 1 Sep 2019, about 8 min [length U]. https://laughingsquid.com/?p=776148
- An adaptation of Andy Weir's short story; almost two years to make [V]. A narrative departure from their explainers [V].
- Why it is in this study: it shows the studio's world-building and character acting carry a pure story with no explanation layer [I].

**4. How to Make a Kurzgesagt Video in 1200 Hours**, February 2020 [V]. https://www.youtube.com/watch?v=uFk0mgljtns
- Process as they describe it: topic list grows with every research project; research from books, papers and expert conversations; script; storyboard sketch; a style frame fixing palette; illustration in Illustrator; scenes split into hundreds or thousands of parts and imported into After Effects; characters rigged; almost everything moved by hand; 2-3 animators for about 8-10 weeks; original music composed to the finished picture to highlight important parts; sound effects for depth; frequent team reviews [V from search summaries of the video and Adobe community and Toolfarm write-ups]. Cinema 4D also used [V].
- In 2016 a 5-6 minute video took about 200 working hours with 15 staff [V, Bird in Flight]; by 2020, about 1,200 hours [V].

**5. The Coronavirus Explained & What You Should Do**, 19 Mar 2020 [V]. https://www.youtube.com/watch?v=BtN-goy9VOY
- Hook: urgency and personal agency in the title.
- Mechanism shown: the virus binds to ACE2 receptors, injects its genetic material, and the cell becomes a virus factory that releases copies when it dies [V].
- Data: made with Our World in Data; virologists and epidemiologists reviewed it fast; produced in days instead of months [V]. Most viewed on the channel, over 89 million views [V, Wikipedia].
- An academic study calls it an aesthetically compelling explanation that uses fantastical depictions to make the biology straightforward [V, via Wikipedia].
- Quality driver: proof that the style system (reusable cell characters, known palette, known rigs) lets the studio ship fast when it has to [I].

**6. The Last Human - A Glimpse Into The Far Future**, 28 Jun 2022, in partnership with Open Philanthropy [V]. YouTube id LEENEFaVUzU [from a search result URL, not fetched].
- Hook: when will the last human be born, and how many people will there ever be? [V].
- Numbers: the argument rests on counts of past, present and possible future people [V]; the visual device, as I recall it, is to represent people as tiny figures and scroll through them [U].
- Quality driver: huge numbers made human by rendering them as people rather than digits [I].

**7. Let's Travel to The Most Extreme Place in The Universe**, 4 Oct 2022, 13 min [V]. https://kurzgesagt.org/projects/most-extreme-place
- Structure: a scale journey. Start in a park about 1,000 m across; each press of a "magic button" makes you 1,000 times smaller; each level is a stranger world, down to the quantum foam at the Planck length [V].
- Visual: continuous zoom through nested worlds; illustration makes a journey no camera could [V as their framing].
- Quality driver: one rule (x1000 per step) repeated, so the viewer can predict the rhythm and feel the scale.

### Kurzgesagt signature
- One richly illustrated world per video, often a metaphor world (an army, a factory, a journey) [V for army and journey].
- Recurring character mascots (the birds) as viewer stand-ins that also carry jokes [V for birds].
- Scale journeys and infinite zooms, enabled by vector art that stays crisp at any size [V for scale journey; vector zoom rationale U from a low-quality source, treat as U].
- Palette: bright, saturated, high-contrast colour on dark space-like backgrounds, soft glows and gradients [V for bright colour palettes; the glows and dark backgrounds U].
- Narration: one warm, steady, slightly wry voice (Steve Taylor) for over a decade [V for narrator; tone U].
- Sound: original scored music per video plus detailed SFX [V].
- Optimism as brand ("optimistic nihilism", a hopeful utopian future) [V].

### Transferable to L&D
- Transferable: a metaphor world held all lesson; mascots as learner proxies; scale ladders for big numbers; expert review loop; scoring and SFX tied to meaning; a reusable character and palette system that lets you ship fast.
- Partly transferable: the illustration density. Loom can approximate with a curated asset library per style pack, but not at Kurzgesagt's per-video bespoke level.
- Not transferable: 1,200 hours per video and 8-10 animator-weeks. Loom's advantage has to be the system (reuse, rigs, style packs), which is also what let Kurzgesagt ship the coronavirus video in days.

---

## 4. Cleo Abram - Huge If True

### Channel facts
- Former Vox producer, worked on Netflix's Explained and hosted YouTube Originals' Glad You Asked (Emmy-nominated) [V]. Launched Huge If True on YouTube in 2022 [V].
- Four self-imposed constraints: always a deep dive into a technology or achievement that will matter; always a real explainer of how it works and how it could play out; genuinely optimistic; and if it is not inherently visual, it is not made [V].
- She calls herself "a proxy for the audience" [V], goes on field shoots and does the thing on camera, and mixes vlog-style exploration with highly produced animation [V].
- Team of 7: a creative director for the visual product, producers with scientific domain knowledge, an editor, a director of operations [V, Forbes 2026]. A designer-animator (Whitney Theis) and lead producer Justin Poore are named in search results [V as search snippets; primary not read].
- Reported cadence: roughly one highly produced episode a month, several hundred hours over months, with edit and animation taking at least a month [reported in search summaries; primary source not fetched, treat as U].
- Episodes around 20 minutes that start with no assumed knowledge and end somewhere deep [V, Forbes].

### Videos studied

**1. Why Elon Musk is Really Building Starlink**, 8 Mar 2022, about 15 min [V]. Her first video over 1M views [V]. YouTube id Q089i8RQPB0 [V from the YouTube blog's thumbnail beside this story].
- Hook: the word "really" signals a hidden motive; the payoff reveals the non-obvious reason [I]. What the reason is: [U].
- Structure: a familiar name, a surprising reversal, then a mechanism explainer [I, consistent with the channel's analysed breakout formula, V].

**2. Would You Use An Artificial Womb? (I Would)**, 2022 per one listing, "two years ago" in a 2025 interview [date conflict, U]. YouTube id mLYMAkgvZsI [V].
- Hook: a direct question to the viewer plus her own answer in the title.
- Structure: she recorded herself learning; found the technology is a spectrum from IVF support to saving premature babies; and her own emergency ovarian surgery during production became part of the story [V].
- Quality driver: a personal stake that is real, not staged, used to make an abstract future technology emotionally concrete.

**3. Nuclear Fusion, explained for beginners**, 7 Oct 2022 [V]. YouTube id piPbnKdve9M [from a search result URL].
- Hook: she and Simone Giertz try to build a fusion device; when it goes wrong, it becomes an explainer [V].
- Includes an interview with the CEO of fusion company Helion and home-built reactors [V].
- Quality driver: a hands-on attempt (and failure) as the frame for a mechanism explanation.

**4. Quantum Computers, explained with MKBHD**, 4 Apr 2023 [V]. https://www.youtube.com/watch?v=e3fz3dqhN44
- Framing: two famous creators admit they do not understand quantum computing and go learn it [V]. Topics include a video-game analogy, what the machines look like, how they work, what they are good for, and encryption [V].
- It was her most viewed YouTube video in mid-2024 at 7.5M [V].
- Quality driver: permission to not know. The host models curiosity rather than expertise.

**5. I Tested NASA's New Space Suit (Ft. Axiom Space)**, 14 May 2024 [V]. YouTube id FerFv7BZAwo [V].
- Structure: access (Axiom's design and test facilities), then she puts the suit on, pressurises it and does challenges; the explainer of how suits work is woven through the test [V].
- Quality driver: embodiment. The learner sees a body struggle with the constraints the explainer describes.

**6. The Huge Conversation with NVIDIA CEO Jensen Huang**, January 2025 [V]. Pitched as the interview to watch to understand why NVIDIA became so valuable and what comes next [V]. She describes her Huge Conversations as highly produced interviews [V from her post].
- Quality driver: an interview elevated with explainer graphics [I from her description; not verified visually].

### Cleo Abram signature
- Optimistic framing as a hard rule, and the asterisk in "HUGE* if true" as a built-in honesty caveat [optimism V; asterisk meaning I].
- Host-as-proxy, on camera, asking the questions a curious non-expert would ask, in the right order [V].
- Direct-to-camera sections plus bold animations, graphs and text elements in a consistent, recognisable style [V, secondary analysis].
- Visual-first topic selection [V].
- One-line cold opens that are attention-grabbing but not clickbait [V, secondary analysis].

### Transferable to L&D
- Transferable: "if it is not visual, do not make it" as a gate; ordering questions the way a novice would ask them; honest caveats; a personal or real case as the emotional anchor; "try it and fail" as a frame for a procedure lesson.
- Partly transferable: host presence. Loom could use a presenter card, a narrator persona or an avatar, but HeyGen avatars are not proven in Loom (Video-Engine STATE.md, read this session).
- Not transferable: field access, celebrity collaborators, live-action cinematography. The quality of her show depends heavily on being physically present.

---

## 5. Crayon Capital

### Which channel this is (ambiguity resolved)
- I studied **@Crayon_Capital** on YouTube: a faceless finance and business-history explainer channel, about 258,000-266,000 subscribers, 30 long-form uploads from April 2025 to September 2026, average length about 15 minutes, tagline "Big finance, drawn small" [V from OutlierKit, Prepublish and search results].
- Other channels with similar names exist: "Crayon Finance" (a channel created December 2025 with 53 subscribers that describes itself as explaining money "through simple sketches" and "crayon-style explanations") and "The Crayon Capital" (@TheCrayonCapital) [V that they exist]. A channel id UCP9RPj_BG0vit2TNM7LuRxA surfaced with the same tagline and may be @Crayon_Capital itself [U]. I chose @Crayon_Capital because it matches the name exactly, is clearly a finance and business explainer, and has the audience scale that makes it a meaningful reference.

### Caveat on visuals
Visual style is **not verified**. The name, tagline and the clone channel's self-description point to hand-drawn crayon or sketch illustration on a light paper-like ground [I]. Many faceless channels of this type use AI-generated or template illustration; whether this one does is unknown [U]. Script-level findings below are solid because they come from the full caption tracks.

### Videos studied

**1. The 2008 Financial Crisis Explained Like You're 5**, 15 Jun 2025, 13:26, about 2.3M views [V]. https://www.youtube.com/watch?v=KE-WJevx-7c
- Hook: September 2008, a 158-year-old investment bank collapses overnight, then the worst meltdown since the Great Depression [V from search summary of the video].
- Depth: title, hook, length and performance only.

**2. The Great Depression Explained Like You're 5**, 15 Aug 2025, 16:29, about 2.8M views [V]. https://www.youtube.com/watch?v=LuEcoqizj0o (caption track read in full)
- Hook (first 30 s): you woke up rich and went to bed broke; a crash wiped out $200 billion; so what happened? then "let's rewind to the party" [V; paraphrased].
- Governing metaphor: the 1920s as a party (jazz, champagne, dance floor) that ends; the music stops by 1931 [V]. The metaphor is sustained across all five acts [I].
- Arc [I from captions]: (1) the boom, with concrete mechanisms (Ford's line cutting 12 hours to 90 minutes; 10 million homes with radios by 1929; buying stock with $10 down on $100) -> act-break line "It's 1929. What could possibly go wrong?" -> (2) Black Tuesday and the chain reaction: margin calls, bank runs, global contagion -> (3) the human toll: 25% unemployment, breadlines, Dust Bowl, Hoovervilles, the Bonus Army -> (4) the turn: Roosevelt, jobs programmes, new rules (SEC, FDIC, Social Security) -> (5) a cliffhanger into the next global crisis.
- Numbers: 23 of 320 sentences contain a number [V, Prepublish analysis]. Numbers are usually converted to people or objects ("one in every four Americans", the $10 down on $100 purchase) [V].
- Voice and pacing: 148 words per minute, average 7.6 words per sentence, 13 questions [V]. Short declaratives, jokes every few lines, and tiny dramatised dialogue lines between stock characters (the barber who gives stock tips, a teller calming a crowd) [V that the lines exist; whether they are separately voiced is U].
- Where viewers rewatched: the three replay peaks fall on the act-break line at 3:57, the "crash was only the beginning" turn at 7:55, and the Bonus Army turn at 11:13 [V, YouTube's public most-replayed graph as reported by Prepublish]. Replays cluster at turns, not at facts.

**3. The Wolf of Wall Street Scam Explained Like You're 5**, 3 Oct 2025, 16:33, about 4.2M views, the channel's biggest [V]. https://www.youtube.com/watch?v=HawmGu7oNrc (caption track read in full)
- Hook: a paradox in three sentences. He lied, got rich, served 22 months, Hollywood made him a star, and people still cheer for him [V; paraphrased].
- Arc [I]: origin (teen hustles, the meat business) -> the discovery that the product does not matter -> Wall Street, Black Monday, penny stocks at 50% commission -> building Stratton Oakmont and "straight line persuasion" -> the mechanism (pump and dump) -> excess -> rot -> the FBI case -> the flip and 22 months -> the book and film -> the victims, who got no movie deal -> an uncomfortable moral about the audience.
- Mechanism beat: the pump and dump is explained step by step (buy cheap blocks, manufacture excitement, spike, dump at the top) and this is the most replayed moment in the video at 7:07 [V]. The mechanism reveal is what people rewatch.
- Dramatised role-play: a full mock cold call is performed as dialogue [V], turning a manipulation technique into a scene the viewer can recognise.
- Pacing: 148 wpm, 8.4 words per sentence, 34 sentences with numbers [V].

**4. How Jeff Bezos Actually Built Amazon**, 28 Nov 2025, 20:13, about 1.1M views [V]. https://www.youtube.com/watch?v=rSgS4wNLLDM
- Pattern: "How X Actually Built Y", the empire-builder playbook variant [V as a pattern named by OutlierKit's analysis]. Content not studied.

**5. Rockefeller: The First Confirmed Billionaire (And How He Did It)**, 28 Feb 2026, 20:16, about 1.4M views [V]. https://www.youtube.com/watch?v=sMH8WchxQR8
- Pattern: superlative plus mechanism promise in parentheses. Content not studied.

**6. NVIDIA Explained Like You're 5**, 9 Jul 2026, 14:30, about 842K views [V]. https://www.youtube.com/watch?v=1GowFTjbUnk
- Pattern: the ELI5 title on a trending company. Content not studied.

### Crayon Capital signature
- The ELI5 promise in the title, then a chronological money story built around **one mechanism** (pump and dump, margin buying, a monopoly playbook) with a protagonist or antagonist [V for the playbook as analysed by OutlierKit; I from two transcripts].
- A sustained comic metaphor world (the party), relentless jokes, stock characters with one-line dialogue, and act breaks that end on an ironic cliffhanger [I from transcripts].
- Moral closer that turns the story back on the viewer [I].
- Faceless: no host, narration plus illustration [V as "faceless", OutlierKit].

### Production approach
- Unknown team and tools [U]. OutlierKit judges it highly replicable with researchers, scriptwriters and editors [V as their opinion]. Upload rate about 0.4-0.6 per week [V].

### Transferable to L&D
- Highly transferable: the case-study arc for compliance, ethics and risk training (fraud, bubbles, failures); the single-mechanism focus; the role-play dialogue that shows a manipulation or a mistake as a scene; turning figures into people; the ironic act-break line.
- Caution: the tone. Crayon Capital's humour depends on mockery of real people and crude gags; corporate lessons need the structure without the snark. Its claims are unsourced on screen [U], so it is a craft reference, not a rigour reference.
- Crayon or sketch styling is cheap to emulate in Loom (a crayon-grain shading grammar and a sketch style pack already exist in concept: Loom has whiteboard and line-art packs and a sketch grammar, per STATE.md).

---

## 6. Cross-channel synthesis

> **Note added 2026-09-30 (D-64):** the requester declined turning this rubric and these patterns into
> checks or templates. They are references for storyboarding judgement, weighed against the pedagogy
> and the kind of video; a YouTube attention technique is not automatically right for workplace learning.

### 6.1 Quality rubric for a Loom lesson (12 checkable criteria)

Each criterion names what to check and where Loom could check it automatically.

| # | Criterion | How to check it | Seen in |
|---|---|---|---|
| R1 | **The first 15 seconds pose a specific question, puzzle, paradox or stake the learner cannot yet answer**, and the lesson answers that exact question explicitly before the recap. | Beat 1-2 narration contains a question or a paradox; a later beat is tagged `answers: hook` and quotes the same key noun. | Bayes (Steve), hat riddle, Wolf of Wall Street, imposter syndrome |
| R2 | **Concrete before abstract**: every new concept first appears as a specific instance (a named person, a real number, a case) before its definition or formula. | For each term in the glossary, its first-mention beat has `kind` in {example, case, scene}; definition beats come later. | 3b1b stated rule; Maya Angelou; Dutch East India Company |
| R3 | **One governing visual metaphor or world**, introduced by the 20% mark, present in at least 60% of beats, and used in the final beat. | Beats carry `motif_id`; count coverage; the last content beat shares the motif. | Immune army, winding machine, the party, moving grid |
| R4 | **Every important number gets a human-scale rendering**: a count of people or objects (representative sample), a physical comparison, or a ratio. No bare percentage without one. | Any beat with a numeric claim has a `scale_ref` or `sample` field; lint for bare "%" on screen. | Bayes 4 of 24; "one in four Americans"; x1000 zoom steps |
| R5 | **The mechanism is shown as change over time**: the key causal step is an animated transformation of the thing itself (not a bullet, not a label appearing). | The beat tagged `mechanism` uses a transform, morph, flow or build, and its on-screen text is 8 words or fewer. | Grid transform, virus hijacking a cell, pump and dump sequence |
| R6 | **A misconception is named and corrected** at least once: the intuitive answer is shown, then overturned with evidence. | At least one beat pair tagged `misconception` -> `correction`. | Steve the librarian, the "linear-looking" shear, imposter syndrome |
| R7 | **A learner proxy** (a named running-example character, a mascot, or the narrator as novice) recurs in at least three beats, including the payoff. | `character_id` appears in 3 or more beats including the last act. | Steve, pi creatures, Kurzgesagt birds, Cleo as proxy, the barber |
| R8 | **Arc with a turn and act breaks**: setup, complication, a turn at roughly 55-75% of runtime, payoff; each act ends on a line that creates the next question. | Storyboard has acts; a `turn` beat falls within the window; the last line of each act is a question or open loop. | Great Depression acts; clacks cliffhanger; Loneliness |
| R9 | **Pacing budget**: narration 140-160 wpm, average sentence 12 words or fewer, a meaningful visual change at least every 4-6 s, and a hold of at least 1.5 s after each key reveal. | Measured from TTS phrase timings and the timeline; a hold check after beats tagged `reveal`. | Crayon Capital measured 148 wpm and about 8 words per sentence; reveal holds are typical of 3b1b [U] |
| R10 | **Semantic colour and type restraint**: each key entity has one colour for the whole lesson; at most two type families; on-screen words support, never duplicate, narration. | Palette map per entity is constant; narration-vs-screen text overlap below a threshold. | Bayes H and E colours; basis vectors |
| R11 | **Sound follows meaning**: music changes at act boundaries; SFX only on events that are themselves changes; narration is never masked. | Music cue points align with act beats; SFX count per minute capped; ducking verified. | Kurzgesagt scoring to picture; TED-Ed commissioned scores |
| R12 | **Grounded and reviewable**: every claim traces to the approved source or knowledge sheet or sits in explicit hypothetical framing, and the lesson ships with a checkable source list and a named review step. | Existing Loom grounding gates; plus a `reviewed_by` field. | TED-Ed fact-checker; Kurzgesagt experts and sources; 3b1b footnotes |

Optional thirteenth for engagement-sensitive lessons: **a pause-and-predict prompt** before the main reveal, where the learner commits to an answer (3b1b pause-and-ponder; TED-Ed riddle pauses; Bayes quiz). Check: one beat tagged `predict` precedes the `reveal`.

### 6.2 Recurring techniques ranked by contribution to quality

Ranking is my judgement from the evidence above, not a measurement. The one partial measurement in this study is Crayon Capital's most-replayed data, which puts turns and mechanism reveals at the top of viewer attention.

| Rank | Technique | Type | Evidence |
|---|---|---|---|
| 1 | Question or paradox hook with an explicit payoff | CONCEPT/SCRIPT | Every channel; Wolf of Wall Street opener; Bayes; hat riddle |
| 2 | Concrete-first sequencing with one running example | CONCEPT/SCRIPT | 3b1b's stated rule; MNIST digit; Steve; Maya Angelou |
| 3 | One governing metaphor or world held throughout | CONCEPT/SCRIPT first, then VISUAL/TOOLING to realise it | Immune army; party; winding machine; grid |
| 4 | Mechanism shown as transformation (the explanation is the animation) | VISUAL/TOOLING | Grid transform; clacks phase space; virus into cell; pump and dump replay peak |
| 5 | Misconception then correction | CONCEPT/SCRIPT | Steve; near-miss linear maps; "the crash was only the beginning" |
| 6 | Human-scale numbers: representative samples, scale ladders, physical comparisons | CONCEPT/SCRIPT to choose; VISUAL/TOOLING to render unit charts and zooms | Bayes 210 people; Most Extreme Place; one in four |
| 7 | Arc with turns and act-break open loops | CONCEPT/SCRIPT | Replay peaks at turns (Crayon Capital); clacks cliffhanger |
| 8 | Learner proxy character or mascot | Both: SCRIPT to cast, VISUAL/TOOLING for a rig that can act | Birds; pi creatures; Cleo; the barber |
| 9 | Narration voice and timing (warmth, emphasis, pauses) | VISUAL/TOOLING (voice) plus SCRIPT (writing for the ear) | Steve Taylor; Addison Anderson; 148 wpm short sentences |
| 10 | Illustration richness: depth, lighting, texture, a coherent art style | VISUAL/TOOLING (and human craft) | Kurzgesagt; TED-Ed studio variety |
| 11 | Scored music and meaningful SFX | VISUAL/TOOLING (audio) | Kurzgesagt composes to picture; TED-Ed composers credited |
| 12 | Semantic colour and typographic restraint | VISUAL/TOOLING (style system) | 3b1b colour coding |
| 13 | Humour and asides | CONCEPT/SCRIPT | Crayon Capital; Kurzgesagt's cheek; 3b1b's jokes |
| 14 | Learner prediction prompts | CONCEPT/SCRIPT | 3b1b; TED-Ed riddles and Think questions |
| 15 | Rigour loop (experts, fact-checker, sources) | PROCESS | TED-Ed; Kurzgesagt; 3b1b written lessons |
| 16 | Live access, embodiment, celebrity collaboration | Not a Loom capability | Cleo Abram |

The pattern: the top three and five of the top seven are script and storyboard skills. The tooling techniques matter most at rank 4 (mechanism transforms) and in the "finish" layer (ranks 9-12), which is where viewers feel the difference between competent and premium.

### 6.3 Tooling needs for Loom, with a rough gap size

Loom's current inventory, as given in the brief and in `Video-Engine/docs/context/STATE.md` read this session: HyperFrames (HTML/SVG plus GSAP) with a world and camera runtime; Manim bridge; Skia and Three.js clip renderers; Lottie seeked by the timeline; a WebGL shader layer (nebula, aurora, mesh, paper, blueprint backgrounds, grain, vignette, light sweep, spotlight); 7 style packs and 5 shading grammars (flat, crescent, paper, sketch, line); 17 templates, 5 blueprints, 0 promoted components; expressive motion (springs, gestures, simulated UI); Kokoro TTS; music and SFX synthesised in the music's key; and, per the brief, a 2D character rig, a 2.5D depth stage and an SVG isometric kit. Gap sizes are estimates, not measurements.

| Technique | What Loom would need | Gap |
|---|---|---|
| Mechanism as transformation (rank 4) | A general, deterministic transform vocabulary for non-math content: SVG path morphing between shapes, "build then run" machine scenes, flow and particle systems along paths, state diagrams that animate their transitions. Manim already covers math. A template family "mechanism machine" (see pattern P5) with slots for parts, inputs and outputs. | Medium |
| Governing metaphor world (rank 3) | A metaphor-world asset set per style pack: for each common L&D metaphor (factory, city, journey or map, body, garden or tree, army or defence, machine, ship, sports field), a kit of 20-40 coherent pieces that can be recombined across beats, plus a motif-continuity gate (already an open item, L-15). | Large (asset volume), small (gate) |
| Human-scale numbers (rank 6) | Unit-chart and icon-array component (N people, k highlighted, regroup animation); a comparison library of physical references with grounded constants (buses, football pitches, stadiums, office floors) that must themselves pass the grounding gate; a log-scale zoom camera for scale ladders with level-of-detail asset swaps. | Small to medium |
| Learner proxy character (rank 8) | Beyond a 2D rig: a pose and expression library, simple acting (look, point, react, shrug), walk and gesture cycles, lip or mouth flaps driven by Kokoro phrase timing, and a cast of 3-5 consistent characters per style pack. For Kurzgesagt-style mascots, a deliberately simple character (big eyes, few parts) is the right target, because simplicity is what made the birds cheap to animate. | Medium |
| Narration quality (rank 9) | Prosody control on Kokoro (emphasis, pause marks, rate per sentence), a lint for sentence length and wpm, a second and third voice for dialogue lines (Crayon Capital's skits), and an optional premium voice path for flagship lessons (OpenAI and ElevenLabs voices are not yet proven in Loom per STATE.md). | Medium |
| Illustration richness and art style (rank 10) | The biggest gap. Kurzgesagt and TED-Ed quality comes from human illustrators designing each world. Options: commission a human illustrator per style pack to draw the metaphor-world kits once, then let Loom recombine them; add shading grammars for texture looks (crayon grain, cut paper, gouache) that the shader layer can apply; add rim light, per-element glow and depth-of-field in the 2.5D stage. | Large (human art), small to medium (grammars and lighting) |
| Scored music and SFX (rank 11) | Adaptive scoring: music with sections that change at act boundaries and swell on the turn; a curated SFX library (whooshes, pops, UI ticks, organic foley) mapped to motion events; loudness and ducking checks. Loom's synthesised music is a strong base; the gap to composed scores is quality, not plumbing. A small licensed stem library or a composer-authored set of stems per style pack would close most of it. | Medium to large |
| Semantic colour and type (rank 12) | An entity-to-colour map declared in the storyboard and enforced by a lint; Loom's brand and style packs already carry tokens. | Small |
| Scale journeys and camera continuity | The world and camera runtime exists; needs nested-scale support (precision at large zoom factors) and transition templates that keep one continuous canvas. | Small to medium |
| Style variety like TED-Ed | More style packs chosen per topic, with a "style follows content" selection step. Each new pack needs its asset kits. | Medium per pack |
| Host presence like Cleo Abram | A presenter card, photo cut-outs, screen recordings, or an avatar (HeyGen unproven). Real field access cannot be synthesised; do not chase it. | Large and mostly not worth closing |
| Rigour loop (rank 15) | Already Loom's strength (grounding gates). Add a `reviewed_by` sign-off field and a visible sources end card. | Small |

### 6.4 Reference patterns worth encoding

Five patterns, each as a storyboard pattern with beats, the technique it carries, and how Loom could encode and gate it.

**P1. The wrong answer first (misconception then correction)**
- Source: 3b1b Bayes (Steve), the near-miss linear maps, TED-Ed imposter syndrome.
- Beats: (1) present a vivid case and ask the learner to choose; (2) predict prompt with a short hold; (3) reveal what most people choose and why it feels right; (4) show the missing factor visually; (5) recompute with the factor; (6) name the principle; (7) return to the case with the corrected view.
- Encode as: a template with slots `case`, `options`, `intuitive_answer`, `missing_factor`, `corrected_answer`, `principle`. Gate: the `missing_factor` must be grounded, and the intuitive answer must be labelled as the intuitive answer, never stated as fact.
- L&D fit: compliance (what most people think is allowed), safety, bias, decision-making.

**P2. The representative sample**
- Source: Bayes (200 farmers and 10 librarians -> 4 of 24), Crayon Capital's "one in four Americans", Kurzgesagt's crowds of people.
- Beats: (1) state the percentage or rate; (2) replace it with a crowd of N icons; (3) highlight subgroups one at a time; (4) regroup the highlighted icons side by side; (5) read the answer as "k out of N"; (6) optionally collapse to an area diagram for the general case.
- Encode as: a unit-chart component with deterministic layout and regroup animation. Gate: N and k must come from the source or be marked as an illustrative sample ("say 200").
- L&D fit: risk, data literacy, sales funnels, incident rates.

**P3. The scale ladder (zoom-out or zoom-in reveal)**
- Source: Kurzgesagt "Most Extreme Place" (x1000 per step from a park to the Planck length), The Last Human's counts of people.
- Beats: (1) anchor at a familiar size or amount; (2) state the fixed step rule; (3) step, with a physical reference at each level; (4) keep the previous level visible as a shrinking inset so the learner feels the ratio; (5) land on the target quantity; (6) return to the anchor.
- Encode as: a camera template on the continuous canvas with a log-scale zoom, a list of levels, each level a comparison object from the grounded comparison library.
- L&D fit: budgets, data volumes, time horizons, customer counts, carbon figures.

**P4. The running example character**
- Source: Steve, the pi creatures, the Kurzgesagt birds, Crayon Capital's barber and bank teller, Cleo as the audience proxy.
- Beats: introduce one named character with one concrete situation in the hook; give them a decision or problem in each act; use their reaction to mark reveals; return to them in the payoff with the new understanding applied.
- Encode as: a `character_id` on beats plus a cast file per lesson (name, role, visual from the rig's cast); gate R7 (at least 3 appearances including the payoff). Keep the character deliberately simple so acting is cheap.
- L&D fit: nearly every soft-skills and process lesson ("Priya, a new team lead, has to...").

**P5. The mechanism machine inside a rise and fall case**
- Source: 3b1b's winding machine; Kurzgesagt's immune army and virus factory; Crayon Capital's pump and dump (the most replayed moment of its biggest video) set inside a chronological rise, rot and fall.
- Beats: (1) paradox hook about the outcome; (2) origin and setup; (3) build the machine part by part, one part per beat; (4) run the machine once with real numbers; (5) scale-up (it runs many times); (6) the crack (what the machine ignored); (7) collapse or correction; (8) consequences for real people; (9) the transferable lesson, turned back on the learner.
- Encode as: a `mechanism` template with ordered `parts[]`, `input`, `output`, `failure_mode`, and an act structure with a turn window check (R8). Gate: the machine's steps must each trace to a source anchor.
- L&D fit: fraud and ethics, how a process fails, root-cause and postmortem lessons (Loom's own `blameless-postmortem` lesson is a natural first test).

---

## 7. What is still unverified (summary)
- All visual descriptions of Crayon Capital, and most frame-level visual descriptions of Kurzgesagt, TED-Ed and Cleo Abram videos (palettes, shot sizes, transitions). These are marked [U] above and need a human to watch the videos.
- Most 3Blue1Brown and Kurzgesagt video lengths (marked "roughly").
- Cleo Abram's per-episode hours and cadence (search summaries only), and the date of the artificial womb video (sources conflict).
- The 10-minute runtime listed for the TED-Ed time management lesson (probably wrong).
- Whether Crayon Capital's dialogue lines are separately voiced, and whether its art is hand-drawn or generated.
- Several YouTube ids came from third-party result URLs rather than YouTube itself (noted inline).
- The technique ranking and the gap sizes are judgements, not measurements.

---

## Sources

3Blue1Brown
- 3Blue1Brown, Wikipedia: https://en.wikipedia.org/wiki/3Blue1Brown
- 3Blue1Brown About and FAQ (team, Manim advice): https://www.3blue1brown.com/about/
- Lesson, Linear transformations and matrices: https://www.3blue1brown.com/lessons/linear-transformations
- Lesson, Bayes' theorem: https://www.3blue1brown.com/lessons/bayes-theorem
- Lesson, Neural networks: https://3blue1brown.com/lessons/neural-networks
- Lesson, Fourier transforms: https://3blue1brown.com/lessons/fourier-transforms
- Lesson, Clacks solution: https://3Blue1Brown.com/lessons/clacks-solution
- Lesson, GPT / Transformers: https://3blue1brown.com/lessons/gpt
- SoME1 announcement (advice video page): https://www.3blue1brown.com/lessons/some1
- Lessons from Grant Sanderson (compilation of interviews and talks): https://www.antoinebuteau.com/lessons-from-grant-sanderson/
- IAPS interview: https://iaps.info/2025/01/22/exploring-the-path-of-3blue1brown-a-conversation-with-grant-sanderson/
- Stanford Daily on his talk: https://www.stanforddaily.com/2020/01/24/3blue1brown-creator-grant-sanderson-15-talks-engaging-with-math-using-stories-and-visuals
- Golem blog on SoME advice: https://classes.golem.ph.utexas.edu/category/2021/08/why_arent_you_making_maths_vid.html

TED-Ed
- Animafest Zagreb 2016, TED-Ed: Where Education Meets Animation (Gerta Xhelo): https://www.animafest.hr/en/2016/side_event_pro/read/ted_ed_where_education_meets_animation_gerta_xhelo
- Making a TED-Ed Lesson: Creative process: https://ed.ted.com/lessons/making-a-ted-ed-lesson-creative-process
- Making a TED-Ed Lesson: Visualizing complex ideas: https://ed.ted.com/lessons/making-a-ted-ed-lesson-visualizing-complex-ideas
- How playing an instrument benefits your brain: https://www.ted.com/talks/anita_collins_how_playing_an_instrument_benefits_your_brain
- The benefits of a bilingual brain: https://www.ted.com/talks/mia_nacamulli_the_benefits_of_a_bilingual_brain
- Can you solve the prisoner hat riddle?: https://www.ted.com/talks/alex_gendler_can_you_solve_the_prisoner_hat_riddle
- Open Culture on the riddle series and Artrake: https://openculture.com/2016/07/can-you-solve-these-animated-brain-teasers-from-ted-ed.html
- How to manage your time more effectively (Laughing Squid): https://laughingsquid.com/how-to-manage-your-time-more-effectively-according-to-machines/
- TVDB listing for the time management lesson: https://thetvdb.com/series/ted-ed/episodes/6489354
- What is imposter syndrome (TED-Ed lesson page with credits): https://ed.ted.com/lessons/what-is-imposter-syndrome-and-how-can-you-combat-it-elizabeth-cox
- What is imposter syndrome (TED page with duration): https://www.ted.com/talks/elizabeth_cox_what_is_imposter_syndrome_and_how_can_you_combat_it
- How does the stock market work?: https://www.ted.com/talks/oliver_elfenbaum_how_does_the_stock_market_work

Kurzgesagt
- Kurzgesagt, Wikipedia: https://en.wikipedia.org/wiki/Kurzgesagt
- Kurzgesagt, Who we are: https://kurzgesagt.org/who-we-are
- Forbes 2024 interview with Philipp Dettmer: https://www.forbes.com/sites/danidiplacido/2024/10/24/kurzgesagt-in-a-nutshell-creator-talks-youtube-tiktok-and-optimistic-nihilism/
- Bird in Flight 2016 profile: https://birdinflight.com/en/inspiration/kurzgesagt.html
- Toolfarm on tools and sources in corner: https://www.toolfarm.com/?p=77543
- How to Make a Kurzgesagt Video in 1200 Hours (kottke): https://kottke.org/20/02/how-to-make-a-kurzgesagt-video-in-just-1200-hours
- How to Make a Kurzgesagt Video in 1200 Hours (YouTube URL from search): https://www.youtube.com/watch?v=uFk0mgljtns
- Adobe community thread on Kurzgesagt workflow: https://community.adobe.com/t5/animate-discussions/how-do-we-create-animated-videos-like-these-please-explain/m-p/8901819/highlight/true
- Kurzgesagt project page, Loneliness: https://kurzgesagt.org/projects/loneliness
- Kurzgesagt project page, Most Extreme Place: https://kurzgesagt.org/projects/most-extreme-place
- Laughing Squid on the Most Extreme Place: https://laughingsquid.com/increasingly-smaller-forms-of-unseen-life/
- Laughing Squid on The Egg: https://laughingsquid.com/?p=776148
- Laughing Squid on Why You Are Still Alive: https://laughingsquid.com/why-you-are-still-alive-a-simple-explanation-of-how-the-human-immune-system-works/
- Our World in Data on the coronavirus video: https://ourworldindata.org/kurzgesagt-coronavirus-video
- Gigazine on the coronavirus video: https://www.gigazine.net/gsc_news/en/20200323-coronavirus-explained
- The Last Human (Stafforini listing): https://stafforini.com/works/kurzgesagt-2022-last-human-glimpse/

Cleo Abram
- Cleo Abram, Wikipedia: https://en.wikipedia.org/wiki/Cleo_Abram
- YouTube Official Blog, 5 huge if true moments for Cleo Abram: https://blog.youtube/creator-and-artist-stories/5-huge-if-true-moments-for-cleo-abram/
- Forbes 2026, How a former Vox producer built one of YouTube's biggest science shows: https://www.forbes.com/sites/ianshepherd/2026/06/15/how-a-former-vox-producer-built-one-of-youtubes-biggest-science-shows/
- Podcastle / Async analysis of her style: https://async.com/blog/why-cleo-abram-goes-viral/
- Video Consortium episode 8 (search result, not fetched): https://videoconsortium.org/mag/episode-8-cleo-abram
- Jack Vaughan podcast with lead producer Justin Poore (search result, not fetched): https://www.jackvaughan.com/podcasts/justin-poore
- Starlink episode listing (TVDB): https://www.thetvdb.com/series/huge-if-true/episodes/9242861
- Quantum Computers, explained with MKBHD: https://www.youtube.com/watch?v=e3fz3dqhN44
- Axiom Space on AxEMU testing: https://axiomspace.com/news/axemu-spacesuit-testing
- Cleo Abram post announcing the Jensen Huang conversation: https://x.com/cleoabram/status/1883513089653342212
- OutlierKit analysis of her channel (search result): https://outlierkit.com/channel/cleoabram

Crayon Capital
- OutlierKit, Crayon Capital channel analysis: https://outlierkit.com/channel/crayon-capital
- Prepublish, Crayon Capital channel stats (30 uploads with dates and lengths): https://prepublish.ai/youtube-channel/crayon_capital
- Prepublish, The Great Depression Explained Like You're 5 (YouTube caption track): https://prepublish.ai/youtube-transcript/LuEcoqizj0o
- Prepublish, The Wolf of Wall Street Scam Explained Like You're 5 (YouTube caption track): https://prepublish.ai/youtube-transcript/HawmGu7oNrc
- Crayon Capital on Instagram (tagline): https://www.instagram.com/crayon_capital/
- vling, Crayon Finance (the similarly named small channel): https://vling.net/en/channel/UC1Cjev7uDec-3sw6AI4NHew/channel-info
- Video URLs: https://www.youtube.com/watch?v=KE-WJevx-7c , https://www.youtube.com/watch?v=LuEcoqizj0o , https://www.youtube.com/watch?v=HawmGu7oNrc , https://www.youtube.com/watch?v=rSgS4wNLLDM , https://www.youtube.com/watch?v=sMH8WchxQR8 , https://www.youtube.com/watch?v=1GowFTjbUnk

Loom (internal)
- `C:\Users\Admin\Desktop\Video-Engine\docs\context\STATE.md` (read 2026-09-30 for the current inventory)

**Later (2026-10-01):** Crayon Capital was studied from the requester's own copies of seven videos, frame by
frame and measured: `docs/research/crayon/2026-10-01-crayon-capital-study.md`. Where the two disagree, the
measured study wins (it replaces the caption-based estimates above for that channel).
**Later (2026-10-01):** Cleo Abram (five videos) and Lucas's Lab (two) were studied the same way:
`docs/research/cleo/2026-10-01-cleo-abram-study.md`, `docs/research/lucas/2026-10-01-lucas-lab-study.md`, and the
three channels side by side in `docs/research/2026-10-01-channels-compared.md`.
**Later (2026-10-01):** TED-Ed (seven lessons) and Kurzgesagt (seven videos) were studied from the requester's
own files, frame by frame and measured: `docs/research/teded/2026-10-01-teded-study.md`,
`docs/research/kurz/2026-10-01-kurzgesagt-study.md`, and the five-channel section of
`docs/research/2026-10-01-channels-compared.md`. Where they disagree with the caption-based notes above, the
measured studies win.

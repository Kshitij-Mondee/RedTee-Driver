# Loom catalog (generated - do not hand-edit)

Every anchor prop (`say`, `say_*`, `*_say`, `*_cue`) is an ANCHOR: a run of words the narration of THAT beat actually speaks.
The element is revealed ON those words. Anchors that are not spoken fail compose.

## Templates

### `calendar.plan`  (productive, motion is staging; jobs: practice, sequence)

A schedule the learner will copy into their own calendar. The calendar frame and day columns appear, then each entry DROPS onto its day ON its words and ticks. Use for spaced practice plans, deadlines, onboarding weeks.

Props:
- `kicker`: str, <= 4 words
- `title`: str, <= 8 words
- `say_title`: anchor
- `days`: list, required, 3-7 items
  - `label`: str, required, <= 3 words
- `entries`: list, required, 1-5 items
  - `day`: int, required
  - `label`: str, required, <= 3 words
  - `icon`: icon
  - `say`: anchor, required

### `chart.bars`  (productive, motion is content; jobs: quantify, distinguish)

Compare quantities. Axis and baseline first, then bars GROW from zero in axis order, each ON its spoken value, value label with its bar. Every value must be grounded. Optional highlight marks the bar that matters.

Props:
- `kicker`: str
- `title`: str, <= 9 words
- `say_title`: anchor
- `unit`: str, <= 3 words
- `max`: number
- `series`: list, required, 2-6 items
  - `cat`: str, required, <= 3 words
  - `value`: number, required
  - `say`: anchor, required
  - `label`: str
- `highlight`: int

### `compare.two`  (productive, motion is staging; jobs: distinguish)

Two sides as equals (before/after, do/don't, myth/fact, A vs B). The first side's panel is on screen by the lead time (its header marked ON its words), the other converges on its header's words; rows reveal on their words; an optional verdict stamps last after a hold. mode 'pairs' reveals row by row across both sides; 'columns' left block then right block. Per side: `valence` (pos/neg/neutral) only COLOURS the side; `verdict` (right/wrong) draws a tick or a cross, so use it only when one side is the correct answer and the other is not. `tone` is deprecated: it maps to valence and draws no mark. An item with `empty: true` is a blank slot (a dashed rule, no words): never write placeholder words like 'blank'. `stance: myth` tags a side MYTH and strikes its header; `stance: fact` tags it FACT (a myth/fact contrast says which is which).

Props:
- `kicker`: str
- `title`: str, <= 9 words
- `say_title`: anchor
- `left`: obj, required
  - `header`: str, required, <= 4 words
  - `say`: anchor, required
  - `valence`: enum, one of pos/neg/neutral
  - `verdict`: enum, one of right/wrong/none
  - `tone`: enum, one of neg/pos/neutral
  - `stance`: enum, one of myth/fact/none
  - `icon`: icon
  - `items`: list, 0-4 items
    - `text`: str, <= 10 words
    - `say`: anchor
    - `empty`: bool
- `right`: obj, required
  - `header`: str, required, <= 4 words
  - `say`: anchor, required
  - `valence`: enum, one of pos/neg/neutral
  - `verdict`: enum, one of right/wrong/none
  - `tone`: enum, one of neg/pos/neutral
  - `stance`: enum, one of myth/fact/none
  - `icon`: icon
  - `items`: list, 0-4 items
    - `text`: str, <= 10 words
    - `say`: anchor
    - `empty`: bool
- `verdict`: obj
  - `text`: str, <= 10 words
  - `say`: anchor
- `mode`: enum, one of pairs/columns, default "columns"

### `cycle`  (productive, motion is content; jobs: sequence, relate)

A loop that returns (3-6 stages). Nodes arrive clockwise from twelve ON their words; each arc draws as its pair exists; the CLOSING arc draws last - a loop is only a loop once it closes.

Props:
- `kicker`: str
- `title`: str, <= 9 words
- `say_title`: anchor
- `nodes`: list, required, 3-6 items
  - `label`: str, required, <= 3 words
  - `icon`: icon
  - `say`: anchor, required
- `center`: str, <= 3 words
- `say_center`: anchor
- `say_close`: anchor

### `definition`  (productive, motion is staging; jobs: define)

Define one term. The term drops in, a rule draws, the definition prints line by line (unmask), an optional concrete example settles last. The block is vertically centred. Restrained register: nothing moves in the reading zone after it lands.

Props:
- `kicker`: str, <= 4 words
- `term`: str, required, <= 5 words
- `say_term`: anchor, required
- `definition`: str, required, <= 28 words
- `say_definition`: anchor, required
- `example`: str, <= 22 words
- `say_example`: anchor
- `icon`: icon

### `document.page`  (productive, motion is staging; jobs: demonstrate, scenario, define)

A page the learner recognises (notes, an email, a policy excerpt, a form). The page is on screen by the lead time (its title marked ON its words), then each line appears or is HIGHLIGHTED on its words (reading along). A line with `empty: true` is a blank ruled slot (no words), shown with the page: use it for a missing reply, a blank field or an unwritten line, never placeholder words like 'blank'. Every other line needs `text`. The lines are the page's followers: they leave with it. Optional character beside it. Name it 'page' so later beats can keep it (storyboard keep: ["page"]). `stance: myth` tags the page MYTH and strikes its title (a claim the lesson refutes); `stance: fact` tags it FACT.

Props:
- `kind`: enum, one of notes/email/policy/form, default "notes"
- `title`: str, required, <= 6 words
- `say_title`: anchor
- `lines`: list, required, 2-6 items
  - `text`: str, <= 9 words
  - `say`: anchor
  - `empty`: bool
- `mode`: enum, one of appear/highlight, default "highlight"
- `stance`: enum, one of myth/fact/none
- `side`: enum, one of left/center, default "left"
- `variant`: enum, one of card/paper
- `person`: obj
  - `cast`: str, <= 3 words
  - `member`: enum, required, one of woman/man/girl/boy/elder_woman/elder_man
  - `emotion`: enum, one of neutral/happy/surprised/explaining
  - `name`: str, <= 3 words

### `icon.grid`  (productive, motion is staging; jobs: orient, distinguish, consolidate)

A set of PEERS (3-6 members of one category). They pop left to right with a tight stagger ON their words; peers never get a serial slow build (that implies rank).

Props:
- `kicker`: str
- `title`: str, <= 9 words
- `say_title`: anchor
- `items`: list, required, 2-6 items
  - `icon`: icon, required
  - `label`: str, required, <= 4 words
  - `sub`: str, <= 8 words
  - `say`: anchor

### `list.steps`  (productive, motion is staging; jobs: sequence, consolidate)

An ordered procedure or checklist (3-6 items). Title first, then each item settles ON its spoken words, its number/tick arriving WITH it (never as its own step).

Props:
- `kicker`: str
- `title`: str, <= 9 words
- `say_title`: anchor
- `items`: list, required, 2-6 items
  - `text`: str, required, <= 12 words
  - `say`: anchor, required
  - `icon`: icon
- `marker`: enum, one of number/tick/icon, default "number"

### `process.flow`  (productive, motion is content; jobs: sequence, relate)

A process that runs (3-5 steps). The rail exists first; step 1 settles; each connector DRAWS INTO the next step, which then arrives - all on the spoken words. Optional token travels the chain as each step is named (value travel: the motion IS the process).

Props:
- `kicker`: str
- `title`: str, <= 9 words
- `say_title`: anchor
- `steps`: list, required, 2-5 items
  - `label`: str, required, <= 4 words
  - `sub`: str, <= 8 words
  - `say`: anchor, required
  - `icon`: icon
- `token`: obj
  - `icon`: icon
  - `label`: str, <= 2 words

### `quiz.answer`  (productive, motion is staging; jobs: check)

A stopping check, part 2 of 2. The options return (held look), the right one is marked ON the spoken answer and the others dim; the tempting wrong option gets its own 'why not' note. Feedback is the teaching.

Props:
- `question`: str, required, <= 18 words
- `options`: list, required, 2-4 items
  - `text`: str, required, <= 10 words
- `answer`: int, required
- `say_answer`: anchor, required
- `explanation`: str, required, <= 22 words
- `say_explanation`: anchor, required
- `tempting`: int
- `why_not`: str, <= 16 words
- `say_why_not`: anchor
- `also`: int
- `also_why`: str, <= 14 words
- `say_also_why`: anchor
- `takeaway`: str, <= 12 words
- `say_takeaway`: anchor

### `quiz.question`  (productive, motion is staging; jobs: check)

A stopping check, part 1 of 2. The question prints, the options arrive as PEERS (tight stagger, no option favoured), then a pause ring counts down through the script's silent pause_after_s. The answer is NEVER shown here; quiz.answer follows in the next beat.

Props:
- `kicker`: str, default "Your turn"
- `question`: str, required, <= 18 words
- `say_question`: anchor, required
- `options`: list, required, 2-4 items
  - `text`: str, required, <= 10 words
  - `say`: anchor
- `pause_label`: str, default "Pause and decide"

### `quote`  (productive, motion is staging; jobs: hook, define, scenario)

A line worth hearing exactly: the quote mark drops, the words print (unmask), attribution settles last. Only for genuine quotes from the source or a clearly framed invented line ('imagine someone says').

Props:
- `quote`: str, required, <= 30 words
- `say`: anchor, required
- `attribution`: str, <= 8 words
- `say_attribution`: anchor

### `recap`  (expressive, motion is staging; jobs: consolidate, payoff)

Consolidate: 3-5 tokens (icon + short label) light up one by one ON their words, joined by a thread that draws through them. Ends on the pocket rule if given (stamp). An item without an icon shows a check mark, which reads as 'do this': for a mistake or a myth give it an icon that says so (for example circle-x).

Props:
- `kicker`: str
- `title`: str, <= 9 words
- `say_title`: anchor
- `items`: list, required, 2-5 items
  - `label`: str, required, <= 3 words
  - `icon`: icon
  - `say`: anchor, required
- `rule`: str, <= 12 words
- `say_rule`: anchor

### `scenario.dialogue`  (expressive, motion is content; jobs: scenario, demonstrate, hook, refute)

Two characters in a moment (manager/employee, customer/agent...). Characters settle in, then speech bubbles appear ON their lines, alternating sides; the speaker leans in, the listener reacts. For scenario_led teaching and misconception moments. Lines are SHORT (the narration carries the rest).

Props:
- `left`: obj, required
  - `cast`: str, <= 3 words
  - `member`: enum, required, one of woman/man/girl/boy/elder_woman/elder_man
  - `name`: str, <= 3 words
  - `emotion`: enum, one of neutral/happy/surprised/explaining
  - `cloth`: token
- `right`: obj, required
  - `cast`: str, <= 3 words
  - `member`: enum, required, one of woman/man/girl/boy/elder_woman/elder_man
  - `name`: str, <= 3 words
  - `emotion`: enum, one of neutral/happy/surprised/explaining
  - `cloth`: token
- `lines`: list, required, 1-4 items
  - `who`: enum, required, one of left/right
  - `text`: str, required, <= 12 words
  - `say`: anchor, required
  - `emotion`: enum, one of neutral/happy/surprised/explaining
- `setting`: enum, one of none/desk/meeting/call, default "desk"
- `caption`: str, <= 8 words
- `say_caption`: anchor

### `stat.hero`  (productive, motion is content; jobs: quantify)

ONE number that matters. Kicker drops, the figure counts up from zero and lands ON the spoken number, caption settles. The number must be grounded (source or knowledge sheet).

Props:
- `kicker`: str, <= 4 words
- `value`: number, required
- `decimals`: int, default 0
- `prefix`: str
- `suffix`: str
- `say`: anchor, required
- `caption`: str, <= 16 words
- `say_caption`: anchor
- `icon`: icon

### `timeline`  (productive, motion is staging; jobs: sequence)

Events in time. The spine draws left to right first, then events settle in date order ON their words, each tick with its label.

Props:
- `kicker`: str
- `title`: str, <= 9 words
- `say_title`: anchor
- `events`: list, required, 2-6 items
  - `when`: str, required, <= 3 words
  - `label`: str, required, <= 8 words
  - `say`: anchor, required

### `title.card`  (expressive, motion is staging; jobs: orient, transition, consolidate, hook, payoff)

Opener, section divider or payoff title. Kicker drops, title prints (unmask), subtitle settles, optional hero icon irises open. The block is vertically centred. Spectacle is allowed here (expressive register).

Props:
- `kicker`: str, <= 4 words
- `say_kicker`: anchor
- `title`: str, required, <= 9 words
- `say_title`: anchor
- `subtitle`: str, <= 16 words
- `say_subtitle`: anchor
- `icon`: icon
- `say_icon`: anchor
- `align`: enum, one of center/left, default "center"
- `accent`: token, default "accent"
- `panel`: bool, default false

## Blueprints

### `hero.character_moment`  (expressive, motion is content; jobs: hook, scenario, demonstrate, refute)

One character in a moment, with a thought or memory bubble whose contents CHANGE over time (ideas arriving, fading, being recalled). The character's expression changes on cue. Illustrative and warm: ideal for hooks, scenarios and making an abstract process personal. bubble items: each arrives ON its say and may fade ON its fade_say (fading = forgetting / doubt).

Props:
- `cast`: str, <= 3 words
- `member`: enum, required, one of woman/man/girl/boy/elder_woman/elder_man
- `name`: str, <= 3 words
- `cloth`: token, default "accent"
- `side`: enum, one of left/right, default "left"
- `moods`: list, 0-4 items
  - `emotion`: enum, required, one of neutral/happy/surprised/explaining
  - `say`: anchor, required
- `bubble`: enum, one of thought/speech/memory, default "thought"
- `items`: list, required, 1-5 items
  - `icon`: icon, required
  - `label`: str, <= 3 words
  - `say`: anchor, required
  - `fade_say`: anchor
- `caption`: str, <= 8 words
- `say_caption`: anchor
- `prop`: enum, one of none/desk/calendar/laptop, default "desk"
- `day_label`: str, <= 3 words
- `say_day`: anchor
- `days`: list, 0-4 items
  - `label`: str, required, <= 3 words
  - `say`: anchor, required

### `hero.hub`  (productive, motion is content; jobs: relate, orient, demonstrate)

A system with a centre and satellites (a GDS and airlines, a manager and a team, a brain and its cues). The hub irises open, spokes draw OUT to each satellite ON its word, satellites pop, and signals travel along spokes to show flow.

Props:
- `kicker`: str
- `title`: str, <= 9 words
- `say_title`: anchor
- `hub`: obj, required
  - `label`: str, required, <= 3 words
  - `icon`: icon
  - `say`: anchor, required
- `satellites`: list, required, 2-8 items
  - `label`: str, required, <= 3 words
  - `icon`: icon
  - `say`: anchor, required
- `signals`: list, 0-8 items
  - `to`: int, required
  - `say`: anchor, required
  - `inbound`: bool

### `hero.journey`  (productive, motion is content; jobs: sequence, demonstrate, practice)

A traveller moves along a path through waypoints (days, stages, attempts) ON their words. The route draws ahead of the traveller, each waypoint stamps as it is reached, and its label settles. Use for schedules, progressions, customer journeys. The motion of the traveller IS the sequence.

Props:
- `kicker`: str
- `title`: str, <= 9 words
- `say_title`: anchor
- `traveller`: obj
  - `icon`: icon
  - `cast`: str, <= 3 words
  - `member`: enum, one of woman/man/girl/boy/elder_woman/elder_man
- `waypoints`: list, required, 2-6 items
  - `label`: str, required, <= 4 words
  - `sub`: str, <= 6 words
  - `icon`: icon
  - `say`: anchor, required
- `shape`: enum, one of wave/straight/climb, default "wave"

### `hero.meter`  (productive, motion is content; jobs: quantify, relate, demonstrate)

An instrument whose reading changes over time (memory strength, risk, progress, confidence). Instrument law: the scale exists first with the pointer at its MINIMUM or start value, then the pointer TRAVELS to each stop ON its words (instrument speed), the reading is marked the instant it stops, the number is named last. kind ring | bar | gauge. Optional target band = supplied context, thin and early.

Props:
- `kicker`: str
- `title`: str, <= 9 words
- `say_title`: anchor
- `kind`: enum, one of ring/bar/gauge, default "ring"
- `label`: str, required, <= 4 words
- `unit`: str, default ""
- `show_value`: bool, default false
- `start`: number, default 0
- `min`: number, default 0
- `max`: number, default 100
- `stops`: list, required, 1-6 items
  - `value`: number, required
  - `say`: anchor, required
  - `note`: str, <= 6 words
  - `tone`: enum, one of pos/neg/neutral
- `target`: number
- `target_label`: str, <= 3 words
- `icon`: icon
- `anchor`: enum, one of center/left/right, default "center"

### `hero.portal`  (expressive, motion is staging; jobs: transition, orient, relate)

Draws a frame (screen, lens or card) that the NEXT station is nested inside, so a 'zoom' join flies the camera through it - an infinite-canvas move that reads as going deeper. The next station must declare parent = this station and rect = this portal's rect. Optional label and surrounding context icons.

Props:
- `kind`: enum, one of screen/lens/card, default "screen"
- `rect`: list, required, 4-4 items
- `label`: str, <= 6 words
- `say_label`: anchor
- `context`: list, 0-4 items
  - `icon`: icon, required
  - `label`: str, <= 3 words
  - `say`: anchor

## Avatar (storyboard kind `avatar`)

A code-drawn presenter in a disc beside a kicker and title; with `card`, up to three short lines (or one rule) fill the empty side and the disc steps back.

Props (any other key is an error):
- `member`: enum, one of woman/man/girl/boy/elder_woman/elder_man, default "woman"
- `cast`: str, <= 3 words
- `side`: enum, one of left/right, default "left"
- `kicker`: str, <= 4 words
- `title`: str, <= 12 words
- `say_title`: anchor
- `title_cue`: anchor
- `card`: obj
  - `title`: str, <= 6 words
  - `lines`: list, 0-3 items
    - `text`: str, required, <= 9 words
    - `say`: anchor
  - `rule`: str, <= 12 words
  - `say`: anchor
- `name`: str, <= 3 words
- `role_label`: str, <= 5 words
- `cloth`: token
- `talk_emotion`: enum, one of neutral/happy/surprised/explaining
- `frame_r`: number
- `frame_fill`: token

## Components (small reusable elements for bespoke scenes: `ctx.use(id, params, opts)`)

Reuse these inside `scenes/<beat>.js` instead of redrawing them. The idea and outline are fixed;
params, slots and the returned parts are yours to adjust. Content params never have defaults.

### `app_calendar`  (v1; commissioned: Kshitij 2026-10-16 (hand-off sheet T-151))

A calendar at work in week view: days across, hours down, events placed by their times, the guests' free and busy times in a booking form, walked through by a pointer that creates an event, drags one to reschedule it, opens one and invites a colleague.

Family: ui. Tags: calendar, scheduling, meeting, booking, availability, week view, invite, time management, screencast, productivity

Outline: window (or the screencast engine's app window) -> toolbar: today, previous and next, the period, a new event button -> optional sidebar of calendars -> week grid: day headers, hour gutter, hour lines, a now line -> event blocks in lanes, coloured by calendar -> booking and event popovers: title, time, place, guests, availability strips -> toast -> pointer

Params:
- `days`: list, CONTENT (on-screen words: always pass it; never defaulted)
- `hours`: list, CONTENT (on-screen words: always pass it; never defaulted)
- `events`: list, CONTENT (on-screen words: always pass it; never defaulted)
- `startHour`: number, default 8
- `period`: str
- `today`: int
- `now`: number
- `calendars`: list
- `people`: list
- `clock`: enum, one of 24/12, default "24"
- `title`: str
- `labels`: obj
- `state`: enum, one of ready/loading/error, default "ready"
- `notice`: str
- `steps`: list, default []
- `theme`: obj, default {}
- `layout`: obj, default {}
- `w`: number, default 1728
- `h`: number, default 856
- `at`: number, default -1
- `cps`: number, default 14
- `engine`: enum, one of auto/off, default "auto"
Parts returned: `host`, `toolbar`, `sidebar`, `grid`, `dayHeads`, `events`, `nowLine`, `popover`, `states`, `create({title, day, start, end, where, guests}, at)`, `drag(id, day, start, at)`, `open(id, at)`, `invite(id, name, at, {send})`, `close(at)`, `setState(name, at)`, `slot(day, hour)`
Example:
```js
ctx.use("app_calendar", { days: ["Mon 3", "Tue 4", "Wed 5", "Thu 6", "Fri 7"], hours: ["9:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"], startHour: 9, events: [{ id: "std", title: "Ward handover", day: 0, start: 9, end: 9.5 }], labels: { newEvent: "New event", save: "Save" }, steps: [{ do: "create", event: { title: "Fire safety refresher", day: 2, start: 14, end: 15 }, at: ctx.cue("book the refresher") }] }, { x: 96, y: 78, name: "cal" })
```

### `app_chat_workspace`  (v1; commissioned: Kshitij 2026-10-16 (hand-off sheet T-150))

A team chat workspace: channels and direct messages, a channel's conversation with mentions, reactions, file cards and threads, and a composer, walked through by a pointer that opens a channel, posts, reacts and opens a thread.

Family: ui. Tags: chat, team chat, messaging, channels, threads, mentions, reactions, collaboration, screencast, remote work

Outline: window (or the screencast engine's app window) -> sidebar: workspace name, channel and direct message lists with unread and mention counts -> channel header: name and topic -> messages: avatar, author, time, text with mentions, file card, reactions, thread link -> composer -> thread pane (opened by an action) -> pointer

Params:
- `channels`: list, CONTENT (on-screen words: always pass it; never defaulted)
- `channel`: str
- `workspace`: str
- `me`: str
- `title`: str
- `labels`: obj
- `state`: enum, one of ready/loading/empty/error, default "ready"
- `notice`: str
- `steps`: list, default []
- `theme`: obj, default {}
- `layout`: obj, default {}
- `w`: number, default 1728
- `h`: number, default 856
- `at`: number, default -1
- `cps`: number, default 14
- `engine`: enum, one of auto/off, default "auto"
Parts returned: `host`, `sidebar`, `channelRows`, `views`, `messages`, `composer`, `threadPane`, `states`, `openChannel(id, at)`, `post(text, at)`, `react(i, icon, at)`, `thread(i, at)`, `setState(name, at)`
Example:
```js
ctx.use("app_chat_workspace", { workspace: "Riverside Clinic", me: "Sam Lee", channels: [{ id: "rota", label: "night-rota", topic: "Shift swaps and cover", messages: [{ author: "Jo Park", time: "18:02", text: "@Sam Lee can you cover Thursday?" }] }], labels: { composer: "Message night-rota" }, steps: [{ do: "post", text: "Yes, I can cover it.", at: ctx.cue("reply in the channel") }] }, { x: 96, y: 78, name: "chat" })
```

### `app_docs_editor`  (v1; commissioned: Kshitij 2026-10-16 (hand-off sheet T-152))

A shared document editor: a page of headings, paragraphs and lists, suggested edits shown inline, comments in the margin, and a version history, walked through by a pointer that types, comments on a phrase, accepts a suggestion and restores an earlier version.

Family: ui. Tags: document, word processor, docs, editor, track changes, suggestions, comments, version history, policy, collaboration

Outline: window (or the screencast engine's app window) -> top bar: document title, collaborators, history, share -> toolbar: undo, redo, text styles, comment, the editing mode -> the page: headings, paragraphs, list items, with inline suggestions (struck and inserted text) and commented phrases -> the margin: comment and suggestion cards beside their lines -> version history panel (opened by an action) -> toast -> pointer

Params:
- `docTitle`: str, CONTENT (on-screen words: always pass it; never defaulted)
- `blocks`: list, CONTENT (on-screen words: always pass it; never defaulted)
- `suggestions`: list
- `comments`: list
- `versions`: list
- `people`: list
- `mode`: enum, one of editing/suggesting/viewing, default "editing"
- `me`: str
- `title`: str
- `labels`: obj
- `state`: enum, one of ready/loading/error, default "ready"
- `notice`: str
- `steps`: list, default []
- `theme`: obj, default {}
- `layout`: obj, default {}
- `w`: number, default 1728
- `h`: number, default 856
- `at`: number, default -1
- `cps`: number, default 14
- `engine`: enum, one of auto/off, default "auto"
Parts returned: `host`, `topbar`, `toolbar`, `page`, `blocks`, `cards`, `historyPanel`, `states`, `type(text, at, {block})`, `comment(block, anchor, text, at)`, `accept(id, at)`, `reject(id, at)`, `restore(i, at)`, `setState(name, at)`
Example:
```js
ctx.use("app_docs_editor", { docTitle: "Visitor policy", blocks: [{ kind: "h1", text: "Visitors" }, { kind: "p", text: "Visitors sign in at reception and wear a badge at all times." }], suggestions: [{ id: "s1", block: 1, del: "at all times", ins: "while on site", author: "Mo Diaz" }], labels: { accept: "Accept" }, steps: [{ do: "accept", id: "s1", at: ctx.cue("accept the change") }] }, { x: 96, y: 78, name: "doc" })
```

### `app_email`  (v1; commissioned: Kshitij 2026-10-16 (hand-off sheet T-149))

An email client at work: folders, a thread list with unread and flagged mail, the open message in a reading pane, and a compose window, walked through by a pointer that opens, replies, flags, moves and searches.

Family: ui. Tags: email, mail client, inbox, phishing, reply, compose, screencast, software training, outlook-like, communication

Outline: window (or the screencast engine's app window) -> folder sidebar with a compose button and counts -> thread list with a search field: unread dot, sender, time, subject, preview, flag and attachment marks -> reading pane: toolbar, subject, sender, recipients, body, attachment -> compose window and reply box (opened by actions) -> toast -> pointer

Params:
- `folders`: list, CONTENT (on-screen words: always pass it; never defaulted)
- `messages`: list, CONTENT (on-screen words: always pass it; never defaulted)
- `folder`: str
- `open`: str
- `title`: str
- `user`: str
- `labels`: obj
- `state`: enum, one of ready/loading/empty/error, default "ready"
- `steps`: list, default []
- `theme`: obj, default {}
- `layout`: obj, default {}
- `w`: number, default 1728
- `h`: number, default 856
- `at`: number, default -1
- `cps`: number, default 14
- `engine`: enum, one of auto/off, default "auto"
Parts returned: `host`, `sidebar`, `folders`, `list`, `rows`, `searchBox`, `pane`, `panes`, `toolbar`, `replyBox`, `composeWindow`, `states`, `open(i, at)`, `reply(text, at, {send})`, `flag(i, at)`, `move(i, folderId, at)`, `search(query, at)`, `compose({to, subject, body, send}, at)`, `setState(name, at)`
Example:
```js
ctx.use("app_email", { title: "Mail", folders: [{ id: "in", label: "Inbox", icon: "inbox", count: 3 }, { id: "fin", label: "Finance", icon: "folder" }], messages: [{ id: "m1", from: "Payroll Team", time: "09:12", subject: "Your payslip is ready", preview: "Sign in to view your March payslip", unread: true }], labels: { search: "Search mail", reply: "Reply" }, steps: [{ do: "open", i: 0, at: ctx.cue("open the message") }] }, { x: 96, y: 78, name: "mail" })
```

### `app_lms_course`  (v1; commissioned: Kshitij 2026-10-16 (hand-off sheet T-153))

An online course on a learning platform: the outline of modules and lessons with what is done, a lesson player, a quiz with feedback, the learner's progress and a certificate, walked through by a pointer that starts a lesson, answers, submits and completes the course.

Family: ui. Tags: learning platform, lms, e-learning, course, lesson, quiz, progress, certificate, compliance training, onboarding

Outline: window (or the screencast engine's app window) -> outline sidebar: course title, progress bar, modules and lessons with done, current and kind marks -> lesson header: title and kind -> lesson player: picture area, play button, scrubber and times; mark complete and next buttons -> quiz: question, options, submit, feedback -> certificate -> toast -> pointer

Params:
- `course`: str, CONTENT (on-screen words: always pass it; never defaulted)
- `modules`: list, CONTENT (on-screen words: always pass it; never defaulted)
- `lesson`: str
- `player`: obj
- `quiz`: obj
- `progress`: obj
- `certificate`: obj
- `view`: enum, one of lesson/quiz/certificate, default "lesson"
- `title`: str
- `labels`: obj
- `state`: enum, one of ready/loading/error, default "ready"
- `notice`: str
- `steps`: list, default []
- `theme`: obj, default {}
- `layout`: obj, default {}
- `w`: number, default 1728
- `h`: number, default 856
- `at`: number, default -1
- `cps`: number, default 14
- `engine`: enum, one of auto/off, default "auto"
Parts returned: `host`, `outline`, `lessonRows`, `progressBar`, `header`, `player`, `quizView`, `options`, `feedback`, `certificate`, `states`, `start(id, at)`, `play(at, {dur, to})`, `answer(i, at)`, `submit(at)`, `complete(at)`, `setState(name, at)`
Example:
```js
ctx.use("app_lms_course", { course: "Food safety basics", modules: [{ title: "Module 1", lessons: [{ id: "l1", title: "Washing hands", kind: "video", duration: "3 min", done: true }, { id: "q1", title: "Check your understanding", kind: "quiz" }] }], quiz: { question: "How long should you wash your hands?", options: ["5 seconds", "20 seconds"], correct: 1, right: "Correct: at least 20 seconds." }, labels: { submit: "Submit" }, steps: [{ do: "start", id: "q1", at: ctx.cue("take the quiz") }, { do: "answer", i: 1 }, { do: "submit" }] }, { x: 96, y: 78, name: "lms" })
```

# Direction card: screencast

A software lesson, walked through by a pointer that is the learner, inside one app shell held across a chapter.
Its strength is that the screen IS the procedure; choose the region that shows the real work.

## Signature moves, and when each fits
- **The held shell** (`W.app`, then `W.resume` or `keep: ["app"]`): one shell per chapter; another screen of the same
  product is a page of it (`A.go`), never a new shell.
- **Tour, then walkthrough:** a tour names 1 or 2 regions a beat (`A.name`, whole screen) for orientation and where a
  result lives, about a third of the time; a walkthrough is one step (a step pill, at most 5 actions, the zoom on the
  small target, `A.click` with `zoom`), two thirds.
- **Regions by what the work is:**
  - **page** (a captured real page, `kind: "page"`): the learner must recognise a real web page; the capture needs
    approval per off-machine site.
  - **code** (an editor: `A.scrollToLine`, `A.highlight`, `A.codeType`): the step is a change to a file.
  - **terminal** (`chrome: "terminal"`: `A.run`, `A.out`): the docs give a command; beside a dashboard that answers
    (`A.cell`, `A.card`, `A.series`) when its effect shows elsewhere.
  - **the generic shell's settings, forms, tables, dialogs**: everything else.
- **Time and emphasis:** `A.timelapse` for waiting, `A.spotlight` once a chapter on the promise, `A.chapterCard`
  between chapters only.

## Outline (pass 1)
- Chapters are subtasks (3 to 6), each starting on a clean state and ending on the finished one, held 2 s.
- Name each chapter's region (page, code, terminal or shell) and why; open the lesson with a tour.

## Storyboard (pass 2)
- One station per chapter's shell; the camera moves inside it, cuts only between chapters.
- Per beat: the step, its actions in order, the word each lands on, and what reacts where.
- Every label, menu item and command comes from the sources.

## Not this style
- No real product's logo, chrome or palette; no feature catalogue; no sign-in screen unless sign-in is the lesson.

# Set references: real-space facts for the classroom world (2026-10-13)

STATUS: SHIPPED 2026-10-15 (the classroom world is directed: brief 2, three scenes, each plan-checked). Used in
`packs/worlds/classroom.json` (identity, scale, objects and every scene). Web search and page reads only; nothing
downloaded; page text treated as data. (s) = from a search summary, the page itself not read; everything else was
read.

## 0. The scenes kept (D-156)

Lesson moments imagined first: a learner stays behind and discloses something worrying (safeguarding); a teacher
notices a learner who has gone quiet; a teacher explains from the front; calming a heated moment; agreeing support
with a learner or a parent; a lecturer briefs a cohort on academic integrity; a guest speaker presents to a full
hall; a question from the front row; evacuating a raked hall; presenting to a large audience; judging an online
source; a librarian helping with sources and citation; a laptop left at a library table; studying under exam
pressure. `py -m loom sets demand` (2026-10-15): no past lesson named a classroom-world scene.

The world is one connected place: a further-education college (learners from 16, and adults), so that safeguarding,
adult learning and lecture-scale moments share one campus, one set of colours and fittings.

| scene | reuse | why it stays |
|---|---|---|
| `classroom` (a general teaching room) | high | disclosure after class, noticing, teaching from the front, de-escalation |
| `lecture_hall` (the raked lecture theatre) | medium | presenting to a large audience, briefings, questions, evacuation |
| `library` (the study area) | medium | information literacy, a librarian's help, unattended devices, study pressure |

Dropped: `training_room` (the office world already has a training room, `office/training_room`; an adult workshop
room here would duplicate it), `school_classroom` (merged into `classroom`: the college room serves 16 to 19 year-olds
and adults; the id changed because no lesson used the old one) and `online_class` (a video-call grid is a screen
layout, not a place: it belongs to a template, not a set).

Plan checks: `docs/assets/plan_checks/classroom/<scene>.json` (all three). In the lecture hall the camera sees the
seats from behind, so the rows are the mid layer (each seat back is drawn over its sitter); only the lecturer and
one front-row learner are free zones, and the brief says the rest of the audience is seen against the rows below.

## 1. Facts

| Fact used in the brief | Source |
|---|---|
| BB103's minimum for a general teaching classroom in a secondary school schedule: 55 m2 | (s) https://www.contractsfinder.service.gov.uk/Notice/Attachment/125fe719-8109-426b-b860-bc171d13e20a (a free school's room schedule); the guidance itself: https://www.gov.uk/government/publications/area-guidelines-and-net-capacity/notes-on-area-guidelines-for-mainstream-schools-bb103 |
| Lecture theatre terms: the seatway is measured from the writing tablet's front edge; the row rise is the height between rows; a half step is added in the aisle when the rise is too big for one step | (s) https://www.building.co.uk/cpd/cpd-18-2014-specifying-retractable-seating/5070480.article |
| Lecture seats 500 to 550 mm wide on a row pitch of 900 to 950 mm, tablets 300 to 350 mm deep; comfortable rakes of about 1:9 to 1:10 | (s) https://www.homestyler.com/article/designing-engaging-lecture-halls (a design article, not a standard) |
| Aisles between library stacks at least 914 mm, preferably 1067 mm; accessible table tops 711 to 864 mm; reach ranges 457 to 1372 mm | (s) https://www.mass.gov/doc/521-cmr-12-education-facilities/download (Massachusetts 521 CMR 12.00) |
| A 75 inch interactive display is about 1.72 by 1.03 m | (s) https://senseselec.com/75-inch-interactive-flat-panel/ |
| Height-adjustable study carrels in widths of 800 to 1400 mm, 560 to 860 mm high | (s) https://www.ukeducationalfurniture.co.uk/prod/height-adjustable-study-carrel-crank-handle/ |

Not verified: the classroom's 2.8 m suspended ceiling and 60 m2 room (7.5 by 8 m) are design choices for a 1960s
block, not measured; the display's bottom edge at 0.9 m (installers vary, no guidance found); the lecture theatre's
0.95 m row pitch and 0.3 m rise per row (inside the article's ranges, not a standard); the library's 1.2 m aisles
(above the code's preferred width) and its 2.1 m ranges. No UK lecture theatre standard was read.

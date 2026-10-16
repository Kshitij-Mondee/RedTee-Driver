# Set references: real-space facts for the contact centre world (2026-10-13)

STATUS: DONE 2026-10-15 (five scenes directed and plan-checked: agent_row, agent_desk, team_huddle, coaching_room, quiet_room). Used in
`packs/worlds/contact_centre.json` (identity, scale, objects, every scene). Web search and page reads only (nothing
downloaded; page text treated as data). (s) = from a search summary, the page itself not read; everything else was
read on 2026-10-15.

## 0. Lesson moments imagined (D-156) and the places they need

1. An agent takes a call from an angry customer whose bill doubled, and de-escalates (the agent's desk).
2. An agent hears signs that a caller is vulnerable (confused, recently bereaved, struggling to pay) and slows down,
   offers support and records it with consent (the agent's desk).
3. An agent runs the identity check before discussing the account and refuses to give details to a caller who fails it
   (the agent's desk).
4. A team leader sits beside an agent and listens to live calls on a second headset (side-by-side coaching) (the
   agent's desk, a second chair).
5. A team leader and an agent replay a recorded call and score it together against the quality form (a small coaching
   room).
6. A team leader gives an agent difficult feedback about a complaint (the coaching room).
7. A start-of-shift huddle at the team's wallboard: a process change, a queue warning, a thank-you (the huddle point).
8. The queue turns red on the wallboard; a team leader walks the floor and asks agents to stay on calls (the floor).
9. An agent raises a hand for help with an escalation, and the team leader walks over (the floor).
10. After an abusive call an agent takes a few minutes away from the phones; a team leader or a wellbeing colleague
    checks in (the quiet room).
11. A new starter sits with an experienced buddy during their first calls ("nesting") (the agent's desk, second chair).
12. The caller's side of the call: a customer at home (served by the home world's kitchen table and living room, not
    drawn here).

Places kept (scene ids): the agent floor (`agent_row`, high), the agent's desk (`agent_desk`, high), the huddle point
(`team_huddle`, medium), the coaching room (`coaching_room`, medium), the quiet room (`quiet_room`, medium). Five places,
five high or medium.
Dropped or merged: the caller's side (`customer_side`, a version 1 candidate: a home is the home world's job, and drawing a
second home here would duplicate it); the identity check (a moment at the agent's desk, not a place: its screen is a slot
there); side-by-side coaching and nesting (the agent's desk with its pulled-up second chair). No lobby, corridor, locker
room or kitchen: no lesson moment above happens there.

`py -m loom sets demand` (run 2026-10-15 on 76 lessons): `contact_centre/quiet_room` is named by 2 lessons
(feedback-that-lands, groupthink-trap); no other contact centre scene is named. The quiet room keeps its id.

## 1. Agent desks, screens and headsets

| Fact used in the brief | Source |
|---|---|
| Desk width 48 in (1.22 m) is the practical minimum per agent; work surface at least 48 by 24 in. The brief uses 1.4 by 0.8 m desks. | (s) https://www.officefurniture2go.com/answers/desk-space-planning/desk-arrangement-call-center-customer-service.html |
| Desk-mounted bench screens, for example 1400 by 48 by 400 mm (0.4 m above the desk): visual privacy and some absorption. Taller freestanding panels (42 to 65 in) block more sound but cut supervisors' sightlines; lower panels let supervisors see over workstations while standing. | (s) https://shop.brockscompass.co.uk/evolve-bench-screen-1400-blue-white-frame--1, https://www.officefurniture2go.com/answers/cubicles-workstations/what-is-the-typical-height-of-a-call-center-cubicle.html |
| Screen top slightly below eye level; 50 to 70 cm from the screen to the desk edge; keyboard about 15 cm from the desk edge; light from a window should come from the side of the screen; desks preferably height adjustable (sit and stand); headsets for one or both ears; cables gathered and hung up. | A Sound Working Environment in Call and Contact Centres (Swedish Work Environment Authority and partners, ADI 607): https://www.av.se/globalassets/filer/publikationer/broschyrer/other-languages/a-sound-working-environment-in-call-and-contact-centres-adi607eng.pdf |
| Monitoring live and recorded calls is a coaching tool, also used to support agents who are harassed or threatened by customers. | same (ADI 607) |
| Plan supervisors' places (in a run of stations, at the end, or in an office); if supervisors need to see seated agents, use bar-height seating and low panels; lockable personal storage (agents lock up personal phones during a shift); retreat spaces for individual and small-group decompression; huddle spaces; soft seating in break rooms. | Knoll, Checklist for Planning a Contact Center (2018): https://www.knoll.com/document/1356267353254/Knoll_ContactCenterChecklist.pdf |
| Side-by-side coaching uses a training cord or splitter: a second headset plugs into the agent's line, the coach's microphone muted. | (s) retailer listings, e.g. https://www.thetelecomspot.com/products/jabra-supervisor-cord-w-mute (sizes only; no brand drawn) |

## 2. Wallboards

| Fact used in the brief | Source |
|---|---|
| A wallboard is an LCD screen showing a few live metrics (service level, calls waiting, calls abandoned); no more than six metrics at once, colour thresholds that change as performance changes; mounted high enough to be seen with a glance, without moving the head. | https://www.callcentrehelper.com/the-dos-and-donts-of-call-centre-wallboards-9509.htm |
| Wall mounts are made for 40 to 55 inch screens; the brief uses 55 inch screens (about 1.22 by 0.69 m). No mounting height was found in a guide: the brief's lower edge at about 2.0 to 2.2 m (above the desk screens and standing heads) is a design choice. | (s) https://screenmoove.com/products/chief-fusion-large-4x1-landscape-display-40-55-menu-board-wall-mount-lwm4x1u |

In the sets every wallboard face is an empty slot: no words, no numbers.

## 3. Building, ceiling and acoustics

| Fact used in the brief | Source |
|---|---|
| One current office specification: floor to ceiling 2.75 m from the top of the raised floor; raised floor 150 mm nominal; planning grid 1.5 m. (One building's brief, not the BCO guide, which was not read.) | (s) https://70stma.co.uk/full-site-home/thr_70sma-interactive_presentation-spec-download_v21/ |
| Raised access floor panels are usually 600 by 600 mm. | (s) https://www.designingbuildings.co.uk/wiki/Access_floor |
| Contact centres use hanging acoustic baffles and panels below an open soffit; the gaps between baffles keep services and structure visible; baffles can hang at different heights to mark zones. | (s) https://www.rockfon.co.uk/about-us/blog/2026/open-ceiling-types/, https://archipro.co.nz/project/premium-acoustics-for-a-busy-call-centre-autex |
| Daylight matters; strong sun needs blinds; light fittings that light up and down; a desk lamp for those who need more light. | ADI 607 (above) |

## 4. Quiet room and wellbeing

| Fact used in the brief | Source |
|---|---|
| Contact centre quiet rooms let agents regroup after a difficult call; one is furnished like a sitting room at home; couches are common. | (s) https://www.toistersolutions.com/blog/2014/12/1/trend-to-watch-contact-center-quiet-rooms |
| UK HSE call-centre advice (LAC 94/1, revised): at least a five-minute break each hour; a break after a particularly stressful call; training for abusive calls. (Secondary summaries; the HSE page itself not read.) | (s) https://hrcentre.uk.brightmine.com/commentary-and-insights/safe-and-healthy-call-centres/22832 |
| Emergency dispatch centres build wellness rooms with soft light and sound control to decompress and talk about a stressful call. | (s) https://employees.henrico.gov/county-connection/reimagined-space-transforms-into-a-wellness-room-for-county-911-dispatchers/, https://www.fgmarchitects.com/insights/uplifting-wellness-design-for-cook-countys-first-first-responders/ |

## 5. Huddle point (team_huddle)

| Fact used in the brief | Source |
|---|---|
| Plan huddle spaces near the teams (Knoll checklist, above). Huddle spaces are small informal areas with a writable surface (a whiteboard) and a shared screen; placing them next to the team's pods means a stand-up needs no booked room. The brief puts each team's huddle point on a clear patch of carpet at the end of a main aisle, with a whiteboard, a felt panel and the team's wallboard on the end wall. | (s) https://www.vantagespace.com/glossary/space-planning-layout-principles/huddle-space, (s) https://www.ajproducts.co.uk/blog/improving-the-work-environment/the-huddle-room--furniture-and-other-elements- |
| Wall-mounted whiteboards in common sizes include 2400 by 1200 mm; mounting with the lower edge near 0.9 m keeps the board reachable standing. (Design choice; no contact centre standard found.) | not verified by a page read |

## 6. Coaching room (coaching_room)

| Fact used in the brief | Source |
|---|---|
| Coaching from recordings: pick a mix of calls (not only bad ones), focus on one area per session, practise in the session; side-by-side listening uses a second headset; some systems score a call against the monitoring form and store the score with the call. The brief gives the room a wall screen for the recording's waveform (a slot), a laptop with a headset plugged in, and a printed quality form (a slot). | (s) https://www.callcentrehelper.com/using-call-recordings-to-coach-staff-57244.htm, (s) https://multichannelmerchant.com/operations/contact-center/the-skinny-on-call-monitoring |
| No source gave a coaching room's size; the brief uses a 3.0 by 4.0 m room for two to four (a design choice, in line with small meeting rooms), windowless, among the glass-fronted rooms on the south side. | design choice |

## 7. What is not verified

- Wallboard mounting height (a design choice, section 2) and the whiteboard's size and height (section 5).
- The quiet room's furnishing follows the industry articles in section 4 (a sitting room, soft light); its size (3.6 by 4.2 m)
  and its place on the north glazing are design choices.
- Every camera position and frame number in the scenes was computed with `tools/set_camera.py` (plan checks in
  `docs/assets/plan_checks/contact_centre/`); none was checked against a drawn set yet.

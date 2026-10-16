# Set references: real-space facts for the tech_cyber world (2026-10-13)

STATUS: DONE 2026-10-15 (five real scenes directed and plan-checked: data_centre, access_vestibule, soc, incident_room, dev_desk; one abstract scene, cyberspace, composed in frame terms and left as a draft). Used in
`packs/worlds/tech_cyber.json` (identity, scale, objects, every scene). Web search and page reads only (nothing
downloaded; page text treated as data). (s) = from a search summary, the page itself not read.

## 0. Lesson moments imagined (D-156) and the places they need

1. An employee gets a convincing phishing email and reports it instead of clicking (any desk: the office world's desk
   already serves it; here the engineer's desk serves the engineer's version).
2. A developer is about to paste customer data into a public AI tool and stops (the engineering desk).
3. Two engineers review a pull request and find a secret key committed in the code (the engineering desk, a pair).
4. An MFA push arrives that the engineer did not ask for (MFA fatigue) (the engineering desk).
5. A SOC analyst triages an alert, sees a suspicious login from a new country and escalates (the security operations
   centre).
6. The SOC shift lead calls a major incident; the team watches the video wall (the SOC).
7. The incident bridge: the incident manager runs a call with IT, legal and communications; a ransomware decision is
   made (the incident room).
8. A tabletop exercise and a post-incident review (the incident room).
9. Someone tries to follow an engineer through the data hall's security vestibule (tailgating); a visitor signs in and is
   escorted (the vestibule).
10. An engineer replaces a failed drive in a rack in the cold aisle while an escorted contractor watches; the clean-desk
    and no-photos rules on the data hall floor (the data hall).
11. How data moves: packets, encryption, a firewall, lateral movement of ransomware across a network (an abstract
    network space).
12. The phishing email itself, seen as a place (an inbox world).

Places kept (scene ids): the data hall (`data_centre`), the security vestibule (`access_vestibule`), the security
operations centre (`soc`), the incident room (`incident_room`), the engineering desk (`dev_desk`), and one abstract
place, the network (`cyberspace`).
Dropped: `inbox_world` (a phishing email is best shown on a real screen slot at a real desk; an inbox drawn as a place
serves one lesson and is a metaphor job for scene code or the metaphor world). The phishing moment at an ordinary
office desk is the office world's job, not repeated here.

`py -m loom sets demand` (run 2026-10-15 on 76 lessons): `tech_cyber/data_centre` is named by 1 lesson (dc-cooling).
No other tech_cyber scene is named. The id is kept.

## 1. Data hall: racks, aisles, raised floor

| Fact used in the brief | Source |
|---|---|
| A 42U rack is commonly 600 mm wide, 2000 mm high and 1000 to 1200 mm deep (several listed 42U 600 by 1200 mm cabinets); external heights vary between makers. The 600 mm width matches the 600 mm floor tile. The brief uses 42U racks 0.6 by 1.2 by 2.0 m (and notes 48U racks at about 2.25 m are also common: not used here). | (s) https://www.42u.com/42U-cabinets.htm, (s) https://www.comms-express.com/products/datacel-600mm-w-x-1200mm-d-data-centre-cabinet/, (s) https://excel-networking.com/catalogue/product/544-42612-WDBN-GW |
| Hot aisle and cold aisle: rack fronts face each other across a cold aisle and backs across a hot aisle; perforated floor tiles are placed only in the cold aisle; one maker recommends at least 2.4 m (four tiles) for a cold aisle; the underfloor plenum is commonly 0.3 to 1.2 m deep. The brief uses a contained cold aisle 1.8 m wide (three tiles), a 1.2 m hot aisle and a 0.6 m raised floor. | (s) https://docs.teradata.com/r/Teradata-Hardware-Site-Preparation-Guide/October-2020/Site-Environmental-Planning/Floor-Layouts/Hardware-Placement-Guidelines-for-Raised-Floor-and-Open-Return-Environment |

## 2. Security vestibule (mantrap)

| Fact used in the brief | Source |
|---|---|
| A security vestibule is a small space between two electronically interlocked doors: the second cannot open until the first has closed. A card reader on the outer door; a reader with a second factor (PIN or biometric) on the inner door; sensors in the chamber (overhead 3D cameras or weight mats) detect a second person; anti-passback refuses a badge a second entry until it has exited. The server hall is often card plus biometric. Egress needs a push-to-exit button and release on fire alarm or power loss. | (s) https://open-exam-prep.com/study-guides/bicsi-dcdc/ch13-physical-security-access/sec03-access-control-mantraps-biometrics, (s) https://www.2mtechnology.net/security-vestibules-mantraps/, (s) https://nationallocksupply.com/blog/data-center-door-hardware-spec-guide/ |

## 3. Security operations centre

| Fact used in the brief | Source |
|---|---|
| A 24/7 SOC used a 4 by 2 array of 55 inch display panels with a 3.7 mm tiled bezel; sit-stand consoles keep sight lines to the wall both sitting and standing. | (s) https://constanttech.com/case-study-a-showpiece-security-operations-center-installation/ |
| A government SOC specification puts the base of the display wall at 48 in (1.22 m) above the floor or higher, so the front row does not block the view. | (s) https://bidopportunities.iowa.gov/Home/ShowContractDocument/934e3b4f-9311-408f-a729-33dfd626cbc7 |
| Rear rows on raised platforms keep every operator's view of the wall (a match control room). Smaller SOCs (4 to 6 operators, one row) use a wall of flat panels. | (s) https://www.installation-international.com/?p=19360, (s) https://ipvm.com/forums/video-surveillance/topics/videowall-brands-in-security-operations-centers-soc |

## 4. Incident room and the engineering desk

| Fact used in the brief | Source |
|---|---|
| No source was read for an incident room's layout. The brief uses an ordinary meeting room of 5.1 by 6.0 m with a 3.2 by 1.2 m table, a 75 inch wall screen with a camera bar, a conference speaker puck, and blinds lowered on its window; the scene's content (bridge calls, ransomware decisions, tabletop exercises, post-incident reviews) is the lesson's, not the set's. | design choice, not verified |
| Engineering desks: sit-stand desks 1.6 by 0.8 m with two 27 inch monitors on an arm, screens at 90 degrees to the windows (the office world's DSE sources in docs/research/2026-10-09-set-references.md). | as cited there |

## 5. The building

- A retailer running its own small data hall (about 40 racks) beside its engineering and security teams is a plausible
  type (an on-premises data hall in a technology centre); the brief invents one, with no real company, brand or city named.
- Floor heights (3.2 m soffit on the first floor, a 0.6 m raised floor and a 3.6 m clear height in the data hall), the
  7.2 m column grid and the ribbon windows are design choices for a 2016 concrete-framed building, not measured.

## 6. What is not verified

- Rack doors opening about 180 degrees (used for the open rack in `data_centre`): from memory of maker listings, not
  read on a page.
- The cold aisle width of 1.8 m is narrower than the one maker's 2.4 m recommendation (section 1); 1.8 m (three tiles)
  is used because it is common in smaller halls, which was not confirmed by a source.
- The video wall's base at 1.2 m follows one government specification (section 3); other SOCs mount higher.
- The SOC's console sizes, the platform height (0.3 m) and the room size (10 by 8 m) are design choices.
- `cyberspace` is abstract: its composition is written in frame terms and was not plan-checked (its `checked` is unset).
- Every other camera position and frame number was computed with `tools/set_camera.py` (plan checks in
  `docs/assets/plan_checks/tech_cyber/`); none was checked against a drawn set yet.

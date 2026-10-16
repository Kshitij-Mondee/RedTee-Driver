# Set references: real-space facts for the travel world (2026-10-13)

STATUS: DONE 2026-10-15 (six scenes directed and plan-checked; written as the research ran, so a cut-off kept what was found). Used in
`packs/worlds/travel.json` (identity, scale, objects, every scene). Web search and page reads only (nothing downloaded;
page text treated as data). (s) = from a search summary, the page itself not read; everything else was read.

## 0. Lesson moments imagined (D-156) and the places they need

1. A contact-centre agent handles a schedule change and a refund request on the phone (the travel company's desk).
2. An agent spots a booking that looks like card fraud and escalates it to a supervisor (the travel company's desk).
3. A duty-of-care agent calls a traveller stranded by a cancellation (the travel company's desk, and the traveller at
   the gate or in a hotel room).
4. A check-in agent finds a passport that expires too soon for the destination (check-in hall).
5. A wheelchair user asks for assistance at check-in and is handed over to the assistance team (check-in hall).
6. A bag is over the weight limit, or holds spare lithium batteries (check-in hall, bag drop).
7. A flight is cancelled at the gate; the gate agent explains rebooking, meals and a hotel (departure gate).
8. The flight is overbooked and the gate agent asks for volunteers (departure gate).
9. Cabin crew calm a disruptive passenger, or brief the passengers in an exit row (aircraft cabin).
10. A guest arrives late and the hotel has no record of the booking (hotel front desk).
11. A caller asks the hotel desk for another guest's room number (privacy, social engineering) (hotel front desk).
12. A business traveller checks the fire exit plan on the room door and connects to the hotel Wi-Fi safely (hotel room).

Places: the travel company's contact desk, the check-in hall, the departure gate, the aircraft cabin, the hotel front
desk, the hotel room. Dropped: security screening, the taxi rank, booking on a phone (see section 9).

`py -m loom sets demand` (run 2026-10-15 on 76 lessons): no travel scene is named by any past lesson, so no id is
protected by evidence; ids are kept where the place is kept.

## 1. Check-in hall: counters, scales, belts, queues

| Fact used in the brief | Source (read 2026-10-15) |
|---|---|
| Ticket counter, double position: working side at most 6 ft 6 in (1.98 m) wide and 3 ft 6 in (1.07 m) deep; single position at most 4 ft 3 in (1.30 m) wide. The passenger-side counter-top shelf is at most 1 ft (0.30 m) deep and 3 ft 6 in to 4 ft 2 in (1.07 to 1.27 m) high; the agent's working height depends on whether agents stand or sit. | Port Authority NY and NJ, Passenger Terminal Planning Standards (ACRP 07-15 appendix 3), section 2.3.1: https://crp.trb.org/acrp0715/wp-content/themes/acrp-child/documents/112/original/Planning_Design_for_Terminals_and_Facilities_Airport_Standards_Manual_Appendix_3.pdf |
| Baggage scales sit directly beside the positions, at most 3 ft (0.91 m) wide and no deeper than the counter; the take-away conveyor behind a bank of counters is at least 3 ft wide. | same, section 2.3.3 |
| Counter edge to the queue stanchions: at least 10 ft (3.0 m) clear for circulation and the transaction; queue lane at least 4 ft (1.22 m) wide; stanchion posts at most 8 ft (2.4 m) apart centre to centre (the text reads "at least", which cannot be meant for belt posts: belts are 2 to 3 m long; the brief uses about 2 m). | same, sections 2.4.1 to 2.4.3 |
| A check-in scale is built to stand between two check-in desks, a stainless-steel cover on a steel base with front and back kick plates; its height is 12 in (about 0.30 m). | Rice Lake BenchMark HD-1 product page (the 12 in figure from the search summary of the HD-1/2/3 print pages, (s)): https://www.ricelake.com/products/benchmark-hd-1-aviation-scale |
| Low bag-drop belts are made so passengers lift bags less high onto the scale. | (s) https://montech.com/app/uploads/sites/2/2023/04/Conveyor-TB40-with-low-height-for-the-airport-bag-drop.pdf |
| Kiosks at most 4 ft 6 in (1.37 m) high. | ACRP appendix 3, section 2.5.2 |
| Accessible section of a service counter (hotel registration and ticketing counters are named): at most 36 in (0.91 m) high and at least 36 in (0.91 m) long for a side approach, or 30 in long with knee space for a forward approach. California: 34 in. | (s) ADA 2010 Standards 904.4, https://www.access-board.gov/ada/chapter/ch09/ and https://archive.ada.gov/reachingout/salesservice.html |

## 2. Departure gate

| Fact used in the brief | Source |
|---|---|
| Gate podium counters 4 ft (1.22 m) wide and 3 ft 6 in deep per position; passenger shelf 1.07 to 1.27 m high; at least 6 ft (1.83 m) clear around the podium and its back wall; at least 4 ft (1.22 m) between rows of seats; 6 ft clear on accessible routes to egress. | ACRP appendix 3, sections 3.2.1 and 3.2.5 (read) |
| Hold room space per passenger, IATA level of service A to E: 15 to 7 sq ft; a deplaning corridor about 6 ft wide. | same, section 3.1 and 3.4 |

## 3. Aircraft cabin

| Fact used in the brief | Source |
|---|---|
| Minimum passenger aisle width for 20 or more seats: 15 in (0.38 m) below 25 in from the floor and 20 in (0.51 m) from 25 in up. EASA CS 25.815 uses the same values (38 and 51 cm). | 14 CFR 25.815 (read): https://www.law.cornell.edu/cfr/text/14/25.815; EASA (s) https://www.easa.europa.eu/en/downloads/22425/en |

| Narrow-body cabin interior width about 141 to 148 in (3.58 to 3.76 m); one listing gives 3.77 m at the centreline and an aisle height of 2.23 m; six seats abreast (3 and 3) is the usual layout; economy seat width (between armrests) about 17 to 18 in (0.43 to 0.46 m). | (s) https://en.wikipedia.org/wiki/Narrow-body_aircraft, https://planefyi.com/glossary/seat-width/, https://www.globalair.com/aircraft-specifications/airbus/airbus-a320-specifications/639 (cabin height 7 ft 4 in, (s)) |
| Economy seat pitch about 28 to 32 in (0.71 to 0.81 m); 31 to 32 in is typical of mainline carriers; ultra-low-cost as low as 27 to 28 in. | (s) https://pilotteacher.com/passenger-space-on-airplanes-all-you-need-to-know/, https://www.smartertravel.com/worst-economy-seats-in-the-air/ |
| One narrow-body family's passenger window is about 23 cm wide by 31 cm tall, rounded, with a sliding shade; another's about 25 by 36 cm. | (s) https://www.theflightclub.it/en/2023/12/when-you-fly-you-like-the-view-plane-by-plane-window-size-ranking/amp/ |
| Overhead bins on a current narrow-body take bags about 24 x 16 x 10 in on their side; a bin is four frames long. | (s) https://www.futuretravelexperience.com/2017/06/airbus-launches-new-a320-airspace-interior/ |
| Economy tray table about 68 cm high (a study suggests 78 cm); recline about 3 in. | (s) https://pure.nwpu.edu.cn/en/publications/effects-of-aircraft-tray-table-height-and-neck-posture-on-passeng/ |
| Cabin exit signs: the rules (14 CFR 25.811 and 25.812) call for lettered signs, but a symbolic sign, the ISO 7010 running-person on green with a white door and arrows, has been approved in place of them on at least one large type, and EASA has an equivalent-safety finding for photoluminescent symbolic exit signs. The brief draws symbol-only exit signs (no words), which is real practice on some types, not on all. | (s) https://rosap.ntl.bts.gov/view/dot/27201, https://www.fire.tc.faa.gov/2013Conference/files/Cabin_Safety_I/McLeanSymbolicExitSigns/McLeanSymbolicExitSignsAbs.pdf |

Not verified: seat-pan height (the brief uses 0.43 m, a design choice close to an office chair), the window centre height
above the floor (the brief puts the window's centre about 1.0 m up, level with a seated passenger's shoulder: checked
only against how cabins look, not a document), the bin's lower edge height (the brief uses about 1.65 m).

## 4. Hotel front desk and room

| Fact used in the brief | Source |
|---|---|
| Hotel registration counters are covered by the ADA counter rule: an accessible section at most 36 in (0.91 m) high and at least 36 in long. US office vendors give a standing transaction counter of about 42 in (1.07 m) and a staff work surface of 29 to 30 in (0.74 to 0.76 m). A UK hotel access guide records a counter at 1.16 m with a lowered section at 0.96 m. Australia (AS 1428.2): 830 to 870 mm with knee space. | (s) https://archive.ada.gov/reachingout/salesservice.html, https://www.findofficefurniture.com/answers/reception-desks/what-height-should-a-reception-desk-be.html, https://www.accessable.co.uk/marella-discovery-2/access-guides/reception, https://sydneyaccessconsultants.com.au/articles/103-issue-9-reception-desks-and-counters.html |
| A typical US room with its bathroom is about 30 m2, inside about 4 m by 7.6 m; a 12 to 13 ft (about 3.7 to 4 m) wide room leaves an aisle between the foot of the bed and the dresser. The entry door opens past the bathroom and wardrobe into the room; the window is at the far end. King bed about 1.93 by 2.03 m; queen 1.52 by 2.03 m; at least 0.915 m clear around the bed. | (s) https://www.roomsketcher.com/floor-plans/hotel-room-layout/, https://www.homestyler.com/article/essential-dimensions-for-hotel-guest-rooms |
| A floor plan showing the room and its exit routes is kept in each guest room in some local codes (example: a city ordinance); hotels commonly post it on the inside of the room door. The national code text was not read. | (s) https://codelibrary.amlegal.com/codes/galena/latest/galena_il/0-0-0-32236, https://www.roommaster.com/blog/hotel-evacuation-plan |

## 5. Signs

| Fact used in the brief | Source |
|---|---|
| ISO 7001 public information symbols cover wayfinding (check-in, baggage, toilets, lifts, information) and exclude safety signs; symbols may be used with or without text. ICAO Doc 9636 (with the IMO) is the airport and marine-terminal sign set; it is a paid manual and was not read. | (s) https://en.wikipedia.org/wiki/ISO_7001, https://store.icao.int/en/international-signs-to-provide-guidance-to-persons-at-airports-and-marine-terminals-doc-9636 |
| ISO 7010 E001 and E002: emergency exit left and right, a white running figure, a white door and an arrow on green; the standard aims to need as few words as possible. | (s) https://en.wikipedia.org/wiki/ISO_7010 |

The brief's airport signs are pictogram-and-arrow only (no words, no letters, no flight numbers): a dark charcoal box with
pale yellow pictograms, the scheme many airports use. Flight information screens are slots.

## 6. Queue barriers, gate seats, contact-centre desks

| Fact used in the brief | Source |
|---|---|
| Retractable-belt stanchions: posts about 0.91 to 1.02 m high on round weighted bases about 0.32 to 0.36 m across; belts from about 2 m to 4.6 m. | (s) https://www.walmart.com/ip/40269607 (40 in post, 14 in base, 7 ft belt), https://www.displays2go.com/P-55023/Red-Retractable-Belt-Barrier-Black-Concrete-Weighted-Round-Base-Stability, https://www.visiontron.com/queuing-crowd-control/retracta-belt-posts-and-accessories/15ft-premium-retracta-belt-stanchions/ |
| Gate beam seating: seats about 0.50 to 0.55 m wide on a steel beam with two or three legs, seat about 0.43 to 0.45 m high, armrests about 0.59 to 0.63 m from the floor; a 4-seat beam about 2.1 to 2.5 m long, about 0.66 m deep, about 0.83 m high overall. | (s) https://www.rosehill.co.uk/product/terminal-beam-seating/, https://buydirectonline.com.au/product/airex-beam-seating, https://cdn.shopify.com/s/files/1/0966/2634/files/Linear_Beam.pdf, https://www.contractfurniturestore.com/products/gate-beam-seating |
| Contact-centre stations: a work surface at least 48 by 24 in; desk-mounted screens 0.35 to 0.65 m above the desk; full partitions about 1.2 to 1.4 m from the floor; wallboards are large wall screens showing queue figures. | (s) https://www.officefurniture2go.com/answers/cubicles-workstations/what-size-cubicle-do-i-need-for-a-call-center.html, https://hermanmiller.com/en_in/products/workspaces/workstations/catena-office-landscape/specs, https://customerthink.com/contact-center-agent-productivity-dos-and-donts-of-dual-monitors-and-wallboards/ |


## 7. More on the gate, the hotel desk and the signs (added 2026-10-15, resumed run)

| Fact used in the brief | Source (read 2026-10-15 unless marked (s)) |
|---|---|
| A two-position gate check-in podium is 8 to 10 ft (2.4 to 3.0 m) wide; the podium counter and its back wall are typically 8 ft (2.4 m) deep together; about 15 ft (4.5 m) of queue space in front of it; rows of seats at least 5 ft (1.5 m) apart when occupied; holdroom depth at least 25 ft (7.5 m), 30 ft (9 m) recommended; a boarding corridor at least 6 ft (1.8 m) wide, 8 ft when it is not shared with other circulation, with a boarding-pass reader (a stand-alone reader or a small podium) at the entry to the loading bridge; two agent positions for a narrow-body of up to 150 seats. | ACRP Report 25 vol. 2, Holdrooms Model, figure 65 and text: https://nap.nationalacademies.org/read/14356/chapter/10 |
| Narrow-body door sill heights are typically 8 to 12 ft above the apron; boarding-bridge slopes are held to accessible-ramp limits (1:12 to 1:20 depending on the authority). | (s) https://www.hanson-inc.com/insights/blog/bridging-the-passenger-s-path-from-terminal-to-aircraft/ |
| Hotel check-in desk: guest-facing standing counter 42 in (1.07 m); staff work surface about 30 in (0.76 m); accessible section at most 36 in (0.91 m) high and at least 36 in long with knee space; desk depth 28 to 36 in (0.71 to 0.91 m); 48 to 72 in (1.2 to 1.8 m) of width per staff position; at least 36 in (0.91 m) clear behind the desk; a recessed toe kick about 4 in; hard solid-surface or stone on the transaction edge, wood or metal on the face; a clear sightline from the entrance; luggage carts kept off the queue path. | Roommaster, How to Plan Your Hotel Check-In Desk (a vendor planning blog, not a code): https://www.roommaster.com/blog/how-plan-hotel-check-in-desk |
| Above-door exit signs: the base of the sign 2.0 to 2.5 m above the floor, near the centre line of the route; wall-mounted signs 1.7 to 2.0 m to the base; higher only in large spaces and then bigger. | (s) BS 5499-4 summaries: https://zemper.com/uk/?p=22866, https://camdocs.camden.gov.uk/CMWebDrawer/Record/5628376/file/document, https://www.markhammuseum.ca/sites/default/files/2024-12/Builder%20Tip%20No.%2085%20-%20Visibility%20And%20Illumination%20Of%20Exit%20Signs.pdf |
| Hotel room door: some state and local codes require an evacuation map on the back of the main entry door (Louisiana RS 40:1580; a North Carolina town ordinance asks for two routes shown on or beside the inside of the door); a deadbolt worked from inside by a lever without a key; a door viewer at eye level (residential practice 4.5 to 5.5 ft, about 1.4 to 1.7 m; no hotel standard found). | (s) https://legis.la.gov/legis/Law.aspx?d=97688, https://codelibrary.amlegal.com/codes/pinevillenc/latest/pineville_nc/0-0-0-3763 |

Not found: a cabin cross-section with seat-pan, window and bin heights from a maker's document (the maker's airport
planning manual holds it, Chapter 2-5-0, but it was not read: https://aircraft.airbus.com/sites/g/files/jlcbta126/files/2024-06/AC_A320_0624.pdf
is the source to read next). The cabin's heights in the brief stay design choices checked against photographs, and are
marked so.

## 8. Plan decisions per kept scene (how the facts became plans)

Every frame position in the scenes comes from `tools/set_camera.py`; the specs and outputs are in
`docs/assets/plan_checks/travel/<scene>.json`.

- Check-in hall (airport_checkin): counters 1.07 m with a 0.86 m lowered section (ADA 904.4 and AS 1428.2 both allow
  it), scales 0.9 m wide and 0.3 m high, 3 m from the counters to the first queue line, lanes 1.2 m, posts 2 m apart.
  The agents' monitors sit low on the work top, below the ledge, so nothing stands in front of the agent's chest
  (changed on 2026-10-15 from a monitor on an arm, which the plan check showed overlapping the agent).
- Departure gate (departure_gate): a two-position podium 2.6 m wide (ACRP 25: 8 to 10 ft), 0.8 m deep, ledge 1.07 m,
  in front of a freestanding teal gate wall 2.4 m high; beam seats 0.52 m wide, seat 0.45 m, armrests 0.62 m; a
  boarding corridor 1.9 m wide along the glass (ACRP 25: at least 6 ft) with the boarding-pass reader at its entry
  and the bridge door in the glass; the holdroom floor about 4 m above the apron (narrow-body sills 8 to 12 ft).
- Aircraft cabin (aircraft_cabin): six abreast, seats 0.46 m between armrests, pitch 0.79 m (31 in), aisle 0.51 m at
  armrest height, cabin about 3.7 m wide and 2.2 m high at the aisle; windows not aligned with rows; exit signs
  symbol-only (see section 3).
- Hotel front desk (hotel_lobby): guest ledge 1.07 m, staff work top 0.76 m, desk 0.8 m deep, a lowered section
  0.86 m high and 1.0 m long with knee space, 1.6 m clear behind the desk (the planning guide asks for at least 0.91 m).
- Hotel room (hotel_room): 4.0 m wide, 2.7 m high, king bed 1.93 by 2.03 m with 1.4 m clear between its foot and the
  desk-dresser; the evacuation plan on the back of the entry door; a door viewer at about 1.5 m; the door opens
  inward and swings clear of the wardrobe.
- Booking desk (booking_desk): desks 1.6 by 0.8 m at 0.73 m, two monitors with their tops about 0.45 m above the
  desk, screens at right angles to the window wall (glare), a 1.2 m felt screen between facing desks.

Not verified in this run: the cabin's seat-cushion height (0.43 m), the window centre height (1.1 m, set to a seated
passenger's eye level from photographs) and the bin edge height (1.62 m) are design choices, not sourced; the hotel
desk figures come from one vendor planning blog plus the ADA and AS 1428.2 summaries; no hotel door-viewer height
standard was found. No set has been drawn from these prompts yet, so none of the compositions is proven on a picture.

## 9. Places dropped or merged (D-156)

- **contact_centre_travel and phone_booking merged into booking_desk.** The lessons (a refund call, a schedule change,
  a fraud flag, a duty-of-care call) all happen at one agent's desk; a whole contact-centre floor is already directed in
  the contact_centre world, and "booking on a phone" is a phone screen (an asset), not a place.
- **security_line dropped.** Screening is run by a state agency, not by travel or airline staff, so travel-company
  lessons rarely stand there; the rules a traveller needs (liquids, batteries) are taught at check-in or on a phone.
- **taxi_rank dropped.** A transition: lessons about ground transport happen on the phone or at the hotel desk.
- **hotel_lobby kept as the hotel front desk** (the desk, not the lounge, is where hotel lessons happen).

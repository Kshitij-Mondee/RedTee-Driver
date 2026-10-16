# Set references: real-space facts for the finance world (2026-10-13)

STATUS: DONE 2026-10-15 (five scenes directed and plan-checked: branch, advice_room, fincrime_desk, trading_floor, vault). Used in
`packs/worlds/finance.json` (identity, scale, objects, every scene). Web search and page reads only (nothing downloaded;
page text treated as data). (s) = from a search summary, the page itself not read; everything else was read on
2026-10-15.

## 0. Lesson moments imagined (D-156) and the places they need

1. A cashier notices an older customer withdrawing a large sum in cash while a caller on their phone tells them what
   to say, and stops to ask gentle questions (an authorised push payment scam) (the counter in the banking hall).
2. A customer at the counter asks to pay a large cash deposit and explains it vaguely; the cashier follows the
   suspicious activity procedure without tipping off (the counter).
3. A branch colleague is called over from the hall to help with a customer who seems confused (the banking hall).
4. An adviser opens an account and checks identity documents and proof of address (KYC) in a private room (the
   interview room).
5. An adviser recommends an investment to a customer who does not understand the risk; the lesson is suitability and
   mis-selling (the interview room).
6. A bereaved or vulnerable customer is given time and a quiet room (the interview room).
7. A financial crime analyst reviews an alert on screen, finds a pattern of structured payments and escalates it to the
   nominated officer; a second analyst checks the decision (four eyes) (the financial crime team's desks).
8. A sanctions screening hit: the analyst holds a payment and asks a colleague to confirm (the team's desks).
9. A dealer is asked by a contact to share what a client is about to do, or chats on an unapproved app (market abuse,
   recorded lines, conduct) (the dealing room).
10. A compliance officer walks the dealing room and stops at a desk (the dealing room).
11. Two keyholders open the strong room at the start of the day under dual control; a customer visits a safe deposit box
    with a cashier holding the guard key (the strong room).
12. MFA and secure access: something you have, know and are, explained with the strong room's two keys, combination and
    time lock (the strong room, as a real place used as a picture of layered security).

Places kept (scene ids): the banking hall with its counter (`branch`), the interview room (`advice_room`), the
financial crime team's desks (`fincrime_desk`), the dealing room (`trading_floor`), the strong room (`vault`).
Dropped or merged: the version 1 `advisor_meeting` (renamed `advice_room`: the same place, which also serves account
opening and vulnerable customers; not `interview_room`, because a job-interview lesson's words would then select a bank,
and the version 1 `back_office` is `fincrime_desk`, because the words "back office" also name the office world); MFA at a laptop (the office world's desk serves it,
and the strong room serves its picture of layers); a cash machine outside (a street is the city world's job).

`py -m loom sets demand` (run 2026-10-15 on 76 lessons): `finance/vault` is named by 8 lessons (ab-mfa-explained-off,
ab-mfa-explained-on, mfa-explained, style-cinematic-noir and more: mostly as a picture of layered security);
`finance/branch` by 1 (bench-20261006-135952-budget). Both ids are kept.

## 1. The banking hall and its counter

| Fact used in the brief | Source |
|---|---|
| Accessible counter sections: Australia AS 1428.2 asks for a low section 830 to 870 mm high with knee clearance 800 to 840 mm and 900 mm wide; India's banking guidelines ask for 750 to 800 mm for wheelchair users and 950 to 1100 mm for standing customers; ADA-type rules (Texas TAS) ask for a teller counter section at most 915 mm high and at least 915 mm long; New Zealand guidance found 900 mm practical. The brief uses a standing counter at 1.05 m and one low position at 0.85 m with a knee recess (BS 8300's own figure was not read: the standard is paywalled). | (s) https://www.building.govt.nz/building-code-compliance/g-services-and-facilities/g5-interior-environment/accessible-reception-and-service-counters/, (s) https://www.and.org.au/DFD/dfd-06-14-customer-interaction-counters-tables-and-worktops.html, (s) https://financialservices.gov.in/beta/sites/default/files/2024-08/Guidelines-for-Banking-Sector.pdf, (s) https://www.tdlr.texas.gov/ab/tas/tassection07.pdf |
| A counter needs a frontal approach and knee and toe space under the low section, not only a lower top. | (s) same New Zealand and Australian guidance |
| The glass screen's height (to 2.2 m), the speech panel and the recessed deal tray under the glass, and the cashier's tall chair (seat 0.75 m, so a seated cashier meets a standing customer's eyes): from photographs and general knowledge, not from a standard. | not verified by a page read |

## 2. The strong room (vault)

| Fact used in the brief | Source |
|---|---|
| Rectangular bank vault doors range from about 2 to 12 in (50 to 300 mm) thick, rated by class; a time lock, a day gate and a sill come with the door. Real doors with frames are about 2.0 to 2.1 m high and 0.85 to 1.1 m wide; one 1960s bank vault door is 1.73 by 0.85 m; clear openings are smaller (about 0.78 m wide in one example). The brief uses a door leaf 0.3 m thick in a frame with a clear opening of 0.9 by 2.0 m. | (s) https://www.swiftestimator.com/SE7Help/SEG/WebHelp/Components/c_tw.htm, (s) https://www.1stdibs.com/furniture/more-furniture-collectibles/1960s-mosler-bank-vault-door/id-f_899227 |
| Dual control: a door with a key lock and a combination lock is split so one person holds only the key and another only the combination; the main vault is opened under dual control and logged with both signatures; a time lock is set each day so the door cannot be opened out of hours; at closing, the room is checked for anyone inside. The day gate is a locked inner barrier used while the vault door stands open in business hours. | (s) https://sandbox-ccbg.helpjuice.com/office-security/977763-vault-access (one bank's written procedure), (s) https://ipvm.com/forums/video-surveillance/topics/bank-vault-day-gate-access-control |
| Safe deposit boxes are sold by front size, width by height in inches: 3 by 5, 5 by 5, 3 by 10, 5 by 10 and 10 by 10; 20 to 24 in deep. Each box needs two keys together: the renter's key and the bank's guard key, used by a trained member of staff. | (s) https://www.iccu.com/?p=3607, (s) https://traditionalbank.com/safe-deposit-boxes, (s) https://the-kansas-banker.thenewslinkgroup.org/flippingbooks/Pub1-2012-Issue4/16/ |

## 3. The dealing room

| Fact used in the brief | Source |
|---|---|
| "A typical 1500 mm wide desk would be expected to accommodate up to 7 high performance PCs and would be expected to carry upwards of 6 flat-screen monitors, typically 2-12 monitors are mounted in a trading environment." Desks are set side by side in rows; the desk's depth sets how many rows fit; legroom at least 800 mm deep. The brief uses 1.6 m per dealer, 0.9 m deep, with six 24 inch screens on a two-tier arm. | US9277810B2, Trading desk: https://patents.google.com/patent/US9277810 |

## 4. Interview room and the financial crime team's desks

| Fact used in the brief | Source |
|---|---|
| No source was read for a bank interview room's size or a financial crime team's layout. The brief uses a 3.6 by 3.8 m room with solid walls (privacy), one street window with frosted lower panes, a 1.4 by 0.8 m table and three chairs; and an ordinary bench of 1.6 by 0.8 m desks with two monitors each, back to back across a low spine, with screens at 90 degrees to the windows (as in the office world's DSE sources). | design choice, not verified |
| Four eyes (a second person checks a decision), the nominated officer and suspicious activity reports are the lesson's content, not the set's; the set only gives two people room at one desk. | not a set fact |

## 5. The building

- A 1930s steel-framed, stone-faced bank head office with its banking hall kept as the main branch is a common type in
  British cathedral cities; the brief invents one, with no real building, bank or city named. The hall's size (18 by
  10 m, 6.0 m to a coffered ceiling), the window sizes and the bronze-coloured frames are design choices in keeping
  with the type, not measured from a building.
- The dealing room's raised floor and the upper floors' 3.0 m ceilings follow the refit, not the 1930s fabric.

## 6. What is not verified

- Counter screen height, the cashier's tall chair and the deal tray (section 1), from photographs and memory only.
- Vault door figures come from search summaries of an estimating reference and sale listings (section 2), not from a
  maker's page; the time locks' look (round movements under a glass cover) is from memory.
- Every camera position and frame number in the scenes was computed with `tools/set_camera.py` (plan checks in
  `docs/assets/plan_checks/finance/`); none was checked against a drawn set yet.

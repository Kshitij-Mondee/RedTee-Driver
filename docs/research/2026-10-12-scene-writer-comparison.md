# Scene writers on five models (D-166, 2026-10-12)

Kshitij: "run the scene writers ... on different models ... Let's see for each step and each sub process what models can be
cheaper yet match the level of claude for us." Setup and caps: `docs/research/scene_writer_comparison/RUN_LOG.md`.

The slice: gps-position b08 to b18 (11 beats, 73.5 s, the diagram where elements carry from beat to beat), plan, narration and
kit unchanged. Sonnet 5.5 led every arm (P8, P9) on the loom runner (D-165) with the slim briefs and routing (D-166); only the
scene authors, clip authors and fixers changed. One arm at a time; real API calls.

## Measured

| arm (scene writers) | total | lead | scene writers | per beat (writers) | minutes | looks | checks | beats written | result |
|---|---|---|---|---|---|---|---|---|---|
| gpt-6-luna | $1.44 | $1.12 | $0.32 | $0.03 | 33 | 61 | 3 | 11/11 | P9 passed |
| gemini-3.8-flash | $3.65 | $0.53 | $3.12 | - | 21 | 36 | 0 | 2/11 | budget stop in P8 |
| claude-sonnet-5-5 | $6.68 | $0.61 | $6.07 | $0.55 | 16 | 61 | 1 | 11/11 | budget stop in P9, 1 error left |
| gpt-6.1-sol | $3.13 | $0.67 | $2.46 | $0.22 | 20 | 47 | 1 | 11/11 | P9 passed |
| gpt-5.6-terra | $2.73 | $0.64 | $2.08 | $0.19 | 11 | 34 | 1 | 11/11 | P9 passed |

Scene writers' tokens: Sonnet 157 calls, 7.47 M in (82 % cached), 146 k out (73 k thinking); Sol 240 calls, 7.25 M in (91 %),
46 k out; Terra 106 calls, 3.21 M in (85 %), 46 k out, a median 9 turns an author (Sonnet 12.5); Flash 203 calls, 7.66 M in
(only 65 % cached), 202 k out (178 k thinking), authors at the 20-turn limit without submitting; Luna 215 calls, 8.93 M in,
235 k out (188 k thinking), at its tiny price.

Sonnet's last error, `line_into_object: b14 circle_a runs into phone_pt (b08)`, is a range circle through the phone point,
which is the lesson's design: probably a false positive of the line rule (sent to the session that owns it). The arm stopped
at its $7 cap before the next round.

## Looked at (8 frames an arm, the same moments; flat-cosmos only; sheet_<arm>.jpg here)
- **Sonnet:** the richest teaching: the "nothing goes up" arrow crossed out, the readout 0.00 to 0.07 s with arrival, sending
  and speed of light, the labelled distance, two circles meeting at a glowing point, the clock.
- **Sol:** close to Sonnet: the crossed-out signal, "about 0.07 s" with its breakdown, two spheres drawn clearly, the meeting
  point.
- **Terra:** clean and larger satellites, less explanation: no "nothing goes up" signal, the readout still 0.00 at "subtracts
  the sending time".
- **Luna:** a scale error (the phone point drawn as a huge teal disc over the diagram), the second circle barely there, the last
  frame nearly empty.
- **Flash:** no film (2 of 11 beats).

Not verified: one slice, one run an arm; previews at 12 fps from the builds, not renders; not listened to (the narration is
the same in every arm). Kshitij's blind rating decides quality: `docs/research/scene_writer_comparison/blind/A.mp4` to `D.mp4`,
the key in `blind_KEY_open_after_rating.json`.

## What it suggests (to confirm, CLAUDE.md rule 13)
1. **GPT-6.1 Sol is the candidate:** near Sonnet's picture at about 40 % of the scene writers' cost ($0.22 against $0.55 a
   beat). Confirm on a second slice of another lesson and Kshitij's blind rating before it replaces Sonnet anywhere.
2. **GPT-5.6 Terra** is the fastest and cheap, but it explained less here; a second look before ruling either way.
3. **GPT-6 Luna and Gemini 3.8 Flash are not scene writers** for this kind of beat: Luna draws wrong scale and leaves holes
   (it may still serve small roles, untested); Flash runs out of turns and loses its cache.
4. **The lead is a fixed cost** ($0.53 to $1.12 an arm here); more check rounds (Luna's three) raise it.

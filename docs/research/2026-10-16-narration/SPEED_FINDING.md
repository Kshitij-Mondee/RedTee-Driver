# Why the narration drags: the speed calibration (2026-10-16)

Kshitij on the narration review's test files: "Both A and C sound similar ... The audio doesn't feel significantly
different on its own." Measured, he is right: A, B and C have the same pause pattern (20 to 27 pauses, 18 to 23 % of
the time silent) and the same pitch range (7.5 to 7.6 semitones). Neither the rewrite nor one call per beat moves it.

What the three tests did not vary is the speed. They were made at speed 1.0; the test lessons were narrated at 0.7.

| clip (st-holo-ai b01 to b08, 132 words) | length | words a minute | pitch spread |
|---|---|---|---|
| D: af_heart, speed 1.0 | 48.6 s | 163 | 7.5 st |
| H: af_heart, speed 0.7 (as the lessons were narrated) | 69.7 s | 114 | 7.2 st |
| E: af_bella, 1.0 | 50.3 s | | 5.9 st |
| F: bf_emma, 1.0 | 46.2 s | | 5.8 st |
| G: am_michael, 1.0 | 52.2 s | | 8.5 st |

## The cause, in the engine

`loom/narrate/__init__.py`:
- `_wpm` measures words over **speech time only** (each phrase's own span, every pause between phrases removed).
- `narrate` compares that with the script's `wpm_target` (145), a rate meant for the narration as heard, pauses included.
- Kokoro speaks about 200 words a minute while it is talking, so the calibration reads it as far too fast and slows it to
  its floor: `max(0.7, ...)`.

Of the 74 calibrated Kokoro lessons in `projects/`, 47 sit at 0.70 to 0.73, most at or by the floor. Then the pauses are
added back, and the films play at about 114 words a minute: a stretched voice, slower than any target.

## The proposed fix (not built; Kshitij's call)

- Measure the rate as heard (speech plus the pauses inside each beat), or compare speech-only time with a speech-only target.
- Keep Kokoro at 0.9 or above, where it does not stretch; adjust the pacing with the pauses, not the voice.
- Compare voices on their own, at speed 1.0, before choosing a default: by measure, G (am_michael) has the widest pitch
  range of the four and E and F the narrowest.

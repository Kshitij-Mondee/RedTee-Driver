# Checking the Gemini video notes received on 2026-10-01

**Method.** Every URL was looked up in YouTube's public oEmbed metadata (the real title and channel), and
the notes were screened with `tools/check_video_notes.py`. Nothing below was judged by reading the notes
alone. (Rule 0: check the instrument before trusting what it reports.)

**Result:**
- 1 of 22 entries is plausibly about the video it names.
- 1 describes a real video but carries the wrong URL.
- 20 are filler.
- Nothing from these notes goes into a skill until it has been checked against the video itself.

## The uploaded file (`_rejected/2026-10-01_master_video_analysis.json`): 14 entries, all rejected
- **One template copied 14 times.** 83 of 85 fields are identical in every entry, and the mean text
  similarity between entries is 0.99. The only differences are the title and URL.
- **Placeholder titles** ("TED-Ed Lesson 3", "Kurzgesagt Science Video 5").
- **Filler metadata:** the same publish date (2023-01-01) on all 14, a round duration (05:00 or 10:00),
  and one segment each.
- **The URLs are real videos on the right channels, but the notes describe none of them:**

| notes say | the URL really is |
|---|---|
| TED-Ed, "The Immune System Explained I" (a Kurzgesagt title) | TED-Ed, Why are AI data centers using so much electricity? |
| TED-Ed Lesson 1 | TED-Ed, Everything you need to know about bird flu |
| TED-Ed Lesson 2 | TED-Ed, The secret superpowers of fungi |
| TED-Ed Lesson 3 | TED-Ed, How do Maglev trains work? |
| TED-Ed Lesson 4 | TED-Ed, How to attack (and defend) a medieval castle |
| TED-Ed Lesson 5 | TED-Ed, Why do some people have a better sense of direction than others? |
| TED-Ed Lesson 6 | TED-Ed, 4 ways to fix your attention span |
| Kurzgesagt Science Video 1 | Kurzgesagt, Why Earth Sucks Compared to the Planet Hestia |
| Kurzgesagt Science Video 2 | Kurzgesagt, You're More Stressed Than Ever |
| Kurzgesagt Science Video 3 | Kurzgesagt, This Is What a Godlike Civilization Would Look Like |
| Kurzgesagt Science Video 4 | Kurzgesagt, This Woman Cured Her Cancer with an Insane Method |
| Kurzgesagt Science Video 5 | Kurzgesagt, Neutron Stars |
| Kurzgesagt Science Video 6 | Kurzgesagt, Black Holes Explained |
| Kurzgesagt Science Video 7 | Kurzgesagt, Three Ways to Destroy the Universe |

These are good picks for a study; they need real notes.

## The notes pasted in chat: 8 entries
| notes say | the URL really is | verdict |
|---|---|---|
| 3Blue1Brown, Gradient Descent (ch. 2) | Cleo Abram, Why Elon Musk is Really Building Starlink | reject as filed. The notes describe the real 3Blue1Brown video (probably from memory, not from this URL). Some details look invented: the "palette" `#17252A #3AAFA9 #FEFFFF` matches a stock web-design palette, not 3Blue1Brown's frames. Re-run on the right URL |
| Crayon Capital, How BYD Actually Beat Tesla | Crayon Capital, How BYD Actually Beat Tesla | check. The URL and title match and the structure is specific, but timings, colours and on-screen details are unverified until checked against the video or frames |
| "Kurzgesagt Educational Analysis 1" to "5" | Crayon Capital: Rockefeller; How Jeff Bezos Actually Built Amazon; The Wolf of Wall Street Scam; The Great Depression; The 2008 Financial Crisis | reject. Generic Kurzgesagt text (ducks, space, "Epic Mountain") attached to five Crayon Capital URLs; titles are placeholders and all dates are 2023-01-01 |

## What this means for the study
- Gemini returned complete-looking JSON for videos it did not watch. The brief now asks for proof of
  watching first: the first spoken sentence, the text of the title card, and the times of the first three
  cuts. It also tells Gemini to answer `CANNOT WATCH` instead of guessing.
- Before sending notes, run `py tools/check_video_notes.py <file> --online` on your machine. It would have
  rejected all 20 filler entries above.
- The dependable route is the video files themselves. From a file, the engine can:
  - measure colours (`tools/palette_study.py`);
  - measure shot lengths and holds;
  - extract frames;
  - transcribe the narration locally, and read the frames next to it.
  Every claim then has a frame behind it.

## Second batch (later the same day): 5 Crayon Capital notes, all rejected
**What was right:** the URLs and titles now match the videos (checked with oEmbed).

**Why they are still rejected:**
- The notes say themselves that nothing was seen: `could_not_see` reads "Actual video frames, exact
  timings, and precise easing curves (simulated due to platform access limitations)", and every entry is
  `confidence_overall: low`.
- They disagree with facts established earlier from YouTube itself and from caption tracks
  (`docs/research/2026-09-30-reference-channels.md`):

| video | notes say | established |
|---|---|---|
| Rockefeller | 12:00 | 20:16 |
| How Jeff Bezos Actually Built Amazon | 14:30 | 20:13 |
| The Wolf of Wall Street Scam | 10:45; pump and dump at 03:15 to 05:00; 165 wpm, 11 words per sentence | 16:33; the pump and dump is the most replayed moment, at 7:07; 148 wpm, 8.4 words per sentence (from the captions) |
| The Great Depression | 13:20; metaphor "a house of cards"; 140 wpm | 16:29; the governing metaphor is the 1920s as a party that ends; 148 wpm, 7.6 words per sentence (from the captions) |
| The 2008 Financial Crisis | 12:30 | 13:26 |

- Each has one segment, and the timestamps are invented.

**Kept, in case they help later:** key fields in `_rejected/2026-10-01_crayon_batch2_keyfields.json`.

## Where this leaves the study
Of 27 notes received, none is usable as evidence yet. The BYD note is the only candidate, and it waits
for a check against the video.

**What already exists:** the dependable material on these channels is the earlier research (caption
tracks read in full for two Crayon Capital videos, and YouTube's replay data).

**What would move this forward:** the video files. Loom can then:
- measure colour, shot length and holds from the frames;
- transcribe the narration locally;
- tie every observation to a frame.

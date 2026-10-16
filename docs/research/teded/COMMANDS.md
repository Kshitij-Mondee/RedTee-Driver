# TED-Ed study: commands to run on the PC (2026-10-01)

> **Update 2026-10-01 (later):** the study was run in the sandbox instead, with pocketsphinx transcripts. The
> result is `2026-10-01-teded-study.md`. To redo it with whisper on the PC, use the commands below, with one
> correction to step 3: drop `--label teded`. `--label` names the i-th input file, so it renamed the first
> video "teded" and made that row look like a pooled average (L-130).

Run from `C:\Users\Admin\Desktop\Video-Engine` in PowerShell. Everything lands in the gitignored
`cache/research/teded/` (private study only; frames and transcripts are never published).
The agent reads the outputs with file tools afterwards. Steps are resumable; re-run a step if it is interrupted.

```powershell
$src = "C:\Users\Admin\Documents\Ted-Ed"
$out = "cache/research/teded"

# 1. Word-timed transcripts (faster-whisper; first use downloads the small.en model from Hugging Face)
py tools/transcribe_videos.py $src --out $out --engine whisper

# 2. Cuts, motion, holds, audio gaps, palette, speech numbers, contact sheets every 10 s
py tools/video_study.py $src --out $out --sheet-every 10

# 3. What the look is made of (outline, drawn share, flat/soft, sparse), all seven in one table
py tools/style_fingerprint.py (Get-ChildItem $src -Filter *.mp4).FullName --every 5 --json "$out/fingerprint.json"

# 4. Where the explaining happens, per video (printed, so captured to one file)
Get-ChildItem $src -Filter *.mp4 | ForEach-Object {
  py tools/explain_study.py cues $_.FullName --words "$out/$($_.BaseName).words.json" --top 8 --window 30
} *> "$out/cues.txt"
```

Then tell the agent it is done. It will ask for specific strips, for example:
`py tools/explain_study.py strip "<video>" --words "<words.json>" --start 60 --end 120 --every 3 --out cache/research/teded/strips`

Expected outputs per video: `<name>.words.json`, `<name>.study.json`, `<name>.sheet-NN.jpg`; plus
`fingerprint.json` and `cues.txt` once.

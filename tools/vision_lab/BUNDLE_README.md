# Vision lab bundle

This is what the vision model learned, packed to send back. It holds JSON and Markdown only:
- no video, frames, audio or transcripts;
- strings that shared 8+ consecutive words with a narration are redacted.

| path | what |
|---|---|
| `run_manifest.json` | model names, server version, code, schema and skill hashes, config, selftest, whether validation passed |
| `selection.json` | the study set: video ids, titles, years, durations, a hashed animation credit (no names) |
| `measures/<video>.json` | the code's measurements per video: shots with times, cut type, motion per second, palette hex, brightness, detail, speech rate, holds, loudness |
| `shots/<video>/<shot>.json` | level 1: what the model saw in each shot (schema `shot`) |
| `videos/<video>.json` | level 2: each film as a system (schema `video`) |
| `batches/batch_NN.json` | level 3a: a style guide per batch of 10 videos |
| `style_guide.json`, `style_guide.md` | level 3b: the corpus style guide: house constants, style families, technique library, rules, avoid list, judge rubric |
| `stats.json` | the code's frequency tables and distributions over all shots and videos (every count the guide may cite) |
| `calibration/report.json` | how far to trust all of the above (gates); `calibration/*` holds the raw test outputs |
| `calib_consistency/`, `calib_crossmodel/` | the re-annotated sample (same model, another seed; second model) |
| `judge/<film>/...` | reviews of Loom films (one file per beat, plus `_film.json`) |
| `validation.json` | schema, evidence, range and copyright checks at pack time |
| `usage_*.json` | tokens used per stage |

To read it on the Loom side, run:

```
py tools/vision_lab/vl.py ingest bundle_<run>.zip --into docs/research/vision
```

This validates the bundle again and writes `INGEST.md`.

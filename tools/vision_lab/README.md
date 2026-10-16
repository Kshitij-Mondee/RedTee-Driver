# Vision lab: a vision model watches the films, so Claude does not have to guess

**Three kinds of eyes and ears, each where it is strong:**
1. **Code measures every frame.** Optical-flow speed for every frame gives movements, how they are eased, stutters
   and one-frame flashes. Also cuts, holds, palette, sound hits, and whether cuts and movements land on them.
   Models sample only 1 to 4 frames per second, so they cannot judge smoothness; code can.
2. **The vision model (A)** describes what it sees: composition, drawing language, explanation devices, joins,
   characters, text.
3. **The audio model (C, optional)** describes music, sound effects, voice delivery and silence.

**What this does.** An open vision-language model, served on a RunPod GPU pod, studies 100 TED-Ed films shot by
shot. It then writes a style guide (techniques, rules, a scoring rubric) that Loom is built from, and judges Loom
films against that guide.

**The division of labour:**
- **Code measures everything that can be measured:** cuts, motion per second, holds, black and frozen frames,
  palette hex values, brightness, speech timing.
- **The model describes only what it is shown.** Every reference it makes (shot ids, times) is checked by code.
- **What comes back is one zip** of JSON and Markdown. It holds no video, no frames and no transcripts. Claude
  reads that, and never the films.

Design and reasoning: `docs/strategy/2026-10-03-vision-lab.md` (D-101).

---

## 1. The model

| role | model | why | GPUs |
|---|---|---|---|
| **A: the watcher (recommended)** | `Qwen/Qwen3.5-122B-A10B-FP8` | Apache 2.0. Video scores on its model card are level with the 397B flagship: VideoMME 87.3 with subtitles and 83.9 without, MLVU 87.3, LVBench 74.4 (flagship: 87.5 / 83.7 / 86.7 / 75.5). A native image and video model. | 2x H200 (TP 2) or 4x H100 80GB (TP 4), from the vLLM recipe |
| A on one GPU | `Qwen/Qwen3.5-122B-A10B-GPTQ-Int4` | the same model in 4-bit, a little less accurate | 1x H100 or A100 80GB |
| **B: the second rater** | `Qwen/Qwen3.8-27B` (Apache 2.0, August 2026) | the newest Qwen: dense 27B, image and video. Used only to measure agreement with A on a sample. The card publishes no video scores; Qwen3.5-27B, the same architecture, scores VideoMME 87.0 / 82.8. | 1x 80 GB GPU (BF16), or `-FP8` on one 48 GB GPU |
| fallback, largest | `Qwen/Qwen3.5-397B-A17B` FP8 | only if A fails its calibration gates; +0.2 VideoMME for about 3x the cost | 8x H100 or H200 |
| other family, optional | Kimi K2.5 (Moonshot, open weights, VideoMMMU 86.6) | a different model family as an independent check; 1T parameters | 8x H200 |

The best closed models (Gemini 3 Pro and others) score higher on the newest video benchmarks. You asked for
RunPod, so this lab uses open weights only.

## 1b. On ONE H100 80GB (Kshitij's pod, `gkurzsgesgat`, EU-FR-1)
`config.yaml` ships for this pod:
- **A = `Qwen/Qwen3.8-27B` (BF16).** Its earlier version, Qwen3.5-27B, scores VideoMME 87.0 / 82.8, against
  87.3 / 83.9 for the 122B model.
- **B = `Qwen/Qwen3.5-122B-A10B-GPTQ-Int4`,** served after A is stopped. The vLLM recipe puts its 4-bit version
  on a single 80 GB GPU.

Before starting the pod:
1. **Add a 250 GB volume at `/workspace`** (Volumes tab, or Edit Pod → Volume Disk). The 60 GB container disk is
   too small, and it is wiped when the pod stops; `/workspace` survives a stop. The 250 GB is an estimate:
   - A is about 56 GB and B about 70 GB;
   - the videos about 15 GB;
   - stills and clips about 20 GB;
   - the venv and Whisper about 20 GB.
2. **Start it.** The "Runpod Pytorch 2.8.0" template is fine (Ubuntu 24.04, CUDA 12.8). `setup.sh` builds its own
   venv on the volume.
3. On one GPU everything runs one model at a time. **Time and cost are estimates:**
   - prepare: 1-2 h;
   - shots: 5-8 h;
   - videos and synthesis: 2 h;
   - calibration: 2 h;
   - about 12 h at $3.49 per hour, roughly $45, plus volume storage while stopped.

   Run the 5-film pilot first, as below.

## 1c. Where the files live: the 100 GB volume is enough
| On the volume `/workspace` (kept when the pod stops) | estimate | On the pod's own 60 GB disk (wiped when it stops) | estimate |
|---|---|---|---|
| Qwen3.8-27B weights (`/workspace/hf`) | ~56 GB | Python env `/root/venv` (vLLM, PyTorch, CUDA) | ~18 GB |
| 100 videos at 480p | ~4 GB | Whisper large-v3 `/root/whisper` | ~3 GB |
| prepared stills, clips and measurements | ~4-5 GB | download caches | ~3 GB |
| results, raw answers, the bundle | under 1 GB | | |
| **about 65 GB, so about 35 GB free** | | **about 24 GB** | |

- **After every pod restart,** run `bash setup.sh qwen38-27b` again. It rebuilds the pod-side env in about 10
  minutes and skips the weights that are already on the volume.
- **Prepare finishes in one session** (Whisper lives on the pod). If the pod stops in the middle, re-run
  `prepare`: it skips the finished films.
- **Check space any time** with `bash disk_report.sh`.
- **Weights left by another run:** `python3 find_model.py` finds a model anywhere on the volume (an HF cache
  anywhere, or a plain folder) and says whether it is complete. `setup.sh` runs it with `--link` and reuses a
  complete copy instead of downloading again; `serve.sh` serves a plain folder under the model's own name.
- **The second-opinion model B and the ears model C each need about 70 GB.** They do not fit beside A on 100 GB.
  To run one, delete A first (`rm -rf /workspace/hf/hub/models--Qwen--Qwen3.8-27B`) and download it again
  afterwards (a few minutes on RunPod), or grow the volume.

## 2. Rent the pod (if you start fresh)

1. Create a **network volume** of **400 GB** in the same data centre as the GPUs. This is an estimate:
   - the model is about 125 GB;
   - 100 videos at 1080p are about 15 GB;
   - stills and clips are about 20 GB;
   - the Python venv and Whisper are about 25 GB;
   - the rest is headroom.
2. Deploy a pod:
   - **2x H200 SXM** (recommended; about $9 per hour on Secure Cloud) or **4x H100 SXM 80GB**;
   - the template "**RunPod PyTorch**" (Ubuntu, CUDA 12.x), with the network volume attached at `/workspace`;
   - container disk 50 GB;
   - expose port 8888 (Jupyter, for uploads) and SSH.
3. Open a terminal on the pod (web terminal or SSH).

## 3. Get the files onto the pod

**The lab code.** It lives in `Video-Engine/tools/vision_lab`. Upload that folder to `/workspace/vision_lab`
(drag and drop it into Jupyter, or `runpodctl send vision_lab`), then:

```bash
cd /workspace/vision_lab && bash setup.sh qwen38-27b           # 20-40 min: vLLM, ffmpeg, Whisper libs, model A's weights
```

**The videos: 480p, as downloaded** (Kshitij's choice, 2026-10-03). The lab never upscales.
- 480p is enough for composition, colour, motion, pacing, joins and structure. Small text and thin lines are judged
  with lower confidence, and the model is told the resolution.
- 100 films at 480p are about 4 GB.
- Upload the folder with the `.mp4`, `.en.srt` and `.info.json` files together to `/workspace/videos/ted-ed`:
  - with runpodctl: `runpodctl send C:\Users\Admin\Videos\Ted-Ed` on the PC, then `runpodctl receive <code>` on
    the pod;
  - or with scp: `scp -P <port> -r "C:\Users\Admin\Videos\Ted-Ed\*" root@<pod-ip>:/workspace/videos/ted-ed/`.

**On a 100 GB volume** the main run fits, at about 85 GB (estimate):
- model A in BF16, about 56 GB;
- the venv, about 18 GB;
- Whisper, about 3 GB;
- the videos, about 4 GB;
- stills and clips, about 4 GB.

Model B (the 122B in 4-bit, about 70 GB) does NOT fit beside A. Before `calibrate crossmodel`, run
`rm -rf /workspace/hf/hub/models--Qwen--Qwen3.8-27B` and then download B. Re-download A later if you judge more
films.

**For the judge's calibration**, upload two old Loom films and their plans:
- the two step-7 MP4s from your PC, `projects/phishing-report/renders/phishing-report.mp4` and
  `projects/feedback-that-lands/renders/feedback-that-lands.mp4`;
- for each lesson, `build/manifest.json`, `plan/script.json` and `plan/storyboard.json`.

Put them in `/workspace/loom/<lesson>/`, keeping those sub-paths.

## 4. Run it: the pilot first, then everything

Do this in every new terminal:

```bash
source /root/venv/env.sh && cd /workspace/vision_lab
python vl.py check-env                 # every line should say ok; it warns if the videos are under 720p
python vl.py select                    # picks 100: spread over years, at most 4 per animation credit
python vl.py prepare --workers 6       # BEFORE the server starts (Whisper uses the GPU). About 1-2 h for 100 (estimate)
# optional, the EARS (music, sound effects, voice delivery). Needs about 70 GB more on the volume, so a volume of 150 GB
# or more; on 100 GB, skip it (the code's sound measurements still run):
#   hf download Qwen/Qwen3-Omni-30B-A3B-Instruct && bash serve.sh qwen3-omni   # wait for startup
#   python vl.py selftest --model c && python vl.py sound
#   pkill -f "vllm serve" && rm -rf /workspace/hf/hub/models--Qwen--Qwen3-Omni-30B-A3B-Instruct
bash serve.sh qwen38-27b               # then wait for "Application startup complete" in /workspace/vision_lab_work/server.log
python vl.py selftest                  # must print ALL GOOD (text, image, video, JSON schema, thinking)
```

**Pilot: 5 films, send them to me first.** This catches prompt problems before the money is spent.

```bash
P=$(python -c "import json;print(','.join(v['id'] for v in json.load(open('/workspace/vision_lab_work/selection.json'))['videos'][:5]))")
python vl.py shots --only $P && python vl.py videos --only $P && python vl.py synthesize --only $P --batch 5
python vl.py validate && python vl.py pack --force      # -> /workspace/vision_lab_work/bundle_tedEd_2026-10.zip
```

Download the zip and put it in `Video-Engine/docs/research/vision/inbox/`. Tell me it is there. I check it
against the measurements and adjust the skills or schemas. You then upload the changed files and continue.

**The full run** is `bash run_full.sh` (D-113): one heavy step at a time, resumable, with a summary per step.
The steps it runs, for reference:

```bash
python vl.py preflight                 # config vs the server's own log (context, KV), selftest, lock, budgets per call
python vl.py remeasure                 # upgrades measure.json to the current measure version (no decoding)
python vl.py shots                     # about 6,300 shots (TED-Ed run: ~10 h at 12 workers, measured)
python vl.py videos                    # whole-film records
python vl.py distill-prep              # text inputs for the off-pod style guide (D-110)
python vl.py status
```

What the client does on its own (D-113), so a run does not fail the way the TED-Ed run did:
- **admission:** a call waits until its prompt plus max_tokens fits the KV cache (the server's number from
  `server.log` when it is smaller than the config's), so co-scheduled phases queue instead of timing out;
- **context:** a prompt that cannot fit the context is refused before it is sent; max_tokens shrinks to fit;
- **timeouts:** per call, from prompt size and max_tokens; a timed-out call is retried once with more time, never
  resent unchanged;
- **thinking cap:** an answer cut off inside its thinking is retried with 1.5x room, then with thinking off; it is
  counted as `thinking_caps`, never as a grammar runaway;
- **schema:** every answer is checked against its schema; a failure gets a repair turn naming the broken rule;
- **records:** every attempt is kept in `raw/` with its thinking text, and in `raw/calls.jsonl`; usage accumulates
  across invocations in `out/usage_<kind>.json`.

**Calibration** tells us how far to trust all of this.

```bash
python vl.py calibrate plant           # 10 TED-Ed films get 5 planted defects each (black, freeze, placeholder bars,
                                       #   cut-off text, tiny text, low-contrast text, grain, a hard seam)
python vl.py calibrate judge-planted   # the judge has to find them, in 6 s windows
python vl.py calibrate consistency     # 10 % of shots again, same model, another seed
python vl.py calibrate loom --lesson phishing-report --film /workspace/loom/phishing-report/renders/phishing-report.mp4 \
   --manifest /workspace/loom/phishing-report/build/manifest.json --script /workspace/loom/phishing-report/plan/script.json \
   --storyboard /workspace/loom/phishing-report/plan/storyboard.json
python vl.py calibrate loom --lesson feedback-that-lands ...   # same, for the other lesson
# second rater: stop the server (pkill -f "vllm serve"), then: hf download Qwen/Qwen3.5-122B-A10B-GPTQ-Int4 ;
#   bash serve.sh qwen35-122b-int4 ; wait for startup ; then:
python vl.py calibrate crossmodel
python vl.py calibrate report          # writes calibration/report.json: every configured gate, run, skipped by
                                       #   config (calibration.skip_gates) or NOT RUN (which fails all_pass)
python vl.py validate && python vl.py pack   # pack also writes raw_<run>.zip (local only)
```

A plant counts as found when the judge reports ANY defect at its time and place (IoU >= `match_iou`); whether the
label agrees is reported beside it (`label_agrees`). A style guide that does not cover this run's films is a
validate error and is left out of the bundle.

Send back `bundle_tedEd_2026-10.zip` (well under 100 MB) and `raw_tedEd_2026-10.zip` (local only).

**Stop the pod as soon as `pack` is done.** The volume keeps everything for a later judge run.

## 4b. The maturity check on the golden set (D-102 E3)
- On the PC: `py -m loom golden export`, then copy `cache/golden/export/` to `/workspace/golden` (runbook step 3).
- On the pod, with the server up: `python vl.py maturity` (60 frames, 2 runs each, blind; skill
  `45_maturity_rater.md`, schema `maturity`).
- Back home: `py -m loom golden report --judge <bundle>/maturity/scores.json`. The judge may gate only at Spearman
  0.7 or better with Kshitij's ratings. A judge that gives every frame the same score exits 1 and can never pass.

## 5. Later: judging new Loom films

Upload the film and its plan, start the server, then:

```bash
python vl.py judge --film film.mp4 --manifest build/manifest.json --script plan/script.json --storyboard plan/storyboard.json
python vl.py pack
```

The judge scores every beat against the rubric the corpus produced, and lists defects with times, boxes,
severity and fix route.

## 6. What the gates mean

These are in `config.yaml` and in `calibration/report.json`.

| gate | threshold | if it fails |
|---|---|---|
| consistency (same model, another seed) | 75 % of labels agree | the shot labels are noisy; Claude uses only frequent patterns |
| cross-model (A vs B) | 65 % agree | a label is model-specific; treat it as an opinion |
| planted gross defects found (black, freeze, placeholder, cut-off text) | 85 % | the judge cannot be trusted for gross defects; code checks only |
| planted subtle defects found (tiny text, low contrast, grain, seam) | 60 % | subtle findings stay "to check" |
| false alarms on clean windows | at most 20 % | the judge is too harsh; its majors are re-weighted |
| step-7 beats that the frame audit called broken and the judge also flags | 70 % | the judge misses what Kshitij hated: we retune before using it |
| style families vs animation credits | 60 % of same-credit pairs grouped together | the families are not real; use the techniques, not the families |

## 7. Rules the model works under (the files in `skills/`)

- `00_rules.md`:
  - describe only what is visible, tied to a time;
  - production terms;
  - generalise devices, never retell content;
  - never copy narration or on-screen text, and no artist names;
  - use the code's numbers;
  - be calibrated.
- `10_shot_annotator.md`, `20_video_analyst.md`, `30_style_distiller.md`, `40_film_judge.md`: one per level.
- `loom_capabilities.md`: what Loom can do, so "what Loom lacks" is concrete.
- `default_rubric.json`: used until the corpus has written its own.
- `schemas/*.json`: the exact shapes. The server is told to follow them (structured output), and the code
  checks every answer against them. A failed answer gets a repair turn with the exact errors.

## 8. Troubleshooting

- **The server fails to start with out-of-memory:** lower `--gpu-memory-utilization` to 0.85, or use the int4
  profile on fewer GPUs.
- **The selftest video check fails:** set `media.shot_video: frames` in `config.yaml`. The model then sees
  stills only; motion comes from the code's numbers.
- **Image or video gives "not allowed" errors:** the server's `--allowed-local-media-path /workspace` must
  cover the files. The selftest falls back to base64 automatically.
- **Many repairs** (`raw/` holds every attempt): lower `server.workers`, or switch the shot pass to thinking in
  `config.yaml` (`thinking.shots: true`). That is slower, often better.
- **`validate` errors:** they say exactly which file and field. Re-running the stage redoes only missing files.
  Delete a bad file to redo it.

## 9. Test it without a GPU

```bash
python mock_server.py --port 8011 &     # a fake server that returns schema-valid filler
# point server.base_url at http://127.0.0.1:8011/v1 in a copy of config.yaml, then run the same commands
```

The mock proves that the plumbing works. It says nothing about quality. Its fake evidence makes `validate` fail,
which is correct.

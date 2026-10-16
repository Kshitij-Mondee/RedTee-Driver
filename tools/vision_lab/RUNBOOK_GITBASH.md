# Step by step from Git Bash on the PC (Kshitij's pod, one H100, 100 GB volume)

**Two kinds of steps:**
- **[PC]** lines run in Git Bash on your PC.
- **[POD]** lines run on the pod, after you connect with `ssh` (step 4).

**Paste one block at a time** and wait for it to finish before the next.

## 1. [PC] Make an SSH key (once; skip if `ls ~/.ssh/id_ed25519.pub` already shows a file)
```bash
ssh-keygen -t ed25519 -C "runpod" -f ~/.ssh/id_ed25519 -N ""
cat ~/.ssh/id_ed25519.pub
```
Copy the whole line it prints, which starts `ssh-ed25519`. In RunPod, go to **Settings → SSH Public Keys**, paste it
and save.

RunPod adds keys only when a pod **starts**. If the pod is already running, stop it and start it again; the volume
keeps everything.

## 2. [PC] Note the pod's address
In RunPod, open the pod, click **Connect**, then find **"SSH over exposed TCP"**. It shows something like:

`ssh root@213.173.110.12 -p 22078 -i ~/.ssh/id_ed25519`

Put your own numbers into Git Bash:
```bash
POD_IP=213.173.110.12      # <- yours
POD_PORT=22078             # <- yours
ssh -p $POD_PORT root@$POD_IP "nvidia-smi --query-gpu=name,memory.total --format=csv && df -h /workspace"
```
- Answer `yes` to the fingerprint question.
- You should see `NVIDIA H100 ... 81559 MiB` and the 100 GB volume.
- If you open a new Git Bash window later, set `POD_IP` and `POD_PORT` again.

## 3. [PC] Send the lab and the videos to the pod
```bash
cd /c/Users/Admin/Desktop/Video-Engine/tools && tar czf ~/vision_lab.tgz vision_lab
scp -P $POD_PORT ~/vision_lab.tgz root@$POD_IP:/workspace/
```
Check the videos first: how many, and how big.
```bash
cd /c/Users/Admin/Videos/Ted-Ed && ls *.mp4 | wc -l && du -sh .
```
Then stream them over. Spaces and [brackets] in the names are fine this way:
```bash
ssh -p $POD_PORT root@$POD_IP "mkdir -p /workspace/videos/ted-ed"
tar cf - *.mp4 *.srt *.info.json | ssh -p $POD_PORT root@$POD_IP "cd /workspace/videos/ted-ed && tar xf - --no-same-owner"
```

**Also send the golden-set frames** (60 small stills, for the maturity check, D-102 E3). They stay on your pod;
the bundle never carries images.
```bash
cd /c/Users/Admin/Desktop/Video-Engine && py -m loom golden export
cd cache/golden/export && tar cf - . | ssh -p $POD_PORT root@$POD_IP "mkdir -p /workspace/golden && cd /workspace/golden && tar xf - --no-same-owner"
```

## 4. [PC] Connect to the pod
```bash
ssh -p $POD_PORT root@$POD_IP
```
Your prompt changes to `root@...`. Everything below up to step 9 runs there.

## 5. [POD] Unpack and set up (20-40 min; inside tmux, so a dropped connection does not stop it)
```bash
apt-get update -qq && apt-get install -y -qq tmux > /dev/null
tmux new -s lab
```
**Using tmux:**
- To leave it running and disconnect, press `Ctrl+B`, then `D`.
- To come back after reconnecting (step 4), run `tmux attach -t lab`.

Inside tmux, unpack, then FIRST look at what is already on the volume (another run may have left the Qwen3.8-27B
weights there). Both commands only read; they delete nothing:
```bash
cd /workspace && tar xzf vision_lab.tgz --no-same-owner && cd vision_lab && sed -i 's/\r$//' *.sh
python3 find_model.py
bash disk_report.sh
```
- `find_model.py` looks everywhere on the volume, in any layout, and says COMPLETE or INCOMPLETE (missing shards,
  unfinished downloads).
- **Send me both outputs before going on.** If something big that we do not need is there, we decide together
  what to delete.

Then set up. `setup.sh` reuses a COMPLETE copy it finds (it links it, so nothing big is downloaded again), and
resumes an INCOMPLETE Hugging Face download instead of starting over:
```bash
bash setup.sh qwen38-27b-fp8
```
It ends by printing the vLLM version, the model, and how full the volume and pod disk are.

## 6. [POD] Check everything
```bash
source /root/venv/env.sh && cd /workspace/vision_lab
python vl.py check-env
python vl.py select
```
- `check-env` should say ok on every line, and "note: 480p source", which is fine.
- `select` prints how many films it chose.

**Send me both outputs.**

## 7. [POD] Prepare only the 5 pilot films (a few minutes; the GPU is free, so Whisper is fast)
```bash
P=$(python -c "import json;print(','.join(v['id'] for v in json.load(open('/workspace/vision_lab_work/selection.json'))['videos'][:5]))")
echo $P
python vl.py prepare --only $P --workers 3
```

## 8. [POD] Start the model and test it
```bash
bash serve.sh qwen38-27b-fp8
tail -f /workspace/vision_lab_work/server.log
```
Wait for the line `Application startup complete`. The first start takes several minutes. Then press `Ctrl+C`.
That stops only the log view; the server keeps running.
```bash
python vl.py selftest
```
**Send me the whole selftest output,** even if it says ALL GOOD.

## 9. [POD] The pilot (about 30-60 min)
First the maturity check on the golden set (60 frames, twice each, a few minutes). It tells us whether the model's
taste matches yours before it judges anything:
```bash
python vl.py maturity
```
It prints a WARNING and exits 1 if the model gives every frame the same score; send me the output either way.
Then the films:
```bash
python vl.py shots --only $P
python vl.py videos --only $P
python vl.py synthesize --only $P --batch 5
python vl.py validate
python vl.py pack --force
```
`validate` reports coverage errors because only 5 of 100 films are done; that is expected for the pilot.

## 10. [PC] Bring the pilot bundle home
Open a new Git Bash window (set `POD_IP` and `POD_PORT` again):
```bash
mkdir -p /c/Users/Admin/Desktop/Video-Engine/docs/research/vision/inbox
scp -P $POD_PORT root@$POD_IP:/workspace/vision_lab_work/bundle_tedEd_2026-10.zip /c/Users/Admin/Desktop/Video-Engine/docs/research/vision/inbox/
```
Tell me it is there. I ingest it and compare the model's maturity scores with your ratings
(`py -m loom golden report --judge <the bundle's maturity/scores.json>`). **Stop the pod while I review it** (the volume keeps everything).

## The full run, unattended (after the pilot is reviewed) - updated 2026-10-06 (D-113)
1. Stop the server and prepare every film (Whisper needs the GPU):
   `pkill -f "vllm serve"; python vl.py prepare --workers 3`. It exits 1 and names any film it could not prepare.
2. Then, in tmux: `bash run_full.sh`. It starts the server, then runs, one heavy step at a time:
   selftest, preflight, remeasure, shots, videos, calibrate (plant, judge-planted, consistency, report), receipts,
   validate, distill-prep, pack. Every step skips finished work; the log is `/workspace/vision_lab_work/run_full.log`
   and it ends with a SUMMARY line per step (exit code and minutes).
   - `preflight` stops the run before any paid step if the config does not match the server (context, KV size from
     `server.log`), the selftest failed, or another heavy step is running.
   - synthesize does NOT run on the pod: the style guide is written off the pod from the bundle (D-110).
     `SYNTH_ON_POD=1 bash run_full.sh` runs it at the end, alone on the server.
   - A second heavy step started by hand while this runs is refused by the phase lock (L-213).
3. Copy BOTH zips home (step 10): `bundle_<run>.zip` and `raw_<run>.zip`. The raw zip holds every answer, the
   model's thinking text, `calls.jsonl` and the logs. It may quote narration: it stays local, never published.

## After the pilot (older manual sequence; SUPERSEDED by run_full.sh above, kept for the record)
Restart the pod, then:
1. Connect (step 4).
2. Run `tmux new -s lab` and `bash /workspace/vision_lab/setup.sh qwen38-27b-fp8` (the pod disk was wiped).
3. Run:
   ```bash
   source /root/venv/env.sh && cd /workspace/vision_lab
   python vl.py prepare --workers 3        # all 100, about 1-2 h, BEFORE starting the server
   bash serve.sh qwen38-27b-fp8                # wait for startup, then:
   python vl.py shots && python vl.py videos && python vl.py synthesize
   python vl.py calibrate plant && python vl.py calibrate judge-planted && python vl.py calibrate consistency
   python vl.py calibrate report && python vl.py validate && python vl.py pack
   ```
4. Copy the bundle home with step 10.

## If something goes wrong
| problem | what to do |
|---|---|
| `Permission denied (publickey)` | The key was added after the pod started. Stop and start the pod, then check `POD_PORT` again (it can change). |
| `hf: command not found` in setup | Run `source /root/venv/bin/activate && huggingface-cli download Qwen/Qwen3.8-27B-FP8`, then run `bash setup.sh qwen38-27b-fp8` again. |
| The server log shows `out of memory` | Run `pkill -f "vllm serve"`, set `workers: 4` in `config.yaml`, and start `serve.sh` again. |
| Anything else | Copy the last 40 lines (`tail -40 /workspace/vision_lab_work/server.log` for the server) and send them to me. |

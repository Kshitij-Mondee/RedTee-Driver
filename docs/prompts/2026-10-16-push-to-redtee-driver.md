# Pushing Video-Engine to GitHub (RedTee-Driver), 2026-10-16

Kshitij: "once everything is done and there is no other session making changes, push the code to this new repo, I mean
the entire video-engine to this new repo I made for it. https://github.com/Kshitij-Mondee/RedTee-Driver.git. I want you
to be careful with the videos and stuff. i don't want already rendered videos or their files on the github."

Asked and answered the same day:
- **Visibility:** the repo was public; he chose to make it private. Done (`gh repo edit ... --visibility private`,
  checked: PRIVATE).
- **Lessons (projects/):** plans only: each lesson's `project.json`, `plan/`, `scenes/` code and small text reports. No
  `build/`, `renders/`, `audio/`, `media/`, `snapshots/`, no images, no session stream logs (`logs/shuttle/stream_*.jsonl`,
  up to 38 MB each).
- **Docs stills:** kept (lab strips, contact sheets, before and after frames the guides link to); no MP4 or audio.

Always out, whatever the answers:
- secrets: `.env` (keys are Kshitij's), `loom.config.json`; a secrets scan of everything staged before the first push;
- every video and audio file (mp4, webm, mov, mkv, avi, wav, mp3, m4a, aac, ogg, flac), anywhere;
- reference material we study but never republish (CLAUDE.md rule 11): `docs/research/vision/inbox/`,
  `docs/research/vision/tedEd_2026-10/` frames, and any other folder of frames from reference videos;
- `node_modules/`, `models/`, `cache/`, `bench/`, `__pycache__/`, `datasets/` if it holds exports with lesson content
  (to look at before the push);
- the blind test sets (`docs/research/*/blind*/`), which are copies of rendered films.

When: after the layout guard trial is rendered and rated and no other session is changing the folder (ListAgents shows
none busy here, and STATE has no MEASURED RUN IN FLIGHT line).

Steps: `git init`; extend `.gitignore` with the rules above; `git add -A`; list the staged files and their sizes; scan them
for secrets (API key shapes, tokens, emails) and for any media or reference frames that slipped in; one commit; add the
remote; push `main`. Report what went in and what was left out.

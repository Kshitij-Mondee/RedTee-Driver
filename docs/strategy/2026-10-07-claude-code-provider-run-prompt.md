# Prompt: run the API pipeline end to end with Claude Code as the Claude provider (subscription), logging every token

STATUS: PROMPT (written 2026-10-07 for Kshitij to paste into Claude Code, opened in the Video-Engine folder). Nothing
in it has run yet.

Run this AFTER `docs/strategy/2026-10-07-fix-prompt.md` has finished and its fix report exists
(`docs/research/2026-10-0X-bench-fix-report.md`). Revised the same day: three lessons (Claude only, mixed, Gemini
only) instead of one, and a Claude-only profile where Opus plans and storyboards (Kshitij, 2026-10-07; this is the
one exception to "no Opus for now").

---

```
You are working in the Loom Video-Engine folder (this repo). Read CLAUDE.md, docs/context/README.md,
docs/AGENT_LEARNINGS.md (all of it), docs/AGENTS_RUNBOOK.md and docs/strategy/2026-10-08-run-plan.md before you
touch anything. Rule 0 applies: every claim you act on must be one you checked in this session by running something.
Windows, Git Bash: use `py`, forward slashes.

GOAL
Make THREE new lessons end to end with the API agent pipeline (`py -m loom agents run`, the version with parity
context, snapshot-before-submit, the defect router, D-119..D-121, and the fixes of
docs/strategy/2026-10-07-fix-prompt.md), same topic, so they can be compared:
  1. Claude only (profile claude-code-only): every role on Claude, served by Claude Code itself in headless mode on
     my Claude subscription instead of the Anthropic API;
  2. Mixed (profile claude-code-mix): Claude roles via Claude Code, planning on GPT, checkers on Gemini Flash;
  3. Gemini only (profile gemini-balanced, already exists): no Claude at all, billed to the Gemini key.
Render all three MP4s. Log every token: the pipeline's calls AND your own session's.
First check the fix report exists (docs/research/2026-10-0X-bench-fix-report.md) and the suite is green; if not,
STOP and tell me.

STEP 1. Verify how headless Claude Code works on THIS machine (no guessing from memory)
- Run `claude --version` and `claude --help` (and `claude -p --help` if it differs). Write down the exact flags that
  exist for: print mode, output format json, model choice, system prompt (replace and append), max turns, built-in
  tool allow/deny (or disabling all tools), structured output / JSON schema, adding a readable directory, session
  persistence, and reading the prompt from stdin.
- Make one tiny call: `echo "Reply with OK" | claude -p --output-format json --model sonnet` (adapt to the real
  flags). Show the JSON. Confirm it contains usage (input, output, cache read, cache creation), the cost field, the
  model used, and the session id.
- Subscription, not API billing: if ANTHROPIC_API_KEY is set in the environment, Claude Code bills the API instead of
  the subscription. The provider must REMOVE ANTHROPIC_API_KEY (and ANTHROPIC_AUTH_TOKEN) from the child process
  environment. Verify with `claude` status or the JSON that the call ran on the subscription login. If headless needs a
  long-lived login, use `claude setup-token` and pass CLAUDE_CODE_OAUTH_TOKEN to the child only; never print, log or
  commit it (keys rule, same as Video-Engine/.env).
- Test whether an image can reach the model in headless mode: save a known PNG (a red square with the word TEST) to a
  temp folder and ask the model to Read it and say what it shows, with only the Read tool allowed and that folder
  added. Record whether it works.
Write what you found to docs/research/2026-10-0X-claude-code-headless.md (flags, the sample JSON with nothing
secret, the image test). If headless mode cannot be made to use the subscription, STOP and tell me; do not fall back
to the paid API silently.

STEP 2. Add a provider `claude_code` to loom/agents/llm (follow the shape of anthropic.py and base.py)
- `complete(req)` turns one loom Request into ONE headless call and returns a loom Response, so the runtime loop,
  budget, sessions, defect router and resume keep working unchanged:
  - system: req.system blocks joined, passed as the replacement system prompt (not appended to Claude Code's own
    coding prompt, unless replacement is impossible; then say so in the research note);
  - messages: rendered as a transcript in the prompt, sent on STDIN (Windows argv is capped at about 32k chars);
  - tools: Claude Code cannot take loom's tool schemas directly in print mode, so describe req.tools in the system
    prompt and require the reply as JSON {"text": str, "tool_calls": [{"id","name","arguments"}]}, enforced with the
    JSON-schema flag if it exists, else parsed and validated, with one repair retry on invalid JSON; tool_choice
    "any"/<name> is stated as a hard rule in the prompt;
  - all of Claude Code's built-in tools disabled, max turns 1, no session persistence, EXCEPT when a tool result in
    req.messages carries images: write them to a per-call temp folder, allow only Read on that folder, raise max turns
    just enough to read them (use whatever STEP 1 proved works);
  - model: map alias to `opus` / `sonnet` / `haiku` (Opus ONLY in the claude-code-only profile, nowhere else);
    effort: map to the thinking setting only if a flag for it exists, else ignore and note it;
  - usage: map the JSON usage into loom Usage (input, cached, cache_write, output); cost: put the JSON's cost figure in
    Response.extra["notional_usd"] and charge 0 billed USD to the budget, so `--budget` still governs the paid
    OpenAI/Gemini roles; log both numbers in logs/llm_calls.jsonl;
  - errors: a subscription usage-limit message is NOT a gate failure and NOT a billing error: wait and retry with
    the reset time if the message gives one, else back off up to 15 min, logging each wait; any other non-zero exit is
    an LLMError with the redacted stderr;
  - timeouts: 1800 s per call (same as base.py).
- models.json: add aliases `cc-opus`, `cc-sonnet` and `cc-haiku` (provider claude_code), priced like the API
  models so the notional cost is comparable with yesterday's bench.
- Profile `claude-code-mix` = smart-mix with every Claude role moved to cc-sonnet (script, storyboard_outline,
  storyboard, scene) and tweak to cc-haiku. Planning stays gpt-6.1-sol, checkers stay gemini-3.8-flash, so the
  checkers are still another family.
- Profile `claude-code-only`: Opus does the thinking and storyboarding, Sonnet the code:
  cc-opus for brief, knowledge, pedagogy, script, storyboard_outline, storyboard and critic; cc-sonnet for scene
  and skeptic (the skeptic must not be the same model as the author of the facts); cc-haiku for persona_pick and
  tweak. If the fix prompt already added these profile files, check them against this list.
- `py -m loom agents doctor --profiles claude-code-only,claude-code-mix,gemini-balanced` must check the claude
  binary, the login, one tiny call per Claude model, and the Gemini and OpenAI keys.
- Tests (tests/suites, offline, keyless): a fake `claude` executable on PATH that returns canned JSON, proving: stdin
  transport, ANTHROPIC_API_KEY stripped from the child env, tool-call JSON parsed into ToolCalls, invalid JSON
  repaired once then failed, usage-limit message waits instead of failing, notional cost logged and billed cost 0.
  Show each test can fail (break the code once, see red, restore). Run the full suite.

STEP 3. Run the three lessons end to end, one after another (not in parallel: the subscription has usage limits
and the two Claude runs share them)
- Same topic and settings as yesterday's bench, so the results are comparable with the five videos rated 1 to 2:
  for P in claude-code-only claude-code-mix gemini-balanced; do
    py -m loom agents run cc-20261008-$P --profile $P --context parity --until render --budget 6 \
       --topic "How to give feedback that changes behaviour, not just feelings" --style story-cartoon --length 2 \
       --audience "corporate employees" --approve-knowledge-as "agent, unattended (Kshitij, Claude Code run)"
  done
  (Check `py -m loom agents run --help` and the runbook for the exact way a NEW project is started; use it. Use the
  real date in the ids.) --budget caps only billed USD (OpenAI, Gemini); Claude Code calls bill 0 and are logged
  as notional.
- Exit codes: 0 rendered; 2 check still fails after the repair rounds (read qa/defects.json); 4 budget; 5 out of
  credit. On 2, do NOT force-render first: read qa/defects.json, say whose defects remain and why the router did
  not fix them, fix the cause if it is in the engine or a role card, and resume. Force-render only with my
  approval, with `--reason`.
- Watch each run: if a stage loops or a provider errors, stop, find the cause in the trace, fix, resume with the
  same command. Log every fix and routing choice with `py -m loom note`.

STEP 4. Prove the result (you look at the frames, numbers alone are not proof)
- `py -m loom run <id> check` output, qa/defects.json, the contact sheets, and frames from the MP4
  (`py -m loom strips` or ffmpeg at 1 frame per 3 s). Look at every beat. Report per beat: stuck elements from earlier
  beats, elements shown before their beat, empty or blurred frames while the voice speaks, text cut off the frame,
  repeats, characters.
- `py tools/film_audit.py <id>`; say which of its numbers you trust and why.
- Do this for each of the three lessons, then compare them with each other and with yesterday's five
  (projects/bench-20261006-151439-*, ratings in docs/research/2026-10-07-bench-postmortem.md): length against the 2
  minutes asked, new scenes drawn, check errors left and whose, and the defect counts per beat (stuck, preshown,
  empty, blurred, off-frame, repeat, static, picture contradicts narration). Same style for all, so this compares
  model mixes, not styles (D-122).

STEP 5. Token and cost log (required)
- From logs/llm_calls.jsonl: a table per stage and per role: calls, input, cached, cache write, output, notional USD
  (Claude Code), billed USD (OpenAI, Gemini), wall time.
- Your own session: sum the usage of THIS Claude Code session from its transcript file under ~/.claude/projects/
  (every assistant message carries usage), and add what /cost or /usage shows. Report it separately from the
  pipeline's tokens.
- Write both to projects/<id>/logs/token_report.md and summarise it in docs/context/RUNS.md.

LOGS AND RULES
- CHANGELOG entry, a D- entry for the provider and profile, L- entries for anything that went wrong (append-only;
  supersede, never rewrite). Update docs/AGENTS_RUNBOOK.md with the claude_code provider. Run
  `py tools/context_check.py` and the test suite before you say done.
- Never print, log or commit a key or token. No em or en dashes in anything you write. RedTee_V1_Video is read-only.
  Downloads need my approval. Opus only in claude-code-only. Do not compare styles with each other (D-122).
- Final message to me, per lesson: what rendered (path), length, the per-beat defect list, the token table, the
  notional cost if this had been API, the billed cost; then the three side by side; then what is still unverified.
```

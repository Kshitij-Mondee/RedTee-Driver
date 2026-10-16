# Shuttle on its own agents, any model (design, 2026-10-12)

Kshitij (2026-10-12): "I want you to make shuttle model agnostic as well, if not possible then make different pipelines for
different models and combinations." Then: "I don't want shuttle running claude code sessions. I want proper agents and
functional stuff. I want the idea and pipeline architecture to be as similar as possible."

## What stays exactly as it is
Shuttle is one lead on rails with sub-agents. Everything that makes it Shuttle already lives outside Claude Code and is
kept unchanged:
- the rails (`loom/shuttle/rails.py`): phases P1 to P11, conditions, reopens, owner tokens, budgets, who may call what;
- loom-mcp's tools and their schemas (`loom/shuttle/server.py`), called in process with `Server.call(name, args, use_id)`;
- `delegate` and `collect`, the briefs by reference, the engine context, the reviewers (skeptic, critic: already Relay agents);
- the playbook (`skills/loom/shuttle-director/SKILL.md`), the sub-agent definitions (`shuttle/agents/*.md`, `full_prompt`);
- the session plan (`start_message`, `status_block`, the notes, presets, the session split, P10 judge and fix, retries).

## What changes: the runner
Today `launch.run_session` starts `claude -p` for each session; Claude Code runs the lead, spawns sub-agents with its
Agent tool, talks to loom-mcp over stdio, and a hook records who called. New: `--runner loom` (the default; `cli` stays a
choice), our own agent loop on Relay's provider layer (`loom/agents/llm`: Anthropic, OpenAI, Gemini; tools, images,
caching, thinking), in process:

1. **The loop** (`loom/shuttle/loop.py`): system blocks, tool specs, a dispatch function, a stop rule (a reply with no tool
   call ends the agent); Relay's request fitting, compaction and budget checks; old pictures pruned (about 1,500 tokens each);
   the rails guards before each lead turn (stop, budget, waiting for a person, the session's phases behind it).
2. **Tools**: the session's loom-mcp tools as they are (names keep `mcp__loom__`, so the playbook and the agent frames read
   the same). A call goes: caller record (who, which agent), the hook's mcp checks, `Server.call`, the JSON reply, and its
   pictures as a user message after the tool results.
3. **The Agent tool** for the lead, same name and fields (`subagent_type`, `prompt`): runs a sub-agent loop with its own
   definition (prompt, tools, turn cap, effort, model) and returns its final words. Several Agent calls in one lead turn run
   in parallel threads, as Claude Code ran them.
4. **Cost rows**: one per model call, in Shuttle's `calls.jsonl` format and `logs/llm_calls.jsonl`, exact from the provider's
   usage (no reconcile rows, no notional prices: API calls).
5. **Sessions**: messages saved per session; a retry resumes them, as `--resume` did.
6. **System prompts**: a short runner preamble, the engine's CLAUDE.md (the lead read it under Claude Code), the playbook.

## Models and combinations
Every model in `loom/agents/config/models.json` can run any part: `--lead`, `--build-lead` and the presets name aliases
(claude-sonnet-5-5, claude-opus-5-5, gemini-3.1-pro, gemini-3.8-flash, gpt models), and the sub-agents' models come from the
preset (default: their definition's model). Named combinations are presets in `loom/shuttle/config.json` (the "different
pipelines" of the request, as Relay's profiles): today's `sonnet-only` and `opus-plan`, and e.g. a Gemini build. The skeptic
and the critic stay another family than the lead's (today they only avoid Anthropic).

## What is dropped with Claude Code
The claude.ai subscription (the loom runner is API only; `--runner cli` keeps it), Claude Code's built-in Read, Glob and
Grep (the loom tools cover skills and artifacts; the playbook line changes), stream parsing and reconcile, the OAuth and
key-source checks, the background-task variables.

## Proof before any paid run
- Offline: the existing server and rails tests unchanged; new tests for the loop, the Agent tool (parallel spawns,
  refusals), cost rows, resume, picture pruning, reviewer family; the scripted P1 to P11 run (`tools/shuttle_s0.py`) on the
  mock provider on the loom runner, for an Anthropic-, an OpenAI- and a Gemini-shaped mock.
- Then one small paid run on Kshitij's word.

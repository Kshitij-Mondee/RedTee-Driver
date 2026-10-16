# Shuttle: what the platform really does (STEP 1, verified 2026-10-08)

Every line below was run or read on this PC, not assumed (CLAUDE.md rule 12). Where the platform differs from the
design (`docs/strategy/2026-10-08-shuttle-pipeline.md`), the last column says how Shuttle adapts. Nothing here made a
paid model call or a subscription run: the CLI was pointed at a local fake API with a fake key and an empty config
folder (no login), and the Agent SDK was read in its docs, not installed (the download needs Kshitij's approval).

## Claude Code (the CLI)

| question | verified | how |
|---|---|---|
| version, auth | `claude` 2.1.283 at `~/.local/bin/claude.exe`; `claude auth status`: `authMethod: claude.ai`, team subscription | ran it |
| print mode | `-p`; `--output-format stream-json` needs `--verbose`; the prompt can come on stdin (it waits 3 s for stdin when none is given) | probe runs |
| MCP | `--mcp-config <file>` and `--strict-mcp-config` (ignore every other MCP config); a server's tools are `mcp__<server>__<tool>`; `--allowedTools mcp__loom` allows the whole server | help, S0 |
| sub-agents | `--agents <json or, with --print, a file>`; or `.claude/agents/*.md` in the project. Fields the CLI accepts (its schema, read from the binary): name, description, prompt, tools, disallowedTools, model, effort, permissionMode, mcpServers, hooks, maxTurns, skills, initialPrompt, memory, background, omitClaudeMd, isolation; `.md` front matter takes `maxTurns` | help, binary |
| system prompt | `--append-system-prompt` and the hidden `--append-system-prompt-file <file>` (also `--system-prompt[-file]`) | binary |
| turns, budget | hidden `--max-turns <n>` (print only); `--max-budget-usd` (print only); hidden `--task-budget` | help, binary |
| permissions | `--permission-mode` acceptEdits, auto, bypassPermissions, manual, dontAsk, plan; `--allowedTools`, `--disallowedTools`, `--tools` (the built-in set); `--permission-prompts none` | help |
| settings, hooks | `--settings <file or json>`; `--setting-sources user,project,local`; `--bare` skips hooks and reads only ANTHROPIC_API_KEY (so it can never be used in subscription mode) | help |
| sessions | `--session-id <uuid>`, `--resume <id>`, `--fork-session`, `--no-session-persistence` | help |
| models | `--model sonnet` resolves to `claude-sonnet-5` in this CLI; a full id it does not know (`claude-sonnet-5-5`) prints `[claude-code:unrecognized_model]` and still runs. Shuttle passes the aliases (`sonnet`, `opus`) and logs the model the stream reports | probe |
| billing | with ANTHROPIC_API_KEY in the environment, `claude auth status` reports `apiKeySource: ANTHROPIC_API_KEY` although the claude.ai login is there: **the key wins**. Subscription mode must remove it from the child | ran it with a fake key |
| the init message | `{type: system, subtype: init, session_id, model, apiKeySource, tools, mcp_servers: [{name, status}], agents, permissionMode, claude_code_version}`, before the first model request | probe |
| assistant messages | one stream event per content block, sharing `message.id`, each with `message.usage` (input, cache_read, cache_creation with 5 m and 1 h parts, output) and `message.model`; a sub-agent's messages carry `parent_tool_use_id` | probe, S0 |
| result | `{type: result, subtype: success or error_during_execution, error_max_turns, error_max_budget_usd, error_max_structured_output_retries, is_error, num_turns, total_cost_usd, usage, modelUsage: {model: {costUSD, costBasis: "list", ...}}, session_id, terminal_reason, api_error_status}`; `rate_limit_event` messages carry `rate_limit_info` | probe, binary |
| hooks | PreToolUse input: `tool_name, tool_input, tool_use_id, cwd, mcp_server`, plus `agent_id, agent_type` when a sub-agent calls (absent on the main thread). Output `hookSpecificOutput.permissionDecision` allow, deny, ask or defer, with a reason. A hook's `updatedInput` is validated against the tool's schema ("returned updatedInput that failed schema validation") | binary |
| MCP call metadata | each MCP `tools/call` carries `_meta["claudecode/toolUseId"]`, the same id the hook sees | binary, S0 |
| MCP timeouts | a per-server `timeout` (ms) in the MCP config overrides `MCP_TOOL_TIMEOUT`; startup `MCP_TIMEOUT` | binary |
| a launch from inside a Claude Code session | inherits that session's environment: ANTHROPIC_BASE_URL, CLAUDE_CODE_SIMPLE, CLAUDE_AGENT_SDK_MCP_NO_PREFIX (would rename MCP tools), CLAUDE_CODE_ENTRYPOINT and about 25 more | `env` in this session |
| against a local fake API | `ANTHROPIC_BASE_URL=http://127.0.0.1:port`, a fake key, an empty `CLAUDE_CONFIG_DIR`: one streamed request per turn, no side calls; the first request carried a `system`-role message (a newer API shape), refused by Loom's mock, and the CLI retried without it | probe server |

## Learned by running the launcher against the mock (S0, `tools/shuttle_s0.py`)
| finding | evidence | Shuttle does |
|---|---|---|
| `.claude/agents/*.md` load with `--setting-sources project`; loom-mcp connects; `--permission-mode dontAsk` with `--allowedTools mcp__loom` runs every loom tool without a prompt | init: `mcp_servers: loom connected`, the six `shuttle-*` agents, `permissionMode: dontAsk`, 53 tools | as designed |
| the agent tool is listed as `Task` in the init message and called as `Agent` by the model; both work | init tools and the stream | both are allowed |
| a tool the session does not have is refused by the CLI itself: "No such tool available: Write. Write is disabled for this session, in subagents as well as here." | the lead's scripted Write | the lead has no file tools at all |
| **sub-agents run in the background by default** ("Async agent launched successfully"): the lead went on and collected a fact-finder that was still working | first S0 smoke | `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1` and `CLAUDE_CODE_DISABLE_MCP_TASK_BACKGROUND=1` in the child, `background: false` on every sub-agent, `run_in_background: false` in the spawn instructions, and `collect` refuses a token whose sub-agent has made no call |
| parallel tool calls reach the server together: a read of `state.json` raced the sub-agent's write (`PermissionError`, Windows) | first S0 smoke | loom-mcp runs every lesson-state tool one at a time (documents are read in parallel) |
| **Claude Code does not drain an MCP server's stderr**: narrate's per-phrase lines filled the pipe and the server blocked for good (no CPU, the CLI logging "still running") | second S0 run, the CLI's MCP log | loom-mcp writes its prints and its children's output to `logs/shuttle/server.log`; the stdio test asserts stderr stays empty |
| **an MCP server's children inherit its stdin, which is the protocol pipe**: the animatic's ffmpeg (no stdin redirect in `story.animatic`) sat on it after writing the MP4, and the tool never returned | third S0 run: ffmpeg alive at 639 MB, a child of loom-mcp | `isolate_stdio`: the protocol keeps private copies of fds 0 and 1; fd 0 is the null device, fds 1 and 2 the log; a test runs a child that tries to read and write |
| a sub-agent's hook events carry `agent_type` (`shuttle-fact-finder`), the main thread's do not; the `tool_use_id` matches the MCP call's `_meta` | the server cross-checked token and caller on every call with no mismatch | the caller record is a working cross-check |
| JSON that passed through the CLI is JavaScript's: `4.0` comes back as `4` | the S0 lesson's script hashed differently from the same plan written by Python | nothing to change in the engine (gates read values); the S0 fixture is normalised the same way |
| sub-agents' model calls appear in the parent's stream with `parent_tool_use_id` (no `--forward-subagent-text` needed) and their own `message.model` | calls.jsonl rows tagged `shuttle-fact-finder` | the ledger names each call's real model and agent |

## The Claude Agent SDK for Python (docs only; not installed)
From its own docs (context7, `/anthropics/claude-agent-sdk-python`):
- `ClaudeAgentOptions(mcp_servers, strict_mcp_config, agents, allowed_tools, disallowed_tools, permission_mode, max_turns,
  max_budget_usd, skills, setting_sources, plugins, system_prompt, cwd, env, resume, resume_session_at, fork_session,
  thinking, hooks, can_use_tool)`.
- `AgentDefinition(description, prompt, tools, disallowedTools, model, skills, memory, mcpServers, initialPrompt,
  maxTurns, background, effort, permissionMode)`.
- In-process tools: `@tool(name, description, schema)` and `create_sdk_mcp_server(name, version, tools)`.
- Hooks: `HookMatcher(matcher, hooks, timeout)`; a PreToolUse callback returns `permissionDecision` allow, deny, ask or
  defer; `can_use_tool` returns `PermissionResultAllow` or `PermissionResultDeny`.
- `ResultMessage(subtype, duration_ms, num_turns, session_id, total_cost_usd, usage, model_usage, errors,
  api_error_status, terminal_reason)`; `AssistantMessage(content, model, parent_tool_use_id, usage, message_id)`.
- **It bundles and drives the same Claude Code CLI** (its transport is `subprocess_cli.py`, which turns options into
  CLI flags such as `--plugin-dir` and `--allowedTools Skill(name)`). Skills are the CLI's: `skills="all"` adds the
  Skill tool and defaults `setting_sources` to user and project.

## Where the design changes (and why)

| the design assumed | what is true | Shuttle does |
|---|---|---|
| API mode needs the Python SDK | the SDK spawns the same `claude` binary with the same flags | API mode = the same launcher with the key in the child environment and `--max-budget-usd` as a backstop (`--runner cli`, the default and the path S0 proves); `--runner sdk` (`loom/shuttle/sdk_runner.py`) is written against the documented API and is UNVERIFIED until the SDK is installed |
| loom-mcp in Python on the `mcp` package | the package is not installed either (another download) | loom-mcp speaks MCP stdio itself (JSON-RPC 2.0, one message a line; about 60 lines in `loom/shuttle/server.py`); the CLI connects to it (S0) |
| the hook passes the caller to the server | a hook may not add a field the tool's schema lacks | the hook writes `logs/shuttle/callers/<tool_use_id>.json`; the server reads it by the `_meta` id; owner tokens remain the authority, the hook record a cross-check |
| skills loaded by the platform | the CLI's Skill tool loads whole skills from `.claude/skills` or plugins | the lead reads skill SECTIONS through loom-mcp (`list_skill_sections`, `get_skill_section`), the same in both modes and byte-stable for caching; the playbook (`skills/loom/shuttle-director`) is the appended system prompt |
| the lead "edits nothing it does not own" by a hook | the CLI can withhold the tools entirely | the session gets no Write, Edit or shell at all (`--tools Read,Glob,Grep,Agent`, the rest disallowed); the hook (`--strict`) still denies them if a setting ever enables one |
| subscription mode just runs `claude -p` | an inherited key or base URL silently switches billing or endpoint | the child environment drops every `ANTHROPIC_*` and `CLAUDE*` variable (except `CLAUDE_CODE_GIT_BASH_PATH`), and the launcher stops before any model call when the init message's `apiKeySource` is not `none` |
| a check or render is one tool call | CLI tool calls time out | loom-mcp's MCP config sets `timeout: 3600000` |

## Still unverified (said, not assumed)
- A real subscription session (S1) and a real API session (S2): not run, by instruction.
- The SDK runner: not run (no SDK).
- How the CLI behaves at a real usage limit: the launcher reads `rate_limit_event` with status rejected, and an error
  result naming a limit, as exit 5; the exact real-world text has not been seen.

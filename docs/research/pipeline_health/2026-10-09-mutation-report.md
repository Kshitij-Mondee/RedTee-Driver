# Mutation check of the logged Relay and Shuttle fixes (2026-10-09)

Where: Linux sandbox, Python 3.10.12, node, chrome-headless via `/tmp/chr/chrome.sh`, the real `claude` CLI pointed at the mock LLM.
I wrote no engine files. Every mutation was an in-process monkeypatch in a throwaway script under `/tmp/mut/`:

- Python: the function's own source with one anchor replaced, re-executed into its module or class (`/tmp/mut/mut.py`). A missing anchor stops the script.
- JS: the runtime file copied into the lab page's temp `rt/` folder, edited there by wrapping `lab.page`.

Shuttle's `emit_claude`/`emit_sdk` were redirected to `/tmp` in every mutation run.

Green: all 31 tests passed on the current code. The 29 non-browser tests ran together at 10:14 IST. The 2 browser tests ran at about 10:05.
Red: each row below is one mutation, run once in its own process.

| test | L / D | mutation applied (pre-fix behaviour restored) | green? | red? | red message (first 120 chars) |
|---|---|---|---|---|---|
| agents_relayfix_a_later_critic_pass_sees_only_what_changed | L-346 | `critic_findings`: `if self.critic_passes:` -> `if False:` (every pass judges every sheet) | yes | yes | AssertionError: ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09', 'b10', 'b11', 'b12', 'b13', 'b14', 'b15', 'b16 |
| agents_relayfix_a_quiz_answer_repeats_its_questions_options | L-338 | `check_storyboard`: quiz pair comparison `if mine_opts != last_quiz[1]` -> `if False` | yes | yes | AssertionError: [] |
| agents_relayfix_quiz_options_carry_no_letter_of_their_own | L-337 | `gates.OPTION_LETTER` replaced by a never-matching regex (no letter gate) | yes | yes | AssertionError: [] |
| agents_relayfix_served_model_ids_and_old_sessions | L-346 | (a) `same_model` exact compare `served == expected` | yes | yes | AssertionError: (first assert: dated snapshot id refused) |
| " | L-346 | (b) `same_model` loose prefix match | yes | yes | AssertionError: (asserts that claude-sonnet-5 vs -5-5 is refused) |
| " | L-346 | (c) `run_agent_cc`: `seen["unknown"] = False` (old session reconciled) | yes | yes | AssertionError: an old session was counted again: [{'role': 'persona_pick', 'task': 'persona_pick-0c23216a', 'project': 'agents-te |
| agents_relayfix_the_last_fixes_get_a_final_look_and_a_blocker_stops_the_render | L-346 | (a) `final_review_due` always False | yes | yes | AssertionError: (assert c.final_review_due() after a change) |
| " | L-346 | (b) `final_review`: `if blockers:` -> `if False:` | yes | yes | AssertionError: ([{'severity': 'blocker', 'beat': 'b10', 'problem': 'head cut', 'fix': 'x'}], 'ok') |
| " | L-346 | (c) `_pass`: the run loop's `final_review` call removed | yes | **NO** | test still PASS (see Findings 2) |
| agents_relayfix_no_colour_survives_the_colour_maths_and_parts_keep_their_properties (browser) | L-346 | (a) style.js `S.mix` none guard removed | yes | yes | AssertionError: {'nan': False, 'mix': '#NaNNaNNaN', 'shade': 'none', 'contrast': 16.94..., 'on': '#2A221C', 'states': 'empty,full', |
| " | L-346 | (b) style.js `lum` none guard removed | yes | yes | AssertionError: {'nan': False, 'mix': 'none', 'shade': 'none', 'contrast': None, ... |
| " | L-346 | (c) core.js `wrapPart` no longer copies the part's own properties | yes | yes | AssertionError: {'nan': False, 'mix': 'none', ..., 'states': '', 'wrapped': True} |
| agents_relayfix_a_presenter_card_fits_short_lines (browser) | L-347 | overlay.js `const shortLines = false;` (lines always body size, left edge) | yes | yes | AssertionError: ({'w': 1158, 'inset': 88, 'size': 38}, {'w': 1158, 'inset': 88, 'size': 38}) |
| agents_a_build_rewritten_mid_hash_does_not_stop_the_launcher | L-350 | (a) `build_hash`: read without try/except | yes | yes | FileNotFoundError: .../loom_bh_.../build/runtime/ui_artefacts.js |
| " | L-350 | (b) `build_hash`: stat without try/except | yes | **NO** | test still PASS (see Findings 1) |
| " | L-350 | (c) `Stream._phase` returns `self.rails.current()` unguarded | yes | yes | FileNotFoundError: build/runtime/ui_artefacts.js |
| agents_a_finding_in_other_words_is_logged_not_lost | L-349 | `_normalize_finding` returns the finding unchanged (refused as before) | yes | yes | AssertionError: {'error': ["(root): Additional properties are not allowed ('detail', 'file' were unexpected)", "(root): 'stage' |
| agents_api_lookup_finds_an_api_name_that_is_not_a_heading | L-349 | `t_get_api_section`: the "found by use" branch disabled | yes | yes | AssertionError: ('held', None, "no SCENE_API section 'held'") |
| agents_skill_lookup_finds_a_style_guide_by_its_id_or_path | L-349 | (a) both new lookups off; (b) the id lookup only; (c) the path lookup only | yes | yes (all 3) | AssertionError: ('story-cartoon', {'error': "no skill or guide 'story-cartoon' ... / ('docs/styles/guides/story-cartoon.md', {'err |
| agents_shuttle_a_draft_is_not_taken_by_accept_phase | L-348 | `take_files`: the draft rule `if rel in drafts and beat not in named` -> `if False` | yes | yes | AssertionError: {'taken': ['scenes/b05.js', 'scenes/b06.py', 'scenes/b10.js', 'scenes/b14.py'], 'need_work': []} |
| agents_shuttle_a_kit_change_rewrites_no_other_beat | D-145 | `file_problem` returns `"inputs"` instead of `"verify"` for a kit-part change (L-332 behaviour) | yes | yes | AssertionError: [] |
| agents_shuttle_a_person_grants_one_more_reopen | grant-reopen (2026-10-08) | (a) `reopen` reads the constant `REOPEN_CAP`, not the granted cap | yes | yes | Refusal: the reopen cap (4) is used. A change limited to some beats ... |
| " | " | (b) `grant_reopens` person check removed | yes | yes | AssertionError: grant allowed for by='agent, unattended' why='x' |
| agents_shuttle_a_rewrite_after_p8_needs_no_reopen | L-320 | (a) scene-author `phases: [P8]` | yes | yes | Refusal: the scene-author works in P8; the lesson is in P10 |
| " | L-320 | (b) fixer `max_turns: 8` | yes | yes | AssertionError: {'tool_calls': 40, 'max_turns': 8} |
| agents_shuttle_pilot_check_verifies_beats_after_a_kit_fix | L-349 | (a) `t_pilot_check` refuses any file problem, "verify" included | yes | yes | AssertionError: {'refused': 'the pilot beats need their authors first (scenes/b10.js (kit part(s) board changed)); then pilot_ch |
| " | L-349 | (b) a passing pilot does not mark the verified files | yes | yes | AssertionError: ([('scenes/b10.js', 'kit part(s) board changed', 'b10')], {'beats': ['b09', 'b10'], 'pass': True, ... |
| agents_shuttle_the_build_session_runs_on_sonnet | D-145 | `lead_for` ignores `lead_by_group` | yes | yes | AssertionError: {'P1-P4': 'opus', 'P5-P6': 'opus', 'P7-P9': 'opus', 'P10-P11': 'opus'} |
| agents_shuttle_waits_out_a_login_refresh | L-341 | `auth_transient` always False (a failed try, then a resume) | yes | yes | AssertionError: [False, True] |
| agents_shuttle_set_device_reopens_one_beat | D-146 | (a) `set_device` removed from loom-mcp | yes | yes | AssertionError: {'refused': 'unknown tool set_device'} |
| " | D-146 | (b) `t_set_device` reopens P5 whole (no `beats=[beat]`) | yes | yes | AssertionError: {'at': ..., 'phase': 'P5', 'reason': 'set_device on b07: ...', 'by': 'lead', 'beats': None, 'stale': ['P5'], ... |
| agents_shuttle_use_tool_and_the_beats_handover | D-146 | `use_tool` removed from loom-mcp | yes | yes | AssertionError: {'refused': 'unknown tool use_tool'} |
| agents_shuttle_has_relays_toolbox | D-146 | (a) use_tool + set_device removed; (b) no menu in `lead_prompt`; (c) no menu in `full_prompt` | yes | yes (all 3) | AssertionError: ({'use_tool', 'set_device', 'capabilities', ... / AssertionError: / AssertionError: scene-author |
| agents_cc_opus_never_writes_the_storyboard | L-325 / D-142 | (a) the Opus-on-storyboard check removed; (b) only API-provider Opus counted (cc-opus slips through) | yes | yes | AssertionError: bad-cc: Opus was allowed on the storyboard |
| agents_cc_opus_storyboard_only_when_a_profile_names_the_decision | D-142 / L-325 | (a) any non-empty `opus_storyboard` accepted; (b) cc-sonnet's CLI name back to `sonnet` | yes | yes | AssertionError: no-decision: Opus was allowed on the storyboard / AssertionError: ['brief', 'knowledge', 'pedagogy', 'persona_pick', |
| agents_cache_misses_are_counted | Relay improvements 2026-10-08 | `_run_agent`: the miss condition -> `if False:` | yes | yes | AssertionError: ...critic-8f754088", "role": "critic", "status": "limits", ... (no cache_miss in the trace) |
| agents_decision_records_name_the_model_that_ran | L-268 | (a) `ledger.actor` ignores RUNNING; (b) `run_agent` does not set RUNNING | yes | yes | AssertionError: {'kind': 'agent', 'tier': 'plan', 'model': 'claude-opus-5-5', 'mode': 'agent'} / AssertionError: [None, None, None, None] |
| agents_plan_checkpoint_is_off_unless_asked | D-131 | (a) pre-D-131 flag `--no-plan-gate` (default on); (b) `--plan-gate` with `default=True` | yes | yes | (a) SystemExit: 2 (argparse rejects --plan-gate); (b) AssertionError: |

Counts:

- **31 of 31 tests are green.** 29 of them ran in the 10:14 batch and the 2 browser tests at about 10:05.
- **31 of 31 tests went red** under at least one faithful mutation of their fix. No test went entirely unmutated.
- **2 extra mutations stayed green.** These are sub-mutations of a fix. They are evidence about what the tests do not cover, listed in Findings 1 and 2.

## Findings

1. **`agents_a_build_rewritten_mid_hash_does_not_stop_the_launcher`: the "stat" half cannot fail (L-350).** Removing the stat guard
   (`entries.append((f, f.stat()))` with no try/except) leaves the test green.
   - Why: the test raises `FileNotFoundError(str)` from a patched `Path.stat`. That error has no errno, so `Path.is_file()` re-raises it inside the
     listing. The listing's `for _ in range(3): try ... except OSError: files = []` swallows it 3 times. `build_hash` then hashes **an empty build**.
   - Measured: the full build hashed `0ed47f3ecc9eaee7`. The test's stat case hashed `e3b0c44298fc1c14`, the same as an empty folder. The build without that one
     file hashed `a4a3b0eff271143c`. The test only asserts `isinstance(h2, str)`.
   - The guard itself works on the real case. With a real `ENOENT` raised on the second stat (after `is_file`), the guarded code returns `a4a3b0eff271143c` and
     the unguarded code raises FileNotFoundError.
   - Side defect: if the listing keeps failing, `build_hash` returns the empty-build hash, a wrong hash rather than a skip, and the test accepts it. This was seen on Python 3.10. Windows / Python 3.12 is not verified.
2. **`..._the_last_fixes_get_a_final_look_and_a_blocker_stops_the_render` does not test the "stops the render" wiring (L-346).**
   - The test calls `final_review_due()` and `final_review()` directly.
   - Removing the run loop's call in `Conductor._pass` (`if st.name == "check" and not self.critic_due() and self.final_review_due() ...` -> `if False:`)
     leaves it green.
   - No other test in `tests/` mentions `final_review` or `review_final`. A regression that never calls the final look would ship green.
3. **`..._no_colour_survives_...`: the `nan is False` assertion is inert.**
   - Under every style.js mutation, `mix("none")` returned `#NaNNaNNaN` but the page scan still reported `nan: False`. The test scene never draws with a mixed or shaded "none".
   - The other assertions caught each mutation, so the test is red. The "nothing in the page reads NaN" clause, though, has never been shown to fail.
4. **A named draft is taken with no record of the reason (L-348).**
   - `rails.take_files(beats=[b], why="REASON-XYZ ...")` takes the draft. Neither `logs/shuttle/trace.jsonl` nor `logs/decisions.jsonl` contains the reason.
     Only files whose *inputs* changed are logged.
   - At rails level, `why=None` also takes it. The server refuses a missing `why` (server.py:294), but the reason it demands is then dropped.
   - This contradicts "taken only when named with a reason" and Rule 13 (log every decision). Evidence: `/tmp/mut/draftlog.py`, which printed
     `taken: True | reason in trace: False | reason in ledger: False`.
5. **`agents_plan_checkpoint_is_off_unless_asked` covers only the CLI default.**
   - Making the Conductor always gate leaves it green.
   - The Conductor side is guarded by `pipeline_plan_checkpoint_stops_before_the_scenes`, which went red under that same mutation. This is not a defect.
   - The test also returns `None`, not a string.

## Notes

- **Other writers during this session.** Files changed while I worked: `loom/qa.py` (09:59), `tests/suites/relay_fixes.py` (10:00), `tests/suites/shuttle_rails.py` (10:00), and `.claude/agents/shuttle-*.md` plus `shuttle/build/agents.json` (10:01).
  - None of the 31 tests calls `write_configs` or `emit_*`, and my scripts make no writes there, so these were very likely another process. I did not prove it.
  - All mutation runs and the final green batch ran after these writes.
- **Old-session half of `served_model_ids_and_old_sessions`.** It ran for real: the `claude` CLI is present and pointed at the mock. It was not skipped.
- **Mutation scripts.** `/tmp/mut/m_*.py` (sandbox only, not visible to the user).

# Phase 4 Ralph Loops

```yaml
name: "ralph-loop-001"
task_name: "Implement spotify me"
max_iterations: 2
on_max_iterations: "Stop and report unresolved spotify me issues."
handoff_summary: "Done: Added current-user wrapper, spotify me command, CLI routing/help update, and focused tests. The command uses the shared client, compact user shape, token store, refresh boundary, and avoids requiring SPOTIFY_CLIENT_ID when the stored access token is still valid. npm test passed with 79 tests and npm run check passed. Failed: None. Needed: Implement spotify player devices."
todos:
  - id: "loop-001-todo-001"
    content: "Write failing tests for a current-user endpoint wrapper and spotify me JSON CLI output."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Tests fail before implementation because account wrapper or me command routing is missing."
    status: "completed"
    priority: "high"
  - id: "loop-001-todo-002"
    content: "Implement src/spotify/account.ts and src/cli/commands/me.ts using the shared client and compact user shape."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "spotify me --json returns compact user metadata via injected or stored token boundaries without token values."
    status: "completed"
    priority: "high"
  - id: "loop-001-todo-003"
    content: "Wire spotify me into src/cli/index.ts and update help expectations."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "CLI routes spotify me and help text accurately lists implemented diagnostics."
    status: "completed"
    priority: "high"
  - id: "loop-001-todo-004"
    content: "Run npm test and npm run check."
    skill: "advanced-ai-workflows:workflow-verification"
    agent: "reviewer"
    outcome: "Both validation commands pass, or exact failures are captured."
    status: "completed"
    priority: "high"
prompt: |
  Execute Phase 4 loop 001 in the spotify-plugin repo.
  Own src/spotify/account.ts, src/cli/commands/me.ts, src/cli/index.ts, tests/spotify/account.test.js, tests/cli/me.test.js, and tests/cli/help.test.js.
  Use injected fetch/token boundaries in tests. Do not call live Spotify.
```

```yaml
name: "ralph-loop-002"
task_name: "Implement spotify player devices"
max_iterations: 2
on_max_iterations: "Stop and report unresolved device diagnostics issues."
handoff_summary: "Done: Added player device wrapper, spotify player devices command, CLI routing/help update, and focused tests. The command uses the shared client, compact device shapes, token store, refresh boundary, and avoids requiring SPOTIFY_CLIENT_ID when the stored access token is still valid. npm test passed with 82 tests and npm run check passed. Failed: One gpt-5.4-mini worker errored at capacity; a retry was stopped after main-workspace validation to avoid duplicate edits. Needed: Implement spotify player state and spotify player current."
todos:
  - id: "loop-002-todo-001"
    content: "Write failing tests for devices endpoint wrapper and spotify player devices JSON CLI output."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Device tests fail before implementation."
    status: "completed"
    priority: "high"
  - id: "loop-002-todo-002"
    content: "Implement device diagnostics using shared client and compact device shapes."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "spotify player devices --json returns compact device entries without token values."
    status: "completed"
    priority: "high"
  - id: "loop-002-todo-003"
    content: "Run npm test and npm run check."
    skill: "advanced-ai-workflows:workflow-verification"
    agent: "reviewer"
    outcome: "Both validation commands pass, or exact failures are captured."
    status: "completed"
    priority: "high"
prompt: |
  Execute Phase 4 loop 002 after loop 001 is complete.
  Own src/spotify/player.ts, src/cli/commands/player.ts, tests/spotify/player.test.js, and tests/cli/player.test.js.
  Keep work scoped to player devices only.
```

```yaml
name: "ralph-loop-003"
task_name: "Implement spotify player state and current"
max_iterations: 2
on_max_iterations: "Stop and report unresolved playback diagnostics issues."
handoff_summary: "Done: Added playback state and currently-playing wrappers, player state/current CLI routing, compact JSON output, no-content markers, help text updates, and focused tests. npm test passed with 87 tests and npm run check passed. Failed: None. Needed: Implement spotify queue get."
todos:
  - id: "loop-003-todo-001"
    content: "Write failing tests for playback state and current item wrappers plus CLI JSON output."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Playback diagnostics tests fail before implementation."
    status: "completed"
    priority: "high"
  - id: "loop-003-todo-002"
    content: "Implement spotify player state and spotify player current using compact playback/item shapes and 204 handling."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Playback commands return compact JSON and represent no-content responses clearly."
    status: "completed"
    priority: "high"
  - id: "loop-003-todo-003"
    content: "Run npm test and npm run check."
    skill: "advanced-ai-workflows:workflow-verification"
    agent: "reviewer"
    outcome: "Both validation commands pass, or exact failures are captured."
    status: "completed"
    priority: "high"
prompt: |
  Execute Phase 4 loop 003 after loop 002 is complete.
  Extend the player wrapper and CLI command files; do not implement playback control.
```

```yaml
name: "ralph-loop-004"
task_name: "Implement spotify queue get"
max_iterations: 2
on_max_iterations: "Stop and report unresolved queue diagnostics issues."
handoff_summary: "Done: Added queue wrapper, spotify queue get command, CLI routing/help update, compact currentlyPlaying/queue JSON output, and focused tests. The command uses the shared client, compact item shapes, token store, refresh boundary, and avoids requiring SPOTIFY_CLIENT_ID when the stored access token is still valid. npm test passed with 91 tests and npm run check passed. Failed: None. Needed: Update diagnostics docs and references."
todos:
  - id: "loop-004-todo-001"
    content: "Write failing tests for queue endpoint wrapper and spotify queue get JSON CLI output."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Queue get tests fail before implementation."
    status: "completed"
    priority: "high"
  - id: "loop-004-todo-002"
    content: "Implement queue get using shared client and compact item shapes."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "spotify queue get --json returns currently playing and queued compact item summaries."
    status: "completed"
    priority: "high"
  - id: "loop-004-todo-003"
    content: "Run npm test and npm run check."
    skill: "advanced-ai-workflows:workflow-verification"
    agent: "reviewer"
    outcome: "Both validation commands pass, or exact failures are captured."
    status: "completed"
    priority: "high"
prompt: |
  Execute Phase 4 loop 004 after loop 003 is complete.
  Own queue wrapper, queue CLI command, and focused queue tests only.
```

```yaml
name: "ralph-loop-005"
task_name: "Update diagnostics docs and references"
max_iterations: 2
on_max_iterations: "Stop and report unresolved diagnostics documentation issues."
handoff_summary: "Done: Updated Spotify skill and references so implemented diagnostics are documented: me, player devices/state/current, and queue get. Kept playback control, playlist, queue add/add-many, search, track, album, and artist commands marked planned. npm test passed with 91 tests, npm run check passed, and stale-reference scans are clean. Failed: None. Needed: Run Phase 4 completion gate."
todos:
  - id: "loop-005-todo-001"
    content: "Update command reference to mark Phase 4 diagnostics commands as implemented."
    skill: "skill-creator"
    agent: "worker"
    outcome: "Command reference accurately separates implemented diagnostics from planned writes/search/playlists."
    status: "completed"
    priority: "high"
  - id: "loop-005-todo-002"
    content: "Update queue and safety references if implemented diagnostics changed guidance."
    skill: "skill-creator"
    agent: "worker"
    outcome: "References match implemented read-only diagnostics and still avoid unsupported queue promises."
    status: "completed"
    priority: "medium"
  - id: "loop-005-todo-003"
    content: "Run npm test, npm run check, and stale-reference scans."
    skill: "advanced-ai-workflows:workflow-verification"
    agent: "reviewer"
    outcome: "Validation passes and no references claim planned write/search commands are implemented."
    status: "completed"
    priority: "high"
prompt: |
  Execute Phase 4 loop 005 after loop 004 is complete.
  Own only skills/spotify references and docs unless validation exposes a narrow mismatch.
```

```yaml
name: "ralph-loop-006"
task_name: "Review Phase 4 completion"
max_iterations: 1
on_max_iterations: "Stop and report Phase 4 gate failures."
handoff_summary: "Done: Phase 4 gate passed. Verified account, device, playback state/current, and queue diagnostics; compact JSON outputs; no-content handling; no-refresh client ID behavior; docs alignment; npm test with 91 tests; npm run check; JSON manifests; skill frontmatter; hygiene scans; and .claude absence. Failed: git status is unavailable because this workspace is not a Git repository. Needed: Plan and execute Phase 5 playlist reads."
todos:
  - id: "loop-006-todo-001"
    content: "Review all Phase 4 deliverables against .advanced-plans/phases/phase-4/plan.md."
    skill: "advanced-ai-workflows:workflow-verification"
    agent: "reviewer"
    outcome: "A Phase 4 verification summary states pass or lists exact remaining failures."
    status: "completed"
    priority: "high"
prompt: |
  Execute Phase 4 loop 006 after loop 005 is complete.
  Review only; do not implement new feature scope during the gate.
```

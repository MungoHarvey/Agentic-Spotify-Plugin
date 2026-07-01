# Phase 5 Ralph Loops

```yaml
name: "ralph-loop-001"
task_name: "Implement spotify playlists list"
max_iterations: 2
on_max_iterations: "Stop and report unresolved playlist listing issues."
handoff_summary: "Done: Added current-user playlist page wrapper, spotify playlists list command, CLI routing/help update, compact playlist page JSON output, and focused tests. The command uses the shared client, compact playlist shape, token store, refresh boundary, and avoids requiring SPOTIFY_CLIENT_ID when the stored access token is still valid. npm test passed with 94 tests and npm run check passed. Failed: None. Needed: Implement spotify playlists list --all."
todos:
  - id: "loop-001-todo-001"
    content: "Write failing tests for current-user playlist page wrapper and spotify playlists list --json output."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Playlist list tests fail before implementation."
    status: "completed"
    priority: "high"
  - id: "loop-001-todo-002"
    content: "Implement playlist page listing using the shared client and compact playlist shapes."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "spotify playlists list --json returns compact page data without token values."
    status: "completed"
    priority: "high"
  - id: "loop-001-todo-003"
    content: "Wire playlists list into CLI routing and help."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "CLI routes playlists list and help text accurately distinguishes implemented reads from planned writes."
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
  Execute Phase 5 loop 001 in the spotify-plugin repo.
  Own src/spotify/playlists.ts, src/cli/commands/playlists.ts, src/cli/index.ts, tests/spotify/playlists.test.js, tests/cli/playlists.test.js, and tests/cli/help.test.js.
  Use injected fetch/token boundaries. Do not call live Spotify.
```

```yaml
name: "ralph-loop-002"
task_name: "Implement spotify playlists list --all"
max_iterations: 2
on_max_iterations: "Stop and report unresolved playlist pagination issues."
handoff_summary: "Done: Added playlists list --all pagination using paginateAll, compact accumulated playlist output, and focused wrapper/CLI tests. npm test passed with 96 tests and npm run check passed. Failed: None. Needed: Implement spotify playlist get."
todos:
  - id: "loop-002-todo-001"
    content: "Write failing tests for all-playlists pagination."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "All-playlists tests fail before pagination integration."
    status: "completed"
    priority: "high"
  - id: "loop-002-todo-002"
    content: "Implement --all using paginateAll and compact playlist shapes."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "spotify playlists list --all --json follows next links and returns accumulated compact playlists."
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
  Execute Phase 5 loop 002 after loop 001 is complete.
  Extend playlists list only; do not implement playlist get/items yet.
```

```yaml
name: "ralph-loop-003"
task_name: "Implement spotify playlist get"
max_iterations: 2
on_max_iterations: "Stop and report unresolved playlist metadata issues."
handoff_summary: "Done: Added playlist metadata wrapper, spotify playlist get command, CLI routing/help update, compact playlist JSON output, and focused tests. The command uses the shared client, compact playlist shape, token store, refresh boundary, and avoids requiring SPOTIFY_CLIENT_ID when the stored access token is still valid. npm test passed with 99 tests and npm run check passed. Failed: None. Needed: Implement spotify playlist items."
todos:
  - id: "loop-003-todo-001"
    content: "Write failing tests for playlist metadata wrapper and spotify playlist get <playlist_id> --json."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Playlist metadata tests fail before implementation."
    status: "completed"
    priority: "high"
  - id: "loop-003-todo-002"
    content: "Implement playlist metadata lookup with compact playlist shape."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "spotify playlist get returns compact playlist metadata without token values."
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
  Execute Phase 5 loop 003 after loop 002 is complete.
  Own playlist metadata wrapper, playlist CLI command, and focused tests.
```

```yaml
name: "ralph-loop-004"
task_name: "Implement spotify playlist items"
max_iterations: 2
on_max_iterations: "Stop and report unresolved playlist item issues."
handoff_summary: "Done: Added compact playlist item shape helper, playlist items wrapper, spotify playlist items command, CLI routing/help update, item positions, and focused tests. npm test passed with 102 tests and npm run check passed. Failed: None. Needed: Update playlist read docs and references."
todos:
  - id: "loop-004-todo-001"
    content: "Write failing tests for compact playlist item shapes with positions."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Playlist item shape tests fail before implementation."
    status: "completed"
    priority: "high"
  - id: "loop-004-todo-002"
    content: "Implement playlist items wrapper and spotify playlist items <playlist_id> --json."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Playlist item output includes compact item summaries and zero-based positions."
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
  Execute Phase 5 loop 004 after loop 003 is complete.
  Keep scope to playlist item reads and compact item shapes; do not implement writes.
```

```yaml
name: "ralph-loop-005"
task_name: "Update playlist read docs and references"
max_iterations: 2
on_max_iterations: "Stop and report unresolved playlist read documentation issues."
handoff_summary: "Done: Updated Spotify skill, command reference, and playlist workflow reference so playlist reads are documented as implemented and playlist writes remain planned. npm test passed with 102 tests, npm run check passed, and stale-reference scans are clean. Failed: None. Needed: Run Phase 5 completion gate."
todos:
  - id: "loop-005-todo-001"
    content: "Update command reference to mark playlist read commands as implemented."
    skill: "skill-creator"
    agent: "worker"
    outcome: "Command reference accurately separates playlist reads from planned playlist writes."
    status: "completed"
    priority: "high"
  - id: "loop-005-todo-002"
    content: "Update playlist workflow guidance for implemented read commands and large playlist inspection."
    skill: "skill-creator"
    agent: "worker"
    outcome: "Playlist reference guides Codex to list, inspect metadata, inspect items, and preserve positions."
    status: "completed"
    priority: "high"
  - id: "loop-005-todo-003"
    content: "Run npm test, npm run check, and stale-reference scans."
    skill: "advanced-ai-workflows:workflow-verification"
    agent: "reviewer"
    outcome: "Validation passes and no references claim playlist writes are implemented."
    status: "completed"
    priority: "high"
prompt: |
  Execute Phase 5 loop 005 after loop 004 is complete.
  Own only skills/spotify references and docs unless validation exposes a narrow mismatch.
```

```yaml
name: "ralph-loop-006"
task_name: "Review Phase 5 completion"
max_iterations: 1
on_max_iterations: "Stop and report Phase 5 gate failures."
handoff_summary: "Done: Phase 5 gate passed. Verified playlist list page, playlist list --all pagination, playlist metadata get, playlist items with zero-based positions, docs alignment, npm test with 102 tests, npm run check, JSON manifests, skill frontmatter, hygiene scans, and .claude absence. Failed: git status is unavailable because this workspace is not a Git repository. Needed: Plan and execute Phase 6 playlist writes."
todos:
  - id: "loop-006-todo-001"
    content: "Review all Phase 5 deliverables against .advanced-plans/phases/phase-5/plan.md."
    skill: "advanced-ai-workflows:workflow-verification"
    agent: "reviewer"
    outcome: "A Phase 5 verification summary states pass or lists exact remaining failures."
    status: "completed"
    priority: "high"
prompt: |
  Execute Phase 5 loop 006 after loop 005 is complete.
  Review only; do not implement new feature scope during the gate.
```

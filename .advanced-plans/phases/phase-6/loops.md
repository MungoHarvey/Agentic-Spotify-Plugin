# Phase 6 Ralph Loops

```yaml
name: "ralph-loop-001"
task_name: "Implement spotify playlist create"
max_iterations: 2
on_max_iterations: "Stop and report unresolved playlist creation issues."
handoff_summary: "Playlist creation is implemented and validated with tests plus repo checks."
todos:
  - id: "loop-001-todo-001"
    content: "Write failing tests for playlist creation wrapper and spotify playlist create <name> --json."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Playlist create tests fail before implementation."
    status: "completed"
    priority: "high"
  - id: "loop-001-todo-002"
    content: "Implement playlist creation using current user ID and shared client request boundaries."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "spotify playlist create <name> --json posts to users/{user_id}/playlists and returns compact playlist metadata."
    status: "completed"
    priority: "high"
  - id: "loop-001-todo-003"
    content: "Run npm test and npm run check."
    skill: "advanced-ai-workflows:workflow-verification"
    agent: "reviewer"
    outcome: "Both validation commands pass, or exact failures are captured."
    status: "completed"
    priority: "high"
prompt: |
  Execute Phase 6 loop 001 in the spotify-plugin repo.
  Own src/spotify/playlists.ts, src/cli/commands/playlist.ts, src/cli/index.ts, tests/spotify/playlists.test.js, tests/cli/playlist.test.js, and tests/cli/help.test.js.
  Use injected fetch/token boundaries. Do not call live Spotify. Do not implement other playlist writes in this loop.
```

```yaml
name: "ralph-loop-002"
task_name: "Implement spotify playlist update"
max_iterations: 2
on_max_iterations: "Stop and report unresolved playlist metadata update issues."
handoff_summary: "Playlist metadata update is implemented and validated locally after the worker disconnected."
todos:
  - id: "loop-002-todo-001"
    content: "Write failing tests for playlist metadata update request construction and CLI JSON output."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Playlist update tests fail before implementation."
    status: "completed"
    priority: "high"
  - id: "loop-002-todo-002"
    content: "Implement spotify playlist update <playlist_id> with name/public/collaborative/description options."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Playlist metadata updates use PUT playlists/{playlist_id} and return an auditable compact result."
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
  Execute Phase 6 loop 002 after loop 001 is complete.
  Keep scope to playlist metadata updates only.
```

```yaml
name: "ralph-loop-003"
task_name: "Implement spotify playlist add"
max_iterations: 2
on_max_iterations: "Stop and report unresolved playlist add issues."
handoff_summary: "Playlist add is implemented with bounded batches and final snapshot ID reporting; validated locally."
todos:
  - id: "loop-003-todo-001"
    content: "Write failing tests for batched playlist item additions and snapshot ID output."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Playlist add tests fail before implementation."
    status: "completed"
    priority: "high"
  - id: "loop-003-todo-002"
    content: "Implement spotify playlist add <playlist_id> <uri...> with bounded batches."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Playlist additions post to playlists/{playlist_id}/tracks and return final snapshotId plus counts."
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
  Execute Phase 6 loop 003 after loop 002 is complete.
  Keep scope to playlist add only. Do not implement search or URI resolution.
```

```yaml
name: "ralph-loop-004"
task_name: "Implement spotify playlist remove"
max_iterations: 2
on_max_iterations: "Stop and report unresolved URI removal issues."
handoff_summary: "Playlist URI removal is implemented and validated with tests plus repo checks."
todos:
  - id: "loop-004-todo-001"
    content: "Write failing tests for URI-based playlist removals and snapshot ID output."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "URI removal tests fail before implementation."
    status: "completed"
    priority: "high"
  - id: "loop-004-todo-002"
    content: "Implement spotify playlist remove <playlist_id> <uri...> with optional snapshot-id."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "URI removals call DELETE playlists/{playlist_id}/tracks and return snapshotId."
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
  Execute Phase 6 loop 004 after loop 003 is complete.
  Keep scope to URI-based removals only.
```

```yaml
name: "ralph-loop-005"
task_name: "Implement spotify playlist remove-positions"
max_iterations: 2
on_max_iterations: "Stop and report unresolved position removal issues."
handoff_summary: "Position-aware playlist removal is implemented with read-before-delete grouping by URI, required snapshot IDs, compact JSON output, and validation coverage."
todos:
  - id: "loop-005-todo-001"
    content: "Write failing tests for position-aware removals requiring snapshot ID."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Position removal tests fail before implementation."
    status: "completed"
    priority: "high"
  - id: "loop-005-todo-002"
    content: "Implement spotify playlist remove-positions <playlist_id> <position...> --snapshot-id <snapshot_id>."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Position removals call DELETE playlists/{playlist_id}/tracks with position objects and return snapshotId."
    status: "completed"
    priority: "high"
  - id: "loop-005-todo-003"
    content: "Run npm test and npm run check."
    skill: "advanced-ai-workflows:workflow-verification"
    agent: "reviewer"
    outcome: "Both validation commands pass, or exact failures are captured."
    status: "completed"
    priority: "high"
prompt: |
  Execute Phase 6 loop 005 after loop 004 is complete.
  Keep scope to duplicate-aware position removals only.
```

```yaml
name: "ralph-loop-006"
task_name: "Implement spotify playlist reorder"
max_iterations: 2
on_max_iterations: "Stop and report unresolved reorder issues."
handoff_summary: ""
todos:
  - id: "loop-006-todo-001"
    content: "Write failing tests for playlist reorder request construction and snapshot ID output."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Reorder tests fail before implementation."
    status: "completed"
    priority: "high"
  - id: "loop-006-todo-002"
    content: "Implement spotify playlist reorder with range-start, insert-before, optional range-length and snapshot-id."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Reorder calls PUT playlists/{playlist_id}/tracks and returns snapshotId."
    status: "completed"
    priority: "high"
  - id: "loop-006-todo-003"
    content: "Run npm test and npm run check."
    skill: "advanced-ai-workflows:workflow-verification"
    agent: "reviewer"
    outcome: "Both validation commands pass, or exact failures are captured."
    status: "completed"
    priority: "high"
prompt: |
  Execute Phase 6 loop 006 after loop 005 is complete.
  Keep scope to playlist reorder only.
```

```yaml
name: "ralph-loop-007"
task_name: "Implement spotify playlist replace"
max_iterations: 2
on_max_iterations: "Stop and report unresolved replace issues."
handoff_summary: ""
todos:
  - id: "loop-007-todo-001"
    content: "Write failing tests for playlist replacement request construction and CLI output."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Replace tests fail before implementation."
    status: "completed"
    priority: "high"
  - id: "loop-007-todo-002"
    content: "Implement spotify playlist replace <playlist_id> <uri...>."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Replace calls PUT playlists/{playlist_id}/tracks and returns an auditable compact result."
    status: "completed"
    priority: "high"
  - id: "loop-007-todo-003"
    content: "Run npm test and npm run check."
    skill: "advanced-ai-workflows:workflow-verification"
    agent: "reviewer"
    outcome: "Both validation commands pass, or exact failures are captured."
    status: "completed"
    priority: "high"
prompt: |
  Execute Phase 6 loop 007 after loop 006 is complete.
  Keep scope to playlist replace only.
```

```yaml
name: "ralph-loop-008"
task_name: "Update playlist write docs and references"
max_iterations: 2
on_max_iterations: "Stop and report unresolved playlist write documentation issues."
handoff_summary: ""
todos:
  - id: "loop-008-todo-001"
    content: "Update command reference to mark playlist write commands as implemented."
    skill: "skill-creator"
    agent: "worker"
    outcome: "Command reference accurately lists implemented playlist write commands and leaves search/queue controls planned."
    status: "completed"
    priority: "high"
  - id: "loop-008-todo-002"
    content: "Update playlist workflow guidance for snapshot IDs, position-aware removals, batching, and ambiguity policy."
    skill: "skill-creator"
    agent: "worker"
    outcome: "Playlist workflow reference guides safe use of implemented write commands."
    status: "completed"
    priority: "high"
  - id: "loop-008-todo-003"
    content: "Run npm test, npm run check, and stale-reference scans."
    skill: "advanced-ai-workflows:workflow-verification"
    agent: "reviewer"
    outcome: "Validation passes and references do not claim search resolution is implemented."
    status: "completed"
    priority: "high"
prompt: |
  Execute Phase 6 loop 008 after loop 007 is complete.
  Own only skills/spotify references and docs unless validation exposes a narrow mismatch.
```

```yaml
name: "ralph-loop-009"
task_name: "Review Phase 6 completion"
max_iterations: 1
on_max_iterations: "Stop and report Phase 6 gate failures."
handoff_summary: ""
todos:
  - id: "loop-009-todo-001"
    content: "Review all Phase 6 deliverables against .advanced-plans/phases/phase-6/plan.md."
    skill: "advanced-ai-workflows:workflow-verification"
    agent: "reviewer"
    outcome: "A Phase 6 verification summary states pass or lists exact remaining failures."
    status: "completed"
    priority: "high"
prompt: |
  Execute Phase 6 loop 009 after loop 008 is complete.
  Review only; do not implement new feature scope during the gate.
```

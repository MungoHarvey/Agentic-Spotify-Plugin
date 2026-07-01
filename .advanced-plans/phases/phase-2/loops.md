# Phase 2 Ralph Loops

```yaml
name: "ralph-loop-001"
task_name: "Implement normalized Spotify error types"
max_iterations: 2
on_max_iterations: "Stop and report unresolved Spotify error type issues."
handoff_summary: "Done: Added normalized Spotify API error helpers with tests; npm test and npm run check pass. Failed: Initial RED test failed with ERR_MODULE_NOT_FOUND before errors module existed. Needed: Implement authenticated request client."
todos:
  - id: "loop-001-todo-001"
    content: "Write failing tests for normalized Spotify error construction for 401, 403, 404, 429, and generic errors."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Error tests fail before implementation because src/spotify/errors.ts is missing."
    status: "completed"
    priority: "high"
  - id: "loop-001-todo-002"
    content: "Implement src/spotify/errors.ts without leaking token values."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Spotify error helpers expose stable status, reason, retryAfterSeconds, and redacted messages."
    status: "completed"
    priority: "high"
  - id: "loop-001-todo-003"
    content: "Run npm test and npm run check."
    skill: "superpowers:verification-before-completion"
    agent: "reviewer"
    outcome: "Both validation commands pass, or failures are captured with exact output."
    status: "completed"
    priority: "high"
prompt: |
  Execute Phase 2 loop 001 in the spotify-plugin repo.
  Own only src/spotify/errors.ts and tests/spotify/errors.test.js.
  Follow TDD. Do not implement request client behavior in this loop.
```

```yaml
name: "ralph-loop-002"
task_name: "Implement authenticated request client"
max_iterations: 2
on_max_iterations: "Stop and report unresolved Spotify client request issues."
handoff_summary: "Done: Added authenticated Spotify request client with injected fetch, base URL handling, bearer injection, JSON/204 handling, and normalized errors; npm test and npm run check pass. Failed: Initial RED test failed with ERR_MODULE_NOT_FOUND before client module existed. Needed: Implement refresh-before-request and one 401 retry."
todos:
  - id: "loop-002-todo-001"
    content: "Write failing tests for base URL joining and Authorization bearer injection using injected fetch and token reader."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Client request tests fail before implementation because src/spotify/client.ts is missing."
    status: "completed"
    priority: "high"
  - id: "loop-002-todo-002"
    content: "Implement src/spotify/client.ts for authenticated requests below the live network boundary."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Client can make injected-fetch requests with Spotify base URL and bearer token."
    status: "completed"
    priority: "high"
  - id: "loop-002-todo-003"
    content: "Run npm test and npm run check."
    skill: "superpowers:verification-before-completion"
    agent: "reviewer"
    outcome: "Both validation commands pass, or failures are captured with exact output."
    status: "completed"
    priority: "high"
prompt: |
  Execute Phase 2 loop 002 after loop 001 is complete.
  Own only src/spotify/client.ts and tests/spotify/client.test.js.
  Use injected fetch and token store functions only; do not call live Spotify.
```

```yaml
name: "ralph-loop-003"
task_name: "Implement refresh-before-request and 401 retry"
max_iterations: 2
on_max_iterations: "Stop and report unresolved refresh retry issues."
handoff_summary: "Done: Added refresh-before-request and one 401 refresh/retry path with tests; npm test and npm run check pass. Failed: Initial RED test failed before client supported token-data reads. Needed: Implement 429 Retry-After handling."
todos:
  - id: "loop-003-todo-001"
    content: "Write failing tests for expired-token refresh before request and one retry after 401."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Refresh/retry tests fail before implementation."
    status: "completed"
    priority: "high"
  - id: "loop-003-todo-002"
    content: "Extend src/spotify/client.ts to refresh and persist updated token data before retrying once."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Client refreshes expired tokens and retries one 401 without leaking token values."
    status: "completed"
    priority: "high"
  - id: "loop-003-todo-003"
    content: "Run npm test and npm run check."
    skill: "superpowers:verification-before-completion"
    agent: "reviewer"
    outcome: "Both validation commands pass, or failures are captured with exact output."
    status: "completed"
    priority: "high"
prompt: |
  Execute Phase 2 loop 003 after loop 002 is complete.
  Keep work scoped to refresh-before-request and 401 retry behavior.
```

```yaml
name: "ralph-loop-004"
task_name: "Implement rate-limit retry-after handling"
max_iterations: 2
on_max_iterations: "Stop and report unresolved rate-limit handling issues."
handoff_summary: "Done: Added bounded 429 Retry-After handling with injectable sleep and tests; npm test and npm run check pass. Failed: Initial RED test failed because 429 threw immediately instead of sleeping and retrying. Needed: Implement pagination helper."
todos:
  - id: "loop-004-todo-001"
    content: "Write failing tests for 429 Retry-After handling using an injectable sleeper."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Rate-limit tests fail before implementation."
    status: "completed"
    priority: "high"
  - id: "loop-004-todo-002"
    content: "Extend src/spotify/client.ts to sleep and retry on 429 according to Retry-After within bounded retry limits."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Client handles Spotify rate limits deterministically in tests."
    status: "completed"
    priority: "high"
  - id: "loop-004-todo-003"
    content: "Run npm test and npm run check."
    skill: "superpowers:verification-before-completion"
    agent: "reviewer"
    outcome: "Both validation commands pass, or failures are captured with exact output."
    status: "completed"
    priority: "high"
prompt: |
  Execute Phase 2 loop 004 after loop 003 is complete.
  Keep retries bounded and tests deterministic with injected sleep.
```

```yaml
name: "ralph-loop-005"
task_name: "Implement pagination helper"
max_iterations: 2
on_max_iterations: "Stop and report unresolved pagination issues."
handoff_summary: "Done: Added paginateAll helper with next-link following, order preservation, maxPages guard, and page-shape validation; npm test and npm run check pass. Failed: Initial RED test failed with ERR_MODULE_NOT_FOUND before paging module existed. Needed: Implement compact response shape helpers."
todos:
  - id: "loop-005-todo-001"
    content: "Write failing tests for following paged responses and accumulating items."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Pagination tests fail before implementation because src/spotify/paging.ts is missing."
    status: "completed"
    priority: "high"
  - id: "loop-005-todo-002"
    content: "Implement src/spotify/paging.ts."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Pagination helper follows next URLs and returns accumulated items."
    status: "completed"
    priority: "high"
  - id: "loop-005-todo-003"
    content: "Run npm test and npm run check."
    skill: "superpowers:verification-before-completion"
    agent: "reviewer"
    outcome: "Both validation commands pass, or failures are captured with exact output."
    status: "completed"
    priority: "high"
prompt: |
  Execute Phase 2 loop 005 after loop 004 is complete.
  Own only src/spotify/paging.ts and tests/spotify/paging.test.js.
```

```yaml
name: "ralph-loop-006"
task_name: "Implement compact shape helpers"
max_iterations: 2
on_max_iterations: "Stop and report unresolved response shaping issues."
handoff_summary: "Done: Added compact shape helpers for user, device, track, episode, playlist, and playback with partial-object tolerance; npm test and npm run check pass. Failed: Initial RED test failed with ERR_MODULE_NOT_FOUND before shapes module existed. Needed: Run Phase 2 completion gate."
todos:
  - id: "loop-006-todo-001"
    content: "Write failing tests for compact user, device, track, episode, playlist, and playback shapes."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Shape tests fail before implementation because src/spotify/shapes.ts is missing."
    status: "completed"
    priority: "high"
  - id: "loop-006-todo-002"
    content: "Implement src/spotify/shapes.ts with tolerant compact mappers."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Shape helpers return stable compact objects suitable for CLI and MCP outputs."
    status: "completed"
    priority: "high"
  - id: "loop-006-todo-003"
    content: "Run npm test and npm run check."
    skill: "superpowers:verification-before-completion"
    agent: "reviewer"
    outcome: "Both validation commands pass, or failures are captured with exact output."
    status: "completed"
    priority: "high"
prompt: |
  Execute Phase 2 loop 006 after loop 005 is complete.
  Own only src/spotify/shapes.ts and tests/spotify/shapes.test.js.
```

```yaml
name: "ralph-loop-007"
task_name: "Review Phase 2 completion"
max_iterations: 1
on_max_iterations: "Stop and report Phase 2 gate failures."
handoff_summary: "Done: Phase 2 gate passed. Verified normalized errors, authenticated client, refresh-before-request, one 401 retry, bounded 429 Retry-After handling, pagination, and compact shapes. npm test passed with 75 tests, npm run check passed, JSON manifests and skill frontmatter parsed, hygiene scans were clean, and .claude was absent. Failed: git status is unavailable because this workspace is not a Git repository. Needed: Plan and execute Phase 3."
todos:
  - id: "loop-007-todo-001"
    content: "Review all Phase 2 deliverables against .advanced-plans/phases/phase-2/plan.md."
    skill: "advanced-ai-workflows:workflow-verification"
    agent: "reviewer"
    outcome: "A Phase 2 verification summary states pass or lists exact remaining failures."
    status: "completed"
    priority: "high"
prompt: |
  Execute Phase 2 loop 007 after loop 006 is complete.
  Review only; do not implement new feature scope during the gate.
```

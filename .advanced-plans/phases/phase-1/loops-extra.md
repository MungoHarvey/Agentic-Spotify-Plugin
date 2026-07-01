# Phase 1 Additional Ralph Loops

```yaml
name: "ralph-loop-009"
task_name: "Implement Spotify token endpoint helpers"
max_iterations: 2
on_max_iterations: "Stop and report unresolved token endpoint helper issues."
handoff_summary: "Done: Added injected Spotify token endpoint helpers with tests; npm test and npm run check pass. Failed: Initial RED test failed with ERR_MODULE_NOT_FOUND before token-exchange module existed. Needed: Implement callback runtime and persisted login orchestration."
todos:
  - id: "loop-009-todo-001"
    content: "Write failing tests for authorization-code exchange, refresh-token exchange, response normalization, and token endpoint errors using injected fetch."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Token exchange tests fail before implementation because token endpoint helpers are missing."
    status: "completed"
    priority: "high"
  - id: "loop-009-todo-002"
    content: "Implement src/auth/token-exchange.ts with injected fetch and no client secret support."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Token exchange helpers build Spotify token endpoint requests and normalize token responses without live network access in tests."
    status: "completed"
    priority: "high"
  - id: "loop-009-todo-003"
    content: "Run npm test and npm run check."
    skill: "superpowers:verification-before-completion"
    agent: "reviewer"
    outcome: "Both validation commands pass, or failures are captured with exact output."
    status: "completed"
    priority: "high"
prompt: |
  Execute Phase 1 loop 009 in the spotify-plugin repo.
  Own only src/auth/token-exchange.ts and tests/auth/token-exchange.test.js.
  Use injected fetch only. Do not call live Spotify in tests. Do not add client secret support.
```

```yaml
name: "ralph-loop-010"
task_name: "Implement runtime callback server and login orchestration"
max_iterations: 2
on_max_iterations: "Stop and report unresolved login orchestration issues."
handoff_summary: "Done: Added callback server runtime helper and injectable persisted login session with tests; npm test and npm run check pass. Failed: Initial RED test failed on missing exports before implementation. Needed: Implement refresh exchange and then wire the real CLI login path to persisted login."
todos:
  - id: "loop-010-todo-001"
    content: "Write failing tests for callback server runtime and login orchestration with injected browser opener, callback waiter, token exchange, and token store."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Login orchestration tests fail before implementation because runtime helpers are missing."
    status: "completed"
    priority: "high"
  - id: "loop-010-todo-002"
    content: "Extend callback-server and auth command modules to support persisted login with injectable boundaries."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Login orchestration can persist returned token data in tests without opening a real browser or calling Spotify."
    status: "completed"
    priority: "high"
  - id: "loop-010-todo-003"
    content: "Run npm test and npm run check."
    skill: "superpowers:verification-before-completion"
    agent: "reviewer"
    outcome: "Both validation commands pass, or failures are captured with exact output."
    status: "completed"
    priority: "high"
prompt: |
  Execute Phase 1 loop 010 after loop 009 is complete.
  Keep browser opening, callback waiting, token exchange, and token writing injectable in tests.
```

```yaml
name: "ralph-loop-011"
task_name: "Implement refresh exchange CLI behavior"
max_iterations: 2
on_max_iterations: "Stop and report unresolved refresh exchange issues."
handoff_summary: "Done: Implemented persisted refresh-token exchange, removed the not-live refresh path, and wired CLI login toward persisted session flow while preserving explicit --url-only URL generation; npm test and npm run check pass. Failed: Initial RED test failed because runAuthRefreshSession was missing, and follow-up CLI test exposed the stale not-live refresh fallback. Needed: Update auth docs and run full Phase 1 gate."
todos:
  - id: "loop-011-todo-001"
    content: "Write failing tests for refresh command using stored refresh token and injected token exchange."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Refresh CLI tests fail before implementation because refresh exits not-live."
    status: "completed"
    priority: "high"
  - id: "loop-011-todo-002"
    content: "Implement refresh command persistence and redacted success output."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Refresh updates stored token data and never prints token values."
    status: "completed"
    priority: "high"
  - id: "loop-011-todo-003"
    content: "Run npm test and npm run check."
    skill: "superpowers:verification-before-completion"
    agent: "reviewer"
    outcome: "Both validation commands pass, or failures are captured with exact output."
    status: "completed"
    priority: "high"
prompt: |
  Execute Phase 1 loop 011 after loop 010 is complete.
  Keep token endpoint calls injectable in tests and do not print token values.
```

```yaml
name: "ralph-loop-012"
task_name: "Update auth docs and Spotify skill"
max_iterations: 1
on_max_iterations: "Stop and report unresolved docs or skill issues."
handoff_summary: "Done: Updated auth docs and Spotify auth skill reference; npm test, npm run check, frontmatter parsing, stale not-live scan, and docs scans pass. Failed: None. Needed: Run final Phase 1 gate."
todos:
  - id: "loop-012-todo-001"
    content: "Update skills/spotify/references/auth.md and create docs/spotify-auth-setup.md for implemented auth behavior and manual live verification."
    skill: "skill-creator"
    agent: "worker"
    outcome: "Auth docs and skill reference match implemented CLI behavior and do not claim unsupported Spotify behavior."
    status: "completed"
    priority: "medium"
  - id: "loop-012-todo-002"
    content: "Run npm test and npm run check plus skill/frontmatter scans."
    skill: "superpowers:verification-before-completion"
    agent: "reviewer"
    outcome: "Validation commands pass and docs contain no secrets or placeholder markers."
    status: "completed"
    priority: "high"
prompt: |
  Execute Phase 1 loop 012 after loop 011 is complete.
  Keep scope limited to auth docs and Spotify skill reference updates.
```

```yaml
name: "ralph-loop-013"
task_name: "Review full Phase 1 completion"
max_iterations: 1
on_max_iterations: "Stop and report Phase 1 gate failures."
handoff_summary: "Done: Full Phase 1 gate passed with 47 tests, TypeScript check, manifest/frontmatter parsing, stale not-live scan, docs presence checks, and secret review. Failed: git status remains unavailable because this workspace is not a valid git repository. Needed: Start Phase 2 shared Spotify client foundation."
todos:
  - id: "loop-013-todo-001"
    content: "Review all Phase 1 deliverables and success criteria against the current worktree."
    skill: "advanced-ai-workflows:workflow-verification"
    agent: "reviewer"
    outcome: "A full Phase 1 completion verdict states pass or lists exact remaining failures."
    status: "completed"
    priority: "high"
prompt: |
  Execute Phase 1 loop 013 after loop 012 is complete.
  Review only; do not implement new feature scope during the gate.
```

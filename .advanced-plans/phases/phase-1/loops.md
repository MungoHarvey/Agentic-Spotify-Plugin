# Phase 1 Ralph Loops

```yaml
name: "ralph-loop-001"
task_name: "Implement PKCE and OAuth state helpers"
max_iterations: 2
on_max_iterations: "Stop and report unresolved PKCE helper or test issues."
handoff_summary: "Done: Added PKCE and OAuth state helpers with tests; npm test and npm run check pass. Failed: Initial RED tests failed with ERR_MODULE_NOT_FOUND before helper modules existed. Needed: Implement config/env loading and authorization URL construction."
todos:
  - id: "loop-001-todo-001"
    content: "Write failing tests for PKCE verifier generation, known verifier challenge generation, and OAuth state generation/validation."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Tests exist under tests/auth and fail before implementation because PKCE/state helpers are missing."
    status: "completed"
    priority: "high"
  - id: "loop-001-todo-002"
    content: "Implement src/auth/pkce.ts and src/auth/oauth-state.ts with minimal code to satisfy the tests."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "PKCE and state helpers exist, use Node crypto, and expose deterministic challenge behavior for a known verifier."
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
  Execute Phase 1 loop 001 in the spotify-plugin repo.

  Scope:
  - Own only src/auth/pkce.ts, src/auth/oauth-state.ts, tests/auth/pkce.test.js, tests/auth/oauth-state.test.js, and any minimal TypeScript declarations needed inside those owned files.
  - Follow TDD: write tests first, run them and capture RED failure, implement minimal code, run GREEN.
  - Do not implement token storage, callback server, Spotify network calls, CLI auth commands, playlist, queue, playback, or search.

  Required context:
  - Read ARCHITECTURE.md.
  - Read .advanced-plans/phases/phase-1/plan.md.
  - Read src/cli/index.ts and tsconfig.json for existing project conventions.

  Required behavior:
  - generateCodeVerifier returns a URL-safe high-entropy string.
  - createCodeChallenge returns base64url(SHA256(verifier)).
  - createCodeChallenge is deterministic for verifier "test-verifier".
  - generateOAuthState returns a URL-safe non-empty string.
  - assertOAuthState validates exact state equality and throws on mismatch.

  Handoff format:
  Done: one sentence.
  Failed: one sentence or empty.
  Needed: one sentence or empty.
```

```yaml
name: "ralph-loop-005"
task_name: "Implement auth status and logout CLI commands"
max_iterations: 2
on_max_iterations: "Stop and report unresolved auth status/logout CLI issues."
handoff_summary: "Done: Added auth status/logout CLI routing with redacted output and tests; npm test and npm run check pass. Failed: Initial RED test failed because CLI printed help instead of auth behavior. Needed: Implement callback parsing and loopback server helpers."
todos:
  - id: "loop-005-todo-001"
    content: "Write failing tests for auth status JSON/text output and logout behavior using injectable token store paths."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "CLI auth tests fail before implementation because auth command routing is missing."
    status: "completed"
    priority: "high"
  - id: "loop-005-todo-002"
    content: "Implement src/cli/commands/auth.ts and update src/cli/index.ts routing for auth status and auth logout."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Auth status and logout commands work locally without Spotify network access and do not print token values."
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
  Execute Phase 1 loop 005 in the spotify-plugin repo after loop 004 is complete.

  Scope:
  - Own only src/cli/commands/auth.ts, src/cli/index.ts, and tests/cli/auth.test.js.
  - Follow TDD: write tests first, run them and capture RED failure, implement minimal code, run GREEN.
  - Do not implement Spotify network calls, login exchange, refresh exchange, callback server, playlist, queue, playback, or search.

  Required context:
  - Read ARCHITECTURE.md.
  - Read .advanced-plans/phases/phase-1/plan.md.
  - Read src/auth/token-store.ts.
  - Read src/config/paths.ts.
  - Read src/cli/index.ts.

  Required behavior:
  - spotify auth status --json reports unauthenticated when no token file exists.
  - spotify auth status --json reports authenticated metadata without token values when a token file exists.
  - spotify auth status text output never includes token values.
  - spotify auth logout deletes the token file and succeeds when it is already absent.
  - Tests use temporary token paths outside the repo through an injectable env variable.

  Handoff format:
  Done: one sentence.
  Failed: one sentence or empty.
  Needed: one sentence or empty.
```

```yaml
name: "ralph-loop-006"
task_name: "Implement callback parsing and loopback server helpers"
max_iterations: 2
on_max_iterations: "Stop and report unresolved callback server issues."
handoff_summary: "Done: Added callback parsing and loopback helper behavior with tests; npm test and npm run check pass. Failed: Initial RED test failed with ERR_MODULE_NOT_FOUND before callback module existed. Needed: Add auth login URL generation and refresh skeleton behavior."
todos:
  - id: "loop-006-todo-001"
    content: "Write failing tests for callback URL parsing, state validation, error callback handling, and loopback host selection."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Callback tests fail before implementation because callback helpers are missing."
    status: "completed"
    priority: "high"
  - id: "loop-006-todo-002"
    content: "Implement src/auth/callback-server.ts with testable parsing helpers and loopback binding constants."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Callback helper behavior is implemented without requiring live browser auth."
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
  Execute Phase 1 loop 006 in the spotify-plugin repo after loop 005 is complete.

  Scope:
  - Own only src/auth/callback-server.ts and tests/auth/callback-server.test.js.
  - Follow TDD: write tests first, run them and capture RED failure, implement minimal code, run GREEN.
  - Do not open browsers, call Spotify, exchange tokens, implement playlist, queue, playback, or search.

  Required context:
  - Read ARCHITECTURE.md.
  - Read .advanced-plans/phases/phase-1/plan.md.
  - Read src/auth/oauth-state.ts.

  Required behavior:
  - Export LOOPBACK_HOST as 127.0.0.1.
  - parseCallbackUrl accepts a callback URL, expected state, and returns { code, state } for valid callbacks.
  - parseCallbackUrl validates state using exact equality.
  - parseCallbackUrl throws a clear error if Spotify returns an error query parameter.
  - parseCallbackUrl throws a clear error if code is missing.
  - parseCallbackUrl throws a clear error on state mismatch.
  - Provide a createCallbackSuccessHtml helper with a short non-secret success page.

  Handoff format:
  Done: one sentence.
  Failed: one sentence or empty.
  Needed: one sentence or empty.
```

```yaml
name: "ralph-loop-007"
task_name: "Add auth login and refresh command skeletons"
max_iterations: 2
on_max_iterations: "Stop and report unresolved login/refresh skeleton issues."
handoff_summary: "Done: Added local auth login URL generation and explicit refresh-not-live CLI behavior with tests; npm test and npm run check pass. Failed: Initial RED test failed because login and refresh fell through to unknown-command behavior. Needed: Run Phase 1 verification review."
todos:
  - id: "loop-007-todo-001"
    content: "Write failing tests for auth login URL generation and refresh skeleton messaging without network calls."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Tests fail before implementation because login/refresh command handlers are missing."
    status: "completed"
    priority: "high"
  - id: "loop-007-todo-002"
    content: "Implement non-network auth login URL generation and explicit refresh not-yet-live skeleton behavior."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Login can generate a PKCE authorization URL locally and refresh reports clear not-yet-live behavior."
    status: "completed"
    priority: "high"
  - id: "loop-007-todo-003"
    content: "Run npm test and npm run check."
    skill: "superpowers:verification-before-completion"
    agent: "reviewer"
    outcome: "Both validation commands pass, or failures are captured with exact output."
    status: "completed"
    priority: "high"
prompt: |
  Execute Phase 1 loop 007 in the spotify-plugin repo after loop 006 is complete.

  Scope:
  - Own only src/cli/commands/auth.ts, src/cli/index.ts, and tests/cli/auth-login-refresh.test.js.
  - Follow TDD: write tests first, run them and capture RED failure, implement minimal code, run GREEN.
  - Do not exchange tokens with Spotify, open browsers, start callback servers, implement playlist, queue, playback, or search.

  Required context:
  - Read ARCHITECTURE.md.
  - Read .advanced-plans/phases/phase-1/plan.md.
  - Read src/auth/pkce.ts.
  - Read src/auth/oauth-state.ts.
  - Read src/auth/authorization-url.ts.
  - Read src/config/env.ts.
  - Read src/cli/commands/auth.ts.

  Required behavior:
  - spotify auth login --json generates an authorization URL locally from env config and returns JSON with authorizationUrl, redirectUri, scopes, and state.
  - spotify auth login text output prints the authorization URL and does not include token values.
  - Missing SPOTIFY_CLIENT_ID for auth login exits non-zero and prints a clear error.
  - spotify auth refresh exits non-zero with a clear message that live refresh exchange is not implemented yet.
  - Tests do not call Spotify, open a browser, or start a callback server.

  Handoff format:
  Done: one sentence.
  Failed: one sentence or empty.
  Needed: one sentence or empty.
```

```yaml
name: "ralph-loop-008"
task_name: "Review Phase 1 auth foundation"
max_iterations: 1
on_max_iterations: "Stop and report Phase 1 gate failures."
handoff_summary: "Done: Verified Phase 1 auth foundation files and local tests; npm test, npm run check, JSON/frontmatter parse, secret scan, and .claude check passed. Failed: Full Phase 1 is not complete because live token exchange and refresh support are not implemented. Needed: Add next Phase 1 loops for token exchange, refresh exchange, callback server runtime, and persisted login."
todos:
  - id: "loop-008-todo-001"
    content: "Review all Phase 1 deliverables against .advanced-plans/phases/phase-1/plan.md."
    skill: "advanced-ai-workflows:workflow-verification"
    agent: "reviewer"
    outcome: "A Phase 1 verification summary states which success criteria passed and which remain blocked."
    status: "completed"
    priority: "high"
prompt: |
  Execute Phase 1 loop 008 after loop 007 is complete.
  Review Phase 1 deliverables only and do not implement new feature scope during the review.
```

```yaml
name: "ralph-loop-002"
task_name: "Implement config loading and authorization URL construction"
max_iterations: 2
on_max_iterations: "Stop and report unresolved config or URL construction issues."
handoff_summary: "Done: Added config/env loading and authorization URL construction with tests; npm test and npm run check pass. Failed: Initial RED tests failed with ERR_MODULE_NOT_FOUND before modules existed. Needed: Implement token types, expiry helpers, and token store path helpers."
todos:
  - id: "loop-002-todo-001"
    content: "Write failing tests for Spotify config loading and authorization URL construction."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Tests cover client ID, redirect URI, scopes, state, challenge, and missing client ID errors."
    status: "completed"
    priority: "high"
  - id: "loop-002-todo-002"
    content: "Implement src/config/env.ts and src/auth/authorization-url.ts."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Config and URL helpers produce Spotify PKCE authorization URLs without network access."
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
  Execute Phase 1 loop 002 in the spotify-plugin repo after loop 001 is complete.

  Scope:
  - Own only src/config/env.ts, src/auth/authorization-url.ts, tests/config/env.test.js, tests/auth/authorization-url.test.js, and minimal edits to existing owned imports if needed.
  - Follow TDD: write tests first, run them and capture RED failure, implement minimal code, run GREEN.
  - Do not implement token storage, callback server, Spotify network calls, CLI auth commands, playlist, queue, playback, or search.

  Required context:
  - Read ARCHITECTURE.md.
  - Read .advanced-plans/phases/phase-1/plan.md.
  - Read src/auth/pkce.ts and src/auth/oauth-state.ts.
  - Read .env.example.

  Required behavior:
  - loadSpotifyConfig reads SPOTIFY_CLIENT_ID, SPOTIFY_REDIRECT_URI, and SPOTIFY_SCOPES from an injectable env object.
  - Missing SPOTIFY_CLIENT_ID throws a clear error.
  - Redirect URI defaults to http://127.0.0.1:43210/callback.
  - Scopes default to the initial scope bundle from ARCHITECTURE.md.
  - SPOTIFY_SCOPES supports space-separated scopes.
  - buildAuthorizationUrl returns a Spotify accounts authorize URL with response_type=code, client_id, redirect_uri, scope, state, code_challenge_method=S256, and code_challenge.

  Handoff format:
  Done: one sentence.
  Failed: one sentence or empty.
  Needed: one sentence or empty.
```

```yaml
name: "ralph-loop-003"
task_name: "Implement token types and token store path helpers"
max_iterations: 2
on_max_iterations: "Stop and report unresolved token helper issues."
handoff_summary: "Done: Added token expiry helpers and repo-safe default token-store path selection with tests; npm test and npm run check pass. Failed: Initial RED tests failed with ERR_MODULE_NOT_FOUND/missing export before implementation. Needed: Implement token store read/write/delete and redacted status shaping."
todos:
  - id: "loop-003-todo-001"
    content: "Write failing tests for token expiry helpers and token store default path selection outside the repo."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Tests cover expires_at behavior and default token path location."
    status: "completed"
    priority: "high"
  - id: "loop-003-todo-002"
    content: "Implement src/auth/tokens.ts and extend src/config/paths.ts as needed."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Token helper functions and path selection are implemented without storing any live credentials."
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
  Execute Phase 1 loop 003 in the spotify-plugin repo after loop 002 is complete.

  Scope:
  - Own only src/auth/tokens.ts, src/config/paths.ts, tests/auth/tokens.test.js, tests/config/paths.test.js.
  - Follow TDD: write tests first, run them and capture RED failure, implement minimal code, run GREEN.
  - Do not implement token file read/write/delete, callback server, Spotify network calls, CLI auth commands, playlist, queue, playback, or search.

  Required context:
  - Read ARCHITECTURE.md.
  - Read .advanced-plans/phases/phase-1/plan.md.
  - Read src/config/paths.ts.
  - Read src/config/env.ts.
  - Read .env.example.

  Required behavior:
  - Define stored token data types without embedding live token values in tests.
  - isTokenExpired returns true when expiresAt is at or before now plus an optional skew.
  - isTokenExpired returns false for tokens beyond the skew window.
  - getDefaultTokenStorePath returns a path under APPDATA on Windows-like env input.
  - getDefaultTokenStorePath falls back to a home-directory app config path when APPDATA is absent.
  - getDefaultTokenStorePath must not return a path inside the repository when provided a repo root.

  Handoff format:
  Done: one sentence.
  Failed: one sentence or empty.
  Needed: one sentence or empty.
```

```yaml
name: "ralph-loop-004"
task_name: "Implement token store read write delete and redacted status"
max_iterations: 2
on_max_iterations: "Stop and report unresolved token store issues."
handoff_summary: "Done: Added token store read/write/delete and redacted auth status shaping with tests; npm test and npm run check pass. Failed: Initial RED test failed with ERR_MODULE_NOT_FOUND before token-store module existed. Needed: Add remaining Phase 1 loops for CLI auth status/logout, callback server, and login/refresh skeletons."
todos:
  - id: "loop-004-todo-001"
    content: "Write failing tests for token store read/write/delete and redacted status output."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Tests use temporary directories and assert token values are not exposed in status shapes."
    status: "completed"
    priority: "high"
  - id: "loop-004-todo-002"
    content: "Implement src/auth/token-store.ts."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "Token store supports testable read/write/delete behavior without writing inside the repo by default."
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
  Execute Phase 1 loop 004 in the spotify-plugin repo after loop 003 is complete.

  Scope:
  - Own only src/auth/token-store.ts and tests/auth/token-store.test.js.
  - Follow TDD: write tests first, run them and capture RED failure, implement minimal code, run GREEN.
  - Do not implement callback server, Spotify network calls, CLI auth commands, playlist, queue, playback, or search.

  Required context:
  - Read ARCHITECTURE.md.
  - Read .advanced-plans/phases/phase-1/plan.md.
  - Read src/auth/tokens.ts.
  - Read src/config/paths.ts.

  Required behavior:
  - readTokenStore returns null when the token file is missing.
  - writeTokenStore creates parent directories and writes formatted JSON.
  - readTokenStore reads back the written token data.
  - deleteTokenStore removes the token file and does not fail if it is already absent.
  - createAuthStatus returns an unauthenticated status when no token data exists.
  - createAuthStatus returns authenticated metadata when token data exists, including expiresAt and scopes, without exposing accessToken or refreshToken values.
  - Tests must use a temporary directory outside the repo and non-secret dummy token values.

  Handoff format:
  Done: one sentence.
  Failed: one sentence or empty.
  Needed: one sentence or empty.
```

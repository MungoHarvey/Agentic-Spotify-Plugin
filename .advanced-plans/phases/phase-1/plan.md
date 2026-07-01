# Phase 1 Plan: PKCE Auth and Token Storage

## Objective

Implement the local Spotify Authorization Code with PKCE foundation and safe token storage primitives for the CLI-first plugin without adding playlist, queue, playback, or search behavior.

## Included Scope

- PKCE verifier and challenge generation.
- OAuth state generation and validation helpers.
- Spotify authorization URL construction.
- Environment/config loading for client ID, redirect URI, scopes, and token path.
- Token data types and expiry helpers.
- Token store path selection outside the repository.
- Token store read/write/delete behavior with no token values printed by status commands.
- CLI commands for `spotify auth status`, `spotify auth login`, `spotify auth refresh`, and `spotify auth logout`.
- A local loopback callback server bound to `127.0.0.1`.
- Unit tests below the Spotify network boundary.

## Excluded Scope

- No playlist, queue, playback, or search commands.
- No Web Playback SDK setup app.
- No broad MCP tool additions.
- No live Spotify calls in automated tests.
- No client secret support.

## Deliverables

- `src/auth/pkce.ts`
- `src/auth/oauth-state.ts`
- `src/auth/authorization-url.ts`
- `src/auth/tokens.ts`
- `src/auth/token-store.ts`
- `src/auth/callback-server.ts`
- `src/config/env.ts`
- `src/cli/commands/auth.ts`
- updates to `src/cli/index.ts`
- tests under `tests/auth/`
- tests under `tests/config/`
- tests under `tests/cli/`
- updates to `skills/spotify/references/auth.md`

## Verifiable Success Criteria

- `npm test` passes without network access.
- `npm run check` passes.
- PKCE challenge generation is deterministic for a known verifier.
- Authorization URLs include exact redirect URI, scopes, state, `code_challenge`, and `S256`.
- Token store tests prove the default path is outside the repository and token values are not printed by auth status.
- CLI auth status reports unauthenticated state when no token file exists.
- Callback server tests prove it binds to `127.0.0.1` and validates state through testable helpers.

## Dependencies

- Phase 0 completed.
- Node.js built-in `crypto`, `fs`, `os`, `path`, and `http` modules.
- Live Spotify login later requires a configured Spotify developer app, but automated tests must not require it.

## Broad Skills Required

- `superpowers:test-driven-development`
- `superpowers:systematic-debugging`
- `superpowers:verification-before-completion`
- `advanced-ai-workflows:workflow-execution`
- `advanced-ai-workflows:workflow-next-loop`

## Risks and Mitigations

- Risk: Tokens could be accidentally logged. Mitigation: token status shapes must redact token values by design and tests must assert this.
- Risk: Token store writes inside the repo. Mitigation: path helpers default to per-user app data and tests assert the default path is outside the workspace.
- Risk: Live Spotify auth complicates tests. Mitigation: separate URL construction, callback parsing, and token exchange boundaries so local unit tests do not hit the network.
- Risk: CLI auth commands grow too large. Mitigation: keep auth command parsing thin and put behavior in auth/config modules.

## Ralph Loop Outline

1. Implement and test PKCE plus OAuth state helpers.
2. Implement and test config/env loading plus authorization URL construction.
3. Implement and test token types, expiry helpers, and token store path behavior.
4. Implement and test token store read/write/delete with redacted status shaping.
5. Implement auth status/logout CLI commands.
6. Implement callback server helper and test callback parsing/state validation.
7. Add login/refresh command skeletons with clear not-yet-live or injectable network boundary behavior.
8. Implement token endpoint exchange helpers with injected fetch for tests.
9. Implement runtime callback server helpers and persisted login orchestration.
10. Implement refresh-token exchange and persisted token update.
11. Update auth skill/docs for implemented behavior.
12. Review Phase 1 against success criteria.

# Phase 4 Plan: Account, Device, Playback, and Queue Diagnostics

## Objective

Expose read-only Spotify diagnostics on top of the shared client foundation so a connected user can inspect account metadata, devices, playback state, the currently playing item, and queue state with compact JSON output.

## Included Scope

- `spotify me`
- `spotify player devices`
- `spotify player state`
- `spotify player current`
- `spotify queue get`
- Compact JSON output for all diagnostics.
- Human-readable fallback output where it is straightforward.
- Reusable endpoint wrappers under `src/spotify/`.
- CLI command routing under `src/cli/`.
- Unit tests with injected fetch/token boundaries and no live Spotify calls.
- Skill command reference updates for newly implemented commands.

## Excluded Scope

- No playback control commands.
- No queue add commands.
- No playlist read/write commands.
- No search or URI resolution commands.
- No MCP wrappers.
- No live Spotify checks in automated tests.
- No Web Playback SDK setup app.

## Deliverables

- `src/spotify/account.ts`
- `src/spotify/player.ts`
- `src/spotify/queue.ts`
- `src/cli/commands/me.ts`
- `src/cli/commands/player.ts`
- `src/cli/commands/queue.ts`
- updates to `src/cli/index.ts`
- tests under `tests/spotify/` and `tests/cli/`
- updates to `skills/spotify/references/command-reference.md`
- updates to `skills/spotify/references/queue-workflows.md` if queue behavior guidance changes

## Verifiable Success Criteria

- `spotify me --json` returns compact current-user metadata without token values.
- `spotify player devices --json` returns compact device entries.
- `spotify player state --json` returns compact playback state and handles `204` as no active playback.
- `spotify player current --json` returns compact current item and handles `204` as no current item.
- `spotify queue get --json` returns compact queue state with currently playing and queued item summaries.
- Commands fail clearly when unauthenticated.
- Premium, missing-scope, and no-active-device failures surface normalized Spotify errors without token values.
- `npm test` passes.
- `npm run check` passes.
- Placeholder, secret, `.claude`, and `plannotator` hygiene checks pass.

## Dependencies

- Phase 1 auth/token store.
- Phase 2 shared client, errors, pagination, and shape helpers.
- Phase 3 skill references.

## Broad Skills Required

- `superpowers:test-driven-development`
- `advanced-ai-workflows:workflow-execution`
- `advanced-ai-workflows:workflow-verification`
- `skill-creator`

## Risks and Mitigations

- Risk: CLI commands duplicate client auth/refresh behavior. Mitigation: all commands use `createSpotifyClient`.
- Risk: Queue and playback commands imply Premium operations are available to all users. Mitigation: keep error text explicit and read-only in this phase.
- Risk: Responses become too large for Codex. Mitigation: use compact shape helpers and limit queue item detail.
- Risk: Tests hit live Spotify. Mitigation: inject fetch/token boundaries or test command modules directly.

## Ralph Loop Outline

1. Implement `spotify me`.
2. Implement `spotify player devices`.
3. Implement `spotify player state` and `spotify player current`.
4. Implement `spotify queue get`.
5. Update diagnostics docs, references, and error explanations.
6. Review Phase 4 against success criteria.

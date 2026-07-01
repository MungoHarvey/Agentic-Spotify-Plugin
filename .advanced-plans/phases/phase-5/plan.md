# Phase 5 Plan: Playlist Reads

## Objective

Let Codex inspect playlists and playlist items reliably before any playlist mutation work.

## Included Scope

- `spotify playlists list`
- `spotify playlists list --all`
- `spotify playlist get <playlist_id>`
- `spotify playlist items <playlist_id>`
- pagination support through the existing pagination helper
- compact playlist and playlist item JSON output
- playlist item positions for later duplicate-aware writes
- CLI routing and help updates
- skill reference updates for implemented playlist reads

## Excluded Scope

- No playlist writes.
- No search or URI resolution.
- No queue additions or playback control.
- No MCP wrappers.
- No live Spotify calls in automated tests.

## Deliverables

- `src/spotify/playlists.ts`
- `src/cli/commands/playlists.ts`
- `src/cli/commands/playlist.ts`
- updates to `src/spotify/shapes.ts`
- updates to `src/cli/index.ts`
- tests under `tests/spotify/` and `tests/cli/`
- updates to `skills/spotify/references/command-reference.md`
- updates to `skills/spotify/references/playlist-workflows.md`

## Verifiable Success Criteria

- `spotify playlists list --json` returns compact current-user playlist page data.
- `spotify playlists list --all --json` follows pagination and returns accumulated compact playlists.
- `spotify playlist get <playlist_id> --json` returns compact playlist metadata.
- `spotify playlist items <playlist_id> --json` returns compact items with positions.
- Playlist item output is compact enough for Codex to parse safely.
- Commands fail clearly when unauthenticated.
- Automated tests use injected fetch/token boundaries only.
- `npm test` passes.
- `npm run check` passes.
- Placeholder, secret, `.claude`, and `plannotator` hygiene checks pass.

## Dependencies

- Phase 2 shared client, pagination helper, and shape helpers.
- Phase 4 diagnostics command routing patterns.

## Broad Skills Required

- `superpowers:test-driven-development`
- `advanced-ai-workflows:workflow-execution`
- `advanced-ai-workflows:workflow-verification`
- `skill-creator`

## Risks and Mitigations

- Risk: Large playlist responses are too verbose. Mitigation: compact item shape and preserve only useful fields.
- Risk: Duplicate-aware writes later lack positions. Mitigation: include zero-based playlist item positions now.
- Risk: CLI duplicates auth/client refresh behavior again. Mitigation: keep patterns consistent and consider shared CLI session helper after this read phase.
- Risk: Pagination loops indefinitely. Mitigation: use existing `paginateAll` max-page guard where applicable.

## Ralph Loop Outline

1. Implement `spotify playlists list`.
2. Implement `spotify playlists list --all`.
3. Implement `spotify playlist get <playlist_id>`.
4. Implement `spotify playlist items <playlist_id>` with item positions.
5. Update playlist read docs and references.
6. Review Phase 5 against success criteria.

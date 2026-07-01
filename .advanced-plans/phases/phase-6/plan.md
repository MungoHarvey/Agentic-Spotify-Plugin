# Phase 6 Plan: Playlist Writes

## Objective

Support core playlist mutation workflows with explicit, auditable, snapshot-aware behavior.

## Included Scope

- `spotify playlist create <name>`
- `spotify playlist update <playlist_id>`
- `spotify playlist add <playlist_id> <uri...>`
- `spotify playlist remove <playlist_id> <uri...>`
- `spotify playlist remove-positions <playlist_id> <position...>`
- `spotify playlist reorder <playlist_id>`
- `spotify playlist replace <playlist_id> <uri...>`
- snapshot ID reporting for every mutation that returns one
- duplicate-aware position removals
- batched add behavior where Spotify API limits apply
- CLI JSON output for all write commands
- docs and skill reference updates for implemented writes

## Excluded Scope

- No search or URI resolution.
- No queue additions or playback control.
- No MCP wrappers.
- No live Spotify calls in automated tests.
- No silent best-effort selection of ambiguous tracks.

## Deliverables

- updates to `src/spotify/playlists.ts`
- updates to `src/cli/commands/playlist.ts`
- updates to `src/cli/index.ts`
- tests under `tests/spotify/` and `tests/cli/`
- updates to `skills/spotify/references/command-reference.md`
- updates to `skills/spotify/references/playlist-workflows.md`
- `.advanced-plans/gate-verdicts/phase-6.md`

## Verifiable Success Criteria

- `spotify playlist create <name> --json` creates a playlist for the current user and returns compact playlist metadata.
- `spotify playlist update <playlist_id> --json` updates metadata and returns an auditable result.
- `spotify playlist add <playlist_id> <uri...> --json` batches item additions and returns `snapshotId`.
- `spotify playlist remove <playlist_id> <uri...> --json` removes by URI and returns `snapshotId`.
- `spotify playlist remove-positions <playlist_id> <position...> --snapshot-id <snapshot_id> --json` removes duplicate-sensitive positions and returns `snapshotId`.
- `spotify playlist reorder <playlist_id> --range-start <n> --insert-before <n> [--range-length <n>] [--snapshot-id <id>] --json` returns `snapshotId`.
- `spotify playlist replace <playlist_id> <uri...> --json` replaces playlist contents and returns an auditable result.
- Commands fail clearly when required arguments are missing.
- Automated tests use injected fetch/token boundaries only.
- `npm test` passes.
- `npm run check` passes.
- Placeholder, secret, `.claude`, and `plannotator` hygiene checks pass.

## Dependencies

- Phase 5 playlist reads.
- Shared Spotify client, token refresh, and normalized error handling.
- Existing compact playlist and playlist item shape helpers.

## Broad Skills Required

- `superpowers:test-driven-development`
- `advanced-ai-workflows:workflow-execution`
- `advanced-ai-workflows:workflow-verification`
- `skill-creator`

## Risks and Mitigations

- Risk: Playlist writes are destructive or ambiguous. Mitigation: require explicit playlist IDs and URIs; no search selection in this phase.
- Risk: Duplicate removals remove the wrong instance. Mitigation: support position-aware removals with snapshot IDs.
- Risk: Large additions exceed Spotify API limits. Mitigation: batch additions in bounded chunks.
- Risk: Snapshot conflicts are hidden. Mitigation: return snapshot IDs and surface Spotify errors from the shared client.
- Risk: Token values leak through errors. Mitigation: continue using shared client and tests asserting output redaction.

## Ralph Loop Outline

1. Implement playlist creation.
2. Implement playlist metadata updates.
3. Implement batched playlist additions.
4. Implement URI-based playlist removals.
5. Implement position-aware playlist removals.
6. Implement playlist reorder.
7. Implement playlist replace.
8. Update playlist write docs and references.
9. Review Phase 6 against success criteria.

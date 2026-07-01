# Playlist Workflows

Use playlists as a read-first, snapshot-aware workflow.

## Read before write

- Use `spotify playlists list --json` or `spotify playlists list --all --json` to discover playlists.
- Use `spotify playlist get <playlist_id> --json` to inspect playlist metadata.
- Use `spotify playlist items <playlist_id> --json` to inspect playlist contents before mutation.
- Keep large playlists paged and compact.
- Preserve item positions when duplicate-aware edits matter.
- Treat playlist read commands and core playlist write commands as implemented.

## Write rules

- Use explicit playlist IDs, Spotify URIs, and numeric positions. Do not resolve search strings during write commands.
- Return and preserve `snapshotId` from every mutation that provides one.
- Batch additions in 100-item chunks.
- Replace playlist contents with a `PUT` for the first 100 URIs and `POST` batches for any remaining URIs.
- Use URI-based removals for direct deletes when duplicate identity does not matter.
- Use `spotify playlist remove-positions <playlist_id> <position...> --snapshot-id <snapshot_id> --json` when duplicates must be targeted precisely.
- Use `spotify playlist reorder <playlist_id> --range-start <n> --insert-before <n> [--range-length <n>] [--snapshot-id <id>] --json` for explicit item moves.
- Re-read the playlist when a write depends on the latest snapshot or item order.
- If a write conflicts with the current snapshot, surface the mismatch and retry only with a fresh read.
- Apply metadata updates separately from item edits when that keeps the operation auditable.

## Search-driven edits

- Do not silently choose a single candidate from ambiguous search results.
- Ask the user to confirm the target unless they explicitly requested best-effort behavior.
- When best-effort is allowed, state the fallback that was chosen and keep it reversible.

## Limits

- Keep write intents explicit.
- Do not hide conflicts, snapshot mismatches, or partial failures.
- Do not describe search-driven playlist edits as implemented until search and URI resolution commands land.

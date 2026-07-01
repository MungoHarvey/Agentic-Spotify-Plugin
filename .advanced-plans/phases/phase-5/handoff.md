# Phase 5 Handoff

## Ready State

Playlist read coverage is implemented and tested below the live Spotify network boundary.

## Implemented Commands

- `spotify playlists list --json`
- `spotify playlists list --all --json`
- `spotify playlist get <playlist_id> --json`
- `spotify playlist items <playlist_id> --json`

## Key Implementation Files

- `src/spotify/playlists.ts`
- `src/spotify/shapes.ts`
- `src/cli/commands/playlists.ts`
- `src/cli/commands/playlist.ts`
- `src/cli/index.ts`

## Constraints To Preserve

- Keep playlist reads compact by default.
- Preserve playlist item positions for duplicate-aware writes.
- Do not implement playlist writes without snapshot-aware behavior.
- Keep automated tests below the live Spotify network boundary.
- Keep JSON output free of token values.

## Suggested Next Phase

Implement playlist writes:

- `spotify playlist create`
- `spotify playlist update`
- `spotify playlist add`
- `spotify playlist remove`
- `spotify playlist remove-positions`
- `spotify playlist reorder`
- `spotify playlist replace`

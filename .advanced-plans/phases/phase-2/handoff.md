# Phase 2 Handoff

## Ready State

The shared Spotify client foundation is ready for feature command phases.

## Available Building Blocks

- `createSpotifyClient` for authenticated Web API requests with injected fetch and token refresh boundaries.
- `createSpotifyApiError` and `SpotifyApiError` for normalized API failures.
- `paginateAll` for accumulating Spotify paged responses.
- Shape helpers for compact CLI/MCP-safe outputs:
  - `shapeUser`
  - `shapeDevice`
  - `shapeTrack`
  - `shapeEpisode`
  - `shapePlaylist`
  - `shapePlayback`

## Constraints To Preserve

- Keep automated tests below the live Spotify network boundary.
- Use injected fetch, sleeper, browser, and token-store boundaries.
- Do not introduce client-secret support.
- Prefer skills and CLI command implementation before broad MCP tool expansion.

## Suggested Next Phase

Implement the first user-facing read-only Spotify workflows on top of the client foundation: account profile, devices, current playback, search, and compact output formatting.

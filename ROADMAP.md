# Spotify Codex Plugin Roadmap

This roadmap turns the Spotify developer research into staged development work. The priority is to create a reliable local connection flow first, then build playlist and queue tools on top of a tested Spotify API client.

## Stage 0: Project Scaffold

Goal: create the basic Codex plugin structure and development conventions.

Deliverables:

- `.codex-plugin/plugin.json` with valid plugin metadata.
- `.mcp.json` or equivalent MCP server configuration.
- Source tree for auth, Spotify API wrappers, tool handlers, and local web app.
- `.env.example` or setup template for non-secret Spotify app configuration.
- Basic test runner and lint/type-check command.
- Documentation links from `README.md`.

Exit criteria:

- Plugin manifest validates.
- A developer can identify where auth, API client, tools, and web setup code will live.
- No secrets or tokens are stored in the repository.

## Stage 1: Local Spotify Connection

Goal: authenticate a Spotify user through a local web app using Authorization Code with PKCE.

Deliverables:

- PKCE verifier/challenge generation.
- Local callback server for `http://127.0.0.1:<port>/callback`.
- Spotify authorization URL builder.
- Token exchange and refresh support.
- Token storage strategy that keeps credentials outside git.
- Connection status page or command.

Required scopes:

```text
playlist-read-private
playlist-read-collaborative
playlist-modify-private
playlist-modify-public
user-read-playback-state
user-read-currently-playing
user-modify-playback-state
streaming
user-read-private
```

Exit criteria:

- A developer can connect a Spotify account from the local browser flow.
- Access tokens refresh without repeating full authorization.
- Auth failures explain common causes: redirect mismatch, missing tester allowlist, missing scope, expired token.

## Stage 2: Spotify API Client Foundation

Goal: build a reusable client layer before exposing many tools.

Deliverables:

- Authenticated HTTP client for `https://api.spotify.com/v1`.
- Central error handling for `401`, `403`, `404`, and `429`.
- Rate-limit handling using `Retry-After`.
- Pagination helpers for `limit` and `offset` endpoints.
- Compact response shaping helpers for tracks, episodes, playlists, devices, and users.
- Test fixtures for representative Spotify responses.

Exit criteria:

- API wrappers do not duplicate auth, retry, paging, or response shaping logic.
- Unit tests cover token refresh, pagination, rate-limit handling, and common API errors.
- Tool handlers can depend on typed, predictable client functions.

## Stage 3: Connection and Playback Diagnostics

Goal: expose enough read-only tools to verify account, scopes, Premium status, devices, and current playback.

Tools:

```text
spotify_auth_status()
spotify_auth_connect_url(scopes?)
spotify_auth_refresh()
spotify_me()
spotify_player_devices()
spotify_player_state()
spotify_player_current()
```

Deliverables:

- Current user profile lookup.
- Device list lookup.
- Current playback state lookup.
- Currently playing item lookup.
- Clear Premium-related warnings for playback and queue features.

Exit criteria:

- The plugin can report whether it is authenticated and which scopes are active.
- The plugin can detect if there is no active playback device.
- The plugin can distinguish auth problems from Spotify account or playback-state problems.

## Stage 4: Playlist Read Coverage

Goal: make playlist inspection reliable before adding playlist writes.

Tools:

```text
spotify_playlists_current_user(limit?, offset?)
spotify_playlists_current_user_all()
spotify_playlist_get(playlist_id, fields?)
spotify_playlist_items(playlist_id, limit?, offset?, fields?)
spotify_playlist_items_all(playlist_id, fields?)
```

Deliverables:

- Current user's playlist listing.
- Playlist metadata lookup.
- Playlist item listing with pagination.
- Default compact playlist item shape for Codex responses.
- Optional `fields` support for advanced callers.

Exit criteria:

- A user can list all current playlists.
- A user can inspect all tracks or episodes in a playlist.
- Large playlists are handled without oversized tool responses by default.

## Stage 5: Playlist Mutation Coverage

Goal: support the core editable playlist workflow with snapshot-aware writes.

Tools:

```text
spotify_playlist_create(name, public?, collaborative?, description?)
spotify_playlist_update_details(playlist_id, name?, public?, collaborative?, description?)
spotify_playlist_add_items(playlist_id, uris, position?)
spotify_playlist_remove_items(playlist_id, uris, snapshot_id?)
spotify_playlist_remove_positions(playlist_id, positions, snapshot_id?)
spotify_playlist_reorder_items(playlist_id, range_start, insert_before, range_length?, snapshot_id?)
spotify_playlist_replace_items(playlist_id, uris)
```

Deliverables:

- Playlist creation using the current user's ID.
- Playlist metadata updates.
- Batched item additions.
- URI-based removals.
- Position-aware removals for duplicate tracks.
- Reorder and replace support.
- Snapshot ID capture and conflict reporting.

Exit criteria:

- Playlist writes return the resulting snapshot ID.
- Duplicate-track removals can target specific positions.
- Mutation failures recommend re-reading the playlist when the snapshot is stale.
- Public/private scope failures are explained clearly.

## Stage 6: Queue and Playback Control

Goal: support practical queue management within Spotify's API limits.

Tools:

```text
spotify_queue_get()
spotify_queue_add(uri, device_id?)
spotify_queue_add_many(uris, device_id?)
spotify_player_transfer(device_id, play?)
spotify_player_play(context_uri?, uris?, offset?, position_ms?, device_id?)
spotify_player_pause(device_id?)
spotify_player_next(device_id?)
spotify_player_previous(device_id?)
```

Deliverables:

- Current queue read support.
- Single-item and multi-item queue additions.
- Device-targeted queue additions.
- Playback transfer helper.
- Basic play, pause, next, and previous controls.
- Explicit documentation that live queue reorder/remove is not available through Spotify's Web API.

Exit criteria:

- Queue tools work against an active Premium playback device.
- Multi-add queue operations handle partial failures and rate limits.
- The plugin does not imply support for queue operations Spotify does not expose.

## Stage 7: Search and URI Resolution

Goal: make playlist and queue tools easier to use from natural language requests.

Tools:

```text
spotify_search(q, types?, market?, limit?)
spotify_resolve_uri(query, types?)
spotify_track_get(track_id, market?)
spotify_tracks_get(track_ids, market?)
spotify_album_get(album_id, market?)
spotify_artist_get(artist_id)
```

Deliverables:

- Search across tracks, albums, artists, playlists, shows, and episodes where useful.
- Candidate-based URI resolution.
- Batch track lookup.
- Market-aware lookup support.
- Safeguards against silently choosing ambiguous search results for write operations.

Exit criteria:

- A user can find Spotify URIs without leaving Codex.
- Write tools can accept resolved URIs from prior search results.
- Ambiguous search results require explicit selection unless best-effort behavior was requested.

## Stage 8: Web Playback SDK Setup App

Goal: optionally turn the local browser into a Spotify Connect device for playback and queue testing.

Deliverables:

- Web Playback SDK script loading.
- `Spotify.Player` initialization.
- SDK `ready` event handling and device ID display.
- "Transfer playback here" action.
- Small diagnostics panel for current account, active device, and playback state.
- Clear Premium requirement messaging.

Exit criteria:

- A Premium user can activate the browser as a playback device.
- The plugin can queue and control playback against the SDK device.
- Playlist tools continue to work without the SDK running.

## Stage 9: Tool Coverage Hardening

Goal: make the plugin reliable enough for repeated use.

Deliverables:

- End-to-end manual test script for auth, playlist reads, playlist writes, queue reads, and queue additions.
- Error message review for common Spotify failures.
- Response-size limits for large playlists and queues.
- Secrets review.
- Documentation for Spotify dashboard setup, redirect URI, tester allowlisting, and Premium requirements.

Exit criteria:

- New developers can follow docs to connect their Spotify account.
- Tests cover the client layer and high-risk tool behavior.
- Manual verification covers a real Spotify account flow.

## Stage 10: Packaging and Release Readiness

Goal: prepare the plugin for local installation and later broader sharing.

Deliverables:

- Plugin validation script or documented validation command.
- Installation instructions.
- Reinstall/update workflow for local development.
- Scope table and security notes.
- Known limitations document.
- Optional path toward Spotify extended quota mode if the plugin needs users beyond the development allowlist.

Exit criteria:

- The plugin can be installed locally in Codex.
- The plugin can be updated without losing local credentials.
- Remaining limitations are documented rather than hidden in implementation behavior.

## Priority Order

1. Stages 0-3 establish the connection loop and diagnostics.
2. Stages 4-5 deliver the main playlist value.
3. Stage 6 adds queue support while respecting Spotify API limitations.
4. Stage 7 improves usability with search and URI resolution.
5. Stage 8 is useful for playback testing but should not block playlist work.
6. Stages 9-10 harden the plugin for repeated local use and sharing.

## Current Next Step

Start with Stage 0 and Stage 1: scaffold the plugin, then implement the local PKCE connection flow. Do not build playlist or queue tools until the auth, token refresh, and basic diagnostics path is working.

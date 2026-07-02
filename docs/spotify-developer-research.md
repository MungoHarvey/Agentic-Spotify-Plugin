# Spotify Developer Research for the Agentic Spotify Plugin

Date: 2026-06-26

This brief summarizes the Spotify Web API and Web Playback SDK surface we need for an agentic Spotify plugin that can connect to a user account, inspect playlists, and manipulate queues and playlists. It is based on the official Spotify developer documentation listed in the Sources section.

## Executive Summary

Build the first version around a local web app using Authorization Code with PKCE. PKCE avoids storing a client secret and is the right fit for a local browser-based connection flow. The plugin should request narrow scopes first, then add scopes only as tools require them.

The highest-value initial coverage is:

- Read current user profile and available devices.
- Read current playback state, current queue, and current playing item.
- Add items to queue.
- Read current user's playlists and playlist items.
- Create playlists, add playlist items, remove playlist items, and reorder/replace playlist items.
- Optionally activate a browser playback device through the Web Playback SDK for Premium accounts.

Important constraints:

- Playback control, queue reads/writes, and Web Playback SDK usage require a Spotify Premium account.
- Development-mode apps can only be used by up to 25 explicitly added users.
- Spotify applies rate limits over a rolling 30-second window and returns `429` with `Retry-After`.
- Playlist mutation endpoints return snapshot IDs; tools should expose or internally track those IDs for conflict-aware edits.
- Queue tooling can add and read, but Spotify does not expose an arbitrary "remove from queue" or "reorder queue" Web API operation.

## Official Sources

- Spotify Web API overview: https://developer.spotify.com/documentation/web-api
- Authorization concepts: https://developer.spotify.com/documentation/web-api/concepts/authorization
- Authorization Code with PKCE tutorial: https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow
- Scopes: https://developer.spotify.com/documentation/web-api/concepts/scopes
- Rate limits: https://developer.spotify.com/documentation/web-api/concepts/rate-limits
- Quota modes: https://developer.spotify.com/documentation/web-api/concepts/quota-modes
- Web Playback SDK overview: https://developer.spotify.com/documentation/web-playback-sdk
- Web Playback SDK getting started: https://developer.spotify.com/documentation/web-playback-sdk/tutorials/getting-started
- Web API reference pages for queue, player, playlists, users, tracks, albums, artists, and search.

## App Setup and Access Model

### Spotify App Registration

Create a Spotify app in the Developer Dashboard. The app provides a `client_id`, redirect URI allowlist, app mode settings, and quota-mode review path.

Recommended local redirect URI:

```text
http://127.0.0.1:<port>/callback
```

Use loopback redirect URLs for local development. Avoid `localhost` in new apps because Spotify's redirect URI guidance warns against it and recommends explicit loopback IPs such as `127.0.0.1`.

The redirect URI must match the dashboard entry exactly for the authorization request.

### Development Mode

Spotify apps start in development mode. Development mode is enough for early plugin work, but it limits the app to a small set of explicitly added users. Each tester needs a Spotify account, and each account must be added in the app dashboard.

This matters for plugin development because any teammate or test account must be allowlisted before auth will succeed.

### Extended Quota Mode

Extended quota mode is a Spotify review process for apps that need broader user access. We should not design the local developer plugin around immediate extended quota. Treat it as a later packaging/release concern once the local MVP is useful and the required scope list is stable.

## Authentication Design

### Recommended Flow: Authorization Code with PKCE

Use Authorization Code with PKCE for the local web app:

1. Generate a random `code_verifier`.
2. Derive a SHA-256 `code_challenge`.
3. Open Spotify authorization URL with `response_type=code`, `client_id`, exact `redirect_uri`, requested scopes, and `code_challenge_method=S256`.
4. Receive `code` on the local callback server.
5. Exchange `code` plus `code_verifier` for an access token and refresh token.
6. Persist refresh token securely outside git.
7. Refresh access tokens when they expire.

PKCE is the practical default because the local web app is not a secure confidential backend. Do not rely on embedding a client secret in a local plugin.

### Token Storage

Store tokens in a local per-user credential file or OS credential store. The repository should only contain `.env.example`-style placeholders. Never commit access tokens, refresh tokens, client secrets, or generated authorization codes.

Recommended stored shape:

```json
{
  "client_id": "...",
  "redirect_uri": "http://127.0.0.1:43210/callback",
  "access_token": "...",
  "refresh_token": "...",
  "expires_at": "2026-06-26T16:00:00Z",
  "scope": "playlist-read-private playlist-modify-private ..."
}
```

### Scope Strategy

Start with the smallest useful scope bundle:

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

Scope rationale:

- `playlist-read-private`: read private playlists.
- `playlist-read-collaborative`: read collaborative playlists.
- `playlist-modify-private`: create and mutate private playlists.
- `playlist-modify-public`: create and mutate public playlists.
- `user-read-playback-state`: read playback state, active device, and queue.
- `user-read-currently-playing`: read current playing item.
- `user-modify-playback-state`: playback actions such as add-to-queue, transfer playback, play, pause, seek, next, previous, repeat, and shuffle.
- `streaming`: required for Web Playback SDK playback.
- `user-read-private`: useful for account metadata such as country, product type, and display name.

Add later only when needed:

- `ugc-image-upload`: playlist cover image upload.
- `user-library-read` / `user-library-modify`: saved tracks and albums.
- `user-top-read`: top artists/tracks.
- `user-read-recently-played`: recent playback history.
- `user-follow-read` / `user-follow-modify`: follows.

## Web API Basics

Base URL:

```text
https://api.spotify.com/v1
```

Authentication:

```http
Authorization: Bearer <access_token>
```

Common response patterns:

- `401`: missing, invalid, or expired token.
- `403`: authenticated but insufficient scope, user permission, Premium status, market restriction, or endpoint-specific constraint.
- `404`: resource not found or inaccessible.
- `429`: rate limited; obey `Retry-After`.

Pagination:

- Playlist and library list endpoints use `limit` and `offset`.
- Page responses commonly include `href`, `limit`, `next`, `offset`, `previous`, `total`, and `items`.
- Tools should page automatically by default but allow limits for fast inspection.

Rate limits:

- Spotify rate limits are calculated over a rolling 30-second window.
- On `429`, back off using the `Retry-After` header.
- Use batch endpoints where available and avoid repeated per-track calls when a playlist item response already has enough metadata.

## Queue and Playback Coverage

### Read Queue

Endpoint:

```http
GET /me/player/queue
```

Required scope:

```text
user-read-playback-state
```

Premium requirement: yes.

Returns the currently playing item and queued items. This is read-only visibility; it does not provide stable queue item IDs for arbitrary queue mutation.

Tool proposal:

```text
spotify_queue_get()
```

Returns:

- currently playing item summary.
- queued item summaries.
- raw item type and URI.
- warnings if no active playback or account is not Premium.

### Add to Queue

Endpoint:

```http
POST /me/player/queue?uri={spotify_uri}
```

Optional query:

```text
device_id
```

Required scope:

```text
user-modify-playback-state
```

Premium requirement: yes.

Accepts track or episode Spotify URIs. The endpoint adds a single item at a time. For multi-item additions, the plugin should call this endpoint sequentially with rate-limit handling.

Tool proposal:

```text
spotify_queue_add(uri, device_id?)
spotify_queue_add_many(uris, device_id?)
```

Important limitation:

Spotify does not expose a general queue reorder/remove endpoint. We can "build" queue-like experiences by creating temporary playlists and controlling playback, but we cannot truly reorder the live Spotify queue through the Web API.

### Playback State and Device Tools

Recommended supporting endpoints:

```http
GET /me/player
GET /me/player/currently-playing
GET /me/player/devices
PUT /me/player
PUT /me/player/play
PUT /me/player/pause
POST /me/player/next
POST /me/player/previous
PUT /me/player/seek
PUT /me/player/repeat
PUT /me/player/shuffle
PUT /me/player/volume
```

These are not the primary goal, but queue tools work better when the plugin can inspect devices and transfer playback.

Tool proposal:

```text
spotify_player_state()
spotify_player_current()
spotify_player_devices()
spotify_player_transfer(device_id, play?)
spotify_player_play(context_uri?, uris?, offset?, position_ms?, device_id?)
spotify_player_pause(device_id?)
spotify_player_next(device_id?)
spotify_player_previous(device_id?)
```

## Playlist Coverage

### Read Current User's Playlists

Endpoint:

```http
GET /me/playlists
```

Scopes:

```text
playlist-read-private
playlist-read-collaborative
```

The endpoint returns playlists owned or followed by the current user. Use automatic pagination to support larger libraries.

Tool proposal:

```text
spotify_playlists_current_user(limit?, include_collaborative?, include_public?, include_private?)
```

### Read Playlist Details

Endpoint:

```http
GET /playlists/{playlist_id}
```

Useful query parameters:

```text
market
fields
additional_types
```

Use `fields` aggressively for agent tools to keep responses concise. For example, a summary tool does not need every image or nested artist field.

Tool proposal:

```text
spotify_playlist_get(playlist_id, fields?)
```

### Read Playlist Items

Endpoint:

```http
GET /playlists/{playlist_id}/items
```

Useful query parameters:

```text
market
fields
limit
offset
additional_types
```

Tool proposal:

```text
spotify_playlist_items(playlist_id, limit?, offset?, fields?)
spotify_playlist_items_all(playlist_id, fields?)
```

Recommended default item shape:

- playlist position.
- added date.
- added by user ID when available.
- item type.
- Spotify URI.
- item ID.
- name.
- artist names.
- album/show name.
- duration.
- explicit flag.
- playable status when available.

### Create Playlist

Endpoint:

```http
POST /users/{user_id}/playlists
```

Scopes:

```text
playlist-modify-public
playlist-modify-private
```

Request body:

```json
{
  "name": "Playlist name",
  "public": false,
  "collaborative": false,
  "description": "Created by Codex"
}
```

Tool proposal:

```text
spotify_playlist_create(name, public?, collaborative?, description?)
```

The tool should determine `{user_id}` from the current user's profile rather than asking the user to provide it.

### Add Playlist Items

Endpoint:

```http
POST /playlists/{playlist_id}/items
```

Scopes:

```text
playlist-modify-public
playlist-modify-private
```

Request body:

```json
{
  "uris": ["spotify:track:...", "spotify:track:..."],
  "position": 0
}
```

Returns a `snapshot_id`.

Tool proposal:

```text
spotify_playlist_add_items(playlist_id, uris, position?)
```

Spotify playlist write APIs generally cap batch sizes. The plugin should chunk large requests and return all resulting snapshot IDs or at least the final snapshot ID.

### Remove Playlist Items

Endpoint:

```http
DELETE /playlists/{playlist_id}/tracks
```

Scopes:

```text
playlist-modify-public
playlist-modify-private
```

Request body:

```json
{
  "tracks": [
    {
      "uri": "spotify:track:..."
    }
  ],
  "snapshot_id": "optional-known-snapshot"
}
```

Returns a `snapshot_id`.

Tool proposal:

```text
spotify_playlist_remove_items(playlist_id, uris, snapshot_id?)
```

When removing duplicates, Spotify's API supports specifying positions in addition to URI. The plugin should support a higher-level helper that removes by playlist position to avoid removing every duplicate of a URI unintentionally.

### Reorder or Replace Playlist Items

Endpoint:

```http
PUT /playlists/{playlist_id}/tracks
```

Scopes:

```text
playlist-modify-public
playlist-modify-private
```

Two important modes:

- Reorder existing items using `range_start`, `insert_before`, `range_length`, and optional `snapshot_id`.
- Replace playlist items using a `uris` array.

Tool proposal:

```text
spotify_playlist_reorder_items(playlist_id, range_start, insert_before, range_length?, snapshot_id?)
spotify_playlist_replace_items(playlist_id, uris)
```

Do not hide snapshot conflicts. If Spotify rejects a mutation because the playlist changed, surface that and suggest re-reading the playlist.

### Update Playlist Metadata

Endpoint:

```http
PUT /playlists/{playlist_id}
```

Scopes:

```text
playlist-modify-public
playlist-modify-private
```

Tool proposal:

```text
spotify_playlist_update_details(playlist_id, name?, public?, collaborative?, description?)
```

## Search and URI Resolution

Playlist and queue tools need a way to convert user input into Spotify URIs.

Endpoint:

```http
GET /search
```

Useful parameters:

```text
q
type
market
limit
offset
```

Tool proposal:

```text
spotify_search(q, types?, market?, limit?)
spotify_resolve_track(query)
spotify_resolve_album(query)
spotify_resolve_artist(query)
```

The high-level resolver tools should return candidates rather than silently choosing a match unless the user explicitly asks for best-effort behavior.

## Web Playback SDK

The Web Playback SDK lets a browser become a Spotify Connect playback device. This is useful for a setup web app because it can create an active local player for queue and playback experiments.

Core SDK behavior:

- Requires a Spotify Premium account.
- Requires an OAuth token with the `streaming` scope.
- Loads the SDK script from Spotify.
- Creates a `Spotify.Player` with a `getOAuthToken` callback.
- Emits a `ready` event with a `device_id`.
- The app can transfer playback to that `device_id` through the Web API.

Minimal browser flow:

1. User authorizes the local web app.
2. App loads Web Playback SDK.
3. App creates `Spotify.Player`.
4. SDK reports `device_id`.
5. App calls `PUT /me/player` to transfer playback to that device.
6. Plugin can then call queue and playback tools against that active device.

Suggested UI responsibilities:

- Show authentication status.
- Show account product type where available.
- Show active device and SDK device ID.
- Provide a "transfer playback here" action.
- Provide a small queue/playback diagnostic panel.

The SDK is not required for playlist tools. It is primarily useful for playback and queue development, especially when the user does not already have Spotify open on another device.

## Proposed Plugin Tool Inventory

### Phase 1: Connection and Diagnostics

```text
spotify_auth_status()
spotify_auth_connect_url(scopes?)
spotify_auth_refresh()
spotify_me()
spotify_player_devices()
spotify_player_state()
spotify_player_current()
```

### Phase 2: Playlist Read Coverage

```text
spotify_playlists_current_user(limit?, offset?)
spotify_playlists_current_user_all()
spotify_playlist_get(playlist_id, fields?)
spotify_playlist_items(playlist_id, limit?, offset?, fields?)
spotify_playlist_items_all(playlist_id, fields?)
```

### Phase 3: Playlist Mutation Coverage

```text
spotify_playlist_create(name, public?, collaborative?, description?)
spotify_playlist_update_details(playlist_id, name?, public?, collaborative?, description?)
spotify_playlist_add_items(playlist_id, uris, position?)
spotify_playlist_remove_items(playlist_id, uris, snapshot_id?)
spotify_playlist_remove_positions(playlist_id, positions, snapshot_id?)
spotify_playlist_reorder_items(playlist_id, range_start, insert_before, range_length?, snapshot_id?)
spotify_playlist_replace_items(playlist_id, uris)
```

### Phase 4: Queue and Playback Coverage

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

### Phase 5: Search and Helper Coverage

```text
spotify_search(q, types?, market?, limit?)
spotify_resolve_uri(query, types?)
spotify_track_get(track_id, market?)
spotify_tracks_get(track_ids, market?)
spotify_album_get(album_id, market?)
spotify_artist_get(artist_id)
```

## Suggested Project Foundations

Because the repository is currently empty, start with this structure:

```text
spotify-plugin/
  .codex-plugin/
    plugin.json
  .mcp.json
  README.md
  docs/
    spotify-developer-research.md
    spotify-tool-coverage.md
    spotify-auth-setup.md
  src/
    auth/
    spotify/
    tools/
    web/
  tests/
```

Recommended internal modules:

- `auth/pkce`: verifier/challenge generation and token exchange.
- `auth/token-store`: secure local token persistence.
- `spotify/client`: HTTP client, retries, rate-limit handling, auth injection.
- `spotify/paging`: reusable pagination helpers.
- `spotify/playlists`: playlist endpoint wrappers.
- `spotify/player`: playback and queue endpoint wrappers.
- `spotify/search`: search and URI resolution wrappers.
- `tools/*`: agent-facing tool schemas and safe result shaping.
- `web/*`: local connection UI and OAuth callback.

## Implementation Risks and Decisions

- Queue reorder/remove is not available through the Spotify Web API. Do not promise it as a native queue feature.
- Playback and queue operations will fail for Free accounts. Detect and explain this early.
- Development-mode tester allowlisting can look like auth failure. Document it in setup instructions.
- Many endpoints depend on market availability. Expose `market` where useful and default to the user's country when available.
- Playlist item responses can be large. Use `fields` and pagination to keep tool responses compact.
- Playlist mutation should preserve and expose snapshot IDs.
- Resolver tools should avoid surprising writes. For any write based on a search query, return candidates unless the user has requested a clear best match.

## Open Questions

- Should the local web app be only a setup utility, or should it remain a persistent playback-control dashboard?
- Should token storage use the OS credential store from the start, or begin with a local encrypted file?
- Should the plugin expose low-level endpoint wrappers, high-level workflow tools, or both?
- How much Web Playback SDK support is needed in the first implementation if the user already has Spotify active on another device?

## Recommended Next Step

Create the initial plugin scaffold and implement Phase 1 auth plus diagnostics first. That gives us a reliable connection loop and enough runtime visibility to validate scopes, Premium status, devices, and rate-limit behavior before adding playlist and queue mutations.

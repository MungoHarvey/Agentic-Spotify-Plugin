# Spotify Codex Plugin Project Context

Date: 2026-06-29

This document is a handoff for a fresh Codex session. Read this first, then read `ROADMAP.md` and `docs/spotify-developer-research.md`.

## What We Are Building

We are building a Codex plugin for Spotify. The plugin should let Codex connect to a user's Spotify account, inspect playlists and playback state, and provide tools for playlist and queue workflows.

The first product goal is not a polished consumer app. It is a reliable developer-facing Spotify integration that gives Codex broad, well-tested tool coverage over the Spotify Web API, with a local web app for account connection and optional Web Playback SDK diagnostics.

Primary user priorities:

- Connect a Spotify account from a local web app.
- Read current user's playlists and playlist items.
- Build and adjust playlists.
- Read the current queue.
- Add items to the queue.
- Learn the Spotify API enough to build full, reliable Codex tool coverage.

## Current Repository State

As of the latest handoff, the development repository and the production Codex plugin payload are intentionally separate:

- Development root: `C:\Users\mharvey2\Documents\Coding\spotify-plugin`
- Production plugin root: `release/spotify-plugin`
- Personal global install source: `C:\Users\mharvey2\plugins\spotify-plugin`
- Installed Codex plugin id: `spotify-plugin@personal`

Do not install the development root as the Codex plugin. It contains source, tests, docs, and planning records. Install `release/spotify-plugin`, which contains only `.codex-plugin/plugin.json` and `skills/spotify`.

Current production plugin validation:

- `plugin-eval analyze release\spotify-plugin --format markdown`: 100/100, Grade A, low risk.
- `plugin-creator` validation against `release/spotify-plugin`: passed using the official validator with a temporary local YAML shim because the bundled Python runtime lacks PyYAML.
- `npm test`: 123 passing tests.
- `npm run check`: passed.

Release workflow:

- See `docs/plugin-production-release.md`.
- After plugin source changes, rebuild `release/spotify-plugin`, validate it, copy it to `%USERPROFILE%\plugins\spotify-plugin`, and run `codex plugin add spotify-plugin@personal --json`.

The repository now contains the development CLI implementation through playlist reads and core playlist writes, plus a lean production Codex plugin payload under `release/spotify-plugin`.

Existing files:

- `README.md`: high-level project entry point.
- `ROADMAP.md`: staged development plan from scaffold through release readiness.
- `ARCHITECTURE.md`: CLI-first architecture for the full plugin.
- `docs/plans/2026-06-29-full-plugin-high-level-plan.md`: high-level phase and loop plan.
- `docs/plans/2026-06-30-phase-loop-execution-plan.md`: current phase gates, loop model, status, and immediate next loops.
- `docs/spotify-developer-research.md`: detailed research brief on Spotify Web API, Web Playback SDK, scopes, endpoint coverage, limitations, and tool inventory.
- `PROJECT_CONTEXT.md`: this handoff document.
- `package.json` and `tsconfig.json`: Node/TypeScript project configuration.
- `src/auth/`: PKCE, OAuth state, authorization URL, callback parsing, token exchange, token store, and token metadata helpers.
- `src/cli/`: CLI entrypoint and command implementations.
- `src/config/`: environment and path helpers.
- `src/mcp/`: minimal MCP server placeholder.
- `skills/spotify/`: Spotify skill and workflow references.
- `tests/`: unit tests for auth, config, shared Spotify client behavior, CLI commands, playlist workflows, player diagnostics, queue reads, and shaping helpers.

Current implemented behavior:

- Auth login/status/refresh/logout.
- Current user diagnostics.
- Player device/state/current diagnostics.
- Queue read diagnostics.
- Current-user playlist listing, all-page playlist listing, playlist metadata reads, and playlist item reads.
- Playlist creation, metadata update, add, URI removal, position-aware removal, reorder, and replace.

Current validation status:

- `npm test` passes: 123 tests, 123 pass.
- `npm run check` passes.

Important note: if `git status` reports that this folder is not currently a git repository, initialize git intentionally or confirm the intended repo setup before relying on commits.

## Important Spotify Findings

### Auth Model

Use Authorization Code with PKCE for the first implementation.

Reasoning:

- The project starts with a local browser app.
- PKCE avoids embedding a client secret in a local tool.
- The local app can open the Spotify authorization URL, receive the callback, exchange the authorization code, and refresh tokens later.

Recommended local redirect URI:

```text
http://127.0.0.1:<port>/callback
```

Avoid relying on `localhost`; use explicit loopback IPs such as `127.0.0.1`, and ensure the redirect URI exactly matches the Spotify Developer Dashboard entry.

### Spotify App Access

Spotify apps start in development mode. Development mode is enough for early work, but it only supports explicitly allowlisted users. If auth fails for a teammate or test account, check the app dashboard tester list before assuming the code is wrong.

Extended quota mode is a later release concern, not a first-build requirement.

### Initial Scope Bundle

Start with:

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

Why these scopes matter:

- Playlist read scopes allow private and collaborative playlist inspection.
- Playlist modify scopes allow creating and mutating public/private playlists.
- Playback scopes allow current playback, current item, device, queue, and playback-control operations.
- `streaming` is required for Web Playback SDK playback.
- `user-read-private` helps inspect account metadata such as country and product type.

Add later only when required:

- `ugc-image-upload`
- `user-library-read`
- `user-library-modify`
- `user-top-read`
- `user-read-recently-played`
- `user-follow-read`
- `user-follow-modify`

### Premium Requirement

Playback control, queue reads/writes, and the Web Playback SDK require a Spotify Premium account. The plugin should detect and explain Premium-related failures early.

Playlist tools do not require the Web Playback SDK and should not be blocked by it.

### Rate Limits

Spotify applies rate limits over a rolling 30-second window. On `429`, Spotify returns `Retry-After`; the client layer should obey it.

Build rate-limit handling into the shared Spotify API client rather than duplicating it in every tool.

### Queue Limitations

Spotify supports:

```http
GET /me/player/queue
POST /me/player/queue?uri={spotify_uri}
```

This means we can read the queue and add tracks or episodes to the queue.

Spotify does not expose native Web API endpoints to arbitrarily remove items from the live queue or reorder the live queue. Do not promise queue reorder/remove as native capabilities. If a queue-like editing workflow is needed, model it through playlists and playback control instead.

### Playlist Strengths

Spotify playlist APIs are much more capable than queue APIs. They support:

- Reading current user's playlists.
- Reading playlist details.
- Reading playlist items with pagination.
- Creating playlists.
- Updating playlist metadata.
- Adding playlist items.
- Removing playlist items.
- Reordering playlist items.
- Replacing playlist items.

Playlist mutation endpoints return `snapshot_id`. Tools should preserve and expose snapshot IDs so edits can be conflict-aware.

For duplicate-track removals, support position-aware removal in addition to URI-based removal. URI-only removal can remove more than intended when a playlist contains duplicates.

### Web Playback SDK

The Web Playback SDK can turn the local browser into a Spotify Connect playback device.

Use it as an optional setup/diagnostic dashboard, not as a dependency for playlist tools.

SDK facts:

- Requires Premium.
- Requires `streaming` scope.
- Creates a `Spotify.Player`.
- Emits a `ready` event with `device_id`.
- The app can transfer playback to that device with the Web API.

Useful local web app features:

- Show auth status.
- Show account/product status where available.
- Show active device and SDK device ID.
- Provide "transfer playback here".
- Show a small playback/queue diagnostic panel.

## Proposed Architecture

Recommended shape:

```text
spotify-plugin/
  .codex-plugin/
    plugin.json
  .mcp.json
  README.md
  ROADMAP.md
  PROJECT_CONTEXT.md
  docs/
    spotify-developer-research.md
    spotify-auth-setup.md
    spotify-tool-coverage.md
  src/
    auth/
      pkce
      token-store
    spotify/
      client
      paging
      playlists
      player
      search
    tools/
      auth
      playlists
      player
      queue
      search
    web/
      callback-server
      setup-ui
  tests/
```

Module responsibilities:

- `auth/pkce`: generate verifier/challenge and support authorization code exchange.
- `auth/token-store`: persist refresh/access tokens outside git.
- `spotify/client`: shared HTTP client with auth injection, token refresh, retries, and rate-limit handling.
- `spotify/paging`: reusable pagination helpers.
- `spotify/playlists`: playlist endpoint wrappers.
- `spotify/player`: playback, device, and queue endpoint wrappers.
- `spotify/search`: search and URI resolution.
- `tools/*`: Codex-facing tool schemas and compact result shaping.
- `web/*`: local setup app and OAuth callback.

## Proposed Tool Inventory

Phase 1: connection and diagnostics:

```text
spotify_auth_status()
spotify_auth_connect_url(scopes?)
spotify_auth_refresh()
spotify_me()
spotify_player_devices()
spotify_player_state()
spotify_player_current()
```

Phase 2: playlist reads:

```text
spotify_playlists_current_user(limit?, offset?)
spotify_playlists_current_user_all()
spotify_playlist_get(playlist_id, fields?)
spotify_playlist_items(playlist_id, limit?, offset?, fields?)
spotify_playlist_items_all(playlist_id, fields?)
```

Phase 3: playlist writes:

```text
spotify_playlist_create(name, public?, collaborative?, description?)
spotify_playlist_update_details(playlist_id, name?, public?, collaborative?, description?)
spotify_playlist_add_items(playlist_id, uris, position?)
spotify_playlist_remove_items(playlist_id, uris, snapshot_id?)
spotify_playlist_remove_positions(playlist_id, positions, snapshot_id?)
spotify_playlist_reorder_items(playlist_id, range_start, insert_before, range_length?, snapshot_id?)
spotify_playlist_replace_items(playlist_id, uris)
```

Phase 4: queue and playback:

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

Phase 5: search and helpers:

```text
spotify_search(q, types?, market?, limit?)
spotify_resolve_uri(query, types?)
spotify_track_get(track_id, market?)
spotify_tracks_get(track_ids, market?)
spotify_album_get(album_id, market?)
spotify_artist_get(artist_id)
```

## Development Roadmap

Use `ROADMAP.md` and `.advanced-plans/` as the source of truth. Current planned stages:

1. Project scaffold.
2. Local Spotify connection.
3. Spotify API client foundation.
4. Connection and playback diagnostics.
5. Playlist read coverage.
6. Playlist mutation coverage.
7. Queue and playback control.
8. Search and URI resolution.
9. Web Playback SDK setup app.
10. Tool coverage hardening.
11. Packaging and release readiness.

Completed implementation phases:

- Phase 0: scaffold and validation foundation.
- Phase 1: auth/token lifecycle.
- Phase 2: shared Spotify client.
- Phase 3: workflow policy references.
- Phase 4: account/player/queue diagnostics.
- Phase 5: playlist reads.
- Phase 6: playlist writes.

Likely next implementation phases:

- Queue add/add-many and playback controls.
- Search and URI resolution.
- Optional Web Playback SDK setup app.
- MCP wrappers only where they clearly reduce context compared with CLI-first workflows.

## Workflow Notes for the Next Session

Use the installed plugin-development skills for structural changes:

- `plugin-creator` for manifest, marketplace, cachebuster, and install-flow checks.
- `plugin-eval:plugin-eval` and `plugin-eval:evaluate-plugin` for production plugin scoring.
- `plugin-dev:plugin-structure` and `plugin-dev:skill-development` for plugin layout and skill progressive-disclosure checks.

Keep `release/spotify-plugin` as the production payload and the repository root as the development workspace. Rebuild and validate the release payload after every skill or manifest change.

## Key Risks

- Queue reorder/remove is not supported by Spotify's Web API.
- Playback and queue tools require Premium.
- Development-mode allowlisting can be mistaken for auth failure.
- Rate-limit handling must be centralized.
- Playlist item responses can be large; default tool responses should be compact.
- Write tools using search results should not silently choose ambiguous tracks.
- Tokens and secrets must never be committed.

## Official Spotify Sources Used

- Spotify Web API: https://developer.spotify.com/documentation/web-api
- Authorization concepts: https://developer.spotify.com/documentation/web-api/concepts/authorization
- Authorization Code with PKCE: https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow
- Scopes: https://developer.spotify.com/documentation/web-api/concepts/scopes
- Rate limits: https://developer.spotify.com/documentation/web-api/concepts/rate-limits
- Quota modes: https://developer.spotify.com/documentation/web-api/concepts/quota-modes
- Web Playback SDK: https://developer.spotify.com/documentation/web-playback-sdk
- Web Playback SDK getting started: https://developer.spotify.com/documentation/web-playback-sdk/tutorials/getting-started

## Recommended First Prompt for the New Session

Use something close to this:

```text
Please read PROJECT_CONTEXT.md, docs/plugin-production-release.md, and .advanced-plans/phases/phase-6/handoff.md. Use the installed Spotify plugin and plugin-development skills to plan the next implementation phase without changing the production release payload until the phase is validated.
```

# Spotify Plugin Project Context

Date: 2026-07-02

This document is a handoff for a fresh agent session, regardless of which agent runtime you are
running in. Read this first, then read `ROADMAP.md` and `docs/spotify-developer-research.md`.

## What We Are Building

We are building a universal agentic Spotify plugin: one CLI-first core, packaged as a single
release payload that multiple agent runtimes can install and use. The plugin lets an agent connect
to a user's Spotify account, inspect playlists and playback state, and provide tools for playlist
and queue workflows.

The first product goal is not a polished consumer app. It is a reliable developer-facing Spotify
integration that gives any capable agent runtime broad, well-tested tool coverage over the Spotify
Web API, with a local web app for account connection and optional Web Playback SDK diagnostics.

Primary user priorities:

- Connect a Spotify account from a local web app.
- Read current user's playlists and playlist items.
- Build and adjust playlists.
- Read the current queue.
- Add items to the queue.
- Search for and resolve tracks to Spotify URIs.
- Learn the Spotify API enough to build full, reliable agent tool coverage.

## Current Repository State

The development repository and the production plugin payload are intentionally separate:

- Development root: `C:\Users\mharvey2\Documents\Coding\spotify-plugin`
- Production plugin payload: `release/spotify-plugin` — a single payload that serves every
  supported runtime, not a per-runtime build.
- Personal Codex install source: `C:\Users\mharvey2\plugins\spotify-plugin`
  (installed Codex plugin id: `spotify-plugin@personal`).

Do not install the development root as a plugin. It contains source, tests, docs, and planning
records. Install `release/spotify-plugin`.

`release/spotify-plugin` is a dual-manifest payload with a bundled runtime, serving:

- **Claude Code + Claude Cowork** via `.claude-plugin/plugin.json`, discovered through the
  repository-root `.claude-plugin/marketplace.json` (marketplace name
  `agentic-spotify-plugin`).
- **Codex** via `.codex-plugin/plugin.json`.
- **OpenCode / OpenClaw / Hermes Agent** via `agentskills.io`-standard skills under `skills/` plus
  `AGENTS.md` — no separate adapter format was needed for these runtimes.
- **Generic AGENTS.md-reading agents** via `AGENTS.md` plus the `bin/` CLI shims.

The payload bundles the runnable CLI at `release/spotify-plugin/runtime/` (source, `package.json`,
`tsconfig.json`, zero npm dependencies, requires Node 22.6+), so installing the plugin needs no
separate runtime install step. `bin/spotify.mjs` resolves the runtime in this order:
`SPOTIFY_PLUGIN_RUNTIME` env var → bundled `runtime/` inside the plugin →
`%USERPROFILE%\plugins\spotify-plugin-runtime` → a sibling `../spotify-plugin-runtime` directory.

The token store default directory is `spotify-plugin`, with automatic fallback to the legacy
`spotify-codex-plugin` directory for pre-rename installs so existing tokens keep resolving.
`SPOTIFY_TOKEN_PATH` overrides both.

Current production plugin validation:

- `npm test`: 151 passing tests.
- `npm run check`: passed (tsc clean).
- `plugin-eval analyze release\spotify-plugin --format markdown`: Grade A, no fail/warn checks.
- Claude Code marketplace add + install flow confirmed end-to-end against the repository.
- Phases 0-8 complete; every phase gate verdict is PASS. See `.advanced-plans/` for the full
  phase history, loop records, and gate evidence (`.advanced-plans/PLANS-INDEX.md` is the entry
  point).

Release workflow:

- See `docs/plugin-production-release.md`.
- After plugin source changes, rebuild `release/spotify-plugin`, run the validation gates above,
  and install/refresh per runtime (Codex: copy to `%USERPROFILE%\plugins\spotify-plugin` and run
  `codex plugin add spotify-plugin@personal --json`; Claude Code: `claude plugin marketplace add`
  / `claude plugin install`).

## Branch Flow

- `main`: stable universal package — the branch that reflects the current shipped state.
- `codex`: historical Codex-only implementation branch (pre-universal).
- `claude`: historical Claude Code conversion branch (phase 7, dual-manifest packaging work).
- `universal`: active integration branch — changes for the universal package land here first,
  then merge to `main` once a phase is complete and gated.

Existing files:

- `README.md`: high-level project entry point and runtime support matrix.
- `ROADMAP.md`: staged development plan from scaffold through release readiness (historical
  record; current status is summarized at the top of that file).
- `ARCHITECTURE.md`: CLI-first architecture for the full plugin.
- `docs/plans/2026-06-29-full-plugin-high-level-plan.md`: high-level phase and loop plan.
- `docs/plans/2026-06-30-phase-loop-execution-plan.md`: phase gate and loop model reference.
- `docs/plans/2026-07-02-universal-runtime-research.md`: sourced research behind the universal
  packaging decisions (OpenCode, OpenClaw, Hermes Agent, Claude Cowork, AGENTS.md).
- `docs/spotify-developer-research.md`: detailed research brief on Spotify Web API, Web Playback
  SDK, scopes, endpoint coverage, limitations, and tool inventory.
- `docs/universal-install.md`: per-runtime install/placement recipes.
- `docs/plugin-production-release.md`: release build, dual-manifest sync rules, and validation
  gates.
- `PROJECT_CONTEXT.md`: this handoff document.
- `package.json` and `tsconfig.json`: Node/TypeScript project configuration.
- `src/auth/`: PKCE, OAuth state, authorization URL, callback parsing, token exchange, token
  store, and token metadata helpers.
- `src/cli/`: CLI entrypoint and command implementations.
- `src/config/`: environment and path helpers.
- `src/mcp/`: minimal MCP server placeholder.
- `skills/`: Spotify skills and workflow references (agentskills.io-standard).
- `tests/`: unit tests for auth, config, shared Spotify client behavior, CLI commands, playlist
  workflows, player diagnostics, queue reads/adds, search/resolve, and shaping helpers.

Current implemented behavior:

- Auth login/status/refresh/logout.
- Current user diagnostics.
- Player device/state/current diagnostics.
- Queue read diagnostics and queue adds.
- Current-user playlist listing, all-page playlist listing, playlist metadata reads, and playlist
  item reads.
- Playlist creation, metadata update, add, URI removal, position-aware removal, reorder, and
  replace (snapshot-aware).
- Track search and URI resolution.

Not yet implemented:

- Playback control commands (play/pause/next/previous/transfer).
- Native queue reorder/remove — not implemented because Spotify's Web API does not support these
  operations; do not plan to add them as native capabilities.
- A Web Playback SDK setup app.
- Album/artist detail commands.

Current validation status:

- `npm test` passes: 151 tests, 151 pass.
- `npm run check` passes.

Important note: if `git status` reports that this folder is not currently a git repository,
initialize git intentionally or confirm the intended repo setup before relying on commits.

## Important Spotify Findings

### Auth Model

Use Authorization Code with PKCE for the first implementation.

Reasoning:

- The project starts with a local browser app.
- PKCE avoids embedding a client secret in a local tool.
- The local app can open the Spotify authorization URL, receive the callback, exchange the
  authorization code, and refresh tokens later.

Recommended local redirect URI:

```text
http://127.0.0.1:<port>/callback
```

Avoid relying on `localhost`; use explicit loopback IPs such as `127.0.0.1`, and ensure the
redirect URI exactly matches the Spotify Developer Dashboard entry.

### Spotify App Access

Spotify apps start in development mode. Development mode is enough for early work, but it only
supports explicitly allowlisted users. If auth fails for a teammate or test account, check the app
dashboard tester list before assuming the code is wrong.

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
- Playback scopes allow current playback, current item, device, queue, and playback-control
  operations.
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

Playback control, queue reads/writes, and the Web Playback SDK require a Spotify Premium account.
The plugin should detect and explain Premium-related failures early.

Playlist tools do not require the Web Playback SDK and should not be blocked by it.

### Rate Limits

Spotify applies rate limits over a rolling 30-second window. On `429`, Spotify returns
`Retry-After`; the client layer should obey it.

Build rate-limit handling into the shared Spotify API client rather than duplicating it in every
tool.

### Queue Limitations

Spotify supports:

```http
GET /me/player/queue
POST /me/player/queue?uri={spotify_uri}
```

This means we can read the queue and add tracks or episodes to the queue.

Spotify does not expose native Web API endpoints to arbitrarily remove items from the live queue
or reorder the live queue. Do not promise queue reorder/remove as native capabilities. If a
queue-like editing workflow is needed, model it through playlists and playback control instead.

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

Playlist mutation endpoints return `snapshot_id`. Tools should preserve and expose snapshot IDs so
edits can be conflict-aware.

For duplicate-track removals, support position-aware removal in addition to URI-based removal.
URI-only removal can remove more than intended when a playlist contains duplicates.

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

Recommended shape (see `ARCHITECTURE.md` for the full detail and the production payload structure
in `docs/plugin-production-release.md`):

```text
spotify-plugin/
  .claude-plugin/
    plugin.json
  .codex-plugin/
    plugin.json
  AGENTS.md
  README.md
  ROADMAP.md
  PROJECT_CONTEXT.md
  docs/
    spotify-developer-research.md
    universal-install.md
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
- `spotify/client`: shared HTTP client with auth injection, token refresh, retries, and
  rate-limit handling.
- `spotify/paging`: reusable pagination helpers.
- `spotify/playlists`: playlist endpoint wrappers.
- `spotify/player`: playback, device, and queue endpoint wrappers.
- `spotify/search`: search and URI resolution.
- `tools/*`: agent-facing tool schemas and compact result shaping.
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

Auth/diagnostics, playlist reads/writes, queue reads/adds, and search/resolve are implemented.
Playback control, native queue reorder/remove (unsupported by Spotify), and the Web Playback SDK
app remain future work — see "Not yet implemented" above and `ROADMAP.md`.

## Development Roadmap

Use `ROADMAP.md` and `.advanced-plans/` as the source of truth. `ROADMAP.md`'s staged plan (Stage
0 through Stage 10) is a historical record of the planned build sequence. Actual phase execution
and gate verdicts live in `.advanced-plans/`:

- Phase 0: scaffold and validation foundation.
- Phase 1: auth/token lifecycle.
- Phase 2: shared Spotify client.
- Phase 3: workflow policy references.
- Phase 4: account/player/queue diagnostics.
- Phase 5: playlist reads.
- Phase 6: playlist writes.
- Phase 7: Claude Code conversion — dual-manifest packaging.
- Phase 8: universal agentic plugin packaging (OpenCode, OpenClaw, Hermes Agent, generic
  AGENTS.md agents; token-store rename with legacy fallback).

All phases 0-8 are complete with PASS gate verdicts. See `.advanced-plans/PLANS-INDEX.md` for the
full index and `.advanced-plans/phases/phase-8/complete.md` /
`.advanced-plans/gate-verdicts/phase-8.md` for the most recent phase's evidence.

Likely next work (not yet planned as a phase):

- Playback control commands (play/pause/next/previous/transfer).
- Search and URI resolution hardening.
- Optional Web Playback SDK setup app.
- Optional MCP wrappers only where they clearly reduce context compared with CLI-first workflows.

## Workflow Notes for the Next Session

Use the installed plugin-development skills for structural changes:

- `plugin-creator` for manifest, marketplace, cachebuster, and install-flow checks.
- `plugin-eval:plugin-eval` and `plugin-eval:evaluate-plugin` for production plugin scoring.
- `plugin-dev:plugin-structure` and `plugin-dev:skill-development` for plugin layout and skill
  progressive-disclosure checks.

Keep `release/spotify-plugin` as the production payload and the repository root as the development
workspace. Rebuild and validate the release payload after every skill or manifest change. Land
changes on `universal` first, then merge to `main` once the phase gate passes.

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
Please read PROJECT_CONTEXT.md, docs/plugin-production-release.md, and
.advanced-plans/phases/phase-8/complete.md (or the latest phase's completion/handoff record). Use
the installed Spotify plugin and plugin-development skills to plan the next implementation phase
without changing the production release payload until the phase is validated.
```

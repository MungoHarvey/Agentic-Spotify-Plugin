# Spotify Codex Plugin Architecture

Date: 2026-06-29

## Goals

Build a Codex plugin for Spotify that is reliable, context-efficient, and easy to debug locally. The primary interface should be a CLI backed by a shared Spotify client. Codex skills should teach agents how to use the CLI for rich workflows. MCP tools should stay small and optional, exposing only stable primitives where structured tool calls are clearly useful.

The plugin should support the full planned Spotify surface over time:

- Local account connection with Authorization Code and PKCE.
- Auth status, refresh, and account diagnostics.
- Current user, playback, device, and queue diagnostics.
- Playlist listing, inspection, creation, mutation, reordering, replacement, and duplicate-aware removals.
- Queue reads and queue additions within Spotify Web API limits.
- Search and URI resolution with explicit handling for ambiguous results.
- Optional Web Playback SDK diagnostics through a local setup app.

## Non-Goals

- Do not store Spotify client secrets in the repository. The first implementation uses PKCE and a public client ID.
- Do not promise queue reorder or queue removal as native Spotify capabilities; Spotify's Web API does not expose those operations.
- Do not require Web Playback SDK support for playlist tools.
- Do not build a polished consumer application before the developer-facing CLI, auth flow, and shared client are reliable.
- Do not expose every Spotify endpoint as an MCP tool. Broad coverage belongs in the CLI and skill workflows.

## Architecture Summary

The architecture is CLI-first:

```text
Codex skill instructions
        |
        v
spotify CLI commands
        |
        v
shared TypeScript Spotify client
        |
        v
Spotify Web API
```

The shared client powers the CLI and any MCP wrappers. This keeps authentication, token refresh, rate-limit handling, pagination, error normalization, and response shaping centralized.

Skills carry the rich workflow knowledge: when to inspect auth, when to ask the user to choose between search candidates, when Premium is required, and how to perform safe playlist edits. MCP tools remain thin wrappers over a small set of stable commands or client functions.

## Proposed Repository Shape

```text
spotify-plugin/
  .codex-plugin/
    plugin.json
  .mcp.json
  README.md
  PROJECT_CONTEXT.md
  ROADMAP.md
  ARCHITECTURE.md
  docs/
    plans/
    spotify-auth-setup.md
    spotify-tool-coverage.md
    spotify-developer-research.md
  skills/
    spotify/
      SKILL.md
      references/
        auth.md
        command-reference.md
        playlist-workflows.md
        queue-workflows.md
        search-and-resolution.md
        safety.md
  src/
    auth/
      callback-server.ts
      pkce.ts
      token-store.ts
      tokens.ts
    cli/
      index.ts
      commands/
        auth.ts
        me.ts
        player.ts
        playlists.ts
        queue.ts
        search.ts
    config/
      config.ts
      env.ts
      paths.ts
    mcp/
      server.ts
      tools/
        auth-status.ts
        devices.ts
        me.ts
        queue.ts
    spotify/
      client.ts
      errors.ts
      paging.ts
      player.ts
      playlists.ts
      search.ts
      shapes.ts
    web/
      setup-app.ts
      static/
  tests/
    auth/
    cli/
    spotify/
    tools/
```

The exact filenames can be refined during phase planning, but the boundaries should remain stable: `auth` owns OAuth and token persistence, `spotify` owns Web API behavior, `cli` owns command parsing and user-facing output, `skills` owns agent workflow guidance, and `mcp` owns optional structured wrappers.

## Authentication

Authentication uses Spotify Authorization Code with PKCE.

The initial login command should be:

```text
spotify auth login
```

The command should:

1. Read `SPOTIFY_CLIENT_ID` and `SPOTIFY_REDIRECT_URI` from local configuration.
2. Generate a random `code_verifier`.
3. Generate a SHA-256 `code_challenge`.
4. Generate a random `state`.
5. Start a temporary callback server on `127.0.0.1`.
6. Open the Spotify authorization URL in the user's browser.
7. Receive the callback with `code` and `state`.
8. Validate the returned `state`.
9. Exchange the code and verifier for tokens.
10. Store tokens outside the repository.

Recommended redirect URI:

```text
http://127.0.0.1:43210/callback
```

Recommended non-secret repository configuration:

```text
SPOTIFY_CLIENT_ID=
SPOTIFY_REDIRECT_URI=http://127.0.0.1:43210/callback
```

Recommended local token path on Windows:

```text
%APPDATA%\spotify-plugin\tokens.json
```

The token store should be replaceable later with Windows Credential Manager or a cross-platform keychain. The first implementation can use a per-user local file outside the repository if file permissions are checked and documentation is explicit.

## Scope Strategy

Initial scopes:

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

The CLI should expose the granted scopes in `spotify auth status`. If a command fails because a scope is missing, the error should name the missing capability and tell the user to run login again with the required scope bundle.

## CLI Design

The CLI is the broad integration surface. Commands should support both human-readable output and JSON output for Codex workflows.

Core command groups:

```text
spotify auth status
spotify auth login
spotify auth refresh
spotify auth logout
spotify me
spotify player devices
spotify player state
spotify player current
spotify playlists list
spotify playlist get <playlist_id>
spotify playlist items <playlist_id>
spotify playlist create <name>
spotify playlist update <playlist_id>
spotify playlist add <playlist_id> <uri...>
spotify playlist remove <playlist_id> <uri...>
spotify playlist remove-positions <playlist_id> <position...>
spotify playlist reorder <playlist_id>
spotify playlist replace <playlist_id> <uri...>
spotify queue get
spotify queue add <uri>
spotify queue add-many <uri...>
spotify search <query>
spotify track get <track_id>
spotify tracks get <track_id...>
spotify album get <album_id>
spotify artist get <artist_id>
```

All commands that Codex skills may parse should support:

```text
--json
```

Write commands should return stable identifiers such as playlist `snapshot_id`, affected URI counts, and warnings.

## Skill Design

The Spotify skill should be the primary context-efficient interface for Codex. It should load concise instructions first, then route to reference files only when a task needs them.

The skill should cover:

- Auth setup and diagnosis.
- Command reference and output conventions.
- Safe write rules.
- Search ambiguity handling.
- Playlist workflows.
- Queue and Premium limitations.
- Rate-limit and retry expectations.
- When MCP tools are useful.

Skill-first workflows reduce MCP tool surface area because the agent can run shell commands and parse CLI JSON without loading many tool schemas into context.

## MCP Tool Design

MCP tools should be minimal and stable. They are useful for quick structured reads, but they should not duplicate the whole CLI.

Initial MCP candidates:

```text
spotify_auth_status
spotify_me
spotify_player_devices
spotify_queue_get
```

Potential later MCP candidates:

```text
spotify_auth_connect_url
spotify_player_current
spotify_playlist_items
spotify_search
```

Playlist writes, queue additions, and higher-level workflows should remain CLI and skill-driven unless repeated use proves that a structured MCP tool saves enough context to justify the schema.

## Shared Spotify Client

The shared Spotify client should own:

- Base URL handling for `https://api.spotify.com/v1`.
- Authorization header injection.
- Access token refresh before expiry.
- Retry on `401` after refresh when appropriate.
- Central handling for `403`, `404`, and `429`.
- `Retry-After` handling for rate limits.
- Typed errors with user-facing explanations.
- Pagination helpers for `limit` and `offset` endpoints.
- Compact response shaping for playlists, tracks, episodes, devices, users, and playback state.

CLI commands and MCP tools should not implement their own HTTP retry, token refresh, pagination, or Spotify error interpretation.

## Playlist Design

Playlist tools are the highest-value surface after auth is reliable. They should be built around compact reads and snapshot-aware writes.

Required behaviors:

- List current user's playlists with pagination.
- Read playlist details and playlist items.
- Create public or private playlists.
- Update playlist metadata.
- Add items with batching.
- Remove items by URI.
- Remove duplicate tracks by explicit playlist position.
- Reorder items with `range_start`, `insert_before`, and optional `range_length`.
- Replace playlist contents.
- Return `snapshot_id` from mutation operations.

Search-driven writes should not silently choose ambiguous tracks. The skill should instruct Codex to show candidates and ask the user to select unless the user explicitly requests best-effort behavior.

## Queue and Playback Design

Queue and playback commands should clearly communicate Spotify's limitations.

Supported queue operations:

- Read current queue.
- Add one track or episode to the queue.
- Add multiple tracks or episodes sequentially with rate-limit handling.

Unsupported native operations:

- Remove arbitrary items from the live queue.
- Reorder arbitrary items in the live queue.

Playback and queue operations require Spotify Premium and an active playback device. Commands should detect likely Premium or device failures and produce direct explanations.

## Search and URI Resolution

Search should return candidates rather than forcing a single answer. CLI output should include:

- Spotify URI.
- Spotify ID.
- Item type.
- Name.
- Artist names where applicable.
- Album, show, or context name where applicable.
- Popularity or release date where useful.

Resolution helpers may offer best-effort selection only when the command explicitly says so. Write workflows should prefer explicit candidate selection.

## Web Playback SDK Setup App

The Web Playback SDK setup app is optional and should not block playlist work.

It should eventually provide:

- Auth status.
- Current account and product status.
- Active Spotify device list.
- SDK device ID after `Spotify.Player` is ready.
- Transfer playback to this browser.
- Current playback and queue diagnostics.

This app can use the same auth and Spotify client modules as the CLI.

## Error Handling

Errors should be normalized in the shared client and surfaced consistently.

Examples:

- `401`: token missing, expired, invalid, or refresh failed.
- `403`: insufficient scope, Free account limitation, market restriction, or forbidden resource.
- `404`: resource missing or inaccessible.
- `429`: rate limited; retry after the returned delay.
- Network failure: Spotify unavailable, local network issue, or callback server binding failure.

CLI write commands should exit non-zero on failed writes and should include enough detail for Codex to decide whether to retry, ask the user, or stop.

## Testing Strategy

Tests should start below the Spotify network boundary:

- PKCE verifier and challenge generation.
- Authorization URL construction.
- Callback state validation.
- Token expiry and refresh decisions.
- Token store path selection without writing inside the repository.
- Spotify client error handling.
- Pagination helpers.
- CLI argument parsing and JSON output.
- Playlist duplicate-position removal request construction.
- Queue multi-add partial failure behavior.

Live Spotify tests should be manual or explicitly gated because they need network access, a configured Spotify app, and a real account.

## Security

Security rules:

- Never commit access tokens, refresh tokens, client secrets, or authorization codes.
- Prefer PKCE over client-secret auth for the local plugin.
- Store tokens outside the repository.
- Document Spotify development-mode allowlisting.
- Validate OAuth `state` on callback.
- Bind the callback server to `127.0.0.1`, not a public interface.
- Keep write commands explicit and auditable.

## Phase Strategy

The full build should be planned as independent phase plans. Each phase should be decomposed into small loops that can be executed and verified separately.

Phase order:

1. CLI-first scaffold and plugin skeleton.
2. PKCE auth and token storage.
3. Spotify client foundation.
4. Skill-first workflow layer.
5. Account, device, playback, and queue diagnostics.
6. Playlist reads.
7. Playlist writes.
8. Queue and playback control.
9. Search and URI resolution.
10. Optional Web Playback SDK setup app.
11. Minimal MCP wrappers.
12. Hardening, packaging, and release readiness.

Stage 0 and Stage 1 should implement only the scaffold, CLI foundation, auth flow, token storage, `spotify auth status`, `spotify auth login`, `spotify auth refresh`, `spotify auth logout`, `spotify me`, and the first Spotify skill. Playlist and queue mutation should wait until auth and the shared client are reliable.

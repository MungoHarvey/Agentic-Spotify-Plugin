# Command Reference

Use this file as the routing map for the CLI-first surface.

## Local Invocation

On Windows, do not call bare `spotify` from PowerShell. That name can resolve to the Spotify
desktop app instead of this plugin's CLI.

When the personal plugin is installed, invoke the plugin CLI from any working directory as:

```powershell
& "$env:USERPROFILE\plugins\spotify-plugin\bin\spotify.ps1" <group> <command> [options]
```

The wrapper expects the runtime at `$env:USERPROFILE\plugins\spotify-plugin-runtime`. If it is
installed elsewhere, set `SPOTIFY_PLUGIN_RUNTIME` to that runtime root.

When working from the development repository root, this fallback is also valid:

```powershell
node .\src\cli\index.ts <group> <command> [options]
```

The command names below describe the plugin CLI surface. Prefix them with
the installed plugin wrapper unless explicitly working inside the development repo.

## Implemented Commands

- `spotify auth login`
- `spotify auth login --url-only`
- `spotify auth login --json`
- `spotify auth status`
- `spotify auth status --json`
- `spotify auth refresh`
- `spotify auth refresh --json`
- `spotify auth logout`
- `spotify me`
- `spotify me --json`
- `spotify player devices`
- `spotify player devices --json`
- `spotify player state`
- `spotify player state --json`
- `spotify player current`
- `spotify player current --json`
- `spotify playlists list`
- `spotify playlists list --json`
- `spotify playlists list --all --json`
- `spotify playlist get <playlist_id>`
- `spotify playlist get <playlist_id> --json`
- `spotify playlist items <playlist_id>`
- `spotify playlist items <playlist_id> --json`
- `spotify playlist create <name>`
- `spotify playlist create <name> --json`
- `spotify playlist update <playlist_id>`
- `spotify playlist update <playlist_id> --json`
- `spotify playlist add <playlist_id> <uri...>`
- `spotify playlist add <playlist_id> <uri...> --json`
- `spotify playlist remove <playlist_id> <uri...>`
- `spotify playlist remove <playlist_id> <uri...> --json`
- `spotify playlist remove-positions <playlist_id> <position...> --snapshot-id <snapshot_id>`
- `spotify playlist remove-positions <playlist_id> <position...> --snapshot-id <snapshot_id> --json`
- `spotify playlist reorder <playlist_id> --range-start <n> --insert-before <n>`
- `spotify playlist reorder <playlist_id> --range-start <n> --insert-before <n> --json`
- `spotify playlist replace <playlist_id> <uri...>`
- `spotify playlist replace <playlist_id> <uri...> --json`
- `spotify queue get`
- `spotify queue get --json`

Treat the list above as the implemented Spotify command surface. The commands below are planned routing, not live behavior.

## Planned Command Groups

- `spotify player transfer`
- `spotify player play`
- `spotify player pause`
- `spotify player next`
- `spotify player previous`
- `spotify queue add ...`
- `spotify queue add-many ...`
- `spotify search ...`
- `spotify track ...`
- `spotify album ...`
- `spotify artist ...`

## Diagnostics Notes

- Use `spotify me --json` to inspect account metadata such as product and country.
- Use `spotify player devices --json` to inspect active and available devices.
- Use `spotify player state --json` for full current playback state; a no-content response returns `{"active":false}`.
- Use `spotify player current --json` for the currently playing item; a no-content response returns `{"current":false}`.
- Use `spotify queue get --json` for read-only queue diagnostics.
- Use `spotify playlists list --json` for one current-user playlist page.
- Use `spotify playlists list --all --json` when a complete playlist list is needed.
- Use `spotify playlist get <playlist_id> --json` for playlist metadata.
- Use `spotify playlist items <playlist_id> --json` for compact playlist item inspection with zero-based positions.
- Use `spotify playlist create <name> --json` for new playlists.
- Use `spotify playlist update <playlist_id> --json` for playlist metadata changes.
- Use `spotify playlist add <playlist_id> <uri...> --json` for explicit URI additions; large additions are batched.
- Use `spotify playlist remove <playlist_id> <uri...> --json` for URI-based removals.
- Use `spotify playlist remove-positions <playlist_id> <position...> --snapshot-id <snapshot_id> --json` for duplicate-sensitive removals.
- Use `spotify playlist reorder <playlist_id> --range-start <n> --insert-before <n> --json` for item reordering.
- Use `spotify playlist replace <playlist_id> <uri...> --json` to replace playlist contents with explicit URIs.

## Output rules

- Prefer `--json` when a command supports it and Codex needs machine-readable output.
- Keep machine output compact and stable.
- Do not parse text output when JSON is available.
- Return IDs, URIs, counts, warnings, and `snapshotId` values for writes when available.
- Avoid verbose prose in JSON mode.

## MCP guidance

- Prefer the CLI and shell first.
- Use MCP only for small, stable reads when wrappers are available and clearly reduce context.
- Do not grow the MCP surface just because a Spotify endpoint exists.

# Spotify Plugin

CLI-first Spotify plugin for Claude Code: account auth, playlist reads and writes, queue
inspection and additions, track search/resolution, and playback diagnostics.

## Skills

- **spotify** — routing skill for auth, playlists, queue, search/resolve, and playback
  diagnostics. See `skills/spotify/SKILL.md`.
- **spotify-queue-list** — turns a natural-language request into a confirmed, safe queue
  addition. See `skills/spotify-queue-list/SKILL.md`.

## CLI shim

Call the CLI shim, never bare `spotify` (that name can resolve to the Spotify desktop app on
Windows):

```powershell
& "${CLAUDE_PLUGIN_ROOT}\bin\spotify.ps1" <group> <command> [options]
```

`${CLAUDE_PLUGIN_ROOT}` is set automatically by Claude Code to this plugin's install root. Outside
Claude Code (Codex or a manual install), the conventional root is
`%USERPROFILE%\plugins\spotify-plugin`.

## Bundled runtime

The plugin ships with its own CLI/MCP runtime at `runtime/` — no separate runtime install is
required. The shim resolves the runtime in this order: `SPOTIFY_PLUGIN_RUNTIME` (if set), the
bundled `runtime/` directory, then two legacy fallback locations. Set `SPOTIFY_PLUGIN_RUNTIME` to
override with a different runtime checkout.

Requires **Node 22.6+** (the shim imports the runtime's TypeScript source directly and relies on
Node's built-in type-stripping support).

## Spotify auth setup

Create a Spotify Developer app with redirect URI `http://127.0.0.1:43210/callback`, then set:

```powershell
[Environment]::SetEnvironmentVariable("SPOTIFY_CLIENT_ID", "<spotify-client-id>", "User")
[Environment]::SetEnvironmentVariable("SPOTIFY_REDIRECT_URI", "http://127.0.0.1:43210/callback", "User")
```

Then verify:

```powershell
& "${CLAUDE_PLUGIN_ROOT}\bin\spotify.ps1" auth status --json
```

## Source

https://github.com/MungoHarvey/Agentic-Spotify-Plugin

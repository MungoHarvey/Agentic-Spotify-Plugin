# Spotify Codex Plugin

This repository is the working base for an agentic Spotify integration.

The near-term goal is a reliable Codex plugin with CLI-first tooling for:

- Spotify account connection and auth lifecycle
- Playlist reads and playlist writes
- Queue inspection and queue add workflows
- Playback diagnostics and control where Spotify permits it
- Optional local setup UI for auth and playback diagnostics

The longer-term goal is to keep the implementation useful for Claude Code and other autonomous agent runtimes such as OpenClaw and Hermes. The repository is structured so the core Spotify logic stays compact, auditable, and easy to wrap from different agent surfaces.

Current documentation:

- [Project context handoff](PROJECT_CONTEXT.md): concise briefing for a fresh Codex session.
- [Architecture](ARCHITECTURE.md): CLI-first architecture for the full Spotify plugin.
- [Development roadmap](ROADMAP.md): staged implementation plan from scaffold through release readiness.
- [High-level plugin plan](docs/plans/2026-06-29-full-plugin-high-level-plan.md): phase and loop structure for the full build.
- [Phase and loop execution plan](docs/plans/2026-06-30-phase-loop-execution-plan.md): current status, phase gates, loop model, and immediate next loops.
- [Subagent development skill injection matrix](docs/plans/2026-06-30-subagent-skill-injection.md): which process skills and Spotify domain references to pass to worker subagents by phase and loop.
- [Spotify developer research](docs/spotify-developer-research.md): auth model, scopes, endpoint coverage, Web Playback SDK notes, proposed tool inventory, and build sequencing.
- [Spotify auth setup](docs/spotify-auth-setup.md): local PKCE setup, commands, and safety notes.
- [Plugin production release](docs/plugin-production-release.md): lean release structure, validation gates, and personal marketplace install flow.

## Agent-Centered Install

Use this flow from a fresh Codex session after cloning the repo. It installs the lean Codex plugin
and the separate CLI runtime into the user's personal plugin area.

```powershell
$repo = Resolve-Path .
$pluginSource = Join-Path $env:USERPROFILE "plugins\spotify-plugin"
$runtimeSource = Join-Path $env:USERPROFILE "plugins\spotify-plugin-runtime"
$marketplaceDir = Join-Path $env:USERPROFILE ".agents\plugins"
$marketplacePath = Join-Path $marketplaceDir "marketplace.json"

New-Item -ItemType Directory -Force -Path $pluginSource,$runtimeSource,$marketplaceDir | Out-Null
Copy-Item -Path (Join-Path $repo "release\spotify-plugin\*") -Destination $pluginSource -Recurse -Force
if (Test-Path $runtimeSource) { Remove-Item -LiteralPath $runtimeSource -Recurse -Force }
Copy-Item -Path (Join-Path $repo "release\spotify-plugin-runtime") -Destination $runtimeSource -Recurse -Force
```

Ensure the personal marketplace contains the plugin entry. If the file is missing, create it:

```powershell
if (-not (Test-Path $marketplacePath)) {
  @'
{
  "name": "personal",
  "interface": {
    "displayName": "Personal"
  },
  "plugins": [
    {
      "name": "spotify-plugin",
      "source": {
        "source": "local",
        "path": "./plugins/spotify-plugin"
      },
      "policy": {
        "installation": "AVAILABLE",
        "authentication": "ON_INSTALL"
      },
      "category": "Productivity"
    }
  ]
}
'@ | Set-Content -LiteralPath $marketplacePath
}
```

Then register or refresh it in Codex:

```powershell
codex plugin add spotify-plugin@personal --json
```

The installed CLI can be called from any workspace:

```powershell
& "$env:USERPROFILE\plugins\spotify-plugin\bin\spotify.ps1" auth status --json
& "$env:USERPROFILE\plugins\spotify-plugin\bin\spotify.ps1" me --json
& "$env:USERPROFILE\plugins\spotify-plugin\bin\spotify.ps1" playlists list --json
```

For Spotify auth, create a Spotify Developer app with redirect URI
`http://127.0.0.1:43210/callback`, then set:

```powershell
[Environment]::SetEnvironmentVariable("SPOTIFY_CLIENT_ID", "<spotify-client-id>", "User")
[Environment]::SetEnvironmentVariable("SPOTIFY_REDIRECT_URI", "http://127.0.0.1:43210/callback", "User")
```

Start a new Codex thread after install so plugin skills are loaded. Do not use bare `spotify` on
Windows; it can resolve to the Spotify desktop app.

Branch intent:

- `main`: project overview, release framing, and documentation.
- `codex`: active implementation branch for the Spotify plugin work.

Initial priorities:

1. Local web app connection flow using Authorization Code with PKCE.
2. Current user, device, playback, and queue diagnostics.
3. Read current user's playlists and playlist items.
4. Create, update, add to, remove from, reorder, and replace playlists.
5. Add tracks or episodes to the current Spotify queue.

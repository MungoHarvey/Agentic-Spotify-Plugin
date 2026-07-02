# Universal install

The Spotify plugin's core is a single CLI (`bin/spotify.ps1` / `bin/spotify.mjs`) plus a
compact `AGENTS.md` and two `agentskills.io`-standard `SKILL.md` files. Every agent runtime
below wraps that same core — no runtime-specific fork exists. See
`docs/plans/2026-07-02-universal-runtime-research.md` for the sourced research behind these
decisions.

## Common core (do this once, for any runtime)

1. Clone the repo, or download the `release/spotify-plugin` payload directly:
   ```powershell
   git clone https://github.com/MungoHarvey/Agentic-Spotify-Plugin.git
   ```
2. Ensure Node 22.6+ is available (the bin shims import TypeScript source directly and rely on
   recent Node type-stripping support). If your Node doesn't support that, run the CLI through
   `tsx` instead.
3. Create a Spotify Developer app with redirect URI `http://127.0.0.1:43210/callback`, then set:
   ```powershell
   [Environment]::SetEnvironmentVariable("SPOTIFY_CLIENT_ID", "<spotify-client-id>", "User")
   [Environment]::SetEnvironmentVariable("SPOTIFY_REDIRECT_URI", "http://127.0.0.1:43210/callback", "User")
   ```
4. Verify with the CLI shim directly (do not use bare `spotify` on Windows — it can resolve to
   the Spotify desktop app):
   ```powershell
   & "<plugin-root>\bin\spotify.ps1" auth status --json
   ```

Everything below is runtime-specific placement/install steps on top of this common core.

## Claude Code / Claude Cowork

Both read the same `.claude-plugin/plugin.json` + `skills/` shape; Cowork's plugin support
targets the identical manifest format, so the install flow is the same in both surfaces.

```powershell
# From GitHub
claude plugin marketplace add MungoHarvey/Agentic-Spotify-Plugin

# Or from a local clone path
claude plugin marketplace add C:\path\to\spotify-plugin

# Install the plugin (also available via /plugin in-session)
claude plugin install spotify-plugin@agentic-spotify-plugin
```

See the README's [Install for Claude Code](../README.md#install-for-claude-code) section for
the full walkthrough, including the runtime-override env var and skill auto-discovery notes.
Cowork users add the same GitHub repo (or local path) as a plugin/marketplace source and install
identically — no divergent artifact is required.

## Codex

Codex uses a personal-marketplace flow: copy the lean `release/spotify-plugin` payload and the
separate `release/spotify-plugin-runtime` into `%USERPROFILE%\plugins\`, register a personal
marketplace entry pointing at the plugin, then `codex plugin add spotify-plugin@personal --json`.
Codex is also the origin of the `AGENTS.md` convention, so this plugin's `AGENTS.md` is read
natively once installed. Full copy/paste steps live in the README's
[Install for Codex](../README.md#install-for-codex) section — follow that flow directly.

## OpenCode

OpenCode reads `AGENTS.md` from the project root (or nearest ancestor), preferring it over
`CLAUDE.md` when both exist — no conflict here since the release payload ships no `CLAUDE.md`.
It also has first-party Agent Skills support and discovers `SKILL.md` files at
`.opencode/skills/<name>/SKILL.md` (project), `~/.config/opencode/skills/<name>/SKILL.md`
(global), or the Claude-compatible path `.claude/skills/<name>/SKILL.md`. Our `SKILL.md` files
are format-compatible as-is; the only gap is path, so copy or symlink them into place:

```powershell
# Project-scoped
New-Item -ItemType Directory -Force -Path ".opencode\skills" | Out-Null
Copy-Item -Path "release\spotify-plugin\skills\spotify" -Destination ".opencode\skills\spotify" -Recurse -Force
Copy-Item -Path "release\spotify-plugin\skills\spotify-queue-list" -Destination ".opencode\skills\spotify-queue-list" -Recurse -Force

# Or global
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.config\opencode\skills" | Out-Null
Copy-Item -Path "release\spotify-plugin\skills\spotify" -Destination "$env:USERPROFILE\.config\opencode\skills\spotify" -Recurse -Force
Copy-Item -Path "release\spotify-plugin\skills\spotify-queue-list" -Destination "$env:USERPROFILE\.config\opencode\skills\spotify-queue-list" -Recurse -Force
```

No custom JS plugin is needed — the CLI is self-contained and there are no hook/tool-injection
requirements. Point OpenCode at `release/spotify-plugin/AGENTS.md` (or copy it to your project
root) so it's discovered as the project's `AGENTS.md`.

## OpenClaw

OpenClaw's skills use the same `agentskills.io` standard (`name` + `description` frontmatter),
and `AGENTS.md` is a first-class, always-loaded "Standard Operating Procedure" file with
nested/scoped support. Install the skills with the OpenClaw CLI, or copy them directly into a
workspace `skills/` directory:

```powershell
# Via OpenClaw CLI (per skill)
openclaw skills install ./release/spotify-plugin/skills/spotify
openclaw skills install ./release/spotify-plugin/skills/spotify-queue-list

# Or copy directly into workspace scope
Copy-Item -Path "release\spotify-plugin\skills\spotify" -Destination "<workspace>\skills\spotify" -Recurse -Force
Copy-Item -Path "release\spotify-plugin\skills\spotify-queue-list" -Destination "<workspace>\skills\spotify-queue-list" -Recurse -Force
```

Add `--global` to the `openclaw skills install` commands to install to `~/.openclaw/skills`
instead of the workspace. Place `release/spotify-plugin/AGENTS.md` in (or symlink it into) the
workspace so OpenClaw reads it as the scoped SOP for this subtree.

## Hermes Agent (NousResearch)

**Naming note:** "Hermes" is ambiguous in the Nous Research ecosystem — Nous also publishes a
Hermes LLM model series, which is not an agent runtime. This section targets **Hermes Agent**
(`github.com/nousresearch/hermes-agent`), the self-hosted personal agent with a CLI/TUI/Electron
app and messaging gateways.

Hermes Agent's skills are explicitly `agentskills.io`-compatible. Point it at the plugin's
skills via an external directory in `~/.hermes/config.yaml`:

```yaml
skills:
  external_dirs:
    - "<path-to-repo>/release/spotify-plugin/skills"
```

Or install per skill directly:

```powershell
hermes skills install ./release/spotify-plugin/skills/spotify
hermes skills install ./release/spotify-plugin/skills/spotify-queue-list
```

`AGENTS.md` is Hermes Agent's primary project-context file (loaded from the working directory
at session start, first-match-wins ahead of `CLAUDE.md`), so `release/spotify-plugin/AGENTS.md`
is picked up automatically once the working directory is set to (or contains) the plugin root.

## Generic AGENTS.md agents

For any other agent runtime that reads `AGENTS.md` (Cursor, GitHub Copilot Coding Agent,
Google Jules/Gemini CLI, Aider, goose, Factory, Zed, Warp, Devin, JetBrains Junie, and others),
there is no assumed native skill format — the CLI plus `AGENTS.md` is the whole contract:

1. Point the agent's working directory at (or add as context) `release/spotify-plugin/AGENTS.md`.
2. Follow the common core steps above for auth setup.
3. Have the agent call `bin/spotify.ps1` / `bin/spotify.mjs` directly per the commands
   documented in `AGENTS.md`; there is no further install step.

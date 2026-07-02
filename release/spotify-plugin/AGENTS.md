# Spotify Plugin — AGENTS.md

## What this is

A CLI-first Spotify plugin: auth (Authorization Code with PKCE), playlist reads and writes,
queue reads and additions, and track search/resolution — backed by a bundled,
zero-dependency Node 22.6+ runtime. This file is a compact, pointer-style usage contract for
any agent runtime that reads `AGENTS.md` (Codex, OpenCode, OpenClaw, Hermes Agent, and other
generic AGENTS.md-reading agents). Claude Code and Claude Cowork do not read this file — they
use `.claude-plugin/plugin.json` + `skills/` instead; nothing here contradicts that path.

## Locating the CLI

Call the CLI shim relative to **this file's own directory** (the plugin root):

- Windows: `bin/spotify.ps1`
- Any platform (via Node): `node bin/spotify.mjs`

Example: if this `AGENTS.md` lives at `C:\path\to\spotify-plugin\AGENTS.md`, run
`C:\path\to\spotify-plugin\bin\spotify.ps1 auth status --json`.

The shim resolves its runtime in this order:

1. `SPOTIFY_PLUGIN_RUNTIME` env var, if set
2. the bundled `runtime/` directory next to this file
3. `%USERPROFILE%\plugins\spotify-plugin-runtime`
4. a sibling `../spotify-plugin-runtime` directory

**Warning:** on Windows, a bare `spotify` command can resolve to the Spotify desktop app
instead of this CLI. Always invoke the shim by its full path.

## Auth setup

1. Create a Spotify Developer app with redirect URI `http://127.0.0.1:43210/callback`.
2. Set `SPOTIFY_CLIENT_ID` and `SPOTIFY_REDIRECT_URI=http://127.0.0.1:43210/callback` as
   environment variables.
3. Run `<plugin-root>/bin/spotify.ps1 auth login` (or the `spotify.mjs` equivalent via Node) to
   complete browser login.
4. Verify with `<plugin-root>/bin/spotify.ps1 auth status --json`.

## Safety rules

These mirror the plugin's skills exactly — do not weaken or reinterpret them:

- Auth uses Authorization Code with PKCE only; no client secret.
- The local auth callback server binds to `127.0.0.1` only.
- Tokens are stored outside the repository, and are never printed or committed.
- Playlist writes are explicit, auditable, and snapshot-aware — never implicit or silent.
- Treat ambiguous search results as a candidate list for the user to choose from, not a single
  auto-picked answer.
- Do not claim or imply native queue reorder or native queue removal support — these are not
  implemented.
- Spotify Premium and an active device are required for playback and queue mutation; stop
  cleanly and report if either is missing.

## Skill routing

Runtimes that support `agentskills.io`-style skills (OpenCode, OpenClaw, Hermes Agent, and
similar) should load:

- `skills/spotify/SKILL.md` — core auth, playlist, queue, and search routing
- `skills/spotify-queue-list/SKILL.md` — confirmed multi-track queue building workflow

Detailed step-by-step workflows live under each skill's `references/*.md`, not in this file.
This `AGENTS.md` defers to those files rather than duplicating them — read the relevant
`references/` file before executing a non-trivial workflow.

See `docs/universal-install.md` in the source repository for per-runtime install/placement
recipes.

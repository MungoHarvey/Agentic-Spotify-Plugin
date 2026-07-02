# Plugin Production Release

Use `release/spotify-plugin` as the plugin install root for both Claude Code and Codex. Do not
install the repository root as the plugin: the repository root contains source code, tests,
planning records, and research notes that are useful for development but too large for a
production plugin payload.

The runnable CLI ships bundled inside the plugin payload at `release/spotify-plugin/runtime/`
(source, `package.json`, `tsconfig.json`, zero npm dependencies), so installing the plugin is
enough on its own — no separate runtime install step is required. `release/spotify-plugin-runtime`
still exists as the standalone build source for that bundled runtime and as a legacy/advanced
install target (see the sync rule below and the `SPOTIFY_PLUGIN_RUNTIME` override).

## Dual-Manifest Payload

`release/spotify-plugin` carries **two** plugin manifests side by side so the same release
payload installs cleanly in both agent surfaces:

- `.claude-plugin/plugin.json` — Claude Code manifest. This is also the manifest referenced by
  the repository-root `.claude-plugin/marketplace.json` (marketplace name
  `agentic-spotify-plugin`, plugin name `spotify-plugin`, source `./release/spotify-plugin`).
- `.codex-plugin/plugin.json` — Codex manifest, including Codex's richer `interface` block
  (`displayName`, `defaultPrompt`, `capabilities`, etc.).

Both manifests must stay present in every release build; do not delete one in favor of the other.

**Version sync rule:** the base `version` field must match between the two manifests (e.g. both
`0.1.0`). The Codex copy may carry a `+codex.<build-metadata>` suffix (e.g.
`0.1.0+codex.20260702113801`) for build provenance, but the base semver ahead of the `+` must
always equal the Claude Code manifest's version. Bump both together when releasing a new version;
never let the base versions drift.

## Production Structure

```text
release/spotify-plugin/
  .claude-plugin/
    plugin.json
  .codex-plugin/
    plugin.json
  README.md
  LICENSE
  bin/
    spotify.cmd
    spotify.mjs
    spotify.ps1
  runtime/
    src/
    package.json
    tsconfig.json
  skills/
    spotify/
      SKILL.md
      references/
        auth.md
        command-reference.md
        playlist-workflows.md
        queue-workflows.md
        safety.md
        search-and-resolution.md
    spotify-queue-list/
      SKILL.md
      references/
        queue-list-workflow.md
release/spotify-plugin-runtime/
  bin/
  src/
  package.json
  tsconfig.json
```

This keeps the installed plugin portable while staying context-efficient:

- always-loaded trigger cost stays small
- workflow detail stays in deferred reference files
- the plugin payload contains both manifests, its own `README.md` and `LICENSE`, skills, thin
  wrappers, and a bundled runtime — installing the plugin is enough on its own
- tests, plans, and research docs do not enter the plugin payload
- marketplace name, plugin directory, and manifest name all match `spotify-plugin`
- `bin/spotify.mjs` resolves the runtime in this order: `SPOTIFY_PLUGIN_RUNTIME` env var →
  bundled `runtime/` inside the plugin → `%USERPROFILE%\plugins\spotify-plugin-runtime` → a
  sibling `../spotify-plugin-runtime` directory

**Runtime sync rule:** `release/spotify-plugin/runtime/` must be rebuilt from
`release/spotify-plugin-runtime/` (`src/`, `package.json` — name `spotify-plugin-runtime` — and
`tsconfig.json`) whenever the runtime source changes. Treat `release/spotify-plugin-runtime/` as
the build source and `release/spotify-plugin/runtime/` as its bundled copy; never let the bundled
copy silently drift out of sync with the standalone runtime payload.

On Windows, invoke the installed plugin CLI from any workspace with:

```powershell
& "$env:USERPROFILE\plugins\spotify-plugin\bin\spotify.ps1" me --json
```

Do not rely on bare `spotify`; Windows can resolve that to the Spotify desktop app.

## Release Build

The Codex manifest has a root-level source of truth at `.codex-plugin/plugin.json` and is copied
into the release payload on every build. The Claude Code manifest currently has no root-level
counterpart — it is authored and maintained directly at
`release/spotify-plugin/.claude-plugin/plugin.json`. When editing it, edit that file in place and
do not let the rebuild script below overwrite or delete it. If a root-level
`.claude-plugin/plugin.json` source is introduced later, add a copy step for it here to match the
Codex manifest's pattern.

After changing `skills/spotify`, `.codex-plugin/plugin.json`, the Claude manifest, `bin/`, or
`src/`, rebuild the release folders. Keep the two manifests' base versions in sync before
committing (see Dual-Manifest Payload above):

```powershell
New-Item -ItemType Directory -Force -Path release\spotify-plugin\.claude-plugin,release\spotify-plugin\.codex-plugin,release\spotify-plugin\skills | Out-Null
Copy-Item -Path .codex-plugin\plugin.json -Destination release\spotify-plugin\.codex-plugin\plugin.json -Force
# release\spotify-plugin\.claude-plugin\plugin.json is edited directly; not copied from a root source
Remove-Item -LiteralPath release\spotify-plugin\skills\spotify -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item -Path skills\spotify -Destination release\spotify-plugin\skills\spotify -Recurse -Force
Remove-Item -LiteralPath release\spotify-plugin\skills\spotify-queue-list -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item -Path skills\spotify-queue-list -Destination release\spotify-plugin\skills\spotify-queue-list -Recurse -Force
Remove-Item -LiteralPath release\spotify-plugin\bin -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item -Path bin -Destination release\spotify-plugin\bin -Recurse -Force

Remove-Item -LiteralPath release\spotify-plugin-runtime -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path release\spotify-plugin-runtime | Out-Null
Copy-Item -Path src -Destination release\spotify-plugin-runtime\src -Recurse -Force
Copy-Item -Path bin -Destination release\spotify-plugin-runtime\bin -Recurse -Force
Copy-Item -Path package.json,tsconfig.json -Destination release\spotify-plugin-runtime -Force

# Bundle the runtime inside the plugin payload so installing the plugin needs no separate step
Remove-Item -LiteralPath release\spotify-plugin\runtime -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path release\spotify-plugin\runtime | Out-Null
Copy-Item -Path release\spotify-plugin-runtime\src -Destination release\spotify-plugin\runtime\src -Recurse -Force
Copy-Item -Path release\spotify-plugin-runtime\package.json,release\spotify-plugin-runtime\tsconfig.json -Destination release\spotify-plugin\runtime -Force
```

## Validation Gates

Run these before installing or sharing:

```powershell
npm test
npm run check
& "$env:USERPROFILE\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" "$env:USERPROFILE\.codex\plugins\cache\openai-curated\plugin-eval\3fdeeb49\scripts\plugin-eval.js" analyze release\spotify-plugin --format markdown
```

Expected production result:

- `npm test` passes (151 tests)
- `npm run check` passes
- `plugin-eval` reports Grade A with no fail or warn checks for `release/spotify-plugin`
- both `.claude-plugin/plugin.json` and `.codex-plugin/plugin.json` parse successfully and their
  base versions match (see Dual-Manifest Payload above)
- skill frontmatter parses successfully
- no placeholder or literal-secret scans match under `release/spotify-plugin`

The plugin-creator validator currently needs PyYAML. If PyYAML is unavailable in the active Python runtime, run an equivalent frontmatter/manifest validation or provide PyYAML to that runtime before treating the gate as fully automated.

### Claude Code validation

Alongside the Codex `plugin-eval` gate above, validate the Claude Code install path locally
before sharing a release. This exercises the real marketplace + install flow against the
repository (or a local clone) rather than just static manifest checks:

```powershell
claude plugin marketplace add C:\path\to\spotify-plugin
claude plugin install spotify-plugin@agentic-spotify-plugin
```

Expected result:

- the marketplace add step reads `.claude-plugin/marketplace.json` at the repo root and lists
  `spotify-plugin` with source `./release/spotify-plugin`
- the install step reads `release/spotify-plugin/.claude-plugin/plugin.json` and installs cleanly
  at user scope
- skills under `release/spotify-plugin/skills/` auto-discover in a new Claude Code session
- the cache-installed `bin/spotify.ps1` shim runs immediately using the bundled `runtime/`, with
  no manual runtime install step

This flow has been confirmed end-to-end: `claude plugin marketplace add`, `claude plugin
install`, and running the cache-installed `bin/spotify.ps1` all succeeded with zero manual runtime
setup, using only the runtime bundled inside the plugin payload.

## Personal Marketplace Install (Codex)

For local global use in Codex, copy the validated release plugin to:

```text
%USERPROFILE%\plugins\spotify-plugin
```

Copy the runtime payload beside it:

```text
%USERPROFILE%\plugins\spotify-plugin-runtime
```

Ensure `%USERPROFILE%\.agents\plugins\marketplace.json` contains:

```json
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
```

Then install or refresh:

```powershell
codex plugin add spotify-plugin@personal --json
```

Start a new Codex thread after installing so the refreshed plugin skills are loaded.

## Marketplace Install (Claude Code)

Claude Code does not use the personal-marketplace file layout above; it installs directly from
the repository-root `.claude-plugin/marketplace.json` (marketplace name
`agentic-spotify-plugin`) via the `claude plugin marketplace add` / `claude plugin install`
commands shown in the Claude Code validation steps above. See the README's "Install for Claude
Code" section for the full end-user flow, including the optional runtime override and Spotify
auth setup.

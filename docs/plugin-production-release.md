# Plugin Production Release

Use `release/spotify-plugin` as the Codex plugin install root. Do not install the repository root as the plugin: the repository root contains source code, tests, planning records, and research notes that are useful for development but too large for a production Codex plugin payload.

The runnable CLI is installed as a separate local runtime at `release/spotify-plugin-runtime`.
This keeps Codex plugin context small while still letting Codex run Spotify commands from any
workspace.

## Production Structure

```text
release/spotify-plugin/
  .codex-plugin/
    plugin.json
  bin/
    spotify.cmd
    spotify.mjs
    spotify.ps1
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
- the Codex plugin payload only contains skills and thin wrappers
- the runnable CLI lives in the separate runtime payload
- tests, plans, and research docs do not enter the plugin payload
- marketplace name, plugin directory, and manifest name all match `spotify-plugin`

On Windows, invoke the installed plugin CLI from any workspace with:

```powershell
& "$env:USERPROFILE\plugins\spotify-plugin\bin\spotify.ps1" me --json
```

Do not rely on bare `spotify`; Windows can resolve that to the Spotify desktop app.

## Release Build

After changing `skills/spotify`, `.codex-plugin/plugin.json`, `bin/`, or `src/`, rebuild the release folders:

```powershell
New-Item -ItemType Directory -Force -Path release\spotify-plugin\.codex-plugin,release\spotify-plugin\skills | Out-Null
Copy-Item -Path .codex-plugin\plugin.json -Destination release\spotify-plugin\.codex-plugin\plugin.json -Force
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
```

## Validation Gates

Run these before installing or sharing:

```powershell
npm test
npm run check
& "$env:USERPROFILE\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" "$env:USERPROFILE\.codex\plugins\cache\openai-curated\plugin-eval\3fdeeb49\scripts\plugin-eval.js" analyze release\spotify-plugin --format markdown
```

Expected production result:

- `npm test` passes
- `npm run check` passes
- `plugin-eval` reports Grade A with no fail or warn checks for `release/spotify-plugin`
- plugin manifest and skill frontmatter parse successfully
- no placeholder or literal-secret scans match under `release/spotify-plugin`

The plugin-creator validator currently needs PyYAML. If PyYAML is unavailable in the active Python runtime, run an equivalent frontmatter/manifest validation or provide PyYAML to that runtime before treating the gate as fully automated.

## Personal Marketplace Install

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

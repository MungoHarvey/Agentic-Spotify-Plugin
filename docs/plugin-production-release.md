# Plugin Production Release

Use `release/spotify-plugin` as the Codex plugin install root. Do not install the repository root as the plugin: the repository root contains source code, tests, planning records, and research notes that are useful for development but too large for a production Codex plugin payload.

## Production Structure

```text
release/spotify-plugin/
  .codex-plugin/
    plugin.json
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
```

This keeps the installed plugin context-efficient:

- always-loaded trigger cost stays small
- workflow detail stays in deferred reference files
- development-only files do not enter the plugin payload
- marketplace name, plugin directory, and manifest name all match `spotify-plugin`

## Release Build

After changing `skills/spotify` or `.codex-plugin/plugin.json`, rebuild the release folder:

```powershell
New-Item -ItemType Directory -Force -Path release\spotify-plugin\.codex-plugin,release\spotify-plugin\skills | Out-Null
Copy-Item -Path .codex-plugin\plugin.json -Destination release\spotify-plugin\.codex-plugin\plugin.json -Force
Remove-Item -LiteralPath release\spotify-plugin\skills\spotify -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item -Path skills\spotify -Destination release\spotify-plugin\skills\spotify -Recurse -Force
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

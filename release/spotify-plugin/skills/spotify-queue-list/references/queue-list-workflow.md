# Queue List Workflow

Use this reference to turn natural language into a safe Spotify queue mutation.

**Locating the CLI**: in Claude Code, the plugin root is available as `${CLAUDE_PLUGIN_ROOT}` —
call `"${CLAUDE_PLUGIN_ROOT}\bin\spotify.ps1"`. In Codex or manual installs, the conventional
root is `%USERPROFILE%\plugins\spotify-plugin`. Examples below use `<plugin-root>\bin\spotify.ps1`
as a placeholder for whichever form applies.

## Intake

- If the user gives no count, plan 10 tracks.
- If the user asks for more than 25 tracks, confirm the count before searching.
- If the user gives explicit song names, resolve each song.
- If the user gives a broad theme, first draft the list as titles and artists, then resolve.

## Search and Resolution

Use compact JSON commands:

```powershell
spotify search track "<query>" --limit 5 --json
spotify resolve track "<query>" --limit 5 --json
```

When running on Windows outside the repo, invoke the installed wrapper:

```powershell
& "<plugin-root>\bin\spotify.ps1" search track "<query>" --limit 5 --json
```

Use these candidate fields for review:

- `name`
- `artistNames`
- `albumName`
- `durationMs`
- `popularity`
- `uri`

## Confirmation

Before adding anything, present a numbered list and ask for confirmation. Keep this concise:

```text
Planned queue, 10 tracks:
1. Song - Artist (Album) spotify:track:...
...

Confirm before I add these to your Spotify queue.
```

If any item is ambiguous, list candidates for that item and ask the user to choose.

## Mutation

After confirmation, add URIs in the approved order:

```powershell
spotify queue add-many spotify:track:one spotify:track:two --json
```

The command adds sequentially and stops if Spotify rejects a request. Report the successful count from the JSON response.

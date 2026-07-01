# Phase 3 Handoff

## Ready State

The Spotify skill layer is aligned with the current implementation:

- Auth commands are documented as implemented.
- Shared client foundation is documented as implemented.
- Playback, playlist, queue, search, track, album, and artist commands are documented as planned.
- MCP guidance remains minimal and CLI-first.

## Key Files

- `skills/spotify/SKILL.md`
- `skills/spotify/references/auth.md`
- `skills/spotify/references/command-reference.md`
- `skills/spotify/references/playlist-workflows.md`
- `skills/spotify/references/queue-workflows.md`
- `skills/spotify/references/search-and-resolution.md`
- `skills/spotify/references/safety.md`

## Constraints To Preserve

- Do not claim a planned command is available until it is implemented and wired through the CLI.
- Keep skill detail in references rather than expanding the main skill.
- Prefer CLI commands for broad Spotify coverage.
- Add MCP wrappers only for narrow stable reads where schema cost is justified.
- Keep live Spotify checks manual and gated.

## Suggested Next Phase

Implement Phase 4 diagnostics commands on the shared client foundation:

- `spotify me`
- `spotify player devices`
- `spotify player state`
- `spotify player current`
- `spotify queue get`

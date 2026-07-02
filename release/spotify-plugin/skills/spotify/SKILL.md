---
name: spotify
description: CLI-first Spotify workflow guidance. Use when connecting a Spotify account, checking auth status, reading or building playlists, inspecting or adding to the queue, searching or resolving tracks, or diagnosing playback — routes detailed workflows to reference files and clarifies when to shell out to the CLI versus using MCP.
---

# Spotify

Use this plugin's CLI first. Use MCP only for narrow, stable reads when wrappers exist and clearly help.

Auth, shared client foundation, read-only diagnostics, playlist reads, core playlist writes, queue reads/additions, and track search/resolve are implemented.

- Do not claim playback control, native queue reorder, native queue removal, or album/artist/track detail commands that are not implemented.
- Do not expand this skill with endpoint-by-endpoint detail.
- Route detailed workflows to the reference files in `references/`.

Core direction:

- Use Authorization Code with PKCE for auth work.
- Bind any local callback server to `127.0.0.1`.
- Store tokens outside the repository.
- Keep write operations explicit, auditable, and snapshot-aware.
- Respect Spotify Premium, active-device, and queue limits.
- Treat ambiguous search results as candidate lists, not single answers.
- Do not imply native queue reorder or queue removal support.

Read the topic file that matches the task:

- `references/auth.md`
- `references/command-reference.md`
- `references/playlist-workflows.md`
- `references/queue-workflows.md`
- `references/search-and-resolution.md`
- `references/safety.md`

---
name: spotify
description: CLI-first Spotify plugin workflow guidance for Codex. Use when working in this repo on Spotify CLI auth, client foundation, workflow routing, playlist and queue design, search ambiguity handling, safety policy, or when deciding whether to use minimal MCP wrappers versus shelling out to the CLI.
---

# Spotify

Use the repo CLI first. Use MCP only for narrow, stable reads when wrappers exist and clearly help.

Auth, shared client foundation, read-only diagnostics, playlist reads, and core playlist writes are implemented.

- Do not claim playback control, queue-add, or search commands that are not implemented.
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

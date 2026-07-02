---
name: spotify-queue-list
description: This skill should be used when the user asks to "add these songs to my queue", "build a listening queue", "queue up tracks by name", "combine these requests into a sequence", or "safely add multiple Spotify tracks to the queue" — builds and confirms a Spotify queue list before mutating playback.
---

# Spotify Queue List

Use this skill when the user asks for queue construction from names, themes, artists, moods, playlists, or mixed natural-language requests.

Default to a 10-track queue list unless the user specifies a different count. Do not add items to the live Spotify queue until the planned list has been shown and the user has confirmed it.

Workflow:

1. Convert the user request into a proposed queue plan.
2. Resolve each song with `spotify search track <query> --json` or `spotify resolve track <query> --json`.
3. Treat ambiguous results as candidates. Ask the user to choose before adding ambiguous tracks.
4. Present the planned list with title, artist, album when available, and Spotify URI.
5. After explicit confirmation, add the final URIs with `spotify queue add-many <uri...> --json`.
6. Report the count added and any item that was skipped or unresolved.

Safety rules:

- Never silently add a large set of songs from a broad prompt.
- Never add ambiguous search results without user confirmation.
- Do not promise native queue reorder or queue removal.
- Use playlist workflows instead when the user needs editable ordering before playback.
- Stop cleanly if Spotify reports missing Premium, no active device, or insufficient scopes.

Read `references/queue-list-workflow.md` for detailed command routing and confirmation patterns.

# Queue Workflows

Use queue commands as a limited, Premium-gated surface.

## Supported direction

- Read the current queue with `spotify queue get --json`.
- Add one track or episode with `spotify queue add <uri> --json`.
- Add many items sequentially with `spotify queue add-many <uri...> --json`.
- Use a `spotify:track:<id>` or `spotify:episode:<id>` URI. Do not pass names directly to queue add.

## Required conditions

- Spotify Premium is required.
- An active playback device is required.
- Rate limits must be handled cleanly.
- If there is no active device, stop and report that precondition instead of guessing.

## Unsupported native behavior

- Do not claim native queue reorder support.
- Do not claim native remove-from-queue support.
- Do not promise arbitrary native removal from the queue.

If a user asks for those operations, explain the limitation and suggest a playlist-based alternative or a different workflow.

## Status

- `spotify queue get` is implemented as read-only diagnostics.
- `spotify queue add` and `spotify queue add-many` are implemented for explicit track/episode URIs.
- Native queue reorder and remove remain unsupported by Spotify's public Web API.

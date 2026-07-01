# Queue Workflows

Use queue commands as a limited, Premium-gated surface.

## Supported direction

- Read the current queue with `spotify queue get --json`.
- Add one track or episode.
- Add many items sequentially when needed.
- Treat queue add/add-many as planned until implementation lands.

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
- Queue add and add-many are still planned.

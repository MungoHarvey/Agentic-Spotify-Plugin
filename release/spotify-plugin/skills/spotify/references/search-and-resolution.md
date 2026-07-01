# Search and Resolution

Use search to produce candidates, not forced answers.

## Candidate shape

Include the most useful identifiers and descriptors:

- Spotify URI
- Spotify ID
- Item type
- Name
- Artist names where relevant
- Album, show, or context name where relevant
- Popularity or release date where useful
- Include enough context to support an explicit follow-up selection.

## Resolution policy

- Prefer exact IDs when the user already has one.
- Treat ambiguous matches as a shortlist, not a decision.
- Ask the user to choose unless they requested best-effort resolution.
- When best-effort is allowed, pick the nearest match and say why.
- Keep search results stable enough for follow-up commands.

## Write safety

- Never turn an ambiguous match into a silent write target.
- For playlist or queue writes, resolve the target explicitly before mutating.

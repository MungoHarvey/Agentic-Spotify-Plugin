# Phase 2 Plan: Shared Spotify Client Foundation

## Objective

Build the reusable Spotify Web API client foundation that future CLI commands and MCP wrappers will use for authenticated requests, token refresh, errors, rate limits, pagination, and compact response shaping.

## Included Scope

- Shared request client for `https://api.spotify.com/v1`.
- Authorization header injection from stored token data.
- Refresh-before-request behavior using existing auth refresh helpers.
- Retry once after `401` when refresh succeeds.
- Normalized error types for `401`, `403`, `404`, `429`, and generic Spotify errors.
- `Retry-After` handling for rate limits through an injectable sleeper in tests.
- Pagination helpers for `limit` and `offset` page responses.
- Compact response shaping for user, device, track, episode, playlist, and playback objects.
- Unit tests below the live Spotify network boundary.

## Excluded Scope

- No playlist, queue, playback, or search CLI commands.
- No Web Playback SDK setup app.
- No broad MCP tool additions.
- No live Spotify calls in automated tests.
- No client secret support.

## Deliverables

- `src/spotify/errors.ts`
- `src/spotify/client.ts`
- `src/spotify/paging.ts`
- `src/spotify/shapes.ts`
- tests under `tests/spotify/`
- updates to `skills/spotify/references/command-reference.md` if command behavior guidance changes

## Verifiable Success Criteria

- `npm test` passes without network access.
- `npm run check` passes.
- Client requests include `Authorization: Bearer <token>`.
- Expired tokens refresh before a request and persist updated token data.
- A `401` response triggers one refresh and one retry.
- `429` uses `Retry-After` with an injectable sleeper in tests.
- Common Spotify errors produce normalized messages without token values.
- Pagination helper follows `next` pages and returns accumulated items.
- Shape helpers return compact objects with stable fields.

## Dependencies

- Phase 1 completed.
- Existing token store and token exchange helpers.
- Node.js built-in APIs only unless a later phase intentionally adds dependencies.

## Broad Skills Required

- `superpowers:test-driven-development`
- `superpowers:systematic-debugging`
- `superpowers:verification-before-completion`
- `advanced-ai-workflows:workflow-execution`
- `advanced-ai-workflows:workflow-next-loop`

## Risks and Mitigations

- Risk: Client leaks token values in errors. Mitigation: tests assert errors do not contain token strings.
- Risk: Retry behavior loops indefinitely. Mitigation: retry once after refresh and expose clear failure.
- Risk: Rate-limit tests become slow. Mitigation: inject sleeper and assert requested delay without real waiting.
- Risk: Response shaping overfits one endpoint. Mitigation: keep shape helpers small and tolerant of missing fields.

## Ralph Loop Outline

1. Implement normalized Spotify error types.
2. Implement authenticated request client with bearer injection.
3. Implement refresh-before-request and single `401` retry.
4. Implement `429` `Retry-After` handling with injectable sleep.
5. Implement pagination helper.
6. Implement compact response shape helpers.
7. Review Phase 2 against success criteria.


# Phase 3 Plan: Skill-First Workflow Layer

## Objective

Make Codex effective with the Spotify CLI through a concise main skill and focused topic references, while keeping context usage low and avoiding claims about commands or Spotify behaviors that are not implemented yet.

## Included Scope

- Tighten `skills/spotify/SKILL.md` as a short routing layer.
- Update auth reference guidance to match the implemented PKCE CLI flow.
- Update command reference to distinguish implemented commands from planned commands.
- Update read-only, playlist, queue, search, and safety workflow guidance.
- Document when to run CLI commands, when to ask the user, and when MCP wrappers should not be used.
- Validate skill frontmatter and repository checks.

## Excluded Scope

- No new Spotify API endpoint implementations.
- No new MCP wrappers.
- No live Spotify auth or network checks.
- No Web Playback SDK setup app.
- No playlist, queue, playback, or search command implementation.

## Deliverables

- `skills/spotify/SKILL.md`
- `skills/spotify/references/auth.md`
- `skills/spotify/references/command-reference.md`
- `skills/spotify/references/playlist-workflows.md`
- `skills/spotify/references/queue-workflows.md`
- `skills/spotify/references/search-and-resolution.md`
- `skills/spotify/references/safety.md`
- `.advanced-plans/phases/phase-3/loops.md`
- `.advanced-plans/gate-verdicts/phase-3.md`

## Verifiable Success Criteria

- Main skill frontmatter includes `name` and `description`.
- Main skill stays concise and routes detailed workflows to reference files.
- References identify implemented commands separately from planned commands.
- Auth guidance matches implemented `spotify auth login`, `auth login --url-only`, `auth status`, `auth refresh`, and `auth logout` behavior.
- Queue guidance explicitly says native queue reorder and arbitrary queue removal are unsupported by Spotify Web API.
- Search guidance says ambiguous results must be presented as candidates unless the user explicitly asks for best effort.
- Safety guidance says no client secrets, tokens, authorization codes, or generated credentials should be written to the repository.
- `npm test` passes.
- `npm run check` passes.
- Placeholder, secret, `.claude`, and `plannotator` hygiene checks pass.

## Dependencies

- Phase 0 complete.
- Phase 1 complete.
- Phase 2 complete.
- Existing Spotify skill and reference files.

## Broad Skills Required

- `skill-creator`
- `advanced-ai-workflows:workflow-execution`
- `advanced-ai-workflows:workflow-verification`
- `advanced-ai-workflows:workflow-review`

## Risks and Mitigations

- Risk: The skill claims planned commands are implemented. Mitigation: command reference must separate implemented and planned surfaces.
- Risk: Main skill becomes too large and expensive to load. Mitigation: keep main skill as routing guidance and move details into references.
- Risk: Safety policy conflicts with future write commands. Mitigation: document explicit confirmation, ambiguity, and snapshot-aware write rules now.
- Risk: MCP scope grows too early. Mitigation: skill guidance says CLI-first and MCP only for narrow stable reads.

## Ralph Loop Outline

1. Refine the concise main Spotify skill.
2. Update auth and command references to match actual CLI behavior.
3. Update playlist, queue, search, and safety references.
4. Run Phase 3 skill validation and gate review.

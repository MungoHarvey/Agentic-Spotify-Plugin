# Phase 0 Plan: Repository and Plugin Skeleton

## Objective

Create the CLI-first Spotify Codex plugin skeleton so later phases can implement PKCE auth, the shared Spotify client, skill-led workflows, and optional MCP wrappers in clearly separated modules.

## Included Scope

- Add Node/TypeScript project metadata.
- Add initial package scripts for validation, tests, and CLI execution.
- Add TypeScript compiler configuration.
- Add repository-safe environment template.
- Add Codex plugin manifest and MCP configuration stub.
- Add focused source directories and minimal scaffold implementations that compile.
- Add an initial CLI entrypoint with deterministic help output.
- Add the initial Spotify skill shell and reference files.
- Add a local validation test that can run without network access.

## Excluded Scope

- No Spotify network calls.
- No OAuth token exchange.
- No token persistence.
- No playlist, queue, playback, or search behavior.
- No broad MCP tool surface.
- No package installation from the network during this phase.

## Deliverables

- `.codex-plugin/plugin.json`
- `.mcp.json`
- `.env.example`
- `package.json`
- `tsconfig.json`
- `src/cli/index.ts`
- `src/config/paths.ts`
- `src/auth/.gitkeep`
- `src/spotify/.gitkeep`
- `src/mcp/server.ts`
- `tests/cli/help.test.ts`
- `skills/spotify/SKILL.md`
- `skills/spotify/references/auth.md`
- `skills/spotify/references/command-reference.md`
- `skills/spotify/references/playlist-workflows.md`
- `skills/spotify/references/queue-workflows.md`
- `skills/spotify/references/search-and-resolution.md`
- `skills/spotify/references/safety.md`

## Verifiable Success Criteria

- `node --test tests/cli/help.test.js` or the phase's available local test command passes without network access.
- `npx tsc --noEmit` is configured as the intended type-check command, even if dependencies are not installed yet.
- `node dist/cli/index.js --help` is the intended compiled CLI smoke command.
- The skill file exists and routes to concise reference files.
- No token or secret files are created in the repository.

## Dependencies

- Node.js available in the local environment.
- TypeScript dependency availability may require a later package install; this phase should still define the scripts and source layout.
- Git is currently invalid in this workspace, so commit steps are not required until git is initialized or repaired.

## Broad Skills Required

- `superpowers:writing-plans`
- `advanced-ai-workflows:workflow-execution`
- `advanced-ai-workflows:workflow-next-loop`

## Risks and Mitigations

- Risk: The project may not have dependencies installed. Mitigation: keep Phase 0 source minimal and document intended validation commands.
- Risk: A large MCP surface could creep into the scaffold. Mitigation: MCP remains a stub until later phases.
- Risk: Skill instructions could become too verbose. Mitigation: keep `SKILL.md` concise and move details to references.

## Ralph Loop Outline

1. Create project metadata, TypeScript config, environment template, and plugin/MCP manifests.
2. Create minimal source skeleton and deterministic CLI help behavior.
3. Create initial tests and validation documentation.
4. Create initial Spotify skill shell and references.
5. Review Phase 0 deliverables against success criteria.

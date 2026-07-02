# Phase 7 Plan: Claude Code Plugin Conversion and Marketplace Distribution

Branch: `claude`

## Objective

Convert the production Spotify plugin payload into a dual-surface plugin that installs cleanly in Claude Code (and Claude Cowork) via a verifiable marketplace, without breaking the existing Codex plugin.

## Included Scope

- `release/spotify-plugin/.claude-plugin/plugin.json` Claude Code manifest alongside the existing `.codex-plugin/plugin.json`
- Repo-root `.claude-plugin/marketplace.json` listing `spotify-plugin` with source `./release/spotify-plugin`, enabling `/plugin marketplace add MungoHarvey/Agentic-Spotify-Plugin`
- Agent-agnostic skill wording: `skills/*/SKILL.md` descriptions that trigger correctly in Claude Code and no longer read as Codex-only
- `${CLAUDE_PLUGIN_ROOT}`-safe intra-plugin path references where the payload references its own files
- Source-of-truth skills under `skills/` updated first, then mirrored into `release/spotify-plugin/skills/`
- Structure validation with the `plugin-dev:plugin-validator` agent and skill-description review per `plugin-dev:skill-reviewer` guidance
- Regression validation: `npm test`, `npm run check`, CLI shim smoke check (`bin/spotify.ps1 --help` path resolution)
- Local marketplace install test in Claude Code where the environment permits
- `README.md` rewritten to present the project as a plugin for BOTH Claude Code/Cowork and Codex, with install flows for each
- `docs/plugin-production-release.md` updated for the dual-manifest release workflow

## Excluded Scope

- No universal/OpenCode/Hermes/OpenClaw adapter work (Phase 8, `universal` branch).
- No new Spotify API capability (no playback control, no Web Playback SDK app).
- No changes to `release/spotify-plugin-runtime` source code.
- No MCP server expansion.
- No publishing to any public marketplace registry beyond the repo-hosted marketplace.json.
- No live Spotify calls in automated tests.

## Deliverables

- `release/spotify-plugin/.claude-plugin/plugin.json`
- `.claude-plugin/marketplace.json` (repo root)
- Updated `skills/spotify/SKILL.md`, `skills/spotify-queue-list/SKILL.md`, and reference files where wording is Codex-only
- Mirrored `release/spotify-plugin/skills/` payload
- Updated `README.md` (dual Claude + Codex framing and install flows)
- Updated `docs/plugin-production-release.md`
- Validation evidence recorded in the loop handoffs
- `.advanced-plans/gate-verdicts/phase-7.md`

## Verifiable Success Criteria

- `release/spotify-plugin/.claude-plugin/plugin.json` parses as JSON and contains name, version, description, author, repository, license, keywords with kebab-case name `spotify-plugin`.
- `.claude-plugin/marketplace.json` parses as JSON, lists `spotify-plugin` with `"source": "./release/spotify-plugin"`, and its owner/plugin metadata is consistent with the plugin manifest.
- `plugin-dev:plugin-validator` run against `release/spotify-plugin` reports no errors.
- Every `skills/*/SKILL.md` description states when to use the skill without naming a single agent runtime as its only consumer; frontmatter `name` matches its directory.
- `release/spotify-plugin/skills/` is byte-identical to `skills/` for shared files (verified by directory diff).
- `.codex-plugin/plugin.json` remains present and unchanged in structure; the Codex install flow in the README still stands.
- `npm test` passes (currently 123 tests) and `npm run check` passes.
- `bin/spotify.ps1 --help` (or `bin/spotify.mjs --help`) executes without module-resolution errors.
- README shows separate, complete install instructions for Claude Code/Cowork and Codex.
- No tokens, secrets, or `.env` values appear in any committed file.

## Dependencies

- Phases 0–6 complete (auth, client, diagnostics, playlist reads/writes, skills).
- `claude` branch checked out (done).
- plugin-dev plugin installed in Claude Code (available: plugin-validator agent, plugin-structure/skill-development skills).
- GitHub remote `MungoHarvey/Agentic-Spotify-Plugin` for the marketplace add flow (documented assumption; local path install is the fallback test).

## Broad Skills Required

- `plugin-dev:plugin-structure`: Claude Code manifest, marketplace, and layout rules
- `plugin-dev:skill-development`: skill description and progressive-disclosure quality
- `superpowers:verification-before-completion`: gate evidence discipline
- `writing-plans` / documentation: README and release-doc rewrite

## Risks and Mitigations

- Risk: Claude and Codex manifests drift (version, description). Mitigation: single release-build step documented in `docs/plugin-production-release.md` that updates both; gate check compares versions.
- Risk: Skill descriptions tuned for Codex stop triggering in Claude Code. Mitigation: rewrite descriptions to trigger on task context ("when working with Spotify auth, playlists, queue...") per skill-development guidance; review pass.
- Risk: `skills/` and `release/spotify-plugin/skills/` diverge silently. Mitigation: directory diff as an explicit success criterion.
- Risk: Marketplace source path form is wrong and install fails. Mitigation: validate against plugin-dev marketplace reference; test local install with a path source.
- Risk: Windows CLI shims break when invoked from Claude Code's plugin cache location. Mitigation: smoke-test shims from a different working directory; keep runtime lookup logic unchanged.
- Risk: Breaking the Codex payload. Mitigation: no structural changes to `.codex-plugin/`; Codex plugin.json only touched if metadata must stay in sync.

## Assumptions

- `Claude Code marketplace.json at repo root .claude-plugin/ is the supported repo-hosted marketplace form`: validated against plugin-dev references during loop 1.
- `Skills-only plugin (no commands/agents/hooks) is valid in Claude Code`: plugin-dev docs state only the manifest is required; validator confirms.
- `The same skills content can serve both runtimes`: skill bodies are workflow guidance + CLI calls, not runtime-specific APIs.

## Ralph Loop Outline

1. Claude plugin manifest + repo marketplace.json (research-validated against plugin-dev references).
2. Agent-agnostic skill rewrite in `skills/`, mirrored to release payload.
3. Validation and testing: plugin-validator, npm test/check, shim smoke test, local install attempt, fix findings.
4. Documentation: README dual-runtime rewrite and release workflow update.
5. Phase review against success criteria.

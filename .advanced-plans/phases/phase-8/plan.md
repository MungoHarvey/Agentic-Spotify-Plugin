# Phase 8 Plan: Universal Agentic Plugin Packaging

Branch: `universal` (from `claude`); merge to `main` on gate pass.

## Objective

Package the Spotify plugin as a single universal payload that any agentic runtime — Codex, Claude Code/Cowork, OpenCode, Hermes, OpenClaw, and generic AGENTS.md-aware agents — can install or wrap without a separate implementation.

## Included Scope

- Web research validating the current (2026) packaging/skill conventions for OpenCode, Hermes, OpenClaw, and the AGENTS.md convention; findings recorded in a dated research doc
- `AGENTS.md` in `release/spotify-plugin` giving any agent runtime the CLI-first usage contract (locating the shim, auth setup, safety rules, skill routing)
- Universal install guide (`docs/universal-install.md`): per-runtime install/wrap instructions with a common core section
- Additional per-runtime adapter artifacts ONLY where research confirms a concrete format (e.g. OpenClaw skills reuse SKILL.md; OpenCode plugin/config entry)
- Unified manifest guidance: document (or script) a single release-build path that keeps `.codex-plugin` and `.claude-plugin` manifests version-synced (carry-forward from Phase 7)
- Decision recorded on the `spotify-codex-plugin` token-store directory name (migrate vs document as legacy constant)
- Root `README.md` updated: universal positioning with a per-runtime support matrix
- Regression validation: `npm test`, `npm run check`, skills mirror byte-identical, Claude and Codex install paths unaffected
- Merge `universal` → `main` after gate pass

## Excluded Scope

- No new Spotify API capability.
- No runtime-specific code forks — one CLI core only.
- No publishing to external registries (npm, OpenCode registry) in this phase.
- No token-store migration code unless the decision is "migrate" AND it is backward-compatible reading the old path.

## Deliverables

- `docs/plans/2026-07-02-universal-runtime-research.md`
- `release/spotify-plugin/AGENTS.md`
- `docs/universal-install.md`
- Updated `README.md` (universal framing + support matrix)
- Updated `docs/plugin-production-release.md` (unified build notes) if changed
- `.advanced-plans/gate-verdicts/phase-8.md`

## Verifiable Success Criteria

- Research doc exists with sourced findings (URLs) for OpenCode, Hermes, OpenClaw, and AGENTS.md; each runtime has an explicit packaging decision (native adapter / AGENTS.md wrap / documented-unsupported with reason).
- `release/spotify-plugin/AGENTS.md` exists, is agent-agnostic, covers CLI locating (env override, bundled runtime, conventional paths), auth env setup, safety constraints, and routes to `skills/*/references/`.
- `docs/universal-install.md` has a section per target runtime, each with concrete steps or an explicit wrap recipe.
- README support matrix lists at least: Claude Code/Cowork, Codex, OpenCode, Hermes, OpenClaw, generic AGENTS.md agents — with install-path column.
- Token-store decision recorded in the research doc or complete.md with rationale.
- `npm test` and `npm run check` pass; `diff -rq skills/ release/spotify-plugin/skills/` clean.
- Claude Code marketplace install still works after payload changes (re-run install or verify cache).
- `.codex-plugin/plugin.json` and `.claude-plugin/plugin.json` unchanged in structure; base versions still synced.
- `universal` merges to `main` cleanly; `npm test` passes on `main` post-merge.

## Dependencies

- Phase 7 complete (gate PASS) — dual-surface payload with bundled runtime.
- Internet access for runtime-convention research.

## Broad Skills Required

- Web research and source verification
- `plugin-dev:plugin-structure`: payload layout impact checks
- Documentation writing
- `superpowers:verification-before-completion`: gate evidence

## Risks and Mitigations

- Risk: My knowledge of OpenCode/Hermes/OpenClaw formats is stale or wrong. Mitigation: loop 001 is dedicated sourced research; no adapter is built without a confirmed format.
- Risk: Payload bloat degrades the Claude/Codex install. Mitigation: AGENTS.md is one compact file; adapters only added when confirmed; validator/tests re-run.
- Risk: AGENTS.md conflicts with skills-based discovery in Claude Code (duplicate guidance). Mitigation: AGENTS.md defers to skills where a runtime supports them; content stays pointer-style.
- Risk: Merge to main conflicts with codex branch history. Mitigation: main is behind claude lineage; merge claude→universal→main is fast-forward-ish; verify with git merge-tree first.

## Ralph Loop Outline

1. Research universal runtime conventions (sourced) and record packaging decisions.
2. Implement universal packaging artifacts (AGENTS.md, universal-install.md, README matrix, confirmed adapters).
3. Validation and regression (tests, mirror, install integrity, validator if payload changed).
4. Gate review, merge to main, post-merge verification.

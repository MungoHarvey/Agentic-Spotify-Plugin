# Phase 7 Complete: Claude Code Plugin Conversion and Marketplace Distribution

Date: 2026-07-02
Branch: `claude`
Gate: PASS (see ../../gate-verdicts/phase-7.md)

## What Shipped

- `release/spotify-plugin/.claude-plugin/plugin.json` — Claude Code manifest alongside the existing Codex manifest (dual-surface payload).
- `.claude-plugin/marketplace.json` at repo root — marketplace `agentic-spotify-plugin` listing `spotify-plugin` with source `./release/spotify-plugin`; verified working with `claude plugin marketplace add` + `claude plugin install`.
- Bundled runtime at `release/spotify-plugin/runtime/` (src, package.json, tsconfig; zero npm deps) with updated `bin/spotify.mjs` resolution order: `SPOTIFY_PLUGIN_RUNTIME` → bundled → `%USERPROFILE%\plugins\spotify-plugin-runtime` → sibling. Marketplace installs now work with zero manual runtime steps.
- Agent-agnostic skills: third-person trigger descriptions, `${CLAUDE_PLUGIN_ROOT}`-aware CLI locating notes, Codex-only phrasing removed; `skills/` and release mirror byte-identical.
- Payload `README.md` and `LICENSE` (MIT).
- CLI banner now "Spotify plugin CLI" (was "Spotify Codex plugin CLI"); test updated.
- `README.md` rewritten: "Agentic Spotify Plugin", dual install sections (Claude Code/Cowork + Codex), branch intent updated.
- `docs/plugin-production-release.md`: dual-manifest workflow, runtime sync rule, Claude Code validation steps.
- `.gitignore` now covers `.env` / `.env.local`.

## Validation

- 136/136 tests pass; `npm run check` clean.
- plugin-dev:plugin-validator: errors fixed, re-verified.
- Real install verified end-to-end from the Claude Code plugin cache.

## Carry-Forward Notes for Phase 8 (universal)

- Token-store directory constant is still `spotify-codex-plugin` (`src/config/paths.ts`); renaming breaks existing installs — decide in Phase 8 whether to migrate or document.
- The Claude manifest has no root-level source (edited directly in the payload), unlike the Codex manifest which is copied from root `.codex-plugin/plugin.json` at release build; the universal packaging step should unify manifest generation.
- Runtime sync rule: `release/spotify-plugin/runtime/` must be rebuilt from `release/spotify-plugin-runtime/` whenever runtime source changes.

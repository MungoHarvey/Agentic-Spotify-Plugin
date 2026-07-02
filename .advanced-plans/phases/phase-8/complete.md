# Phase 8 Complete: Universal Agentic Plugin Packaging

Date: 2026-07-02
Branch: `universal` (merged to `main`)
Gate: PASS at confidence 95 (see ../../gate-verdicts/phase-8.md)

## What Shipped

- `docs/plans/2026-07-02-universal-runtime-research.md` — sourced research: OpenCode, OpenClaw, and Hermes Agent all consume agentskills.io-standard SKILL.md and read AGENTS.md; Claude Cowork uses the same `.claude-plugin` format as Claude Code; Claude Code ignores AGENTS.md (harmless). No new adapter formats required.
- `release/spotify-plugin/AGENTS.md` — 69-line universal usage contract (CLI locating, auth setup, safety rules, skill routing).
- `docs/universal-install.md` — common core + per-runtime install recipes for 6 runtime families.
- README: "Agentic Spotify Plugin" with a 7-row runtime support matrix.
- Token store renamed `spotify-codex-plugin` → `spotify-plugin` with backward-compatible legacy fallback (`resolveTokenStorePathSync`) wired into every CLI command; proven live (existing tokens found post-rename). MCP server renamed `spotify-plugin-mcp`. Package names aligned across all three source trees.
- Tests grew 136 → 151, all passing; tsc clean.

## Decisions

- Token-store: option (b) rename with fallback (tiny installed base; universal positioning outweighs path inertia). Legacy-dir users keep resolving to the legacy dir; new installs use `spotify-plugin`.
- Hermes = Hermes Agent (NousResearch) — naming caveat documented in the research doc.

## Follow-Ups (not blocking)

- Push `main`, `claude`, `universal` to origin so `/plugin marketplace add MungoHarvey/Agentic-Spotify-Plugin` works from GitHub (currently verified via local-path marketplace).
- The `keywords` arrays in runtime package.json files still include "codex" — accurate but could be broadened.
- Consider a release-build script automating the runtime sync rule and dual-manifest version bump.

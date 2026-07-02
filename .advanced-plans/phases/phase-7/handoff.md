# Phase 7 → Phase 8 Handoff

Done: Dual-surface plugin payload (Claude Code + Codex manifests) with bundled runtime, verified end-to-end marketplace install in Claude Code, agent-agnostic skills, dual-runtime README and release docs, gate PASS on branch `claude`.

Failed: Nothing outstanding. One gate follow-up (`.env` gitignore entry) was fixed at gate time.

Needed: Create `universal` branch from `claude`. Phase 8 should produce a universal packaging layer for other agent runtimes (OpenCode, Hermes, OpenClaw, and generic AGENTS.md-style agents): a single payload or build step emitting per-surface manifests, an AGENTS.md/adapter story for runtimes without plugin systems, unified manifest generation (Claude manifest currently has no root source), and a decision on the `spotify-codex-plugin` token-store directory name (migrate vs document). Merge `universal` → `main` when gated.

# Subagent Development Skill Injection Matrix

Date: 2026-06-30

This document defines which **development-process skills** should be injected into subagents for each phase and loop. The goal is to make worker agents execute loops with the right planning, TDD, debugging, verification, and review habits while the manager owns sequencing and integration.

The Spotify plugin skill and its references are domain context. They are not the main loop skills. Inject them only when the worker needs Spotify-specific rules.

## Core Principle

Each subagent prompt should include two layers:

1. Development-process skills: how the worker should plan, implement, debug, verify, or review.
2. Domain context: Spotify skill references, architecture docs, or loop docs needed for that specific task.

The manager should keep phase-level context and pass only the minimum useful skill bundle to each worker.

## Available and Intended Skill Families

Use exact installed skill names when available in the next session. If a named advanced workflow skill is not exposed, use the closest available equivalent and keep the same behavior.

Manager orchestration skills:

- `advanced-ai-workflows:workflow-phase-create` when available.
- `advanced-ai-workflows:workflow-loop-generate` when available.
- `advanced-ai-workflows:workflow-next-loop` when available.
- Fallback: `superpowers:subagent-driven-development`.
- Fallback: `superpowers:executing-plans`.

Worker implementation skills:

- `superpowers:test-driven-development` for feature or bugfix implementation loops.
- `superpowers:systematic-debugging` for failing tests, unexpected behavior, auth failures, or live integration problems.
- `superpowers:verification-before-completion` for every worker before returning results.
- `superpowers:receiving-code-review` when applying review feedback.
- `superpowers:requesting-code-review` when a loop is large enough to need a second pass.

Repo/domain skills and references:

- `skills/spotify/SKILL.md` for Spotify plugin repo conventions.
- `skills/spotify/references/auth.md` for auth loops.
- `skills/spotify/references/command-reference.md` for CLI/MCP/output loops.
- `skills/spotify/references/playlist-workflows.md` for playlist loops.
- `skills/spotify/references/queue-workflows.md` for queue/playback loops.
- `skills/spotify/references/search-and-resolution.md` for search/URI loops.
- `skills/spotify/references/safety.md` for secrets, writes, network, auth, queue, playback, and live Spotify behavior.

Project docs:

- `ARCHITECTURE.md` for boundary decisions.
- `docs/plans/2026-06-30-phase-loop-execution-plan.md` for current phase gates and loop status.
- `docs/spotify-developer-research.md` only when a worker needs endpoint or Spotify behavior details.

## Manager Skill Injection

The manager should use planning and orchestration skills, not worker implementation skills by default.

Inject into manager context:

```text
advanced-ai-workflows:workflow-phase-create
advanced-ai-workflows:workflow-loop-generate
advanced-ai-workflows:workflow-next-loop
```

Fallback if advanced workflow skills are not available:

```text
superpowers:subagent-driven-development
superpowers:executing-plans
superpowers:verification-before-completion
```

Manager responsibilities:

- Select the next loop.
- Decide whether the loop should be done by the manager, one worker, or multiple workers.
- Inject process skills and minimal domain context into workers.
- Keep worker file ownership disjoint.
- Review returned changes.
- Run final validation from the main workspace.
- Update phase status and docs.

## Worker Skill Injection Rules

Every implementation worker gets:

```text
superpowers:test-driven-development
superpowers:verification-before-completion
```

Every debugging worker gets:

```text
superpowers:systematic-debugging
superpowers:verification-before-completion
```

Every documentation-only worker gets:

```text
superpowers:verification-before-completion
```

Every review worker gets:

```text
superpowers:requesting-code-review
```

Every worker applying review feedback gets:

```text
superpowers:receiving-code-review
superpowers:verification-before-completion
```

Add Spotify repo skill files only when the task needs Spotify-specific policy, command shape, or safety rules.

## Phase-to-Development-Skill Matrix

| Phase | Loop family | Process skills to inject | Domain context to inject |
| --- | --- | --- | --- |
| Phase 0 | package scripts, TS config, source layout | `test-driven-development`, `verification-before-completion` | `ARCHITECTURE.md`, `command-reference.md` |
| Phase 0 | plugin manifest, MCP stub | `test-driven-development`, `verification-before-completion` | `ARCHITECTURE.md`, `command-reference.md`, `safety.md` |
| Phase 0 | skill/reference structure | `verification-before-completion` | `skills/spotify/SKILL.md`, edited reference file |
| Phase 1 | PKCE, OAuth state, callback server | `test-driven-development`, `verification-before-completion` | `auth.md`, `safety.md` |
| Phase 1 | token exchange, refresh, token store | `test-driven-development`, `systematic-debugging` if failures appear, `verification-before-completion` | `auth.md`, `safety.md`, Spotify auth research |
| Phase 1 | auth CLI commands and JSON output | `test-driven-development`, `verification-before-completion` | `auth.md`, `command-reference.md`, `safety.md` |
| Phase 2 | shared Spotify client | `test-driven-development`, `systematic-debugging`, `verification-before-completion` | `safety.md`, Spotify API research |
| Phase 2 | pagination, errors, shaping | `test-driven-development`, `verification-before-completion` | `command-reference.md`, relevant Spotify research |
| Phase 3 | skill routing and references | `verification-before-completion`; add `requesting-code-review` for full-skill revisions | `skills/spotify/SKILL.md`, edited references |
| Phase 4 | account/player diagnostics | `test-driven-development`, `verification-before-completion` | `command-reference.md`, `queue-workflows.md`, `safety.md` |
| Phase 4 | queue get | `test-driven-development`, `systematic-debugging` for live failures, `verification-before-completion` | `queue-workflows.md`, `safety.md` |
| Phase 5 | playlist reads | `test-driven-development`, `verification-before-completion` | `playlist-workflows.md`, `command-reference.md` |
| Phase 6 | playlist writes | `test-driven-development`, `verification-before-completion`; add `receiving-code-review` when applying review notes | `playlist-workflows.md`, `search-and-resolution.md`, `safety.md` |
| Phase 7 | queue add/playback control | `test-driven-development`, `systematic-debugging`, `verification-before-completion` | `queue-workflows.md`, `command-reference.md`, `safety.md` |
| Phase 8 | search and URI resolution | `test-driven-development`, `verification-before-completion` | `search-and-resolution.md`, `command-reference.md`, `safety.md` |
| Phase 9 | Web Playback SDK setup app | `test-driven-development`, `systematic-debugging`, `verification-before-completion` | `auth.md`, `queue-workflows.md`, `safety.md` |
| Phase 10 | MCP wrappers | `test-driven-development`, `verification-before-completion` | `command-reference.md`, relevant domain reference |
| Phase 11 | hardening, docs, release readiness | `systematic-debugging` for failures, `requesting-code-review`, `verification-before-completion` | `safety.md`, matching domain references |

## Loop-Specific Injection Examples

Loop 0.2, plugin manifest:

```text
Process skills:
- superpowers:test-driven-development
- superpowers:verification-before-completion

Domain context:
- ARCHITECTURE.md
- skills/spotify/references/command-reference.md
- skills/spotify/references/safety.md
```

Loop 1.5, token exchange:

```text
Process skills:
- superpowers:test-driven-development
- superpowers:systematic-debugging
- superpowers:verification-before-completion

Domain context:
- skills/spotify/references/auth.md
- skills/spotify/references/safety.md
- docs/spotify-developer-research.md auth sections
```

Loop 2.6, rate-limit handling:

```text
Process skills:
- superpowers:test-driven-development
- superpowers:systematic-debugging
- superpowers:verification-before-completion

Domain context:
- skills/spotify/references/safety.md
- docs/spotify-developer-research.md rate-limit sections
```

Loop 5.5, playlist item shaping:

```text
Process skills:
- superpowers:test-driven-development
- superpowers:verification-before-completion

Domain context:
- skills/spotify/references/playlist-workflows.md
- skills/spotify/references/command-reference.md
```

Loop 7.2, queue add-many:

```text
Process skills:
- superpowers:test-driven-development
- superpowers:systematic-debugging
- superpowers:verification-before-completion

Domain context:
- skills/spotify/references/queue-workflows.md
- skills/spotify/references/safety.md
```

## Worker Prompt Template

Use this shape when spawning worker subagents:

```text
You are a worker subagent on the Spotify Codex plugin.

Development-process skills to use:
- <process skill>
- <process skill>
- <process skill>

Domain context to read:
- <repo doc or Spotify skill reference>
- <repo doc or Spotify skill reference>

Loop:
- <phase and loop number>
- <one-sentence objective>

Ownership:
- You may edit: <paths>
- Read-only context: <paths>

Task:
- <specific implementation or documentation task>

Validation:
- Run: <command>
- Expected: <result>

Constraints:
- You are not alone in the codebase. Do not revert or overwrite unrelated work.
- Do not touch files outside your ownership scope unless absolutely required; report if required.
- Do not write secrets, tokens, auth codes, or client secrets into the repo.
- Do not claim live Spotify behavior unless this loop implements and validates it.

Return:
- Changed files
- Validation commands run and results
- Behavior implemented
- Risks or follow-ups
```

## Multi-Agent Dispatch Pattern

Use parallel workers when loops are independent:

```text
Worker A:
- Loop 0.2 plugin manifest
- Owns `.codex-plugin/plugin.json`

Worker B:
- Loop 0.3 MCP stub
- Owns `.mcp.json` and `src/mcp/server.ts` only if needed

Worker C:
- Loop 1.4 callback server gap review
- Owns `src/auth/callback-server.ts` and `tests/auth/callback-server.test.js`

Manager:
- Does not duplicate worker tasks
- Updates docs/status
- Integrates returned changes
- Runs final `npm test` and `npm run check`
```

Do not parallelize workers that touch the same files unless one is explicitly read-only.

## When to Create More Development Skills

Do not create a separate process skill for every loop. Create or split development skills only when one of these becomes true:

- The same long subagent prompt is reused several times.
- A loop family has fragile, repeatable steps that need deterministic guardrails.
- A process skill can be used across projects, not only this Spotify plugin.
- The advanced workflow plugin needs first-class skill artifacts for phase creation, loop generation, or worker verification.

Likely future development skills:

- `workflow-phase-manager`
- `workflow-loop-worker`
- `workflow-tdd-worker`
- `workflow-debug-worker`
- `workflow-verification-worker`
- `workflow-review-worker`

The current plan is to inject existing development skills first and only create new process skills if repeated usage proves the need.

# Phase 8 Ralph Loops

Branch: `universal`. Main thread commits; workers never commit.

```yaml
name: "ralph-loop-001"
task_name: "Universal runtime convention research"
max_iterations: 2
on_max_iterations: "checkpoint"
handoff_summary:
  done: "Sourced research doc written: OpenCode, OpenClaw, and Hermes Agent all consume agentskills.io SKILL.md natively and read AGENTS.md; Claude Code/Cowork use the existing manifest (AGENTS.md inert there); no new adapter formats needed; token-store rename with backward-compatible fallback recommended."
  failed: ""
  needed: "Loop 002: AGENTS.md, docs/universal-install.md, README matrix, and token-store rename with legacy fallback."
todos:
  - id: "loop-001-todo-001"
    content: "Research current packaging/skill/plugin conventions for OpenCode, Hermes, OpenClaw, and the AGENTS.md convention, with sources."
    skill: "NA"
    agent: "general-purpose"
    outcome: "docs/plans/2026-07-02-universal-runtime-research.md exists with sourced (URL) findings per runtime and an explicit packaging decision for each."
    status: "completed"
    priority: "high"
  - id: "loop-001-todo-002"
    content: "Record the token-store directory decision (keep spotify-codex-plugin as legacy constant vs migrate) with rationale."
    skill: "NA"
    agent: "general-purpose"
    outcome: "Decision and rationale recorded in the research doc."
    status: "completed"
    priority: "medium"
prompt: |
  Execute Phase 8 loop 001. Research-only; the only file written is the research doc.
  Verify claims against current official docs/repos; do not rely on training-data memory for format details.
```

```yaml
name: "ralph-loop-002"
task_name: "Universal packaging artifacts"
max_iterations: 2
on_max_iterations: "escalate"
handoff_summary:
  done: "AGENTS.md (69 lines), docs/universal-install.md (7 runtimes), README runtime matrix; token store renamed with legacy fallback wired into all commands; 151 tests pass."
  failed: ""
  needed: ""
todos:
  - id: "loop-002-todo-001"
    content: "Write release/spotify-plugin/AGENTS.md: agent-agnostic CLI usage contract (locating shim, auth env setup, safety rules, skill references routing)."
    skill: "plugin-dev:plugin-structure"
    agent: "worker"
    outcome: "release/spotify-plugin/AGENTS.md exists, compact, agent-agnostic, and consistent with skills content."
    status: "completed"
    priority: "high"
  - id: "loop-002-todo-002"
    content: "Write docs/universal-install.md with per-runtime sections per the research decisions."
    skill: "NA"
    agent: "worker"
    outcome: "docs/universal-install.md has a concrete section for each target runtime."
    status: "completed"
    priority: "high"
  - id: "loop-002-todo-003"
    content: "Update README.md with universal positioning and a runtime support matrix; add confirmed adapter artifacts only."
    skill: "NA"
    agent: "worker"
    outcome: "README support matrix covers Claude Code/Cowork, Codex, OpenCode, Hermes, OpenClaw, generic AGENTS.md agents."
    status: "completed"
    priority: "high"
  - id: "loop-002-todo-004"
    content: "Rename token-store/app-name constant from spotify-codex-plugin to spotify-plugin with backward-compatible fallback read of the legacy directory, in src plus both runtime mirrors, with tests."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "New installs use ~/.config/spotify-plugin (or %APPDATA% equivalent); existing tokens in the legacy spotify-codex-plugin directory are still found; tests cover both paths; npm test and npm run check pass."
    status: "completed"
    priority: "high"
prompt: |
  Execute Phase 8 loop 002 after loop 001, driven by the research doc decisions.
  Keep AGENTS.md pointer-style; defer to skills where the runtime supports them. No runtime-specific code forks.
```

```yaml
name: "ralph-loop-003"
task_name: "Validation and regression"
max_iterations: 3
on_max_iterations: "checkpoint"
handoff_summary:
  done: "Reinstalled from marketplace: AGENTS.md and updated runtime present in cache; auth status --json returned authenticated:true via the legacy token fallback in production; all JSON parses, mirror clean, 151 tests."
  failed: ""
  needed: ""
todos:
  - id: "loop-003-todo-001"
    content: "Run npm test, npm run check, skills mirror diff, and manifest integrity checks; re-verify Claude Code install if payload changed."
    skill: "superpowers:verification-before-completion"
    agent: "reviewer"
    outcome: "All checks pass; Claude Code install re-verified from cache after payload change."
    status: "completed"
    priority: "high"
prompt: |
  Execute Phase 8 loop 003 after loop 002. Evidence over assumptions.
```

```yaml
name: "ralph-loop-004"
task_name: "Gate review and merge to main"
max_iterations: 2
on_max_iterations: "escalate"
handoff_summary:
  done: ""
  failed: ""
  needed: ""
todos:
  - id: "loop-004-todo-001"
    content: "Verify all Phase 8 success criteria with evidence and write .advanced-plans/gate-verdicts/phase-8.md."
    skill: "superpowers:verification-before-completion"
    agent: "reviewer"
    outcome: "Gate verdict written with per-criterion evidence; PASS required to merge."
    status: "pending"
    priority: "high"
  - id: "loop-004-todo-002"
    content: "Merge universal to main and run npm test on main."
    skill: "NA"
    agent: "NA"
    outcome: "main contains the universal plugin; npm test passes on main."
    status: "pending"
    priority: "high"
prompt: |
  Execute Phase 8 loop 004 after loop 003. Main-thread merge; verify with git merge-tree first if in doubt.
```

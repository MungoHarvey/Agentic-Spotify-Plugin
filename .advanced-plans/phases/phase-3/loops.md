# Phase 3 Ralph Loops

```yaml
name: "ralph-loop-001"
task_name: "Refine concise Spotify skill routing"
max_iterations: 2
on_max_iterations: "Stop and report unresolved skill routing issues."
handoff_summary: "Done: Updated skills/spotify/SKILL.md to treat auth and shared client foundation as implemented, keep guidance CLI-first and reference-routed, and avoid claiming unimplemented playback/playlist/queue/search commands. npm test, npm run check, and frontmatter validation pass. Failed: None. Needed: Update auth and command references; command-reference.md still has stale scaffold-only language."
todos:
  - id: "loop-001-todo-001"
    content: "Review the current main Spotify skill for stale phase claims and missing routing guidance."
    skill: "skill-creator"
    agent: "worker"
    outcome: "Review identifies exact main-skill changes needed before editing."
    status: "completed"
    priority: "high"
  - id: "loop-001-todo-002"
    content: "Update skills/spotify/SKILL.md to stay concise, CLI-first, and reference-routed."
    skill: "skill-creator"
    agent: "worker"
    outcome: "Main skill describes current project state and routes to topic references without long workflow detail."
    status: "completed"
    priority: "high"
  - id: "loop-001-todo-003"
    content: "Validate main skill frontmatter and run npm test plus npm run check."
    skill: "advanced-ai-workflows:workflow-verification"
    agent: "reviewer"
    outcome: "Skill frontmatter parses and both validation commands pass, or exact failures are captured."
    status: "completed"
    priority: "high"
prompt: |
  Execute Phase 3 loop 001 in the spotify-plugin repo.
  Own only skills/spotify/SKILL.md unless a validation failure requires a narrowly scoped fix.
  Keep the main skill concise and route detail to references.
```

```yaml
name: "ralph-loop-002"
task_name: "Update auth and command references"
max_iterations: 2
on_max_iterations: "Stop and report unresolved auth or command reference issues."
handoff_summary: "Done: Updated auth and command references to match implemented auth behavior and separate implemented auth commands from planned command groups. Also corrected stale CLI help text and help test so source-facing help no longer says auth/token storage are planned only. npm test, npm run check, and targeted stale-claim scans pass. Failed: None. Needed: Update playlist, queue, search, and safety workflow references."
todos:
  - id: "loop-002-todo-001"
    content: "Update auth reference to match implemented PKCE login, url-only login, status, refresh, and logout behavior."
    skill: "skill-creator"
    agent: "worker"
    outcome: "Auth reference describes implemented behavior, configuration, token storage, and diagnosis without stale not-implemented claims."
    status: "completed"
    priority: "high"
  - id: "loop-002-todo-002"
    content: "Update command reference to separate implemented commands from planned commands."
    skill: "skill-creator"
    agent: "worker"
    outcome: "Command reference gives accurate implemented CLI syntax and marks future command groups as planned."
    status: "completed"
    priority: "high"
  - id: "loop-002-todo-003"
    content: "Run npm test, npm run check, and stale-claim scans over the edited references."
    skill: "advanced-ai-workflows:workflow-verification"
    agent: "reviewer"
    outcome: "Validation passes and no stale not-implemented auth claims remain."
    status: "completed"
    priority: "high"
prompt: |
  Execute Phase 3 loop 002 after loop 001 is complete.
  Own only skills/spotify/references/auth.md and skills/spotify/references/command-reference.md unless validation reveals a narrow issue.
```

```yaml
name: "ralph-loop-003"
task_name: "Update workflow and safety references"
max_iterations: 2
on_max_iterations: "Stop and report unresolved workflow reference issues."
handoff_summary: "Done: Updated playlist, queue, search, and safety references for read-before-write, snapshot-aware planned writes, ambiguity policy, Premium/device preconditions, unsupported native queue reorder/removal, no-secret rules, and planned-vs-implemented posture. npm test, npm run check, and stale-language scans pass. Failed: None. Needed: Run Phase 3 completion gate."
todos:
  - id: "loop-003-todo-001"
    content: "Update playlist workflow guidance for read-before-write, ambiguity, snapshot-aware writes, and planned command status."
    skill: "skill-creator"
    agent: "worker"
    outcome: "Playlist reference is accurate for planned workflows without implying unimplemented commands are available."
    status: "completed"
    priority: "high"
  - id: "loop-003-todo-002"
    content: "Update queue workflow guidance for Premium/device requirements and unsupported native queue reorder/removal."
    skill: "skill-creator"
    agent: "worker"
    outcome: "Queue reference clearly states Spotify Web API limits and safe alternatives."
    status: "completed"
    priority: "high"
  - id: "loop-003-todo-003"
    content: "Update search and safety references for candidate selection, best-effort policy, and no-secret repository rules."
    skill: "skill-creator"
    agent: "worker"
    outcome: "Search and safety references guide agent behavior for ambiguous writes and credential handling."
    status: "completed"
    priority: "high"
prompt: |
  Execute Phase 3 loop 003 after loop 002 is complete.
  Own only playlist, queue, search, and safety reference files under skills/spotify/references/.
```

```yaml
name: "ralph-loop-004"
task_name: "Review Phase 3 completion"
max_iterations: 1
on_max_iterations: "Stop and report Phase 3 gate failures."
handoff_summary: "Done: Phase 3 gate passed. Verified skill frontmatter, concise routing, implemented-vs-planned command references, auth guidance, queue/search/safety policies, npm test with 75 tests, npm run check, JSON manifests, hygiene scans, and .claude absence. Failed: git status is unavailable because this workspace is not a Git repository. Needed: Plan and execute Phase 4 diagnostics commands."
todos:
  - id: "loop-004-todo-001"
    content: "Review Phase 3 deliverables against .advanced-plans/phases/phase-3/plan.md."
    skill: "advanced-ai-workflows:workflow-verification"
    agent: "reviewer"
    outcome: "A Phase 3 verification summary states pass or lists exact remaining failures."
    status: "completed"
    priority: "high"
prompt: |
  Execute Phase 3 loop 004 after loop 003 is complete.
  Review only; do not implement new feature scope during the gate.
```

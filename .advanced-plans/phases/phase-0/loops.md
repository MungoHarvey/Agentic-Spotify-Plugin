# Phase 0 Ralph Loops

```yaml
name: "ralph-loop-001"
task_name: "Create project metadata and manifests"
max_iterations: 2
on_max_iterations: "Stop and report unresolved scaffold or manifest validation issues."
handoff_summary: "Done: Created project metadata and manifests for the CLI-first scaffold; normalized OAuth scopes in .env.example to space-separated format. Failed: None. Needed: Continue with source skeleton and CLI help."
todos:
  - id: "loop-001-todo-001"
    content: "Create package.json, tsconfig.json, .env.example, .codex-plugin/plugin.json, and .mcp.json for a CLI-first Spotify Codex plugin."
    skill: "NA"
    agent: "worker"
    outcome: "The metadata and manifest files exist with no secrets and describe the CLI-first plugin skeleton."
    status: "completed"
    priority: "high"
  - id: "loop-001-todo-002"
    content: "Verify the new files are parseable JSON where applicable and contain no placeholder markers."
    skill: "NA"
    agent: "reviewer"
    outcome: "JSON files parse successfully and rg finds no TODO, TBD, FIXME, lorem, or placeholder markers in the new files."
    status: "completed"
    priority: "high"
prompt: |
  Execute Phase 0 loop 001 in the spotify-plugin repo.

  Scope:
  - Create package.json, tsconfig.json, .env.example, .codex-plugin/plugin.json, and .mcp.json.
  - Keep the design CLI-first and MCP-minimal.
  - Do not add dependencies that require network installation during execution.
  - Do not create token, secret, or credential files.

  Required context:
  - Read ARCHITECTURE.md.
  - Read .advanced-plans/phases/phase-0/plan.md.

  Handoff format:
  Done: one sentence.
  Failed: one sentence or empty.
  Needed: one sentence or empty.
```

```yaml
name: "ralph-loop-002"
task_name: "Create source skeleton and CLI help"
max_iterations: 2
on_max_iterations: "Stop and report unresolved CLI skeleton issues."
handoff_summary: "Done: Created minimal TypeScript source skeleton and deterministic CLI help; npm run check passes. Failed: None. Needed: Add local CLI help test, accounting for the entrypoint currently running main on import."
todos:
  - id: "loop-002-todo-001"
    content: "Create minimal src directories, src/cli/index.ts, src/config/paths.ts, src/mcp/server.ts, and .gitkeep files for future auth and Spotify modules."
    skill: "NA"
    agent: "worker"
    outcome: "The source skeleton exists and the CLI entrypoint prints deterministic help for --help or no arguments."
    status: "completed"
    priority: "high"
  - id: "loop-002-todo-002"
    content: "Verify source files are ASCII, focused, and do not implement Spotify auth or API behavior yet."
    skill: "NA"
    agent: "reviewer"
    outcome: "Source files contain only scaffold behavior and no network, auth, token, playlist, queue, playback, or search implementation."
    status: "completed"
    priority: "medium"
prompt: |
  Execute Phase 0 loop 002 in the spotify-plugin repo.

  Scope:
  - Create the minimal TypeScript source skeleton for CLI, config paths, MCP stub, auth folder, and Spotify folder.
  - CLI --help and no-argument behavior should print stable help text.
  - Do not implement Spotify auth or API calls.

  Required context:
  - Read ARCHITECTURE.md.
  - Read .advanced-plans/phases/phase-0/plan.md.

  Handoff format:
  Done: one sentence.
  Failed: one sentence or empty.
  Needed: one sentence or empty.
```

```yaml
name: "ralph-loop-003"
task_name: "Add local validation test"
max_iterations: 2
on_max_iterations: "Stop and report unresolved test scaffold issues."
handoff_summary: "Done: Added subprocess-based CLI help tests and a minimal entrypoint guard; node --test tests\\cli\\help.test.js and npm run check pass. Failed: Initial red run failed due duplicate help output on import plus main call. Needed: Create Spotify skill shell and references."
todos:
  - id: "loop-003-todo-001"
    content: "Create a local test that verifies CLI help output without network access."
    skill: "superpowers:test-driven-development"
    agent: "worker"
    outcome: "A test exists that runs locally and verifies the CLI help output contains the command groups planned for Phase 0."
    status: "completed"
    priority: "high"
  - id: "loop-003-todo-002"
    content: "Run the available local validation command and capture the result."
    skill: "superpowers:verification-before-completion"
    agent: "reviewer"
    outcome: "The test command result is known and any dependency limitation is documented."
    status: "completed"
    priority: "high"
prompt: |
  Execute Phase 0 loop 003 in the spotify-plugin repo.

  Scope:
  - Add a local CLI help test.
  - Prefer Node's built-in test runner if possible.
  - Do not require network access or installed packages beyond Node.

  Required context:
  - Read ARCHITECTURE.md.
  - Read .advanced-plans/phases/phase-0/plan.md.

  Handoff format:
  Done: one sentence.
  Failed: one sentence or empty.
  Needed: one sentence or empty.
```

```yaml
name: "ralph-loop-004"
task_name: "Create Spotify skill shell"
max_iterations: 2
on_max_iterations: "Stop and report unresolved skill scaffold issues."
handoff_summary: "Done: Created concise Spotify skill shell and references for auth, commands, playlists, queue, search, and safety. Failed: Python-based local validator was unavailable due Windows Store shim; Node frontmatter and text scans passed. Needed: Run Phase 0 completion review."
todos:
  - id: "loop-004-todo-001"
    content: "Create skills/spotify/SKILL.md and concise reference files for auth, commands, playlists, queue, search, and safety."
    skill: "skill-creator"
    agent: "worker"
    outcome: "The Spotify skill exists, is concise, and routes detailed workflows to reference files."
    status: "completed"
    priority: "high"
  - id: "loop-004-todo-002"
    content: "Verify the skill files avoid unsupported Spotify claims and point to CLI-first workflows."
    skill: "advanced-ai-workflows:workflow-review"
    agent: "reviewer"
    outcome: "Skill files consistently describe CLI-first operation, minimal MCP usage, and Spotify queue limitations."
    status: "completed"
    priority: "medium"
prompt: |
  Execute Phase 0 loop 004 in the spotify-plugin repo.

  Scope:
  - Create skills/spotify/SKILL.md and references for auth, command reference, playlist workflows, queue workflows, search and resolution, and safety.
  - Keep the main skill concise and route detailed instructions to references.
  - Do not claim live Spotify capabilities exist yet.

  Required context:
  - Read ARCHITECTURE.md.
  - Read .advanced-plans/phases/phase-0/plan.md.

  Handoff format:
  Done: one sentence.
  Failed: one sentence or empty.
  Needed: one sentence or empty.
```

```yaml
name: "ralph-loop-005"
task_name: "Review Phase 0 completion"
max_iterations: 1
on_max_iterations: "Stop and report Phase 0 gate failures."
handoff_summary: "Done: Phase 0 deliverables verified; npm test, npm run check, JSON/frontmatter parsing, secret scan, .claude check, and plannotator scan completed. Failed: git status is unavailable because the workspace is not a valid git repository. Needed: Create Phase 1 plan for PKCE auth and token storage."
todos:
  - id: "loop-005-todo-001"
    content: "Review all Phase 0 deliverables against .advanced-plans/phases/phase-0/plan.md."
    skill: "advanced-ai-workflows:workflow-verification"
    agent: "reviewer"
    outcome: "A Phase 0 verification summary states which success criteria passed and which remain blocked."
    status: "completed"
    priority: "high"
prompt: |
  Execute Phase 0 loop 005 in the spotify-plugin repo.

  Scope:
  - Review Phase 0 deliverables only.
  - Do not implement new feature scope during the review.
  - Create or update phase completion notes only if success criteria are met.

  Required context:
  - Read .advanced-plans/phases/phase-0/plan.md.

  Handoff format:
  Done: one sentence.
  Failed: one sentence or empty.
  Needed: one sentence or empty.
```

# Phase 7 Ralph Loops

Branch: `claude`. All loops execute on this branch. The worker never commits; the main thread commits after each loop.

```yaml
name: "ralph-loop-001"
task_name: "Claude Code manifest and repo marketplace"
max_iterations: 2
on_max_iterations: "escalate"
handoff_summary:
  done: "release/spotify-plugin/.claude-plugin/plugin.json and repo-root .claude-plugin/marketplace.json created, JSON-valid, Codex manifest untouched (release copy carries version 0.1.0+codex build metadata; base versions match)."
  failed: ""
  needed: "Validate the payload with plugin-validator once skills are agent-agnostic."
todos:
  - id: "loop-001-todo-001"
    content: "Write release/spotify-plugin/.claude-plugin/plugin.json with Claude Code manifest schema (name spotify-plugin, version 0.1.0, description, author, homepage, repository, license MIT, keywords)."
    skill: "plugin-dev:plugin-structure"
    agent: "worker"
    outcome: "release/spotify-plugin/.claude-plugin/plugin.json exists, parses as JSON, and contains name, version, description, author, homepage, repository, license, keywords with kebab-case name spotify-plugin."
    status: "completed"
    priority: "high"
  - id: "loop-001-todo-002"
    content: "Write repo-root .claude-plugin/marketplace.json listing spotify-plugin with source ./release/spotify-plugin and owner metadata consistent with the plugin manifest."
    skill: "plugin-dev:plugin-structure"
    agent: "worker"
    outcome: ".claude-plugin/marketplace.json exists at repo root, parses as JSON, includes name/owner/plugins fields, and the spotify-plugin entry uses source ./release/spotify-plugin."
    status: "completed"
    priority: "high"
  - id: "loop-001-todo-003"
    content: "Verify the Codex manifest release/spotify-plugin/.codex-plugin/plugin.json is untouched and both manifests report the same version and compatible descriptions."
    skill: "superpowers:verification-before-completion"
    agent: "reviewer"
    outcome: "git diff shows no change to .codex-plugin/plugin.json; both manifests report version 0.1.0."
    status: "completed"
    priority: "high"
prompt: |
  Execute Phase 7 loop 001 in the spotify-plugin repo on branch claude.
  Own release/spotify-plugin/.claude-plugin/plugin.json and .claude-plugin/marketplace.json only.
  Claude Code manifest rules: manifest lives in .claude-plugin/plugin.json; skills auto-discover from skills/*/SKILL.md so no skills path field is needed (add "skills": "./skills/" only if validation requires it); use kebab-case name; no absolute paths.
  Marketplace rules: repo-root .claude-plugin/marketplace.json with name, owner, plugins[] where the plugin entry has name spotify-plugin and source ./release/spotify-plugin.
  Do not modify .codex-plugin/plugin.json, skills content, bin shims, or the runtime.
```

```yaml
name: "ralph-loop-002"
task_name: "Agent-agnostic skill wording and release mirror"
max_iterations: 2
on_max_iterations: "escalate"
handoff_summary:
  done: "SKILL.md descriptions rewritten agent-agnostic, references swept (only remaining 'codex' string is the literal spotify-codex-plugin token-store path constant), release mirror byte-identical."
  failed: ""
  needed: "Run plugin-validator, tests, shim smoke test, and local install attempt."
todos:
  - id: "loop-002-todo-001"
    content: "Rewrite skills/spotify/SKILL.md and skills/spotify-queue-list/SKILL.md frontmatter descriptions and bodies to be agent-agnostic (trigger on Spotify task context, not 'for Codex')."
    skill: "plugin-dev:skill-development"
    agent: "worker"
    outcome: "Neither SKILL.md frontmatter description names Codex as the sole consumer; descriptions state when to use the skill in third person; frontmatter name matches directory name."
    status: "completed"
    priority: "high"
  - id: "loop-002-todo-002"
    content: "Sweep skills/*/references/*.md for Codex-only phrasing and runtime-specific instructions; replace with agent-agnostic wording while preserving all workflow and safety content."
    skill: "plugin-dev:skill-development"
    agent: "worker"
    outcome: "Grep for 'Codex' across skills/ returns no hits that imply Codex is the only runtime; safety and workflow guidance unchanged in substance."
    status: "completed"
    priority: "high"
  - id: "loop-002-todo-003"
    content: "Mirror updated skills/ into release/spotify-plugin/skills/ and verify byte-identical content."
    skill: "superpowers:verification-before-completion"
    agent: "reviewer"
    outcome: "Directory comparison between skills/ and release/spotify-plugin/skills/ reports zero differing files."
    status: "completed"
    priority: "high"
prompt: |
  Execute Phase 7 loop 002 after loop 001.
  Own skills/spotify/, skills/spotify-queue-list/, and their mirrors under release/spotify-plugin/skills/.
  Keep skill bodies progressive-disclosure style: compact SKILL.md, detail in references/. Do not add endpoint-by-endpoint detail. Do not weaken safety constraints (PKCE, 127.0.0.1 callback, tokens outside repo, snapshot-aware writes, no native queue reorder/remove claims).
  Descriptions must trigger for a Claude Code session working on Spotify auth, playlists, queue, search, or playback diagnostics, and remain valid for Codex.
```

```yaml
name: "ralph-loop-003"
task_name: "Validation, testing, and optimization"
max_iterations: 3
on_max_iterations: "checkpoint"
handoff_summary:
  done: "Validator conditional-pass error fixed by bundling the runtime into release/spotify-plugin/runtime and adding it to bin/spotify.mjs resolution; skills now use CLAUDE_PLUGIN_ROOT-aware invocation; payload README+LICENSE added; real marketplace install verified end-to-end from the Claude Code cache; 136 tests and tsc pass."
  failed: ""
  needed: "Sync README.md and docs/plugin-production-release.md with the bundled-runtime install story."
todos:
  - id: "loop-003-todo-001"
    content: "Run the plugin-dev:plugin-validator agent against release/spotify-plugin and fix every error it reports (warnings triaged)."
    skill: "plugin-dev:plugin-structure"
    agent: "plugin-dev:plugin-validator"
    outcome: "Validator reports zero errors for release/spotify-plugin; fixes for any findings are applied and re-validated."
    status: "completed"
    priority: "high"
  - id: "loop-003-todo-002"
    content: "Run npm test and npm run check at repo root."
    skill: "superpowers:verification-before-completion"
    agent: "reviewer"
    outcome: "npm test passes (>=123 tests) and npm run check passes, or exact failures are captured and fixed."
    status: "completed"
    priority: "high"
  - id: "loop-003-todo-003"
    content: "Smoke-test CLI shims: invoke release/spotify-plugin/bin/spotify.ps1 (and .mjs) with --help from a directory outside the repo to confirm runtime resolution."
    skill: "superpowers:verification-before-completion"
    agent: "reviewer"
    outcome: "Shim invocations exit 0 and print CLI help without module-resolution errors, or the resolution defect is fixed."
    status: "completed"
    priority: "high"
  - id: "loop-003-todo-004"
    content: "Attempt a local Claude Code marketplace install (claude plugin marketplace add <repo-path> then install spotify-plugin) and record the result."
    skill: "plugin-dev:plugin-structure"
    agent: "worker"
    outcome: "Install attempt result recorded in the loop handoff: success, or exact blocking error with a documented fallback."
    status: "completed"
    priority: "medium"
prompt: |
  Execute Phase 7 loop 003 after loop 002.
  Validate release/spotify-plugin as a Claude Code plugin. Fix findings in the payload (and mirror back to source skills/ if skill files change — keep them identical).
  Do not modify runtime source under release/spotify-plugin-runtime/src or repo src/ except where a test failure is caused by this phase's changes.
  Never commit tokens or .env values. Automated tests must not call live Spotify.
```

```yaml
name: "ralph-loop-004"
task_name: "Dual-runtime documentation"
max_iterations: 2
on_max_iterations: "escalate"
handoff_summary:
  done: "README.md retitled Agentic Spotify Plugin with complete Claude Code and Codex install sections (bundled runtime = zero-step default, overrides documented); docs/plugin-production-release.md covers dual manifests, runtime sync rule, and verified Claude Code install flow."
  failed: ""
  needed: "Run loop 005 phase review against all success criteria and write the gate verdict."
todos:
  - id: "loop-004-todo-001"
    content: "Rewrite README.md to present the project as a Spotify plugin for both Claude Code/Cowork and Codex, with a Claude install section (marketplace add + install + auth env setup) and the existing Codex flow."
    skill: "NA"
    agent: "worker"
    outcome: "README.md contains distinct, complete install sections for Claude Code/Cowork and Codex, updated branch-intent notes including the claude branch, and no stale Codex-only framing in the title or intro."
    status: "completed"
    priority: "high"
  - id: "loop-004-todo-002"
    content: "Update docs/plugin-production-release.md for the dual-manifest release workflow (rebuild payload, validate for both runtimes, version sync between .codex-plugin and .claude-plugin manifests)."
    skill: "NA"
    agent: "worker"
    outcome: "docs/plugin-production-release.md documents the dual-manifest build/validate/install steps and the version-sync rule."
    status: "completed"
    priority: "high"
prompt: |
  Execute Phase 7 loop 004 after loop 003.
  Own README.md and docs/plugin-production-release.md.
  Keep the agent-centered install framing. Claude Code install must cover: /plugin marketplace add MungoHarvey/Agentic-Spotify-Plugin (or local path), /plugin install spotify-plugin@<marketplace>, Spotify Developer app setup with redirect URI http://127.0.0.1:43210/callback, and SPOTIFY_CLIENT_ID / SPOTIFY_REDIRECT_URI env vars.
  Preserve the warning that bare `spotify` on Windows can resolve to the desktop app.
```

```yaml
name: "ralph-loop-005"
task_name: "Phase 7 review against success criteria"
max_iterations: 2
on_max_iterations: "escalate"
handoff_summary:
  done: ""
  failed: ""
  needed: ""
todos:
  - id: "loop-005-todo-001"
    content: "Verify every Phase 7 success criterion from .advanced-plans/phases/phase-7/plan.md with concrete evidence (file checks, JSON parses, grep sweeps, test output, directory diff)."
    skill: "superpowers:verification-before-completion"
    agent: "reviewer"
    outcome: "Each success criterion is marked met with evidence, or a defect list with exact paths is produced."
    status: "pending"
    priority: "high"
  - id: "loop-005-todo-002"
    content: "Fix any defects found and re-verify."
    skill: "NA"
    agent: "worker"
    outcome: "Re-verification shows all success criteria met; npm test and npm run check still pass."
    status: "pending"
    priority: "high"
prompt: |
  Execute Phase 7 loop 005 after loop 004.
  Read .advanced-plans/phases/phase-7/plan.md and verify each success criterion with commands, not assumptions. Record evidence in the handoff. Secret hygiene: confirm no tokens, client secrets, or .env values are staged.
```

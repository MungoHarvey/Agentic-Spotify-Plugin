# Universal Runtime Research — 2026-07-02

Sourced research (WebSearch/WebFetch, not training-data memory) into how five agentic-runtime
targets consume plugins/skills/instructions, to drive Phase 8 packaging decisions for
`release/spotify-plugin`. Today is 2026-07-02.

Recap of what we're packaging: `.claude-plugin/plugin.json` (Claude Code manifest),
`.codex-plugin/plugin.json` (Codex manifest), `skills/spotify/SKILL.md` +
`skills/spotify-queue-list/SKILL.md` (Anthropic-style skills, `name`+`description` frontmatter
only, detail pushed to `references/`), `bin/` CLI shims, and a bundled zero-dependency
TypeScript runtime under `runtime/` (Node 22.6+). The CLI is the universal interface;
everything else is instructions/packaging.

---

## 1. OpenCode (opencode.ai / sst/opencode)

**Verified:**

- Plugins are JS/TS modules exported from files in `.opencode/plugins/` (project) or
  `~/.config/opencode/plugins/` (global), auto-loaded at startup with no manifest file.
  npm-distributed plugins are declared in `opencode.json` under a `"plugin": [...]` array and
  installed automatically via Bun. There is no `plugin.json`-style manifest.
  Source: [Plugins | OpenCode](https://opencode.ai/docs/plugins/)
- OpenCode has first-party **Agent Skills** support. Skill directories are discovered by
  walking up from cwd to the git worktree root, checked in multiple locations including
  `.opencode/skills/<name>/SKILL.md`, `~/.config/opencode/skills/<name>/SKILL.md`, and
  **Claude-compatible paths, explicitly `.claude/skills/<name>/SKILL.md`**. Frontmatter is
  YAML with required `name` + `description` (same constraints as Anthropic's format: name
  1–64 chars, lowercase/hyphens, matches dir name; description 1–1024 chars), plus optional
  `license`/`compatibility`/`metadata`. Skills are exposed to the agent via a native `skill`
  tool and loaded on demand (`skill({ name: ... })`).
  Source: [Agent Skills | OpenCode](https://opencode.ai/docs/skills/)
- OpenCode reads `AGENTS.md` from the project root (or nearest ancestor) and a global
  `~/.config/opencode/AGENTS.md`. If no `AGENTS.md` exists it falls back to `CLAUDE.md`
  (project) and `~/.claude/CLAUDE.md` (global) for Claude-Code-project compatibility
  (disable-able via env var). Lookup order: local AGENTS.md → local CLAUDE.md → global
  AGENTS.md → global CLAUDE.md. No size limit documented; `/init` output is intentionally
  terse.
  Source: [Rules | OpenCode](https://opencode.ai/docs/rules/)

**Packaging decision: native reuse, no adapter file.**
Our planned root `AGENTS.md` is read directly (OpenCode prefers it over `CLAUDE.md`, and we
ship no `CLAUDE.md` in the release payload, so no conflict). Our existing `SKILL.md` files are
format-compatible as-is. The only gap is *path*: our skills live at `skills/<name>/SKILL.md`
at the plugin root, not under `.claude/skills/` or `.opencode/skills/`. This is an **install
step**, not a new file format — `docs/universal-install.md` should instruct OpenCode users to
symlink/copy `release/spotify-plugin/skills/*` into `.opencode/skills/` (project) or
`~/.config/opencode/skills/` (global). No custom JS plugin is needed since the CLI is
self-contained and we have no hook/tool-injection requirements.

---

## 2. OpenClaw (openclaw/openclaw, docs.openclaw.ai)

**Verified:**

- Skills are `SKILL.md` files with YAML frontmatter following the **agentskills.io** open
  standard (same standard OpenCode and Hermes Agent target — see §4/§3). Minimum required
  frontmatter is `name` + `description`; nothing else is mandatory. One OpenClaw-specific
  constraint: the frontmatter parser supports **single-line keys only**, so any `metadata`
  entry must be a flat single-line JSON object rather than nested YAML (our SKILL.md files
  don't use `metadata` at all, so this doesn't affect us).
  Source: [Skills · OpenClaw](https://docs.openclaw.ai/tools/skills)
- Skill discovery precedence (highest wins): `<workspace>/skills`, `<workspace>/.agents/skills`,
  `~/.agents/skills`, `~/.openclaw/skills` (managed/global), bundled skills, then extra
  configured/plugin directories. Folder path is organizational only — the skill's identity
  comes from the `name` frontmatter field, and subdirectories are walked, so grouping is
  free-form. Install mechanisms: `openclaw skills install @owner/<slug>` (ClawHub registry),
  `openclaw skills install git:owner/repo@ref`, or `openclaw skills install ./path/to/skill`
  (local); add `--global` to install to `~/.openclaw/skills`.
  Source: [Creating skills · OpenClaw](https://docs.openclaw.ai/tools/creating-skills)
- `AGENTS.md` is a first-class, central concept — described as the agent's "Standard
  Operating Procedure," loaded into every session, and explicitly supports **nested/scoped**
  `AGENTS.md` files per subtree ("skills own workflows while root owns hard policy and
  routing"), matching the general AGENTS.md monorepo convention. OpenClaw's own repo ships a
  root `AGENTS.md`.
  Source: [OpenClaw AGENTS.md](https://github.com/openclaw/openclaw/blob/main/AGENTS.md),
  [Agent runtime · OpenClaw](https://docs.openclaw.ai/concepts/agent)

**Packaging decision: native reuse, no adapter file.**
Both mechanisms we're already building work unmodified: place/symlink `release/spotify-plugin`
into (or under) an OpenClaw workspace and its `skills/` subfolder is picked up directly if it
sits at `<workspace>/skills`; otherwise run
`openclaw skills install ./release/spotify-plugin/skills/spotify` (and the queue-list skill)
per skill directory. Our planned `AGENTS.md` is read as a scoped SOP for that subtree. No new
file format is required; `docs/universal-install.md` just needs the concrete `openclaw skills
install` commands.

---

## 3. Hermes (NousResearch/hermes-agent — "Hermes Agent")

**Identification note:** "Hermes" is an overloaded name in the Nous Research ecosystem — Nous
also publishes a **Hermes LLM model series** (weights, not an agent runtime), which is a
different thing. The most plausible referent for "an agentic runtime called Hermes" that a
hobbyist would mean in mid-2026 is **Hermes Agent**
(`github.com/nousresearch/hermes-agent`, `hermes-agent.nousresearch.com`) — a real,
actively-maintained (208k★ at time of check, v0.18.0 released 2026-07-01), self-hosted
personal agent that runs the same core across a CLI, TUI, Electron app, and a messaging
gateway (Telegram/Discord/Slack/WhatsApp/Signal/Email). Confidence is moderate-high given the
verified GitHub repo, docs site, and release cadence, but this is a fast-moving, sub-1.0
project — re-verify at implementation time if the user meant something else.
Source: [github.com/nousresearch/hermes-agent](https://github.com/nousresearch/hermes-agent)

**Confirmed 2026-07-02:** the project owner confirmed Hermes Agent (NousResearch) is the
intended referent — an autonomous agent in the same family as OpenClaw. Both are served by the
same payload (agentskills.io skills + AGENTS.md); no configuration fork required.

**Verified:**

- Install is a shell installer (`curl ... install.sh | bash` / `irm ... install.ps1` on
  Windows), not npm/pip directly; it provisions Python 3.11 + Node via `uv` under the hood.
- Skills use `SKILL.md` + YAML frontmatter and are **explicitly agentskills.io-compatible**
  (README states "Compatible with the agentskills.io open standard"). Skills live in
  `~/.hermes/skills/` (source of truth after install-time bundling); users can add
  **external directories** via `skills.external_dirs` in `~/.hermes/config.yaml` (supports `~`
  and env-var expansion), or install via `hermes skills install` from a Hub/registry, git
  repo, or direct URL. There's a separate, less-documented "Plugins"/`hermes plugins
  list/install/remove` surface, but it isn't described as a packaging format we need — skills
  are the extension point that matters for us.
  Source: [Skills System | Hermes Agent](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills)
- `AGENTS.md` is the **primary project context file**: loaded from the working directory at
  session start, with progressive discovery of nested context files as the agent navigates
  subdirectories. Only one project-context type loads per directory, first match wins:
  `.hermes.md` → `AGENTS.md` → `CLAUDE.md` → `.cursorrules`.
  Source: [Context Files | Hermes Agent](https://hermes-agent.nousresearch.com/docs/user-guide/features/context-files)

**Packaging decision: native reuse, no adapter file.**
Our root `AGENTS.md` is picked up automatically (and wins over any `CLAUDE.md`, which we don't
ship). Our `SKILL.md` files match the agentskills.io standard Hermes targets directly. Install
recipe for `docs/universal-install.md`: point `skills.external_dirs` at
`release/spotify-plugin/skills`, or `hermes skills install ./release/spotify-plugin/skills/spotify`
per skill directory.

---

## 4. AGENTS.md convention (agents.md)

**Verified:**

- Plain Markdown, no required fields or schema — "the agent simply parses the text you
  provide." Common but non-mandatory sections: overview, build/test commands, style, testing,
  security, PR/commit conventions.
  Source: [AGENTS.md](https://agents.md/)
- Placement: root file is standard; **nested AGENTS.md files are supported for
  monorepos/subprojects**, with agents reading the *nearest* file up the directory tree (closest
  wins). No documented size cap; informal best practice (per Codex/OpenCode guidance) is to
  keep it concise and push detail elsewhere (which matches our design of a compact
  pointer-style file deferring to `skills/*/references/`).
  Source: [agents.md GitHub](https://github.com/agentsmd/agents.md),
  [Custom instructions with AGENTS.md – Codex](https://developers.openai.com/codex/guides/agents-md)
- Governance: now stewarded by the **Agentic AI Foundation under the Linux Foundation**,
  originated by OpenAI Codex, with Factory and others formally joining the collaboration.
  Adoption cited in the tens of thousands of open-source repos.
  Source: [agents.md](https://agents.md/), [Factory joins AGENTS.md collaboration](https://factory.ai/news/agents-md)
- Confirmed adopters relevant to us: **OpenAI Codex** (origin), **OpenCode**, **OpenClaw**,
  **Hermes Agent** (all verified above with concrete read-paths), plus Cursor, GitHub Copilot
  Coding Agent, Google Jules/Gemini CLI, Aider, goose, Factory, Zed, Warp, Devin, JetBrains
  Junie, and others per the agents.md site's adopter list.
- **Important correction to the Phase 8 plan's assumption:** an initial `agents.md`-derived
  search result implied "Claude (Anthropic)" supports AGENTS.md, but that is **not accurate for
  Claude Code**. Direct verification shows Claude Code still only reads `CLAUDE.md`; native
  AGENTS.md support is an **open, unresolved feature request**
  (`anthropics/claude-code` issues #6235 and #34235, both still open as of 2026-07-02).
  Source: [Feature Request: Support AGENTS.md · Issue #6235](https://github.com/anthropics/claude-code/issues/6235),
  [Feature request: support AGENTS.md · Issue #34235](https://github.com/anthropics/claude-code/issues/34235)

**Packaging decision:** ship `release/spotify-plugin/AGENTS.md` exactly as scoped in the Phase
8 plan — compact, pointer-style, deferring detail to `skills/*/references/`. This single file
is the universal wrap for Codex, OpenCode, OpenClaw, Hermes Agent, and any other
AGENTS.md-reading tool. It is inert (harmlessly ignored) for Claude Code, which continues to
rely solely on `.claude-plugin/plugin.json` + `skills/` — so there is **no duplicate-guidance
risk** with Claude Code as the Phase 8 risk register worried about; Claude Code simply never
reads the file.

---

## 5. Claude Cowork

**Verified:**

- Plugin support in Cowork is live (research preview, all paid Claude plans). Anthropic
  states plugins "work across Cowork and anything built on the Claude Agent SDK," and ships
  Anthropic-authored plugins via a public repo.
  Source: [Customize Cowork with plugins](https://claude.com/blog/cowork-plugins)
- The reference implementation repo (`anthropics/knowledge-work-plugins`) uses the layout:
  ```
  plugin-name/
  ├── .claude-plugin/
  │   └── plugin.json          # same manifest key as Claude Code plugins
  ├── .mcp.json                # tool/connector wiring
  ├── commands/                 # explicit slash commands
  └── skills/                   # automatically-activated domain knowledge
  ```
  i.e. the **same `.claude-plugin/plugin.json` manifest** and `skills/` convention our payload
  already uses — no separate Cowork-specific manifest format exists.
  Source: [anthropics/knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins)
- The Claude Help Center plugins article confirms plugins are installable directly in Cowork
  or via GitHub-repo marketplace sources, and explicitly defers "plugin structure and
  formatting" to the Claude Code plugin reference docs — i.e. Anthropic treats it as one
  spec, not two. It does note "hooks and sub-agents run only in Cowork" (a Cowork-only
  capability, not a restriction that affects us since we ship neither).
  Source: [Use plugins in Claude | Claude Help Center](https://support.claude.com/en/articles/13837440-use-plugins-in-claude)

**Packaging decision: no new packaging — already Cowork-compatible.**
Our existing `.claude-plugin/plugin.json` + `skills/` satisfies Cowork's documented plugin
shape as-is. `docs/universal-install.md` should simply state that Cowork users add the same
GitHub repo as a plugin/marketplace source and install identically to Claude Code — no
divergent artifact needed. (We do not add a `commands/` or `.mcp.json` in this phase; out of
scope per Phase 8's "no new Spotify API capability" / "no runtime-specific code forks" limits.)

---

## Summary decision table

| Runtime | Reads our skills as-is? | Reads AGENTS.md natively? | Packaging decision | New file(s) needed |
|---|---|---|---|---|
| **Claude Code** | Yes (`.claude-plugin/plugin.json` + `skills/`) | No (CLAUDE.md only; AGENTS.md ignored, harmless) | Existing manifest, unchanged | None (already shipped) |
| **Claude Cowork** | Yes (identical `.claude-plugin/plugin.json` + `skills/` shape) | No (same as Claude Code) | Existing manifest, unchanged | None |
| **Codex** | Via `.codex-plugin/plugin.json` `"skills": "./skills/"` | Yes (origin of the convention) | Existing manifest + planned AGENTS.md | None beyond planned AGENTS.md |
| **OpenCode** | Yes, format-compatible; needs path placement (`.opencode/skills/` or `.claude/skills/`) | Yes (prefers AGENTS.md over CLAUDE.md) | AGENTS.md wrap + native skill reuse (install-step symlink/copy) | None — install recipe only |
| **OpenClaw** | Yes, format-compatible (`agentskills.io`); workspace `skills/` or `openclaw skills install` | Yes, first-class, nested/scoped support | AGENTS.md wrap + native skill reuse (install command) | None — install recipe only |
| **Hermes Agent** (NousResearch) | Yes, explicitly `agentskills.io`-compatible; via `external_dirs` or `hermes skills install` | Yes, primary project-context file, progressive nested discovery | AGENTS.md wrap + native skill reuse (config/install recipe) | None — install recipe only |
| **Generic AGENTS.md agents** (Cursor, Copilot Coding Agent, Jules/Gemini CLI, Aider, goose, Factory, Zed, Warp, Junie, etc.) | No native skill format assumed | Yes, by definition | AGENTS.md is the whole contract; CLI is the fallback interface | None — AGENTS.md + CLI docs only |

**Surprise worth flagging for Phase 8 scope:** no new adapter *files* are needed for any of
the five research targets — every one of them either already speaks our exact `SKILL.md`
format (all three converge on the `agentskills.io` standard: `name`+`description` frontmatter,
optional `references/`) or needs nothing but the planned `AGENTS.md`. The real Phase 8 work is
concentrated in `docs/universal-install.md` (per-runtime *placement/install commands*, not new
formats) and the README support matrix — the "native adapter file" deliverable class in the
phase plan's success criteria will end up empty for every target except the already-shipped
Codex/Claude manifests. This is good news: it reduces Phase 8 risk of payload bloat, but the
success-criteria wording ("native adapter file / AGENTS.md wrap / CLI-only recipe /
documented-unsupported") should be read as **AGENTS.md wrap being the dominant outcome**, not
an edge case.

One correction to carry into `release/spotify-plugin/AGENTS.md` drafting: don't assume Claude
Code reads it (verified false, §4) — keep the file additive/inert for Claude Code rather than
writing content that assumes it's the operative instruction source there.

---

## Token-store directory decision (carry-forward from Phase 7)

**Current state:** `src/config/paths.ts` defines `APP_NAME = 'spotify-codex-plugin'` and
`TOKEN_STORE_DIR = 'spotify-codex-plugin'`, resolving to `%APPDATA%\spotify-codex-plugin\` on
Windows or `~/.config/spotify-codex-plugin/` elsewhere (`tokens.json` inside).

**Options considered:**
- (a) Keep as legacy constant, document the historical name.
- (b) Rename (e.g. to `spotify-plugin`, matching `REPO_ROOT_NAME`) with a backward-compatible
  fallback read from the old `spotify-codex-plugin` path.

**Recommendation: (b) — rename with backward-compatible fallback read.**

Rationale:
- **Installed-base risk is low but not zero, and the fix is nearly free.** The plugin is
  pre-1.0 (`0.1.0`), single-author, not published to any package registry — the realistic
  installed base is the author's own machines. A fallback-read (check the new path first; if
  the token file is missing there, read the legacy `spotify-codex-plugin` path; write new
  tokens to the new path going forward) fully eliminates breakage risk for that installed base
  at the cost of a few lines in `getDefaultTokenStorePath`, so there's no reason to accept any
  residual risk by choosing (a).
- **Naming cleanliness now matters more than it did in Phase 7.** The whole point of Phase 8 is
  positioning this as a *universal* plugin (Claude Code, Cowork, Codex, OpenCode, OpenClaw,
  Hermes Agent, generic AGENTS.md agents). A token directory literally named
  `spotify-codex-plugin` sitting under a Claude Code or OpenCode install is actively confusing
  to a user inspecting `%APPDATA%` or `~/.config` — it reads as either a bug or a sign the tool
  is Codex-specific/vendor-locked, undermining the universal message this phase exists to
  deliver.
  it aligns with the phase's exclusion: "No token-store migration code unless the decision is
  'migrate' AND it is backward-compatible reading the old path" — this recommendation is
  exactly that: migrate + backward-compatible read.

**Concrete follow-up (implementation, not part of this research doc):** rename
`TOKEN_STORE_DIR`/`APP_NAME` to `spotify-plugin` in `src/config/paths.ts` (and the mirrored
`release/spotify-plugin-runtime/src/config/paths.ts` /
`release/spotify-plugin/runtime/src/config/paths.ts` copies), add a
`getLegacyTokenStorePath()` helper alongside `getDefaultTokenStorePath()`, and have the token
read path check new-path-then-legacy-path (write-through to new path on next successful auth).
This is a small, self-contained change suitable for its own Phase 8 loop — flagging it here
rather than implementing it as part of this research task.

---

## Sources (all fetched/searched 2026-07-02)

- https://opencode.ai/docs/plugins/
- https://opencode.ai/docs/skills/
- https://opencode.ai/docs/rules/
- https://docs.openclaw.ai/tools/skills
- https://docs.openclaw.ai/tools/creating-skills
- https://docs.openclaw.ai/concepts/agent
- https://github.com/openclaw/openclaw/blob/main/AGENTS.md
- https://github.com/nousresearch/hermes-agent
- https://hermes-agent.nousresearch.com/docs/user-guide/features/skills
- https://hermes-agent.nousresearch.com/docs/user-guide/features/context-files
- https://agents.md/
- https://github.com/agentsmd/agents.md
- https://developers.openai.com/codex/guides/agents-md
- https://factory.ai/news/agents-md
- https://agentskills.io/specification
- https://claude.com/blog/cowork-plugins
- https://github.com/anthropics/knowledge-work-plugins
- https://support.claude.com/en/articles/13837440-use-plugins-in-claude
- https://github.com/anthropics/claude-code/issues/6235
- https://github.com/anthropics/claude-code/issues/34235

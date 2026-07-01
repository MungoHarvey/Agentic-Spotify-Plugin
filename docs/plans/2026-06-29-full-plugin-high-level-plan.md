# Spotify Plugin High-Level Plan

> **For agentic workers:** This is a high-level phase plan. Before implementing any phase, create a phase-specific implementation plan with checkbox steps, exact files, validation commands, and expected outcomes. For execution, use `advanced-ai-workflows:workflow-phase-create`, `advanced-ai-workflows:workflow-loop-generate`, and `advanced-ai-workflows:workflow-next-loop`, or use `superpowers:subagent-driven-development` / `superpowers:executing-plans` for task-by-task implementation.

> **Execution index:** Use `docs/plans/2026-06-30-phase-loop-execution-plan.md` for current phase status, phase gates, loop rules, and immediate next loops.

**Goal:** Build a CLI-first Codex plugin for Spotify with skill-led workflows, a shared Spotify client, optional minimal MCP wrappers, and later Web Playback SDK diagnostics.

**Architecture:** The CLI is the broad integration surface. Codex skills provide workflow intelligence and context-efficient operating guidance. MCP tools remain small wrappers for stable primitives only.

**Tech Stack:** TypeScript, Node.js, Spotify Web API, Authorization Code with PKCE, local loopback callback server, Codex skills, optional MCP server.

---

## Planning Principles

- Build the plugin around a reliable CLI before broad MCP tooling.
- Keep Spotify API behavior centralized in a shared client.
- Keep skills concise and route detailed instructions to reference files.
- Treat MCP tools as convenience wrappers, not the main product surface.
- Use phase plans for exact implementation steps.
- Use small loops inside each phase so work can be reviewed and verified incrementally.
- Keep tokens and secrets outside the repository from the first auth implementation.

## Phase 0: Repository and Plugin Skeleton

**Goal:** Establish a clean project structure that supports CLI, skills, shared Spotify client code, optional MCP wrappers, tests, and documentation.

**Primary outputs:**

- `.codex-plugin/plugin.json`
- `.mcp.json`
- `package.json`
- `tsconfig.json`
- source folders under `src/`
- test folders under `tests/`
- `skills/spotify/SKILL.md`
- `.env.example`
- README links to architecture, auth setup, and command usage

**Suggested loops:**

- Loop 0.1: Choose package scripts, TypeScript settings, and source layout.
- Loop 0.2: Create Codex plugin manifest and local MCP configuration stub.
- Loop 0.3: Create empty CLI entrypoint and command routing skeleton.
- Loop 0.4: Create initial Spotify skill shell and reference file structure.
- Loop 0.5: Add validation commands for type-check, tests, and plugin manifest checks.

**Exit criteria:**

- A developer can see where CLI, auth, Spotify client, skills, MCP wrappers, and tests live.
- The project has deterministic local validation commands.
- No secrets or generated tokens are stored in the repository.

## Phase 1: PKCE Auth and Token Storage

**Goal:** Let a user connect Spotify from the CLI using Authorization Code with PKCE and store tokens outside the repository.

**Primary outputs:**

- `spotify auth login`
- `spotify auth status`
- `spotify auth refresh`
- `spotify auth logout`
- PKCE verifier and challenge generation
- local callback server bound to `127.0.0.1`
- token exchange and refresh logic
- token store outside the repository
- auth setup documentation

**Suggested loops:**

- Loop 1.1: Implement and test PKCE verifier/challenge generation.
- Loop 1.2: Implement config loading for `SPOTIFY_CLIENT_ID` and `SPOTIFY_REDIRECT_URI`.
- Loop 1.3: Implement authorization URL construction with state validation.
- Loop 1.4: Implement local callback server for `http://127.0.0.1:<port>/callback`.
- Loop 1.5: Implement token exchange and refresh.
- Loop 1.6: Implement token store path and read/write behavior outside the repo.
- Loop 1.7: Implement CLI auth commands and JSON output.
- Loop 1.8: Update skill auth instructions and setup docs.

**Exit criteria:**

- `spotify auth login` completes a browser-based Spotify login for an allowlisted test account.
- `spotify auth status --json` reports authentication state, expiry, granted scopes, and token-store location without printing token values.
- `spotify auth refresh` refreshes an expired or near-expired token.
- `spotify auth logout` removes local stored credentials.
- Auth failures explain redirect mismatch, missing client ID, tester allowlist, missing scopes, and token refresh failure.

## Phase 2: Shared Spotify Client Foundation

**Goal:** Build the reusable client layer that all CLI commands and MCP wrappers use.

**Primary outputs:**

- authenticated Spotify Web API client
- automatic token refresh before expiry
- centralized Spotify error types
- `401`, `403`, `404`, and `429` handling
- `Retry-After` handling
- pagination helper
- compact response shaping helpers

**Suggested loops:**

- Loop 2.1: Define Spotify client request interface and response contract.
- Loop 2.2: Add bearer-token injection and refresh-before-request behavior.
- Loop 2.3: Add normalized error handling for common Spotify statuses.
- Loop 2.4: Add rate-limit handling using `Retry-After`.
- Loop 2.5: Add pagination helper for `limit` and `offset` endpoints.
- Loop 2.6: Add compact shape helpers for user, device, track, episode, playlist, and playback objects.
- Loop 2.7: Add tests using mocked Spotify responses.

**Exit criteria:**

- CLI commands do not duplicate token refresh, retry, pagination, or error interpretation.
- Client tests cover successful requests, refresh, rate limits, pagination, and common error statuses.

## Phase 3: Skill-First Workflow Layer

**Goal:** Make Codex effective with the Spotify CLI while keeping context usage low.

**Primary outputs:**

- `skills/spotify/SKILL.md`
- auth reference
- command reference
- playlist workflow reference
- queue workflow reference
- search and URI resolution reference
- safety reference

**Suggested loops:**

- Loop 3.1: Write concise skill routing instructions.
- Loop 3.2: Document auth diagnosis workflow.
- Loop 3.3: Document read-only inspection workflows.
- Loop 3.4: Document safe write workflows and ambiguity policy.
- Loop 3.5: Document Premium, queue, and Web Playback SDK limits.
- Loop 3.6: Validate the skill with local skill validation tooling where available.

**Exit criteria:**

- The main skill is short enough to load routinely.
- Detailed workflow references are split by topic.
- The skill tells Codex when to run CLI commands, when to ask the user, and when not to promise unsupported Spotify behavior.

## Phase 4: Account, Device, Playback, and Queue Diagnostics

**Goal:** Provide enough read-only and low-risk diagnostics to verify account, scopes, Premium status, active devices, playback, and queue state.

**Primary outputs:**

- `spotify me`
- `spotify player devices`
- `spotify player state`
- `spotify player current`
- `spotify queue get`
- compact JSON output for all diagnostic commands

**Suggested loops:**

- Loop 4.1: Implement current user lookup and product/country shaping.
- Loop 4.2: Implement device listing.
- Loop 4.3: Implement current playback state.
- Loop 4.4: Implement currently playing item lookup.
- Loop 4.5: Implement current queue lookup.
- Loop 4.6: Improve Premium and no-active-device error explanations.

**Exit criteria:**

- A user can confirm the connected account and granted playback capabilities.
- Queue diagnostics explain Premium and active-device requirements.
- JSON output is compact enough for Codex to parse safely.

## Phase 5: Playlist Reads

**Goal:** Let Codex inspect playlists reliably before any playlist mutation work.

**Primary outputs:**

- `spotify playlists list`
- `spotify playlist get <playlist_id>`
- `spotify playlist items <playlist_id>`
- pagination support
- optional fields support where useful

**Suggested loops:**

- Loop 5.1: Implement current user's playlist listing.
- Loop 5.2: Implement all-playlists pagination.
- Loop 5.3: Implement playlist metadata lookup.
- Loop 5.4: Implement playlist item lookup.
- Loop 5.5: Add compact playlist item shapes.
- Loop 5.6: Add skill guidance for large playlist inspection.

**Exit criteria:**

- A user can list all current playlists.
- A user can inspect playlist contents without oversized default output.
- Playlist items include positions so later duplicate-aware writes are possible.

## Phase 6: Playlist Writes

**Goal:** Support core playlist mutation workflows with snapshot-aware and duplicate-aware behavior.

**Primary outputs:**

- `spotify playlist create`
- `spotify playlist update`
- `spotify playlist add`
- `spotify playlist remove`
- `spotify playlist remove-positions`
- `spotify playlist reorder`
- `spotify playlist replace`
- snapshot ID reporting

**Suggested loops:**

- Loop 6.1: Implement playlist creation using current user ID.
- Loop 6.2: Implement playlist metadata updates.
- Loop 6.3: Implement batched item additions.
- Loop 6.4: Implement URI-based removals.
- Loop 6.5: Implement position-aware duplicate removals.
- Loop 6.6: Implement reorder.
- Loop 6.7: Implement replacement.
- Loop 6.8: Add snapshot conflict explanations.

**Exit criteria:**

- Every playlist write returns the resulting `snapshot_id`.
- Duplicate removals can target explicit positions.
- Stale snapshot or permission failures are explained clearly.

## Phase 7: Queue and Playback Control

**Goal:** Support queue additions and playback controls within Spotify's documented API limits.

**Primary outputs:**

- `spotify queue add <uri>`
- `spotify queue add-many <uri...>`
- `spotify player transfer`
- `spotify player play`
- `spotify player pause`
- `spotify player next`
- `spotify player previous`

**Suggested loops:**

- Loop 7.1: Implement single item queue add.
- Loop 7.2: Implement multi-add with sequential execution and partial failure reporting.
- Loop 7.3: Implement playback transfer.
- Loop 7.4: Implement play and pause.
- Loop 7.5: Implement next and previous.
- Loop 7.6: Update skill guidance for unsupported queue reorder and queue removal.

**Exit criteria:**

- Queue additions work against an active Premium playback device.
- Multi-add reports which items succeeded and failed.
- The plugin never implies native queue reorder or removal support.

## Phase 8: Search and URI Resolution

**Goal:** Make playlist and queue commands usable from natural-language music requests while avoiding surprising writes.

**Primary outputs:**

- `spotify search <query>`
- `spotify track get <track_id>`
- `spotify tracks get <track_id...>`
- `spotify album get <album_id>`
- `spotify artist get <artist_id>`
- optional resolver command that returns candidates

**Suggested loops:**

- Loop 8.1: Implement search with explicit type filters.
- Loop 8.2: Shape track, album, artist, playlist, show, and episode candidates.
- Loop 8.3: Implement track lookup.
- Loop 8.4: Implement batch track lookup.
- Loop 8.5: Implement album and artist lookup.
- Loop 8.6: Add skill policy for ambiguity and write confirmation.

**Exit criteria:**

- Users can find Spotify URIs without leaving Codex.
- Ambiguous search results produce candidate lists.
- Write workflows require explicit selection unless the user requested best-effort behavior.

## Phase 9: Optional Web Playback SDK Setup App

**Goal:** Provide a local browser-based diagnostics app that can become a Spotify Connect device for Premium users.

**Primary outputs:**

- local setup app
- Web Playback SDK loading
- SDK device ID display
- transfer playback action
- account, active device, playback, and queue diagnostics

**Suggested loops:**

- Loop 9.1: Serve a local setup page from the plugin.
- Loop 9.2: Show auth and account status.
- Loop 9.3: Load the Web Playback SDK.
- Loop 9.4: Initialize `Spotify.Player`.
- Loop 9.5: Display SDK `device_id`.
- Loop 9.6: Transfer playback to browser device.
- Loop 9.7: Show playback and queue diagnostics.

**Exit criteria:**

- A Premium user can activate the browser as a Spotify Connect device.
- Playback diagnostics are useful without becoming a full consumer app.
- Playlist functionality remains independent from the setup app.

## Phase 10: Minimal MCP Wrappers

**Goal:** Add only the MCP tools that provide clear value over shelling out to the CLI.

**Primary outputs:**

- `spotify_auth_status`
- `spotify_me`
- `spotify_player_devices`
- `spotify_queue_get`
- optional wrappers based on repeated CLI usage

**Suggested loops:**

- Loop 10.1: Implement MCP server skeleton.
- Loop 10.2: Wrap auth status.
- Loop 10.3: Wrap current user lookup.
- Loop 10.4: Wrap device list.
- Loop 10.5: Wrap queue get.
- Loop 10.6: Compare context cost of MCP wrappers against skill-plus-CLI usage.

**Exit criteria:**

- MCP schemas stay small.
- MCP wrappers use the same shared client as the CLI.
- Broad Spotify coverage remains available through CLI commands and skills.

## Phase 11: Hardening and Release Readiness

**Goal:** Make the plugin reliable for repeated local use and later sharing.

**Primary outputs:**

- manual end-to-end verification script
- setup documentation
- known limitations document
- command coverage table
- scope table
- secrets review
- packaging and install instructions

**Suggested loops:**

- Loop 11.1: Create manual verification script for auth, reads, playlist writes, and queue adds.
- Loop 11.2: Review and improve error messages.
- Loop 11.3: Add response-size limits and defaults.
- Loop 11.4: Add secrets scan guidance.
- Loop 11.5: Document Spotify dashboard setup and tester allowlisting.
- Loop 11.6: Document install and update workflow.

**Exit criteria:**

- A new developer can configure a Spotify app and connect an account from the docs.
- Known Spotify limitations are documented in the user-facing materials.
- The plugin can be installed locally without losing credentials on update.

## Phase Plan Template

Each phase should get a dedicated implementation plan before execution:

```text
docs/plans/YYYY-MM-DD-phase-N-short-name.md
```

Each phase plan should include:

- Goal and non-goals.
- Exact files to create or modify.
- Small checkbox tasks.
- Test-first steps where code behavior is involved.
- Validation commands and expected outcomes.
- Commit points if the repository has a valid git setup.
- Live Spotify manual checks when network and account access are required.

## Loop Template

Each loop should be small enough to execute and verify independently:

```text
Loop N.M: concise objective

Inputs:
- docs and files required before starting

Steps:
- write or update focused tests
- implement the smallest code path
- run targeted validation
- update relevant docs or skill reference

Done when:
- targeted tests pass
- expected command output is documented
- no secrets are written to the repository
- next loop can start without hidden context
```

## Immediate Next Planning Work

Create the Phase 0 and Phase 1 implementation plan for the CLI-first scaffold and PKCE auth flow. That plan should be implementation-grade, with exact files, tests, validation commands, and expected outputs.

# Phase and Loop Execution Plan

Date: 2026-06-30

This plan turns the roadmap and architecture into an execution structure. It is the bridge between the high-level plan and phase-specific implementation plans.

## Current Baseline

The project now has a development workspace and a separate production plugin payload:

- Development workspace: repository root with TypeScript source, tests, docs, and planning records.
- Production plugin payload: `release/spotify-plugin`.
- Installed personal plugin id: `spotify-plugin@personal`.
- Auth, shared Spotify client behavior, account/player/queue diagnostics, playlist reads, and core playlist writes are implemented.
- `npm test` passes with 123 tests.
- `npm run check` passes.
- `plugin-eval analyze release\spotify-plugin --format markdown` scores 100/100, Grade A, low risk.
- `plugin-creator` validation passes against `release/spotify-plugin`.

The next implementation work should start after Phase 6 and release-readiness validation, likely with queue add/playback controls, search and URI resolution, or selective MCP wrappers where they reduce context compared with CLI-first workflows.

## Execution Loop Model

Every loop should be small enough to complete, review, and verify independently.

Standard loop:

```text
1. Confirm scope
2. Write or update focused tests
3. Implement the smallest useful behavior
4. Run targeted validation
5. Update docs or skill references
6. Record follow-up decisions
```

Loop rules:

- A loop should touch a narrow set of files.
- A loop should have one primary validation command.
- A loop is not complete until its expected output is known.
- Live Spotify checks are manual and gated; unit tests should not require network access.
- Any loop that handles tokens must verify that secrets are not printed or written into the repository.

## Subagent Operating Model

Use subagents for the bulk of bounded loop work once the manager has defined the current phase, loop objective, ownership boundaries, and validation command.

Use `docs/plans/2026-06-30-subagent-skill-injection.md` to decide which development-process skills and Spotify domain references to inject into each worker prompt.

Manager responsibilities:

- Own the phase gate and decide which loop runs next.
- Split work into independent loops with disjoint file ownership.
- Give each subagent a concrete task, expected files, validation command, and done criteria.
- Continue non-overlapping work while subagents run.
- Review returned changes before integrating or building on them.
- Run final validation from the main workspace before declaring a loop or phase complete.
- Keep roadmap, architecture, skill references, and phase status aligned.

Subagent responsibilities:

- Work only on the assigned loop.
- Edit files directly in the assigned write scope.
- Avoid reverting or overwriting work from other agents.
- Add or update focused tests for the behavior they implement.
- Run the assigned validation command when feasible.
- Report changed files, validation results, remaining risks, and follow-up recommendations.

Good subagent tasks:

- "Implement token exchange in `src/auth/` and tests in `tests/auth/`."
- "Add `.codex-plugin/plugin.json` and validate the manifest shape."
- "Update `skills/spotify/references/auth.md` to match implemented auth commands."
- "Implement compact playlist item shaping in `src/spotify/shapes.ts` and tests."

Poor subagent tasks:

- "Build Phase 1."
- "Review the whole repo."
- "Make auth work."
- "Fix all tests."

Parallelism rules:

- Run workers in parallel only when their file scopes do not overlap.
- Use explorer agents for specific codebase questions, not broad architecture ownership.
- Prefer worker agents for bounded implementation loops.
- Do not start Phase 2 worker tasks until Phase 1 token lifecycle gates pass.
- Do not let subagents perform live Spotify auth unless the manager explicitly gates that check and confirms credentials/environment are available.

Recommended loop delegation format:

```text
Loop N.M: <objective>

Ownership:
- Files/modules the worker may edit
- Files/modules the worker should read only

Task:
- Concrete implementation or documentation goal

Validation:
- Exact command to run
- Expected result

Constraints:
- No secrets in repo
- Do not touch unrelated files
- Do not revert other agents' work

Return:
- Changed files
- Tests run
- Result
- Risks or follow-ups
```

## Phase Gates

Each phase has three gates:

- Entry gate: what must be true before starting.
- Exit gate: what must be true before moving on.
- Feedback gate: what should be captured for later phases.

Do not start broad playlist or queue tooling until the auth and shared client gates pass.

## Phase 0: Repository and Plugin Skeleton

Status: underway.

Goal: make the repository structure deterministic and plugin-ready.

Entry gate:

- Existing architecture and roadmap docs are present.

Loops:

- Loop 0.1: Confirm package scripts and TypeScript settings.
- Loop 0.2: Verify or create `.codex-plugin/plugin.json`.
- Loop 0.3: Verify or create `.mcp.json` stub.
- Loop 0.4: Confirm CLI entrypoint and command-routing skeleton.
- Loop 0.5: Confirm skill directory and reference structure.
- Loop 0.6: Add or update scaffold documentation in `README.md`.
- Loop 0.7: Run scaffold validation: type-check, tests, plugin manifest validation where available.

Exit gate:

- `npm run check` passes.
- `npm test` passes.
- Plugin manifest exists and validates.
- README links to architecture, roadmap, phase plan, and research docs.
- No token or secret files exist in the repository.

Feedback gate:

- Record any missing validation tool or manifest uncertainty in a follow-up note.

## Phase 1: PKCE Auth and Token Storage

Status: underway.

Goal: let a user authenticate with Spotify using Authorization Code with PKCE and keep tokens outside the repository.

Entry gate:

- Phase 0 exit gate passes.
- `SPOTIFY_CLIENT_ID` and `SPOTIFY_REDIRECT_URI` configuration rules are documented.

Loops:

- Loop 1.1: Verify PKCE verifier and challenge generation.
- Loop 1.2: Verify OAuth state generation and callback state validation.
- Loop 1.3: Verify authorization URL construction and configured scope bundle.
- Loop 1.4: Complete local callback server behavior for code and error callbacks.
- Loop 1.5: Implement Spotify token exchange.
- Loop 1.6: Implement token refresh.
- Loop 1.7: Implement token expiry and refresh decision logic.
- Loop 1.8: Finalize token store read/write/delete behavior outside the repo.
- Loop 1.9: Wire `spotify auth login` to the browser callback flow.
- Loop 1.10: Wire `spotify auth refresh`.
- Loop 1.11: Harden `spotify auth status --json` so it reports state without token values.
- Loop 1.12: Update `skills/spotify/references/auth.md` and auth setup docs.

Exit gate:

- `spotify auth login` can complete the local browser flow for an allowlisted Spotify account.
- `spotify auth status --json` reports authentication state, expiry, scopes, and token-store path without printing secrets.
- `spotify auth refresh` updates expired or near-expired credentials.
- `spotify auth logout` removes local credentials.
- Unit tests cover non-network auth behavior.
- Manual live auth steps are documented.

Feedback gate:

- Capture real-world auth failure messages for redirect mismatch, missing tester allowlist, missing scope, and refresh failure.

## Phase 2: Shared Spotify API Client

Status: complete.

Goal: centralize Spotify Web API behavior before exposing broad CLI commands.

Entry gate:

- Phase 1 exit gate passes.
- Token refresh behavior is available as a reusable auth dependency.

Loops:

- Loop 2.1: Define client request and response contracts.
- Loop 2.2: Add bearer-token injection.
- Loop 2.3: Add refresh-before-request behavior.
- Loop 2.4: Add retry-once behavior after refreshable `401`.
- Loop 2.5: Normalize `401`, `403`, `404`, and network errors.
- Loop 2.6: Add `429` handling using `Retry-After`.
- Loop 2.7: Add pagination helpers for `limit` and `offset` endpoints.
- Loop 2.8: Add compact shape helpers for user, device, track, episode, playlist, and playback objects.
- Loop 2.9: Add mocked-response tests.

Exit gate:

- CLI commands do not duplicate token refresh, paging, retry, or Spotify error interpretation.
- Client tests cover success, refresh, rate limit, pagination, and common failure statuses.

Feedback gate:

- Record response shapes that are too large or awkward for Codex parsing.

## Phase 3: Skill-First Workflow Layer

Status: underway.

Goal: make Codex effective through a concise Spotify skill and topic references.

Entry gate:

- CLI command conventions are stable enough to document.

Loops:

- Loop 3.1: Keep `skills/spotify/SKILL.md` concise and routing-focused.
- Loop 3.2: Update auth reference to match actual CLI behavior.
- Loop 3.3: Update command reference with implemented commands only.
- Loop 3.4: Write playlist workflow reference before playlist commands are implemented.
- Loop 3.5: Write queue workflow reference with unsupported queue operations clearly stated.
- Loop 3.6: Write search ambiguity policy.
- Loop 3.7: Validate skill formatting with available local tooling.

Exit gate:

- The main skill loads quickly and routes to references.
- References distinguish implemented commands from planned commands.
- Unsupported Spotify behavior is explicitly called out.

Feedback gate:

- Record any command output that is hard for agents to parse.

## Phase 4: Account, Device, Playback, and Queue Diagnostics

Status: underway.

Goal: expose enough diagnostics to verify account, scopes, Premium status, devices, playback, and queue state.

Entry gate:

- Phase 2 client exit gate passes.

Loops:

- Loop 4.1: Implement `spotify me`.
- Loop 4.2: Implement `spotify player devices`.
- Loop 4.3: Implement `spotify player state`.
- Loop 4.4: Implement `spotify player current`.
- Loop 4.5: Implement `spotify queue get`.
- Loop 4.6: Improve Premium, no-active-device, and missing-scope messages.
- Loop 4.7: Update command reference and skill workflows.

Exit gate:

- Diagnostics work for a connected account.
- JSON output is compact and stable.
- Premium/device limitations are explained without implying user error.

Feedback gate:

- Capture real Spotify responses for account product, no active device, and empty queue cases.

## Phase 5: Playlist Reads

Status: underway.

Goal: inspect playlists and playlist items reliably before playlist mutation.

Entry gate:

- Phase 2 client and Phase 4 account diagnostics pass.

Loops:

- Loop 5.1: Implement `spotify playlists list`.
- Loop 5.2: Implement automatic pagination for all playlists.
- Loop 5.3: Implement `spotify playlist get <playlist_id>`.
- Loop 5.4: Implement `spotify playlist items <playlist_id>`.
- Loop 5.5: Add compact playlist item shape with positions.
- Loop 5.6: Add optional `fields` or response-size controls.
- Loop 5.7: Update skill guidance for large playlist inspection.

Exit gate:

- A user can list all current playlists.
- A user can inspect playlist contents without oversized default output.
- Playlist item output includes positions for later duplicate-aware edits.

Feedback gate:

- Record default response-size limits that keep Codex output usable.

## Phase 6: Playlist Writes

Status: underway.

Goal: support snapshot-aware and duplicate-aware playlist mutations.

Entry gate:

- Phase 5 playlist reads pass.
- Write safety policy is documented.

Loops:

- Loop 6.1: Implement playlist creation using current user ID.
- Loop 6.2: Implement playlist metadata updates.
- Loop 6.3: Implement batched item additions.
- Loop 6.4: Implement URI-based removals.
- Loop 6.5: Implement position-aware removals.
- Loop 6.6: Implement reorder.
- Loop 6.7: Implement replace.
- Loop 6.8: Add snapshot conflict explanations.
- Loop 6.9: Update playlist workflow docs.

Exit gate:

- Every playlist write returns the resulting `snapshot_id`.
- Duplicate removals can target explicit positions.
- Permission, stale snapshot, and missing-scope failures are explained clearly.

Feedback gate:

- Capture which write operations deserve MCP wrappers later, if any.

## Phase 7: Queue and Playback Control

Status: not started.

Goal: support queue additions and playback controls within Spotify's documented limits.

Entry gate:

- Phase 4 diagnostics pass.
- Queue limitations are documented.

Loops:

- Loop 7.1: Implement `spotify queue add <uri>`.
- Loop 7.2: Implement `spotify queue add-many <uri...>`.
- Loop 7.3: Implement partial failure reporting for multi-add.
- Loop 7.4: Implement `spotify player transfer`.
- Loop 7.5: Implement play and pause.
- Loop 7.6: Implement next and previous.
- Loop 7.7: Update queue workflow docs.

Exit gate:

- Queue additions work against an active Premium playback device.
- Multi-add reports successes and failures.
- The plugin never implies native queue reorder or removal support.

Feedback gate:

- Capture Premium and no-active-device error behavior from live checks.

## Phase 8: Search and URI Resolution

Status: not started.

Goal: make playlist and queue commands usable from natural-language music requests without surprising writes.

Entry gate:

- Phase 2 client passes.
- Write ambiguity policy is documented.

Loops:

- Loop 8.1: Implement `spotify search <query>` with type filters.
- Loop 8.2: Shape track candidates.
- Loop 8.3: Shape album and artist candidates.
- Loop 8.4: Shape playlist, show, and episode candidates where useful.
- Loop 8.5: Implement track lookup and batch track lookup.
- Loop 8.6: Implement album and artist lookup.
- Loop 8.7: Add resolver command that returns candidates by default.
- Loop 8.8: Update search and resolution skill reference.

Exit gate:

- Users can find Spotify URIs without leaving Codex.
- Ambiguous results are presented as candidates.
- Write workflows require explicit selection unless best-effort behavior is requested.

Feedback gate:

- Record common candidate fields that help users choose correctly.

## Phase 9: Optional Web Playback SDK Setup App

Status: not started.

Goal: provide a local browser diagnostics app that can become a Spotify Connect device for Premium users.

Entry gate:

- Auth is stable.
- Playback diagnostics exist.

Loops:

- Loop 9.1: Serve a local setup page.
- Loop 9.2: Show auth and account status.
- Loop 9.3: Load the Spotify Web Playback SDK.
- Loop 9.4: Initialize `Spotify.Player`.
- Loop 9.5: Display SDK `device_id`.
- Loop 9.6: Transfer playback to browser device.
- Loop 9.7: Show playback and queue diagnostics.

Exit gate:

- A Premium user can activate the browser as a Spotify Connect device.
- The app remains a developer diagnostics surface, not a full consumer app.
- Playlist tools do not depend on this app.

Feedback gate:

- Decide whether the setup app should stay optional or become part of standard auth diagnostics.

## Phase 10: Minimal MCP Wrappers

Status: not started.

Goal: expose only structured tools that are clearly better than shelling out to the CLI.

Entry gate:

- Corresponding CLI commands and shared client functions are stable.

Loops:

- Loop 10.1: Implement MCP server skeleton.
- Loop 10.2: Wrap auth status.
- Loop 10.3: Wrap current user lookup.
- Loop 10.4: Wrap device listing.
- Loop 10.5: Wrap queue get.
- Loop 10.6: Measure whether additional wrappers reduce context cost enough to justify schema growth.

Exit gate:

- MCP schemas stay small.
- MCP wrappers use the shared client.
- Broad Spotify coverage remains available through CLI plus skill workflows.

Feedback gate:

- Record which commands are frequently used enough to justify future wrappers.

## Phase 11: Hardening and Release Readiness

Status: not started.

Goal: make the plugin reliable for repeated local use and later sharing.

Entry gate:

- Core auth, diagnostics, playlist reads/writes, queue add, and search behavior pass targeted checks.

Loops:

- Loop 11.1: Create manual end-to-end verification script.
- Loop 11.2: Review and improve common error messages.
- Loop 11.3: Add response-size limits and defaults.
- Loop 11.4: Add secrets scan guidance.
- Loop 11.5: Document Spotify dashboard setup and tester allowlisting.
- Loop 11.6: Document install and update workflow.
- Loop 11.7: Validate plugin packaging.

Exit gate:

- A new developer can configure Spotify and connect an account from docs.
- Known Spotify limitations are documented in user-facing materials.
- The plugin can be installed locally without losing credentials on update.

Feedback gate:

- Identify what remains before broader sharing or Spotify extended quota review.

## Immediate Next Loops

Run these next, in order:

1. Phase 6 loop 001: implement playlist create.
2. Phase 6 loop 002: implement playlist metadata update.
3. Phase 6 loop 003: implement playlist add items with batching.
4. Phase 6 loop 004: implement URI-based remove.
5. Phase 6 loop 005: implement position-aware remove.
6. Phase 6 loop 006: implement reorder.
7. Phase 6 loop 007: implement replace.
8. Phase 6 loop 008: update playlist write references.
9. Phase 6 loop 009: run Phase 6 completion gate.

Do not start Phase 7 queue/playback control until Phase 6 playlist writes pass.

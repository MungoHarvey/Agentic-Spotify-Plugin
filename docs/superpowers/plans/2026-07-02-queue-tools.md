# Queue Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add safe queue mutation plus track search/resolve support so Codex can plan a queue list, ask for confirmation, and then add exact Spotify URIs.

**Architecture:** Keep low-level Spotify writes deterministic in the CLI, and keep taste/planning in skills. Queue writes accept only explicit Spotify track or episode URIs. Search returns candidates; resolve returns an ambiguity-aware candidate list and does not mutate.

**Tech Stack:** Node.js 24, TypeScript source run directly under NodeNext, Spotify Web API, Codex plugin skills, Node test runner.

---

## File Structure

- Modify `src/spotify/queue.ts`: add URI validation, `addToQueue`, and `addManyToQueue`.
- Create `src/spotify/search.ts`: add compact track search and resolve helpers.
- Modify `src/cli/commands/queue.ts`: add `queue add` and `queue add-many`.
- Create `src/cli/commands/search.ts`: add `search track` and `resolve track`.
- Modify `src/cli/index.ts`: route `search` and `resolve`.
- Modify `tests/spotify/queue.test.js`, `tests/spotify/search.test.js`, `tests/cli/queue.test.js`, `tests/cli/search.test.js`, and `tests/cli/help.test.js`.
- Modify `skills/spotify` references and add `skills/spotify-queue-list/SKILL.md` plus references for queue planning behavior.
- Rebuild `release/spotify-plugin` and `release/spotify-plugin-runtime`, reinstall, and run plugin evaluation.

## Task 1: Queue Add API

**Files:**
- Modify: `src/spotify/queue.ts`
- Test: `tests/spotify/queue.test.js`

- [x] **Step 1: Add failing tests**

Add tests that verify:

```js
await addToQueue(client, { uri: 'spotify:track:abc', deviceId: 'device-1' });
```

calls:

```text
me/player/queue?uri=spotify%3Atrack%3Aabc&device_id=device-1
```

and that invalid URIs throw:

```text
Queue item URI must be a Spotify track or episode URI.
```

- [x] **Step 2: Implement queue add helpers**

Add:

```ts
export type QueueAddOptions = {
  uri: string;
  deviceId?: string;
};

export async function addToQueue(client: SpotifyQueueClient, options: QueueAddOptions) {
  const uri = normalizeQueueUri(options.uri);
  const query = new URLSearchParams({ uri });
  const deviceId = options.deviceId?.trim();

  if (deviceId) {
    query.set('device_id', deviceId);
  }

  await client.request(`me/player/queue?${query.toString()}`, { method: 'POST' });

  return compactObject({ uri, deviceId });
}
```

Also add sequential `addManyToQueue`.

- [x] **Step 3: Run queue unit tests**

Run:

```powershell
node --test tests\spotify\queue.test.js
```

Expected: all queue unit tests pass.

## Task 2: Queue Add CLI

**Files:**
- Modify: `src/cli/commands/queue.ts`
- Test: `tests/cli/queue.test.js`

- [x] **Step 1: Add CLI tests**

Add coverage for:

```text
queue add spotify:track:track-1 --device-id device-1 --json
queue add-many spotify:track:track-1 spotify:episode:episode-1 --json
```

Expected JSON:

```json
{"added":[{"uri":"spotify:track:track-1","deviceId":"device-1"}],"count":1}
```

For add-many:

```json
{"added":[{"uri":"spotify:track:track-1"},{"uri":"spotify:episode:episode-1"}],"count":2}
```

- [x] **Step 2: Implement CLI parsing**

Parse `--device-id <id>` and `--json`. Require at least one URI. Reuse the existing token refresh/client construction path in `queue.ts`.

- [x] **Step 3: Run CLI queue tests**

Run:

```powershell
node --test tests\cli\queue.test.js
```

Expected: all queue CLI tests pass.

## Task 3: Search and Resolve

**Files:**
- Create: `src/spotify/search.ts`
- Create: `src/cli/commands/search.ts`
- Modify: `src/cli/index.ts`
- Test: `tests/spotify/search.test.js`
- Test: `tests/cli/search.test.js`

- [x] **Step 1: Add search unit tests**

Test that track search requests:

```text
search?q=daft%20punk&type=track&limit=10
```

and returns compact candidates with `id`, `uri`, `name`, `artistNames`, `albumName`, `durationMs`, and `popularity`.

- [x] **Step 2: Implement search helpers**

Add `searchTracks(client, { query, limit })` and `resolveTrack(client, { query, limit })`. `resolveTrack` should return:

```json
{"query":"...","ambiguous":true,"candidates":[...]}
```

unless there is exactly one candidate, in which case `ambiguous` is `false` and `selected` is present.

- [x] **Step 3: Add CLI commands**

Route:

```text
search track <query> [--limit n] --json
resolve track <query> [--limit n] --json
```

from `src/cli/index.ts`.

- [x] **Step 4: Run search tests**

Run:

```powershell
node --test tests\spotify\search.test.js tests\cli\search.test.js
```

Expected: all search tests pass.

## Task 4: Skill Behavior

**Files:**
- Modify: `skills/spotify/SKILL.md`
- Modify: `skills/spotify/references/command-reference.md`
- Modify: `skills/spotify/references/queue-workflows.md`
- Modify: `skills/spotify/references/search-and-resolution.md`
- Create: `skills/spotify-queue-list/SKILL.md`
- Create: `skills/spotify-queue-list/references/queue-list-workflow.md`

- [x] **Step 1: Add queue-list skill**

Create a skill that activates for natural-language queue building. It must:

- default to 10 songs
- ask before adding more than the confirmed list
- search candidates first
- present the proposed list
- require confirmation before queue mutation
- use `queue add-many` only with exact URIs

- [x] **Step 2: Update Spotify skill routing**

Main Spotify skill should route natural queue-list requests to `spotify-queue-list` and keep low-level command references accurate.

- [x] **Step 3: Update command docs**

Mark `queue add`, `queue add-many`, `search track`, and `resolve track` as implemented.

## Task 5: Release, Install, Evaluate

**Files:**
- Modify: `release/spotify-plugin/**`
- Modify: `release/spotify-plugin-runtime/**`

- [x] **Step 1: Run full gates**

Run:

```powershell
npm test
npm run check
```

Expected: all tests pass and TypeScript check passes.

- [x] **Step 2: Rebuild release payloads**

Copy `.codex-plugin`, `skills`, `bin`, and `src` into the two release artifacts following `docs/plugin-production-release.md`.

- [ ] **Step 3: Cachebust and install**

Cachebust completed: `release/spotify-plugin` version is `0.1.0+codex.20260702113801`.
Personal install/register was blocked by the approval system before any copy or `codex plugin add` command ran.

Run the plugin-creator cachebuster script on `release/spotify-plugin`, copy release artifacts to `%USERPROFILE%\plugins`, and run:

```powershell
codex plugin add spotify-plugin@personal --json
```

- [x] **Step 4: Evaluate**

Run:

```powershell
plugin-eval analyze release\spotify-plugin --format markdown
```

Expected: Grade A, no fail or warn checks.

## Self-Review

- Spec coverage: queue add/add-many, search/resolve, queue-list skill, release/install/eval are covered.
- Placeholder scan: no TODO/TBD placeholders.
- Type consistency: queue helpers return compact add results; search helpers return compact candidate results; CLI JSON follows those shapes.

import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

const repoRoot = new URL('../../', import.meta.url);
const cliEntry = new URL('../../src/cli/index.ts', import.meta.url).href;

function createTempTokenPath() {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'spotify-search-session-'));

  return {
    tempRoot,
    tokenPath: path.join(tempRoot, 'tokens.json'),
  };
}

function writeValidToken(tokenPath) {
  writeFileSync(
    tokenPath,
    `${JSON.stringify(
      {
        accessToken: 'valid-access',
        refreshToken: 'valid-refresh',
        expiresAt: 1700007200000,
        tokenType: 'Bearer',
        scope: ['user-read-private'],
        obtainedAt: 1699996400000,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
}

function runCli(args, fetchImplSource, env = {}, nowMs = 1700000000000) {
  const code = `
    Date.now = () => ${nowMs};
    globalThis.fetch = ${fetchImplSource};
    const { main } = await import(${JSON.stringify(cliEntry)});
    process.exitCode = await main(${JSON.stringify(args)});
  `;

  return spawnSync(process.execPath, ['--input-type=module', '--eval', code], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      ...env,
    },
  });
}

test('spotify search track --json returns compact candidates', () => {
  const { tokenPath } = createTempTokenPath();
  writeValidToken(tokenPath);

  const result = runCli(
    ['search', 'track', 'one', 'more', 'time', '--limit', '3', '--json'],
    `async (url, init) => {
      if (url === 'https://api.spotify.com/v1/search?q=one+more+time&type=track&limit=3') {
        if (!init || !init.headers || init.headers.Authorization !== 'Bearer valid-access') {
          throw new Error('Unexpected authorization header');
        }

        return {
          status: 200,
          ok: true,
          async json() {
            return {
              tracks: {
                items: [
                  {
                    id: 'track-1',
                    uri: 'spotify:track:track-1',
                    name: 'One More Time',
                    artists: [{ name: 'Daft Punk' }],
                    album: { name: 'Discovery' },
                    duration_ms: 320000,
                    popularity: 77,
                  },
                ],
              },
            };
          },
          async text() {
            return '';
          },
        };
      }

      throw new Error(\`Unexpected fetch URL: \${url}\`);
    }`,
    {
      SPOTIFY_TOKEN_PATH: tokenPath,
    },
  );

  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  assert.deepEqual(JSON.parse(result.stdout), {
    query: 'one more time',
    candidates: [
      {
        id: 'track-1',
        uri: 'spotify:track:track-1',
        name: 'One More Time',
        artistNames: ['Daft Punk'],
        albumName: 'Discovery',
        durationMs: 320000,
        popularity: 77,
      },
    ],
  });
  assert.equal(result.stdout.includes('valid-access'), false);
  assert.equal(result.stdout.includes('valid-refresh'), false);
});

test('spotify resolve track --json marks ambiguous candidates', () => {
  const { tokenPath } = createTempTokenPath();
  writeValidToken(tokenPath);

  const result = runCli(
    ['resolve', 'track', 'song', '--limit', '2', '--json'],
    `async (url) => {
      if (url === 'https://api.spotify.com/v1/search?q=song&type=track&limit=2') {
        return {
          status: 200,
          ok: true,
          async json() {
            return {
              tracks: {
                items: [
                  { id: 'track-1', uri: 'spotify:track:track-1', name: 'Song A' },
                  { id: 'track-2', uri: 'spotify:track:track-2', name: 'Song B' },
                ],
              },
            };
          },
          async text() {
            return '';
          },
        };
      }

      throw new Error(\`Unexpected fetch URL: \${url}\`);
    }`,
    {
      SPOTIFY_TOKEN_PATH: tokenPath,
    },
  );

  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  assert.deepEqual(JSON.parse(result.stdout), {
    query: 'song',
    candidates: [
      { id: 'track-1', uri: 'spotify:track:track-1', name: 'Song A' },
      { id: 'track-2', uri: 'spotify:track:track-2', name: 'Song B' },
    ],
    ambiguous: true,
  });
});

test('spotify search track requires a query', () => {
  const result = runCli(['search', 'track', '--json'], `async () => {
    throw new Error('should not fetch');
  }`);

  assert.notEqual(result.status, 0);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /Search query is required\./);
});

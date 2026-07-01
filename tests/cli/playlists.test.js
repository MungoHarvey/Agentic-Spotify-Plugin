import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

const repoRoot = new URL('../../', import.meta.url);
const cliEntry = new URL('../../src/cli/index.ts', import.meta.url).href;

function createTempTokenPath() {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'spotify-playlists-session-'));

  return {
    tempRoot,
    tokenPath: path.join(tempRoot, 'tokens.json'),
  };
}

function runCli(args, fetchImplSource, env = {}, nowMs) {
  const code = `
    ${typeof nowMs === 'number' ? `Date.now = () => ${nowMs};` : ''}
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

test('spotify playlists list --json reads a valid stored token without requiring SPOTIFY_CLIENT_ID', () => {
  const { tokenPath } = createTempTokenPath();
  writeFileSync(
    tokenPath,
    `${JSON.stringify(
      {
        accessToken: 'valid-access',
        refreshToken: 'valid-refresh',
        expiresAt: 1700007200000,
        tokenType: 'Bearer',
        scope: ['playlist-read-private'],
        obtainedAt: 1699996400000,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  const result = runCli(
    ['playlists', 'list', '--json'],
    `async (url, init) => {
      if (url === 'https://api.spotify.com/v1/me/playlists') {
        if (!init || !init.headers || init.headers.Authorization !== 'Bearer valid-access') {
          throw new Error('Unexpected authorization header');
        }

        return {
          status: 200,
          ok: true,
          async json() {
            return {
              items: [
                {
                  id: 'playlist-1',
                  uri: 'spotify:playlist:playlist-1',
                  name: 'Focus',
                  owner: { id: 'owner-1' },
                  public: true,
                  collaborative: false,
                  snapshot_id: 'snapshot-1',
                  tracks: { total: 17 },
                },
              ],
              limit: 1,
              offset: 0,
              total: 1,
              next: null,
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
    1700000000000,
  );

  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  assert.deepEqual(JSON.parse(result.stdout), {
    items: [
      {
        id: 'playlist-1',
        uri: 'spotify:playlist:playlist-1',
        name: 'Focus',
        ownerId: 'owner-1',
        public: true,
        collaborative: false,
        snapshotId: 'snapshot-1',
        trackTotal: 17,
      },
    ],
    limit: 1,
    offset: 0,
    total: 1,
  });
  assert.equal(result.stdout.includes('valid-access'), false);
  assert.equal(result.stdout.includes('valid-refresh'), false);
});

test('spotify playlists list --json refreshes expired token data before listing playlists', () => {
  const { tokenPath } = createTempTokenPath();
  writeFileSync(
    tokenPath,
    `${JSON.stringify(
      {
        accessToken: 'expired-access',
        refreshToken: 'old-refresh',
        expiresAt: 1700000001000,
        tokenType: 'Bearer',
        scope: ['playlist-read-private'],
        obtainedAt: 1699996400000,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  const result = runCli(
    ['playlists', 'list', '--json'],
    `async (url, init) => {
      if (url === 'https://accounts.spotify.com/api/token') {
        return {
          status: 200,
          ok: true,
          async json() {
            return {
              access_token: 'fresh-access',
              refresh_token: '',
              expires_in: 3600,
              token_type: 'Bearer',
              scope: 'playlist-read-private',
            };
          },
          async text() {
            return '';
          },
        };
      }

      if (url === 'https://api.spotify.com/v1/me/playlists') {
        if (!init || !init.headers || init.headers.Authorization !== 'Bearer fresh-access') {
          throw new Error('Unexpected authorization header');
        }

        return {
          status: 200,
          ok: true,
          async json() {
            return {
              items: [
                {
                  id: 'playlist-2',
                  name: 'Chill',
                  tracks: { total: 4 },
                },
              ],
              limit: 1,
              offset: 1,
              total: 2,
              next: 'https://api.spotify.com/v1/me/playlists?offset=2&limit=1',
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
      SPOTIFY_CLIENT_ID: 'client-123',
      SPOTIFY_TOKEN_PATH: tokenPath,
    },
    1700000000000,
  );

  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  assert.deepEqual(JSON.parse(result.stdout), {
    items: [
      {
        id: 'playlist-2',
        name: 'Chill',
        trackTotal: 4,
      },
    ],
    limit: 1,
    offset: 1,
    total: 2,
    next: 'https://api.spotify.com/v1/me/playlists?offset=2&limit=1',
  });

  const persistedTokenData = JSON.parse(readFileSync(tokenPath, 'utf8'));

  assert.deepEqual(persistedTokenData, {
    accessToken: 'fresh-access',
    refreshToken: 'old-refresh',
    expiresAt: 1700003600000,
    tokenType: 'Bearer',
    scope: ['playlist-read-private'],
    obtainedAt: 1700000000000,
  });
  assert.equal(result.stdout.includes('expired-access'), false);
  assert.equal(result.stdout.includes('old-refresh'), false);
  assert.equal(result.stdout.includes('fresh-access'), false);
});

test('spotify playlists list --all --json follows pagination and returns compact playlists', () => {
  const { tokenPath } = createTempTokenPath();
  writeFileSync(
    tokenPath,
    `${JSON.stringify(
      {
        accessToken: 'valid-access',
        refreshToken: 'valid-refresh',
        expiresAt: 1700007200000,
        tokenType: 'Bearer',
        scope: ['playlist-read-private'],
        obtainedAt: 1699996400000,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  const result = runCli(
    ['playlists', 'list', '--all', '--json'],
    `async (url, init) => {
      if (!init || !init.headers || init.headers.Authorization !== 'Bearer valid-access') {
        throw new Error('Unexpected authorization header');
      }

      if (url === 'https://api.spotify.com/v1/me/playlists') {
        return {
          status: 200,
          ok: true,
          async json() {
            return {
              items: [
                {
                  id: 'playlist-1',
                  name: 'Focus',
                  tracks: { total: 17 },
                },
              ],
              next: 'https://api.spotify.com/v1/me/playlists?offset=1&limit=1',
            };
          },
          async text() {
            return '';
          },
        };
      }

      if (url === 'https://api.spotify.com/v1/me/playlists?offset=1&limit=1') {
        return {
          status: 200,
          ok: true,
          async json() {
            return {
              items: [
                {
                  id: 'playlist-2',
                  name: 'Chill',
                  tracks: { total: 4 },
                },
              ],
              next: null,
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
    1700000000000,
  );

  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  assert.deepEqual(JSON.parse(result.stdout), {
    items: [
      {
        id: 'playlist-1',
        name: 'Focus',
        trackTotal: 17,
      },
      {
        id: 'playlist-2',
        name: 'Chill',
        trackTotal: 4,
      },
    ],
  });
  assert.equal(result.stdout.includes('valid-access'), false);
});

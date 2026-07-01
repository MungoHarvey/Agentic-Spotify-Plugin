import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

const repoRoot = new URL('../../', import.meta.url);
const cliEntry = new URL('../../src/cli/index.ts', import.meta.url).href;

function createTempTokenPath() {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'spotify-player-session-'));

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

test('spotify player devices --json reads a valid stored token without requiring SPOTIFY_CLIENT_ID', () => {
  const { tokenPath } = createTempTokenPath();
  writeFileSync(
    tokenPath,
    `${JSON.stringify(
      {
        accessToken: 'valid-access',
        refreshToken: 'valid-refresh',
        expiresAt: 1700007200000,
        tokenType: 'Bearer',
        scope: ['user-read-playback-state'],
        obtainedAt: 1699996400000,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  const result = runCli(
    ['player', 'devices', '--json'],
    `async (url) => {
      if (url === 'https://api.spotify.com/v1/me/player/devices') {
        return {
          status: 200,
          ok: true,
          async json() {
            return {
              devices: [
                {
                  id: 'device-1',
                  name: 'Desk Speaker',
                  type: 'speaker',
                  is_active: true,
                  is_restricted: false,
                  volume_percent: 42,
                },
              ],
            };
          },
          async text() {
            return JSON.stringify({
              devices: [
                {
                  id: 'device-1',
                  name: 'Desk Speaker',
                  type: 'speaker',
                  is_active: true,
                  is_restricted: false,
                  volume_percent: 42,
                },
              ],
            });
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
    devices: [
      {
        id: 'device-1',
        name: 'Desk Speaker',
        type: 'speaker',
        isActive: true,
        isRestricted: false,
        volumePercent: 42,
      },
    ],
  });
  assert.equal(result.stdout.includes('valid-access'), false);
  assert.equal(result.stdout.includes('valid-refresh'), false);
});

test('spotify player devices --json refreshes expired token data before listing devices', () => {
  const { tokenPath } = createTempTokenPath();
  writeFileSync(
    tokenPath,
    `${JSON.stringify(
      {
        accessToken: 'expired-access',
        refreshToken: 'old-refresh',
        expiresAt: 1700000001000,
        tokenType: 'Bearer',
        scope: ['user-read-playback-state'],
        obtainedAt: 1699996400000,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  const result = runCli(
    ['player', 'devices', '--json'],
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
              scope: 'user-read-playback-state',
            };
          },
          async text() {
            return '';
          },
        };
      }

      if (url === 'https://api.spotify.com/v1/me/player/devices') {
        if (!init || !init.headers || init.headers.Authorization !== 'Bearer fresh-access') {
          throw new Error('Unexpected authorization header');
        }

        return {
          status: 200,
          ok: true,
          async json() {
            return {
              devices: [
                {
                  id: 'device-2',
                  name: 'Phone',
                  type: 'smartphone',
                  is_active: false,
                },
              ],
            };
          },
          async text() {
            return JSON.stringify({
              devices: [
                {
                  id: 'device-2',
                  name: 'Phone',
                  type: 'smartphone',
                  is_active: false,
                },
              ],
            });
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
    devices: [
      {
        id: 'device-2',
        name: 'Phone',
        type: 'smartphone',
        isActive: false,
      },
    ],
  });

  const persistedTokenData = JSON.parse(readFileSync(tokenPath, 'utf8'));

  assert.deepEqual(persistedTokenData, {
    accessToken: 'fresh-access',
    refreshToken: 'old-refresh',
    expiresAt: 1700003600000,
    tokenType: 'Bearer',
    scope: ['user-read-playback-state'],
    obtainedAt: 1700000000000,
  });
  assert.equal(result.stdout.includes('expired-access'), false);
  assert.equal(result.stdout.includes('old-refresh'), false);
  assert.equal(result.stdout.includes('fresh-access'), false);
});

test('spotify player state --json returns compact playback state', () => {
  const { tokenPath } = createTempTokenPath();
  writeFileSync(
    tokenPath,
    `${JSON.stringify(
      {
        accessToken: 'valid-access',
        refreshToken: 'valid-refresh',
        expiresAt: 1700007200000,
        tokenType: 'Bearer',
        scope: ['user-read-playback-state'],
        obtainedAt: 1699996400000,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  const result = runCli(
    ['player', 'state', '--json'],
    `async (url, init) => {
      if (url === 'https://api.spotify.com/v1/me/player') {
        if (!init || !init.headers || init.headers.Authorization !== 'Bearer valid-access') {
          throw new Error('Unexpected authorization header');
        }

        return {
          status: 200,
          ok: true,
          async json() {
            return {
              is_playing: true,
              progress_ms: 1234,
              device: {
                id: 'device-1',
                name: 'Desktop',
                type: 'computer',
                is_active: true,
              },
              item: {
                type: 'track',
                id: 'track-1',
                uri: 'spotify:track:track-1',
                name: 'Song',
                artists: [{ name: 'Artist A' }],
                album: { name: 'Album' },
              },
              context: {
                uri: 'spotify:playlist:playlist-1',
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
    1700000000000,
  );

  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  assert.deepEqual(JSON.parse(result.stdout), {
    active: true,
    isPlaying: true,
    progressMs: 1234,
    device: {
      id: 'device-1',
      name: 'Desktop',
      type: 'computer',
      isActive: true,
    },
    item: {
      type: 'track',
      id: 'track-1',
      uri: 'spotify:track:track-1',
      name: 'Song',
      artistNames: ['Artist A'],
      albumName: 'Album',
    },
    contextUri: 'spotify:playlist:playlist-1',
  });
  assert.equal(result.stdout.includes('valid-access'), false);
});

test('spotify player current --json returns a no-current marker for 204 responses', () => {
  const { tokenPath } = createTempTokenPath();
  writeFileSync(
    tokenPath,
    `${JSON.stringify(
      {
        accessToken: 'valid-access',
        refreshToken: 'valid-refresh',
        expiresAt: 1700007200000,
        tokenType: 'Bearer',
        scope: ['user-read-currently-playing'],
        obtainedAt: 1699996400000,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  const result = runCli(
    ['player', 'current', '--json'],
    `async (url) => {
      if (url === 'https://api.spotify.com/v1/me/player/currently-playing') {
        return {
          status: 204,
          ok: true,
          async json() {
            return null;
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
    current: false,
  });
});

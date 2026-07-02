import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

const repoRoot = new URL('../../', import.meta.url);
const cliEntry = new URL('../../src/cli/index.ts', import.meta.url).href;

function createTempTokenPath() {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'spotify-queue-session-'));

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

test('spotify queue get --json reads a valid stored token without requiring SPOTIFY_CLIENT_ID', () => {
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
    ['queue', 'get', '--json'],
    `async (url, init) => {
      if (url === 'https://api.spotify.com/v1/me/player/queue') {
        if (!init || !init.headers || init.headers.Authorization !== 'Bearer valid-access') {
          throw new Error('Unexpected authorization header');
        }

        return {
          status: 200,
          ok: true,
          async json() {
            return {
              currently_playing: {
                type: 'track',
                id: 'track-1',
                uri: 'spotify:track:track-1',
                name: 'Song',
                artists: [{ name: 'Artist A' }],
                album: { name: 'Album' },
              },
              queue: [
                {
                  type: 'episode',
                  id: 'episode-1',
                  uri: 'spotify:episode:episode-1',
                  name: 'Episode',
                  show: { name: 'Show' },
                },
              ],
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
    currentlyPlaying: {
      type: 'track',
      id: 'track-1',
      uri: 'spotify:track:track-1',
      name: 'Song',
      artistNames: ['Artist A'],
      albumName: 'Album',
    },
    queue: [
      {
        type: 'episode',
        id: 'episode-1',
        uri: 'spotify:episode:episode-1',
        name: 'Episode',
        showName: 'Show',
      },
    ],
  });
  assert.equal(result.stdout.includes('valid-access'), false);
  assert.equal(result.stdout.includes('valid-refresh'), false);
});

test('spotify queue get --json refreshes expired token data before reading the queue', () => {
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
    ['queue', 'get', '--json'],
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

      if (url === 'https://api.spotify.com/v1/me/player/queue') {
        if (!init || !init.headers || init.headers.Authorization !== 'Bearer fresh-access') {
          throw new Error('Unexpected authorization header');
        }

        return {
          status: 200,
          ok: true,
          async json() {
            return {
              currently_playing: null,
              queue: [],
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
    currentlyPlaying: null,
    queue: [],
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

test('spotify queue add --json posts a queue item with an optional device id', () => {
  const { tokenPath } = createTempTokenPath();
  writeFileSync(
    tokenPath,
    `${JSON.stringify(
      {
        accessToken: 'valid-access',
        refreshToken: 'valid-refresh',
        expiresAt: 1700007200000,
        tokenType: 'Bearer',
        scope: ['user-modify-playback-state'],
        obtainedAt: 1699996400000,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  const result = runCli(
    ['queue', 'add', 'spotify:track:track-1', '--device-id', 'device-1', '--json'],
    `async (url, init) => {
      if (url === 'https://api.spotify.com/v1/me/player/queue?uri=spotify%3Atrack%3Atrack-1&device_id=device-1') {
        if (!init || init.method !== 'POST' || !init.headers || init.headers.Authorization !== 'Bearer valid-access') {
          throw new Error('Unexpected queue add request');
        }

        return {
          status: 204,
          ok: true,
          async json() {
            throw new Error('should not read json');
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
    added: [
      {
        uri: 'spotify:track:track-1',
        deviceId: 'device-1',
      },
    ],
    count: 1,
  });
  assert.equal(result.stdout.includes('valid-access'), false);
  assert.equal(result.stdout.includes('valid-refresh'), false);
});

test('spotify queue add-many --json posts queue items sequentially', () => {
  const { tokenPath } = createTempTokenPath();
  const calls = [];
  writeFileSync(
    tokenPath,
    `${JSON.stringify(
      {
        accessToken: 'valid-access',
        refreshToken: 'valid-refresh',
        expiresAt: 1700007200000,
        tokenType: 'Bearer',
        scope: ['user-modify-playback-state'],
        obtainedAt: 1699996400000,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  const result = runCli(
    ['queue', 'add-many', 'spotify:track:track-1', 'spotify:episode:episode-1', '--json'],
    `async (url, init) => {
      if (!init || init.method !== 'POST' || !init.headers || init.headers.Authorization !== 'Bearer valid-access') {
        throw new Error('Unexpected queue add-many request');
      }

      globalThis.__queueCalls = globalThis.__queueCalls || [];
      globalThis.__queueCalls.push(url);

      if (
        url === 'https://api.spotify.com/v1/me/player/queue?uri=spotify%3Atrack%3Atrack-1' ||
        url === 'https://api.spotify.com/v1/me/player/queue?uri=spotify%3Aepisode%3Aepisode-1'
      ) {
        return {
          status: 204,
          ok: true,
          async json() {
            throw new Error('should not read json');
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
    added: [
      { uri: 'spotify:track:track-1' },
      { uri: 'spotify:episode:episode-1' },
    ],
    count: 2,
  });
  assert.deepEqual(calls, []);
});

test('spotify queue add requires a queue item URI', () => {
  const result = runCli(['queue', 'add', '--json'], `async () => {
    throw new Error('should not fetch');
  }`);

  assert.notEqual(result.status, 0);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /Queue add requires a Spotify track or episode URI\./);
});

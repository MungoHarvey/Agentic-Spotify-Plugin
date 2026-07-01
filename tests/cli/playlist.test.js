import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

const repoRoot = new URL('../../', import.meta.url);
const cliEntry = new URL('../../src/cli/index.ts', import.meta.url).href;

function createTempTokenPath() {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'spotify-playlist-session-'));

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

test('spotify playlist get --json reads a valid stored token without requiring SPOTIFY_CLIENT_ID', () => {
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
    ['playlist', 'get', 'playlist-1', '--json'],
    `async (url, init) => {
      if (url === 'https://api.spotify.com/v1/playlists/playlist-1') {
        if (!init || !init.headers || init.headers.Authorization !== 'Bearer valid-access') {
          throw new Error('Unexpected authorization header');
        }

        return {
          status: 200,
          ok: true,
          async json() {
            return {
              id: 'playlist-1',
              uri: 'spotify:playlist:playlist-1',
              name: 'Focus',
              owner: { id: 'owner-1' },
              public: true,
              collaborative: false,
              snapshot_id: 'snapshot-1',
              tracks: { total: 17 },
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
    id: 'playlist-1',
    uri: 'spotify:playlist:playlist-1',
    name: 'Focus',
    ownerId: 'owner-1',
    public: true,
    collaborative: false,
    snapshotId: 'snapshot-1',
    trackTotal: 17,
  });
  assert.equal(result.stdout.includes('valid-access'), false);
  assert.equal(result.stdout.includes('valid-refresh'), false);
});

test('spotify playlist get --json refreshes expired token data before reading the playlist', () => {
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
    ['playlist', 'get', 'playlist-2', '--json'],
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

      if (url === 'https://api.spotify.com/v1/playlists/playlist-2') {
        if (!init || !init.headers || init.headers.Authorization !== 'Bearer fresh-access') {
          throw new Error('Unexpected authorization header');
        }

        return {
          status: 200,
          ok: true,
          async json() {
            return {
              id: 'playlist-2',
              name: 'Chill',
              tracks: { total: 4 },
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
    id: 'playlist-2',
    name: 'Chill',
    trackTotal: 4,
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

test('spotify playlist items --json returns compact positioned items', () => {
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
    ['playlist', 'items', 'playlist-1', '--json'],
    `async (url, init) => {
      if (url === 'https://api.spotify.com/v1/playlists/playlist-1/tracks') {
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
                  added_at: '2026-01-01T00:00:00Z',
                  added_by: { id: 'user-1' },
                  is_local: false,
                  track: {
                    type: 'track',
                    id: 'track-1',
                    uri: 'spotify:track:track-1',
                    name: 'Song',
                    artists: [{ name: 'Artist A' }],
                    album: { name: 'Album' },
                  },
                },
              ],
              limit: 1,
              offset: 2,
              total: 3,
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
        position: 2,
        addedAt: '2026-01-01T00:00:00Z',
        addedById: 'user-1',
        isLocal: false,
        item: {
          type: 'track',
          id: 'track-1',
          uri: 'spotify:track:track-1',
          name: 'Song',
          artistNames: ['Artist A'],
          albumName: 'Album',
        },
      },
    ],
    limit: 1,
    offset: 2,
    total: 3,
  });
  assert.equal(result.stdout.includes('valid-access'), false);
  assert.equal(result.stdout.includes('valid-refresh'), false);
});

test('spotify playlist create --json posts playlist metadata for the current user and returns compact playlist data', () => {
  const { tokenPath } = createTempTokenPath();
  writeFileSync(
    tokenPath,
    `${JSON.stringify(
      {
        accessToken: 'valid-access',
        refreshToken: 'valid-refresh',
        expiresAt: 1700007200000,
        tokenType: 'Bearer',
        scope: ['playlist-modify-private'],
        obtainedAt: 1699996400000,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  const result = runCli(
    ['playlist', 'create', 'Focus', '--description', 'Morning session', '--private', '--collaborative', '--json'],
    `async (url, init) => {
      if (url === 'https://api.spotify.com/v1/me') {
        if (!init || !init.headers || init.headers.Authorization !== 'Bearer valid-access') {
          throw new Error('Unexpected authorization header');
        }

        return {
          status: 200,
          ok: true,
          async json() {
            return {
              id: 'user-1',
            };
          },
          async text() {
            return '';
          },
        };
      }

      if (url === 'https://api.spotify.com/v1/users/user-1/playlists') {
        if (!init || !init.headers || init.headers.Authorization !== 'Bearer valid-access') {
          throw new Error('Unexpected authorization header');
        }

        if (init.method !== 'POST') {
          throw new Error(\`Unexpected method: \${init.method}\`);
        }

        if (init.headers['Content-Type'] !== 'application/json') {
          throw new Error('Unexpected content type');
        }

        if (init.body !== JSON.stringify({
          name: 'Focus',
          description: 'Morning session',
          public: false,
          collaborative: true,
        })) {
          throw new Error(\`Unexpected body: \${init.body}\`);
        }

        return {
          status: 200,
          ok: true,
          async json() {
            return {
              id: 'playlist-1',
              uri: 'spotify:playlist:playlist-1',
              name: 'Focus',
              owner: { id: 'user-1' },
              public: false,
              collaborative: true,
              snapshot_id: 'snapshot-1',
              tracks: { total: 0 },
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
    id: 'playlist-1',
    uri: 'spotify:playlist:playlist-1',
    name: 'Focus',
    ownerId: 'user-1',
    public: false,
    collaborative: true,
    snapshotId: 'snapshot-1',
    trackTotal: 0,
  });
  assert.equal(result.stdout.includes('valid-access'), false);
  assert.equal(result.stdout.includes('valid-refresh'), false);
});

test('spotify playlist update --json puts playlist metadata and returns an auditable result', () => {
  const { tokenPath } = createTempTokenPath();
  writeFileSync(
    tokenPath,
    `${JSON.stringify(
      {
        accessToken: 'valid-access',
        refreshToken: 'valid-refresh',
        expiresAt: 1700007200000,
        tokenType: 'Bearer',
        scope: ['playlist-modify-private'],
        obtainedAt: 1699996400000,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  const result = runCli(
    ['playlist', 'update', 'playlist-1', '--name', 'Focus', '--description', 'Morning session', '--private', '--collaborative', '--json'],
    `async (url, init) => {
      if (url === 'https://api.spotify.com/v1/playlists/playlist-1') {
        if (!init || !init.headers || init.headers.Authorization !== 'Bearer valid-access') {
          throw new Error('Unexpected authorization header');
        }

        if (init.method !== 'PUT') {
          throw new Error(\`Unexpected method: \${init.method}\`);
        }

        if (init.headers['Content-Type'] !== 'application/json') {
          throw new Error('Unexpected content type');
        }

        if (init.body !== JSON.stringify({
          name: 'Focus',
          description: 'Morning session',
          public: false,
          collaborative: true,
        })) {
          throw new Error(\`Unexpected body: \${init.body}\`);
        }

        return {
          status: 200,
          ok: true,
          async json() {
            return {
              id: 'playlist-1',
              name: 'Focus',
              description: 'Morning session',
              public: false,
              collaborative: true,
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
    playlistId: 'playlist-1',
    updated: true,
    fields: ['name', 'description', 'public', 'collaborative'],
  });
  assert.equal(result.stdout.includes('valid-access'), false);
  assert.equal(result.stdout.includes('valid-refresh'), false);
});

test('spotify playlist update requires at least one metadata field', () => {
  const { tokenPath } = createTempTokenPath();
  writeFileSync(
    tokenPath,
    `${JSON.stringify(
      {
        accessToken: 'valid-access',
        refreshToken: 'valid-refresh',
        expiresAt: 1700007200000,
        tokenType: 'Bearer',
        scope: ['playlist-modify-private'],
        obtainedAt: 1699996400000,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  const result = runCli(
    ['playlist', 'update', 'playlist-1', '--json'],
    `async () => {
      throw new Error('Unexpected fetch call');
    }`,
    {
      SPOTIFY_TOKEN_PATH: tokenPath,
    },
    1700000000000,
  );

  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, 'At least one playlist metadata field is required to update.\n');
});

test('spotify playlist add --json posts playlist items in bounded batches and returns an auditable result', () => {
  const { tokenPath } = createTempTokenPath();
  writeFileSync(
    tokenPath,
    `${JSON.stringify(
      {
        accessToken: 'valid-access',
        refreshToken: 'valid-refresh',
        expiresAt: 1700007200000,
        tokenType: 'Bearer',
        scope: ['playlist-modify-private'],
        obtainedAt: 1699996400000,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  const uris = Array.from({ length: 101 }, (_, index) => `spotify:track:track-${index + 1}`);

  const result = runCli(
    ['playlist', 'add', 'playlist-1', ...uris, '--json'],
    `async (url, init) => {
      if (url === 'https://api.spotify.com/v1/playlists/playlist-1/tracks') {
        if (!init || !init.headers || init.headers.Authorization !== 'Bearer valid-access') {
          throw new Error('Unexpected authorization header');
        }

        if (init.method !== 'POST') {
          throw new Error(\`Unexpected method: \${init.method}\`);
        }

        if (init.headers['Content-Type'] !== 'application/json') {
          throw new Error('Unexpected content type');
        }

        const parsedBody = JSON.parse(init.body);

        if (parsedBody.uris.length === 100) {
          if (parsedBody.uris[0] !== 'spotify:track:track-1' || parsedBody.uris[99] !== 'spotify:track:track-100') {
            throw new Error('Unexpected first batch contents');
          }

          return {
            status: 200,
            ok: true,
            async json() {
              return {
                snapshot_id: 'snapshot-1',
              };
            },
            async text() {
              return '';
            },
          };
        }

        if (parsedBody.uris.length === 1) {
          if (parsedBody.uris[0] !== 'spotify:track:track-101') {
            throw new Error('Unexpected second batch contents');
          }

          return {
            status: 200,
            ok: true,
            async json() {
              return {
                snapshot_id: 'snapshot-2',
              };
            },
            async text() {
              return '';
            },
          };
        }

        throw new Error(\`Unexpected batch size: \${parsedBody.uris.length}\`);
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
    playlistId: 'playlist-1',
    added: 101,
    batches: [100, 1],
    snapshotId: 'snapshot-2',
  });
  assert.equal(result.stdout.includes('valid-access'), false);
  assert.equal(result.stdout.includes('valid-refresh'), false);
});

test('spotify playlist add requires at least one URI', () => {
  const { tokenPath } = createTempTokenPath();
  writeFileSync(
    tokenPath,
    `${JSON.stringify(
      {
        accessToken: 'valid-access',
        refreshToken: 'valid-refresh',
        expiresAt: 1700007200000,
        tokenType: 'Bearer',
        scope: ['playlist-modify-private'],
        obtainedAt: 1699996400000,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  const result = runCli(
    ['playlist', 'add', 'playlist-1', '--json'],
    `async () => {
      throw new Error('Unexpected fetch call');
    }`,
    {
      SPOTIFY_TOKEN_PATH: tokenPath,
    },
    1700000000000,
  );

  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, 'At least one Spotify URI is required.\n');
});

test('spotify playlist replace --json puts the first batch, posts remaining batches, and returns an auditable result', () => {
  const { tokenPath } = createTempTokenPath();
  writeFileSync(
    tokenPath,
    `${JSON.stringify(
      {
        accessToken: 'valid-access',
        refreshToken: 'valid-refresh',
        expiresAt: 1700007200000,
        tokenType: 'Bearer',
        scope: ['playlist-modify-private'],
        obtainedAt: 1699996400000,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  const uris = Array.from({ length: 101 }, (_, index) => `spotify:track:track-${index + 1}`);

  const result = runCli(
    ['playlist', 'replace', 'playlist-1', ...uris, '--json'],
    `(() => {
      let requestCount = 0;

      return async (url, init) => {
        if (url === 'https://api.spotify.com/v1/playlists/playlist-1/tracks') {
          requestCount += 1;

          if (!init || !init.headers || init.headers.Authorization !== 'Bearer valid-access') {
            throw new Error('Unexpected authorization header');
          }

          if (init.headers['Content-Type'] !== 'application/json') {
            throw new Error('Unexpected content type');
          }

          const parsedBody = JSON.parse(init.body);

          if (requestCount === 1) {
            if (init.method !== 'PUT') {
              throw new Error(\`Unexpected first method: \${init.method}\`);
            }

            if (parsedBody.uris.length !== 100 || parsedBody.uris[0] !== 'spotify:track:track-1' || parsedBody.uris[99] !== 'spotify:track:track-100') {
              throw new Error('Unexpected first replace batch contents');
            }

            return {
              status: 200,
              ok: true,
              async json() {
                return {
                  snapshot_id: 'snapshot-1',
                };
              },
              async text() {
                return '';
              },
            };
          }

          if (requestCount === 2) {
            if (init.method !== 'POST') {
              throw new Error(\`Unexpected second method: \${init.method}\`);
            }

            if (parsedBody.uris.length !== 1 || parsedBody.uris[0] !== 'spotify:track:track-101') {
              throw new Error('Unexpected second replace batch contents');
            }

            return {
              status: 200,
              ok: true,
              async json() {
                return {
                  snapshot_id: 'snapshot-2',
                };
              },
              async text() {
                return '';
              },
            };
          }

          throw new Error(\`Unexpected request count: \${requestCount}\`);
        }

        throw new Error(\`Unexpected fetch URL: \${url}\`);
      };
    })()`,
    {
      SPOTIFY_TOKEN_PATH: tokenPath,
    },
    1700000000000,
  );

  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  assert.deepEqual(JSON.parse(result.stdout), {
    playlistId: 'playlist-1',
    replaced: 101,
    batches: [100, 1],
    snapshotId: 'snapshot-2',
  });
  assert.equal(result.stdout.includes('valid-access'), false);
  assert.equal(result.stdout.includes('valid-refresh'), false);
});

test('spotify playlist replace requires at least one URI', () => {
  const { tokenPath } = createTempTokenPath();
  writeFileSync(
    tokenPath,
    `${JSON.stringify(
      {
        accessToken: 'valid-access',
        refreshToken: 'valid-refresh',
        expiresAt: 1700007200000,
        tokenType: 'Bearer',
        scope: ['playlist-modify-private'],
        obtainedAt: 1699996400000,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  const result = runCli(
    ['playlist', 'replace', 'playlist-1', '--json'],
    `async () => {
      throw new Error('Unexpected fetch call');
    }`,
    {
      SPOTIFY_TOKEN_PATH: tokenPath,
    },
    1700000000000,
  );

  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, 'At least one Spotify URI is required.\n');
});

test('spotify playlist remove --json deletes playlist items and returns an auditable result', () => {
  const { tokenPath } = createTempTokenPath();
  writeFileSync(
    tokenPath,
    `${JSON.stringify(
      {
        accessToken: 'valid-access',
        refreshToken: 'valid-refresh',
        expiresAt: 1700007200000,
        tokenType: 'Bearer',
        scope: ['playlist-modify-private'],
        obtainedAt: 1699996400000,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  const uris = ['spotify:track:track-1', 'spotify:track:track-2'];

  const result = runCli(
    ['playlist', 'remove', 'playlist-1', ...uris, '--snapshot-id', 'snapshot-previous', '--json'],
    `async (url, init) => {
      if (url === 'https://api.spotify.com/v1/playlists/playlist-1/tracks') {
        if (!init || !init.headers || init.headers.Authorization !== 'Bearer valid-access') {
          throw new Error('Unexpected authorization header');
        }

        if (init.method !== 'DELETE') {
          throw new Error(\`Unexpected method: \${init.method}\`);
        }

        if (init.headers['Content-Type'] !== 'application/json') {
          throw new Error('Unexpected content type');
        }

        if (init.body !== JSON.stringify({
          tracks: [
            { uri: 'spotify:track:track-1' },
            { uri: 'spotify:track:track-2' },
          ],
          snapshot_id: 'snapshot-previous',
        })) {
          throw new Error(\`Unexpected body: \${init.body}\`);
        }

        return {
          status: 200,
          ok: true,
          async json() {
            return {
              snapshot_id: 'snapshot-removed',
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
    playlistId: 'playlist-1',
    removed: 2,
    snapshotId: 'snapshot-removed',
  });
  assert.equal(result.stdout.includes('valid-access'), false);
  assert.equal(result.stdout.includes('valid-refresh'), false);
});

test('spotify playlist remove-positions --json reads playlist items before deleting duplicate-aware positions and returns an auditable result', () => {
  const { tokenPath } = createTempTokenPath();
  writeFileSync(
    tokenPath,
    `${JSON.stringify(
      {
        accessToken: 'valid-access',
        refreshToken: 'valid-refresh',
        expiresAt: 1700007200000,
        tokenType: 'Bearer',
        scope: ['playlist-modify-private'],
        obtainedAt: 1699996400000,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  const result = runCli(
    ['playlist', 'remove-positions', 'playlist-1', '0', '2', '--snapshot-id', 'snapshot-previous', '--json'],
    `async (url, init) => {
      if (url === 'https://api.spotify.com/v1/playlists/playlist-1/tracks?limit=100&offset=0') {
        if (!init || !init.headers || init.headers.Authorization !== 'Bearer valid-access') {
          throw new Error('Unexpected authorization header');
        }

        if (init.method !== 'GET') {
          throw new Error(\`Unexpected method: \${init.method}\`);
        }

        return {
          status: 200,
          ok: true,
          async json() {
            return {
              items: [
                {
                  track: {
                    type: 'track',
                    id: 'track-1',
                    uri: 'spotify:track:track-1',
                    name: 'Song 1',
                  },
                },
                {
                  track: {
                    type: 'track',
                    id: 'track-2',
                    uri: 'spotify:track:track-2',
                    name: 'Song 2',
                  },
                },
                {
                  track: {
                    type: 'track',
                    id: 'track-1',
                    uri: 'spotify:track:track-1',
                    name: 'Song 1',
                  },
                },
              ],
              offset: 0,
              limit: 100,
              total: 3,
            };
          },
          async text() {
            return '';
          },
        };
      }

      if (url === 'https://api.spotify.com/v1/playlists/playlist-1/tracks') {
        if (!init || !init.headers || init.headers.Authorization !== 'Bearer valid-access') {
          throw new Error('Unexpected authorization header');
        }

        if (init.method !== 'DELETE') {
          throw new Error(\`Unexpected method: \${init.method}\`);
        }

        if (init.headers['Content-Type'] !== 'application/json') {
          throw new Error('Unexpected content type');
        }

        if (init.body !== JSON.stringify({
          tracks: [
            {
              uri: 'spotify:track:track-1',
              positions: [0, 2],
            },
          ],
          snapshot_id: 'snapshot-previous',
        })) {
          throw new Error(\`Unexpected body: \${init.body}\`);
        }

        return {
          status: 200,
          ok: true,
          async json() {
            return {
              snapshot_id: 'snapshot-removed',
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
    playlistId: 'playlist-1',
    removedPositions: [0, 2],
    snapshotId: 'snapshot-removed',
  });
  assert.equal(result.stdout.includes('valid-access'), false);
  assert.equal(result.stdout.includes('valid-refresh'), false);
});

test('spotify playlist reorder --json puts reorder instructions and returns an auditable result', () => {
  const { tokenPath } = createTempTokenPath();
  writeFileSync(
    tokenPath,
    `${JSON.stringify(
      {
        accessToken: 'valid-access',
        refreshToken: 'valid-refresh',
        expiresAt: 1700007200000,
        tokenType: 'Bearer',
        scope: ['playlist-modify-private'],
        obtainedAt: 1699996400000,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  const result = runCli(
    ['playlist', 'reorder', 'playlist-1', '--range-start', '2', '--insert-before', '5', '--range-length', '3', '--snapshot-id', 'snapshot-previous', '--json'],
    `async (url, init) => {
      if (url === 'https://api.spotify.com/v1/playlists/playlist-1/tracks') {
        if (!init || !init.headers || init.headers.Authorization !== 'Bearer valid-access') {
          throw new Error('Unexpected authorization header');
        }

        if (init.method !== 'PUT') {
          throw new Error(\`Unexpected method: \${init.method}\`);
        }

        if (init.headers['Content-Type'] !== 'application/json') {
          throw new Error('Unexpected content type');
        }

        if (init.body !== JSON.stringify({
          range_start: 2,
          insert_before: 5,
          range_length: 3,
          snapshot_id: 'snapshot-previous',
        })) {
          throw new Error(\`Unexpected body: \${init.body}\`);
        }

        return {
          status: 200,
          ok: true,
          async json() {
            return {
              snapshot_id: 'snapshot-reordered',
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
    playlistId: 'playlist-1',
    rangeStart: 2,
    insertBefore: 5,
    rangeLength: 3,
    snapshotId: 'snapshot-reordered',
  });
  assert.equal(result.stdout.includes('valid-access'), false);
  assert.equal(result.stdout.includes('valid-refresh'), false);
});

test('spotify playlist reorder requires range start and insert-before values', () => {
  const { tokenPath } = createTempTokenPath();
  writeFileSync(
    tokenPath,
    `${JSON.stringify(
      {
        accessToken: 'valid-access',
        refreshToken: 'valid-refresh',
        expiresAt: 1700007200000,
        tokenType: 'Bearer',
        scope: ['playlist-modify-private'],
        obtainedAt: 1699996400000,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  const missingRangeStart = runCli(
    ['playlist', 'reorder', 'playlist-1', '--insert-before', '5', '--json'],
    `async () => {
      throw new Error('Unexpected fetch call');
    }`,
    {
      SPOTIFY_TOKEN_PATH: tokenPath,
    },
    1700000000000,
  );

  assert.equal(missingRangeStart.status, 1);
  assert.equal(missingRangeStart.stdout, '');
  assert.equal(missingRangeStart.stderr, 'A range start is required.\n');

  const missingInsertBefore = runCli(
    ['playlist', 'reorder', 'playlist-1', '--range-start', '2', '--json'],
    `async () => {
      throw new Error('Unexpected fetch call');
    }`,
    {
      SPOTIFY_TOKEN_PATH: tokenPath,
    },
    1700000000000,
  );

  assert.equal(missingInsertBefore.status, 1);
  assert.equal(missingInsertBefore.stdout, '');
  assert.equal(missingInsertBefore.stderr, 'An insert-before value is required.\n');
});

test('spotify playlist remove-positions requires a snapshot ID', () => {
  const { tokenPath } = createTempTokenPath();
  writeFileSync(
    tokenPath,
    `${JSON.stringify(
      {
        accessToken: 'valid-access',
        refreshToken: 'valid-refresh',
        expiresAt: 1700007200000,
        tokenType: 'Bearer',
        scope: ['playlist-modify-private'],
        obtainedAt: 1699996400000,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  const result = runCli(
    ['playlist', 'remove-positions', 'playlist-1', '0', '--json'],
    `async () => {
      throw new Error('Unexpected fetch call');
    }`,
    {
      SPOTIFY_TOKEN_PATH: tokenPath,
    },
    1700000000000,
  );

  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, 'A snapshot ID is required.\n');
});

test('spotify playlist remove requires at least one URI', () => {
  const { tokenPath } = createTempTokenPath();
  writeFileSync(
    tokenPath,
    `${JSON.stringify(
      {
        accessToken: 'valid-access',
        refreshToken: 'valid-refresh',
        expiresAt: 1700007200000,
        tokenType: 'Bearer',
        scope: ['playlist-modify-private'],
        obtainedAt: 1699996400000,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  const result = runCli(
    ['playlist', 'remove', 'playlist-1', '--json'],
    `async () => {
      throw new Error('Unexpected fetch call');
    }`,
    {
      SPOTIFY_TOKEN_PATH: tokenPath,
    },
    1700000000000,
  );

  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, 'At least one Spotify URI is required.\n');
});

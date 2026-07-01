import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getPlaylist } from '../../src/spotify/playlists.ts';
import { getCurrentUserPlaylists } from '../../src/spotify/playlists.ts';
import { getAllCurrentUserPlaylists } from '../../src/spotify/playlists.ts';
import { getPlaylistItems } from '../../src/spotify/playlists.ts';
import { createPlaylist } from '../../src/spotify/playlists.ts';
import { updatePlaylist } from '../../src/spotify/playlists.ts';
import { addPlaylistItems } from '../../src/spotify/playlists.ts';
import { removePlaylistItems } from '../../src/spotify/playlists.ts';
import { removePlaylistItemsByPosition } from '../../src/spotify/playlists.ts';
import { reorderPlaylistItems } from '../../src/spotify/playlists.ts';
import { replacePlaylistItems } from '../../src/spotify/playlists.ts';

test('getPlaylist requests the playlist metadata path and shapes the response', async () => {
  let requestedPath = '';

  const shapedPlaylist = await getPlaylist({
    async request(path) {
      requestedPath = path;
      return {
        id: 'playlist-1',
        uri: 'spotify:playlist:playlist-1',
        name: 'Focus',
        owner: { id: 'owner-1' },
        public: true,
        collaborative: false,
        snapshot_id: 'snapshot-1',
        tracks: { total: 17 },
        ignored: 'value',
      };
    },
  }, 'playlist-1');

  assert.equal(requestedPath, 'playlists/playlist-1');
  assert.deepEqual(shapedPlaylist, {
    id: 'playlist-1',
    uri: 'spotify:playlist:playlist-1',
    name: 'Focus',
    ownerId: 'owner-1',
    public: true,
    collaborative: false,
    snapshotId: 'snapshot-1',
    trackTotal: 17,
  });
});

test('getCurrentUserPlaylists requests the shared me/playlists path and shapes page data', async () => {
  let requestedPath = '';

  const shapedPage = await getCurrentUserPlaylists({
    async request(path) {
      requestedPath = path;
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
            extra: 'ignored',
          },
          {
            id: 'playlist-2',
            name: 'Chill',
            tracks: { total: 4 },
          },
        ],
        limit: 2,
        offset: 4,
        total: 10,
        next: 'https://api.spotify.com/v1/me/playlists?offset=6&limit=2',
        previous: null,
        ignored: 'value',
      };
    },
  });

  assert.equal(requestedPath, 'me/playlists');
  assert.deepEqual(shapedPage, {
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
      {
        id: 'playlist-2',
        name: 'Chill',
        trackTotal: 4,
      },
    ],
    limit: 2,
    offset: 4,
    total: 10,
    next: 'https://api.spotify.com/v1/me/playlists?offset=6&limit=2',
  });
});

test('getAllCurrentUserPlaylists follows next links and returns compact playlists', async () => {
  const requestedPaths = [];

  const result = await getAllCurrentUserPlaylists({
    async request(path) {
      requestedPaths.push(path);

      if (path === 'me/playlists') {
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
      }

      if (path === 'https://api.spotify.com/v1/me/playlists?offset=1&limit=1') {
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
      }

      throw new Error(`Unexpected path: ${path}`);
    },
  });

  assert.deepEqual(requestedPaths, [
    'me/playlists',
    'https://api.spotify.com/v1/me/playlists?offset=1&limit=1',
  ]);
  assert.deepEqual(result, {
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
});

test('getPlaylistItems requests playlist tracks and returns compact positioned items', async () => {
  let requestedPath = '';

  const result = await getPlaylistItems({
    async request(path) {
      requestedPath = path;

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
          {
            track: {
              type: 'episode',
              id: 'episode-1',
              uri: 'spotify:episode:episode-1',
              name: 'Episode',
              show: { name: 'Show' },
            },
          },
        ],
        limit: 2,
        offset: 5,
        total: 9,
        next: null,
      };
    },
  }, 'playlist-1');

  assert.equal(requestedPath, 'playlists/playlist-1/tracks');
  assert.deepEqual(result, {
    items: [
      {
        position: 5,
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
      {
        position: 6,
        item: {
          type: 'episode',
          id: 'episode-1',
          uri: 'spotify:episode:episode-1',
          name: 'Episode',
          showName: 'Show',
        },
      },
    ],
    limit: 2,
    offset: 5,
    total: 9,
  });
});

test('createPlaylist requests the current user and posts playlist metadata to the user playlist path', async () => {
  const calls = [];

  const result = await createPlaylist({
    async request(path, init) {
      calls.push({
        path,
        init,
      });

      if (path === 'me') {
        return {
          id: 'user-1',
        };
      }

      if (path === 'users/user-1/playlists') {
        assert.deepEqual(init, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'Focus',
            description: 'Morning session',
            public: false,
            collaborative: true,
          }),
        });

        return {
          id: 'playlist-1',
          uri: 'spotify:playlist:playlist-1',
          name: 'Focus',
          owner: { id: 'user-1' },
          public: false,
          collaborative: true,
          snapshot_id: 'snapshot-1',
          tracks: { total: 0 },
          extra: 'ignored',
        };
      }

      throw new Error(`Unexpected path: ${path}`);
    },
  }, {
    name: 'Focus',
    description: 'Morning session',
    public: false,
    collaborative: true,
  });

  assert.deepEqual(calls, [
    { path: 'me', init: undefined },
    {
      path: 'users/user-1/playlists',
      init: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Focus',
          description: 'Morning session',
          public: false,
          collaborative: true,
        }),
      },
    },
  ]);
  assert.deepEqual(result, {
    id: 'playlist-1',
    uri: 'spotify:playlist:playlist-1',
    name: 'Focus',
    ownerId: 'user-1',
    public: false,
    collaborative: true,
    snapshotId: 'snapshot-1',
    trackTotal: 0,
  });
});

test('updatePlaylist validates the playlist ID and requires at least one metadata field', async () => {
  await assert.rejects(
    () => updatePlaylist({
      async request() {
        throw new Error('Unexpected request');
      },
    }, '   ', {}),
    /A playlist ID is required\./,
  );

  await assert.rejects(
    () => updatePlaylist({
      async request() {
        throw new Error('Unexpected request');
      },
    }, 'playlist-1', {}),
    /At least one playlist metadata field is required to update\./,
  );
});

test('updatePlaylist puts playlist metadata to the playlist path and returns an auditable result', async () => {
  const calls = [];

  const result = await updatePlaylist({
    async request(path, init) {
      calls.push({
        path,
        init,
      });

      if (path === 'playlists/playlist-1') {
        assert.deepEqual(init, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'Focus',
            description: 'Morning session',
            public: false,
            collaborative: true,
          }),
        });

        return {
          id: 'playlist-1',
          name: 'Focus',
          description: 'Morning session',
          public: false,
          collaborative: true,
        };
      }

      throw new Error(`Unexpected path: ${path}`);
    },
  }, 'playlist-1', {
    name: 'Focus',
    description: 'Morning session',
    public: false,
    collaborative: true,
  });

  assert.deepEqual(calls, [
    {
      path: 'playlists/playlist-1',
      init: {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Focus',
          description: 'Morning session',
          public: false,
          collaborative: true,
        }),
      },
    },
  ]);
  assert.deepEqual(result, {
    playlistId: 'playlist-1',
    updated: true,
    fields: ['name', 'description', 'public', 'collaborative'],
  });
});

test('addPlaylistItems validates input and posts bounded batches of uris', async () => {
  await assert.rejects(
    () => addPlaylistItems({
      async request() {
        throw new Error('Unexpected request');
      },
    }, '   ', ['spotify:track:track-1']),
    /A playlist ID is required\./,
  );

  await assert.rejects(
    () => addPlaylistItems({
      async request() {
        throw new Error('Unexpected request');
      },
    }, 'playlist-1', []),
    /At least one Spotify URI is required\./,
  );

  const calls = [];
  const uris = Array.from({ length: 205 }, (_, index) => `spotify:track:track-${index + 1}`);

  const result = await addPlaylistItems({
    async request(path, init) {
      calls.push({ path, init });

      const batchIndex = calls.length;

      if (path !== 'playlists/playlist-1/tracks') {
        throw new Error(`Unexpected path: ${path}`);
      }

      if (batchIndex === 1) {
        assert.deepEqual(init, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uris: uris.slice(0, 100),
          }),
        });

        return {
          snapshot_id: 'snapshot-1',
        };
      }

      if (batchIndex === 2) {
        assert.deepEqual(init, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uris: uris.slice(100, 200),
          }),
        });

        return {
          snapshot_id: 'snapshot-2',
        };
      }

      if (batchIndex === 3) {
        assert.deepEqual(init, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uris: uris.slice(200),
          }),
        });

        return {
          snapshot_id: 'snapshot-3',
        };
      }

      throw new Error(`Unexpected request count: ${batchIndex}`);
    },
  }, 'playlist-1', uris);

  assert.equal(calls.length, 3);
  assert.deepEqual(calls.map(({ path }) => path), [
    'playlists/playlist-1/tracks',
    'playlists/playlist-1/tracks',
    'playlists/playlist-1/tracks',
  ]);
  assert.deepEqual(result, {
    playlistId: 'playlist-1',
    added: 205,
    batches: [100, 100, 5],
    snapshotId: 'snapshot-3',
  });
});

test('replacePlaylistItems validates input, puts the first uri batch, and posts remaining batches', async () => {
  await assert.rejects(
    () => replacePlaylistItems({
      async request() {
        throw new Error('Unexpected request');
      },
    }, '   ', ['spotify:track:track-1']),
    /A playlist ID is required\./,
  );

  await assert.rejects(
    () => replacePlaylistItems({
      async request() {
        throw new Error('Unexpected request');
      },
    }, 'playlist-1', []),
    /At least one Spotify URI is required\./,
  );

  await assert.rejects(
    () => replacePlaylistItems({
      async request() {
        throw new Error('Unexpected request');
      },
    }, 'playlist-1', ['track-1']),
    /Spotify URIs must start with spotify:\./,
  );

  const calls = [];
  const uris = Array.from({ length: 205 }, (_, index) => `spotify:track:track-${index + 1}`);

  const result = await replacePlaylistItems({
    async request(path, init) {
      calls.push({ path, init });

      const batchIndex = calls.length;

      if (path !== 'playlists/playlist-1/tracks') {
        throw new Error(`Unexpected path: ${path}`);
      }

      if (batchIndex === 1) {
        assert.deepEqual(init, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uris: uris.slice(0, 100),
          }),
        });

        return {
          snapshot_id: 'snapshot-1',
        };
      }

      if (batchIndex === 2) {
        assert.deepEqual(init, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uris: uris.slice(100, 200),
          }),
        });

        return {
          snapshot_id: 'snapshot-2',
        };
      }

      if (batchIndex === 3) {
        assert.deepEqual(init, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uris: uris.slice(200),
          }),
        });

        return {
          snapshot_id: 'snapshot-3',
        };
      }

      throw new Error(`Unexpected request count: ${batchIndex}`);
    },
  }, 'playlist-1', uris);

  assert.deepEqual(calls.map(({ init }) => init.method), ['PUT', 'POST', 'POST']);
  assert.deepEqual(result, {
    playlistId: 'playlist-1',
    replaced: 205,
    batches: [100, 100, 5],
    snapshotId: 'snapshot-3',
  });
});

test('removePlaylistItems validates input and deletes uri tracks with an optional snapshot id', async () => {
  await assert.rejects(
    () => removePlaylistItems({
      async request() {
        throw new Error('Unexpected request');
      },
    }, '   ', ['spotify:track:track-1']),
    /A playlist ID is required\./,
  );

  await assert.rejects(
    () => removePlaylistItems({
      async request() {
        throw new Error('Unexpected request');
      },
    }, 'playlist-1', []),
    /At least one Spotify URI is required\./,
  );

  const calls = [];
  const uris = ['spotify:track:track-1', 'spotify:track:track-2'];

  const result = await removePlaylistItems({
    async request(path, init) {
      calls.push({ path, init });

      if (path !== 'playlists/playlist-1/tracks') {
        throw new Error(`Unexpected path: ${path}`);
      }

      assert.deepEqual(init, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tracks: uris.map((uri) => ({ uri })),
          snapshot_id: 'snapshot-previous',
        }),
      });

      return {
        snapshot_id: 'snapshot-removed',
      };
    },
  }, 'playlist-1', uris, {
    snapshotId: 'snapshot-previous',
  });

  assert.deepEqual(calls, [
    {
      path: 'playlists/playlist-1/tracks',
      init: {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tracks: uris.map((uri) => ({ uri })),
          snapshot_id: 'snapshot-previous',
        }),
      },
    },
  ]);
  assert.deepEqual(result, {
    playlistId: 'playlist-1',
    removed: 2,
    snapshotId: 'snapshot-removed',
  });
});

test('removePlaylistItemsByPosition validates input, reads positions before deleting grouped uri positions, and requires a snapshot id', async () => {
  await assert.rejects(
    () => removePlaylistItemsByPosition({
      async request() {
        throw new Error('Unexpected request');
      },
    }, '   ', [0], 'snapshot-previous'),
    /A playlist ID is required\./,
  );

  await assert.rejects(
    () => removePlaylistItemsByPosition({
      async request() {
        throw new Error('Unexpected request');
      },
    }, 'playlist-1', [], 'snapshot-previous'),
    /At least one zero-based integer position is required\./,
  );

  await assert.rejects(
    () => removePlaylistItemsByPosition({
      async request() {
        throw new Error('Unexpected request');
      },
    }, 'playlist-1', [0, -1], 'snapshot-previous'),
    /Playlist positions must be zero-based integers\./,
  );

  await assert.rejects(
    () => removePlaylistItemsByPosition({
      async request() {
        throw new Error('Unexpected request');
      },
    }, 'playlist-1', [0], '   '),
    /A snapshot ID is required\./,
  );

  const calls = [];

  const result = await removePlaylistItemsByPosition({
    async request(path, init) {
      calls.push({ path, init });

      if (path === 'playlists/playlist-1/tracks?limit=100&offset=0') {
        assert.equal(init, undefined);

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
          total: 103,
        };
      }

      if (path === 'playlists/playlist-1/tracks?limit=100&offset=100') {
        assert.equal(init, undefined);

        return {
          items: [
            {
              track: {
                type: 'track',
                id: 'track-3',
                uri: 'spotify:track:track-3',
                name: 'Song 3',
              },
            },
            {
              track: {
                type: 'track',
                id: 'track-4',
                uri: 'spotify:track:track-4',
                name: 'Song 4',
              },
            },
            {
              track: {
                type: 'track',
                id: 'track-4',
                uri: 'spotify:track:track-4',
                name: 'Song 4',
              },
            },
          ],
          offset: 100,
          limit: 100,
          total: 103,
        };
      }

      if (path === 'playlists/playlist-1/tracks') {
        assert.deepEqual(init, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tracks: [
              {
                uri: 'spotify:track:track-1',
                positions: [0, 2],
              },
              {
                uri: 'spotify:track:track-4',
                positions: [101, 102],
              },
            ],
            snapshot_id: 'snapshot-previous',
          }),
        });

        return {
          snapshot_id: 'snapshot-removed',
        };
      }

      throw new Error(`Unexpected path: ${path}`);
    },
  }, 'playlist-1', [0, 2, 101, 102], 'snapshot-previous');

  assert.deepEqual(calls.map(({ path }) => path), [
    'playlists/playlist-1/tracks?limit=100&offset=0',
    'playlists/playlist-1/tracks?limit=100&offset=100',
    'playlists/playlist-1/tracks',
  ]);
  assert.deepEqual(result, {
    playlistId: 'playlist-1',
    removedPositions: [0, 2, 101, 102],
    snapshotId: 'snapshot-removed',
  });
});

test('reorderPlaylistItems validates input and puts reorder instructions to the playlist tracks path', async () => {
  await assert.rejects(
    () => reorderPlaylistItems({
      async request() {
        throw new Error('Unexpected request');
      },
    }, '   ', {
      rangeStart: 0,
      insertBefore: 1,
    }),
    /A playlist ID is required\./,
  );

  await assert.rejects(
    () => reorderPlaylistItems({
      async request() {
        throw new Error('Unexpected request');
      },
    }, 'playlist-1', {
      rangeStart: -1,
      insertBefore: 1,
    }),
    /rangeStart must be a zero-based integer\./,
  );

  await assert.rejects(
    () => reorderPlaylistItems({
      async request() {
        throw new Error('Unexpected request');
      },
    }, 'playlist-1', {
      rangeStart: 0,
      insertBefore: -1,
    }),
    /insertBefore must be a zero-based integer\./,
  );

  await assert.rejects(
    () => reorderPlaylistItems({
      async request() {
        throw new Error('Unexpected request');
      },
    }, 'playlist-1', {
      rangeStart: 0,
      insertBefore: 1,
      rangeLength: 0,
    }),
    /rangeLength must be a positive integer\./,
  );

  const calls = [];

  const result = await reorderPlaylistItems({
    async request(path, init) {
      calls.push({ path, init });

      if (path !== 'playlists/playlist-1/tracks') {
        throw new Error(`Unexpected path: ${path}`);
      }

      assert.deepEqual(init, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range_start: 2,
          insert_before: 5,
          range_length: 3,
          snapshot_id: 'snapshot-previous',
        }),
      });

      return {
        snapshot_id: 'snapshot-reordered',
      };
    },
  }, 'playlist-1', {
    rangeStart: 2,
    insertBefore: 5,
    rangeLength: 3,
    snapshotId: 'snapshot-previous',
  });

  assert.deepEqual(calls, [
    {
      path: 'playlists/playlist-1/tracks',
      init: {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range_start: 2,
          insert_before: 5,
          range_length: 3,
          snapshot_id: 'snapshot-previous',
        }),
      },
    },
  ]);
  assert.deepEqual(result, {
    playlistId: 'playlist-1',
    rangeStart: 2,
    insertBefore: 5,
    rangeLength: 3,
    snapshotId: 'snapshot-reordered',
  });
});

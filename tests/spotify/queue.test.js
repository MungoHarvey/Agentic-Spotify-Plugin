import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getQueue } from '../../src/spotify/queue.ts';

test('getQueue requests the queue endpoint and shapes compact queue data', async () => {
  const calls = [];

  const result = await getQueue({
    async request(path) {
      calls.push(path);

      assert.equal(path, 'me/player/queue');

      return {
        currently_playing: {
          type: 'track',
          id: 'track-1',
          uri: 'spotify:track:track-1',
          name: 'Song',
          artists: [{ name: 'Artist A' }],
          album: { name: 'Album' },
          extra: 'ignored',
        },
        queue: [
          {
            type: 'episode',
            id: 'episode-1',
            uri: 'spotify:episode:episode-1',
            name: 'Episode',
            show: { name: 'Show' },
          },
          {
            type: 'track',
            id: 'track-2',
            uri: 'spotify:track:track-2',
            name: 'Queued Song',
            artists: [{ name: 'Artist B' }],
            album: { name: 'Queued Album' },
            duration_ms: 90000,
          },
        ],
        ignored: 'value',
      };
    },
  });

  assert.deepEqual(calls, ['me/player/queue']);
  assert.deepEqual(result, {
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
      {
        type: 'track',
        id: 'track-2',
        uri: 'spotify:track:track-2',
        name: 'Queued Song',
        artistNames: ['Artist B'],
        albumName: 'Queued Album',
        durationMs: 90000,
      },
    ],
  });
});

test('getQueue returns empty queue data for non-object responses', async () => {
  const result = await getQueue({
    async request(path) {
      assert.equal(path, 'me/player/queue');
      return null;
    },
  });

  assert.deepEqual(result, {
    currentlyPlaying: null,
    queue: [],
  });
});

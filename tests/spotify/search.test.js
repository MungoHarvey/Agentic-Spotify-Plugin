import assert from 'node:assert/strict';
import { test } from 'node:test';

import { resolveTrack, searchTracks } from '../../src/spotify/search.ts';

test('searchTracks requests compact track candidates', async () => {
  const calls = [];
  const result = await searchTracks(
    {
      async request(path) {
        calls.push(path);

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
    },
    {
      query: 'daft punk one more time',
      limit: 10,
    },
  );

  assert.deepEqual(calls, ['search?q=daft+punk+one+more+time&type=track&limit=10']);
  assert.deepEqual(result, {
    query: 'daft punk one more time',
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
});

test('resolveTrack marks multi-candidate results as ambiguous', async () => {
  const result = await resolveTrack(
    {
      async request() {
        return {
          tracks: {
            items: [
              { id: 'track-1', uri: 'spotify:track:track-1', name: 'Song A' },
              { id: 'track-2', uri: 'spotify:track:track-2', name: 'Song B' },
            ],
          },
        };
      },
    },
    { query: 'song', limit: 2 },
  );

  assert.equal(result.ambiguous, true);
  assert.equal(result.selected, undefined);
  assert.equal(result.candidates.length, 2);
});

test('resolveTrack selects exactly one candidate', async () => {
  const result = await resolveTrack(
    {
      async request() {
        return {
          tracks: {
            items: [{ id: 'track-1', uri: 'spotify:track:track-1', name: 'Song A' }],
          },
        };
      },
    },
    { query: 'song a', limit: 10 },
  );

  assert.equal(result.ambiguous, false);
  assert.deepEqual(result.selected, {
    id: 'track-1',
    uri: 'spotify:track:track-1',
    name: 'Song A',
  });
});

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { paginateAll } from '../../src/spotify/paging.ts';

test('paginateAll follows next links and preserves page order', async () => {
  const calls = [];

  const items = await paginateAll('/me/tracks?limit=2', async (pathOrUrl) => {
    calls.push(pathOrUrl);

    if (pathOrUrl === '/me/tracks?limit=2') {
      return {
        items: ['track-1', 'track-2'],
        next: 'https://api.spotify.com/v1/me/tracks?offset=2&limit=2',
      };
    }

    if (pathOrUrl === 'https://api.spotify.com/v1/me/tracks?offset=2&limit=2') {
      return {
        items: ['track-3'],
        next: null,
      };
    }

    throw new Error(`Unexpected request: ${pathOrUrl}`);
  });

  assert.deepEqual(calls, [
    '/me/tracks?limit=2',
    'https://api.spotify.com/v1/me/tracks?offset=2&limit=2',
  ]);
  assert.deepEqual(items, ['track-1', 'track-2', 'track-3']);
});

test('paginateAll treats undefined next as the end of pagination', async () => {
  const calls = [];

  const items = await paginateAll('https://api.spotify.com/v1/me/tracks?limit=1', async (pathOrUrl) => {
    calls.push(pathOrUrl);

    return {
      items: ['track-1'],
      next: undefined,
    };
  });

  assert.deepEqual(calls, ['https://api.spotify.com/v1/me/tracks?limit=1']);
  assert.deepEqual(items, ['track-1']);
});

test('paginateAll enforces maxPages and fails clearly when exceeded', async () => {
  await assert.rejects(
    paginateAll('/me/tracks', async () => ({
      items: ['track-1'],
      next: 'https://api.spotify.com/v1/me/tracks?offset=1&limit=1',
    }), { maxPages: 1 }),
    (error) => {
      assert.equal(error.message, 'Spotify pagination exceeded maxPages of 1.');
      return true;
    },
  );
});

test('paginateAll validates that items is an array', async () => {
  await assert.rejects(
    paginateAll('/me/tracks', async () => ({
      items: 'not-an-array',
      next: null,
    })),
    (error) => {
      assert.equal(error.message, 'Spotify page items must be an array.');
      return true;
    },
  );
});

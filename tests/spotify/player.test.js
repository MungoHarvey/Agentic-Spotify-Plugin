import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getPlayerDevices } from '../../src/spotify/player.ts';
import { getCurrentlyPlaying, getPlaybackState } from '../../src/spotify/player.ts';

test('getPlayerDevices requests the devices endpoint and shapes compact device data', async () => {
  const calls = [];

  const result = await getPlayerDevices({
    async request(path) {
      calls.push(path);

      assert.equal(path, 'me/player/devices');

      return {
        devices: [
          {
            id: 'device-1',
            name: 'Desk Speaker',
            type: 'speaker',
            is_active: true,
            is_restricted: false,
            volume_percent: 42,
            extra: 'ignored',
          },
          {
            id: 'device-2',
            name: 'Phone',
            type: 'smartphone',
            is_active: false,
          },
        ],
        ignored: 'value',
      };
    },
  });

  assert.deepEqual(calls, ['me/player/devices']);
  assert.deepEqual(result, {
    devices: [
      {
        id: 'device-1',
        name: 'Desk Speaker',
        type: 'speaker',
        isActive: true,
        isRestricted: false,
        volumePercent: 42,
      },
      {
        id: 'device-2',
        name: 'Phone',
        type: 'smartphone',
        isActive: false,
      },
    ],
  });
});

test('getPlaybackState returns inactive when Spotify returns no content', async () => {
  const result = await getPlaybackState({
    async request(path) {
      assert.equal(path, 'me/player');
      return null;
    },
  });

  assert.deepEqual(result, {
    active: false,
  });
});

test('getPlaybackState requests playback state and returns compact playback data', async () => {
  const result = await getPlaybackState({
    async request(path) {
      assert.equal(path, 'me/player');
      return {
        is_playing: true,
        progress_ms: 2500,
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
          duration_ms: 1000,
          explicit: false,
          is_playable: true,
        },
        context: {
          uri: 'spotify:playlist:playlist-1',
        },
      };
    },
  });

  assert.deepEqual(result, {
    active: true,
    isPlaying: true,
    progressMs: 2500,
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
      durationMs: 1000,
      explicit: false,
      isPlayable: true,
    },
    contextUri: 'spotify:playlist:playlist-1',
  });
});

test('getCurrentlyPlaying returns no-current marker when Spotify returns no content', async () => {
  const result = await getCurrentlyPlaying({
    async request(path) {
      assert.equal(path, 'me/player/currently-playing');
      return null;
    },
  });

  assert.deepEqual(result, {
    current: false,
  });
});

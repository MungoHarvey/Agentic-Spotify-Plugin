import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  shapeDevice,
  shapeEpisode,
  shapePlayback,
  shapePlaylist,
  shapePlaylistItem,
  shapeTrack,
  shapeUser,
} from '../../src/spotify/shapes.ts';

test('shapeUser returns a compact user shape with available fields only', () => {
  const shaped = shapeUser({
    id: 'user-1',
    display_name: 'Ada',
    country: 'GB',
    product: 'premium',
    uri: 'spotify:user:user-1',
    extra: 'ignored',
  });

  assert.deepEqual(shaped, {
    id: 'user-1',
    displayName: 'Ada',
    country: 'GB',
    product: 'premium',
    uri: 'spotify:user:user-1',
  });
});

test('shapeUser tolerates partial objects', () => {
  assert.deepEqual(shapeUser(null), {});
  assert.deepEqual(shapeUser({ display_name: 'Ada' }), { displayName: 'Ada' });
});

test('shapeDevice returns compact device fields', () => {
  const shaped = shapeDevice({
    id: 'device-1',
    name: 'Desk Speaker',
    type: 'speaker',
    is_active: true,
    is_restricted: false,
    volume_percent: 42,
    ignored: 'value',
  });

  assert.deepEqual(shaped, {
    id: 'device-1',
    name: 'Desk Speaker',
    type: 'speaker',
    isActive: true,
    isRestricted: false,
    volumePercent: 42,
  });
});

test('shapeTrack returns compact track fields with artist names and album name', () => {
  const shaped = shapeTrack({
    type: 'track',
    id: 'track-1',
    uri: 'spotify:track:track-1',
    name: 'Song',
    artists: [{ name: 'Artist A' }, { name: 'Artist B' }],
    album: { name: 'Album Name' },
    duration_ms: 123456,
    explicit: true,
    is_playable: false,
    ignored: 'value',
  });

  assert.deepEqual(shaped, {
    type: 'track',
    id: 'track-1',
    uri: 'spotify:track:track-1',
    name: 'Song',
    artistNames: ['Artist A', 'Artist B'],
    albumName: 'Album Name',
    durationMs: 123456,
    explicit: true,
    isPlayable: false,
  });
});

test('shapeEpisode returns compact episode fields with show name', () => {
  const shaped = shapeEpisode({
    type: 'episode',
    id: 'episode-1',
    uri: 'spotify:episode:episode-1',
    name: 'Episode Name',
    show: { name: 'Show Name' },
    duration_ms: 654321,
    explicit: false,
    is_playable: true,
  });

  assert.deepEqual(shaped, {
    type: 'episode',
    id: 'episode-1',
    uri: 'spotify:episode:episode-1',
    name: 'Episode Name',
    showName: 'Show Name',
    durationMs: 654321,
    explicit: false,
    isPlayable: true,
  });
});

test('shapePlaylist returns compact playlist fields', () => {
  const shaped = shapePlaylist({
    id: 'playlist-1',
    uri: 'spotify:playlist:playlist-1',
    name: 'Focus',
    owner: { id: 'owner-1' },
    public: true,
    collaborative: false,
    snapshot_id: 'snapshot-1',
    tracks: { total: 17 },
  });

  assert.deepEqual(shaped, {
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

test('shapePlayback returns compact playback fields and shapes the item', () => {
  const shaped = shapePlayback({
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
  });

  assert.deepEqual(shaped, {
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

test('shapePlayback tolerates missing nested fields without throwing', () => {
  assert.deepEqual(shapePlayback({}), {});
  assert.deepEqual(shapePlayback({ item: { type: 'episode' } }), {
    item: {
      type: 'episode',
    },
  });
});

test('shapePlaylistItem returns compact item fields with position', () => {
  const shaped = shapePlaylistItem(
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
    3,
  );

  assert.deepEqual(shaped, {
    position: 3,
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
  });
});

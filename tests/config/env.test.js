import assert from 'node:assert/strict';
import { test } from 'node:test';

import { loadSpotifyConfig, resolveSpotifyClientId } from '../../src/config/env.ts';

const defaultScopes = [
  'playlist-read-private',
  'playlist-read-collaborative',
  'playlist-modify-private',
  'playlist-modify-public',
  'user-read-playback-state',
  'user-read-currently-playing',
  'user-modify-playback-state',
  'streaming',
  'user-read-private',
].join(' ');

test('loadSpotifyConfig applies the default redirect uri and initial scopes', () => {
  const config = loadSpotifyConfig({
    SPOTIFY_CLIENT_ID: 'client-id',
  });

  assert.deepEqual(config, {
    clientId: 'client-id',
    redirectUri: 'http://127.0.0.1:43210/callback',
    scopes: defaultScopes.split(' '),
  });
});

test('loadSpotifyConfig parses space-separated scopes from the provided env', () => {
  const config = loadSpotifyConfig({
    SPOTIFY_CLIENT_ID: 'client-id',
    SPOTIFY_REDIRECT_URI: 'http://localhost:9999/callback',
    SPOTIFY_SCOPES: 'scope-one scope-two  scope-three',
  });

  assert.deepEqual(config, {
    clientId: 'client-id',
    redirectUri: 'http://localhost:9999/callback',
    scopes: ['scope-one', 'scope-two', 'scope-three'],
  });
});

test('loadSpotifyConfig throws when SPOTIFY_CLIENT_ID is missing', () => {
  assert.throws(() => loadSpotifyConfig({}), {
    message: 'Missing required environment variable SPOTIFY_CLIENT_ID.',
  });
});

test('resolveSpotifyClientId prefers env over stored client ID', () => {
  assert.deepEqual(resolveSpotifyClientId({ SPOTIFY_CLIENT_ID: ' env-client ' }, 'stored-client'), {
    clientId: 'env-client',
    source: 'env',
  });
});

test('resolveSpotifyClientId falls back to stored client ID', () => {
  assert.deepEqual(resolveSpotifyClientId({}, ' stored-client '), {
    clientId: 'stored-client',
    source: 'token-store',
  });
});

test('resolveSpotifyClientId throws when neither env nor token store has a client ID', () => {
  assert.throws(() => resolveSpotifyClientId({}, ''), {
    message: 'Missing Spotify client ID. Set SPOTIFY_CLIENT_ID or run spotify auth login again to persist the client ID.',
  });
});

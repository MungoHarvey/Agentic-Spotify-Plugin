import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildAuthorizationUrl } from '../../src/auth/authorization-url.ts';

test('buildAuthorizationUrl returns the Spotify authorize url with the expected query params', () => {
  const url = buildAuthorizationUrl({
    clientId: 'client-id',
    redirectUri: 'http://127.0.0.1:43210/callback',
    scopes: ['playlist-read-private', 'user-read-private'],
    state: 'oauth-state',
    codeChallenge: 'challenge-value',
  });

  assert.equal(url.origin, 'https://accounts.spotify.com');
  assert.equal(url.pathname, '/authorize');
  assert.equal(url.searchParams.get('response_type'), 'code');
  assert.equal(url.searchParams.get('client_id'), 'client-id');
  assert.equal(url.searchParams.get('redirect_uri'), 'http://127.0.0.1:43210/callback');
  assert.equal(url.searchParams.get('scope'), 'playlist-read-private user-read-private');
  assert.equal(url.searchParams.get('state'), 'oauth-state');
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(url.searchParams.get('code_challenge'), 'challenge-value');
});

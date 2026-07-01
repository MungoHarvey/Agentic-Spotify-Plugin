import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createSpotifyApiError, SpotifyApiError } from '../../src/spotify/errors.ts';

test('createSpotifyApiError normalizes 401 unauthorized responses', () => {
  const error = createSpotifyApiError(401, {
    error: {
      message: 'Invalid access token: Bearer abc123-refresh-token',
      reason: 'token expired',
    },
  });

  assert.ok(error instanceof SpotifyApiError);
  assert.equal(error.status, 401);
  assert.equal(error.reason, 'unauthorized');
  assert.equal(error.message, 'Spotify request failed with status 401: unauthorized.');
  assert.equal(error.retryAfterSeconds, undefined);
  assert.equal(error.message.includes('abc123-refresh-token'), false);
  assert.equal(error.message.includes('Bearer'), false);
});

test('createSpotifyApiError normalizes 403 forbidden responses', () => {
  const error = createSpotifyApiError(403, {
    error: {
      message: 'Insufficient scope for refresh_token value',
      reason: 'insufficient scope',
    },
  });

  assert.equal(error.status, 403);
  assert.equal(error.reason, 'forbidden');
  assert.equal(error.message, 'Spotify request failed with status 403: forbidden.');
  assert.equal(error.message.includes('refresh_token'), false);
});

test('createSpotifyApiError normalizes 404 not found responses', () => {
  const error = createSpotifyApiError(404, {
    error: {
      message: 'Not found: access_token abc.def.ghi',
    },
  });

  assert.equal(error.status, 404);
  assert.equal(error.reason, 'not_found');
  assert.equal(error.message, 'Spotify request failed with status 404: not_found.');
  assert.equal(error.message.includes('access_token'), false);
});

test('createSpotifyApiError normalizes 429 responses and captures retry-after seconds', () => {
  const error = createSpotifyApiError(
    429,
    {
      error: {
        message: 'Rate limit hit for bearer token refresh_token value',
      },
    },
    {
      'Retry-After': '12',
    }
  );

  assert.equal(error.status, 429);
  assert.equal(error.reason, 'rate_limited');
  assert.equal(error.retryAfterSeconds, 12);
  assert.equal(error.message, 'Spotify request failed with status 429: rate_limited.');
  assert.equal(error.message.includes('refresh_token'), false);
});

test('createSpotifyApiError normalizes generic spotify errors without leaking token values', () => {
  const error = createSpotifyApiError(418, {
    error: {
      message: 'Unsupported response with access_token=abc123 and refresh_token=def456',
      reason: 'teapot',
    },
  });

  assert.equal(error.status, 418);
  assert.equal(error.reason, 'spotify_error');
  assert.equal(error.message, 'Spotify request failed with status 418: spotify_error.');
  assert.equal(error.message.includes('access_token'), false);
  assert.equal(error.message.includes('refresh_token'), false);
  assert.equal(error.message.includes('abc123'), false);
  assert.equal(error.message.includes('def456'), false);
});

test('createSpotifyApiError accepts headers-like objects with get()', () => {
  const headers = {
    get(name) {
      return name.toLowerCase() === 'retry-after' ? '7' : null;
    },
  };

  const error = createSpotifyApiError(429, null, headers);

  assert.equal(error.retryAfterSeconds, 7);
});

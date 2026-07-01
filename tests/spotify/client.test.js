import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createSpotifyClient } from '../../src/spotify/client.ts';

function createResponse(status, body) {
  return {
    status,
    ok: status >= 200 && status < 300,
    async json() {
      return body;
    },
    async text() {
      return typeof body === 'string' ? body : JSON.stringify(body);
    },
  };
}

function createTokenData(accessToken, refreshToken, expiresAt) {
  return {
    accessToken,
    refreshToken,
    expiresAt,
    tokenType: 'Bearer',
    scope: ['user-read-private'],
    obtainedAt: expiresAt - 3600000,
  };
}

test('createSpotifyClient joins relative paths to the Spotify v1 base URL and injects bearer auth', async () => {
  const calls = [];
  const client = createSpotifyClient({
    fetchImpl: async (url, init) => {
      calls.push({
        url,
        init: {
          ...init,
          headers: { ...init.headers },
        },
      });

      return createResponse(200, { ok: true });
    },
    readAccessToken: async () => 'access-token-123',
  });

  const result = await client.request('me');

  assert.deepEqual(calls, [
    {
      url: 'https://api.spotify.com/v1/me',
      init: {
        method: 'GET',
        headers: {
          Authorization: 'Bearer access-token-123',
        },
      },
    },
  ]);

  assert.deepEqual(result, { ok: true });
});

test('createSpotifyClient preserves absolute URLs for future pagination support', async () => {
  let url;
  const client = createSpotifyClient({
    fetchImpl: async (requestUrl) => {
      url = requestUrl;
      return createResponse(200, { next: null });
    },
    readAccessToken: () => 'access-token-123',
  });

  await client.request('https://api.spotify.com/v1/me/tracks?offset=50&limit=1');

  assert.equal(url, 'https://api.spotify.com/v1/me/tracks?offset=50&limit=1');
});

test('createSpotifyClient preserves caller method, headers, and JSON body', async () => {
  let capturedInit;
  const client = createSpotifyClient({
    fetchImpl: async (_url, init) => {
      capturedInit = {
        ...init,
        headers: { ...init.headers },
      };
      return createResponse(200, { saved: true });
    },
    readAccessToken: () => 'access-token-123',
  });

  const result = await client.request('playlists/abc123', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': 'request-1',
    },
    body: '{"name":"Chill"}',
  });

  assert.deepEqual(capturedInit, {
    method: 'PUT',
    headers: {
      Authorization: 'Bearer access-token-123',
      'Content-Type': 'application/json',
      'X-Request-ID': 'request-1',
    },
    body: '{"name":"Chill"}',
  });
  assert.deepEqual(result, { saved: true });
});

test('createSpotifyClient returns null for 204 no-content responses', async () => {
  const client = createSpotifyClient({
    fetchImpl: async () => createResponse(204, null),
    readAccessToken: () => 'access-token-123',
  });

  const result = await client.request('me/player');

  assert.equal(result, null);
});

test('createSpotifyClient throws normalized Spotify API errors without exposing token values', async () => {
  const client = createSpotifyClient({
    fetchImpl: async () =>
      createResponse(401, {
        error: {
          message: 'Invalid bearer token access-token-123 and refresh-token-456',
          reason: 'token expired',
        },
      }),
    readAccessToken: () => 'access-token-123',
  });

  await assert.rejects(
    client.request('me'),
    (error) => {
      assert.equal(error.status, 401);
      assert.equal(error.reason, 'unauthorized');
      assert.equal(error.message, 'Spotify request failed with status 401: unauthorized.');
      assert.equal(error.message.includes('access-token-123'), false);
      assert.equal(error.message.includes('refresh-token-456'), false);
      return true;
    },
  );
});

test('createSpotifyClient refreshes expired token data before the request and persists the refreshed token', async () => {
  const originalNow = Date.now;
  Date.now = () => 1700000000000;

  const originalTokenData = createTokenData('expired-access', 'refresh-123', 1700000001000);
  const refreshedTokenData = createTokenData('fresh-access', 'refresh-456', 1700003600000);
  const calls = [];
  let refreshInput = null;
  let persistedTokenData = null;

  const client = createSpotifyClient({
    fetchImpl: async (url, init) => {
      calls.push({
        url,
        init: {
          ...init,
          headers: { ...init.headers },
        },
      });

      return createResponse(200, { ok: true });
    },
    readTokenData: async () => originalTokenData,
    refreshTokenData: async (tokenData) => {
      refreshInput = tokenData;
      return refreshedTokenData;
    },
    writeTokenData: async (tokenData) => {
      persistedTokenData = tokenData;
    },
  });

  try {
    const result = await client.request('/me');

    assert.deepEqual(refreshInput, originalTokenData);
    assert.deepEqual(persistedTokenData, refreshedTokenData);
    assert.deepEqual(calls, [
      {
        url: 'https://api.spotify.com/v1/me',
        init: {
          method: 'GET',
          headers: {
            Authorization: 'Bearer fresh-access',
          },
        },
      },
    ]);
    assert.deepEqual(result, { ok: true });
  } finally {
    Date.now = originalNow;
  }
});

test('createSpotifyClient refreshes once after a 401 response, retries, and returns the retried response', async () => {
  const originalNow = Date.now;
  Date.now = () => 1700000000000;

  const tokenData = createTokenData('old-access', 'refresh-123', 1700003600000);
  const refreshedTokenData = createTokenData('new-access', 'refresh-456', 1700007200000);
  const calls = [];
  let refreshCount = 0;
  let persistedTokenData = null;

  const client = createSpotifyClient({
    fetchImpl: async (url, init) => {
      calls.push({
        url,
        init: {
          ...init,
          headers: { ...init.headers },
        },
      });

      if (calls.length === 1) {
        return createResponse(401, {
          error: {
            message: 'unauthorized',
          },
        });
      }

      return createResponse(200, {
        retried: true,
      });
    },
    readTokenData: () => tokenData,
    refreshTokenData: async () => {
      refreshCount += 1;
      return refreshedTokenData;
    },
    writeTokenData: async (nextTokenData) => {
      persistedTokenData = nextTokenData;
    },
  });

  try {
    const result = await client.request('me/player');

    assert.equal(refreshCount, 1);
    assert.deepEqual(persistedTokenData, refreshedTokenData);
    assert.deepEqual(calls, [
      {
        url: 'https://api.spotify.com/v1/me/player',
        init: {
          method: 'GET',
          headers: {
            Authorization: 'Bearer old-access',
          },
        },
      },
      {
        url: 'https://api.spotify.com/v1/me/player',
        init: {
          method: 'GET',
          headers: {
            Authorization: 'Bearer new-access',
          },
        },
      },
    ]);
    assert.deepEqual(result, { retried: true });
  } finally {
    Date.now = originalNow;
  }
});

test('createSpotifyClient throws a normalized Spotify API error after a retried 401 still fails', async () => {
  const originalNow = Date.now;
  Date.now = () => 1700000000000;

  const tokenData = createTokenData('old-access', 'refresh-123', 1700003600000);
  const refreshedTokenData = createTokenData('new-access', 'refresh-456', 1700007200000);
  let refreshCount = 0;
  const calls = [];

  const client = createSpotifyClient({
    fetchImpl: async (url, init) => {
      calls.push({
        url,
        init: {
          ...init,
          headers: { ...init.headers },
        },
      });

      return createResponse(401, {
        error: {
          message: 'still unauthorized with old-access and refresh-123',
        },
      });
    },
    readTokenData: () => tokenData,
    refreshTokenData: async () => {
      refreshCount += 1;
      return refreshedTokenData;
    },
    writeTokenData: async () => {},
  });

  try {
    await assert.rejects(
      client.request('me'),
      (error) => {
        assert.equal(error.status, 401);
        assert.equal(error.reason, 'unauthorized');
        assert.equal(error.message, 'Spotify request failed with status 401: unauthorized.');
        assert.equal(error.message.includes('old-access'), false);
        assert.equal(error.message.includes('refresh-123'), false);
        assert.equal(error.message.includes('new-access'), false);
        return true;
      },
    );

    assert.equal(refreshCount, 1);
    assert.equal(calls.length, 2);
    assert.deepEqual(calls[0].init.headers, {
      Authorization: 'Bearer old-access',
    });
    assert.deepEqual(calls[1].init.headers, {
      Authorization: 'Bearer new-access',
    });
  } finally {
    Date.now = originalNow;
  }
});

test('createSpotifyClient sleeps for Retry-After milliseconds and retries once after a 429 response', async () => {
  const calls = [];
  const sleepCalls = [];

  const client = createSpotifyClient({
    fetchImpl: async (url, init) => {
      calls.push({
        url,
        init: {
          ...init,
          headers: { ...init.headers },
        },
      });

      if (calls.length === 1) {
        return {
          status: 429,
          ok: false,
          async json() {
            return {
              error: {
                message: 'rate limited',
              },
            };
          },
          async text() {
            return 'rate limited';
          },
          headers: {
            get(name) {
              return name === 'Retry-After' ? '2' : null;
            },
          },
        };
      }

      return createResponse(200, { retried: true });
    },
    readAccessToken: () => 'access-token-123',
    sleep: async (milliseconds) => {
      sleepCalls.push(milliseconds);
    },
  });

  const result = await client.request('me/player');

  assert.deepEqual(sleepCalls, [2000]);
  assert.equal(calls.length, 2);
  assert.deepEqual(result, { retried: true });
});

test('createSpotifyClient throws a normalized Spotify API error with retryAfterSeconds after a retried 429 still fails', async () => {
  const calls = [];
  const sleepCalls = [];

  const client = createSpotifyClient({
    fetchImpl: async (url, init) => {
      calls.push({
        url,
        init: {
          ...init,
          headers: { ...init.headers },
        },
      });

      return {
        status: 429,
        ok: false,
        async json() {
          return {
            error: {
              message: 'still rate limited',
            },
          };
        },
        async text() {
          return 'still rate limited';
        },
        headers: {
          get(name) {
            return name === 'Retry-After' ? '3' : null;
          },
        },
      };
    },
    readAccessToken: () => 'access-token-123',
    sleep: async (milliseconds) => {
      sleepCalls.push(milliseconds);
    },
  });

  await assert.rejects(
    client.request('me/player'),
    (error) => {
      assert.equal(error.status, 429);
      assert.equal(error.reason, 'rate_limited');
      assert.equal(error.retryAfterSeconds, 3);
      assert.equal(error.message, 'Spotify request failed with status 429: rate_limited.');
      return true;
    },
  );

  assert.deepEqual(sleepCalls, [3000]);
  assert.equal(calls.length, 2);
});

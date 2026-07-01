import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  exchangeAuthorizationCode,
  refreshAccessToken,
} from '../../src/auth/token-exchange.ts';

function createResponse(status, body) {
  return {
    status,
    ok: status >= 200 && status < 300,
    async json() {
      return body;
    },
    async text() {
      return JSON.stringify(body);
    },
  };
}

test('exchangeAuthorizationCode posts the expected form body and normalizes the token response', async () => {
  const originalNow = Date.now;
  Date.now = () => 1700000000000;

  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({
      url,
      init: {
        ...init,
        headers: { ...init.headers },
      },
    });

    return createResponse(200, {
      access_token: 'access-a',
      refresh_token: 'refresh-a',
      expires_in: 3600,
      token_type: 'Bearer',
      scope: 'playlist-read-private user-read-private',
    });
  };

  try {
    const tokenData = await exchangeAuthorizationCode({
      clientId: 'client-a',
      redirectUri: 'http://127.0.0.1:43210/callback',
      code: 'code-a',
      codeVerifier: 'verifier-a',
      fetchImpl,
    });

    assert.deepEqual(calls, [
      {
        url: 'https://accounts.spotify.com/api/token',
        init: {
          method: 'POST',
          headers: {
            'content-type': 'application/x-www-form-urlencoded',
          },
          body:
            'grant_type=authorization_code&code=code-a&redirect_uri=http%3A%2F%2F127.0.0.1%3A43210%2Fcallback&client_id=client-a&code_verifier=verifier-a',
        },
      },
    ]);

    assert.deepEqual(tokenData, {
      accessToken: 'access-a',
      refreshToken: 'refresh-a',
      expiresAt: 1700003600000,
      tokenType: 'Bearer',
      scope: ['playlist-read-private', 'user-read-private'],
      obtainedAt: 1700000000000,
    });
  } finally {
    Date.now = originalNow;
  }
});

test('refreshAccessToken preserves the previous refresh token when Spotify omits one', async () => {
  const originalNow = Date.now;
  Date.now = () => 1710000000000;

  let call;
  const fetchImpl = async (url, init) => {
    call = {
      url,
      init: {
        ...init,
        headers: { ...init.headers },
      },
    };

    return createResponse(200, {
      access_token: 'access-b',
      expires_in: 1800,
      token_type: 'Bearer',
      scope: 'user-read-private',
    });
  };

  try {
    const tokenData = await refreshAccessToken({
      clientId: 'client-b',
      refreshToken: 'refresh-b',
      fetchImpl,
    });

    assert.deepEqual(call, {
      url: 'https://accounts.spotify.com/api/token',
      init: {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=refresh_token&refresh_token=refresh-b&client_id=client-b',
      },
    });

    assert.deepEqual(tokenData, {
      accessToken: 'access-b',
      refreshToken: 'refresh-b',
      expiresAt: 1710001800000,
      tokenType: 'Bearer',
      scope: ['user-read-private'],
      obtainedAt: 1710000000000,
    });
  } finally {
    Date.now = originalNow;
  }
});

test('token exchange helpers throw a clear error for non-2xx responses without token values', async () => {
  const fetchImpl = async () =>
    createResponse(400, {
      error: 'invalid_grant',
      error_description: 'bad code',
    });

  await assert.rejects(
    exchangeAuthorizationCode({
      clientId: 'client-c',
      redirectUri: 'http://127.0.0.1:43210/callback',
      code: 'code-c',
      codeVerifier: 'verifier-c',
      fetchImpl,
    }),
    (error) => {
      assert.match(error.message, /Spotify token request failed with status 400\./);
      assert.equal(error.message.includes('code-c'), false);
      assert.equal(error.message.includes('verifier-c'), false);
      return true;
    },
  );
});

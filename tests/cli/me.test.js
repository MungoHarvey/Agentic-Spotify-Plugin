import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { runMeSession } from '../../src/cli/commands/me.ts';

function createTempTokenPath() {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'spotify-me-session-'));

  return {
    tempRoot,
    tokenPath: path.join(tempRoot, 'tokens.json'),
  };
}

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

test('runMeSession refreshes expired token data, reads the current user, and emits compact JSON', async () => {
  const originalNow = Date.now;
  Date.now = () => 1700000000000;

  try {
    const { tokenPath } = createTempTokenPath();
    writeFileSync(
      tokenPath,
      `${JSON.stringify(
        {
          accessToken: 'old-access',
          refreshToken: 'old-refresh',
          expiresAt: 1700000001000,
          tokenType: 'Bearer',
          scope: ['user-read-private'],
          obtainedAt: 1699996400000,
        },
        null,
        2,
      )}\n`,
      'utf8',
    );

    let stdout = '';
    let stderr = '';
    const fetchCalls = [];

    const exitCode = await runMeSession({
      json: true,
      env: {
        SPOTIFY_CLIENT_ID: 'client-123',
        SPOTIFY_TOKEN_PATH: tokenPath,
      },
      fetchImpl: async (url, init) => {
        fetchCalls.push({
          url,
          init: {
            ...init,
            headers: { ...init.headers },
          },
        });

        if (url === 'https://accounts.spotify.com/api/token') {
          return createResponse(200, {
            access_token: 'new-access',
            refresh_token: '',
            expires_in: 3600,
            token_type: 'Bearer',
            scope: 'user-read-private',
          });
        }

        if (url === 'https://api.spotify.com/v1/me') {
          return createResponse(200, {
            id: 'user-1',
            display_name: 'Ada',
            country: 'GB',
            product: 'premium',
            uri: 'spotify:user:user-1',
          });
        }

        throw new Error(`Unexpected fetch URL: ${url}`);
      },
      stdout: {
        write(value) {
          stdout += value;
        },
      },
      stderr: {
        write(value) {
          stderr += value;
        },
      },
    });

    assert.equal(exitCode, 0);
    assert.equal(stderr, '');
    assert.deepEqual(fetchCalls, [
      {
        url: 'https://accounts.spotify.com/api/token',
        init: {
          method: 'POST',
          headers: {
            'content-type': 'application/x-www-form-urlencoded',
          },
          body:
            'grant_type=refresh_token&refresh_token=old-refresh&client_id=client-123',
        },
      },
      {
        url: 'https://api.spotify.com/v1/me',
        init: {
          method: 'GET',
          headers: {
            Authorization: 'Bearer new-access',
          },
        },
      },
    ]);

    const payload = JSON.parse(stdout);

    assert.deepEqual(payload, {
      id: 'user-1',
      displayName: 'Ada',
      country: 'GB',
      product: 'premium',
      uri: 'spotify:user:user-1',
    });
    assert.equal(stdout.includes('old-access'), false);
    assert.equal(stdout.includes('old-refresh'), false);
    assert.equal(stdout.includes('new-access'), false);

    const updatedTokenData = JSON.parse(readFileSync(tokenPath, 'utf8'));

    assert.deepEqual(updatedTokenData, {
      accessToken: 'new-access',
      refreshToken: 'old-refresh',
      expiresAt: 1700003600000,
      tokenType: 'Bearer',
      scope: ['user-read-private'],
      obtainedAt: 1700000000000,
    });
  } finally {
    Date.now = originalNow;
  }
});

test('runMeSession reads the current user without client id when the stored access token is valid', async () => {
  const originalNow = Date.now;
  Date.now = () => 1700000000000;

  try {
    const { tokenPath } = createTempTokenPath();
    writeFileSync(
      tokenPath,
      `${JSON.stringify(
        {
          accessToken: 'valid-access',
          refreshToken: 'valid-refresh',
          expiresAt: 1700007200000,
          tokenType: 'Bearer',
          scope: ['user-read-private'],
          obtainedAt: 1699996400000,
        },
        null,
        2,
      )}\n`,
      'utf8',
    );

    let stdout = '';
    let stderr = '';
    const fetchCalls = [];

    const exitCode = await runMeSession({
      json: true,
      env: {
        SPOTIFY_TOKEN_PATH: tokenPath,
      },
      fetchImpl: async (url, init) => {
        fetchCalls.push({
          url,
          init: {
            ...init,
            headers: { ...init.headers },
          },
        });

        return createResponse(200, {
          id: 'user-2',
          display_name: 'Grace',
          product: 'free',
        });
      },
      stdout: {
        write(value) {
          stdout += value;
        },
      },
      stderr: {
        write(value) {
          stderr += value;
        },
      },
    });

    assert.equal(exitCode, 0);
    assert.equal(stderr, '');
    assert.deepEqual(fetchCalls, [
      {
        url: 'https://api.spotify.com/v1/me',
        init: {
          method: 'GET',
          headers: {
            Authorization: 'Bearer valid-access',
          },
        },
      },
    ]);
    assert.deepEqual(JSON.parse(stdout), {
      id: 'user-2',
      displayName: 'Grace',
      product: 'free',
    });
  } finally {
    Date.now = originalNow;
  }
});

test('runMeSession fails clearly when the token file is missing', async () => {
  const { tokenPath } = createTempTokenPath();
  let stdout = '';
  let stderr = '';
  let refreshCalled = false;

  const exitCode = await runMeSession({
    json: true,
    env: {
      SPOTIFY_CLIENT_ID: 'client-123',
      SPOTIFY_TOKEN_PATH: tokenPath,
    },
    fetchImpl: async () => {
      throw new Error('should not fetch');
    },
    refreshAccessToken: async () => {
      refreshCalled = true;
      throw new Error('should not refresh');
    },
    stdout: {
      write(value) {
        stdout += value;
      },
    },
    stderr: {
      write(value) {
        stderr += value;
      },
    },
  });

  assert.equal(exitCode, 1);
  assert.equal(stdout, '');
  assert.equal(refreshCalled, false);
  assert.match(stderr, /Unauthenticated\. Run spotify auth login first\./);
});

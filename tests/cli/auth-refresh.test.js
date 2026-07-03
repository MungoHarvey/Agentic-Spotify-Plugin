import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { runAuthRefreshSession } from '../../src/cli/commands/auth.ts';

function createTempTokenPath() {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'spotify-refresh-session-'));

  return {
    tempRoot,
    tokenPath: path.join(tempRoot, 'tokens.json'),
  };
}

test('runAuthRefreshSession fails clearly when the token file is missing', async () => {
  const { tokenPath } = createTempTokenPath();
  let stdout = '';
  let stderr = '';
  let refreshCalled = false;

  const exitCode = await runAuthRefreshSession({
    json: true,
    env: {
      SPOTIFY_CLIENT_ID: 'client-123',
      SPOTIFY_TOKEN_PATH: tokenPath,
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
  assert.match(stderr, /Unauthenticated/i);
});

test('runAuthRefreshSession fails clearly when no client ID is available', async () => {
  const { tokenPath } = createTempTokenPath();
  writeFileSync(
    tokenPath,
    `${JSON.stringify(
      {
        accessToken: 'old-access',
        refreshToken: 'old-refresh',
        expiresAt: 1234567890,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  let stdout = '';
  let stderr = '';

  const exitCode = await runAuthRefreshSession({
    json: false,
    env: {
      SPOTIFY_TOKEN_PATH: tokenPath,
    },
    refreshAccessToken: async () => {
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
  assert.match(stderr, /Missing Spotify client ID/);
});

test('runAuthRefreshSession refreshes tokens from env client ID, preserves metadata, and redacts output', async () => {
  const { tokenPath } = createTempTokenPath();
  const storedTokenData = {
    accessToken: 'old-access',
    refreshToken: 'old-refresh',
    expiresAt: 1234567890,
    clientId: 'stored-client-123',
    tokenType: 'Bearer',
    scope: ['scope-a', 'scope-b'],
    obtainedAt: 1234560000,
  };

  writeFileSync(tokenPath, `${JSON.stringify(storedTokenData, null, 2)}\n`, 'utf8');

  let stdout = '';
  let stderr = '';
  let refreshInput = null;

  const exitCode = await runAuthRefreshSession({
    json: true,
    env: {
      SPOTIFY_CLIENT_ID: 'client-123',
      SPOTIFY_TOKEN_PATH: tokenPath,
    },
    refreshAccessToken: async (input) => {
      refreshInput = input;

      return {
        accessToken: 'new-access',
        refreshToken: '',
        expiresAt: 1700003600000,
        tokenType: 'Bearer',
        scope: ['scope-a', 'scope-b'],
        obtainedAt: 1700000000000,
      };
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
  assert.deepEqual(refreshInput, {
    clientId: 'client-123',
    refreshToken: 'old-refresh',
    fetchImpl: globalThis.fetch,
  });

  const payload = JSON.parse(stdout);

  assert.deepEqual(payload, {
    authenticated: {
      authenticated: true,
      expiresAt: 1700003600000,
      scopes: ['scope-a', 'scope-b'],
      clientIdConfigured: true,
      clientIdSource: 'env',
      refreshable: true,
      tokenType: 'Bearer',
      obtainedAt: 1700000000000,
    },
    tokenStorePath: tokenPath,
  });
  assert.equal(stdout.includes('old-access'), false);
  assert.equal(stdout.includes('old-refresh'), false);
  assert.equal(stdout.includes('new-access'), false);

  const updatedTokenData = JSON.parse(readFileSync(tokenPath, 'utf8'));

  assert.deepEqual(updatedTokenData, {
    accessToken: 'new-access',
    refreshToken: 'old-refresh',
    expiresAt: 1700003600000,
    clientId: 'stored-client-123',
    tokenType: 'Bearer',
    scope: ['scope-a', 'scope-b'],
    obtainedAt: 1700000000000,
  });
});

test('runAuthRefreshSession refreshes using the stored client ID when env is unset', async () => {
  const { tokenPath } = createTempTokenPath();
  const storedTokenData = {
    accessToken: 'old-access',
    refreshToken: 'old-refresh',
    expiresAt: 1234567890,
    clientId: 'stored-client-123',
    tokenType: 'Bearer',
    scope: ['scope-a'],
    obtainedAt: 1234560000,
  };

  writeFileSync(tokenPath, `${JSON.stringify(storedTokenData, null, 2)}\n`, 'utf8');

  let stdout = '';
  let stderr = '';
  let refreshInput = null;

  const exitCode = await runAuthRefreshSession({
    json: true,
    env: {
      SPOTIFY_TOKEN_PATH: tokenPath,
    },
    refreshAccessToken: async (input) => {
      refreshInput = input;

      return {
        accessToken: 'new-access',
        refreshToken: '',
        expiresAt: 1700003600000,
        tokenType: 'Bearer',
        scope: ['scope-a'],
        obtainedAt: 1700000000000,
      };
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
  assert.deepEqual(refreshInput, {
    clientId: 'stored-client-123',
    refreshToken: 'old-refresh',
    fetchImpl: globalThis.fetch,
  });

  const payload = JSON.parse(stdout);

  assert.equal(payload.authenticated.clientIdConfigured, true);
  assert.equal(payload.authenticated.clientIdSource, 'token-store');
  assert.equal(payload.authenticated.refreshable, true);
  assert.equal(stdout.includes('stored-client-123'), false);
});

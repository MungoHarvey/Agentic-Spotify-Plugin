import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { runAuthLoginSession } from '../../src/cli/commands/auth.ts';

function createTempTokenPath() {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'spotify-login-session-'));
  return {
    tempRoot,
    tokenPath: path.join(tempRoot, 'tokens.json'),
  };
}

test('runAuthLoginSession persists normalized token data and emits redacted JSON', async () => {
  const { tokenPath } = createTempTokenPath();
  let openedUrl = '';
  let callbackInput = null;
  let tokenExchangeInput = null;
  let tokenWriterInput = null;
  let stdout = '';
  let stderr = '';

  const exitCode = await runAuthLoginSession({
    json: true,
    env: {
      SPOTIFY_CLIENT_ID: 'client-123',
      SPOTIFY_REDIRECT_URI: 'http://127.0.0.1:43210/callback',
      SPOTIFY_SCOPES: 'scope-a scope-b',
      SPOTIFY_TOKEN_PATH: tokenPath,
    },
    openBrowser: async (url) => {
      openedUrl = url;
    },
    waitForCallback: async (input) => {
      callbackInput = input;
      return {
        code: 'code-123',
        state: 'state-123',
      };
    },
    exchangeAuthorizationCode: async (input) => {
      tokenExchangeInput = input;
      return {
        accessToken: 'access-123',
        refreshToken: 'refresh-123',
        expiresAt: 1700003600000,
        tokenType: 'Bearer',
        scope: ['scope-a', 'scope-b'],
        obtainedAt: 1700000000000,
      };
    },
    writeTokenStore: async (filePath, tokenData) => {
      tokenWriterInput = {
        filePath,
        tokenData,
      };
      writeFileSync(filePath, `${JSON.stringify(tokenData, null, 2)}\n`, 'utf8');
    },
    createCodeVerifier: () => 'verifier-123',
    createOAuthState: () => 'state-123',
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
  assert.equal(openedUrl.startsWith('https://accounts.spotify.com/authorize?'), true);
  assert.deepEqual(callbackInput, {
    expectedState: 'state-123',
    redirectUri: 'http://127.0.0.1:43210/callback',
  });
  assert.deepEqual(tokenExchangeInput, {
    clientId: 'client-123',
    redirectUri: 'http://127.0.0.1:43210/callback',
    code: 'code-123',
    codeVerifier: 'verifier-123',
  });
  assert.deepEqual(tokenWriterInput, {
    filePath: tokenPath,
    tokenData: {
      accessToken: 'access-123',
      refreshToken: 'refresh-123',
      expiresAt: 1700003600000,
      clientId: 'client-123',
      tokenType: 'Bearer',
      scope: ['scope-a', 'scope-b'],
      obtainedAt: 1700000000000,
    },
  });

  const payload = JSON.parse(stdout);

  assert.equal(payload.authorizationUrl.startsWith('https://accounts.spotify.com/authorize?'), true);
  assert.equal(payload.redirectUri, 'http://127.0.0.1:43210/callback');
  assert.deepEqual(payload.scopes, ['scope-a', 'scope-b']);
  assert.equal(payload.state, 'state-123');
  assert.deepEqual(payload.authenticated, {
    authenticated: true,
    expiresAt: 1700003600000,
    scopes: ['scope-a', 'scope-b'],
    clientIdConfigured: true,
    clientIdSource: 'env',
    refreshable: true,
    tokenType: 'Bearer',
    obtainedAt: 1700000000000,
  });
  assert.equal(payload.tokenStorePath, tokenPath);
  assert.equal(stdout.includes('access-123'), false);
  assert.equal(stdout.includes('refresh-123'), false);

  const storedToken = JSON.parse(readFileSync(tokenPath, 'utf8'));
  assert.deepEqual(storedToken, {
    accessToken: 'access-123',
    refreshToken: 'refresh-123',
    expiresAt: 1700003600000,
    clientId: 'client-123',
    tokenType: 'Bearer',
    scope: ['scope-a', 'scope-b'],
    obtainedAt: 1700000000000,
  });
});

test('runAuthLoginSession returns a non-zero exit code and redacted error when callback waiting fails', async () => {
  const { tokenPath } = createTempTokenPath();
  let stdout = '';
  let stderr = '';

  const exitCode = await runAuthLoginSession({
    json: false,
    env: {
      SPOTIFY_CLIENT_ID: 'client-123',
      SPOTIFY_REDIRECT_URI: 'http://127.0.0.1:43210/callback',
      SPOTIFY_TOKEN_PATH: tokenPath,
    },
    openBrowser: async () => {},
    waitForCallback: async () => {
      throw new Error('OAuth state mismatch.');
    },
    exchangeAuthorizationCode: async () => {
      throw new Error('should not exchange');
    },
    writeTokenStore: async () => {},
    createCodeVerifier: () => 'verifier-123',
    createOAuthState: () => 'state-123',
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
  assert.match(stderr, /OAuth state mismatch\./);
  assert.equal(stderr.includes('access-123'), false);
  assert.equal(stderr.includes('refresh-123'), false);
});

test('runAuthLoginSession text output reports a completed persisted login without token values', async () => {
  const { tokenPath } = createTempTokenPath();
  let stdout = '';
  let stderr = '';

  const exitCode = await runAuthLoginSession({
    json: false,
    env: {
      SPOTIFY_CLIENT_ID: 'client-123',
      SPOTIFY_REDIRECT_URI: 'http://127.0.0.1:43210/callback',
      SPOTIFY_TOKEN_PATH: tokenPath,
    },
    openBrowser: async () => {},
    waitForCallback: async () => ({
      code: 'code-123',
      state: 'state-123',
    }),
    exchangeAuthorizationCode: async () => ({
      accessToken: 'access-123',
      refreshToken: 'refresh-123',
      expiresAt: 1700003600000,
      tokenType: 'Bearer',
      scope: ['user-read-private'],
      obtainedAt: 1700000000000,
    }),
    createCodeVerifier: () => 'verifier-123',
    createOAuthState: () => 'state-123',
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
  assert.match(stdout, /Spotify login complete\./);
  assert.equal(stdout.includes('access-123'), false);
  assert.equal(stdout.includes('refresh-123'), false);

  const storedToken = JSON.parse(readFileSync(tokenPath, 'utf8'));

  assert.equal(storedToken.accessToken, 'access-123');
  assert.equal(storedToken.refreshToken, 'refresh-123');
});

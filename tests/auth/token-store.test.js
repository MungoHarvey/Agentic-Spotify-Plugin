import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import {
  createAuthStatus,
  deleteTokenStore,
  readTokenStore,
  writeTokenStore,
} from '../../src/auth/token-store.ts';

function createTempStorePath() {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'spotify-token-store-'));
  return {
    tempRoot,
    storePath: path.join(tempRoot, 'nested', 'tokens.json'),
  };
}

test('readTokenStore returns null when the token file is missing', async () => {
  const { storePath } = createTempStorePath();

  await assert.doesNotReject(async () => {
    const tokenData = await readTokenStore(storePath);

    assert.equal(tokenData, null);
  });
});

test('writeTokenStore creates parent directories and writes formatted JSON', async () => {
  const { storePath, tempRoot } = createTempStorePath();
  const tokenData = {
    accessToken: 'dummy-access-token',
    refreshToken: 'dummy-refresh-token',
    expiresAt: 1234567890,
    tokenType: 'Bearer',
    scope: ['scope-one', 'scope-two'],
    obtainedAt: 1234560000,
  };

  await writeTokenStore(storePath, tokenData);

  assert.equal(
    readFileSync(storePath, 'utf8'),
    [
      '{',
      '  "accessToken": "dummy-access-token",',
      '  "refreshToken": "dummy-refresh-token",',
      '  "expiresAt": 1234567890,',
      '  "tokenType": "Bearer",',
      '  "scope": [',
      '    "scope-one",',
      '    "scope-two"',
      '  ],',
      '  "obtainedAt": 1234560000',
      '}',
      '',
    ].join('\n')
  );

  assert.equal(path.dirname(storePath), path.join(tempRoot, 'nested'));
});

test('readTokenStore reads back the written token data', async () => {
  const { storePath } = createTempStorePath();
  const tokenData = {
    accessToken: 'dummy-access-token',
    refreshToken: 'dummy-refresh-token',
    expiresAt: 1234567890,
    tokenType: 'Bearer',
    scope: ['scope-one', 'scope-two'],
    obtainedAt: 1234560000,
  };

  await writeTokenStore(storePath, tokenData);

  assert.deepEqual(await readTokenStore(storePath), tokenData);
});

test('deleteTokenStore removes the token file and tolerates missing files', async () => {
  const { storePath } = createTempStorePath();
  const tokenData = {
    accessToken: 'dummy-access-token',
    refreshToken: 'dummy-refresh-token',
    expiresAt: 1234567890,
  };

  await writeTokenStore(storePath, tokenData);
  await deleteTokenStore(storePath);

  await assert.doesNotReject(async () => {
    await deleteTokenStore(storePath);
  });

  await assert.rejects(async () => {
    readFileSync(storePath, 'utf8');
  });
});

test('createAuthStatus returns an unauthenticated status when no token data exists', () => {
  assert.deepEqual(createAuthStatus(null), {
    authenticated: false,
    clientIdConfigured: false,
    refreshable: false,
  });
});

test('createAuthStatus returns authenticated metadata without token values', () => {
  const tokenData = {
    accessToken: 'dummy-access-token',
    refreshToken: 'dummy-refresh-token',
    expiresAt: 1234567890,
    clientId: 'dummy-client-id',
    tokenType: 'Bearer',
    scope: ['scope-one', 'scope-two'],
    obtainedAt: 1234560000,
  };

  assert.deepEqual(createAuthStatus(tokenData), {
    authenticated: true,
    expiresAt: 1234567890,
    scopes: ['scope-one', 'scope-two'],
    clientIdConfigured: true,
    clientIdSource: 'token-store',
    refreshable: true,
    tokenType: 'Bearer',
    obtainedAt: 1234560000,
  });

  const serializedStatus = JSON.stringify(createAuthStatus(tokenData));

  assert.equal(serializedStatus.includes('dummy-access-token'), false);
  assert.equal(serializedStatus.includes('dummy-refresh-token'), false);
  assert.equal(serializedStatus.includes('dummy-client-id'), false);
});

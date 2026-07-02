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

test('readTokenStore falls back to the legacy path when the primary file is missing', async () => {
  const { storePath: newStorePath } = createTempStorePath();
  const { storePath: legacyStorePath } = createTempStorePath();
  const tokenData = {
    accessToken: 'legacy-access-token',
    refreshToken: 'legacy-refresh-token',
    expiresAt: 1234567890,
  };

  await writeTokenStore(legacyStorePath, tokenData);

  assert.deepEqual(await readTokenStore(newStorePath, legacyStorePath), tokenData);
});

test('readTokenStore prefers the primary path over the legacy path when both exist', async () => {
  const { storePath: newStorePath } = createTempStorePath();
  const { storePath: legacyStorePath } = createTempStorePath();
  const newTokenData = {
    accessToken: 'new-access-token',
    refreshToken: 'new-refresh-token',
    expiresAt: 1111111111,
  };
  const legacyTokenData = {
    accessToken: 'legacy-access-token',
    refreshToken: 'legacy-refresh-token',
    expiresAt: 2222222222,
  };

  await writeTokenStore(newStorePath, newTokenData);
  await writeTokenStore(legacyStorePath, legacyTokenData);

  assert.deepEqual(await readTokenStore(newStorePath, legacyStorePath), newTokenData);
});

test('readTokenStore returns null when neither the primary nor legacy path has a token file', async () => {
  const { storePath: newStorePath } = createTempStorePath();
  const { storePath: legacyStorePath } = createTempStorePath();

  assert.equal(await readTokenStore(newStorePath, legacyStorePath), null);
});

test('readTokenStore does not modify or delete the legacy file when reading it', async () => {
  const { storePath: newStorePath } = createTempStorePath();
  const { storePath: legacyStorePath } = createTempStorePath();
  const tokenData = {
    accessToken: 'legacy-access-token',
    refreshToken: 'legacy-refresh-token',
    expiresAt: 1234567890,
  };

  await writeTokenStore(legacyStorePath, tokenData);
  await readTokenStore(newStorePath, legacyStorePath);

  assert.deepEqual(JSON.parse(readFileSync(legacyStorePath, 'utf8')), tokenData);
  await assert.rejects(async () => {
    readFileSync(newStorePath, 'utf8');
  });
});

test('createAuthStatus returns an unauthenticated status when no token data exists', () => {
  assert.deepEqual(createAuthStatus(null), {
    authenticated: false,
  });
});

test('createAuthStatus returns authenticated metadata without token values', () => {
  const tokenData = {
    accessToken: 'dummy-access-token',
    refreshToken: 'dummy-refresh-token',
    expiresAt: 1234567890,
    tokenType: 'Bearer',
    scope: ['scope-one', 'scope-two'],
    obtainedAt: 1234560000,
  };

  assert.deepEqual(createAuthStatus(tokenData), {
    authenticated: true,
    expiresAt: 1234567890,
    scopes: ['scope-one', 'scope-two'],
    tokenType: 'Bearer',
    obtainedAt: 1234560000,
  });

  const serializedStatus = JSON.stringify(createAuthStatus(tokenData));

  assert.equal(serializedStatus.includes('dummy-access-token'), false);
  assert.equal(serializedStatus.includes('dummy-refresh-token'), false);
});

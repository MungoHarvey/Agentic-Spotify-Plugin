import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

const repoRoot = new URL('../../', import.meta.url);
const cliEntry = new URL('../../src/cli/index.ts', import.meta.url).href;

function runCli(args, env = {}) {
  const code = `
    const { main } = await import(${JSON.stringify(cliEntry)});
    process.exitCode = await main(${JSON.stringify(args)});
  `;

  return spawnSync(process.execPath, ['--input-type=module', '--eval', code], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      ...env,
    },
  });
}

function createTempTokenPath() {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'spotify-cli-auth-'));
  const tokenDir = path.join(tempRoot, 'nested');

  mkdirSync(tokenDir, { recursive: true });

  return {
    tempRoot,
    tokenPath: path.join(tokenDir, 'tokens.json'),
  };
}

test('spotify auth status --json reports unauthenticated when the token file is missing', () => {
  const { tokenPath } = createTempTokenPath();
  const result = runCli(['auth', 'status', '--json'], {
    SPOTIFY_TOKEN_PATH: tokenPath,
  });

  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  assert.deepEqual(JSON.parse(result.stdout), {
    authenticated: false,
  });
});

test('spotify auth status --json reports authenticated metadata without token values', () => {
  const { tokenPath } = createTempTokenPath();
  const tokenData = {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    expiresAt: 1234567890,
    tokenType: 'Bearer',
    scope: ['playlist-read-private', 'user-read-private'],
    obtainedAt: 1234560000,
  };

  writeFileSync(tokenPath, `${JSON.stringify(tokenData, null, 2)}\n`, 'utf8');

  const result = runCli(['auth', 'status', '--json'], {
    SPOTIFY_TOKEN_PATH: tokenPath,
  });

  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  assert.deepEqual(JSON.parse(result.stdout), {
    authenticated: true,
    expiresAt: 1234567890,
    scopes: ['playlist-read-private', 'user-read-private'],
    tokenType: 'Bearer',
    obtainedAt: 1234560000,
  });
  assert.equal(result.stdout.includes(tokenData.accessToken), false);
  assert.equal(result.stdout.includes(tokenData.refreshToken), false);
});

test('spotify auth status text output never includes token values', () => {
  const { tokenPath } = createTempTokenPath();
  const tokenData = {
    accessToken: 'text-access-token',
    refreshToken: 'text-refresh-token',
    expiresAt: 1234567890,
    tokenType: 'Bearer',
    scope: ['playlist-read-private'],
    obtainedAt: 1234560000,
  };

  writeFileSync(tokenPath, `${JSON.stringify(tokenData, null, 2)}\n`, 'utf8');

  const result = runCli(['auth', 'status'], {
    SPOTIFY_TOKEN_PATH: tokenPath,
  });

  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  assert.equal(result.stdout.includes(tokenData.accessToken), false);
  assert.equal(result.stdout.includes(tokenData.refreshToken), false);
  assert.equal(result.stdout.includes('authenticated'), true);
});

test('spotify auth logout deletes the token file and succeeds when it is already absent', () => {
  const { tokenPath } = createTempTokenPath();
  const tokenData = {
    accessToken: 'logout-access-token',
    refreshToken: 'logout-refresh-token',
    expiresAt: 1234567890,
  };

  writeFileSync(tokenPath, `${JSON.stringify(tokenData, null, 2)}\n`, 'utf8');

  const firstResult = runCli(['auth', 'logout'], {
    SPOTIFY_TOKEN_PATH: tokenPath,
  });

  assert.equal(firstResult.status, 0);
  assert.equal(firstResult.stderr, '');
  assert.equal(existsSync(tokenPath), false);

  const secondResult = runCli(['auth', 'logout'], {
    SPOTIFY_TOKEN_PATH: tokenPath,
  });

  assert.equal(secondResult.status, 0);
  assert.equal(secondResult.stderr, '');
  assert.equal(existsSync(tokenPath), false);
});

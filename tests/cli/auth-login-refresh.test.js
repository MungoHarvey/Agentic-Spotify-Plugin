import assert from 'node:assert/strict';
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

test('spotify auth login --url-only --json returns a local authorization URL payload', () => {
  const result = runCli(['auth', 'login', '--url-only', '--json'], {
    SPOTIFY_CLIENT_ID: 'client-123',
    SPOTIFY_REDIRECT_URI: 'http://127.0.0.1:43210/callback',
    SPOTIFY_SCOPES: 'scope-a scope-b',
  });

  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');

  const payload = JSON.parse(result.stdout);
  const authorizationUrl = new URL(payload.authorizationUrl);

  assert.deepEqual(
    {
      redirectUri: payload.redirectUri,
      scopes: payload.scopes,
      state: payload.state,
    },
    {
    redirectUri: 'http://127.0.0.1:43210/callback',
    scopes: ['scope-a', 'scope-b'],
    state: payload.state,
    },
  );
  assert.equal(authorizationUrl.origin, 'https://accounts.spotify.com');
  assert.equal(authorizationUrl.pathname, '/authorize');
  assert.equal(authorizationUrl.searchParams.get('response_type'), 'code');
  assert.equal(authorizationUrl.searchParams.get('client_id'), 'client-123');
  assert.equal(
    authorizationUrl.searchParams.get('redirect_uri'),
    'http://127.0.0.1:43210/callback',
  );
  assert.equal(authorizationUrl.searchParams.get('scope'), 'scope-a scope-b');
  assert.equal(authorizationUrl.searchParams.get('state'), payload.state);
  assert.equal(authorizationUrl.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(typeof authorizationUrl.searchParams.get('code_challenge') === 'string', true);
});

test('spotify auth login --url-only prints the authorization URL and no token values', () => {
  const result = runCli(['auth', 'login', '--url-only'], {
    SPOTIFY_CLIENT_ID: 'client-123',
  });

  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  assert.equal(result.stdout.includes('https://accounts.spotify.com/authorize'), true);
  assert.equal(/token|secret/.test(result.stdout), false);
});

test('spotify auth login --url-only fails clearly when SPOTIFY_CLIENT_ID is missing', () => {
  const result = runCli(['auth', 'login', '--url-only'], {});

  assert.notEqual(result.status, 0);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /Missing required environment variable SPOTIFY_CLIENT_ID\./);
});

test('spotify auth refresh fails clearly when unauthenticated', () => {
  const result = runCli(['auth', 'refresh'], {
    SPOTIFY_CLIENT_ID: 'client-123',
  });

  assert.notEqual(result.status, 0);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /Unauthenticated\. Run spotify auth login first\./);
});

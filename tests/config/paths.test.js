import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';

import { APP_NAME, TOKEN_STORE_FILE, getDefaultTokenStorePath } from '../../src/config/paths.ts';

const repoRoot = 'C:\\Users\\mharvey2\\Documents\\Coding\\spotify-plugin';

test('getDefaultTokenStorePath uses APPDATA on Windows-like env input', () => {
  const appData = 'C:\\Users\\mharvey2\\AppData\\Roaming';

  const tokenPath = getDefaultTokenStorePath(
    {
      APPDATA: appData,
      HOME: 'C:\\Users\\mharvey2',
    },
    repoRoot
  );

  assert.equal(
    tokenPath,
    path.win32.join(appData, APP_NAME, TOKEN_STORE_FILE)
  );
});

test('getDefaultTokenStorePath falls back to a home config path when APPDATA is absent', () => {
  const homeDir = 'C:\\Users\\mharvey2';

  const tokenPath = getDefaultTokenStorePath(
    {
      HOME: homeDir,
    },
    repoRoot
  );

  assert.equal(
    tokenPath,
    path.win32.join(homeDir, '.config', APP_NAME, TOKEN_STORE_FILE)
  );
});

test('getDefaultTokenStorePath avoids repo-root paths when APPDATA points into the repository', () => {
  const tokenPath = getDefaultTokenStorePath(
    {
      APPDATA: path.win32.join(repoRoot, 'AppData', 'Roaming'),
      HOME: 'C:\\Users\\mharvey2',
    },
    repoRoot
  );

  assert.equal(
    tokenPath,
    path.win32.join('C:\\Users\\mharvey2', '.config', APP_NAME, TOKEN_STORE_FILE)
  );
  assert.equal(path.win32.relative(repoRoot, tokenPath).startsWith('..'), true);
});

import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';

import {
  APP_NAME,
  LEGACY_APP_NAME,
  TOKEN_STORE_FILE,
  getDefaultTokenStorePath,
  getLegacyTokenStorePath,
  resolveTokenStorePathSync,
} from '../../src/config/paths.ts';

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

test('APP_NAME uses the renamed spotify-plugin directory', () => {
  assert.equal(APP_NAME, 'spotify-plugin');
});

test('LEGACY_APP_NAME retains the pre-rename spotify-codex-plugin directory name', () => {
  assert.equal(LEGACY_APP_NAME, 'spotify-codex-plugin');
});

test('getLegacyTokenStorePath resolves to the legacy directory under APPDATA', () => {
  const appData = 'C:\\Users\\mharvey2\\AppData\\Roaming';

  const legacyPath = getLegacyTokenStorePath(
    {
      APPDATA: appData,
      HOME: 'C:\\Users\\mharvey2',
    },
    repoRoot
  );

  assert.equal(
    legacyPath,
    path.win32.join(appData, LEGACY_APP_NAME, TOKEN_STORE_FILE)
  );
});

test('getLegacyTokenStorePath resolves to the legacy directory under the home config path', () => {
  const homeDir = 'C:\\Users\\mharvey2';

  const legacyPath = getLegacyTokenStorePath(
    {
      HOME: homeDir,
    },
    repoRoot
  );

  assert.equal(
    legacyPath,
    path.win32.join(homeDir, '.config', LEGACY_APP_NAME, TOKEN_STORE_FILE)
  );
});

test('getDefaultTokenStorePath and getLegacyTokenStorePath resolve to different directories', () => {
  const env = {
    APPDATA: 'C:\\Users\\mharvey2\\AppData\\Roaming',
    HOME: 'C:\\Users\\mharvey2',
  };

  const defaultPath = getDefaultTokenStorePath(env, repoRoot);
  const legacyPath = getLegacyTokenStorePath(env, repoRoot);

  assert.notEqual(defaultPath, legacyPath);
});

test('resolveTokenStorePathSync returns the new path when a token file exists there', () => {
  const env = {
    APPDATA: 'C:\\Users\\mharvey2\\AppData\\Roaming',
    HOME: 'C:\\Users\\mharvey2',
  };
  const defaultPath = getDefaultTokenStorePath(env, repoRoot);
  const legacyPath = getLegacyTokenStorePath(env, repoRoot);

  const resolvedPath = resolveTokenStorePathSync(
    env,
    repoRoot,
    (candidatePath) => candidatePath === defaultPath || candidatePath === legacyPath
  );

  assert.equal(resolvedPath, defaultPath);
});

test('resolveTokenStorePathSync falls back to the legacy path when only it exists', () => {
  const env = {
    APPDATA: 'C:\\Users\\mharvey2\\AppData\\Roaming',
    HOME: 'C:\\Users\\mharvey2',
  };
  const legacyPath = getLegacyTokenStorePath(env, repoRoot);

  const resolvedPath = resolveTokenStorePathSync(env, repoRoot, (candidatePath) => candidatePath === legacyPath);

  assert.equal(resolvedPath, legacyPath);
});

test('resolveTokenStorePathSync returns the new path when neither location has a token file', () => {
  const env = {
    APPDATA: 'C:\\Users\\mharvey2\\AppData\\Roaming',
    HOME: 'C:\\Users\\mharvey2',
  };
  const defaultPath = getDefaultTokenStorePath(env, repoRoot);

  const resolvedPath = resolveTokenStorePathSync(env, repoRoot, () => false);

  assert.equal(resolvedPath, defaultPath);
});

test('resolveTokenStorePathSync defaults to the real fs.existsSync when no override is supplied', () => {
  const resolvedPath = resolveTokenStorePathSync();

  assert.equal(typeof resolvedPath, 'string');
  assert.equal(resolvedPath.length > 0, true);
});

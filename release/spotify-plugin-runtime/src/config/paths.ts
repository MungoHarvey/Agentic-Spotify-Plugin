declare const process: {
  env: Record<string, string | undefined>;
  cwd(): string;
};

// @ts-ignore - Node types are not wired into this scaffold yet.
import { existsSync } from 'node:fs';
// @ts-ignore - Node types are not wired into this scaffold yet.
import os from 'node:os';
// @ts-ignore - Node types are not wired into this scaffold yet.
import path from 'node:path';

export const REPO_ROOT_NAME = 'spotify-plugin';
export const APP_NAME = 'spotify-plugin';
export const TOKEN_STORE_DIR = APP_NAME;
// Legacy directory name used before the plugin was renamed from
// "spotify-codex-plugin" to "spotify-plugin". Kept so token files written by
// older installs can still be found (read-only fallback; never written to).
export const LEGACY_APP_NAME = 'spotify-codex-plugin';
export const TOKEN_STORE_FILE = 'tokens.json';

type TokenStoreEnv = {
  APPDATA?: string;
  HOME?: string;
  USERPROFILE?: string;
};

function isInsidePath(candidatePath: string, parentPath: string): boolean {
  const relativePath = path.relative(path.resolve(parentPath), path.resolve(candidatePath));

  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
}

function getHomeDirectory(env: TokenStoreEnv): string {
  return env.HOME?.trim() || env.USERPROFILE?.trim() || os.homedir();
}

function getHomeConfigTokenStorePath(env: TokenStoreEnv, appName: string): string {
  return path.join(getHomeDirectory(env), '.config', appName, TOKEN_STORE_FILE);
}

export function getDefaultTokenStorePath(
  env: TokenStoreEnv,
  repoRoot: string,
  appName: string = APP_NAME
): string {
  const appData = env.APPDATA?.trim();

  if (appData) {
    const candidatePath = path.join(appData, appName, TOKEN_STORE_FILE);

    if (!isInsidePath(candidatePath, repoRoot)) {
      return candidatePath;
    }
  }

  return getHomeConfigTokenStorePath(env, appName);
}

// Resolves the legacy (pre-rename) token store path so callers can fall back
// to it when the new location has no token file yet.
export function getLegacyTokenStorePath(env: TokenStoreEnv, repoRoot: string): string {
  return getDefaultTokenStorePath(env, repoRoot, LEGACY_APP_NAME);
}

export function getTokenStorePathHint(): string {
  return getDefaultTokenStorePath(process.env, process.cwd());
}

export function getLegacyTokenStorePathHint(): string {
  return getLegacyTokenStorePath(process.env, process.cwd());
}

// Resolves the token store path that should be used for both reads and
// writes: the new (spotify-plugin) location if a token file already exists
// there, otherwise the legacy (spotify-codex-plugin) location if a token
// file exists there, otherwise the new location (so first-time logins land
// in the new directory). `existsSyncImpl`/`env`/`repoRoot` are injectable so
// this stays hermetically testable.
export function resolveTokenStorePathSync(
  env: TokenStoreEnv = process.env,
  repoRoot: string = process.cwd(),
  existsSyncImpl: (candidatePath: string) => boolean = existsSync
): string {
  const newPath = getDefaultTokenStorePath(env, repoRoot);

  if (existsSyncImpl(newPath)) {
    return newPath;
  }

  const legacyPath = getLegacyTokenStorePath(env, repoRoot);

  if (existsSyncImpl(legacyPath)) {
    return legacyPath;
  }

  return newPath;
}

export function getRedirectUri(): string {
  return process.env.SPOTIFY_REDIRECT_URI ?? 'http://127.0.0.1:43210/callback';
}

export function getClientId(): string | undefined {
  return process.env.SPOTIFY_CLIENT_ID;
}

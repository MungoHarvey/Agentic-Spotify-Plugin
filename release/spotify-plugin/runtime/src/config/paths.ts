declare const process: {
  env: Record<string, string | undefined>;
  cwd(): string;
};

// @ts-ignore - Node types are not wired into this scaffold yet.
import os from 'node:os';
// @ts-ignore - Node types are not wired into this scaffold yet.
import path from 'node:path';

export const REPO_ROOT_NAME = 'spotify-plugin';
export const APP_NAME = 'spotify-codex-plugin';
export const TOKEN_STORE_DIR = 'spotify-codex-plugin';
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

function getHomeConfigTokenStorePath(env: TokenStoreEnv): string {
  return path.join(getHomeDirectory(env), '.config', APP_NAME, TOKEN_STORE_FILE);
}

export function getDefaultTokenStorePath(env: TokenStoreEnv, repoRoot: string): string {
  const appData = env.APPDATA?.trim();

  if (appData) {
    const candidatePath = path.join(appData, APP_NAME, TOKEN_STORE_FILE);

    if (!isInsidePath(candidatePath, repoRoot)) {
      return candidatePath;
    }
  }

  return getHomeConfigTokenStorePath(env);
}

export function getTokenStorePathHint(): string {
  return getDefaultTokenStorePath(process.env, process.cwd());
}

export function getRedirectUri(): string {
  return process.env.SPOTIFY_REDIRECT_URI ?? 'http://127.0.0.1:43210/callback';
}

export function getClientId(): string | undefined {
  return process.env.SPOTIFY_CLIENT_ID;
}

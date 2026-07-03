// @ts-ignore - Node types are not wired into this scaffold yet.
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
// @ts-ignore - Node types are not wired into this scaffold yet.
import path from 'node:path';

import type { StoredTokenData } from './tokens.ts';
// @ts-ignore - Importing local TS modules directly is how this scaffold runs under NodeNext.
import { resolveSpotifyClientId, type SpotifyEnv } from '../config/env.ts';

export type AuthStatus =
  | {
      authenticated: false;
      clientIdConfigured: boolean;
      clientIdSource?: 'env' | 'token-store';
      refreshable: false;
    }
  | {
      authenticated: true;
      expiresAt: number;
      scopes: string[];
      clientIdConfigured: boolean;
      clientIdSource?: 'env' | 'token-store';
      refreshable: boolean;
      tokenType?: string;
      obtainedAt?: number;
    };

export async function readTokenStore(filePath: string): Promise<StoredTokenData | null> {
  try {
    const fileContents = await readFile(filePath, 'utf8');
    return JSON.parse(fileContents) as StoredTokenData;
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: string }).code === 'ENOENT'
    ) {
      return null;
    }

    throw error;
  }
}

export async function writeTokenStore(filePath: string, tokenData: StoredTokenData): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(tokenData, null, 2)}\n`, 'utf8');
}

export async function deleteTokenStore(filePath: string): Promise<void> {
  await rm(filePath, { force: true });
}

export function createAuthStatus(tokenData: StoredTokenData | null, env: SpotifyEnv = {}): AuthStatus {
  let clientIdSource: 'env' | 'token-store' | undefined;

  try {
    clientIdSource = resolveSpotifyClientId(env, tokenData?.clientId).source;
  } catch {
    clientIdSource = undefined;
  }

  if (!tokenData) {
    return {
      authenticated: false,
      clientIdConfigured: clientIdSource !== undefined,
      ...(clientIdSource ? { clientIdSource } : {}),
      refreshable: false,
    };
  }

  return {
    authenticated: true,
    expiresAt: tokenData.expiresAt,
    scopes: tokenData.scope ?? [],
    clientIdConfigured: clientIdSource !== undefined,
    ...(clientIdSource ? { clientIdSource } : {}),
    refreshable: clientIdSource !== undefined && tokenData.refreshToken.trim().length > 0,
    tokenType: tokenData.tokenType,
    obtainedAt: tokenData.obtainedAt,
  };
}

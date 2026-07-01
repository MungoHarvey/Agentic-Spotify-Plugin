// @ts-ignore - Node types are not wired into this scaffold yet.
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
// @ts-ignore - Node types are not wired into this scaffold yet.
import path from 'node:path';

import type { StoredTokenData } from './tokens.ts';

export type AuthStatus =
  | {
      authenticated: false;
    }
  | {
      authenticated: true;
      expiresAt: number;
      scopes: string[];
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

export function createAuthStatus(tokenData: StoredTokenData | null): AuthStatus {
  if (!tokenData) {
    return {
      authenticated: false,
    };
  }

  return {
    authenticated: true,
    expiresAt: tokenData.expiresAt,
    scopes: tokenData.scope ?? [],
    tokenType: tokenData.tokenType,
    obtainedAt: tokenData.obtainedAt,
  };
}

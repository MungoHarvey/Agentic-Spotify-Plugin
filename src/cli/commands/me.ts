// @ts-ignore - Node types are not wired into this scaffold yet.
import { readTokenStore, writeTokenStore as persistTokenStore } from '../../auth/token-store.ts';
// @ts-ignore - Node types are not wired into this scaffold yet.
import { refreshAccessToken } from '../../auth/token-exchange.ts';
// @ts-ignore - Node types are not wired into this scaffold yet.
import { loadSpotifyConfig, resolveSpotifyClientId } from '../../config/env.ts';
// @ts-ignore - Node types are not wired into this scaffold yet.
import { getTokenStorePathHint } from '../../config/paths.ts';
// @ts-ignore - Node types are not wired into this scaffold yet.
import { createSpotifyClient } from '../../spotify/client.ts';
// @ts-ignore - Node types are not wired into this scaffold yet.
import { getCurrentUser } from '../../spotify/account.ts';
// @ts-ignore - Node types are not wired into this scaffold yet.
import type { StoredTokenData } from '../../auth/tokens.ts';

declare const fetch: {
  (...args: any[]): Promise<any>;
};

declare const process: {
  argv: string[];
  env: Record<string, string | undefined>;
  stdout: {
    write(value: string): void;
  };
  stderr: {
    write(value: string): void;
  };
};

type MeCliEnv = Record<string, string | undefined>;

type MeSessionOptions = {
  json: boolean;
  env: MeCliEnv;
  tokenStorePath?: string;
  readTokenStore?: (filePath: string) => Promise<StoredTokenData | null>;
  writeTokenStore?: (filePath: string, tokenData: StoredTokenData) => Promise<void>;
  refreshAccessToken?: (input: {
    clientId: string;
    refreshToken: string;
    fetchImpl: typeof fetch;
  }) => Promise<StoredTokenData>;
  createSpotifyClient?: typeof createSpotifyClient;
  loadSpotifyConfig?: (env: MeCliEnv) => ReturnType<typeof loadSpotifyConfig>;
  getTokenStorePath?: (env: MeCliEnv) => string;
  fetchImpl?: typeof fetch;
  stdout?: {
    write(value: string): void;
  };
  stderr?: {
    write(value: string): void;
  };
};

function getTokenStorePath(env: MeCliEnv): string {
  return env.SPOTIFY_TOKEN_PATH?.trim() || getTokenStorePathHint();
}

function writeMeError(message: string, stderr = process.stderr): number {
  stderr.write(`${message}\n`);
  return 1;
}

function mergeRefreshedTokenData(
  currentTokenData: StoredTokenData,
  refreshedTokenData: StoredTokenData,
): StoredTokenData {
  const refreshToken = refreshedTokenData.refreshToken.trim() || currentTokenData.refreshToken.trim();

  if (!refreshToken) {
    throw new Error('Stored token data is missing a refresh token.');
  }

  return {
    ...refreshedTokenData,
    refreshToken,
    ...(currentTokenData.clientId ? { clientId: currentTokenData.clientId } : {}),
  };
}

function formatMeText(user: Record<string, unknown>): string {
  const lines = ['Spotify account details'];

  if (typeof user.id === 'string') {
    lines.push(`ID: ${user.id}`);
  }

  if (typeof user.displayName === 'string') {
    lines.push(`Display name: ${user.displayName}`);
  }

  if (typeof user.country === 'string') {
    lines.push(`Country: ${user.country}`);
  }

  if (typeof user.product === 'string') {
    lines.push(`Product: ${user.product}`);
  }

  if (typeof user.uri === 'string') {
    lines.push(`URI: ${user.uri}`);
  }

  return `${lines.join('\n')}\n`;
}

async function runMeSessionInternal({
  json,
  env,
  tokenStorePath,
  readTokenStore: readStore = readTokenStore,
  writeTokenStore: writeStore = persistTokenStore,
  refreshAccessToken: refreshTokenExchange = refreshAccessToken,
  createSpotifyClient: buildClient = createSpotifyClient,
  loadSpotifyConfig: loadConfig = loadSpotifyConfig,
  getTokenStorePath: getStorePath = getTokenStorePath,
  fetchImpl = fetch,
  stdout = process.stdout,
  stderr = process.stderr,
}: MeSessionOptions): Promise<number> {
  try {
    const tokenPath = tokenStorePath?.trim() || getStorePath(env);
    let tokenData = await readStore(tokenPath);

    if (!tokenData) {
      throw new Error('Unauthenticated. Run spotify auth login first.');
    }

    const client = buildClient({
      fetchImpl,
      readTokenData: async () => tokenData,
      refreshTokenData: async (currentTokenData) => {
        const refreshToken = currentTokenData.refreshToken.trim();

        if (!refreshToken) {
          throw new Error('Stored token data is missing a refresh token.');
        }

        const clientId = resolveSpotifyClientId(env, currentTokenData.clientId).clientId;
        const refreshedTokenData = await refreshTokenExchange({
          clientId,
          refreshToken,
          fetchImpl,
        });
        const mergedTokenData = mergeRefreshedTokenData(currentTokenData, refreshedTokenData);

        tokenData = mergedTokenData;
        return mergedTokenData;
      },
      writeTokenData: async (updatedTokenData) => {
        tokenData = updatedTokenData;
        await writeStore(tokenPath, updatedTokenData);
      },
    });

    const user = await getCurrentUser(client);

    if (json) {
      stdout.write(`${JSON.stringify(user)}\n`);
    } else {
      stdout.write(formatMeText(user));
    }

    return 0;
  } catch (error) {
    return writeMeError(error instanceof Error ? error.message : 'Spotify me failed.', stderr);
  }
}

export async function runMeSession(options: MeSessionOptions): Promise<number> {
  return runMeSessionInternal(options);
}

function detectJsonFlag(argv: string[]): boolean {
  return argv.includes('--json');
}

export async function runMeCommand(json = detectJsonFlag(process.argv), env = process.env): Promise<number> {
  return runMeSession({
    json,
    env,
  });
}

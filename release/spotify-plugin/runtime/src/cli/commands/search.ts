// @ts-ignore - Node types are not wired into this scaffold yet.
import { readTokenStore, writeTokenStore as persistTokenStore } from '../../auth/token-store.ts';
// @ts-ignore - Node types are not wired into this scaffold yet.
import { refreshAccessToken } from '../../auth/token-exchange.ts';
// @ts-ignore - Node types are not wired into this scaffold yet.
import { loadSpotifyConfig } from '../../config/env.ts';
// @ts-ignore - Node types are not wired into this scaffold yet.
import { getTokenStorePathHint, resolveTokenStorePathSync } from '../../config/paths.ts';
// @ts-ignore - Node types are not wired into this scaffold yet.
import { createSpotifyClient } from '../../spotify/client.ts';
// @ts-ignore - Node types are not wired into this scaffold yet.
import { resolveTrack, searchTracks } from '../../spotify/search.ts';
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

type SearchCliEnv = Record<string, string | undefined>;

type SearchSessionOptions = {
  json: boolean;
  action: 'search-track' | 'resolve-track';
  query: string;
  limit?: number;
  env: SearchCliEnv;
  tokenStorePath?: string;
  readTokenStore?: (filePath: string) => Promise<StoredTokenData | null>;
  writeTokenStore?: (filePath: string, tokenData: StoredTokenData) => Promise<void>;
  refreshAccessToken?: (input: {
    clientId: string;
    refreshToken: string;
    fetchImpl: typeof fetch;
  }) => Promise<StoredTokenData>;
  createSpotifyClient?: typeof createSpotifyClient;
  loadSpotifyConfig?: (env: SearchCliEnv) => ReturnType<typeof loadSpotifyConfig>;
  getTokenStorePath?: (env: SearchCliEnv) => string;
  fetchImpl?: typeof fetch;
  stdout?: {
    write(value: string): void;
  };
  stderr?: {
    write(value: string): void;
  };
};

function getTokenStorePath(env: SearchCliEnv): string {
  return env.SPOTIFY_TOKEN_PATH?.trim() || resolveTokenStorePathSync();
}

function writeSearchError(message: string, stderr = process.stderr): number {
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
  };
}

async function runSearchSessionInternal({
  json,
  action,
  query,
  limit,
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
}: SearchSessionOptions): Promise<number> {
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

        const config = loadConfig(env);
        const refreshedTokenData = await refreshTokenExchange({
          clientId: config.clientId,
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

    const payload =
      action === 'resolve-track'
        ? await resolveTrack(client, { query, limit })
        : await searchTracks(client, { query, limit });

    if (json) {
      stdout.write(`${JSON.stringify(payload)}\n`);
    } else {
      stdout.write(action === 'resolve-track' ? `Spotify track resolution\n` : `Spotify track search\n`);
    }

    return 0;
  } catch (error) {
    return writeSearchError(error instanceof Error ? error.message : 'Spotify search command failed.', stderr);
  }
}

function detectJsonFlag(argv: string[]): boolean {
  return argv.includes('--json');
}

function readOptionValue(argv: string[], optionName: string): string | undefined {
  const optionIndex = argv.indexOf(optionName);

  if (optionIndex === -1) {
    return undefined;
  }

  const value = argv[optionIndex + 1]?.trim();

  return value && !value.startsWith('--') ? value : undefined;
}

function readPositionalValues(argv: string[]): string[] {
  const values = [];

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value.startsWith('--')) {
      index += 1;
      continue;
    }

    values.push(value);
  }

  return values;
}

function readLimit(argv: string[]): number | undefined {
  const value = readOptionValue(argv, '--limit');

  return value === undefined ? undefined : Number(value);
}

export async function runSearchCommand(argv: string[], env = process.env): Promise<number> {
  const [entity, ...rest] = argv;

  if (entity !== 'track') {
    process.stdout.write('Unknown search command.\n');
    return 1;
  }

  const query = readPositionalValues(rest).join(' ').trim();

  if (!query) {
    return writeSearchError('Search query is required.');
  }

  return runSearchSessionInternal({
    json: detectJsonFlag(rest),
    action: 'search-track',
    query,
    limit: readLimit(rest),
    env,
  });
}

export async function runResolveCommand(argv: string[], env = process.env): Promise<number> {
  const [entity, ...rest] = argv;

  if (entity !== 'track') {
    process.stdout.write('Unknown resolve command.\n');
    return 1;
  }

  const query = readPositionalValues(rest).join(' ').trim();

  if (!query) {
    return writeSearchError('Search query is required.');
  }

  return runSearchSessionInternal({
    json: detectJsonFlag(rest),
    action: 'resolve-track',
    query,
    limit: readLimit(rest),
    env,
  });
}

// @ts-ignore - Node types are not wired into this scaffold yet.
import { readTokenStore, writeTokenStore as persistTokenStore } from '../../auth/token-store.ts';
// @ts-ignore - Node types are not wired into this scaffold yet.
import { refreshAccessToken } from '../../auth/token-exchange.ts';
// @ts-ignore - Node types are not wired into this scaffold yet.
import { loadSpotifyConfig } from '../../config/env.ts';
// @ts-ignore - Node types are not wired into this scaffold yet.
import { getTokenStorePathHint } from '../../config/paths.ts';
// @ts-ignore - Node types are not wired into this scaffold yet.
import { createSpotifyClient } from '../../spotify/client.ts';
// @ts-ignore - Node types are not wired into this scaffold yet.
import { getAllCurrentUserPlaylists, getCurrentUserPlaylists } from '../../spotify/playlists.ts';
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

type PlaylistsCliEnv = Record<string, string | undefined>;

type PlaylistsSessionOptions = {
  json: boolean;
  all?: boolean;
  env: PlaylistsCliEnv;
  tokenStorePath?: string;
  readTokenStore?: (filePath: string) => Promise<StoredTokenData | null>;
  writeTokenStore?: (filePath: string, tokenData: StoredTokenData) => Promise<void>;
  refreshAccessToken?: (input: {
    clientId: string;
    refreshToken: string;
    fetchImpl: typeof fetch;
  }) => Promise<StoredTokenData>;
  createSpotifyClient?: typeof createSpotifyClient;
  loadSpotifyConfig?: (env: PlaylistsCliEnv) => ReturnType<typeof loadSpotifyConfig>;
  getTokenStorePath?: (env: PlaylistsCliEnv) => string;
  fetchImpl?: typeof fetch;
  stdout?: {
    write(value: string): void;
  };
  stderr?: {
    write(value: string): void;
  };
};

function getTokenStorePath(env: PlaylistsCliEnv): string {
  return env.SPOTIFY_TOKEN_PATH?.trim() || getTokenStorePathHint();
}

function writePlaylistsError(message: string, stderr = process.stderr): number {
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

async function runPlaylistsListSessionInternal({
  json,
  all = false,
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
}: PlaylistsSessionOptions): Promise<number> {
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

    const page = all ? await getAllCurrentUserPlaylists(client) : await getCurrentUserPlaylists(client);

    if (json) {
      stdout.write(`${JSON.stringify(page)}\n`);
    } else {
      stdout.write('Spotify playlists\n');
    }

    return 0;
  } catch (error) {
    return writePlaylistsError(error instanceof Error ? error.message : 'Spotify playlists list failed.', stderr);
  }
}

export async function runPlaylistsListSession(options: PlaylistsSessionOptions): Promise<number> {
  return runPlaylistsListSessionInternal(options);
}

function detectJsonFlag(argv: string[]): boolean {
  return argv.includes('--json');
}

export async function runPlaylistsCommand(argv: string[], env = process.env): Promise<number> {
  const [command, ...rest] = argv;

  if (command === 'list') {
    return runPlaylistsListSession({
      json: detectJsonFlag(rest),
      all: rest.includes('--all'),
      env,
    });
  }

  process.stdout.write('Unknown playlists command.\n');
  return 1;
}

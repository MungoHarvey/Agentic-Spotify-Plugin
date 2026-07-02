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
import { addManyToQueue, getQueue } from '../../spotify/queue.ts';
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

type QueueCliEnv = Record<string, string | undefined>;

type QueueSessionOptions = {
  json: boolean;
  action?: 'get' | 'add-many';
  uris?: string[];
  deviceId?: string;
  env: QueueCliEnv;
  tokenStorePath?: string;
  readTokenStore?: (filePath: string) => Promise<StoredTokenData | null>;
  writeTokenStore?: (filePath: string, tokenData: StoredTokenData) => Promise<void>;
  refreshAccessToken?: (input: {
    clientId: string;
    refreshToken: string;
    fetchImpl: typeof fetch;
  }) => Promise<StoredTokenData>;
  createSpotifyClient?: typeof createSpotifyClient;
  loadSpotifyConfig?: (env: QueueCliEnv) => ReturnType<typeof loadSpotifyConfig>;
  getTokenStorePath?: (env: QueueCliEnv) => string;
  fetchImpl?: typeof fetch;
  stdout?: {
    write(value: string): void;
  };
  stderr?: {
    write(value: string): void;
  };
};

function getTokenStorePath(env: QueueCliEnv): string {
  return env.SPOTIFY_TOKEN_PATH?.trim() || getTokenStorePathHint();
}

function writeQueueError(message: string, stderr = process.stderr): number {
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

async function runQueueSessionInternal({
  json,
  action = 'get',
  uris = [],
  deviceId,
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
}: QueueSessionOptions): Promise<number> {
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
      action === 'add-many'
        ? await addManyToQueue(client, { uris, deviceId })
        : await getQueue(client);

    if (json) {
      stdout.write(`${JSON.stringify(payload)}\n`);
    } else {
      stdout.write(action === 'add-many' ? `Spotify queue updated\n` : `Spotify queue\n`);
    }

    return 0;
  } catch (error) {
    return writeQueueError(error instanceof Error ? error.message : 'Spotify queue command failed.', stderr);
  }
}

export async function runQueueGetSession(options: QueueSessionOptions): Promise<number> {
  return runQueueSessionInternal({ ...options, action: 'get' });
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

export async function runQueueCommand(argv: string[], env = process.env): Promise<number> {
  const [command, ...rest] = argv;

  if (command === 'get') {
    return runQueueGetSession({
      json: detectJsonFlag(rest),
      env,
    });
  }

  if (command === 'add' || command === 'add-many') {
    const uris = readPositionalValues(rest);

    if (uris.length === 0) {
      return writeQueueError(
        command === 'add'
          ? 'Queue add requires a Spotify track or episode URI.'
          : 'Queue add-many requires at least one Spotify track or episode URI.',
      );
    }

    return runQueueSessionInternal({
      json: detectJsonFlag(rest),
      action: 'add-many',
      uris: command === 'add' ? [uris[0]] : uris,
      deviceId: readOptionValue(rest, '--device-id'),
      env,
    });
  }

  process.stdout.write('Unknown queue command.\n');
  return 1;
}

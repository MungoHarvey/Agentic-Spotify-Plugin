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
import { getCurrentlyPlaying, getPlaybackState, getPlayerDevices } from '../../spotify/player.ts';
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

type PlayerCliEnv = Record<string, string | undefined>;

type PlayerSessionOptions = {
  json: boolean;
  env: PlayerCliEnv;
  tokenStorePath?: string;
  readTokenStore?: (filePath: string) => Promise<StoredTokenData | null>;
  writeTokenStore?: (filePath: string, tokenData: StoredTokenData) => Promise<void>;
  refreshAccessToken?: (input: {
    clientId: string;
    refreshToken: string;
    fetchImpl: typeof fetch;
  }) => Promise<StoredTokenData>;
  createSpotifyClient?: typeof createSpotifyClient;
  loadSpotifyConfig?: (env: PlayerCliEnv) => ReturnType<typeof loadSpotifyConfig>;
  getTokenStorePath?: (env: PlayerCliEnv) => string;
  fetchImpl?: typeof fetch;
  stdout?: {
    write(value: string): void;
  };
  stderr?: {
    write(value: string): void;
  };
};

function getTokenStorePath(env: PlayerCliEnv): string {
  return env.SPOTIFY_TOKEN_PATH?.trim() || getTokenStorePathHint();
}

function writePlayerError(message: string, stderr = process.stderr): number {
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

function formatDeviceText(payload: { devices: Record<string, unknown>[] }): string {
  const lines = ['Spotify player devices'];

  if (payload.devices.length === 0) {
    lines.push('Devices: none');
    return `${lines.join('\n')}\n`;
  }

  lines.push(`Devices: ${payload.devices.length}`);

  for (const device of payload.devices) {
    const parts: string[] = [];

    if (typeof device.name === 'string') {
      parts.push(device.name);
    }

    if (typeof device.type === 'string') {
      parts.push(`type=${device.type}`);
    }

    if (device.isActive === true) {
      parts.push('active');
    }

    if (typeof device.volumePercent === 'number') {
      parts.push(`volume=${device.volumePercent}`);
    }

    lines.push(`- ${parts.length > 0 ? parts.join(', ') : 'unknown device'}`);
  }

  return `${lines.join('\n')}\n`;
}

function formatPlaybackText(title: string, payload: Record<string, unknown>): string {
  const lines = [title];

  if (payload.active === false || payload.current === false) {
    lines.push('Playback: none');
    return `${lines.join('\n')}\n`;
  }

  if (typeof payload.isPlaying === 'boolean') {
    lines.push(`Playing: ${payload.isPlaying ? 'yes' : 'no'}`);
  }

  const item = payload.item;
  if (item && typeof item === 'object' && 'name' in item && typeof item.name === 'string') {
    lines.push(`Item: ${item.name}`);
  }

  if (typeof payload.progressMs === 'number') {
    lines.push(`Progress: ${payload.progressMs}ms`);
  }

  if (typeof payload.contextUri === 'string') {
    lines.push(`Context: ${payload.contextUri}`);
  }

  return `${lines.join('\n')}\n`;
}

async function runPlayerDevicesSessionInternal({
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
}: PlayerSessionOptions): Promise<number> {
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

    const devices = await getPlayerDevices(client);

    if (json) {
      stdout.write(`${JSON.stringify(devices)}\n`);
    } else {
      stdout.write(formatDeviceText(devices));
    }

    return 0;
  } catch (error) {
    return writePlayerError(error instanceof Error ? error.message : 'Spotify player devices failed.', stderr);
  }
}

export async function runPlayerDevicesSession(options: PlayerSessionOptions): Promise<number> {
  return runPlayerDevicesSessionInternal(options);
}

async function runPlayerStateSession(options: PlayerSessionOptions): Promise<number> {
  return runPlayerPayloadSession(options, getPlaybackState, 'Spotify playback state');
}

async function runPlayerCurrentSession(options: PlayerSessionOptions): Promise<number> {
  return runPlayerPayloadSession(options, getCurrentlyPlaying, 'Spotify currently playing');
}

async function runPlayerPayloadSession(
  {
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
  }: PlayerSessionOptions,
  readPayload: (client: ReturnType<typeof createSpotifyClient>) => Promise<Record<string, unknown>>,
  textTitle: string,
): Promise<number> {
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

    const payload = await readPayload(client);

    if (json) {
      stdout.write(`${JSON.stringify(payload)}\n`);
    } else {
      stdout.write(formatPlaybackText(textTitle, payload));
    }

    return 0;
  } catch (error) {
    return writePlayerError(error instanceof Error ? error.message : `${textTitle} failed.`, stderr);
  }
}

function detectJsonFlag(argv: string[]): boolean {
  return argv.includes('--json');
}

export async function runPlayerCommand(argv: string[], env = process.env): Promise<number> {
  const [command, ...rest] = argv;

  if (command === 'devices') {
    return runPlayerDevicesSession({
      json: detectJsonFlag(rest),
      env,
    });
  }

  if (command === 'state') {
    return runPlayerStateSession({
      json: detectJsonFlag(rest),
      env,
    });
  }

  if (command === 'current') {
    return runPlayerCurrentSession({
      json: detectJsonFlag(rest),
      env,
    });
  }

  process.stdout.write('Unknown player command.\n');
  return 1;
}

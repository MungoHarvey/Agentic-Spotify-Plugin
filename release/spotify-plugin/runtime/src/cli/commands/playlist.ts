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
import { addPlaylistItems, createPlaylist, getPlaylist, getPlaylistItems, removePlaylistItems, removePlaylistItemsByPosition, reorderPlaylistItems, replacePlaylistItems, updatePlaylist } from '../../spotify/playlists.ts';
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

type PlaylistCliEnv = Record<string, string | undefined>;

type PlaylistSessionOptions = {
  json: boolean;
  env: PlaylistCliEnv;
  playlistId?: string;
  operation?: 'get' | 'items';
  uris?: string[];
  playlistName?: string;
  description?: string;
  public?: boolean;
  collaborative?: boolean;
  tokenStorePath?: string;
  readTokenStore?: (filePath: string) => Promise<StoredTokenData | null>;
  writeTokenStore?: (filePath: string, tokenData: StoredTokenData) => Promise<void>;
  refreshAccessToken?: (input: {
    clientId: string;
    refreshToken: string;
    fetchImpl: typeof fetch;
  }) => Promise<StoredTokenData>;
  createSpotifyClient?: typeof createSpotifyClient;
  loadSpotifyConfig?: (env: PlaylistCliEnv) => ReturnType<typeof loadSpotifyConfig>;
  getTokenStorePath?: (env: PlaylistCliEnv) => string;
  fetchImpl?: typeof fetch;
  stdout?: {
    write(value: string): void;
  };
  stderr?: {
    write(value: string): void;
  };
};

type PlaylistUpdateSessionOptions = Omit<PlaylistSessionOptions, 'playlistName'> & {
  playlistName?: never;
  name?: string;
};

type PlaylistAddSessionOptions = Omit<PlaylistSessionOptions, 'playlistName' | 'operation'> & {
  playlistName?: never;
  operation?: never;
};

type PlaylistRemoveSessionOptions = Omit<PlaylistSessionOptions, 'playlistName' | 'operation'> & {
  playlistName?: never;
  operation?: never;
  snapshotId?: string;
};

type PlaylistRemovePositionsSessionOptions = Omit<PlaylistSessionOptions, 'playlistName' | 'operation' | 'uris'> & {
  playlistName?: never;
  operation?: never;
  positions?: number[];
  snapshotId: string;
};

type PlaylistReorderSessionOptions = Omit<PlaylistSessionOptions, 'playlistName' | 'operation' | 'uris'> & {
  playlistName?: never;
  operation?: never;
  rangeStart: number;
  insertBefore: number;
  rangeLength?: number;
  snapshotId?: string;
};

function getTokenStorePath(env: PlaylistCliEnv): string {
  return env.SPOTIFY_TOKEN_PATH?.trim() || resolveTokenStorePathSync();
}

function writePlaylistError(message: string, stderr = process.stderr): number {
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

async function runPlaylistGetSessionInternal({
  json,
  env,
  playlistId,
  operation = 'get',
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
}: PlaylistSessionOptions): Promise<number> {
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

    const normalizedPlaylistId = playlistId?.trim();

    if (!normalizedPlaylistId) {
      throw new Error('A playlist ID is required.');
    }

    const playlist =
      operation === 'items'
        ? await getPlaylistItems(client, normalizedPlaylistId)
        : await getPlaylist(client, normalizedPlaylistId);

    if (json) {
      stdout.write(`${JSON.stringify(playlist)}\n`);
    } else {
      stdout.write(operation === 'items' ? 'Spotify playlist items\n' : 'Spotify playlist\n');
    }

    return 0;
  } catch (error) {
    return writePlaylistError(error instanceof Error ? error.message : 'Spotify playlist get failed.', stderr);
  }
}

async function runPlaylistCreateSessionInternal({
  json,
  env,
  playlistName,
  description,
  public: isPublic,
  collaborative,
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
}: PlaylistSessionOptions): Promise<number> {
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

    const normalizedPlaylistName = playlistName?.trim();

    if (!normalizedPlaylistName) {
      throw new Error('A playlist name is required.');
    }

    const playlist = await createPlaylist(client, {
      name: normalizedPlaylistName,
      ...(typeof description === 'string' ? { description } : {}),
      ...(typeof isPublic === 'boolean' ? { public: isPublic } : {}),
      ...(typeof collaborative === 'boolean' ? { collaborative } : {}),
    });

    if (json) {
      stdout.write(`${JSON.stringify(playlist)}\n`);
    } else {
      stdout.write('Spotify playlist created\n');
    }

    return 0;
  } catch (error) {
    return writePlaylistError(error instanceof Error ? error.message : 'Spotify playlist create failed.', stderr);
  }
}

async function runPlaylistUpdateSessionInternal({
  json,
  env,
  playlistId,
  name,
  description,
  public: isPublic,
  collaborative,
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
}: PlaylistUpdateSessionOptions): Promise<number> {
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

    const normalizedPlaylistId = playlistId?.trim();

    if (!normalizedPlaylistId) {
      throw new Error('A playlist ID is required.');
    }

    const result = await updatePlaylist(client, normalizedPlaylistId, {
      ...(typeof name === 'string' ? { name } : {}),
      ...(typeof description === 'string' ? { description } : {}),
      ...(typeof isPublic === 'boolean' ? { public: isPublic } : {}),
      ...(typeof collaborative === 'boolean' ? { collaborative } : {}),
    });

    if (json) {
      stdout.write(`${JSON.stringify(result)}\n`);
    } else {
      stdout.write('Spotify playlist updated\n');
    }

    return 0;
  } catch (error) {
    return writePlaylistError(error instanceof Error ? error.message : 'Spotify playlist update failed.', stderr);
  }
}

async function runPlaylistAddSessionInternal({
  json,
  env,
  playlistId,
  uris,
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
}: PlaylistAddSessionOptions): Promise<number> {
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

    const normalizedPlaylistId = playlistId?.trim();

    if (!normalizedPlaylistId) {
      throw new Error('A playlist ID is required.');
    }

    const playlistUris = Array.isArray(uris) ? uris : [];

    const result = await addPlaylistItems(client, normalizedPlaylistId, playlistUris);

    if (json) {
      stdout.write(`${JSON.stringify(result)}\n`);
    } else {
      stdout.write('Spotify playlist items added\n');
    }

    return 0;
  } catch (error) {
    return writePlaylistError(error instanceof Error ? error.message : 'Spotify playlist add failed.', stderr);
  }
}

async function runPlaylistReplaceSessionInternal({
  json,
  env,
  playlistId,
  uris,
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
}: PlaylistAddSessionOptions): Promise<number> {
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

    const normalizedPlaylistId = playlistId?.trim();

    if (!normalizedPlaylistId) {
      throw new Error('A playlist ID is required.');
    }

    const playlistUris = Array.isArray(uris) ? uris : [];

    const result = await replacePlaylistItems(client, normalizedPlaylistId, playlistUris);

    if (json) {
      stdout.write(`${JSON.stringify(result)}\n`);
    } else {
      stdout.write('Spotify playlist items replaced\n');
    }

    return 0;
  } catch (error) {
    return writePlaylistError(error instanceof Error ? error.message : 'Spotify playlist replace failed.', stderr);
  }
}

async function runPlaylistRemoveSessionInternal({
  json,
  env,
  playlistId,
  uris,
  snapshotId,
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
}: PlaylistRemoveSessionOptions): Promise<number> {
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

    const normalizedPlaylistId = playlistId?.trim();

    if (!normalizedPlaylistId) {
      throw new Error('A playlist ID is required.');
    }

    const playlistUris = Array.isArray(uris) ? uris : [];

    const result = await removePlaylistItems(client, normalizedPlaylistId, playlistUris, {
      ...(typeof snapshotId === 'string' ? { snapshotId } : {}),
    });

    if (json) {
      stdout.write(`${JSON.stringify(result)}\n`);
    } else {
      stdout.write('Spotify playlist items removed\n');
    }

    return 0;
  } catch (error) {
    return writePlaylistError(error instanceof Error ? error.message : 'Spotify playlist remove failed.', stderr);
  }
}

async function runPlaylistRemovePositionsSessionInternal({
  json,
  env,
  playlistId,
  positions,
  snapshotId,
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
}: PlaylistRemovePositionsSessionOptions): Promise<number> {
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

    const normalizedPlaylistId = playlistId?.trim();

    if (!normalizedPlaylistId) {
      throw new Error('A playlist ID is required.');
    }

    const playlistPositions = Array.isArray(positions) ? positions : [];

    const result = await removePlaylistItemsByPosition(client, normalizedPlaylistId, playlistPositions, snapshotId);

    if (json) {
      stdout.write(`${JSON.stringify(result)}\n`);
    } else {
      stdout.write('Spotify playlist items removed\n');
    }

    return 0;
  } catch (error) {
    return writePlaylistError(error instanceof Error ? error.message : 'Spotify playlist remove-positions failed.', stderr);
  }
}

async function runPlaylistReorderSessionInternal({
  json,
  env,
  playlistId,
  rangeStart,
  insertBefore,
  rangeLength,
  snapshotId,
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
}: PlaylistReorderSessionOptions): Promise<number> {
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

    const normalizedPlaylistId = playlistId?.trim();

    if (!normalizedPlaylistId) {
      throw new Error('A playlist ID is required.');
    }

    const result = await reorderPlaylistItems(client, normalizedPlaylistId, {
      rangeStart,
      insertBefore,
      ...(typeof rangeLength === 'number' ? { rangeLength } : {}),
      ...(typeof snapshotId === 'string' ? { snapshotId } : {}),
    });

    if (json) {
      stdout.write(`${JSON.stringify(result)}\n`);
    } else {
      stdout.write('Spotify playlist reordered\n');
    }

    return 0;
  } catch (error) {
    return writePlaylistError(error instanceof Error ? error.message : 'Spotify playlist reorder failed.', stderr);
  }
}

export async function runPlaylistGetSession(options: PlaylistSessionOptions): Promise<number> {
  return runPlaylistGetSessionInternal(options);
}

export async function runPlaylistAddSession(options: PlaylistAddSessionOptions): Promise<number> {
  return runPlaylistAddSessionInternal(options);
}

export async function runPlaylistReplaceSession(options: PlaylistAddSessionOptions): Promise<number> {
  return runPlaylistReplaceSessionInternal(options);
}

export async function runPlaylistRemoveSession(options: PlaylistRemoveSessionOptions): Promise<number> {
  return runPlaylistRemoveSessionInternal(options);
}

export async function runPlaylistReorderSession(options: PlaylistReorderSessionOptions): Promise<number> {
  return runPlaylistReorderSessionInternal(options);
}

function detectJsonFlag(argv: string[]): boolean {
  return argv.includes('--json');
}

function parsePlaylistCreateArgs(argv: string[]): {
  playlistName: string;
  description?: string;
  public?: boolean;
  collaborative?: boolean;
  json: boolean;
} {
  let playlistName = '';
  let description: string | undefined;
  let isPublic: boolean | undefined;
  let collaborative: boolean | undefined;
  let json = false;

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === '--json') {
      json = true;
      continue;
    }

    if (value === '--description') {
      const nextValue = argv[index + 1];

      if (!nextValue || nextValue.startsWith('--')) {
        throw new Error('A playlist description is required after --description.');
      }

      description = nextValue;
      index += 1;
      continue;
    }

    if (value === '--public') {
      isPublic = true;
      continue;
    }

    if (value === '--private') {
      isPublic = false;
      continue;
    }

    if (value === '--collaborative') {
      collaborative = true;
      continue;
    }

    if (!value.startsWith('--') && !playlistName) {
      playlistName = value;
    }
  }

  return {
    playlistName,
    ...(description !== undefined ? { description } : {}),
    ...(isPublic !== undefined ? { public: isPublic } : {}),
    ...(collaborative !== undefined ? { collaborative } : {}),
    json,
  };
}

function parsePlaylistUpdateArgs(argv: string[]): {
  name?: string;
  description?: string;
  public?: boolean;
  collaborative?: boolean;
  json: boolean;
} {
  let name: string | undefined;
  let description: string | undefined;
  let isPublic: boolean | undefined;
  let collaborative: boolean | undefined;
  let json = false;

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === '--json') {
      json = true;
      continue;
    }

    if (value === '--description') {
      const nextValue = argv[index + 1];

      if (!nextValue || nextValue.startsWith('--')) {
        throw new Error('A playlist description is required after --description.');
      }

      description = nextValue;
      index += 1;
      continue;
    }

    if (value === '--name') {
      const nextValue = argv[index + 1];

      if (!nextValue || nextValue.startsWith('--')) {
        throw new Error('A playlist name is required after --name.');
      }

      name = nextValue;
      index += 1;
      continue;
    }

    if (value === '--public') {
      isPublic = true;
      continue;
    }

    if (value === '--private') {
      isPublic = false;
      continue;
    }

    if (value === '--collaborative') {
      collaborative = true;
      continue;
    }
  }

  return {
    ...(name !== undefined ? { name } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(isPublic !== undefined ? { public: isPublic } : {}),
    ...(collaborative !== undefined ? { collaborative } : {}),
    json,
  };
}

function parsePlaylistAddArgs(argv: string[]): {
  uris: string[];
  json: boolean;
} {
  const uris: string[] = [];
  let json = false;

  for (const value of argv) {
    if (value === '--json') {
      json = true;
      continue;
    }

    uris.push(value);
  }

  return {
    uris,
    json,
  };
}

function parsePlaylistReplaceArgs(argv: string[]): {
  uris: string[];
  json: boolean;
} {
  const uris: string[] = [];
  let json = false;

  for (const value of argv) {
    if (value === '--json') {
      json = true;
      continue;
    }

    uris.push(value);
  }

  return {
    uris,
    json,
  };
}

function parsePlaylistRemoveArgs(argv: string[]): {
  uris: string[];
  snapshotId?: string;
  json: boolean;
} {
  const uris: string[] = [];
  let snapshotId: string | undefined;
  let json = false;

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === '--json') {
      json = true;
      continue;
    }

    if (value === '--snapshot-id') {
      const nextValue = argv[index + 1];

      if (!nextValue || nextValue.startsWith('--')) {
        throw new Error('A snapshot ID is required after --snapshot-id.');
      }

      snapshotId = nextValue;
      index += 1;
      continue;
    }

    uris.push(value);
  }

  return {
    uris,
    ...(snapshotId !== undefined ? { snapshotId } : {}),
    json,
  };
}

function parsePlaylistRemovePositionsArgs(argv: string[]): {
  positions: number[];
  snapshotId?: string;
  json: boolean;
} {
  const positions: number[] = [];
  let snapshotId: string | undefined;
  let json = false;

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === '--json') {
      json = true;
      continue;
    }

    if (value === '--snapshot-id') {
      const nextValue = argv[index + 1];

      if (!nextValue || nextValue.startsWith('--')) {
        throw new Error('A snapshot ID is required after --snapshot-id.');
      }

      snapshotId = nextValue;
      index += 1;
      continue;
    }

    if (value.trim().length === 0) {
      throw new Error('Playlist positions must be zero-based integers.');
    }

    const position = Number(value);

    if (!Number.isInteger(position) || position < 0) {
      throw new Error('Playlist positions must be zero-based integers.');
    }

    positions.push(position);
  }

  return {
    positions,
    ...(snapshotId !== undefined ? { snapshotId } : {}),
    json,
  };
}

function parsePlaylistReorderArgs(argv: string[]): {
  rangeStart?: number;
  insertBefore?: number;
  rangeLength?: number;
  snapshotId?: string;
  json: boolean;
} {
  let rangeStart: number | undefined;
  let insertBefore: number | undefined;
  let rangeLength: number | undefined;
  let snapshotId: string | undefined;
  let json = false;

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === '--json') {
      json = true;
      continue;
    }

    if (value === '--range-start') {
      const nextValue = argv[index + 1];

      if (!nextValue || nextValue.startsWith('--')) {
        throw new Error('A range start is required after --range-start.');
      }

      const parsedValue = Number(nextValue);

      if (!Number.isInteger(parsedValue) || parsedValue < 0) {
        throw new Error('rangeStart must be a zero-based integer.');
      }

      rangeStart = parsedValue;
      index += 1;
      continue;
    }

    if (value === '--insert-before') {
      const nextValue = argv[index + 1];

      if (!nextValue || nextValue.startsWith('--')) {
        throw new Error('An insert-before value is required after --insert-before.');
      }

      const parsedValue = Number(nextValue);

      if (!Number.isInteger(parsedValue) || parsedValue < 0) {
        throw new Error('insertBefore must be a zero-based integer.');
      }

      insertBefore = parsedValue;
      index += 1;
      continue;
    }

    if (value === '--range-length') {
      const nextValue = argv[index + 1];

      if (!nextValue || nextValue.startsWith('--')) {
        throw new Error('A range length is required after --range-length.');
      }

      const parsedValue = Number(nextValue);

      if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
        throw new Error('rangeLength must be a positive integer.');
      }

      rangeLength = parsedValue;
      index += 1;
      continue;
    }

    if (value === '--snapshot-id') {
      const nextValue = argv[index + 1];

      if (!nextValue || nextValue.startsWith('--')) {
        throw new Error('A snapshot ID is required after --snapshot-id.');
      }

      snapshotId = nextValue;
      index += 1;
    }
  }

  return {
    ...(rangeStart !== undefined ? { rangeStart } : {}),
    ...(insertBefore !== undefined ? { insertBefore } : {}),
    ...(rangeLength !== undefined ? { rangeLength } : {}),
    ...(snapshotId !== undefined ? { snapshotId } : {}),
    json,
  };
}

export async function runPlaylistCommand(argv: string[], env = process.env): Promise<number> {
  const [command, playlistId, ...rest] = argv;

  if (command === 'get') {
    if (!playlistId || playlistId.startsWith('--')) {
      return writePlaylistError('A playlist ID is required.');
    }

    return runPlaylistGetSession({
      json: detectJsonFlag(rest),
      env,
      playlistId,
    });
  }

  if (command === 'items') {
    if (!playlistId || playlistId.startsWith('--')) {
      return writePlaylistError('A playlist ID is required.');
    }

    return runPlaylistGetSession({
      json: detectJsonFlag(rest),
      env,
      playlistId,
      operation: 'items',
    });
  }

  if (command === 'create') {
    try {
      const parsed = parsePlaylistCreateArgs([playlistId, ...rest].filter((value): value is string => typeof value === 'string'));

      if (!parsed.playlistName) {
        return writePlaylistError('A playlist name is required.');
      }

      return runPlaylistCreateSessionInternal({
        json: parsed.json,
        env,
        playlistName: parsed.playlistName,
        ...(parsed.description !== undefined ? { description: parsed.description } : {}),
        ...(parsed.public !== undefined ? { public: parsed.public } : {}),
        ...(parsed.collaborative !== undefined ? { collaborative: parsed.collaborative } : {}),
      });
    } catch (error) {
      return writePlaylistError(error instanceof Error ? error.message : 'Spotify playlist create failed.');
    }
  }

  if (command === 'update') {
    try {
      if (!playlistId || playlistId.startsWith('--')) {
        return writePlaylistError('A playlist ID is required.');
      }

      const parsed = parsePlaylistUpdateArgs(rest);

      return runPlaylistUpdateSessionInternal({
        json: parsed.json,
        env,
        playlistId,
        ...(parsed.name !== undefined ? { name: parsed.name } : {}),
        ...(parsed.description !== undefined ? { description: parsed.description } : {}),
        ...(parsed.public !== undefined ? { public: parsed.public } : {}),
        ...(parsed.collaborative !== undefined ? { collaborative: parsed.collaborative } : {}),
      });
    } catch (error) {
      return writePlaylistError(error instanceof Error ? error.message : 'Spotify playlist update failed.');
    }
  }

  if (command === 'add') {
    try {
      if (!playlistId || playlistId.startsWith('--')) {
        return writePlaylistError('A playlist ID is required.');
      }

      const parsed = parsePlaylistAddArgs(rest);

      return runPlaylistAddSessionInternal({
        json: parsed.json,
        env,
        playlistId,
        uris: parsed.uris,
      });
    } catch (error) {
      return writePlaylistError(error instanceof Error ? error.message : 'Spotify playlist add failed.');
    }
  }

  if (command === 'replace') {
    try {
      if (!playlistId || playlistId.startsWith('--')) {
        return writePlaylistError('A playlist ID is required.');
      }

      const parsed = parsePlaylistReplaceArgs(rest);

      return runPlaylistReplaceSessionInternal({
        json: parsed.json,
        env,
        playlistId,
        uris: parsed.uris,
      });
    } catch (error) {
      return writePlaylistError(error instanceof Error ? error.message : 'Spotify playlist replace failed.');
    }
  }

  if (command === 'remove') {
    try {
      if (!playlistId || playlistId.startsWith('--')) {
        return writePlaylistError('A playlist ID is required.');
      }

      const parsed = parsePlaylistRemoveArgs(rest);

      return runPlaylistRemoveSessionInternal({
        json: parsed.json,
        env,
        playlistId,
        uris: parsed.uris,
        ...(parsed.snapshotId !== undefined ? { snapshotId: parsed.snapshotId } : {}),
      });
    } catch (error) {
      return writePlaylistError(error instanceof Error ? error.message : 'Spotify playlist remove failed.');
    }
  }

  if (command === 'remove-positions') {
    try {
      if (!playlistId || playlistId.startsWith('--')) {
        return writePlaylistError('A playlist ID is required.');
      }

      const parsed = parsePlaylistRemovePositionsArgs(rest);

      if (!parsed.snapshotId) {
        return writePlaylistError('A snapshot ID is required.');
      }

      if (parsed.positions.length === 0) {
        return writePlaylistError('At least one zero-based integer position is required.');
      }

      return runPlaylistRemovePositionsSessionInternal({
        json: parsed.json,
        env,
        playlistId,
        positions: parsed.positions,
        snapshotId: parsed.snapshotId,
      });
    } catch (error) {
      return writePlaylistError(error instanceof Error ? error.message : 'Spotify playlist remove-positions failed.');
    }
  }

  if (command === 'reorder') {
    try {
      if (!playlistId || playlistId.startsWith('--')) {
        return writePlaylistError('A playlist ID is required.');
      }

      const parsed = parsePlaylistReorderArgs(rest);

      if (parsed.rangeStart === undefined) {
        return writePlaylistError('A range start is required.');
      }

      if (parsed.insertBefore === undefined) {
        return writePlaylistError('An insert-before value is required.');
      }

      return runPlaylistReorderSessionInternal({
        json: parsed.json,
        env,
        playlistId,
        rangeStart: parsed.rangeStart,
        insertBefore: parsed.insertBefore,
        ...(parsed.rangeLength !== undefined ? { rangeLength: parsed.rangeLength } : {}),
        ...(parsed.snapshotId !== undefined ? { snapshotId: parsed.snapshotId } : {}),
      });
    } catch (error) {
      return writePlaylistError(error instanceof Error ? error.message : 'Spotify playlist reorder failed.');
    }
  }

  process.stdout.write('Unknown playlist command.\n');
  return 1;
}

// @ts-ignore - This repo resolves source .ts imports at runtime under NodeNext.
import { shapePlaylist, shapePlaylistItem } from './shapes.ts';
// @ts-ignore - This repo resolves source .ts imports at runtime under NodeNext.
import { paginateAll } from './paging.ts';

type SpotifyPlaylistsClient = {
  request(
    path: string,
    init?: {
      method?: string;
      headers?: Record<string, string>;
      body?: string;
    },
  ): Promise<unknown | null>;
};

type CreatePlaylistOptions = {
  name: string;
  description?: string;
  public?: boolean;
  collaborative?: boolean;
};

type UpdatePlaylistOptions = {
  name?: string;
  description?: string;
  public?: boolean;
  collaborative?: boolean;
};

type AddPlaylistItemsOptions = Record<string, never>;

type RemovePlaylistItemsOptions = {
  snapshotId?: string;
};

type RemovePlaylistItemsByPositionOptions = {
  snapshotId: string;
};

type ReorderPlaylistItemsOptions = {
  rangeStart: number;
  insertBefore: number;
  rangeLength?: number;
  snapshotId?: string;
};

type PlaylistPageRecord = {
  items?: unknown;
  limit?: unknown;
  offset?: unknown;
  total?: unknown;
  next?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function readInteger(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : undefined;
}

function readPositiveInteger(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : undefined;
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function readSnapshotId(value: unknown): string | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  return readString(value.snapshot_id) ?? readString(value.snapshotId);
}

function shapePlaylistPage(page: unknown) {
  const record = isRecord(page) ? (page as PlaylistPageRecord & Record<string, unknown>) : {};
  const items = Array.isArray(record.items) ? record.items : [];

  return {
    items: items.map((item) => shapePlaylist(item as Record<string, unknown>)),
    ...(readNumber(record.limit) !== undefined ? { limit: readNumber(record.limit) } : {}),
    ...(readNumber(record.offset) !== undefined ? { offset: readNumber(record.offset) } : {}),
    ...(readNumber(record.total) !== undefined ? { total: readNumber(record.total) } : {}),
    ...(readString(record.next) !== undefined ? { next: readString(record.next) } : {}),
  };
}

function shapePlaylistItemsPage(page: unknown) {
  const record = isRecord(page) ? (page as PlaylistPageRecord & Record<string, unknown>) : {};
  const items = Array.isArray(record.items) ? record.items : [];
  const offset = readNumber(record.offset) ?? 0;

  return {
    items: items.map((item, index) => shapePlaylistItem(item as Record<string, unknown>, offset + index)),
    ...(readNumber(record.limit) !== undefined ? { limit: readNumber(record.limit) } : {}),
    ...(readNumber(record.offset) !== undefined ? { offset: readNumber(record.offset) } : {}),
    ...(readNumber(record.total) !== undefined ? { total: readNumber(record.total) } : {}),
    ...(readString(record.next) !== undefined ? { next: readString(record.next) } : {}),
  };
}

export async function getCurrentUserPlaylists(client: SpotifyPlaylistsClient) {
  return shapePlaylistPage(await client.request('me/playlists'));
}

export async function getPlaylist(client: SpotifyPlaylistsClient, playlistId: string) {
  const normalizedPlaylistId = playlistId.trim();

  if (!normalizedPlaylistId) {
    throw new Error('A playlist ID is required.');
  }

  return shapePlaylist(
    (await client.request(`playlists/${encodeURIComponent(normalizedPlaylistId)}`)) as Parameters<typeof shapePlaylist>[0],
  );
}

export async function getPlaylistItems(client: SpotifyPlaylistsClient, playlistId: string) {
  const normalizedPlaylistId = playlistId.trim();

  if (!normalizedPlaylistId) {
    throw new Error('A playlist ID is required.');
  }

  return shapePlaylistItemsPage(await client.request(`playlists/${encodeURIComponent(normalizedPlaylistId)}/tracks`));
}

export async function getAllCurrentUserPlaylists(client: SpotifyPlaylistsClient, maxPages = 20) {
  const playlists = await paginateAll('me/playlists', (pathOrUrl) => client.request(pathOrUrl), { maxPages });

  return {
    items: playlists.map((playlist) => shapePlaylist(playlist as Record<string, unknown>)),
  };
}

export async function createPlaylist(client: SpotifyPlaylistsClient, options: CreatePlaylistOptions) {
  const currentUser = (await client.request('me')) as Record<string, unknown> | null | undefined;
  const userId = readString(isRecord(currentUser) ? currentUser.id : undefined);
  const normalizedName = options.name.trim();

  if (!userId) {
    throw new Error('Current user ID is required to create a playlist.');
  }

  if (!normalizedName) {
    throw new Error('A playlist name is required.');
  }

  const body: Record<string, unknown> = {
    name: normalizedName,
  };

  if (typeof options.description === 'string') {
    body.description = options.description;
  }

  if (typeof options.public === 'boolean') {
    body.public = options.public;
  }

  if (typeof options.collaborative === 'boolean') {
    body.collaborative = options.collaborative;
  }

  return shapePlaylist(
    (await client.request(`users/${encodeURIComponent(userId)}/playlists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })) as Parameters<typeof shapePlaylist>[0],
  );
}

export async function updatePlaylist(
  client: SpotifyPlaylistsClient,
  playlistId: string,
  options: UpdatePlaylistOptions,
) {
  const normalizedPlaylistId = playlistId.trim();

  if (!normalizedPlaylistId) {
    throw new Error('A playlist ID is required.');
  }

  const body: Record<string, unknown> = {};
  const fields: string[] = [];

  if (typeof options.name === 'string') {
    const normalizedName = options.name.trim();

    if (normalizedName) {
      body.name = normalizedName;
      fields.push('name');
    }
  }

  if (typeof options.description === 'string') {
    body.description = options.description;
    fields.push('description');
  }

  if (typeof options.public === 'boolean') {
    body.public = options.public;
    fields.push('public');
  }

  if (typeof options.collaborative === 'boolean') {
    body.collaborative = options.collaborative;
    fields.push('collaborative');
  }

  if (fields.length === 0) {
    throw new Error('At least one playlist metadata field is required to update.');
  }

  await client.request(`playlists/${encodeURIComponent(normalizedPlaylistId)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return {
    playlistId: normalizedPlaylistId,
    updated: true,
    fields,
  };
}

export async function addPlaylistItems(
  client: SpotifyPlaylistsClient,
  playlistId: string,
  uris: string[],
  options: AddPlaylistItemsOptions = {},
) {
  void options;

  const normalizedPlaylistId = playlistId.trim();

  if (!normalizedPlaylistId) {
    throw new Error('A playlist ID is required.');
  }

  if (!Array.isArray(uris) || uris.length === 0) {
    throw new Error('At least one Spotify URI is required.');
  }

  const normalizedUris = uris.map((uri) => {
    if (typeof uri !== 'string' || uri.length === 0) {
      throw new Error('Spotify URIs must be non-empty strings.');
    }

    if (!uri.startsWith('spotify:')) {
      throw new Error('Spotify URIs must start with spotify:.');
    }

    return uri;
  });

  const batches: number[] = [];
  let snapshotId: string | undefined;

  for (let index = 0; index < normalizedUris.length; index += 100) {
    const batch = normalizedUris.slice(index, index + 100);
    const response = await client.request(`playlists/${encodeURIComponent(normalizedPlaylistId)}/tracks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uris: batch,
      }),
    });

    batches.push(batch.length);
    snapshotId = readSnapshotId(response);
  }

  return {
    playlistId: normalizedPlaylistId,
    added: normalizedUris.length,
    batches,
    ...(snapshotId !== undefined ? { snapshotId } : {}),
  };
}

export async function replacePlaylistItems(
  client: SpotifyPlaylistsClient,
  playlistId: string,
  uris: string[],
) {
  const normalizedPlaylistId = playlistId.trim();

  if (!normalizedPlaylistId) {
    throw new Error('A playlist ID is required.');
  }

  if (!Array.isArray(uris) || uris.length === 0) {
    throw new Error('At least one Spotify URI is required.');
  }

  const normalizedUris = uris.map((uri) => {
    if (typeof uri !== 'string' || uri.length === 0) {
      throw new Error('Spotify URIs must be non-empty strings.');
    }

    if (!uri.startsWith('spotify:')) {
      throw new Error('Spotify URIs must start with spotify:.');
    }

    return uri;
  });

  const batches: number[] = [];
  let snapshotId: string | undefined;

  for (let index = 0; index < normalizedUris.length; index += 100) {
    const batch = normalizedUris.slice(index, index + 100);
    const response = await client.request(`playlists/${encodeURIComponent(normalizedPlaylistId)}/tracks`, {
      method: index === 0 ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uris: batch,
      }),
    });

    batches.push(batch.length);
    snapshotId = readSnapshotId(response);
  }

  return {
    playlistId: normalizedPlaylistId,
    replaced: normalizedUris.length,
    batches,
    ...(snapshotId !== undefined ? { snapshotId } : {}),
  };
}

export async function removePlaylistItems(
  client: SpotifyPlaylistsClient,
  playlistId: string,
  uris: string[],
  options: RemovePlaylistItemsOptions = {},
) {
  const normalizedPlaylistId = playlistId.trim();

  if (!normalizedPlaylistId) {
    throw new Error('A playlist ID is required.');
  }

  if (!Array.isArray(uris) || uris.length === 0) {
    throw new Error('At least one Spotify URI is required.');
  }

  const normalizedUris = uris.map((uri) => {
    if (typeof uri !== 'string' || uri.length === 0) {
      throw new Error('Spotify URIs must be non-empty strings.');
    }

    if (!uri.startsWith('spotify:')) {
      throw new Error('Spotify URIs must start with spotify:.');
    }

    return uri;
  });

  const body: Record<string, unknown> = {
    tracks: normalizedUris.map((uri) => ({ uri })),
  };

  if (typeof options.snapshotId === 'string') {
    const normalizedSnapshotId = options.snapshotId.trim();

    if (normalizedSnapshotId) {
      body.snapshot_id = normalizedSnapshotId;
    }
  }

  const response = await client.request(`playlists/${encodeURIComponent(normalizedPlaylistId)}/tracks`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const snapshotId = readSnapshotId(response);

  return {
    playlistId: normalizedPlaylistId,
    removed: normalizedUris.length,
    ...(snapshotId !== undefined ? { snapshotId } : {}),
  };
}

async function getPlaylistItemsByPositions(
  client: SpotifyPlaylistsClient,
  playlistId: string,
  positions: number[],
) {
  const normalizedPlaylistId = playlistId.trim();
  const uniquePositions = Array.from(new Set(positions)).sort((left, right) => left - right);
  const requestedPositions = new Set(uniquePositions);
  const positionToUri = new Map<number, string>();

  for (let index = 0; index < uniquePositions.length; index += 1) {
    const pageOffset = Math.floor(uniquePositions[index] / 100) * 100;
    const pagePath = `playlists/${encodeURIComponent(normalizedPlaylistId)}/tracks?limit=100&offset=${pageOffset}`;

    if (Array.from(positionToUri.keys()).some((position) => Math.floor(position / 100) * 100 === pageOffset)) {
      continue;
    }

    const page = shapePlaylistItemsPage(await client.request(pagePath));

    for (const item of page.items) {
      const position = item.position;
      const uri = item.item?.uri;

      if (typeof position === 'number' && requestedPositions.has(position) && typeof uri === 'string') {
        positionToUri.set(position, uri);
      }
    }
  }

  const missingPosition = uniquePositions.find((position) => !positionToUri.has(position));

  if (missingPosition !== undefined) {
    throw new Error(`Playlist item at position ${missingPosition} was not found.`);
  }

  return uniquePositions.map((position) => {
    const uri = positionToUri.get(position);

    if (!uri) {
      throw new Error(`Playlist item at position ${position} is missing a URI.`);
    }

    return {
      position,
      uri,
    };
  });
}

export async function removePlaylistItemsByPosition(
  client: SpotifyPlaylistsClient,
  playlistId: string,
  positions: number[],
  snapshotId: string,
) {
  const normalizedPlaylistId = playlistId.trim();
  const normalizedSnapshotId = snapshotId.trim();

  if (!normalizedPlaylistId) {
    throw new Error('A playlist ID is required.');
  }

  if (!Array.isArray(positions) || positions.length === 0) {
    throw new Error('At least one zero-based integer position is required.');
  }

  if (!normalizedSnapshotId) {
    throw new Error('A snapshot ID is required.');
  }

  const normalizedPositions: number[] = [];
  const seenPositions = new Set<number>();

  for (const position of positions) {
    if (readInteger(position) === undefined) {
      throw new Error('Playlist positions must be zero-based integers.');
    }

    if (!seenPositions.has(position)) {
      seenPositions.add(position);
      normalizedPositions.push(position);
    }
  }

  normalizedPositions.sort((left, right) => left - right);

  const items = await getPlaylistItemsByPositions(client, normalizedPlaylistId, normalizedPositions);
  const groupedTracks = new Map<string, number[]>();

  for (const item of items) {
    const positionsForUri = groupedTracks.get(item.uri) ?? [];

    positionsForUri.push(item.position);
    groupedTracks.set(item.uri, positionsForUri);
  }

  const response = await client.request(`playlists/${encodeURIComponent(normalizedPlaylistId)}/tracks`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tracks: Array.from(groupedTracks.entries()).map(([uri, positionsForUri]) => ({
        uri,
        positions: positionsForUri,
      })),
      snapshot_id: normalizedSnapshotId,
    }),
  });

  const snapshot = readSnapshotId(response);

  return {
    playlistId: normalizedPlaylistId,
    removedPositions: normalizedPositions,
    ...(snapshot !== undefined ? { snapshotId: snapshot } : {}),
  };
}

export async function reorderPlaylistItems(
  client: SpotifyPlaylistsClient,
  playlistId: string,
  options: ReorderPlaylistItemsOptions,
) {
  const normalizedPlaylistId = playlistId.trim();

  if (!normalizedPlaylistId) {
    throw new Error('A playlist ID is required.');
  }

  if (readInteger(options.rangeStart) === undefined) {
    throw new Error('rangeStart must be a zero-based integer.');
  }

  if (readInteger(options.insertBefore) === undefined) {
    throw new Error('insertBefore must be a zero-based integer.');
  }

  if (options.rangeLength !== undefined && readPositiveInteger(options.rangeLength) === undefined) {
    throw new Error('rangeLength must be a positive integer.');
  }

  const body: Record<string, unknown> = {
    range_start: options.rangeStart,
    insert_before: options.insertBefore,
  };

  if (options.rangeLength !== undefined) {
    body.range_length = options.rangeLength;
  }

  if (typeof options.snapshotId === 'string') {
    const normalizedSnapshotId = options.snapshotId.trim();

    if (normalizedSnapshotId) {
      body.snapshot_id = normalizedSnapshotId;
    }
  }

  const response = await client.request(`playlists/${encodeURIComponent(normalizedPlaylistId)}/tracks`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const snapshotId = readSnapshotId(response);

  return {
    playlistId: normalizedPlaylistId,
    rangeStart: options.rangeStart,
    insertBefore: options.insertBefore,
    ...(options.rangeLength !== undefined ? { rangeLength: options.rangeLength } : {}),
    ...(snapshotId !== undefined ? { snapshotId } : {}),
  };
}

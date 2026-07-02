// @ts-ignore - This repo resolves source .ts imports at runtime under NodeNext.
import { shapeEpisode, shapeTrack } from './shapes.ts';

declare const URLSearchParams: {
  new (init?: Record<string, string>): {
    set(name: string, value: string): void;
    toString(): string;
  };
};

type RecordLike = Record<string, unknown> | null | undefined;

type SpotifyQueueClient = {
  request(path: string, init?: { method?: string }): Promise<unknown | null>;
};

export type QueueAddOptions = {
  uri: string;
  deviceId?: string;
};

export type QueueAddManyOptions = {
  uris: string[];
  deviceId?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readRecord(value: RecordLike): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function compactObject<T extends Record<string, unknown>>(value: T): Partial<T> {
  const result: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(value)) {
    if (entry !== undefined) {
      result[key] = entry;
    }
  }

  return result as Partial<T>;
}

function normalizeQueueUri(uri: string): string {
  const normalizedUri = uri.trim();

  if (!/^spotify:(track|episode):[^:\s]+$/.test(normalizedUri)) {
    throw new Error('Queue item URI must be a Spotify track or episode URI.');
  }

  return normalizedUri;
}

function shapeQueueItem(item: RecordLike) {
  const record = readRecord(item);
  const type = readString(record.type);

  if (type === 'track') {
    return shapeTrack(record);
  }

  if (type === 'episode') {
    return shapeEpisode(record);
  }

  return compactObject({
    type,
    id: readString(record.id),
    uri: readString(record.uri),
    name: readString(record.name),
  });
}

export async function getQueue(client: SpotifyQueueClient) {
  const response = await client.request('me/player/queue');

  if (!isRecord(response)) {
    return {
      currentlyPlaying: null,
      queue: [],
    };
  }

  const queueItems = Array.isArray(response.queue) ? response.queue : [];

  return {
    currentlyPlaying: isRecord(response.currently_playing) ? shapeQueueItem(response.currently_playing) : null,
    queue: queueItems.map((item) => shapeQueueItem(item as RecordLike)),
  };
}

export async function addToQueue(client: SpotifyQueueClient, options: QueueAddOptions) {
  const uri = normalizeQueueUri(options.uri);
  const deviceId = options.deviceId?.trim();
  const query = new URLSearchParams({ uri });

  if (deviceId) {
    query.set('device_id', deviceId);
  }

  await client.request(`me/player/queue?${query.toString()}`, {
    method: 'POST',
  });

  return compactObject({
    uri,
    deviceId,
  });
}

export async function addManyToQueue(client: SpotifyQueueClient, options: QueueAddManyOptions) {
  const added = [];

  for (const uri of options.uris) {
    added.push(await addToQueue(client, { uri, deviceId: options.deviceId }));
  }

  return {
    added,
    count: added.length,
  };
}

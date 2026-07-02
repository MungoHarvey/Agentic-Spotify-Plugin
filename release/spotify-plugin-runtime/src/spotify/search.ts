// @ts-ignore - This repo resolves source .ts imports at runtime under NodeNext.
import { shapeTrack } from './shapes.ts';

declare const URLSearchParams: {
  new (init?: Record<string, string>): {
    toString(): string;
  };
};

type SpotifySearchClient = {
  request(path: string): Promise<unknown | null>;
};

type SearchTrackOptions = {
  query: string;
  limit?: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeQuery(query: string): string {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    throw new Error('Search query is required.');
  }

  return normalizedQuery;
}

function normalizeLimit(limit: number | undefined): number {
  if (limit === undefined || !Number.isFinite(limit)) {
    return 10;
  }

  return Math.min(50, Math.max(1, Math.trunc(limit)));
}

function readTrackItems(response: unknown): Record<string, unknown>[] {
  if (!isRecord(response) || !isRecord(response.tracks) || !Array.isArray(response.tracks.items)) {
    return [];
  }

  return response.tracks.items.filter(isRecord);
}

function shapeSearchTrack(track: Record<string, unknown>) {
  return {
    ...shapeTrack(track),
    ...(typeof track.popularity === 'number' && Number.isFinite(track.popularity)
      ? { popularity: track.popularity }
      : {}),
  };
}

export async function searchTracks(client: SpotifySearchClient, options: SearchTrackOptions) {
  const query = normalizeQuery(options.query);
  const limit = normalizeLimit(options.limit);
  const params = new URLSearchParams({
    q: query,
    type: 'track',
    limit: String(limit),
  });
  const response = await client.request(`search?${params.toString()}`);
  const candidates = readTrackItems(response).map((track) => shapeSearchTrack(track));

  return {
    query,
    candidates,
  };
}

export async function resolveTrack(client: SpotifySearchClient, options: SearchTrackOptions) {
  const result = await searchTracks(client, options);
  const selected = result.candidates.length === 1 ? result.candidates[0] : undefined;

  return {
    ...result,
    ambiguous: result.candidates.length !== 1,
    selected,
  };
}

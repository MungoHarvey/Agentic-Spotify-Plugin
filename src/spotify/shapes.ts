type RecordLike = Record<string, unknown> | null | undefined;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
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

function readRecord(value: RecordLike): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function readBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function readNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function readStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const strings = value.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0);

  return strings.length > 0 ? strings : undefined;
}

function readNestedName(value: unknown): string | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  return readString(value.name);
}

function shapeCommonItem(item: Record<string, unknown>) {
  return compactObject({
    type: readString(item.type),
    id: readString(item.id),
    uri: readString(item.uri),
    name: readString(item.name),
  });
}

function shapePlayableItem(item: RecordLike) {
  const record = readRecord(item);
  const type = readString(record.type);

  if (type === 'track') {
    return shapeTrack(record);
  }

  if (type === 'episode') {
    return shapeEpisode(record);
  }

  return shapeCommonItem(record);
}

export function shapeUser(user: RecordLike) {
  const record = readRecord(user);

  return compactObject({
    id: readString(record.id),
    displayName: readString(record.display_name),
    country: readString(record.country),
    product: readString(record.product),
    uri: readString(record.uri),
  });
}

export function shapeDevice(device: RecordLike) {
  const record = readRecord(device);

  return compactObject({
    id: readString(record.id),
    name: readString(record.name),
    type: readString(record.type),
    isActive: readBoolean(record.is_active),
    isRestricted: readBoolean(record.is_restricted),
    volumePercent: readNumber(record.volume_percent),
  });
}

export function shapeTrack(track: RecordLike) {
  const record = readRecord(track);
  const artists = Array.isArray(record.artists) ? record.artists : undefined;

  return compactObject({
    ...shapeCommonItem(record),
    artistNames: artists
      ? readStringArray(artists.map((artist) => (isRecord(artist) ? artist.name : undefined)))
      : undefined,
    albumName: readNestedName(record.album),
    durationMs: readNumber(record.duration_ms),
    explicit: readBoolean(record.explicit),
    isPlayable: readBoolean(record.is_playable),
  });
}

export function shapeEpisode(episode: RecordLike) {
  const record = readRecord(episode);

  return compactObject({
    ...shapeCommonItem(record),
    showName: readNestedName(record.show),
    durationMs: readNumber(record.duration_ms),
    explicit: readBoolean(record.explicit),
    isPlayable: readBoolean(record.is_playable),
  });
}

export function shapePlaylist(playlist: RecordLike) {
  const record = readRecord(playlist);

  return compactObject({
    id: readString(record.id),
    uri: readString(record.uri),
    name: readString(record.name),
    ownerId: isRecord(record.owner) ? readString(record.owner.id) : undefined,
    public: readBoolean(record.public),
    collaborative: readBoolean(record.collaborative),
    snapshotId: readString(record.snapshot_id),
    trackTotal: isRecord(record.tracks) ? readNumber(record.tracks.total) : undefined,
  });
}

export function shapePlayback(playback: RecordLike) {
  const record = readRecord(playback);
  const item = isRecord(record.item) ? record.item : undefined;

  return compactObject({
    isPlaying: readBoolean(record.is_playing),
    progressMs: readNumber(record.progress_ms),
    device: isRecord(record.device) ? shapeDevice(record.device) : undefined,
    item:
      item ? shapePlayableItem(item) : undefined,
    contextUri: isRecord(record.context) ? readString(record.context.uri) : undefined,
  });
}

export function shapePlaylistItem(playlistItem: RecordLike, position?: number) {
  const record = readRecord(playlistItem);
  const item = isRecord(record.track) ? record.track : undefined;

  return compactObject({
    position,
    addedAt: readString(record.added_at),
    addedById: isRecord(record.added_by) ? readString(record.added_by.id) : undefined,
    isLocal: readBoolean(record.is_local),
    item: item ? shapePlayableItem(item) : undefined,
  });
}

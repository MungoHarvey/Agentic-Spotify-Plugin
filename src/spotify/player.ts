// @ts-ignore - This repo resolves source .ts imports at runtime under NodeNext.
import { shapeDevice, shapePlayback } from './shapes.ts';

type RecordLike = Record<string, unknown> | null | undefined;

type SpotifyPlayerClient = {
  request(path: string, init?: { method?: string }): Promise<unknown | null>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readDevices(response: unknown): RecordLike[] {
  if (!isRecord(response) || !Array.isArray(response.devices)) {
    return [];
  }

  return response.devices as RecordLike[];
}

export async function getPlayerDevices(client: SpotifyPlayerClient) {
  const response = await client.request('me/player/devices');

  return {
    devices: readDevices(response).map((device) => shapeDevice(device)),
  };
}

export async function getPlaybackState(client: SpotifyPlayerClient) {
  const response = await client.request('me/player');

  if (response === null) {
    return {
      active: false,
    };
  }

  return {
    active: true,
    ...shapePlayback(response as RecordLike),
  };
}

export async function getCurrentlyPlaying(client: SpotifyPlayerClient) {
  const response = await client.request('me/player/currently-playing');

  if (response === null) {
    return {
      current: false,
    };
  }

  return {
    current: true,
    ...shapePlayback(response as RecordLike),
  };
}

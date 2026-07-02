// @ts-ignore - This repo resolves source .ts imports at runtime under NodeNext.
import { shapeUser } from './shapes.ts';

type SpotifyAccountClient = {
  request(path: string, init?: { method?: string }): Promise<unknown | null>;
};

export async function getCurrentUser(client: SpotifyAccountClient) {
  return shapeUser((await client.request('me')) as Record<string, unknown> | null | undefined);
}

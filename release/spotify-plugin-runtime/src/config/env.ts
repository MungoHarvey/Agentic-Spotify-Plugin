export type SpotifyEnv = Record<string, string | undefined>;

export type SpotifyConfig = {
  clientId: string;
  redirectUri: string;
  scopes: string[];
};

const DEFAULT_REDIRECT_URI = 'http://127.0.0.1:43210/callback';

const DEFAULT_SCOPES = [
  'playlist-read-private',
  'playlist-read-collaborative',
  'playlist-modify-private',
  'playlist-modify-public',
  'user-read-playback-state',
  'user-read-currently-playing',
  'user-modify-playback-state',
  'streaming',
  'user-read-private',
];

function parseScopes(value: string | undefined): string[] {
  if (!value || !value.trim()) {
    return [...DEFAULT_SCOPES];
  }

  return value.trim().split(/\s+/);
}

export function loadSpotifyConfig(env: SpotifyEnv): SpotifyConfig {
  const clientId = env.SPOTIFY_CLIENT_ID?.trim();

  if (!clientId) {
    throw new Error('Missing required environment variable SPOTIFY_CLIENT_ID.');
  }

  return {
    clientId,
    redirectUri: env.SPOTIFY_REDIRECT_URI?.trim() || DEFAULT_REDIRECT_URI,
    scopes: parseScopes(env.SPOTIFY_SCOPES),
  };
}

export type SpotifyEnv = Record<string, string | undefined>;

export type SpotifyConfig = {
  clientId: string;
  redirectUri: string;
  scopes: string[];
};

export type SpotifyClientIdSource = 'env' | 'token-store';

export type SpotifyClientIdResolution = {
  clientId: string;
  source: SpotifyClientIdSource;
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

export function resolveSpotifyClientId(
  env: SpotifyEnv,
  storedClientId?: string,
): SpotifyClientIdResolution {
  const envClientId = env.SPOTIFY_CLIENT_ID?.trim();

  if (envClientId) {
    return {
      clientId: envClientId,
      source: 'env',
    };
  }

  const tokenStoreClientId = storedClientId?.trim();

  if (tokenStoreClientId) {
    return {
      clientId: tokenStoreClientId,
      source: 'token-store',
    };
  }

  throw new Error(
    'Missing Spotify client ID. Set SPOTIFY_CLIENT_ID or run spotify auth login again to persist the client ID.',
  );
}

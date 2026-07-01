// @ts-ignore - This repo resolves source .ts imports at runtime under NodeNext.
import { createSpotifyApiError } from './errors.ts';
// @ts-ignore - This repo resolves source .ts imports at runtime under NodeNext.
import { isTokenExpired, type StoredTokenData } from '../auth/tokens.ts';

declare function setTimeout(handler: () => void, timeout?: number): unknown;

type SpotifyHeaders = Record<string, string>;

type SpotifyRequestInit = {
  method?: string;
  headers?: SpotifyHeaders;
  body?: string;
};

type SpotifyFetchResponse = {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
  headers?: {
    get(name: string): unknown;
  };
};

type SpotifyFetchImpl = (url: string, init: {
  method: string;
  headers: SpotifyHeaders;
  body?: string;
}) => Promise<SpotifyFetchResponse>;

type SpotifyClientOptions = {
  fetchImpl: SpotifyFetchImpl;
  readAccessToken?: () => string | Promise<string>;
  readTokenData?: () => StoredTokenData | null | Promise<StoredTokenData | null>;
  refreshTokenData?: (tokenData: StoredTokenData) => StoredTokenData | Promise<StoredTokenData>;
  writeTokenData?: (tokenData: StoredTokenData) => void | Promise<void>;
  sleep?: (milliseconds: number) => void | Promise<void>;
  baseUrl?: string;
  tokenRefreshSkewMs?: number;
};

type SpotifyClient = {
  request(path: string, init?: SpotifyRequestInit): Promise<unknown | null>;
};

declare const URL: {
  new (input: string, base?: string): {
    toString(): string;
  };
};

function isAbsoluteUrl(value: string): boolean {
  try {
    return new URL(value).toString() === value || value.startsWith('http://') || value.startsWith('https://');
  } catch {
    return false;
  }
}

function resolveSpotifyUrl(baseUrl: string, path: string): string {
  if (isAbsoluteUrl(path)) {
    return path;
  }

  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const normalizedPath = path.replace(/^\/+/, '');

  return new URL(normalizedPath, `${normalizedBase}/`).toString();
}

function cloneHeaders(headers: SpotifyHeaders | undefined): SpotifyHeaders {
  return {
    ...(headers ?? {}),
  };
}

function isStoredTokenData(value: unknown): value is StoredTokenData {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as StoredTokenData).accessToken === 'string' &&
    typeof (value as StoredTokenData).refreshToken === 'string' &&
    typeof (value as StoredTokenData).expiresAt === 'number'
  );
}

async function persistTokenData(
  writeTokenData: SpotifyClientOptions['writeTokenData'],
  tokenData: StoredTokenData,
): Promise<void> {
  if (writeTokenData) {
    await writeTokenData(tokenData);
  }
}

async function refreshTokenDataIfNeeded(
  tokenData: StoredTokenData,
  refreshTokenData: SpotifyClientOptions['refreshTokenData'],
  writeTokenData: SpotifyClientOptions['writeTokenData'],
): Promise<StoredTokenData> {
  if (!refreshTokenData) {
    throw new Error('Spotify token data is expired, but no refresh function was provided.');
  }

  const refreshedTokenData = await refreshTokenData(tokenData);

  if (!isStoredTokenData(refreshedTokenData)) {
    throw new Error('Spotify refresh did not return valid token data.');
  }

  await persistTokenData(writeTokenData, refreshedTokenData);

  return refreshedTokenData;
}

async function readResponseBody(response: SpotifyFetchResponse): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return await response.text();
  }
}

async function defaultSleep(milliseconds: number): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

async function maybeSleep(
  sleep: SpotifyClientOptions['sleep'],
  retryAfterSeconds: number | undefined,
): Promise<void> {
  if (sleep && retryAfterSeconds !== undefined) {
    await sleep(retryAfterSeconds * 1000);
  }
}

export function createSpotifyClient({
  fetchImpl,
  readAccessToken,
  readTokenData,
  refreshTokenData,
  writeTokenData,
  sleep = defaultSleep,
  baseUrl = 'https://api.spotify.com/v1',
  tokenRefreshSkewMs = 60000,
}: SpotifyClientOptions): SpotifyClient {
  return {
    async request(path, init = {}) {
      let tokenData = await readTokenData?.();
      let accessToken = tokenData?.accessToken?.trim();

      if (tokenData && isTokenExpired(tokenData, Date.now(), tokenRefreshSkewMs)) {
        tokenData = await refreshTokenDataIfNeeded(tokenData, refreshTokenData, writeTokenData);
        accessToken = tokenData.accessToken.trim();
      }

      if (!accessToken) {
        accessToken = (await readAccessToken?.())?.trim();
      }

      if (!accessToken) {
        throw new Error('Spotify access token is missing.');
      }

      const headers = cloneHeaders(init.headers);
      headers.Authorization = `Bearer ${accessToken}`;
      const method = init.method ?? 'GET';
      const requestUrl = resolveSpotifyUrl(baseUrl, path);

      let unauthorizedRetries = 0;
      let rateLimitRetries = 0;

      while (true) {
        const response = await fetchImpl(requestUrl, {
          method,
          headers,
          ...(init.body !== undefined ? { body: init.body } : {}),
        });

        if (!response.ok && response.status === 401 && tokenData && refreshTokenData && unauthorizedRetries < 1) {
          tokenData = await refreshTokenDataIfNeeded(tokenData, refreshTokenData, writeTokenData);
          headers.Authorization = `Bearer ${tokenData.accessToken.trim()}`;
          unauthorizedRetries += 1;
          continue;
        }

        if (!response.ok && response.status === 429 && rateLimitRetries < 1) {
          const rateLimitError = createSpotifyApiError(response.status, await readResponseBody(response), response.headers);

          if (rateLimitError.retryAfterSeconds !== undefined) {
            await maybeSleep(sleep, rateLimitError.retryAfterSeconds);
            rateLimitRetries += 1;
            continue;
          }
        }

        if (response.status === 204) {
          return null;
        }

        if (!response.ok) {
          throw createSpotifyApiError(response.status, await readResponseBody(response), response.headers);
        }

        return response.json();
      }
    },
  };
}

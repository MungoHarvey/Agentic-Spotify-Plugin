import type { StoredTokenData } from './tokens.ts';

declare const URLSearchParams: {
  new (): {
    append(name: string, value: string): void;
    toString(): string;
  };
};

type TokenEndpointRequestInit = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};

type TokenEndpointFetch = (
  url: string,
  init?: TokenEndpointRequestInit,
) => Promise<TokenEndpointResponse>;

type TokenEndpointResponse = {
  ok: boolean;
  status: number;
  json(): Promise<TokenEndpointBody>;
};

type TokenEndpointBody = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
};

type AuthorizationCodeExchangeInput = {
  clientId: string;
  redirectUri: string;
  code: string;
  codeVerifier: string;
  fetchImpl: TokenEndpointFetch;
};

type RefreshTokenExchangeInput = {
  clientId: string;
  refreshToken: string;
  fetchImpl: TokenEndpointFetch;
};

const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';

function createTokenRequestBody(fields: Array<[string, string]>): string {
  const params = new URLSearchParams();

  for (const [name, value] of fields) {
    params.append(name, value);
  }

  return params.toString();
}

function buildTokenRequestInit(body: string): TokenEndpointRequestInit {
  return {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body,
  };
}

async function requestSpotifyToken(
  fetchImpl: TokenEndpointFetch,
  body: string,
): Promise<TokenEndpointBody> {
  const response = await fetchImpl(TOKEN_ENDPOINT, buildTokenRequestInit(body));

  if (!response.ok) {
    throw new Error(`Spotify token request failed with status ${response.status}.`);
  }

  return response.json();
}

function normalizeScopes(scope: string | undefined): string[] {
  if (!scope || !scope.trim()) {
    return [];
  }

  return scope.trim().split(/\s+/);
}

function normalizeTokenData(
  tokenBody: TokenEndpointBody,
  refreshToken: string | undefined,
  requireRefreshToken: boolean,
): StoredTokenData {
  const accessToken = tokenBody.access_token?.trim();
  const expiresIn = tokenBody.expires_in;
  const normalizedRefreshToken = refreshToken?.trim();

  if (!accessToken) {
    throw new Error('Spotify token response was missing an access token.');
  }

  if (typeof expiresIn !== 'number' || !Number.isFinite(expiresIn) || expiresIn <= 0) {
    throw new Error('Spotify token response was missing a valid expires_in value.');
  }

  if (requireRefreshToken && !normalizedRefreshToken) {
    throw new Error('Spotify token response was missing a refresh token.');
  }

  const obtainedAt = Date.now();

  return {
    accessToken,
    refreshToken: normalizedRefreshToken || '',
    expiresAt: obtainedAt + expiresIn * 1000,
    tokenType: tokenBody.token_type?.trim() || undefined,
    scope: normalizeScopes(tokenBody.scope),
    obtainedAt,
  };
}

export async function exchangeAuthorizationCode({
  clientId,
  redirectUri,
  code,
  codeVerifier,
  fetchImpl,
}: AuthorizationCodeExchangeInput): Promise<StoredTokenData> {
  const tokenBody = await requestSpotifyToken(
    fetchImpl,
    createTokenRequestBody([
      ['grant_type', 'authorization_code'],
      ['code', code],
      ['redirect_uri', redirectUri],
      ['client_id', clientId],
      ['code_verifier', codeVerifier],
    ]),
  );

  return normalizeTokenData(tokenBody, tokenBody.refresh_token, true);
}

export async function refreshAccessToken({
  clientId,
  refreshToken,
  fetchImpl,
}: RefreshTokenExchangeInput): Promise<StoredTokenData> {
  const tokenBody = await requestSpotifyToken(
    fetchImpl,
    createTokenRequestBody([
      ['grant_type', 'refresh_token'],
      ['refresh_token', refreshToken],
      ['client_id', clientId],
    ]),
  );

  return normalizeTokenData(tokenBody, tokenBody.refresh_token || refreshToken, false);
}

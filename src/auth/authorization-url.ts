import type { SpotifyConfig } from '../config/env.ts';

type AuthorizationSearchParams = {
  set(name: string, value: string): void;
  get(name: string): string | null;
};

type AuthorizationUrl = {
  origin: string;
  pathname: string;
  searchParams: AuthorizationSearchParams;
};

declare const URL: {
  new (input: string): AuthorizationUrl;
};

export type AuthorizationUrlInput = SpotifyConfig & {
  state: string;
  codeChallenge: string;
};

export function buildAuthorizationUrl({
  clientId,
  redirectUri,
  scopes,
  state,
  codeChallenge,
}: AuthorizationUrlInput): AuthorizationUrl {
  const url = new URL('https://accounts.spotify.com/authorize');

  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', scopes.join(' '));
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('code_challenge', codeChallenge);

  return url;
}

// @ts-ignore - Node types are not wired into this scaffold yet.
import { spawn } from 'node:child_process';
// @ts-ignore - Importing local TS modules directly is how this scaffold runs under NodeNext.
import { startCallbackServer, type StartedCallbackServer } from '../../auth/callback-server.ts';
// @ts-ignore - Importing local TS modules directly is how this scaffold runs under NodeNext.
import { buildAuthorizationUrl } from '../../auth/authorization-url.ts';
// @ts-ignore - Importing local TS modules directly is how this scaffold runs under NodeNext.
import { exchangeAuthorizationCode, refreshAccessToken } from '../../auth/token-exchange.ts';
// @ts-ignore - Importing local TS modules directly is how this scaffold runs under NodeNext.
import { createAuthStatus, deleteTokenStore, readTokenStore, writeTokenStore as persistTokenStore } from '../../auth/token-store.ts';
// @ts-ignore - Importing local TS modules directly is how this scaffold runs under NodeNext.
import { createCodeChallenge, generateCodeVerifier } from '../../auth/pkce.ts';
// @ts-ignore - Importing local TS modules directly is how this scaffold runs under NodeNext.
import { generateOAuthState } from '../../auth/oauth-state.ts';
// @ts-ignore - Importing local TS modules directly is how this scaffold runs under NodeNext.
import type { StoredTokenData } from '../../auth/tokens.ts';
// @ts-ignore - Importing local TS modules directly is how this scaffold runs under NodeNext.
import { loadSpotifyConfig } from '../../config/env.ts';
// @ts-ignore - Importing local TS modules directly is how this scaffold runs under NodeNext.
import { getTokenStorePathHint, resolveTokenStorePathSync } from '../../config/paths.ts';

declare const process: {
  argv: string[];
  env: Record<string, string | undefined>;
  platform: string;
  exitCode?: number;
  stdout: {
    write(value: string): void;
  };
  stderr: {
    write(value: string): void;
  };
};

type AuthCliEnv = {
  SPOTIFY_TOKEN_PATH?: string;
};

type AuthStatusOutput =
  | {
      authenticated: false;
    }
  | {
      authenticated: true;
      expiresAt: number;
      scopes: string[];
      tokenType?: string;
      obtainedAt?: number;
    };

type AuthSuccessStatus = Extract<AuthStatusOutput, { authenticated: true }>;

type LoginPayload = {
  authorizationUrl: string;
  redirectUri: string;
  scopes: string[];
  state: string;
};

type AuthLoginSessionPayload = LoginPayload & {
  authenticated: AuthSuccessStatus;
  tokenStorePath: string;
};

type AuthRefreshSessionPayload = {
  authenticated: AuthSuccessStatus;
  tokenStorePath: string;
};

type AuthLoginSessionEnv = AuthCliEnv & Record<string, string | undefined>;

type AuthLoginSessionOptions = {
  json: boolean;
  env: AuthLoginSessionEnv;
  tokenStorePath?: string;
  openBrowser?: (url: string) => Promise<void> | void;
  waitForCallback?: (input: {
    expectedState: string;
    redirectUri: string;
  }) => Promise<{
    code: string;
    state: string;
  }>;
  exchangeAuthorizationCode?: (input: {
    clientId: string;
    redirectUri: string;
    code: string;
    codeVerifier: string;
    fetchImpl: typeof fetch;
  }) => Promise<StoredTokenData>;
  writeTokenStore?: (filePath: string, tokenData: StoredTokenData) => Promise<void>;
  createCodeVerifier?: () => string;
  createOAuthState?: () => string;
  loadSpotifyConfig?: (env: AuthLoginSessionEnv) => ReturnType<typeof loadSpotifyConfig>;
  buildAuthorizationUrl?: typeof buildAuthorizationUrl;
  getTokenStorePath?: (env: AuthLoginSessionEnv) => string;
  stdout?: {
    write(value: string): void;
  };
  stderr?: {
    write(value: string): void;
  };
};

type AuthRefreshSessionEnv = AuthCliEnv & Record<string, string | undefined>;

type AuthRefreshSessionOptions = {
  json: boolean;
  env: AuthRefreshSessionEnv;
  tokenStorePath?: string;
  refreshAccessToken?: (input: {
    clientId: string;
    refreshToken: string;
    fetchImpl: typeof fetch;
  }) => Promise<StoredTokenData>;
  readTokenStore?: (filePath: string) => Promise<StoredTokenData | null>;
  writeTokenStore?: (filePath: string, tokenData: StoredTokenData) => Promise<void>;
  loadSpotifyConfig?: (env: AuthRefreshSessionEnv) => ReturnType<typeof loadSpotifyConfig>;
  getTokenStorePath?: (env: AuthRefreshSessionEnv) => string;
  stdout?: {
    write(value: string): void;
  };
  stderr?: {
    write(value: string): void;
  };
};

declare const fetch: {
  (...args: any[]): Promise<any>;
};

function getTokenStorePath(env: AuthLoginEnv): string {
  return env.SPOTIFY_TOKEN_PATH?.trim() || resolveTokenStorePathSync();
}

type AuthLoginEnv = AuthLoginSessionEnv;

function serializeAuthorizationUrl(url: {
  origin: string;
  pathname: string;
  searchParams: {
    toString(): string;
  };
}): string {
  const search = url.searchParams.toString();

  return `${url.origin}${url.pathname}${search ? `?${search}` : ''}`;
}

function formatAuthStatusText(status: AuthStatusOutput): string {
  if (!status.authenticated) {
    return ['Auth status: unauthenticated', ''].join('\n');
  }

  const lines = [
    'Auth status: authenticated',
    `Expires at: ${status.expiresAt}`,
    `Scopes: ${status.scopes.length > 0 ? status.scopes.join(', ') : '(none)'}`,
  ];

  if (status.tokenType) {
    lines.push(`Token type: ${status.tokenType}`);
  }

  if (typeof status.obtainedAt === 'number') {
    lines.push(`Obtained at: ${status.obtainedAt}`);
  }

  return `${lines.join('\n')}\n`;
}

function formatLoginText(payload: LoginPayload): string {
  return `Authorization URL: ${payload.authorizationUrl}\n`;
}

function formatLoginSuccessText(payload: AuthLoginSessionPayload): string {
  const lines = [
    'Spotify login complete.',
    `Token store: ${payload.tokenStorePath}`,
    `Redirect URI: ${payload.redirectUri}`,
    `Scopes: ${payload.scopes.length > 0 ? payload.scopes.join(', ') : '(none)'}`,
    `State: ${payload.state}`,
    `Authenticated: ${payload.authenticated.authenticated ? 'yes' : 'no'}`,
  ];

  return `${lines.join('\n')}\n`;
}

function formatRefreshSuccessText(payload: AuthRefreshSessionPayload): string {
  const lines = [
    'Spotify token refreshed.',
    `Token store: ${payload.tokenStorePath}`,
    `Expires at: ${payload.authenticated.expiresAt}`,
    `Scopes: ${payload.authenticated.scopes.length > 0 ? payload.authenticated.scopes.join(', ') : '(none)'}`,
  ];

  if (payload.authenticated.tokenType) {
    lines.push(`Token type: ${payload.authenticated.tokenType}`);
  }

  if (typeof payload.authenticated.obtainedAt === 'number') {
    lines.push(`Obtained at: ${payload.authenticated.obtainedAt}`);
  }

  return `${lines.join('\n')}\n`;
}

function writeAuthError(message: string, stderr = process.stderr): number {
  stderr.write(`${message}\n`);
  return 1;
}

function createLoginPayload(env: AuthLoginEnv): LoginPayload {
  const config = loadSpotifyConfig(env);
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = createCodeChallenge(codeVerifier);
  const state = generateOAuthState();
  const authorizationUrl = buildAuthorizationUrl({
    ...config,
    state,
    codeChallenge,
  });

  return {
    authorizationUrl: serializeAuthorizationUrl(authorizationUrl),
    redirectUri: config.redirectUri,
    scopes: [...config.scopes],
    state,
  };
}

export function createBrowserOpenCommand(platform: string, url: string): {
  command: string;
  args: string[];
} {
  if (platform === 'win32') {
    return {
      command: 'rundll32.exe',
      args: ['url.dll,FileProtocolHandler', url],
    };
  }

  return {
    command: platform === 'darwin' ? 'open' : 'xdg-open',
    args: [url],
  };
}

function createBrowserOpener(): (url: string) => Promise<void> {
  return async (url: string) => {
    const { command, args } = createBrowserOpenCommand(process.platform, url);

    await new Promise<void>((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: 'ignore',
        detached: true,
      });

      child.on('error', reject);
      child.on('spawn', () => {
        child.unref();
        resolve();
      });
    });
  };
}

async function runAuthLoginSessionInternal({
  json,
  env,
  tokenStorePath,
  openBrowser = createBrowserOpener(),
  waitForCallback,
  exchangeAuthorizationCode: exchangeCode = exchangeAuthorizationCode,
  writeTokenStore: writeStore = persistTokenStore,
  createCodeVerifier: createVerifier = generateCodeVerifier,
  createOAuthState: createState = generateOAuthState,
  loadSpotifyConfig: loadConfig = loadSpotifyConfig,
  buildAuthorizationUrl: buildUrl = buildAuthorizationUrl,
  getTokenStorePath: getStorePath = getTokenStorePath,
  stdout = process.stdout,
  stderr = process.stderr,
}: AuthLoginSessionOptions): Promise<number> {
  let callbackServer: StartedCallbackServer | null = null;

  try {
    const config = loadConfig(env);
    const codeVerifier = createVerifier();
    const state = createState();
    const redirectUri = config.redirectUri;
    const tokenPath = tokenStorePath?.trim() || getStorePath(env);
    const callbackResult = waitForCallback
      ? waitForCallback({
          expectedState: state,
          redirectUri,
        })
      : (async () => {
          callbackServer = await startCallbackServer({
            expectedState: state,
            redirectUri,
          });
          return callbackServer.waitForCallback;
        })();

    const authorizationUrl = serializeAuthorizationUrl(
      buildUrl({
        ...config,
        redirectUri,
        state,
        codeChallenge: createCodeChallenge(codeVerifier),
      })
    );

    await openBrowser(authorizationUrl);

    const callback = await callbackResult;

    if (callback.state !== state) {
      throw new Error('OAuth state mismatch.');
    }

    const tokenExchangeInput = {
      clientId: config.clientId,
      redirectUri,
      code: callback.code,
      codeVerifier,
    } as {
      clientId: string;
      redirectUri: string;
      code: string;
      codeVerifier: string;
      fetchImpl?: typeof fetch;
    };

    if (exchangeCode === exchangeAuthorizationCode) {
      tokenExchangeInput.fetchImpl = fetch;
    }

    const tokenData = await exchangeCode(tokenExchangeInput as Parameters<typeof exchangeCode>[0]);

    await writeStore(tokenPath, tokenData);

    const payload: AuthLoginSessionPayload = {
      authorizationUrl,
      redirectUri,
      scopes: [...config.scopes],
      state,
      authenticated: createAuthStatus(tokenData) as AuthSuccessStatus,
      tokenStorePath: tokenPath,
    };

    if (json) {
      stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    } else {
      stdout.write(formatLoginSuccessText(payload));
    }

    return 0;
  } catch (error) {
    return writeAuthError(error instanceof Error ? error.message : 'Spotify login failed.', stderr);
  } finally {
    if (callbackServer !== null) {
      await (callbackServer as StartedCallbackServer).close();
    }
  }
}

export async function runAuthLoginSession(options: AuthLoginSessionOptions): Promise<number> {
  return runAuthLoginSessionInternal(options);
}

function detectJsonFlag(argv: string[]): boolean {
  return argv.includes('--json');
}

function getRefreshTokenOrThrow(tokenData: StoredTokenData | null): string {
  if (!tokenData) {
    throw new Error('Not authenticated. Run spotify auth login first.');
  }

  const refreshToken = tokenData.refreshToken.trim();

  if (!refreshToken) {
    throw new Error('Stored token data is missing a refresh token.');
  }

  return refreshToken;
}

function mergeRefreshedTokenData(
  currentTokenData: StoredTokenData,
  refreshedTokenData: StoredTokenData,
): StoredTokenData {
  const refreshToken = refreshedTokenData.refreshToken.trim() || currentTokenData.refreshToken.trim();

  if (!refreshToken) {
    throw new Error('Stored token data is missing a refresh token.');
  }

  return {
    ...refreshedTokenData,
    refreshToken,
  };
}

async function runAuthRefreshSessionInternal({
  json,
  env,
  tokenStorePath,
  refreshAccessToken: refreshTokenExchange = refreshAccessToken,
  readTokenStore: readStore = readTokenStore,
  writeTokenStore: writeStore = persistTokenStore,
  loadSpotifyConfig: loadConfig = loadSpotifyConfig,
  getTokenStorePath: getStorePath = getTokenStorePath,
  stdout = process.stdout,
  stderr = process.stderr,
}: AuthRefreshSessionOptions): Promise<number> {
  try {
    const config = loadConfig(env);
    const tokenPath = tokenStorePath?.trim() || getStorePath(env);
    const tokenData = await readStore(tokenPath);
    if (!tokenData) {
      throw new Error('Unauthenticated. Run spotify auth login first.');
    }

    const refreshToken = getRefreshTokenOrThrow(tokenData);
    const refreshedTokenData = await refreshTokenExchange({
      clientId: config.clientId,
      refreshToken,
      fetchImpl: fetch,
    });
    const updatedTokenData = mergeRefreshedTokenData(tokenData, refreshedTokenData);

    await writeStore(tokenPath, updatedTokenData);

    const payload: AuthRefreshSessionPayload = {
      authenticated: createAuthStatus(updatedTokenData) as AuthSuccessStatus,
      tokenStorePath: tokenPath,
    };

    if (json) {
      stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    } else {
      stdout.write(formatRefreshSuccessText(payload));
    }

    return 0;
  } catch (error) {
    return writeAuthError(error instanceof Error ? error.message : 'Spotify refresh failed.', stderr);
  }
}

export async function runAuthRefreshSession(options: AuthRefreshSessionOptions): Promise<number> {
  return runAuthRefreshSessionInternal(options);
}

export function runAuthLoginCommand(json: boolean, env: AuthLoginEnv): number {
  try {
    const payload = createLoginPayload(env);

    if (json) {
      process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
      return 0;
    }

    process.stdout.write(formatLoginText(payload));
    return 0;
  } catch (error) {
    if (error instanceof Error) {
      return writeAuthError(error.message);
    }

    return writeAuthError('Unable to build the Spotify authorization URL.');
  }
}

export async function runAuthRefreshCommand(json = detectJsonFlag(process.argv), env = process.env): Promise<number> {
  return runAuthRefreshSession({
    json,
    env,
  });
}

async function runStatusCommand(json: boolean, tokenPath: string): Promise<void> {
  const tokenData = await readTokenStore(tokenPath);
  const status = createAuthStatus(tokenData);

  if (json) {
    process.stdout.write(`${JSON.stringify(status, null, 2)}\n`);
    return;
  }

  process.stdout.write(formatAuthStatusText(status));
}

async function runLogoutCommand(tokenPath: string): Promise<void> {
  await deleteTokenStore(tokenPath);
  process.stdout.write('Logged out.\n');
}

export async function runAuthCommand(argv: string[], env = process.env): Promise<number> {
  const tokenPath = getTokenStorePath(env);
  const [command, ...rest] = argv;

  if (command === 'login') {
    if (rest.includes('--url-only')) {
      return runAuthLoginCommand(rest.includes('--json'), env);
    }

    return runAuthLoginSession({
      json: rest.includes('--json'),
      env,
    });
  }

  if (command === 'refresh') {
    return runAuthRefreshCommand(rest.includes('--json'), env);
  }

  if (command === 'status') {
    await runStatusCommand(rest.includes('--json'), tokenPath);
    return 0;
  }

  if (command === 'logout') {
    await runLogoutCommand(tokenPath);
    return 0;
  }

  process.stdout.write('Unknown auth command.\n');
  return 1;
}

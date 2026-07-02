// @ts-ignore - Node types are not wired into this scaffold yet.
import { createServer } from 'node:http';

export const LOOPBACK_HOST = '127.0.0.1';

type CallbackSearchParams = {
  get(name: string): string | null;
};

type CallbackUrl = {
  pathname: string;
  port: string;
  searchParams: CallbackSearchParams;
  toString(): string;
};

declare const URL: {
  new (input: string, base?: string): CallbackUrl;
};

type CallbackServerOptions = {
  expectedState: string;
  redirectUri?: string;
  callbackPath?: string;
};

export type CallbackResult = {
  code: string;
  state: string;
};

export type StartedCallbackServer = {
  callbackUrl: string;
  waitForCallback: Promise<CallbackResult>;
  close(): Promise<void>;
};

export function parseCallbackUrl(
  callbackUrl: string,
  expectedState: string
): { code: string; state: string } {
  const url = new URL(callbackUrl);
  const error = url.searchParams.get('error');

  if (error) {
    const description = url.searchParams.get('error_description');
    throw new Error(
      description
        ? `Spotify returned an error during authorization: ${error} (${description})`
        : `Spotify returned an error during authorization: ${error}`
    );
  }

  const code = url.searchParams.get('code');

  if (!code) {
    throw new Error('Authorization callback did not include a code.');
  }

  const state = url.searchParams.get('state');

  if (!state) {
    throw new Error('Authorization callback did not include a state.');
  }

  if (state !== expectedState) {
    throw new Error('OAuth state mismatch.');
  }

  return { code, state };
}

export function createCallbackSuccessHtml(): string {
  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '  <meta charset="utf-8">',
    '  <title>Authorization complete</title>',
    '</head>',
    '<body>',
    '  <p>Authorization complete. You can close this tab.</p>',
    '</body>',
    '</html>',
    '',
  ].join('\n');
}

export async function startCallbackServer({
  expectedState,
  redirectUri,
  callbackPath = '/callback',
}: CallbackServerOptions): Promise<StartedCallbackServer> {
  const redirectUrl = redirectUri ? new URL(redirectUri) : null;
  const requestedPath = redirectUrl?.pathname || callbackPath;
  const requestedPort = redirectUrl?.port ? Number(redirectUrl.port) : 0;
  let resolveCallback: ((value: CallbackResult) => void) | null = null;
  let rejectCallback: ((reason: Error) => void) | null = null;
  let settled = false;

  const waitForCallback = new Promise<CallbackResult>((resolve, reject) => {
    resolveCallback = resolve;
    rejectCallback = reject;
  });

  const server = createServer((request: any, response: any) => {
    try {
      if (!request.url || request.method !== 'GET') {
        response.statusCode = 405;
        response.end('Method not allowed.');
        return;
      }

      const requestUrl = new URL(request.url, `http://${LOOPBACK_HOST}`);

      if (requestUrl.pathname !== requestedPath) {
        response.statusCode = 404;
        response.end('Not found.');
        return;
      }

      const parsedCallback = parseCallbackUrl(requestUrl.toString(), expectedState);

      response.statusCode = 200;
      response.setHeader('content-type', 'text/html; charset=utf-8');
      response.end(createCallbackSuccessHtml());

      if (!settled && resolveCallback) {
        settled = true;
        resolveCallback(parsedCallback);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authorization callback failed.';

      response.statusCode = 400;
      response.setHeader('content-type', 'text/plain; charset=utf-8');
      response.end(message);

      if (!settled && rejectCallback) {
        settled = true;
        rejectCallback(error instanceof Error ? error : new Error(message));
      }
    }
  });

  await new Promise<void>((resolve) => {
    server.listen(requestedPort, LOOPBACK_HOST, resolve);
  });

  const address = server.address();

  if (!address || typeof address === 'string') {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    throw new Error('Callback server failed to bind to a loopback port.');
  }

  const callbackUrl = `http://${LOOPBACK_HOST}:${address.port}${requestedPath}`;

  return {
    callbackUrl,
    waitForCallback,
    close: async () =>
      new Promise<void>((resolve) => {
        server.close(() => resolve());
      }),
  };
}

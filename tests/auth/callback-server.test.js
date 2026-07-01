import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  LOOPBACK_HOST,
  createCallbackSuccessHtml,
  parseCallbackUrl,
} from '../../src/auth/callback-server.ts';

test('LOOPBACK_HOST is pinned to 127.0.0.1', () => {
  assert.equal(LOOPBACK_HOST, '127.0.0.1');
});

test('parseCallbackUrl returns the authorization code and state from a valid callback', () => {
  const result = parseCallbackUrl(
    'http://127.0.0.1:43210/callback?code=auth-code-123&state=oauth-state-456',
    'oauth-state-456'
  );

  assert.deepEqual(result, {
    code: 'auth-code-123',
    state: 'oauth-state-456',
  });
});

test('parseCallbackUrl throws a clear error when Spotify returns an error parameter', () => {
  assert.throws(
    () =>
      parseCallbackUrl(
        'http://127.0.0.1:43210/callback?error=access_denied&state=oauth-state-456',
        'oauth-state-456'
      ),
    {
      message: 'Spotify returned an error during authorization: access_denied',
    }
  );
});

test('parseCallbackUrl throws a clear error when the code is missing', () => {
  assert.throws(
    () =>
      parseCallbackUrl(
        'http://127.0.0.1:43210/callback?state=oauth-state-456',
        'oauth-state-456'
      ),
    {
      message: 'Authorization callback did not include a code.',
    }
  );
});

test('parseCallbackUrl throws a clear error when the state does not match exactly', () => {
  assert.throws(
    () =>
      parseCallbackUrl(
        'http://127.0.0.1:43210/callback?code=auth-code-123&state=wrong-state',
        'oauth-state-456'
      ),
    {
      message: 'OAuth state mismatch.',
    }
  );
});

test('createCallbackSuccessHtml returns a short non-secret success page', () => {
  const html = createCallbackSuccessHtml();

  assert.equal(typeof html, 'string');
  assert.match(html, /Authorization complete/i);
  assert.match(html, /You can close this tab/i);
  assert.equal(html.includes('access_token'), false);
  assert.equal(html.includes('refresh_token'), false);
  assert.equal(html.includes('client_secret'), false);
});

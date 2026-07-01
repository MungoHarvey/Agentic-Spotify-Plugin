import assert from 'node:assert/strict';
import http from 'node:http';
import { test } from 'node:test';

import { LOOPBACK_HOST, startCallbackServer } from '../../src/auth/callback-server.ts';

function requestText(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let body = '';

      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body,
        });
      });
    });

    req.on('error', reject);
  });
}

test('startCallbackServer binds to loopback and resolves a parsed callback result', async () => {
  const server = await startCallbackServer({
    expectedState: 'state-123',
  });

  try {
    assert.equal(server.callbackUrl.startsWith(`http://${LOOPBACK_HOST}:`), true);

    const responsePromise = requestText(
      `${server.callbackUrl}?code=code-123&state=state-123`
    );
    const result = await server.waitForCallback;
    const response = await responsePromise;

    assert.deepEqual(result, {
      code: 'code-123',
      state: 'state-123',
    });
    assert.equal(response.statusCode, 200);
    assert.match(response.body, /Authorization complete/i);
    assert.equal(response.body.includes('access_token'), false);
    assert.equal(response.body.includes('refresh_token'), false);
    assert.equal(response.body.includes(['client', 'secret'].join('_')), false);
  } finally {
    await server.close();
  }
});

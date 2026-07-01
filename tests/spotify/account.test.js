import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getCurrentUser } from '../../src/spotify/account.ts';

test('getCurrentUser requests the shared me path and shapes the response', async () => {
  let requestedPath = '';

  const shapedUser = await getCurrentUser({
    async request(path) {
      requestedPath = path;
      return {
        id: 'user-1',
        display_name: 'Ada',
        country: 'GB',
        product: 'premium',
        uri: 'spotify:user:user-1',
        access_token: 'should-not-leak',
      };
    },
  });

  assert.equal(requestedPath, 'me');
  assert.deepEqual(shapedUser, {
    id: 'user-1',
    displayName: 'Ada',
    country: 'GB',
    product: 'premium',
    uri: 'spotify:user:user-1',
  });
});

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { assertOAuthState, generateOAuthState } from '../../src/auth/oauth-state.ts';

test('generateOAuthState returns a url-safe non-empty string', () => {
  const state = generateOAuthState();

  assert.equal(typeof state, 'string');
  assert.ok(state.length > 0);
  assert.match(state, /^[A-Za-z0-9_-]+$/);
});

test('assertOAuthState validates exact state equality', () => {
  assert.equal(assertOAuthState('expected-state', 'expected-state'), 'expected-state');
});

test('assertOAuthState throws when the state does not match', () => {
  assert.throws(() => assertOAuthState('expected-state', 'different-state'), {
    message: 'OAuth state mismatch.',
  });
});

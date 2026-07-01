import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isTokenExpired } from '../../src/auth/tokens.ts';

test('isTokenExpired returns true when expiresAt is at the skew boundary', () => {
  assert.equal(
    isTokenExpired({ expiresAt: 1100 }, 1000, 100),
    true
  );
});

test('isTokenExpired returns false when expiresAt is beyond the skew window', () => {
  assert.equal(
    isTokenExpired({ expiresAt: 1101 }, 1000, 100),
    false
  );
});

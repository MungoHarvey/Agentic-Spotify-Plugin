import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createCodeChallenge, generateCodeVerifier } from '../../src/auth/pkce.ts';

test('generateCodeVerifier returns a url-safe high-entropy string', () => {
  const verifier = generateCodeVerifier();

  assert.equal(typeof verifier, 'string');
  assert.ok(verifier.length >= 43);
  assert.match(verifier, /^[A-Za-z0-9_-]+$/);
});

test('createCodeChallenge returns base64url(SHA256(verifier))', () => {
  assert.equal(
    createCodeChallenge('test-verifier'),
    'JBbiqONGWPaAmwXk_8bT6UnlPfrn65D32eZlJS-zGG0'
  );
});

test('createCodeChallenge is deterministic for the same verifier', () => {
  const verifier = 'test-verifier';

  assert.equal(createCodeChallenge(verifier), createCodeChallenge(verifier));
});

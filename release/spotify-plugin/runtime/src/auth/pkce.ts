// @ts-ignore - Node types are not wired into this scaffold yet.
import { createHash, randomBytes } from 'node:crypto';

export function generateCodeVerifier(): string {
  return randomBytes(32).toString('base64url');
}

export function createCodeChallenge(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}

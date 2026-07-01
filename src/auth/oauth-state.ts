// @ts-ignore - Node types are not wired into this scaffold yet.
import { randomBytes } from 'node:crypto';

export function generateOAuthState(): string {
  return randomBytes(32).toString('base64url');
}

export function assertOAuthState(expectedState: string, actualState: string): string {
  if (expectedState !== actualState) {
    throw new Error('OAuth state mismatch.');
  }

  return actualState;
}

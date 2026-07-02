export type StoredTokenData = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType?: string;
  scope?: string[];
  obtainedAt?: number;
};

export type TokenExpirySource = {
  expiresAt: number;
};

export function isTokenExpired(token: TokenExpirySource, nowMs = Date.now(), skewMs = 0): boolean {
  return token.expiresAt <= nowMs + skewMs;
}

const STATUS_REASONS = new Map([
  [401, 'unauthorized'],
  [403, 'forbidden'],
  [404, 'not_found'],
  [429, 'rate_limited'],
]);

const TOKEN_PATTERNS = [
  /\baccess[_-]?token\b[^ \t\r\n"]*/gi,
  /\brefresh[_-]?token\b[^ \t\r\n"]*/gi,
  /\bbearer\b[^ \t\r\n"]*/gi,
  /\bya29\.[A-Za-z0-9._-]+/gi,
];

function redactTokenLikeText(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  let redacted = value;

  for (const pattern of TOKEN_PATTERNS) {
    redacted = redacted.replace(pattern, '[redacted]');
  }

  return redacted;
}

function coercePositiveInteger(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const parsed = Number.parseInt(value.trim(), 10);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

type HeadersLike = Record<string, unknown> | { get(name: string): unknown };

function readHeader(headersLike: HeadersLike | undefined, name: string): unknown {
  if (!headersLike) {
    return undefined;
  }

  if (typeof headersLike === 'object' && headersLike !== null && 'get' in headersLike && typeof headersLike.get === 'function') {
    return headersLike.get(name) ?? headersLike.get(name.toLowerCase()) ?? undefined;
  }

  if (typeof headersLike !== 'object') {
    return undefined;
  }

  const record = headersLike as Record<string, unknown>;
  const direct = record[name];

  if (direct !== undefined) {
    return direct;
  }

  return record[name.toLowerCase()];
}

function getRetryAfterSeconds(body: unknown, headersLike: HeadersLike | undefined): number | undefined {
  const headerValue = coercePositiveInteger(readHeader(headersLike, 'Retry-After'));
  if (headerValue !== undefined) {
    return headerValue;
  }

  if (!body || typeof body !== 'object') {
    return undefined;
  }

  const record = body as Record<string, unknown>;
  return (
    coercePositiveInteger(record.retryAfterSeconds) ??
    coercePositiveInteger(record.retry_after_seconds) ??
    coercePositiveInteger(record.retryAfter) ??
    coercePositiveInteger(record.retry_after)
  );
}

function normalizeReason(status: number): string {
  return STATUS_REASONS.get(status) ?? 'spotify_error';
}

function normalizeMessage(status: number, reason: string): string {
  return `Spotify request failed with status ${status}: ${reason}.`;
}

export class SpotifyApiError extends Error {
  status: number;
  reason: string;
  retryAfterSeconds?: number;

  /**
   * @param {number} status
   * @param {string} reason
   * @param {{ retryAfterSeconds?: number }} [options]
   */
  constructor(status: number, reason: string, options: { retryAfterSeconds?: number } = {}) {
    super(normalizeMessage(status, reason));
    this.name = 'SpotifyApiError';
    this.status = status;
    this.reason = reason;
    if (options.retryAfterSeconds !== undefined) {
      this.retryAfterSeconds = options.retryAfterSeconds;
    }
  }
}

/**
 * @param {number} status
 * @param {unknown} [responseBody]
 * @param {HeadersLike | undefined} [headersLike]
 */
export function createSpotifyApiError(
  status: number,
  responseBody?: unknown,
  headersLike?: HeadersLike
): SpotifyApiError {
  const reason = normalizeReason(status);
  const retryAfterSeconds = status === 429 ? getRetryAfterSeconds(responseBody, headersLike) : undefined;

  return new SpotifyApiError(status, reason, { retryAfterSeconds });
}

export { redactTokenLikeText };

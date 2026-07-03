# Auth

Use the CLI-first PKCE flow for Spotify auth work.

## Implemented Commands

- `spotify auth login`: runs the PKCE browser flow, waits for the loopback callback, exchanges the code, and stores the resulting token data on disk.
- `spotify auth login --url-only`: prints the authorization URL only. It does not start the callback server, open a browser, or write tokens.
- `spotify auth login --json`: runs the persisted login flow and emits redacted JSON after tokens are stored.
- `spotify auth login --url-only --json`: emits the authorization URL payload for scripting without storing tokens.
- `spotify auth status`: reports auth state without token values.
- `spotify auth status --json`: emits machine-readable auth state.
- `spotify auth refresh`: loads stored credentials, refreshes them with the Spotify token endpoint, and rewrites the token store.
- `spotify auth refresh --json`: emits the refreshed auth payload.
- `spotify auth logout`: deletes the local token file.

## Configuration

- `SPOTIFY_CLIENT_ID` is required for first login and `auth login --url-only`.
- `auth login` persists the non-secret client ID in the token store so later refreshes can work when the environment variable is absent.
- `SPOTIFY_REDIRECT_URI` defaults to `http://127.0.0.1:43210/callback`.
- `SPOTIFY_SCOPES` defaults to `playlist-read-private playlist-read-collaborative playlist-modify-private playlist-modify-public user-read-playback-state user-read-currently-playing user-modify-playback-state streaming user-read-private`.
- `SPOTIFY_TOKEN_PATH` overrides the token store location. By default the CLI writes to a per-user file outside the repo, usually under `~/.config/spotify-codex-plugin/tokens.json` and on Windows under `%APPDATA%/spotify-codex-plugin/tokens.json` when that path is not inside the repo.

## Token Store

- Stored token data includes `accessToken`, `refreshToken`, `expiresAt`, optional non-secret `clientId`, and optional `tokenType`, `scope`, and `obtainedAt`.
- `auth status` reads the store and reports only redacted metadata, including whether a client ID is configured and whether refresh is possible.
- `auth refresh` preserves the previous refresh token when Spotify omits one in the refresh response.
- `auth refresh` preserves the stored client ID when rewriting the token store.

## Safety Rules

- Never commit access tokens, refresh tokens, client secrets, or authorization codes.
- Do not add client-secret auth to this local PKCE plugin.
- Bind callback servers to `127.0.0.1`.
- Validate OAuth `state` on callback.
- Never print token values in stdout, stderr, logs, docs, or tests.
- Use `--url-only` for non-interactive URL generation; use plain `auth login` for the persisted login flow.

## Diagnosis

- Missing `SPOTIFY_CLIENT_ID` fails before browser or token work starts for login commands.
- Missing both `SPOTIFY_CLIENT_ID` and stored `clientId` fails refresh with setup guidance.
- `spotify auth refresh` reports `Unauthenticated. Run spotify auth login first.` when no token file exists.
- `spotify auth login` fails on OAuth `state` mismatch.
- Token endpoint failures surface the HTTP status code from Spotify.
- `auth status --json` is the fastest way to confirm whether the store exists and what metadata was recovered without exposing secrets.

Do not paste token values into Codex chat.

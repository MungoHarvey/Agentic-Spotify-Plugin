# Spotify Auth Setup

This plugin uses Spotify Authorization Code with PKCE. It does not use a client secret.

## Spotify App

Create a Spotify app in the Spotify Developer Dashboard and add this redirect URI exactly:

```text
http://127.0.0.1:43210/callback
```

If the Spotify app is still in development mode, add the test Spotify account to the app allowlist.

## Local Configuration

Set `SPOTIFY_CLIENT_ID` before the first login. The client ID is not a client secret, but it
identifies the Spotify app, so prefer setting it in the user environment rather than pasting it
into chat.

PowerShell:

```powershell
[Environment]::SetEnvironmentVariable("SPOTIFY_CLIENT_ID", "<your Spotify app client ID>", "User")
```

Optional:

```text
SPOTIFY_REDIRECT_URI=http://127.0.0.1:43210/callback
SPOTIFY_SCOPES=playlist-read-private playlist-read-collaborative playlist-modify-private playlist-modify-public user-read-playback-state user-read-currently-playing user-modify-playback-state streaming user-read-private
SPOTIFY_TOKEN_PATH=<per-user token path outside this repository>
```

Restart the shell or agent runtime after setting a user environment variable. By default, tokens
are stored outside the repository under the user's app config area.

During `spotify auth login`, the plugin stores the non-secret client ID alongside the token
metadata. Later playlist, player, queue, and refresh commands can then refresh expired tokens even
when `SPOTIFY_CLIENT_ID` is not present in the current process. Existing token files created before
this behavior need either `SPOTIFY_CLIENT_ID` in the environment for one more refresh, or a fresh
`spotify auth login` to persist the client ID.

## Commands

Generate a URL without completing login:

```text
spotify auth login --url-only
```

Complete browser login and persist tokens:

```text
spotify auth login
```

Check auth state:

```text
spotify auth status --json
```

The status output includes `clientIdConfigured`, `clientIdSource`, and `refreshable` fields so an
agent can tell whether refresh will work before it attempts playlist, player, or queue commands.

Refresh stored credentials:

```text
spotify auth refresh --json
```

Remove local credentials:

```text
spotify auth logout
```

## Safety

- Never commit token files.
- Never paste access tokens, refresh tokens, auth codes, or client secrets into chat.
- Prefer setting the Spotify client ID in environment or plugin setup rather than pasting it into chat.
- Keep the callback bound to `127.0.0.1`.
- If login fails for a teammate or test account, check the Spotify app allowlist before assuming the code is wrong.

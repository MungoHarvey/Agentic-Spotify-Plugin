# Spotify Auth Setup

This plugin uses Spotify Authorization Code with PKCE. It does not use a client secret.

## Spotify App

Create a Spotify app in the Spotify Developer Dashboard and add this redirect URI exactly:

```text
http://127.0.0.1:43210/callback
```

If the Spotify app is still in development mode, add the test Spotify account to the app allowlist.

## Local Configuration

Set:

```text
SPOTIFY_CLIENT_ID=<your Spotify app client ID>
SPOTIFY_REDIRECT_URI=http://127.0.0.1:43210/callback
```

Optional:

```text
SPOTIFY_SCOPES=playlist-read-private playlist-read-collaborative playlist-modify-private playlist-modify-public user-read-playback-state user-read-currently-playing user-modify-playback-state streaming user-read-private
SPOTIFY_TOKEN_PATH=<per-user token path outside this repository>
```

By default, tokens are stored outside the repository under the user's app config area.

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
- Keep the callback bound to `127.0.0.1`.
- If login fails for a teammate or test account, check the Spotify app allowlist before assuming the code is wrong.

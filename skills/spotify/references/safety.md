# Safety

Use conservative defaults everywhere.

## Secrets

- Never commit tokens, refresh tokens, client secrets, or auth codes.
- Store credentials outside the repository.
- Keep secrets out of prompts, logs, and checked-in examples.

## Network and auth

- Bind local callback servers to `127.0.0.1`.
- Validate OAuth `state`.
- Treat browser auth failures as actionable diagnostics, not silent retries.
- Prefer CLI-first flows and keep MCP usage minimal unless a tool is already required.
- Prefer implemented read-only diagnostics before playlist writes when the target, order, or snapshot matters.

## Writes

- Make every write explicit and auditable.
- Prefer snapshot-aware playlist mutations.
- Surface partial failures and missing scopes.
- Do not imply a planned command is available until it is implemented and wired through the command layer.

## Limits

- Respect Premium and active-device requirements.
- Do not promise unsupported queue reorder or queue removal behavior.
- Treat Premium/device limitations as hard preconditions, not best-effort hints.
- Treat planned commands as planned until implementation lands in the command layer.

declare const process: {
  argv: string[];
  env: Record<string, string | undefined>;
  exitCode?: number;
  stdout: {
    write(value: string): void;
  };
};

declare const URL: {
  new (url: string): {
    pathname: string;
  };
};

// @ts-ignore - Node types are not wired into this scaffold yet.
import { runAuthCommand } from './commands/auth.ts';
// @ts-ignore - Node types are not wired into this scaffold yet.
import { runMeCommand } from './commands/me.ts';
// @ts-ignore - Node types are not wired into this scaffold yet.
import { runPlayerCommand } from './commands/player.ts';
// @ts-ignore - Node types are not wired into this scaffold yet.
import { runPlaylistCommand } from './commands/playlist.ts';
// @ts-ignore - Node types are not wired into this scaffold yet.
import { runPlaylistsCommand } from './commands/playlists.ts';
// @ts-ignore - Node types are not wired into this scaffold yet.
import { runQueueCommand } from './commands/queue.ts';
// @ts-ignore - Node types are not wired into this scaffold yet.
import { runResolveCommand, runSearchCommand } from './commands/search.ts';

const HELP_TEXT = [
  'spotify - Spotify plugin CLI',
  '',
  'Usage:',
  '  spotify <group> <command> [options]',
  '',
  'Command groups:',
  '  auth     Authentication status and login flow',
  '  me       Current account details',
  '  player   Playback and device diagnostics',
  '  playlist Playlist metadata and item workflows',
  '  playlists Playlist reads',
  '  queue    Queue inspection and additions',
  '  search   Track lookup and resolution',
  '  resolve  Ambiguity-aware lookup helpers',
  '',
  'Options:',
  '  --help   Show this help text',
  '',
  'Implemented:',
  '  auth login, auth login --url-only, auth status, auth refresh,',
  '  auth logout, me, player devices, player state, player current,',
  '  playlist get, playlist items, playlist create, playlist update,',
  '  playlist add, playlist remove, playlist remove-positions,',
  '  playlist reorder, playlist replace,',
  '  playlists list, queue get, queue add, queue add-many,',
  '  search track, and resolve track.',
  '',
  'Planned:',
  '  playback control, queue reorder/remove,',
  '  track, album, and artist commands.',
].join('\n');

function hasHelpFlag(argv: string[]): boolean {
  return argv.some((value) => value === '--help' || value === '-h');
}

function toFilePath(fileUrl: string): string {
  const pathname = decodeURIComponent(new URL(fileUrl).pathname);

  if (/^\/[A-Za-z]:\//.test(pathname)) {
    return pathname.slice(1).replace(/\//g, '\\');
  }

  return pathname;
}

const moduleUrl = (import.meta as { url: string }).url;

export function getHelpText(): string {
  return HELP_TEXT;
}

export async function main(argv: string[], env = process.env): Promise<number> {
  if (argv.length === 0 || hasHelpFlag(argv)) {
    process.stdout.write(`${HELP_TEXT}\n`);
    return 0;
  }

  if (argv[0] === 'auth') {
    return runAuthCommand(argv.slice(1), env);
  }

  if (argv[0] === 'me') {
    return runMeCommand(argv.slice(1).includes('--json'), env);
  }

  if (argv[0] === 'player') {
    return runPlayerCommand(argv.slice(1), env);
  }

  if (argv[0] === 'playlist') {
    return runPlaylistCommand(argv.slice(1), env);
  }

  if (argv[0] === 'playlists') {
    return runPlaylistsCommand(argv.slice(1), env);
  }

  if (argv[0] === 'queue') {
    return runQueueCommand(argv.slice(1), env);
  }

  if (argv[0] === 'search') {
    return runSearchCommand(argv.slice(1), env);
  }

  if (argv[0] === 'resolve') {
    return runResolveCommand(argv.slice(1), env);
  }

  process.stdout.write(`${HELP_TEXT}\n`);
  return 0;
}

if (process.argv[1] === toFilePath(moduleUrl)) {
  void main(process.argv.slice(2)).then((exitCode) => {
    process.exitCode = exitCode;
  });
}

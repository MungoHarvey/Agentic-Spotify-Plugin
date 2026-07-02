import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = new URL('../../', import.meta.url);
const cliEntry = new URL('../../src/cli/index.ts', import.meta.url).href;

const expectedHelp = [
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
  '',
].join('\n');

function runCli(args) {
  const code = `
    const { main } = await import(${JSON.stringify(cliEntry)});
    process.exitCode = await main(${JSON.stringify(args)});
  `;

  return spawnSync(process.execPath, ['--input-type=module', '--eval', code], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

test('CLI help for no arguments prints one help block', () => {
  const result = runCli([]);

  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  assert.equal(result.stdout, `${expectedHelp}`);
});

test('CLI help for --help prints one help block', () => {
  const result = runCli(['--help']);

  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  assert.equal(result.stdout, `${expectedHelp}`);
});

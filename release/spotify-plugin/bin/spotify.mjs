#!/usr/bin/env node

import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bundledRuntime = path.resolve(pluginRoot, 'runtime');
const userProfileRuntime = path.join(
  process.env.USERPROFILE || os.homedir(),
  'plugins',
  'spotify-plugin-runtime',
);
const candidateRuntimeRoots = [
  process.env.SPOTIFY_PLUGIN_RUNTIME,
  bundledRuntime,
  userProfileRuntime,
  path.resolve(pluginRoot, '..', 'spotify-plugin-runtime'),
].filter(Boolean);

const runtimeRoot = candidateRuntimeRoots.find((candidate) =>
  existsSync(path.join(candidate, 'src', 'cli', 'index.ts')),
);

if (!runtimeRoot) {
  console.error(
    [
      'Spotify plugin runtime not found.',
      'Expected the bundled runtime at:',
      bundledRuntime,
      'Set SPOTIFY_PLUGIN_RUNTIME or install the runtime at:',
      userProfileRuntime,
    ].join('\n'),
  );
  process.exitCode = 1;
} else {
  const cliEntry = pathToFileURL(path.join(runtimeRoot, 'src', 'cli', 'index.ts')).href;
  const { main } = await import(cliEntry);

  process.exitCode = await main(process.argv.slice(2));
}

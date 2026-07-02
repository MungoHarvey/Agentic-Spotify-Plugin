import assert from 'node:assert/strict';
import { test } from 'node:test';

import { MCP_SERVER, createMcpServerStub } from '../../src/mcp/server.ts';

test('MCP_SERVER uses the renamed spotify-plugin-mcp server name', () => {
  assert.equal(MCP_SERVER.name, 'spotify-plugin-mcp');
});

test('createMcpServerStub returns the shared MCP_SERVER stub', () => {
  assert.equal(createMcpServerStub(), MCP_SERVER);
});

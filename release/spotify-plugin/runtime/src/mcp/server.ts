export type McpToolName = 'spotify_auth_status' | 'spotify_me' | 'spotify_player_devices' | 'spotify_queue_get';

export interface McpServerStub {
  readonly name: string;
  readonly tools: readonly McpToolName[];
}

export const MCP_SERVER: McpServerStub = {
  name: 'spotify-codex-plugin-mcp',
  tools: ['spotify_auth_status', 'spotify_me', 'spotify_player_devices', 'spotify_queue_get'],
};

export function createMcpServerStub(): McpServerStub {
  return MCP_SERVER;
}

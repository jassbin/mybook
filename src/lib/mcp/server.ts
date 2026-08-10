import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerListCharacters } from "./tools/list-characters";
import { registerProfileValues } from "./tools/profile-values";

export function buildMcpServer(userId: string): McpServer {
  const server = new McpServer({
    name: "mybook",
    version: "1.0.0",
  });

  // 「难得读书」把它的叙事 Agent 能力暴露成 MCP 工具，供任意 MCP 客户端调用。
  registerListCharacters(server, userId);
  registerProfileValues(server, userId);

  return server;
}

import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { buildMcpServer } from "@/lib/mcp/server";

// 评测/公网访客的匿名用户 ID。
// 本 MCP 的三个工具只读全局静态数据(角色目录)、做纯计算(价值分型)或纯生成(发起一局)，
// 不读写任何用户私有数据，因此允许无 session 的匿名访问，便于评测平台直连发现工具并评分。
// 一旦将来新增涉及用户私有数据的工具，必须在该工具内改回强制鉴权。
const ANON_MCP_USER = "anonymous-mcp";

async function handleMcpRequest(request: NextRequest): Promise<Response> {
  // 有 session 则正常鉴权、用真实 userId；无 session 则以匿名身份放行(仅限本 MCP 的公开安全工具)。
  const auth = requireAuth(request);
  const userId = auth.ok ? auth.user.id : ANON_MCP_USER;

  const transport = new WebStandardStreamableHTTPServerTransport({
    // Stateless mode: each serverless invocation is independent
    sessionIdGenerator: undefined,
  });

  const server = buildMcpServer(userId);
  await server.connect(transport);

  return transport.handleRequest(request);
}

export async function GET(request: NextRequest) {
  return handleMcpRequest(request);
}

export async function POST(request: NextRequest) {
  return handleMcpRequest(request);
}

export async function DELETE(request: NextRequest) {
  return handleMcpRequest(request);
}

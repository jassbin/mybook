# MCP 服务说明 · MCP Server (难得读书 / mybook)

> 本项目内置一个**自建 MCP（Model Context Protocol）服务**，把「难得读书」的叙事 Agent
> 能力暴露成标准 MCP 工具，任意 MCP 客户端（Cursor / Claude Desktop / 自定义 Agent）都能直接调用。
>
> This project ships a **self-built MCP server** that exposes 难得读书's narrative-Agent
> capabilities as standard MCP tools, callable by any MCP client (Cursor / Claude Desktop / custom agents).

## 端点 · Endpoint

```
POST /api/mcp
Header: x-eazo-session: <加密会话 token>
Transport: MCP Streamable HTTP (Web Standard, 无状态 / stateless)
```

- 线上 / Live: `https://mybook-3eb25c73.eazo.dev/api/mcp`
- 本地 / Local: `http://localhost:3000/api/mcp`
- 鉴权：沿用与所有 API 一致的 `requireAuth`（`x-eazo-session`，用 `EAZO_PRIVATE_KEY` 解密）。
  三个工具均只读全局/静态数据或做纯计算，不涉及任何用户私有数据，但仍需通过 MCP 鉴权门。

## 已实现的工具 · Tools (3)

| 工具 Tool | 作用 | 输入 Input | 说明 |
|---|---|---|---|
| **`list_characters`** | 列出所有可代入的名著角色目录 | `book?`（可选按书过滤，书名不带《》） | 纯静态数据。返回每个角色的书目、现代对应、核心伤口、价值场域。先调它拿到有效的 `{ book, character }`。 |
| **`profile_values`** | 分析一局选择轨迹，产出**三类价值画像** | `choices[]`（选择轨迹）、`forAct?`（可选，返回该幕分型施压方向） | **本项目分析内核**。复用 `src/lib/agent/value-profile.ts`：识别【主流值/隐性值/矛盾值】三层，并按幕给出施压方向（第1幕砸主流 / 第2幕逃隐性 / 第3幕撞矛盾）。纯计算、可复现。 |
| **`start_session`** | 用指定角色发起一局，返回第一幕 | `book`、`character`、`intensify?` | 复用与 `/api/narrative/init` 完全相同的叙事 Agent 逻辑（角色 DNA → 世界状态 → 困境选材 → 原则检查 → AI 生成第一幕）。会真实调用 AI 模型，依赖 `EAZO_*` 环境变量。 |

工具源码：`src/lib/mcp/tools/`，注册于 `src/lib/mcp/server.ts`；HTTP 胶水层 `src/app/api/mcp/route.ts`（模板自带，未改）。

## 连接 AI 客户端 · Connect a client

Cursor / Claude Desktop（`mcp.json` / `claude_desktop_config.json`）：

```json
{
  "mcpServers": {
    "mybook": {
      "url": "https://mybook-3eb25c73.eazo.dev/api/mcp",
      "headers": { "x-eazo-session": "<eazo-session-token>" }
    }
  }
}
```

`x-eazo-session` 就是浏览器每次 API 调用带的那个会话头；在 Eazo SDK 中可用 `await auth.getSessionHeader()` 获取。

## 用官方 SDK 验证 · Verify with the official SDK

下面脚本用官方 `@modelcontextprotocol/sdk` 的 Client 连上本地服务、列工具、依次调用三个工具（本仓库已按此方式验证通过）：

```js
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const SESSION = "<x-eazo-session JSON 字符串>";
const transport = new StreamableHTTPClientTransport(
  new URL("http://localhost:3000/api/mcp"),
  { requestInit: { headers: { "x-eazo-session": SESSION } } }
);
const client = new Client({ name: "verify", version: "1.0.0" }, { capabilities: {} });
await client.connect(transport);

console.log((await client.listTools()).tools.map(t => t.name));
// → ["list_characters", "profile_values", "start_session"]

// 1) 列角色
await client.callTool({ name: "list_characters", arguments: {} });
// 2) 价值分型
await client.callTool({ name: "profile_values", arguments: {
  choices: [
    { act:1, choiceId:"A", choiceText:"先保住自己", socialTag:"自保" },
    { act:5, choiceId:"C", choiceText:"公开维护弱者", socialTag:"公义" },
  ], forAct: 2,
}});
// 3) 发起一局（会调 AI）
await client.callTool({ name: "start_session", arguments: { book:"三国演义", character:"诸葛亮" } });

await client.close();
```

### 已验证结果 · Verified output

- `tools/list` → `list_characters, profile_values, start_session`
- `list_characters` → 返回全部 20 个角色（红楼梦 / 三国演义 / 水浒传 / 西游记）
- `profile_values` → 主流=自保、隐性=公义（与主流相反的隐藏面）、矛盾=情义；`forAct=2` 正确给出「逃·隐性值」施压方向
- `start_session`（诸葛亮）→ 真实生成第一幕「秋风灯影定生死」+ 3 个第一人称选项

## 隐私与用户隔离 · Privacy

- `userId` 只来自 `requireAuth` → `buildMcpServer(userId)`，绝不从工具入参获取。
- 三个工具仅返回**全局/静态数据或纯计算结果**，不读写任何用户私有记录，因此无跨用户越权风险。
- 未来若新增涉及用户数据的工具，必须把 `userId` 下推到查询层做行级隔离（见 skill：nextjs-build-mcp-server）。

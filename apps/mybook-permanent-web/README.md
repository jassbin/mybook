# 难得读书 · 独立互动叙事 Web 应用

本目录是 `jassbin/mybook` 的独立下一版本，位于 `apps/mybook-permanent-web/`。它不会替换仓库根目录现有的 Next.js 应用；分支与目录约定见 [GITHUB_MIGRATION.md](./GITHUB_MIGRATION.md)。

## 运行环境

| 类别 | 要求 | 用途 |
| --- | --- | --- |
| Node.js | **22.x 推荐** | React、Vite、Express 与 TypeScript 运行时。当前版本以 Node 22 验证。 |
| pnpm | **10.4.x** | 唯一受支持的包管理器；锁文件已提交。 |
| 数据库 | MySQL / TiDB（可选但推荐） | Manus OAuth 用户档案及未来阅读记录持久化。无数据库时公开叙事界面仍可启动，但用户数据不会保存。 |
| 网络 | 出站 HTTPS | 服务端调用平台内置模型能力。 |
| 模型服务 | 平台内置 `invokeLLM` | 动态生成角色设定、剧情、选项、结果画像和普通/极压对比。**不使用 Eazo、OpenAI 或其他外部 AI Key。** |

## 安装与本地启动

从仓库根目录运行：

```bash
cd apps/mybook-permanent-web
corepack enable
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm dev
```

生产构建与启动：

```bash
pnpm build
NODE_ENV=production pnpm start
```

项目已在以下命令下验证：

```bash
pnpm check
pnpm test
pnpm build
```

## 环境变量

> 不要把 `.env`、密钥或平台令牌提交到 Git。托管平台应通过安全的环境变量配置页面注入这些值。

| 变量 | 本地最小运行 | 生产建议 | 说明 |
| --- | --- | --- | --- |
| `NODE_ENV` | `development` | `production` | 控制服务运行模式。 |
| `BUILT_IN_FORGE_API_URL` | 生成剧情时必需 | **必需** | 平台内置模型服务地址。 |
| `BUILT_IN_FORGE_API_KEY` | 生成剧情时必需 | **必需** | 平台内置模型服务端凭据。仅可在服务端使用。 |
| `DATABASE_URL` | 可选 | 推荐 | MySQL/TiDB 连接串；用于用户与后续持久化功能。 |
| `JWT_SECRET` | 使用登录时必需 | **必需** | 签署会话 Cookie 的随机高强度密钥。 |
| `VITE_APP_ID` | 使用 Manus OAuth 时必需 | 推荐 | OAuth 应用标识。 |
| `OAUTH_SERVER_URL` | 使用 Manus OAuth 时必需 | 推荐 | OAuth 服务端地址。 |
| `VITE_OAUTH_PORTAL_URL` | 使用 Manus OAuth 时必需 | 推荐 | OAuth 门户地址。 |
| `OWNER_OPEN_ID` | 可选 | 可选 | 将指定用户映射为管理员。 |

核心服务端变量映射定义在 [`server/_core/env.ts`](./server/_core/env.ts)。剧情调用封装在 [`server/narrative.ts`](./server/narrative.ts)，只从服务端读取 `BUILT_IN_FORGE_API_URL` 与 `BUILT_IN_FORGE_API_KEY`。

## 内置模型行为

网站会在服务端获取可用模型目录，并优先使用 `gpt-5-mini`。剧情请求显式禁用工具调用，以避免文学叙事请求触发外部检索；生成以 JSON 文本返回并由服务端解析。模型服务偶有几十秒等待是正常的远程生成成本，前端通过“正文先到、选项后台补齐”的方式降低等待感。

## 部署注意事项

本子项目是一个 Vite 前端 + Express/tRPC 服务端。部署时应将工作目录设为 `apps/mybook-permanent-web/`，构建命令设为 `pnpm build`，启动命令设为 `pnpm start`。托管环境必须允许服务端访问平台内置模型服务，并以安全方式注入上表中的变量。

项目不需要 Docker、常驻队列、固定 IP 或浏览器自动化；标准 Node 托管即可满足当前工作负载。

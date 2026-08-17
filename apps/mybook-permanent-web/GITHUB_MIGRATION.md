# GitHub 分支迁移说明

## 安全边界

本项目是对 `jassbin/mybook` 的**独立下一版本实验**，不是对原 Next.js 应用的就地改写。迁移时将创建专用分支，并把完整的新网站放在 `apps/mybook-permanent-web/` 子目录。

这样做的目的，是让仓库根目录的原始 `mybook` 应用、其依赖锁文件和当前默认分支 `main` 保持原样。新站点可被独立审阅、构建和运行；只有在确认后才需要另行决定是否将其提升为根应用或与原代码整合。

## 分支与目录约定

| 项目 | 约定 |
| --- | --- |
| 原版本 | `main` 分支的根目录 |
| 新版本分支 | `feature/mybook-permanent-web` |
| 新网站目录 | `apps/mybook-permanent-web/` |
| 合并策略 | 先以子项目审阅；未经明确确认，不替换根目录应用 |

## 本地运行新子项目

```bash
cd apps/mybook-permanent-web
pnpm install
pnpm dev
```

新网站依赖托管平台注入的 `BUILT_IN_FORGE_API_URL` 与 `BUILT_IN_FORGE_API_KEY`，用于服务端内置模型调用。不得把这些密钥提交到仓库。

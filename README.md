# 佳木斯历史建筑智慧安全监测平台 Demo

前端演示（Mock + SQLiteMirror）——严格遵循 TDD 流程。

## 说明

- 本仓库为演示用前端 Demo，仅实现 Mock HTTP + 浏览器 `localStorage`（SQLiteMirror）持久化。
- 本期不实现后端（不使用 Python/FastAPI/SQLAlchemy/MQTT 等）。所有数据通过 `ywtg.sqlite.<表名>` 的 localStorage 项模拟。
- 开发流程：严格 TDD（先写测试、再实现、再重构）。

## 快速开始

先在仓库根目录运行：

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

运行测试：

```bash
npm test
```

打包构建：

```bash
npm run build
```

## 项目结构（要点）

- `src/` - 应用源码（`router/`, `views/`, `stores/`, `mock/`, `services/`）
- `tests/` - TDD 用例（Vitest + Vue Test Utils）
- `docs/` - 项目与设计文档（含 `技术栈-mock.md`、开发优先级等）

## SQLiteMirror / localStorage

本项目使用 SQLiteMirror 规则：每张真实 SQLite 表对应一条 localStorage 键 `ywtg.sqlite.<表名>`，值为 JSON 数组，字段必须与数据库字段一致。更多规则见 `docs/技术架构/技术栈-mock.md`。

## Release

已为本仓库准备初始发布：`v0.1.0`（若需要我可以在 GitHub 上为该 tag 创建 Release 页面）。

## 联系

作者：演示仓库维护者

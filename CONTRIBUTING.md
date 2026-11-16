# 参与贡献

感谢你愿意改进 worm-print-platform。本项目以 `1.5.x` 主线持续维护迭代，欢迎bug 修复、文档改进、示例补充与功能建议。

## 开发环境

需要 Node.js 20+ 与 npm 9+（workspace 依赖）。

```bash
npm install          # 安装全部 workspace 依赖
npm run build        # 按依赖序构建所有包
npm test             # 全量测试（render 的 Playwright 集成测试需先 npx playwright install chromium）
```

常用开发命令：

```bash
npm run dev:core          # core 包 watch 构建
npm run dev:render        # 服务端 PDF 渲染微服务（:3001）
npm run dev:client        # Electron 静默打印客户端
npm run dev:demos:all     # 四个宿主 demo + :9300 总览页
```

四个宿主示例（Vue 3 / Vue 2.7 / React 18 / jQuery）是彼此独立的 npm 工程，改动前先看 [demos/README.md](./demos/README.md)。
接入文档与各框架最小操作方法在 [docs](./docs/README.md)。

## 分层与包边界

改动请遵守仓库的依赖分层，不要破坏：

```
core（纯逻辑）→ plugin-kit（插件 UI 契约）→ canvas（Web Components 设计器）→ 宿主应用
                        echarts（可选图表元素，/kit + /ui）
render / client 只依赖 core（+ echarts / contract / mcp）
```

- `core` 是纯 TS 逻辑，不引入 Vue / React 运行时依赖。
- `canvas` 是设计器权威实现，样式 / 图标 / 主题令牌从 `core/src/styles` 派生，不要手改派生产物。
- 新增设计器元素走插件注册表（`defineElementPlugin` + `defineElementUI`），不要往 canvas 里写死元素类型。
- 详细约定见 [AGENTS.md](./AGENTS.md) 与各包 README。

## 分支与提交

- 直接在 `master` 分支开发即可，除非改动需要隔离工作区。
- 提交信息、Issue、PR 一律使用中文，说清"为什么改"而不只是"改了什么"。
- 一次提交只做一件事；外科手术式修改，不夹带无关重构。

## 提交前检查

```bash
npm run build         # 构建通过
npm test              # 相关测试通过
git diff              # 自查命名、包边界、改动范围
```

涉及渲染管线时额外跑 `npm run test -w @worm-print-platform/render`；
涉及客户端或 SDK 时跑对应 workspace 的测试。

## 报告问题

用 GitHub Issues 提交，附带：

- 复现步骤与最小模板 JSON / 数据；
- 期望行为与实际行为；
- 运行环境（Node 版本、宿主框架、浏览器 / Electron 版本）。

安全问题不要发公开 Issue，见 [SECURITY.md](./SECURITY.md)。

## 行为准则

参与本项目即表示你同意遵守 [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)。

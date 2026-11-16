# worm-print-platform

跨框架可视化打印模板设计器（Web Components）+ 表达式引擎 + 同构渲染管线 + 渲染微服务 + 静默打印客户端。

核心设计器 `<print-designer>` 以**原生 Custom Elements + Shadow DOM** 实现，零 Vue/React 依赖，
可在 Vue 2 / Vue 3 / React / jQuery / 原生 JS 等任意运行环境接入；出纸走**同构渲染管线**——
同一份模板与数据，浏览器预览打印、服务端 PDF、桌面客户端静默打印三条链路产出完全一致。

> 由 [worm-vue3-print](https://github.com/worm-longliu/worm-vue3-print) 的 common 生态独立拆仓而来，
> npm scope 迁移为 `@worm-print-platform/*`。

## 包结构（npm workspaces）

| 目录 | 包名 | 说明 |
| --- | --- | --- |
| `packages/core` | `@worm-print-platform/core` | 模板表达式引擎、同构渲染管线与框架无关的设计器内核（纯 TS，无 Vue/React 依赖）；`/designer`、`/browser`、`/client` 为子路径导出 |
| `packages/common` | `@worm-print-platform/common` | 设计器**权威实现**：原生 Custom Elements + Shadow DOM；`/vue3` 子路径为 Vue 3 宿主提供兼容门面（vue 为可选 peer）。样式/图标/主题令牌从 core 共享源派生 |
| `packages/plugin-kit` | `@worm-print-platform/plugin-kit` | 框架无关的插件设计器 UI 契约与注册表（纯 TS/DOM）：插件写一份 UI，common 原生消费 |
| `packages/contract` | `@worm-print-platform/contract` | 模板 JSON 契约：校验（`validateTemplateJson`）与诊断（`inspectTemplate`），不发布（随 client 打包） |
| `packages/echarts` | `@worm-print-platform/echarts` | ECharts 图表元素可选包：十类 kind、SVG 渲染器、页面执行器；`/kit` 为框架无关纯 TS 出口，`/ui` 为 plugin-kit 设计器 UI（import 即注册） |
| `packages/mcp` | `@worm-print-platform/mcp` | 桌面客户端 MCP（AI 助手）协议实现，不发布（随 client 打包） |
| `services/render` | `@worm-print-platform/render` | 基于 Playwright（Headless Chromium）的 PDF/截图打印渲染微服务，Docker 部署 |
| `clients/client` | `@worm-print-platform/client` | 跨平台静默打印桌面客户端（Electron，本地 WebSocket + core 同构渲染） |

发布到 npm 的正式包为 `core`、`plugin-kit`、`common`、`echarts` 四个（`contract`、`mcp` 随客户端打包，不发布）。

## 边界约定

```
core（纯逻辑）→ plugin-kit（插件 UI 契约）→ common（Web Components 设计器）→ 宿主应用
                        echarts（可选图表元素，/kit + /ui）
render / client 只依赖 core（+ echarts / contract / mcp），分层不得破坏
```

## 快速开始

```bash
npm install
npm run build      # 按依赖序构建全部工作区
npm test           # 全量测试（含 render 的 Playwright 集成测试，需 npx playwright install chromium）
```

宿主接入看 [demos](./demos/README.md)：四个互相独立的工程（Vue 3 / Vue 2.7 / React 18 / jQuery），
各自摊开「注册元素 → 注入模板与字段 → 听事件 → 出纸」全过程，照抄其中一个即可落地。

```bash
npm run dev:demos:all          # 四个宿主 demo + :9300 总览页
npm run dev:render             # 服务端 PDF 渲染微服务（:3001）
npm run dev:client             # Electron 静默打印客户端
```

## 发布

```bash
npm run publish:dry-run        # 干跑（build + test + 逐包 publish --dry-run）
npm run publish:npm            # core → plugin-kit → common → echarts 按依赖序同批发布
npm run publish:common         # 仅补发 common（core / plugin-kit / common 构建 + 测试 + 发布）
```

- CI 手动发布走 `.github/workflows/publish-npm.yml`（需要仓库 secret `NPM_TOKEN`）。
- `contract` / `mcp` / `render` / `client` 不发布到 npm，随客户端 Electron 打包分发。

## License

[MIT](./LICENSE)

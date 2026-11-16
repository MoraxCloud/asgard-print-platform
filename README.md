# worm-print-platform

跨框架可视化打印模板设计器（Web Components）+ 表达式引擎 + 同构渲染管线 + 渲染微服务 + 静默打印客户端。

核心设计器 `<print-designer>` 以**原生 Custom Elements + Shadow DOM** 实现，零 Vue/React 依赖，
可在 Vue 2 / Vue 3 / React / jQuery / 原生 JS 等任意运行环境接入；出纸走**同构渲染管线**——
同一份模板与数据，浏览器预览打印、服务端 PDF、桌面客户端静默打印三条链路产出完全一致。

> 由 [worm-vue3-print](https://github.com/worm-longliu/worm-vue3-print) 的 common 生态独立拆仓而来，
> npm scope 迁移为 `@worm-print-platform/*`。

## 插件化自定义元素

设计器只保留通用机制，具体元素由插件包提供。内置 11 类元素与第三方插件走**同一张注册表、同权扩展**：
注册后素材卡、画布、属性台「自定义属性」页签、校验、数据绑定与出纸全链路同时生效；注册/注销即时通知已挂载实例重绘。

插件契约分两层，按元素 `type` 对齐：

| 层 | 入口 | 负责 |
| --- | --- | --- |
| 元素语义 | `core/designer` 的 `defineElementPlugin` + `registerElementPlugin` | kind 类型、默认值与专属属性元数据、数据绑定、出纸渲染、校验、AI/MCP 可见性 |
| 设计器 UI | `plugin-kit` 的 `defineElementUI` + `registerElementUI` | 画布与属性台的 DOM 渲染，返回 HTML 字符串、`Node` 或 `{ node, dispose }`，纯 TS/DOM 无框架依赖 |

canvas 按 `type` 合并两张注册表：只有「core 有 kind 且 plugin-kit 有 UI」的类型才进入素材台，避免出现无法渲染的元素；
同一份 UI 由零框架 canvas 主入口与 `/vue3` 兼容门面共同消费。插件还可通过 `data` / `fields` 拿到设计态示例数据与业务字段，
经 `update(partial)` / `repaint()` 写回宿主，不直接操作 store。canvas 另暴露 `registerElementDefinition` /
`registerElementRenderer`，可覆盖内置元素的素材卡与画布渲染。

```ts
// 宿主侧：一次副作用 import 完成注册，无需手写渲染器或注册代码
import '@worm-print-platform/echarts/ui'
```

官方参考实现 `@worm-print-platform/echarts` 用一个插件注册十类图表：`/kit` 为框架无关纯 TS 能力，
`/ui` 是基于 plugin-kit 的设计器适配层。自定义插件写法见 [plugin-kit](./packages/plugin-kit/README.md)。

## 包结构（npm workspaces）

| 目录 | 包名 | 说明 |
| --- | --- | --- |
| `packages/core` | `@worm-print-platform/core` | 模板表达式引擎、同构渲染管线与框架无关的设计器内核（纯 TS，无 Vue/React 依赖）；`/designer`、`/browser`、`/client` 为子路径导出 |
| `packages/canvas` | `@worm-print-platform/canvas` | 设计器**权威实现**：原生 Custom Elements + Shadow DOM；`/vue3` 子路径为 Vue 3 宿主提供兼容门面（vue 为可选 peer）。样式/图标/主题令牌从 core 共享源派生 |
| `packages/plugin-kit` | `@worm-print-platform/plugin-kit` | 框架无关的插件设计器 UI 契约与注册表（纯 TS/DOM）：插件写一份 UI，canvas 原生消费 |
| `packages/contract` | `@worm-print-platform/contract` | 模板 JSON 契约：校验（`validateTemplateJson`）与诊断（`inspectTemplate`），不发布（随 client 打包） |
| `packages/echarts` | `@worm-print-platform/echarts` | ECharts 图表元素可选包：十类 kind、SVG 渲染器、页面执行器；`/kit` 为框架无关纯 TS 出口，`/ui` 为 plugin-kit 设计器 UI（import 即注册） |
| `packages/mcp` | `@worm-print-platform/mcp` | 桌面客户端 MCP（AI 助手）协议实现，不发布（随 client 打包） |
| `services/render` | `@worm-print-platform/render` | 基于 Playwright（Headless Chromium）的 PDF/截图打印渲染微服务，Docker 部署 |
| `clients/client` | `@worm-print-platform/client` | 跨平台静默打印桌面客户端（Electron，本地 WebSocket + core 同构渲染） |

发布到 npm 的正式包为 `core`、`plugin-kit`、`canvas`、`echarts` 四个（`contract`、`mcp` 随客户端打包，不发布）。

## 边界约定

```
core（纯逻辑）→ plugin-kit（插件 UI 契约）→ canvas（Web Components 设计器）→ 宿主应用
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
各框架的最小接入操作方法与 AI 编程工具集成提示词（含技能安装引导）见 [docs](./docs/README.md)。

```bash
npm run dev:demos:all          # 四个包 watch 构建 + 四个宿主 demo + :9300 总览页（改 packages/*/src 自动热更新）
npm run dev:core               # 仅 core 包 watch 构建（tsup --watch）
npm run dev:render             # 服务端 PDF 渲染微服务（:3001）
npm run dev:client             # Electron 静默打印客户端
```

## 发布

```bash
npm run publish:dry-run        # 干跑（build + test + 逐包 publish --dry-run）
npm run publish:npm            # core → plugin-kit → canvas → echarts 按依赖序同批发布
npm run publish:canvas         # 仅补发 canvas（core / plugin-kit / canvas 构建 + 测试 + 发布）
```

- CI 手动发布走 `.github/workflows/publish-npm.yml`（需要仓库 secret `NPM_TOKEN`）。
- `contract` / `mcp` / `render` / `client` 不发布到 npm，随客户端 Electron 打包分发。

## License

[MIT](./LICENSE)

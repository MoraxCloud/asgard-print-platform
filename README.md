# worm-print-platform

跨框架可视化打印模板设计器（Web Components）+ 表达式引擎 + 同构渲染管线 + 渲染微服务 + 静默打印客户端。

核心设计器 `<print-designer>` 以**原生 Custom Elements + Shadow DOM** 实现，零 Vue/React 依赖，
可在 Vue 2 / Vue 3 / React / jQuery / 原生 JS 等任意运行环境接入；出纸走**同构渲染管线**——
同一份模板与数据，浏览器预览打印、服务端 PDF、桌面客户端静默打印三条链路产出完全一致。

> npm scope 为 `@worm-print-platform/*`。本仓是设计器权威实现与后续维护迭代的**稳定主版本**（`1.5.x` 主线）。

## 当前版本与下载

当前主线版本 **1.5.1**。桌面客户端安装包（mac / Windows / Linux）及校验清单见下方
[下载客户端安装包](#下载客户端安装包)。版本历史见 [CHANGELOG](./CHANGELOG.md)。

## 在线演示

GitHub Pages 静态演示：<https://worm-longliu.github.io/worm-print-platform/>
（总览页与四个宿主 `canvas/{vue3,vue2,react,jquery}/`，对应 [demos](./demos/README.md) 四工程）

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
| `packages/skills` | `@worm-print-platform/skills` | 命令行技能安装器（bin：`worm-print-skills`，npx 调用）：从 GitHub / Gitee 仓库安装技能到 `.agents/skills/` 等目录 |

发布到 npm 的正式包为 `core`、`plugin-kit`、`canvas`、`echarts`、`skills` 五个（`contract`、`mcp` 随客户端打包，不发布）。

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

## 各框架接入操作方法与 AI 提示词

面向宿主开发者的接入文档：每个 UI 框架一份文件，包含「最小接入操作方法」与可直接复制给
AI 编程工具的「集成提示词」。提示词内置技能安装引导，让 AI agent 先装规范再动手。

| 框架 | 文档 | 接入形态 | 可运行示例 | 端口 |
| --- | --- | --- | --- | --- |
| Vue 3 | [vue3.md](./docs/vue3.md) | `@worm-print-platform/canvas/vue3` 组件门面（原 `@worm-vue3-print/canvas` 用户迁移零业务改动） | `demos/apps/vue3` | 9331 |
| Vue 2.7 | [vue2.md](./docs/vue2.md) | `<print-designer>` 自定义元素 + `registerAll()` | `demos/apps/vue2` | 9332 |
| React 18 | [react.md](./docs/react.md) | `<print-designer>` 自定义元素 + `addEventListener` | `demos/apps/react` | 9335 |
| jQuery / 原生 JS | [jquery.md](./docs/jquery.md) | UMD 直挂（无打包器，`window.WormPrintCanvas` 全局） | `demos/apps/jquery` | 9334 |

老用户迁移：[migration-worm-vue3-print.md](./docs/migration-worm-vue3-print.md)
—— 包名映射、三条迁移路径、行为差异要点与 AI 迁移提示词。

四个示例工程互跳总览页在 `:9300`，一条命令全部拉起：`npm run dev:demos:all`。
每个 demo 的验收脚本：`node demos/scripts/verify-demo.mjs http://localhost:<端口>/`。
完整版见 [docs/README.md](./docs/README.md)。

### 配套技能（AI agent 接入用的规范包）

仓库随源码维护两个技能（`skills/` 目录，源随仓库分发），是 AI agent 接入时「先读规范再动手」的单一真源：

| 技能 | 覆盖范围 | 适用文档 |
| --- | --- | --- |
| `worm-print-platform-integration` | 全形态宿主集成：NPM 宿主的 `canvas/vue3` 组件门面与 `<print-designer>` 契约、浏览器直挂 / 无打包器与 Vue 2 / React / jQuery、三条打印链路、全栈宿主最小清单、宿主 MCP、故障排查 | 四份文档共用 |
| `worm-print-platform-mcp` | 桌面 MCP 工具：AI 实时读写画布、模板生成校验、视觉回读与参考图比对 | 可选增强，任何框架 |

技能安装方法（提示词「第 0 步」）：在**当前项目根目录**逐条执行，默认装到
`.agents/skills/<技能名>/`：

```bash
npx @worm-print-platform/skills worm-print-platform-integration
npx @worm-print-platform/skills worm-print-platform-mcp
```

默认源 GitHub、失败回退 Gitee；可用 `--repo` 指定任意仓库、`--dir` 指定技能目录、
`--force` 覆盖已有技能。无 npm / git 环境时也可从仓库 `skills/<技能名>/` 手动取用。详见
[docs/README.md 技能安装方法](./docs/README.md#技能安装方法提示词第-0-步的通用说明)。

### 打印链路速记

三条链路吃同一份 `templateJson + printData + baseUrl`，可单选可并存：

- **A 浏览器打印**：core 同构渲染进 iframe → `contentWindow.print()`，零额外基础设施（各文档默认接入）。
- **B 服务端 PDF**：部署 `services/render` 微服务，后端持密钥代理，产出可下载 PDF。
- **C 桌面客户端静默打印**：本机 Electron 客户端（`127.0.0.1:17521`）+ `PrintClient.printHtml()`，无对话框直接出纸。

细节见 integration 技能的 `references/server-render.md` 与 `references/silent-print.md`。

## 下载客户端安装包

桌面客户端用于**链路 C（静默打印）**。当前版本 **1.5.1**，安装包托管在本仓 GitHub Releases：
<https://github.com/worm-longliu/worm-print-platform/releases/tag/v1.5.1>

| 平台 | 架构 | 安装包 |
| --- | --- | --- |
| macOS | x64 (Intel) | [WormPrintClient-1.5.1-mac-x64.dmg](https://github.com/worm-longliu/worm-print-platform/releases/download/v1.5.1/WormPrintClient-1.5.1-mac-x64.dmg) |
| macOS | arm64 (Apple Silicon) | [WormPrintClient-1.5.1-mac-arm64.dmg](https://github.com/worm-longliu/worm-print-platform/releases/download/v1.5.1/WormPrintClient-1.5.1-mac-arm64.dmg) |
| Windows | x64 | [WormPrintClient-1.5.1-win-x64.exe](https://github.com/worm-longliu/worm-print-platform/releases/download/v1.5.1/WormPrintClient-1.5.1-win-x64.exe) |
| Linux | x64 (deb) | [WormPrintClient-1.5.1-linux-amd64.deb](https://github.com/worm-longliu/worm-print-platform/releases/download/v1.5.1/WormPrintClient-1.5.1-linux-amd64.deb) |
| Linux | x64 (rpm) | [WormPrintClient-1.5.1-linux-x86_64.rpm](https://github.com/worm-longliu/worm-print-platform/releases/download/v1.5.1/WormPrintClient-1.5.1-linux-x86_64.rpm) |
| Linux | x64 (AppImage) | [WormPrintClient-1.5.1-linux-x86_64.AppImage](https://github.com/worm-longliu/worm-print-platform/releases/download/v1.5.1/WormPrintClient-1.5.1-linux-x86_64.AppImage) |

校验清单：[SHA256SUMS.txt](https://github.com/worm-longliu/worm-print-platform/releases/download/v1.5.1/SHA256SUMS.txt)（下载后用 `shasum -a 256` / `sha256sum` 核对）。

说明：

- **下载慢或中断**：可用迅雷、IDM、qBittorrent 等支持续传的工具复制上方直链下载。
- **macOS 未签名 / 未公证**：安装包带 Electron 预编译的临时签名，首次打开若提示"无法验证开发者"，
  在「系统设置 → 隐私与安全性」中允许打开即可（右键 → 打开也可）。这是未做 Apple 公证的预期提示，不影响功能。
- **Linux 三包未经真机验证**：deb / rpm / AppImage 在容器中交叉构建，未在真实 Linux 桌面逐一跑通；
  AppImage 可能需要 `--appimage-extract-and-run` 或安装 fuse；部分发行版需处理 sandbox 权限，遇到问题欢迎提 Issue。
- 安装后用设置页配置本地服务端口（默认 `127.0.0.1:17521`）与 MCP/AI 助手；接入方法见
  [客户端 README](./clients/client/README.md) 与 [静默打印技能](./skills/worm-print-platform-integration/references/silent-print.md)。

## 发布

```bash
npm run publish:dry-run        # 干跑（build + test + 逐包 publish --dry-run）
npm run publish:npm            # core → plugin-kit → canvas → echarts → skills 按依赖序同批发布
npm run publish:canvas         # 仅补发 canvas（core / plugin-kit / canvas 构建 + 测试 + 发布）
```

- CI 手动发布走 `.github/workflows/publish-npm.yml`：认证优先 Trusted Publishing（OIDC），
  需在 npmjs.com 各包 Settings → Trusted Publisher 绑定本 workflow；`NODE_AUTH_TOKEN` 仅作回退。
- `contract` / `mcp` / `render` / `client` 不发布到 npm，随客户端 Electron 打包分发。

## 仓库地址

- 本仓 Gitee：https://gitee.com/liulong_oschina/worm-print-platform
- 本仓 GitHub：https://github.com/worm-longliu/worm-print-platform

## 抖音 & 赞赏

本项目基于 MIT 协议免费开源，赞赏纯属自愿、与授权和服务无关。

如果这套工具帮到了你，欢迎扫码请作者喝杯咖啡；赞赏后请在 [Issue](https://github.com/worm-longliu/worm-print-platform/issues) 留言昵称，我会登记进赞赏名单（仅公开昵称与日期，金额私有不公示）。

<p align="center">
  <img src="./douyin.png" width="180" alt="抖音码" />
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="./docs/images/wpay.png" width="180" alt="微信赞赏码" />
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="./docs/images/alipay.jpg" width="180" alt="支付宝赞赏码" />
</p>

## License

[MIT](./LICENSE)

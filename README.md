<p align="center">
  <strong>worm-print-platform</strong><br>
  <em>跨框架可视化打印模板设计器 · 同构渲染管线 · 三条打印链路</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/npm-v1.5.2-384BFF" alt="npm version">
  <img src="https://img.shields.io/badge/node-%E2%89%A520-4B9B4B" alt="node">
  <img src="https://img.shields.io/badge/TypeScript-5.4%2B-3178C6" alt="typescript">
  <img src="https://img.shields.io/badge/license-MIT-9A9A9A" alt="license">
  <a href="https://github.com/worm-longliu/worm-print-platform/actions/workflows/ci.yml">
    <img src="https://github.com/worm-longliu/worm-print-platform/actions/workflows/ci.yml/badge.svg" alt="CI">
  </a>
  <a href="https://worm-longliu.github.io/worm-print-platform/">
    <img src="https://img.shields.io/badge/demo-live-FF6B35" alt="demo">
  </a>
  <a href="https://www.npmjs.com/org/worm-print-platform">
    <img src="https://img.shields.io/badge/npm%20scope-@worm--print--platform-CB3837?logo=npm" alt="npm scope">
  </a>
</p>

## 特性

- 🎨 **跨框架设计器** — 原生 Custom Elements + Shadow DOM 实现，零 Vue/React 依赖，Vue 3 / Vue 2 / React / jQuery / 原生 JS 任意宿主接入
- 🔗 **同构渲染管线** — 同一份模板与数据，浏览器预览、服务端 PDF、桌面客户端静默打印三条链路产出完全一致
- 🧩 **插件化元素** — 内置 11 类元素 + 第三方插件走同一张注册表、同权扩展；import 即注册
- ⚡ **表达式引擎** — 自研词法/语法/安全求值器，支持 `formatMoney` / `sum` / `concat` 等内置函数
- 🧾 **专业版式能力** — 表格分页、重复表头、小计/汇总、合并单元格、连续纸、拼版（多标签铺满 A4）、水印
- 📊 **可选 ECharts** — SVG SSR 图表元素包，十类图表设计态可配置
- 🤖 **MCP / AI 友好** — 桌面客户端提供 MCP 工具，AI Agent 可实时读写画布、生成校验模板

## 在线演示

四个宿主工程的静态演示页（同一套设计器、同一套示例库）：

👉 <https://worm-longliu.github.io/worm-print-platform/>

## 快速开始

### 宿主最小接入（浏览器打印，零额外基础设施）

```bash
# 安装（以 Vue 3 为例）
npm i @worm-print-platform/canvas @worm-print-platform/core
```

```ts
// main.ts — 注册设计器
import { registerAll } from '@worm-print-platform/canvas'
registerAll()
```

```html
<!-- App.vue 模板里挂载；对象/函数入参赋 property，不要走 attribute -->
<print-designer
  ref="designer"
  is-edit="true"
  show-help="true"
  @save="onSave"
  @preview="onPreview"
/>
```

```ts
// 注入字段与模板（挂载后赋 property，避开 attribute 字符串化）
const el = designer.value
el.fields = [{ fieldKey: 'orderNo', fieldLabel: '单号' }]
el.template = templateJson
el.uploadImage = (file: File) => uploadToServer(file)
```

```ts
// 浏览器渲染 + 打印（零基础设施）
import { renderHtmlPages, browserCodeRenderer } from '@worm-print-platform/core'
const pages = await renderHtmlPages(templateJson, printData, location.origin, browserCodeRenderer)
// pages 写进 iframe → iframe.contentWindow.print()
```

> Vue 3 宿主也可用 `/vue3` 组件门面：`import { PrintDesigner } from '@worm-print-platform/canvas/vue3'`，沿用 props / 事件 / ref 写法。

### 仓库开发

```bash
git clone https://github.com/worm-longliu/worm-print-platform.git
npm install
npm run build          # 按依赖序构建全部 workspace
npm test               # 全量测试（Playwright 集成测试需 npx playwright install chromium）

npm run dev:demos:all  # 四个宿主 demo + :9300 总览页（改 packages/*/src 自动热更新）
npm run dev:core       # 仅 core 包 watch 构建
npm run dev:render     # 服务端 PDF 渲染微服务（:3001）
npm run dev:client     # Electron 静默打印客户端
```

完整命令索引（开发 / npm 发布 / 客户端打包 / Docker）：[docs/commands.md](./docs/commands.md)。

## 架构与分层

```
core（纯 TS：表达式引擎 + 同构渲染管线 + 设计器内核）
  ├─ designer  ──  框架无关的模型、工具、交互逻辑
  ├─ render    ──  HTML 生成 / 数据绑定 / 分页
  ├─ browser   ──  浏览器端渲染适配器
  └─ client    ──  桌面客户端 SDK

plugin-kit（插件 UI 契约与注册表）

canvas（Web Components 设计器权威实现 ← core + plugin-kit）
  └─ /vue3  ──  Vue 3 兼容门面（可选 peer）

plugin-echarts（marketplace/plugins/echarts：图表插件唯一源码真源）
  └─ 同一源码构建 echarts 兼容镜像 + 市场安装产物（README 统一市场口径）

echarts（兼容镜像包 ← 同一源码；保留原包名与子路径，存量依赖零改动）
  ├─ /kit  ──  框架无关纯 TS 能力
  ├─ /ui   ──  设计器 UI（import 即注册）
  └─ /node ──  服务端执行器

render（Playwright PDF 微服务，私有 Docker 部署）
client（Electron 静默打印桌面客户端，私有分发）
contract / mcp（私有：契约校验 + MCP 工具库，随 client 打包）
skills（npm 发布：命令行技能安装器）
marketplace（npm 发布：插件市场 CLI，三源安装单个插件）

宿主应用 ← Vue 3 / Vue 2 / React / jQuery / 原生 JS
```

**三条打印链路**（同一份 `templateJson + printData + baseUrl`）：

| 链路 | 说明 | 适用场景 |
| --- | --- | --- |
| A · 浏览器打印 | core 同构渲染进 iframe → `contentWindow.print()` | 零基础设施、快速接入 |
| B · 服务端 PDF | `services/render` 微服务（Playwright），后端代理密钥 | 需要可下载 PDF、批量打印 |
| C · 静默打印 | 本机 Electron 客户端 `PrintClient.printHtml()`，无对话框 | 桌面终端、标签机 |

## 包总览（npm workspaces）

| 目录 | 包名 | 发布 | 说明 |
| --- | --- | --- | --- |
| `packages/core` | `@worm-print-platform/core` | ✅ npm | 表达式引擎 + 同构渲染管线 + 框架无关设计器内核 |
| `packages/plugin-kit` | `@worm-print-platform/plugin-kit` | ✅ npm | 插件设计器 UI 契约与注册表（纯 TS/DOM） |
| `packages/canvas` | `@worm-print-platform/canvas` | ✅ npm | 设计器权威实现（Custom Elements + Shadow DOM） |
| `marketplace/plugins/echarts` | `@worm-print-platform/plugin-echarts` | ✅ npm | 百度图表插件唯一源码真源（市场主口径） |
| `packages/echarts` | `@worm-print-platform/echarts` | ✅ npm | 同一源码生成的兼容镜像包（十类 kind，存量依赖零改动） |
| `packages/skills` | `@worm-print-platform/skills` | ✅ npm | 命令行技能安装器（bin：`worm-print-skills`） |
| `packages/marketplace` | `@worm-print-platform/marketplace` | ✅ npm | 插件市场 CLI（bin：`worm-print-marketplace`，三源安装） |
| `packages/contract` | `@worm-print-platform/contract` | ❌ 私有 | 模板 JSON 契约校验（随 client 打包） |
| `packages/mcp` | `@worm-print-platform/mcp` | ❌ 私有 | MCP 协议实现（随 client 打包） |
| `services/render` | `@worm-print-platform/render` | ❌ 私有 | Playwright PDF 渲染微服务（Docker 部署） |
| `clients/client` | `@worm-print-platform/client` | ❌ 私有 | 跨平台静默打印桌面客户端（Electron） |

## 各框架接入导航

每个宿主框架一份接入文档，含最小操作方法 + AI 编程工具提示词。

| 框架 | 文档 | 接入形态 | 可运行示例 | 端口 |
| --- | --- | --- | --- | --- |
| Vue 3 | [docs/vue3.md](./docs/vue3.md) | `@worm-print-platform/canvas/vue3` 组件门面 | `demos/apps/vue3` | 9331 |
| Vue 2.7 | [docs/vue2.md](./docs/vue2.md) | `<print-designer>` + `registerAll()` | `demos/apps/vue2` | 9332 |
| React 18 | [docs/react.md](./docs/react.md) | `<print-designer>` + `addEventListener` | `demos/apps/react` | 9335 |
| jQuery / 原生 JS | [docs/jquery.md](./docs/jquery.md) | UMD 直挂 `window.WormPrintCanvas` | `demos/apps/jquery` | 9334 |

- 老用户迁移：[docs/migration-worm-vue3-print.md](./docs/migration-worm-vue3-print.md)
- 四个 demo 的总览页在 `:9300`，一条命令拉起：`npm run dev:demos:all`

## 插件化自定义元素

设计器只保留通用机制，具体元素由插件包提供。官方参考实现 `@worm-print-platform/plugin-echarts` 用一个插件注册十类图表，源码位于插件市场 `marketplace/plugins/echarts/`。插件分两层契约（按元素 `type` 对齐）：

| 层 | 入口 | 负责 |
| --- | --- | --- |
| 元素语义 | `core/designer` 的 `defineElementPlugin` | kind 类型、默认值、属性元数据、绑定、出图、校验 |
| 设计器 UI | `plugin-kit` 的 `defineElementUI` | 画布与属性台的 DOM 渲染，一份 UI 零框架消费 |

```ts
// 市场口径：一次副作用 import 完成插件描述符 + 设计器 UI 注册
import '@worm-print-platform/plugin-echarts'
// 按子路径按需引入
import '@worm-print-platform/plugin-echarts/kit'
import '@worm-print-platform/plugin-echarts/ui'
```

自定义插件写法见 [packages/plugin-kit/README](./packages/plugin-kit/README.md)。

插件市场（索引与插件源码常驻本仓 `marketplace/`，三源安装、缺省最新稳定版）见
[docs/plugin-marketplace.md](./docs/plugin-marketplace.md)。百度图表插件源码真源在
`marketplace/plugins/echarts/`，同一源码发布 `@worm-print-platform/plugin-echarts`（市场主口径）与
`@worm-print-platform/echarts`（兼容镜像，存量依赖零改动），两者 README 统一为市场口径。

## 桌面客户端（静默打印）

客户端用于**链路 C**，安装包随 GitHub Releases 分发：

👉 [v1.5.1 安装包 & SHA256SUMS](https://github.com/worm-longliu/worm-print-platform/releases/tag/v1.5.1)（客户端源码自 v1.5.1 起无变更，可继续使用；新版本仅涉及设计器与示例）

| 平台 | 架构 | 安装包 |
| --- | --- | --- |
| macOS | x64 / arm64 | `.dmg`（Intel + Apple Silicon） |
| Windows | x64 | `.exe`（NSIS） |
| Linux | x64 | `.deb` / `.rpm` / `.AppImage` |

客户端本地 WebSocket 默认监听 `127.0.0.1:17521`，宿主用 `@worm-print-platform/core/client` 的 `PrintClient.printHtml()` 静默出纸，无对话框。

> macOS 首次打开若提示"无法验证开发者"，在「系统设置 → 隐私与安全性」中允许打开即可（未做 Apple 公证）。

### 手工打包速查

```bash
npm run pack:client          # 全平台（mac + win）安装包
npm run pack:client:mac      # 仅 macOS（Intel + Apple Silicon）
npm run pack:client:win      # 仅 Windows x64 NSIS（macOS 可交叉构建）
npm run pack:client:linux    # Linux（Docker 容器内，deb / rpm / AppImage）
npm run pack:client:dir      # 绿色目录版（免安装，宿主平台）
npm run pack:client:release  # 安装包 + SHA256SUMS + 发行版上传命令
```

> 首次构建另一架构 / 平台时，electron-builder 需拉取对应工具链；国内网络建议先设镜像。完整打包说明、Linux Docker 前置条件、产物命名与 GitHub 发行版上传步骤见 [clients/client/README.md](./clients/client/README.md#打包)。

## AI Agent 配套技能

仓库随源码维护两个技能包（`skills/` 目录），AI Agent 接入时先装规范再动手：

| 技能 | 覆盖范围 |
| --- | --- |
| `worm-print-platform-integration` | 全形态宿主集成：NPM 门面与 `<print-designer>` 契约、三条打印链路、故障排查 |
| `worm-print-platform-mcp` | 桌面 MCP 工具：模板会话、渲染预览、视觉回读与参考图比对 |

### 快捷安装（可一键复制）

**Gitee 优先，默认目录 `.agents/skills/`**：

```bash
# 在你的项目根目录执行。先试 Gitee（国内快），网络不通时去掉 --repo 自动回退 GitHub
npx @worm-print-platform/skills worm-print-platform-integration --repo https://gitee.com/liulong_oschina/worm-print-platform.git --force
npx @worm-print-platform/skills worm-print-platform-mcp           --repo https://gitee.com/liulong_oschina/worm-print-platform.git --force
```

**网络回退（GitHub 兜底）**：

```bash
# 不带 --repo 时默认 GitHub 优先、失败自动回退 Gitee
npx @worm-print-platform/skills worm-print-platform-integration --force
npx @worm-print-platform/skills worm-print-platform-mcp           --force
```

**自定义安装目录**（可选）：

```bash
# 常见目录：Claude Code → .claude/skills · Qoder → .qoder/skills · 用户级 → ~/.agents/skills
npx @worm-print-platform/skills worm-print-platform-integration \
  --repo https://gitee.com/liulong_oschina/worm-print-platform.git \
  --dir .claude/skills --force
```

**给 AI Agent 的提示词片段**（可整段复制）：

```
请先在项目根目录执行以下命令安装 worm-print-platform 的官方技能规范，再开始接入开发：

npx @worm-print-platform/skills worm-print-platform-integration --repo https://gitee.com/liulong_oschina/worm-print-platform.git --force

默认安装到 .agents/skills/worm-print-platform-integration/（OpenAI 规范位置）。
若 Gitee 网络不通，去掉 --repo 参数即可自动回退 GitHub；
需要其他技能目录（如 .claude/skills / .qoder/skills）时加 --dir 指定。
安装完成后，请完整阅读该目录下的 SKILL.md 与 references/ 全部文件。
```

详细说明见 [docs/README.md · 技能安装方法](./docs/README.md#技能安装方法提示词第-0-步的通用说明)。

## 发布

```bash
npm run publish:npm       # core → plugin-kit → canvas → echarts → skills 按依赖序同批发布
npm run publish:canvas    # 仅补发 canvas
npm run publish:dry-run  # 干跑（build + test + 逐包 publish --dry-run）
```

CI 发布走 `.github/workflows/publish-npm.yml`，认证优先 Trusted Publishing（OIDC）。`contract` / `mcp` / `render` / `client` 不发布到 npm，随客户端 Electron 打包分发。

## 贡献

欢迎 bug 修复、文档改进、示例补充与功能建议。请先阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)，改动前确认分层与包边界不被破坏。

- 提交信息、Issue、PR 一律使用中文
- 安全漏洞请私信维护者，见 [SECURITY.md](./SECURITY.md)
- 参与社区讨论即表示同意 [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)

## 仓库地址

| 平台 | 地址 |
| --- | --- |
| GitHub（主仓） | https://github.com/worm-longliu/worm-print-platform |
| Gitee（镜像） | https://gitee.com/liulong_oschina/worm-print-platform |
| npm scope | https://www.npmjs.com/org/worm-print-platform |
| 在线演示 | https://worm-longliu.github.io/worm-print-platform/ |

## 支持 & 赞赏

本项目基于 MIT 协议免费开源，赞赏纯属自愿、与授权和服务无关。如果你觉得这套工具帮到了自己，欢迎扫码请作者喝杯咖啡；赞赏后在 Issue 留言昵称可登记进公开名单。

<p align="center">
  <img src="./douyin.png" width="150" alt="抖音码" />
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="./docs/images/wpay.png" width="150" alt="微信赞赏码" />
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="./docs/images/alipay.jpg" width="150" alt="支付宝赞赏码" />
</p>

## License

[MIT](./LICENSE) © 2026 worm

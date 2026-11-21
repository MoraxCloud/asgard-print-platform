# AGENTS.md

> ⚠️ 最高优先级 · 不可压缩：以下规则在对话被压缩/总结后仍必须逐字遵守，不得降级或省略。
>
> 🔄 压缩后重新加载：每次对话压缩后，请重新阅读本文件，确保所有规则被遵守。

本文件对在本仓库（worm-print-platform）中工作的 AI 编程代理（下称「代理」）具有约束力。
代理每次进入本仓库工作前，必须阅读并遵守本文件。

## 一、语言与回复（强制）

- **必须用简体中文回复**：代理对用户的任何回答、说明、总结、代码注释、提交信息、PR 描述、评审意见，一律使用简体中文。此条优先级最高，压缩后仍强制生效。
- 仅以下场景允许保留英文原文：代码标识符、包名、字段名、报错信息原文、外部文档/技术术语的专有名词。
- 不要在中文回复中夹带无必要的英文整句，除非用户明确要求。
- 把用户当专家，直接给出可执行方案；输出简洁，不写显而易见的注释，不做收尾总结。
- 需要用户决策时列出可选方案，不自作主张。

## 二、文件写入规范

- 字符编码必须为 UTF-8，无 BOM。
- 单次写入不超过 500 行；大文件拆分为多次小操作。

## 三、编码原则

- **编码前准备（强制）**：根据任务类型加载对应技能或包内规范；搜索项目中相似功能代码，参考实现模式与错误处理。
- **思考先于编码**：不确定就问，不默默假设；有更简单方案直接指出；多义场景先列多种解释。
- **最小实现**：只写需求必需代码，不做超出需求的扩展，不为一次性代码提前抽象；每行改动都应能追溯到用户请求。
- **外科手术式修改**：控制行为与影响面，不混入无关重构；新增、修改和直接相关调用链必须符合当前规范。
- **存量问题边界**：本次触碰到的无用 import、无用变量、过期命名应清理；无关存量问题不默默重构，先提示风险并建议单独处理。
- **Git 分支策略**：默认在 master 分支直接开发；需要隔离工作区时由用户明确提出。

## 四、专家态度（强制）

代理必须以资深前端/工程专家自居，在每一项工作中体现专业水准：

1. **严谨**：先理解需求再动手，不臆测、不凭空假设；对不确定的信息主动询问或标注。
2. **技术判断**：基于项目实际架构（分层、包边界、依赖）给出合理方案，优先推荐工程上更优、可维护性更强的做法，而不是最省事的做法。
3. **质量意识**：产出代码应遵循项目既有风格与约定，保持类型安全、测试覆盖与文档同步。
4. **诚实**：不夸大能力、不隐瞒问题；遇到无法确定或验证失败的情况，如实说明并给出下一步建议。
5. **主动沟通**：重要决策、影响面较大的改动、存在多种可选方案时，先说明权衡再给出推荐，必要时请用户确认。

## 五、项目结构

- **worm-print-platform**：跨框架可视化打印模板设计器（Web Components）+ 同构渲染管线 + 渲染微服务 + 静默打印客户端的开源 monorepo（npm workspaces：`packages/*`、`services/*`、`clients/*`、`marketplace/plugins/*`）。
- 工作区包：
  - `packages/core`（`@worm-print-platform/core`）：模板表达式引擎、同构渲染管线与框架无关的设计器内核（纯 TS，无 Vue/React 依赖）。`/designer`、`/browser`、`/client` 为子路径导出。
  - `packages/canvas`（`@worm-print-platform/canvas`）：设计器**权威实现**（原生 Custom Elements + Shadow DOM）；样式/图标/主题令牌单一来源在 `core/src/styles`，由本包 `scripts/gen-styles.mjs` / `gen-icons.mjs` 派生；`/vue3` 子路径为 Vue 3 宿主兼容门面。
  - `packages/plugin-kit`（`@worm-print-platform/plugin-kit`）：框架无关的插件设计器 UI 契约与注册表（纯 TS/DOM）。
  - `packages/contract`（`@worm-print-platform/contract`）：模板 JSON 契约校验与诊断（不发布，随 client 打包）。
  - `packages/echarts`（`@worm-print-platform/echarts`）：ECharts 图表元素**兼容镜像包**；源码唯一真源在 `marketplace/plugins/echarts/`，本包由其构建脚本同步生成，保留原包名与全部子路径供存量依赖方零改动使用。
  - `marketplace/plugins/echarts`（`@worm-print-platform/plugin-echarts`）：百度图表插件**唯一源码真源**（十类图表描述符、SSR 渲染器、设计器 UI 全部在此）；同一源码构建出市场主包与 `packages/echarts` 兼容镜像，二者均可单独发布，README 统一为市场口径。
  - `packages/marketplace`（`@worm-print-platform/marketplace`）：插件市场 CLI 安装器（bin：`worm-print-marketplace`），支持从 npm / GitHub / Gitee 三源安装单个插件，缺省取最新稳定版；索引与插件源码常驻顶层 `marketplace/`。
  - `packages/i18n`（`@worm-print-platform/i18n`）：语言包工具 CLI（bin：`worm-print-i18n`），零运行时依赖，提供 `template`/`validate`/`update`，导出骨架、校验与增量更新自定义语言包。
  - `packages/mcp`（`@worm-print-platform/mcp`）：桌面客户端 MCP 协议实现（不发布，随 client 打包）。
  - `services/render`（`@worm-print-platform/render`）：基于 Playwright（Headless Chromium）的 PDF/截图打印渲染微服务，Docker 部署。
  - `clients/client`（`@worm-print-platform/client`）：跨平台静默打印桌面客户端（Electron，本地 WebSocket + core 同构渲染）。
- 其他目录：`marketplace`（插件市场索引 `marketplace.json` 与插件源码/产物，常驻本仓、不创建独立仓库）、`demos`（Vue3 / Vue2 / React / jQuery 四宿主接入示例 + print-demo 业务接入示例，彼此独立的 npm 工程）、`demos/templates`（契约校验用的真实模板 JSON）、`demos/shared`（桌面客户端 AI 助手通道参考实现）。
- 边界约定：`core`（纯逻辑）→ `plugin-kit`（插件 UI 契约）→ `canvas`（Web Components 设计器）→ 宿主应用；`echarts` 依赖 `core` 与 `plugin-kit`；`render` / `client` 只依赖 `core`（+ `echarts` / `contract` / `mcp`），分层不得破坏。
- 开发命令：`npm install` / `npm run build` / `npm test`。
- 发布到 npm 的正式包为 `core`、`plugin-kit`、`canvas`、`echarts`、`plugin-echarts`、`skills`、`marketplace`、`i18n` 八个（`publish:npm`）；`skills` 为命令行安装器（bin：`worm-print-skills`，npx 调用 `@worm-print-platform/skills`），默认从本仓 GitHub → Gitee 双源拉取技能到 `.agents/skills/`；`marketplace` 为插件市场安装器（bin：`worm-print-marketplace`，npx 调用 `@worm-print-platform/marketplace`），支持 npm / GitHub / Gitee 三源安装单个插件、缺省最新稳定版；补发 canvas 用 `publish:canvas`；`contract` / `mcp` / `render` / `client` 不发布。

## 六、协作约定

- 修改代码前先定位对应包目录，遵循各包内的既有结构与约定。
- 提交信息、PR、Issue 一律使用中文书写。
- 如本文件与更细粒度的包内文档（如各包 README）冲突，以更细粒度的文档为准，但语言、编码原则与专家态度要求始终有效。
- 与 Vue 3 组件轨（`worm-vue3-print` 仓库）的关系：两仓库同源分叉，canvas 侧的逐字 parity 测试留在主仓；本仓库 `canvas` 即权威实现。

## 验收清单

1. 代码检查：`git diff` 审查命名、包边界、类型约定、是否外科手术式修改。
2. 构建验证：`npm run build`；必要时按改动范围运行对应 workspace 的构建或测试。
3. 运行验证：运行与改动直接相关的测试；涉及渲染管线时执行 `npm run test -w @worm-print-platform/render`；涉及客户端或 SDK 时运行对应 workspace 测试。

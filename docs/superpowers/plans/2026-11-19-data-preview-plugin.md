# 数据源预览插件 Implementation Plan

> **注记**：本文记录的是最初方案（plugin-kit `FieldActionUI` 贡献点 + canvas 字段树按钮）。最终实现改为「插件只提供 `openDataPreview()` API、宿主配置入口与开关」，原贡献点已彻底移除。以 `marketplace/plugins/data-preview` 源码与 README 为准。
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native, this session) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** 以插件方式实现字段父节点“查看数据源”预览：弹窗多 tab（总览 + 子标签页，可从汇总表跳转），内容按 JSON 形态解析为表单/表格，第一版不分页。

**Architecture:** plugin-kit 新增一个通用 `FieldActionUI` 贡献点（注册表语义对齐现有 ElementUI）；canvas 核心只加通用挂载点（字段树 header 渲染按钮 + shadow root overlay 容器）；预览业务全部在独立插件包 `marketplace/plugins/data-preview/`，import 即注册。

**Tech Stack:** TypeScript、原生 DOM（plugin-kit `h`/`render`）、vitest + happy-dom、npm workspaces（`marketplace/plugins/*`）。

**Spec:** `docs/superpowers/specs/2026-11-19-data-preview-design.md`

## Global Constraints

- 简体中文：回复、代码注释、提交信息、文档。标识符/包名/字段名保留原文。
- UTF-8 无 BOM；单次写入 ≤ 500 行。
- 包边界：`core` 纯逻辑；`plugin-kit` 不依赖 UI 库；`canvas` 消费 `plugin-kit`；插件包仅依赖 `core` / `plugin-kit`，不得反向依赖 canvas。
- 第一版不分页；只做数据预览，不改 issue 另两项；不破坏现有 parity / 语义。
- 注册表必须挂 `Symbol.for` 全局键，支持多副本去重、幂等覆盖、订阅、注销。

## Review Focus

1. 宿主未传 `fields` 时，预览必须用 JSON 键推断列名/标签，不得空白或抛错 → Task 3 单测覆盖无 fields。
2. 根为标量 / 对象 / 数组三种形态各自正确落为单行表单 / 表单总览 / 表格 → Task 3 单测覆盖三形态。
3. 点击分组预览按钮不得触发挥手折叠（`stopPropagation`）→ Task 2 单测。
4. 弹窗挂在 shadow root 的 overlay 容器、作为 `.designer-container` 兄弟节点，不被 repaint 清掉；卸载时 dispose → Task 2 单测 + 手工验证。
5. 插件注册/注销幂等，注销后字段树按钮消失 → Task 2、Task 3 单测。

---

### Task 1: plugin-kit 新增字段树动作贡献点

**Files:**
- Create: `packages/plugin-kit/src/field-action.ts`
- Modify: `packages/plugin-kit/src/index.ts`（导出）
- Test: `packages/plugin-kit/src/__tests__/field-action.spec.ts`

**Interfaces:**
- Produces: `FieldGroupInfo { key, label, isList }`、`FieldActionContext { group, data?, fields?, container }`、`FieldActionUI { id, label, icon?, styles?, onActivate(ctx): void | (() => void) }`；注册表 `defineFieldActionUI` / `registerFieldActionUI` / `getFieldActionUIs` / `subscribeFieldActionRegistry` / `clearFieldActionUIs`。

- [ ] **Step 1: 写失败测试**：覆盖 `defineFieldActionUI` 校验（id/label 非空、onActivate 为函数）、注册后 `getFieldActionUIs()` 返回、同 id 后注册覆盖前者、注销只删自己这版、订阅在注册/注销时触发、`clearFieldActionUIs` 清空。
- [ ] **Step 2: 运行测试确认失败**：`npm run test -w @worm-print-platform/plugin-kit`
- [ ] **Step 3: 实现**：仿 `registry.ts` 的 `Symbol.for('worm-print-platform.field-action-registry.v1')` 全局注册态；`styles` 可选字符串原样保留。
- [ ] **Step 4: `index.ts` 导出类型与函数**，运行测试确认通过。
- [ ] **Step 5: 提交**：`git commit -m "feat(plugin-kit): 新增字段树动作贡献点 FieldActionUI"`

### Task 2: canvas 通用挂载点

**Files:**
- Modify: `packages/canvas/src/shell/controls.ts`（`ShellCtx` 加 `fieldActionHost: HTMLElement`）
- Modify: `packages/canvas/src/shell/panels.ts`（分组 header 渲染按钮）
- Modify: `packages/canvas/src/print-designer.ts`（overlay 容器、ctx 注入、订阅、卸载清理）
- Modify: `packages/core/src/styles/designer.css`（按钮样式；按包内脚本派生）
- Test: `packages/canvas/src/shell/__tests__/field-action.spec.ts`

**Interfaces:**
- Consumes: Task 1 的 `getFieldActionUIs` / `subscribeFieldActionRegistry` / `FieldActionContext`。
- Produces: 字段树 header 出现 `.field-action-btn`（`data-tip` = action.label）；点击传 `{ group: {key,label,isList}, data: ctx.host.designData, fields: ctx.host.fields, container: fieldActionHost }`，返回的 dispose 由宿主在卸载时调用。

- [ ] **Step 1: 写失败测试**：字段树注入一个 mock FieldActionUI 后：分组 header 有按钮、按钮 `data-tip` 正确、点击调用 `onActivate` 且入参分组名/data/fields 正确、点击不触发分组折叠（`collapsedGroups` 不变）；注销后按钮消失。
- [ ] **Step 2: 运行测试确认失败**：`npm run test -w @worm-print-platform/canvas`
- [ ] **Step 3: 实现 `panels.ts`**：在 `fieldsPane` 的 `group.key` 非空 header 内追加按钮，`onClick` 先 `stopPropagation()` 再调用 action；按钮用 `data-tip` 复用现有浮层。
- [ ] **Step 4: 实现 `print-designer.ts`**：`connectedCallback` 创建 `.pd-field-action-host` 容器挂到 `this.root`（与 `.designer-container` 同级）、`ctx` getter 注入 `fieldActionHost`、`attachPluginUI` 订阅 `subscribeFieldActionRegistry(repaint)`、记录 `onActivate` 返回的 dispose 并在 `disconnectedCallback` 调用且清空容器；`syncPluginUIStyles` 一并注入 action.styles。
- [ ] **Step 5: 加按钮样式到 `core/src/styles/designer.css` 并按包内 gen 脚本派生**，跑 canvas 测试确认通过。
- [ ] **Step 6: 提交**：`git commit -m "feat(canvas): 字段树挂载插件动作按钮与 overlay 容器"`

### Task 3: 数据预览插件包

**Files:**
- Create: `marketplace/plugins/data-preview/package.json`、`plugin.json`、`tsconfig.json`、`tsconfig.build.json`、`vitest.config.ts`、`README.md`
- Create: `marketplace/plugins/data-preview/src/{index,describe,ui,constants,types}.ts`
- Create: `marketplace/plugins/data-preview/src/__tests__/describe.spec.ts`、`ui.spec.ts`
- Modify: `marketplace/marketplace.json`（新增索引项）
- Test: 插件包内 `npm test`

**Interfaces:**
- Consumes: Task 1 的 `defineFieldActionUI` / `registerFieldActionUI`、Task 1 的 `FieldActionContext`。
- Produces: `describeDataSource(root: unknown, fields: readonly PrintBusinessField[], group: FieldGroupInfo): PreviewDescriptor`（overview 行 + tabs + rootKind）；`mountPreview(ctx: FieldActionContext): () => void`（渲染弹窗并返回 dispose）。入口 `src/index.ts` import 即注册。

- [ ] **Step 1: 写失败测试 `describe.spec.ts`**：覆盖对象根（总览行 + 对象/数组子属性生成 tab）、数组根（表格 + 元素内对象/数组列生成 tab）、标量根（单行）、无 fields 回退 JSON key、字段 label 优先与 sortOrder 排序、不分页（表格一次给出全部行）。
- [ ] **Step 2: 运行测试确认失败**：`npm test -w @worm-print-platform/plugin-data-preview`
- [ ] **Step 3: 实现 `describe.ts` 纯函数**（按设计文档 §4.2-4.4 规则）。
- [ ] **Step 4: 写失败测试 `ui.spec.ts`**：渲染弹窗含 tab 栏、总览表、总览行“查看 →”点击后切到对应子 tab、对象子 tab 渲染表单、数组子 tab 渲染表格、关闭时容器清空且 dispose 可调用。
- [ ] **Step 5: 实现 `ui.ts` + `index.ts` + 元数据文件**：多 tab 局部重绘（不触发 canvas repaint）、弹窗样式通过 `styles` 交给 canvas 注入；`index.ts` 调 `registerFieldActionUI`。
- [ ] **Step 6: 更新 `marketplace/marketplace.json`**，运行插件包全部测试确认通过。
- [ ] **Step 7: 提交**：`git commit -m "feat(marketplace): 新增数据预览插件（多 tab 表单/表格）"`

### Task 4: demo 接入与端到端验证

**Files:**
- Modify: `demos/apps/vue3/package.json`（加 `@worm-print-platform/plugin-data-preview` 依赖）
- Modify: `demos/apps/vue3/src/main.js`（import 插件副作用入口）

**Interfaces:**
- Consumes: Task 3 插件包入口（import 即注册）。

- [ ] **Step 1: 接入 vue3 demo**：加 workspace 依赖并在 `main.js` import 插件入口。
- [ ] **Step 2: 安装依赖**：`npm install`（workspaces 链接）。
- [ ] **Step 3: 构建验证**：`npm run build`（必要时按包运行 `build -w` 各改动 workspace）。
- [ ] **Step 4: 运行验证**：`npm test`；`npm run test -w @worm-print-platform/render`（涉及渲染管线时）。
- [ ] **Step 5: 手工看效果**：启动 vue3 demo，打开“费用结算单”→ 点“系统信息”看表单总览、点“费用明细”看表格总览；构造含嵌套对象/数组的数据验证子 tab 与“查看 →”跳转；核对不分页。
- [ ] **Step 6: 提交**：`git commit -m "feat(demo): vue3 demo 接入数据预览插件"`

## Execution Note

用户已指定 native 执行（当前会话内实现），无需再选择执行方式；每任务完成按上述命令验证后再进入下一任务。若某步验证失败，先修复再继续。

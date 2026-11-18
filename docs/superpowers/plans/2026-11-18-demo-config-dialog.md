# Demo 显示配置弹窗 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在四个宿主 demo 顶部新增一个「配置」按钮，弹出只含预览/保存按钮显隐的弹窗，现有顶部操作一律不动。

**Architecture:** 四个 demo 是独立 npm 工程，各自按现有弹窗模式实现：vue3/vue2 用 SFC 内联弹窗，react 新建独立 `ConfigDialog` 组件，jquery 在 `index.html` 写模板 + `app.js` 绑事件。显隐状态通过 property 即时写回 `<print-designer>`。

**Tech Stack:** Vue 3 / Vue 2 SFC、React JSX、jQuery DOM、原生 CSS。

**Spec:** `docs/superpowers/specs/2026-11-18-demo-config-dialog-design.md`

**状态：已实施完成。** 初版含主题色配置，后按需求从示例移除；最终弹窗只含两个显隐开关。设计器本体的 `theme` / `themeConfig` 参数能力保留，见 Spec「配置能力介绍」。

## Global Constraints

- 只做加法：现有顶部 7 类操作、三个弹窗、`topbar-overflow.js` 及其「更多」面板一律不动。
- 弹窗只含两个开关：`showPreview` 开关、`showSave` 开关，**不暴露配色控件**。
- 布尔开关统一走 property 写入（`el.showPreview = ...`），不要依赖模板 attribute 绑定——Vue 2 会把 `false` 渲染成移除属性导致开关失效。
- 四个 demo 行为一致；样式以 vue3 的 `demo-ui.css` 为唯一源，`npm run styles:demos` 同步其余三份。

## Review Focus

- 预览/保存按钮隐藏后，`save()` 方法与 `save` / `preview` 事件仍可用（设计器既有语义，demo 不应另行拦截）。
- Vue 2 的布尔 attribute 陷阱：模板 `:show-preview="false"` 会移除属性，必须是 `el.showPreview = false`。
- jQuery 侧给自定义元素赋布尔属性必须用 property（`el.showPreview = ...`）。
- 新按钮加入顶部后，`topbar-overflow.js` 的单元收集不应把它误收纳或破坏窄屏布局。
- 四个 demo 的配置项名称、默认值、行为逐项一致，避免同源漂移。

---

### Task 1: vue3 demo 配置弹窗

**Files:** `demos/apps/vue3/src/App.vue`、`demos/apps/vue3/src/styles/demo-ui.css`（样式唯一源）
- [x] 加状态 `configVisible` / `showPreview`(true) / `showSave`(true)；`<print-designer>` 显隐统一走 property。
- [x] 顶部加「配置」按钮；新增 `v-if="configVisible"` 弹窗，含两个复选框 + 完成按钮 + 遮罩点击关闭。
- [x] `watch([showPreview, showSave], applyDisplayConfig)` 写回元素 property。
- [x] 样式追加（`.config-mask` / `.config-panel` / `.config-row` 等），同步其余三份 demo-ui.css。
- [x] 验证 `npm run build`；提交 `bf718a3`。

### Task 2: vue2 demo 配置弹窗

**Files:** `demos/apps/vue2/src/App.vue`
- [x] Options API：data 加两开关，watch 指向 `applyDisplayConfig`，methods 实现写回。
- [x] 顶部按钮 + 弹窗模板。
- [x] 修复：移除模板 `:show-preview` 绑定，显隐统一走 property（提交 `f88dc3e`）。
- [x] 验证 `npm run build`；提交 `6e576f3`。

### Task 3: react demo 配置弹窗

**Files:** `demos/apps/react/src/App.jsx`、新建 `demos/apps/react/src/components/ConfigDialog.jsx`
- [x] 新建 `ConfigDialog`，props 为 visible/onClose/showPreview/setShowPreview/showSave/setShowSave。
- [x] App 加 state + `useEffect` 写回元素 property；顶部按钮 + 渲染 ConfigDialog。
- [x] 验证 `npm run build`；提交 `34ceab7`。

### Task 4: jquery demo 配置弹窗

**Files:** `demos/apps/jquery/index.html`、`demos/apps/jquery/src/app.js`
- [x] 顶部 `#btn-config` 按钮 + 配置弹窗模板（两个 checkbox）。
- [x] app.js 模块级状态 + `applyDisplayConfig` 写回 property；绑定打开/关闭/切换事件。
- [x] 验证 `node --check`；提交 `d894b35`。

### Task 5: 复核与配色移除

- [x] Playwright 打开四 demo 复核：终版每 demo 9 项共 36 项通过，零页面错误。
- [x] 按需求从示例移除配色控件（提交 `9fd6228`），设计器本体参数能力保留。

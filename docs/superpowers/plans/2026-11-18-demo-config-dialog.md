# Demo 显示配置弹窗 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在四个宿主 demo 顶部新增一个「配置」按钮，弹出只含预览/保存显隐与主题色的配置弹窗，现有顶部操作一律不动。

**Architecture:** 四个 demo 是独立 npm 工程，各自按现有弹窗模式实现：vue3/vue2 用 SFC 内联弹窗，react 新建独立 `ConfigDialog` 组件，jquery 在 `index.html` 写模板 + `app.js` 绑事件。设计器参数通过 property 即时写回 `<print-designer>`。

**Tech Stack:** Vue 3 / Vue 2 SFC、React JSX、jQuery DOM、原生 CSS。

**Spec:** `docs/superpowers/specs/2026-11-18-demo-config-dialog-design.md`

## Global Constraints

- 只做加法：现有顶部 7 类操作、三个弹窗、`topbar-overflow.js` 及其「更多」面板一律不动。
- 弹窗只含三组内容：`showPreview` 开关、`showSave` 开关、主题色（预设三选一 + 4 色覆盖 + 重置）。
- 主题预设值：`auto`（默认）/ `light` / `dark`；覆盖色键：`--pd-bg`、`--pd-surface`、`--pd-text`、`--pd-accent`。
- `themeConfig` 是对象，必须走 property；`showPreview` / `showSave` / `theme` 可走 property。
- 画布令牌（`--pd-paper` / `--pd-canvas-bg` / 标尺 / 手柄）不暴露，保持所见即所得。
- 四个 demo 行为一致；颜色输入用原生 `<input type="color">` + 清空按钮，避免非法色值。

## Review Focus

- `themeConfig.overrides` 非空时压过 `theme` 预设（设计器既有优先级）；重置后回到 `auto` 且覆盖为空。
- 预览/保存按钮隐藏后，`save()` 方法与 `save` / `preview` 事件仍可用（设计器既有语义，demo 不应另行拦截）。
- jQuery 侧给自定义元素赋对象属性必须用 property（`el.themeConfig = {...}`），不能 `setAttribute`。
- 新按钮加入顶部后，`topbar-overflow.js` 的单元收集不应把它误收纳或破坏窄屏布局。
- 四个 demo 的配置项名称、默认值、行为逐项一致，避免同源漂移。

---

### Task 1: vue3 demo 配置弹窗

**Files:**
- Modify: `demos/apps/vue3/src/App.vue`（顶部加按钮；print-designer 绑定改为状态驱动；新增弹窗模板与状态/方法）
- Modify: `demos/apps/vue3/src/styles/demo-ui.css`（沿用现有 `.demo-*` 弹窗样式族）

**Interfaces:**
- Produces: 顶部按钮点击打开 `configVisible`；弹窗内 `showPreview` / `showSave` / `theme` / `themeOverrides` 状态写回 `el.theme` 与 `el.themeConfig`。

- [ ] **Step 1: 加状态与绑定** — 在 `<script setup>` 增加 `configVisible`、`showPreview`（默认 true）、`showSave`（默认 true）、`theme`（默认 'auto'）、`themeOverrides`（reactive，4 键默认空串）；把 `<print-designer>` 的 `:show-preview="true"` 改为 `:show-preview="showPreview"`，并加 `:show-save="showSave"`。注意模板里对象属性绑定在自定义元素上会走 setAttribute，因此 `theme` / `themeConfig` 需在 `onMounted`/watch 里直接赋给 `designerRef.value`。
- [ ] **Step 2: 加顶部按钮与弹窗模板** — 在 `.demo-topbar` 的「更多」组之后、打印输出按钮之前加 `<button class="demo-print-btn" @click="configVisible = true">配置</button>`（不设 `data-overflow-unit`）；在现有三个弹窗之后加 `v-if="configVisible"` 的配置弹窗，含关闭按钮、遮罩点击关闭、两组开关 + 主题预设按钮组 + 4 个 `<input type="color">`（各配清空按钮）+ 重置配色按钮。
- [ ] **Step 3: 实现写回逻辑** — `watch([showPreview, showSave, theme, themeOverrides], ...)` 把值赋给 `designerRef.value` 对应 property；`themeOverrides` 转成 `themeConfig.overrides` 时过滤空串；重置方法清空 4 键并把 `theme` 设为 'auto'。
- [ ] **Step 4: 样式** — 在 demo-ui.css 追加配置弹窗样式，复用现有 `.print-mask` / `.print-panel` 视觉，新增开关行、预设按钮选中态、颜色输入行。
- [ ] **Step 5: 验证** — `npm run build -w @worm-print-platform/demos-vue3`（若该脚本不存在则用 `cd demos/apps/vue3 && npm run build`）；浏览器打开 demo，点「配置」确认弹窗打开、四组控件切换即时生效、关闭正常、原顶部按钮仍在。
- [ ] **Step 6: Commit** — `git commit -m "feat(demos): vue3 新增显示配置弹窗"`

### Task 2: vue2 demo 配置弹窗

**Files:** `demos/apps/vue2/src/App.vue`、`demos/apps/vue2/src/styles/demo-ui.css`
**Interfaces:** 与 Task 1 同名的状态与行为；Vue 2 用 Options API 的 `data` / `watch`，自定义元素属性同样在 `mounted` 后直接赋 property。

- [ ] **Step 1-5:** 按 Task 1 的五步在 vue2 实现，遵循该文件现有 Options API 风格；验证用 `cd demos/apps/vue2 && npm run build`。
- [ ] **Step 6: Commit** — `git commit -m "feat(demos): vue2 新增显示配置弹窗"`

### Task 3: react demo 配置弹窗

**Files:**
- Create: `demos/apps/react/src/components/ConfigDialog.jsx`
- Modify: `demos/apps/react/src/App.jsx`（顶部加按钮、引入 ConfigDialog、状态与写回）
- Modify: `demos/apps/react/src/styles/demo-ui.css`

**Interfaces:** `ConfigDialog` 接收 `{ visible, onClose, showPreview, setShowPreview, showSave, setShowSave, theme, setTheme, overrides, setOverrides }`；`App.jsx` 在 `<print-designer>` ref 上写 property。

- [ ] **Step 1:** 新建 `ConfigDialog.jsx`，props 按上签；模板含两组开关、主题预设、4 色输入 + 清空、重置按钮；关闭走 `onClose` 与遮罩点击。
- [ ] **Step 2:** `App.jsx` 加 `configVisible` 等 state，顶部打印输出按钮前加 `<button className="demo-print-btn">配置</button>`（不设 `data-overflow-unit`），在三个现有 Dialog 之后渲染 `<ConfigDialog ... />`；用 `useEffect` 把 state 写回 `designerRef.current`。
- [ ] **Step 3:** 样式追加，与现有 Dialog 一致。
- [ ] **Step 4:** 验证 `cd demos/apps/react && npm run build`；浏览器点检。
- [ ] **Step 5: Commit** — `git commit -m "feat(demos): react 新增显示配置弹窗"`

### Task 4: jquery demo 配置弹窗

**Files:** `demos/apps/jquery/index.html`、`demos/apps/jquery/src/app.js`、`demos/apps/jquery/src/styles/demo-ui.css`
**Interfaces:** `app.js` 暴露 `openConfigDialog`；配置状态存模块级对象；写回 `el.showPreview` / `el.showSave` / `el.theme` / `el.themeConfig`（property 赋值）。

- [ ] **Step 1:** `index.html` 顶部加「配置」按钮，新增配置弹窗模板（遮罩、关闭、开关、预设、颜色输入、重置）。
- [ ] **Step 2:** `app.js` 加状态对象与事件绑定：按钮打开/关闭弹窗、开关与颜色输入更新状态并写回设计器 property、重置清空覆盖并设 theme='auto'。
- [ ] **Step 3:** 样式追加，与现有弹窗一致。
- [ ] **Step 4:** 验证 `cd demos/apps/jquery && npm run build`；浏览器点检。
- [ ] **Step 5: Commit** — `git commit -m "feat(demos): jquery 新增显示配置弹窗"`

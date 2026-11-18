# Demo 配置弹窗主题预设 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在四个宿主 demo 的「配置」弹窗中新增亮色 / 暗色 / 跟随系统三档主题预设，默认跟随系统。

**Architecture:** 复用现有配置弹窗与 `.config-section/.config-label/.config-row` 样式，新增一个主题单选组；各 demo 在既有配置写回函数里加 `el.theme = mode`（property，setter 同步 attribute）。样式单一源为 vue3 的 `demo-ui.css`，用 `npm run styles:demos` 同步其余三份。

**Tech Stack:** Vue 3 / Vue 2 / React / jQuery 四个独立 demo 工程；Web Components `<print-designer>`。

**Spec:** `docs/superpowers/specs/2026-11-18-demo-config-dialog-design.md`

## Global Constraints

- 主题值只允许 `auto` / `light` / `dark`，默认 `auto`；不暴露 `themeConfig` 色值输入。
- 不改动设计器本体接口与行为；不搬运顶部其他操作到弹窗。
- 样式以 `demos/apps/vue3/src/styles/demo-ui.css` 为唯一源，`npm run styles:demos` 同步其余三份。
- 提交信息与文档一律简体中文，UTF-8 无 BOM。

## Review Focus

- 切到暗色后纸张 / 画布背景 / 标尺 / 手柄不变色（设计器既有语义）——每个 demo 点检时确认只外壳变色。
- 选回「跟随系统」后 `theme` 属性为 `auto`，且系统主题切换时外壳跟随。
- Vue 2 不得用模板 `:theme` 绑定（自定义元素属性绑定会覆盖 property setter）——统一在 `applyDisplayConfig` 里写 property。
- 四宿主弹窗结构、默认值、选项顺序完全一致。
- 主题切换不影响显隐开关与 `save()` / `preview` 事件。

---

### Task 1: vue3 弹窗与样式源

**Files:**
- Modify: `demos/apps/vue3/src/App.vue`（配置弹窗模板、state、`applyDisplayConfig`）
- Modify: `demos/apps/vue3/src/styles/demo-ui.css`（radio 行样式微调，仅必要时）

- [ ] **Step 1: 在 vue3 配置弹窗新增主题单选组**

在「按钮显隐」`section` 后新增「主题」`section`，三个 `<input type="radio" name="config-theme">` 绑定 `themeMode`，值为 `light` / `dark` / `auto`，文案「亮色」「暗色」「跟随系统」，复用 `.config-section/.config-label/.config-row`。

- [ ] **Step 2: 新增 state 并写回 property**

`const themeMode = ref('auto')`；在 `applyDisplayConfig()` 中加 `el.theme = themeMode.value`；把 `themeMode` 加入 watch 数组。

- [ ] **Step 3: 验证 vue3**

起 `:9331`，打开配置弹窗，确认三档切换即时改变设计器外壳，选回 `auto` 后 `el.theme === 'auto'`。

### Task 2: 同步样式到其余三宿主

**Files:** 由脚本写入 `demos/apps/vue2|react|jquery/src/styles/demo-ui.css`

- [ ] **Step 1: 运行 `npm run styles:demos`**

确认四份 `demo-ui.css` 字节一致（必要时先微调 vue3 源中 `.config-row input` 以适配 radio）。

### Task 3: vue2 弹窗

**Files:** Modify `demos/apps/vue2/src/App.vue`

- [ ] **Step 1:** 按 Task 1 同样的结构加主题单选组（模板用 `v-model="themeMode"`，不用 `:theme` 绑定）。
- [ ] **Step 2:** `data` 增 `themeMode: 'auto'`，`watch` 增 `themeMode: 'applyDisplayConfig'`，`applyDisplayConfig()` 加 `el.theme = this.themeMode`。
- [ ] **Step 3:** 起 `:9332` 点检三档与 `auto` 回落。

### Task 4: react 弹窗

**Files:** Modify `demos/apps/react/src/App.jsx`, `demos/apps/react/src/components/ConfigDialog.jsx`

- [ ] **Step 1:** ConfigDialog 增 props `themeMode, setThemeMode`，渲染主题 `section` 三个 radio。
- [ ] **Step 2:** App 增 state `useState('auto')`，透传给 ConfigDialog，并在现有 effect 中加 `el.theme = themeMode` 与依赖。
- [ ] **Step 3:** 起 `:9335` 点检。

### Task 5: jquery 弹窗

**Files:** Modify `demos/apps/jquery/index.html`, `demos/apps/jquery/src/app.js`

- [ ] **Step 1:** index.html 增主题 `section` 三个 radio（`id="config-theme-light|dark|auto"`，auto 默认 checked），`name="config-theme"`。
- [ ] **Step 2:** app.js `state` 增 `themeMode: 'auto'`；`applyDisplayConfig()` 加 `el.theme = state.themeMode`；`bindConfigDialog()` 绑定三个 radio 的 change。
- [ ] **Step 3:** 起 `:9334` 点检。

### Task 6: 文档与整体验收

**Files:** Modify `docs/superpowers/specs/2026-11-18-demo-config-dialog-design.md`

- [ ] **Step 1:** 在复核记录补本次四宿主点检结果（每 demo 项数与零页面错误）。
- [ ] **Step 2:** `npm run build` 通过。
- [ ] **Step 3:** Playwright 逐 demo 点检：弹窗打开、主题单选数=3、默认值 auto、三档写回 `theme` 属性、显隐开关仍生效、完成按钮关闭弹窗。

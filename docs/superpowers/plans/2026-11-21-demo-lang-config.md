# Demo 配置弹窗增加设计器语言设置 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 4 组 demo 的「配置」弹窗中各加一个「语言」三档 radio（跟随系统/简体中文/English），写回设计器 `el.lang`，让用户直接切换设计器界面语言。

**Architecture:** 每个 demo 独立实现：宿主状态 `langMode`（默认 `'auto'`）→ 配置弹窗 radio → 写回函数用 property `el.lang = langMode === 'auto' ? undefined : langMode`（不写 attribute，规避 lang attribute 递归 bug）。设计器侧 i18n API 已就位（`lang` property / `setLocale()`），本计划不改设计器本体。

**Tech Stack:** Vue 3 / Vue 2 / React 18 / jQuery 3（各自独立 demo）、Vite、Playwright e2e。

**Spec:** `docs/superpowers/specs/2026-11-21-demo-lang-config-design.md`

## Global Constraints

- 4 组 demo 各自独立实现，无共享配置模块；改动分别落 `demos/apps/{vue3,vue2,react,jquery}`。
- 语言档位三档：`auto`（跟随系统）/ `zh-CN` / `en-US`，默认 `auto`。
- 写回统一走 property：`el.lang = v === 'auto' ? undefined : v`；**禁止** `setAttribute('lang', ...)`（已修复的递归 bug）。
- 配置弹窗自身文案保持中文，不随语言切换（demo 宿主 UI，非设计器 UI）。
- 复用现有样式类 `.config-section/.config-label/.config-row`，不新增样式、不改 demo-ui.css（四份需 MD5 一致）。
- 不修改设计器（canvas/core）代码；不新增语言包。
- Playwright 浏览器需用系统 Chrome（`channel: 'chrome'`），Playwright 自带 chromium 未安装。
- 验收脚本 `demos/scripts/verify-config-dialog.mjs` 现有 `chromium.launch()` 缺 channel，本次一并改为 `channel: 'chrome'`（直接相关的可运行性修复）。

## Review Focus

1. `auto` 档写回 `el.lang = undefined` 后，设计器 `get lang()` 应回退到探测值（zh-CN 环境），且 `lang` attribute 被移除 — Task 5 的 e2e 断言 `getAttribute('lang') === null`、按钮回中文。
2. 显式档切换即时生效：选 `en-US` 后设计器 shadow DOM 按钮由「保存」变「Save」；选 `zh-CN` 变回 — Task 5 e2e 断言真实文案。
3. 语言切换不破坏现有配置（主题/显隐）：切语言后 theme/showPreview/showSave 写回仍正常 — Task 5 e2e 沿用主题写回断言 + 语言切换后主题不受影响。
4. Vue3 的字段显示与数据源预览开关（Vue3 独有 4 个 checkbox）不受语言配置影响 — Task 5 修正 checkbox 数量断言为 Vue3=4、其余=2，并验证语言 radio 不与字段显示 radio（`name="config-field-display"`）串档。
5. 4 组宿主写回路径不同（Vue3 watch / Vue2 watch 字符串映射 / React useEffect / jQuery change 绑定），都要确保 `langMode` 纳入响应式并写回 — 每个 demo 任务的验证_step 各自跑通对应端口。

---

### Task 1: Vue3 demo 配置弹窗加语言设置

**Files:**
- Modify: `demos/apps/vue3/src/App.vue`（弹窗 DOM 主题段后、状态、applyDisplayConfig、watch）

**Interfaces:**
- Consumes: 设计器 `el.lang: string | undefined` property。
- Produces: `langMode: Ref<'auto'|'zh-CN'|'en-US'>`；`applyDisplayConfig()` 写 `el.lang`。

- [ ] **Step 1: 写失败测试（Playwright，针对已运行的 9331）**
  创建临时脚本（计划执行时的 workspace 内），断言：打开 9331 配置弹窗后 `input[name="config-lang"]` 数量为 3、值排序为 ['auto','en-US','zh-CN']、默认选中 'auto'。
  Run: `node <workspace>/verify-lang-vue3.mjs`（脚本用 `chromium.launch({ channel: 'chrome' })`，goto 9331，点 `.demo-topbar button:has-text("配置")`）。
  Expected: FAIL（radio 不存在，数量 0）。

- [ ] **Step 2: 运行测试确认失败**
  Run: 同上。
  Expected: FAIL。

- [ ] **Step 3: 实现**
  - `<script setup>`：在 `const themeMode = ref('auto')` 附近加 `const langMode = ref('auto')`（line 364 区域）。
  - 弹窗 DOM：主题 section（line 287–301）之后加一个 `<section class="config-section">`，`config-label` 为「语言」，三个 `<label class="config-row"><input v-model="langMode" type="radio" name="config-lang" value="..."/><span>...</span></label>`，值为 `auto`（跟随系统）、`zh-CN`（简体中文）、`en-US`（English）。
  - `applyDisplayConfig()`（line 935）：增加 `el.lang = langMode.value === 'auto' ? undefined : langMode.value`。
  - `watch([showPreview, showSave, fieldDisplay, themeMode], applyDisplayConfig)`（line 945）：数组加 `langMode`。
  - `onMounted` 已调用 `applyDisplayConfig`，无需改。

- [ ] **Step 4: 运行测试确认通过**
  Run: `node <workspace>/verify-lang-vue3.mjs`
  Expected: PASS（3 个 radio、默认 auto）。

- [ ] **Step 5: 提交**
  `git add demos/apps/vue3/src/App.vue && git commit -m "feat(demo-vue3): 配置弹窗增加设计器语言设置"`

---

### Task 2: Vue2 demo 配置弹窗加语言设置

**Files:**
- Modify: `demos/apps/vue2/src/App.vue`

**Interfaces:**
- Consumes: 设计器 `el.lang` property。
- Produces: `data.langMode: 'auto'|'zh-CN'|'en-US'`；`applyDisplayConfig()` 写 `el.lang`。

- [ ] **Step 1: 写失败测试**
  临时脚本针对 9332，断言 `input[name="config-lang"]` 3 档齐全、默认 auto。
  Expected: FAIL。

- [ ] **Step 2: 运行测试确认失败**
  Expected: FAIL。

- [ ] **Step 3: 实现**
  - `data()`（line 129 `themeMode: 'auto'` 后）加 `langMode: 'auto'`。
  - 弹窗主题 section（line 872–886）后加语言 section，radio `name="config-lang"`，值 `auto/zh-CN/en-US`，`v-model="langMode"`，文案同 Task 1。
  - `applyDisplayConfig()`（line 226）：加 `el.lang = this.langMode === 'auto' ? undefined : this.langMode`。
  - watch 映射（line 182–185 区域）：加 `'langMode': 'applyDisplayConfig'`。
  - `mounted` 已调用 `applyDisplayConfig`，无需改。

- [ ] **Step 4: 运行测试确认通过**
  Expected: PASS。

- [ ] **Step 5: 提交**
  `git add demos/apps/vue2/src/App.vue && git commit -m "feat(demo-vue2): 配置弹窗增加设计器语言设置"`

---

### Task 3: React demo 配置弹窗加语言设置

**Files:**
- Modify: `demos/apps/react/src/components/ConfigDialog.jsx`、`demos/apps/react/src/App.jsx`

**Interfaces:**
- Consumes: 设计器 `el.lang` property。
- Produces: `langMode/setLangMode` props 与 `useState`；`useEffect` 写 `el.lang`。

- [ ] **Step 1: 写失败测试**
  临时脚本针对 9335，断言 `input[name="config-lang"]` 3 档齐全、默认 auto。
  Expected: FAIL。

- [ ] **Step 2: 运行测试确认失败**
  Expected: FAIL。

- [ ] **Step 3: 实现**
  - `ConfigDialog.jsx`：props 解构加 `langMode, setLangMode`；主题 section（line 28–42）后加语言 section，radio `name="config-lang"` 三档，`checked={langMode === v}` / `onChange={() => setLangMode(v)}`，文案同 Task 1。
  - `App.jsx`：`const [langMode, setLangMode] = useState('auto')`（themeMode 附近 line 343）；传给 `<ConfigDialog langMode={langMode} setLangMode={setLangMode} .../>`（line 525–534）；`useEffect`（line 346–352）依赖数组加 `langMode`，函数体加 `el.lang = langMode === 'auto' ? undefined : langMode`。

- [ ] **Step 4: 运行测试确认通过**
  Expected: PASS。

- [ ] **Step 5: 提交**
  `git add demos/apps/react/src && git commit -m "feat(demo-react): 配置弹窗增加设计器语言设置"`

---

### Task 4: jQuery demo 配置弹窗加语言设置

**Files:**
- Modify: `demos/apps/jquery/index.html`、`demos/apps/jquery/src/app.js`

**Interfaces:**
- Consumes: 设计器 `el.lang` property。
- Produces: `state.langMode`；`applyDisplayConfig()` 写 `el.lang`；change 绑定。

- [ ] **Step 1: 写失败测试**
  临时脚本针对 9334，断言 `#config-mask input[name="config-lang"]` 3 档齐全、默认 auto。
  Expected: FAIL。

- [ ] **Step 2: 运行测试确认失败**
  Expected: FAIL。

- [ ] **Step 3: 实现**
  - `index.html` 弹窗主题 section（line 249–258 区域）后加语言 section：`name="config-lang"`，三个 radio，`value="auto"|"zh-CN"|"en-US"`，auto 默认 checked，文案同 Task 1。
  - `app.js`：`state`（line 32 后）加 `langMode: 'auto'`；`applyDisplayConfig()`（line 36）加 `el.lang = state.langMode === 'auto' ? undefined : state.langMode`；`bindConfigDialog()`（line 51）加 `$('input[name="config-lang"]').on('change', function () { state.langMode = this.value; applyDisplayConfig() })`。

- [ ] **Step 4: 运行测试确认通过**
  Expected: PASS。

- [ ] **Step 5: 提交**
  `git add demos/apps/jquery && git commit -m "feat(demo-jquery): 配置弹窗增加设计器语言设置"`

---

### Task 5: 更新统一验收脚本并全量验证

**Files:**
- Modify: `demos/scripts/verify-config-dialog.mjs`

**Interfaces:**
- Consumes: 4 组 demo 的 `input[name="config-lang"]` radio 与 `el.lang` property。

- [ ] **Step 1: 写失败测试（扩展验收脚本）**
  - `chromium.launch()` 改为 `chromium.launch({ channel: 'chrome' })`（可运行性）。
  - 在每组 demo 循环内（line 41 后）加：
    - `input[name="config-lang"]` 数量 3、值排序 `['auto','en-US','zh-CN']`、默认选中 `['auto']`。
    - 点选 `input[name="config-lang"][value="en-US"]`，断言 `el.evaluate(x => x.lang) === 'en-US'` 且 shadow DOM 某按钮文案为英文（保存按钮 text 含 'Save'）。
    - 点选 `[value="zh-CN"]`，断言 `x.lang === 'zh-CN'` 且按钮文案回中文（含 '保存'）。
    - 点选 `[value="auto"]`，断言 `el.getAttribute('lang') === null` 且 `x.lang` 为探测值（zh-CN 环境回 'zh-CN'）。
  - 修正 line 41 checkbox 数量断言：`vue3 === 4`，其余 `=== 2`。
  Run: `node demos/scripts/verify-config-dialog.mjs`（需 dev server 在跑，已确认 9300/9331/9332/9334/9335/9336 均 200）。
  Expected: 初次 FAIL（脚本新增断言尚未被实现满足——但本任务在 Task 1-4 之后，实际会 PASS；此处「失败测试」指脚本本身的断言先写好）。

- [ ] **Step 2: 运行测试确认断言生效**
  Run: 同上。
  Expected: PASS（Task 1-4 已实现）。

- [ ] **Step 3: 实现脚本改动**
  按 Step 1 列出的具体改动写入 `verify-config-dialog.mjs`。

- [ ] **Step 4: 运行全量验收**
  Run: `node demos/scripts/verify-config-dialog.mjs`
  Expected: 全部 PASS，零页面错误。

- [ ] **Step 5: 提交**
  `git add demos/scripts/verify-config-dialog.mjs && git commit -m "test(demos): 验收配置弹窗语言设置并修正 checkbox 断言"`

---

## 收尾

- 全量构建：`npm run build`（Expected: 0）
- 全量测试：`npm test`（Expected: 0）
- e2e：`node demos/scripts/verify-config-dialog.mjs`（Expected: 全部 PASS）

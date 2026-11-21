# i18next 统一语言引擎 + 泰语种 + 可导出 bundle 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 core 的 i18n 引擎换成 i18next 薄封装（对外 API 不变），补齐泰语全量语言资源，并提供脚本把全部语言包导出成标准 i18next resources。

**Architecture:** core 内用 `createInstance()` 建一个 i18next 实例，内联三语种 resources，配 `keySeparator:false / nsSeparator:false / prefix:'{' / suffix:'}' / escapeValue:false / initImmediate:false`；`engine.ts` 保留现有全部导出函数签名，内部映射到 i18next。插件语言包映射到 i18next namespace。泰语按英文已覆盖键 AI 直译。导出脚本读取构建产物与源码 Record 字面量，产出 `{ locale: { namespace: messages } }`。

**Tech Stack:** TypeScript、i18next（新增运行时依赖，零外部依赖）、vitest、tsup、npm workspaces。

**Spec:** `docs/superpowers/specs/2026-11-21-i18next-thai-bundle-design.md`

## Global Constraints

- 对外 i18n API 签名与行为不变：`normalizeLocale / getLocale / setLocale / resetLocale / translate / t / createTranslator / registerLocale / mergeLocale / registerPluginMessages / subscribe / getMissingKeys / clearLocales`。
- `keySeparator: false`、`nsSeparator: false`、`interpolation.prefix='{'`、`suffix='}'`、`escapeValue: false`、`initImmediate: false`、`fallbackLng: 'zh-CN'`。
- `normalizeLocale`：空/非字符串 → `zh-CN`；`/^en([-_]|$)/i` → `en-US`；`/^th([-_]|$)/i` → `th-TH`；其余原样返回。
- `registerPluginMessages` 必须校验 key 以 `${pluginId}.` 开头，否则抛错。
- `clearLocales()` 保留 `core` 内置 bundle，只移除 `user` 与已注册插件 namespace。
- 单次文件写入 ≤500 行；UTF-8 无 BOM；提交信息中文。
- 默认在 master 分支直接开发。

## Review Focus

1. **含点 key 被 i18next 当嵌套解析** → Task 1 测试 `t('toolbar.save')` 返回译文而非空串。
2. **HTML 文案被转义** → Task 1 测试 `t('toolbarOverflow.k488', {v0:'<svg/>'})` 返回值包含未转义 `<svg/>`。
3. **`setLocale(null)` 语言未变时不通知订阅者** → Task 1 测试 `subscribe` 在 `resetLocale()` 后收到回调。
4. **插件 key 跨 namespace 命中失败** → Task 2 测试注册 `echarts.kinds.k84` 后 `t()` 能取到译文。
5. **泰语缺键导致界面中文混入** → Task 6 三方 parity 校验 + Task 8 泰语界面扫描断言。

---

### Task 1: i18next 实例与引擎兼容层

**Files:**
- Modify: `packages/core/package.json`（新增 `dependencies.i18next`）
- Create: `packages/core/src/i18n/i18n-instance.ts`
- Rewrite: `packages/core/src/i18n/engine.ts`
- Modify: `packages/core/src/i18n/index.ts`（导出 `getResources`）
- Test: `packages/core/src/i18n/__tests__/engine.spec.ts`（重写）

**Interfaces:**
- Consumes: `zhCN`（`messages/zh-CN.js`）、`enUS`（`messages/en-US.js`）、`thTH`（Task 3 产出；在本任务先用 `enUS` 占位直到 Task 3 完成）
- Produces: `getResources(locale?: string): Record<string, any>`；其余导出函数签名保持不变（见 Global Constraints）。

- [ ] **Step 1: 安装依赖**

Run: `npm install i18next -w @worm-print-platform/core`
Expected: `package.json` 与 `package-lock.json` 出现 i18next。

- [ ] **Step 2: 写失败测试（引擎语义）**

在 `engine.spec.ts` 增加/改写断言：
- `t('toolbar.save')` 在 `setLocale('zh-CN')` 后为 `'保存'`，`setLocale('en-US')` 后为 `'Save'`
- `t('toolbarOverflow.k488', { v0: '<svg/>', v1: '' })` 结果含 `'<svg/>'` 且不含 `'&lt;'`
- `createTranslator('en-US')('toolbar.save')` 始终 `'Save'`，全局切到 zh-CN 后仍 `'Save'`
- `subscribe(cb)` 后 `setLocale(null)` 触发 cb
- `getMissingKeys()` 含一个完全不存在的 key
- `normalizeLocale('th') === 'th-TH'`

- [ ] **Step 3: 运行测试确认 RED**

Run: `npm test -w @worm-print-platform/core -- --run src/i18n/__tests__/engine.spec.ts`
Expected: FAIL（模块未实现/期望值不符）。

- [ ] **Step 4: 实现 `i18n-instance.ts`**

导出 `createI18nInstance()`：用 `createInstance()` 建实例，`init()` 配置见 Global Constraints；`resources` 先含 `zh-CN`、`en-US`，`th-TH` 用 `enUS` 占位（Task 3 替换）。导出 `detectLocale()`：`navigator.language` → `normalizeLocale`，异常回 `zh-CN`。

- [ ] **Step 5: 重写 `engine.ts` 为薄封装**

按设计文档映射表实现全部导出函数；内部维护 `explicit: string | null`、`missing: Set<string>`、`registeredPluginIds: Set<string>`、`listeners`。`setLocale/resetLocale` 在 `explicit` 变化或为 null 时主动 notify。`createTranslator(locale)` 返回包装后的 `instance.getFixedT(locale)`。`getResources(locale?)` 读 `instance.services.resourceStore.data`。

- [ ] **Step 6: 运行测试确认 GREEN**

Run: `npm test -w @worm-print-platform/core -- --run src/i18n/__tests__/engine.spec.ts`
Expected: PASS。

- [ ] **Step 7: 全 core 测试与构建**

Run: `npm test -w @worm-print-platform/core -- --run && npm run build -w @worm-print-platform/core`
Expected: 全过。

- [ ] **Step 8: 提交**

```bash
git add packages/core/package.json packages/core/package-lock.json packages/core/src/i18n
git commit -m "feat(i18n): core 语言引擎切换为 i18next 薄封装"
```

---

### Task 2: 插件语言包映射到 i18next namespace

**Files:**
- Modify: `packages/core/src/i18n/engine.ts`（`registerPluginMessages`、`clearLocales`）
- Test: `packages/core/src/i18n/__tests__/engine.spec.ts`（追加用例）

**Interfaces:**
- Consumes: Task 1 的 `instance` 与 `registeredPluginIds`
- Produces: 无新导出；行为保持 `registerPluginMessages(locale, pluginId, messages)` 前缀校验。

- [ ] **Step 1: 写失败测试**

追加断言：
- `registerPluginMessages('en-US','echarts',{'echarts.kind.bar':'Bar'})` 后 `t('echarts.kind.bar') === 'Bar'`
- 前缀不符的 key 抛 `/echarts\./`
- `clearLocales()` 后插件 key 不再命中，但 `t('toolbar.save')` 仍为内置译文

- [ ] **Step 2: 运行测试确认 RED**

Run: `npm test -w @worm-print-platform/core -- --run src/i18n/__tests__/engine.spec.ts`

- [ ] **Step 3: 实现插件映射**

`registerPluginMessages`：`addResourceBundle(locale, pluginId, messages, true, true)`，把 `pluginId` 追加到 `instance.options.ns` 与 `registeredPluginIds`。`clearLocales`：遍历已注册语言 × 插件 id 调 `removeResourceBundle`，清空集合。

- [ ] **Step 4: 运行测试确认 GREEN**

Run: 同 Step 2。Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add packages/core/src/i18n
git commit -m "feat(i18n): 插件语言包映射到 i18next namespace"
```

---

### Task 3: core 泰语语义包

**Files:**
- Create: `packages/core/src/i18n/messages/th-TH.ts`、`shell-th.ts`、`expr-th.ts`
- Modify: `packages/core/src/i18n/index.ts`（导出 `thTH`）
- Modify: `packages/core/src/i18n/i18n-instance.ts`（th-TH 占位换真实包）
- Test: `packages/core/src/i18n/__tests__/locale-keys.spec.ts`（追加 th parity）

**Interfaces:**
- Consumes: `en-US.ts`、`shell-en.ts`、`expr-en.ts` 的全部键与占位符
- Produces: `thTH`（`Record<string,string>`，键集合与 zh/en 完全一致）

- [ ] **Step 1: 写失败测试**

追加断言：`thTH` 的键集合与 `enUS` 完全相等；`thTH['toolbar.save']` 非空且不等于英文值；`thTH` 中 `{v0}` 等占位符与 `enUS` 同键一致。

- [ ] **Step 2: 运行测试确认 RED**

Run: `npm test -w @worm-print-platform/core -- --run src/i18n/__tests__/locale-keys.spec.ts`

- [ ] **Step 3: 翻译并写入三个文件**

按英文包逐键 AI 直译为泰语；`th-TH.ts` 形状与 `en-US.ts` 一致（主包 + `...shellTh` + `...exprTh`）；单文件 >500 行时拆分写入。

- [ ] **Step 4: 接入实例并运行测试确认 GREEN**

把占位换为 `thTH`；Run: `npm test -w @worm-print-platform/core -- --run src/i18n/__tests__/locale-keys.spec.ts`。Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add packages/core/src/i18n
git commit -m "feat(i18n): 新增 core 泰语语义包"
```

---

### Task 4: 三方键奇偶校验脚本

**Files:**
- Modify: `packages/core/scripts/gen-locale-keys.mjs`
- Test: `packages/core/src/i18n/__tests__/locale-keys.spec.ts`

**Interfaces:**
- Consumes: Task 3 的三个泰语文件
- Produces: `npm run i18n:keys` / `npm run i18n:keys --check` 支持三语种。

- [ ] **Step 1: 扩展脚本**

`bundleFiles` 增加 `['th-TH.ts','shell-th.ts','expr-th.ts']`；`checkParity` 对 zh↔en、zh↔th 分别校验，错误信息指明哪一组缺键。`--check` 仍比对 `locale-keys.json`（由 zh 派生，内容不变）。

- [ ] **Step 2: 运行校验**

Run: `npm run i18n:keys && npm run i18n:keys --check`
Expected: 输出 `校验通过：N 个键`，无缺键报错。

- [ ] **Step 3: 提交**

```bash
git add packages/core/scripts/gen-locale-keys.mjs packages/core/src/i18n/locale-keys.json
git commit -m "chore(i18n): 语义键校验扩展到泰语"
```

---

### Task 5: canvas 泰语帮助文档

**Files:**
- Create: `packages/canvas/src/shell/help-content/th-TH/` 下 6 个文件（`getting-started.ts`、`features.ts`、`advanced-settings.ts`、`faq.ts`、`shortcuts.ts`、`changelog.ts`）
- Modify: `packages/canvas/src/shell/help-content/index.ts`
- Test: `packages/canvas/src/shell/__tests__/help-i18n.spec.ts`

**Interfaces:**
- Consumes: `en-US/` 6 个文件的章节结构与 HTML 标签
- Produces: `getHelpSections('th-TH')` 返回泰语章节，结构与 en/zh 一致。

- [ ] **Step 1: 写失败测试**

追加断言：`getHelpSections('th-TH')` 的章节 id 列表与 `getHelpSections('en-US')` 相同；首个标题与 en/zh 均不同；内容不含中文字符。

- [ ] **Step 2: 运行测试确认 RED**

Run: `npm test -w @worm-print-platform/canvas -- --run src/shell/__tests__/help-i18n.spec.ts`

- [ ] **Step 3: 翻译并写入 6 个文件**

逐文件 AI 直译为泰语；保留 HTML 标签与 class 不变；单文件 >500 行分多次写入。修改 `index.ts` 的 locale 选择加入 `th-TH` 分支。

- [ ] **Step 4: 运行测试确认 GREEN**

Run: 同 Step 2。Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add packages/canvas/src/shell/help-content packages/canvas/src/shell/__tests__/help-i18n.spec.ts
git commit -m "feat(i18n): 新增 canvas 泰语帮助文档"
```

---

### Task 6: canvas 泰语常量与属性说明

**Files:**
- Modify: `packages/canvas/src/shell/label-translation.ts`、`property-tip-translation.ts`
- Test: `packages/canvas/src/shell/__tests__/i18n-shell.spec.ts`

**Interfaces:**
- Consumes: `translateConstantLabel(label, locale)`、`localizedPropertyTip(key, lang)`
- Produces: 两函数在 `th-*` 下返回泰语。

- [ ] **Step 1: 写失败测试**

追加断言：`translateConstantLabel('无','th-TH')` 返回泰语且非空；`localizedPropertyTip('ap-rotate','th-TH')` 返回泰语、与英文值不同、与中文原文不同。

- [ ] **Step 2: 运行测试确认 RED**

Run: `npm test -w @worm-print-platform/canvas -- --run src/shell/__tests__/i18n-shell.spec.ts`

- [ ] **Step 3: 实现泰语映射**

`label-translation.ts` 新增 `SOURCE_TH` 记录中文源→泰语，`locale` 匹配 `/^th([-_]|$)/i` 时用之；`property-tip-translation.ts` 新增 `TH` 记录并同样分支。

- [ ] **Step 4: 运行测试确认 GREEN**

Run: 同 Step 2。Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add packages/canvas/src/shell/label-translation.ts packages/canvas/src/shell/property-tip-translation.ts packages/canvas/src/shell/__tests__/i18n-shell.spec.ts
git commit -m "feat(i18n): canvas 常量与属性说明支持泰语"
```

---

### Task 7: echarts 插件泰语包

**Files:**
- Create: `marketplace/plugins/echarts/src/i18n/th-TH.ts`
- Modify: `marketplace/plugins/echarts/src/ui.ts`、`src/__tests__/i18n.test.ts`

**Interfaces:**
- Consumes: `en-US.ts` 的 135 个键
- Produces: `echartsThTH`，`CHART_ELEMENT_UI.locales['th-TH']`。

- [ ] **Step 1: 写失败测试**

追加断言：`CHART_ELEMENT_UI.locales` 有 `'th-TH'`；其键集合与 `'en-US'` 相同；`setLocale('th-TH')` 后 `t(某键)` 等于泰语包值。

- [ ] **Step 2: 运行测试确认 RED**

Run: `npm test -w @worm-print-platform/plugin-echarts -- --run src/__tests__/i18n.test.ts`

- [ ] **Step 3: 翻译并接入**

逐键 AI 直译为泰语；`ui.ts` 的 `locales` 加 `'th-TH': echartsThTH`。

- [ ] **Step 4: 运行测试确认 GREEN**

Run: 同 Step 2。Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add marketplace/plugins/echarts/src
git commit -m "feat(i18n): echarts 插件新增泰语语言包"
```

---

### Task 8: demo 泰语选项

**Files:**
- Modify: `demos/apps/vue3/src/App.vue`、`vue2/src/App.vue`、`react/src/App.jsx`、`react/src/components/ConfigDialog.jsx`、`jquery/index.html`
- Modify: `demos/scripts/verify-config-dialog.mjs`（断言泰语选项存在）

**Interfaces:**
- Consumes: 现有 `langMode` / `applyDisplayConfig`
- Produces: 四个 demo 配置面板出现“泰语”单选项，值为 `th-TH`。

- [ ] **Step 1: 写失败测试**

`verify-config-dialog.mjs` 增加检查：每个 demo 的语言单选中存在 `value="th-TH"` 且标签含“泰语”。

- [ ] **Step 2: 运行验收脚本确认 RED**

Run: `node demos/scripts/verify-config-dialog.mjs`（需按脚本现有前置条件启动 demo）
Expected: FAIL（找不到 th-TH 选项）。

- [ ] **Step 3: 添加选项**

四个 demo 按各自框架写法增加单选项；`applyDisplayConfig` 逻辑不动。

- [ ] **Step 4: 运行验收脚本确认 GREEN**

Run: 同 Step 2。Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add demos
git commit -m "feat(i18n): demo 配置面板新增泰语选项"
```

---

### Task 9: bundle 导出脚本与 API

**Files:**
- Create: `scripts/export-locale-bundle.mjs`
- Modify: `package.json`（`scripts.i18n:bundle`）
- Modify: `packages/core/src/i18n/engine.ts`（`getResources` 已产出，确认 namespace 分区）
- Test: `packages/core/src/i18n/__tests__/bundle.spec.ts`（新建）

**Interfaces:**
- Consumes: Task 1 的 `getResources()`、Task 3/5/6/7 的语言资源
- Produces: `dist/i18n/resources.json` 与 `dist/i18n/resources.js`，结构 `{ locale: { core, help, constants, propertyTips, echarts } }`。

- [ ] **Step 1: 写失败测试**

新建 `bundle.spec.ts` 断言：
- `getResources('th-TH')` 含 `core` namespace 且 `core['toolbar.save']` 为泰语
- `getResources()` 含 `zh-CN`、`en-US`、`th-TH` 三个顶层键

- [ ] **Step 2: 运行测试确认 RED**

Run: `npm test -w @worm-print-platform/core -- --run src/i18n/__tests__/bundle.spec.ts`

- [ ] **Step 3: 实现导出脚本**

脚本前置要求已 `npm run build`；动态 import `core/dist/i18n/index.js` 与 `echarts` 构建产物取 resources；用与 `gen-locale-keys.mjs` 同构的正则从源码提取 `help-content/*/`、`label-translation.ts`、`property-tip-translation.ts` 的 Record 字面量；写出 JSON 与 ESM 两个文件到 `dist/i18n/`。

- [ ] **Step 4: 运行测试与导出确认 GREEN**

Run: `npm test -w @worm-print-platform/core -- --run src/i18n/__tests__/bundle.spec.ts && npm run i18n:bundle`
Expected: 测试 PASS；`dist/i18n/resources.json` 存在且顶层有 3 个 locale。

- [ ] **Step 5: 提交**

```bash
git add scripts/export-locale-bundle.mjs package.json packages/core/src/i18n/__tests__/bundle.spec.ts
git commit -m "feat(i18n): 提供 i18next resources 导出脚本"
```

---

### Task 10: 全仓验收

**Files:** 无（仅验证）

- [ ] **Step 1: 全量构建**

Run: `npm run build`
Expected: 成功。

- [ ] **Step 2: 全量测试**

Run: `npm test`
Expected: 全部通过。若 render workspace 因 Playwright 环境失败，单独记录并运行 `npm run test -w @worm-print-platform/render`。

- [ ] **Step 3: 泰语界面扫描**

在 `i18n-shell.spec.ts` 临时/永久断言：挂载 `lang='th-TH'` 的设计器，界面无中文字符（模板数据除外）。

- [ ] **Step 4: 最终提交（如有遗漏修改）**

```bash
git status --short
git add -A && git commit -m "chore(i18n): 泰语与 i18next 集成收尾"
```

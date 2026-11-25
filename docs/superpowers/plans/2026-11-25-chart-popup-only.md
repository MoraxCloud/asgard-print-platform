# 图表字段选择统一为表达式弹框 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 移除图表属性面板的字段下拉框回退，统一用表达式编辑器弹框；候选以业务字段清单 `fields` 为唯一权威；`openExpression` 成为插件 UI 契约必填项。

**Architecture:** 先在 plugin-kit 契约层把 `openExpression` 改必填并补齐调用点（类型层），再在 echarts 插件里删除回退分支、把候选改为从 `fields` 派生并在入口做缺失报错（行为层），最后重建 dist / 兼容镜像 / demo 副本。沿用上次确认的原生执行方式。

**Tech Stack:** TypeScript / Vitest / tsup，workspace `plugin-kit`、`marketplace/plugins/echarts`、`canvas`。

**Spec:** 会话中 grilling 达成的共识（2026-11-25）。

## Global Constraints

- 源码真源 `marketplace/plugins/echarts/src`；`packages/echarts` 为构建同步的兼容镜像，不直接改镜像源码。
- 中文提交信息 / PR（AGENTS.md）；UTF-8 无 BOM；单次写入不超过 500 行。
- 宿主未提供 `openExpression` 时明确报错，不静默无响应（已确认）。
- 契约必填的外溢已被用户接受：所有 `renderProperty` 实现者都接收该参数。

## Review Focus

- 宿主未注入 `fields`（空数组）：弹框候选为空，用户无法选字段——fields 唯一权威的既定取舍，不回落到 data 键。
- 历史模板里不在 `fields` 中的字段值：`fieldPicker` 的 display 用裸 key 保留，不丢失。
- 数据源「自动模式」（`chartDataSource` 为空）：清空按钮保留，候选仍来自 fields 的 list 字段。
- 候选前缀规则：绑定数据源后优先列 `fieldKey` 以 `数据源.` 开头的非 list 字段，无命中时列全部非 list 字段，避免空候选。
- 第三方插件未实现 `openExpression`：契约必填后类型检查会强制其补齐（外溢已确认）。

---

### Task 1: openExpression 改为契约必填

**Files:**
- Modify: `packages/plugin-kit/src/types.ts:53-57`
- Modify: `marketplace/plugins/echarts/src/__tests__/i18n.test.ts:126,151,177,209`
- Modify: `marketplace/plugins/echarts/src/__tests__/ui.test.ts:51-71`（helper）
- Test: `marketplace/plugins/echarts/tsconfig.json`（含测试文件，strict）

**Interfaces:**
- Consumes: `ElementUIPropertyContext`（`types.ts:37`），当前 `openExpression?: (target, onApply) => void`
- Produces: `openExpression: (target, onApply) => void`（去掉 `?`）；所有 `renderProperty` 调用点均传入

- [ ] **Step 1: 改契约并验证 RED**

在 `types.ts` 去掉 `openExpression` 的 `?` 并更新注释为「必填」。运行：
`cd marketplace/plugins/echarts && npx tsc -p tsconfig.json`
Expected: FAIL，报 5 处 `openExpression` 缺失（i18n.test.ts 4 处 + ui.test.ts helper 1 处）。

- [ ] **Step 2: 补齐所有调用点**

- `i18n.test.ts` 4 处上下文各加 `openExpression: () => {}`。
- `ui.test.ts` 的 `renderProperty` helper：保留可选形参 `openExpression?: OpenExpression`，构造上下文时传 `openExpression: openExpression ?? (() => {})`。

- [ ] **Step 3: 验证 GREEN**

Run: `cd marketplace/plugins/echarts && npx tsc -p tsconfig.json` 然后 `npx vitest run`
Expected: 类型检查 0 错误；全量测试 116/116 通过（行为未变）。

---

### Task 2: 移除回退分支、候选改为 fields 权威

**Files:**
- Modify: `marketplace/plugins/echarts/src/ui.ts:176-234, 243-270, 399-430, 678-812`
- Test: `marketplace/plugins/echarts/src/__tests__/ui.test.ts:287-421`

**Interfaces:**
- Consumes: Task 1 的必填 `ctx.openExpression`；`ctx.fields?: readonly PrintBusinessField[]`
- Produces: 无下拉框分支；候选仅来自 `ctx.fields`；宿主缺 API 时 `renderPropertyInner` 抛错

- [ ] **Step 1: 写失败测试**

在 `ui.test.ts` 的 `describe('数据源/字段下拉选择')` 内：
- 删除下拉框断言测试：「数据源是下拉，候选来自示例数据的数组键」「类目/数值字段是下拉…」「绑定的数据源不在示例数据里时…」「示例数据缺数据源时…」「业务列表字段存在时以 fields 为权威…」「不在候选里的已有值保留为选项」「业务字段有中文名时…」「选中选项后写回并把面板收起」。
- 改写保留「图表绑定字段通过字段表达式弹框选择并回写原始 key」：`fields` 扩为 4 项——`goodsDetails`(list)、`name`、`value`、`region`(非 list)；断言 `requests[0].target.fields` 为 `['goodsDetails']`，`requests[1..3].target.fields` 为 `['name','value','region']`。
- 新增「候选不混入 demo 数据键」：传 `data:[{ goods:[{ name:'demo' }] }]`、`fields:[{fieldKey:'goodsDetails',fieldType:'list'...}]`，点第一个 picker，断言弹框候选不含 `goods`。
- 新增「宿主缺 openExpression 时抛错」：直接 `ui.renderProperty!({ element, data, fields, update, repaint } as any)`，断言 `toThrow(/openExpression/)`。
- 新增「历史值不在 fields 时仍显示裸 key」：`options.chartDataSource='legacySource'`、fields 为空，断言 `.echarts-field-current` 文本为 `legacySource`。
- 新增「绑定数据源后行字段优先取带前缀的字段」：`chartDataSource='goods'`、fields 含 `goods.name`、`other.name`，点第二个 picker，断言候选只含 `goods.name` 不含 `other.name`。
- 保留「数据源保留自动模式」（仍传 `() => {}` 作 openExpression）。

- [ ] **Step 2: 运行确认 RED**

Run: `cd marketplace/plugins/echarts && npx vitest run src/__tests__/ui.test.ts`
Expected: FAIL（旧代码无报错逻辑、候选含 demo 键）。

- [ ] **Step 3: 修改 ui.ts**

- 删除 `dataSourceCandidates`、`dataRowFields`、`dropdownOptions`、`dropdownSelect` 四个函数。
- `renderPropertyInner` 入口加守卫：`if (!ctx.openExpression) throw new Error('[echarts] 图表属性面板需要宿主提供 openExpression')`。
- 候选改为（确切规则）：
  ```
  const allFields = ctx.fields ?? []
  const sourceFields = allFields.filter(f => f.fieldType === 'list')
  const bound = String(options.chartDataSource ?? '')
  const prefixed = bound ? allFields.filter(f => f.fieldKey.startsWith(`${bound}.`)) : []
  const rowFields = prefixed.length > 0 ? prefixed : allFields.filter(f => f.fieldType !== 'list')
  ```
- 数据源 / 类目 / 值字段 / 系列字段四处删掉 `if (ctx.openExpression) … else …`，无条件用 `fieldPicker`；`fieldPicker` 内 `ctx.openExpression?.()` 改为 `ctx.openExpression()`。
- `optionLabel` / `fieldLabelMap` 保留（`fieldPicker` 显示用）；`allowAuto` 清空按钮保留。

- [ ] **Step 4: 验证 GREEN**

Run: `cd marketplace/plugins/echarts && npx tsc -p tsconfig.json && npx vitest run`
Expected: 类型检查 0 错误；全量测试通过（数量随删除/新增测试变化）。

---

### Task 3: 同步产物与最终验证

**Files:**
- Modify: `marketplace/plugins/echarts/dist/*`（构建生成）
- Modify: `packages/echarts/dist/*`、`demos/apps/vue3/.worm-print/plugins/echarts/dist/marketplace.js`
- Test: 插件全量 + canvas 宿主链路

**Interfaces:**
- Consumes: Task 1/2 的源码改动
- Produces: 与源码一致的 dist / 兼容镜像 / demo 副本

- [ ] **Step 1: 重建并同步**

Run: `cd marketplace/plugins/echarts && npm run build`，然后把 `dist/marketplace.js` 复制到 `demos/apps/vue3/.worm-print/plugins/echarts/dist/marketplace.js`。
Expected: build 成功；`grep -rn 'echarts-dropdown-trigger' dist` 无结果；dist 与兼容镜像一致。

- [ ] **Step 2: 全量验证**

Run: `npx vitest run`（插件）与 `cd packages/canvas && npx vitest run src/__tests__/plugin-chart-like.spec.ts`
Expected: 全部通过。

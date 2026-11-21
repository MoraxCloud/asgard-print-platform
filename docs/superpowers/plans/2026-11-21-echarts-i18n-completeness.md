# 图表插件多语言完善（方案 A）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修掉图表插件界面上所有"能看到却没翻译"的硬编码中文（标签预设/位置、图表种类 label 与 notes），不动会写进模板数据的出图内容。

**Architecture:** 常量数组保留中文 `label` 源字段（向后兼容公共 API），新增 `labelKey`/`notesKey` 存语言包键；UI 与插件注册表渲染时经 `t(key)` 按实例语言取词。语言包新增 10 个 notes 键（k146~k155），三语种补齐。

**Tech Stack:** TypeScript、i18next（经 core 的 `t()`）、vitest。

**Spec:** `docs/superpowers/specs/2026-11-21-echarts-i18n-completeness-design.md`

## Global Constraints

- 语言包三语种（zh-CN/en-US/th-TH）键集合必须 parity 一致，从 135 增至 145 键。
- `echarts.label.k104~k139` 共 36 键已存在且与 LABEL_PRESETS(4)+LABEL_POSITIONS(32) 按顺序一一对应，不改这些键的值。
- 新增 notes 键命名 `echarts.notes.k146~k155`，对应 CHART_KIND_DEFINITIONS 的十个 kind（按数组顺序）。
- 常量保留 `label: string`（中文源）字段以兼容 `kit.ts` 公共导出与既有测试；翻译只发生在渲染/注册时。
- `value`/`formatter`/`name:'数量'` 等写入 option 的数据语义保持不变。
- 单次写入 ≤500 行；UTF-8 无 BOM；提交信息中文。

## Review Focus

1. **切英文/泰语后下拉选项仍是中文** → Task 1 测试 `LABEL_PRESETS`/`LABEL_POSITIONS` 的 labelKey 经 t() 返回对应语言。
2. **模块加载期取值导致语言冻结** → Task 1/2 测试在 setLocale 切换后**再次渲染**取到新语言（而非模块加载时的语言）。
3. **插件注册表 notes 仍中文** → Task 3 测试 CHART_PLUGIN.kinds[].notes 随 locale 切换。
4. **公共 API 破坏** → Task 1 测试保留 label 字段；kit.ts 导出类型不变。
5. **语言包缺键回退** → Task 4 parity 校验 + notes 三语种齐全。

---

### Task 1: 标签预设与位置选项接入翻译

**Files:**
- Modify: `marketplace/plugins/echarts/src/label.ts`（LABEL_PRESETS / LABEL_POSITIONS 加 `labelKey`）
- Modify: `marketplace/plugins/echarts/src/ui.ts`（渲染点经 `t(labelKey)`）
- Test: `marketplace/plugins/echarts/src/__tests__/i18n.test.ts`（追加用例）

**Interfaces:**
- Consumes: `t()`（core i18n）、`LABEL_PRESETS`（4 项）、`LABEL_POSITIONS`（按 seriesType 共 32 项）、`echarts.label.k104~k139`
- Produces: 常量项新增 `labelKey: string` 字段，`label` 中文源保留。

- [ ] **Step 1: 写失败测试**

在 `i18n.test.ts` 追加：
```
it('标签预设与位置选项按语言取词', () => {
  setLocale('en-US')
  expect(t(LABEL_PRESETS[0]!.labelKey!)).toBe('Value')
  expect(t(LABEL_POSITIONS.bar[0]!.labelKey!)).toBe('Top')
  setLocale('th-TH')
  expect(t(LABEL_PRESETS[0]!.labelKey!)).not.toBe('数值')
  setLocale('zh-CN')
  expect(t(LABEL_PRESETS[0]!.labelKey!)).toBe('数值')
})
it('常量保留中文 label 源字段', () => {
  expect(LABEL_PRESETS[0]!.label).toBe('数值')
  expect(LABEL_POSITIONS.bar[0]!.label).toBe('顶部')
})
```

- [ ] **Step 2: 运行测试确认 RED**

Run: `npm test -w @worm-print-platform/plugin-echarts -- --run src/__tests__/i18n.test.ts`
Expected: FAIL（labelKey 不存在）。

- [ ] **Step 3: 给常量加 labelKey**

按 x104~k139 顺序给每项加 `labelKey`（LABEL_PRESETS 4 项 k104~k107；LABEL_POSITIONS 按 bar/line/pie/scatter/radar/funnel 顺序分别 k108~k115 / k116~k120 / k121~k123 / k124~k128 / k129~k133 / k134~k139）。保留 `label` 中文字段。

- [ ] **Step 4: 改 ui.ts 渲染点**

`ui.ts:497` 的 `preset.label` → `t(preset.labelKey!)`；`ui.ts:520` 的 positions 需 map 成 `{ value, label: t(labelKey) }`。

- [ ] **Step 5: 运行测试确认 GREEN**

Run: 同 Step 2。Expected: PASS。

- [ ] **Step 6: 提交**

```bash
git add marketplace/plugins/echarts/src/label.ts marketplace/plugins/echarts/src/ui.ts marketplace/plugins/echarts/src/__tests__/i18n.test.ts
git commit -m "feat(i18n): 图表标签预设与位置选项接入多语言"
```

---

### Task 2: 图表种类 label 走 labelKey

**Files:**
- Modify: `marketplace/plugins/echarts/src/plugin.ts`（kinds map 的 label）
- Test: `marketplace/plugins/echarts/src/__tests__/i18n.test.ts`

**Interfaces:**
- Consumes: `CHART_KIND_DEFINITIONS`（每项有 labelKey）、`t()`
- Produces: `CHART_PLUGIN.kinds[i].label` 随 locale 变化。

- [ ] **Step 1: 写失败测试**

```
it('图表种类 label 随 locale 切换', () => {
  setLocale('zh-CN'); expect(CHART_PLUGIN.kinds[0]!.label).toBe('柱状图')
  setLocale('en-US'); expect(CHART_PLUGIN.kinds[0]!.label).toBe('Bar chart')
  setLocale('zh-CN')
})
```
（注意：CHART_PLUGIN 是模块级常量对象，需测试其 kinds label 是否在注册时求值——若在模块加载期求值则会冻结，需改为 getter 或安装时重算；按实际实现选择最小改动。）

- [ ] **Step 2: 运行测试确认 RED** — Run: `npm test -w @worm-print-platform/plugin-echarts -- --run src/__tests__/i18n.test.ts`

- [ ] **Step 3: 修复 label 取值时机**

`plugin.ts` 的 `CHART_PLUGIN.kinds` 用 `t(def.labelKey)` 而非 `def.label`。若模块加载期求值导致冻结，改为 `registerChartPlugin`/`installChartCommonUI` 时重算 kinds（或定义 getter），以测试通过为准。

- [ ] **Step 4: 运行测试确认 GREEN** — Run: 同 Step 2。Expected: PASS。

- [ ] **Step 5: 提交** — `git commit -m "feat(i18n): 图表种类 label 按实例语言取词"`

---

### Task 3: notes 新增三语种键并接入

**Files:**
- Modify: `marketplace/plugins/echarts/src/i18n/zh-CN.ts`、`en-US.ts`、`th-TH.ts`（各加 10 键 k146~k155）
- Modify: `marketplace/plugins/echarts/src/kinds.ts`（notes → 保留 notes 中文源，新增 notesKey）
- Modify: `marketplace/plugins/echarts/src/plugin.ts`（kinds map 的 notes 走 t(notesKey)）
- Test: `marketplace/plugins/echarts/src/__tests__/i18n.test.ts`、`kinds.test.ts`

**Interfaces:**
- Consumes: CHART_KIND_DEFINITIONS 的 10 段 notes 中文源
- Produces: 10 个三语种 notes 键；`CHART_PLUGIN.kinds[i].notes` 随 locale 变化。

- [ ] **Step 1: 写失败测试**

```
it('notes 三语种齐全且随 locale 切换', () => {
  for (const loc of ['zh-CN','en-US','th-TH']) {
    setLocale(loc)
    expect(CHART_PLUGIN.kinds.every(k => k.notes.length > 0 && !/^echarts\./.test(k.notes))).toBe(true)
  }
  setLocale('en-US'); const en = CHART_PLUGIN.kinds[0]!.notes
  setLocale('zh-CN'); const zh = CHART_PLUGIN.kinds[0]!.notes
  expect(en).not.toBe(zh)
  setLocale('zh-CN')
})
```

- [ ] **Step 2: 运行测试确认 RED** — Run: `npm test -w @worm-print-platform/plugin-echarts -- --run src/__tests__/i18n.test.ts`

- [ ] **Step 3: 加 notes 键与 notesKey**

三语种各加 `'echarts.notes.k146'~'k155'`，值为对应语言的十段 notes（AI 直译，保留 `$data`、`series`、`xAxis` 等技术符号）。kinds.ts 每项加 `notesKey: 'echarts.notes.kNNN'`（保留 `notes` 中文源）。

- [ ] **Step 4: plugin.ts notes 走 t(notesKey)**

与 Task 2 同样的取值时机处理（避免模块加载期冻结）。

- [ ] **Step 5: 运行测试确认 GREEN** — Run: 同 Step 2。Expected: PASS。

- [ ] **Step 6: 提交** — `git commit -m "feat(i18n): 图表 notes 新增三语种并接入翻译"`

---

### Task 4: parity 校验与全量验收

**Files:**
- Modify: `marketplace/plugins/echarts/src/__tests__/i18n.test.ts`（键数量断言 135→145）

**Interfaces:**
- Consumes: Task 1~3 产出
- Produces: 无

- [ ] **Step 1: 更新 parity 测试**

把键集合断言从 135 改为 145（或改为"三语种键集合相等且 notes/label 键齐全"，更稳健）。

- [ ] **Step 2: 运行插件全测试**

Run: `npm test -w @worm-print-platform/plugin-echarts -- --run`
Expected: 全过。

- [ ] **Step 3: 重新生成 bundle 与全量验证**

Run: `npm run build && npm run i18n:bundle && npm test`
Expected: build 成功、bundle 导出三语种、全仓测试全绿。

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "chore(i18n): 图表插件多语言完善收尾"
```

# 百度图表插件数据标签 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在图表插件属性面板中新增「数据标签」分组，覆盖 ECharts `series.label` 的 20 项常用配置，并保证存量模板渲染零变化。

**Architecture:** 标签配置直接写入 `chartOption.series[].label`（仪表盘写 `series[0].detail`），由新增的纯 TS 模块 `src/label.ts` 统一读写、多 series 同步与默认集写入；面板在 `src/ui.ts` 手写一份可折叠分组；`src/bind.ts` 对 `label`/`detail` 子树豁免表达式求值，避免 `{value}` 被业务数据改写。

**Tech Stack:** TypeScript、ECharts 6.1.0（SSR SVG）、plugin-kit（`ElementUI`）、vitest + happy-dom、四个独立宿主 demo。

**Spec:** `docs/superpowers/specs/2026-11-18-echarts-data-label-design.md`

## Global Constraints

- 语言：代码注释、提交信息、文档一律简体中文；文件 UTF-8 无 BOM。
- 不新增顶层选项键：不引入 `chartLabel`，不修改 `packages/contract` 与 `src/plugin.ts` 的 `optionMeta` 键集合。
- 默认零影响：用户未打开总开关时，`chartOption` 中不得出现 `label` / `detail` 键。
- 默认集只补缺失键：用户已有的 `formatter` / 颜色 / 字号在重开开关时不得被覆盖。
- 关闭总开关只写 `show: false`，保留其余配置。
- 颜色字段用文本框（`#rgb` / `#rrggbb` / 颜色名），空值删除该键；不使用 `<input type="color">`。
- 排除项：`rich`、`emphasis.label`、`labelLayout`、单数据点覆盖。
- 版本：`plugin-echarts` 1.0.0 → 1.1.0，`packages/echarts` 1.5.3 → 1.6.0；本次不执行 `npm publish`。
- 构建必须走完整 `npm run build -w @worm-print-platform/echarts`（内部先删 `packages/echarts/dist` 再全量复制）。

## Review Focus

- 存量模板（`health-report`）在未写标签时渲染结果与改动前逐字一致——用 Task 1 Preflight 记录的 `/tmp/echarts-baseline.json` 在 Task 4 Step 5 做 diff。
- 多值多系列（2 个以上 `chartValueFields`）改一次字号，所有 series 的标签同步，不出现只有第一根柱子有标签。
- 手写 `label: { formatter: '{value} 元' }` 时 `{value}` 不被业务数据替换；同一 option 里 `title.text` 的 `{value}` 仍照常求值。
- 饼图 60×60mm 打开标签后 SSR 必须出现 `<text>`（默认 `truncate` 会吃光），`overflow: 'none'` 要真的写进 option。
- 仪表盘只写 `detail`，不得出现空的 `series[0].label`；关闭开关后 `detail.show === false`，数值文本消失但刻度保留。

---

### Task 1: 标签读写层与 formatter 豁免

**Files:**
- Create: `marketplace/plugins/echarts/src/label.ts`
- Modify: `marketplace/plugins/echarts/src/kinds.ts:3-6`（`ChartFieldKey` 追加 `'label'`），`:28-89`（十类 `fields` 追加 `'label'`）
- Modify: `marketplace/plugins/echarts/src/bind.ts:11-25`（豁免 `label` / `detail` 子树）
- Modify: `marketplace/plugins/echarts/src/kit.ts`（导出 label 模块）
- Create: `marketplace/plugins/echarts/src/__tests__/label.test.ts`
- Modify: `marketplace/plugins/echarts/src/__tests__/plugin-binding.test.ts`
- Modify: `marketplace/plugins/echarts/src/__tests__/kinds.test.ts`
- Modify: `marketplace/plugins/echarts/src/__tests__/renderer.test.ts`

**Interfaces:**
- Consumes: `getChartKindDefinition(type)`（`./kinds.js`）、`cloneChartOption(value)`（`./option-utils.js`）。
- Produces:

```ts
export type LabelFieldKey =
  | 'formatter' | 'overflow' | 'position' | 'distance' | 'rotate'
  | 'offsetX' | 'offsetY' | 'fontSize' | 'fontWeight' | 'color'
  | 'backgroundColor' | 'borderColor' | 'borderWidth' | 'borderRadius' | 'padding'
  | 'labelLine.show' | 'labelLine.length' | 'labelLine.length2' | 'labelLine.smooth'

export interface ChartLabelState {
  show: boolean
  formatter?: string
  overflow?: string
  position?: string
  distance?: number
  rotate?: number
  offsetX?: number
  offsetY?: number
  fontSize?: number
  fontWeight?: string
  color?: string
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  borderRadius?: number
  padding?: number
  labelLine: { show?: boolean; length?: number; length2?: number; smooth?: boolean }
}

export interface ChartLabelPatch extends Partial<Omit<ChartLabelState, 'labelLine'>> {
  enabled?: boolean
  labelLine?: { show?: boolean; length?: number | null; length2?: number | null; smooth?: boolean }
}

export function labelTargetOf(type: string): 'label' | 'detail'
export function labelFieldsOf(type: string): readonly LabelFieldKey[]
export function readChartLabel(option: Record<string, unknown> | undefined, type: string): ChartLabelState
export function updateChartLabel(
  option: Record<string, unknown> | undefined,
  type: string,
  patch: ChartLabelPatch,
): Record<string, unknown>
export const LABEL_PRESETS: readonly { key: string; label: string; formatter: string }[]
export const LABEL_POSITIONS: Readonly<Record<string, readonly { value: string; label: string }[]>>
```

- `readChartLabel` 的 `show` 缺省按 ECharts 原生默认：`pie` / `funnel` / `gauge` 为 `true`，其余为 `false`；`gauge` 读 `series[0].detail`，其余读 `series[0].label`。
- `updateChartLabel` 的算法：
  1. `cloneChartOption(option ?? {})`；`series` 非数组或为空 → 原样返回，不制造 series。
  2. `patch.enabled === true`：对每个 series 的 target 对象写 `{ ...默认集, ...已有 }`，并强制 `show: true`（已有值优先，`formatter` 缺失不写）。
  3. `patch.enabled === false`：只写 `target.show = false`。
  4. 其余键逐个写入所有 series 的 target；值为 `null`、`undefined` 或空字符串时 `delete target[key]`；`labelLine` 与已有对象浅合并。
- 默认集（`enabled: true` 时）：见 spec 第六节，按 `seriesType` 取，仪表盘为 `{ show: true, fontSize: 14 }`。
- `show` 是分组首项（总开关），单独渲染，不进入 `labelFieldsOf` 的返回列表。

**Preflight（Task 1 第一步之前执行一次，用于 Task 4 的零影响比对）：**

```bash
npm run build -w @worm-print-platform/echarts
node -e "
const { createDefaultChartOption, renderChartToSvg, CHART_KINDS } = require('./packages/echarts/dist/kit.js')
const out = {}
for (const type of CHART_KINDS) out[type] = renderChartToSvg({ key: type, type, option: createDefaultChartOption(type), widthMm: 80, heightMm: 60 })
console.log(JSON.stringify(out))
" > /tmp/echarts-baseline.json
```

Expected: `/tmp/echarts-baseline.json` 非空，含 10 个键。

- [ ] **Step 1: 写失败测试 `label.test.ts`**

至少 11 个用例，断言全部用 `toEqual` 精确比对：

```ts
import { describe, expect, it } from 'vitest'
import { labelFieldsOf, labelTargetOf, readChartLabel, updateChartLabel } from '../label.js'
import { createDefaultChartOption } from '../defaults.js'

const bar = (extra: Record<string, unknown> = {}) => ({
  series: [{ type: 'bar', data: ['$data'], ...extra }],
})

it('未写标签时 show 跟随 ECharts 原生默认', () => {
  expect(readChartLabel(undefined, 'barChart').show).toBe(false)
  expect(readChartLabel(undefined, 'pieChart').show).toBe(true)
  expect(readChartLabel(undefined, 'gaugeChart').show).toBe(true)
})
it('直角系默认集写 position top / fontSize 12', () => {
  const next = updateChartLabel(bar(), 'barChart', { enabled: true })
  expect((next.series as any[])[0].label).toEqual({ show: true, position: 'top', fontSize: 12 })
})
it('饼图默认集写 outside / overflow none', () => {
  const next = updateChartLabel(createDefaultChartOption('pieChart'), 'pieChart', { enabled: true })
  expect((next.series as any[])[0].label).toEqual({ show: true, position: 'outside', overflow: 'none', fontSize: 11 })
})
it('仪表盘只写 detail，不产生 label', () => {
  const next = updateChartLabel(createDefaultChartOption('gaugeChart'), 'gaugeChart', { enabled: true })
  expect((next.series as any[])[0].detail).toEqual({ show: true, fontSize: 14 })
  expect((next.series as any[])[0].label).toBeUndefined()
  expect(labelTargetOf('gaugeChart')).toBe('detail')
})
it('多 series 同步写同一份标签', () => {
  const next = updateChartLabel({ series: [{ type: 'bar' }, { type: 'bar' }] }, 'barChart', { fontSize: 14 })
  expect((next.series as any[]).map(s => s.label.fontSize)).toEqual([14, 14])
})
it('关闭只写 show:false 并保留其余配置', () => {
  const next = updateChartLabel(bar({ label: { show: true, fontSize: 16, color: '#f00' } }), 'barChart', { enabled: false })
  expect((next.series as any[])[0].label).toEqual({ show: false, fontSize: 16, color: '#f00' })
})
it('重开不覆盖已有 formatter', () => {
  const next = updateChartLabel(bar({ label: { show: false, formatter: '{b}: {c}' } }), 'barChart', { enabled: true })
  expect((next.series as any[])[0].label.formatter).toBe('{b}: {c}')
})
it('labelLine 局部更新保留其他键', () => {
  const next = updateChartLabel(
    { series: [{ type: 'pie', labelLine: { show: true, length: 20 } }] },
    'pieChart',
    { labelLine: { length: 8 } },
  )
  expect((next.series as any[])[0].labelLine).toEqual({ show: true, length: 8 })
})
it('空字符串与 null 删除键', () => {
  const next = updateChartLabel(bar({ label: { show: true, color: '#f00', formatter: '{c}' } }), 'barChart', { color: '', formatter: null })
  expect((next.series as any[])[0].label).toEqual({ show: true })
})
it('未知 kind 原样返回且不修改入参', () => {
  const source = bar({ label: { show: true } })
  const snapshot = JSON.parse(JSON.stringify(source))
  const next = updateChartLabel(source, 'nopeChart', { enabled: false })
  expect(next.series).toEqual(snapshot.series)
  expect(source).toEqual(snapshot)
})
it('labelFieldsOf 按分档返回', () => {
  expect(labelFieldsOf('barChart')).not.toContain('labelLine.show')
  expect(labelFieldsOf('pieChart')).toContain('labelLine.length2')
  expect(labelFieldsOf('funnelChart')).not.toContain('labelLine.length2')
  expect(labelFieldsOf('radarChart')).toEqual(['formatter', 'fontSize', 'fontWeight', 'color'])
  expect(labelFieldsOf('gaugeChart')).toEqual(['formatter', 'fontSize', 'fontWeight', 'color', 'offsetX', 'offsetY'])
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -w @worm-print-platform/plugin-echarts -- label.test`
Expected: FAIL，`Failed to resolve import "../label.js"`。

- [ ] **Step 3: 实现 `label.ts` 与 kinds/kit 接线**

按 Interfaces 实现；`labelFieldsOf` 用 `getChartKindDefinition(type)?.seriesType` 分档（表见 spec 第五节），未知 kind 返回 `[]`。`kinds.ts` 的 `ChartFieldKey` 增加 `'label'`，十类 `fields` 末尾追加 `'label'`。`kit.ts` 导出 `label.js` 的全部公开符号与类型。

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test -w @worm-print-platform/plugin-echarts -- label.test kinds.test`
Expected: PASS（含既有 kinds 用例）。

- [ ] **Step 5: 补 formatter 豁免测试**

在 `plugin-binding.test.ts` 追加：

```ts
it('label 与 detail 的 formatter 不被数据表达式求值', () => {
  const options = {
    chartOption: {
      title: { text: '{value} 元' },
      series: [{ type: 'bar', data: ['$data'], label: { show: true, formatter: '{value} 元' } }],
    },
    chartValueFields: ['value'],
    chartCategoryField: 'name',
  }
  const patch = bindChartData('barChart', options, { name: '华东', value: 12 })
  const series = (patch._chartOption as any).series
  expect(series[0].label.formatter).toBe('{value} 元')
  expect((patch._chartOption as any).title.text).toBe('12 元')
})
```

- [ ] **Step 6: 跑测试确认失败**

Run: `npm test -w @worm-print-platform/plugin-echarts -- plugin-binding`
Expected: FAIL，`formatter` 实际为 `'12 元'`。

- [ ] **Step 7: 修改 `bind.ts` 的 `evaluateChartOption`**

加第三参 `keepStrings = false`；对象遍历时 `const childKeep = keepStrings || key === 'label' || key === 'detail'`；字符串分支在 `keepStrings` 为真时直接返回原值（仍保留 `$data` 判断）。递归时透传 `childKeep`。

- [ ] **Step 8: 跑测试确认通过**

Run: `npm test -w @worm-print-platform/plugin-echarts -- plugin-binding`
Expected: PASS，且既有「手写真实数据不被覆盖」用例仍绿。

- [ ] **Step 9: 补 SSR 文本断言**

在 `renderer.test.ts` 追加：

```ts
it('饼图开启标签后 SSR 产出文本节点', () => {
  const svg = renderChartToSvg({
    key: 'label-pie',
    type: 'pieChart',
    option: { series: [{ type: 'pie', data: [{ name: '甲', value: 3 }], label: { show: true, overflow: 'none' } }] },
    widthMm: 60,
    heightMm: 60,
  })
  expect(svg).toContain('<text')
  expect(svg).toContain('甲')
})
```

- [ ] **Step 10: 跑测试确认通过**

Run: `npm test -w @worm-print-platform/plugin-echarts -- renderer`
Expected: PASS。

- [ ] **Step 11: 全量插件测试并提交**

Run: `npm test -w @worm-print-platform/plugin-echarts`
Expected: 全部绿。

```bash
git add marketplace/plugins/echarts/src/label.ts marketplace/plugins/echarts/src/kinds.ts \
  marketplace/plugins/echarts/src/bind.ts marketplace/plugins/echarts/src/kit.ts \
  marketplace/plugins/echarts/src/__tests__/label.test.ts \
  marketplace/plugins/echarts/src/__tests__/plugin-binding.test.ts \
  marketplace/plugins/echarts/src/__tests__/kinds.test.ts \
  marketplace/plugins/echarts/src/__tests__/renderer.test.ts
git commit -m "feat(echarts): 新增数据标签读写层并对 label formatter 豁免表达式求值"
```

---

### Task 2: 属性面板「数据标签」分组

**Files:**
- Modify: `marketplace/plugins/echarts/src/ui.ts:40-57`（STYLES / SEARCH_KEYWORDS）、`:226-475`（新增 label 分组分支）、新增 `renderLabelGroup`
- Modify: `marketplace/plugins/echarts/src/__tests__/ui.test.ts`

**Interfaces:**
- Consumes: Task 1 的 `readChartLabel` / `updateChartLabel` / `labelFieldsOf` / `LABEL_PRESETS` / `LABEL_POSITIONS`，以及 `commitOption(ctx, type, next)`（`ui.ts:94-101`）。
- Produces: `renderLabelGroup(ctx: ElementUIPropertyContext, type: string): HTMLDetailsElement`（模块内函数，不导出）。

- 分组外壳：`<details class="echarts-label-group">` + `<summary>数据标签</summary>`，追加到 `form`，位置在「配色」之后、「堆叠显示」之前。
- 总开关：`checkboxField('显示数据标签', state.show, checked => commitOption(ctx, type, updateChartLabel(panelOption(element), type, { enabled: checked })))`。
- 子块按 `labelFieldsOf(type)` 过滤，字段文案：内容（数据标签内容 / 溢出处理）、位置（标签位置 / 距离 / 旋转 / 水平偏移 / 垂直偏移）、样式（字号 / 字重 / 文字颜色 / 背景色 / 边框色 / 边框宽度 / 圆角 / 内边距）、引导线（显示引导线 / 引导线长度 / 第二段长度 / 平滑引导线）。
- `formatter` 控件：`<select class="pd-select">` 预设（`LABEL_PRESETS`）+ `<input class="pd-input" placeholder="如 {b}: {c}">`；两者写同一键，空串删除。
- `position` 控件：`<select>`，选项来自 `LABEL_POSITIONS[seriesType]`，首项为「默认（ECharts）」对应空值。
- 数字控件：`textInput({ type: 'number' })`，空串删除键。
- `STYLES` 追加：`.echarts-label-group{margin-top:8px;border-top:1px solid var(--pd-border,#e5e7eb);padding-top:8px}`、`.echarts-label-group>summary{cursor:pointer;font-weight:600;font-size:12px;list-style:none}`、`.echarts-label-sub{font-size:11px;color:var(--pd-text-secondary,#6b7280);margin:8px 0 4px}`。
- `SEARCH_KEYWORDS` 追加 `'数据标签'`、`'label'`、`'数值标签'`。

- [ ] **Step 1: 写失败测试（`ui.test.ts`）**

```ts
it('柱状图面板出现数据标签分组与总开关', () => {
  const { root } = renderProperty('barChart')
  expect(root.querySelector('.echarts-label-group')).not.toBeNull()
  expect(labelsOf(root)).toContain('显示数据标签')
})
it('饼图面板含引导线，柱状图不含', () => {
  expect(labelsOf(renderProperty('pieChart').root)).toContain('显示引导线')
  expect(labelsOf(renderProperty('barChart').root)).not.toContain('显示引导线')
})
it('仪表盘不出现「标签位置」', () => {
  expect(labelsOf(renderProperty('gaugeChart').root)).not.toContain('标签位置')
})
it('打开总开关写默认集且只提交一次', () => {
  const { root, updates } = renderProperty('barChart', { chartOption: createDefaultChartOption('barChart') })
  const wrap = [...root.querySelectorAll('.pd-field')].find(
    item => item.querySelector('.pd-label')?.textContent?.trim() === '显示数据标签',
  )!
  const box = wrap.querySelector('input[type="checkbox"]') as HTMLInputElement
  box.checked = true
  box.dispatchEvent(new Event('change'))
  expect(updates).toHaveLength(1)
  expect(((updates[0]!.chartOption as any).series[0].label)).toEqual({ show: true, position: 'top', fontSize: 12 })
})
it('选择 formatter 预设写入模板字符串', () => {
  const { root, updates } = renderProperty('barChart', { chartOption: createDefaultChartOption('barChart') })
  const select = [...root.querySelectorAll('select.pd-select')].find(node =>
    [...node.options].some(o => o.textContent === '名称: 数值')) as HTMLSelectElement
  select.value = '{b}: {c}'
  select.dispatchEvent(new Event('change'))
  expect(((updates[0]!.chartOption as any).series[0].label.formatter)).toBe('{b}: {c}')
})
it('颜色留空删除该键', () => {
  const option = createDefaultChartOption('barChart')
  ;(option.series as any[])[0].label = { show: true, color: '#ff0000' }
  const { root, updates } = renderProperty('barChart', { chartOption: option })
  const input = fieldInput(root, '文字颜色')!
  input.value = ''
  input.dispatchEvent(new Event('change'))
  expect(((updates[0]!.chartOption as any).series[0].label.color)).toBeUndefined()
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -w @worm-print-platform/plugin-echarts -- ui.test`
Expected: FAIL，`.echarts-label-group` 为 null。

- [ ] **Step 3: 实现 `renderLabelGroup` 并接入 `renderProperty`**

按 Interfaces 实现；`has('label')` 为假时不渲染分组（保证未知 kind 与旧行为一致）。所有写回走 `commitOption`，一次 `change` 只产生一次 `update`。

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test -w @worm-print-platform/plugin-echarts -- ui.test`
Expected: PASS，既有面板用例全绿。

- [ ] **Step 5: 提交**

```bash
git add marketplace/plugins/echarts/src/ui.ts marketplace/plugins/echarts/src/__tests__/ui.test.ts
git commit -m "feat(echarts): 属性面板新增数据标签分组与 formatter 预设"
```

---

### Task 3: 示例模板与文档

**Files:**
- Modify: `demos/apps/vue3/src/templates.js`（`SAMPLES` 末尾新增一条）
- Modify: `demos/scripts/verify-business-scenarios.mjs:87-125`（`previewOnce` 增 `chartSvgText`）、`:160-215`（新增场景断言）
- Modify: `marketplace/plugins/echarts/README.md`（新增「数据标签」章节）

**Interfaces:**
- Consumes: Task 1 的 `label` 语义（`chartOption.series[].label`）；Task 3 的示例 id `chart-label-demo`。
- Produces: 四宿主一致的示例模板；`previewOnce()` 返回值新增字段 `chartSvgText: string`（所有 `data:image/svg` 图片解码后的文本拼接）。

- 示例条目关键值（四宿主同源，通过 `npm run samples:demos` 同步）：

```js
{
  id: 'chart-label-demo',
  name: '数据标签示例',
  group: '图表',
  desc: '柱状图与饼图开启数据标签：演示 formatter 模板、字号与标签位置。',
  paper: 'A5 横向',
  fields: [
    { id: 'cl-1', fieldKey: 'sales', fieldLabel: '销售数据', fieldType: 'list', sortOrder: 1 },
    { id: 'cl-2', fieldKey: 'sales.name', fieldLabel: '区域', fieldType: 'string', sortOrder: 2 },
    { id: 'cl-3', fieldKey: 'sales.value', fieldLabel: '数量', fieldType: 'number', sortOrder: 3 },
  ],
  data: { sales: [{ name: '华东', value: 12 }, { name: '华南', value: 20 }, { name: '华北', value: 15 }] },
  template: {
    version: 1,
    plugins: [{ id: '@worm-print-platform/echarts', version: '2' }],
    pages: [{
      paperSize: 'A5', orientation: 'landscape',
      elements: [
        { id: 'cl-bar', type: 'barChart', printElementType: { type: 'barChart', title: '柱状图' }, options: {
          left: 5, top: 10, width: 110, height: 70,
          chartOption: {
            grid: { left: '8%', right: '8%', bottom: '12%', top: '18%', containLabel: true },
            xAxis: { type: 'category', data: ['$data'] },
            yAxis: { type: 'value' },
            series: [{ type: 'bar', name: '数量', data: ['$data'], label: { show: true, position: 'top', formatter: '{b}: {c}', fontSize: 11 } }],
          },
          chartDataSource: 'sales', chartCategoryField: 'name', chartValueFields: ['value'],
        } },
        { id: 'cl-pie', type: 'pieChart', printElementType: { type: 'pieChart', title: '饼图' }, options: {
          left: 120, top: 10, width: 65, height: 70,
          chartOption: {
            series: [{ type: 'pie', data: ['$data'], radius: '62%', label: { show: true, position: 'outside', formatter: '{c} 件', fontSize: 10, overflow: 'none' } }],
          },
          chartDataSource: 'sales', chartCategoryField: 'name', chartValueFields: ['value'],
        } },
      ],
    }],
  },
}
```

- 页面 `margins` 与其余纸张字段参照相邻的「采购收货单」示例；不得改动既有示例。

- [ ] **Step 1: 新增示例条目并同步四宿主**

追加条目后运行 `npm run samples:demos`，确认四份 `templates.js` 均包含 `chart-label-demo`：

```bash
grep -c "chart-label-demo" demos/apps/*/src/templates.js
```

Expected: 四份均为 `1`。

- [ ] **Step 2: 给 `previewOnce` 增加 SVG 文本解码**

在 `return { ... }` 对象中新增：

```js
chartSvgText: [...doc.querySelectorAll('img[src^="data:image/svg"]')].map(img => {
  const src = img.getAttribute('src') || ''
  const m = /^data:image\/svg\+xml([^,]*),(.*)$/.exec(src)
  if (!m) return ''
  try { return m[1].includes('base64') ? atob(m[2]) : decodeURIComponent(m[2]) } catch { return '' }
}).join(''),
```

- [ ] **Step 3: 新增场景断言**

在体检报告场景之后追加：

```js
const label = await applySample('数据标签示例')
check('数据标签示例：模板加载成功', label.validation === 'ok', `校验=${label.validation}`)
const lpv = await previewOnce()
check('数据标签示例：柱状图标签文本落到 SVG', lpv.chartSvgText.includes('华东: 12'), '')
check('数据标签示例：饼图标签文本落到 SVG', lpv.chartSvgText.includes('12 件'), '')
```

两条断言依赖示例模板的 formatter 互不相同（柱图 `{b}: {c}`、饼图 `{c} 件`），确保能区分是哪个图表出的文本；`华南` / `华北` 名称只出现在坐标轴，不作为断言依据。

- [ ] **Step 4: 起服务跑验收**

```bash
npm run dev:demos:vue3   # 另开终端，端口 9331
node demos/scripts/verify-business-scenarios.mjs http://localhost:9331/
```

Expected: 全绿，含两条新增断言与体检报告既有断言。

- [ ] **Step 5: README 新增「数据标签」章节**

在「安装」与「作为 npm 包使用」之后插入一节，内容：四块字段表（引用 spec 第四节）、formatter 预设表、默认集说明、仪表盘走 `detail`、排除项（rich / emphasis.label / labelLayout）、手写通道示例：

```js
chartOption: { series: [{ type: 'bar', data: ['$data'], label: { show: true, position: 'top', formatter: '{b}: {c}' } }] }
```

- [ ] **Step 6: 提交**

```bash
git add demos/apps/vue3/src/templates.js demos/apps/vue2/src/templates.js \
  demos/apps/react/src/templates.js demos/apps/jquery/src/templates.js \
  demos/scripts/verify-business-scenarios.mjs marketplace/plugins/echarts/README.md
git commit -m "docs(echarts): 新增数据标签示例模板与配置说明"
```

---

### Task 4: 版本号与构建产物

**Files:**
- Modify: `marketplace/plugins/echarts/package.json`（version 1.1.0）
- Modify: `marketplace/plugins/echarts/plugin.json`（version 1.1.0）
- Modify: `marketplace/marketplace.json`（echarts 条目 version 1.1.0）
- Modify: `packages/echarts/package.json`（version 1.6.0）
- Regenerate: `marketplace/plugins/echarts/dist/index.js`、`dist/marketplace.js`、`packages/echarts/dist/*`

**Interfaces:**
- Consumes: Task 1-3 的全部源码改动。
- Produces: 三处市场元数据版本一致（`marketplace-meta.test.ts` 只断言 `entry.version === plugin.version`）、镜像包可构建。

- [ ] **Step 1: 四处版本号同步**

`plugin.json` / `package.json` / `marketplace.json` 的 echarts 条目统一 `1.1.0`；`packages/echarts/package.json` 改 `1.6.0`。`src/version.ts` 的 `CHART_EXECUTOR_VERSION` 保持 `'2'`（执行器协议未变）。

- [ ] **Step 2: 完整构建（会同步镜像包）**

Run: `npm run build -w @worm-print-platform/echarts`
Expected: 成功；`packages/echarts/dist` 下重新出现 `kit.js`、`index.cjs`、`*.d.ts`、`echarts.js` 等完整产物。

- [ ] **Step 3: 验证镜像与元数据一致**

Run: `npm test -w @worm-print-platform/plugin-echarts -- marketplace-meta`
Expected: PASS。

- [ ] **Step 4: 全量测试与构建**

Run: `npm test -w @worm-print-platform/plugin-echarts && npm run build`
Expected: 插件测试全绿，全仓构建成功（core / canvas / echarts / plugin-echarts 全部通过）。

- [ ] **Step 5: 存量零影响比对**

```bash
node -e "
const { createDefaultChartOption, renderChartToSvg, CHART_KINDS } = require('./packages/echarts/dist/kit.js')
const out = {}
for (const type of CHART_KINDS) out[type] = renderChartToSvg({ key: type, type, option: createDefaultChartOption(type), widthMm: 80, heightMm: 60 })
console.log(JSON.stringify(out))
" > /tmp/echarts-after.json
diff <(node -e "console.log(JSON.stringify(require('/tmp/echarts-baseline.json')))") <(node -e "console.log(JSON.stringify(require('/tmp/echarts-after.json')))")
```

Expected: `diff` 无输出（十类图表默认 option 的 SVG 逐字相同，证明未开启标签时零影响）。

- [ ] **Step 6: 提交构建产物与版本**

```bash
git add marketplace/plugins/echarts/dist/index.js marketplace/plugins/echarts/dist/marketplace.js \
  marketplace/plugins/echarts/package.json marketplace/plugins/echarts/plugin.json \
  marketplace/marketplace.json packages/echarts/package.json
git commit -m "chore(echarts): 发布 1.1.0 数据标签版本并同步兼容镜像 1.6.0"
```

- [ ] **Step 7: 更新 todo.md 状态**

在 `todo.md` 的「插件市场」段追加一行记录：数据标签配置已实现（1.1.0），指向本计划与 spec 路径。

```bash
git add todo.md && git commit -m "docs: 登记百度图表数据标签配置完成"
```

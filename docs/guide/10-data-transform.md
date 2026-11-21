# 数据格式转换（关系型数据 → 批量打印数据）

[← 返回目录](./README.md) | ← 上一篇：[迁移与故障排查附录](./09-migration-faq.md)


> 适用：从业务库/接口拿到「主表 + 多张从表」的关系型数据，需要按外键关联成打印契约要求的 `printData`（对象数组，**每个元素 = 一份**，每份内明细为数组）。本文记录 core 内置转换函数 `reshapeRelationalData` 的用法与数据源示例。

## 7.1 为什么需要转换

业务系统里，一张采购单通常分散在多张表里：主表存单号/供应商，从表存商品明细、费用分摊、收货记录。而打印契约要求：

- `printData` 是**对象数组**，数组长度 = 要打印的份数（一单 = 一份）；
- 每份里，主表字段是一个对象，明细字段是**数组**（供表格/流式列表展开）。

`reshapeRelationalData` 做的就是这件事：按关联字段把从表行归到对应主表行，输出可直接送 `normalizePrintData` / `bindData` / 打印链路的 `printData`。

```
转换前（独立的多张表）                 转换后（一个 printData 数组）
主表: [单号 PO001, 单号 PO002]        [ { 采购单: {...}, 商品明细: [...], 费用分摊: [...] },
从表: [明细...PO001, 明细...PO002]      { 采购单: {...}, 商品明细: [...], 费用分摊: [...] } ]
                     ↓ 按单号关联                    每份独立、互不共享引用
```

## 7.2 API 一览

函数由 `@worm-print-platform/core` 主入口导出（纯函数，不修改入参）：

```ts
import { reshapeRelationalData } from '@worm-print-platform/core'
import type {
  RelationalReshapeInput,
  RelationalMain,
  RelationalDetail,
} from '@worm-print-platform/core'

reshapeRelationalData(input: RelationalReshapeInput): Record<string, any>[]
```

入参结构（源码 `packages/core/src/print/relational-reshape.ts`）：

```ts
interface RelationalReshapeInput {
  main: {
    /** 主表在每份输出中挂载的字段名，如 '采购单' / '病人信息' */
    name: string
    /** 主表行，每行 = 一份 */
    rows: Record<string, any>[]
  }
  details: readonly {
    /** 该从表在每份输出中挂载的字段名，如 '商品明细' */
    name: string
    /** 从表行 */
    rows: Record<string, any>[]
    /** 主表上的关联键，如 '单号'，用主表行的该字段值去匹配 */
    joinKey: string
    /** 从表上的关联键，缺省与 joinKey 相同；主/从表键名不同时填，如 '采购单号' */
    detailKey?: string
  }[]
}
```

输出规则：

- 输出数组长度 = `main.rows.length`；主表为空或非数组时返回 `[]`。
- 每一份形如 `{ [main.name]: 主表行, [各 detail.name]: 匹配到的行数组 }`。
- 每个 detail 独立预分组后挂载，无匹配时仍写入 `[]`，保证字段齐全。

## 7.3 数据源示例一：采购收货单（一主一从）

### 7.3.1 原始数据

假设接口返回两张独立数组（主表 2 行、明细 3 行）：

```js
// 主表：每行 = 一张采购单（一份）
const purchaseOrders = [
  { 单号: 'PO001', 供应商: '鑫达五金', 日期: '2026-08-01' },
  { 单号: 'PO002', 供应商: '恒泰机电', 日期: '2026-08-02' },
]

// 从表：商品明细，通过「单号」外键归属到主表
const purchaseItems = [
  { 单号: 'PO001', 商品名称: '碳钢螺丝', 数量: 100, 金额: 50 },
  { 单号: 'PO001', 商品名称: '不锈钢螺母', 数量: 117, 金额: 87.75 },
  { 单号: 'PO002', 商品名称: '六角螺栓', 数量: 151, 金额: 188.75 },
]
```

### 7.3.2 转换代码

```js
import { reshapeRelationalData } from '@worm-print-platform/core'

const printData = reshapeRelationalData({
  main: { name: '采购单', rows: purchaseOrders },
  details: [
    { name: '商品明细', rows: purchaseItems, joinKey: '单号' },
  ],
})
```

### 7.3.3 输出 printData

```js
[
  {
    采购单: { 单号: 'PO001', 供应商: '鑫达五金', 日期: '2026-08-01' },
    商品明细: [
      { 单号: 'PO001', 商品名称: '碳钢螺丝', 数量: 100, 金额: 50 },
      { 单号: 'PO001', 商品名称: '不锈钢螺母', 数量: 117, 金额: 87.75 },
    ],
  },
  {
    采购单: { 单号: 'PO002', 供应商: '恒泰机电', 日期: '2026-08-02' },
    商品明细: [
      { 单号: 'PO002', 商品名称: '六角螺栓', 数量: 151, 金额: 188.75 },
    ],
  },
]
```

模板里对应写法：主表字段用 `采购单.单号`、`采购单.供应商` 这类点路径；表格/流式列表的明细数据源选 `商品明细`（字段类型 `list`），它会自动按每份展开多行。

## 7.4 数据源示例二：多从表 + 异构关联键

业务库里主表键与从表外键**字段名不同**很常见（如主表 `就诊ID`、从表 `就诊号`），用 `detailKey` 指定从表侧的键。`details` 可同时挂任意多张从表。

```js
const printData = reshapeRelationalData({
  main: {
    name: '病人信息',
    rows: [
      { 就诊ID: 'V20260801-01', 姓名: '张三', 科室: '内科' },
      { 就诊ID: 'V20260801-02', 姓名: '李四', 科室: '外科' },
    ],
  },
  details: [
    // 异构键：主表按「就诊ID」取值，从表按「就诊号」匹配
    {
      name: '检验单',
      joinKey: '就诊ID',
      detailKey: '就诊号',
      rows: [
        { 就诊号: 'V20260801-01', 项目: '血常规', 结果: '正常' },
        { 就诊号: 'V20260801-01', 项目: '血糖', 结果: '5.2' },
        { 就诊号: 'V20260801-02', 项目: '凝血', 结果: '正常' },
      ],
    },
    // 同名字段，detailKey 省略（等同 joinKey）
    {
      name: '药品明细',
      joinKey: '就诊ID',
      rows: [{ 就诊ID: 'V20260801-01', 药品: '阿莫西林', 数量: 1 }],
    },
    // 该从表无匹配数据，仍会挂载空数组
    { name: '费用记录', joinKey: '就诊ID', rows: [] },
  ],
})
```

输出（两份）：

```js
[
  {
    病人信息: { 就诊ID: 'V20260801-01', 姓名: '张三', 科室: '内科' },
    检验单: [
      { 就诊号: 'V20260801-01', 项目: '血常规', 结果: '正常' },
      { 就诊号: 'V20260801-01', 项目: '血糖', 结果: '5.2' },
    ],
    药品明细: [{ 就诊ID: 'V20260801-01', 药品: '阿莫西林', 数量: 1 }],
    费用记录: [],
  },
  {
    病人信息: { 就诊ID: 'V20260801-02', 姓名: '李四', 科室: '外科' },
    检验单: [{ 就诊号: 'V20260801-02', 项目: '凝血', 结果: '正常' }],
    药品明细: [],
    费用记录: [],
  },
]
```

## 7.5 接入打印链路

转换结果就是标准 `printData`，三条打印链路（浏览器打印 / 服务端 PDF / 桌面客户端静默打印，见[开始之前](./01-getting-started.md)）共用它，无需各自转换。

Vue 3 宿主（`PrintHtmlPreview` 的 `print-data`，参见 [Vue 3 接入](./02-vue3.md)）：

```vue
<script setup>
import { computed } from 'vue'
import { reshapeRelationalData } from '@worm-print-platform/core'

const printData = computed(() => reshapeRelationalData({
  main: { name: '采购单', rows: purchaseOrders.value },
  details: [{ name: '商品明细', rows: purchaseItems.value, joinKey: '单号' }],
}))
</script>

<template>
  <PrintHtmlPreview
    :template-json="templateJson"
    :print-data="printData"
    base-url="/files"
  />
</template>
```

服务端/Node（core 同构管线 `prepareDocument`）：

```ts
import { prepareDocument, reshapeRelationalData } from '@worm-print-platform/core'

const printData = reshapeRelationalData({ main, details })
const doc = await prepareDocument({ templateJson, printData }, runtime)
// doc.html / doc.copies / doc.pageCount 交给后续渲染或 PDF 转换
```

## 7.6 行为约定与边界

| 场景 | 行为 |
| --- | --- |
| 主表为空 / 非数组 | 返回 `[]`，不抛错 |
| 无 `details` 配置 | 每份只含主表对象，如 `{ 采购单: {...} }` |
| 从表行缺关联值（`null`/`undefined`） | 不归入任何分组，被丢弃 |
| 主表行缺关联值 | 该份对应从表为 `[]` |
| 从表无匹配主表行 | 该份对应字段为 `[]` |
| 严格值匹配 | Map 用原始值作键，字符串 `'1'` 与数字 `1` **不互转、不匹配** |
| 同名字段（从表与主表字段重名） | 从表行在独立命名空间 `从表名.字段` 下，不覆盖主表字段 |
| 重复主表行 | 各份拿到独立的从表数组副本，修改一份不影响另一份 |
| 输入数据 | 纯函数，深拷贝输出，不修改原始 `main.rows` / `detail.rows` |

批量份数上限由下游 `normalizePrintData` 统一约束：转换后数组超过 `MAX_BATCH_COPIES`（默认 500）会在打印管线中抛「批量打印最多支持 500 份」错误，请在转换前按业务控制主表行数。

## 7.7 常见问题速查

- **明细没打印出来**：检查从表的 `name` 是否与模板中表格数据源/字段路径一致（如 `商品明细`），且字段类型为 `list`；再核对 `joinKey` / `detailKey` 指向的字段在两边都有值。
- **关联不上但字段名看着一样**：优先查**类型差异**（`'1'` vs `1`）和 `null`/`undefined`，本函数不做隐式类型转换。
- **主表键名和从表外键名不同**：用 `detailKey` 指定从表侧的字段名（见 7.4）。
- **转换后某份的某个从表是空数组**：说明该主表行的 `joinKey` 值在所有从表行里都没匹配到，属预期行为。
- **超过 500 份报错**：属于批量上限，不是转换函数错误；拆分业务数据或调整主表行数。

## 相关

- 源码：`packages/core/src/print/relational-reshape.ts`（主入口 `@worm-print-platform/core` 已导出）
- 功能测试：`packages/core/src/print/__tests__/relational-reshape.spec.ts`
- 压力/不变量测试：`packages/core/src/print/__tests__/relational-reshape.stress.spec.ts`
- 下游归一：`packages/core/src/print/normalize-print-data.ts`（`normalizePrintData`）

---

[← 返回目录](./README.md) | ← 上一篇：[迁移与故障排查附录](./09-migration-faq.md)

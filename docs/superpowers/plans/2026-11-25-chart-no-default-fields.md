# 图表新建不再默认赋值类目/值字段 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新建图表元素的出厂默认不再预填类目字段与数值字段，必须由用户在属性面板手工选择。

**Architecture:** 只改插件出厂默认工厂 `chartFactoryDefaults` 的两个默认值；渲染层 `bind.ts`、历史模板、`partial` 覆盖逻辑均不动。用一条工厂级测试锁定行为。

**Tech Stack:** TypeScript / Vitest，workspace `marketplace/plugins/echarts`（唯一源码真源）。

**Spec:** 会话中已批准方案——只改出厂默认；渲染层保持现状。

## Global Constraints

- 源码真源是 `marketplace/plugins/echarts/src`；`packages/echarts` 为构建同步的兼容镜像，不直接改镜像源码。
- 提交信息、PR、Issue 一律中文（AGENTS.md）。
- UTF-8 无 BOM，单次写入不超过 500 行。

## Review Focus

- 历史模板已带 `chartCategoryField: 'name'` / `chartValueFields: ['value']`：保持原值，不被清空（出厂默认只作用于新建）。
- 调用 `chartFactoryDefaults(type, partial)` 显式传入字段时：`partial` 覆盖默认，应尊重传入值。
- 新建图表未选字段时预览仍显示占位图：渲染层按已确认取舍不动。
- 官方样例模板 `demos/apps/print-demo/src/print/official-samples.ts` 中的字段值属历史数据，不动。

---

### Task 1: 出厂默认类目/值字段留空

**Files:**
- Modify: `marketplace/plugins/echarts/src/config.ts:74-75`
- Test: `marketplace/plugins/echarts/src/__tests__/defaults.test.ts`

**Interfaces:**
- Consumes: `chartFactoryDefaults(type: string, partial?: Record<string, unknown>): Record<string, unknown>`（已有签名）
- Produces: 同签名；返回对象里 `chartCategoryField === ''`、`chartValueFields` 为空数组（除非 `partial` 覆盖）

- [ ] **Step 1: 写失败测试**

在 `defaults.test.ts` 增加 import 与测试：

```ts
import { chartFactoryDefaults } from '../config.js'

it('新建图表出厂不带类目/值字段默认赋值', () => {
  const defaults = chartFactoryDefaults('barChart')
  expect(defaults.chartCategoryField).toBe('')
  expect(defaults.chartValueFields).toEqual([])
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd marketplace/plugins/echarts && npx vitest run src/__tests__/defaults.test.ts`
Expected: FAIL（`chartCategoryField` 实际为 `'name'`）

- [ ] **Step 3: 改出厂默认**

`config.ts` 第 74 行 `chartCategoryField: 'name'` → `chartCategoryField: ''`；第 75 行 `chartValueFields: ['value']` → `chartValueFields: []`。

- [ ] **Step 4: 运行测试确认通过**

Run: 同 Step 2
Expected: PASS

- [ ] **Step 5: 全量测试并同步产物**

Run: `cd marketplace/plugins/echarts && npx vitest run`；再执行包内 `build` 脚本同步 `dist` 与 `packages/echarts` 兼容镜像。
Expected: 全绿；镜像与真源一致。

- [ ] **Step 6: 提交**

`git add marketplace/plugins/echarts/src/config.ts marketplace/plugins/echarts/src/__tests__/defaults.test.ts` 及同步产物，提交信息 `fix(echarts): 新建图表不再默认赋值类目与数值字段`。

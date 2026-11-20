# 字段显示模式配置 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让宿主通过 `field-display` 配置素材台字段行与表达式弹窗「字段」页签只显示中文名、只显示 key 或两者都显示（默认两者），key 独占时套用中文名样式。

**Architecture:** 显示模式类型与归一化函数放在 `plugin-kit`（单一真源），canvas 复用；宿主属性经 `PrintDesignerElement` 写入 `ShellState.fieldDisplay`，同时驱动素材台字段行与 `syncExpression` 传给 `renderExpressionEditor` 的 options。样式改动只落在 core 共享 CSS，由 canvas 派生脚本生成 Shadow DOM 样式表。

**Tech Stack:** TypeScript、原生 Custom Elements / Shadow DOM、plugin-kit `h`/`render`、vitest + happy-dom、npm workspaces。

**Spec:** `docs/superpowers/specs/2026-11-19-field-display-design.md`

## Global Constraints

- 简体中文：回复、代码注释、提交信息、文档；标识符 / 包名 / 字段名保留英文。UTF-8 无 BOM，单次写入 ≤ 500 行。
- 仅本仓 `worm-print-platform`；不动 `worm-vue3-print`；canvas 为权威实现，PARITY.md 记录有意差异。
- 三态取值 `label | key | both`，默认 `both`；非法值 `trim()` + 小写后未识别一律静默回退 `both`。
- 一份配置统一传播：`field-display` attribute ↔ `fieldDisplay` property → `ShellState.fieldDisplay` → 素材台 + 表达式弹窗 options。设计器内不新增任何开关 UI。
- 作用面仅素材台字段行 + 表达式弹窗「字段」页签；系统变量 / 函数页签与字段分组名永不隐藏。
- 隐藏只改可见文本与样式：搜索仍同时匹配中文名 + key；单击仍复制 `fieldLabel || fieldKey`；整行 `data-tip` 仍完整；双击仍按 `fieldKey` 插入；拖拽载荷不变。
- `key` 模式样式完全套用中文名：素材台 `.node-key.is-primary` 为 13px / `var(--pd-text, #303133)` 且文本无外围括号；弹窗 `.ee-item-key.is-primary` 为 12px / `var(--pd-text)` / 继承字族。保留原 class，另加 `.is-primary`。
- 样式唯一真源 `packages/core/src/styles/designer.css`；派生命令 `npm run styles -w @worm-print-platform/canvas`（生成文件 `packages/canvas/src/styles/designer.css` 不入库，但 canvas 的 `test` / `typecheck` 脚本会自动跑 styles）。
- 宿主契约新增属性属 MINOR：`PRINT_DESIGNER_CONTRACT_VERSION` 由 `1.2.0` 升为 `1.3.0`。
- 包边界不变：`plugin-kit` 不依赖 canvas；`core` 只放样式与纯逻辑。

## Review Focus

1. 宿主不传配置或移除 attribute：必须与当前行为逐字一致（两行文本 + 括号 + 原样式）→ Task 1、Task 2、Task 3 的默认态断言。
2. 非法值（拼错、大小写、首尾空格、`null`）：静默回退 `both`，不抛错、不产生空白字段行 → Task 1 `normalizeFieldDisplay` 用例 + Task 2 getter 用例。
3. `fieldLabel` 为空：按既有复制口径回落 `fieldKey`，`label` 模式不得渲染空行 → Task 1、Task 3 用例。
4. 分组名常驻且隐藏项仍可被搜索命中（如 `label` 模式按 key 搜到行）→ Task 1、Task 3 用例。
5. `key` 模式视觉：去括号、`.is-primary` 修饰类、core CSS 中字号 / 颜色 / 字族与中文名规则同值 → Task 1、Task 3 的 DOM 断言 + CSS 源断言。

---

### Task 1: plugin-kit 显示模式类型与表达式弹窗字段页签

**Files:**
- Modify: `packages/plugin-kit/src/expression-editor.ts`（类型、归一化、`ExpressionEditorOptions`、`itemInfo`、字段页签渲染）
- Modify: `packages/canvas/src/shell/expression-editor.ts`（re-export 新类型与函数）
- Modify: `packages/core/src/styles/designer.css`（`.ee-item-key.is-primary` 规则）
- Test: `packages/canvas/src/shell/__tests__/expression-field-display.spec.ts`（新建）

**Interfaces:**
- Consumes: 现有 `itemInfo(label, key)`、`listItems()`、`ExpressionEditorOptions`（字段页签走 `groupFields` + `filterGroups`）。
- Produces:
  - `export type FieldDisplayMode = 'label' | 'key' | 'both'`
  - `export function normalizeFieldDisplay(v: unknown): FieldDisplayMode`（字符串 trim + 小写，仅三态合法，其余 `both`）
  - `ExpressionEditorOptions.fieldDisplay?: FieldDisplayMode`（省略按 `both`）
  - DOM 契约：`.ee-field-item` 在 `both` 下含 `.ee-item-label` + `.ee-item-key`；`label` 下只含 `.ee-item-label`；`key` 下只含 `.ee-item-key.is-primary`（文本为裸 key）；变量 / 函数页签两行结构不变。

- [ ] **Step 1: 写失败测试** `packages/canvas/src/shell/__tests__/expression-field-display.spec.ts`
  - `mount(fieldDisplay?: FieldDisplayMode)`：`render(renderExpressionEditor({ fields, ...(fieldDisplay === undefined ? {} : { fieldDisplay }), onClose(){}, onApply(){} }, { elementId:'el-1', targetPath:'options.formatter', value:'' }), host)`；`fields` 按 `groupFields` 口径构造：`customer`（容器，`fieldLabel:'客户信息'`, `sortOrder:0`）、`customer.name`（`fieldLabel:'客户名称'`, `sortOrder:1`）、`order`（容器，`fieldLabel:'订单信息'`, `sortOrder:2`）、`order.remark`（`fieldLabel:''`, `sortOrder:3`）。字段行顺序为 `rows[0]=customer.name`、`rows[1]=order.remark`，两分组 header 分别为「客户信息」「订单信息」。
  - 用例：`normalizeFieldDisplay(' KEY ')` / `' LaBeL '` / `'both'` / `'bogus'` / `null` / `undefined` 依次得 `key` / `label` / `both` / `both` / `both` / `both`。
  - 用例：未传 `fieldDisplay` → `rows[0]` 同时有 `.ee-item-label`（文本「客户名称」）与 `.ee-item-key`（文本 `customer.name`），后者无 `is-primary`。
  - 用例：`label` → `rows[0]` 有 `.ee-item-label`、无 `.ee-item-key`；`.ee-field-group` 文本仍含「客户信息」；空中文名字段行 `rows[1]` 的 `.ee-item-label` 文本为 `order.remark`。
  - 用例：`key` → `rows[0]` 无 `.ee-item-label`，`.ee-item-key.is-primary` 文本为 `customer.name` 且不含括号；`rows[1]` 同样显示 `order.remark`。
  - 用例：`key` 模式下点击第二个 `.ee-nav-tab`（变量）后，首个 `.ee-list-item` 仍同时有 `.ee-item-label` 与 `.ee-item-key`（页签不受影响）。
  - 用例：`key` 模式下 `.ee-copy-btn` 的 `data-tip` 仍为 `复制字段名「客户名称」`。
  - 用例：读取 `../core/src/styles/designer.css`，断言包含 `.ee-field-info .ee-item-key.is-primary` 规则体与 `font-size:12px`、`color:var(--pd-text)`、`font-family:inherit`。

- [ ] **Step 2: 运行确认失败**
  Run: `npm exec -w @worm-print-platform/canvas -- vitest run src/shell/__tests__/expression-field-display.spec.ts`
  Expected: FAIL（导出不存在 / DOM 断言不符）。

- [ ] **Step 3: 实现 plugin-kit**
  在 `expression-editor.ts` 顶部类型区加 `FieldDisplayMode` 与 `normalizeFieldDisplay`；`ExpressionEditorOptions` 加 `fieldDisplay?: FieldDisplayMode`；`renderExpressionEditor` 内计算 `const fieldDisplay = normalizeFieldDisplay(opts.fieldDisplay)`；`itemInfo(label, key, display: FieldDisplayMode = 'both'): El` 按三态返回，`key` 态只返回 `.ee-item-key.is-primary`，`label` 态只返回 `.ee-item-label`，其余返回原两节点；字段页签调用 `itemInfo(field.fieldLabel || field.fieldKey, field.fieldKey, fieldDisplay)`，变量 / 函数页签保持两参调用。

- [ ] **Step 4: re-export** 在 `packages/canvas/src/shell/expression-editor.ts` 增加 `export { normalizeFieldDisplay }` 与 `export type { FieldDisplayMode }`（从 `@worm-print-platform/plugin-kit/expression-editor`）。

- [ ] **Step 5: 加样式并派生** 在 `packages/core/src/styles/designer.css` 的 `.ee-field-info .ee-item-key` 规则之后加 `.ee-field-info .ee-item-key.is-primary{font-size:12px;color:var(--pd-text);font-family:inherit}`；运行 `npm run styles -w @worm-print-platform/canvas`。

- [ ] **Step 6: 运行确认通过**
  Run: `npm exec -w @worm-print-platform/canvas -- vitest run src/shell/__tests__/expression-field-display.spec.ts`
  Expected: PASS。

- [ ] **Step 7: 提交** `git commit -m "feat(plugin-kit): 表达式弹窗字段行支持宿主配置显示模式"`

### Task 2: 宿主契约升级与 canvas 接线

**Files:**
- Modify: `packages/canvas/src/host-contract.ts`（版本、attribute、property、类型注释）
- Modify: `packages/canvas/src/shell/controls.ts`（`ShellState.fieldDisplay?: FieldDisplayMode` 声明）
- Modify: `packages/canvas/src/print-designer.ts`（state、setter/getter、attribute 回调、首挂、弹窗透传）
- Modify: `packages/canvas/src/__tests__/host-contract.spec.ts`（版本与新增面断言、getter/setter 归一化）
- Modify: `packages/canvas/src/__tests__/expression-dblclick.spec.ts`（端到端透传）

**Interfaces:**
- Consumes: Task 1 的 `FieldDisplayMode` / `normalizeFieldDisplay`。
- Produces:
  - `PRINT_DESIGNER_ATTRIBUTES` 含 `'field-display'`；`PRINT_DESIGNER_PROPERTY_NAMES` 含 `'fieldDisplay'`；版本 `1.3.0`。
  - `PrintDesignerProperties.fieldDisplay: FieldDisplayMode`。
  - `PrintDesignerElement`：`set fieldDisplay(v: unknown)`（归一化 → 写 `state` → 必要时写 attribute → repaint）、`get fieldDisplay(): FieldDisplayMode`（读 `state`）。
  - `ShellState.fieldDisplay?: FieldDisplayMode`（本任务在 `controls.ts` 声明并在 `print-designer.ts` 赋值，Task 3 消费）。

- [ ] **Step 1: 写失败测试** 改 `host-contract.spec.ts`
  - 版本断言 `'1.2.0'` 改为 `'1.3.0'`。
  - 在「声明面」用例断言 `PRINT_DESIGNER_ATTRIBUTES` 含 `'field-display'`、`PRINT_DESIGNER_PROPERTY_NAMES` 含 `'fieldDisplay'`、`getHostContract().attributes` / `.properties` 同步包含。
  - 新增用例：`create()` 后 `(el as unknown as { fieldDisplay: unknown }).fieldDisplay = ' KEY '` → `el.fieldDisplay === 'key'` 且 `getAttribute('field-display') === 'key'`；`setAttribute('field-display','bogus')` → `=== 'both'`；`removeAttribute('field-display')` → `=== 'both'`。

- [ ] **Step 2: 写失败测试** 改 `expression-dblclick.spec.ts`
  - `mountDesigner(attrs: Record<string,string> = {})`：在创建 `el` 后、append 前逐项 `setAttribute`。
  - 新增用例：`mountDesigner({ 'field-display': 'key' })` → `store.fields = [{ id:'f1', fieldKey:'amount', fieldLabel:'金额', fieldType:'string', sortOrder:1 }]`；`store.addElement('text', { left:10, top:10, width:40, height:10 })`；`await frame()`；`dblClick(root, '[data-el-id="'+el.id+'"]')`；`await frame()`；断言首个 `.ee-field-item` 无 `.ee-item-label`、`.ee-item-key.is-primary` 文本为 `amount`（证明属性一路透传到弹窗）。

- [ ] **Step 3: 运行确认失败**
  Run: `npm exec -w @worm-print-platform/canvas -- vitest run src/__tests__/host-contract.spec.ts src/__tests__/expression-dblclick.spec.ts`
  Expected: FAIL（版本不符、property 未定义、弹窗仍显示两行）。

- [ ] **Step 4: 改 `host-contract.ts` 与 `controls.ts`**
  `host-contract.ts` 顶部加 `import type { FieldDisplayMode } from '@worm-print-platform/plugin-kit/expression-editor'`；版本改 `'1.3.0'`；`PRINT_DESIGNER_ATTRIBUTES` 末尾加 `'field-display'`；`PrintDesignerProperties` 末尾加带 JSDoc 的 `fieldDisplay: FieldDisplayMode`（说明三态、默认 `both`、只影响字段行显示）；`PRINT_DESIGNER_PROPERTY_NAMES` 末尾加 `'fieldDisplay'`。`controls.ts` 引入 `FieldDisplayMode` 并在 `ShellState` 加可选字段 `fieldDisplay?: FieldDisplayMode`（JSDoc 注明由宿主属性注入、缺省 `both`）。

- [ ] **Step 5: 改 `print-designer.ts`**
  从 `./shell/expression-editor` 引入 `normalizeFieldDisplay` 与类型 `FieldDisplayMode`；`state` 初始化加 `fieldDisplay: 'both'`；`connectedCallback` 在 `readChrome()` 前加 `this.state.fieldDisplay = normalizeFieldDisplay(this.getAttribute('field-display'))`（兜住声明式 attribute 的解析顺序）；`attributeChangedCallback` 在 `theme-config` 分支之后加 `field-display` 分支（写 state + repaint + return，须在通用 `if (!value) return` 之前，保证移除回落 `both`）；在 `showSave` setter 之后加 setter/getter（签名见 Interfaces）；`syncExpression` 的 `renderExpressionEditor` options 加 `fieldDisplay: this.state.fieldDisplay`。

- [ ] **Step 6: 运行确认通过**
  Run: `npm exec -w @worm-print-platform/canvas -- vitest run src/__tests__/host-contract.spec.ts src/__tests__/expression-dblclick.spec.ts`
  Expected: PASS。

- [ ] **Step 7: 提交** `git commit -m "feat(canvas): 宿主契约新增 field-display 并透传表达式弹窗"`

### Task 3: 素材台字段树按模式渲染

**Files:**
- Modify: `packages/canvas/src/shell/panels.ts`（`fieldsPane` 字段行三态渲染）
- Modify: `packages/core/src/styles/designer.css`（`.node-key.is-primary` 规则）
- Test: `packages/canvas/src/shell/__tests__/field-tree.spec.ts`

**Interfaces:**
- Consumes: Task 2 声明并写入的 `ShellState.fieldDisplay`。
- Produces: 素材台字段行 DOM 契约——`both`（默认）：`.node-label` + `.node-key`（文本 `(${fieldKey})`）；`label`：仅 `.node-label`；`key`：仅 `.node-key.is-primary`（文本裸 `fieldKey`）。分组 header、整行 `data-tip`、复制提示、拖拽载荷保持不变。

- [ ] **Step 1: 写失败测试** 改 `field-tree.spec.ts`
  - `paint(overrides: Partial<ShellState> = {})`：`state: { ...makeState(), ...overrides }`，原有用例不传参。
  - 新增 `rows(host)` 返回全部 `.field-row`（`rowOf` 保留，仍按 `LONG_KEY` 文本查找）。
  - 用例：`both`（默认）`rows[1]` 含 `.node-label`（文本 `LONG_LABEL`）与 `.node-key`（文本 `(${LONG_KEY})`，无 `is-primary`）。
  - 用例：`label` → `rows[1]` 有 `.node-label`（文本 `LONG_LABEL`）、无 `.node-key`；`.field-group-header .group-label` 仍为「客户信息」；`data-tip` 仍为 `ROW_TIP`；单击该行仍复制 `LONG_LABEL`。
  - 用例：`key` → `rows[1]` 无 `.node-label`，`.node-key.is-primary` 文本为 `LONG_KEY` 且不含 `(`；分组 header 仍在。
  - 用例：`label` 模式下对 `.search-input` 派发 `input`（value = `LONG_KEY`）再派发 `change`，重绘后仍有 1 条字段行（隐藏项仍可搜）。
  - 用例：读取 `../core/src/styles/designer.css`，断言包含 `.field-row .node-key.is-primary` 规则体与 `font-size:13px`、`color:var(--pd-text, #303133)`。

- [ ] **Step 2: 运行确认失败**
  Run: `npm exec -w @worm-print-platform/canvas -- vitest run src/shell/__tests__/field-tree.spec.ts`
  Expected: FAIL（`is-primary` / 隐藏节点断言不符）。

- [ ] **Step 3: 实现渲染** `panels.ts` 的 `fieldsPane` 先取 `const mode = ctx.state.fieldDisplay ?? 'both'`，字段行子节点中：中文名节点用 `field.fieldLabel || field.fieldKey`，仅 `mode !== 'key'` 时挂 `.node-label`；仅 `mode !== 'label'` 时挂 `.node-key`，其 `class` 在 `key` 模式追加 ` is-primary`、`text` 在 `key` 模式为裸 `field.fieldKey`、否则为 `(${field.fieldKey})`；其余 `data-tip`、拖拽、复制回调与 `copy-hint` 一字不改，仍用 `.filter(Boolean)` 过滤空节点。

- [ ] **Step 4: 加样式并派生** 在 `packages/core/src/styles/designer.css` 的 `.node-key` 规则之后加 `.field-row .node-key.is-primary{font-size:13px;color:var(--pd-text, #303133)}`；运行 `npm run styles -w @worm-print-platform/canvas`。

- [ ] **Step 5: 运行确认通过**
  Run: `npm exec -w @worm-print-platform/canvas -- vitest run src/shell/__tests__/field-tree.spec.ts`
  Expected: PASS。

- [ ] **Step 6: 提交** `git commit -m "feat(canvas): 素材台字段行支持字段显示模式配置"`

### Task 4: 文档与全量验证

**Files:**
- Modify: `packages/canvas/README.md`（宿主契约表 + 一段取值说明与示例）
- Modify: `packages/canvas/PARITY.md`（§八「与 canvas 的有意行为差异」新增一条）
- Modify: `packages/canvas/src/shell/help-content/changelog.ts`（顶部新增「待发布」条目）

**Interfaces:**
- Consumes: Task 1–3 的最终 API 与 DOM 契约。
- Produces: 宿主可见文档；无新增代码接口。

- [ ] **Step 1: README** 在「宿主契约」表 attribute 行加 `field-display`，property 行加 `fieldDisplay`；表后补一段：`label`/`key`/`both`（默认 `both`），只影响素材台字段行与表达式弹窗「字段」页签，分组名与搜索/复制/插入语义不变；给一个 `<print-designer field-display="label">` 示例。

- [ ] **Step 2: PARITY.md** 在 §八 新增一条：本仓独有 `field-display` / `fieldDisplay`，Vue 3 轨本轮有意不实现；默认 `both` 保证存量零变化，故不构成 parity 回归。

- [ ] **Step 3: changelog** 按文件首行约定，在 `<h2>V1.5.3` 之前插入 `<h2>待发布</h2>` + `<h3>新增</h3>` + 一条 `<li>`：宿主可配置字段显示中文名 / key / 两者（默认两者），只显示 key 时样式与中文名一致，分组名始终显示。

- [ ] **Step 4: 全量验证**
  Run: `npm run typecheck -w @worm-print-platform/canvas` 与 `npm run test -w @worm-print-platform/canvas`、`npm run test -w @worm-print-platform/plugin-kit`、`npm run build`
  Expected: 全部 PASS；`git diff` 无无关改动，包边界未被破坏。

- [ ] **Step 5: 提交** `git commit -m "docs(canvas): 补充字段显示模式宿主契约与更新记录"`

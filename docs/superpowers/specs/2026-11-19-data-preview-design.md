# 数据源预览插件（字段父节点查看数据源）设计方案

> 日期：2026-11-19　状态：已实现（方案演进见下）
> **最终实现注记**：改为「插件只导出 `openDataPreview(options)` 触发 API，宿主自行配置入口与开关」，未采用本文 §5.1 的 `FieldActionUI` 贡献点与 canvas 字段树按钮方案；该贡献点及 canvas 挂载点已全部移除。
> 对应 Gitee issue：[IKWC7W「设计器细节优化」](https://gitee.com/liulong_oschina/worm-print-platform/issues/IKWC7W) 第 2 点——“字段父节点加一个预览按钮可以查看数据源”。
> 本版按评审意见调整：**多 tab（总览 + 子标签页，汇总表可跳转）、第一版不分页、以插件方式实现**。

## 一、背景与目标

宿主传入打印设计器的业务数据（`designData` / `design-data`）目前只在绑定求值与出纸渲染时使用，设计者无法在设计器里核对数据内容。issue 要求在字段树父节点上加预览按钮查看数据源。

**目标**：以**插件**方式提供数据预览——字段树分组节点上的按钮打开弹窗，弹窗用多 tab 展示：第一个是“总览”汇总表，数据中存在子属性/子数组时生成对应子标签页，且可从总览表跳转到子标签页；内容按 JSON 形态解析为**表单**（对象）或**表格**（数组）。第一版不分页。

**非目标**：不改动出纸渲染链路；不提供数据编辑；不覆盖 issue 的另两项（字段小字去除、自定义函数注册）。

## 二、现状调查（已读代码确认）

- **数据入口**：`el.designData` / `design-data` 经 `normalizeDesignData` 归一为数组信封，`data[0]` 为数据根，挂在 `ShellCtx.host.designData`（`print-designer.ts`）。
- **字段模型**：`PrintBusinessField { fieldKey, fieldLabel, fieldType, sortOrder }`；`groupFields()`（`core/.../field-groups.ts`）按 `fieldKey` 首段分组为 `FieldGroup { key, label, isList, fields }`。
- **字段树**：`fieldsPane()`（`canvas/.../shell/panels.ts`）渲染 `.field-group-header`（📁/📋）+ `.field-row`，父节点目前只有折叠交互。
- **数据样例**（`demos/apps/vue3/src/templates.js` 的 `费用结算单`）：`系统信息`、`住院信息` 的值是对象；`费用明细`（`fieldType:'list'`）的值是对象数组；叶子字段 `费用明细.项目名称` 与 JSON 键 `项目名称` 直接对应。
- **插件体系现状**：
  - core：`defineElementPlugin` / `registerElementPlugin` 注册**元素 kind**（出纸渲染、绑定）。
  - plugin-kit：`defineElementUI` / `registerElementUI` 注册**设计器 UI**，扩展点只有三个——素材卡、画布内容（`renderCanvas`）、属性台（`renderProperty`）；注册函数由包入口 `import` 即执行，支持订阅与注销。
  - **没有字段树扩展点**：要在父节点挂按钮，必须新增一个通用贡献点。

## 三、方案（Approaches）

- **A. 新增 plugin-kit 字段树扩展点 + 独立数据预览插件包（选用）**：canvas 核心只加一次通用挂载点；预览的 UI、解析、tab 逻辑全在插件包，可独立安装/卸载，符合“插件方式”。
- **B. 直接改 canvas 核心实现预览**：改动分散且无法作为插件复用，与“插件方式”相悖。
- **C. 独立数据源页签**：偏离 issue 的父节点入口。

**选 A**：核心改动收敛为一个扩展点 + 一个挂载容器，业务能力全在插件。

## 四、交互与数据映射（多 tab）

### 4.1 弹窗结构

点击某分组父节点的预览按钮 → 弹窗打开，**以该分组对应的数据 `data[0][group.key]` 为根**：

```
┌──────────────────────────────────────────────┐
│ 数据源预览 · <分组名>                     ✕ │
├────────┬──────────┬──────────────────────────┤
│  总览   │ 子属性A   │ 子数组B                  │  ← tab 栏（按需出现）
├────────┴──────────┴──────────────────────────┤
│ 总览：汇总表                                 │
│ 属性/字段 │ 类型  │ 摘要 / 值                 │
│ 住院号    │ 标量  │ 20130200                 │
│ 患者信息  │ 对象  │ 6 个字段        [查看 →] │
│ 费用列表  │ 数组  │ 16 条           [查看 →] │
└──────────────────────────────────────────────┘
```

- 右上角 X / Esc / 点遮罩关闭。
- tab 栏首项固定为“总览”；仅当根数据中存在对象/数组型子属性时才追加子 tab。
- “总览”表中的对象/数组行提供“查看 →”入口，点击切换到对应子 tab（**汇总表跳转**）。

### 4.2 总览 tab

根为**对象**：三列汇总表【属性 | 类型 | 摘要/值】。
- 标量：显示值；对象：显示“N 个字段”+ 跳转；数组：显示“N 条”+ 跳转。
- 属性名取叶子字段 `fieldLabel` 优先，缺失回退 JSON key；顺序按 `sortOrder`，无 fields 时按 JSON 键插入顺序。

根为**数组**：总览直接渲染该数组的表格；若元素内某列的值是对象/数组，则为该列生成子 tab 并可跳转。

根为**标量**：单行展示（标签 = 分组名，值 = 值）。

### 4.3 子标签页

对根数据中每个值为**对象或数组**的直接属性生成一个子 tab（以属性名/fieldLabel 命名）。子 tab 内容按形态渲染：对象→表单、数组→表格，规则同 4.4。第一版只展开**一层**子 tab，更深层的嵌套在单元格内以 JSON 文本展示。

### 4.4 表单 / 表格渲染规则

- **表单**（对象）：两列【字段名 | 值】。标签取字段 `fieldLabel` 优先、回退 key；值标量直出，对象/数组 `JSON.stringify`，空值显示 `—`。
- **表格**（数组）：列取元素对象的键（字段 `fieldLabel` 优先、回退 key），每行按列键取值；标量元素数组渲染为单列“值”；列多时横向滚动。
- **无 fields 也能工作**：宿主未传 `fields` 时直接用 JSON 键推断列名/标签，保证“按 JSON 解析”独立可用。
- **第一版不分页**：表格一次渲染全部行；后续可加虚拟滚动作为增强。

## 五、插件契约与实现落点

### 5.1 plugin-kit 新增字段树扩展点（一次性契约）

新增 `packages/plugin-kit/src/field-action.ts` 并在 `index.ts` 导出：

```ts
export interface FieldGroupInfo { key: string; label: string; isList: boolean }
export interface FieldActionContext {
  group: FieldGroupInfo
  data?: readonly Record<string, unknown>[]   // designData 数组信封
  fields?: readonly PrintBusinessField[]
  /** 弹窗挂载容器（设计器 shadow root 内的 overlay 宿主） */
  container: HTMLElement
}
export interface FieldActionUI {
  readonly id: string
  readonly label: string       // 按钮提示
  readonly icon?: string
  /** 返回 dispose 时由宿主在重绘/卸载时调用 */
  onActivate(ctx: FieldActionContext): void | (() => void)
}
```
注册表：`defineFieldActionUI` / `registerFieldActionUI` / `getFieldActionUIs` / `subscribeFieldActionRegistry` / `clearFieldActionUIs`（对齐现有 ElementUI 注册表的幂等、订阅、注销语义）。

### 5.2 canvas 新增通用挂载点

- `shell/panels.ts` 的 `.field-group-header` 内遍历 `getFieldActionUIs()`，渲染按钮（图标 + `data-tip`），点击 `stopPropagation()` 不触发折叠，调用 `onActivate({ group, data, fields, container })`。
- `print-designer.ts` 在 shadow root 内提供持久的 `.pd-field-action-host` overlay 容器；插件把弹窗 DOM 挂进去，返回的 dispose 由宿主在卸载时调用。
- 样式：容器骨架样式进 `core/src/styles/designer.css` 并按包内 `gen-styles.mjs` 派生；插件自身样式随插件包提供。

### 5.3 新插件包 `marketplace/plugins/data-preview/`

- 包名 `@worm-print-platform/plugin-data-preview`，依赖 plugin-kit / core。
- `src/index.ts`：`import` 即 `registerFieldActionUI(DATA_PREVIEW_ACTION)`；`src/marketplace.ts` 提供市场元数据。
- `src/describe.ts`：纯函数，把根数据解析为“总览行 + 子 tab 定义 + 表单/表格视图描述”，可独立单测。
- `src/ui.ts`：渲染多 tab 弹窗（tab 栏、总览表、表单、表格、跳转），自行管理弹窗生命周期。
- `src/__tests__/`：形态判别、tab 生成、跳转、无 fields 回退、不分页。
- 按市场规范接入 `marketplace/marketplace.json` 索引。

> Vue 3 门面（另一仓库）需在后续对齐同一扩展点；本仓为权威实现，parity 测试留主仓。

## 六、关键决策（本方案的选择，请评审）

1. **插件方式**：新增 plugin-kit 扩展点 + 独立插件包；canvas 核心只加挂载点。（已确认）
2. **多 tab**：首项“总览”，对象/数组型子属性生成子 tab，总览表可跳转子 tab。（已确认）
3. **视图判别**：按数据实际形态（对象→表单、数组→表格），`isList` 仅作提示。（已确认）
4. **不分页**：第一版表格一次渲染全部行。（已确认）
5. **预览根**：以被点击分组的数据 `data[0][group.key]` 为根（对齐“查看该数据源”）。**若期望总览展示全部根数据、子 tab 对应各分组，请指出**——这是唯一仍需确认的语义点。
6. **子 tab 层级**：第一版只展开一层。
7. **范围**：仅数据预览；issue 其余两项另案。

## 七、验收

- 单测：`describe.ts` 对象/数组/标量判别、子 tab 生成、跳转、无 fields 回退、不分页；字段树按钮存在且点击不折叠；插件注册/注销幂等。
- 手测：vue3 demo 打开“费用结算单”→ 点“系统信息”弹窗（总览 + 标量表单）、点“费用明细”弹窗（总览/表格）；构造嵌套对象数据验证子 tab 与“查看 →”跳转；大数组验证不分页。

## 八、范围外

- 字段列表去掉灰色 `(fieldKey)` 小字（issue 第 1 点）。
- 自定义函数注册接口（issue 第 3 点）。
- 数据编辑、分页、深层递归 tab。

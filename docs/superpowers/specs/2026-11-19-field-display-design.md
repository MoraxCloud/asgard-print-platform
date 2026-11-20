# 字段显示模式配置设计（素材台 / 表达式编辑器）

## 背景

素材台字段行与表达式弹窗「字段」页签当前固定同时显示「中文名 + 字段 key」。宿主有时只想显示其中一项。本设计把显示形态做成宿主可注入的三态配置，**设计器内不放开关 UI**。

原始需求中「默认只显示中文」已在本轮确认中作废，最终默认值为 `both`（存量行为零变化）。「隐藏字典名称」确认为「隐藏字段名称（中文名 fieldLabel）」的笔误。

## 已确认决策

| 项 | 决策 |
| --- | --- |
| 仓库范围 | 仅 `worm-print-platform`（canvas 为权威实现），不动 `worm-vue3-print`；PARITY.md 记录差异 |
| 配置来源 | 宿主注入，设计器内无 UI；一份配置统一传播到素材台与表达式弹窗 |
| 取值 | `label` / `key` / `both`，默认 `both`；非法值 trim + lowercase 后未识别一律静默回退 `both` |
| 宿主 API | `<print-designer field-display="...">` + property `fieldDisplay`；plugin-kit `ExpressionEditorOptions.fieldDisplay?` |
| 传播 | 自定义元素 attribute → `ShellState.fieldDisplay` → 素材台字段行 + `syncExpression` → `renderExpressionEditor` options |
| 弹窗页签范围 | 只作用于「字段」页签；系统变量、函数页签不受影响；分组名在任何模式下都不隐藏 |
| 隐藏的影响面 | 只改可见文本与样式；搜索、复制、提示、插入、拖拽语义全部不变 |
| key 样式 | 只显示 key 时，key 完全套用中文名样式；保留 `.node-key` / `.ee-item-key`，另加 `.is-primary` 修饰类 |
| 交付 | 代码 + 单测 + 帮助中心 changelog + 宿主契约文档（host-contract.ts 注释、canvas README 属性表、PARITY.md 差异） |

## 行为矩阵

| mode | 素材台字段行 | 表达式弹窗字段行 | 分组名 |
| --- | --- | --- | --- |
| `both`（默认） | `.node-label` + `.node-key`（key 带括号） | `.ee-item-label` + `.ee-item-key` | 两处都显示 |
| `label` | 只 `.node-label` | 只 `.ee-item-label` | 两处都显示 |
| `key` | 只 `.node-key.is-primary`，文本为裸 key（无括号） | 只 `.ee-item-key.is-primary`，文本为裸 key | 两处都显示 |

`fieldLabel` 为空时的回落：按现有复制口径用 `fieldLabel || fieldKey`，避免渲染空白行。

## 样式契约

- 素材台：`.node-key` 原为 11px / `--pd-text-muted`；`.is-primary` 改为 13px / `var(--pd-text, #303133)`，与 `.field-row` 继承的中文名样式一致；外围括号不再渲染。
- 表达式弹窗：`.ee-item-key` 原为 10px / `--pd-text-muted` / monospace；`.is-primary` 改为 12px / `var(--pd-text)` / 继承字族，与 `.ee-item-label` 一致。
- 样式唯一真源：`packages/core/src/styles/designer.css`；由 `npm run styles -w @worm-print-platform/canvas` 派生到 shadow DOM 样式表（生成文件不入库）。

## 不变项（逐条）

- 搜索仍同时匹配 `fieldLabel` 与 `fieldKey`，隐藏哪一项都不改变命中。
- 素材台单击仍复制 `fieldLabel || fieldKey`；表达式弹窗复制按钮仍复制中文名，图标与 `data-tip` 两态不变。
- 整行 `data-tip` 仍为完整「中文名 (key) · 单击复制字段名 · 拖动中按住 Ctrl（Mac 为 ⌘）切换为插入字段名」。
- 双击字段仍按 `field.fieldKey` 插入 `{key}`；Ctrl/⌘+双击插中文名不变。
- 拖拽载荷 `fieldKey`、`effectAllowed='all'` 不变。

## 宿主契约影响

新增一个 attribute 与一个 property 属 MINOR 变更：`PRINT_DESIGNER_CONTRACT_VERSION` 由 `1.2.0` 升到 `1.3.0`，`PRINT_DESIGNER_ATTRIBUTES` 增 `field-display`，`PRINT_DESIGNER_PROPERTY_NAMES` 增 `fieldDisplay`。plugin-kit 侧导出 `FieldDisplayMode` 与 `normalizeFieldDisplay`，canvas 复用同一份类型与归一逻辑，避免漂移。

# 设计：图表插件多语言完善（方案 A）

日期：2026-11-21
状态：待批准

## 意图

图表插件三语种语言包（zh/en/th，135 键）已齐全且 parity 通过，但**界面上仍有多处硬编码中文**未走翻译。本次修掉所有"用户能看到却没翻译"的文案，**不动会写进模板数据的出图内容**。

## 范围（方案 A）

### 1. 标签预设与位置选项（label.ts）
`LABEL_PRESETS`（4 项）与 `LABEL_POSITIONS`（按 seriesType 共 32 项）的 `label` 是硬编码中文，直接进下拉框。语言包已有 `echarts.label.k104~k139` 共 36 个键，与这些项**按顺序一一对应**（中文值逐字核对通过）。

- 做法：把这些常量的 `label` 改为**语言包 key**（新增 `labelKey` 字段），渲染时经 `t(labelKey)` 解析。
- 不改 `value`/`formatter`（这些是写入 option 的数据语义，保持原样）。

### 2. 图表种类 label 与 notes（kinds.ts）
- `label`（柱状图…）：已有 `labelKey`，但 `plugin.ts` 注册时用的是 `def.label`（中文）。改为 `t(def.labelKey)`，使 AI 元数据/注册表拿到当前语言的名称。
- `notes`（十段 AI 提示长文）：硬编码中文，语言包无对应键。新增 10 个键 `echarts.notes.k146~k155`（三语种都补），`notes` 改为 `notesKey`，注册时经 `t(notesKey)` 解析。

### 3. 不做的部分
- `defaults.ts` 的 `name: '数量'`：这是出厂 option 的数据系列名，会写进模板 JSON 并参与出图，属数据内容，保持中文不变。
- 语言包 135 键 parity 已通过，不改动既有键。

## 技术要点
- i18next 配置的 `t()` 在模块加载期求值的常量（如 label.ts 顶层数组）会冻结语言——与 core/canvas 既有经验一致：常量存 key，渲染时取词。
- `label.ts` 顶层导出 `LABEL_POSITIONS`/`LABEL_PRESETS` 被 `ui.ts`、`kit.ts` 消费；改字段后需同步更新消费点。
- 新增 notes 键需三语种（zh/en/th）都补齐，保持 135→145 键 parity。

## 验证
- TDD：先写失败测试（切 en/th 后下拉选项、kind label/notes 为对应语言），RED→GREEN。
- 三方 parity 校验（145 键）、插件全测试、全仓 `npm test`。

## 风险
- notes 为长文本，AI 直译（用户已接受质量口径）。
- `t()` 需在渲染上下文调用，避免在模块加载期取词导致冻结。

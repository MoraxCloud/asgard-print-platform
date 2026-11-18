# 快递面单示例修复 + 校验器/技能加固 设计

日期：2026-11-18 · 规模：小改动 · 已选方案：B（文档 + 校验器加固）

## 意图与依据

上一轮对比中发现：`express-waybill` 示例的二维码压住分隔线与打印时间文字，而技能依赖的 `print_inspect_layout` 因两类原因没能完整拦住它——把全宽分隔线误报为背景层（噪声），又因线类被排除在重叠判定外而漏报"线穿码"。本次在修复示例的同时加固判据，使下次用技能判定时可自动发现同类问题。

## 目标

1. 示例出纸不再出现二维码与分隔线/打印时间文字重叠。
2. `inspectTemplate` 不再把 `hline` / `vline` 误报为 `BACKGROUND_NOT_PAGEABLE`。
3. `inspectTemplate` 能报出"线类穿过二维码/条码"，且为 error（破坏识读，危害等同出纸被裁）。
4. 技能文档与 MCP 工具描述同步新判据。

## 非目标

- 不改 core 渲染管线、条码/二维码渲染逻辑。
- 不改 `print_validate_template` 的契约规则，只动静态体检 `inspectTemplate`。
- 不处理 `batchData` 真实性、边距风格、缺 `testData` 等上一轮列出的次要项（本次保持外科手术式修改）。
- 不强制清零 `BARCODE_MISSING_BAR_HEIGHT` 等存量 warning。

## 约束

- `demos/apps/{vue3,vue2,react,jquery}/src/templates.js` 必须同 MD5，由 `npm run samples:demos` 同步；只改 vue3 源文件。
- `InspectCode` 是导出的联合类型，新增码值必须同步到类型与工具描述。
- 几何容差沿用 `toleranceMm`（默认 0.2mm）。

## 实施步骤

### 1. 模板修复

`demos/apps/vue3/src/templates.js`：`ew-10` 二维码 `height: 24 → 18`（底边 76→70mm，与右侧信息块对齐，让出 71mm 分隔线与 72mm 打印时间）。随后运行 `npm run samples:demos` 同步其余三宿主。

### 2. 校验器加固 `packages/contract/src/inspect.ts`

- **消除误报**：从 `BACKGROUND_CANDIDATE_TYPES` 移除 `hline`、`vline`；`rect` / `oval` / `image` 仍按原"占版面 ≥80%"判据。
- **补漏报**：`InspectCode` 新增 `LINE_OVER_CODE`（level=error）。在现有重叠检测之后，对 `hline` / `vline` 与 `barcode` / `qrcode` 做矩形相交判定；线类交叉轴厚度取 `max(声明值, 0.2)mm`，容差沿用 `toleranceMm`；相交时在线元素路径上报一条，message 写明两元素的 id 与类型。
- 选 error 的依据：全量示例扫描仅此一处命中，修复后归零；线穿码直接破坏码图识读，不应作为可忽略的兼容警告。

### 3. 测试 `packages/contract/src/__tests__/inspect.test.ts`

- 全宽 `hline` 不再产生 `BACKGROUND_NOT_PAGEABLE`；全宽 `rect` 仍产生。
- `hline` 穿过 `qrcode` 报 `LINE_OVER_CODE` / error；不相交不报；`vline` 穿过 `barcode` 同样报。
- 现有 12 组断言全部保持通过。

### 4. 技能与工具描述同步

- `skills/worm-print-platform-mcp/references/layout-recipes.md`：配方四补"二维码高度预算"；避坑清单新增"线穿码"条目。
- `skills/worm-print-platform-mcp/SKILL.md`：`print_inspect_layout` 能力说明补 `LINE_OVER_CODE`，写明该 error 必须修、且静态体检不替代视觉回读。
- `packages/mcp/src/tools.ts`：`print_inspect_layout` 的 description 补新码值。

## 验收

- `npm test -w @worm-print-platform/contract` 全绿。
- 用 core 同构管线本地重渲染示例，肉眼确认二维码不再压线压字；重跑体检确认 `express-waybill` 的 `ELEMENT_OVERLAP` 与 `LINE_OVER_CODE` 均消失。
- 四份 `templates.js` MD5 一致。
- `git diff` 审查：仅上述文件，无无关重构。

# 设计器状态栏：移除保存指示、显示版本号

日期：2026-11-18
状态：已批准，实施中

## 意图

设计器底部状态栏当前显示 `缩放 X% · 元素 X · 未保存/已保存 · 纸张信息`。移除中间的
"未保存/已保存"指示，在原位置显示设计器当前版本号（canvas 包版本 `1.5.2`）。

## 目标 / 非目标

- 目标：状态栏不再显示 `status-dirty` 指示，改为显示 `v<包版本>`。
- 非目标：不改 `store.dirty` 数据层（`save()` 仍重置它，校验/事件语义不变）；不改顶部工具栏、纸张信息等其余状态项。

## 关键事实

- 指示来自 `packages/canvas/src/shell/panels.ts` 的 `renderStatusBar` 中 `.status-dirty` span（约 298-301 行）。
- `store.dirty` 在 `core/store.ts` 定义、`save()`（`print-designer.ts:551`）重置，属数据层，保留。
- 项目无现成运行时版本常量；单一真源是 `packages/canvas/package.json` 的 `version`。
- 已有"构建前脚本派生源文件"模式：`scripts/gen-styles.mjs`、`gen-icons.mjs`；样式权威源在 `core/src/styles/designer.css`，canvas 侧由脚本派生。

## 方案

1. 新增 `packages/canvas/scripts/gen-version.mjs`：读 canvas `package.json` version，生成 `src/version.ts`
   （导出 `CANVAS_VERSION = '1.5.2'`），并挂到 `package.json` 的 `npm run styles` 脚本链，
   保证每次 build/test 都从单一真源派生、不漂移。`src/version.ts` 随仓库提交。
2. `renderStatusBar`：移除 `.status-dirty` span，在原位置插入 `v${CANVAS_VERSION}` 文本，复用 `.status-item` 样式。
3. 清理 `core/src/styles/designer.css` 中的 `.status-dirty` / `.dirty-dot` / `@keyframes dirty-pulse` /
   对应 `@media (prefers-reduced-motion)` 死规则，再重跑样式派生同步 canvas 侧。
4. 保留 `store.dirty` 字段与 `save()` 重置逻辑，仅移除 UI 显示。
5. 测试：新增断言——状态栏含 `v1.5.2` 版本号、不含"已保存/未保存"文本。

## 验收

- `npm run build -w @worm-print-platform/canvas` 通过；canvas 全量测试通过。
- Playwright 打开 demo，确认状态栏显示 `v1.5.2`、无"已保存/未保存"，其余状态项（缩放/元素/纸张）正常。

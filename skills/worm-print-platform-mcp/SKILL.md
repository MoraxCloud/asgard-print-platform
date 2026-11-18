---
name: worm-print-platform-mcp
description: Use when 用户需要通过浏览器设计器、桌面客户端和 AI Agent 的 MCP 链路生成、校验或修改正在编辑的打印模板。
---

# worm-print-platform 实时画布 MCP 协作

只使用“浏览器设计器 ↔ 桌面客户端 ↔ AI Agent”链路。先确认桌面客户端已开启「AI 助手」、宿主页面已注册模板会话，并通过 `tools/list` 核对工具；不要凭文档猜测连接已经可用。

## 1. 能力边界

桌面客户端提供 5 个纯计算工具、4 个模板会话工具、1 个视觉回读工具和 2 个参考图工具：

- `print_element_kinds`：**当前可用元素种类（内置 + 插件注册态）**、布局配方 preset 清单、表达式函数、系统变量和单位速查。这是元素类型的唯一权威来源，不要按固定数量假设；可选包（如 `@worm-print-platform/echarts`）注册的类型会带 `requiredOptionKeys` 与 `notes`。
- `print_draft_template`：生成模板草稿并附校验结果；常见单据/标签/小票/面单优先传 `preset`。
- `print_validate_template`：模板契约校验。
- `print_check_expression`：表达式语法、白名单和字段检查。
- `print_inspect_layout`：静态几何与结构体检，含线穿码 `LINE_OVER_CODE`（error）。
- `print_preview_template`：把模板渲染成单页 PNG 返回，并附每个元素的实际渲染包围盒；写回前看图自评版式。
- `print_analyze_reference_image`：把设计稿图片转成几何数据（内容区/线条/文本行/表格网格），做模板前先取基准。
- `print_compare_with_reference`：渲染结果与参考图逐线比对，先比内容区在整幅图像中的位置（抓整版平移），再输出偏差、多余与缺失的线。

`print_preview_template` / `print_compare_with_reference` 在桌面客户端本地渲染，但模板引用的远程图片/字体会真实触网（`openWorldHint: true`）；`print_analyze_reference_image` 只读本地图片路径，不访问网络。
- `print_list_open_templates`：列出已签到的设计器页面。
- `print_get_open_template`：默认读取完整快照；小改优先 `view=summary`，用 `elementIds/includeFields` 精简元素与字段。
- `print_patch_open_template`：按元素 ID 原子批量更新或移动，一次写回并返回新 revision。
- `print_apply_open_template`：校验后整份写回实时画布。

配置见 [桌面客户端接入](references/desktop.md)。模板字段与单位见 [模板 Schema](references/template-schema.md)，常见纸张布局见 [布局配方](references/layout-recipes.md)。

## 2. 实时修改主流程

1. 调用 `print_list_open_templates`；有多个页面时必须选择目标 `sessionId`，不要猜测。
2. 小改调用 `print_get_open_template` 的 `view=summary`，按需要用 `elementIds/includeFields` 过滤并保留 `revision`。
3. 调用 `print_element_kinds` 核对当前契约（含可选包注册的元素类型与必填属性），不要把元素种类写死。
4. 小改把全部 `updateElement/moveElement` 操作一次交给 `print_patch_open_template`；工具内部会执行契约和封禁元素校验。连续修改直接使用上次返回的新 revision，不重复读取完整模板。
5. 新模板或复杂重排才读取完整快照：**有设计稿时先用 `print_analyze_reference_image` 拿线条/表格坐标**，据此手排 elements 或选用匹配的 `preset`，不要凭目测估坐标；保留宿主业务字段，执行 `print_validate_template` 和 `print_inspect_layout`。
6. `print_preview_template` 看渲染图自评版式（对齐、密度、留白、溢出、条码、线穿码），并用返回的 `elementBoxes` 核对实际落位是否等于模板里写的坐标；有参考稿时再调 `print_compare_with_reference` 做逐线验收。发现问题先修再预览。**必须传足量样例 `printData`**（表格要真实展开数行）：表格下方元素的落位、跟随区下移只有展开后才验得出，静态体检不判；缺数据时表格与绑定渲染为空。**动态表格（`dataSource`）还要做保存往返验收**：把画布实测高度回写 `options.height` 后再预览一次，两版下方元素落位应一致（见 §3）。
7. 整份替换才用 `print_apply_open_template`（携带 `baseRevision`）；成功后以返回的新 revision 和模板为准。
8. 在设计器核对画布与预览。移动元素后若需静态体检，读取最新完整快照再检查；静态体检不等于真实分页。

详细异常处理见 [协作工作流](references/workflows.md)。

## 3. 写回与预览约束

- `LINE_OVER_CODE` 属 error，命中必须清零（线穿码会破坏扫码）；但静态体检只看写死坐标，不判真实换行、表格展开与分页，`print_preview_template` 视觉回读不可省。
- `updateElement.changes` 浅合并到元素 `options`；`moveElement` 的 `x/y` 对应 `options.left/top`，单位 mm。
- Patch 任一操作失败会整批拒绝；`print_apply_open_template` 仍是带 `baseRevision` 的整份替换。
- `REVISION_CONFLICT` 表示读取后画布又发生变化。重新读取并请用户确认差异，不自动覆盖或循环强制写回。
- 页面关闭或客户端退出后会话失效；先重新列出会话，不向失效会话重试写入。
- `print_preview_template` 走客户端完整渲染管线，分页、长文本换行与条码都是真实效果；像素尺寸以返回值为准。写回后仍需设计器或打印预览做最终确认，交付时说明实际执行过的校验、预览与写回结果。
- **预览用的是模板当前值，不模拟设计器保存**：画布的 `measureTableDom()` 会把 `<table>` 实测高度回写 `options.height`（差 >0.1mm 即回写），`dataSource` 表若把 `height` 只声明为静态行高合计，回写后设计底部后移、下方元素掉出跟随区，而**回写前预览完全正常**。因此动态表格必须验两次：先按原值预览，再把"表头 + data 行高 × 样例行数 + 小计/合计"作为 `height` 回写后重预览；两版下方元素都在表格之下才算通过。

## 4. 硬约束

- 坐标和尺寸使用 mm；`fontSize`、`lineHeight`、`borderWidth` 使用 pt；条码模块数不是长度。
- 表达式写 `{order.no}` 或 `{MONEY(amount)}`，不写 `${...}` 或 JavaScript 控制流。
- 模板只描述版式，业务数据单独提供；保留宿主已有业务字段和未要求修改的布局。
- **手排 elements 整份写回时按[设计态兜底](references/template-schema.md)给默认值**：码类 `testData`、表格非空 `tableRows` + `tableColWidths`、图片 `src`——否则画布不显示真实内容（码只出文字、表格无行、图片只有占位框）；`print_draft_template` 生成的元素已由元素工厂补默认值，无需重复给。
- **表格下方元素的 `top` ≥ 表格设计底部（`top + max(height, tableRows 行高合计)`）+ 1~2mm 间隙**，才会进跟随区随数据展开下移；`dataSource` 表的 `height` 按画布展开态声明（≈ 表头 + data 行高 × 画布预览行数 + 小计/合计），不能只写 `tableRows` 静态行高合计。判据不成立时下方元素按绝对定位渲染，真实数据展开后落进表格；刻意层叠覆盖（水印、角标）例外。详见[布局配方避坑 11](references/layout-recipes.md)，并按 §3 做保存往返预览。
- MCP 不调用模型、不持有模型密钥；模型和工具循环归宿主 Agent。

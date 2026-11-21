# 采购订单模板重设计 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把当前设计器里的模板替换为 A5 横向采购订单，供应商联系信息、收货人联系信息和订单号放在每页重复的页眉区。

**Architecture:** 不改动任何源码；通过桌面客户端 MCP 的模板会话工具链完成。以当前打开页面的 `templateJson` 为基底，重构 `header`（每页重复）与正文元素，保留业务字段绑定与样例数据，先离线校验与渲染预览，再用 `baseRevision` 整份写回画布。

**Tech Stack:** MCP 工具 `print_get_open_template` / `print_check_expression` / `print_validate_template` / `print_inspect_layout` / `print_preview_template` / `print_apply_open_template`。

**Spec:** `docs/superpowers/specs/2026-11-20-purchase-order-template-design.md`

## Global Constraints

- 纸张 A5 横向（210×148mm），四边边距 10mm，`unit: "mm"`。
- `header.height = 28`，`footer.height = 10`；内容宽 190mm，内容区可用高约 90mm。
- 坐标 / 尺寸单位 mm；`fontSize`、`lineHeight`、`borderWidth` 单位 pt。
- 表达式写 `{字段}` 或 `{FUNC(字段)}`，不用 `${...}`，不写 JavaScript 控制流。
- 表格 `tableColWidths` 合计必须等于元素 `width`；`tableRows` 至少含 header + data 各一行，表头行 `repeatOnPage: true`。
- `html` 元素封禁，不可使用。
- 保留字段：`order.no`、`supplier.name`、`supplier.phone`、`supplier.address`、`receiver.name`、`receiver.phone`、`receiver.address`、`goods.*`。
- 写回必须使用**紧邻读取**得到的 `revision` 作为 `baseRevision`。

## Review Focus

1. **续页页眉缺失**：明细 50 行必然分页，第 2 页必须仍见供应商 / 收货人 / 订单号 → Task 4 对 `page=2` 预览并核对图像。
2. **页眉挤压明细区**：页眉 28mm 若计算错误会导致表格落位下移或末行掉出 → Task 2 精确扣减版心，Task 3 `print_inspect_layout` 无 `OUT_OF_PAPER`，Task 4 看末页。
3. **未知字段 / 非法表达式**：新写的 `{supplier.*}` / `{receiver.*}` / `COUNT` / `SUM` 必须与字段树一致 → Task 3 用完整 `knownFields` 跑 `print_check_expression`，要求 `unknownFields: []`。
4. **表格列宽不符**：沿用原表时 `tableColWidths` 合计须为 190 → Task 3 校验无 `TABLE_COL_WIDTH_MISMATCH`。
5. **revision 冲突**：读取到写回之间用户可能改画布 → Task 5 写回前重新 `print_get_open_template` 取最新 `revision`，冲突则重读并请用户确认。

---

### Task 1: 读取当前快照与样例数据

**Files:** 无（MCP 只读操作）

**Interfaces:**
- Consumes: 已打开的会话 `t4BHqjS0d96CUDKLyoltgbyI`（会话清单中唯一页面）。
- Produces: `baseTemplateJson`（完整模板）、`baseRevision`、`printData`、`fields`、`goodsTableElement`。

- [ ] **Step 1: 调用 `print_get_open_template` 读取完整快照**

参数：`{ sessionId: "t4BHqjS0d96CUDKLyoltgbyI", view: "full" }`

- [ ] **Step 2: 断言快照可用**

断言：`session.sessionId` 与传入一致；`templateJson.paperSize === "A5"`；`orientation === "landscape"`；`templateJson.elements` 中存在 `id === "el-1787389745878-spvkfd"` 的商品明细表；`printData.goods` 为数组且长度 ≥ 10。任一不满足则停止并报告。

- [ ] **Step 3: 记录基底数据**

保存 `revision` 为 `baseRevision`；保存 `templateJson` 为 `baseTemplateJson`；保存 `printData` 与 `fields` 供后续校验和预览使用。记录商品表当前的 `tableRows` / `tableColWidths` / `cells[].formatter`，作为重建时直接复用的依据。

---

### Task 2: 构造新模板 JSON

**Files:** 无（内存对象）

**Interfaces:**
- Consumes: Task 1 的 `baseTemplateJson`。
- Produces: `newTemplateJson`（符合 A5 横向采购订单契约）。

- [ ] **Step 1: 克隆基底**

`structuredClone(baseTemplateJson)`。保留 `unit`、`paperSize`、`orientation`、`margins`、`watermark`、`guides`、`footer` 及 `fields` 相关结构不变。

- [ ] **Step 2: 重建 `header`（每页重复，高 28mm）**

`header.height = 28`，`header.elements` 依次为：

| 元素 | type | left | top | width | height | formatter / 要点 |
|---|---|---|---|---|---|---|
| 标题 | text | 0 | 0 | 80 | 8 | `采购订单`，fontSize 15，fontWeight bold |
| 订单号 | text | 100 | 0 | 90 | 8 | `订单号：{order.no}`，fontSize 11，textAlign right |
| 供应商 | text | 0 | 9 | 95 | 6 | `供应商：{supplier.name} 电话：{supplier.phone}`，fontSize 9 |
| 供应商地址 | text | 0 | 15 | 95 | 6 | `地址：{supplier.address}`，fontSize 9 |
| 收货人 | text | 100 | 9 | 90 | 6 | `收货人：{receiver.name} 电话：{receiver.phone}`，fontSize 9 |
| 收货人地址 | text | 100 | 15 | 90 | 6 | `地址：{receiver.address}`，fontSize 9 |
| 分隔线 | hline | 0 | 25 | 190 | — | `width` 表达长度，height 不参与 |

每个文本元素补 `fontSize`、`textAlign`、`verticalAlign: "middle"`、`lineHeight: 0`；不写 `html`。

- [ ] **Step 3: 重建正文 `elements`**

仅保留两项，顺序如下：

1. 商品明细表：直接复用 Task 1 记录的 `el-1787389745878-spvkfd` 整个元素对象（`left: 0`、`top: 0`、`width: 190`、`height: 40.22`、`tableRows`、`tableColWidths` 原样），确认表头行 `repeatOnPage: true`、汇总行保留 `{COUNT(goods.name)}` 与 `{SUM(goods.qty)}`。
2. 客户签字文本：复用 `el-1787402403366-ftd012`（`left: 110.784`、`top: 65.0208`、`width: 42.3`、`height: 5.3`、`formatter: "客户签字："`）。

删除原正文中的供应商/收货人/订单号元信息表（其信息已进页眉）。

- [ ] **Step 4: 确认页脚与版心**

`footer.height = 10`，页脚元素原样保留（图片 `images/goods-1.png`、页码 `{pageIndex}/{totalPages}`）。核对：`148 − 10 − 10 − 28 − 10 = 90mm` 可用内容高；签字元素底边 `65.0208 + 5.3 = 70.32 < 90`，表格设计底边 `40.22 < 90`，均落在内容区内。

---

### Task 3: 表达式校验与契约 / 版面体检

**Files:** 无（MCP 只读操作）

**Interfaces:**
- Consumes: Task 2 的 `newTemplateJson`、Task 1 的 `fields`。
- Produces: 校验通过的 `newTemplateJson`。

- [ ] **Step 1: 校验新增表达式**

对 `{order.no}`、`{supplier.name}`、`{supplier.phone}`、`{supplier.address}`、`{receiver.name}`、`{receiver.phone}`、`{receiver.address}`、`{COUNT(goods.name)}`、`{SUM(goods.qty)}` 逐个调用 `print_check_expression`，`knownFields` 传 Task 1 `fields` 中所有 `fieldKey`（须含 `order`、`order.no`、`supplier`、`supplier.*`、`receiver`、`receiver.*`、`goods`、`goods.name`、`goods.qty`）。

断言每个返回 `ok: true`、`syntax: "valid"`、`errors: []`、`unknownFields: []`。

- [ ] **Step 2: 契约校验**

调用 `print_validate_template({ templateJson: newTemplateJson })`，断言 `ok: true` 且无 `level: "error"` 的 issue。

- [ ] **Step 3: 版面静态体检**

调用 `print_inspect_layout({ templateJson: newTemplateJson })`，断言无 error：`OUT_OF_PAPER`、`LINE_OVER_CODE` 必须为零；`TABLE_COL_WIDTH_MISMATCH` 不得出现。warning 逐条确认不影响本次交付。

---

### Task 4: 渲染预览验收（含续页）

**Files:** 无（MCP 只读操作，返回图像）

**Interfaces:**
- Consumes: Task 2 的 `newTemplateJson`、Task 1 的 `printData`。
- Produces: 人工确认版式通过。

- [ ] **Step 1: 预览第 1 页**

调用 `print_preview_template({ templateJson: newTemplateJson, printData, page: 1, scale: 2 })`。看图确认：标题「采购订单」、订单号、供应商三行、收货人三行、分隔线、明细表头与数据行、合计行、签字栏、页码全部可见且无遮挡；页眉文字未溢出 95mm / 90mm 栏宽。

- [ ] **Step 2: 预览第 2 页**

同一参数、`page: 2`。看图确认：页眉三块信息（供应商 / 收货人 / 订单号）**仍然完整出现**，明细表头重复，内容未被页眉挤压或截断。若第 2 页缺页眉信息，返回 Task 2 检查是否误放正文区。

- [ ] **Step 3: 预览末页**

按 `printData.goods.length` 与可用高度估算总页数，预览最后一页，确认合计行与签字栏落位正常、无空白页异常。

---

### Task 5: 写回画布并回读确认

**Files:** 无（MCP 写操作）

**Interfaces:**
- Consumes: Task 2 的 `newTemplateJson`。
- Produces: 设计器画布中的新模板与新 `revision`。

- [ ] **Step 1: 重新读取最新 revision**

再次调用 `print_get_open_template({ sessionId: "t4BHqjS0d96CUDKLyoltgbyI", view: "summary" })`，取 `revision` 作为 `baseRevision`。若与 Task 1 的 `baseRevision` 不同，说明用户期间改过画布：停止，向用户展示差异并请求确认，不自动覆盖。

- [ ] **Step 2: 整份写回**

调用 `print_apply_open_template({ sessionId: "t4BHqjS0d96CUDKLyoltgbyI", baseRevision, templateJson: newTemplateJson, reason: "重设计为每页带供应商/收货人/订单号的采购订单" })`。断言返回 `ok: true`、`issues: []`、`warnings: []`，记录新 `revision`。

- [ ] **Step 3: 回读确认**

调用 `print_get_open_template({ view: "full" })`，断言：`header.height === 28`；`header.elements` 中含 `采购订单`、`{order.no}`、`{supplier.name}`、`{supplier.phone}`、`{receiver.name}`、`{receiver.phone}` 对应 formatter；正文只含商品明细表与客户签字；页脚页码仍在。

- [ ] **Step 4: 告知用户**

报告写回成功、新 revision、已执行的校验与预览，并提醒可在设计器用一次「撤销」回退。

---

### Task 6: 归档与交付说明

**Files:**
- Modify: `docs/superpowers/specs/2026-11-20-purchase-order-template-design.md`（若预览发现设计需微调，更新对应段落）
- Create: 无

- [ ] **Step 1: 设计方案与实际结果对齐**

若 Task 4 预览导致版式参数调整（如页眉高度、栏宽），把最终值回写设计文档的「设计」段落，确保文档与画布一致。

- [ ] **Step 2: 交付说明**

用中文向用户说明：最终布局、每页可见信息的实现方式（页眉重复）、实际跑过的校验 / 预览 / 写回结果、撤销方式，以及未改动业务字段与样例数据。

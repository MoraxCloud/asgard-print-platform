# Gitee issues 核查（来源：gitee.com/liulong_oschina/worm-vue3-print/issues）

> 核查日期 2026-11-17。本仓为 canvas 权威实现（v1.5.1），由 worm-vue3-print 拆仓分叉而来，
> 议题针对 canvas/core 1.4.8。逐项在本仓验证是否存在同类问题。

## 确认存在（缺陷）

### #IKVLU4 固定纸上宽元素未超出纸面却被拆到第二页 —— 存在
- 现象：自定义纸（如 80×60mm）上横贯多列的文本，绝对底边在本页可用高度内，预览仍整段挪到第二页。
- 根因：`packages/core/src/render/pagination-engine.ts:559` 的 `depthIn(x)` 把横向相交列的已占高度**累加**；
  `:601 remainingIn()`、`:871` 的 `elHeight <= remainingIn(x)` 只用元素自身高度对比剩余预算，
  没有用元素自身的 `outerBottom` 判断是否落在页内。宽元素同时压到左文字与右二维码时，两侧高度被相加
  再加 `SAFETY_MARGIN = 2`（`:30`），越过预算即整段换页。
- 验证：已用临时分页测试复现（80×60 纸、宽 78mm 文本底边 45mm 在本页内），结果被拆到第 2 页；测试已删除。
- 说明：本仓已有的二维预算修复（`#IKOUJI`）只解决"横向不相交元素互不占高"，不覆盖"单个宽元素横跨多列"的情形。

### #IKVLXT 没有打印数据时预览显示表达式原文 —— 存在
- 现象：`printData` 为空/缺字段时，预览显示 `物料名称：{ItemName}` 原文，看不出绑定是否生效。
- 根因：`packages/core/src/render/expression-eval.ts:103-125` 单个 `{expr}` 求值失败时保留原表达式文本；
  `packages/canvas/src/vue3/PrintHtmlPreview.ts:102-108` 把 `printData` 原样传给 `renderHtmlPages`，无示例值兜底。
  模板元素无"示例值"属性，`designData`（element-definitions.ts:24、host-contract.ts:44）仅用于设计态画布占位，不进预览。
- 期望未满足：缺字段时用示例值并标明为示例，真实数据优先。

### #IKVLZT 设计器不跟随宿主浅色/暗色 —— 存在
- 现象：`--pd-*` 变量缺省全是浅色，组件不读 `prefers-color-scheme`，无内置暗色主题。
- 证据：`packages/core/src/styles/theme.css` 仅一套 `:root` 浅色令牌，无暗色变量集；全局无 `prefers-color-scheme`。
  `packages/canvas/src/host-contract.ts:114-123` 仅说明宿主可自行覆盖部分 `--pd-*` 令牌。
  changelog（canvas/src/shell/help-content/changelog.ts:201）"换深色不再出现白色死角"只指属性台控件接入了变量，
  并非提供成套暗色预设或自动跟随。
- 期望未满足：内置一套暗色变量，或明确列出暗色模式下需覆盖的完整 `--pd-*` 清单。

## 部分存在（有缓解但未完全解决）

### #IKVLXY 素材区图标/面板不能由宿主替换 —— 图标已可替换，隐藏页签不支持
- 图标方面已解决：`packages/canvas/src/core/element-definitions.ts:37-78` 图标改为 lucide 图标名 + 统一注册表，
  宿主可用 `registerElementDefinition` 覆盖素材卡的图标/标签/分组（origin: custom）。
- 仍缺：`print-designer` 无"隐藏指定页签"的属性。`packages/canvas/src/shell/panels.ts:57-66` 的「元素/字段/图层」
  三个页签写死，`host-contract.ts` 的 attribute/property（`:23-53`）无隐藏页签项，宿主无法只显示部分栏。

### #IKVLXM 字段绑到已有文本操作容易用错 —— 已有替代入口，但无画布光标处直接插入
- 已有缓解（拆仓后新增）：素材台单击字段复制中文名（Gitee #IKRIZM）、表达式弹窗 Ctrl/⌘+双击插入中文字段名、
  素材台 Ctrl/⌘+拖拽生成静态文本元素（见 changelog V1.4.2、ctrl-field-label.spec.ts、field-tree.spec.ts）。
- 仍缺：议题期望"选中画布文本后，双击或拖入字段，默认在光标处插入 `{字段名}`"——本仓字段插入取值仍需
  点进右侧内容框/双击弹开表达式编辑器再双击字段（binding.ts:4、expression-editor.ts），画布上无直接插入光标入口。

## 需求类（非缺陷，暂不列为待修）

### #IKUJ0X checkbox 多选 / radio 单选打印元素 —— 未实现
- 内置元素仅 13 类（element-definitions.ts:62-78），无 checkbox/radio 打印元素；属功能需求，议题无描述。

### #IKRSXT 添加常用表格元素 —— 信息不足
- 已内置 `table` 表格元素（element-definitions.ts:67），议题正文为空，无法确认具体诉求。

---

# GitHub PR 核查待办（来源：github.com/worm-longliu/worm-vue3-print）

> 核查日期 2026-11-17。该仓与本仓同源分叉，但包名已全面改名（print-core→core、print-canvas→canvas、
> print-client→client 等），且本仓 canvas 为 Web Components 权威实现（目标仓仍以 Vue 轨为主），
> PR 无法直接 cherry-pick，只能手工按本仓架构移植。
>
> 核查结论：#11 表格按值合并、#12 MCP 参考图测量、#13 标尺修复、#14 文档 —— 均已迁入本仓，无需处理。
> **#15 已于 2026-11-17 按本仓架构移植完成**（core 层 + client + 设计器配套，提交 17bc5cd / e193531），
> 仅剩实体打印机逐页方向识别待硬件验收，登记如下存档。

## 已移植：PR #15「支持同纸型多页横纵向混排并完善裁切确认」（2026-11-17）

- 来源：PR #15（上游 OPEN）；功能：同一份多页模板中组合纵向封面 / 横向明细，按各页方向输出。
- 移植实现（未逐字照搬 diff，复用本仓 `buildBatchPageCss` 既有命名 @page 模式）：
  1. `pagePaperMm` 逐物理页出纸尺寸 —— `MultiPageDocument` / `PreparedDocument` /
     `BrowserRenderResult` / client 协议全链贯穿；`multi-template.ts` 校验放行旋转尺寸。
  2. 命名 `@page` 逐页方向绑定 —— `buildPageRuleCss` 加第三参 `pageName`，
     `composeMultiPageDocument` 逐页生成 `@page mt-N` + `.mt-N.print-page{page:mt-N}`；
     多页 `preferCSSPageSize=true`，每页按自身纸型测量。
  3. 裁切提示确认/取消 —— `save()` 格式校验通过后 `window.confirm`，
     确认继续保存 / 取消保留编辑内容。
- 配套：client 校验 pagePaperMm、混排拒绝 `print.landscape` 覆盖、介质按短边×长边声明；
  设计器新增页继承方向与内容旋转、纸型修改跨页共享；预览宽度取多页最宽出纸页。
- 验证：core 1420 / contract 103 / render 49（含真实 Chromium「纵→横→纵」批量出纸尺寸断言）/
  client 213 / canvas 455 项测试全部通过；`npm run build` 全仓成功。
- 范围限制（保留）：仅同一纸型内横纵混排，仍拒绝 A4/A3 混用、连续纸多页、多页拼版。
- **遗留：实体打印机逐页方向识别需目标驱动验收**（本机无对应硬件，无法自动化）。

---

# 插件市场（Git 仓库式分发）—— 方案已定，待实现

> 记录日期 2026-11-17。完整方案见 docs/plugin-marketplace-plan.md。

- 目标：索引仓库 + CLI 安装器 + qrcode 样板插件，打通「收录 → 安装 → 宿主加载」，无中心化服务端。
- 已定决策：独立索引仓库（先在本仓 marketplace/ 目录孵化，后手工建仓）；文件安装 +
  `.worm-print/plugins.json` 清单；新包 `@worm-print-platform/marketplace` 纳入 publish:npm；首个插件 qrcode。
- 复用点：packages/skills 双源/稀疏检出骨架；core/plugin-kit Symbol.for 注册表；echarts 插件样板。
- 状态：仅方案记录，未动代码。实现入口见方案文档「实施顺序」六步。

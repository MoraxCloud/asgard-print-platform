# Gitee issues 核查（来源：gitee.com/liulong_oschina/worm-vue3-print/issues）

> 核查日期 2026-11-17，2026-11-18 复查并标记完成状态。本仓为 canvas 权威实现（v1.5.2），
> 由 worm-vue3-print 拆仓分叉而来，议题针对 canvas/core 1.4.8。逐项在本仓验证是否存在同类问题。

## 状态总览（2026-11-18 复查）

| 编号 | 事项 | 状态 |
| --- | --- | --- |
| #IKVLU4 | 固定纸上宽元素被误判换页 | ✅ 已修复（bcea1ba） |
| #IKVLXT | 缺数据时预览显示表达式原文 | ✅ 已修复（8f9087e） |
| #IKVLZT | 设计器不跟随宿主浅色/暗色 | ✅ 已修复（2b5443c） |
| — | 打印预览按钮可以配置隐藏 | ✅ 已完成（5174b90 + demo 配置弹窗） |
| #IKVLXY | 素材区图标/面板不能由宿主替换 | ⚠️ 部分完成（图标已可替换，隐藏页签仍缺） |
| #IKVLXM | 字段绑到已有文本操作容易用错 | ⚠️ 部分完成（有替代入口，无光标处直接插入） |
| #IKUJ0X | checkbox / radio 打印元素 | ⏸ 需求类，未实现 |
| #IKRSXT | 添加常用表格元素 | ⏸ 信息不足 |
| PR #15 | 同纸型多页横纵混排 | ✅ 已移植，遗留硬件验收 |
| 插件市场 | 三源分发（Gitee/GitHub/npm，目录常驻本仓） | ✅ 已实现（2026-11-18，首个插件百度图表） |
| 导出插件（Excel/Word） | 新增需求·渲染结果的浏览器侧导出 | ⚠️ core 契约已实现，宿主菜单未接入 |

## 已修复

### #IKVLU4 固定纸上宽元素未超出纸面却被拆到第二页（提交 bcea1ba，2026-11-17）
- 现象：自定义纸（如 80×60mm）上横贯多列的文本，绝对底边在本页可用高度内，预览仍整段挪到第二页。
- 根因（修复前）：`packages/core/src/render/pagination-engine.ts:559` 的 `depthIn(x)` 把横向相交列的已占高度**累加**；
  `:601 remainingIn()`、`:871` 的 `elHeight <= remainingIn(x)` 只用元素自身高度对比剩余预算，
  没有用元素自身的 `outerBottom` 判断是否落在页内。宽元素同时压到左文字与右二维码时，两侧高度被相加
  再加 `SAFETY_MARGIN = 2`（`:30`），越过预算即整段换页。
- 修复：提交 `bcea1ba` 新增 `inflatedByDisjointColumns(x)` 检测并排互不相交列造成的虚假预算；首页元素改用
  自身底边 `settle.outerBottom <= contentHeight` 判断落页（仅首页生效，续页流式布局累加语义不变）。
- 验证：`pagination-engine.2d.test.ts:188-221` 新增 2 个针对性用例（底边在纸内留首页 / 底边越界仍换页），
  连同该文件共 11 项全部通过；core 全量 1418/1420 通过（另 2 项为 `executor-bundle.spec.ts` 缺
  `dist/node/index.js` 构建产物的既有问题，与本修复无关）。
- 说明：本仓已有的二维预算修复（`#IKOUJI`）只解决"横向不相交元素互不占高"，不覆盖"单个宽元素横跨多列"的情形。

### #IKVLXT 没有打印数据时预览显示表达式原文 —— ✅ 已修复（提交 8f9087e，2026-11-17）
- 现象：`printData` 为空/缺字段时，预览显示 `物料名称：{ItemName}` 原文，看不出绑定是否生效。
- 根因（修复前）：`packages/core/src/render/expression-eval.ts` 单个 `{expr}` 求值失败时保留原表达式文本；
  `packages/canvas/src/vue3/PrintHtmlPreview.ts` 把 `printData` 原样传给 `renderHtmlPages`，无示例值兜底。
- 修复：提交 `8f9087e` 为 `ElementOptions` 新增 `exampleValue` 字段，text/longText/barcode/qrcode 出厂带默认显示内容；
  `evaluateTemplate` 增加可选 `errorFallback`，仅在求值失败（缺字段）时整段回落；`bindElement` 按元素类型取示例值。
  真实数据优先、求值为空不触发。
- 验证：core / contract 补充 `exampleValue` 与回落逻辑的测试（data-binder、expression-eval），全量通过。
- 备注：期望中的"标明为示例"通过示例占位内容（如「示例文本」）体现，未做独立的"示例"角标 UI。

### #IKVLZT 设计器不跟随宿主浅色/暗色 —— ✅ 已修复（提交 2b5443c，2026-11-18）
- 现象：`--pd-*` 变量缺省全是浅色，组件不读 `prefers-color-scheme`，无内置暗色主题。
- 根因（修复前）：`packages/core/src/styles/theme.css` 仅一套 `:root` 浅色令牌，无暗色变量集；全局无 `prefers-color-scheme`；
  Shadow DOM 内 `.designer-container` 的令牌声明还会遮蔽外部变量。
- 修复：提交 `2b5443c` 新增 `theme`（`auto`/`light`/`dark` 预设）与 `theme-config`（色值覆盖对象）参数，
  内置暗色预设只改设计器外壳，纸张/画布背景/标尺/手柄保持原值；参数写入内部容器行内变量，优先级高于 CSS 令牌。
  同时补全主题令牌清单至 55 项，core 补齐 3 个此前仅有 fallback 的令牌，宿主契约升级至 1.2.0。
- 补充：四个 demo 顶部新增「配置」弹窗作参考实现（最终只暴露显隐开关，配色靠传参）；demo 内置「更新记录」补齐至 V1.5.2。
- 验证：core 1420 / canvas 478 项测试通过，`npm run build` 成功；四 demo 经 Playwright 点检 36 项全通过。

## 部分存在（有缓解但未完全解决）

### #IKVLXY 素材区图标/面板不能由宿主替换 —— 图标已可替换，隐藏页签不支持
- 图标方面已解决：`packages/canvas/src/core/element-definitions.ts` 图标改为 lucide 图标名 + 统一注册表，
  宿主可用 `registerElementDefinition` 覆盖素材卡的图标/标签/分组（origin: custom）。
- 仍缺：`print-designer` 无"隐藏指定页签"的属性。`packages/canvas/src/shell/panels.ts` 的「元素/字段/图层」
  三个页签写死，`host-contract.ts` 无隐藏页签项（2026-11-18 复查确认仍无），宿主无法只显示部分栏。

### #IKVLXM 字段绑到已有文本操作容易用错 —— 已有替代入口，但无画布光标处直接插入
- 已有缓解（拆仓后新增）：素材台单击字段复制中文名（Gitee #IKRIZM）、表达式弹窗 Ctrl/⌘+双击插入中文字段名、
  素材台 Ctrl/⌘+拖拽生成静态文本元素（见 changelog V1.4.2、ctrl-field-label.spec.ts、field-tree.spec.ts）。
- 仍缺：议题期望"选中画布文本后，双击或拖入字段，默认在光标处插入 `{字段名}`"——本仓字段插入取值仍需
  点进右侧内容框/双击弹开表达式编辑器再双击字段（binding.ts、expression-editor.ts），画布上无直接插入光标入口。

## 需求类（非缺陷，暂不列为待修）

### #IKUJ0X checkbox 多选 / radio 单选打印元素 —— 未实现
- 内置元素仅 13 类（element-definitions.ts），无 checkbox/radio 打印元素；属功能需求，议题无描述。

### #IKRSXT 添加常用表格元素 —— 信息不足
- 已内置 `table` 表格元素（element-definitions.ts），议题正文为空，无法确认具体诉求。

## 已完成：打印预览按钮可以配置隐藏
- 设计器侧：V1.5.2（提交 `5174b90`）已新增 `showPreview` / `showSave` 布尔开关（`show-preview` / `show-save` attribute），
  默认显示，置 `false` 隐藏，不影响 `save()` 与事件。
- 示例侧：本会话四个 demo 顶部新增「配置」弹窗，以两个开关演示显隐配置（提交 `bf718a3`/`6e576f3`/`34ceab7`/`d894b35`，
  vue2 修复 `f88dc3e`；配色控件已按需求从示例移除，见 `9fd6228`）。

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

# 插件市场（三源分发 + 导出插件）—— 方案已定，待实现

> 记录日期 2026-11-17；2026-11-18 变更需求。完整方案见 docs/plugin-marketplace-plan.md。

- 目标：marketplace/ 目录 + CLI 安装器 + qrcode 样板插件，打通「收录 → 安装 → 宿主加载」。
- 2026-11-18 需求变更（覆盖原决策）：
  1. **目录常驻本仓**：marketplace/ 永久留在当前 monorepo，不再创建独立索引仓库。
  2. **三源分发**：安装支持 Gitee、GitHub、npm 三种来源；默认 `auto` 依次尝试 npm → GitHub → Gitee。
     - npm：每个插件作为独立 npm 包发布（建议 scope `@worm-print-platform`，命名 `plugin-<id>`），
       按插件名只装一个。
     - GitHub / Gitee：从本仓两个远端稀疏检出 `marketplace/plugins/<id>/`，不新建仓库。
  3. **版本**：`install <name>[@<version>]`；不指定版本取**最新稳定版**（npm `latest` 标签或最高非预发布
     版本；git 取最高非预发布 tag，无 tag 回退主干并标注）。
  4. **新增导出插件类别**：导出 Excel / Word 等打印内容也必须可用插件实现；形态为「接收渲染结果、
     浏览器侧生成文件并下载」，core 需新增与元素插件并列的导出插件契约。
- 保留决策：文件安装 + `.worm-print/plugins.json` 清单；本地 `--repo ./marketplace` 直读源码；
  新包 `@worm-print-platform/marketplace` 纳入 publish:npm；首个插件 qrcode。
- 复用点：skills 双源解析 + 稀疏检出骨架（用于 GitHub/Gitee 源）及参数校验/错误码范式；
  core/plugin-kit Symbol.for 注册表 + echarts 插件样板。
- 状态：2026-11-18 已实现（提交 e0ebb9d → 7e4d2e6 等）：marketplace/ 索引 + 百度图表薄包装插件、
  `@worm-print-platform/marketplace` CLI（三源 + 最新稳定版）、core 导出插件契约、根脚本/文档/demo 接线；
  全量测试与端到端三源安装验证通过。实现细节见 `docs/superpowers/plans/2026-11-18-plugin-marketplace.md`。

---

# 抖音视频重录（2026-11-18 · 已完成）

> 三项按下列顺序完成；均走 `making-douyin-videos` 技能规范，产物目录由 `out-registry.json` 固定，重录不换目录。TTS、录屏与整链重跑耗时耗额度，执行前说明；不得自动上传抖音。片尾统一用浅色卡 `endcard-tail-light.png`（剧本末尾 `cta` 场景，先 `npm run video:endcard` 渲染）。

| 序号 | 任务 | 状态 |
| --- | --- | --- |
| 1 | 重录第二支「面单 / 价签批量出纸」视频 | ✅ 已完成（2026-11-18） |
| 2 | 体检报告模板：部分图表换成扩展的百度图表插件 | ✅ 已完成（2026-11-18） |
| 3 | 重录第三支「体检报告多页打印」视频 | ✅ 已完成（2026-11-18） |

## 1. 重录第二支视频

- 产物目录：`.video-skill/out/2026-11-17-batch-print/`（`out-registry.json` 已登记，重录仍用该目录）。
- 核心原因：录制时示例里的**二维码与其他元素重叠**，画面不合格，必须先修示例布局再录制。
- 技能规范：横屏 1920×1080，字幕短条最多两行、每行 20 字；多音字上下文确认 + 人工听审；四比例封面（含 4:3、3:4 必交）；抖音文案恰好 5 个不重复标签；音画同步与 `verify.mjs` 全绿。
- 剧本已新增统一 `cta` 片尾场景；重跑前确认 `endcard-tail-light.png` 已生成（`VIDEO_SCRIPT=$PWD/out/2026-11-17-batch-print/script-batch-print.json npm run video:endcard`）。
- 只改台词必须重跑配音及其后续步骤；不得静默重跑历史成片。
- **完成记录**：示例二维码重叠已在提交 `53361e9` 修复（面单二维码高度 24→18mm，避开分隔线与打印时间），现场量测确认不再重叠；剧本版本口径对齐 v1.5.2，新增「系 xì」多音字认下。整链重跑通过，`video_final.mp4` 122.7s / 1920×1080，音画同步、四封面、五标签、`verify.mjs` 全绿。
- 踩坑：cta 段密集英文/数字按字数均分字幕时间轴会把切点落进词里，音画同步判「语音残留 / 抢跑」；统一口播改为按句号断句（每句一条字幕），并把收尾长句拆成「都能接。」「示例整份照抄。」两句。共用 `subtitles.mjs` 另修一处缺陷：两短句合并后长英文词卡在可切区时会产出超宽单行，现要求合并后每行 ≤20 字才合并，技能源已同步并加回归测试（技能测试 12 项全绿）。

## 2. 体检报告模板改用百度图表插件

- 模板：`demos/apps/vue3/src/templates.js` 中 `id: 'health-report'`（起始约 1851 行）。当前三处图表是内联 SVG data URL（约 2952 / 3405 / 3770 行），把其中部分替换为扩展的百度图表插件元素（ECharts，`@worm-print-platform/echarts`）。
- 接入口径：`/kit` 为框架无关纯 TS 出口，`/ui` 为 plugin-kit 设计器 UI，宿主 `import` 即注册；保持 5 页结构、表格 / 合并单元格 / 字段绑定不变，只替换图表元素。
- 验收：设计器画布与浏览器预览出图一致；服务端 PDF、桌面客户端静默打印两条链路不被破坏；事实与版本号出片前重新核验。
- **完成记录**：四宿主 `templates.js` 同步。第 3 页血常规白细胞分类（源 `wbc`）改为 `barChart`、第 4 页生化血脂血糖趋势（源 `trends`）改为 `lineChart`；第 2 页参考区间条保留 SVG（即「部分」替换）。模板顶层声明 `plugins: [{ id: '@worm-print-platform/echarts', version: '2' }]` 进入契约 strict 通道；先注册图表 kit 后 `validateTemplateJson` 通过。浏览器实测设计态出示例图、预览 5 页按真实数据出图（柱状图中性粒 58.2、折线图 2022–2026），无页面错误。ECharts 库包保持独立发布，marketplace 插件仅副作用注册。

## 3. 重录第三支视频

- 产物目录：`.video-skill/out/2026-11-17-health-report/`（同上，不换目录）。
- 顺序依赖：必须在任务 2 完成后录制，画面要与改后的图表一致；台词 / 卡片 / 封面 / 文案同步更新，避免沿用旧 SVG 图表的说法。
- 同样走统一 `cta` 浅色片尾卡与技能全链验收（多音字听审、音画同步、四封面、五标签、`verify.mjs`）。
- **完成记录**：剧本台词/步骤/封面/文案同步到插件图表（血常规柱状图、生化折线图），新增「折 zhé」多音字认下；整链重跑通过，`video_final.mp4` 129.5s / 1920×1080，音画同步、四封面、五标签、`verify.mjs` 全绿；抽帧确认柱状图与折线图在成片中正常出现。

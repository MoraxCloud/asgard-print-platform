# 视频脚本：让 AI Agent 把打印插件接进你的 Vue3 项目

> 教学向，不为流量。抖音、B 站均发横屏 1920×1080 同一版；建议成片 13–15 分钟。
> 核心叙事：**先展示成品 → 再回放提示词生成过程 → 逐页验收**。
> 所有示例网址均为 GitHub Pages 托管地址。

---

## 1. 基础口径

| 项 | 取值 |
|---|---|
| 主题 | 用一段提示词，让 AI agent 在现有 Vue3 项目里生成打印插件接入示例（模板管理 + 设计器 + 业务打印） |
| 产品范围 | 整套链路，片中主线为**设计器接入 + 浏览器打印**；服务端 PDF / 静默打印只讲边界 |
| 宿主 | Vue 3，官方门面 `@worm-print-platform/canvas/vue3` |
| 出镜 agent | 不绑定具体工具，只演示「贴提示词 → agent 生成」 |
| 字幕 | 横屏每行 ≤ 20 字，最多两行；短句断点按句号切 |
| 顶部进度条 | 常驻画面顶部，按章节分 6 格，当前格高亮，观众可按需跳转 |
| 版本口径 | 仓库根版本 `1.6.0`，四个发布包同号同批；不写未发布能力为已发布 |

### 网址清单（叠字用）

| 名称 | 地址 |
|---|---|
| 示例总入口 | `https://worm-longliu.github.io/worm-print-platform/` |
| print-demo 首页（模板管理列表） | `https://worm-longliu.github.io/worm-print-platform/canvas/print-demo/` |
| 提示词模块页 | `https://worm-longliu.github.io/worm-print-platform/canvas/print-demo/print/plugin-intro` |
| 设计器页 | `https://worm-longliu.github.io/worm-print-platform/canvas/print-demo/print/template/design/<模板id>` |
| 业务打印页（体检报告） | `https://worm-longliu.github.io/worm-print-platform/canvas/print-demo/print/health-report` |
| 静默打印配置页 | `https://worm-longliu.github.io/worm-print-platform/canvas/print-demo/print/silent-config` |
| 开发技能页 | `https://worm-longliu.github.io/worm-print-platform/canvas/print-demo/print/dev-skills` |

> 注：demo 使用前端 history 路由，GitHub Pages 未配置 404 回退。录屏时从 demo 首页进入并**在站内点击跳转**，不要直接粘贴深层链接打开，避免 404。片中网址叠字保留完整路径，便于观众在站内找到入口。

---

## 2. 顶部章节进度条（按视频章节分格）

常驻画面顶部，格式：`01 成品速览 | 02 为什么要提示词 | 03 提示词从哪来 | 04 生成回放 | 05 逐页验收 | 06 边界与收尾`

| 格 | 章节 | 时间码 | 进度条文案 |
|---|---|---|---|
| 1 | 成品速览 | 00:00–02:20 | 先看成品 |
| 2 | 为什么要提示词 | 02:20–04:00 | 难在四周 |
| 3 | 提示词从哪来 | 04:00–05:20 | 网页可复制 |
| 4 | 生成回放 | 05:20–10:30 | 三段提示词 |
| 5 | 逐页验收 | 10:30–13:00 | 四步验收 |
| 6 | 边界与收尾 | 13:00–14:00 | 边界与入口 |

制作时把以上 6 格做成一条嵌在画面顶部的分段进度条；录制/合成按时间码切换高亮，导出时作为固定层叠加。

---

## 3. 分镜与口播稿

### 镜头 1 ｜成品速览（00:00–02:20）

**画面步骤**
1. 打开 `print-demo 首页`，停在模板管理列表。
2. 鼠标划过查询区与表格：名称/类型查询、名称/类型/备注/默认/操作列、分页。
3. 点「设计」进入设计器页，截图停留 2 秒展示画布与字段面板。
4. 返回，进 `业务打印页（体检报告）`，展示列表与「打印」。
5. 点打印，出现预览弹窗与浏览器打印对话框（按实际流程）。

**口播**
> 先别急着装包。你现在看到的这几个页面，不是我一行行手写的，是 AI agent 照着一段提示词生成出来的。
> 第一个是模板管理列表：按名称、类型查询，能新建、编辑、设默认、分页。
> 第二个是设计器：拖一拖，就出一张打印模板。
> 第三个是业务页：体检报告点一下，按模板渲染出来，直接打印。
> 今天这条片就讲一件事：怎么让 agent 在你的 Vue3 项目里，把这套东西完整生成出来。

**叠字**
- 画面左下角常驻：`https://worm-longliu.github.io/worm-print-platform/canvas/print-demo/`
- 顶部进度条高亮第 1 格。

---

### 镜头 2 ｜为什么要提示词（02:20–04:00）

**画面步骤**
1. 切到 `PROMPT.md` 在编辑器中的截图，缓慢滚动：门控、包版本、建表、枚举、后端契约、五个片段、验收标准。
2. 高亮「第 0 步：门控」「同号锁定 1.6.0」「elements 存 JSON 字符串」「五个必备片段」。

**口播**
> 自己接这套东西，麻烦不在拖拽，而在四周：包版本要同号锁；elements 必须存 JSON 字符串，不能拆表；同一业务类型只能有一个默认模板；后端契约是统一的 POST 加 ret、msg、data；前端五个片段，一个都不能少。
> 漏一个就跑不通。所以正确做法不是从零敲代码，而是把规范写成提示词，让 agent 先读规范、再动手。

**叠字**
- `PROMPT.md` 路径：`demos/apps/print-demo/PROMPT.md`
- 顶部进度条高亮第 2 格。

---

### 镜头 3 ｜提示词从哪来（04:00–05:20）

**画面步骤**
1. 打开 `提示词模块页`，从上往下滚：工具安装区 + 六个提示词模块卡片。
2. 点进「业务接入示例」模块，展示整段可复制提示词。
3. 悬停复制按钮（若页面有），或选中文本示意「可复制」。

**口播**
> 提示词不用你编。打开这个网页，插件介绍页里有现成的模块：技能接入、安装核心包、插件使用、静默打印、安装与离线回退，还有一段业务接入示例——它能直接生成刚才那套模板管理和业务打印页面。
> 每段都能单独复制。视频里我会按顺序贴三段给你看。

**叠字**
- 主叠字：`https://worm-longliu.github.io/worm-print-platform/canvas/print-demo/print/plugin-intro`
- 副叠字：`每段提示词可单独复制`
- 顶部进度条高亮第 3 格。

---

### 镜头 4 ｜生成回放（05:20–10:30）

**画面步骤**（建议用 agent 的真实历史对话录屏回放，按三段提示词分段）
1. 贴「技能接入」模块：agent 安装官方技能 → 读 SKILL.md 与 references → 输出「已读规范确认」。
2. 贴「安装核心包」模块：agent 安装 core / canvas / plugin-kit，锁同号版本，Vue3 走官方门面。
3. 贴「业务接入示例」模块：agent 建两张表、建字段注册表、生成四个页面。
4. 每段之间保留「agent 正在改文件」的过程剪辑，不做加速造假；关键文件切近景（注册表、`src/views/print/template/index.vue`、`src/views/print/health-report/index.vue`）。

**口播**
> 现在回放一遍。
> 第一步，贴技能接入。它先装官方技能、读规范，输出「已读规范确认」，门控过了才准改代码。
> 第二步，贴安装核心包。core、canvas、plugin-kit 锁同一个版本，Vue3 用官方门面，不用配 isCustomElement，也不用单独引 CSS。
> 第三步，贴业务接入示例。它建两张表、建字段注册表，再生成模板管理列表、设计器页、业务打印入口和预览弹窗。
> 注意我每次只贴一段，看着它一段一段落地。

**叠字**
- 每段提示词出现时，右上角固定叠字：`提示词来自 → .../print/plugin-intro`（完整 URL 见第 1 节）
- 三个模块标签依次叠字：`技能接入` / `安装核心包` / `业务接入示例`
- 顶部进度条高亮第 4 格。

---

### 镜头 5 ｜逐页验收（10:30–13:00）

**画面步骤**
1. 列表页：新建模板 → 保存 → 列表回填 elements。
2. 设计器页：改一处 → 保存 → 重新打开，确认能加载。
3. 业务打印页：选模板 → 打开预览，确认渲染出真实业务数据（含图表）。
4. 点打印，出现浏览器打印对话框。

**口播**
> 生成完不等于能用，验收四步。
> 第一，在列表里新建一个模板，保存后 elements 回填到列表。
> 第二，进设计器改一改再保存，重新打开还能加载出来。
> 第三，去体检报告业务页，选模板，预览渲染出真实业务数据，图表也在。
> 第四，点打印，走浏览器打印对话框。到这儿，设计器接入这条主线就通了。

**叠字**
- `保存 → 列表回填 → 设计器重载 → 预览渲染 → 浏览器打印`
- 顶部进度条高亮第 5 格。

---

### 镜头 6 ｜边界与收尾（13:00–14:00）

**画面步骤**
1. 回到提示词模块页，展示「静默打印」模块卡片（不展开演示）。
2. 展示片尾卡 `endcard-tail-light.png`（浅色版，横屏）。
3. CTA 口播期间保持片尾卡。

**口播**
> 边界也说清楚：这条片演示的是浏览器打印。服务端 PDF 和桌面静默打印，用静默打印那段提示词另接，本片不展开。提示词和可运行示例都在刚才那个网页，完整版在仓库的 PROMPT.md。
> MIT 开源，仓库叫 worm-print-platform。感谢大家的关注。可以在评论区留下您的建议和需求，欢迎大家讨论。

**叠字**
- `示例入口：https://worm-longliu.github.io/worm-print-platform/canvas/print-demo/`
- `完整提示词：demos/apps/print-demo/PROMPT.md`
- 顶部进度条高亮第 6 格。
- 片尾 CTA 逐字口径见 `making-douyin-videos/references/endcard-tail.md`，不得改写。

---

## 4. 提示词与源码对应关系

片中展示的提示词来自 `demos/apps/print-demo/src/views/print/plugin-intro/content.ts` 的 `MODULES`：

| 模块 id | 标签 | 片中用途 |
|---|---|---|
| `skill-setup` | 技能接入 | 镜头 4 第一段 |
| `core-install` | 安装核心包 | 镜头 4 第二段 |
| `plugin-usage` | 插件使用 | 备查，不展开 |
| `silent-print` | 静默打印 | 镜头 6 边界说明 |
| `business-example` | 业务接入示例 | 镜头 4 第三段（本次新增，用于生成模板管理 + 业务打印页面） |
| `install-fallback` | 安装与离线回退 | 备查，不展开 |

完整长提示词：`demos/apps/print-demo/PROMPT.md`。片中只展示可单独复制的模块，收尾给完整版路径。

---

## 5. 发布文案（两平台通用）

**标题候选（5 条，均 ≤30 字）**
1. 一段提示词，让 AI 帮你接入打印插件
2. Vue3 项目接入打印设计器：用 agent 生成整套页面
3. 模板管理 + 业务打印，让 AI agent 一次生成
4. 不手写代码：把打印插件接入交给 AI agent
5. worm-print-platform：Vue3 打印插件接入教学

**简介**
> 教学向。演示把一段提示词贴给 AI agent，在现有 Vue3 项目里生成打印插件接入示例：模板管理列表、设计器、业务打印页，并逐页验收。提示词与可运行示例都在 GitHub Pages：https://worm-longliu.github.io/worm-print-platform/canvas/print-demo/print/plugin-intro

**标签（恰好 5 个，不重复、不带空格）**
`打印模板` `Vue3` `前端开发` `开源项目` `AI编程`

**置顶评论**
> 提示词在示例站的「插件介绍」页，每段可单独复制；完整版在仓库 demos/apps/print-demo/PROMPT.md。深层链接请从 demo 首页点进去，直接打开可能 404。

---

## 6. 事实与出处（仅自检，勿上传）

| 说法 | 出处 |
|---|---|
| 根版本 1.6.0，四包同号 | `package.json:3`、`PROMPT.md:22-23` |
| 模板管理列表页存在且可查询/分页 | `demos/apps/print-demo/src/router/index.ts:12-16`、`src/views/print/template/index.vue` |
| 业务打印入口（体检报告） | `src/router/index.ts:25-29`、`src/views/print/health-report/index.vue` |
| 设计器用官方 Vue3 门面 | `PROMPT.md:39-49` |
| 提示词模块页地址 | `.github/workflows/deploy-pages.yml:46,63` + `src/router/index.ts:37-41` |
| 业务接入示例模块为本片新增 | `src/views/print/plugin-intro/content.ts` 的 `business-example` |

---

## 7. 制作前核对

- [ ] 按 `making-douyin-videos` 规范确认版本、数字、源码行号仍有效。
- [ ] 顶部 6 格进度条与时间码对齐，高亮切换无误。
- [ ] 字幕短条、最多两行、每行 ≤20 字。
- [ ] 片尾 CTA 逐字采用统一口径；多音字（如「发布」fā、「挂」guà）人工听审。
- [ ] 网址叠字完整；录屏从 demo 首页进入，避免深层链接 404。
- [ ] 两平台均横屏成片；封面沿用项目冻结版式，只改 `cover*` 字段。

# 打印插件用户使用文档设计

> 本文是 `2026-11-21-user-guide.md` 实施计划的规格来源。经 @grill-me 多轮追问与 @brainstorming 回放收敛，所有设计决策均已明确；未写明的行为沿用仓库现状。

## 1. 意图与为什么

读者是**把 worm-print-platform 当作打印插件集成进自己系统的宿主开发者**。目前没有一份面向他们的完整使用文档：接入方法、多语言、插件安装配置、插件开发分散在六份文档里，且仓库首页 `README.md` 的「快速开始」直接堆了一大段嵌入代码，读者一眼看不到全局。

本次要做的是：在仓库首页放一个明确的超链接，把读者引进一份**完整、自包含**的使用文档；同时撤掉首页那段示例代码，并删除被取代的六份分散文档，收敛为单一真源。

## 2. 目标 / 非目标 / 反目标

- **目标**
  1. 仓库首页「快速开始」给出一个超链接，指向完整使用文档。
  2. 新文档自包含覆盖四大主题：按框架的基础接入、多语言配置与自定义、插件安装与配置、插件开发。
  3. 删除六份被取代的旧文档，消除内容分散与重复。
  4. 修正所有指向旧文档的活跃引用与测试依赖，不留死链、不留失败测试。
- **非目标**
  - 不新建在线文档站 / Pages 页面——访问方式就是 GitHub / Gitee 仓库网页。
  - 不改动任何运行时代码、包逻辑、构建流程（本次是纯文档改动，唯一例外是测试里的一个路径常量）。
- **反目标（做了就算失败）**
  - 首页快速开始仍保留大段嵌入代码。
  - 新文档只是链接枢纽、读者还得跳去别处才能照着做。
  - 删除旧文档后留下死链或失败测试。

## 3. 约束

- 语言：全中文（AGENTS.md 最高优先级）；UTF-8 无 BOM。
- 单次写入不超过 500 行：新文档预计 900–1000 行，需**分批写入**（先建骨架，再按主题逐节追加）。
- 既有测试 `packages/core/src/i18n/__tests__/docs.spec.ts` 必须通过，其断言的 API 词必须仍在新文档中。
- 包边界、分层不变；不碰 `docs/superpowers/` 与 `plugin-marketplace-plan.md` 等历史记录。

## 4. 方案（Approaches）

1. **新建独立文档 + 旧文档退化为链接枢纽**（最初推荐）：改动面小，但读者仍要跳转、内容非自包含——被否决，用户要求「完整包含」。
2. **把 `docs/README.md` 直接改造成完整指南**：用户一度选择，但导航页与完整指南两种职责混在一起；后改为新建目录。
3. **新建 `docs/guide/README.md` 单文件完整文档 + 删六份旧文档 + 首页快速开始改超链接**（**选定**）：职责清晰——首页是入口、导航页是目录、`guide/README.md` 是唯一完整内容；自包含、单一真源，代价是文档篇幅大、需分批写入。

## 5. 已定决策（how，不再重开）

- 文档形态：新建 `docs/guide/` 目录，一份文件 `docs/guide/README.md`，完整自包含。
- 内容取向：原样搬入六份旧文档内容，**保留 AI 集成提示词**。
- 框架范围：四类齐全——Vue 3 / Vue 2.7 / React 18 / jQuery / 原生 JS。
- 旧文档：删除 `vue3.md`、`vue2.md`、`react.md`、`jquery.md`、`i18n.md`、`plugin-marketplace.md` 六份；其余（`plugin-marketplace-plan.md`、`migration-worm-vue3-print.md`、`commands.md` 等）保留。
- `docs/README.md`：保留为总导航，内容重写为指向新文档及各保留文档的链接表；其原有的「技能安装方法」「打印链路速记」并入新文档「开始之前」。**保留末尾「通用开发技能」表**（`development-skills.md` 是保留文档，需要导航入口）。
- 首页入口：只砍 `README.md` 第 44–83 行的「宿主最小接入」示例，保留 `### 仓库开发`；超链接 `./docs/guide/README.md`。
- 测试：`docs.spec.ts` 读取路径改为新文档，8 个 API 词断言保留（原样搬入后自然满足）。
- 大纲：① 开始之前 → ② 基础接入（四类框架）→ ③ 多语言配置与自定义 → ④ 插件安装与配置 → ⑤ 插件开发 → ⑥ 迁移与故障排查附录。

## 6. 内容映射（六份旧文档 → 新文档章节）

搬入时每份旧文档的一级标题降级为章节内标题，去重并重建目录；标题正文与代码块原样保留（含 AI 提示词）。

| 旧文档 | 行数 | 新文档落点 |
| --- | --- | --- |
| `vue3.md` | 131 | 二、基础接入 → 2.1 Vue 3 |
| `vue2.md` | 127 | 二、基础接入 → 2.2 Vue 2.7 |
| `react.md` | 115 | 二、基础接入 → 2.3 React 18 |
| `jquery.md` | 132 | 二、基础接入 → 2.4 jQuery / 原生 JS |
| `i18n.md` | 257 | 三、多语言配置与自定义 → 3.1–3.11（原 11 节逐步降级） |
| `plugin-marketplace.md` | 139 | 四、安装配置（原一、二节）+ 五、插件开发（原三、四节） |
| `docs/README.md` 部分段落 | — | 一、开始之前（打印链路速记、技能安装）；六、附录的迁移摘要 |

合计约 900 行正文 + 导航/附录，必须分批写入。

## 7. 联动修改清单

### 7.1 交叉引用改相对路径（随六份文档搬入，共 5 处）

- 四份框架文档中的 `[README](./README.md#技能安装方法提示词第-0-步的通用说明)` → 改为指向新文档内的「开始之前 / 配套技能与 AI 提示词」锚点，或 `../README.md#...`。
- `plugin-marketplace.md` 中的 `[plugin-marketplace-plan.md](./plugin-marketplace-plan.md)` → `../plugin-marketplace-plan.md`。

### 7.2 活跃引用修正（指向已删文档的链接）

| 文件 | 位置 | 处理 |
| --- | --- | --- |
| `README.md` | 162–165 行框架导航表 4 个链接 | 指向新文档对应框架锚点 |
| `README.md` | 190 行 plugin-marketplace 链接 | 指向新文档「四、插件安装与配置」 |
| `docs/README.md` | 10–13、18 行 | 随导航页重写，指向新文档 |
| `packages/canvas/README.md` | 61、63 行 | 指向新文档（框架接入 / 多语言） |
| `packages/echarts/README.md` | 101 行 | 指向新文档「插件安装与配置」 |
| `marketplace/plugins/echarts/README.md` | 101 行 | 同上（源码真源） |
| `demos/apps/vue3/.worm-print/plugins/echarts/README.md` | 101 行 | 同上（CLI 安装副本，注意可能被重装覆盖） |

历史记录中的提及（`docs/superpowers/plans/*`、`docs/superpowers/specs/*`、`docs/plugin-marketplace-plan.md` 第 260 行）**不动**。

### 7.3 测试

`packages/core/src/i18n/__tests__/docs.spec.ts` 第 6 行路径 `docs/i18n.md` → `docs/guide/README.md`；断言数组不变。

## 8. 验证

1. `npm test`，重点确认 `docs.spec.ts` 通过；涉及渲染管线时按 AGENTS.md 追加 `npm run test -w @worm-print-platform/render`。
2. `grep` 全仓 `vue3.md|vue2.md|react.md|jquery.md|i18n.md|plugin-marketplace.md`，仅允许历史记录文件命中；活跃文件命中即为死链。
3. `git diff` 审查：命名、中文、锚点、是否外科手术式修改；确认旧文档确已删除、新文档完整包含六份内容。

## 9. 实施者已定细节（builder check 后补齐，无需用户回答）

- 新文档一级标题定为 `# worm-print-platform 使用文档`（实施者的 call）；六份旧文档的一级标题降级为各章节内标题。
- 六份文档的具体搬入顺序与标题降级映射见第 6 节；标题编号按新大纲重排，正文与代码块不动。
- 六、附录的「迁移」：取 `migration-worm-vue3-print.md` 的要点摘要（包名映射、三条迁移路径）+ 指向原文档全文的链接，原文档保留不动（实施者的 call）。
- 六、附录的「故障排查」：六份旧文档没有独立故障排查章节，写一份简短 FAQ（插件装了不生效、切语言不更新、跨副本注册、打印不出纸），指向 integration 技能的故障排查 reference；这是简版摘要，不展开（实施者的 call）。
- 首页框架导航表的 4 个链接优先指向新文档内对应框架锚点；若锚点与标题生成规则不一致，退化为统一指向 `./docs/guide/README.md`。
- `demos/apps/vue3/.worm-print/plugins/echarts/README.md` 是 CLI 安装副本，改它只为消除当前死链，不保证后续重装不被覆盖；风险在交付说明中提示用户。

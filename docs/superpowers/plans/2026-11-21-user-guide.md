# 打印插件用户使用文档实施计划

> **给 agentic worker 的说明：** 必需子技能：使用 `subagent-driven-development`（推荐）或 `executing-plans` 逐任务实施。步骤用 `- [ ]` 复选框跟踪。

**目标：** 在仓库首页「快速开始」放一个超链接，把打印插件使用者引进一份完整自包含的 `docs/guide/README.md`，并删除被取代的六份分散文档。

**架构：** 纯文档改动。新文档作为唯一内容真源，按「开始之前 / 四类框架接入 / 多语言 / 插件安装配置 / 插件开发 / 迁移与故障排查附录」六部分组织，原样搬入六份旧文档正文（含 AI 提示词）。首页、导航页及各包 README 的链接统一改指新文档；唯一代码改动是测试里的一个路径常量。

**技术栈：** Markdown、Git、Node/Vitest（现有测试）、shell grep（死链与结构检查）。

**规格：** `docs/superpowers/specs/2026-11-21-user-guide-design.md`

## 全局约束

- 语言：全中文（AGENTS.md 最高优先级）；UTF-8 无 BOM。
- 单次写入不超过 500 行；新文档约 1000 行，必须分批写入（先建骨架，再按主题追加）。
- 新文档路径固定 `docs/guide/README.md`，一级标题固定 `# worm-print-platform 使用文档`。
- 删除清单固定六份：`docs/vue3.md`、`docs/vue2.md`、`docs/react.md`、`docs/jquery.md`、`docs/i18n.md`、`docs/plugin-marketplace.md`；其余文档保留。
- 测试断言词固定 8 个：`registerLocale`、`mergeLocale`、`PluginLocaleMessages`、`lang`、`messages`、`i18nId`、`documentLang`、`locale-keys.json`。
- 首页只砍 `README.md` 原第 44–83 行「宿主最小接入」示例，`### 仓库开发` 小节保留。
- 不碰 `docs/superpowers/` 与 `docs/plugin-marketplace-plan.md` 等历史记录；包边界与构建流程不变。
- 提交信息一律中文；默认在 master 分支开发。

## 审查重点

- **旧文档删除后残留死链**：删六份后仍有活跃文件链接指向它们。→ 任务 4 的「全仓 grep 死链检查」步骤。
- **新文档内容不完整**：六份旧文档未全部搬入（尤其四框架与 i18n 的 11 节）。→ 任务 2 的「章节映射对照检查」、任务 3 的「8 个 API 词检查」。
- **内部锚点对不上标题**：四框架 AI 提示词的技能链接、`plugin-marketplace.md` 指向 plan 的链接。→ 任务 2 的「交叉引用路径检查」。
- **首页嵌入代码残留**：快速开始的宿主接入代码块没清干净。→ 任务 5 的「首页改造检查」步骤。
- **测试路径或断言词失效**：`docs.spec.ts` 仍读旧路径或新文档缺词。→ 任务 4 的「跑 docs.spec.ts」步骤。

---

## 文件结构

| 文件 | 动作 | 职责 |
| --- | --- | --- |
| `docs/guide/README.md` | 创建 | 唯一完整用户文档，六部分 |
| `README.md` | 修改 | 快速开始改超链接、框架导航表与插件链接改指新文档 |
| `docs/README.md` | 修改（重写） | 总导航页，保留「通用开发技能」表 |
| `packages/core/src/i18n/__tests__/docs.spec.ts` | 修改 | 读取路径改指新文档 |
| `packages/canvas/README.md` | 修改 | 2 处链接改指新文档 |
| `packages/echarts/README.md` | 修改 | 1 处链接改指新文档 |
| `marketplace/plugins/echarts/README.md` | 修改 | 1 处链接（源码真源） |
| `demos/apps/vue3/.worm-print/plugins/echarts/README.md` | 修改 | 1 处链接（CLI 安装副本） |
| `docs/{vue3,vue2,react,jquery,i18n,plugin-marketplace}.md` | 删除 | 被新文档取代 |

---

### Task 1:建立新文档骨架与「开始之前」「基础接入」

**文件：**
- 创建：`docs/guide/README.md`

**接口：**
- 产出：新文档一级标题 `# worm-print-platform 使用文档`；导航目录；`## 一、开始之前`、`## 二、基础接入（按框架）` 与四个三级标题 `### 2.1 Vue 3` / `### 2.2 Vue 2.7` / `### 2.3 React 18` / `### 2.4 jQuery / 原生 JS`。后续任务据此追加章节。

- [ ] **步骤 1：创建骨架与「开始之前」**

写入一级标题、导航目录（六部分链接）、`## 一、开始之前`，内容含：文档定位（面向把本项目当打印插件集成的宿主开发者）、三条打印链路速记（搬自 `docs/README.md` 原 108–116 行）、配套技能与 AI 提示词安装（搬自 `docs/README.md` 原 33–106 行，含 npx 安装器命令与 Gitee/GitHub 双源说明）。正文原样保留，仅标题层级调整。

- [ ] **步骤 2：追加「二、基础接入」四框架章节**

依次搬入 `docs/vue3.md`、`docs/vue2.md`、`docs/react.md`、`docs/jquery.md` 全文（各 131/127/115/132 行）。每份的一级标题降级为 `### 2.x`，原 `## N.` 小节降级为 `####`，正文、代码块、AI 提示词原样保留。因本步超过 500 行，按框架分 4 次小写入。

- [ ] **步骤 3：检查结构**

Run: `grep -cE '^### 2\.[1-4] ' docs/guide/README.md && grep -c 'worm-print-platform-integration' docs/guide/README.md && wc -l docs/guide/README.md`
Expected: 第一个输出 `4`，第二个 ≥ 4，行数约 620。

- [ ] **步骤 4：提交**

```bash
git add docs/guide/README.md
git commit -m "docs: 新建用户使用文档骨架与四类框架接入章节"
```

---

### Task 2:追加多语言、插件安装配置、插件开发与附录

**文件：**
- 修改：`docs/guide/README.md`（追加）

**接口：**
- 消费：任务 1 建立的文档与标题层级。
- 产出：完整六部分文档；`## 三、多语言配置与自定义`、`## 四、插件安装与配置`、`## 五、插件开发`、`## 六、迁移与故障排查附录` 及各自子标题。任务 4 的测试断言依赖本步内容。

- [ ] **步骤 1：追加「三、多语言配置与自定义」**

搬入 `docs/i18n.md` 全文（257 行，`## 1.`–`## 11.` 降级为 `### 3.1`–`### 3.11`，内部 `###` 降为 `####`）。正文、代码块、表格原样保留，确保 8 个 API 词全部出现。

- [ ] **步骤 2：追加「四、插件安装与配置」与「五、插件开发」**

搬入 `docs/plugin-marketplace.md` 的「一、安装插件」「二、宿主加载」为第四章，「三、插件作者指南」「四、信任边界」为第五章。标题降级，正文原样保留。

- [ ] **步骤 3：追加「六、迁移与故障排查附录」**

写迁移摘要（`migration-worm-vue3-print.md` 的包名映射与三条迁移路径要点）+ 指向原文档全文的链接；写故障排查 FAQ（插件装了不生效 / 切语言不更新 / 跨副本注册 / 打印不出纸），指向 integration 技能的故障排查 reference。

- [ ] **步骤 4：检查章节映射与交叉引用路径**

Run: `grep -cE '^## [三四五六]、' docs/guide/README.md && grep -nE '\]\(\./(README|plugin-marketplace-plan)\.md' docs/guide/README.md`
Expected: 第一个输出 `4`；第二个应无命中——四框架中的技能链接须改为文档内锚点或 `../README.md#...`，`plugin-marketplace-plan.md` 链接须改为 `../plugin-marketplace-plan.md`。若有命中，先修正再继续。

- [ ] **步骤 5：提交**

```bash
git add docs/guide/README.md
git commit -m "docs: 补齐多语言、插件与附录章节，完成完整使用文档"
```

---

### Task 3:切换测试路径并删除六份旧文档

**文件：**
- 修改：`packages/core/src/i18n/__tests__/docs.spec.ts`
- 删除：`docs/vue3.md`、`docs/vue2.md`、`docs/react.md`、`docs/jquery.md`、`docs/i18n.md`、`docs/plugin-marketplace.md`

**接口：**
- 消费：任务 2 产出的完整文档（含 8 个 API 词）。
- 产出：测试指向新文档；六份旧文档不再存在。

- [ ] **步骤 1：改测试读取路径**

把 `packages/core/src/i18n/__tests__/docs.spec.ts` 第 6 行的 `docs/i18n.md` 改为 `docs/guide/README.md`，断言数组 8 个词不变。

- [ ] **步骤 2：跑测试确认通过**

Run: `npm test -w @worm-print-platform/core -- src/i18n/__tests__/docs.spec.ts`
Expected: `i18n:check` 与 `docs.spec.ts` 均 PASS。若因路径解析失败，检查 `ROOT` 解析仍指向仓库根。

- [ ] **步骤 3：删除六份旧文档**

```bash
git rm docs/vue3.md docs/vue2.md docs/react.md docs/jquery.md docs/i18n.md docs/plugin-marketplace.md
```

- [ ] **步骤 4：提交**

```bash
git add packages/core/src/i18n/__tests__/docs.spec.ts
git commit -m "docs: 测试指向新使用文档并移除六份旧文档"
```

---

### Task 4:修正全部活跃引用与首页入口

**文件：**
- 修改：`README.md`、`docs/README.md`、`packages/canvas/README.md`、`packages/echarts/README.md`、`marketplace/plugins/echarts/README.md`、`demos/apps/vue3/.worm-print/plugins/echarts/README.md`

**接口：**
- 消费：任务 3 已删六份旧文档（本任务消除由此产生的死链）。
- 产出：所有活跃引用指向 `docs/guide/README.md`；首页快速开始为超链接；导航页重写完成。

- [ ] **步骤 1：改根 README 框架导航表与插件链接**

`README.md` 原 162–165 行四个链接改指 `./docs/guide/README.md#21-vue-3` 等对应框架锚点（Markdown 锚点去掉标题中的点号，如 `### 2.1 Vue 3` → `#21-vue-3`；锚点不符时退化为统一指向 `./docs/guide/README.md`）；原 190 行 `docs/plugin-marketplace.md` 链接改指 `./docs/guide/README.md#四插件安装与配置`。

- [ ] **步骤 2：改各包 README 引用**

- `packages/canvas/README.md` 第 61 行四个框架链接合并为指向新文档框架章节，第 63 行多语言链接指向 `../../docs/guide/README.md#三多语言配置与自定义`。
- `packages/echarts/README.md`、`marketplace/plugins/echarts/README.md`、`demos/apps/vue3/.worm-print/plugins/echarts/README.md` 第 101 行链接改指新文档插件章节（相对路径按各文件所在目录计算）。

- [ ] **步骤 3：重写 docs/README.md 导航页**

保留为总导航：顶部指向 `./guide/README.md`；列出保留文档链接（`migration-worm-vue3-print.md`、`plugin-marketplace-plan.md`、`commands.md`、`development-skills.md`、`gitee-issues-reproduction.md`、`print-benchmark-2026-11-21.md`）；保留末尾「通用开发技能」表。删除已并入新文档的「技能安装方法」「打印链路速记」正文。

- [ ] **步骤 4：改首页快速开始**

删除 `README.md` 原第 44–83 行「宿主最小接入」整段（含代码块与引用块），替换为两行：

```markdown
把 worm-print-platform 作为打印插件接入你的系统？
[阅读完整使用文档 →](./docs/guide/README.md)
文档覆盖四类框架接入、多语言配置、插件安装配置与插件开发。
```

保留 `### 仓库开发` 小节不动。

- [ ] **步骤 5：全仓 grep 死链检查**

Run: `grep -rnE '(vue3|vue2|react|jquery|i18n|plugin-marketplace)\.md' --include='*.md' . | grep -v node_modules | grep -v 'docs/superpowers/' | grep -v 'docs/plugin-marketplace-plan.md'`
Expected: 无输出。若有活跃文件命中，逐个修正后重跑。

- [ ] **步骤 6：提交**

```bash
git add README.md docs/README.md packages/canvas/README.md packages/echarts/README.md marketplace/plugins/echarts/README.md demos/apps/vue3/.worm-print/plugins/echarts/README.md
git commit -m "docs: 首页快速开始改为文档超链接并修正全部引用"
```

---

### Task 5:全量验证与交付审查

**文件：** 无（验证与审查）

- [ ] **步骤 1：跑全量测试**

Run: `npm test`
Expected: 全部通过，尤其 `docs.spec.ts`。若有失败，定位后修复再提交。

- [ ] **步骤 2：首页改造检查**

Run: `sed -n '42,90p' README.md`
Expected: 快速开始段无嵌入代码块（无 ```bash / ```ts / ```html 块），含 `./docs/guide/README.md` 链接，`### 仓库开发` 小节存在。

- [ ] **步骤 3：git diff 审查**

Run: `git status && git diff --check && git diff --stat`
Expected: 六份旧文档为删除状态；无空白错误；改动文件与「文件结构」表一致。逐项核对命名、中文、锚点、是否外科手术式修改。

- [ ] **步骤 4：交付风险提示**

在最终回复中提示：`demos/apps/vue3/.worm-print/plugins/echarts/README.md` 是 CLI 安装副本，本次修改只为消除当前死链，后续 `worm-print-marketplace install ... --force` 重装可能被覆盖；新文档仅在仓库网页可访问，无独立在线文档站。

- [ ] **步骤 5：提交（若有修复）**

```bash
git add -A
git commit -m "docs: 验证并修正使用文档改动"
```

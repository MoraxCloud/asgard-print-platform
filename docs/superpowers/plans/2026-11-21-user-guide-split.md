# 用户使用文档拆分与互跳实施计划

> **给 agentic worker 的说明：** 必需子技能：使用 `superpowers:executing-plans` 逐任务实施。步骤用 `- [ ]` 复选框跟踪。

**目标：** 把 1062 行的 `docs/guide/README.md` 拆成 9 份编号文件 + 索引页，加互跳导航，修正所有链接与测试路径，并给根 README 快速开始补 AI 介绍。

**架构：** 按现有六章 + 四框架切分，正文原样保留；`README.md` 重写为索引；每篇带顶部/底部导航条；所有引用与测试读取路径同步改指新文件。纯文档改动，唯一代码改动是测试路径常量。

**技术栈：** Markdown、Git、Node/Vitest、shell grep。

**规格：** `docs/superpowers/specs/2026-11-21-user-guide-split-design.md`

## 全局约束

- 语言：全中文；UTF-8 无 BOM；单次写入不超过 500 行。
- 新文件命名固定：`01-getting-started.md`、`02-vue3.md`、`03-vue2.md`、`04-react.md`、`05-jquery.md`、`06-i18n.md`、`07-plugin-install.md`、`08-plugin-dev.md`、`09-migration-faq.md`。
- `docs.spec.ts` 的 8 个 API 词断言不变，读取路径改为 `docs/guide/06-i18n.md`。
- 所有相对链接必须解析到真实文件；文内锚点必须对应实际标题。
- 在 master 直接开发；提交信息中文。

## 审查重点

- 拆分后正文丢失或重复 → 任务 1 的「行数与关键词对照」检查。
- 失效链接（外部 README、跨文档、测试路径） → 任务 3 的「相对链接解析」+ 任务 4 的 `npm test`。
- 导航条缺项或指向不存在文件 → 任务 2 的「导航条检查」。
- 快速开始 AI 文案缺失 → 任务 3 的「文案检查」。
- 文内锚点失效 → 任务 4 的「锚点检查」。

---

### Task 1: 拆分出 9 份内容文件

**文件：**
- 创建：`docs/guide/01-getting-started.md` ~ `docs/guide/09-migration-faq.md`
- 修改（最终删除正文）：`docs/guide/README.md`

**接口：**
- 产出：9 份文件，各含一级标题与正文；任务 2 据此加导航条，任务 3 据此改引用。

- [ ] **步骤 1：按行区间切分原文档**

用脚本从 `docs/guide/README.md` 读取行区间生成文件（区间端点为标题行，含）：

| 文件 | 源行区间 | 一级标题 |
| --- | --- | --- |
| `01-getting-started.md` | 16–110 | `# 开始之前` |
| `02-vue3.md` | 114–245 | `# Vue 3 接入` |
| `03-vue2.md` | 246–373 | `# Vue 2.7 接入` |
| `04-react.md` | 374–489 | `# React 18 接入` |
| `05-jquery.md` | 490–625 | `# jQuery / 原生 JS 接入` |
| `06-i18n.md` | 626–886 | `# 多语言配置与自定义` |
| `07-plugin-install.md` | 887–969 | `# 插件安装与配置` |
| `08-plugin-dev.md` | 970–1032 | `# 插件开发` |
| `09-migration-faq.md` | 1033–1062 | `# 迁移与故障排查附录` |

每份写：一级标题 + 空行 + 源区间正文。正文内的 `### 2.1` 等编号前缀去掉一级（变为 `## 2.1` 可视情况保留编号），正文、代码块、表格、AI 提示词一字不改。四框架文件内的 `[README](README.md#一开始之前)` 改指 `01-getting-started.md`。

- [ ] **步骤 2：检查拆分完整性**

Run: `wc -l docs/guide/0*.md && grep -l 'worm-print-platform-integration' docs/guide/0*.md | wc -l && grep -l 'registerLocale' docs/guide/06-i18n.md`
Expected: 9 个文件行数与原区间一致；技能引用出现在 01 与四框架共 5 份；`06-i18n.md` 命中 registerLocale。

- [ ] **步骤 3：提交**

```bash
git add docs/guide/
git commit -m "docs: 将用户使用文档拆分为 9 份章节文件"
```

---

### Task 2: 重写索引页并加导航条

**文件：**
- 修改：`docs/guide/README.md`（重写为索引页）
- 修改：9 份内容文件（加顶部/底部导航条）

**接口：**
- 消费：任务 1 的 9 份文件。
- 产出：索引页 + 每篇可互跳的导航条。

- [ ] **步骤 1：重写 README.md 为索引页**

写标题 `# worm-print-platform 使用文档` + 一句话定位 + 9 个链接（按 01–09 顺序，每个带一句话说明，从原章节首段提炼）。`- [开始之前](./01-getting-started.md) —— ...` 形式。

- [ ] **步骤 2：为 9 篇加导航条**

每篇一级标题下方与文末各加一行：

```
[← 返回目录](./README.md) | ← 上一篇：<标题> | 下一篇：<标题> →
```

链接指向对应文件（如 `./02-vue3.md`）；01 省略「上一篇」，09 省略「下一篇」，顶部与底部内容相同。

- [ ] **步骤 3：检查导航条**

Run: `for f in docs/guide/0*.md; do echo "$f: $(grep -c '返回目录' $f)"; done`
Expected: 每篇输出 `2`（顶部 + 底部）。

- [ ] **步骤 4：提交**

```bash
git add docs/guide/
git commit -m "docs: 索引页与章节互跳导航"
```

---

### Task 3: 修正全部外部引用与测试路径

**文件：**
- 修改：`README.md`、`packages/canvas/README.md`、`packages/echarts/README.md`、`marketplace/plugins/echarts/README.md`、`demos/apps/vue3/.worm-print/plugins/echarts/README.md`、`packages/core/src/i18n/__tests__/docs.spec.ts`

**接口：**
- 消费：任务 1、2 的 9 份文件。
- 产出：所有引用指向新文件；快速开始含 AI 介绍。

- [ ] **步骤 1：改快速开始文案**

`README.md` 快速开始段在现有主链接与「文档覆盖...」之后，补一句 AI 介绍与提示词入口：

```
文档还内置 AI Agent 接入提示词与官方技能（npx 一键安装），[可直接粘给 AI 工具按规范接入](./docs/guide/01-getting-started.md#12-配套技能与-ai-提示词ai-agent-接入用)。
```

- [ ] **步骤 2：改根 README 其他链接**

框架导航表 4 个链接改指 `./docs/guide/02-vue3.md`、`03-vue2.md`、`04-react.md`、`05-jquery.md`；插件链接改指 `./docs/guide/07-plugin-install.md`。

- [ ] **步骤 3：改各包 README**

- `packages/canvas/README.md`：框架接入链接改指 `../../docs/guide/02-vue3.md` 等；多语言链接改指 `../../docs/guide/06-i18n.md`。
- 三个 echarts README：插件链接改指 `07-plugin-install.md`，相对路径按各自目录计算（`packages/echarts/` 用 `../../docs/guide/`，`marketplace/plugins/echarts/` 用 `../../../docs/guide/`，demos 副本用 `../../../../../../docs/guide/`）。

- [ ] **步骤 4：改测试路径**

`docs.spec.ts` 第 6 行 `docs/guide/README.md` → `docs/guide/06-i18n.md`。

- [ ] **步骤 5：提交**

```bash
git add README.md packages/canvas/README.md packages/echarts/README.md marketplace/plugins/echarts/README.md demos/apps/vue3/.worm-print/plugins/echarts/README.md packages/core/src/i18n/__tests__/docs.spec.ts
git commit -m "docs: 修正拆分后的引用与测试路径，快速开始补 AI 介绍"
```

---

### Task 4: 全量验证与交付

**文件：** 无（验证）

- [ ] **步骤 1：跑全量测试**

Run: `npm test`
Expected: 全绿，尤其 `docs.spec.ts`。

- [ ] **步骤 2：相对链接解析检查**

用 Node/shell 遍历 `docs/guide/*.md` 与所有被改 README，确认每个 `](./...)` / `](../...)` 目标存在。Expected: 0 断链。

- [ ] **步骤 3：锚点与文案检查**

Run: `grep -n 'AI Agent 接入提示词' README.md && grep -rn 'README.md#一开始之前' docs/guide/ || echo "旧锚点已清"`
Expected: 快速开始含 AI 文案；旧自指锚点无残留。

- [ ] **步骤 4：git 审查**

Run: `git status && git diff --check && git diff --stat`
Expected: 9 份新文件、README 重写、引用文件修改；无空白错误。

- [ ] **步骤 5：提交设计文档与计划**

```bash
git add docs/superpowers/plans/2026-11-21-user-guide-split.md docs/superpowers/specs/2026-11-21-user-guide-split-design.md
git commit -m "docs: 补充文档拆分的设计与实施计划"
```

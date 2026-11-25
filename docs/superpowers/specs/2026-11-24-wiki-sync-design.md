# 仓库 Wiki 同步设计

> 本文是 `2026-11-24-wiki-sync.md` 实施计划的规格来源。决策经逐项追问收敛；外部链接处理因会话中断未及回答，采用推荐默认值并在批准环节确认。

## 1. 意图与为什么

项目已有 10 篇拆分的用户使用文档（`docs/guide/01-*.md` ～ `10-data-transform.md`），但只在仓库网页可见。GitHub / Gitee 的 Wiki 是更易发现的入口，且支持页面间跳转。本次把 `docs/guide/` 的内容发布到两个平台的 Wiki，并提供一条命令的同步脚本，让日后仓库文档更新能一键推送到 Wiki，避免两份内容漂移。

## 2. 目标 / 非目标 / 反目标

- **目标**
  1. GitHub Wiki 与 Gitee Wiki 各建一份，内容来自 `docs/guide/`。
  2. Wiki 首页 `Home.md` 来自 `docs/guide/README.md`（索引页），10 篇章节页一一对应。
  3. 提供 `scripts/sync-wiki.mjs`，一条命令把 `docs/guide/` 同步到两个平台的 Wiki。
  4. 仓库外相对链接改写为 GitHub 主仓绝对 URL，避免 Wiki 内死链。
  5. Wiki 内页间链接（`./0X-*.md`）保持不变，GitHub / Gitee Wiki 均支持同仓库相对链接。
- **非目标**
  - 不改动 `docs/guide/` 的任何现有文档（只读取）。
  - 不把 `docs/guide/AGENTS.md`（AI 阅读索引）放进 Wiki。
  - 不建独立文档站；Wiki 即发布形态。
- **反目标**：Wiki 内容与仓库文档长期漂移；Wiki 内出现指向不存在文件的死链。

## 3. 约束

- 语言：全中文；UTF-8 无 BOM；单次写入不超过 500 行。
- 内容源固定 `docs/guide/`：`README.md` → `Home.md`，`01-*.md` ～ `10-data-transform.md` → 同名页面。
- 外部链接统一转 GitHub 主仓 URL：`https://github.com/worm-longliu/worm-print-platform/blob/master/<仓库相对路径>`。
- 脚本零第三方依赖（Node 内置模块即可），不引入 npm 包。
- 推送是外部副作用，脚本需显式执行确认或由用户在批准时授权；不在只读检查中推送。
- 提交信息中文；master 直接开发。

## 4. 方案（Approaches）

1. **手动复制推送**：最简单，但仓库文档更新后必然漏同步——否决。
2. **脚本同步 + 两个平台**（**选定**）：`scripts/sync-wiki.mjs` 读取 `docs/guide/`，转链接、生成目标内容、分别推送到两个 Wiki；一条命令完成，长久可维护。
3. **CI 自动同步**：改动 Wiki 时触发 workflow；超出当前需求，且需配置 secrets，暂不做。

## 5. 已定决策

- 平台：GitHub + Gitee 都建（GitHub Wiki 首次推送自动创建；Gitee Wiki 已存在，直接更新）。
- 内容范围：仅 `docs/guide/` 的索引页 + 10 篇章节，`AGENTS.md` 排除。
- 同步方式：写 `scripts/sync-wiki.mjs`。
- 外部链接（推荐默认值，待批准确认）：统一转 GitHub 主仓绝对 URL。

## 6. 实现设计

### 6.1 脚本结构（`scripts/sync-wiki.mjs`）

1. **读取**：`docs/guide/README.md` 与 `01-*.md` ～ `10-data-transform.md`（按文件名排序）。
2. **链接改写**：对每篇内容，把指向仓库其他目录的相对链接转为 GitHub blob URL：
   - `](../migration-worm-vue3-print.md)` → `](https://github.com/worm-longliu/worm-print-platform/blob/master/docs/migration-worm-vue3-print.md)`
   - `](../plugin-marketplace-plan.md)`、`](../plugin-market-spec.md)`、`](../../skills/.../troubleshooting.md)` 同理。
   - 保留 `./0X-*.md` 与 `./README.md` 的页内相对链接（Wiki 内可跳转）。
3. **首页映射**：`README.md` → `Home.md`；其中指向章节的 `./0X-*.md` 保持不变。
4. **生成**：在临时目录写入 `Home.md` + 10 篇页面。
5. **推送**：
   - GitHub：`https://github.com/worm-longliu/worm-print-platform.wiki.git`（用 `gh auth token` 或 git 凭据）。
   - Gitee：`https://gitee.com/liulong_oschina/worm-print-platform.wiki.git`（用环境变量 `GITEE_TOKEN` 或已有凭据）。
   - 两个 Wiki 各自 clone（或 init + remote），写入文件，`git add -A && git commit && git push`。
6. **输出**：逐平台打印推送结果；失败的平台不影响另一个，最终汇总退出码。

### 6.2 命令接口

```bash
node scripts/sync-wiki.mjs            # 生成预览 + 推送两个平台
node scripts/sync-wiki.mjs --dry-run  # 只生成到临时目录，不推送（用于检查）
```

### 6.3 认证

- GitHub：`gh auth token` 已认证（账号 worm-longliu，token 含 repo 权限），脚本优先读取。
- Gitee：优先用环境变量 `GITEE_TOKEN`；未提供时回退当前 git 凭据（HTTPS）。若两者均无，脚本明确报错并跳过 Gitee，不静默失败。

## 7. 验证

1. `node scripts/sync-wiki.mjs --dry-run`：生成临时目录，检查 `Home.md` + 10 篇齐全、无残留仓库外相对链接、页内链接完整。
2. 实际同步后，用 `git ls-remote` 确认两个 Wiki 仓库 HEAD 更新。
3. 抽查 Wiki 页面：首页链接可跳转；4 处外部链接指向 GitHub 主仓且可访问。
4. `npm test` 不受影响（脚本独立，不改源码）。
5. `git diff --check` 与 `git diff` 审查。

## 8. 留给我（实施者）的判断

- 临时目录用 `os.tmpdir()` 下的唯一子目录，结束后保留供 dry-run 查看或清理，由脚本参数决定。
- Wiki 推送采用「clone → 覆盖写入 → commit → push」，保留 Wiki 已有历史；首次 GitHub Wiki 若不存在，GitHub 会在首次 push 时自动创建仓库。
- 两个平台内容完全一致（外部链接统一指 GitHub 主仓），不做按平台差异化。
- 脚本本身是否纳入 npm scripts（如 `npm run sync:wiki`）由实施时判断；不强制。
- 若 Gitee 凭据不可用，先完成 GitHub Wiki，Gitee 留作后续补推并在交付说明中提示。

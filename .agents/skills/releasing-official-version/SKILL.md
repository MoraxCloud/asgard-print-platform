---
name: releasing-official-version
description: Use when the user asks to release/publish a new official version of worm-print-platform ("发布正式版", "发布 vX.Y.Z", "打 tag 发版", "一句话发布"), bump version + tag + GitHub/Gitee release + npm + Pages, and decide whether the desktop client needs repackaging
---

# 发布正式版本（worm-print-platform）

## Overview

**核心原则**：一句话发版 = 版本载体对齐 → 验证 → 提交打 tag 双推 → 创建 Release → 触发 CI 发布 → 判断客户端。全程用简体中文。

**开场声明**："我使用 releasing-official-version 技能执行发版。"

本仓库是 npm workspaces monorepo。发布渠道全部是 GitHub Actions 手动 workflow（`workflow_dispatch`），推 tag 不会自动发布。务必先读 `docs/commands.md` 与 `.github/workflows/` 确认当前机制。

## When to Use

- 用户说"发布正式版 / 发版 / 打 tag / 升版本发布 / 一句话发布"等
- 需要把当前工作区改动作为一个新版本对外发布
- 判断桌面客户端是否要重新打包上传

不适用：预发布 beta（用 `publish:canvas:beta`）、仅本地调试版本。

## Step 0：确认三个决策点

动手前用 AskUserQuestion 确认（除非用户已明确）：

1. **版本号**：当前版本取自根 `package.json`。用户说"小版本更新"默认取 **patch**（1.5.1→1.5.2）；若含新增公共 API 应提示可用 minor。
2. **客户端**：是否重新打包。用下方 Step 6 的判断逻辑给出推荐。
3. **提交范围**：工作区未提交改动是否全部纳入。若要全部，先审查 diff 无半成品再提交。

## Step 1：版本载体对齐（最易漏）

版本载体清单与升版规则见 [references/version-carriers.md](references/version-carriers.md)。**必须先读**——demos lock 的 `file:` 快照、mcp 版本常量、第三方 `base64-js` 恰好同号等坑都在里面。

要点：
- 所有 workspace 包 + demos + 根 lock 自身版本 `OLD→NEW`
- 所有 `@worm-print-platform/*` 内部依赖范围 `^OLD→^NEW`
- `services/render` 自身版本保持 `1.0.0`，只抬依赖
- `packages/mcp/src/version.ts` 常量同步
- README badge、CHANGELOG 新增条目、docs/commands.md 示例命令版本
- **保留**客户端安装包下载链接的历史版本号（指向真实存在的 vX 资产），不要改成新版本
- 用脚本做"第一方白名单"替换，跳过第三方同号包（如 `base64-js`）

## Step 2：验证（发布前必须全绿）

```bash
npm run build
npm test          # 串行跑全部 workspace，exit code 0 才算过
# 四包 dry-run 预演
for p in core plugin-kit canvas echarts; do (cd packages/$p && npm publish --dry-run --registry=https://registry.npmjs.org); done
```

校验四个发布包版本与拟用 tag 一致（CI 也会强校验）：

```bash
for p in core plugin-kit canvas echarts; do node -p "require('./packages/$p/package.json').version"; done
```

## Step 3：提交、打 tag、双推

```bash
git add -A
git commit -m "release: X.Y.Z <本次改动摘要>"   # 中文提交信息
git tag -a vX.Y.Z -m "release vX.Y.Z: <摘要>"
```

**推送要注意**：`origin` 的 push URL 可能是 `git@github.com:` SSH，非交互 shell 会卡在 host key 确认。改用 HTTPS + token：

```bash
TOKEN=$(grep 'github.com' ~/.git-credentials | head -1 | sed -E 's#https://(.*):(.*)@github.com#\2#')
GIT_TERMINAL_PROMPT=0 git push "https://x-access-token:${TOKEN}@github.com/worm-longliu/worm-print-platform.git" master
GIT_TERMINAL_PROMPT=0 git push "https://x-access-token:${TOKEN}@github.com/worm-longliu/worm-print-platform.git" vX.Y.Z
# Gitee 同理，host 换 gitee.com，repo 换 liulong_oschina/worm-print-platform
```

推送后验证：

```bash
gh api repos/worm-longliu/worm-print-platform/git/ref/heads/master --jq '.object.sha'
gh api repos/worm-longliu/worm-print-platform/git/ref/tags/vX.Y.Z --jq '.object.sha'
```

## Step 4：创建 Release

从 CHANGELOG 新条目整理正文，用 `--notes-file`。**客户端无新包时**在正文写明沿用上一版安装包链接。

```bash
gh release create vX.Y.Z --repo worm-longliu/worm-print-platform --verify-tag \
  --title "vX.Y.Z — <标题>" --notes-file /tmp/release-notes.md
```

## Step 5：触发 CI 发布（npm + Pages + Gitee）

```bash
gh workflow run publish-npm.yml --repo worm-longliu/worm-print-platform -f tag=vX.Y.Z -f dry_run=true   # 先干跑
gh run watch <id> --repo worm-longliu/worm-print-platform --exit-status
gh workflow run publish-npm.yml --repo worm-longliu/worm-print-platform -f tag=vX.Y.Z -f dry_run=false  # 正式
gh workflow run deploy-pages.yml --repo worm-longliu/worm-print-platform
gh workflow run create-gitee-release.yml --repo worm-longliu/worm-print-platform -f tag=vX.Y.Z
```

**认证前提**：`publish-npm.yml` 必须是**纯 OIDC**（不注入 `NODE_AUTH_TOKEN`），依赖 `permissions: id-token: write`。npmjs.com 各包需配置 Trusted Publisher（Organization `worm-longliu` / Repository `worm-print-platform` / Workflow `publish-npm.yml` / Environment 空 / **Allowed actions 勾选 npm publish**），账号 Publishing access 选 "disallow bypass 2fa tokens"。若 CI 报 `EOTP` 或 `E404`，见 [references/release-troubleshooting.md](references/release-troubleshooting.md)。

**同版本重发**：npm 不允许覆盖已发布版本（"You cannot publish over the previously published versions"）。若某包已发、只需补发其余包，临时用 GitHub API（PUT contents）改 workflow 跳过已发包，跑完再恢复。git push 被代理阻断时，contents API 是可靠的替代通道。

**registry 同步延迟**：CI 显示发布成功（有 provenance 签名）但 `npm view` 仍显示旧版本，是 registry 边缘节点延迟，等几分钟并用 `?nocache=$(date +%s)` 复查，不要急着重发。

## Step 6：判断桌面客户端是否重新打包

**判断依据不是客户端源码 diff，而是改动是否触及客户端运行时依赖**。

客户端依赖 `@worm-print-platform/core` / `echarts` / `mcp`（见 `clients/client/package.json`），打包时会打进这些包的代码。判断表：

| 本次改动范围 | 是否重打包 |
|---|---|
| 仅设计器（canvas）/ 示例 / 文档 / 宿主契约开关 | ❌ 不重打包，沿用上一版安装包，release 正文说明 |
| 触及 core 渲染管线、表达式引擎、分页、数据绑定等客户端运行时 | ✅ 必须重新打包并上传六件安装包 |
| 客户端自身源码有改动 | ✅ 必须重新打包 |

即使不重打包，也要**把客户端 `package.json` 版本号同步到新版本**（版本载体对齐的一部分），并在 CHANGELOG/release 说明"源码无变更，沿用 vX 安装包"。

重打包命令见 `docs/commands.md` 客户端章节（`npm run pack:client` + `pack:client:linux` + `pack:client:release` 生成 SHA256SUMS）。上传用 `gh release upload <tag> --clobber` **串行单件、绝不中断**；判断 asset 成功必须查 `state=uploaded`（starter 是空壳，download 404）。

## Quick Reference

| 步骤 | 命令/动作 |
|---|---|
| 版本对齐 | 见 version-carriers.md |
| 验证 | `npm run build` + `npm test` + 四包 dry-run |
| 打 tag | `git tag -a vX.Y.Z` + HTTPS token 双推 |
| Release | `gh release create --verify-tag --notes-file` |
| npm | `gh workflow run publish-npm.yml`（纯 OIDC） |
| Pages | `gh workflow run deploy-pages.yml` |
| Gitee | `gh workflow run create-gitee-release.yml` |
| 客户端 | 按 Step 6 判断 |

## Common Mistakes

| 错误 | 正确做法 |
|---|---|
| 全局替换 `1.5.1`→`1.5.2` 误伤第三方 `base64-js` | 第一方白名单替换，跳过第三方同号包 |
| 改了客户端下载链接版本号 | 保留历史链接（指向真实资产） |
| 用 SSH remote push 卡在 host key | 用 HTTPS + token URL |
| 报 EOTP/E404 就地反复重跑 | 查 Trusted Publisher 配置与 workflow 是否纯 OIDC |
| 同版本重发失败就以为发布失败 | 该包已发成功，只需补发其余包 |
| CI 成功但 `npm view` 旧版本就重发 | registry 延迟，等待并带 cache-buster 复查 |
| 只看客户端源码 diff 就决定不重打包 | 看改动是否触及 core/echarts/mcp 运行时 |

# 版本载体清单

发版时所有需要同步的版本位置。用脚本做"第一方白名单"替换（`OLD→NEW`），**不要全局 sed**。

## 必须改（自身版本 `OLD→NEW`）

### package.json（14 个，`services/render` 除外）

```
package.json
clients/client/package.json
packages/{core,plugin-kit,canvas,echarts,skills,contract,mcp}/package.json
demos/apps/{vue3,vue2,react,jquery}/package.json
```

### lock 文件（5 个）

```
package-lock.json
demos/apps/{vue3,vue2,react,jquery}/package-lock.json
```

**坑**：root lock 里第三方 `base64-js` 版本恰好是 `1.5.1`（含 `resolved` URL 和依赖范围 `^1.5.1`），全局替换会误伤。按行处理时**跳过含 `base64-js` 的行**。demos lock 里的 `file:../../../packages/*` 快照的 `version` 与依赖范围也要改。

### 内部依赖范围

所有 `"@worm-print-platform/*": "^OLD"` → `^NEW`，分布在上述 package.json 与 lock 文件。

### 代码常量

```
packages/mcp/src/version.ts   →  export const version = 'NEW'
```

### 文档

```
README.md                     →  npm badge vOLD→vNEW；客户端下载链接仅在"不改"条款所述条件下才同步替换
CHANGELOG.md                  →  顶部新增 "## VNEW(日期)" 条目
docs/commands.md              →  示例命令 tag=vOLD→vNEW（客户端上传命令块保留历史版本）
packages/{core,plugin-kit,canvas,echarts,skills}/README.md  →  npm badge
skills/worm-print-platform-integration/{SKILL.md,references/*.md}  →  版本说明与依赖示例
```

## 不改（保留历史值）

- `services/render/package.json` 自身版本恒为 `1.0.0`，只抬内部依赖
- 客户端安装包下载链接（`WormPrintClient-OLD-*.dmg` 等）与 `gh release upload` 示例——指向真实存在的旧版 release 资产，改了会 404
- **README 客户端下载链接的更新条件**：只有本轮真的重新打包并上传了新版客户端安装包（release 里对应资产 `state=uploaded`）时，才把 README 表格里的直链和 `vOLD` 换成新版本；纯设计器 / npm 发版、没有新客户端包时，保留历史版本链接不改。README 表格旁有 HTML 注释提醒这一规则。
- CHANGELOG 历史条目、`.workbuddy/`、`.video-skill/` 中的历史版本记录
- 第三方依赖版本（npm CLI `11.5.1`、Node `22.14.0` 等数字恰好含旧版本号的文本）

## 升版脚本骨架

```js
// 自身版本：render 跳过，其余 OLD->NEW
// 内部依赖：("@worm-print-platform/...": "^)OLD(") -> NEW
// lock：逐行，跳过含 'base64-js' 的行，其余 OLD->NEW
// version.ts：version = 'OLD' -> 'NEW'
```

跑完用下式验证无残留（排除 docs/dist/.video/.workbuddy/package-lock）：

```bash
grep -rn 'OLD' --include=package.json --include=*.ts --include=package-lock.json \
  package.json packages clients services demos | grep -v node_modules | grep -v /dist/ | grep -v base64-js
```

## 发布包范围

正式发 npm 的是 4 个代码包：`core` / `plugin-kit` / `canvas` / `echarts`（CI workflow 只发这四个）。
`skills` 虽在 CHANGELOG 写"同号同批发版"，但**CI 不发布它**，历史上也未上 npm——release 正文应注明"skills 为 CLI 安装器，不随本轮发版"。
`contract` / `mcp` 随客户端打包，不发 npm。

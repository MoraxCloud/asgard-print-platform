# 版本载体清单

发版时所有需要同步的版本位置。用脚本做"第一方白名单"替换（`OLD→NEW`），**不要全局 sed**。

## 必须改（自身版本 `OLD→NEW`）

### package.json（自身版本 `OLD→NEW`，`services/render` 与 `marketplace/plugins/data-preview` 除外）

```
package.json
clients/client/package.json
packages/{core,plugin-kit,canvas,echarts,skills,contract,mcp,marketplace,i18n}/package.json
marketplace/plugins/echarts/package.json（含 wormPrint.version）
demos/apps/{vue3,vue2,react,jquery,print-demo}/package.json
```

### lock 文件（6 个）

```
package-lock.json
demos/apps/{vue3,vue2,react,jquery,print-demo}/package-lock.json
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

正式发 npm 的是 7 个包：`core` / `plugin-kit` / `canvas` / `echarts` / `skills` / `marketplace` / `i18n`（`publish-npm.yml` 按依赖顺序同批发布，2026-11-23 起扩展至七包）。
百度图表主包 `@worm-print-platform/plugin-echarts` 不单独发 npm，经插件市场 CLI 分发；兼容镜像 `echarts` 随主线发版。
`contract` / `mcp` 随客户端打包，不发 npm。

## 已知坑（1.6.2 发版实测）

- **provenance 校验 repository**：纯 OIDC Trusted Publishing 会校验 sigstore provenance 与 `package.json` `repository.url` 一致；缺 `repository` 字段的包报 E422 中断发布链。新包入库时必须带 `repository`（与其他包同格式）。
- **CLI 入口软链守卫**：bin 入口判断必须 `realpathSync(argv[1])` 归一后对比 `import.meta.url`（见 `isCliEntry`）；用 `resolve` 对比会在 npx 软链调用时静默空转、退出码 0。
- **Git 源插件产物入库**：插件 `package.json` 声明 `wormPrint.i18n.dir` 指向的目录必须被 git 跟踪（根 `.gitignore` 的 `dist/` 需放行例外），否则停发 npm 后 Git 源稀疏检出安装必失败。
- **registry 边缘延迟**：CI 日志出现 `+ @scope/pkg@X.Y.Z` 即发布成功；`npm view` 短暂仍旧版是边缘节点延迟，等几分钟复查，不要重发。
- **补发个别包**：npm 不允许覆盖已发版本；临时用 contents API 改 workflow（固定检出到修复提交、只保留待发包的构建与发布步骤），跑完恢复原版。

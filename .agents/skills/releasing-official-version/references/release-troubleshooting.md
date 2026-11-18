# 发布故障排查

## npm 发布报 EOTP（requires a one-time password）

**根因**：npm 账号启用 2FA，而 CI/local token 是普通 publish token，不是 automation token。npm CLI 回退到 token 路径触发 OTP，CI 无法交互回答。

**解法**：用纯 OIDC Trusted Publishing。
- workflow 必须是 `permissions: id-token: write`，且**不注入** `NODE_AUTH_TOKEN`（`actions/setup-node` 的 `registry-url` 会自动生成占位 `.npmrc`，但不要显式传 secret）
- 删除"验证 npm 登录态"步骤（纯 OIDC 下无意义）
- npmjs.com 各包 Settings → Trusted Publisher → GitHub Actions：
  - Organization/user `worm-longliu`，Repository `worm-print-platform`，Workflow `publish-npm.yml`，Environment 留空
  - **Allowed actions 必须勾选 `npm publish`**（2026-09-03 后新建配置默认只给 stage 权限，不勾则 OIDC 令牌只能进暂存区）
- 账号 Publishing access 选 "Require 2FA and disallow bypass 2fa tokens"

**验证配置是否正确**：触发一次正式发布，看第一个包步骤。通过则日志有 `Signed provenance statement` / `Provenance statement published to transparency log`；失败则看错误码。

## npm 发布报 E404（could not be found or you do not have permission）

**根因**：该包的 Trusted Publisher 未配置，或配置字段与 workflow 不匹配（大小写敏感、完全匹配）。

**排查**：核对 Organization/Repository/Workflow filename/Environment/Allowed actions，尤其 Repository 不含 owner 和 `.git`，Workflow filename 含 `.yml`。

## CI 显示发布成功但 registry 查不到新版本

**现象**：日志有 `+ @pkg@X.Y.Z` 和 provenance 签名，但 `npm view` 仍显示旧版本。

**判断**：这是 registry 边缘节点同步延迟，不是发布失败。证据：`npm publish` 成功 + provenance 已签名 + 无 staged（`npm stage list` 为空）。

**处理**：等几分钟，用 `?nocache=$(date +%s)` 或 `npm view --prefer-online` 复查。不要急着重发。

## You cannot publish over the previously published versions

**含义**：该版本已成功发布过，npm 禁止覆盖。说明之前那次其实成功了（可能是上面"查不到"的情况）。

**处理**：若只需补发其余包，临时改 workflow 跳过已发包（用 GitHub contents API PUT，见主技能 Step 5），跑完恢复。

## git push 被代理阻断（502 / HTTP2 framing / CONNECT tunnel failed）

**现象**：`git push` 到 GitHub 报 `CONNECT tunnel failed, response 502` 或 HTTP2 错误；`env -u` 清代理直连则超时。

**处理顺序**：
1. 用 HTTPS + token URL 重试：`https://x-access-token:${TOKEN}@github.com/...`
2. 用 `gh api` 的 contents API（PUT）直接改文件，绕开 git push——已验证可靠
3. 网络恢复后 `git fetch` 对齐本地与远端（本地与远端内容一致时 `git reset --hard FETCH_HEAD` 安全）

**注意**：`workflow_dispatch` 从默认分支 master 读 workflow 定义，与 tag 无关。改了 master 上的 workflow 后重跑即生效，无需重打 tag。

## 客户端 asset 上传卡在 starter 状态

**现象**：`gh release upload` 后 API 能看到 name/size，但 download URL 404。

**根因**：GitHub asset 两阶段（先建 starter 空壳，数据传完才 uploaded）。上传被中断（gh TaskStop、curl max-time）会只留 starter。

**处理**：`gh release upload <tag> --repo ... --clobber` **串行单件、绝不中断**（实测 40-50 秒/件）。判断成功必须查 `state=uploaded`，不能只看文件名在不在；digest 常为 null 不可用。

## 网络/代理杂项

- 沙箱代理会干扰 github.com download URL（返回 404），测下载要 `env -u HTTP_PROXY -u HTTPS_PROXY -u http_proxy -u https_proxy -u ALL_PROXY -u all_proxy` 直连
- gh keyring token 可能失效，用 `~/.git-credentials` 里的 token 通过 `GH_TOKEN` 环境变量传给 gh
- 校验线上站点用 Node `fetch`（该 shell 的 PATH 可能没有 curl/grep）
- npm 本地 `whoami` 报 ENEEDAUTH 时，显式加 `--registry=https://registry.npmjs.org`——环境变量 `npm_config_registry` 可能指向 npmmirror 导致检查错 registry

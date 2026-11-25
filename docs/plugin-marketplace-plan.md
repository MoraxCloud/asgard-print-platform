# 插件市场方案（Gitee / GitHub / npm 三源分发 + 导出插件）—— 已定稿，待实现

> 记录日期 2026-11-17；2026-11-18 重新整理。状态：**仅方案记录，未动代码**。todo.md 有对应索引条目。
> 模式：插件市场目录常驻本仓；CLI 支持从 Gitee、GitHub、npm 三种来源安装插件，默认取最新稳定版。

## 目标与已定决策

为平台建立「插件市场」：插件源码常驻本仓 `marketplace/`，CLI 安装器支持从 **npm / GitHub / Gitee**
三种来源把单个插件安装到宿主，宿主按清单 import 注册。导出 Excel / Word 等打印内容也纳入插件机制。

### 需求沿革（2026-11-18 重新整理，覆盖此前所有版本）

1. **目录常驻本仓**：`marketplace/` 永久留在当前 monorepo 顶层，**不创建任何独立索引仓**。
2. **三源分发**：安装支持 `gitee` / `github` / `npm` 三种来源，可用 `--source` 指定；默认 `auto` 按
   npm → Gitee → GitHub 顺序尝试。
3. **默认最新稳定版**：`install <name>[@<version>]`，未指定版本时解析为最新稳定版（详见 §4）。
4. **新增导出插件类别**：除元素插件外，导出 Excel / Word 等打印内容也必须可用插件实现；用户选型为
   「接收渲染结果、浏览器侧生成文件并触发下载」（详见 §3.2）。
5. **首个插件改为百度图表（ECharts）**（2026-11-18 实施前补充）：不再先写 qrcode，改用百度图表作为
   首个插件验证整条链路。
6. **插件源码唯一真源在市场**（2026-11-18 二次调整）：`marketplace/plugins/echarts/` 承载图表插件的
   全部实现源码；同一源码构建出 `@worm-print-platform/plugin-echarts`（市场主口径）与
   `@worm-print-platform/echarts`（兼容镜像，存量依赖零改动），两个包均可单独发布、README 统一为
   市场口径。`CHART_PLUGIN_ID` 保持 `@worm-print-platform/echarts` 不变。qrcode 细节保留在 §3.1 作后续样板参考。

### 来源与本仓的对应关系（关键：三源指向同一份源码）

| 来源 | 安装单元 | 源码位置 | 版本载体 | 索引来源 |
| --- | --- | --- | --- | --- |
| `npm` | 独立 npm 包 `@worm-print-platform/plugin-<id>` | 由 `marketplace/plugins/<id>/dist` 发布 | npm `latest` 标签 / 稳定版本 | CLI 包内置 `catalog.json`（构建时从 marketplace.json 生成） |
| `github` | 本仓 `marketplace/plugins/<id>/` | `https://github.com/worm-longliu/worm-print-platform.git` | tag `plugins/<id>/vX.Y.Z` | 稀疏检出仓内 `marketplace.json` |
| `gitee` | 本仓 `marketplace/plugins/<id>/`（同上，镜像） | `https://gitee.com/liulong_oschina/worm-print-platform.git` | 同上 | 同上 |
| `local` | 本地 `--repo ./marketplace` 目录 | 本仓工作区 | 目录内 `plugin.json` | 本地 `marketplace.json` |

- GitHub / Gitee 只是**同一份本仓目录的两处托管**，不新建任何仓库；稀疏检出只取 `marketplace.json` 与
  `marketplace/plugins/<id>/`，不拉取整仓。
- 默认双源常量复用 `packages/skills/src/repo.ts:4,6`（`DEFAULT_GITHUB_REPO` / `DEFAULT_GITEE_REPO`）。

## 一、marketplace/ 目录与索引

```
marketplace/
  marketplace.json        # 索引（schema 见下；npm 源构建时据此生成 CLI 内置 catalog.json）
  README.md               # 收录 PR 流程 + 三源产物协议 + 版本/tag 约定 + 导出插件说明
  plugins/qrcode/
    plugin.json           # 插件清单（schema 见下）
    package.json          # 非 workspace；可发布到 npm（wormPrint 元数据 + 构建产物）
    tsup.config.ts        # 单 entry ESM es2020，external core/plugin-kit
    src/
      vendor/qrcodegen.ts # nayuki QR-Code-generator（MIT，约 950 行，分段写入，文件头注明出处）
      plugin.ts           # defineElementPlugin + registerElementPlugin（import 即注册）
      ui.ts               # defineElementUI + registerElementUI（import 即注册）
      index.ts            # 汇总出口：import './plugin.js' + './ui.js'
      *.test.ts           # vitest：编码已知向量、SVG 输出、binding、注册命中
    dist/marketplace.js   # 预构建产物，提交进仓库（三源共用，免构建安装）
    README.md / LICENSE
  plugins/<export-plugin>/  # 后续新增导出插件，结构同上，契约见 §3.2
```

索引 schema（每条同时描述三种来源的解析信息）：

```json
{
  "schemaVersion": 1,
  "plugins": [
    {
      "id": "qrcode",
      "name": "二维码元素",
      "description": "…",
      "version": "1.0.0",
      "npmName": "@worm-print-platform/plugin-qrcode",
      "path": "plugins/qrcode",
      "entry": "dist/marketplace.js",
      "kinds": ["qrCode"],
      "exportFormats": [],
      "homepage": "…",
      "license": "MIT",
      "minCoreVersion": "1.5.0"
    }
  ]
}
```

插件清单 plugin.json：`{id, version, name, npmName, entry:"dist/marketplace.js",
kinds:[{type:"qrCode",label:"二维码"}], exportFormats:[], peerDeps:{core,plugin-kit}, files 白名单}`。
导出插件把 `kinds` 留空、`exportFormats` 填 `["xlsx","docx",…]`。

产物协议（写进 marketplace/README.md）：

- dist 必须预构建并提交；单文件 ESM。三源共用同一份 `dist/marketplace.js`。
- `package.json` 带 `wormPrint` 元数据字段（id / version / entry / kinds / exportFormats / peerDeps），
  npm 源安装后据此写入宿主清单。
- external 白名单仅 `@worm-print-platform/core`、`@worm-print-platform/plugin-kit`
  （宿主提供，Symbol.for 注册表兜底跨副本去重）；其余依赖全部内联。
- **版本发布**：插件发版时同步做两件事——`npm publish` 对应 npm 包；在本仓打 tag
  `plugins/<id>/vX.Y.Z`（X.Y.Z 为稳定语义化版本，不得用 rc/beta/alpha 作正式版）。
- 收录走本仓 PR：审核 plugin.json 与 dist、登记 marketplace.json 条目；市场不做沙箱，
  信任边界 = PR 审核 + 版本锁定（文档明示）。

## 二、整体安装流程

```
install <name>[@<version>] [--source npm|github|gitee|auto] [--dir ...] [--repo ...] [--force]
        │
        ├─ 1. 解析名称：完整 npm spec / 短 id（索引映射 npmName 或约定 scope）
        ├─ 2. 解析版本：未指定 → 各源各自解析「最新稳定版」（§4）
        ├─ 3. 按来源安装（§4 / §5）：
        │     npm     → npm install <pkg>@<version> → 读 wormPrint 元数据
        │     github  → 稀疏检出本仓 tag plugins/<id>/v<version> → 读 plugin.json
        │     gitee   → 同上，走 Gitee 镜像
        │     local   → 直读 --repo 本地目录（跳过网络）
        ├─ 4. 校验（id/version 与索引一致、entry 存在，否则 INVALID_PLUGIN）
        ├─ 5. 按 files 白名单落盘到 .worm-print/plugins/<id>/
        └─ 6. 更新 .worm-print/plugins.json 清单
```

- `auto` 模式：npm → Gitee → GitHub 依次尝试；**确定性错误**（NOT_FOUND / VERSION_NOT_FOUND /
  INVALID_PLUGIN / BAD_PLUGIN_ID）不换源，仅网络/克隆失败才回退到下一源。
- 指定 `--source` 时只走该源，失败即报错，不做回退。

## 三、插件契约：元素插件 + 导出插件

### 3.1 元素插件（沿用现有契约，不改）

- core：`packages/core/src/designer/element-plugin-registry.ts` —— `PrintElementPlugin`（:116）、
  `ElementPluginRender`（:104，html/createRenderer/executorBundle）、`ElementPluginBinding`（:91）、
  `defineElementPlugin`（:215）、`registerElementPlugin`（:224）；注册表键
  `Symbol.for('worm-print-platform.element-plugin-registry.v1')`（:146）跨 bundle 单实例。
- plugin-kit：`packages/plugin-kit/src/types.ts:53-68` `ElementUI`；`src/registry.ts:70`
  `registerElementUI`，import 副作用注册、Symbol.for 去重。
- echarts 官方样板：`packages/echarts/src/plugin.ts:41-59`、`src/ui.ts:477-503`。
- qrcode 样板要点：kind `qrCode`（fixedHeight，出厂 20×20mm）；optionMeta `qrText` / `qrEcl` /
  `qrMargin` / `qrDark` / `qrLight` / `qrDataSource`；binding 按 `qrDataSource` 从 data 取文本；
  render 用 nayuki 编码输出纯 SVG 字符串（单个 `<path>`、`shape-rendering:crispEdges`），
  无 DOM → 浏览器与服务端 PDF 同一份 html 出纸，**无需 executorBundle**；
  UI `group:'码制'`，renderProperty 用原生 DOM 表单 + **change 提交** + `ctx.update(partial)` 写回。

### 3.2 导出插件（新增契约，需求重点）

「导出 Excel / Word」不是新元素类型，而是与渲染结果对接的**输出类插件**：接收当前渲染后的打印内容，
在浏览器侧生成文件并触发下载。

建议契约形状（实现时按此落地）：

```ts
export interface PrintExportPlugin {
  id: string
  version: string
  /** 支持的导出格式，如 ['xlsx'] / ['docx'] / ['xlsx','docx'] */
  formats: readonly string[]
  /** 浏览器侧导出：输入渲染结果，输出文件 blob */
  export(input: ExportInput, options?: Record<string, unknown>): Promise<ExportResult>
}

export interface ExportInput {
  /** 渲染后的分页结果（HTML 与纸型尺寸），由主体统一提供 */
  pages: RenderedPage[]
  template: TemplateJSON
  printData: Record<string, unknown>
}

export interface ExportResult {
  filename: string
  blob: Blob
}
```

- 注册：core 新增 `export-plugin-registry.ts`，提供 `defineExportPlugin` / `registerExportPlugin` /
  `getExportPlugins` / `getExportPluginByFormat`，注册表键
  `Symbol.for('worm-print-platform.export-plugin-registry.v1')`。
- **宿主接入（规划中，尚未实现）**：设计器工具栏 / 宿主 UI 按已注册 `formats` 自动生成「导出 Excel」「导出 Word」菜单项的方案见 `docs/proposals/05-export-plugins.html`（P2 待增功能）；当前已落地的是导出插件注册契约，宿主导出菜单与下载入口尚未实现。实现后点击取当前 `pages` + `template` + `printData` 调 `plugin.export()`，拿到 `blob` 触发浏览器下载。
- **能力边界（用户已确认接受）**：渲染结果导出是「所见即所得」但**结构化差**——HTML 表格转 xlsx
  单元格的列对齐、docx 排版还原均由插件自身负责，主体不保证保真；大文件性能也由插件自行优化。
- contract 联动：`packages/contract/src/kinds.ts:52-58` 的 strict 校验（MISSING_PLUGIN /
  PLUGIN_VERSION_MISMATCH）需同时识别导出插件 id——导出插件不新增元素 kind，必须登记其 id，
  否则模板引用导出插件会被误判。
- 后续可选：plugin-kit 增加导出插件配置 UI 契约（先不做，保持最小实现）。

## 四、版本解析：默认最新稳定版

命令语法：`install <name>[@<version>] [--source ...]`。未带 `@version` 时按来源解析最新稳定版。

| 来源 | 指定版本 | 未指定版本（默认） |
| --- | --- | --- |
| npm | `npm install <pkg>@<version>` 精确安装 | 取 `npm view <pkg> dist-tags.latest`；若该版本含预发布标识（rc/beta/alpha 等），改取 `npm view <pkg> versions` 中**最高的非预发布版本** |
| github / gitee | 检出 tag `plugins/<id>/v<version>` | `git ls-remote --tags --refs` 列 `refs/tags/plugins/<id>/v*`，按语义化版本取**最高的非预发布 tag**；无 tag 时回退默认分支 HEAD，并在清单标注 `"stable": false` |
| local | 读目录 `plugin.json` 的 version | 同左（目录即当前版本，不做网络解析） |

- 零运行时依赖约束：内部实现极简 semver 比较器（解析 major.minor.patch + 预发布识别），不引入 `semver` 包。
- 预发布判定：版本号含 `-` 后接 rc / beta / alpha / next / dev 等标识即视为非稳定，正式版不得带此标识。
- 解析不到匹配版本报 `VERSION_NOT_FOUND`（确定性错误，不触发换源）。

## 五、packages/marketplace 安装器

- 包名 `@worm-print-platform/marketplace`，bin `worm-print-marketplace`；零运行时依赖；
  tsup 双 entry（index + cli）ESM node18 dts；vitest 与源码同目录；工程配置照抄 skills。
- 命令最小集：`list` / `install <name>[@<version>]` / `remove <name>`；
  旗标 `--source npm|github|gitee|auto`（默认 auto）/ `--dir`（默认 `.worm-print/plugins`）/
  `--repo`（仅本地源码开发）/ `--force` / `-h` / `-v`。
- 名称解析：完整 npm spec（如 `@worm-print-platform/plugin-qrcode@1.0.0`）或短 id（经 marketplace.json
  映射到 `npmName`；未登记短 id 按约定 `@worm-print-platform/plugin-<id>` 解析）。解析失败报 BAD_PLUGIN_ID。

### 各来源安装细节

- **npm**：解析版本 → `npm install <pkg>@<resolved>` 到宿主 → 从 node_modules 读 `wormPrint` 元数据 →
  校验 → 落盘 → 写清单。失败码 NPM_FAILED。
- **github / gitee**：复用 skills 的 `repo.ts` 双源解析 + `install.ts` 临时目录 + 浅克隆 + 稀疏检出骨架
  （execFile 不经 shell、超时、GIT_TERMINAL_PROMPT=0）；稀疏检出集合
  `marketplace.json` + `marketplace/plugins/<id>`；按 §4 解析 tag/分支后检出 → 校验 plugin.json → 落盘。
  失败码 CLONE_FAILED / GIT_MISSING。
- **local**：`--repo` 指向含 `marketplace.json` 的目录时直读文件系统（`plugins/<id>`），零网络依赖，
  供离线与开发调试。
- remove：`npm uninstall`（仅 npm 源）+ 删插件目录 + 删清单条目；已存在默认 ALREADY_EXISTS，`--force` 覆盖重装。

### 宿主清单 .worm-print/plugins.json

```json
{
  "schemaVersion": 1,
  "plugins": {
    "echarts": {
      "version": "1.0.0",
      "entry": "plugins/echarts/dist/marketplace.js",
      "kinds": ["barChart", "lineChart"],
      "exportFormats": [],
      "npmName": "@worm-print-platform/plugin-echarts",
      "source": { "mode": "npm", "repo": "…", "tag": "…" },
      "stable": true,
      "installedAt": "…"
    }
  }
}
```

- `source.mode` = `npm` / `github` / `gitee` / `local`；git 源附带 repo 与 tag，local 附带路径。
- `stable`：默认解析为最新稳定版时 true；git 无 tag 回退主干时 false。
- 错误码集：BAD_ARGUMENT / BAD_PLUGIN_ID / BAD_REPO / ALREADY_EXISTS / NOT_FOUND / VERSION_NOT_FOUND /
  INVALID_PLUGIN / NPM_FAILED / CLONE_FAILED / GIT_MISSING；退出码映射同 skills cli；
  VERSION 经 tsup `define` 注入。

## 六、宿主加载链路（demos/apps/vue3 验证）

- `demos/apps/vue3/src/main.js` 增 `import '../.worm-print/plugins/echarts/dist/marketplace.js'`
  （import 即注册，registerAll 前后均可）；导出插件同理 import 即注册。
- `demos/apps/vue3/vite.config.js` 加
  `resolve.dedupe:['@worm-print-platform/core','@worm-print-platform/plugin-kit']`；
  即便重复副本，Symbol.for 注册表兜底去重。
- demo `.gitignore` 增 `.worm-print/`。
- 通用宿主写法（写进文档，demo 用静态 import 保持最小）：元素插件按清单
  `import.meta.glob('../.worm-print/plugins/*/dist/marketplace.js',{eager:true})`；导出插件由 core 注册表枚举，
  宿主菜单按 `formats` 自动生成。

## 七、根脚本 / 发布 / 文档（实现时改动清单）

- 根 `package.json` 四处：`build`、`test` 末尾串接 `-w @worm-print-platform/marketplace`；
  `publish:npm`、`publish:dry-run` 追加该包。
- `AGENTS.md` 两处：工作区包清单增 marketplace 条目 + 顶层 `marketplace/` 说明（常驻本仓、不独立建仓）；
  发布段「五个」→「六个」并补 bin/npx 说明。
- 新增 `docs/plugin-marketplace.md`（CLI 用法含三源与版本规则 + 插件作者指南 + npm/tag 发布流程 +
  导出插件契约）；根 README 与 docs/README.md 增补入口链接。
- contract strict 校验联动识别导出插件 id（见 §3.2）。

## 八、实施顺序

1. `marketplace/plugins/qrcode/src/vendor/qrcodegen.ts`（分段写入）+ 编码单测。
2. qrcode `plugin.ts` / `ui.ts` / `index.ts` + package.json（含 `wormPrint` 元数据）/ tsup.config →
   构建 dist → 插件单测。
3. `marketplace/marketplace.json`、`plugins/qrcode/plugin.json`、两级 README（含 tag/版本约定）。
4. **core 导出插件契约** `export-plugin-registry.ts` + 单测；contract 插件 id 校验联动；plugin-kit 暂不改。
5. `packages/marketplace/src/{types,repo,install,manifest,version,cli,index}.ts` + 同目录测试 + 工程配置：
   - `version.ts`：极简 semver 比较器 + 三源最新稳定版解析；
   - `repo.ts` / `install.ts`：复用 skills 双源骨架（GitHub/Gitee）+ npm 安装分支 + 清单；
   - 构建脚本从 marketplace.json 生成 CLI 内置 `catalog.json`。
6. 根 package.json 四脚本 + AGENTS.md 两处 + docs；demo 接线（main.js / vite.config / .gitignore）。
7. 端到端验证（qrcode 元素插件 + 一个导出插件样例 + 三源安装）。

## 九、验证

- 单测：
  - `version.ts`：semver 比较、预发布过滤、三源最新稳定版解析、VERSION_NOT_FOUND；
  - marketplace vitest：mock npm 安装、mockGit 双源回退/错误码、短 id 解析、清单/force/remove、auto 源顺序；
  - qrcode：编码已知向量、SVG 快照、binding、`getElementPlugin('qrCode')` 注册命中；
  - 导出插件契约：注册、按 format 查询、Symbol.for 跨 bundle 去重、浏览器导出结果。
- 构建：`npm run build`（含新包与导出插件契约，确认 catalog.json 生成）。
- 端到端（覆盖三源）：
  - `install qrcode --source npm --dir demos/apps/vue3/.worm-print/plugins`（实际 npm 包或本地 mock registry）；
  - `install qrcode --source github --repo <本仓 URL> --dir …`、`--source gitee` 各跑一次，核对稀疏检出与 tag 解析；
  - `install qrcode`（默认 auto，不指定版本）验证落到最新稳定版；
  - 浏览器打开 vue3 demo，素材台「码制」拖二维码、改文本/纠错等级、预览出纸；核对清单与 remove 行为；
  - 安装一个导出插件，浏览器预览后点「导出 Excel / Word」，校验下载文件存在与基本内容。

## 十、可行性预验证（2026-11-18，一次性 spike）

在临时目录跑了 7 项验证，**7/7 通过**（脚本为 throwaway，不进仓库）：

- 极简 semver：预发布过滤、`v` 前缀解析、最高稳定版选取（全预发布返回 null）。
- npm `dist-tags.latest`：真实 registry（npmmirror）可读，`@worm-print-platform/core latest=1.5.2`。
- GitHub / Gitee `ls-remote --tags --refs`：两远端均可达，现有 `v1.5.0`–`v1.5.2`，插件 tag 命名空间为空（符合未发布现状）。
- 两远端 `git clone --depth 1 --filter=blob:none --sparse` + `sparse-checkout set`：均命中。
- npm 源：`npm pack` fixture → `npm install` tarball → 读取包内 `wormPrint` 元数据成功。
- 导出插件注册表：`Symbol.for` 跨 bundle 共享同一实例。
- local 源：落盘 + `.worm-print/plugins.json` 清单回读成功。

未覆盖（属实现阶段或外部前置条件）：

- 远端目前尚无 `marketplace/` 目录，稀疏检出验证用的是现有 `packages/skills/src` 路径；§一目录落地后需按
  `marketplace/plugins/<id>` 重跑。
- 尚未发布任何 `@worm-print-platform/plugin-*` 包，npm 源验证用 fixture tarball 模拟；真实包发布后需再跑。
- 导出插件只验证了注册机制，未验证 xlsx/docx 实际生成（依赖具体库，属实现阶段）。
- `auto` 回退顺序未做跨源失败注入验证（逻辑简单，留待 CLI 单测覆盖）。

## 交付边界

- 不创建远端仓库、不推送、不实际发布 npm——marketplace/ 内容就绪后由维护者手工逐个 `npm publish` 并打 tag；
  `publish:npm` 脚本仅追加 CLI 包。
- 不做 search 命令、不做市场静态站点（可后补静态页读索引 JSON）、不做沙箱
  （文档明示信任边界：PR 审核 + 版本锁定）。
- 导出插件仅覆盖浏览器侧「渲染结果 → 文件」路径；服务端 PDF / 桌面客户端静默打印不接入导出插件
  （如后续需要，另立需求）。

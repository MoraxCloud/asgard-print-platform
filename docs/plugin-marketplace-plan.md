# 插件市场方案（Git 仓库式分发）—— 已定稿，待实现

> 记录日期 2026-11-17。状态：**仅方案记录，未动代码**。todo.md 有对应索引条目。
> 模式参照：开源 harness 的技能/插件分发（索引仓库 + CLI 安装器，无中心化服务端）。

## 目标与已定决策

为平台建立「插件市场」：第三方插件以独立开源 Git 仓库为分发单元，一份 `marketplace.json`
索引 + CLI 安装器串起「收录 → 安装 → 宿主加载」全链路。

已拍板的四项决策（实现时直接沿用）：

1. **独立开源索引仓库**（未来 `worm-print-plugins`）：先在 monorepo 顶层 `marketplace/`
   目录孵化其完整内容（不进 npm workspaces），之后手工建仓推远端；本地验证走 `--repo ./marketplace`。
2. **文件安装 + 清单**：CLI 把插件产物拷到宿主 `.worm-print/plugins/<id>/`，并维护
   `.worm-print/plugins.json` 清单；宿主按清单 import 注册。离线可用、可锁版本。
3. **首个插件新写 qrcode 二维码元素**（core 渲染器 + plugin-kit UI 双侧注册），
   作为第三方插件作者样板，完整验证整条链路。
4. **安装器新包纳入 npm 发布**：`@worm-print-platform/marketplace`
   （bin `worm-print-marketplace`，npx 分发），与 skills 同等待遇。

## 调研结论（可复用点）

### skills 安装器骨架（packages/skills）
- `src/repo.ts`：`parseRepoUrl`（https/ssh/git@/owner-repo 简写，拒绝空白与 `-` 开头防选项注入）、
  `resolveSources` GitHub→Gitee 双源回退（默认常量 L4-6）。
- `src/install.ts`：`defaultGitExecutor` 用 execFile（不经 shell、120s 超时、`GIT_TERMINAL_PROMPT=0`）；
  流程 = mkdtemp → `git clone --depth 1 --filter=blob:none --sparse` → sparse-checkout set 子目录 →
  校验标记文件 → cpSync → finally 清理；NOT_FOUND/GIT_MISSING 确定性错误不换源，其余聚合 CLONE_FAILED。
- `src/types.ts`：`GitExecutor` 可注入接口（mockGit 离线测试范式）、SkillError 稳定错误码。
- 已知坑：`src/cli.ts:97` VERSION 硬编码与 package.json 不同步——新包用 tsup `define` 注入版本。
- 工程约定：零运行时依赖、tsup 双 entry（index+cli）ESM node18 dts、vitest 与源码同目录。

### 插件契约与注册表
- core：`packages/core/src/designer/element-plugin-registry.ts` —— `PrintElementPlugin`（:116）、
  `ElementPluginRender`（:104，html/createRenderer/executorBundle）、`ElementPluginBinding`（:91）、
  `defineElementPlugin`（:215）、`registerElementPlugin`（:224，自动并入能力表）；
  `Symbol.for('worm-print-platform.element-plugin-registry.v1')`（:146）跨 bundle 单实例。
- plugin-kit：`packages/plugin-kit/src/types.ts:53-68` `ElementUI`（types/renderCanvas/renderProperty/
  hasProperties/group/searchKeywords/styles）；`src/registry.ts:70` `registerElementUI`
  import 副作用注册、同 type 后注册覆盖、Symbol.for 跨 bundle 去重。
- echarts 官方样板：`packages/echarts/src/plugin.ts:41-59`（defineElementPlugin：
  id/version/kinds/optionMeta/binding/render.html+createRenderer）；`src/ui.ts:477-503`
  （defineElementUI + import 即注册）；tsup external core/plugin-kit/echarts。
- contract：`packages/contract/src/kinds.ts:52-58` 动态并入已注册插件 kind；模板声明
  `plugins:[{id,version}]` 触发 strict 校验（MISSING_PLUGIN/PLUGIN_VERSION_MISMATCH）——
  第三方新元素类型只要先 import 注册即不会被拒。

## 一、marketplace/ 孵化目录（独立索引仓库内容）

```
marketplace/
  marketplace.json        # 索引（schema 见下）
  README.md               # 收录 PR 流程 + 插件产物协议
  plugins/qrcode/
    plugin.json           # 插件清单（schema 见下）
    package.json          # 非 workspace；devDeps 以 file: 链接 core/plugin-kit 仅供类型与构建
    tsup.config.ts        # 单 entry ESM es2020，external @worm-print-platform/core 与 plugin-kit
    src/
      vendor/qrcodegen.ts # nayuki QR-Code-generator（MIT，约 950 行，分段写入，文件头注明出处）
      plugin.ts           # defineElementPlugin + registerElementPlugin（import 即注册）
      ui.ts               # defineElementUI + registerElementUI（import 即注册）
      index.ts            # 汇总出口：import './plugin.js' + './ui.js'
      *.test.ts           # vitest：编码已知向量、SVG 输出、binding、注册命中
    dist/index.js         # 预构建产物，提交进仓库（CLI 免构建安装）
    README.md / LICENSE
```

索引 schema：

```json
{
  "schemaVersion": 1,
  "plugins": [
    {
      "id": "qrcode",
      "name": "二维码元素",
      "description": "…",
      "version": "1.0.0",
      "path": "plugins/qrcode",
      "entry": "dist/index.js",
      "kinds": ["qrCode"],
      "homepage": "…",
      "license": "MIT",
      "minCoreVersion": "1.5.0"
    }
  ]
}
```

插件清单 plugin.json：`{id, version, name, entry:"dist/index.js",
kinds:[{type:"qrCode",label:"二维码"}], peerDeps:{core,plugin-kit}, files 白名单}`。

产物协议（写进 marketplace/README.md）：
- dist 必须预构建并提交（安装器免构建）；单文件 ESM。
- external 白名单仅 `@worm-print-platform/core`、`@worm-print-platform/plugin-kit`
  （宿主提供，Symbol.for 注册表兜底跨副本去重）；其余依赖全部内联。
- 收录走索引仓库 PR：审核 plugin.json 与产物、登记索引条目；市场不做沙箱，
  信任边界 = 收录审核 + 版本锁定（文档明示）。

### qrcode 插件契约要点
- kind：`type:'qrCode'`、label 二维码、`fixedHeight:true`；出厂 20×20mm。
- optionMeta：`qrText`(text)、`qrEcl`(enum L/M/Q/H 默认 M)、`qrMargin`(count 默认 2)、
  `qrDark`/`qrLight`(color)、`qrDataSource`(text)。
- binding：`bind(options,data)` 按 `qrDataSource` 从 data 取文本填 `qrText`
  （参照 `packages/echarts/src/bind.ts` 口径）。
- render：`html(spec):string` 纯字符串 SVG —— nayuki 编码取模块矩阵，单个 `<path>` 拼暗模块，
  viewBox = 模块数 + 2×margin，`shape-rendering:crispEdges`，width/height 100%；
  `createRenderer:()=>({render:html})`。无 DOM、无运行时库 → 浏览器与服务端 PDF
  同一份 html 直接出纸，**无需 executorBundle**。
- UI：`defineElementUI({types:['qrCode'], renderCanvas, renderProperty, group:'码制',
  searchKeywords:['二维码','qrcode','扫码']})`；renderCanvas 复用 html 包 div
  （pointer-events:none）；renderProperty 原生 DOM 表单、**change 提交**防整树重绘丢焦点、
  只经 `ctx.update(partial)` 写回（参照 echarts ui.ts 写法）。

## 二、packages/marketplace 安装器

- 包名 `@worm-print-platform/marketplace`，bin `worm-print-marketplace`；零运行时依赖；
  tsup 双 entry（index+cli）ESM node18 dts；vitest 同目录；工程配置照抄 skills。
- 命令最小集：`list` / `install <id>` / `remove <id>`；
  旗标 `--repo` / `--dir`（默认 `.worm-print/plugins`）/ `--force` / `-h` / `-v`。
- 复用方式：**复制参数化** skills 骨架（repo.ts 双源解析、install.ts 临时目录+浅克隆稀疏检出+
  回退+清理），不抽共享包——最小实现，两包各自零依赖独立发布。
  默认双源常量指向未来 `worm-print-plugins` GitHub/Gitee 仓。
- 本地 repo：`--repo` 为存在目录且含 `marketplace.json` → 直读文件系统（零 git 依赖离线安装）；
  否则 sparse clone（先 `sparse-checkout set marketplace.json` 读索引，再 `add plugins/<id>`）。
- 安装流程：取索引 → 定位条目 → 取插件目录 → 校验 plugin.json（id/version 与索引一致、
  entry 文件存在，否则 INVALID_PLUGIN）→ 按 files 白名单 cpSync → 更新宿主清单。
- 宿主清单 `.worm-print/plugins.json`：

```json
{
  "schemaVersion": 1,
  "plugins": {
    "qrcode": {
      "version": "1.0.0",
      "entry": "plugins/qrcode/dist/index.js",
      "kinds": ["qrCode"],
      "source": { "repo": "…", "mode": "local" },
      "installedAt": "…"
    }
  }
}
```

- remove：删插件目录 + 清单条目；已存在默认 ALREADY_EXISTS，`--force` 覆盖重装。
- 错误码沿用 skills 风格：BAD_ARGUMENT/BAD_PLUGIN_ID/BAD_REPO、ALREADY_EXISTS、NOT_FOUND、
  CLONE_FAILED/INVALID_PLUGIN、GIT_MISSING；退出码映射同 skills cli。
- `GitExecutor` 可注入供测试；VERSION 经 tsup `define` 注入 package.json 版本。

## 三、宿主加载链路（demos/apps/vue3 验证）

- `demos/apps/vue3/src/main.js` 增 `import '../.worm-print/plugins/qrcode/dist/index.js'`
  （import 即注册，registerAll 前后均可）。
- `demos/apps/vue3/vite.config.js` 加
  `resolve.dedupe:['@worm-print-platform/core','@worm-print-platform/plugin-kit']`；
  即便出现重复副本，core/plugin-kit 的 Symbol.for 注册表兜底去重。
- demo `.gitignore` 增 `.worm-print/`。
- 通用宿主按清单动态加载写法（写进文档，demo 用静态 import 保持最小）：
  `import.meta.glob('../.worm-print/plugins/*/dist/index.js',{eager:true})`。

## 四、根脚本 / 发布 / 文档（实现时改动清单）

- 根 `package.json` 四处：`build`、`test` 末尾串接 `-w @worm-print-platform/marketplace`；
  `publish:npm`、`publish:dry-run` 追加该包。
- `AGENTS.md` 仅两处：工作区包清单增 marketplace 条目 + 顶层 `marketplace/` 说明；
  发布段「五个」→「六个」并补 bin/npx 说明。
- 新增 `docs/plugin-marketplace.md`（CLI 用法 + 插件作者指南 + 收录流程）；
  根 README 与 docs/README.md 增补入口链接。

## 五、实施顺序

1. `marketplace/plugins/qrcode/src/vendor/qrcodegen.ts`（分段写入）+ 编码单测。
2. qrcode `plugin.ts` / `ui.ts` / `index.ts` + package.json / tsup.config → 构建 dist → 插件单测。
3. `marketplace/marketplace.json`、`plugins/qrcode/plugin.json`、两级 README。
4. `packages/marketplace/src/{types,repo,install,manifest,cli,index}.ts` + 同目录测试 + 工程配置。
5. 根 package.json 四脚本 + AGENTS.md 两处 + docs。
6. demo 接线（main.js / vite.config / .gitignore）+ 端到端验证。

## 六、验证

- 单测：marketplace vitest（mockGit 注入测双源回退/错误码/sparse 参数；mkdtemp fixture
  测本地 repo 安装/清单/force/remove）；qrcode 编码已知向量、SVG 快照、binding、
  `getElementPlugin('qrCode')` 注册命中。
- 构建：`npm run build`（含新包）。
- 端到端：`node packages/marketplace/dist/cli.js list --repo ./marketplace` →
  `install qrcode --repo ./marketplace --dir demos/apps/vue3/.worm-print/plugins` →
  `npm run dev:demos:vue3` → 浏览器素材台「码制」拖二维码、改文本/纠错等级、预览出纸；
  核对 `.worm-print/plugins.json` 清单与 remove 行为。

## 交付边界

- 不创建远端仓库、不推送索引仓、不实际发布 npm——marketplace/ 内容就绪后由用户手工建仓；
  publish:npm 仅改脚本。
- 不做 search 命令、不做市场静态站点（可后补静态页读索引 JSON）、不做沙箱
  （文档明示信任边界：收录审核 + 版本锁定）。
# print-demo Pages 挂载与五方互跳 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让线上 Pages 访客能从五个示例中任意一处跳到其余四处，且 print-demo 在 Pages 子路径下正常渲染与导航。

**Architecture:** 各 demo 保持自包含，不抽共用模块；每个工程按自身现有宿主判定逻辑维护 host 链接表。print-demo 用 `import.meta.env.BASE_URL` 修正路由 base，并在侧边栏常驻互跳入口；其余四个 demo 在既有下拉数据里补一项。Pages 部署流水线已就绪，不改。

**Tech Stack:** Vue 3 / Vue 2 / React / jQuery；Vite；Vue Router；GitHub Pages 子路径部署。

**Spec:** 会话中已批准的设计（意图/目标/非目标/改动清单/验收）。

## Global Constraints

- Pages 站点子路径：`/worm-print-platform/canvas/<host>/`，base 必须带尾斜杠。
- 五个 demo 互不共用壳层；互跳链接表各自维护。
- 不改 `demos/index.html` 与 `.github/workflows/deploy-pages.yml`。
- 本地判定口径统一为 `/^(localhost|127\.0\.0\.1)(:\d+)?$/`。
- print-demo 端口 9336；Pages 路径段 `canvas/print-demo/`。

## Review Focus

- 直接以 Pages 子路径打开 print-demo 首页：路由应命中 `/print/template`，不能空白（由 Task 1 的构建产物路径验证覆盖）。
- 在 print-demo 子路径下点击侧边栏业务菜单：URL 必须保留 `/worm-print-platform/canvas/print-demo/` 前缀（Task 1 验证）。
- 本地 dev 与 Pages 两套地址切换：五个 demo 的互跳链接必须分别指向 `:93xx` 与 `/worm-print-platform/canvas/xxx/`（Task 2 验证）。
- jQuery 无打包器：互跳链接由 `index.html` 内联 `initHostLinks()` 设置，`hosts` 表与 DOM 节点必须同时新增（Task 2 验证）。
- 五个 demo 的互跳表必须是双向闭环，不能出现只有 print-demo 能跳出、别人跳不进来的不对称（Task 3 验证）。

---

### Task 1: print-demo 路由 base 与侧边栏互跳

**Files:**
- Modify: `demos/apps/print-demo/src/router/index.ts`
- Modify: `demos/apps/print-demo/src/layout/index.vue`

**Interfaces:**
- Produces: `createWebHistory(import.meta.env.BASE_URL)`；侧边栏 `#host-links` 分组含 4 个 `<a>`，链接由组件内 `_isLocalhost` / `_hostBase` 计算，口径与 vue3 一致。

- [ ] **Step 1: 修正路由 base**

`demos/apps/print-demo/src/router/index.ts`：把 `createWebHistory()` 改为 `createWebHistory(import.meta.env.BASE_URL)`。

- [ ] **Step 2: 侧边栏加互跳分组**

`demos/apps/print-demo/src/layout/index.vue`：在 `.demo-layout__menu` 现有 4 个 `RouterLink` 之后，新增一个带分隔线的分组，含标题「示例互跳」与 4 个 `<a>`（Vue3/Vue2/React/jQuery）。脚本中按 `_isLocalhost = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(window.location.host)` 与 `_hostBase = _isLocalhost ? '' : '/worm-print-platform'` 生成链接：本地分别为 `http://localhost:9331/`、`9332/`、`9335/`、`9334/`；Pages 分别为 `${_hostBase}/canvas/vue3/`、`vue2/`、`react/`、`jquery/`。当前宿主不标 active（print-demo 自身）。样式沿用 `.demo-layout__menu a` 现有规则，分组加一条上边框与内边距即可。

- [ ] **Step 3: 验证 Task 1**

Run: `cd demos/apps/print-demo && npm run typecheck && npm run build`
Expected: 均通过；`dist/index.html` 中资源路径带 `/worm-print-platform/canvas/print-demo/`（用 `PAGES_BASE=...` 构建时）。

- [ ] **Step 4: Commit**

```bash
git add demos/apps/print-demo/src/router/index.ts demos/apps/print-demo/src/layout/index.vue
git commit -m "fix(print-demo): 修正 Pages 子路径路由并加入示例互跳入口"
```

### Task 2: 四个宿主 demo 的互跳表补 print-demo

**Files:**
- Modify: `demos/apps/vue3/src/App.vue`
- Modify: `demos/apps/vue2/src/App.vue`
- Modify: `demos/apps/react/src/App.jsx`
- Modify: `demos/apps/jquery/index.html`

**Interfaces:**
- Consumes: 各文件已有的 `HOST_LINKS` / `hosts` 表与当前宿主判定逻辑。
- Produces: 每个 demo 的互跳表新增 `{ key: 'print-demo' }`（本地 `http://localhost:9336/`，Pages `${_hostBase}/canvas/print-demo/`）。

- [ ] **Step 1: vue3 / vue2 / react 各补一项**

三处 `HOST_LINKS` 的本地数组追加 `{ key: 'print-demo', label: '业务接入示例', href: 'http://localhost:9336/' }`；Pages 数组追加 `{ key: 'print-demo', label: '业务接入示例', href: \`${_hostBase}/canvas/print-demo/\` }`。保持数组原有顺序，追加在 jQuery 之后。

- [ ] **Step 2: jquery 补表项与 DOM 节点**

`demos/apps/jquery/index.html`：`initHostLinks()` 的 `hosts` 对象追加 `print-demo: { port: 9336, path: '/canvas/print-demo/' }`；互跳 `<nav>` 内追加 `<a class="host-link" data-host="print-demo">业务接入示例</a>`（放在 jQuery 之后、当前项之前或之后均可，但不要覆盖 `.on` 当前项）。

- [ ] **Step 3: 验证 Task 2**

Run: 对 vue3/vue2/react 分别 `npm run typecheck`（或 build）；jquery 用页面 DOM 检查 `.host-link[data-host="print-demo"]` 的 href 在 localhost 与模拟 Pages 两种 host 下分别正确。
Expected: 五个互跳表均含 print-demo，地址符合 Global Constraints。

- [ ] **Step 4: Commit**

```bash
git add demos/apps/vue3/src/App.vue demos/apps/vue2/src/App.vue demos/apps/react/src/App.jsx demos/apps/jquery/index.html
git commit -m "feat(demos): 四个宿主示例互跳表纳入 print-demo"
```

### Task 3: 端到端验证五方闭环

**Files:** 无（仅验证）。

- [ ] **Step 1: 构建五个 demo 并检查互跳链接**

按 `PAGES_BASE=/worm-print-platform/canvas/<host>/` 依次构建五个工程，检查各产物中互跳链接包含 `canvas/print-demo/` 与其余四个 host 路径。

- [ ] **Step 2: Pages 子路径下 print-demo 路由烟测**

以静态 server 托管构建产物，访问 `/worm-print-platform/canvas/print-demo/`，断言页面渲染出「插件介绍」侧边栏菜单、点击「模板管理」后 URL 前缀仍为 `/worm-print-platform/canvas/print-demo/`。

- [ ] **Step 3: 汇总验收结果**

汇总 typecheck / build / 单测 / 链接与路由断言结果；不提交，交还用户确认。

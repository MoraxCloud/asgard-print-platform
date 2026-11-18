# 图表插件源码迁入市场（单一真源 + 双 npm 包）实施计划

**Goal:** 把 `@worm-print-platform/echarts` 的插件实现整体迁入 `marketplace/plugins/echarts/`，使其成为唯一源码真源；同一源码构建出可单独发布的 `@worm-print-platform/plugin-echarts`（市场主口径）与兼容包 `@worm-print-platform/echarts`，两者 README 统一为市场口径。

**Spec:** 用户 2026-11-18 决策（市场为唯一源码真源；两个都发、市场包为主；全部文档按市场口径）。

## 关键约束

- 现有 6 个依赖方（client / render / 四 demo）零改动：`@worm-print-platform/echarts` 的子路径与行为保持不变。
- `CHART_PLUGIN_ID` 保持 `@worm-print-platform/echarts`（模板里已声明该 id，改动会触发 contract MISSING_PLUGIN）。
- 市场主入口需同时注册插件描述符与 UI；兼容包根入口保持原行为（只注册插件描述符）。
- 两个 npm 包均从同一份源码生成，README 同一份。

## 任务

1. 迁移：`packages/echarts/src/**` 与全部构建配置迁入 `marketplace/plugins/echarts/`；源码内自引用改为 `@worm-print-platform/plugin-echarts/kit`；新增 `src/marketplace.ts`（index + ui）。
2. 构建配置：vite 别名相对路径改为 `../../../packages/*`；tsup external 增加 plugin-echarts 并新增 marketplace entry；插件 package.json 配齐 exports / build / deps。
3. 兼容镜像：`sync-compat.mjs` 把插件 dist 复制进 `packages/echarts/dist`，并把自引用从 plugin-echarts 改写回 echarts；统一 README 同步到兼容包。`packages/echarts` 仅保留 package.json / README / LICENSE / dist，build 脚本转调插件构建。
4. 市场接线：marketplace.json / plugin.json / wormPrint.entry 改为 `dist/marketplace.js`；demo 入口与已提交产物同步。
5. 根配置：workspaces 增加 `marketplace/plugins/*`；build/test/publish 增加 `@worm-print-platform/plugin-echarts`；AGENTS.md 与文档统一市场口径（七个发布包）。
6. 验证：`npm install` 建链 → `npm run build` → `npm test` → 三源 E2E → demo 浏览器验收；确认 6 个依赖方无需改动。

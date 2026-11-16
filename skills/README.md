# worm-print-platform 使用技能

仓库分发以下两个技能：

| 技能 | 用途 |
| --- | --- |
| `worm-print-platform-integration` | 全形态宿主集成：NPM 宿主的跨框架 Custom Element 契约 + **Vue 3 组件写法**（`canvas/vue3` 正式门面，兼容原 `@worm-vue3-print/canvas` 用法，迁移零业务改动）、浏览器直挂 / 无打包器（jQuery、原生 JS）与 Vue 2 / React 等非 Vue 3 宿主（`window.WormPrintCanvas` 全局、框架生命周期）、三条打印链路、全栈宿主最小清单、宿主 MCP 实时画布 |
| `worm-print-platform-mcp` | 桌面 MCP 工具：实时画布模板生成、校验、视觉回读、参考图比对与会话写回 |

设计器权威实现是 `@worm-print-platform/canvas`（零框架 Custom Elements + Shadow DOM），
设计器契约的机器可读单一真源在 `packages/canvas/src/host-contract.ts`。**Vue 3 宿主是一等支持路径**：
`@worm-print-platform/canvas/vue3` 兼容门面与原 `@worm-vue3-print/canvas` 组件同形（props / 事件 /
ref 方法一致），原 Vue 3 项目只换依赖与 import 即可迁移，模板与业务逻辑不动。
本仓没有 `common` 包（那是拆仓前 worm-vue3-print 的旧包），零框架 / 非 Vue 3 宿主统一消费
canvas 主入口或其 UMD 产物。框架接入操作方法与 AI 集成提示词见 [docs](../docs/README.md)。

两个技能由 [worm-vue3-print](https://github.com/worm-longliu/worm-vue3-print) 的同名分发技能迁移而来
（原 `common` 直挂技能已并入 `integration`），已按当前仓库的包名（`@worm-print-platform/*`）、
包结构（`packages/core` / `canvas` / `contract` / `mcp` / `plugin-kit`、`services/render`、
`clients/client`）与真实组件契约改造。随仓库源码维护，不参与 npm 发布。

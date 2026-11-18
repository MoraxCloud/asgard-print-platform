# 更新日志

本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。版本号以 `1.5.x` 主线持续维护迭代，
`core` / `plugin-kit` / `canvas` / `echarts` / `skills` 等正式包同号同批发版；
`contract` / `mcp` 随桌面客户端打包，不单独发布到 npm。

## V1.5.3(待发布)

- **设计器主题支持参数化配色**：新增 `theme`（`auto` / `light` / `dark`）与 `theme-config` 两个参数，attribute 与 property 双通道；优先级为参数覆盖 > 显式预设 > 系统 `prefers-color-scheme` > CSS 令牌 > 内置浅色。内置暗色预设只作用于设计器外壳，纸张、画布背景、标尺与手柄保持原值，预览所见即所得不受影响。
- **设计器状态栏显示版本号**：移除底部「未保存 / 已保存」指示，改为显示 `v<canvas 包版本>`（由 `gen-version` 从 package.json 派生，不漂移）；缩放 / 元素数 / 纸张等其余状态项不变，`save()` 的数据层语义不受影响。
- **宿主契约升级至 1.2.0**：主题令牌清单补全至 55 项，Vue 3 门面同步两个 prop；core 补齐 3 个此前仅有 fallback 的令牌。
- 设计器内置「更新记录」补齐至 V1.5.2，消除与包版本的滞后。
- **四个宿主 demo 新增「配置」弹窗**：顶部新增配置入口，集中预览 / 保存按钮显隐，原有顶部操作与弹窗保持不变。配色配置未纳入示例——换肤通过给设计器传 `theme` / `themeConfig` 实现（画布纸张不受影响），接入文档已补充这两项参数说明。
- 修复 vue2 demo 预览显隐开关失效（模板属性绑定把 `show-preview="false"` 渲染为移除属性），显隐统一走 property setter。

- **图片 base64 支持增强**：设计态图片元素与表格图片单元格的 `{字段}` 表达式，改为优先用宿主注入的 `designData` 求值（未注入仍回落内置 demo 数据），动态 base64 图片现可在设计画布直接渲染；新增「Base64 图片验证」示例覆盖静态内联与动态注入两种写法（四宿主同源）。
- **宿主契约升级至 1.1.0**：新增 `showPreview` / `showSave` 布尔开关（`show-preview` / `show-save` attribute），宿主可隐藏工具栏「预览 / 保存」按钮并自行接管出图业务；隐藏不影响 `save()` 方法与 `save` / `preview` 事件。Vue 3 门面同步提供同名 props。
- **版本载体对齐**：各工作区包与 demos 同步至 `1.5.2`，MCP 客户端版本常量一并更新；桌面客户端源码无变更，沿用 v1.5.1 安装包。
- 补充 `image-design-data` / `toolbar-visibility` 回归测试，更新 canvas README / PARITY / 集成技能文档。

## V1.5.1(2026-11-16)

- **首个 GitHub Release**：新增桌面客户端安装包发行版，mac（x64 / arm64）、Windows、Linux（deb / rpm / AppImage）
  六件安装包随本版发布，README 提供直链与 `SHA256SUMS.txt` 校验清单。
- **版本载体对齐**：各工作区包与 demos 版本同步至 `1.5.1`，MCP 客户端版本常量一并更新。
- **文档转正**：项目明确定为后续维护迭代的稳定主版本；清除各文档中"实验性质 / 尚未发布 / 待发"等过时描述；
  补齐 CHANGELOG、CONTRIBUTING、CODE_OF_CONDUCT、SECURITY 四份开源项目文档。
- **能力增强**：合入表达式引擎中文 key 提示与相关测试、Vue 3 示例模板等改动。

## V1.5.0(2026-11-16)

- **第一个稳定版本**：`core` / `plugin-kit` / `canvas` / `echarts` `1.5.0` 发布到 npm。
- 设计器以 `@worm-print-platform/canvas` 为权威实现，从 `worm-vue3-print` 的 common 生态独立拆仓，
  npm scope 迁移为 `@worm-print-platform/*`；`/vue3` 门面保留 Vue 3 兼容轨。
- 插件化元素正式化：`plugin-kit`（插件设计器 UI 契约）与 `echarts`（图表元素可选包）从工作区源码包升级为 npm 正式包。
- 三条出纸链路（浏览器打印 / 服务端 PDF / 桌面客户端静默打印）共用同一套同构渲染管线。

# 更新日志

本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。版本号以 `1.5.x` 主线持续维护迭代，
`core` / `plugin-kit` / `canvas` / `echarts` / `skills` 等正式包同号同批发版；
`contract` / `mcp` 随桌面客户端打包，不单独发布到 npm。

## V1.5.1(2026-11-16)

- **首个 GitHub Release**：新增桌面客户端安装包发行版，mac（x64 / arm64）、Windows、Linux（deb / rpm / AppImage）
  六件安装包随本版发布，README 提供直链与 `SHA256SUMS.txt` 校验清单。
- **版本载体对齐**：各工作区包与 demos 版本同步至 `1.5.1`，MCP 客户端版本常量一并更新。
- **文档转正**：项目明确定为后续维护迭代的稳定主版本；清除各文档中"实验性质 / 尚未发布 / 待发"等过时描述；
  补齐 CHANGELOG、CONTRIBUTING、CODE_OF_CONDUCT、SECURITY 四份开源项目文档。
- **同步上游改动**：合入表达式引擎中文 key 提示与相关测试、Vue 3 示例模板等改动。

## V1.5.0(2026-11-16)

- **第一个稳定版本**：`core` / `plugin-kit` / `canvas` / `echarts` `1.5.0` 发布到 npm。
- 设计器以 `@worm-print-platform/canvas` 为权威实现，从 `worm-vue3-print` 的 common 生态独立拆仓，
  npm scope 迁移为 `@worm-print-platform/*`；`/vue3` 门面保留 Vue 3 兼容轨。
- 插件化元素正式化：`plugin-kit`（插件设计器 UI 契约）与 `echarts`（图表元素可选包）从工作区源码包升级为 npm 正式包。
- 三条出纸链路（浏览器打印 / 服务端 PDF / 桌面客户端静默打印）共用同一套同构渲染管线。

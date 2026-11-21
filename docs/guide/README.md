# worm-print-platform 使用文档

面向**把 worm-print-platform 当作打印插件集成**的宿主开发者。本文按主题拆成 10 篇，可从下方目录逐篇阅读，每篇之间也支持互相跳转。

## 目录

| 序号 | 章节 | 内容 |
| --- | --- | --- |
| 01 | [开始之前](./01-getting-started.md) | 三条打印链路速记、配套技能安装与 AI 提示词 |
| 02 | [Vue 3 接入](./02-vue3.md) | 组件门面写法、安装、出纸、必知约定与 AI 提示词 |
| 03 | [Vue 2.7 接入](./03-vue2.md) | `<print-designer>` 自定义元素接入与出纸 |
| 04 | [React 18 接入](./04-react.md) | 自定义元素 + `addEventListener` 接入 |
| 05 | [jQuery / 原生 JS 接入](./05-jquery.md) | UMD 直挂（无打包器）接入 |
| 06 | [多语言配置与自定义](./06-i18n.md) | 内核引擎、宿主接入、插件多语言、Bundle 导出与新增语言 SOP |
| 07 | [插件安装与配置](./07-plugin-install.md) | CLI 三源安装、版本规则、宿主加载与信任边界 |
| 08 | [插件开发](./08-plugin-dev.md) | 元素插件、导出插件、包协议、收录发版与图表样例 |
| 09 | [迁移与故障排查附录](./09-migration-faq.md) | 从 `@worm-vue3-print` 迁移摘要与常见问题 |
| 10 | [数据格式转换](./10-data-transform.md) | 主表 + 多从表按外键关联为批量打印数据：API、数据源示例、边界与接入 |

## AI Agent 接入

完整文档内置 AI 编程工具可直接复制的提示词，并配套官方技能规范（`npx @worm-print-platform/skills` 一键安装）。[从「开始之前」查看技能安装与提示词 →](./01-getting-started.md)

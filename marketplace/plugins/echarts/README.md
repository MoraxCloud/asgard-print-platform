# @worm-print-platform/plugin-echarts

百度图表（ECharts）市场插件：import 即注册十类图表元素与设计器 UI。

## 与图表库的关系

图表实现来自独立发布的 `@worm-print-platform/echarts`（含 `/kit`、`/ui` 子路径）。本包**只是一层薄包装**，
不复制、不内联任何图表库代码；图表库仍独立发布、独立演进。本包自身也可单独 `npm publish`。

## 用法

```js
import '@worm-print-platform/plugin-echarts'
```

宿主需已安装 `@worm-print-platform/core`、`@worm-print-platform/plugin-kit` 与 `@worm-print-platform/echarts`。

## 发布

1. 更新本包 `package.json`、`plugin.json`、`marketplace.json` 三处 version 保持一致。
2. `npm run build` 生成 `dist/index.js` 并提交。
3. `npm publish --registry=https://registry.npmjs.org --access public`。
4. 在本仓打 tag `plugins/echarts/vX.Y.Z`，供 GitHub / Gitee 源解析稳定版本。

# 百度图表插件数据标签设计

> 设计日期 2026-11-18。来源：对 `marketplace/plugins/echarts` 的现状探查 + 逐轮决策确认。
> 实施计划见 `docs/superpowers/plans/2026-11-18-echarts-data-label.md`。

## 一、背景

图表插件（`@worm-print-platform/plugin-echarts`，十类 ECharts 元素）当前对数据标签
（`series.label`）没有任何一等公民支持：`ChartFieldKey` 无 label 键、面板无控件、`optionMeta`
无声明、测试与文档均无。用户只能在模板 JSON 手写 `chartOption.series[].label`，靠 ECharts
原样透传生效。

现状事实（探查确认）：

- 属性面板不是 schema 驱动，是 `src/ui.ts` 一份手写 DOM + `src/kinds.ts` 的字段裁剪。
- `chartOption` 是自由对象，`bind → normalize → setOption` 全程保留未知键，手写通道已通。
- contract 只校验 `chartOption` 是 object，新增标签字段不需要动契约。
- ECharts 版本 6.1.0；`labelLayout` 默认已注册；`emphasis.label` 不会出现在 SSR 导出的 SVG。
- `src/bind.ts` 对含 `{` 的字符串跑 `evaluateTemplate`，会误改 `label.formatter`。
- 饼图 60×60mm 默认 `overflow:'truncate'` 会把标签裁成 0 个文本节点；漏斗/饼/仪表盘有 ECharts 原生默认标签。

## 二、目标

在属性面板中提供「数据标签」可折叠分组，覆盖 ECharts `series.label` 的常用配置，并保证：

1. 存量模板渲染结果不变（默认不开启，不写入任何 label 键）。
2. 预览、浏览器打印、服务端 PDF、桌面客户端四处观感一致。
3. 手写 `chartOption.series[].label` 与面板编辑的是同一份数据，互不覆盖。
4. 不引入新顶层选项键，不改模板契约。

## 三、决策清单

| 编号 | 决策 |
| --- | --- |
| D1 | 标签配置直接写入 `chartOption.series[].label`；多 series 时面板统一同步到所有 series，新增 series 继承 `series[0].label`。 |
| D2 | 不新增 `chartLabel` 之类的顶层键；不修改 contract 与 `optionMeta` 键集合。 |
| D3 | 范围：基础外观 + 标签视觉 + `labelLine`；排除 `rich`、`emphasis.label`、`labelLayout`。 |
| D4 | 按图表能力分档开放字段（见第五节）；仪表盘映射到 `series[0].detail`。 |
| D5 | formatter 采用「预设下拉 + 手写模板」，底层仍是 ECharts 字符串模板（`{b}` / `{c}` / `{d}`）。 |
| D6 | `src/bind.ts` 对 `label` / `detail` 子树内的字符串豁免表达式求值，避免 `{value}` 被业务数据改写。 |
| D7 | 默认零影响：字段缺失即不写入；总开关打开时一次性写入该 kind 的默认集，关闭时只写 `show:false`。 |
| D8 | 版本：`plugin-echarts` 1.0.0 → 1.1.0；`packages/echarts` 1.5.3 → 1.6.0；本次不发布 npm。 |
| D9 | 示例：四个宿主新增独立 `数据标签示例` 模板，不改体检报告模板；视频素材不动。 |
| D10 | 提交拆 4 个：标签读写层 → 面板 UI → 示例与文档 → 版本与构建产物。 |

## 四、字段清单

面板字段共 20 项，按四块排列：

| 块 | 字段 | 控件 | 说明 |
| --- | --- | --- | --- |
| 内容 | `show` | 开关（分组首项，兼总开关） | |
| 内容 | `formatter` | 预设下拉 + 文本框 | 空值表示沿用 ECharts 默认 |
| 内容 | `overflow` | 下拉 none / truncate / break | 饼类默认写 `none` |
| 位置 | `position` | 下拉（按 kind 给候选） | 仪表盘不开放 |
| 位置 | `distance` | 数字 | 饼/环形/漏斗/散点 |
| 位置 | `rotate` | 数字 | 饼图 / 漏斗 / 雷达 / 仪表盘不开放 |
| 位置 | `offsetX` / `offsetY` | 两个数字 | |
| 样式 | `fontSize` | 数字 | |
| 样式 | `fontWeight` | 下拉 normal / bold | |
| 样式 | `color` | 文本（`#rgb` / `#rrggbb` / 颜色名） | 留空删除该键 |
| 样式 | `backgroundColor` | 同上 | |
| 样式 | `borderColor` | 同上 | |
| 样式 | `borderWidth` | 数字 | |
| 样式 | `borderRadius` | 数字 | |
| 样式 | `padding` | 数字（四边同值） | |
| 引导线 | `labelLine.show` | 开关 | 饼/环形/漏斗 |
| 引导线 | `labelLine.length` | 数字 | 饼/环形/漏斗 |
| 引导线 | `labelLine.length2` | 数字 | 饼/环形 |
| 引导线 | `labelLine.smooth` | 开关 | 饼/环形/漏斗 |

颜色不使用 `<input type="color">`：原生取色器无法表达「未设置」，留空删除键的语义
用文本框更直接，也便于单测断言。

> `show` 是「数据标签」分组的首项（总开关），在实现上单独渲染，不进入
> `labelFieldsOf(type)` 返回的字段列表。

## 五、分档表

| 图表 | 开放块 |
| --- | --- |
| 柱状图 / 条形图 | 内容、位置（无 distance）、样式 |
| 折线图 / 面积图 | 内容、位置（无 distance）、样式 |
| 饼图 / 环形图 | 内容、位置（无 rotate）、样式、引导线（含 length2） |
| 散点图 | 内容、位置（含 distance / rotate）、样式 |
| 雷达图 | 内容（无 overflow）、样式（仅 fontSize / fontWeight / color） |
| 漏斗图 | 内容、位置（含 distance，无 rotate）、样式（仅 fontSize / fontWeight / color）、引导线（无 length2） |
| 仪表盘 | `detail` 子集：show / formatter / fontSize / fontWeight / color / offsetX / offsetY |

## 六、默认集（总开关打开时写入）

只补缺失键，已有值一律保留。

| 图表 | 默认值 |
| --- | --- |
| 柱状图 | `{ show: true, position: 'top', fontSize: 12 }` |
| 条形图 | `{ show: true, position: 'right', fontSize: 12 }` |
| 折线图 / 面积图 | `{ show: true, position: 'top', fontSize: 12 }` |
| 散点图 | `{ show: true, position: 'top', fontSize: 11 }` |
| 饼图 / 环形图 | `{ show: true, position: 'outside', overflow: 'none', fontSize: 11 }` |
| 雷达图 | `{ show: true, position: 'top', fontSize: 10 }` |
| 漏斗图 | `{ show: true, position: 'outer', fontSize: 11 }` |
| 仪表盘（detail） | `{ show: true, fontSize: 14 }` |

关闭总开关只写 `show: false`，保留字号、颜色等已有配置，重开即还原。

## 七、formatter 预设

| 预设 | formatter | 适用 |
| --- | --- | --- |
| 数值 | `{c}` | 除雷达外的单值场景 |
| 名称: 数值 | `{b}: {c}` | 直角系 / 散点 / 饼 / 漏斗 |
| 名称 | `{b}` | 直角系 / 饼 / 漏斗 |
| 百分比 | `{d}%` | 饼 / 环形 / 漏斗 |

## 八、非目标

- `rich` 富文本（保留 `chartOption` 手写通道）。
- `emphasis.label`（SSR 导出只出 normal 态，做了也看不到）。
- `labelLayout`（防重叠、自动隐藏）——默认行为会改变存量观感，后续单独立项。
- 单数据点覆盖（`data[i].label`）。
- 新增 `chartLabel` 顶层选项键、contract 字段级校验。

## 九、验收标准

1. 柱状图 / 饼图 / 仪表盘：面板出现「数据标签」分组，打开开关后预览与导出 SVG 出现文本节点。
2. 多值多系列：改一次字号，所有 series 的 `label.fontSize` 同步。
3. 手写 `label: { show: true, formatter: '{value} 元' }`：`{value}` 不被业务数据改写。
4. 关闭开关：只写 `show: false`，其余配置保留。
5. 存量模板（体检报告）零变化：`chartOption` 中不出现 label/detail 键时渲染结果与改动前一致。
6. `npm run build -w @worm-print-platform/echarts` 成功，镜像包计数与插件测试全绿。

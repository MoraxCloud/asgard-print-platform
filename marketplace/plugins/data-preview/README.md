# 数据源预览插件（@worm-print-platform/plugin-data-preview）

在打印设计器的字段树父节点上增加「查看数据源」按钮，把宿主传入的 `designData` 按 JSON 形态解析为多标签页预览：首个「总览」汇总表，存在对象/数组子属性时生成子标签页，且可从汇总表“查看 →”跳转。第一版不分页。

## 安装

```bash
npm install @worm-print-platform/plugin-data-preview
```

或在项目根目录通过市场 CLI 安装：

```bash
npx @worm-print-platform/marketplace install data-preview
```

## 使用

```js
import '@worm-print-platform/plugin-data-preview'
```

import 即注册（与图表插件市场入口同口径）。之后设计器字段树的每个分组标题右侧会出现 👁 按钮，点开即可预览该分组对应的数据。

## 解析规则

| 数据形态 | 总览 | 子标签页 |
| --- | --- | --- |
| 对象 | 三列汇总表（属性 / 类型 / 摘要或值） | 每个对象/数组属性生成一个子 tab，对象渲染表单、数组渲染表格 |
| 数组 | 表格（列取字段中文名或 JSON 键，行取列值） | 元素内的对象/数组列生成子 tab |
| 标量 | 单行展示 | 无 |

- 字段标签优先取 `fields` 中的 `fieldLabel`：容器中文字段名用于总览行与子 tab，叶子字段按所属分组精确匹配。fields 未定义的常用英文键（如 `name`/`phone`/`qty`）由内置词典映射为中文，未知键保留原文。顺序按 `sortOrder`（无 fields 时保持 JSON 插入顺序）。
- 未注入 `fields` 也能独立解析。
- 不分页：表格一次渲染全部行。

## 兼容性

仅依赖 `@worm-print-platform/core` ≥ 1.5.3。插件不注册任何设计器贡献点，不修改宿主业务代码；宿主按需调用 `openDataPreview()` 并用自己的开关控制入口显隐。

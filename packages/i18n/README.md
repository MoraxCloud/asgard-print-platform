# @worm-print-platform/i18n

worm-print-platform 语言包工具：导出翻译骨架、校验与增量更新。零运行时依赖，支持 `npx`：

```bash
npx @worm-print-platform/i18n <命令>
```

## 命令

```bash
worm-print-i18n template [-o <文件>] [--dir <项目根>]
worm-print-i18n validate <文件> [--strict] [--dir <项目根>]
worm-print-i18n update   <文件> [--prune] [--dir <项目根>]
worm-print-i18n report   <语言包文件> [-o <md>] [--dir <项目根>]
```

- `template`：导出扁平点号键 JSON 骨架。排序 core → constants → propertyTips → 插件 id 字母序，同组内按键字母序；2 空格缩进 + 末尾换行。
- `validate`：以当前项目资源生成的骨架为基准校验。缺键 / 空值 / 占位符不一致 = error；多余键 = warn（`--strict` 转 error）；`_meta` 与嵌套对象 = error。
- `update`：保留已有译文，补新增键为空串；`--prune` 删除多余键；写回前按骨架顺序排序。
- `report`：生成人工审核用 Markdown 对照表。**中文列在最左**，其后 en-US / th-TH / 目标语言，最后一列是「使用位置」（`相对路径:行号`，源码优先，最多 3 处）；按模块分组：core 按 key 首段、常量与属性说明独立成组、插件按 `<id> / <第二段>`（如 `echarts / panel`）。

退出码：0 成功 / 1 校验失败 / 2 用法错误。

## 资源发现顺序

1. `<项目根>/.worm-print/i18n/<id>/<locale>.json`（统一目录优先，市场安装写入此处）；
2. `<项目根>/node_modules/<pkg>/<wormPrint.i18n.dir>/<locale>.json` 补充（npm 直装插件，按 `wormPrint.id` 去重）；
3. `<项目根>` 默认 `process.cwd()`，`--dir` 可覆盖。

旧市场安装：`.worm-print/plugins.json` 中有插件条目但没有 `i18n` 字段时，输出「插件 X 的语言资源未同步，请重新安装」，不阻断其他插件。

## 典型工作流

```bash
# 1. 导出骨架（以 zh-CN 为基准）
npx @worm-print-platform/i18n template -o fr-FR.json

# 2. 填写译文（保留 {name} 占位符与 HTML；空值先留空）

# 3. 校验：空值与缺键会报错
npx @worm-print-platform/i18n validate fr-FR.json --strict

# 4. 骨架更新后增量对齐（补的新键为空串）
npx @worm-print-platform/i18n update fr-FR.json
npx @worm-print-platform/i18n validate fr-FR.json --strict
```

`update` 后立即 `validate` 会因新增空值报错，这是预期行为：它提示待翻译项，填完再校验。

## 语言包格式

扁平对象，键自带命名空间前缀，无 `_meta`、无嵌套：

```json
{
  "toolbar.save": "Enregistrer",
  "constants.borderStyle.none": "Aucun",
  "propertyTips.ap-img-fit": "Ajustement de l'image",
  "echarts.panel.chart": "Graphique"
}
```

---
name: worm-print-platform-i18n
description: Use when 用户要为一个已 npm 安装 @worm-print-platform 包的项目生成/补齐目标语言整包 JSON、校验译文、做人工审核对照表，或排查设计器里中英混杂、裸 key、缺键回退中文等语言包问题。
---

# worm-print-platform 自定义语言包工作流

一套扁平点号键 JSON 就能给浏览器设计器、render 服务与桌面客户端提供完整自定义语言（帮助正文除外）。**先导出骨架、再翻译、再校验**，不要手写键；**任何语言包必须来自当前项目实际安装的资源**，不要凭记忆造键。

## 1. 适用场景与边界

- 用户已有 npm 安装的项目（`node_modules/@worm-print-platform/*`），或仓库内有 `.worm-print/i18n/<id>/` 市场安装目录。
- 目标语言可以是 `fr-FR`、`ja-JP` 等任意 BCP47；内置三语是 `zh-CN`（源）、`en-US`、`th-TH`。
- 外挂语言包**不进** `dist/i18n/resources.json`（bundle 只含内置三语）；缺键运行时回退 `zh-CN`。
- 帮助弹窗正文与页签仍是静态中文（已接受的 D17 限制）；模板数据（页面名、示例单元格）不是 UI 文案，不翻译。

## 2. 快速参考：脚本位置

| 用途 | 命令 | 脚本 / 产物位置 |
| --- | --- | --- |
| CLI 本体 | `npx @worm-print-platform/i18n <命令>` | 安装后 `node_modules/@worm-print-platform/i18n/dist/cli.js`；仓库源码 `packages/i18n/src/cli.ts` |
| 导出骨架 | `... template -o fr-FR.json --dir <项目根>` | `packages/i18n/src/{discover,template}.ts` |
| 校验 | `... validate fr-FR.json --strict --dir <项目根>` | `packages/i18n/src/validate.ts` |
| 增量更新 | `... update fr-FR.json [--prune] --dir <项目根>` | `packages/i18n/src/update.ts` |
| **多语对照表** | `... report fr-FR.json -o fr-FR-comparison.md --dir <项目根>` | `packages/i18n/src/report.ts` |
| 内置三语 parity | `npm run i18n:check -w @worm-print-platform/core` | `packages/core/scripts/gen-locale-keys.mjs --check` |
| 一键校验 / 全量门禁 | `npm run verify:i18n` / `verify:i18n:full` | `scripts/verify-i18n.mjs` |
| bundle 导出 | `npm run i18n:bundle` | `scripts/export-locale-bundle.mjs` → `dist/i18n/resources.json` |
| 硬编码中文扫描 | `node scripts/check-hardcoded-zh.mjs <dir...>` | `scripts/check-hardcoded-zh.mjs` |

发现顺序：`.worm-print/i18n/<id>/<locale>.json`（市场安装，优先）→ `node_modules` 下声明 `wormPrint.i18n` 的包。`canvas`/`plugin-kit` 不产出语言资源，不要找它们要 JSON。骨架排序：core → constants → propertyTips → 插件 id 字母序。

退出码：0 成功 / 1 校验失败 / 2 用法错误。

## 3. 生成指定语言的整包配置

在项目根目录执行（`<项目根>` 默认 `process.cwd()`）：

```bash
npx @worm-print-platform/i18n template -o fr-FR.json --dir .
# 翻译 fr-FR.json：只改 value，不动 key
npx @worm-print-platform/i18n validate fr-FR.json --strict --dir .
# 依赖升级、骨架新增键后
npx @worm-print-platform/i18n update fr-FR.json --dir .
npx @worm-print-platform/i18n validate fr-FR.json --strict --dir .
```

翻译硬约束：

- 键自带命名空间前缀、扁平对象；禁止 `_meta`、嵌套对象。
- 值必须是**非空字符串**；空串会被 `validate` 判错，运行时回退中文（`returnEmptyString:false`）。
- `{pos}`、`{value}` 等占位符的数量与名称必须与中文一致；文案里的 HTML 原样保留。
- 中文文案只存资源 JSON；不要往 core 常量里再写一份中文（会双真源漂移）。
- `validate --strict` 把多余键也当错误；`update` 后立即 `validate` 报新增空值是预期，提示待翻译项。

配置到三端（生成 JSON 之后）：

- 浏览器（多实例共享）：`registerLocale('fr-FR', frPack); setLocale('fr-FR')`；单实例隔离：`el.lang='fr-FR'; el.messages=frPack`（`el.messages` 不写全局）。
- render：环境变量 `WORM_PRINT_LOCALE=fr-FR` + `WORM_PRINT_LOCALE_FILE=<绝对路径>`，加载失败 warn 并回退内置语言。
- client：`userData/config.json` 的 `locale` / `localePack`（相对 userData 或绝对路径），或把 JSON 放到仓库根 `locales/` 后运行 `node clients/client/scripts/copy-locales.mjs` 重新打包。

## 4. 生成人工审核用对照表

```bash
npx @worm-print-platform/i18n report fr-FR.json -o fr-FR-comparison.md --dir .
```

表格契约（必须逐条满足）：

1. **中文在最左侧**，其后依次是 en-US、th-TH、目标语言列，最后一列是「使用位置」。
2. 每条文案都有使用位置：`相对路径:行号`，最多 3 处；源码位置优先于 dist 产物；找不到显示 `—`。
3. **按模块分组**，同模块连续排列；core 按 key 首段（如 `core / toolbar`、`core / diagnostic`），常量为「常量 constants」，属性说明为「属性说明 propertyTips」，插件为「`<插件 id> / <第二段>`」（如 `echarts / panel`）。模块按首次出现顺序，模块内按键字母序。
4. 单元格里的 `|` 转义为 `\|`，换行压成空格，避免破坏 Markdown。

生成后把 MD 交给人审核：重点看中文列是否为空、占位符是否丢失、目标语言列是否残留中文、使用位置是否指向正确模块。

## 5. 常见问题

| 症状 | 原因 / 处理 |
| --- | --- |
| 显示 `echarts.panel.overflow.default` 等裸 key | 插件包是旧构建：模块加载期求值 + 只用全局 `t`，晚于 `registerElementUI` 注册。重建插件并把副本同步到 `.worm-print/plugins/<id>/`（示例用 `npm --prefix demos/apps/vue3 run sync-plugin`），确认 `ctx.t` / `withTranslator` 存在 |
| 切 en-US 后属性面板仍中文 | 插件 UI 没用宿主注入的 `ctx.t`，只用了全局 `t`；示例级 `el.lang` 不改全局 locale，必须用 `ctx.t` |
| 中文列为空 | 对照表生成器首列列名「中文」与资源 locale `zh-CN` 映射不一致；确认中文列取 `values['zh-CN']` |
| 缺键但显示中文 | 回退链生效，`fallbackLng:'zh-CN'`；用 `validate` 找缺键，不要靠肉眼 |
| 颜色/线型选项是中文 | 常量用了硬编码 `label` 而非 `labelKey`；改用 `t(preset.labelKey)` |
| 水印密度显示 `Dense（200×120）` | 尺寸后缀括号写死；用 `constants.watermark.density.size` 按语言取词 |

## 6. 完成前自查

- [ ] 骨架来自当前项目的 `template` 输出，不是手写键列表。
- [ ] `validate --strict` 退出码 0。
- [ ] 对照表中文列非空、目标语言列无未翻译中文、使用位置与模块分组正确。
- [ ] 三端注入方式与目标一致（全局 vs 实例级）。
- [ ] 帮助正文中文与模板数据中文未被误判为缺陷。

<p align="center">
  <strong>@worm-print-platform/contract</strong><br>
  <em>打印模板 JSON 契约校验与诊断（私有包）</em>
</p>

> 本包不发布到 npm，随桌面客户端打包。

打印模板的**机器可读契约层**：基于 zod 的 schema、表达式安全校验、静态版面体检与草稿生成。为桌面客户端 MCP 工具、宿主已有 AI 和 CI 校验流水线提供模板格式检查能力。

## 主要导出

| 导出 | 说明 |
| --- | --- |
| `validateTemplateJson(json)` | 模板 JSON 契约校验（zod schema），返回 `{ ok, error? }` |
| `inspectTemplate(json, data?)` | 静态版面体检：表达式残留、未绑定字段、纸张/拼版合理性 |
| `draftTemplate(preset?)` | 生成空白默认模板（可选预设：`a4` / `a4-landscape` / `label-60x40`） |
| `validateExpression(expr)` | 表达式语法与安全性校验 |
| `CONTRACT_VERSION` | 契约版本号（当前 `'1'`） |

## 使用

```ts
import { validateTemplateJson, inspectTemplate, draftTemplate } from '@worm-print-platform/contract'

// 校验模板格式
const result = validateTemplateJson(templateJson)
if (!result.ok) console.error(result.error)

// 版面体检（供 MCP / AI 工具在生成模板后自动校验）
const issues = inspectTemplate(templateJson, sampleData)

// 生成空白模板
const blank = draftTemplate({ preset: 'a4' })
```

## 子模块

| 文件 | 职责 |
| --- | --- |
| `schema/template.ts` | 模板顶层 schema（paperSize / orientation / margins / pages / fonts / tiling） |
| `schema/element.ts` | 各元素 kind 的 schema 与 option 约束 |
| `validate.ts` | `validateTemplateJson`：跑完整 zod schema |
| `expression.ts` | 表达式 `{...}` / `{{...}}` 语法校验 |
| `inspect.ts` | 版面体检：未绑定字段、表达式残留、拼版合理性 |
| `draft.ts` | `draftTemplate` / `fromPreset`：生成空白模板 |
| `presets.ts` | 纸型预设：A4 / A5 / 标签 60×40 / 连续纸 80mm 等 |
| `units.ts` | 单位换算辅助（mm / px / μm） |
| `kinds.ts` | 合法 kind 集合与 kind → 标签映射 |
| `option-meta.ts` | 各元素 option 字段元数据（类型 / 默认值 / 单位 / 是否绑定） |

## 边界

- 类型与判定的**单一真源仍在 `@worm-print-platform/core/designer`** 的模型层，本包只把它们转成 zod schema 供机器消费。
- 本包**不启动任何 transport**、不依赖宿主，纯校验函数。
- 随桌面客户端 Electron 打包，同时在 CI 流水线里用 `real-templates.test.ts` 把 `demos/templates/` 下的真实模板 JSON 纳入契约校验。

## 开发

```bash
npm run build   # tsup → dist/
npm test        # vitest（含真实模板契约校验）
```

## 相关链接

- [根 README 架构分层](https://github.com/worm-longliu/worm-print-platform/blob/main/README.md#架构与分层)
- [设计器内核](../core/README.md)
- [桌面客户端](../../clients/client/README.md)

## License

[MIT](../../LICENSE)

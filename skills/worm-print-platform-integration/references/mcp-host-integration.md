# 宿主端 MCP 集成

仅通过桌面客户端把 AI Agent 接入浏览器里的设计器实时画布；只配置 MCP 客户端而不完成页面接线，不能读写当前模板。

1. 工位电脑启动桌面客户端，在设置页开启「AI 助手」并完成配对。
2. 将设置页生成的本机 HTTP MCP 配置交给宿主已有的 MCP 客户端。
3. 宿主页面通过 `@worm-print-platform/core/client` 响应 `template.get` / `template.apply` 并 `attachTemplate` 签到。
4. 页面卸载时 detach、取消状态监听并关闭 WebSocket。

**先读参考实现**：仓库 `demos/shared/template-session.ts` 是完整可运行的会话模块（`createTemplateSession`），含重试、revision 冲突拒绝、封禁元素拒绝、写回校验、状态机。它不是库公开 API，宿主按自己的框架接入即可，不要试图 import 它。

## API 来源（按宿主形态）

| 宿主形态 | PrintClient / WormPrintError | findBlockedElementPaths |
| --- | --- | --- |
| NPM 宿主 | `@worm-print-platform/core/client` | `@worm-print-platform/core/designer` |
| 浏览器直挂 | `WormPrintCanvas.PrintClient` / `WormPrintCanvas.WormPrintError` | **UMD 未导出** |

直挂宿主拿不到裸包名，`findBlockedElementPaths` 不在 UMD 全局上。仅直挂且无法增加 core/designer ESM 时，MCP 写回**保持只读**（只处理 `template.get`，对 `template.apply` 返回不支持），不要复制一份封禁元素清单后直接开放写回——封禁口径必须与 core 单点一致，复制会漂移。需要完整写回时改用 NPM 宿主形态或额外加载 core/designer ESM。

## 1. 页面侧会话职责

- 页面加载后连接本地桌面客户端；客户端未启动时由 `PrintClient` 固定退避重试，不阻塞设计器。
- 每次连接成功后发 `template.attach`（sessionId 存 sessionStorage，重连复用；6 位 `[a-z0-9]`）。
- 响应 `template.get`：返回当前画布快照（模板 JSON / 字段树 / 打印数据 / 模板名）与内容 revision。
- 响应 `template.apply`：revision 冲突拒绝 → 封禁元素拒绝 → 结构校验 → 深拷贝写回 → 重新读取实际结果返回新 revision。
- 页面卸载 best-effort 发 `template.detach`，连接关闭由桌面端自动回收会话。

## 2. 关键接线（Custom Element 宿主）

下列是宿主代码，不是 canvas 新增的公开组件方法：

```js
import { PrintClient, MESSAGE_TYPES, WormPrintError } from '@worm-print-platform/core/client'
import { findBlockedElementPaths } from '@worm-print-platform/core/designer'

async function revisionOf(value) {
  const text = JSON.stringify(value)
  if (globalThis.crypto?.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
    return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('')
  }
  let hash = 2166136261
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619)
  return (hash >>> 0).toString(16).padStart(8, '0')
}
function assertTemplateShape(value) {
  const single = page => page && typeof page === 'object'
    && typeof page.paperSize === 'string'
    && page.margins && typeof page.margins === 'object'
    && Array.isArray(page.elements)
  const valid = single(value) || (value && Array.isArray(value.pages) && value.pages.every(single))
  if (!valid) throw new WormPrintError('INVALID_TEMPLATE', '模板缺少 paperSize / margins / elements')
}

export function startTemplateSession(element, readExtras, token) {
  const client = new PrintClient({ timeoutMs: 20000, token })
  const sessionId = crypto.randomUUID().replaceAll('-', '')
  const readSnapshot = () => ({ templateJson: JSON.parse(element.getTemplateJson()), ...readExtras() })
  const attach = () => client.attachTemplate({
    sessionId, name: document.title, url: location.href, templateName: readExtras().templateName,
  })

  client.setRequestHandler(async (type, payload) => {
    if (type === MESSAGE_TYPES.TEMPLATE_GET) {
      const snapshot = readSnapshot()
      return {
        sessionId,
        revision: await revisionOf(snapshot.templateJson),
        templateJson: snapshot.templateJson,
        fields: snapshot.fields, printData: snapshot.printData, templateName: snapshot.templateName,
      }
    }
    if (type === MESSAGE_TYPES.TEMPLATE_APPLY) {
      const req = payload
      if (req.baseRevision !== await revisionOf(readSnapshot().templateJson)) {
        throw new WormPrintError('REVISION_CONFLICT', '模板已变化，请重新读取后再应用')
      }
      assertTemplateShape(req.templateJson)
      const blocked = findBlockedElementPaths(req.templateJson)
      if (blocked.length) throw new WormPrintError('INVALID_TEMPLATE', `包含封禁元素：${blocked.join('、')}`)

      element.loadTemplate(structuredClone(req.templateJson)) // 同步装载，写后立即重读实际画布
      const fresh = JSON.parse(element.getTemplateJson())
      return { revision: await revisionOf(fresh), templateJson: fresh }
    }
    throw new WormPrintError('INVALID_REQUEST', `不支持的请求：${type}`)
  })

  const offStatus = client.onStatusChange(s => { if (s === 'connected') void attach().catch(() => {}) })
  void client.connect().catch(() => {}) // 未启动时 PrintClient 自动退避重试
  return async () => {
    offStatus()
    await client.detachTemplate(sessionId).catch(() => {})
    client.close()
  }
}
```

`readExtras()` 应返回宿主最新的 `fields`、`printData`、`templateName`，不要捕获首次渲染的旧值。Vue 2.7 在 `beforeDestroy`、React 在 effect cleanup、jQuery 在页面/组件销毁时调用返回的停止函数。

`revisionOf` 用稳定指纹（键排序后 JSON 序列化再 SHA-256，无 `crypto.subtle` 时退化 FNV-1a）。不要对请求对象原样回显 revision，必须从写回后的画布重新读取计算。

## 3. `/vue3` 门面宿主

沿用组件写法的 Vue 3 宿主：`templateData` 是传给 `PrintDesigner` 的 `:initial-template` 响应式引用。`template.apply` 里赋**深拷贝的新引用**并 `await nextTick()`，再从 `ref.getTemplateJson()`（门面返回对象）重读；不要只改嵌套字段，也不要重复赋值造成第二条历史。`onMounted` 连接、`onUnmounted` detach + 取消监听 + close。

## 4. 约束

- `template.apply` 是整份替换，不是增量 patch；revision 必须按当前实时模板计算。
- 封禁元素类型（如 `html`）由 `findBlockedElementPaths`（`@worm-print-platform/core/designer`）判定，命中即拒绝，不要自己复制一份封禁清单。
- 写回后返回的是从画布重新读取的模板，不是请求对象原样回显；用户可用一次撤销恢复。
- 自定义元素 `loadTemplate()` 只记录装载后的历史检查点，若宿主需要「撤销到写回前」应自行保留写回前快照，并避免重复注入同一模板。
- MCP 配对 token 用于本机客户端鉴权，不是模型密钥；模型调用与密钥只能留在宿主服务端或用户自己的 MCP 客户端，不进前端 bundle。
- 页面关闭 / 客户端退出后会话失效；先重新列出会话，不向失效会话写回。
- 事件与状态：会话工具来自桌面客户端 MCP，`template.get/apply` 只是页面侧响应处理；客户端工具清单见 MCP 技能。

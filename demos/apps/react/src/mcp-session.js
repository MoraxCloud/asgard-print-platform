/**
 * 宿主侧 MCP 模板会话（react demo 自包含实现，与 demos/shared/template-session.ts 同口径）。
 *
 * 把当前设计器画布接入桌面客户端「AI 助手」通道：连接后 attach 签到，响应
 * template.get（返回实时快照 + 稳定 revision）与 template.apply（revision 冲突拒绝 →
 * 结构校验 → 封禁元素拒绝 → 深拷贝写回 → 从画布重读新 revision）。
 *
 * 这是宿主接线代码，不是库公开 API；每个 demo 各自保留一份，便于直接看到全过程。
 */
import { PrintClient, MESSAGE_TYPES, WormPrintError } from '@worm-print-platform/core/client'
import { findBlockedElementPaths } from '@worm-print-platform/core/designer'

const SESSION_KEY = 'worm-print-demo:template-session'
const SESSION_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'

function randomSessionId() {
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  return Array.from(bytes, b => SESSION_ALPHABET[b % SESSION_ALPHABET.length]).join('')
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value && typeof value === 'object') {
    const out = {}
    for (const key of Object.keys(value).sort()) out[key] = canonicalize(value[key])
    return out
  }
  return value
}

/** 稳定内容指纹：键排序后 JSON 序列化再 SHA-256；非安全上下文退化为 FNV-1a。 */
export async function revisionOf(value) {
  const text = JSON.stringify(canonicalize(value))
  if (globalThis.crypto?.subtle) {
    try {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
      return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('')
    } catch { /* 非安全上下文无 subtle，走 FNV-1a */ }
  }
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 0x01000193) >>> 0
  return hash.toString(16).padStart(8, '0').repeat(8)
}

export function createRevisionCache(hash = revisionOf) {
  let lastText
  let lastRevision
  return async value => {
    const text = JSON.stringify(value) ?? 'undefined'
    if (lastRevision !== undefined && text === lastText) return lastRevision
    lastRevision = await hash(value)
    lastText = text
    return lastRevision
  }
}

function isTemplateLike(data) {
  const single = page => !!page && typeof page === 'object'
    && typeof page.paperSize === 'string'
    && !!page.margins && typeof page.margins === 'object'
    && Array.isArray(page.elements)
  if (!data || typeof data !== 'object') return false
  if (single(data)) return true
  return Array.isArray(data.pages) && data.pages.length > 0 && data.pages.every(single)
}

/**
 * @param {object} hooks
 * @param {() => object} hooks.readSnapshot 读取当前画布快照 { templateJson, templateName?, fields?, printData? }
 * @param {(json: object) => Promise<{freshTemplateJson: object, warnings?: string[]}|void>} hooks.writeTemplate 深拷贝写回并重读
 * @param {(kind: string, message: string) => void} [hooks.onApplyResult] UI 提示
 * @returns {{sessionId: string, start: Function, stop: Function, onStatusChange: Function}}
 */
export function createTemplateSession(hooks) {
  const sessionId = (() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY)
      if (saved && /^[a-z0-9]{6}$/.test(saved)) return saved
    } catch { /* 隐私模式可能禁用 sessionStorage */ }
    const fresh = randomSessionId()
    try { sessionStorage.setItem(SESSION_KEY, fresh) } catch { /* 忽略 */ }
    return fresh
  })()

  const client = new PrintClient({ timeoutMs: 20000 })
  const cachedRevision = createRevisionCache()
  const unsubs = []
  let status = 'unreachable'
  let lastError = null
  const statusSubs = new Set()

  function setStatus(next, err = null) {
    status = next
    lastError = err
    statusSubs.forEach(cb => cb(status, lastError))
  }

  async function sendAttach() {
    const snapshot = hooks.readSnapshot()
    try {
      await client.attachTemplate({
        sessionId,
        name: document.title || 'demo 设计器页面',
        url: location.href,
        ...(snapshot.templateName ? { templateName: snapshot.templateName } : {}),
      })
      setStatus('attached', null)
    } catch (err) {
      setStatus('idle', err instanceof Error ? err.message : String(err))
    }
  }

  client.setRequestHandler(async (type, payload) => {
    if (type === MESSAGE_TYPES.TEMPLATE_GET) {
      const snapshot = hooks.readSnapshot()
      return {
        sessionId,
        revision: await cachedRevision(snapshot.templateJson),
        templateJson: snapshot.templateJson,
        ...(snapshot.fields ? { fields: snapshot.fields } : {}),
        ...(snapshot.printData ? { printData: snapshot.printData } : {}),
        ...(snapshot.templateName ? { templateName: snapshot.templateName } : {}),
      }
    }
    if (type === MESSAGE_TYPES.TEMPLATE_APPLY) {
      const req = payload
      const currentRev = await cachedRevision(hooks.readSnapshot().templateJson)
      if (!req || typeof req.baseRevision !== 'string' || req.baseRevision !== currentRev) {
        const message = '模板在读取后被修改：请重新读取最新模板后再应用。'
        hooks.onApplyResult?.('conflict', message)
        throw new WormPrintError('REVISION_CONFLICT', message)
      }
      const blocked = findBlockedElementPaths(req.templateJson)
      if (blocked.length) {
        throw new WormPrintError('INVALID_TEMPLATE', `模板包含不允许直改的元素：${blocked.join('、')}。请改用图片/文本等方式呈现。`)
      }
      if (!isTemplateLike(req.templateJson)) {
        throw new WormPrintError('INVALID_TEMPLATE', '模板 JSON 缺少 paperSize / margins / elements 关键结构。')
      }
      hooks.onApplyResult?.('pending', 'AI 正在修改模板…')
      const result = await hooks.writeTemplate(structuredClone(req.templateJson))
      if (!result) throw new WormPrintError('INTERNAL', '写回失败：宿主未返回结果')
      const reply = {
        revision: await cachedRevision(result.freshTemplateJson),
        templateJson: result.freshTemplateJson,
        ...(result.warnings?.length ? { warnings: result.warnings } : {}),
      }
      hooks.onApplyResult?.('success', 'AI 已修改模板，可通过设计器撤销按钮回退')
      setStatus('attached', null)
      return reply
    }
    throw new WormPrintError('INVALID_REQUEST', `浏览器侧不支持处理请求：${type}`)
  })

  function start() {
    unsubs.push(client.onStatusChange(s => {
      if (s === 'connected') void sendAttach()
      else if (status !== 'idle') setStatus('unreachable', '桌面客户端未连接：请启动客户端并开启 AI 助手')
    }))
    void client.connect().catch(() => {})
    setStatus('unreachable', null)
  }

  function stop() {
    void client.detachTemplate(sessionId).catch(() => {})
    unsubs.splice(0).forEach(fn => fn())
    try { client.close() } catch { /* 忽略 */ }
    statusSubs.clear()
    setStatus('unreachable', null)
  }

  return {
    sessionId,
    start,
    stop,
    onStatusChange(cb) {
      statusSubs.add(cb)
      cb(status, lastError)
      return () => statusSubs.delete(cb)
    },
  }
}

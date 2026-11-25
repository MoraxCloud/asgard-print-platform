/**
 * jQuery 直挂 demo 的 MCP 模板会话（只读）。
 *
 * 直挂形态能力全部来自 UMD 全局 window.WormPrintCanvas，它只导出 PrintClient /
 * WormPrintError，不导出 MESSAGE_TYPES 与 findBlockedElementPaths。按官方宿主 MCP 规范
 * （integration 技能 references/mcp-host-integration.md）：直挂且拿不到 core/designer 时，
 * 写回保持只读——只处理 template.get，对 template.apply 返回不支持；不自行复制封禁元素
 * 清单，避免封禁口径与 core 漂移。需要 AI 写回请用 NPM 宿主形态（vue2 / vue3 / react demo）。
 *
 * 协议字符串与 @worm-print-platform/core/client 的 MESSAGE_TYPES 取值一致（稳定协议）。
 */
const W = window.WormPrintCanvas

const MSG = {
  TEMPLATE_ATTACH: 'template.attach',
  TEMPLATE_DETACH: 'template.detach',
  TEMPLATE_GET: 'template.get',
  TEMPLATE_APPLY: 'template.apply',
}
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
async function revisionOf(value) {
  const text = JSON.stringify(canonicalize(value))
  if (globalThis.crypto?.subtle) {
    try {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
      return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('')
    } catch { /* 走 FNV-1a */ }
  }
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 0x01000193) >>> 0
  return hash.toString(16).padStart(8, '0').repeat(8)
}

/**
 * @param {object} hooks
 * @param {() => object} hooks.readSnapshot 读取当前快照 { templateJson, templateName?, fields?, printData? }
 */
export function createTemplateSession(hooks) {
  const sessionId = (() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY)
      if (saved && /^[a-z0-9]{6}$/.test(saved)) return saved
    } catch { /* 隐私模式 */ }
    const fresh = randomSessionId()
    try { sessionStorage.setItem(SESSION_KEY, fresh) } catch { /* 忽略 */ }
    return fresh
  })()

  const client = new W.PrintClient({ timeoutMs: 20000 })
  const unsubs = []
  const statusSubs = new Set()
  let status = 'unreachable'
  let lastError = null

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
    if (type === MSG.TEMPLATE_GET) {
      const snapshot = hooks.readSnapshot()
      return {
        sessionId,
        revision: await revisionOf(snapshot.templateJson),
        templateJson: snapshot.templateJson,
        ...(snapshot.fields ? { fields: snapshot.fields } : {}),
        ...(snapshot.printData ? { printData: snapshot.printData } : {}),
        ...(snapshot.templateName ? { templateName: snapshot.templateName } : {}),
      }
    }
    if (type === MSG.TEMPLATE_APPLY) {
      // 直挂 UMD 无 findBlockedElementPaths，不开放写回（封禁口径必须由 core 单点判定）
      throw new W.WormPrintError('INVALID_REQUEST', 'jQuery 直挂 demo 的 MCP 会话为只读：AI 可读取当前模板，写回请改用 vue2 / vue3 / react 宿主。')
    }
    throw new W.WormPrintError('INVALID_REQUEST', `浏览器侧不支持处理请求：${type}`)
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

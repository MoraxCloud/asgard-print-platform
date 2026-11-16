import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'
import { readFile } from 'node:fs/promises'
import { watch } from 'node:fs'
import { fileURLToPath } from 'node:url'

// 直挂形态的极简静态服务器：传统项目本来就有 Apache/Nginx/Express，这里只为 demo 自足。
// 同时把 /render-api/* 透传给本地 render 微服务并注入密钥，等价于 Vite 子工程里的 dev 代理。
// --watch 额外提供 SSE 热更新（dev:watch）：监听 demo 源码与 canvas 包产物，变化即广播浏览器整页刷新。
const ROOT_DIR = fileURLToPath(new URL('.', import.meta.url))
const PORT = 9334
const RENDER_TARGET = process.env.RENDER_TARGET || 'http://localhost:3001'
const RENDER_KEY = process.env.RENDER_API_KEY || 'dev-render-key'

// --watch 热更新：canvas 包产物（dist）变化 → 重拷 public/vendor → 广播；demo 源码变化 → 直接广播。
// public/vendor 自身的写回事件被排除，避免"拷贝 → 触发监听 → 再拷贝"的回环。
const WATCH_MODE = process.argv.includes('--watch')
const CANVAS_DIST = join(ROOT_DIR, '../../../packages/canvas/dist')
const livereloadClients = new Set()
let reloadTimer = null
let syncTimer = null

function broadcastReload() {
  clearTimeout(reloadTimer)
  reloadTimer = setTimeout(() => {
    for (const res of livereloadClients) res.write('data: reload\n\n')
    if (livereloadClients.size) console.log(`[watch] 已通知 ${livereloadClients.size} 个浏览器刷新`)
  }, 150)
}

function syncVendorSoon() {
  clearTimeout(syncTimer)
  syncTimer = setTimeout(() => {
    // 逻辑单一来源：重跑 sync-assets.mjs（幂等），成功后才广播
    const child = spawn(process.execPath, [join(ROOT_DIR, 'scripts/sync-assets.mjs')], { stdio: 'inherit' })
    child.on('exit', code => {
      if (code === 0) broadcastReload()
      else console.error('[watch] vendor 同步失败：canvas 包产物缺失？确认包已 build 且 watch 构建在运行')
    })
  }, 150)
}

if (WATCH_MODE) {
  watch(ROOT_DIR, { recursive: true }, (_event, filename) => {
    if (!filename) return broadcastReload()
    const rel = filename.replaceAll('\\', '/')
    if (rel.startsWith('node_modules/') || rel.startsWith('.') || rel.startsWith('public/vendor/')) return
    broadcastReload()
  })
  watch(CANVAS_DIST, (_event, filename) => {
    if (filename === 'canvas.js' || filename === 'canvas.css') syncVendorSoon()
  })
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
}

const server = createServer(async (req, res) => {
  const path = decodeURIComponent((req.url || '/').split('?')[0])

  if (WATCH_MODE && path === '/__livereload') {
    res.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-store',
      connection: 'keep-alive',
    })
    res.write('retry: 1000\n\n')
    livereloadClients.add(res)
    req.on('close', () => livereloadClients.delete(res))
    return
  }
  if (WATCH_MODE && path === '/__livereload.js') {
    res.setHeader('content-type', 'text/javascript; charset=utf-8')
    res.end("new EventSource('/__livereload').onmessage = () => location.reload()")
    return
  }

  if (path.startsWith('/render-api')) {
    try {
      const upstream = await fetch(`${RENDER_TARGET}${path.replace(/^\/render-api/, '')}`, {
        method: req.method,
        headers: { 'content-type': 'application/json', 'x-render-key': RENDER_KEY },
        body: req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.arrayBuffer(),
      })
      res.statusCode = upstream.status
      res.setHeader('content-type', upstream.headers.get('content-type') || 'application/octet-stream')
      res.end(Buffer.from(await upstream.arrayBuffer()))
    } catch {
      res.statusCode = 503
      res.setHeader('content-type', 'application/json; charset=utf-8')
      res.end(JSON.stringify({ code: 'render_unavailable', message: '渲染服务不可达：未启动 print-render（默认 3001）' }))
    }
    return
  }

  // /vendor/*、/images/*、/fonts/* 映射到 public/ 下同名目录（vendor 由 sync-assets 拷包产物，images/fonts 由 sync-demo-samples 拷示例资源），其余按工程根目录取文件
  const fromPublic = /^\/(vendor|images|fonts)\//.test(path)
  const target = fromPublic ? `public${path}` : path
  const rel = normalize(target.replace(/^\/+/, '') || 'index.html')
  if (rel.startsWith('..')) {
    res.statusCode = 403
    res.end()
    return
  }
  try {
    const body = await readFile(join(ROOT_DIR, rel))
    res.statusCode = 200
    res.setHeader('content-type', MIME[extname(rel)] || 'application/octet-stream')
    if (WATCH_MODE && extname(rel) === '.html' && body.includes('</body>')) {
      res.end(body.toString('utf-8').replace('</body>', '<script src="/__livereload.js"></script></body>'))
    } else {
      res.end(body)
    }
  } catch {
    res.statusCode = 404
    res.end('Not Found')
  }
})

server.listen(PORT, () => {
  console.log(`jQuery 直挂 demo：http://localhost:${PORT}/${WATCH_MODE ? '（--watch 热更新已开启）' : ''}`)
})

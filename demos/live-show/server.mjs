import { createServer } from 'node:http'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { spawn, spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DemoRunner } from './automation.mjs'
import { ACTION_LABELS, DEMO_SEQUENCE, LOOP_STEPS, SAMPLES, parseIntent } from './intents.mjs'
import { edgeAvailable, hasVoiceAsset, synthesizeEdge, voiceFile } from './voice.mjs'

const PORT = Number(process.env.LIVE_PORT || 9340)
const HOST = '127.0.0.1'
const DEMO_ORIGIN = process.env.LIVE_DEMO_URL || 'http://127.0.0.1:9331'
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const FILES = {
  '/': ['control.html', 'text/html; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
  '/style.css': ['style.css', 'text/css; charset=utf-8'],
}

function findChineseVoice() {
  if (process.platform !== 'darwin') return ''
  const result = spawnSync('say', ['-v', '?'], { encoding: 'utf8' })
  const voices = String(result.stdout || '').split('\n')
  const preferred = voices.find(line => line.includes('Tingting'))
    ?? voices.find(line => line.includes('Meijia'))
    ?? voices.find(line => /zh_CN|zh-CN/.test(line))
  return preferred ? preferred.trim().split(/\s+/)[0] : ''
}

class LiveShow {
  constructor() {
    this.runner = new DemoRunner({ headless: process.env.LIVE_HEADLESS === '1' })
    this.queue = []
    this.records = []
    this.clients = new Set()
    this.current = null
    this.processing = false
    this.shuttingDown = false
    this.sequence = 0
    this.loopRunning = false
    this.loopPaused = false
    this.loopStage = ''
    this.stage = 'live'
    this.loopToken = 0
    this.loopTask = null
    this.videoEnded = false
    this.caption = '点击自动演示，连续循环模板视频与真实预览。'
    this.voiceName = findChineseVoice()
    this.edgeReady = edgeAvailable()
    this.voice = process.env.LIVE_VOICE !== '0' && (this.edgeReady || !!this.voiceName)
    this.voiceEngine = this.edgeReady ? 'edge-tts' : 'system'
    this.speech = null
    this.synth = null
    this.speechToken = 0
  }

  snapshot() {
    return {
      title: 'Worm Print 直播彩排',
      mode: '本地彩排',
      loopRunning: this.loopRunning,
      loopPaused: this.loopPaused,
      loopStage: this.loopStage,
      stage: this.stage,
      voice: this.voice,
      voiceAvailable: this.edgeReady || !!this.voiceName,
      voiceEngine: this.voiceEngine,
      queueCount: this.queue.length,
      current: this.current ? { id: this.current.id, label: this.current.label } : null,
      records: this.records.slice(-40).reverse(),
      samples: SAMPLES.map(({ id, name }) => ({ id, name })),
    }
  }

  async state() {
    return { ...this.snapshot(), demo: await this.runner.snapshot(), browserErrors: this.runner.errors.length }
  }

  async publish() {
    if (this.shuttingDown) return
    const state = await this.state()
    await this.runner.setLoop(state)
    if (!this.clients.size) return
    const payload = `event: state\ndata: ${JSON.stringify(state)}\n\n`
    for (const response of this.clients) response.write(payload)
  }

  stopSpeech() {
    this.speechToken += 1
    if (this.synth?.pid) this.synth.kill()
    if (this.speech?.pid) this.speech.kill()
    this.synth = null
    this.speech = null
  }

  playProcess(command, args, token) {
    return new Promise(resolve => {
      const child = spawn(command, args, { stdio: 'ignore' })
      this.speech = child
      const finish = () => {
        if (this.speech === child) this.speech = null
        resolve()
      }
      child.once('error', finish)
      child.once('close', () => {
        if (token === this.speechToken) resolve()
        else finish()
      })
      if (token !== this.speechToken) child.kill()
    })
  }

  async say(text, token) {
    if (!this.voiceName || token !== this.speechToken) return
    const args = ['-r', '205']
    if (this.voiceName) args.push('-v', this.voiceName)
    args.push(text)
    await this.playProcess('say', args, token)
  }

  async speak(text, preferAsset = false) {
    this.stopSpeech()
    const token = this.speechToken
    if (!this.voice || !text) return

    if (preferAsset && await hasVoiceAsset(text)) {
      await this.playProcess('afplay', [voiceFile(text)], token)
      return
    }

    if (!preferAsset && this.edgeReady) {
      let tempDir = ''
      try {
        tempDir = await mkdtemp(join(tmpdir(), 'worm-live-tts-'))
        const outFile = join(tempDir, 'speech.mp3')
        await synthesizeEdge(text, outFile, 20000, child => { this.synth = child })
        this.synth = null
        if (token !== this.speechToken) return
        await this.playProcess('afplay', [outFile], token)
        return
      } catch (error) {
        this.synth = null
        if (token !== this.speechToken) return
        console.warn('[直播彩排] Edge TTS 按需合成失败，回退本机语音：', error.message)
      } finally {
        if (tempDir) await rm(tempDir, { recursive: true, force: true }).catch(() => {})
      }
    }

    await this.say(text, token)
  }

  async narrate(text, preferAsset = false) {
    this.caption = text
    await this.runner.caption(text)
    return this.speak(text, preferAsset)
  }

  updateRecord(record, status, detail = '') {
    record.status = status
    record.detail = detail
    if (status === 'done' || status === 'failed') record.finishedAt = Date.now()
    record.time = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  }

  async enqueue(user, text, silent = false, force = false) {
    const intent = parseIntent(text)
    if (!intent) return { ok: false, message: '请输入弹幕内容' }
    const signature = `${intent.action}:${JSON.stringify(intent.args)}`
    const duplicate = !force && (this.current?.signature === signature
      || this.records.some(record => record.signature === signature && Date.now() - (record.finishedAt ?? record.at) < 6000)
      || this.queue.some(item => item.signature === signature))
    if (duplicate) return { ok: true, duplicate: true, message: '相同指令刚刚已经收到' }

    if (intent.action === 'stop') {
      this.loopPaused = this.loopRunning
      this.stopSpeech()
      for (const item of this.queue.splice(0)) this.updateRecord(item.record, 'skipped', '已取消')
      await this.narrate('演示已暂停，当前步骤结束后不再继续。', true)
      await this.publish()
      return { ok: true }
    }

    if (intent.action === 'start-demo') {
      for (const item of this.queue.splice(0)) this.updateRecord(item.record, 'skipped', '已取消')
      for (const step of DEMO_SEQUENCE) await this.enqueue('连续演示', stepLabel(step), true, true)
      this.pump()
      return { ok: true }
    }

    if (this.queue.length >= 12) return { ok: false, message: '等待队列已满，请等当前演示完成' }
    const record = {
      id: ++this.sequence,
      user: String(user || '现场观众').slice(0, 24),
      text: String(text).slice(0, 80),
      action: intent.action,
      label: ACTION_LABELS[intent.action] || '互动回应',
      narration: intent.narration,
      args: intent.args,
      signature,
      at: Date.now(),
      status: 'queued',
      detail: this.current ? '等待当前步骤完成' : '准备执行',
      time: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
    }
    this.records.push(record)
    if (this.records.length > 100) this.records.shift()
    this.queue.push({ record, intent })
    if (!silent) await this.publish()
    this.pump()
    return { ok: true, id: record.id }
  }

  async pump() {
    if (this.processing) return
    this.processing = true
    try {
      while (this.queue.length) {
        const { record, intent } = this.queue.shift()
        this.current = record
        this.updateRecord(record, 'running', '正在操作真实设计器')
        const speech = this.narrate(intent.narration, this.loopRunning && record.user === '连续演示')
          .catch(error => console.warn('[直播彩排] 讲解启动失败：', error.message))
        await this.publish()
        try {
          let demo
          if (intent.action === 'help') {
            await this.runner.highlight('.designer-container')
            await sleep(1200)
            await this.runner.clearFocus()
            await this.runner.capture()
            demo = await this.runner.snapshot()
          } else {
            demo = await this.runner.run(intent.action, intent.args)
          }
          this.updateRecord(record, 'done', resultDetail(record.action, demo))
          await waitSpeechWith(speech)
        } catch (error) {
          if (this.runner.page?.isClosed()) {
            this.loopRunning = false
            this.loopPaused = false
            this.stage = 'live'
            this.updateRecord(record, 'failed', '演示窗口已关闭')
          } else {
            console.error(`[直播彩排] ${record.label}失败：`, error)
            this.updateRecord(record, 'failed', '操作未完成，请重试或切换示例')
            await this.narrate('这一步没有完成，可以换一条指令再试。', true)
          }
        }
        this.current = null
        await this.publish()
        await sleep(500)
      }
    } finally {
      this.processing = false
      await this.publish()
    }
  }

  async toggleLoop() {
    if (!this.loopRunning) {
      this.loopRunning = true
      this.loopPaused = false
      this.loopToken += 1
      this.loopTask = this.runLoop(this.loopToken)
    } else {
      this.loopPaused = !this.loopPaused
      if (this.loopPaused) {
        this.stopSpeech()
        await this.narrate('演示已暂停，点击继续即可恢复。', true)
      } else {
        await this.narrate('继续自动演示。', true)
      }
    }
    await this.publish()
  }

  async waitLoop(token, duration) {
    let elapsed = 0
    while (elapsed < duration && this.loopRunning && token === this.loopToken) {
      await sleep(200)
      if (!this.loopPaused) elapsed += 200
    }
    return this.loopRunning && token === this.loopToken
  }

  async waitVideo(token) {
    this.videoEnded = false
    let elapsed = 0
    while (elapsed < 30000 && this.loopRunning && token === this.loopToken) {
      if (this.videoEnded) return true
      await sleep(250)
      if (!this.loopPaused) elapsed += 250
    }
    return this.loopRunning && token === this.loopToken
  }

  async waitRecord(id, token) {
    const deadline = Date.now() + 90000
    while (Date.now() < deadline && this.loopRunning && token === this.loopToken) {
      const record = this.records.find(item => item.id === id)
      if (record?.status === 'done') return true
      if (record?.status === 'failed') throw new Error(`${record.label}未完成`)
      await sleep(250)
    }
    if (!this.loopRunning || token !== this.loopToken) return false
    throw new Error('演示步骤等待超时')
  }

  async runLoop(token) {
    try {
      while (this.loopRunning && token === this.loopToken) {
        for (const step of LOOP_STEPS) {
          if (!this.loopRunning || token !== this.loopToken) return
          while (this.loopPaused && this.loopRunning && token === this.loopToken) await sleep(200)
          if (!this.loopRunning || token !== this.loopToken) return
          this.loopStage = step.label
          this.stage = step.kind === 'video' ? 'video' : 'live'
          if (step.kind === 'video') {
            this.narrate(step.narration, true).catch(error => console.warn('[直播彩排] 视频讲解启动失败：', error.message))
            await this.publish()
            if (!await this.waitVideo(token)) return
          } else {
            await this.publish()
            const result = await this.enqueue('连续演示', step.command, true, true)
            if (!result.ok || !await this.waitRecord(result.id, token)) return
            if (!await this.waitLoop(token, step.hold)) return
          }
        }
      }
    } catch (error) {
      console.error('[直播彩排] 连续循环失败：', error)
      this.loopRunning = false
      this.loopPaused = false
      this.stage = 'live'
      await this.narrate('连续演示已停止，请检查设计器窗口后重新开始。', true)
      await this.publish()
    }
  }

  async body(request) {
    let raw = ''
    for await (const chunk of request) {
      raw += chunk
      if (raw.length > 4096) throw new Error('请求内容过长')
    }
    return raw ? JSON.parse(raw) : {}
  }

  async handle(request, response) {
    const url = new URL(request.url, `http://${HOST}:${PORT}`)
    response.setHeader('Cache-Control', 'no-store')
    response.setHeader('X-Content-Type-Options', 'nosniff')
    response.setHeader('Access-Control-Allow-Origin', DEMO_ORIGIN)
    response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    if (request.method === 'OPTIONS') {
      response.writeHead(204)
      return response.end()
    }

    if (request.method === 'GET' && url.pathname === '/api/state') return json(response, await this.state())
    if (request.method === 'GET' && url.pathname === '/api/events') {
      response.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', Connection: 'keep-alive' })
      response.write(`event: state\ndata: ${JSON.stringify(await this.state())}\n\n`)
      this.clients.add(response)
      const heartbeat = setInterval(() => response.write(': heartbeat\n\n'), 15000)
      request.on('close', () => { clearInterval(heartbeat); this.clients.delete(response) })
      return
    }
    if (request.method === 'GET' && url.pathname === '/api/preview') {
      if (!this.runner.preview) return json(response, { error: '演示画面尚未生成' }, 503)
      response.writeHead(200, { 'Content-Type': 'image/jpeg' })
      return response.end(this.runner.preview)
    }
    if (request.method === 'POST' && url.pathname === '/api/danmaku') {
      const body = await this.body(request)
      return json(response, await this.enqueue(body.user, body.text))
    }
    if (request.method === 'POST' && url.pathname === '/api/control') {
      const body = await this.body(request)
      if (body.loop === 'toggle') await this.toggleLoop()
      if (body.videoEnded && this.stage === 'video') this.videoEnded = true
      if (body.stop) await this.enqueue('控制台', '停止演示')
      if (body.demo) await this.enqueue('控制台', '开始演示')
      await this.publish()
      return json(response, { ok: true })
    }
    if (request.method === 'GET' && url.pathname === '/assets/template-loop.webm') {
      const content = await readFile(new URL('assets/template-loop.webm', import.meta.url))
      const range = request.headers.range?.match(/bytes=(\d+)-(\d*)/)
      if (!range) {
        response.writeHead(200, { 'Content-Type': 'video/webm', 'Accept-Ranges': 'bytes', 'Content-Length': content.length })
        return response.end(content)
      }
      const start = Number(range[1])
      const end = range[2] ? Math.min(Number(range[2]), content.length - 1) : content.length - 1
      if (start >= content.length || end < start) {
        response.writeHead(416, { 'Content-Range': `bytes */${content.length}` })
        return response.end()
      }
      const chunk = content.subarray(start, end + 1)
      response.writeHead(206, {
        'Content-Type': 'video/webm',
        'Accept-Ranges': 'bytes',
        'Content-Range': `bytes ${start}-${end}/${content.length}`,
        'Content-Length': chunk.length,
      })
      return response.end(chunk)
    }
    if (request.method === 'GET' && FILES[url.pathname]) {
      const [file, type] = FILES[url.pathname]
      const content = await readFile(new URL(file, import.meta.url))
      response.writeHead(200, { 'Content-Type': type })
      return response.end(content)
    }
    json(response, { error: '没有这个页面或接口' }, 404)
  }

  async start() {
    const server = createServer((request, response) => {
      this.handle(request, response).catch(error => {
        console.error('[直播彩排] 请求失败：', error)
        if (!response.headersSent) json(response, { error: '请求未完成，请重试' }, 400)
      })
    })
    await new Promise((resolve, reject) => {
      server.once('error', reject)
      server.listen(PORT, HOST, resolve)
    })
    await this.runner.start()
    await this.runner.caption(this.caption)
    await this.publish()
    return server
  }

  async close() {
    this.shuttingDown = true
    this.loopRunning = false
    this.loopPaused = false
    this.loopToken += 1
    this.stopSpeech()
    for (const response of this.clients) response.end()
    this.clients.clear()
    await this.runner.close()
  }
}

function stepLabel(step) {
  if (step.action === 'load-sample') return `加载${SAMPLES.find(sample => sample.id === step.args.sampleId)?.name}`
  if (step.action === 'edit-text') return `把标题改成${step.args.text}`
  if (step.action === 'bind-field') return '绑定字段'
  if (step.action === 'align') return '文字居中'
  if (step.action === 'preview') return '预览出纸'
  return step.action
}

function resultDetail(action, demo) {
  if (!demo) return ''
  if (action === 'preview') return `${demo.previewPages} 页真实出纸结果`
  if (action === 'tiling') return `${demo.previewSheets || 1} 张纸 · ${demo.previewPages} 枚标签`
  if (action === 'load-sample') return `${demo.sample} · ${demo.elementCount} 个元素`
  if (action === 'paper') return `纸张已更新 · ${demo.elementCount} 个元素保持可编辑`
  return `${demo.sample} · 画布已更新`
}

async function waitSpeechWith(task) {
  if (!task) return
  await Promise.race([task, sleep(30000)])
}

function json(response, data, status = 200) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  response.end(JSON.stringify(data))
}

export async function startLiveShow() {
  const show = new LiveShow()
  const server = await show.start()
  const close = async () => {
    await show.close()
    await new Promise(resolve => server.close(resolve))
  }
  console.log(`本地直播彩排：http://${HOST}:${PORT}`)
  console.log(`演示窗口：${process.env.LIVE_DEMO_URL || 'http://127.0.0.1:9331/'}`)
  return { show, server, close, url: `http://${HOST}:${PORT}` }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const running = await startLiveShow()
  const shutdown = async () => { await running.close(); process.exit(0) }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

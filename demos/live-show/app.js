const $ = selector => document.querySelector(selector)
const input = $('#danmaku-input')
const stageImage = $('#stage-image')
const templateVideo = $('#template-video')
const statusText = {
  queued: '等待中',
  running: '演示中',
  done: '已完成',
  failed: '未完成',
  skipped: '已取消',
}
let latestCapture = -1
let toastTimer = null
let videoEndingSent = false

function toast(message) {
  const node = $('#toast')
  node.textContent = message
  node.hidden = false
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { node.hidden = true }, 2600)
}

async function post(path, body) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || '请求未完成')
  return data
}

async function readState() {
  const response = await fetch('/api/state')
  if (!response.ok) throw new Error('彩排状态读取失败')
  return response.json()
}

async function sendCommand(text) {
  if (!text.trim()) return
  try {
    const result = await post('/api/danmaku', { user: '彩排观众', text })
    input.value = ''
    if (result.message) toast(result.message)
  } catch (error) {
    toast(error.message)
  }
}

function renderSamples(samples) {
  const list = $('#sample-list')
  list.replaceChildren()
  for (const sample of samples) {
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = sample.name
    button.addEventListener('click', () => sendCommand(`加载${sample.name}`))
    list.append(button)
  }
}

function renderRecords(records) {
  const list = $('#activity-list')
  if (!records.length) {
    list.replaceChildren()
    const empty = document.createElement('div')
    empty.className = 'empty-state'
    const title = document.createElement('strong')
    title.textContent = '还没有弹幕'
    const hint = document.createElement('span')
    hint.textContent = '从左侧发一条“看看快递面单”试试。'
    empty.append(title, hint)
    list.append(empty)
    return
  }

  const fragment = document.createDocumentFragment()
  for (const record of records) {
    const row = document.createElement('article')
    row.className = 'activity-row'

    const user = document.createElement('div')
    user.className = 'activity-user'
    const name = document.createElement('strong')
    name.textContent = record.user
    const time = document.createElement('span')
    time.textContent = record.time
    user.append(name, time)

    const content = document.createElement('div')
    content.className = 'activity-text'
    const text = document.createElement('strong')
    text.textContent = record.text
    const detail = document.createElement('span')
    detail.textContent = record.detail || record.label
    content.append(text, detail)

    const status = document.createElement('span')
    status.className = `status-pill ${record.status}`
    status.textContent = statusText[record.status] || record.status
    row.append(user, content, status)
    fragment.append(row)
  }
  list.replaceChildren(fragment)
}

function syncStage(state) {
  const wantsVideo = state.stage === 'video'
  if (wantsVideo) {
    if (templateVideo.hidden) {
      templateVideo.hidden = false
      templateVideo.currentTime = 0
      videoEndingSent = false
    }
    stageImage.hidden = true
    if (state.loopRunning && !state.loopPaused) templateVideo.play().catch(() => {})
    else templateVideo.pause()
  } else {
    templateVideo.pause()
    templateVideo.hidden = true
    stageImage.hidden = false
    videoEndingSent = false
  }
  $('#stage-loading').hidden = true
}

function renderState(state) {
  if (state.samples?.length && !$('#sample-list').children.length) renderSamples(state.samples)
  syncStage(state)

  const running = (state.loopRunning && !state.loopPaused) || !!state.current
  $('#run-state').classList.toggle('running', running)
  $('#run-state span').textContent = state.loopPaused ? '已暂停'
    : (state.loopRunning ? (state.loopStage || '连续演示') : (state.current?.label || '等待指令'))
  $('#queue-state').textContent = state.queueCount ? `等待 ${state.queueCount} 条指令` : '队列空闲'
  $('#voice-state').textContent = state.voice ? (state.voiceEngine === 'edge-tts' ? 'Edge TTS 自动讲解' : '本机自动讲解') : '字幕讲解'

  $('#demo-button').disabled = state.loopRunning && !state.loopPaused
  $('#demo-button').textContent = state.loopPaused ? '继续演示' : (state.loopRunning ? '演示进行中' : '开始连续演示')
  $('#pause-button').disabled = !state.loopRunning || state.loopPaused
  $('#pause-button').textContent = state.loopPaused ? '已暂停' : '暂停'
  const manualDisabled = state.loopRunning && !state.loopPaused
  input.disabled = manualDisabled
  $('#danmaku-form button').disabled = manualDisabled
  document.querySelectorAll('[data-command], #sample-list button').forEach(button => { button.disabled = manualDisabled })

  const demo = state.demo || {}
  $('#fact-sample').textContent = demo.ready ? demo.sample : '正在读取'
  $('#fact-elements').textContent = demo.ready ? String(demo.elementCount) : '—'
  $('#fact-pages').textContent = demo.previewPages ? `${demo.previewPages} 页` : '未预览'

  if (demo.ready) $('#stage-loading').hidden = true
  if (Number(demo.captureVersion) !== latestCapture) {
    latestCapture = Number(demo.captureVersion) || 0
    stageImage.src = `/api/preview?v=${latestCapture}`
  }
  renderRecords(state.records || [])
}

$('#danmaku-form').addEventListener('submit', event => {
  event.preventDefault()
  sendCommand(input.value)
})

document.querySelectorAll('[data-command]').forEach(button => {
  button.addEventListener('click', () => sendCommand(button.dataset.command))
})

const toggleLoop = () => post('/api/control', { loop: 'toggle' }).catch(error => toast(error.message))
$('#demo-button').addEventListener('click', toggleLoop)
$('#pause-button').addEventListener('click', toggleLoop)

stageImage.addEventListener('load', () => { $('#stage-loading').hidden = true })
templateVideo.addEventListener('loadeddata', () => { $('#stage-loading').hidden = true })
templateVideo.addEventListener('ended', () => {
  if (videoEndingSent) return
  videoEndingSent = true
  post('/api/control', { videoEnded: true }).catch(() => {})
})

if (typeof EventSource !== 'undefined') {
  const events = new EventSource('/api/events')
  events.addEventListener('state', event => {
    try { renderState(JSON.parse(event.data)) } catch { /* 忽略不完整的开发期热更新帧 */ }
  })
} else {
  const poll = async () => {
    try { renderState(await readState()) } catch { /* 服务启动期间保持等待态 */ }
    setTimeout(poll, 1500)
  }
  poll()
}

import assert from 'node:assert/strict'

process.env.LIVE_HEADLESS = '1'
process.env.LIVE_VOICE = '0'
process.env.LIVE_PORT = '9347'

const { startLiveShow } = await import('./server.mjs')
const base = 'http://127.0.0.1:9347'
const results = []
let running

const check = (name, pass, detail = '') => {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
  if (!pass) process.exitCode = 1
}

async function state() {
  const response = await fetch(`${base}/api/state`)
  assert.equal(response.status, 200)
  return response.json()
}

async function post(path, body) {
  const response = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await response.json()
  assert.equal(response.status, 200, JSON.stringify(data))
  return data
}

async function waitFor(predicate, label, timeout = 60000) {
  const deadline = Date.now() + timeout
  let last
  while (Date.now() < deadline) {
    last = await state()
    if (predicate(last)) return last
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  throw new Error(`${label}超时：${JSON.stringify(last?.records?.slice(0, 3))}`)
}

async function send(text) {
  await post('/api/danmaku', { user: '验收观众', text })
  return waitFor(current => {
    const record = current.records.find(item => item.text === text)
    return record && ['done', 'failed'].includes(record.status)
  }, `指令「${text}」`)
}

async function templateFact() {
  return running.show.runner.page.evaluate(() => {
    const raw = document.querySelector('print-designer').getTemplateJson()
    const template = JSON.parse(raw)
    const page = template.pages?.[0] ?? template
    const texts = (page.elements ?? []).filter(element => element.type === 'text')
    return {
      json: raw,
      firstText: texts[0]?.options ?? {},
      width: page.customWidth,
      height: page.customHeight,
    }
  })
}

try {
  running = await startLiveShow()
  let current = await waitFor(value => value.demo?.ready, '设计器启动')
  check('真实设计器启动并生成监视画面', current.demo.ready && current.demo.captureVersion > 0,
    `${current.demo.elementCount} 个元素`)

  const control = await fetch(base)
  const html = await control.text()
  check('彩排控制台可访问', control.ok && html.includes('弹幕与执行记录') && html.includes('/app.js')
    && html.includes('template-loop.webm') && html.includes('pause-button') && !html.includes('voice-toggle'),
    '视频与循环控件齐全')

  current = await send('看看快递面单')
  const loaded = current.records.find(item => item.text === '看看快递面单')
  check('弹幕加载真实面单模板', loaded.status === 'done' && current.demo.sample.includes('快递电子面单'),
    `${current.demo.sample} · ${current.demo.fieldCount} 个字段`)

  const duplicate = await post('/api/danmaku', { user: '验收观众', text: '看看快递面单' })
  check('重复弹幕不会重复执行', duplicate.duplicate === true)

  const beforeEdit = await templateFact()
  check('修改前不存在验收哨兵文字', !beforeEdit.json.includes('直播验收哨兵'))

  current = await send('把标题改成 直播验收哨兵')
  const afterEdit = await templateFact()
  check('改文字指令写入真实模板', afterEdit.json.includes('直播验收哨兵'),
    `首个文本内容已变化：${String(afterEdit.firstText.formatter ?? afterEdit.firstText.content).slice(0, 40)}`)

  current = await send('绑定字段')
  const afterBind = await templateFact()
  check('字段绑定写入真实表达式', String(afterBind.firstText.formatter ?? afterBind.firstText.content).includes('{'),
    String(afterBind.firstText.formatter ?? afterBind.firstText.content))

  current = await send('文字居中')
  const afterAlign = await templateFact()
  check('居中指令写入真实元素样式', afterAlign.firstText.textAlign === 'center')

  current = await send('预览出纸')
  check('预览动作生成真实纸面', current.demo.previewPages > 0 && current.records[0].status === 'done',
    `${current.demo.previewPages} 页`)

  await post('/api/danmaku', { user: '验收观众', text: '开始演示' })
  current = await waitFor(value => !value.current && value.queueCount === 0
    && value.records.filter(item => item.user === '连续演示').length >= 7
    && value.records.filter(item => item.user === '连续演示').every(item => item.status === 'done'),
  '完整连续演示', 120000)
  const sequence = current.records.filter(item => item.user === '连续演示')
  check('连续演示队列完整执行', sequence.length === 7 && sequence.every(item => item.status === 'done') && current.demo.sample.includes('价签打印'),
    `${sequence.length} 步 · 最终 ${current.demo.sample}`)

  current = await send('标签可以打印到一张纸上吗')
  const tiling = current.records.find(item => item.text === '标签可以打印到一张纸上吗')
  check('一张纸拼版指令生成真实预览', tiling.status === 'done' && current.demo.previewSheets === 1 && current.demo.previewPages === 32,
    `${current.demo.previewSheets} 张纸 · ${current.demo.previewPages} 枚标签`)

  await running.show.runner.page.locator('#live-loop-fab').click()
  current = await waitFor(value => value.loopRunning && value.stage === 'video', '悬浮按钮启动循环')
  const overlay = await running.show.runner.page.evaluate(() => ({
    button: document.querySelector('#live-loop-fab span')?.textContent,
    caption: document.querySelector('#live-caption')?.textContent,
    videoVisible: !document.querySelector('#live-video')?.hidden,
  }))
  check('设计器悬浮按钮可启动循环', overlay.button === '暂停演示' && overlay.videoVisible,
    `${overlay.button} · 模板视频已显示`)

  await post('/api/control', { videoEnded: true })
  current = await waitFor(value => value.records.some(item => item.user === '连续演示'
    && item.text === '看看快递面单' && item.status === 'done'), '循环进入真实面单预览')
  check('自动讲解字幕保留在设计器画面', overlay.caption.length > 0 && overlay.caption.includes('模板视频'),
    overlay.caption.slice(0, 50))

  await running.show.runner.page.locator('#live-loop-fab').click()
  current = await waitFor(value => value.loopPaused, '悬浮按钮暂停循环')
  const pausedLabel = await running.show.runner.page.locator('#live-loop-fab span').textContent()
  await running.show.runner.page.locator('#live-loop-fab').click()
  current = await waitFor(value => !value.loopPaused, '悬浮按钮继续循环')
  await running.show.runner.page.locator('#live-loop-fab').click()
  current = await waitFor(value => value.loopPaused && !value.current && value.queueCount === 0, '循环暂停后清空执行')
  check('悬浮按钮支持暂停与继续', pausedLabel === '继续演示' && current.loopPaused)

  current = await send('纸张改成 110x160')
  const afterPaper = await templateFact()
  check('纸型指令写入真实页面尺寸', afterPaper.width === 110 && afterPaper.height === 160,
    `${afterPaper.width}×${afterPaper.height} 毫米`)

  const image = await fetch(`${base}/api/preview`)
  const bytes = new Uint8Array(await image.arrayBuffer())
  check('监视器返回真实成品帧', image.ok && image.headers.get('content-type') === 'image/jpeg' && bytes.length > 10000,
    `${bytes.length} 字节`)

  const video = await fetch(`${base}/assets/template-loop.webm`, { headers: { Range: 'bytes=0-1023' } })
  const videoBytes = new Uint8Array(await video.arrayBuffer())
  check('模板视频可离线播放并支持拖动', video.status === 206 && video.headers.get('content-type') === 'video/webm' && videoBytes.length === 1024,
    `${videoBytes.length} 字节片段`)

  const failedActions = running.show.records.filter(record => record.status === 'failed')
  check('验收过程没有失败动作', failedActions.length === 0,
    failedActions.map(record => record.text).join(' / ') || '0 条')

  check('演示过程没有浏览器脚本错误', running.show.runner.errors.length === 0,
    running.show.runner.errors.join(' / ') || '0 条')

  await running.show.runner.page.close()
  await post('/api/danmaku', { user: '验收观众', text: '看看零售小票' })
  current = await waitFor(value => value.records.some(item => item.user === '验收观众'
    && item.text === '看看零售小票' && item.status === 'failed'), '关闭窗口后的失败回执')
  const health = await fetch(`${base}/api/state`)
  check('演示窗口关闭后彩排服务仍存活', health.ok && current.demo?.ready === false,
    '控制台接口正常 · 演示循环已停止')
} catch (error) {
  check('彩排验收执行', false, String(error))
} finally {
  if (running) await running.close()
}

const passed = results.filter(result => result.pass).length
console.log(`\n验收结果：${passed}/${results.length} 通过`)
if (passed !== results.length) process.exitCode = 1

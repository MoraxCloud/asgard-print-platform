import { createHash } from 'node:crypto'
import { spawn, spawnSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { VOICE_LINES } from '../src/auto-show/steps.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const VOICE_DIR = join(HERE, '..', 'public', 'auto-show', 'voice')
const MANIFEST = join(VOICE_DIR, 'manifest.json')
const VOICE = 'zh-CN-YunxiNeural'

function synthesize(text, outFile) {
  return new Promise((resolve, reject) => {
    const child = spawn('python3', [
      '-m', 'edge_tts',
      '--voice', VOICE,
      '--text', text,
      '--write-media', outFile,
    ], { stdio: ['ignore', 'ignore', 'pipe'] })
    let stderr = ''
    const timer = setTimeout(() => {
      child.kill()
      reject(new Error('Edge TTS 合成超时'))
    }, 25000)
    child.stderr.on('data', chunk => { stderr = (stderr + String(chunk)).slice(-2000) })
    child.once('error', error => {
      clearTimeout(timer)
      reject(error)
    })
    child.once('close', code => {
      clearTimeout(timer)
      if (code === 0) resolve()
      else reject(new Error(`Edge TTS 合成失败：${stderr || `退出码 ${code}`}`))
    })
  })
}

async function generate() {
  const available = spawnSync('python3', ['-c', 'import edge_tts'], { stdio: 'ignore' })
  if (available.status !== 0) {
    throw new Error('未安装 edge_tts，请先执行 python3 -m pip install edge-tts')
  }
  await mkdir(VOICE_DIR, { recursive: true })
  const lines = []
  for (const [index, item] of VOICE_LINES.entries()) {
    const outFile = join(VOICE_DIR, `${item.key}.mp3`)
    process.stdout.write(`[${index + 1}/${VOICE_LINES.length}] 合成 ${item.text}\n`)
    await synthesize(item.text, outFile)
    const audio = await readFile(outFile)
    lines.push({
      key: item.key,
      text: item.text,
      file: `${item.key}.mp3`,
      sha256: createHash('sha256').update(audio).digest('hex'),
      bytes: audio.length,
    })
  }
  const manifest = {
    provider: 'edge-tts',
    voice: VOICE,
    generatedAt: new Date().toISOString(),
    lines,
  }
  await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  console.log(`配音资产完成：${lines.length} 条 → ${MANIFEST}`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  generate().catch(error => {
    console.error(error.message)
    process.exitCode = 1
  })
}

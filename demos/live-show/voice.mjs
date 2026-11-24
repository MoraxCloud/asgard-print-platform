import { createHash } from 'node:crypto'
import { spawn, spawnSync } from 'node:child_process'
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { LOOP_STEPS, parseIntent } from './intents.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const VOICE_DIR = join(HERE, 'assets', 'voice')
const MANIFEST = join(VOICE_DIR, 'manifest.json')
export const TTS_VOICE = process.env.LIVE_TTS_VOICE || 'zh-CN-YunxiNeural'

export function voiceKey(text) {
  return createHash('sha256').update(String(text)).digest('hex').slice(0, 16)
}

export function voiceFile(text) {
  return join(VOICE_DIR, `${voiceKey(text)}.mp3`)
}

export function loopNarrations() {
  const lines = LOOP_STEPS.map(step => step.kind === 'video' ? step.narration : parseIntent(step.command)?.narration)
  return [...new Set(lines.filter(Boolean))]
}

export function edgeAvailable() {
  const result = spawnSync('python3', ['-c', 'import edge_tts'], { stdio: 'ignore' })
  return result.status === 0
}

export function synthesizeEdge(text, outFile, timeout = 25000, onSpawn) {
  return new Promise((resolve, reject) => {
    const child = spawn('python3', [
      '-m', 'edge_tts',
      '--voice', TTS_VOICE,
      '--text', String(text),
      '--write-media', outFile,
    ], { stdio: ['ignore', 'ignore', 'pipe'] })
    onSpawn?.(child)
    let stderr = ''
    const timer = setTimeout(() => {
      child.kill()
      reject(new Error('Edge TTS 合成超时'))
    }, timeout)
    child.stderr.on('data', chunk => { stderr = (stderr + String(chunk)).slice(-2000) })
    child.once('error', error => { clearTimeout(timer); reject(error) })
    child.once('close', code => {
      clearTimeout(timer)
      if (code === 0) resolve()
      else reject(new Error(`Edge TTS 合成失败：${stderr || `退出码 ${code}`}`))
    })
  })
}

export async function hasVoiceAsset(text) {
  try {
    await access(voiceFile(text))
    return true
  } catch {
    return false
  }
}

export async function readVoiceManifest() {
  try { return JSON.parse(await readFile(MANIFEST, 'utf8')) } catch { return null }
}

export async function generateVoiceAssets() {
  await mkdir(VOICE_DIR, { recursive: true })
  const lines = []
  for (const [index, text] of loopNarrations().entries()) {
    const file = voiceFile(text)
    process.stdout.write(`[${index + 1}/${loopNarrations().length}] 合成 ${text}\n`)
    await synthesizeEdge(text, file)
    const audio = await readFile(file)
    lines.push({
      key: voiceKey(text),
      text,
      file: join('assets', 'voice', `${voiceKey(text)}.mp3`),
      sha256: createHash('sha256').update(audio).digest('hex'),
      bytes: audio.length,
    })
  }
  const manifest = {
    provider: 'edge-tts',
    voice: TTS_VOICE,
    generatedAt: new Date().toISOString(),
    lines,
  }
  await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  console.log(`配音资产完成：${lines.length} 条 → ${MANIFEST}`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await generateVoiceAssets()
}

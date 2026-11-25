import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { LOOP_STEPS, parseIntent } from './intents.mjs'
import { loopNarrations, readVoiceManifest, voiceFile } from './voice.mjs'

const ROOT = dirname(fileURLToPath(import.meta.url))

test('循环台词全部来自同一指令来源', () => {
  const expected = LOOP_STEPS.map(step => step.kind === 'video' ? step.narration : parseIntent(step.command).narration)
  assert.deepEqual(loopNarrations(), [...new Set(expected)])
  assert.equal(loopNarrations().length, 5)
})

test('配音清单使用视频流水线相同音色', async () => {
  const manifest = await readVoiceManifest()
  assert.equal(manifest.provider, 'edge-tts')
  assert.equal(manifest.voice, 'zh-CN-YunxiNeural')
  assert.equal(manifest.lines.length, loopNarrations().length)
})

test('每条循环台词都有完整且未损坏的音频资产', async () => {
  const manifest = await readVoiceManifest()
  for (const text of loopNarrations()) {
    const line = manifest.lines.find(item => item.text === text)
    assert.ok(line, `缺少台词资产：${text}`)
    const audio = await readFile(join(ROOT, line.file))
    assert.equal(audio.length, line.bytes)
    assert.equal(createHash('sha256').update(audio).digest('hex'), line.sha256)
    assert.ok(audio.length > 10000)
    assert.equal(line.file, join('assets', 'voice', `${line.key}.mp3`))
    assert.equal(voiceFile(text), join(ROOT, line.file))
  }
})

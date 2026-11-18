import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { readManifest, removeManifestEntry, upsertManifestEntry, writeManifest } from './manifest.js'
import type { ManifestEntry } from './types.js'

const dir = '.worm-print/plugins'
const tempCwd = () => mkdtempSync(join(tmpdir(), 'mp-manifest-'))
const entry: ManifestEntry = {
  version: '1.0.0',
  entry: 'dist/index.js',
  kinds: [],
  exportFormats: [],
  npmName: '@worm-print-platform/plugin-echarts',
  source: { mode: 'local', path: './marketplace' },
  stable: true,
  installedAt: '2026-11-18T00:00:00.000Z',
}

describe('宿主清单读写', () => {
  it('缺清单时返回空', () => {
    expect(readManifest(dir, tempCwd()).plugins).toEqual({})
  })

  it('写入后回读一致', () => {
    const cwd = tempCwd()
    writeManifest(dir, { schemaVersion: 1, plugins: { echarts: entry } }, cwd)
    expect(readManifest(dir, cwd).plugins.echarts.version).toBe('1.0.0')
  })

  it('upsert 与 remove 条目', () => {
    const cwd = tempCwd()
    upsertManifestEntry(dir, 'echarts', entry, cwd)
    expect(readManifest(dir, cwd).plugins.echarts).toEqual(entry)
    removeManifestEntry(dir, 'echarts', cwd)
    expect(readManifest(dir, cwd).plugins.echarts).toBeUndefined()
  })
})

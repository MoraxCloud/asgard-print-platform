import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import type { ManifestEntry, PluginsManifest } from './types.js'

function absPath(p: string, cwd: string): string {
  return isAbsolute(p) ? p : resolve(cwd, p)
}

/** 插件根目录为 <dir>，清单固定在其上一级 plugins.json */
export function manifestPath(dir: string, cwd = process.cwd()): string {
  return join(dirname(absPath(dir, cwd)), 'plugins.json')
}

export function readManifest(dir: string, cwd = process.cwd()): PluginsManifest {
  const path = manifestPath(dir, cwd)
  if (!existsSync(path)) return { schemaVersion: 1, plugins: {} }
  return JSON.parse(readFileSync(path, 'utf8')) as PluginsManifest
}

export function writeManifest(dir: string, manifest: PluginsManifest, cwd = process.cwd()): void {
  const path = manifestPath(dir, cwd)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
}

export function upsertManifestEntry(
  dir: string,
  id: string,
  entry: ManifestEntry,
  cwd = process.cwd(),
): void {
  const manifest = readManifest(dir, cwd)
  manifest.plugins[id] = entry
  writeManifest(dir, manifest, cwd)
}

export function removeManifestEntry(dir: string, id: string, cwd = process.cwd()): void {
  const manifest = readManifest(dir, cwd)
  if (!(id in manifest.plugins)) return
  delete manifest.plugins[id]
  writeManifest(dir, manifest, cwd)
}

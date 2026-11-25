import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { LocalePackage } from './types.js'

const readJson = (file: string) => JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>

/** 读取一个目录下所有 <locale>.json，形状为 { ns: { key: value } } */
function readLocales(dir: string): Map<string, Record<string, Record<string, string>>> {
  const out = new Map<string, Record<string, Record<string, string>>>()
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.json')) continue
    out.set(name.slice(0, -5), readJson(join(dir, name)) as Record<string, Record<string, string>>)
  }
  return out
}

interface PkgManifest {
  name?: string
  wormPrint?: { id?: string; i18n?: { dir?: string; base?: string } }
}

function fromPackage(dir: string, pkg: PkgManifest): LocalePackage | null {
  const i18n = pkg.wormPrint?.i18n
  if (!i18n?.dir) return null
  return {
    id: pkg.wormPrint?.id ?? pkg.name ?? dir,
    base: i18n.base ?? 'zh-CN',
    locales: readLocales(join(dir, i18n.dir)),
    origin: dir,
  }
}

/**
 * 发现宿主项目的语言资源：先读 .worm-print/i18n/<id>/（统一目录优先），
 * 再扫 node_modules 下声明了 wormPrint.i18n 的包作为补充。
 */
export function discover(root = process.cwd(), onWarn?: (message: string) => void): LocalePackage[] {
  const merged = new Map<string, LocalePackage>()

  // 旧市场安装：清单里有插件但没有 i18n 字段，语言资源从未同步，提示重装
  const pluginsFile = join(root, '.worm-print/plugins.json')
  if (existsSync(pluginsFile)) {
    const manifest = readJson(pluginsFile) as { plugins?: Record<string, { i18n?: unknown }> }
    for (const [id, entry] of Object.entries(manifest.plugins ?? {})) {
      if (!entry?.i18n) onWarn?.(`插件 ${id} 的语言资源未同步，请重新安装`)
    }
  }

  const unifiedRoot = join(root, '.worm-print/i18n')
  if (existsSync(unifiedRoot)) {
    for (const name of readdirSync(unifiedRoot)) {
      const dir = join(unifiedRoot, name)
      merged.set(name, { id: name, base: 'zh-CN', locales: readLocales(dir), origin: dir })
    }
  }

  const nm = join(root, 'node_modules')
  if (existsSync(nm)) {
    for (const scope of readdirSync(nm)) {
      const dirs = scope.startsWith('@')
        ? readdirSync(join(nm, scope)).map(s => join(nm, scope, s))
        : [join(nm, scope)]
      for (const dir of dirs) {
        const pkgFile = join(dir, 'package.json')
        if (!existsSync(pkgFile)) continue
        const pkg = readJson(pkgFile) as PkgManifest
        if (!pkg.wormPrint?.i18n) continue
        const id = pkg.wormPrint.id ?? pkg.name ?? dir
        if (merged.has(id)) continue // 统一目录 / 先发现的优先
        const found = fromPackage(dir, pkg)
        if (found) merged.set(id, found)
      }
    }
  }

  return [...merged.values()]
}

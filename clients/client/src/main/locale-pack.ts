// 客户端语言包定位与加载：显式 config 优先，回退应用内置 out/locales/<locale>.json。
import { existsSync, readFileSync } from 'node:fs'
import { isAbsolute, join } from 'node:path'
import { registerLocale } from '@worm-print-platform/core/i18n'

export interface ResolveLocalePackOptions {
  locale: string
  localePack: string
  userDataDir: string
  appDir: string
}

/** 解析语言包文件路径：显式路径（绝对或相对 userData）优先；否则查 app 内置目录。 */
export function resolveLocalePackPath(opts: ResolveLocalePackOptions): string | null {
  if (opts.localePack) {
    return isAbsolute(opts.localePack) ? opts.localePack : join(opts.userDataDir, opts.localePack)
  }
  const bundled = join(opts.appDir, 'out', 'locales', `${opts.locale}.json`)
  return existsSync(bundled) ? bundled : null
}

/** 注册扁平键语言包；成功返回 null，失败返回可写入日志的错误信息。 */
export function loadLocalePack(filePath: string, locale: string): string | null {
  try {
    const raw: unknown = JSON.parse(readFileSync(filePath, 'utf8'))
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) throw new Error('语言包必须是扁平对象')
    const pack: Record<string, string> = {}
    for (const [key, value] of Object.entries(raw)) {
      if (typeof value !== 'string') throw new Error(`键 ${key} 的值必须是字符串`)
      pack[key] = value
    }
    registerLocale(locale, pack)
    return null
  } catch (err) {
    return `[i18n] 语言包加载失败: ${filePath}: ${(err as Error).message}`
  }
}

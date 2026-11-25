// 渲染服务语言包加载器：独立文件，避免单测 import server.ts 触发 app.listen。
import { readFileSync } from 'node:fs'
import { registerLocale } from '@worm-print-platform/core/i18n'

/** 读取扁平点号键 JSON 并注册到指定 locale；失败只告警、返回 false，不阻塞启动。 */
export function loadLocalePack(filePath: string, locale: string): boolean {
  try {
    const raw: unknown = JSON.parse(readFileSync(filePath, 'utf8'))
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) throw new Error('语言包必须是扁平对象')
    const pack: Record<string, string> = {}
    for (const [key, value] of Object.entries(raw)) {
      if (typeof value !== 'string') throw new Error(`键 ${key} 的值必须是字符串`)
      pack[key] = value
    }
    registerLocale(locale, pack)
    console.log(`[i18n] 已加载语言包 ${filePath} (${locale})`)
    return true
  } catch (err) {
    console.warn(`[i18n] 语言包加载失败: ${filePath}: ${(err as Error).message}`)
    return false
  }
}

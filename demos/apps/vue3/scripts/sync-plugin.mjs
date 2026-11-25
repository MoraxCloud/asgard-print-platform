// 启动/构建 demo 前，把图表示例用到的插件副本从源码真源同步过来。
// 避免仓库中跟踪的旧构建产物导致中英混杂 / 裸 key（旧包用全局 t 且模块加载期求值）。
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const demoRoot = resolve(here, '..')
const root = resolve(demoRoot, '../../..')
const srcPlugin = join(root, 'marketplace/plugins/echarts')
const destPlugin = join(demoRoot, '.worm-print/plugins/echarts')

// 与市场 CLI 安装结果一致：只复制 plugin.json files 声明的落盘文件 + 统一 i18n 目录
const files = ['plugin.json', 'README.md', 'LICENSE', 'dist/marketplace.js']
for (const rel of files) {
  const src = join(srcPlugin, rel)
  const dest = join(destPlugin, rel)
  if (!existsSync(src)) throw new Error(`源码缺少 ${rel}，请先构建 @worm-print-platform/plugin-echarts`)
  mkdirSync(dirname(dest), { recursive: true })
  copyFileSync(src, dest)
  if (!readFileSync(src).equals(readFileSync(dest))) throw new Error(`${rel} 同步校验失败`)
}

const i18nSrc = join(srcPlugin, 'dist/i18n')
if (existsSync(i18nSrc)) {
  cpSync(i18nSrc, join(demoRoot, '.worm-print/i18n/echarts'), { recursive: true })
}

console.log(`[sync-plugin] 已同步图表插件副本：${files.length} 个文件 + 语言资源`)

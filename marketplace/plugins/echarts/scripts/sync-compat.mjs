import { cpSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// 同一份源码同时产出两个 npm 包：
// - @worm-print-platform/plugin-echarts：市场主口径，入口 dist/marketplace.js
// - @worm-print-platform/echarts：兼容镜像，保留原包名/子路径/根入口行为
// 兼容镜像只复制并改写自引用与版权头，不单独维护源码，避免双份漂移。
const here = dirname(fileURLToPath(import.meta.url))
const pluginDir = resolve(here, '..')
const compatDir = resolve(pluginDir, '../../../packages/echarts')
const textExt = /\.(js|cjs|mjs|ts)$/

function listTextFiles(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) out.push(...listTextFiles(path))
    else if (textExt.test(name)) out.push(path)
  }
  return out
}

const compatPkg = JSON.parse(readFileSync(join(compatDir, 'package.json'), 'utf8'))
const pluginPkg = JSON.parse(readFileSync(join(pluginDir, 'package.json'), 'utf8'))

rmSync(join(compatDir, 'dist'), { recursive: true, force: true })
cpSync(join(pluginDir, 'dist'), join(compatDir, 'dist'), { recursive: true })

for (const path of listTextFiles(join(compatDir, 'dist'))) {
  const source = readFileSync(path, 'utf8')
  const next = source
    .replaceAll('@worm-print-platform/plugin-echarts', '@worm-print-platform/echarts')
    .replaceAll(`@worm-print-platform/echarts v${pluginPkg.version}`, `@worm-print-platform/echarts v${compatPkg.version}`)
  if (next !== source) writeFileSync(path, next, 'utf8')
}

// 语言资源契约字段随 dist 一起同步，避免兼容包与插件包的发现信息漂移
const compatPkgNext = { ...compatPkg, wormPrint: { ...compatPkg.wormPrint, ...pluginPkg.wormPrint } }
writeFileSync(join(compatDir, 'package.json'), `${JSON.stringify(compatPkgNext, null, 2)}\n`)

cpSync(join(pluginDir, 'README.md'), join(compatDir, 'README.md'))
cpSync(join(pluginDir, 'LICENSE'), join(compatDir, 'LICENSE'))
console.log('已同步兼容包 @worm-print-platform/echarts 的 dist / README / LICENSE / wormPrint')

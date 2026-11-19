import { spawn, spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// 前置全量构建四个包，再起四个宿主 demo 的 dev server（各自独立 npm 工程，各起各的进程），
// 外加 :9300 的宿主示例总览页（serve-nav.mjs，四个宿主互跳的入口）。
// 端口：vue3 9331 / vue2 9332 / react 9335 / jquery 9334 / 总览 9300。
// 启动顺序：先按依赖顺序串行全量构建一次，全部成功后再起 demo server。
// dist/ 不入库，拉取更新后若未构建，demo 的 file: 软链依赖指向不存在的 dist，Vite 会直接解析失败。
// 不启动包 watch：改 packages/*/src 后不会自动重建 dist，需要时手工执行对应包的构建再刷新页面。
const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', '..')
const LIBS = [
  '@worm-print-platform/core',
  '@worm-print-platform/plugin-kit',
  '@worm-print-platform/canvas',
  '@worm-print-platform/echarts',
]
const APPS = [
  { name: 'vue3', dir: 'apps/vue3' },
  { name: 'vue2', dir: 'apps/vue2' },
  { name: 'react', dir: 'apps/react' },
  { name: 'jquery', dir: 'apps/jquery' },
  { name: 'print-demo', dir: 'apps/print-demo' },
]

function prefixed(name) {
  return `[${name}]`.padEnd(9, ' ')
}

// 前置全量构建：LIBS 顺序即依赖顺序（core → plugin-kit → canvas → echarts），串行确保 dist 就绪。
// 任一失败立即中止，避免 demo 起在半就绪的 dist 上导致 Vite 解析失败。
for (const name of LIBS) {
  const result = spawnSync('npm', ['run', 'build', '-w', name], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  if (result.error) {
    console.error(`${prefixed('build')} ${name} 构建启动失败：${result.error.message}`)
    process.exit(1)
  }
  if (result.status !== 0) {
    console.error(`${prefixed('build')} ${name} 构建失败（code=${result.status}），已中止启动 demo`)
    process.exit(result.status ?? 1)
  }
}

const children = APPS.map(({ name, dir, cmd = 'dev' }) => {
  const child = spawn('npm', ['run', cmd], { cwd: join(HERE, '..', dir), shell: process.platform === 'win32' })
  child.stdout.on('data', chunk => process.stdout.write(prefixed(name) + chunk))
  child.stderr.on('data', chunk => process.stderr.write(prefixed(name) + chunk))
  child.on('exit', code => console.log(`${prefixed(name)} 退出（code=${code}）`))
  return child
})

// 总览页（:9300）：四个宿主的互跳入口，与四个 dev server 同组启动、同组退出
const nav = spawn(process.execPath, [join(HERE, 'serve-nav.mjs')], { cwd: join(HERE, '..') })
nav.stdout.on('data', chunk => process.stdout.write(prefixed('nav') + chunk))
nav.stderr.on('data', chunk => process.stderr.write(prefixed('nav') + chunk))
children.push(nav)

process.on('SIGINT', () => children.forEach(child => child.kill('SIGINT')))

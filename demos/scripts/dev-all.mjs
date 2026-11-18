import { spawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// 一次起四个包的 watch 构建 + 四个宿主 demo 的 dev server（各自独立 npm 工程，所以各起各的进程），
// 外加 :9300 的宿主示例总览页（serve-nav.mjs，四个宿主互跳的入口）。
// 端口：vue3 9331 / vue2 9332 / react 9335 / jquery 9334 / 总览 9300。
// 包 watch 先于 demo 启动：改 packages/*/src 后自动重建 dist，Vite 宿主据此整页刷新、jquery 宿主重拷 vendor 并刷新；
// watch 首次构建完成前打开的页面需手动刷新一次。
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
  { name: 'jquery', dir: 'apps/jquery', cmd: 'dev:watch' },
]

function prefixed(name) {
  return `[${name}]`.padEnd(9, ' ')
}

const children = LIBS.map(name => {
  const child = spawn('npm', ['run', 'dev', '-w', name], { cwd: ROOT, shell: process.platform === 'win32' })
  child.stdout.on('data', chunk => process.stdout.write(prefixed(name) + chunk))
  child.stderr.on('data', chunk => process.stderr.write(prefixed(name) + chunk))
  child.on('exit', code => console.log(`${prefixed(name)} 退出（code=${code}）`))
  return child
})

children.push(
  ...APPS.map(({ name, dir, cmd = 'dev' }) => {
    const child = spawn('npm', ['run', cmd], { cwd: join(HERE, '..', dir), shell: process.platform === 'win32' })
    child.stdout.on('data', chunk => process.stdout.write(prefixed(name) + chunk))
    child.stderr.on('data', chunk => process.stderr.write(prefixed(name) + chunk))
    child.on('exit', code => console.log(`${prefixed(name)} 退出（code=${code}）`))
    return child
  }),
)

// 总览页（:9300）：四个宿主的互跳入口，与四个 dev server 同组启动、同组退出
const nav = spawn(process.execPath, [join(HERE, 'serve-nav.mjs')], { cwd: join(HERE, '..') })
nav.stdout.on('data', chunk => process.stdout.write(prefixed('nav') + chunk))
nav.stderr.on('data', chunk => process.stderr.write(prefixed('nav') + chunk))
children.push(nav)

process.on('SIGINT', () => children.forEach(child => child.kill('SIGINT')))

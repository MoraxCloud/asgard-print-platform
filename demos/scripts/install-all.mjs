import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// 四个宿主 demo 是彼此独立的 npm 工程，逐个安装（file: 依赖指向本仓库 packages/）。
const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')
const APPS = ['apps/vue3', 'apps/vue2', 'apps/react', 'apps/jquery']
const REPO = join(ROOT, '..')

/** 宿主 import 前必须存在的 dist 产物：按依赖顺序构建（plugin-kit 先于 common 与 echarts） */
const REQUIRED_BUILDS = [
  { file: 'packages/plugin-kit/dist/index.js', pkg: '@worm-print-platform/plugin-kit' },
  { file: 'packages/core/dist/designer/index.js', pkg: '@worm-print-platform/core' },
  // jQuery 工程直挂的是 common 的 dist 产物
  { file: 'packages/common/dist/common.js', pkg: '@worm-print-platform/common' },
  // vue3 宿主额外 import 图表 UI（依赖 echarts 的 /kit 与 /ui 子路径产物）
  { file: 'packages/echarts/dist/kit.js', pkg: '@worm-print-platform/echarts' },
  { file: 'packages/echarts/dist/ui.js', pkg: '@worm-print-platform/echarts' },
]

for (const item of REQUIRED_BUILDS) {
  if (existsSync(join(REPO, item.file))) continue
  console.log(`缺少 ${item.file}，先构建：npm run build -w ${item.pkg}`)
  const build = spawnSync('npm', ['run', 'build', '-w', item.pkg], { cwd: REPO, shell: process.platform === 'win32', stdio: 'inherit' })
  if (build.status !== 0) process.exit(build.status ?? 1)
}

for (const app of APPS) {
  console.log(`\n=== npm install — demos/${app} ===`)
  const res = spawnSync('npm', ['install'], { cwd: join(ROOT, app), shell: process.platform === 'win32', stdio: 'inherit' })
  if (res.status !== 0) {
    console.error(`install 失败：demos/${app}`)
    process.exit(res.status ?? 1)
  }
}

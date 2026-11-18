import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// 四个宿主 demo 的宿主样式同源：以 apps/vue3 的 demo-ui.css 为唯一源，
// 覆盖其余三宿主的同名文件。topbar-overflow.css 因 jquery 直挂形态有合理差异
// （「更多」面板 div/span），不在同步范围。
const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')
const SOURCE_APP = 'apps/vue3'
const TARGET_APPS = ['apps/vue2', 'apps/react', 'apps/jquery']
const REL = 'src/styles/demo-ui.css'

const src = join(ROOT, SOURCE_APP, REL)
if (!existsSync(src)) {
  console.error(`缺少源文件：demos/${SOURCE_APP}/${REL}`)
  process.exit(1)
}

const md5 = file => createHash('md5').update(readFileSync(file)).digest('hex')
const expected = md5(src)

for (const app of TARGET_APPS) {
  const dst = join(ROOT, app, REL)
  copyFileSync(src, dst)
  console.log(`已同步 demos/${app}/${REL}`)
}

// 含源在内的四份必须同 MD5，避免同步过程被其他写入打断
const digests = [SOURCE_APP, ...TARGET_APPS].map(app => md5(join(ROOT, app, REL)))
if (!digests.every(digest => digest === expected)) {
  console.error('四份 demo-ui.css 校验和不一致，请重跑本脚本')
  process.exit(1)
}
console.log(`✓ 四份 demo-ui.css 同 MD5：${expected.slice(0, 8)}`)

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '../../..')
const index = JSON.parse(readFileSync(join(repoRoot, 'marketplace/marketplace.json'), 'utf8'))
const output = join(here, '../src/catalog.generated.ts')
const banner = '// 由 scripts/gen-catalog.mjs 从 marketplace/marketplace.json 生成，请勿手改\n'
writeFileSync(
  output,
  `${banner}import type { MarketIndex } from './types.js'\n\nexport const BUNDLED_CATALOG: MarketIndex = ${JSON.stringify(index, null, 2)}\n`,
  'utf8',
)
console.log(`已生成 ${output}`)

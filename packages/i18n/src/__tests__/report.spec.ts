import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, it } from 'vitest'
import { discover } from '../discover.js'
import { buildComparisonMd } from '../report.js'

const writeJson = (path: string, value: unknown) => {
  mkdirSync(join(path, '..'), { recursive: true })
  writeFileSync(path, JSON.stringify(value))
}

it('中文在最左、按模块分组、含使用位置与目标语言列', () => {
  const root = mkdtempSync(join(tmpdir(), 'wpi18n-report-'))
  const dir = join(root, '.worm-print/i18n/core')
  writeJson(join(dir, 'zh-CN.json'), { core: {
    'toolbar.save': '保存', 'toolbar.preview': '预览', 'diagnostic.empty': '数据为空',
  } })
  writeJson(join(dir, 'en-US.json'), { core: {
    'toolbar.save': 'Save', 'toolbar.preview': 'Preview', 'diagnostic.empty': 'Empty data',
  } })
  writeJson(join(dir, 'th-TH.json'), { core: {
    'toolbar.save': 'บันทึก', 'toolbar.preview': 'ตัวอย่าง', 'diagnostic.empty': 'ข้อมูลว่าง',
  } })
  mkdirSync(join(root, 'src'), { recursive: true })
  writeFileSync(join(root, 'src/toolbar.ts'), "const a = t('toolbar.save')\nconst b = t('toolbar.preview')\n")

  const md = buildComparisonMd(discover(root), {
    locale: 'fr-FR',
    messages: { 'toolbar.save': 'Enregistrer' },
  }, { cwd: root })

  expect(md).toContain('| 中文 | en-US | th-TH | fr-FR | 使用位置 |')
  expect(md).toContain('## 模块：core / toolbar')
  expect(md).toContain('## 模块：core / diagnostic')
  const lines = md.split('\n')
  const save = lines.find(l => l.startsWith('| 保存 |'))!
  expect(save).toContain('| Save |')
  expect(save).toContain('| Enregistrer |')
  expect(save).toContain('src/toolbar.ts:1')
  // 同模块相邻：toolbar 两行在 diagnostic 行之前
  expect(lines.findIndex(l => l.startsWith('| 保存 |'))).toBeLessThan(
    lines.findIndex(l => l.startsWith('| 数据为空 |')),
  )
})

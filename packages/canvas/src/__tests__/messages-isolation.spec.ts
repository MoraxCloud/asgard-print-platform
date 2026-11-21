// @vitest-environment happy-dom
import { afterEach, expect, it } from 'vitest'
import { resetLocale, t } from '@worm-print-platform/core/i18n'
import { definePrintDesigner, type PrintDesignerElement } from '../index.js'

afterEach(() => { resetLocale(); document.body.replaceChildren() })

it('el.messages 不泄漏到全局 translator', async () => {
  definePrintDesigner()
  const host = document.createElement('div')
  document.body.replaceChildren(host)
  const el = document.createElement('print-designer') as PrintDesignerElement
  host.appendChild(el)
  await new Promise<void>(r => requestAnimationFrame(() => r()))
  el.messages = { 'toolbar.save': 'Enregistrer' }
  expect(t('toolbar.save')).not.toBe('Enregistrer')
})

it('同一 locale 两个实例的 messages 互不影响', async () => {
  definePrintDesigner()
  const host = document.createElement('div')
  document.body.replaceChildren(host)
  const a = document.createElement('print-designer') as PrintDesignerElement
  const b = document.createElement('print-designer') as PrintDesignerElement
  a.lang = 'fr-FR'
  b.lang = 'fr-FR'
  host.append(a, b)
  await new Promise<void>(r => requestAnimationFrame(() => r()))
  a.messages = { 'toolbar.k537': 'AAA-SAUVEGARDE' }
  b.messages = { 'toolbar.k537': 'BBB-SAUVEGARDE' }
  await new Promise<void>(r => requestAnimationFrame(() => r()))
  expect(a.shadowRoot!.textContent).toContain('AAA-SAUVEGARDE')
  expect(b.shadowRoot!.textContent).toContain('BBB-SAUVEGARDE')
})

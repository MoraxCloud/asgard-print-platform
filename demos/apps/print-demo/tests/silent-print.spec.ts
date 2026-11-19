import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadClientConfig,
  loadTypeConfig,
  saveClientConfig,
  saveTypeConfig,
} from '../src/views/print/health-report/silent-print'

describe('静默打印配置存储', () => {
  beforeEach(() => localStorage.clear())

  it('配置按模板类型隔离', () => {
    saveTypeConfig('healthReport', {
      templateId: 'tpl-h', printerName: '热敏-80', copies: 1, paperName: '', color: false,
    })
    saveTypeConfig('express', {
      templateId: 'tpl-e', printerName: '激光-01', copies: 2, paperName: 'A4', color: true,
    })

    expect(loadTypeConfig('healthReport')).toEqual({
      templateId: 'tpl-h', printerName: '热敏-80', copies: 1, paperName: '', color: false,
    })
    expect(loadTypeConfig('express')).toEqual({
      templateId: 'tpl-e', printerName: '激光-01', copies: 2, paperName: 'A4', color: true,
    })
  })

  it('未配置的类型返回 null，连接参数独立存储', () => {
    expect(loadTypeConfig('label')).toBeNull()
    saveClientConfig({ port: 17530, token: 'abc' })
    saveTypeConfig('healthReport', {
      templateId: 'tpl-h', printerName: 'P', copies: 1, paperName: '', color: false,
    })

    expect(loadClientConfig()).toEqual({ port: 17530, token: 'abc' })
    expect(loadTypeConfig('healthReport')?.templateId).toBe('tpl-h')
  })
})

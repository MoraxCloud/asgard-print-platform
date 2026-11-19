import { describe, expect, it, vi } from 'vitest'
import { main, parseArgs } from './cli.js'
import type { InstallOptions, InstallResult } from './types.js'

const fakeResult = (id: string): InstallResult => ({
  id, version: '1.0.0', target: `/tmp/${id}`, source: 'local', stable: true, created: true,
})

describe('CLI 参数解析', () => {
  it('解析 install 名称、版本与旗标', () => {
    const args = parseArgs(['install', 'echarts@1.0.0', '--source', 'npm', '--force'])
    expect(args.command).toBe('install')
    expect(args.name).toBe('echarts')
    expect(args.version).toBe('1.0.0')
    expect(args.source).toBe('npm')
    expect(args.force).toBe(true)
  })

  it('作用域包名无版本时不误判版本', () => {
    const args = parseArgs(['install', '@worm-print-platform/plugin-echarts'])
    expect(args.name).toBe('@worm-print-platform/plugin-echarts')
    expect(args.version).toBeUndefined()
  })

  it('非法 --source 报错', () => {
    expect(() => parseArgs(['install', 'x', '--source', 'svn'])).toThrow(/source/)
  })

  it('缺省 source 为 auto', () => {
    expect(parseArgs(['install', 'x']).source).toBe('auto')
  })
})

describe('CLI 执行', () => {
  it('main 调用 install 并传出解析结果', async () => {
    const spy = vi.fn(async (_options: InstallOptions) => fakeResult('echarts'))
    const out = vi.fn()
    const code = await main(['install', 'echarts', '--source', 'local', '--repo', '/tmp/repo'], {
      install: spy, out,
    })
    expect(code).toBe(0)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0]).toMatchObject({
      name: 'echarts', source: 'local', repo: '/tmp/repo',
    })
    expect(spy.mock.calls[0][0].version).toBeUndefined()
  })

  it('缺少命令时返回非零并提示', async () => {
    const out = vi.fn()
    const code = await main([], { out })
    expect(code).toBe(1)
    expect(out).toHaveBeenCalled()
  })
})

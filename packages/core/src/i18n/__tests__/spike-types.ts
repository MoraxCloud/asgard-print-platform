import type { PluginLocaleMessages } from '../types.js'

// 合法：插件 id 前缀的键必须编译通过
const ok: PluginLocaleMessages<'echarts'> = {
  'echarts.kind.bar': '柱状图',
  'echarts.prop.axis': 'Axis',
}
void ok

// @ts-expect-error 非法前缀必须报错
const bad: PluginLocaleMessages<'echarts'> = { 'other.key': 'x' }
void bad

// @ts-expect-error Partial 也不放宽前缀
const loose: Partial<PluginLocaleMessages<'echarts'>> = { foo: 'x' }
void loose

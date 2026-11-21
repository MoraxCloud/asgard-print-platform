import type { zhCN } from './messages/zh-CN.js'

export type Locale = string

export type Translate = (key: string, params?: Record<string, string | number>) => string

/** 内置语言包类型：键来自 zh-CN 包，值类型为 string */
export type LocaleMessages = typeof zhCN

/** 用户自定义包：内置键有补全提示，任意键允许写入以覆盖插件译文 */
export type CustomLocaleMessages = Partial<LocaleMessages> & Record<string, string>

/** 插件语言包类型：键必须以插件 id 为前缀，编译期强制 */
export type PluginLocaleMessages<Id extends string> = {
  [K in `${Id}.${string}`]: string
}

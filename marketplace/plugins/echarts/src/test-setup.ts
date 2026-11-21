// 测试环境锁定中文基线：该包既有测试断言中文文案；若默认 locale 探测为 en-US，
// 插件 en-US 语言包会把 UI 文案翻成英文，导致断言失败。显式设为中文复现原基线。
import { setLocale } from '@worm-print-platform/core/i18n'

setLocale('zh-CN')

// 测试环境锁定中文基线：happy-dom 的 navigator.language 通常是 en-US，
// 若不显式设置，依赖默认 locale 的既有中文断言会因自动探测而失败。
import { setLocale } from '@worm-print-platform/core/i18n'

setLocale('zh-CN')

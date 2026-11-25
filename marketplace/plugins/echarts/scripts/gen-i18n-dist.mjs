// 把源码语言资源 JSON 原样复制到 dist/i18n，供市场 CLI / bundle 发现。
import { cpSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
mkdirSync(resolve(root, 'dist/i18n'), { recursive: true })
cpSync(resolve(root, 'src/i18n'), resolve(root, 'dist/i18n'), { recursive: true })
console.log('[gen-i18n-dist] 已复制语言资源到 dist/i18n')

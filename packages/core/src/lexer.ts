// packages/print-core/src/lexer.ts
import { t as tr } from './i18n/index.js'
import type { Token } from './types.js'

const DANGEROUS_PROPS = new Set([
  'constructor', '__proto__', 'prototype',
  '__defineGetter__', '__defineSetter__',
  '__lookupGetter__', '__lookupSetter__',
])

const RESERVED_WORDS = new Set([
  'new', 'function', 'class', 'this', 'delete', 'typeof', 'void',
  'in', 'of', 'var', 'let', 'const', 'return', 'if', 'while', 'for',
])

export function tokenize(input: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  const n = input.length

  while (i < n) {
    const ch = input[i]

    // 跳过空白
    if (/\s/.test(ch)) {
      i++
      continue
    }

    // 数字
    if (/[0-9]/.test(ch) || (ch === '.' && i + 1 < n && /[0-9]/.test(input[i + 1]))) {
      let j = i
      while (j < n && /[0-9.]/.test(input[j])) j++
      tokens.push({ type: 'num', value: input.slice(i, j), position: i })
      i = j
      continue
    }

    // 字符串
    if (ch === "'" || ch === '"') {
      let j = i + 1
      let s = ''
      while (j < n && input[j] !== ch) {
        if (input[j] === '\\' && j + 1 < n) {
          s += input[j + 1]
          j += 2
        } else {
          s += input[j]
          j++
        }
      }
      if (j >= n) throw new Error(tr('diagnostic.lexer.unterminatedString'))
      tokens.push({ type: 'str', value: s, position: i })
      i = j + 1
      continue
    }

    // 标识符：ASCII 之外允许 CJK 统一汉字，使 {姓名}、{supplier.名称} 这类
    // 中文 key 在平铺上下文中可直接引用（与宿主字段 fieldKey 的中文场景对齐）。
    // 注意标识符规则须与 parser 成员访问、detectFlowListKey 的中文段保持一致。
    if (/[A-Za-z_$\u4e00-\u9fff]/.test(ch)) {
      let j = i
      while (j < n && /[A-Za-z0-9_$\u4e00-\u9fff]/.test(input[j])) j++
      const word = input.slice(i, j)

      if (RESERVED_WORDS.has(word)) {
        throw new Error(tr('diagnostic.lexer.keyword', { word }))
      }
      if (DANGEROUS_PROPS.has(word)) {
        throw new Error(tr('diagnostic.lexer.forbidden', { word }))
      }

      // true/false 作为 bool
      if (word === 'true' || word === 'false') {
        tokens.push({ type: 'bool', value: word, position: i })
      } else {
        tokens.push({ type: 'ident', value: word, position: i })
      }
      i = j
      continue
    }

    // 多字符运算符
    const three = input.slice(i, i + 3)
    if (three === '===' || three === '!==') {
      tokens.push({ type: 'punc', value: three, position: i })
      i += 3
      continue
    }

    const two = input.slice(i, i + 2)
    if (two === '=>') throw new Error(tr('diagnostic.lexer.noFunctionDef'))
    if (['==', '!=', '<=', '>=', '&&', '||'].includes(two)) {
      tokens.push({ type: 'punc', value: two, position: i })
      i += 2
      continue
    }

    // 单字符
    if (ch === '=') throw new Error(tr('diagnostic.lexer.noAssignment'))
    if (ch === ';') throw new Error(tr('diagnostic.lexer.noMultipleStatements'))
    if ('+-*/%()[]{},:.?!<>'.includes(ch)) {
      tokens.push({ type: 'punc', value: ch, position: i })
      i++
      continue
    }

    throw new Error(tr('diagnostic.lexer.invalidChar', { ch }))
  }

  return tokens
}

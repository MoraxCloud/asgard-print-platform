const DEFAULTS = { lineWidth: 16, maxLines: 2 }

/** 英文/数字词（含连字符与点号，如 Vue3、worm-print-platform、v1.5.2）按 [start,end) 记位 */
function tokenSpans(text) {
  const spans = []
  for (const m of text.matchAll(/[A-Za-z0-9][A-Za-z0-9._-]*/g)) {
    spans.push([m.index, m.index + m[0].length])
  }
  return spans
}

/** 换行点是否落在英文词内部（词首/词尾可切，词中不可切） */
function insideToken(spans, i) {
  return spans.some(([s, e]) => i > s && i < e)
}

function chunks(text, size) {
  const spans = tokenSpans(text)
  const chars = [...text]
  const out = []
  let i = 0
  while (i < chars.length) {
    let end = Math.min(i + size, chars.length)
    // 切点落在英文词内部时退到词首；词首就是本条开头（退无可退）才改从词尾切
    const hit = spans.find(([s, e]) => s < end && end < e)
    if (hit) end = hit[0] > i ? hit[0] : hit[1]
    out.push(chars.slice(i, end).join(''))
    i = end
  }
  return out
}

function clauses(text) {
  return text.match(/[^，、；：。！？!?]+[，、；：。！？!?]?/gu)?.filter(Boolean) || [text]
}

/** 按标点组成短条；单条最多两行，保留所有原始字符，英文词不跨行。 */
export function splitSubtitle(text, options = {}) {
  const { lineWidth, maxLines } = { ...DEFAULTS, ...options }
  if (maxLines !== 2) throw new Error('抖音短字幕固定最多两行')
  const capacity = lineWidth * maxLines
  const units = clauses(text).flatMap((part) => chunks(part, capacity))
  const captions = []
  for (const unit of units) {
    const last = captions.at(-1)
    if (last && [...(last + unit)].length <= capacity) captions[captions.length - 1] += unit
    else captions.push(unit)
  }
  return captions.map((caption) => wrapSubtitle(caption, lineWidth))
}

/** 两行时优先在标点处均衡换行；切点不得落在英文词内部。 */
export function wrapSubtitle(text, lineWidth = DEFAULTS.lineWidth) {
  const chars = [...text]
  if (chars.length <= lineWidth) return text
  const spans = tokenSpans(text)
  const middle = Math.ceil(chars.length / 2)
  const min = Math.max(1, chars.length - lineWidth)
  const max = Math.min(chars.length - 1, lineWidth)
  const candidates = []
  for (let i = 1; i < chars.length; i++) {
    if ('，、；：。！？!?'.includes(chars[i - 1])) candidates.push(i)
  }
  const validPunct = candidates.filter((i) => i >= min && i <= max && !insideToken(spans, i))
  let at = validPunct.sort((a, b) => Math.abs(a - middle) - Math.abs(b - middle))[0]
  if (at == null) {
    // 没有合适标点：从中点向两侧找最近的非词内切点，仍受两行宽度约束
    for (let d = 0; d < chars.length; d++) {
      for (const i of [middle - d, middle + d]) {
        if (i >= min && i <= max && !insideToken(spans, i)) { at = i; break }
      }
      if (at != null) break
    }
  }
  if (at == null) {
    // 整句就是一个超长英文词：宁可单行超宽也不拆词（不丢弃字符）
    return text
  }
  return `${chars.slice(0, at).join('')}\n${chars.slice(at).join('')}`
}

/** 在同一真实发音时长内按字数分配短条时间轴，最后一条吸附到句尾消除舍入误差。 */
export function subtitlesFor(text, start, end, options = {}) {
  const captions = splitSubtitle(text, options)
  const weights = captions.map((caption) => [...caption.replaceAll('\n', '')].length)
  const total = weights.reduce((sum, n) => sum + n, 0) || 1
  let cursor = start
  return captions.map((caption, index) => {
    const segStart = cursor
    cursor = index === captions.length - 1 ? end : +(cursor + ((end - start) * weights[index]) / total).toFixed(3)
    return { start: +segStart.toFixed(3), end: +cursor.toFixed(3), text: caption }
  })
}

/** 从短字幕时间轴恢复原句的完整听审窗口；兼容未拆条的旧 timings。 */
export function sentenceWindow(parts, sentenceIndex) {
  const matched = parts.filter((part) => part.sentence === sentenceIndex)
  if (!matched.length && parts[sentenceIndex]?.sentence == null) {
    const { start, end } = parts[sentenceIndex]
    return { start, end }
  }
  if (!matched.length) throw new Error(`字幕时间轴缺原句 ${sentenceIndex}`)
  return { start: matched[0].start, end: matched.at(-1).end }
}

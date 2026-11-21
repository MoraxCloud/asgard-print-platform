export interface UpdateResult {
  next: Record<string, string>
  added: string[]
  removed: string[]
}

/** 按最新骨架增量对齐语言包：补新键为空串、保留已有译文；--prune 删除多余键。 */
export function updatePack(
  pack: Record<string, string>,
  base: Record<string, string>,
  opts: { prune?: boolean } = {},
): UpdateResult {
  const next: Record<string, string> = {}
  const added: string[] = []
  const removed: string[] = []
  for (const key of Object.keys(base)) {
    if (key in pack) next[key] = pack[key]
    else { next[key] = ''; added.push(key) }
  }
  for (const key of Object.keys(pack)) {
    if (!(key in base)) {
      if (opts.prune) removed.push(key)
      else next[key] = pack[key]
    }
  }
  return { next, added, removed }
}

import { ref, type Ref } from 'vue'

/** 按钮点击锁：获取后锁定指定毫秒，期间重复点击直接忽略 */
export function createClickLock(durationMs = 3000): {
  locked: Ref<boolean>
  acquire: () => boolean
  dispose: () => void
} {
  const locked = ref(false)
  let timer: ReturnType<typeof setTimeout> | undefined

  return {
    locked,
    acquire() {
      if (locked.value) return false
      locked.value = true
      timer = setTimeout(() => {
        locked.value = false
        timer = undefined
      }, durationMs)
      return true
    },
    dispose() {
      if (timer) clearTimeout(timer)
      timer = undefined
      locked.value = false
    },
  }
}

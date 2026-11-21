// 测试环境锁定中文基线：Node 22+ 自带 navigator.language='en-US'，
// 若不显式设置，既有「默认中文」断言会因探测到英文而失败。
// 用 getter 定义，兼容 engine.spec.ts 里的 vi.spyOn(navigator, 'language', 'get')。
try {
  Object.defineProperty(navigator, 'language', { get: () => 'zh-CN', configurable: true })
} catch { /* 无 navigator 的环境忽略 */ }

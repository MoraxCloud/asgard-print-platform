// 测试环境锁定中文基线：Node 22+ 自带 navigator.language='en-US'，
// contract 的诊断文案断言基于中文源文本，不锁定会探测到英文。
try {
  Object.defineProperty(navigator, 'language', { get: () => 'zh-CN', configurable: true })
} catch { /* 无 navigator 的环境忽略 */ }

import { defineConfig } from 'vitest/config'

// 解析逻辑为纯 TS（node 环境）；弹窗 UI 测试单文件声明 happy-dom。
export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['src/**/__tests__/*.{test,spec}.ts'],
  },
})

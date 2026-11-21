import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import '@worm-print-platform/echarts/ui'
import './styles/index.css'
import App from './App.vue'
import router from './router'

// 示例始终用 MSW 模拟 /sys/print/*（本地 dev 与 Pages 静态部署均无后端）；设 VITE_NO_MOCK=true 可关闭以对接真实后端
if (import.meta.env.VITE_NO_MOCK !== 'true') {
  const { worker } = await import('./mocks/browser')
  await worker.start({
    onUnhandledRequest: 'bypass',
    // Pages 子路径部署时 SW 必须落在 demo 目录下，否则会去站点根找而 404
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  })

  // 首次加载/刷新时 SW 可能尚未接管当前页面，此时发出的 /api 请求会绕过 mock
  // 落到静态服务器返回 404，导致首屏数据静默变空。等接管完成后再挂载可消除该竞态。
  if (!navigator.serviceWorker.controller) {
    await new Promise<void>(resolve => {
      let settled = false
      const done = () => {
        if (settled) return
        settled = true
        resolve()
      }
      navigator.serviceWorker.addEventListener('controllerchange', done, { once: true })
      // SW 安装失败或被浏览器阻止时兜底，避免应用永远不挂载
      window.setTimeout(done, 1000)
    })
  }
}

createApp(App).use(router).use(ElementPlus).mount('#app')

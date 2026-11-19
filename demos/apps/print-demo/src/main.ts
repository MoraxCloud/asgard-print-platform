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
}

createApp(App).use(router).use(ElementPlus).mount('#app')

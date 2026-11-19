import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import TemplateListView from '@/views/print/template/index.vue'
import TemplateDesignerView from '@/views/print/template/designer.vue'
import HealthReportListView from '@/views/print/health-report/index.vue'
import SilentConfigView from '@/views/print/silent-config/index.vue'
import PluginIntroView from '@/views/print/plugin-intro/index.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/print/template' },
  {
    path: '/print/template',
    name: 'PrintTemplateList',
    component: TemplateListView,
    meta: { title: '打印模板管理' },
  },
  {
    path: '/print/template/design/:id',
    name: 'PrintTemplateDesigner',
    component: TemplateDesignerView,
    props: true,
    meta: { title: '模板设计' },
  },
  {
    path: '/print/health-report',
    name: 'HealthReportList',
    component: HealthReportListView,
    meta: { title: '体检报告' },
  },
  {
    path: '/print/silent-config',
    name: 'SilentPrintConfig',
    component: SilentConfigView,
    meta: { title: '静默打印配置' },
  },
  {
    path: '/print/plugin-intro',
    name: 'PluginIntro',
    component: PluginIntroView,
    meta: { title: '插件介绍' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router

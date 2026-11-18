/**
 * Vue 3 兼容门面：把 <print-designer> 自定义元素包装成与
 * @worm-vue3-print/Vue 3 轨的 PrintDesigner 同形的 Vue 组件。
 *
 * 用渲染函数而非 SFC 有两个原因：common 主入口坚持零框架、不引入 @vitejs/plugin-vue；
 * h() 的字符串标签名直接生成原生元素，宿主无需配置 compilerOptions.isCustomElement。
 *
 * 关键口径：Vue 对自定义元素上的 :prop 绑定会走 setAttribute，对象变 "[object Object]"、
 * 函数直接丢失。因此所有入参必须显式赋 element property，事件必须手动转译。
 */
import { defineComponent, h, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { PropType } from 'vue'
import { definePrintDesigner } from '@worm-print-platform/canvas'
import type { PrintFontDeclaration } from '@worm-print-platform/core'
import type {
  MultiPageTemplateData, PrintBusinessField, RuntimeElement, TemplateData,
  UploadDesignBackgroundFn, UploadImageFn,
} from '@worm-print-platform/core/designer'
import type { PrintDesignerElement } from '../print-designer'
import type { PrintDesignerThemeConfig, PrintDesignerThemeMode } from '../host-contract'

/** 与 Vue 3 轨的 expose 同形：getTemplateJson 返回对象而非 JSON 字符串 */
export interface PrintDesignerExpose {
  getTemplateJson(): TemplateData | MultiPageTemplateData | undefined
  validateTemplate(): ReturnType<PrintDesignerElement['validateTemplate']>
  getGeometryWarnings(): string[]
}

/** 单页 / 多页模板都把元素放到第一页，与 Vue 3 轨的 initialElements 语义对齐 */
function withInitialElements(
  base: TemplateData | MultiPageTemplateData,
  elements: RuntimeElement[],
): TemplateData | MultiPageTemplateData {
  const cloned = elements.map(e => ({
    ...e,
    options: { ...e.options },
    printElementType: { ...e.printElementType },
  }))
  const pages = (base as MultiPageTemplateData).pages
  if (Array.isArray(pages)) {
    return {
      ...base,
      pages: pages.map((p, i) => (i === 0 ? { ...p, elements: cloned } : p)),
    } as MultiPageTemplateData
  }
  return { ...(base as TemplateData), elements: cloned }
}

const component = defineComponent({
  name: 'PrintDesigner',
  props: {
    initialTemplate: {
      type: Object as PropType<TemplateData | MultiPageTemplateData>,
      default: undefined,
    },
    initialElements: {
      type: Array as PropType<RuntimeElement[]>,
      default: undefined,
    },
    fields: {
      type: Array as PropType<PrintBusinessField[]>,
      default: undefined,
    },
    isEdit: { type: Boolean, default: undefined },
    /** 图片上传适配器；未注入时图片上传入口置灰 */
    uploadImage: {
      type: Function as PropType<UploadImageFn>,
      default: undefined,
    },
    /** 设计背景图上传适配器；未注入时入口禁用 */
    uploadDesignBackground: {
      type: Function as PropType<UploadDesignBackgroundFn>,
      default: undefined,
    },
    /** 是否展示帮助入口；不传时保持元素默认（展示） */
    showHelp: { type: Boolean, default: undefined },
    /** 是否展示工具栏「预览」按钮；不传时保持元素默认（展示） */
    showPreview: { type: Boolean, default: undefined },
    /** 是否展示工具栏「保存」按钮；不传时保持元素默认（展示） */
    showSave: { type: Boolean, default: undefined },
    /** 模板级字体声明，保存 / 导出时写入模板 JSON */
    fonts: {
      type: Array as PropType<readonly PrintFontDeclaration[]>,
      default: undefined,
    },
    /** common 独有：插件 UI 的设计态业务数据，未注入时回落 DEFAULT_DEMO_DATA */
    designData: {
      type: [Object, Array] as PropType<Record<string, unknown> | readonly Record<string, unknown>[]>,
      default: undefined,
    },
    /** 主题预设：auto（默认）跟随系统 prefers-color-scheme，light/dark 强制 */
    theme: { type: String as PropType<PrintDesignerThemeMode>, default: undefined },
    /** 主题色值覆盖：传参优先于预设、系统与 CSS 令牌；只影响外壳，画布纸张不受影响 */
    themeConfig: { type: Object as PropType<PrintDesignerThemeConfig>, default: undefined },
  },
  emits: {
    preview: () => true,
    save: (json: string) => typeof json === 'string',
  },
  setup(props, { emit, expose }) {
    const elRef = ref<PrintDesignerElement | null>(null)
    let onSave: ((ev: Event) => void) | null = null
    let onPreview: (() => void) | null = null

    // SSR 下没有 customElements；升级放在挂载前，避免元素先以未升级形态插入 DOM
    if (typeof customElements !== 'undefined') definePrintDesigner()

    function applyTemplate(el: PrintDesignerElement) {
      if (props.initialTemplate !== undefined) {
        el.template = props.initialTemplate
        return
      }
      // Vue 3 轨的 initialElements 只在没有 initialTemplate 时覆盖当前模板的元素层
      if (props.initialElements === undefined) return
      const raw = el.getTemplateJson()
      const base = JSON.parse(raw) as TemplateData | MultiPageTemplateData
      el.template = withInitialElements(base, props.initialElements)
    }

    function syncAll() {
      const el = elRef.value
      if (!el) return
      applyTemplate(el)
      if (props.fields !== undefined) el.fields = props.fields
      if (props.fonts !== undefined) el.fonts = props.fonts
      if (props.designData !== undefined) el.designData = props.designData
      el.uploadImage = props.uploadImage
      el.uploadDesignBackground = props.uploadDesignBackground
      if (props.isEdit !== undefined) el.isEdit = props.isEdit
      if (props.showHelp !== undefined) el.showHelp = props.showHelp
      if (props.showPreview !== undefined) el.showPreview = props.showPreview
      if (props.showSave !== undefined) el.showSave = props.showSave
      if (props.theme !== undefined) el.theme = props.theme
      if (props.themeConfig !== undefined) el.themeConfig = props.themeConfig
    }

    onMounted(() => {
      const el = elRef.value
      if (!el) return
      onSave = (ev: Event) => emit('save', (ev as CustomEvent<string>).detail)
      onPreview = () => emit('preview')
      el.addEventListener('save', onSave)
      el.addEventListener('preview', onPreview)
      syncAll()
    })

    onBeforeUnmount(() => {
      const el = elRef.value
      if (onSave) el?.removeEventListener('save', onSave)
      if (onPreview) el?.removeEventListener('preview', onPreview)
      onSave = null
      onPreview = null
    })

    watch(() => props.initialTemplate, () => { const el = elRef.value; if (el) applyTemplate(el) })
    watch(() => props.initialElements, () => { const el = elRef.value; if (el) applyTemplate(el) })
    watch(() => props.fields, v => { const el = elRef.value; if (el) el.fields = v ?? [] })
    watch(() => props.fonts, v => { const el = elRef.value; if (el) el.fonts = v })
    watch(() => props.designData, v => { const el = elRef.value; if (el) el.designData = v })
    watch(() => props.uploadImage, v => { const el = elRef.value; if (el) el.uploadImage = v })
    watch(() => props.uploadDesignBackground, v => { const el = elRef.value; if (el) el.uploadDesignBackground = v })
    watch(() => props.isEdit, v => { const el = elRef.value; if (el && v !== undefined) el.isEdit = v })
    watch(() => props.showHelp, v => { const el = elRef.value; if (el && v !== undefined) el.showHelp = v })
    watch(() => props.showPreview, v => { const el = elRef.value; if (el && v !== undefined) el.showPreview = v })
    watch(() => props.showSave, v => { const el = elRef.value; if (el && v !== undefined) el.showSave = v })
    watch(() => props.theme, v => { const el = elRef.value; if (el && v !== undefined) el.theme = v })
    watch(() => props.themeConfig, v => { const el = elRef.value; if (el && v !== undefined) el.themeConfig = v })

    const api: PrintDesignerExpose = {
      getTemplateJson() {
        const raw = elRef.value?.getTemplateJson()
        return raw ? JSON.parse(raw) as TemplateData | MultiPageTemplateData : undefined
      },
      validateTemplate() {
        return elRef.value?.validateTemplate() ?? []
      },
      getGeometryWarnings() {
        return elRef.value?.getGeometryWarnings() ?? []
      },
    }
    expose(api)

    return () => h('print-designer', { ref: elRef })
  },
})

/**
 * Vue 3 轨用 defineExpose 宏，vue-tsc 会把暴露方法并进组件实例类型；
 * 纯 TS 的 expose() 没有这层推断。补一条构造签名，让宿主照旧写
 * `ref<InstanceType<typeof PrintDesigner>>` 并调 getTemplateJson() 时类型通过。
 */
type WithExposed<T> = T extends new (...args: infer A) => infer R
  ? new (...args: A) => R & PrintDesignerExpose
  : never

export const PrintDesigner = component as unknown as WithExposed<typeof component>

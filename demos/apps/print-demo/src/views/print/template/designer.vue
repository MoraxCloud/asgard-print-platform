<template>
  <div class="designer-page">
    <div class="designer-page__header">
      <el-button @click="handleBack">返回列表</el-button>
      <span class="designer-page__title">{{ template?.name ?? '模板设计' }}</span>
      <el-tag v-if="template" size="small" type="info">{{ template.businessType }}</el-tag>
    </div>
    <div v-loading="loading" class="designer-host">
      <PrintDesigner
        v-if="template"
        ref="designerRef"
        :initial-template="templateData ?? undefined"
        :fields="fields"
        :design-data="printData[0]"
        :upload-image="uploadPrintImage"
        :is-edit="true"
        @save="handleSave"
        @preview="handlePreview"
      />
    </div>

    <PreviewDialog
      v-model="previewVisible"
      :template-json="previewTemplateJson"
      :print-data="printData"
      :base-url="'/files'"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { PrintBusinessField, TemplateData } from '@worm-print-platform/canvas/vue3'
import { PrintDesigner } from '@worm-print-platform/canvas/vue3'
import { getDesignerData, updateTemplate, uploadPrintImage } from '@/api/modules/print'
import type { PrintTemplate } from '@/types/print'
import PreviewDialog from './components/PreviewDialog.vue'

const route = useRoute()
const router = useRouter()
const templateId = typeof route.params.id === 'string' ? route.params.id : ''

const loading = ref(false)
const template = ref<PrintTemplate | null>(null)
const templateData = ref<TemplateData | null>(null)
const fields = ref<PrintBusinessField[]>([])
const printData = ref<Record<string, any>[]>([])
const designerRef = ref<InstanceType<typeof PrintDesigner>>()

const previewVisible = ref(false)
const previewTemplateJson = ref<Record<string, any>>({})

function handleBack() {
  void router.push('/print/template')
}

async function loadData() {
  loading.value = true
  try {
    const res = await getDesignerData(templateId)
    if (!res.ret) {
      ElMessage.error(res.msg || '设计器数据加载失败')
      return
    }
    template.value = res.data.template
    fields.value = res.data.fields
    printData.value = res.data.printData
    try {
      templateData.value = JSON.parse(res.data.template.elements) as TemplateData
    } catch {
      templateData.value = null
    }
  } finally {
    loading.value = false
  }
}

async function handleSave(json: string) {
  if (!template.value) return
  const res = await updateTemplate({
    id: template.value.id,
    name: template.value.name,
    businessType: template.value.businessType,
    remark: template.value.remark,
    elements: json,
  })
  if (res.ret) {
    ElMessage.success('保存成功')
  } else {
    ElMessage.error(res.msg || '保存失败')
  }
}

function handlePreview() {
  const current = designerRef.value?.getTemplateJson()
  if (!current) {
    ElMessage.warning('暂无可预览的模板')
    return
  }
  previewTemplateJson.value = current as Record<string, any>
  previewVisible.value = true
}

onMounted(() => {
  void loadData()
})
</script>

<style scoped lang="scss">
.designer-page {
  display: flex;
  height: 100%;
  min-height: 500px;
  flex-direction: column;

  &__header {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 56px;
    flex-shrink: 0;
    padding: 0 16px;
    border-bottom: 1px solid var(--el-border-color-light);
    background: var(--el-bg-color);
  }

  &__title {
    font-weight: 600;
  }
}

.designer-host {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
</style>

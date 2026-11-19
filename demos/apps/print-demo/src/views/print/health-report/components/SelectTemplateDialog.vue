<template>
  <el-dialog
    :model-value="modelValue"
    title="选择打印模板"
    width="720px"
    destroy-on-close
    @update:model-value="handleVisibleChange"
  >
    <el-table v-loading="loading" :data="templates" highlight-current-row @current-change="handleCurrentChange">
      <el-table-column prop="name" label="模板名称" min-width="180" />
      <el-table-column prop="remark" label="备注" min-width="220" show-overflow-tooltip />
      <el-table-column prop="updateTime" label="更新时间" width="180" />
    </el-table>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :disabled="!selected" :loading="submitting" @click="handleConfirm">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { pageTemplate, renderData } from '@/api/modules/print'
import type { PrintTemplate } from '@/types/print'

export interface TemplateSelection {
  template: PrintTemplate
  templateJson: Record<string, any>
  baseUrl: string
}

const emit = defineEmits<{ (e: 'confirm', payload: TemplateSelection): void }>()
const modelValue = defineModel<boolean>({ default: false })

const templates = ref<PrintTemplate[]>([])
const selected = ref<PrintTemplate | null>(null)
const loading = ref(false)
const submitting = ref(false)

function handleVisibleChange(value: boolean) {
  modelValue.value = value
}

function handleClose() {
  modelValue.value = false
}

function handleCurrentChange(row: PrintTemplate | null) {
  selected.value = row
}

async function loadTemplates() {
  loading.value = true
  try {
    const res = await pageTemplate({ businessType: 'healthReport', size: 100 })
    if (res.ret) {
      templates.value = res.data.records
    } else {
      ElMessage.error(res.msg || '模板列表加载失败')
    }
  } finally {
    loading.value = false
  }
}

async function buildSelection(): Promise<TemplateSelection | null> {
  if (!selected.value) return null
  const res = await renderData({ templateId: selected.value.id, businessType: 'healthReport' })
  if (!res.ret) {
    ElMessage.error(res.msg || '模板数据加载失败')
    return null
  }
  return {
    template: selected.value,
    templateJson: res.data.templateJson,
    baseUrl: res.data.baseUrl ?? '',
  }
}

async function handleConfirm() {
  submitting.value = true
  try {
    const selection = await buildSelection()
    if (!selection) return
    emit('confirm', selection)
    modelValue.value = false
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  void loadTemplates()
})
</script>

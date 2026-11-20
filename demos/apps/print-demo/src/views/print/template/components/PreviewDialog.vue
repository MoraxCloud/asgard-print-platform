<template>
  <el-dialog
    :model-value="modelValue"
    title="打印预览"
    fullscreen
    destroy-on-close
    @update:model-value="handleVisibleChange"
  >
    <div v-if="modelValue" class="preview-host">
      <PrintHtmlPreview
        ref="previewRef"
        :template-json="templateJson"
        :print-data="printData"
        :base-url="baseUrl"
        @error="handlePreviewError"
      />
    </div>
    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
      <el-button type="primary" @click="handlePrint">打印</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { PrintHtmlPreview } from '@worm-print-platform/canvas/vue3'

defineProps<{
  templateJson: Record<string, any>
  printData: Record<string, any>[]
  baseUrl: string
}>()

const modelValue = defineModel<boolean>({ default: false })

const previewRef = ref<InstanceType<typeof PrintHtmlPreview>>()

function handleVisibleChange(value: boolean) {
  modelValue.value = value
}

function handleClose() {
  modelValue.value = false
}

function handlePrint() {
  previewRef.value?.print()
}

function handlePreviewError(message: string) {
  ElMessage.error(message || '预览渲染失败')
}

function print() {
  handlePrint()
}

defineExpose({ print })
</script>

<style scoped lang="scss">
.preview-host {
  height: calc(100vh - 160px);
  min-height: 400px;
  overflow: auto;
  background: var(--el-fill-color-lighter);
}
</style>

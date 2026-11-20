<template>
  <div class="page-container">
    <div class="report-head">
      <h1>体检报告</h1>
      <span class="report-head__hint">3 份模拟报告 · 静默打印使用集中配置</span>
    </div>

    <div class="table-area">
      <el-table :data="healthReports" border stripe>
        <el-table-column label="报告编号" min-width="180">
          <template #default="scope">{{ reportField(scope.row, 'no') }}</template>
        </el-table-column>
        <el-table-column label="姓名" width="110">
          <template #default="scope">{{ reportField(scope.row, 'name') }}</template>
        </el-table-column>
        <el-table-column label="性别" width="80">
          <template #default="scope">{{ reportField(scope.row, 'sex') }}</template>
        </el-table-column>
        <el-table-column label="年龄" width="90">
          <template #default="scope">{{ reportField(scope.row, 'age') }}</template>
        </el-table-column>
        <el-table-column label="体检日期" width="130">
          <template #default="scope">{{ reportField(scope.row, 'date') }}</template>
        </el-table-column>
        <el-table-column label="套餐" min-width="180">
          <template #default="scope">{{ reportField(scope.row, 'package') }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-space>
              <el-button type="primary" size="small" link @click="handlePrint(scope.row)">打印</el-button>
              <el-button
                type="warning"
                size="small"
                link
                :disabled="silentLock.locked.value"
                :loading="silentLock.locked.value"
                @click="handleSilentPrint(scope.row)"
              >
                静默打印
              </el-button>
            </el-space>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <SelectTemplateDialog v-model="selectDialogVisible" @confirm="handleSelectConfirm" />
    <PreviewDialog
      v-model="previewVisible"
      :template-json="previewData.templateJson"
      :print-data="previewData.printData"
      :base-url="previewData.baseUrl"
    />
  </div>
</template>

<script setup lang="ts">
import { onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTemplateById } from '@/api/modules/print'
import { HEALTH_REPORTS } from '@/print/health-reports'
import PreviewDialog from '@/views/print/template/components/PreviewDialog.vue'
import SelectTemplateDialog, { type TemplateSelection } from './components/SelectTemplateDialog.vue'
import { createClickLock } from './click-lock'
import {
  loadClientConfig,
  loadTypeConfig,
  submitSilentPrint,
  type TypePrintConfig,
} from './silent-print'

type Report = Record<string, unknown>

const router = useRouter()
const healthReports = HEALTH_REPORTS
const silentLock = createClickLock(3000)

onUnmounted(() => silentLock.dispose())

const currentReport = ref<Report | null>(null)
const selectDialogVisible = ref(false)
const previewVisible = ref(false)
const previewData = reactive({
  templateJson: {} as Record<string, any>,
  printData: [] as Record<string, any>[],
  baseUrl: '',
})

function reportField(row: Report, key: string): string {
  const report = row.report as Report | undefined
  return String(report?.[key] ?? '—')
}

function handlePrint(row: Report) {
  currentReport.value = row
  selectDialogVisible.value = true
}

function handleSelectConfirm(selection: TemplateSelection) {
  if (!currentReport.value) return
  previewData.templateJson = selection.templateJson
  previewData.printData = [currentReport.value]
  previewData.baseUrl = selection.baseUrl
  previewVisible.value = true
}

async function submit(
  templateJson: Record<string, any>,
  templateName: string,
  config: TypePrintConfig,
) {
  if (!currentReport.value) return
  try {
    const jobId = await submitSilentPrint(
      templateJson,
      [currentReport.value],
      templateName,
      config,
      loadClientConfig(),
    )
    ElMessage.success(`静默打印任务已提交：${jobId}`)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : String(error))
  }
}

async function handleSilentPrint(row: Report) {
  if (!silentLock.acquire()) return
  currentReport.value = row
  const config = loadTypeConfig('healthReport')
  if (!config?.templateId) {
    try {
      await ElMessageBox.confirm(
        '尚未配置体检报告的静默打印模板与打印机，请先配置。',
        '提示',
        { confirmButtonText: '去配置', cancelButtonText: '取消', type: 'warning' },
      )
      void router.push('/print/silent-config')
    } catch {
      // 用户取消
    }
    return
  }

  const res = await getTemplateById(config.templateId)
  if (!res.ret) {
    ElMessage.error(res.msg || '默认模板不存在，请重新配置')
    return
  }
  await submit(JSON.parse(res.data.elements) as Record<string, any>, res.data.name, config)
}
</script>

<style scoped lang="scss">
.page-container {
  display: flex;
  height: 100%;
  flex-direction: column;
}

.report-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-shrink: 0;
  padding: 16px 20px;

  h1 {
    margin: 0;
    font-size: 18px;
  }

  &__hint {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }
}

.table-area {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 0 20px 16px;
}
</style>

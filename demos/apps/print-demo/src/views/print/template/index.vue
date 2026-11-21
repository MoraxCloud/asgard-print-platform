<template>
  <div class="page-container">
    <div class="query-content">
      <div class="search-fields">
        <div class="search-field">
          <label class="field-label">模板名称</label>
          <el-input v-model="searchForm.name" placeholder="请输入模板名称" clearable @keyup.enter="handleSearch" />
        </div>
        <div class="search-field">
          <label class="field-label">模板类型</label>
          <el-select v-model="searchForm.businessType" placeholder="全部类型" clearable>
            <el-option
              v-for="option in typeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </div>
        <div class="search-field search-buttons">
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button @click="handleSearch">刷新</el-button>
          <el-button type="success" @click="handleCreate">新建模板</el-button>
        </div>
      </div>
    </div>

    <div class="table-area">
      <el-table v-loading="loading" :data="tableData" border stripe empty-text="暂无模板，点击右上角新建">
        <el-table-column prop="name" label="模板名称" min-width="180" />
        <el-table-column label="模板类型" min-width="140">
          <template #default="scope">{{ typeLabel(scope.row.businessType) }}</template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
        <el-table-column label="是否默认" width="100">
          <template #default="scope">
            <el-tag v-if="scope.row.isDefault" type="success" size="small">默认</el-tag>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" width="200" show-overflow-tooltip />
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="scope">
            <el-space>
              <el-button type="primary" size="small" link @click="handleDesign(scope.row)">设计</el-button>
              <el-button type="primary" size="small" link @click="handleEdit(scope.row)">编辑</el-button>
              <el-button
                v-if="!scope.row.isDefault"
                type="warning"
                size="small"
                link
                @click="handleSetDefault(scope.row)"
              >
                设为默认
              </el-button>
              <el-button type="info" size="small" link @click="handlePreview(scope.row)">预览</el-button>
              <el-button type="danger" size="small" link @click="handleDelete(scope.row)">删除</el-button>
            </el-space>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="pagination-bar">
      <el-pagination
        v-model:current-page="pagination.current"
        v-model:page-size="pagination.size"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="loadData"
      />
    </div>

    <PrintTemplateFormDialog
      v-model="formDialogVisible"
      :template="selectedTemplate"
      :type-options="typeOptions"
      @success="loadData"
    />
    <PreviewDialog
      v-model="previewVisible"
      :template-json="previewData.templateJson"
      :print-data="previewData.printData"
      :base-url="previewData.baseUrl"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  deleteTemplate,
  listTypes,
  pageTemplate,
  renderData,
  setDefaultTemplate,
} from '@/api/modules/print'
import type { PrintTemplate, PrintTemplateTypeOption } from '@/types/print'
import PrintTemplateFormDialog from './components/PrintTemplateFormDialog.vue'
import PreviewDialog from './components/PreviewDialog.vue'

const router = useRouter()

const searchForm = reactive({ name: '', businessType: '' })
const pagination = reactive({ current: 1, size: 10 })
const total = ref(0)
const tableData = ref<PrintTemplate[]>([])
const typeOptions = ref<PrintTemplateTypeOption[]>([])
const loading = ref(false)

const formDialogVisible = ref(false)
const selectedTemplate = ref<PrintTemplate | null>(null)
const previewVisible = ref(false)
const previewData = reactive({
  templateJson: {} as Record<string, any>,
  printData: [] as Record<string, any>[],
  baseUrl: '',
})

function typeLabel(value: string): string {
  return typeOptions.value.find(option => option.value === value)?.label ?? value
}

async function loadData() {
  loading.value = true
  try {
    const res = await pageTemplate({
      current: pagination.current,
      size: pagination.size,
      name: searchForm.name,
      businessType: searchForm.businessType,
    })
    if (res.ret) {
      tableData.value = res.data.records
      total.value = res.data.totalRow
    } else {
      ElMessage.error(res.msg || '列表加载失败')
    }
  } catch {
    // post() 已统一提示网络/HTTP 错误，这里避免未捕获的 rejection 中断加载链路
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.current = 1
  void loadData()
}

function handleReset() {
  searchForm.name = ''
  searchForm.businessType = ''
  handleSearch()
}

function handleSizeChange(size: number) {
  pagination.size = size
  pagination.current = 1
  void loadData()
}

function handleCreate() {
  selectedTemplate.value = null
  formDialogVisible.value = true
}

function handleEdit(row: PrintTemplate) {
  selectedTemplate.value = row
  formDialogVisible.value = true
}

async function handleDelete(row: PrintTemplate) {
  try {
    await ElMessageBox.confirm(`确认删除模板「${row.name}」？`, '提示', { type: 'warning' })
  } catch {
    return
  }
  const res = await deleteTemplate(row.id)
  if (res.ret) {
    ElMessage.success('删除成功')
    void loadData()
  } else {
    ElMessage.error(res.msg || '删除失败')
  }
}

async function handleSetDefault(row: PrintTemplate) {
  const res = await setDefaultTemplate(row.businessType, row.id)
  if (res.ret) {
    ElMessage.success('设置成功')
    void loadData()
  } else {
    ElMessage.error(res.msg || '设置失败')
  }
}

function handleDesign(row: PrintTemplate) {
  void router.push(`/print/template/design/${row.id}`)
}

async function handlePreview(row: PrintTemplate) {
  const res = await renderData({ templateId: row.id, businessType: row.businessType })
  if (!res.ret) {
    ElMessage.error(res.msg || '预览数据加载失败')
    return
  }
  previewData.templateJson = res.data.templateJson
  previewData.printData = res.data.printData
  previewData.baseUrl = res.data.baseUrl ?? ''
  previewVisible.value = true
}

async function loadTypes() {
  try {
    const res = await listTypes()
    if (res.ret) {
      typeOptions.value = res.data
    } else {
      ElMessage.error(res.msg || '类型加载失败')
    }
  } catch {
    // post() 已统一提示网络/HTTP 错误
  }
}

onMounted(() => {
  // 类型字典与列表互不依赖：任一请求失败都不能拖垮另一条加载链
  void loadTypes()
  void loadData()
})
</script>

<style scoped lang="scss">
.page-container {
  display: flex;
  height: 100%;
  flex-direction: column;
}

.query-content {
  flex-shrink: 0;
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.search-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.search-field {
  display: flex;
  align-items: center;
  gap: 8px;

  .field-label {
    width: 6em;
    flex-shrink: 0;
    text-align: right;
    color: var(--el-text-color-regular);
  }
}

.search-buttons {
  margin-left: auto;
}

.table-area {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 16px 20px 0;
}

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  flex-shrink: 0;
  padding: 12px 20px;
}
</style>

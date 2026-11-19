<template>
  <div class="page-container">
    <div class="config-head">
      <h1>静默打印配置</h1>
      <span class="config-head__hint">按模板类型配置默认模板与打印选项</span>
    </div>

    <el-card shadow="never" class="client-card">
      <template #header>客户端连接（环境级）</template>
      <el-form label-width="110px">
        <el-form-item label="客户端端口">
          <el-input-number v-model="client.port" :min="1024" :max="65535" />
        </el-form-item>
        <el-form-item label="配对 token">
          <el-input v-model="client.token" placeholder="客户端开启鉴权时填写" />
        </el-form-item>
        <el-form-item>
          <el-button :loading="refreshing" @click="handleRefreshPrinters">刷新打印机列表</el-button>
          <el-button type="primary" @click="handleSaveClient">保存连接参数</el-button>
          <span v-if="printers.length" class="client-card__status">已发现 {{ printers.length }} 台打印机</span>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card
      v-for="option in typeOptions"
      :key="option.value"
      shadow="never"
      class="type-card"
    >
      <template #header>
        <div class="type-card__header">
          <span>{{ option.label }}</span>
          <el-tag v-if="savedTypes.has(option.value)" type="success" size="small">已配置</el-tag>
          <el-tag v-else type="info" size="small">未配置</el-tag>
        </div>
      </template>
      <el-form label-width="120px">
        <el-form-item label="默认模板">
          <el-select v-model="configs[option.value].templateId" filterable placeholder="选择该类型的默认模板">
            <el-option
              v-for="tpl in templates[option.value]"
              :key="tpl.id"
              :label="tpl.name"
              :value="tpl.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="默认打印机">
          <el-select
            v-model="configs[option.value].printerName"
            filterable
            clearable
            allow-create
            placeholder="选择或输入打印机名"
          >
            <el-option v-for="p in printers" :key="p.name" :label="p.name" :value="p.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="份数">
          <el-input-number v-model="configs[option.value].copies" :min="1" :max="99" />
        </el-form-item>
        <el-form-item label="驱动纸型覆盖">
          <el-input v-model="configs[option.value].paperName" placeholder="可选；纸张默认由模板决定" />
        </el-form-item>
        <el-form-item label="彩色打印">
          <el-switch v-model="configs[option.value].color" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSaveType(option.value)">保存</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { PrinterInfo } from '@worm-print-platform/core/client'
import { pageTemplate } from '@/api/modules/print'
import type { PrintTemplate } from '@/types/print'
import { TEMPLATE_TYPE_OPTIONS } from '@/print/registry'
import {
  DEFAULT_CLIENT_CONFIG,
  DEFAULT_TYPE_CONFIG,
  listPrinters,
  loadClientConfig,
  loadTypeConfig,
  saveClientConfig,
  saveTypeConfig,
  type ClientConfig,
  type TypePrintConfig,
} from '@/views/print/health-report/silent-print'

const typeOptions = TEMPLATE_TYPE_OPTIONS
const templates = reactive<Record<string, PrintTemplate[]>>(
  Object.fromEntries(typeOptions.map(option => [option.value, []])),
)
const configs = reactive<Record<string, TypePrintConfig>>(
  Object.fromEntries(typeOptions.map(option => [option.value, { ...DEFAULT_TYPE_CONFIG }])),
)
const savedTypes = reactive<Set<string>>(new Set())
const client = reactive<ClientConfig>(loadClientConfig() ?? DEFAULT_CLIENT_CONFIG)
const printers = ref<PrinterInfo[]>([])
const refreshing = ref(false)

onMounted(async () => {
  await Promise.all(typeOptions.map(async option => {
    const saved = loadTypeConfig(option.value)
    Object.assign(configs[option.value], saved ?? DEFAULT_TYPE_CONFIG)
    if (saved) savedTypes.add(option.value)
    const res = await pageTemplate({ businessType: option.value, size: 100 })
    if (res.ret) templates[option.value] = res.data.records
  }))
})

async function handleRefreshPrinters() {
  refreshing.value = true
  try {
    printers.value = await listPrinters(client)
    ElMessage.success(`已发现 ${printers.value.length} 台打印机`)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : String(error))
  } finally {
    refreshing.value = false
  }
}

function handleSaveClient() {
  saveClientConfig({ ...client })
  ElMessage.success('连接参数已保存')
}

function handleSaveType(businessType: string) {
  const config = configs[businessType]
  if (!config.templateId) {
    ElMessage.warning('请先选择默认模板')
    return
  }
  saveTypeConfig(businessType, { ...config })
  savedTypes.add(businessType)
  ElMessage.success('配置已保存')
}
</script>

<style scoped lang="scss">
.page-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.config-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 16px;

  h1 {
    margin: 0;
    font-size: 18px;
  }

  &__hint {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }
}

.client-card,
.type-card {
  margin-bottom: 16px;
}

.client-card__status {
  margin-left: 12px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.type-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="isEdit ? '编辑模板' : '新建模板'"
    width="640px"
    destroy-on-close
    @update:model-value="handleVisibleChange"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" scroll-to-error>
      <el-form-item label="模板名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入模板名称" />
      </el-form-item>
      <el-form-item label="模板类型" prop="businessType">
        <el-select
          v-model="form.businessType"
          placeholder="请选择模板类型"
          :disabled="isEdit"
          @change="handleTypeChange"
        >
          <el-option
            v-for="option in typeOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注" />
      </el-form-item>
      <el-form-item label="关联字段">
        <div class="field-preview">
          <el-tag v-for="item in fields" :key="item.fieldKey ?? item.id" size="small">
            {{ item.fieldLabel }}（{{ item.fieldType }}）
          </el-tag>
          <span v-if="!fields.length" class="field-preview__empty">选择类型后展示字段树</span>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import type { PrintBusinessField } from '@worm-print-platform/canvas/vue3'
import { listFields, saveTemplate, updateTemplate } from '@/api/modules/print'
import { TEMPLATE_TYPE_PROFILES } from '@/print/registry'
import type { PrintTemplate, PrintTemplateTypeOption } from '@/types/print'

const props = defineProps<{
  template?: PrintTemplate | null
  typeOptions: PrintTemplateTypeOption[]
}>()

const emit = defineEmits<{ (e: 'success'): void }>()
const modelValue = defineModel<boolean>({ default: false })

const formRef = ref<FormInstance>()
const submitting = ref(false)
const fields = ref<PrintBusinessField[]>([])

interface FormState {
  id: string
  name: string
  businessType: string
  remark: string
  elements: string
}

const emptyForm = (): FormState => ({
  id: '',
  name: '',
  businessType: '',
  remark: '',
  elements: '',
})

const form = ref<FormState>(emptyForm())

const rules: FormRules = {
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  businessType: [{ required: true, message: '请选择模板类型', trigger: 'change' }],
}

const isEdit = computed(() => form.value.id !== '')

function resetForm() {
  form.value = emptyForm()
  fields.value = []
  formRef.value?.clearValidate()
}

function handleVisibleChange(value: boolean) {
  modelValue.value = value
}

function handleClose() {
  modelValue.value = false
}

async function handleTypeChange(value: string) {
  const res = await listFields(value)
  if (res.ret) {
    fields.value = res.data
  } else {
    ElMessage.error(res.msg || '字段加载失败')
  }
}

watch(() => props.template, template => {
  if (template) {
    form.value = {
      id: template.id,
      name: template.name,
      businessType: template.businessType,
      remark: template.remark,
      elements: template.elements,
    }
    void handleTypeChange(template.businessType)
  } else {
    resetForm()
  }
}, { immediate: true })

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const payload = {
      ...(isEdit.value ? { id: form.value.id } : {}),
      name: form.value.name,
      businessType: form.value.businessType,
      remark: form.value.remark,
      elements: isEdit.value
        ? form.value.elements
        : JSON.stringify(TEMPLATE_TYPE_PROFILES[form.value.businessType].createTemplate()),
    }
    const res = isEdit.value ? await updateTemplate(payload) : await saveTemplate(payload)
    if (res.ret) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
      modelValue.value = false
      emit('success')
    } else {
      ElMessage.error(res.msg || '保存失败')
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
.field-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;

  &__empty {
    color: var(--el-text-color-placeholder);
    font-size: 12px;
  }
}
</style>

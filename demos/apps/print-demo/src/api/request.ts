import axios, { type AxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import type { ApiResult } from './types'

const service = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json;charset=UTF-8' },
})

/** 与宿主 request 封装同形：HTTP 层原样返回，业务 ret=false 由调用点提示 */
export async function post<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<ApiResult<T>> {
  const response = await service.post<ApiResult<T>>(url, data, config)
  const result = response.data
  if (!result.ret) {
    ElMessage.error(result.msg || '请求失败')
    throw new Error(result.msg || '请求失败')
  }
  return result
}

import axios, { type AxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import type { ApiResult } from './types'

const service = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json;charset=UTF-8' },
})

/** 与宿主 request 封装同形：业务 ret=false 与非 2xx/网络错误都提示后抛出，由调用点 catch */
export async function post<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<ApiResult<T>> {
  try {
    const response = await service.post<ApiResult<T>>(url, data, config)
    const result = response.data
    if (!result.ret) {
      ElMessage.error(result.msg || '请求失败')
      throw new Error(result.msg || '请求失败')
    }
    return result
  } catch (error) {
    // 非 2xx 时 axios 在读取 response.data 前就 reject，原先走不到上面的 ret 判断，
    // 导致接口失败后页面静默变空且无任何提示；这里补齐统一提示（业务错误已提示过，不重复）
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      ElMessage.error(status ? `请求失败（${status}）` : '网络异常，请检查连接')
    }
    throw error
  }
}

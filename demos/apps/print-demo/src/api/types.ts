/** 统一响应包裹，与宿主后端 ApiResult 契约一致 */
export interface ApiResult<T = unknown> {
  ret: boolean
  msg: string
  data: T
}

/** 分页请求参数 */
export interface PageParam {
  current?: number
  size?: number
}

/** 分页结果，与 MyBatis-Flex Page 序列化形态一致 */
export interface PageResult<T> {
  records: T[]
  totalRow: number
  size: number
  current: number
  pages: number
}

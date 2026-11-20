import {
  DEFAULT_PORT,
  PrintClient,
  WormPrintError,
  type PrinterInfo,
} from '@worm-print-platform/core/client'

/** 按模板类型维护的静默打印配置 */
export interface TypePrintConfig {
  templateId: string
  printerName: string
  copies: number
  paperName: string
  color: boolean
}

/** 客户端连接参数（环境级，与模板类型无关） */
export interface ClientConfig {
  port: number
  token: string
}

const TYPE_CONFIG_PREFIX = 'print:cfg:'
const CLIENT_CONFIG_KEY = 'print:client'

export const DEFAULT_TYPE_CONFIG: TypePrintConfig = {
  templateId: '',
  printerName: '',
  copies: 1,
  paperName: '',
  color: false,
}

export const DEFAULT_CLIENT_CONFIG: ClientConfig = {
  port: DEFAULT_PORT,
  token: '',
}

export function loadTypeConfig(businessType: string): TypePrintConfig | null {
  try {
    const raw = localStorage.getItem(TYPE_CONFIG_PREFIX + businessType)
    if (raw) return { ...DEFAULT_TYPE_CONFIG, ...JSON.parse(raw) }
  } catch {
    // 配置损坏视为未配置
  }
  return null
}

export function saveTypeConfig(businessType: string, config: TypePrintConfig): void {
  localStorage.setItem(TYPE_CONFIG_PREFIX + businessType, JSON.stringify(config))
}

export function loadClientConfig(): ClientConfig {
  try {
    const raw = localStorage.getItem(CLIENT_CONFIG_KEY)
    if (raw) return { ...DEFAULT_CLIENT_CONFIG, ...JSON.parse(raw) }
  } catch {
    // 配置损坏时回落默认值
  }
  return { ...DEFAULT_CLIENT_CONFIG }
}

export function saveClientConfig(config: ClientConfig): void {
  localStorage.setItem(CLIENT_CONFIG_KEY, JSON.stringify(config))
}

function createClient(client: ClientConfig): PrintClient {
  return new PrintClient({
    token: client.token || undefined,
    ...(client.port !== DEFAULT_PORT ? { ports: [client.port] } : {}),
  })
}

function describeError(error: unknown): string {
  if (error instanceof WormPrintError) {
    if (error.code === 'CLIENT_NOT_RUNNING') {
      return '未检测到桌面客户端，请先启动客户端后重试'
    }
    if (error.code === 'BUSY') {
      return '客户端正忙，请稍后重试'
    }
    return `静默打印失败：${error.code} ${error.message}`
  }
  return `静默打印失败：${error instanceof Error ? error.message : String(error)}`
}

export async function listPrinters(client: ClientConfig): Promise<PrinterInfo[]> {
  const instance = createClient(client)
  try {
    await instance.connect()
    return await instance.listPrinters()
  } finally {
    instance.close()
  }
}

export async function submitSilentPrint(
  templateJson: Record<string, unknown>,
  printData: Record<string, unknown>[],
  templateName: string,
  config: TypePrintConfig,
  client: ClientConfig,
): Promise<string> {
  const instance = createClient(client)
  try {
    await instance.connect()
    const result = await instance.print(
      templateJson,
      printData,
      {
        ...(config.printerName ? { printerName: config.printerName } : {}),
        copies: config.copies,
        ...(config.paperName ? { paperName: config.paperName } : {}),
        color: config.color,
        baseUrl: '/files',
      },
      templateName,
    )
    return result.jobId
  } catch (error) {
    throw new Error(describeError(error))
  } finally {
    instance.close()
  }
}

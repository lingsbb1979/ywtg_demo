/**
 * logService.ts — 事件日志写入（T15.22）
 *
 * system_log 字段：
 *   log_id, user_id, operation_type, operation_content,
 *   ip_address, user_agent, status, create_time
 *
 * 注意：system_log 主键为 log_id（非 id），不能复用 insert() 的自增。
 */
import { getTable, setTable } from "./sqliteMirrorRepository"

export interface SystemLogEntry {
  user_id?:            number | null
  operation_type:      string
  operation_content?:  string | null
  ip_address?:         string | null
  user_agent?:         string | null
  status?:             number
  create_time?:        string
}

export interface SystemLogRow extends SystemLogEntry {
  log_id:      number
  status:      number
  create_time: string
}

/**
 * 向 system_log 表追加一条操作日志。
 *
 * - log_id 自动递增（现有最大 log_id + 1，表为空时从 1）
 * - create_time 未提供时自动补充当前 ISO 时间
 * - status 未提供时默认为 1（成功）
 * - 返回最终写入的完整行
 */
export function appendLog(entry: SystemLogEntry): SystemLogRow {
  const rows = getTable<SystemLogRow>("system_log")

  // 自动生成 log_id
  const maxId = rows.reduce((m, r) => Math.max(m, r.log_id ?? 0), 0)
  const log_id = maxId + 1

  const now = new Date().toISOString()

  const newRow: SystemLogRow = {
    log_id,
    user_id:           entry.user_id ?? null,
    operation_type:    entry.operation_type,
    operation_content: entry.operation_content ?? null,
    ip_address:        entry.ip_address ?? null,
    user_agent:        entry.user_agent ?? null,
    status:            entry.status !== undefined ? entry.status : 1,
    create_time:       entry.create_time ?? now,
  }

  rows.push(newRow)
  setTable("system_log", rows)
  return newRow
}

export default { appendLog }

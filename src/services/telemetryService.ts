/**
 * telemetryService — 采集值查询服务
 *
 * 依赖表：
 *   - iot_telemetry  (ts, point_id, value_num, value_str)
 *   - iot_data_point (id, space_id, ...)
 */

import { getTable } from "./sqliteMirrorRepository"

// ── 类型 ──────────────────────────────────────────────────────────────────────

export interface TelemetryListQuery {
  /** 数据点 ID（必填） */
  pointId: number
  /** 可选：建筑 space_id，若传入则校验该数据点是否属于该建筑 */
  buildingId?: number
  /** 可选：起始时间（含），格式 "YYYY-MM-DD HH:mm:ss" */
  startTime?: string
  /** 可选：结束时间（含），格式 "YYYY-MM-DD HH:mm:ss" */
  endTime?: string
  /** 可选：最多返回最新 N 条 */
  limit?: number
}

export interface TelemetryRow {
  ts: string
  pointId: number
  valueNum: number | null
  valueStr: string | null
}

// ── 实现 ──────────────────────────────────────────────────────────────────────

/**
 * 查询某数据点的历史采集值。
 *
 * 流程：
 *   1. 若传入 buildingId，校验 iot_data_point.space_id 是否匹配；不匹配返回 []
 *   2. 从 iot_telemetry 按 point_id 筛选
 *   3. 按 startTime / endTime 范围过滤
 *   4. 按 ts 升序排列
 *   5. 若有 limit，取最新 N 条（末尾 N 条），返回仍为升序
 */
export function listTelemetry(query: TelemetryListQuery): TelemetryRow[] {
  const { pointId, buildingId, startTime, endTime, limit } = query

  // ── 1. buildingId 校验 ────────────────────────────────────────────────────
  if (buildingId !== undefined) {
    const points = getTable<{ id: number; space_id: number }>("iot_data_point")
    const point = points.find((p) => p.id === pointId)
    if (!point || point.space_id !== buildingId) {
      return []
    }
  }

  // ── 2. 从 iot_telemetry 按 point_id 筛选 ─────────────────────────────────
  const all = getTable<{ ts: string; point_id: number; value_num: number | null; value_str: string | null }>(
    "iot_telemetry"
  )
  let rows = all.filter((r) => r.point_id === pointId)

  if (rows.length === 0) return []

  // ── 3. 时间范围筛选 ───────────────────────────────────────────────────────
  if (startTime !== undefined) {
    rows = rows.filter((r) => r.ts >= startTime)
  }
  if (endTime !== undefined) {
    rows = rows.filter((r) => r.ts <= endTime)
  }

  // ── 4. 按 ts 升序排列 ────────────────────────────────────────────────────
  rows.sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0))

  // ── 5. limit：取最新 N 条（升序末尾 N 条）────────────────────────────────
  if (limit !== undefined && limit > 0 && rows.length > limit) {
    rows = rows.slice(rows.length - limit)
  }

  // ── 6. 映射为对外类型 ─────────────────────────────────────────────────────
  return rows.map((r) => ({
    ts:       r.ts,
    pointId:  r.point_id,
    valueNum: r.value_num,
    valueStr: r.value_str,
  }))
}

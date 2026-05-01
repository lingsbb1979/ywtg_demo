/**
 * hazardService — 隐患运行时视图生成
 *
 * 从 space_analysis_archive、alarm_record、work_order 计算隐患清单。
 * 纯读取，不写入 localStorage。
 *
 * 隐患定义：
 *   - 当前风险等级不为 GREEN 的建筑（来自各 metric 最新 archive 中最高等级）
 */

import { getTable } from "./sqliteMirrorRepository"

// ── 常量 ──────────────────────────────────────────────────────────────────────

const RISK_ORDER: Readonly<Record<string, number>> = {
  GREEN: 0, YELLOW: 1, ORANGE: 2, RED: 3,
}

// ── 类型 ──────────────────────────────────────────────────────────────────────

export interface HazardMetric {
  metricId:  number
  riskLevel: string
  valueNum:  number
  calcTime:  string
}

export interface HazardItem {
  buildingId:   number
  buildingCode: string
  buildingName: string
  /** 该建筑各 metric 中最高风险等级 */
  riskLevel:    string
  metrics:      HazardMetric[]
  /** 活跃告警数（alarm_record status = ACTIVE | PENDING） */
  alarmCount:   number
  /** 未完结工单数（work_order status ≠ FINISHED | CLOSED） */
  orderCount:   number
}

export interface HazardListQuery {
  buildingId?: number
  riskLevel?:  string
}

// ── 内部辅助 ──────────────────────────────────────────────────────────────────

/** 告警活跃状态白名单 */
const ACTIVE_ALARM_STATUSES = new Set(["ACTIVE", "PENDING"])

/** 工单已完结状态黑名单 */
const DONE_ORDER_STATUSES = new Set(["FINISHED", "CLOSED"])

/** 比较两个风险等级，返回较高的那个 */
function maxRisk(a: string, b: string): string {
  return (RISK_ORDER[a] ?? 0) >= (RISK_ORDER[b] ?? 0) ? a : b
}

// ── 主函数 ────────────────────────────────────────────────────────────────────

/**
 * 生成隐患运行时视图（只读，不写库）。
 */
export function listHazards(query?: HazardListQuery): HazardItem[] {
  const { buildingId: filterBuildingId, riskLevel: filterRiskLevel } = query ?? {}

  // ── 1. 读取 space_analysis_archive，按 space_id + metric_id 取最新一条 ────
  const archives = getTable<{
    space_id:   number
    metric_id:  number
    calc_time:  string
    value_num:  number
    risk_level: string
  }>("space_analysis_archive")

  // Map<spaceId, Map<metricId, latestArchive>>
  const latestByBuilding = new Map<number, Map<number, { riskLevel: string; valueNum: number; calcTime: string }>>()
  for (const rec of archives) {
    let metricMap = latestByBuilding.get(rec.space_id)
    if (!metricMap) {
      metricMap = new Map()
      latestByBuilding.set(rec.space_id, metricMap)
    }
    const existing = metricMap.get(rec.metric_id)
    if (!existing || rec.calc_time > existing.calcTime) {
      metricMap.set(rec.metric_id, {
        riskLevel: rec.risk_level,
        valueNum:  rec.value_num,
        calcTime:  rec.calc_time,
      })
    }
  }

  // ── 2. 筛选：剔除全绿建筑 ─────────────────────────────────────────────────
  const hazardBuildings: Array<{ spaceId: number; topRisk: string; metrics: HazardMetric[] }> = []

  for (const [spaceId, metricMap] of latestByBuilding) {
    if (filterBuildingId !== undefined && spaceId !== filterBuildingId) continue

    const metrics: HazardMetric[] = []
    let topRisk = "GREEN"

    for (const [metricId, data] of metricMap) {
      metrics.push({ metricId, riskLevel: data.riskLevel, valueNum: data.valueNum, calcTime: data.calcTime })
      topRisk = maxRisk(topRisk, data.riskLevel)
    }

    if (topRisk === "GREEN") continue
    if (filterRiskLevel && topRisk !== filterRiskLevel) continue

    hazardBuildings.push({ spaceId, topRisk, metrics })
  }

  if (hazardBuildings.length === 0) return []

  // ── 3. 读取 iot_space 获取建筑信息 ───────────────────────────────────────
  const spaces = getTable<{ id: number; type: string; space_code: string; name: string }>("iot_space")
  const spaceMap = new Map(spaces.filter(s => s.type === "2").map(s => [s.id, s]))

  // ── 4. 读取 alarm_record 计数 ─────────────────────────────────────────────
  const alarmRecords = getTable<{ building_id: number; status: string }>("alarm_record")
  const alarmCountMap = new Map<number, number>()
  for (const rec of alarmRecords) {
    if (ACTIVE_ALARM_STATUSES.has(rec.status)) {
      alarmCountMap.set(rec.building_id, (alarmCountMap.get(rec.building_id) ?? 0) + 1)
    }
  }

  // ── 5. 读取 work_order 计数 ───────────────────────────────────────────────
  const workOrders = getTable<{ building_id: number; status: string }>("work_order")
  const orderCountMap = new Map<number, number>()
  for (const rec of workOrders) {
    if (!DONE_ORDER_STATUSES.has(rec.status)) {
      orderCountMap.set(rec.building_id, (orderCountMap.get(rec.building_id) ?? 0) + 1)
    }
  }

  // ── 6. 组装结果 ───────────────────────────────────────────────────────────
  const result: HazardItem[] = []
  for (const { spaceId, topRisk, metrics } of hazardBuildings) {
    const space = spaceMap.get(spaceId)
    result.push({
      buildingId:   spaceId,
      buildingCode: space?.space_code ?? "",
      buildingName: space?.name ?? "",
      riskLevel:    topRisk,
      metrics,
      alarmCount:   alarmCountMap.get(spaceId) ?? 0,
      orderCount:   orderCountMap.get(spaceId) ?? 0,
    })
  }

  return result
}

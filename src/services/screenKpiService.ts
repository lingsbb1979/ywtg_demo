import { getTable } from "./sqliteMirrorRepository"

// ── T15.59 selectScreenKpi ────────────────────────────────────────────────────

export interface ScreenKpi {
  totalBuildings: number  // iot_space type="2" 建筑总数
  openHazards:    number  // alarm_record status ≠ CLOSED/CANCELLED
  activeAlarms:   number  // alarm_record status = ACTIVE/PENDING
  closeRate:      number  // FINISHED 工单 / 总工单 × 100，保留 1 位小数
}

/**
 * 大屏首页 KPI 聚合计算。
 * 数据来源：iot_space, alarm_record, work_order。
 */
export function selectScreenKpi(): ScreenKpi {
  // ── 总建筑数 ──────────────────────────────────────────────────────────────
  const spaces         = getTable<{ type: string }>("iot_space")
  const totalBuildings = spaces.filter((s) => s.type === "2").length

  // ── 隐患 / 告警 ───────────────────────────────────────────────────────────
  const alarms      = getTable<{ status: string }>("alarm_record")
  const CLOSED_SET  = new Set(["CLOSED", "CANCELLED"])
  const ACTIVE_SET  = new Set(["ACTIVE", "PENDING"])
  const openHazards = alarms.filter((a) => !CLOSED_SET.has(a.status)).length
  const activeAlarms = alarms.filter((a) => ACTIVE_SET.has(a.status)).length

  // ── 工单闭环率 ─────────────────────────────────────────────────────────────
  const orders    = getTable<{ status: string }>("work_order")
  const total     = orders.length
  const finished  = orders.filter((o) => o.status === "FINISHED").length
  const closeRate = total === 0
    ? 0
    : Math.round((finished / total) * 1000) / 10  // 保留 1 位小数

  return { totalBuildings, openHazards, activeAlarms, closeRate }
}

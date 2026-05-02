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

// ── T15.60 selectMapPoints ────────────────────────────────────────────────────

export type RiskLevel = "RED" | "ORANGE" | "YELLOW" | "GREEN"
export type RiskColor = "red" | "orange" | "yellow" | "green"

export interface MapPoint {
  id:         number
  spaceCode:  string
  name:       string
  latitude:   number | null
  longitude:  number | null
  riskLevel:  RiskLevel
  color:      RiskColor
  openCount:  number
  summary:    string
}

const LEVEL_ORDER: Record<string, number> = { RED: 4, ORANGE: 3, YELLOW: 2, GREEN: 1 }
const COLOR_MAP:   Record<RiskLevel, RiskColor> = {
  RED: "red", ORANGE: "orange", YELLOW: "yellow", GREEN: "green",
}

/**
 * 大屏中央地图建筑点位选择器：
 * 返回每栋建筑的坐标、最高风险等级和弹窗摘要。
 */
export function selectMapPoints(): MapPoint[] {
  const spaces = getTable<{
    id: number; space_code: string; name: string; type: string
    latitude: number | null; longitude: number | null
  }>("iot_space")

  const buildings = spaces.filter((s) => s.type === "2")
  if (buildings.length === 0) return []

  const CLOSED_SET = new Set(["CLOSED", "CANCELLED"])
  const alarms     = getTable<{
    building_id: number; alarm_level: string; status: string
  }>("alarm_record")

  return buildings.map((b) => {
    const open = alarms.filter(
      (a) => a.building_id === b.id && !CLOSED_SET.has(a.status)
    )

    let riskLevel: RiskLevel = "GREEN"
    for (const a of open) {
      if ((LEVEL_ORDER[a.alarm_level] ?? 0) > (LEVEL_ORDER[riskLevel] ?? 0)) {
        riskLevel = a.alarm_level as RiskLevel
      }
    }

    const openCount = open.length
    const summary   = openCount > 0 ? `${openCount} 条未销号告警` : "安全"

    return {
      id:        b.id,
      spaceCode: b.space_code,
      name:      b.name,
      latitude:  b.latitude  ?? null,
      longitude: b.longitude ?? null,
      riskLevel,
      color:     COLOR_MAP[riskLevel],
      openCount,
      summary,
    }
  })
}

// ── T15.61 selectHazardList ───────────────────────────────────────────────────

export interface HazardListQuery {
  alarmLevel?: string
  buildingId?: number
  keyword?:    string
  limit?:      number
}

export interface HazardListItem {
  id:           number
  alarmId:      string
  alarmTitle:   string | null
  alarmLevel:   string
  alarmType:    string | null
  buildingId:   number | null
  buildingName: string | null
  status:       string
  triggerTime:  string | null
}

const LEVEL_SORT: Record<string, number> = { RED: 3, ORANGE: 2, YELLOW: 1 }

/**
 * 大屏左侧隐患清单，按风险等级降序 + 同级 triggerTime 倒序。
 */
export function selectHazardList(query: HazardListQuery = {}): HazardListItem[] {
  const { alarmLevel, buildingId, keyword, limit = 20 } = query

  const CLOSED_SET = new Set(["CLOSED", "CANCELLED"])
  const alarms     = getTable<{
    id: number; alarm_id: string; alarm_title: string | null
    alarm_type: string | null; alarm_level: string; building_id: number | null
    status: string; trigger_time: string | null
  }>("alarm_record")

  const spaces = getTable<{ id: number; name: string }>("iot_space")
  const spaceMap = new Map(spaces.map((s) => [s.id, s.name]))

  let rows = alarms.filter((a) => !CLOSED_SET.has(a.status))

  if (alarmLevel) rows = rows.filter((a) => a.alarm_level === alarmLevel)
  if (buildingId) rows = rows.filter((a) => a.building_id === buildingId)
  if (keyword)    rows = rows.filter((a) => (a.alarm_title ?? "").includes(keyword))

  rows.sort((a, b) => {
    const la = LEVEL_SORT[a.alarm_level] ?? 0
    const lb = LEVEL_SORT[b.alarm_level] ?? 0
    if (lb !== la) return lb - la
    return (b.trigger_time ?? "") > (a.trigger_time ?? "") ? 1 : -1
  })

  return rows.slice(0, limit).map((a) => ({
    id:           a.id,
    alarmId:      a.alarm_id,
    alarmTitle:   a.alarm_title   ?? null,
    alarmLevel:   a.alarm_level,
    alarmType:    a.alarm_type    ?? null,
    buildingId:   a.building_id   ?? null,
    buildingName: a.building_id != null ? (spaceMap.get(a.building_id) ?? null) : null,
    status:       a.status,
    triggerTime:  a.trigger_time  ?? null,
  }))
}

// ── T15.62 selectWorkOrderBoard ───────────────────────────────────────────────

export interface WorkOrderBoard {
  pending:      number
  processing:   number
  checking:     number
  finished:     number
  total:        number
  overdueCount: number
}

export interface WorkOrderBoardOptions {
  nowStr?:        string
  defaultSlaMins?: number
}

/** "YYYY-MM-DD HH:mm:ss" → ms */
function parseTs(s: string): number {
  return Date.parse(s.replace(" ", "T"))
}

/**
 * 工单看板聚合：各状态数量 + 超时工单数。
 */
export function selectWorkOrderBoard(options: WorkOrderBoardOptions = {}): WorkOrderBoard {
  const { nowStr, defaultSlaMins = 120 } = options
  const nowMs   = nowStr ? parseTs(nowStr) : Date.now()
  const slaMsec = defaultSlaMins * 60 * 1000

  const orders  = getTable<{ status: string; dispatch_time: string | null }>("work_order")

  let pending = 0, processing = 0, checking = 0, finished = 0, overdueCount = 0
  const ACTIVE_SET = new Set(["PENDING", "PROCESSING", "CHECKING"])

  for (const o of orders) {
    switch (o.status) {
      case "PENDING":    pending++;    break
      case "PROCESSING": processing++; break
      case "CHECKING":   checking++;   break
      case "FINISHED":   finished++;   break
    }
    if (ACTIVE_SET.has(o.status) && o.dispatch_time) {
      if (nowMs - parseTs(o.dispatch_time) > slaMsec) overdueCount++
    }
  }

  return { pending, processing, checking, finished, total: orders.length, overdueCount }
}

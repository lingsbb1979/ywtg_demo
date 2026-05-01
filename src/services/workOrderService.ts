/**
 * T15.47 — 工单列表查询 workOrderService
 *
 * 从 localStorage（SQLiteMirror）的 work_order 表中查询工单，
 * 支持按状态、等级、责任单位、建筑、关键字筛选，
 * 关联 iot_space 带出建筑信息，关联 alarm_record 带出告警标题。
 * 结果按 create_time 倒序（最新在前）。
 *
 * 导出：
 *   listWorkOrders(query?)  — 工单列表查询（T15.47）
 */

import { getTable } from "./sqliteMirrorRepository"

// ── 类型定义 ──────────────────────────────────────────────────────────────────

export interface WorkOrderListQuery {
  /** 按工单状态筛选（PENDING / PROCESSING / CHECKING / FINISHED / CLOSED 等） */
  status?:        string
  /** 按工单等级筛选 */
  orderLevel?:    string
  /** 按告警等级筛选 */
  alarmLevel?:    string
  /** 按接单机构 id 筛选 */
  receiveOrgId?:  number
  /** 按派单机构 id 筛选 */
  dispatchOrgId?: number
  /** 按建筑 id 筛选 */
  buildingId?:    number
  /** 关键字：模糊匹配 order_no / order_code（不区分大小写） */
  keyword?:       string
}

export interface WorkOrderListItem {
  id:            number
  orderNo:       string | null
  orderCode:     string | null
  alarmId:       string | null
  alarmTitle:    string | null
  buildingId:    number | null
  buildingCode:  string | null
  buildingName:  string | null
  orderType:     string | null
  orderLevel:    string | null
  alarmLevel:    string | null
  dispatchOrgId: number | null
  receiveOrgId:  number | null
  assigneeId:    number | null
  status:        string | null
  currentNode:   string | null
  dispatchTime:  string | null
  acceptTime:    string | null
  finishTime:    string | null
  checkTime:     string | null
  createTime:    string | null
  updateTime:    string | null
}

// ── 内部辅助 ──────────────────────────────────────────────────────────────────

function buildSpaceMap(): Map<number, { spaceCode: string; name: string }> {
  const spaces = getTable<{ id: number; space_code: string; name: string }>("iot_space")
  const map = new Map<number, { spaceCode: string; name: string }>()
  for (const s of spaces) map.set(s.id, { spaceCode: s.space_code, name: s.name })
  return map
}

function buildAlarmTitleMap(): Map<string, string> {
  const alarms = getTable<{ alarm_id: string | null; alarm_title: string | null }>("alarm_record")
  const map = new Map<string, string>()
  for (const a of alarms) {
    if (a.alarm_id) map.set(a.alarm_id, a.alarm_title ?? "")
  }
  return map
}

// ── 主函数 ────────────────────────────────────────────────────────────────────

/**
 * 查询工单列表，支持多条件筛选。
 * 结果按 create_time 倒序（最新在前）。
 */
export function listWorkOrders(query: WorkOrderListQuery = {}): WorkOrderListItem[] {
  const { status, orderLevel, alarmLevel, receiveOrgId, dispatchOrgId, buildingId, keyword } = query

  const rows = getTable<{
    id:              number
    order_no:        string | null
    order_code:      string | null
    alarm_id:        string | null
    building_id:     number | null
    order_type:      string | null
    order_level:     string | null
    alarm_level:     string | null
    dispatch_org_id: number | null
    receive_org_id:  number | null
    assignee_id:     number | null
    status:          string | null
    current_node:    string | null
    dispatch_time:   string | null
    accept_time:     string | null
    finish_time:     string | null
    check_time:      string | null
    create_time:     string | null
    update_time:     string | null
  }>("work_order")

  const spaceMap      = buildSpaceMap()
  const alarmTitleMap = buildAlarmTitleMap()
  const kw = keyword ? keyword.toLowerCase() : null

  let filtered = rows.filter((r) => {
    if (status        !== undefined && r.status          !== status)        return false
    if (orderLevel    !== undefined && r.order_level      !== orderLevel)    return false
    if (alarmLevel    !== undefined && r.alarm_level      !== alarmLevel)    return false
    if (receiveOrgId  !== undefined && r.receive_org_id   !== receiveOrgId)  return false
    if (dispatchOrgId !== undefined && r.dispatch_org_id  !== dispatchOrgId) return false
    if (buildingId    !== undefined && r.building_id      !== buildingId)    return false
    if (kw !== null) {
      const no   = (r.order_no   ?? "").toLowerCase()
      const code = (r.order_code ?? "").toLowerCase()
      if (!no.includes(kw) && !code.includes(kw)) return false
    }
    return true
  })

  filtered = filtered.sort((a, b) => {
    const ta = a.create_time ?? ""
    const tb = b.create_time ?? ""
    return tb > ta ? 1 : tb < ta ? -1 : 0
  })

  return filtered.map((r) => {
    const space      = r.building_id != null ? (spaceMap.get(r.building_id) ?? null) : null
    const alarmTitle = r.alarm_id ? (alarmTitleMap.get(r.alarm_id) ?? null) : null
    return {
      id:            r.id,
      orderNo:       r.order_no      ?? null,
      orderCode:     r.order_code    ?? null,
      alarmId:       r.alarm_id      ?? null,
      alarmTitle,
      buildingId:    r.building_id,
      buildingCode:  space ? space.spaceCode : null,
      buildingName:  space ? space.name      : null,
      orderType:     r.order_type    ?? null,
      orderLevel:    r.order_level   ?? null,
      alarmLevel:    r.alarm_level   ?? null,
      dispatchOrgId: r.dispatch_org_id ?? null,
      receiveOrgId:  r.receive_org_id  ?? null,
      assigneeId:    r.assignee_id     ?? null,
      status:        r.status          ?? null,
      currentNode:   r.current_node    ?? null,
      dispatchTime:  r.dispatch_time   ?? null,
      acceptTime:    r.accept_time     ?? null,
      finishTime:    r.finish_time     ?? null,
      checkTime:     r.check_time      ?? null,
      createTime:    r.create_time     ?? null,
      updateTime:    r.update_time     ?? null,
    }
  })
}

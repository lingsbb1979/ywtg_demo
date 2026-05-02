/**
 * T15.47 / T15.48 — 工单服务 workOrderService
 *
 * 从 localStorage（SQLiteMirror）的 work_order 表中查询工单，
 * 支持按状态、等级、责任单位、建筑、关键字筛选，
 * 关联 iot_space 带出建筑信息，关联 alarm_record 带出告警标题。
 *
 * 导出：
 *   listWorkOrders(query?)  — 工单列表查询（T15.47）
 *   getWorkOrder(id)        — 工单详情查询（T15.48）
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

// ── T15.48 getWorkOrder ───────────────────────────────────────────────────────

export interface WorkOrderLog {
  id:           number
  orderId:      number
  nodeType:     string | null
  nodeName:     string | null
  operatorId:   number | null
  operatorName: string | null
  operator:     string | null
  actionDesc:   string | null
  actionTime:   string | null
  detailJson:   string | null
  remark:       string | null
  createTime:   string | null
}

export interface WorkOrderDisposal {
  id:           number
  orderId:      number
  userId:       number | null
  gpsLocation:  string | null
  addressDesc:  string | null
  imageUrls:    string | null
  videoUrl:     string | null
  disposalDesc: string | null
  disposalTime: string | null
  createTime:   string | null
}

export interface WorkOrderDetail {
  id:              number
  orderNo:         string | null
  orderCode:       string | null
  alarmId:         string | null
  alarmTitle:      string | null
  buildingId:      number | null
  buildingCode:    string | null
  buildingName:    string | null
  orderType:       string | null
  orderLevel:      string | null
  alarmLevel:      string | null
  dispatchType:    string | null
  dispatchOrgId:   number | null
  dispatchUserId:  number | null
  dispatchOrg:     string | null
  receiveOrgId:    number | null
  receiveUserId:   number | null
  receiveOrg:      string | null
  receiveRoleKey:  string | null
  assigneeId:      number | null
  priority:        number | null
  status:          string | null
  currentNode:     string | null
  sourceId:        number | null
  sourceType:      string | null
  dispatchTime:    string | null
  acceptTime:      string | null
  finishTime:      string | null
  checkTime:       string | null
  createTime:      string | null
  updateTime:      string | null
  logs:            WorkOrderLog[]
  disposals:       WorkOrderDisposal[]
}

/**
 * 查询单个工单详情，关联建筑、告警标题、流程日志、处置记录。
 * id 不存在时返回 null。
 */
export function getWorkOrder(id: number): WorkOrderDetail | null {
  const rows = getTable<{
    id:              number
    order_no:        string | null
    order_code:      string | null
    alarm_id:        string | null
    building_id:     number | null
    order_type:      string | null
    order_level:     string | null
    alarm_level:     string | null
    dispatch_type:   string | null
    dispatch_org_id: number | null
    dispatch_user_id: number | null
    dispatch_org:    string | null
    receive_org_id:  number | null
    receive_user_id: number | null
    receive_org:     string | null
    receive_role_key: string | null
    assignee_id:     number | null
    priority:        number | null
    status:          string | null
    current_node:    string | null
    source_id:       number | null
    source_type:     string | null
    dispatch_time:   string | null
    accept_time:     string | null
    finish_time:     string | null
    check_time:      string | null
    create_time:     string | null
    update_time:     string | null
  }>("work_order")

  const row = rows.find((r) => r.id === id)
  if (!row) return null

  const spaceMap      = buildSpaceMap()
  const alarmTitleMap = buildAlarmTitleMap()

  const space      = row.building_id != null ? (spaceMap.get(row.building_id) ?? null) : null
  const alarmTitle = row.alarm_id ? (alarmTitleMap.get(row.alarm_id) ?? null) : null

  // 流程日志
  const logRows = getTable<{
    id: number; order_id: number; node_type: string | null; node_name: string | null
    operator_id: number | null; operator_name: string | null; operator: string | null
    action_desc: string | null; action_time: string | null
    detail_json: string | null; remark: string | null; create_time: string | null
  }>("work_order_log")

  const logs: WorkOrderLog[] = logRows
    .filter((l) => l.order_id === id)
    .sort((a, b) => {
      const ta = a.action_time ?? ""
      const tb = b.action_time ?? ""
      return ta > tb ? 1 : ta < tb ? -1 : 0
    })
    .map((l) => ({
      id:           l.id,
      orderId:      l.order_id,
      nodeType:     l.node_type     ?? null,
      nodeName:     l.node_name     ?? null,
      operatorId:   l.operator_id   ?? null,
      operatorName: l.operator_name ?? null,
      operator:     l.operator      ?? null,
      actionDesc:   l.action_desc   ?? null,
      actionTime:   l.action_time   ?? null,
      detailJson:   l.detail_json   ?? null,
      remark:       l.remark        ?? null,
      createTime:   l.create_time   ?? null,
    }))

  // 处置记录
  const disposalRows = getTable<{
    id: number; order_id: number; user_id: number | null
    gps_location: string | null; address_desc: string | null
    image_urls: string | null; video_url: string | null
    disposal_desc: string | null; disposal_time: string | null; create_time: string | null
  }>("work_order_disposal")

  const disposals: WorkOrderDisposal[] = disposalRows
    .filter((d) => d.order_id === id)
    .sort((a, b) => {
      const ta = a.disposal_time ?? ""
      const tb = b.disposal_time ?? ""
      return ta > tb ? 1 : ta < tb ? -1 : 0
    })
    .map((d) => ({
      id:           d.id,
      orderId:      d.order_id,
      userId:       d.user_id       ?? null,
      gpsLocation:  d.gps_location  ?? null,
      addressDesc:  d.address_desc  ?? null,
      imageUrls:    d.image_urls    ?? null,
      videoUrl:     d.video_url     ?? null,
      disposalDesc: d.disposal_desc ?? null,
      disposalTime: d.disposal_time ?? null,
      createTime:   d.create_time   ?? null,
    }))

  return {
    id:              row.id,
    orderNo:         row.order_no         ?? null,
    orderCode:       row.order_code       ?? null,
    alarmId:         row.alarm_id         ?? null,
    alarmTitle,
    buildingId:      row.building_id,
    buildingCode:    space ? space.spaceCode : null,
    buildingName:    space ? space.name      : null,
    orderType:       row.order_type       ?? null,
    orderLevel:      row.order_level      ?? null,
    alarmLevel:      row.alarm_level      ?? null,
    dispatchType:    row.dispatch_type    ?? null,
    dispatchOrgId:   row.dispatch_org_id  ?? null,
    dispatchUserId:  row.dispatch_user_id ?? null,
    dispatchOrg:     row.dispatch_org     ?? null,
    receiveOrgId:    row.receive_org_id   ?? null,
    receiveUserId:   row.receive_user_id  ?? null,
    receiveOrg:      row.receive_org      ?? null,
    receiveRoleKey:  row.receive_role_key ?? null,
    assigneeId:      row.assignee_id      ?? null,
    priority:        row.priority         ?? null,
    status:          row.status           ?? null,
    currentNode:     row.current_node     ?? null,
    sourceId:        row.source_id        ?? null,
    sourceType:      row.source_type      ?? null,
    dispatchTime:    row.dispatch_time    ?? null,
    acceptTime:      row.accept_time      ?? null,
    finishTime:      row.finish_time      ?? null,
    checkTime:       row.check_time       ?? null,
    createTime:      row.create_time      ?? null,
    updateTime:      row.update_time      ?? null,
    logs,
    disposals,
  }
}

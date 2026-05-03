/**
 * T15.43 — 告警列表查询 alarmService
 *
 * 从 localStorage（SQLiteMirror）的 alarm_record 表中查询告警，
 * 支持按等级（alarmLevel）、状态（status）、建筑（buildingId）、关键字筛选，
 * 并关联 iot_space 带出建筑编码与名称。
 * 结果按 trigger_time 倒序排列（最新在前）。
 *
 * 导出：
 *   listAlarms(query?)  — 告警列表查询（T15.43）
 */

import { getTable, setTable } from "./sqliteMirrorRepository"

// ── 类型定义 ──────────────────────────────────────────────────────────────────

export interface AlarmListQuery {
  /** 按告警等级筛选（RED / ORANGE / YELLOW / GREEN） */
  alarmLevel?:  string
  /** 按告警状态筛选（ACTIVE / PENDING / CLOSED 等） */
  status?:      string
  /** 按建筑 id 筛选 */
  buildingId?:  number
  /** 关键字：模糊匹配 alarm_title / alarm_code（不区分大小写） */
  keyword?:     string
}

export interface AlarmListItem {
  id:           number
  alarmId:      string | null
  alarmCode:    string | null
  buildingId:   number | null
  buildingCode: string | null
  buildingName: string | null
  alarmTitle:   string | null
  alarmType:    string | null
  alarmLevel:   string | null
  alarmContent: string | null
  status:       string | null
  triggerTime:  string | null
  handleTime:   string | null
  handleUser:   string | null
  createTime:   string | null
}

// ── 内部辅助 ──────────────────────────────────────────────────────────────────

/** 按 id 索引 iot_space，带出 space_code、name */
function buildSpaceMap(): Map<number, { spaceCode: string; name: string }> {
  const spaces = getTable<{
    id: number
    space_code: string
    name: string
  }>("iot_space")

  const map = new Map<number, { spaceCode: string; name: string }>()
  for (const s of spaces) {
    map.set(s.id, { spaceCode: s.space_code, name: s.name })
  }
  return map
}

// ── 主函数 ────────────────────────────────────────────────────────────────────

/**
 * 查询告警列表，支持按等级、状态、建筑、关键字筛选。
 * 结果按 trigger_time 倒序（最新在前）。
 *
 * @param query 筛选条件，全部可选；不传或空对象时返回全部告警
 */
export function listAlarms(query: AlarmListQuery = {}): AlarmListItem[] {
  const { alarmLevel, status, buildingId, keyword } = query

  const rows = getTable<{
    id:            number
    alarm_id:      string | null
    alarm_code:    string | null
    building_id:   number | null
    alarm_title:   string | null
    alarm_type:    string | null
    alarm_level:   string | null
    alarm_content: string | null
    status:        string | null
    trigger_time:  string | null
    handle_time:   string | null
    handle_user:   string | null
    create_time:   string | null
  }>("alarm_record")

  const spaceMap = buildSpaceMap()

  const kw = keyword ? keyword.toLowerCase() : null

  let filtered = rows.filter((r) => {
    if (alarmLevel  !== undefined && r.alarm_level  !== alarmLevel)  return false
    if (status      !== undefined && r.status        !== status)      return false
    if (buildingId  !== undefined && r.building_id   !== buildingId)  return false
    if (kw !== null) {
      const title = (r.alarm_title  ?? "").toLowerCase()
      const code  = (r.alarm_code   ?? "").toLowerCase()
      if (!title.includes(kw) && !code.includes(kw)) return false
    }
    return true
  })

  // 按 trigger_time 倒序
  filtered = filtered.sort((a, b) => {
    const ta = a.trigger_time ?? ""
    const tb = b.trigger_time ?? ""
    return tb > ta ? 1 : tb < ta ? -1 : 0
  })

  return filtered.map((r) => {
    const space = r.building_id != null ? (spaceMap.get(r.building_id) ?? null) : null
    return {
      id:           r.id,
      alarmId:      r.alarm_id   ?? null,
      alarmCode:    r.alarm_code ?? null,
      buildingId:   r.building_id,
      buildingCode: space ? space.spaceCode : null,
      buildingName: space ? space.name      : null,
      alarmTitle:   r.alarm_title   ?? null,
      alarmType:    r.alarm_type    ?? null,
      alarmLevel:   r.alarm_level   ?? null,
      alarmContent: r.alarm_content ?? null,
      status:       r.status        ?? null,
      triggerTime:  r.trigger_time  ?? null,
      handleTime:   r.handle_time   ?? null,
      handleUser:   r.handle_user   ?? null,
      createTime:   r.create_time   ?? null,
    }
  })
}

// ── getAlarm ─────────────────────────────────────────────────────────────────

/** 处置建议静态映射（按告警等级） */
const DISPOSAL_SUGGESTION: Readonly<Record<string, string>> = {
  RED:    "立即启动应急响应，联系相关主管部门和专业机构，必要时疏散人员并封闭建筑",
  ORANGE: "尽快安排专业人员现场核查，制定处置方案，完成工单派单与闭环处置",
  YELLOW: "加强监测频次，安排巡检并关注变化趋势，超过阈值立即升级处置",
  GREEN:  "当前状态正常，保持常规监测",
}

export interface AlarmThresholds {
  green?:  { min?: number | null; max?: number | null }
  yellow?: { min?: number | null; max?: number | null }
  orange?: { min?: number | null; max?: number | null }
  red?:    { min?: number | null; max?: number | null }
}

export interface AlarmDetail extends AlarmListItem {
  /** alarm_record 扩展字段 */
  rootCause:     string | null
  rawData:       string | null
  aggregateFlag: number | null
  sensorId:      number | null
  deviceId:      string | null
  updateTime:    string | null
  /** 来自 iot_data_point */
  dataPointName: string | null
  unit:          string | null
  /** 来自 space_analysis_config.risk_level_json（按 building_id + 数据点关联 metric） */
  thresholds:    AlarmThresholds | null
  /** 处置建议（静态） */
  disposalSuggestion: string
}

export type GetAlarmResult =
  | { ok: true;  data: AlarmDetail }
  | { ok: false; error: string }

/**
 * 查询单条告警详情，包含来源数据、阈值、建筑信息和处置建议。
 *
 * @param id alarm_record.id
 */
export function getAlarm(id: number): GetAlarmResult {
  const rows = getTable<{
    id:            number
    alarm_id:      string | null
    alarm_code:    string | null
    device_id:     string | null
    building_id:   number | null
    sensor_id:     number | null
    alarm_title:   string | null
    alarm_type:    string | null
    alarm_level:   string | null
    alarm_content: string | null
    root_cause:    string | null
    aggregate_flag: number | null
    raw_data:      string | null
    status:        string | null
    trigger_time:  string | null
    handle_time:   string | null
    handle_user:   string | null
    create_time:   string | null
    update_time:   string | null
  }>("alarm_record")

  const row = rows.find((r) => Number(r.id) === Number(id))
  if (!row) {
    return { ok: false, error: `alarm_record 中不存在 id=${id} 的告警` }
  }

  // ── 建筑信息 ────────────────────────────────────────────────────────────
  const spaceMap = buildSpaceMap()
  const space = row.building_id != null ? (spaceMap.get(row.building_id) ?? null) : null

  // ── 数据点信息 ──────────────────────────────────────────────────────────
  let dataPointName: string | null = null
  let unit: string | null = null

  if (row.sensor_id != null) {
    const dataPoints = getTable<{
      id: number
      name: string
      point_name: string | null
      unit_type_id: number | null
    }>("iot_data_point")
    const dp = dataPoints.find((p) => p.id === row.sensor_id)
    if (dp) {
      dataPointName = dp.point_name ?? dp.name ?? null
      // unit_type_id: 1=mm, 2=°(度), 3=mm/d  （与 seedDataPoints 对应）
      const UNIT_MAP: Record<number, string> = { 1: "mm", 2: "°", 3: "mm/d" }
      unit = dp.unit_type_id != null ? (UNIT_MAP[dp.unit_type_id] ?? null) : null
    }
  }

  // ── 阈值信息（来自 space_analysis_config.risk_level_json） ──────────────
  let thresholds: AlarmThresholds | null = null

  if (row.building_id != null && row.sensor_id != null) {
    // 通过 sensor_id → iot_data_point.factor_id → space_analysis_config.metric_id
    const dataPoints = getTable<{ id: number; factor_id: number | null }>("iot_data_point")
    const dp = dataPoints.find((p) => p.id === row.sensor_id)
    if (dp && dp.factor_id != null) {
      const configs = getTable<{
        space_id:        number
        metric_id:       number
        risk_level_json: string | null
        is_enabled:      number
      }>("space_analysis_config")
      const cfg = configs.find(
        (c) => c.space_id === row.building_id && c.metric_id === dp.factor_id && c.is_enabled === 1
      )
      if (cfg && cfg.risk_level_json) {
        try {
          thresholds = JSON.parse(cfg.risk_level_json) as AlarmThresholds
        } catch {
          thresholds = null
        }
      }
    }
  }

  // ── 处置建议 ────────────────────────────────────────────────────────────
  const disposalSuggestion =
    DISPOSAL_SUGGESTION[row.alarm_level ?? ""] ?? DISPOSAL_SUGGESTION["GREEN"]

  const data: AlarmDetail = {
    // 基础（AlarmListItem）
    id:           row.id,
    alarmId:      row.alarm_id      ?? null,
    alarmCode:    row.alarm_code    ?? null,
    buildingId:   row.building_id,
    buildingCode: space ? space.spaceCode : null,
    buildingName: space ? space.name      : null,
    alarmTitle:   row.alarm_title   ?? null,
    alarmType:    row.alarm_type    ?? null,
    alarmLevel:   row.alarm_level   ?? null,
    alarmContent: row.alarm_content ?? null,
    status:       row.status        ?? null,
    triggerTime:  row.trigger_time  ?? null,
    handleTime:   row.handle_time   ?? null,
    handleUser:   row.handle_user   ?? null,
    createTime:   row.create_time   ?? null,
    // 扩展
    rootCause:     row.root_cause    ?? null,
    rawData:       row.raw_data      ?? null,
    aggregateFlag: row.aggregate_flag ?? null,
    sensorId:      row.sensor_id     ?? null,
    deviceId:      row.device_id     ?? null,
    updateTime:    row.update_time   ?? null,
    // 关联
    dataPointName,
    unit,
    thresholds,
    disposalSuggestion,
  }

  return { ok: true, data }
}

// ── confirmAlarm ──────────────────────────────────────────────────────────────

export interface ConfirmAlarmOptions {
  /** 确认人，不传时默认为 "system" */
  operator?:    string
  /** 确认时间（ISO 字符串），不传时使用当前时间 */
  confirmedAt?: string
}

export type ConfirmAlarmResult =
  | { ok: true;  id: number; status: string; handleUser: string; handleTime: string }
  | { ok: false; error: string }

/**
 * 确认告警：将 alarm_record.status 变更为 ACTIVE，记录确认人和确认时间。
 *
 * 允许状态：PENDING、ACTIVE（幂等）。
 * 不允许状态：CLOSED（已关闭告警不可再确认）。
 *
 * @param id          alarm_record.id
 * @param options     确认人 / 确认时间，均可选
 */
export function confirmAlarm(id: number, options: ConfirmAlarmOptions = {}): ConfirmAlarmResult {
  const rows = getTable<Record<string, unknown>>("alarm_record")
  const idx  = rows.findIndex((r) => Number(r["id"]) === Number(id))

  if (idx === -1) {
    return { ok: false, error: `alarm_record 中不存在 id=${id} 的告警` }
  }

  const row = rows[idx]
  if (row["status"] === "CLOSED") {
    return { ok: false, error: `告警 id=${id} 已关闭（CLOSED），不允许重新确认` }
  }

  const operator   = options.operator   ?? "system"
  const handleTime = options.confirmedAt ?? new Date().toISOString().replace("T", " ").slice(0, 19)

  rows[idx] = {
    ...row,
    status:      "PENDING",
    handle_user: operator,
    handle_time: handleTime,
    update_time: handleTime,
  }

  setTable("alarm_record", rows)

  return { ok: true, id, status: "PENDING", handleUser: operator, handleTime }
}

// ── dispatchAlarm ─────────────────────────────────────────────────────────────

/** 不允许派单的告警状态 */
const NON_DISPATCHABLE_STATUSES = new Set(["CLOSED", "DISPATCHED"])

export interface DispatchAlarmOptions {
  /** 派单机构 id */
  dispatchOrgId?:  number
  /** 派单人 id */
  dispatchUserId?: number
  /** 接单机构 id */
  receiveOrgId?:   number
  /** 接单角色 key */
  receiveRoleKey?: string
  /** 派单时间，不传时使用当前时间 */
  dispatchTime?:   string
}

export type DispatchAlarmResult =
  | { ok: true;  orderId: number; alarmId: string; orderNo: string }
  | { ok: false; error: string }

/**
 * 告警派单：根据告警信息创建工单，并将告警状态更新为 DISPATCHED。
 *
 * @param alarmRecordId  alarm_record.id
 * @param options        派单参数（机构 / 人员 / 时间），均可选
 */
export function dispatchAlarm(
  alarmRecordId: number,
  options: DispatchAlarmOptions = {},
): DispatchAlarmResult {
  // ── 1. 校验告警 ──────────────────────────────────────────────────────────
  const alarmRows = getTable<Record<string, unknown>>("alarm_record")
  const alarmIdx  = alarmRows.findIndex((r) => Number(r["id"]) === Number(alarmRecordId))

  if (alarmIdx === -1) {
    return { ok: false, error: `alarm_record 中不存在 id=${alarmRecordId} 的告警` }
  }

  const alarm = alarmRows[alarmIdx]
  if (NON_DISPATCHABLE_STATUSES.has(alarm["status"] as string)) {
    return {
      ok:    false,
      error: `告警 id=${alarmRecordId} 当前状态为 ${alarm["status"]}，不可派单`,
    }
  }

  // ── 2. 生成工单 ──────────────────────────────────────────────────────────
  const now          = options.dispatchTime
    ?? new Date().toISOString().replace("T", " ").slice(0, 19)
  const orderRows    = getTable<Record<string, unknown>>("work_order")
  const newId        = orderRows.length > 0
    ? Math.max(...orderRows.map((r) => Number(r["id"]) || 0)) + 1
    : 1
  const orderNo      = `WO-${now.replace(/[-: ]/g, "").slice(0, 14)}-${String(newId).padStart(4, "0")}`

  const newOrder: Record<string, unknown> = {
    id:               newId,
    order_no:         orderNo,
    order_code:       orderNo,
    alarm_id:         alarm["alarm_id"]   ?? null,
    building_id:      alarm["building_id"] ?? null,
    alarm_level:      alarm["alarm_level"] ?? null,
    order_type:       alarm["alarm_type"]  ?? null,
    order_level:      alarm["alarm_level"] ?? null,
    dispatch_type:    "AUTO",
    dispatch_org_id:  options.dispatchOrgId  ?? null,
    dispatch_user_id: options.dispatchUserId ?? null,
    receive_org_id:   options.receiveOrgId   ?? null,
    receive_role_key: options.receiveRoleKey ?? null,
    status:           "PENDING",
    current_node:     "DISPATCH",
    source_id:        alarmRecordId,
    source_type:      "ALARM",
    dispatch_time:    now,
    create_time:      now,
    update_time:      now,
  }

  setTable("work_order", [...orderRows, newOrder])

  // ── 3. 更新告警状态 ──────────────────────────────────────────────────────
  alarmRows[alarmIdx] = { ...alarm, status: "DISPATCHED", update_time: now }
  setTable("alarm_record", alarmRows)

  return {
    ok:      true,
    orderId: newId,
    alarmId: String(alarm["alarm_id"] ?? ""),
    orderNo,
  }
}

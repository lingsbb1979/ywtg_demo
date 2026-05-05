/**
 * emergencyService.ts — 应急管理服务
 *
 * 表依赖（全部走 SQLite 镜像，localStorage key = ywtg.sqlite.<表名>）:
 *   emergency_plan_config       — 预案模板（配置表，种子数据写入）
 *   emergency_flow_node_config  — 预案步骤（配置表，种子数据写入）
 *   emergency_incident          — 当前活跃应急事件（业务数据表）
 *   emergency_order             — 每步确认记录（业务数据表）
 *   work_order                  — resolveIncident → 转修缮工单时写入
 */
import { getTable, setTable } from "./sqliteMirrorRepository"

// ── 类型定义 ──────────────────────────────────────────────────────────────────

export interface EmergencyPlanConfig {
  id: number
  plan_code: string
  plan_name: string
  level_code: string
  trigger_condition_json: string | null
  related_dept_json: string | null
  release_condition_json: string | null
  can_transfer_work_order: number
  status: number
}

export interface EmergencyFlowNode {
  id: number
  plan_id: number
  node_code: string
  node_name: string
  sort_order: number
  target_role_keys: string
  required_material_json: string | null
  limit_minutes: number | null
}

export interface EmergencyIncident {
  id: number
  incident_no: string
  source_type: number
  building_id: number
  level: number
  /** 10=待核实 40=已解除/销号 */
  status: number
  trigger_time: string
  report_to_province: number
  evacuation_status: number
  /** 关联预案 id */
  plan_id: number
  /** 已确认步骤数（0 = 未开始，n = 已完成前 n 步） */
  current_step: number
  /** 结案方式：null | "REPAIR_ORDER" | "REPORT_GOV" */
  close_type: string | null
  /** 触发来源告警记录 id */
  alarm_record_id: number | null
}

export interface EmergencyOrder {
  id: number
  incident_id: number
  /** 对应 emergency_flow_node_config.node_code */
  order_type: string
  target_dept: string
  issue_time: string
  confirm_time: string | null
  feedback: string | null
}

// ── 读取函数 ──────────────────────────────────────────────────────────────────

/** 获取当前活跃（未关闭）的应急事件，无则返回 null */
export function getActiveIncident(): EmergencyIncident | null {
  const rows = getTable<EmergencyIncident>("emergency_incident")
  // status !== 40（40=已解除/销号）
  const active = rows.filter((r) => Number(r.status) !== 40)
  if (active.length === 0) return null
  // 取最新一条（id 最大）
  return active.reduce((a, b) => (Number(a.id) >= Number(b.id) ? a : b))
}

/** 获取所有活跃（未关闭）的应急事件，按 id 降序 */
export function getAllActiveIncidents(): EmergencyIncident[] {
  const rows = getTable<EmergencyIncident>("emergency_incident")
  return rows
    .filter((r) => Number(r.status) !== 40)
    .sort((a, b) => Number(b.id) - Number(a.id))
}

/** 获取所有应急事件（含归档），按 id 降序 */
export function getAllIncidents(): EmergencyIncident[] {
  const rows = getTable<EmergencyIncident>("emergency_incident")
  return [...rows].sort((a, b) => Number(b.id) - Number(a.id))
}

/** 获取指定预案的步骤节点，按 sort_order 升序 */
export function getPlanNodes(planId: number): EmergencyFlowNode[] {
  const rows = getTable<EmergencyFlowNode>("emergency_flow_node_config")
  return rows
    .filter((r) => Number(r.plan_id) === planId)
    .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
}

/**
 * 返回"大屏所有步骤已全部确认、等待 H5 外勤结案"的应急事件列表。
 * 条件：status !== 40（未结案）且 current_step >= 该预案节点总数。
 */
export function getH5ReadyIncidents(): EmergencyIncident[] {
  const rows = getTable<EmergencyIncident>("emergency_incident")
  const active = rows.filter((r) => Number(r.status) !== 40)
  return active.filter((inc) => {
    const nodes = getPlanNodes(Number(inc.plan_id))
    return Number(inc.current_step) >= nodes.length
  })
}

/** 获取指定事件已确认的步骤记录 */
export function getIncidentOrders(incidentId: number): EmergencyOrder[] {
  const rows = getTable<EmergencyOrder>("emergency_order")
  return rows.filter((r) => Number(r.incident_id) === incidentId)
}

// ── 写入函数 ──────────────────────────────────────────────────────────────────

function _fmtNow(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/**
 * 确认指定步骤（点击"✓ 确认"时调用）。
 * 写入 emergency_order 一条记录，并将 emergency_incident.current_step + 1。
 */
export function confirmStep(incidentId: number, nodeCode: string): void {
  const now = _fmtNow()

  // 写 emergency_order
  const orders = getTable<EmergencyOrder>("emergency_order")
  const nextOrderId = orders.length > 0
    ? Math.max(...orders.map((r) => Number(r.id))) + 1
    : 1
  setTable("emergency_order", [...orders, {
    id:           nextOrderId,
    incident_id:  incidentId,
    order_type:   nodeCode,
    target_dept:  "duty_officer",
    issue_time:   now,
    confirm_time: now,
    feedback:     null,
  } satisfies EmergencyOrder])

  // 更新 emergency_incident.current_step + 1
  const incidents = getTable<EmergencyIncident>("emergency_incident")
  const idx = incidents.findIndex((r) => Number(r.id) === Number(incidentId))
  if (idx !== -1) {
    const updated = [...incidents]
    updated[idx] = {
      ...updated[idx],
      current_step: Number(updated[idx].current_step ?? 0) + 1,
    }
    setTable("emergency_incident", updated)
  }
}

/**
 * 结案：标记事件已关闭，并根据方式选择后续动作。
 * - "REPAIR_ORDER"：生成一张已处置待核查的修缮工单（source_type="EMERGENCY"）
 * - "REPORT_GOV"：仅归档，不生成工单
 */
export function resolveIncident(
  incidentId: number,
  closeType: "REPAIR_ORDER" | "REPORT_GOV",
): { ok: boolean; workOrderId?: number } {
  const now = _fmtNow()

  // 读取事件
  const incidents = getTable<EmergencyIncident>("emergency_incident")
  const idx = incidents.findIndex((r) => Number(r.id) === Number(incidentId))
  if (idx === -1) return { ok: false }

  const incident = incidents[idx]

  // 关闭事件
  const updatedIncidents = [...incidents]
  updatedIncidents[idx] = {
    ...incident,
    status:     40,
    close_type: closeType,
  }
  setTable("emergency_incident", updatedIncidents)

  // 关闭关联告警（alarm_record → CLOSED），大屏告警随之消除
  if (incident.alarm_record_id != null) {
    const alarmRows = getTable<Record<string, unknown>>("alarm_record")
    const alarmIdx = alarmRows.findIndex((r) => Number(r.id) === Number(incident.alarm_record_id))
    if (alarmIdx !== -1) {
      const updatedAlarms = [...alarmRows]
      updatedAlarms[alarmIdx] = { ...updatedAlarms[alarmIdx], status: "CLOSED", update_time: now }
      setTable("alarm_record", updatedAlarms)
    }
  }

  if (closeType === "REPAIR_ORDER") {
    // H5 已完成应急处置并选择修缮，因此后续直接进入 PC 待核查。
    const orders = getTable<Record<string, unknown>>("work_order")
    const nextId = orders.length > 0
      ? Math.max(...orders.map((r) => Number(r.id ?? 0))) + 1
      : 1
    const orderNo = `WO-EM-${String(nextId).padStart(4, "0")}`
    setTable("work_order", [...orders, {
      id:               nextId,
      order_no:         orderNo,
      order_code:       orderNo,
      alarm_id:         null,
      building_id:      incident.building_id,
      order_type:       "REPAIR",
      order_level:      "HIGH",
      alarm_level:      "RED",
      dispatch_type:    "ASSIGN",
      dispatch_org_id:  10,
      dispatch_user_id: 100,
      dispatch_org:     "住建局应急指挥",
      receive_org_id:   20,
      receive_user_id:  null,
      receive_org:      "现场修缮组",
      receive_role_key: "FIELD_WORKER",
      assignee_id:      null,
      priority:         1,
      status:           "CHECKING",
      current_node:     "CHECK",
      source_id:        incidentId,
      source_type:      "EMERGENCY",
      dispatch_time:    now,
      accept_time:      now,
      finish_time:      now,
      check_time:       null,
      create_time:      now,
      update_time:      now,
    }])

    const disposalRows = getTable<{ id?: number }>("work_order_disposal")
    const disposalId = disposalRows.length > 0
      ? Math.max(...disposalRows.map((r) => Number(r.id ?? 0))) + 1
      : 1
    setTable("work_order_disposal", [...disposalRows, {
      id:            disposalId,
      order_id:      nextId,
      user_id:       null,
      gps_location:  null,
      address_desc:  null,
      image_urls:    null,
      video_url:     null,
      disposal_desc: "H5 应急结案：险情已控制，转入修缮工单待核查",
      disposal_time: now,
      create_time:   now,
    }])

    const logRows = getTable<{ id?: number }>("work_order_log")
    const logId = logRows.length > 0
      ? Math.max(...logRows.map((r) => Number(r.id ?? 0))) + 1
      : 1
    setTable("work_order_log", [...logRows, {
      id:            logId,
      order_id:      nextId,
      node_type:     "EMERGENCY_CLOSE",
      node_name:     "应急结案",
      operator_id:   null,
      operator_name: "H5应急结案",
      operator:      "H5应急结案",
      action_desc:   "H5 端选择“转为修缮工单”，已进入 PC 待核查",
      action_time:   now,
      detail_json:   JSON.stringify({ incident_id: incidentId, close_type: closeType }),
      remark:        null,
      create_time:   now,
    }])

    return { ok: true, workOrderId: nextId }
  }

  return { ok: true }
}

// ── createIncidentFromAlarm ───────────────────────────────────────────────────

export type CreateIncidentResult =
  | { ok: true;  incidentId: number; incidentNo: string }
  | { ok: false; error: string }

/**
 * 为已确认的 RED 告警创建应急事件。
 * 若该告警已关联应急事件，则幂等返回已有事件 id。
 */
export function createIncidentFromAlarm(alarmRecordId: number): CreateIncidentResult {
  // 1. 查告警
  const alarms = getTable<Record<string, unknown>>("alarm_record")
  const alarm  = alarms.find((r) => Number(r["id"]) === Number(alarmRecordId))
  if (!alarm) return { ok: false, error: `告警 id=${alarmRecordId} 不存在` }

  // 2. 幂等：已有关联事件则直接返回
  const incidents = getTable<EmergencyIncident>("emergency_incident")
  const existing  = incidents.find((r) => Number(r.alarm_record_id) === Number(alarmRecordId))
  if (existing) return { ok: true, incidentId: existing.id, incidentNo: existing.incident_no }

  // 3. 选红色预案
  const plans  = getTable<{ id?: number; level_code?: string }>("emergency_plan_config")
  const plan   = plans.find((p) => p.level_code === "RED")
  const planId = plan?.id ?? 1

  // 4. 生成事件
  const now      = new Date().toISOString().replace("T", " ").slice(0, 19)
  const nextId   = incidents.length > 0
    ? Math.max(...incidents.map((r) => Number(r.id) || 0)) + 1
    : 1
  const incidentNo = `EM-${now.replace(/[-: ]/g, "").slice(0, 14)}`

  setTable("emergency_incident", [...incidents, {
    id:                 nextId,
    incident_no:        incidentNo,
    source_type:        1,
    building_id:        Number(alarm["building_id"]) || null,
    level:              3,
    status:             10,   // 待核实
    trigger_time:       String(alarm["trigger_time"] ?? now),
    report_to_province: 0,
    evacuation_status:  0,
    plan_id:            planId,
    current_step:       0,
    close_type:         null,
    alarm_record_id:    alarmRecordId,
  }])

  // 5. 告警状态更新为 DISPATCHED（已派遣至应急）
  const alarmIdx = alarms.findIndex((r) => Number(r["id"]) === Number(alarmRecordId))
  alarms[alarmIdx] = { ...alarms[alarmIdx], status: "DISPATCHED" }
  setTable("alarm_record", alarms)

  return { ok: true, incidentId: nextId, incidentNo }
}

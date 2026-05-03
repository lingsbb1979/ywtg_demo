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

/** 获取指定预案的步骤节点，按 sort_order 升序 */
export function getPlanNodes(planId: number): EmergencyFlowNode[] {
  const rows = getTable<EmergencyFlowNode>("emergency_flow_node_config")
  return rows
    .filter((r) => Number(r.plan_id) === planId)
    .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
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
 * - "REPAIR_ORDER"：生成一张普通修缮工单（source_type="EMERGENCY"）
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

  if (closeType === "REPAIR_ORDER") {
    // 生成修缮工单
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
      status:           "PENDING",
      current_node:     "PENDING",
      source_id:        incidentId,
      source_type:      "EMERGENCY",
      dispatch_time:    now,
      accept_time:      null,
      finish_time:      null,
      check_time:       null,
      create_time:      now,
      update_time:      now,
    }])
    return { ok: true, workOrderId: nextId }
  }

  return { ok: true }
}

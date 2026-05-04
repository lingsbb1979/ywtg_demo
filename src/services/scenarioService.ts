/**
 * scenarioService.ts — 场景引擎
 * T15.64 resetDemo()：清空并写入固定演示种子数据
 */
import { getTable, resetTables, setTable } from "./sqliteMirrorRepository"
import { ANALYSIS_LINK_ROWS } from "../mock/seeds/seedAnalysisLink"
import { DATA_POINT_ROWS, FACTOR_TYPE_ROWS } from "../mock/seeds/seedDataPoints"
import { GATEWAY_ROWS, DRIVER_ROWS, LINK_ROWS, DEVICE_ROWS, MEASURE_POINT_ROWS } from "../mock/seeds/seedIotHierarchy"
import { seedBuildings } from "../mock/seeds/seedBuildings"
import { seedSpaceRelation } from "../mock/seeds/seedSpaceRelation"
import { seedTelemetry } from "../mock/seeds/seedTelemetry"

// ── 时间辅助函数（置顶避免前向引用问题）─────────────────────────────────────────

/** "YYYY-MM-DD HH:mm:ss" → ms */
function _parseTs(s: string): number {
  return Date.parse(s.replace(" ", "T"))
}

/** ms → "YYYY-MM-DD HH:mm:ss" */
function _fmtTs(ms: number): string {
  const d = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// ── 种子数据 ──────────────────────────────────────────────────────────────────

// 种子告警全部设为 CLOSED，重置后大屏呈全绿干净状态，演示者手动触发场景后才出现活跃告警
const SEED_ALARMS = [
  { id: 1, alarm_id: "ALM-001", alarm_code: "CRK-001", device_id: 101,
    building_id: 1001, sensor_id: 201, alarm_title: "A栋裂缝超限（历史）",
    alarm_type: "CRACK", alarm_level: "ORANGE", alarm_content: "裂缝宽度超出阈值（已处置）",
    root_cause: null, aggregate_flag: 0, raw_data: null,
    status: "CLOSED", trigger_time: "2024-03-08 08:00:00",
    handle_time: "2024-03-08 12:00:00", handle_user: "admin",
    create_time: "2024-03-08 08:00:00", update_time: "2024-03-08 12:00:00" },
  { id: 2, alarm_id: "ALM-002", alarm_code: "TILT-001", device_id: 102,
    building_id: 1002, sensor_id: 202, alarm_title: "B栋倾斜告警（历史）",
    alarm_type: "TILT", alarm_level: "RED", alarm_content: "倾斜角超出安全阈值（已处置）",
    root_cause: null, aggregate_flag: 0, raw_data: null,
    status: "CLOSED", trigger_time: "2024-03-08 09:00:00",
    handle_time: "2024-03-08 13:00:00", handle_user: "admin",
    create_time: "2024-03-08 09:00:00", update_time: "2024-03-08 13:00:00" },
]

const SEED_WORK_ORDERS = [
  { id: 1, order_no: "WO-2024-001", order_code: "WO-2024-001",
    alarm_id: "ALM-001", building_id: 1001, order_type: "REPAIR",
    order_level: "HIGH", alarm_level: "ORANGE",
    dispatch_type: "ASSIGN", dispatch_org_id: 10, dispatch_user_id: 100,
    dispatch_org: "安全监测部", receive_org_id: 20, receive_user_id: 201,
    receive_org: "现场维修组", receive_role_key: "FIELD_WORKER",
    assignee_id: 201, priority: 2, status: "CLOSED",
    current_node: "CLOSED", source_id: null, source_type: null,
    dispatch_time: "2024-03-08 10:00:00", accept_time: "2024-03-08 10:10:00",
    finish_time: "2024-03-08 14:00:00", check_time: "2024-03-08 15:00:00",
    create_time: "2024-03-08 10:00:00", update_time: "2024-03-08 15:00:00" },
  { id: 2, order_no: "WO-2024-002", order_code: "WO-2024-002",
    alarm_id: "ALM-002", building_id: 1002, order_type: "INSPECT",
    order_level: "URGENT", alarm_level: "RED",
    dispatch_type: "ASSIGN", dispatch_org_id: 10, dispatch_user_id: 100,
    dispatch_org: "安全监测部", receive_org_id: 20, receive_user_id: 202,
    receive_org: "现场维修组", receive_role_key: "FIELD_WORKER",
    assignee_id: 202, priority: 1, status: "CLOSED",
    current_node: "CLOSED", source_id: null, source_type: null,
    dispatch_time: "2024-03-08 09:00:00", accept_time: "2024-03-08 09:05:00",
    finish_time: "2024-03-08 13:00:00", check_time: "2024-03-08 14:00:00",
    create_time: "2024-03-08 09:00:00", update_time: "2024-03-08 14:00:00" },
]

// ── 应急预案配置种子数据 ─────────────────────────────────────────────────────────────────────

/**
 * 1 条预案模板（emergency_plan_config）。
 * 重置演示数据时播种，大屏弹窗从此表读取预案信息。
 */
const SEED_EMERGENCY_PLANS = [
  {
    id: 1,
    plan_code: "EP-RED-TILT",
    plan_name: "危房倾斜红色应急预案",
    level_code: "RED",
    trigger_condition_json: null,
    related_dept_json: JSON.stringify(["fire", "street", "bureau"]),
    release_condition_json: null,
    can_transfer_work_order: 1,
    status: 1,
  },
]

/**
 * 5 个预案步骤（emergency_flow_node_config）。
 * sort_order 决定展示顺序，大屏弹窗按此顺序逐步解锁。
 */
const SEED_EMERGENCY_NODES = [
  { id: 1, plan_id: 1, node_code: "CONFIRM",  node_name: "确认险情属实",                   sort_order: 1, target_role_keys: "DUTY_OFFICER", required_material_json: null, limit_minutes: 5   },
  { id: 2, plan_id: 1, node_code: "NOTIFY",   node_name: "通知消防大队 + 街道办主任",   sort_order: 2, target_role_keys: "DUTY_OFFICER", required_material_json: null, limit_minutes: 5   },
  { id: 3, plan_id: 1, node_code: "REPORT",   node_name: "向黑龙江省住建厅上报（708号令。2小时内）", sort_order: 3, target_role_keys: "DUTY_OFFICER", required_material_json: null, limit_minutes: 120 },
  { id: 4, plan_id: 1, node_code: "EXPERT",   node_name: "专家到场评估，出具鉴定意见",   sort_order: 4, target_role_keys: "EXPERT",       required_material_json: null, limit_minutes: 60  },
  { id: 5, plan_id: 1, node_code: "CLOSE",    node_name: "选择结案方式（请外勤手机操作）", sort_order: 5, target_role_keys: "FIELD_WORKER",  required_material_json: null, limit_minutes: null },
]

// ── 导出函数 ────────────────────────────────────────────────────────────────────────────────

/**
 * 一键清空所有表并写入固定演示种子数据（幂等）。
 */
export function resetDemo(): void {
  resetTables()
  seedBuildings()
  seedSpaceRelation()
  setTable("alarm_record",               SEED_ALARMS)
  setTable("work_order",                 SEED_WORK_ORDERS)
  setTable("emergency_plan_config",      SEED_EMERGENCY_PLANS)
  setTable("emergency_flow_node_config", SEED_EMERGENCY_NODES)
  // 清空当前活跃应急事件（确保演示开始时大屏无弹窗）
  setTable("emergency_incident", [])
  setTable("emergency_order",    [])
  // IoT 分析配置：带 point_ids 的完整关联版本（用于 IoT 驱动触发和分析页展示）
  setTable("space_analysis_config", ANALYSIS_LINK_ROWS)
  // IoT 六级层级配置（网关→驱动→链路→设备→测点）
  setTable("iot_gateway",       GATEWAY_ROWS)
  setTable("iot_driver",        DRIVER_ROWS)
  setTable("iot_link",          LINK_ROWS)
  setTable("iot_device",        DEVICE_ROWS)
  setTable("iot_measure_point", MEASURE_POINT_ROWS)
  // 数据点定义（用于遥测页展示因子名称/单位/阈值）
  setTable("iot_data_point",  DATA_POINT_ROWS)
  setTable("iot_factor_type", FACTOR_TYPE_ROWS)
  // 写入正常状态基线遥测，保证大屏点位点击后能展示实时数据
  seedTelemetry()
  // 分析档案仍保持空表，风险色由演示触发流程实时计算
  setTable("space_analysis_archive", [])
}

// ── T15.65 triggerOrangeCrack ─────────────────────────────────────────────────

export interface CrackOptions {
  nowStr?: string
}

let _crackSeq = 0

/**
 * 追加一条 B003 橙色裂缝告警到 alarm_record（不清空已有数据）。
 */
export function triggerOrangeCrack(options: CrackOptions = {}): void {
  const { nowStr = "2024-03-08 10:00:00" } = options
  _crackSeq++
  const rows = getTable<Record<string, unknown>>("alarm_record")
  const nextId = rows.length > 0
    ? Math.max(...(rows as { id?: number }[]).map((r) => r.id ?? 0)) + 1
    : 1
  const newAlarm = {
    id:           nextId,
    alarm_id:     "ALM-CRACK-003",
    alarm_code:   `CRK-003-${String(_crackSeq).padStart(3, "0")}`,
    device_id:    103,
    building_id:  1003,
    sensor_id:    203,
    alarm_title:  "C栋裂缝超限",
    alarm_type:   "CRACK",
    alarm_level:  "ORANGE",
    alarm_content: "裂缝宽度超出橙色阈值",
    root_cause:   null,
    aggregate_flag: 0,
    raw_data:     null,
    status:       "ACTIVE",
    trigger_time: nowStr,
    handle_time:  null,
    handle_user:  null,
    create_time:  nowStr,
    update_time:  nowStr,
  }
  setTable("alarm_record", [...rows, newAlarm])
}

// ── T15.66 triggerRedAlert ────────────────────────────────────────────────────

export interface RedAlertOptions {
  nowStr?: string
}

let _tiltSeq = 0

/**
 * 追加一条 B012 红色倾斜告警（写 alarm_record），
 * 同时在 emergency_incident 创建一条待核实应急事件（关联预案 EP-RED-TILT）。
 * 工单由操作员点击"自动派单"后由 dispatchAlarm() 创建，不在此预建。
 */
export function triggerRedAlert(options: RedAlertOptions = {}): void {
  const nowStr = options.nowStr ?? _fmtTs(Date.now())
  _tiltSeq++

  // ─ alarm_record ─
  const alarms = getTable<{ id?: number }>("alarm_record")
  const alarmId = alarms.length > 0
    ? Math.max(...alarms.map((r) => r.id ?? 0)) + 1
    : 1
  setTable("alarm_record", [...alarms, {
    id:            alarmId,
    alarm_id:      "ALM-TILT-012",
    alarm_code:    `TILT-012-${String(_tiltSeq).padStart(3, "0")}`,
    device_id:     112,
    building_id:   1012,
    sensor_id:     212,
    alarm_title:   "L栋倾斜超限",
    alarm_type:    "TILT",
    alarm_level:   "RED",
    alarm_content: "倾斜角超出红色阈值",
    root_cause:    null,
    aggregate_flag: 0,
    raw_data:      null,
    status:        "ACTIVE",
    trigger_time:  nowStr,
    handle_time:   null,
    handle_user:   null,
    create_time:   nowStr,
    update_time:   nowStr,
  }])

  // ─ emergency_incident（若已有活跃事件则跳过，防止重复触发）─
  const incidents = getTable<{ id?: number; status?: number }>("emergency_incident")
  const hasActive = incidents.some((r) => Number(r.status) !== 40)
  if (!hasActive) {
    // 查找红色预案 id（EP-RED-TILT），降级为 1
    const plans = getTable<{ id?: number; level_code?: string }>("emergency_plan_config")
    const plan = plans.find((p) => p.level_code === "RED")
    const planId = plan?.id ?? 1

    const nextIncidentId = incidents.length > 0
      ? Math.max(...incidents.map((r) => r.id ?? 0)) + 1
      : 1
    setTable("emergency_incident", [...incidents, {
      id:                  nextIncidentId,
      incident_no:         `EM-${nowStr.replace(/[-: ]/g, "").slice(0, 14)}`,
      source_type:         1,        // 系统预警自动触发
      building_id:         1012,
      level:               3,        // II级（重大）
      status:              10,       // 待核实
      trigger_time:        nowStr,
      report_to_province:  0,
      evacuation_status:   0,
      plan_id:             planId,
      current_step:        0,
      close_type:          null,
      alarm_record_id:     alarmId,
    }])
  }
  // 红色告警走应急流程，工单由外勤在 H5 结案时选择"转为修缮工单"后由 resolveIncident() 创建，
  // 此处不预建工单，避免应急流程与普通工单派遣流程混淆。
}

// ── T15.67 triggerTimeoutSupervision ─────────────────────────────────────────

export interface SupervisionOptions {
  nowStr?: string
}

let _supSeq = 0

/**
 * 追加一条超时工单（dispatch_time 提前 200 min）+ 配套督办单。
 */
export function triggerTimeoutSupervision(options: SupervisionOptions = {}): void {
  const nowStr = options.nowStr ?? "2024-03-08 11:00:00"
  _supSeq++

  const dispatchMs = _parseTs(nowStr) - 200 * 60 * 1000
  const dispatchTs = _fmtTs(dispatchMs)

  // ─ work_order ─
  const orders = getTable<{ id?: number }>("work_order")
  const orderId = orders.length > 0
    ? Math.max(...orders.map((r) => r.id ?? 0)) + 1
    : 1
  setTable("work_order", [...orders, {
    id:              orderId,
    order_no:        `WO-TIMEOUT-${String(orderId).padStart(4, "0")}`,
    order_code:      `WO-TIMEOUT-${String(orderId).padStart(4, "0")}`,
    alarm_id:        null,
    building_id:     1001,
    order_type:      "REPAIR",
    order_level:     "HIGH",
    alarm_level:     "ORANGE",
    dispatch_type:   "ASSIGN",
    dispatch_org_id: 10,
    dispatch_user_id: 100,
    dispatch_org:    "安全监测部",
    receive_org_id:  20,
    receive_user_id: null,
    receive_org:     "现场维修组",
    receive_role_key: "FIELD_WORKER",
    assignee_id:     null,
    priority:        2,
    status:          "PENDING",
    current_node:    "DISPATCH",
    source_id:       null,
    source_type:     null,
    dispatch_time:   dispatchTs,
    accept_time:     null,
    finish_time:     null,
    check_time:      null,
    create_time:     dispatchTs,
    update_time:     nowStr,
  }])

  // ─ supervision_order ─
  const sups = getTable<{ id?: number }>("supervision_order")
  const supId = sups.length > 0
    ? Math.max(...sups.map((r) => r.id ?? 0)) + 1
    : 1
  setTable("supervision_order", [...sups, {
    id:               supId,
    supervision_no:   `SUP-TIMEOUT-${String(supId).padStart(4, "0")}`,
    order_id:         orderId,
    order_no:         `WO-TIMEOUT-${String(orderId).padStart(4, "0")}`,
    building_id:      1001,
    building_name:    "历史建筑A栋",
    title:            "工单超时督办",
    source_type:      "WORK_ORDER",
    level_code:       "GENERAL",
    supervision_type: "超时督办",
    reason:           `工单派单时间：${dispatchTs}，超出 SLA ${120} 分钟，请及时处理。`,
    status:           "PENDING",
    issue_time:       nowStr,
    handler_id:       null,
    handler_name:     null,
    reply:            null,
    reply_time:       null,
    create_time:      nowStr,
    update_time:      nowStr,
  }])
}

// ── T15.68 simulateDataRecovery ───────────────────────────────────────────────

export interface RecoveryOptions {
  nowStr?: string
}

/**
 * 将 B003 裂缝活跃告警状态改为 CLOSED（模拟数据恢复）。
 * 只修改 building_id=1003 && alarm_type=CRACK && status=ACTIVE 的告警。
 */
export function simulateDataRecovery(options: RecoveryOptions = {}): void {
  const { nowStr = "2024-03-08 12:00:00" } = options

  const alarms = getTable<{
    id: number; building_id: number | null; alarm_type: string | null
    status: string; handle_time: string | null
  }>("alarm_record")

  const updated = alarms.map((a) => {
    if (
      a.building_id === 1003 &&
      a.alarm_type  === "CRACK" &&
      a.status      === "ACTIVE"
    ) {
      return { ...a, status: "CLOSED", handle_time: nowStr }
    }
    return a
  })

  setTable("alarm_record", updated)
}

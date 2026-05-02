/**
 * scenarioService.ts — 场景引擎
 * T15.64 resetDemo()：清空并写入固定演示种子数据
 */
import { getTable, resetTables, setTable } from "./sqliteMirrorRepository"

// ── 种子数据 ──────────────────────────────────────────────────────────────────

const SEED_SPACES = [
  { id: 1001, parent_id: null, space_code: "B001", name: "历史建筑A", short_name: "A栋",
    type: "2", latitude: 46.8, longitude: 130.3, address_desc: "佳木斯市向阳区A路1号",
    is_outdoor: 0, create_time: "2024-01-01 00:00:00" },
  { id: 1002, parent_id: null, space_code: "B002", name: "历史建筑B", short_name: "B栋",
    type: "2", latitude: 46.81, longitude: 130.31, address_desc: "佳木斯市向阳区B路2号",
    is_outdoor: 0, create_time: "2024-01-01 00:00:00" },
  { id: 1003, parent_id: null, space_code: "B003", name: "历史建筑C", short_name: "C栋",
    type: "2", latitude: 46.82, longitude: 130.32, address_desc: "佳木斯市向阳区C路3号",
    is_outdoor: 0, create_time: "2024-01-01 00:00:00" },
]

const SEED_ALARMS = [
  { id: 1, alarm_id: "ALM-001", alarm_code: "CRK-001", device_id: 101,
    building_id: 1001, sensor_id: 201, alarm_title: "A栋裂缝超限",
    alarm_type: "CRACK", alarm_level: "ORANGE", alarm_content: "裂缝宽度超出阈值",
    root_cause: null, aggregate_flag: 0, raw_data: null,
    status: "ACTIVE", trigger_time: "2024-03-08 08:00:00",
    handle_time: null, handle_user: null,
    create_time: "2024-03-08 08:00:00", update_time: "2024-03-08 08:00:00" },
  { id: 2, alarm_id: "ALM-002", alarm_code: "TILT-001", device_id: 102,
    building_id: 1002, sensor_id: 202, alarm_title: "B栋倾斜告警",
    alarm_type: "TILT", alarm_level: "RED", alarm_content: "倾斜角超出安全阈值",
    root_cause: null, aggregate_flag: 0, raw_data: null,
    status: "ACTIVE", trigger_time: "2024-03-08 09:00:00",
    handle_time: null, handle_user: null,
    create_time: "2024-03-08 09:00:00", update_time: "2024-03-08 09:00:00" },
]

const SEED_WORK_ORDERS = [
  { id: 1, order_no: "WO-2024-001", order_code: "WO-2024-001",
    alarm_id: "ALM-001", building_id: 1001, order_type: "REPAIR",
    order_level: "HIGH", alarm_level: "ORANGE",
    dispatch_type: "ASSIGN", dispatch_org_id: 10, dispatch_user_id: 100,
    dispatch_org: "安全监测部", receive_org_id: 20, receive_user_id: 201,
    receive_org: "现场维修组", receive_role_key: "FIELD_WORKER",
    assignee_id: 201, priority: 2, status: "PENDING",
    current_node: "DISPATCH", source_id: null, source_type: null,
    dispatch_time: "2024-03-08 10:00:00", accept_time: null,
    finish_time: null, check_time: null,
    create_time: "2024-03-08 10:00:00", update_time: "2024-03-08 10:00:00" },
  { id: 2, order_no: "WO-2024-002", order_code: "WO-2024-002",
    alarm_id: "ALM-002", building_id: 1002, order_type: "INSPECT",
    order_level: "URGENT", alarm_level: "RED",
    dispatch_type: "ASSIGN", dispatch_org_id: 10, dispatch_user_id: 100,
    dispatch_org: "安全监测部", receive_org_id: 20, receive_user_id: 202,
    receive_org: "现场维修组", receive_role_key: "FIELD_WORKER",
    assignee_id: 202, priority: 1, status: "PROCESSING",
    current_node: "HANDLE", source_id: null, source_type: null,
    dispatch_time: "2024-03-08 09:00:00", accept_time: "2024-03-08 09:05:00",
    finish_time: null, check_time: null,
    create_time: "2024-03-08 09:00:00", update_time: "2024-03-08 09:05:00" },
]

// ── 导出函数 ──────────────────────────────────────────────────────────────────

/**
 * 一键清空所有表并写入固定演示种子数据（幂等）。
 */
export function resetDemo(): void {
  resetTables()
  setTable("iot_space",    SEED_SPACES)
  setTable("alarm_record", SEED_ALARMS)
  setTable("work_order",   SEED_WORK_ORDERS)
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
  const rows = getTable<object>("alarm_record")
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
 * 追加一条 B012 红色倾斜告警 + 配套 PENDING 工单。
 */
export function triggerRedAlert(options: RedAlertOptions = {}): void {
  const { nowStr = "2024-03-08 11:00:00" } = options
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

  // ─ work_order ─
  const orders = getTable<{ id?: number }>("work_order")
  const orderId = orders.length > 0
    ? Math.max(...orders.map((r) => r.id ?? 0)) + 1
    : 1
  setTable("work_order", [...orders, {
    id:              orderId,
    order_no:        `WO-TILT-${String(orderId).padStart(4, "0")}`,
    order_code:      `WO-TILT-${String(orderId).padStart(4, "0")}`,
    alarm_id:        "ALM-TILT-012",
    building_id:     1012,
    order_type:      "INSPECT",
    order_level:     "URGENT",
    alarm_level:     "RED",
    dispatch_type:   "ASSIGN",
    dispatch_org_id: 10,
    dispatch_user_id: 100,
    dispatch_org:    "安全监测部",
    receive_org_id:  20,
    receive_user_id: null,
    receive_org:     "现场维修组",
    receive_role_key: "FIELD_WORKER",
    assignee_id:     null,
    priority:        1,
    status:          "PENDING",
    current_node:    "DISPATCH",
    source_id:       null,
    source_type:     null,
    dispatch_time:   nowStr,
    accept_time:     null,
    finish_time:     null,
    check_time:      null,
    create_time:     nowStr,
    update_time:     nowStr,
  }])
}

// ── T15.67 triggerTimeoutSupervision ─────────────────────────────────────────

export interface SupervisionOptions {
  nowStr?: string
}

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

let _supSeq = 0

/**
 * 追加一条超时工单（dispatch_time 提前 200 min）+ 配套督办单。
 */
export function triggerTimeoutSupervision(options: SupervisionOptions = {}): void {
  const { nowStr = "2024-03-08 11:00:00" } = options
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
    from_org_id:      10,
    to_org_id:        20,
    source_type:      "WORK_ORDER",
    related_event_id: orderId,
    title:            `工单处理超时督办（${dispatchTs} 派单，累计超时）`,
    content:          "该工单已超过规定 SLA 时限（120 分钟），请及时处理。",
    level_code:       "GENERAL",
    status:           "ISSUED",
    issue_time:       nowStr,
    deadline:         _fmtTs(_parseTs(nowStr) + 24 * 60 * 60 * 1000),
  }])
}

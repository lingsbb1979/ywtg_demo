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

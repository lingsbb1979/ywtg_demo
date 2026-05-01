/**
 * T15.46 — 实现告警派单 dispatchAlarm
 *
 * 告警生成工单（写入 work_order），告警状态变为已派单（DISPATCHED）。
 *
 * 规则：
 *   1. 告警必须存在。
 *   2. 告警不能是 CLOSED 状态。
 *   3. 生成 work_order：alarm_id / building_id / alarm_level / status=PENDING / dispatch_time 等。
 *   4. alarm_record.status → DISPATCHED，update_time 更新。
 *   5. 返回新建工单 id 和告警更新结果。
 *
 * 测试范围：
 *   - dispatchAlarm 可从 alarmService 导入
 *   - 告警不存在时返回 { ok: false }
 *   - CLOSED 告警不可派单
 *   - 正常派单返回 { ok: true }
 *   - 返回包含 orderId（新工单 id）
 *   - 返回包含 alarmId（告警 id）
 *   - 派单后 alarm_record.status 变为 DISPATCHED
 *   - 派单后 alarm_record.update_time 被写入
 *   - work_order 新增一条记录
 *   - work_order.alarm_id = alarm_record.alarm_id
 *   - work_order.building_id = alarm_record.building_id
 *   - work_order.alarm_level = alarm_record.alarm_level
 *   - work_order.status = PENDING（待接单）
 *   - work_order.dispatch_time 非空
 *   - work_order.order_no 为非空字符串
 *   - 自定义 dispatchOrgId 时 work_order.dispatch_org_id = dispatchOrgId
 *   - 自定义 dispatchUserId 时 work_order.dispatch_user_id = dispatchUserId
 *   - 已是 DISPATCHED 状态告警不可重复派单
 *   - 派单只修改目标告警，不影响其他告警
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { setTable, getTable } from "../src/services/sqliteMirrorRepository"
import { seedBuildings } from "../src/mock/seeds/seedBuildings"

// ── fake localStorage ─────────────────────────────────────────────────────────

function createFakeStorage(): Storage {
  const store: Record<string, string> = {}
  return {
    getItem:    (k) => store[k] ?? null,
    setItem:    (k, v) => { store[k] = v },
    removeItem: (k) => { delete store[k] },
    clear:      () => { Object.keys(store).forEach((k) => delete store[k]) },
    get length() { return Object.keys(store).length },
    key:        (i) => Object.keys(store)[i] ?? null,
  } as Storage
}

beforeEach(() => {
  ;(globalThis as any).localStorage = createFakeStorage()
  seedBuildings()
})

afterEach(() => {
  delete (globalThis as any).localStorage
})

async function importService() {
  return import("../src/services/alarmService")
}

// ── 测试数据 ──────────────────────────────────────────────────────────────────

const ACTIVE_ALARM = {
  id: 1, alarm_id: "ALM-001", alarm_code: "CRACK-001",
  building_id: 1001, alarm_title: "裂缝超限告警",
  alarm_type: "CRACK", alarm_level: "ORANGE",
  status: "ACTIVE",
  trigger_time: "2024-03-08 10:00:00", create_time: "2024-03-08 10:00:00",
  handle_time: "2024-03-08 10:05:00", handle_user: "王五", update_time: "2024-03-08 10:05:00",
}

const PENDING_ALARM = {
  id: 2, alarm_id: "ALM-002", alarm_code: "TILT-001",
  building_id: 1002, alarm_title: "倾斜超限告警",
  alarm_type: "TILT", alarm_level: "RED",
  status: "PENDING",
  trigger_time: "2024-03-08 11:00:00", create_time: "2024-03-08 11:00:00",
  handle_time: null, handle_user: null, update_time: null,
}

const CLOSED_ALARM = {
  id: 3, alarm_id: "ALM-003", alarm_code: "SETTLE-001",
  building_id: 1003, alarm_title: "沉降异常告警",
  alarm_type: "SETTLE", alarm_level: "YELLOW",
  status: "CLOSED",
  trigger_time: "2024-03-07 09:00:00", create_time: "2024-03-07 09:00:00",
  handle_time: "2024-03-07 12:00:00", handle_user: "张三", update_time: "2024-03-07 12:00:00",
}

const DISPATCHED_ALARM = {
  id: 4, alarm_id: "ALM-004", alarm_code: "CRACK-002",
  building_id: 1001, alarm_title: "裂缝异常告警",
  alarm_type: "CRACK", alarm_level: "ORANGE",
  status: "DISPATCHED",
  trigger_time: "2024-03-09 08:00:00", create_time: "2024-03-09 08:00:00",
  handle_time: null, handle_user: null, update_time: null,
}

const OTHER_ALARM = {
  id: 5, alarm_id: "ALM-005", alarm_code: "CRACK-003",
  building_id: 1001, alarm_title: "另一裂缝告警",
  alarm_type: "CRACK", alarm_level: "YELLOW",
  status: "ACTIVE",
  trigger_time: "2024-03-09 09:00:00", create_time: "2024-03-09 09:00:00",
  handle_time: null, handle_user: null, update_time: null,
}

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.46 dispatchAlarm() — 导出", () => {
  it("dispatchAlarm 可从 alarmService 导入", async () => {
    const { dispatchAlarm } = await importService()
    expect(typeof dispatchAlarm).toBe("function")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.46 dispatchAlarm() — 错误处理", () => {
  beforeEach(() => setTable("alarm_record", [ACTIVE_ALARM]))

  it("告警不存在时返回 { ok: false }", async () => {
    const { dispatchAlarm } = await importService()
    expect(dispatchAlarm(9999).ok).toBe(false)
  })

  it("告警不存在时包含 error 字段", async () => {
    const { dispatchAlarm } = await importService()
    const r = dispatchAlarm(9999)
    expect(!r.ok && typeof r.error).toBe("string")
  })

  it("CLOSED 告警返回 { ok: false }", async () => {
    setTable("alarm_record", [CLOSED_ALARM])
    const { dispatchAlarm } = await importService()
    expect(dispatchAlarm(3).ok).toBe(false)
  })

  it("DISPATCHED 告警不可重复派单返回 { ok: false }", async () => {
    setTable("alarm_record", [DISPATCHED_ALARM])
    const { dispatchAlarm } = await importService()
    expect(dispatchAlarm(4).ok).toBe(false)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.46 dispatchAlarm() — 返回结构", () => {
  beforeEach(() => setTable("alarm_record", [ACTIVE_ALARM]))

  it("正常派单返回 ok=true", async () => {
    const { dispatchAlarm } = await importService()
    expect(dispatchAlarm(1).ok).toBe(true)
  })

  it("返回包含 orderId（数字）", async () => {
    const { dispatchAlarm } = await importService()
    const r = dispatchAlarm(1)
    expect(r.ok && typeof r.orderId).toBe("number")
  })

  it("返回包含 alarmId（alarm_record.alarm_id 字符串）", async () => {
    const { dispatchAlarm } = await importService()
    const r = dispatchAlarm(1)
    expect(r.ok && r.alarmId).toBe("ALM-001")
  })

  it("返回包含 orderNo（非空字符串）", async () => {
    const { dispatchAlarm } = await importService()
    const r = dispatchAlarm(1)
    if (!r.ok) throw new Error("should be ok")
    expect(typeof r.orderNo).toBe("string")
    expect(r.orderNo.length).toBeGreaterThan(0)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.46 dispatchAlarm() — 告警状态变更", () => {
  beforeEach(() => setTable("alarm_record", [ACTIVE_ALARM, OTHER_ALARM]))

  it("派单后 alarm_record.status 变为 DISPATCHED", async () => {
    const { dispatchAlarm } = await importService()
    dispatchAlarm(1)
    const rows = getTable<{ id: number; status: string }>("alarm_record")
    expect(rows.find((r) => r.id === 1)?.status).toBe("DISPATCHED")
  })

  it("派单后 alarm_record.update_time 被写入", async () => {
    const { dispatchAlarm } = await importService()
    dispatchAlarm(1)
    const rows = getTable<{ id: number; update_time: string }>("alarm_record")
    const ut = rows.find((r) => r.id === 1)?.update_time
    expect(typeof ut).toBe("string")
    expect((ut as string).length).toBeGreaterThan(0)
  })

  it("派单只修改目标告警，不影响其他告警", async () => {
    const { dispatchAlarm } = await importService()
    dispatchAlarm(1)
    const rows = getTable<{ id: number; status: string }>("alarm_record")
    expect(rows.find((r) => r.id === 5)?.status).toBe("ACTIVE")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.46 dispatchAlarm() — 工单创建", () => {
  beforeEach(() => setTable("alarm_record", [ACTIVE_ALARM, PENDING_ALARM]))

  it("派单后 work_order 新增一条记录", async () => {
    const { dispatchAlarm } = await importService()
    dispatchAlarm(1)
    const orders = getTable("work_order")
    expect(orders.length).toBe(1)
  })

  it("work_order.alarm_id = alarm_record.alarm_id", async () => {
    const { dispatchAlarm } = await importService()
    dispatchAlarm(1)
    const orders = getTable<{ alarm_id: string }>("work_order")
    expect(orders[0].alarm_id).toBe("ALM-001")
  })

  it("work_order.building_id = alarm_record.building_id", async () => {
    const { dispatchAlarm } = await importService()
    dispatchAlarm(1)
    const orders = getTable<{ building_id: number }>("work_order")
    expect(orders[0].building_id).toBe(1001)
  })

  it("work_order.alarm_level = alarm_record.alarm_level", async () => {
    const { dispatchAlarm } = await importService()
    dispatchAlarm(1)
    const orders = getTable<{ alarm_level: string }>("work_order")
    expect(orders[0].alarm_level).toBe("ORANGE")
  })

  it("work_order.status = PENDING（待接单）", async () => {
    const { dispatchAlarm } = await importService()
    dispatchAlarm(1)
    const orders = getTable<{ status: string }>("work_order")
    expect(orders[0].status).toBe("PENDING")
  })

  it("work_order.dispatch_time 非空字符串", async () => {
    const { dispatchAlarm } = await importService()
    dispatchAlarm(1)
    const orders = getTable<{ dispatch_time: string }>("work_order")
    expect(typeof orders[0].dispatch_time).toBe("string")
    expect(orders[0].dispatch_time.length).toBeGreaterThan(0)
  })

  it("work_order.order_no 为非空字符串", async () => {
    const { dispatchAlarm } = await importService()
    dispatchAlarm(1)
    const orders = getTable<{ order_no: string }>("work_order")
    expect(typeof orders[0].order_no).toBe("string")
    expect(orders[0].order_no.length).toBeGreaterThan(0)
  })

  it("两次派单（不同告警）生成两条工单", async () => {
    const { dispatchAlarm } = await importService()
    dispatchAlarm(1)
    dispatchAlarm(2)
    const orders = getTable("work_order")
    expect(orders.length).toBe(2)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.46 dispatchAlarm() — 派单参数选项", () => {
  beforeEach(() => setTable("alarm_record", [ACTIVE_ALARM]))

  it("自定义 dispatchOrgId 写入 work_order.dispatch_org_id", async () => {
    const { dispatchAlarm } = await importService()
    dispatchAlarm(1, { dispatchOrgId: 104 })
    const orders = getTable<{ dispatch_org_id: number }>("work_order")
    expect(orders[0].dispatch_org_id).toBe(104)
  })

  it("自定义 dispatchUserId 写入 work_order.dispatch_user_id", async () => {
    const { dispatchAlarm } = await importService()
    dispatchAlarm(1, { dispatchUserId: 201 })
    const orders = getTable<{ dispatch_user_id: number }>("work_order")
    expect(orders[0].dispatch_user_id).toBe(201)
  })
})

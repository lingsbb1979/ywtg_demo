/**
 * T15.52 — 实现 PC 核查通过 verifyWorkOrder
 *
 * 工单状态从 CHECKING 变为 FINISHED（已销号），写入核查时间，
 * 同时追加 work_order_log（node_type=CHECK），
 * 并同步关闭对应告警（alarm_record 状态→CLOSED）。
 *
 * 业务规则：
 *   - 只有 status=CHECKING 的工单可核查通过
 *   - 非 CHECKING 状态返回 { ok: false, error }
 *   - id 不存在返回 { ok: false, error }
 *   - 核查后 status=FINISHED, current_node=DONE, check_time 写入
 *   - 若工单有 alarm_id，对应 alarm_record 状态→CLOSED
 *   - alarm_id 无对应 alarm_record 时不报错（静默跳过）
 *
 * 测试范围：
 *   - verifyWorkOrder 可从 workOrderService 导入
 *   - 正常核查返回 ok=true
 *   - 核查后 status=FINISHED
 *   - 核查后 current_node=DONE
 *   - check_time 写入（来自 options.checkTime 或自动生成）
 *   - update_time 更新
 *   - 追加 work_order_log（node_type=CHECK, order_id=工单id）
 *   - log.operator 来自 options.operator
 *   - alarm_record 状态变为 CLOSED
 *   - alarm_id 无对应 alarm_record 时不报错，工单正常关闭
 *   - alarm_id 为 null 时不影响工单关闭
 *   - 非 CHECKING 状态返回 ok=false
 *   - id 不存在返回 ok=false
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { getTable, setTable } from "../src/services/sqliteMirrorRepository"

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
  setTable("work_order_log", [])
  setTable("alarm_record", [])
})

afterEach(() => {
  delete (globalThis as any).localStorage
})

async function importService() {
  return import("../src/services/workOrderService")
}

// ── 测试数据 ──────────────────────────────────────────────────────────────────

const CHECKING_ORDER = {
  id: 101, order_no: "WO-20240308-0001", order_code: "WO-20240308-0001",
  alarm_id: "ALM-001", building_id: 1001,
  order_level: "ORANGE", alarm_level: "ORANGE",
  status: "CHECKING", current_node: "CHECK",
  dispatch_time: "2024-03-08 10:10:00",
  accept_time: "2024-03-08 10:30:00",
  finish_time: "2024-03-08 11:30:00",
  check_time: null,
  create_time: "2024-03-08 10:10:00", update_time: "2024-03-08 11:30:00",
}

const ALARM_ROW = {
  id: 1, alarm_id: "ALM-001", alarm_title: "裂缝超限告警",
  building_id: 1001, alarm_level: "ORANGE", status: "DISPATCHED",
  trigger_time: "2024-03-08 09:00:00",
}

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.52 verifyWorkOrder() — 导出", () => {
  it("verifyWorkOrder 可从 workOrderService 导入", async () => {
    const { verifyWorkOrder } = await importService()
    expect(typeof verifyWorkOrder).toBe("function")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.52 verifyWorkOrder() — 正常核查", () => {
  beforeEach(() => {
    setTable("work_order", [CHECKING_ORDER])
    setTable("alarm_record", [ALARM_ROW])
  })

  it("返回 ok=true", async () => {
    const { verifyWorkOrder } = await importService()
    expect(verifyWorkOrder(101).ok).toBe(true)
  })

  it("核查后 status=FINISHED", async () => {
    const { verifyWorkOrder } = await importService()
    verifyWorkOrder(101)
    const rows = getTable<{ id: number; status: string }>("work_order")
    expect(rows.find((r) => r.id === 101)!.status).toBe("FINISHED")
  })

  it("核查后 current_node=DONE", async () => {
    const { verifyWorkOrder } = await importService()
    verifyWorkOrder(101)
    const rows = getTable<{ id: number; current_node: string }>("work_order")
    expect(rows.find((r) => r.id === 101)!.current_node).toBe("DONE")
  })

  it("check_time 写入 options.checkTime", async () => {
    const { verifyWorkOrder } = await importService()
    verifyWorkOrder(101, { checkTime: "2024-03-08 14:00:00" })
    const rows = getTable<{ id: number; check_time: string }>("work_order")
    expect(rows.find((r) => r.id === 101)!.check_time).toBe("2024-03-08 14:00:00")
  })

  it("check_time 缺省时自动生成非空字符串", async () => {
    const { verifyWorkOrder } = await importService()
    verifyWorkOrder(101)
    const rows = getTable<{ id: number; check_time: string }>("work_order")
    expect(typeof rows.find((r) => r.id === 101)!.check_time).toBe("string")
  })

  it("update_time 更新", async () => {
    const { verifyWorkOrder } = await importService()
    verifyWorkOrder(101, { checkTime: "2024-03-08 14:00:00" })
    const rows = getTable<{ id: number; update_time: string }>("work_order")
    expect(rows.find((r) => r.id === 101)!.update_time).toBe("2024-03-08 14:00:00")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.52 verifyWorkOrder() — work_order_log 写入", () => {
  beforeEach(() => {
    setTable("work_order", [CHECKING_ORDER])
    setTable("alarm_record", [ALARM_ROW])
  })

  it("追加 work_order_log 1 条", async () => {
    const { verifyWorkOrder } = await importService()
    verifyWorkOrder(101)
    expect(getTable("work_order_log").length).toBe(1)
  })

  it("log.node_type=CHECK", async () => {
    const { verifyWorkOrder } = await importService()
    verifyWorkOrder(101)
    const logs = getTable<{ node_type: string }>("work_order_log")
    expect(logs[0].node_type).toBe("CHECK")
  })

  it("log.order_id=101", async () => {
    const { verifyWorkOrder } = await importService()
    verifyWorkOrder(101)
    const logs = getTable<{ order_id: number }>("work_order_log")
    expect(logs[0].order_id).toBe(101)
  })

  it("log.operator 来自 options.operator", async () => {
    const { verifyWorkOrder } = await importService()
    verifyWorkOrder(101, { operator: "王五", operatorId: 301 })
    const logs = getTable<{ operator: string }>("work_order_log")
    expect(logs[0].operator).toBe("王五")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.52 verifyWorkOrder() — 关联告警关闭", () => {
  it("alarm_record 状态变为 CLOSED", async () => {
    setTable("work_order", [CHECKING_ORDER])
    setTable("alarm_record", [ALARM_ROW])
    const { verifyWorkOrder } = await importService()
    verifyWorkOrder(101)
    const alarms = getTable<{ alarm_id: string; status: string }>("alarm_record")
    expect(alarms.find((a) => a.alarm_id === "ALM-001")!.status).toBe("CLOSED")
  })

  it("alarm_id 无对应 alarm_record 时不报错，工单正常关闭", async () => {
    setTable("work_order", [CHECKING_ORDER])
    setTable("alarm_record", []) // 无对应告警
    const { verifyWorkOrder } = await importService()
    const result = verifyWorkOrder(101)
    expect(result.ok).toBe(true)
    const rows = getTable<{ id: number; status: string }>("work_order")
    expect(rows.find((r) => r.id === 101)!.status).toBe("FINISHED")
  })

  it("alarm_id 为 null 时工单正常关闭", async () => {
    setTable("work_order", [{ ...CHECKING_ORDER, alarm_id: null }])
    setTable("alarm_record", [ALARM_ROW])
    const { verifyWorkOrder } = await importService()
    const result = verifyWorkOrder(101)
    expect(result.ok).toBe(true)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.52 verifyWorkOrder() — 异常场景", () => {
  it("id 不存在返回 ok=false", async () => {
    setTable("work_order", [CHECKING_ORDER])
    const { verifyWorkOrder } = await importService()
    expect(verifyWorkOrder(9999).ok).toBe(false)
  })

  it("id 不存在时 error 字段非空", async () => {
    setTable("work_order", [CHECKING_ORDER])
    const { verifyWorkOrder } = await importService()
    expect(typeof verifyWorkOrder(9999).error).toBe("string")
  })

  it("status=PENDING 时返回 ok=false", async () => {
    setTable("work_order", [{ ...CHECKING_ORDER, status: "PENDING" }])
    const { verifyWorkOrder } = await importService()
    expect(verifyWorkOrder(101).ok).toBe(false)
  })

  it("status=PROCESSING 时返回 ok=false", async () => {
    setTable("work_order", [{ ...CHECKING_ORDER, status: "PROCESSING" }])
    const { verifyWorkOrder } = await importService()
    expect(verifyWorkOrder(101).ok).toBe(false)
  })

  it("status=FINISHED 时返回 ok=false", async () => {
    setTable("work_order", [{ ...CHECKING_ORDER, status: "FINISHED" }])
    const { verifyWorkOrder } = await importService()
    expect(verifyWorkOrder(101).ok).toBe(false)
  })

  it("非 CHECKING 时 work_order 状态不变", async () => {
    setTable("work_order", [{ ...CHECKING_ORDER, status: "PROCESSING" }])
    const { verifyWorkOrder } = await importService()
    verifyWorkOrder(101)
    const rows = getTable<{ status: string }>("work_order")
    expect(rows[0].status).toBe("PROCESSING")
  })
})

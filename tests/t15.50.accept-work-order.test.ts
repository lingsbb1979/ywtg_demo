/**
 * T15.50 — 实现 H5 接单 acceptWorkOrder
 *
 * 工单状态从 PENDING 变为 PROCESSING，写入接单时间和操作人，
 * 同时追加一条 work_order_log（node_type=ACCEPT）。
 *
 * 业务规则：
 *   - 只有 status=PENDING 的工单可接单
 *   - 非 PENDING 状态返回 { ok: false, error }
 *   - id 不存在返回 { ok: false, error }
 *   - 接单后 status=PROCESSING, current_node=HANDLE, accept_time 写入
 *
 * 测试范围：
 *   - acceptWorkOrder 可从 workOrderService 导入
 *   - 正常接单返回 ok=true
 *   - 接单后 status=PROCESSING
 *   - 接单后 current_node=HANDLE
 *   - accept_time 写入（来自 payload.acceptTime 或自动生成）
 *   - update_time 更新
 *   - 追加 work_order_log（node_type=ACCEPT, order_id=工单id）
 *   - log.operator 来自 payload.operator
 *   - 非 PENDING 状态返回 ok=false 并包含 error 信息
 *   - id 不存在返回 ok=false
 *   - PROCESSING / CHECKING / FINISHED 状态均不可接单
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
})

afterEach(() => {
  delete (globalThis as any).localStorage
})

async function importService() {
  return import("../src/services/workOrderService")
}

// ── 测试数据 ──────────────────────────────────────────────────────────────────

const PENDING_ORDER = {
  id: 101, order_no: "WO-20240308-0001", order_code: "WO-20240308-0001",
  alarm_id: "ALM-001", building_id: 1001,
  order_level: "ORANGE", alarm_level: "ORANGE",
  status: "PENDING", current_node: "DISPATCH",
  dispatch_time: "2024-03-08 10:10:00", accept_time: null,
  create_time: "2024-03-08 10:10:00", update_time: "2024-03-08 10:10:00",
}

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.50 acceptWorkOrder() — 导出", () => {
  it("acceptWorkOrder 可从 workOrderService 导入", async () => {
    const { acceptWorkOrder } = await importService()
    expect(typeof acceptWorkOrder).toBe("function")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.50 acceptWorkOrder() — 正常接单", () => {
  beforeEach(() => setTable("work_order", [PENDING_ORDER]))

  it("返回 ok=true", async () => {
    const { acceptWorkOrder } = await importService()
    expect(acceptWorkOrder(101).ok).toBe(true)
  })

  it("接单后 status=PROCESSING", async () => {
    const { acceptWorkOrder } = await importService()
    acceptWorkOrder(101)
    const rows = getTable<{ id: number; status: string }>("work_order")
    expect(rows.find((r) => r.id === 101)!.status).toBe("PROCESSING")
  })

  it("接单后 current_node=HANDLE", async () => {
    const { acceptWorkOrder } = await importService()
    acceptWorkOrder(101)
    const rows = getTable<{ id: number; current_node: string }>("work_order")
    expect(rows.find((r) => r.id === 101)!.current_node).toBe("HANDLE")
  })

  it("accept_time 写入 payload.acceptTime", async () => {
    const { acceptWorkOrder } = await importService()
    acceptWorkOrder(101, { acceptTime: "2024-03-08 10:30:00" })
    const rows = getTable<{ id: number; accept_time: string }>("work_order")
    expect(rows.find((r) => r.id === 101)!.accept_time).toBe("2024-03-08 10:30:00")
  })

  it("accept_time 缺省时自动生成非空字符串", async () => {
    const { acceptWorkOrder } = await importService()
    acceptWorkOrder(101)
    const rows = getTable<{ id: number; accept_time: string }>("work_order")
    expect(typeof rows.find((r) => r.id === 101)!.accept_time).toBe("string")
    expect((rows.find((r) => r.id === 101)!.accept_time ?? "").length).toBeGreaterThan(0)
  })

  it("update_time 更新", async () => {
    const { acceptWorkOrder } = await importService()
    acceptWorkOrder(101, { acceptTime: "2024-03-08 10:30:00" })
    const rows = getTable<{ id: number; update_time: string }>("work_order")
    expect(rows.find((r) => r.id === 101)!.update_time).toBe("2024-03-08 10:30:00")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.50 acceptWorkOrder() — work_order_log", () => {
  beforeEach(() => setTable("work_order", [PENDING_ORDER]))

  it("追加 work_order_log 1 条", async () => {
    const { acceptWorkOrder } = await importService()
    acceptWorkOrder(101)
    expect(getTable("work_order_log").length).toBe(1)
  })

  it("log.node_type=ACCEPT", async () => {
    const { acceptWorkOrder } = await importService()
    acceptWorkOrder(101)
    const logs = getTable<{ node_type: string }>("work_order_log")
    expect(logs[0].node_type).toBe("ACCEPT")
  })

  it("log.order_id=101", async () => {
    const { acceptWorkOrder } = await importService()
    acceptWorkOrder(101)
    const logs = getTable<{ order_id: number }>("work_order_log")
    expect(logs[0].order_id).toBe(101)
  })

  it("log.operator 来自 payload.operator", async () => {
    const { acceptWorkOrder } = await importService()
    acceptWorkOrder(101, { operator: "李四", operatorId: 201 })
    const logs = getTable<{ operator: string }>("work_order_log")
    expect(logs[0].operator).toBe("李四")
  })

  it("log.operator_id 来自 payload.operatorId", async () => {
    const { acceptWorkOrder } = await importService()
    acceptWorkOrder(101, { operator: "李四", operatorId: 201 })
    const logs = getTable<{ operator_id: number }>("work_order_log")
    expect(logs[0].operator_id).toBe(201)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.50 acceptWorkOrder() — 异常场景", () => {
  it("id 不存在返回 ok=false", async () => {
    setTable("work_order", [PENDING_ORDER])
    const { acceptWorkOrder } = await importService()
    expect(acceptWorkOrder(9999).ok).toBe(false)
  })

  it("id 不存在时 error 字段非空", async () => {
    setTable("work_order", [PENDING_ORDER])
    const { acceptWorkOrder } = await importService()
    expect(typeof acceptWorkOrder(9999).error).toBe("string")
  })

  it("status=PROCESSING 时返回 ok=false", async () => {
    setTable("work_order", [{ ...PENDING_ORDER, status: "PROCESSING" }])
    const { acceptWorkOrder } = await importService()
    expect(acceptWorkOrder(101).ok).toBe(false)
  })

  it("status=CHECKING 时返回 ok=false", async () => {
    setTable("work_order", [{ ...PENDING_ORDER, status: "CHECKING" }])
    const { acceptWorkOrder } = await importService()
    expect(acceptWorkOrder(101).ok).toBe(false)
  })

  it("status=FINISHED 时返回 ok=false", async () => {
    setTable("work_order", [{ ...PENDING_ORDER, status: "FINISHED" }])
    const { acceptWorkOrder } = await importService()
    expect(acceptWorkOrder(101).ok).toBe(false)
  })

  it("非 PENDING 时 work_order 表不变", async () => {
    setTable("work_order", [{ ...PENDING_ORDER, status: "PROCESSING" }])
    const { acceptWorkOrder } = await importService()
    acceptWorkOrder(101)
    const rows = getTable<{ status: string }>("work_order")
    expect(rows[0].status).toBe("PROCESSING")
  })

  it("非 PENDING 时 work_order_log 不写入", async () => {
    setTable("work_order", [{ ...PENDING_ORDER, status: "PROCESSING" }])
    const { acceptWorkOrder } = await importService()
    acceptWorkOrder(101)
    expect(getTable("work_order_log").length).toBe(0)
  })
})

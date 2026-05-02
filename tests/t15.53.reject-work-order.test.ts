/**
 * T15.53 — 实现 PC 退回重办 rejectWorkOrder
 *
 * 工单状态从 CHECKING 退回为 PROCESSING，写入退回原因，
 * 同时追加一条 work_order_log（node_type=REJECT）。
 *
 * 业务规则：
 *   - 只有 status=CHECKING 的工单可退回
 *   - 非 CHECKING 状态返回 { ok: false, error }
 *   - id 不存在返回 { ok: false, error }
 *   - 退回后 status=PROCESSING, current_node=HANDLE
 *   - finish_time 清空（null），update_time 更新
 *
 * 测试范围：
 *   - rejectWorkOrder 可从 workOrderService 导入
 *   - 正常退回返回 ok=true
 *   - 退回后 status=PROCESSING
 *   - 退回后 current_node=HANDLE
 *   - finish_time 清空为 null
 *   - update_time 更新
 *   - 追加 work_order_log（node_type=REJECT, order_id=工单id）
 *   - log.remark 来自 options.rejectReason
 *   - log.operator 来自 options.operator
 *   - 非 CHECKING 状态返回 ok=false
 *   - id 不存在返回 ok=false
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { getTable, setTable } from "../src/services/sqliteMirrorRepository"

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

const CHECKING_ORDER = {
  id: 101, order_no: "WO-20240308-0001",
  alarm_id: "ALM-001", building_id: 1001,
  status: "CHECKING", current_node: "CHECK",
  dispatch_time: "2024-03-08 10:10:00",
  accept_time:   "2024-03-08 10:30:00",
  finish_time:   "2024-03-08 11:30:00",
  check_time: null,
  create_time: "2024-03-08 10:10:00", update_time: "2024-03-08 11:30:00",
}

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.53 rejectWorkOrder() — 导出", () => {
  it("rejectWorkOrder 可从 workOrderService 导入", async () => {
    const { rejectWorkOrder } = await importService()
    expect(typeof rejectWorkOrder).toBe("function")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.53 rejectWorkOrder() — 正常退回", () => {
  beforeEach(() => setTable("work_order", [CHECKING_ORDER]))

  it("返回 ok=true", async () => {
    const { rejectWorkOrder } = await importService()
    expect(rejectWorkOrder(101, { rejectReason: "现场问题未彻底处理" }).ok).toBe(true)
  })

  it("退回后 status=PROCESSING", async () => {
    const { rejectWorkOrder } = await importService()
    rejectWorkOrder(101, { rejectReason: "需要补充证据" })
    const rows = getTable<{ id: number; status: string }>("work_order")
    expect(rows.find((r) => r.id === 101)!.status).toBe("PROCESSING")
  })

  it("退回后 current_node=HANDLE", async () => {
    const { rejectWorkOrder } = await importService()
    rejectWorkOrder(101, { rejectReason: "需要补充证据" })
    const rows = getTable<{ id: number; current_node: string }>("work_order")
    expect(rows.find((r) => r.id === 101)!.current_node).toBe("HANDLE")
  })

  it("finish_time 清空为 null", async () => {
    const { rejectWorkOrder } = await importService()
    rejectWorkOrder(101, { rejectReason: "需要补充证据" })
    const rows = getTable<{ id: number; finish_time: string | null }>("work_order")
    expect(rows.find((r) => r.id === 101)!.finish_time).toBeNull()
  })

  it("update_time 更新", async () => {
    const { rejectWorkOrder } = await importService()
    rejectWorkOrder(101, { rejectTime: "2024-03-08 15:00:00", rejectReason: "问题未解决" })
    const rows = getTable<{ id: number; update_time: string }>("work_order")
    expect(rows.find((r) => r.id === 101)!.update_time).toBe("2024-03-08 15:00:00")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.53 rejectWorkOrder() — work_order_log 写入", () => {
  beforeEach(() => setTable("work_order", [CHECKING_ORDER]))

  it("追加 work_order_log 1 条", async () => {
    const { rejectWorkOrder } = await importService()
    rejectWorkOrder(101, { rejectReason: "未处理到位" })
    expect(getTable("work_order_log").length).toBe(1)
  })

  it("log.node_type=REJECT", async () => {
    const { rejectWorkOrder } = await importService()
    rejectWorkOrder(101, { rejectReason: "未处理到位" })
    const logs = getTable<{ node_type: string }>("work_order_log")
    expect(logs[0].node_type).toBe("REJECT")
  })

  it("log.order_id=101", async () => {
    const { rejectWorkOrder } = await importService()
    rejectWorkOrder(101, { rejectReason: "未处理到位" })
    const logs = getTable<{ order_id: number }>("work_order_log")
    expect(logs[0].order_id).toBe(101)
  })

  it("log.remark 来自 options.rejectReason", async () => {
    const { rejectWorkOrder } = await importService()
    rejectWorkOrder(101, { rejectReason: "裂缝未完全封堵" })
    const logs = getTable<{ remark: string }>("work_order_log")
    expect(logs[0].remark).toBe("裂缝未完全封堵")
  })

  it("log.operator 来自 options.operator", async () => {
    const { rejectWorkOrder } = await importService()
    rejectWorkOrder(101, { rejectReason: "未处理到位", operator: "王五", operatorId: 301 })
    const logs = getTable<{ operator: string }>("work_order_log")
    expect(logs[0].operator).toBe("王五")
  })

  it("log.operator_id 来自 options.operatorId", async () => {
    const { rejectWorkOrder } = await importService()
    rejectWorkOrder(101, { rejectReason: "未处理到位", operator: "王五", operatorId: 301 })
    const logs = getTable<{ operator_id: number }>("work_order_log")
    expect(logs[0].operator_id).toBe(301)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.53 rejectWorkOrder() — 异常场景", () => {
  it("id 不存在返回 ok=false", async () => {
    setTable("work_order", [CHECKING_ORDER])
    const { rejectWorkOrder } = await importService()
    expect(rejectWorkOrder(9999, { rejectReason: "原因" }).ok).toBe(false)
  })

  it("id 不存在时 error 字段非空", async () => {
    setTable("work_order", [CHECKING_ORDER])
    const { rejectWorkOrder } = await importService()
    expect(typeof rejectWorkOrder(9999, { rejectReason: "原因" }).error).toBe("string")
  })

  it("status=PENDING 时返回 ok=false", async () => {
    setTable("work_order", [{ ...CHECKING_ORDER, status: "PENDING" }])
    const { rejectWorkOrder } = await importService()
    expect(rejectWorkOrder(101, { rejectReason: "原因" }).ok).toBe(false)
  })

  it("status=PROCESSING 时返回 ok=false", async () => {
    setTable("work_order", [{ ...CHECKING_ORDER, status: "PROCESSING" }])
    const { rejectWorkOrder } = await importService()
    expect(rejectWorkOrder(101, { rejectReason: "原因" }).ok).toBe(false)
  })

  it("status=FINISHED 时返回 ok=false", async () => {
    setTable("work_order", [{ ...CHECKING_ORDER, status: "FINISHED" }])
    const { rejectWorkOrder } = await importService()
    expect(rejectWorkOrder(101, { rejectReason: "原因" }).ok).toBe(false)
  })

  it("非 CHECKING 时 work_order 状态不变", async () => {
    setTable("work_order", [{ ...CHECKING_ORDER, status: "PROCESSING" }])
    const { rejectWorkOrder } = await importService()
    rejectWorkOrder(101, { rejectReason: "原因" })
    const rows = getTable<{ status: string }>("work_order")
    expect(rows[0].status).toBe("PROCESSING")
  })

  it("非 CHECKING 时 work_order_log 不写入", async () => {
    setTable("work_order", [{ ...CHECKING_ORDER, status: "PROCESSING" }])
    const { rejectWorkOrder } = await importService()
    rejectWorkOrder(101, { rejectReason: "原因" })
    expect(getTable("work_order_log").length).toBe(0)
  })
})

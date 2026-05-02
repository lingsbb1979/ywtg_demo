/**
 * T15.49 — 实现工单创建 createWorkOrder
 *
 * 写入 work_order（status=PENDING, current_node=DISPATCH）以及
 * 第一条 work_order_log（node_type=DISPATCH）。
 * id 自动取 max+1，orderNo 格式 WO-YYYYMMDDHHmmss-XXXX。
 *
 * 测试范围：
 *   - createWorkOrder 可从 workOrderService 导入
 *   - 返回 { ok, orderId, orderNo }
 *   - work_order 表增加 1 条记录
 *   - 新工单 status=PENDING / current_node=DISPATCH
 *   - alarm_id / building_id / alarm_level / dispatchOrgId / receiveOrgId 写入
 *   - dispatch_time 来自 payload；缺省时自动生成
 *   - 写入 work_order_log 1 条（node_type=DISPATCH, order_id=新工单 id）
 *   - log.operator 来自 payload.operator
 *   - 已有工单时新 id = max + 1
 *   - alarmId 为 null 时也能创建（手动工单）
 *   - receiveRoleKey 写入 work_order
 *   - source_type=ALARM 当 alarmId 不为空
 *   - source_type=null 当 alarmId 为 null
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
  setTable("work_order", [])
  setTable("work_order_log", [])
})

afterEach(() => {
  delete (globalThis as any).localStorage
})

async function importService() {
  return import("../src/services/workOrderService")
}

// ── 公共 payload ──────────────────────────────────────────────────────────────

const BASE_PAYLOAD = {
  alarmId:        "ALM-001",
  buildingId:     1001,
  alarmLevel:     "ORANGE",
  orderLevel:     "ORANGE",
  orderType:      "CRACK",
  dispatchOrgId:  104,
  dispatchUserId: null,
  receiveOrgId:   105,
  receiveRoleKey: "maintain_worker",
  dispatchTime:   "2024-03-08 10:10:00",
  operator:       "张三",
  operatorId:     301,
}

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.49 createWorkOrder() — 导出", () => {
  it("createWorkOrder 可从 workOrderService 导入", async () => {
    const { createWorkOrder } = await importService()
    expect(typeof createWorkOrder).toBe("function")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.49 createWorkOrder() — 返回值", () => {
  it("返回 ok=true", async () => {
    const { createWorkOrder } = await importService()
    expect(createWorkOrder(BASE_PAYLOAD).ok).toBe(true)
  })

  it("返回 orderId（数字）", async () => {
    const { createWorkOrder } = await importService()
    expect(typeof createWorkOrder(BASE_PAYLOAD).orderId).toBe("number")
  })

  it("返回 orderNo（字符串）", async () => {
    const { createWorkOrder } = await importService()
    expect(typeof createWorkOrder(BASE_PAYLOAD).orderNo).toBe("string")
  })

  it("orderNo 包含 WO- 前缀", async () => {
    const { createWorkOrder } = await importService()
    expect(createWorkOrder(BASE_PAYLOAD).orderNo.startsWith("WO-")).toBe(true)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.49 createWorkOrder() — work_order 表写入", () => {
  it("work_order 表新增 1 条记录", async () => {
    const { createWorkOrder } = await importService()
    createWorkOrder(BASE_PAYLOAD)
    expect(getTable("work_order").length).toBe(1)
  })

  it("新工单 status=PENDING", async () => {
    const { createWorkOrder } = await importService()
    createWorkOrder(BASE_PAYLOAD)
    const rows = getTable<{ status: string }>("work_order")
    expect(rows[0].status).toBe("PENDING")
  })

  it("新工单 current_node=DISPATCH", async () => {
    const { createWorkOrder } = await importService()
    createWorkOrder(BASE_PAYLOAD)
    const rows = getTable<{ current_node: string }>("work_order")
    expect(rows[0].current_node).toBe("DISPATCH")
  })

  it("alarm_id 写入 payload.alarmId", async () => {
    const { createWorkOrder } = await importService()
    createWorkOrder(BASE_PAYLOAD)
    const rows = getTable<{ alarm_id: string }>("work_order")
    expect(rows[0].alarm_id).toBe("ALM-001")
  })

  it("building_id 写入 payload.buildingId", async () => {
    const { createWorkOrder } = await importService()
    createWorkOrder(BASE_PAYLOAD)
    const rows = getTable<{ building_id: number }>("work_order")
    expect(rows[0].building_id).toBe(1001)
  })

  it("alarm_level 写入 payload.alarmLevel", async () => {
    const { createWorkOrder } = await importService()
    createWorkOrder(BASE_PAYLOAD)
    const rows = getTable<{ alarm_level: string }>("work_order")
    expect(rows[0].alarm_level).toBe("ORANGE")
  })

  it("order_level 写入 payload.orderLevel", async () => {
    const { createWorkOrder } = await importService()
    createWorkOrder(BASE_PAYLOAD)
    const rows = getTable<{ order_level: string }>("work_order")
    expect(rows[0].order_level).toBe("ORANGE")
  })

  it("dispatch_org_id 写入 payload.dispatchOrgId", async () => {
    const { createWorkOrder } = await importService()
    createWorkOrder(BASE_PAYLOAD)
    const rows = getTable<{ dispatch_org_id: number }>("work_order")
    expect(rows[0].dispatch_org_id).toBe(104)
  })

  it("receive_org_id 写入 payload.receiveOrgId", async () => {
    const { createWorkOrder } = await importService()
    createWorkOrder(BASE_PAYLOAD)
    const rows = getTable<{ receive_org_id: number }>("work_order")
    expect(rows[0].receive_org_id).toBe(105)
  })

  it("receive_role_key 写入 payload.receiveRoleKey", async () => {
    const { createWorkOrder } = await importService()
    createWorkOrder(BASE_PAYLOAD)
    const rows = getTable<{ receive_role_key: string }>("work_order")
    expect(rows[0].receive_role_key).toBe("maintain_worker")
  })

  it("dispatch_time 写入 payload.dispatchTime", async () => {
    const { createWorkOrder } = await importService()
    createWorkOrder(BASE_PAYLOAD)
    const rows = getTable<{ dispatch_time: string }>("work_order")
    expect(rows[0].dispatch_time).toBe("2024-03-08 10:10:00")
  })

  it("source_type=ALARM 当 alarmId 不为空", async () => {
    const { createWorkOrder } = await importService()
    createWorkOrder(BASE_PAYLOAD)
    const rows = getTable<{ source_type: string }>("work_order")
    expect(rows[0].source_type).toBe("ALARM")
  })

  it("source_type=null 当 alarmId 为 null", async () => {
    const { createWorkOrder } = await importService()
    createWorkOrder({ ...BASE_PAYLOAD, alarmId: null })
    const rows = getTable<{ source_type: string | null }>("work_order")
    expect(rows[0].source_type).toBeNull()
  })

  it("dispatchTime 缺省时自动生成非空字符串", async () => {
    const { createWorkOrder } = await importService()
    const payload = { ...BASE_PAYLOAD }
    delete (payload as any).dispatchTime
    createWorkOrder(payload)
    const rows = getTable<{ dispatch_time: string }>("work_order")
    expect(typeof rows[0].dispatch_time).toBe("string")
    expect(rows[0].dispatch_time.length).toBeGreaterThan(0)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.49 createWorkOrder() — work_order_log 写入", () => {
  it("写入 work_order_log 1 条记录", async () => {
    const { createWorkOrder } = await importService()
    createWorkOrder(BASE_PAYLOAD)
    expect(getTable("work_order_log").length).toBe(1)
  })

  it("log.node_type=DISPATCH", async () => {
    const { createWorkOrder } = await importService()
    createWorkOrder(BASE_PAYLOAD)
    const logs = getTable<{ node_type: string }>("work_order_log")
    expect(logs[0].node_type).toBe("DISPATCH")
  })

  it("log.order_id 等于新工单 id", async () => {
    const { createWorkOrder } = await importService()
    const result = createWorkOrder(BASE_PAYLOAD)
    const logs = getTable<{ order_id: number }>("work_order_log")
    expect(logs[0].order_id).toBe(result.orderId)
  })

  it("log.operator 来自 payload.operator", async () => {
    const { createWorkOrder } = await importService()
    createWorkOrder(BASE_PAYLOAD)
    const logs = getTable<{ operator: string }>("work_order_log")
    expect(logs[0].operator).toBe("张三")
  })

  it("log.operator_id 来自 payload.operatorId", async () => {
    const { createWorkOrder } = await importService()
    createWorkOrder(BASE_PAYLOAD)
    const logs = getTable<{ operator_id: number }>("work_order_log")
    expect(logs[0].operator_id).toBe(301)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.49 createWorkOrder() — id 自增", () => {
  it("空表时第一条 id=1", async () => {
    const { createWorkOrder } = await importService()
    const result = createWorkOrder(BASE_PAYLOAD)
    expect(result.orderId).toBe(1)
  })

  it("已有工单时新 id = max + 1", async () => {
    setTable("work_order", [
      { id: 5, status: "FINISHED" },
      { id: 2, status: "PENDING" },
    ])
    const { createWorkOrder } = await importService()
    const result = createWorkOrder(BASE_PAYLOAD)
    expect(result.orderId).toBe(6)
  })

  it("连续创建两次 id 不同", async () => {
    const { createWorkOrder } = await importService()
    const r1 = createWorkOrder(BASE_PAYLOAD)
    const r2 = createWorkOrder(BASE_PAYLOAD)
    expect(r1.orderId).not.toBe(r2.orderId)
  })
})

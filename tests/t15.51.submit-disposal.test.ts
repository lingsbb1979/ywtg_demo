/**
 * T15.51 — 实现 H5 提交处置 submitDisposal
 *
 * 写入 work_order_disposal，工单状态变为 CHECKING（待核查），
 * 同时追加一条 work_order_log（node_type=FINISH）。
 *
 * 业务规则：
 *   - 只有 status=PROCESSING 的工单可提交处置
 *   - 非 PROCESSING 状态返回 { ok: false, error }
 *   - id 不存在返回 { ok: false, error }
 *   - 提交后 status=CHECKING, current_node=CHECK, finish_time 写入
 *
 * 测试范围：
 *   - submitDisposal 可从 workOrderService 导入
 *   - 正常提交返回 ok=true
 *   - 提交后 status=CHECKING
 *   - 提交后 current_node=CHECK
 *   - finish_time 写入（来自 payload.disposalTime 或自动生成）
 *   - update_time 更新
 *   - work_order_disposal 新增 1 条记录
 *   - disposal.order_id=工单id
 *   - disposal.disposal_desc 来自 payload.disposalDesc
 *   - disposal.image_urls 来自 payload.imageUrls
 *   - disposal.gps_location 来自 payload.gpsLocation
 *   - disposal.user_id 来自 payload.userId
 *   - 追加 work_order_log（node_type=FINISH, order_id=工单id）
 *   - 非 PROCESSING 状态返回 ok=false
 *   - id 不存在返回 ok=false
 *   - PENDING / CHECKING / FINISHED 状态均不可提交处置
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
  setTable("work_order_disposal", [])
})

afterEach(() => {
  delete (globalThis as any).localStorage
})

async function importService() {
  return import("../src/services/workOrderService")
}

// ── 测试数据 ──────────────────────────────────────────────────────────────────

const PROCESSING_ORDER = {
  id: 101, order_no: "WO-20240308-0001", order_code: "WO-20240308-0001",
  alarm_id: "ALM-001", building_id: 1001,
  order_level: "ORANGE", alarm_level: "ORANGE",
  status: "PROCESSING", current_node: "HANDLE",
  dispatch_time: "2024-03-08 10:10:00",
  accept_time: "2024-03-08 10:30:00",
  finish_time: null,
  create_time: "2024-03-08 10:10:00", update_time: "2024-03-08 10:30:00",
}

const BASE_PAYLOAD = {
  disposalDesc: "已对裂缝进行临时封堵处理",
  imageUrls:    '["img1.jpg","img2.jpg"]',
  gpsLocation:  "31.2304,121.4737",
  addressDesc:  "南侧外墙",
  userId:       201,
  disposalTime: "2024-03-08 11:30:00",
  operator:     "李四",
  operatorId:   201,
}

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.51 submitDisposal() — 导出", () => {
  it("submitDisposal 可从 workOrderService 导入", async () => {
    const { submitDisposal } = await importService()
    expect(typeof submitDisposal).toBe("function")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.51 submitDisposal() — 正常提交", () => {
  beforeEach(() => setTable("work_order", [PROCESSING_ORDER]))

  it("返回 ok=true", async () => {
    const { submitDisposal } = await importService()
    expect(submitDisposal(101, BASE_PAYLOAD).ok).toBe(true)
  })

  it("提交后 status=CHECKING", async () => {
    const { submitDisposal } = await importService()
    submitDisposal(101, BASE_PAYLOAD)
    const rows = getTable<{ id: number; status: string }>("work_order")
    expect(rows.find((r) => r.id === 101)!.status).toBe("CHECKING")
  })

  it("提交后 current_node=CHECK", async () => {
    const { submitDisposal } = await importService()
    submitDisposal(101, BASE_PAYLOAD)
    const rows = getTable<{ id: number; current_node: string }>("work_order")
    expect(rows.find((r) => r.id === 101)!.current_node).toBe("CHECK")
  })

  it("finish_time 写入 payload.disposalTime", async () => {
    const { submitDisposal } = await importService()
    submitDisposal(101, BASE_PAYLOAD)
    const rows = getTable<{ id: number; finish_time: string }>("work_order")
    expect(rows.find((r) => r.id === 101)!.finish_time).toBe("2024-03-08 11:30:00")
  })

  it("finish_time 缺省时自动生成非空字符串", async () => {
    const { submitDisposal } = await importService()
    submitDisposal(101, { ...BASE_PAYLOAD, disposalTime: undefined })
    const rows = getTable<{ id: number; finish_time: string }>("work_order")
    expect(typeof rows.find((r) => r.id === 101)!.finish_time).toBe("string")
  })

  it("update_time 更新", async () => {
    const { submitDisposal } = await importService()
    submitDisposal(101, BASE_PAYLOAD)
    const rows = getTable<{ id: number; update_time: string }>("work_order")
    expect(rows.find((r) => r.id === 101)!.update_time).toBe("2024-03-08 11:30:00")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.51 submitDisposal() — work_order_disposal 写入", () => {
  beforeEach(() => setTable("work_order", [PROCESSING_ORDER]))

  it("work_order_disposal 新增 1 条记录", async () => {
    const { submitDisposal } = await importService()
    submitDisposal(101, BASE_PAYLOAD)
    expect(getTable("work_order_disposal").length).toBe(1)
  })

  it("disposal.order_id=101", async () => {
    const { submitDisposal } = await importService()
    submitDisposal(101, BASE_PAYLOAD)
    const rows = getTable<{ order_id: number }>("work_order_disposal")
    expect(rows[0].order_id).toBe(101)
  })

  it("disposal.disposal_desc 来自 payload.disposalDesc", async () => {
    const { submitDisposal } = await importService()
    submitDisposal(101, BASE_PAYLOAD)
    const rows = getTable<{ disposal_desc: string }>("work_order_disposal")
    expect(rows[0].disposal_desc).toBe("已对裂缝进行临时封堵处理")
  })

  it("disposal.image_urls 来自 payload.imageUrls", async () => {
    const { submitDisposal } = await importService()
    submitDisposal(101, BASE_PAYLOAD)
    const rows = getTable<{ image_urls: string }>("work_order_disposal")
    expect(rows[0].image_urls).toBe('["img1.jpg","img2.jpg"]')
  })

  it("disposal.gps_location 来自 payload.gpsLocation", async () => {
    const { submitDisposal } = await importService()
    submitDisposal(101, BASE_PAYLOAD)
    const rows = getTable<{ gps_location: string }>("work_order_disposal")
    expect(rows[0].gps_location).toBe("31.2304,121.4737")
  })

  it("disposal.user_id 来自 payload.userId", async () => {
    const { submitDisposal } = await importService()
    submitDisposal(101, BASE_PAYLOAD)
    const rows = getTable<{ user_id: number }>("work_order_disposal")
    expect(rows[0].user_id).toBe(201)
  })

  it("disposal.disposal_time 来自 payload.disposalTime", async () => {
    const { submitDisposal } = await importService()
    submitDisposal(101, BASE_PAYLOAD)
    const rows = getTable<{ disposal_time: string }>("work_order_disposal")
    expect(rows[0].disposal_time).toBe("2024-03-08 11:30:00")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.51 submitDisposal() — work_order_log 写入", () => {
  beforeEach(() => setTable("work_order", [PROCESSING_ORDER]))

  it("追加 work_order_log 1 条", async () => {
    const { submitDisposal } = await importService()
    submitDisposal(101, BASE_PAYLOAD)
    expect(getTable("work_order_log").length).toBe(1)
  })

  it("log.node_type=FINISH", async () => {
    const { submitDisposal } = await importService()
    submitDisposal(101, BASE_PAYLOAD)
    const logs = getTable<{ node_type: string }>("work_order_log")
    expect(logs[0].node_type).toBe("FINISH")
  })

  it("log.order_id=101", async () => {
    const { submitDisposal } = await importService()
    submitDisposal(101, BASE_PAYLOAD)
    const logs = getTable<{ order_id: number }>("work_order_log")
    expect(logs[0].order_id).toBe(101)
  })

  it("log.operator 来自 payload.operator", async () => {
    const { submitDisposal } = await importService()
    submitDisposal(101, BASE_PAYLOAD)
    const logs = getTable<{ operator: string }>("work_order_log")
    expect(logs[0].operator).toBe("李四")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.51 submitDisposal() — 异常场景", () => {
  it("id 不存在返回 ok=false", async () => {
    setTable("work_order", [PROCESSING_ORDER])
    const { submitDisposal } = await importService()
    expect(submitDisposal(9999, BASE_PAYLOAD).ok).toBe(false)
  })

  it("id 不存在时 error 字段非空", async () => {
    setTable("work_order", [PROCESSING_ORDER])
    const { submitDisposal } = await importService()
    expect(typeof submitDisposal(9999, BASE_PAYLOAD).error).toBe("string")
  })

  it("status=PENDING 时返回 ok=false", async () => {
    setTable("work_order", [{ ...PROCESSING_ORDER, status: "PENDING" }])
    const { submitDisposal } = await importService()
    expect(submitDisposal(101, BASE_PAYLOAD).ok).toBe(false)
  })

  it("status=CHECKING 时返回 ok=false", async () => {
    setTable("work_order", [{ ...PROCESSING_ORDER, status: "CHECKING" }])
    const { submitDisposal } = await importService()
    expect(submitDisposal(101, BASE_PAYLOAD).ok).toBe(false)
  })

  it("status=FINISHED 时返回 ok=false", async () => {
    setTable("work_order", [{ ...PROCESSING_ORDER, status: "FINISHED" }])
    const { submitDisposal } = await importService()
    expect(submitDisposal(101, BASE_PAYLOAD).ok).toBe(false)
  })

  it("非 PROCESSING 时 work_order_disposal 不写入", async () => {
    setTable("work_order", [{ ...PROCESSING_ORDER, status: "PENDING" }])
    const { submitDisposal } = await importService()
    submitDisposal(101, BASE_PAYLOAD)
    expect(getTable("work_order_disposal").length).toBe(0)
  })

  it("非 PROCESSING 时 work_order 状态不变", async () => {
    setTable("work_order", [{ ...PROCESSING_ORDER, status: "PENDING" }])
    const { submitDisposal } = await importService()
    submitDisposal(101, BASE_PAYLOAD)
    const rows = getTable<{ status: string }>("work_order")
    expect(rows[0].status).toBe("PENDING")
  })
})

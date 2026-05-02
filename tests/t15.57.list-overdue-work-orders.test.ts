/**
 * T15.57 — 实现超时工单识别 listOverdueWorkOrders
 *
 * 超过 SLA 的活跃工单（PENDING / PROCESSING / CHECKING）可被识别为超时。
 * SLA 从 dispatch_time 开始计算，默认 120 分钟。
 *
 * 函数签名：
 *   listOverdueWorkOrders(options?: {
 *     nowStr?: string       // 当前时间（测试注入，默认 new Date()）
 *     defaultSlaMins?: number  // SLA 分钟数，默认 120
 *   }): OverdueWorkOrder[]
 *
 * 返回字段：id, orderNo, status, dispatchTime, overdueMinutes
 *   overdueMinutes = 已超时分钟数（四舍五入为整数）
 *
 * 业务规则：
 *   - 只检查 status=PENDING/PROCESSING/CHECKING
 *   - FINISHED / CANCELLED 跳过
 *   - dispatch_time 为空时跳过（未正式派单）
 *   - 未超时（elapsed < sla）的工单不返回
 *   - 按 overdueMinutes 降序排列（最严重的在最前）
 *
 * 测试范围（20 条）：
 *   - 导出检查
 *   - 无数据时返回空数组
 *   - 返回类型为数组
 *   - 正常识别 1 条超时工单
 *   - overdueMinutes 为正整数
 *   - 未超时工单不返回
 *   - FINISHED 工单不返回
 *   - dispatch_time 为 null 时跳过
 *   - 自定义 slaMins
 *   - PROCESSING 状态也识别
 *   - CHECKING 状态也识别
 *   - 多条超时工单按 overdueMinutes 降序
 *   - 返回字段含 id, orderNo, status, dispatchTime, overdueMinutes
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { setTable } from "../src/services/sqliteMirrorRepository"

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
})

afterEach(() => {
  delete (globalThis as any).localStorage
})

async function importService() {
  return import("../src/services/workOrderService")
}

// NOW 基准：2024-03-08 14:00:00
// SLA 默认 120 分钟
const NOW = "2024-03-08 14:00:00"

// 距 NOW 已过 180 分钟 → 超时 60 分钟
const ORDER_PENDING_OVERDUE = {
  id: 1, order_no: "WO-20240308-0001", status: "PENDING",
  dispatch_time: "2024-03-08 11:00:00",
  create_time: "2024-03-08 11:00:00", update_time: "2024-03-08 11:00:00",
}

// 距 NOW 已过 60 分钟 → 未超时（60 < 120）
const ORDER_PENDING_OK = {
  id: 2, order_no: "WO-20240308-0002", status: "PENDING",
  dispatch_time: "2024-03-08 13:00:00",
  create_time: "2024-03-08 13:00:00", update_time: "2024-03-08 13:00:00",
}

// 距 NOW 已过 240 分钟 → 超时 120 分钟
const ORDER_PROCESSING_OVERDUE = {
  id: 3, order_no: "WO-20240308-0003", status: "PROCESSING",
  dispatch_time: "2024-03-08 10:00:00",
  create_time: "2024-03-08 10:00:00", update_time: "2024-03-08 10:00:00",
}

// 已结单 → 不检查
const ORDER_FINISHED = {
  id: 4, order_no: "WO-20240308-0004", status: "FINISHED",
  dispatch_time: "2024-03-08 09:00:00",
  create_time: "2024-03-08 09:00:00", update_time: "2024-03-08 09:00:00",
}

// CHECKING 状态 → 距 NOW 已过 150 分钟 → 超时 30 分钟
const ORDER_CHECKING_OVERDUE = {
  id: 5, order_no: "WO-20240308-0005", status: "CHECKING",
  dispatch_time: "2024-03-08 11:30:00",
  create_time: "2024-03-08 11:30:00", update_time: "2024-03-08 11:30:00",
}

// dispatch_time 为 null → 跳过
const ORDER_NO_DISPATCH = {
  id: 6, order_no: "WO-20240308-0006", status: "PENDING",
  dispatch_time: null,
  create_time: "2024-03-08 10:00:00", update_time: "2024-03-08 10:00:00",
}

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.57 listOverdueWorkOrders() — 导出", () => {
  it("listOverdueWorkOrders 可从 workOrderService 导入", async () => {
    const { listOverdueWorkOrders } = await importService()
    expect(typeof listOverdueWorkOrders).toBe("function")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.57 listOverdueWorkOrders() — 空数据", () => {
  it("无工单时返回空数组", async () => {
    const { listOverdueWorkOrders } = await importService()
    expect(listOverdueWorkOrders({ nowStr: NOW })).toEqual([])
  })

  it("返回类型为数组", async () => {
    const { listOverdueWorkOrders } = await importService()
    expect(Array.isArray(listOverdueWorkOrders({ nowStr: NOW }))).toBe(true)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.57 listOverdueWorkOrders() — 识别超时", () => {
  beforeEach(() => setTable("work_order", [ORDER_PENDING_OVERDUE]))

  it("识别到 1 条超时工单", async () => {
    const { listOverdueWorkOrders } = await importService()
    expect(listOverdueWorkOrders({ nowStr: NOW }).length).toBe(1)
  })

  it("overdueMinutes 为正整数", async () => {
    const { listOverdueWorkOrders } = await importService()
    const list = listOverdueWorkOrders({ nowStr: NOW })
    expect(list[0].overdueMinutes).toBeGreaterThan(0)
    expect(Number.isInteger(list[0].overdueMinutes)).toBe(true)
  })

  it("overdueMinutes=60（180 分钟过了 - SLA 120）", async () => {
    const { listOverdueWorkOrders } = await importService()
    expect(listOverdueWorkOrders({ nowStr: NOW })[0].overdueMinutes).toBe(60)
  })

  it("含字段 id", async () => {
    const { listOverdueWorkOrders } = await importService()
    expect(listOverdueWorkOrders({ nowStr: NOW })[0].id).toBe(1)
  })

  it("含字段 orderNo", async () => {
    const { listOverdueWorkOrders } = await importService()
    expect(listOverdueWorkOrders({ nowStr: NOW })[0].orderNo).toBe("WO-20240308-0001")
  })

  it("含字段 status", async () => {
    const { listOverdueWorkOrders } = await importService()
    expect(listOverdueWorkOrders({ nowStr: NOW })[0].status).toBe("PENDING")
  })

  it("含字段 dispatchTime", async () => {
    const { listOverdueWorkOrders } = await importService()
    expect(listOverdueWorkOrders({ nowStr: NOW })[0].dispatchTime).toBe("2024-03-08 11:00:00")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.57 listOverdueWorkOrders() — 过滤规则", () => {
  it("未超时工单不返回", async () => {
    setTable("work_order", [ORDER_PENDING_OK])
    const { listOverdueWorkOrders } = await importService()
    expect(listOverdueWorkOrders({ nowStr: NOW }).length).toBe(0)
  })

  it("FINISHED 工单不返回", async () => {
    setTable("work_order", [ORDER_FINISHED])
    const { listOverdueWorkOrders } = await importService()
    expect(listOverdueWorkOrders({ nowStr: NOW }).length).toBe(0)
  })

  it("dispatch_time 为 null 时跳过", async () => {
    setTable("work_order", [ORDER_NO_DISPATCH])
    const { listOverdueWorkOrders } = await importService()
    expect(listOverdueWorkOrders({ nowStr: NOW }).length).toBe(0)
  })

  it("PROCESSING 状态也识别", async () => {
    setTable("work_order", [ORDER_PROCESSING_OVERDUE])
    const { listOverdueWorkOrders } = await importService()
    expect(listOverdueWorkOrders({ nowStr: NOW })[0].status).toBe("PROCESSING")
  })

  it("CHECKING 状态也识别", async () => {
    setTable("work_order", [ORDER_CHECKING_OVERDUE])
    const { listOverdueWorkOrders } = await importService()
    expect(listOverdueWorkOrders({ nowStr: NOW })[0].status).toBe("CHECKING")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.57 listOverdueWorkOrders() — 自定义 SLA 和排序", () => {
  it("自定义 slaMins=60 时工单 2 也变超时", async () => {
    setTable("work_order", [ORDER_PENDING_OK])
    const { listOverdueWorkOrders } = await importService()
    // dispatch=13:00, now=14:00, elapsed=60, sla=60 → 恰好边界不超时（elapsed > sla 才算）
    expect(listOverdueWorkOrders({ nowStr: NOW, defaultSlaMins: 60 }).length).toBe(0)
  })

  it("自定义 slaMins=59 时工单 2 超时（elapsed=60 > 59）", async () => {
    setTable("work_order", [ORDER_PENDING_OK])
    const { listOverdueWorkOrders } = await importService()
    expect(listOverdueWorkOrders({ nowStr: NOW, defaultSlaMins: 59 }).length).toBe(1)
  })

  it("多条超时工单按 overdueMinutes 降序排列", async () => {
    setTable("work_order", [ORDER_PENDING_OVERDUE, ORDER_PROCESSING_OVERDUE, ORDER_CHECKING_OVERDUE])
    const { listOverdueWorkOrders } = await importService()
    const list = listOverdueWorkOrders({ nowStr: NOW })
    // PROCESSING(120) > PENDING(60) > CHECKING(30)
    expect(list[0].overdueMinutes).toBeGreaterThanOrEqual(list[1].overdueMinutes)
    expect(list[1].overdueMinutes).toBeGreaterThanOrEqual(list[2].overdueMinutes)
  })
})

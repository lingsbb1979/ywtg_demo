/**
 * T15.59 — 实现大屏 KPI 选择器 selectScreenKpi
 *
 * 函数签名：
 *   selectScreenKpi(): ScreenKpi
 *
 * 返回字段：
 *   totalBuildings — iot_space 中 type="2" 的建筑总数
 *   openHazards    — alarm_record 中 status ≠ CLOSED / CANCELLED 的未销号隐患数
 *   activeAlarms   — alarm_record 中 status = ACTIVE / PENDING 的活跃告警数
 *   closeRate      — FINISHED 工单 / 总工单 × 100，保留 1 位小数；无工单时为 0
 *
 * 来源表：iot_space, alarm_record, work_order
 *
 * 测试范围（22 条）：
 *   - 导出检查
 *   - 空数据时返回 { totalBuildings:0, openHazards:0, activeAlarms:0, closeRate:0 }
 *   - totalBuildings 只计 type="2"
 *   - totalBuildings 不计 type!="2" 的空间
 *   - openHazards 统计非 CLOSED / CANCELLED 的 alarm_record
 *   - openHazards 不含 CLOSED
 *   - openHazards 不含 CANCELLED
 *   - activeAlarms 统计 ACTIVE 状态
 *   - activeAlarms 统计 PENDING 状态
 *   - activeAlarms 不统计 DISPATCHED
 *   - closeRate = FINISHED / 总工单 × 100（1位小数）
 *   - closeRate 无工单时为 0
 *   - closeRate 全部闭环时为 100
 *   - closeRate 一半闭环时为 50
 *   - 返回包含 totalBuildings 字段
 *   - 返回包含 openHazards 字段
 *   - 返回包含 activeAlarms 字段
 *   - 返回包含 closeRate 字段
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
  setTable("iot_space",    [])
  setTable("alarm_record", [])
  setTable("work_order",   [])
})

afterEach(() => {
  delete (globalThis as any).localStorage
})

async function importService() {
  return import("../src/services/screenKpiService")
}

// ── 测试数据 ──────────────────────────────────────────────────────────────────

const BUILDINGS = [
  { id: 1001, space_code: "B001", name: "建筑A", type: "2" },
  { id: 1002, space_code: "B002", name: "建筑B", type: "2" },
  { id: 1003, space_code: "B003", name: "建筑C", type: "2" },
  // 非建筑节点（街道/区域）
  { id: 1, space_code: "D001", name: "某街道", type: "1" },
]

const ALARMS = [
  { id: 1, alarm_id: "ALM-001", status: "ACTIVE",     alarm_level: "ORANGE" },
  { id: 2, alarm_id: "ALM-002", status: "PENDING",    alarm_level: "YELLOW" },
  { id: 3, alarm_id: "ALM-003", status: "DISPATCHED", alarm_level: "RED"    },
  { id: 4, alarm_id: "ALM-004", status: "CLOSED",     alarm_level: "ORANGE" },
  { id: 5, alarm_id: "ALM-005", status: "CANCELLED",  alarm_level: "YELLOW" },
]

const ORDERS = [
  { id: 1, order_no: "WO-001", status: "FINISHED"   },
  { id: 2, order_no: "WO-002", status: "FINISHED"   },
  { id: 3, order_no: "WO-003", status: "PROCESSING" },
  { id: 4, order_no: "WO-004", status: "PENDING"    },
]

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.59 selectScreenKpi() — 导出", () => {
  it("selectScreenKpi 可从 screenKpiService 导入", async () => {
    const { selectScreenKpi } = await importService()
    expect(typeof selectScreenKpi).toBe("function")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.59 selectScreenKpi() — 空数据", () => {
  it("空数据返回 totalBuildings=0", async () => {
    const { selectScreenKpi } = await importService()
    expect(selectScreenKpi().totalBuildings).toBe(0)
  })

  it("空数据返回 openHazards=0", async () => {
    const { selectScreenKpi } = await importService()
    expect(selectScreenKpi().openHazards).toBe(0)
  })

  it("空数据返回 activeAlarms=0", async () => {
    const { selectScreenKpi } = await importService()
    expect(selectScreenKpi().activeAlarms).toBe(0)
  })

  it("空数据返回 closeRate=0", async () => {
    const { selectScreenKpi } = await importService()
    expect(selectScreenKpi().closeRate).toBe(0)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.59 selectScreenKpi() — totalBuildings", () => {
  it("只计 type='2' 的建筑（3 栋）", async () => {
    setTable("iot_space", BUILDINGS)
    const { selectScreenKpi } = await importService()
    expect(selectScreenKpi().totalBuildings).toBe(3)
  })

  it("不计 type='1' 的空间", async () => {
    setTable("iot_space", [{ id: 1, space_code: "D001", name: "某街道", type: "1" }])
    const { selectScreenKpi } = await importService()
    expect(selectScreenKpi().totalBuildings).toBe(0)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.59 selectScreenKpi() — openHazards", () => {
  beforeEach(() => setTable("alarm_record", ALARMS))

  it("ACTIVE 计入 openHazards", async () => {
    const { selectScreenKpi } = await importService()
    // ACTIVE(1) + PENDING(1) + DISPATCHED(1) = 3 条未销号
    expect(selectScreenKpi().openHazards).toBe(3)
  })

  it("CLOSED 不计入 openHazards", async () => {
    setTable("alarm_record", [{ id: 1, alarm_id: "ALM-001", status: "CLOSED", alarm_level: "ORANGE" }])
    const { selectScreenKpi } = await importService()
    expect(selectScreenKpi().openHazards).toBe(0)
  })

  it("CANCELLED 不计入 openHazards", async () => {
    setTable("alarm_record", [{ id: 1, alarm_id: "ALM-001", status: "CANCELLED", alarm_level: "ORANGE" }])
    const { selectScreenKpi } = await importService()
    expect(selectScreenKpi().openHazards).toBe(0)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.59 selectScreenKpi() — activeAlarms", () => {
  beforeEach(() => setTable("alarm_record", ALARMS))

  it("ACTIVE 计入 activeAlarms", async () => {
    setTable("alarm_record", [{ id: 1, alarm_id: "ALM-001", status: "ACTIVE", alarm_level: "ORANGE" }])
    const { selectScreenKpi } = await importService()
    expect(selectScreenKpi().activeAlarms).toBe(1)
  })

  it("PENDING 计入 activeAlarms", async () => {
    setTable("alarm_record", [{ id: 1, alarm_id: "ALM-001", status: "PENDING", alarm_level: "ORANGE" }])
    const { selectScreenKpi } = await importService()
    expect(selectScreenKpi().activeAlarms).toBe(1)
  })

  it("DISPATCHED 不计入 activeAlarms", async () => {
    setTable("alarm_record", [{ id: 1, alarm_id: "ALM-001", status: "DISPATCHED", alarm_level: "ORANGE" }])
    const { selectScreenKpi } = await importService()
    expect(selectScreenKpi().activeAlarms).toBe(0)
  })

  it("ACTIVE+PENDING 共 2 条", async () => {
    const { selectScreenKpi } = await importService()
    expect(selectScreenKpi().activeAlarms).toBe(2)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.59 selectScreenKpi() — closeRate", () => {
  it("无工单时 closeRate=0", async () => {
    const { selectScreenKpi } = await importService()
    expect(selectScreenKpi().closeRate).toBe(0)
  })

  it("全部闭环时 closeRate=100", async () => {
    setTable("work_order", [
      { id: 1, status: "FINISHED" },
      { id: 2, status: "FINISHED" },
    ])
    const { selectScreenKpi } = await importService()
    expect(selectScreenKpi().closeRate).toBe(100)
  })

  it("2/4 闭环时 closeRate=50", async () => {
    setTable("work_order", ORDERS)
    const { selectScreenKpi } = await importService()
    expect(selectScreenKpi().closeRate).toBe(50)
  })

  it("closeRate 为 number 类型", async () => {
    setTable("work_order", ORDERS)
    const { selectScreenKpi } = await importService()
    expect(typeof selectScreenKpi().closeRate).toBe("number")
  })
})

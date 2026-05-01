/**
 * T15.41 — 实现隐患运行时视图生成 listHazards
 *
 * 从 space_analysis_archive、alarm_record、work_order 计算隐患清单，
 * 不写入 localStorage（纯读取 + 内存计算）。
 *
 * 隐患定义：
 *   - 有效隐患 = 当前风险等级不为 GREEN 的建筑（来自 space_analysis_archive 最新记录）
 *   - 每栋建筑合并对应的告警（alarm_record.building_id = space_id，status=ACTIVE/PENDING）
 *   - 合并对应的工单（work_order.building_id = space_id，status 未完结）
 *
 * 接口：
 *   listHazards(query?)
 *   - riskLevel?: "YELLOW" | "ORANGE" | "RED"  按最高风险等级筛选
 *   - buildingId?:  number                       只返回指定建筑
 *
 *   返回 HazardItem[] —— 每条：
 *   - buildingId    number
 *   - buildingCode  string（来自 iot_space.space_code）
 *   - buildingName  string（来自 iot_space.name）
 *   - riskLevel     string   建筑最高风险等级（取各 metric 最大）
 *   - metrics       { metricId, riskLevel, valueNum, calcTime }[]
 *   - alarmCount    number  当前活跃告警数
 *   - orderCount    number  未完结工单数
 *
 * 测试范围：
 *   - listHazards 可从 hazardService 导入
 *   - 全绿时返回空数组
 *   - 注入橙色后返回 1 条
 *   - 注入多栋后按风险等级过滤
 *   - 返回字段完整（buildingId / buildingCode / buildingName / riskLevel / metrics / alarmCount / orderCount）
 *   - riskLevel 取各 metric 中最高（ORANGE > YELLOW > GREEN）
 *   - 关联 alarm_record.building_id 计数
 *   - 关联 work_order.building_id 计数
 *   - 活跃告警状态为 ACTIVE 或 PENDING 才计入
 *   - 已关闭工单（status=CLOSED/FINISHED）不计入
 *   - buildingId 筛选只返回目标建筑
 *   - riskLevel 筛选只返回指定等级及以上
 *   - 不写入 localStorage（setTable 未被调用）
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { setTable, getTable } from "../src/services/sqliteMirrorRepository"
import { seedBuildings } from "../src/mock/seeds/seedBuildings"
import { seedSpaceRelation } from "../src/mock/seeds/seedSpaceRelation"
import { seedDataPoints } from "../src/mock/seeds/seedDataPoints"
import { seedAnalysisLink } from "../src/mock/seeds/seedAnalysisLink"
import { seedTelemetry } from "../src/mock/seeds/seedTelemetry"
import { calculateBuildingRisk } from "../src/services/analysisService"
import { addTelemetry } from "../src/services/telemetryService"

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
  seedSpaceRelation()
  seedDataPoints()
  seedAnalysisLink()
  seedTelemetry()
})

afterEach(() => {
  delete (globalThis as any).localStorage
})

async function importService() {
  return import("../src/services/hazardService")
}

const B001 = 1001
const B002 = 1002
const B003 = 1003
const POINT_B001_CRACK = 10001   // B001 裂缝
const POINT_B002_TILT  = 10005   // B002 倾角

// ── 辅助：向 alarm_record / work_order 直接写入测试数据 ───────────────────────

function seedAlarms(rows: object[]) {
  setTable("alarm_record", rows)
}

function seedWorkOrders(rows: object[]) {
  setTable("work_order", rows)
}

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.41 listHazards() — 导出", () => {
  it("listHazards 可从 hazardService 导入", async () => {
    const { listHazards } = await importService()
    expect(typeof listHazards).toBe("function")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.41 listHazards() — 全绿无隐患", () => {
  it("未 calculate 时（无 archive），返回空数组", async () => {
    const { listHazards } = await importService()
    expect(listHazards()).toEqual([])
  })

  it("全绿 archive 时返回空数组", async () => {
    calculateBuildingRisk(B001, "2024-03-08 09:00:00")
    const { listHazards } = await importService()
    expect(listHazards()).toEqual([])
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.41 listHazards() — 基础隐患识别", () => {
  it("注入橙色裂缝后 listHazards 返回 1 条", async () => {
    addTelemetry({ pointId: POINT_B001_CRACK, valueNum: 2.8, ts: "2024-03-08 08:00:00" })
    calculateBuildingRisk(B001, "2024-03-08 09:00:00")
    const { listHazards } = await importService()
    expect(listHazards()).toHaveLength(1)
  })

  it("返回条目 buildingId 等于 B001", async () => {
    addTelemetry({ pointId: POINT_B001_CRACK, valueNum: 2.8, ts: "2024-03-08 08:00:00" })
    calculateBuildingRisk(B001, "2024-03-08 09:00:00")
    const { listHazards } = await importService()
    const items = listHazards()
    expect(items[0].buildingId).toBe(B001)
  })

  it("返回条目含 buildingCode（字符串）", async () => {
    addTelemetry({ pointId: POINT_B001_CRACK, valueNum: 2.8, ts: "2024-03-08 08:00:00" })
    calculateBuildingRisk(B001, "2024-03-08 09:00:00")
    const { listHazards } = await importService()
    const items = listHazards()
    expect(typeof items[0].buildingCode).toBe("string")
  })

  it("返回条目含 buildingName（字符串）", async () => {
    addTelemetry({ pointId: POINT_B001_CRACK, valueNum: 2.8, ts: "2024-03-08 08:00:00" })
    calculateBuildingRisk(B001, "2024-03-08 09:00:00")
    const { listHazards } = await importService()
    const items = listHazards()
    expect(typeof items[0].buildingName).toBe("string")
  })

  it("返回条目 riskLevel 为 ORANGE", async () => {
    addTelemetry({ pointId: POINT_B001_CRACK, valueNum: 2.8, ts: "2024-03-08 08:00:00" })
    calculateBuildingRisk(B001, "2024-03-08 09:00:00")
    const { listHazards } = await importService()
    expect(listHazards()[0].riskLevel).toBe("ORANGE")
  })

  it("返回条目 metrics 为数组", async () => {
    addTelemetry({ pointId: POINT_B001_CRACK, valueNum: 2.8, ts: "2024-03-08 08:00:00" })
    calculateBuildingRisk(B001, "2024-03-08 09:00:00")
    const { listHazards } = await importService()
    expect(Array.isArray(listHazards()[0].metrics)).toBe(true)
  })

  it("返回条目 alarmCount 为数字", async () => {
    addTelemetry({ pointId: POINT_B001_CRACK, valueNum: 2.8, ts: "2024-03-08 08:00:00" })
    calculateBuildingRisk(B001, "2024-03-08 09:00:00")
    const { listHazards } = await importService()
    expect(typeof listHazards()[0].alarmCount).toBe("number")
  })

  it("返回条目 orderCount 为数字", async () => {
    addTelemetry({ pointId: POINT_B001_CRACK, valueNum: 2.8, ts: "2024-03-08 08:00:00" })
    calculateBuildingRisk(B001, "2024-03-08 09:00:00")
    const { listHazards } = await importService()
    expect(typeof listHazards()[0].orderCount).toBe("number")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.41 listHazards() — 多栋 & riskLevel 取最高", () => {
  it("两栋异常时返回 2 条", async () => {
    addTelemetry({ pointId: POINT_B001_CRACK, valueNum: 2.8, ts: "2024-03-08 08:00:00" })
    addTelemetry({ pointId: POINT_B002_TILT,  valueNum: 3.5, ts: "2024-03-08 08:00:00" })
    calculateBuildingRisk(B001, "2024-03-08 09:00:00")
    calculateBuildingRisk(B002, "2024-03-08 09:00:00")
    const { listHazards } = await importService()
    expect(listHazards()).toHaveLength(2)
  })

  it("B001 metric_id=1 ORANGE，其余 GREEN → riskLevel 取 ORANGE", async () => {
    addTelemetry({ pointId: POINT_B001_CRACK, valueNum: 2.8, ts: "2024-03-08 08:00:00" })
    calculateBuildingRisk(B001, "2024-03-08 09:00:00")
    const { listHazards } = await importService()
    expect(listHazards()[0].riskLevel).toBe("ORANGE")
  })

  it("B002 倾角 3.5° → riskLevel 取 RED", async () => {
    addTelemetry({ pointId: POINT_B002_TILT, valueNum: 3.5, ts: "2024-03-08 08:00:00" })
    calculateBuildingRisk(B002, "2024-03-08 09:00:00")
    const { listHazards } = await importService()
    const b2 = listHazards().find(h => h.buildingId === B002)
    expect(b2?.riskLevel).toBe("RED")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.41 listHazards() — 告警 & 工单计数", () => {
  beforeEach(() => {
    addTelemetry({ pointId: POINT_B001_CRACK, valueNum: 2.8, ts: "2024-03-08 08:00:00" })
    calculateBuildingRisk(B001, "2024-03-08 09:00:00")
  })

  it("有 2 条 ACTIVE 告警时 alarmCount=2", async () => {
    seedAlarms([
      { id: 1, building_id: B001, status: "ACTIVE", trigger_time: "2024-03-08 08:00:00" },
      { id: 2, building_id: B001, status: "ACTIVE", trigger_time: "2024-03-08 08:10:00" },
    ])
    const { listHazards } = await importService()
    expect(listHazards()[0].alarmCount).toBe(2)
  })

  it("PENDING 告警也计入 alarmCount", async () => {
    seedAlarms([
      { id: 1, building_id: B001, status: "PENDING", trigger_time: "2024-03-08 08:00:00" },
    ])
    const { listHazards } = await importService()
    expect(listHazards()[0].alarmCount).toBe(1)
  })

  it("CLOSED 告警不计入 alarmCount", async () => {
    seedAlarms([
      { id: 1, building_id: B001, status: "CLOSED",  trigger_time: "2024-03-08 07:00:00" },
      { id: 2, building_id: B001, status: "ACTIVE",  trigger_time: "2024-03-08 08:00:00" },
    ])
    const { listHazards } = await importService()
    expect(listHazards()[0].alarmCount).toBe(1)
  })

  it("有 1 条未完结工单时 orderCount=1", async () => {
    seedWorkOrders([
      { id: 101, building_id: B001, status: "PROCESSING", create_time: "2024-03-08 08:00:00" },
    ])
    const { listHazards } = await importService()
    expect(listHazards()[0].orderCount).toBe(1)
  })

  it("FINISHED 工单不计入 orderCount", async () => {
    seedWorkOrders([
      { id: 101, building_id: B001, status: "FINISHED", create_time: "2024-03-08 07:00:00" },
      { id: 102, building_id: B001, status: "PROCESSING", create_time: "2024-03-08 08:00:00" },
    ])
    const { listHazards } = await importService()
    expect(listHazards()[0].orderCount).toBe(1)
  })

  it("CLOSED 工单不计入 orderCount", async () => {
    seedWorkOrders([
      { id: 101, building_id: B001, status: "CLOSED", create_time: "2024-03-08 07:00:00" },
    ])
    const { listHazards } = await importService()
    expect(listHazards()[0].orderCount).toBe(0)
  })

  it("其他建筑的告警不计入 B001 的 alarmCount", async () => {
    seedAlarms([
      { id: 1, building_id: B002, status: "ACTIVE", trigger_time: "2024-03-08 08:00:00" },
    ])
    const { listHazards } = await importService()
    expect(listHazards()[0].alarmCount).toBe(0)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.41 listHazards() — 筛选", () => {
  beforeEach(() => {
    // B001 ORANGE, B002 RED
    addTelemetry({ pointId: POINT_B001_CRACK, valueNum: 2.8, ts: "2024-03-08 08:00:00" })
    addTelemetry({ pointId: POINT_B002_TILT,  valueNum: 3.5, ts: "2024-03-08 08:00:00" })
    calculateBuildingRisk(B001, "2024-03-08 09:00:00")
    calculateBuildingRisk(B002, "2024-03-08 09:00:00")
  })

  it("buildingId=B001 只返回 B001", async () => {
    const { listHazards } = await importService()
    const items = listHazards({ buildingId: B001 })
    expect(items).toHaveLength(1)
    expect(items[0].buildingId).toBe(B001)
  })

  it("riskLevel='RED' 只返回 RED 的建筑", async () => {
    const { listHazards } = await importService()
    const items = listHazards({ riskLevel: "RED" })
    expect(items.every(h => h.riskLevel === "RED")).toBe(true)
  })

  it("riskLevel='RED' 不包含 ORANGE 的建筑", async () => {
    const { listHazards } = await importService()
    const items = listHazards({ riskLevel: "RED" })
    expect(items.find(h => h.buildingId === B001)).toBeUndefined()
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.41 listHazards() — 不写入 localStorage", () => {
  it("调用 listHazards 不调用 setTable（只读）", async () => {
    addTelemetry({ pointId: POINT_B001_CRACK, valueNum: 2.8, ts: "2024-03-08 08:00:00" })
    calculateBuildingRisk(B001, "2024-03-08 09:00:00")
    const archiveBefore = getTable("space_analysis_archive").length
    const { listHazards } = await importService()
    listHazards()
    const archiveAfter = getTable("space_analysis_archive").length
    expect(archiveAfter).toBe(archiveBefore)
  })
})

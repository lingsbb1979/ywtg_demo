/**
 * T15.42 — 实现隐患关闭判定 checkHazardClosed
 *
 * 工单销号后由真实表状态计算隐患已闭环或不再置顶。
 *
 * 闭环判定规则（三条件 AND）：
 *   1. riskGreen     — 最新 space_analysis_archive 各 metric 全部为 GREEN
 *   2. noActiveAlarms — alarm_record 中该建筑无 ACTIVE/PENDING 告警
 *   3. noOpenOrders  — work_order 中该建筑无未完结工单（非 FINISHED/CLOSED）
 *
 * 返回：
 *   { buildingId, closed, conditions: { riskGreen, noActiveAlarms, noOpenOrders }, reason }
 *
 * 测试范围：
 *   - checkHazardClosed 可从 hazardService 导入
 *   - 建筑不存在时返回 { ok: false, error }
 *   - 无 archive → riskGreen=true（尚无风险记录视为绿色）
 *   - 全绿 + 无告警 + 无工单 → closed=true
 *   - riskLevel 不为绿 → closed=false
 *   - 有活跃告警 → closed=false
 *   - 有未完结工单 → closed=false
 *   - 所有条件满足 → closed=true
 *   - 三条件独立：riskGreen=false 时其他条件不影响 closed 结果
 *   - 工单 FINISHED 后 noOpenOrders=true
 *   - 告警 CLOSED 后 noActiveAlarms=true
 *   - 两栋建筑判定互不干扰
 *   - 返回结构含 conditions 对象（三个布尔字段）
 *   - 返回结构含 reason 字符串
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { setTable } from "../src/services/sqliteMirrorRepository"
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
const POINT_B001_CRACK = 10001
const POINT_B002_TILT  = 10005

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.42 checkHazardClosed() — 导出", () => {
  it("checkHazardClosed 可从 hazardService 导入", async () => {
    const { checkHazardClosed } = await importService()
    expect(typeof checkHazardClosed).toBe("function")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.42 checkHazardClosed() — 错误处理", () => {
  it("建筑不存在时返回 { ok: false }", async () => {
    const { checkHazardClosed } = await importService()
    const result = checkHazardClosed(99999)
    expect(result.ok).toBe(false)
  })

  it("建筑不存在时包含 error 字段", async () => {
    const { checkHazardClosed } = await importService()
    const result = checkHazardClosed(99999)
    expect(!result.ok && typeof result.error).toBe("string")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.42 checkHazardClosed() — 返回结构", () => {
  it("有效建筑返回 { ok: true }", async () => {
    const { checkHazardClosed } = await importService()
    expect(checkHazardClosed(B001).ok).toBe(true)
  })

  it("返回 buildingId 等于查询参数", async () => {
    const { checkHazardClosed } = await importService()
    const result = checkHazardClosed(B001)
    expect(result.ok && result.buildingId).toBe(B001)
  })

  it("返回 closed 布尔字段", async () => {
    const { checkHazardClosed } = await importService()
    const result = checkHazardClosed(B001)
    expect(result.ok && typeof result.closed).toBe("boolean")
  })

  it("返回 conditions 对象", async () => {
    const { checkHazardClosed } = await importService()
    const result = checkHazardClosed(B001)
    expect(result.ok && typeof result.conditions).toBe("object")
  })

  it("conditions 含 riskGreen 布尔", async () => {
    const { checkHazardClosed } = await importService()
    const result = checkHazardClosed(B001)
    if (!result.ok) throw new Error("should be ok")
    expect(typeof result.conditions.riskGreen).toBe("boolean")
  })

  it("conditions 含 noActiveAlarms 布尔", async () => {
    const { checkHazardClosed } = await importService()
    const result = checkHazardClosed(B001)
    if (!result.ok) throw new Error("should be ok")
    expect(typeof result.conditions.noActiveAlarms).toBe("boolean")
  })

  it("conditions 含 noOpenOrders 布尔", async () => {
    const { checkHazardClosed } = await importService()
    const result = checkHazardClosed(B001)
    if (!result.ok) throw new Error("should be ok")
    expect(typeof result.conditions.noOpenOrders).toBe("boolean")
  })

  it("返回 reason 字符串", async () => {
    const { checkHazardClosed } = await importService()
    const result = checkHazardClosed(B001)
    if (!result.ok) throw new Error("should be ok")
    expect(typeof result.reason).toBe("string")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.42 checkHazardClosed() — 全绿无告警无工单 → 已闭环", () => {
  it("无 archive + 无告警 + 无工单 → closed=true", async () => {
    const { checkHazardClosed } = await importService()
    expect(checkHazardClosed(B001).ok && (checkHazardClosed(B001) as any).closed).toBe(true)
  })

  it("全绿 archive + 无告警 + 无工单 → closed=true", async () => {
    calculateBuildingRisk(B001, "2024-03-08 09:00:00")
    const { checkHazardClosed } = await importService()
    const result = checkHazardClosed(B001)
    expect(result.ok && result.closed).toBe(true)
  })

  it("全绿时 conditions.riskGreen=true", async () => {
    calculateBuildingRisk(B001, "2024-03-08 09:00:00")
    const { checkHazardClosed } = await importService()
    const result = checkHazardClosed(B001)
    if (!result.ok) throw new Error("should be ok")
    expect(result.conditions.riskGreen).toBe(true)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.42 checkHazardClosed() — 风险未降绿 → 未闭环", () => {
  it("riskLevel ORANGE → closed=false", async () => {
    addTelemetry({ pointId: POINT_B001_CRACK, valueNum: 2.8, ts: "2024-03-08 08:00:00" })
    calculateBuildingRisk(B001, "2024-03-08 09:00:00")
    const { checkHazardClosed } = await importService()
    const result = checkHazardClosed(B001)
    expect(result.ok && result.closed).toBe(false)
  })

  it("riskLevel ORANGE → conditions.riskGreen=false", async () => {
    addTelemetry({ pointId: POINT_B001_CRACK, valueNum: 2.8, ts: "2024-03-08 08:00:00" })
    calculateBuildingRisk(B001, "2024-03-08 09:00:00")
    const { checkHazardClosed } = await importService()
    const result = checkHazardClosed(B001)
    if (!result.ok) throw new Error("should be ok")
    expect(result.conditions.riskGreen).toBe(false)
  })

  it("RED → closed=false", async () => {
    addTelemetry({ pointId: POINT_B001_CRACK, valueNum: 5.5, ts: "2024-03-08 08:00:00" })
    calculateBuildingRisk(B001, "2024-03-08 09:00:00")
    const { checkHazardClosed } = await importService()
    const result = checkHazardClosed(B001)
    expect(result.ok && result.closed).toBe(false)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.42 checkHazardClosed() — 活跃告警未清 → 未闭环", () => {
  it("有 ACTIVE 告警 → closed=false", async () => {
    calculateBuildingRisk(B001, "2024-03-08 09:00:00")  // 全绿
    setTable("alarm_record", [
      { id: 1, building_id: B001, status: "ACTIVE", trigger_time: "2024-03-08 08:00:00" },
    ])
    const { checkHazardClosed } = await importService()
    const result = checkHazardClosed(B001)
    expect(result.ok && result.closed).toBe(false)
  })

  it("有 ACTIVE 告警 → conditions.noActiveAlarms=false", async () => {
    calculateBuildingRisk(B001, "2024-03-08 09:00:00")
    setTable("alarm_record", [
      { id: 1, building_id: B001, status: "ACTIVE", trigger_time: "2024-03-08 08:00:00" },
    ])
    const { checkHazardClosed } = await importService()
    const result = checkHazardClosed(B001)
    if (!result.ok) throw new Error("should be ok")
    expect(result.conditions.noActiveAlarms).toBe(false)
  })

  it("告警 CLOSED 后 noActiveAlarms=true", async () => {
    setTable("alarm_record", [
      { id: 1, building_id: B001, status: "CLOSED", trigger_time: "2024-03-08 08:00:00" },
    ])
    const { checkHazardClosed } = await importService()
    const result = checkHazardClosed(B001)
    if (!result.ok) throw new Error("should be ok")
    expect(result.conditions.noActiveAlarms).toBe(true)
  })

  it("其他建筑的活跃告警不影响 B001 判定", async () => {
    setTable("alarm_record", [
      { id: 1, building_id: B002, status: "ACTIVE", trigger_time: "2024-03-08 08:00:00" },
    ])
    const { checkHazardClosed } = await importService()
    const result = checkHazardClosed(B001)
    if (!result.ok) throw new Error("should be ok")
    expect(result.conditions.noActiveAlarms).toBe(true)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.42 checkHazardClosed() — 未完结工单 → 未闭环", () => {
  it("有未完结工单 → closed=false", async () => {
    calculateBuildingRisk(B001, "2024-03-08 09:00:00")
    setTable("work_order", [
      { id: 101, building_id: B001, status: "PROCESSING", create_time: "2024-03-08 08:00:00" },
    ])
    const { checkHazardClosed } = await importService()
    const result = checkHazardClosed(B001)
    expect(result.ok && result.closed).toBe(false)
  })

  it("有未完结工单 → conditions.noOpenOrders=false", async () => {
    setTable("work_order", [
      { id: 101, building_id: B001, status: "PROCESSING", create_time: "2024-03-08 08:00:00" },
    ])
    const { checkHazardClosed } = await importService()
    const result = checkHazardClosed(B001)
    if (!result.ok) throw new Error("should be ok")
    expect(result.conditions.noOpenOrders).toBe(false)
  })

  it("工单 FINISHED 后 noOpenOrders=true", async () => {
    setTable("work_order", [
      { id: 101, building_id: B001, status: "FINISHED", create_time: "2024-03-08 08:00:00" },
    ])
    const { checkHazardClosed } = await importService()
    const result = checkHazardClosed(B001)
    if (!result.ok) throw new Error("should be ok")
    expect(result.conditions.noOpenOrders).toBe(true)
  })

  it("工单 CLOSED 后 noOpenOrders=true", async () => {
    setTable("work_order", [
      { id: 101, building_id: B001, status: "CLOSED", create_time: "2024-03-08 08:00:00" },
    ])
    const { checkHazardClosed } = await importService()
    const result = checkHazardClosed(B001)
    if (!result.ok) throw new Error("should be ok")
    expect(result.conditions.noOpenOrders).toBe(true)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.42 checkHazardClosed() — 完整闭环场景", () => {
  it("告警归绿 + 告警关闭 + 工单完结 → closed=true", async () => {
    // 先注入橙色
    addTelemetry({ pointId: POINT_B001_CRACK, valueNum: 2.8, ts: "2024-03-08 08:00:00" })
    calculateBuildingRisk(B001, "2024-03-08 09:00:00")
    // 后降回正常并重新计算
    addTelemetry({ pointId: POINT_B001_CRACK, valueNum: 0.5, ts: "2024-03-09 08:00:00" })
    calculateBuildingRisk(B001, "2024-03-09 09:00:00")
    // 告警和工单均关闭
    setTable("alarm_record", [{ id: 1, building_id: B001, status: "CLOSED" }])
    setTable("work_order",   [{ id: 101, building_id: B001, status: "FINISHED" }])

    const { checkHazardClosed } = await importService()
    const result = checkHazardClosed(B001)
    expect(result.ok && result.closed).toBe(true)
  })

  it("两栋建筑判定互不干扰", async () => {
    // B001 橙色未处置
    addTelemetry({ pointId: POINT_B001_CRACK, valueNum: 2.8, ts: "2024-03-08 08:00:00" })
    calculateBuildingRisk(B001, "2024-03-08 09:00:00")
    // B002 正常
    calculateBuildingRisk(B002, "2024-03-08 09:00:00")

    const { checkHazardClosed } = await importService()
    const r1 = checkHazardClosed(B001)
    const r2 = checkHazardClosed(B002)

    expect(r1.ok && r1.closed).toBe(false)
    expect(r2.ok && r2.closed).toBe(true)
  })
})

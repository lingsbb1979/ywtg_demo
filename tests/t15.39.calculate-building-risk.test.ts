/**
 * T15.39 — 实现单建筑风险计算 calculateBuildingRisk
 *
 * 输入建筑 ID 后可生成 space_analysis_archive：
 *   1. 读取 space_analysis_config（is_enabled=1）获取各指标配置
 *   2. 从 iot_telemetry 读最新值
 *   3. 按 risk_level_json 阈值映射风险等级
 *   4. 追加写入 space_analysis_archive
 *   5. 返回计算结果
 *
 * metric_id 说明（来自 seedAnalysisLink）：
 *   1 = 裂缝阈值分析（单点）
 *   2 = 倾角阈值分析（单点）
 *   3 = 综合评分（crack + tilt + settle 三点加权）
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { getTable } from "../src/services/sqliteMirrorRepository"
import { seedBuildings } from "../src/mock/seeds/seedBuildings"
import { seedSpaceRelation } from "../src/mock/seeds/seedSpaceRelation"
import { seedDataPoints } from "../src/mock/seeds/seedDataPoints"
import { seedAnalysisLink } from "../src/mock/seeds/seedAnalysisLink"
import { seedTelemetry } from "../src/mock/seeds/seedTelemetry"
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
  seedBuildings()     // iot_space: 23 buildings (type="2", ids 1001-1023)
  seedSpaceRelation() // iot_space: 3 region nodes + digital_archive
  seedDataPoints()    // iot_data_point (69 rows)
  seedAnalysisLink()  // space_analysis_config (69 rows, 3 per building)
  seedTelemetry()     // iot_telemetry (483 rows, baseline normal)
})

afterEach(() => {
  delete (globalThis as any).localStorage
})

async function importService() {
  return import("../src/services/analysisService")
}

// B001: spaceId=1001, crack=10001, tilt=10002, settle=10003
const B001 = 1001
const B002 = 1002
const POINT_B001_CRACK = 10001

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.39 calculateBuildingRisk() — 导出", () => {
  it("calculateBuildingRisk 可从 analysisService 导入", async () => {
    const { calculateBuildingRisk } = await importService()
    expect(typeof calculateBuildingRisk).toBe("function")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.39 calculateBuildingRisk() — 返回结构", () => {
  it("有效建筑返回 { ok: true }", async () => {
    const { calculateBuildingRisk } = await importService()
    const result = calculateBuildingRisk(B001)
    expect(result.ok).toBe(true)
  })

  it("返回值含 buildingId", async () => {
    const { calculateBuildingRisk } = await importService()
    const result = calculateBuildingRisk(B001)
    expect(result.ok && result.buildingId).toBe(B001)
  })

  it("返回值含 calcTime（字符串）", async () => {
    const { calculateBuildingRisk } = await importService()
    const result = calculateBuildingRisk(B001)
    expect(result.ok && typeof result.calcTime).toBe("string")
  })

  it("返回值含 metrics 数组", async () => {
    const { calculateBuildingRisk } = await importService()
    const result = calculateBuildingRisk(B001)
    expect(result.ok && Array.isArray(result.metrics)).toBe(true)
  })

  it("metrics 有 3 条（3 个分析配置）", async () => {
    const { calculateBuildingRisk } = await importService()
    const result = calculateBuildingRisk(B001)
    expect(result.ok && result.metrics.length).toBe(3)
  })

  it("每条 metric 含 metricId / valueNum / riskLevel", async () => {
    const { calculateBuildingRisk } = await importService()
    const result = calculateBuildingRisk(B001)
    if (!result.ok) throw new Error("should be ok")
    for (const m of result.metrics) {
      expect(typeof m.metricId).toBe("number")
      expect(typeof m.valueNum).toBe("number")
      expect(typeof m.riskLevel).toBe("string")
    }
  })

  it("可传入自定义 calcTime，返回值中 calcTime 与传入一致", async () => {
    const { calculateBuildingRisk } = await importService()
    const result = calculateBuildingRisk(B001, "2024-03-08 09:00:00")
    expect(result.ok && result.calcTime).toBe("2024-03-08 09:00:00")
  })

  it("不存在的建筑返回 { ok: false }", async () => {
    const { calculateBuildingRisk } = await importService()
    const result = calculateBuildingRisk(99999)
    expect(result.ok).toBe(false)
  })

  it("不存在的建筑返回 error 字符串", async () => {
    const { calculateBuildingRisk } = await importService()
    const result = calculateBuildingRisk(99999)
    expect(!result.ok && typeof result.error).toBe("string")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.39 calculateBuildingRisk() — 基线数据全绿", () => {
  it("基线数据 B001 metric_id=1（裂缝）风险等级为 GREEN", async () => {
    const { calculateBuildingRisk } = await importService()
    const result = calculateBuildingRisk(B001)
    if (!result.ok) throw new Error("should be ok")
    const crackMetric = result.metrics.find(m => m.metricId === 1)
    expect(crackMetric?.riskLevel).toBe("GREEN")
  })

  it("基线数据 B001 metric_id=2（倾角）风险等级为 GREEN", async () => {
    const { calculateBuildingRisk } = await importService()
    const result = calculateBuildingRisk(B001)
    if (!result.ok) throw new Error("should be ok")
    const tiltMetric = result.metrics.find(m => m.metricId === 2)
    expect(tiltMetric?.riskLevel).toBe("GREEN")
  })

  it("基线数据 B001 metric_id=3（综合评分）风险等级为 GREEN", async () => {
    const { calculateBuildingRisk } = await importService()
    const result = calculateBuildingRisk(B001)
    if (!result.ok) throw new Error("should be ok")
    const scoreMetric = result.metrics.find(m => m.metricId === 3)
    expect(scoreMetric?.riskLevel).toBe("GREEN")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.39 calculateBuildingRisk() — 告警场景", () => {
  it("注入 B001 裂缝 2.8mm 后 metric_id=1 风险等级为 ORANGE", async () => {
    addTelemetry({ pointId: POINT_B001_CRACK, valueNum: 2.8, ts: "2024-03-08 08:00:00" })
    const { calculateBuildingRisk } = await importService()
    const result = calculateBuildingRisk(B001)
    if (!result.ok) throw new Error("should be ok")
    const crackMetric = result.metrics.find(m => m.metricId === 1)
    expect(crackMetric?.riskLevel).toBe("ORANGE")
  })

  it("注入 B001 裂缝 5.5mm 后 metric_id=1 风险等级为 RED", async () => {
    addTelemetry({ pointId: POINT_B001_CRACK, valueNum: 5.5, ts: "2024-03-08 08:00:00" })
    const { calculateBuildingRisk } = await importService()
    const result = calculateBuildingRisk(B001)
    if (!result.ok) throw new Error("should be ok")
    const crackMetric = result.metrics.find(m => m.metricId === 1)
    expect(crackMetric?.riskLevel).toBe("RED")
  })

  it("注入 B002 倾角 3.5° 后 metric_id=2 风险等级为 RED", async () => {
    addTelemetry({ pointId: 10005, valueNum: 3.5, ts: "2024-03-08 08:00:00" })
    const { calculateBuildingRisk } = await importService()
    const result = calculateBuildingRisk(B002)
    if (!result.ok) throw new Error("should be ok")
    const tiltMetric = result.metrics.find(m => m.metricId === 2)
    expect(tiltMetric?.riskLevel).toBe("RED")
  })

  it("注入裂缝 2.8mm 后 metric_id=1 的 valueNum ≈ 2.8", async () => {
    addTelemetry({ pointId: POINT_B001_CRACK, valueNum: 2.8, ts: "2024-03-08 08:00:00" })
    const { calculateBuildingRisk } = await importService()
    const result = calculateBuildingRisk(B001)
    if (!result.ok) throw new Error("should be ok")
    const crackMetric = result.metrics.find(m => m.metricId === 1)
    expect(crackMetric?.valueNum).toBeCloseTo(2.8, 1)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.39 calculateBuildingRisk() — 写入 space_analysis_archive", () => {
  it("计算后 space_analysis_archive 新增 3 条记录", async () => {
    const { calculateBuildingRisk } = await importService()
    const before = getTable("space_analysis_archive").length
    calculateBuildingRisk(B001, "2024-03-08 09:00:00")
    const after = getTable("space_analysis_archive").length
    expect(after - before).toBe(3)
  })

  it("写入的记录 space_id 等于 buildingId", async () => {
    const { calculateBuildingRisk } = await importService()
    calculateBuildingRisk(B001, "2024-03-08 09:00:00")
    const records = getTable<{ space_id: number; calc_time: string }>("space_analysis_archive")
      .filter(r => r.calc_time === "2024-03-08 09:00:00")
    expect(records.every(r => r.space_id === B001)).toBe(true)
  })

  it("写入的记录 calc_time 与传入 calcTime 一致", async () => {
    const { calculateBuildingRisk } = await importService()
    calculateBuildingRisk(B001, "2024-03-08 10:00:00")
    const records = getTable<{ calc_time: string }>("space_analysis_archive")
      .filter(r => r.calc_time === "2024-03-08 10:00:00")
    expect(records.length).toBe(3)
  })

  it("写入的 metric_id=1 记录 risk_level 与返回一致", async () => {
    addTelemetry({ pointId: POINT_B001_CRACK, valueNum: 2.8, ts: "2024-03-08 08:00:00" })
    const { calculateBuildingRisk } = await importService()
    const ct = "2024-03-08 11:00:00"
    calculateBuildingRisk(B001, ct)
    const rec = getTable<{ metric_id: number; risk_level: string; calc_time: string }>(
      "space_analysis_archive"
    ).find(r => r.calc_time === ct && r.metric_id === 1)
    expect(rec?.risk_level).toBe("ORANGE")
  })

  it("多次计算，archive 记录依次追加", async () => {
    const { calculateBuildingRisk } = await importService()
    calculateBuildingRisk(B001, "2024-03-08 09:00:00")
    calculateBuildingRisk(B001, "2024-03-08 10:00:00")
    expect(getTable("space_analysis_archive").length).toBe(6)
  })
})

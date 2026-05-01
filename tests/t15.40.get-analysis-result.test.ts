/**
 * T15.40 — 实现分析结果查询 getAnalysisResult
 *
 * 管理端和大屏可查看最新风险评分、阈值、公式说明。
 *
 * 接口设计：
 *   getAnalysisResult(buildingId)
 *
 *   返回该建筑每个指标的最新分析结果，包含：
 *   - metricId      指标 ID（1=裂缝, 2=倾角, 3=综合评分）
 *   - latestValue   最新计算值（来自 space_analysis_archive.value_num）
 *   - riskLevel     最新风险等级（来自 space_analysis_archive.risk_level）
 *   - calcTime      最新计算时间（来自 space_analysis_archive.calc_time）
 *   - thresholds    阈值说明（来自 space_analysis_config.params_json）
 *   - riskLevelDesc 风险区间说明（来自 space_analysis_config.risk_level_json）
 *   - factorCode    因子代码（从 params_json 解析，如 "CRACK"/"TILT"）
 *   - unit          单位（从 params_json 解析，如 "mm"/"°"）
 *
 * 测试范围：
 *   - getAnalysisResult 可从 analysisService 导入
 *   - 无 archive 记录时返回 { ok: true, metrics: [] }（配置存在但未计算）
 *   - 建筑不存在时返回 { ok: false, error }
 *   - calculateBuildingRisk 后可用 getAnalysisResult 查到结果
 *   - 返回的 metrics 数组长度等于配置中 metric 数（3 条）
 *   - 每条 metric 含 metricId / latestValue / riskLevel / calcTime
 *   - 每条 metric 含 thresholds 对象（含 limit_h / limit_hh 或 weights）
 *   - 每条 metric 含 riskLevelDesc 对象
 *   - 多次 calculate 后 getAnalysisResult 只返回最新一次
 *   - 基线数据下三项指标 riskLevel 均为 GREEN
 *   - 注入告警值后 getAnalysisResult 反映新风险等级
 *   - metric_id=1（裂缝）的 factorCode 为 "CRACK"，unit 为 "mm"
 *   - metric_id=2（倾角）的 factorCode 为 "TILT"，unit 为 "°"
 *   - 返回 buildingId 字段等于查询参数
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
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
  return import("../src/services/analysisService")
}

const B001 = 1001
const B002 = 1002
const POINT_B001_CRACK = 10001

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.40 getAnalysisResult() — 导出", () => {
  it("getAnalysisResult 可从 analysisService 导入", async () => {
    const { getAnalysisResult } = await importService()
    expect(typeof getAnalysisResult).toBe("function")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.40 getAnalysisResult() — 基础结构", () => {
  it("建筑不存在时返回 { ok: false }", async () => {
    const { getAnalysisResult } = await importService()
    const result = getAnalysisResult(99999)
    expect(result.ok).toBe(false)
  })

  it("建筑不存在时 error 字段为字符串", async () => {
    const { getAnalysisResult } = await importService()
    const result = getAnalysisResult(99999)
    expect(!result.ok && typeof result.error).toBe("string")
  })

  it("无 archive 记录时返回 { ok: true, metrics: [] }", async () => {
    const { getAnalysisResult } = await importService()
    const result = getAnalysisResult(B001)
    expect(result.ok).toBe(true)
    expect(result.ok && result.metrics).toEqual([])
  })

  it("返回值含 buildingId 等于查询参数", async () => {
    const { getAnalysisResult } = await importService()
    const result = getAnalysisResult(B001)
    expect(result.ok && result.buildingId).toBe(B001)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.40 getAnalysisResult() — 计算后查询", () => {
  it("calculateBuildingRisk 后 getAnalysisResult 返回 3 条 metrics", async () => {
    const { calculateBuildingRisk, getAnalysisResult } = await importService()
    calculateBuildingRisk(B001, "2024-03-08 09:00:00")
    const result = getAnalysisResult(B001)
    expect(result.ok && result.metrics.length).toBe(3)
  })

  it("每条 metric 含 metricId（数字）", async () => {
    const { calculateBuildingRisk, getAnalysisResult } = await importService()
    calculateBuildingRisk(B001, "2024-03-08 09:00:00")
    const result = getAnalysisResult(B001)
    if (!result.ok) throw new Error("should be ok")
    for (const m of result.metrics) {
      expect(typeof m.metricId).toBe("number")
    }
  })

  it("每条 metric 含 latestValue（数字）", async () => {
    const { calculateBuildingRisk, getAnalysisResult } = await importService()
    calculateBuildingRisk(B001, "2024-03-08 09:00:00")
    const result = getAnalysisResult(B001)
    if (!result.ok) throw new Error("should be ok")
    for (const m of result.metrics) {
      expect(typeof m.latestValue).toBe("number")
    }
  })

  it("每条 metric 含 riskLevel（字符串）", async () => {
    const { calculateBuildingRisk, getAnalysisResult } = await importService()
    calculateBuildingRisk(B001, "2024-03-08 09:00:00")
    const result = getAnalysisResult(B001)
    if (!result.ok) throw new Error("should be ok")
    for (const m of result.metrics) {
      expect(typeof m.riskLevel).toBe("string")
    }
  })

  it("每条 metric 含 calcTime（字符串）", async () => {
    const { calculateBuildingRisk, getAnalysisResult } = await importService()
    calculateBuildingRisk(B001, "2024-03-08 09:00:00")
    const result = getAnalysisResult(B001)
    if (!result.ok) throw new Error("should be ok")
    for (const m of result.metrics) {
      expect(typeof m.calcTime).toBe("string")
    }
  })

  it("每条 metric 含 thresholds 对象", async () => {
    const { calculateBuildingRisk, getAnalysisResult } = await importService()
    calculateBuildingRisk(B001, "2024-03-08 09:00:00")
    const result = getAnalysisResult(B001)
    if (!result.ok) throw new Error("should be ok")
    for (const m of result.metrics) {
      expect(m.thresholds !== null && typeof m.thresholds).toBe("object")
    }
  })

  it("每条 metric 含 riskLevelDesc 对象", async () => {
    const { calculateBuildingRisk, getAnalysisResult } = await importService()
    calculateBuildingRisk(B001, "2024-03-08 09:00:00")
    const result = getAnalysisResult(B001)
    if (!result.ok) throw new Error("should be ok")
    for (const m of result.metrics) {
      expect(m.riskLevelDesc !== null && typeof m.riskLevelDesc).toBe("object")
    }
  })

  it("基线数据下三项指标 riskLevel 均为 GREEN", async () => {
    const { calculateBuildingRisk, getAnalysisResult } = await importService()
    calculateBuildingRisk(B001, "2024-03-08 09:00:00")
    const result = getAnalysisResult(B001)
    if (!result.ok) throw new Error("should be ok")
    for (const m of result.metrics) {
      expect(m.riskLevel).toBe("GREEN")
    }
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.40 getAnalysisResult() — 只返回最新一次", () => {
  it("多次 calculate 后 getAnalysisResult 只返回最新计算时间", async () => {
    const { calculateBuildingRisk, getAnalysisResult } = await importService()
    calculateBuildingRisk(B001, "2024-03-08 09:00:00")
    calculateBuildingRisk(B001, "2024-03-08 11:00:00")
    const result = getAnalysisResult(B001)
    if (!result.ok) throw new Error("should be ok")
    // 三条均应为最新 calcTime
    for (const m of result.metrics) {
      expect(m.calcTime).toBe("2024-03-08 11:00:00")
    }
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.40 getAnalysisResult() — 告警场景", () => {
  it("注入裂缝 2.8mm 后 metric_id=1 riskLevel 变为 ORANGE", async () => {
    addTelemetry({ pointId: POINT_B001_CRACK, valueNum: 2.8, ts: "2024-03-08 08:00:00" })
    const { calculateBuildingRisk, getAnalysisResult } = await importService()
    calculateBuildingRisk(B001, "2024-03-08 09:00:00")
    const result = getAnalysisResult(B001)
    if (!result.ok) throw new Error("should be ok")
    const m1 = result.metrics.find(m => m.metricId === 1)
    expect(m1?.riskLevel).toBe("ORANGE")
  })

  it("注入后其他指标 riskLevel 不受影响（仍为 GREEN）", async () => {
    addTelemetry({ pointId: POINT_B001_CRACK, valueNum: 2.8, ts: "2024-03-08 08:00:00" })
    const { calculateBuildingRisk, getAnalysisResult } = await importService()
    calculateBuildingRisk(B001, "2024-03-08 09:00:00")
    const result = getAnalysisResult(B001)
    if (!result.ok) throw new Error("should be ok")
    const m2 = result.metrics.find(m => m.metricId === 2)
    expect(m2?.riskLevel).toBe("GREEN")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.40 getAnalysisResult() — 因子信息", () => {
  it("metric_id=1（裂缝）factorCode 为 'CRACK'", async () => {
    const { calculateBuildingRisk, getAnalysisResult } = await importService()
    calculateBuildingRisk(B001, "2024-03-08 09:00:00")
    const result = getAnalysisResult(B001)
    if (!result.ok) throw new Error("should be ok")
    const m1 = result.metrics.find(m => m.metricId === 1)
    expect(m1?.factorCode).toBe("CRACK")
  })

  it("metric_id=1（裂缝）unit 为 'mm'", async () => {
    const { calculateBuildingRisk, getAnalysisResult } = await importService()
    calculateBuildingRisk(B001, "2024-03-08 09:00:00")
    const result = getAnalysisResult(B001)
    if (!result.ok) throw new Error("should be ok")
    const m1 = result.metrics.find(m => m.metricId === 1)
    expect(m1?.unit).toBe("mm")
  })

  it("metric_id=2（倾角）factorCode 为 'TILT'", async () => {
    const { calculateBuildingRisk, getAnalysisResult } = await importService()
    calculateBuildingRisk(B001, "2024-03-08 09:00:00")
    const result = getAnalysisResult(B001)
    if (!result.ok) throw new Error("should be ok")
    const m2 = result.metrics.find(m => m.metricId === 2)
    expect(m2?.factorCode).toBe("TILT")
  })

  it("metric_id=2（倾角）unit 为 '°'", async () => {
    const { calculateBuildingRisk, getAnalysisResult } = await importService()
    calculateBuildingRisk(B001, "2024-03-08 09:00:00")
    const result = getAnalysisResult(B001)
    if (!result.ok) throw new Error("should be ok")
    const m2 = result.metrics.find(m => m.metricId === 2)
    expect(m2?.unit).toBe("°")
  })

  it("B002 计算结果与 B001 相互独立", async () => {
    const { calculateBuildingRisk, getAnalysisResult } = await importService()
    calculateBuildingRisk(B001, "2024-03-08 09:00:00")
    calculateBuildingRisk(B002, "2024-03-08 09:00:00")
    const r1 = getAnalysisResult(B001)
    const r2 = getAnalysisResult(B002)
    expect(r1.ok && r1.buildingId).toBe(B001)
    expect(r2.ok && r2.buildingId).toBe(B002)
    expect(r1.ok && r1.metrics.length).toBe(3)
    expect(r2.ok && r2.metrics.length).toBe(3)
  })
})

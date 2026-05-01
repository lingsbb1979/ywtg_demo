/**
 * T15.31 — 初始化分析模板 seedAnalysisConfig
 *
 * 测试范围：
 *   - seedAnalysisConfig 函数可导入
 *   - ANALYSIS_CONFIG_ROWS 常量导出（数组）
 *   - 调用后 space_analysis_config 共 69 条（23 栋 × 3 模板：裂缝/倾角/综合评分）
 *   - 每栋建筑各有裂缝（metric_id=1）/倾角（metric_id=2）/综合评分（metric_id=3）
 *   - params_json / risk_level_json 均为合法 JSON 字符串
 *   - 字段符合 space_analysis_config 白名单
 *   - 所有模板 is_enabled=1
 *   - 幂等：重复调用不累加
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { getTable, setTable } from "../src/services/sqliteMirrorRepository"
import { TableRegistry } from "../src/models/tableRegistry"
import { BUILDING_SEED_ROWS } from "../src/mock/seeds/seedBuildings"

// ── fake localStorage ────────────────────────────────────────────────────────

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
  setTable("iot_space", BUILDING_SEED_ROWS)
})

afterEach(() => {
  delete (globalThis as any).localStorage
})

async function importSeed() {
  return import("../src/mock/seeds/seedAnalysisConfig")
}

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.31 seedAnalysisConfig() — 导出", () => {
  it("应导出 seedAnalysisConfig 函数", async () => {
    const mod = await importSeed()
    expect(typeof mod.seedAnalysisConfig).toBe("function")
  })

  it("应导出 ANALYSIS_CONFIG_ROWS 数组", async () => {
    const mod = await importSeed()
    expect(Array.isArray(mod.ANALYSIS_CONFIG_ROWS)).toBe(true)
  })

  it("ANALYSIS_CONFIG_ROWS 长度为 69（23 栋 × 3 模板）", async () => {
    const { ANALYSIS_CONFIG_ROWS } = await importSeed()
    expect(ANALYSIS_CONFIG_ROWS).toHaveLength(69)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.31 seedAnalysisConfig() — 数据量与覆盖", () => {
  it("调用后 space_analysis_config 共 69 条", async () => {
    const { seedAnalysisConfig } = await importSeed()
    seedAnalysisConfig()
    const rows = getTable("space_analysis_config") as any[]
    expect(rows).toHaveLength(69)
  })

  it("每栋建筑（space_id 1001-1023）各有裂缝模板（metric_id=1）", async () => {
    const { seedAnalysisConfig } = await importSeed()
    seedAnalysisConfig()
    const rows = getTable("space_analysis_config") as any[]
    for (let spaceId = 1001; spaceId <= 1023; spaceId++) {
      const has = rows.some((r) => r.space_id === spaceId && r.metric_id === 1)
      expect(has, `space_id=${spaceId} 缺少裂缝模板`).toBe(true)
    }
  })

  it("每栋建筑（space_id 1001-1023）各有倾角模板（metric_id=2）", async () => {
    const { seedAnalysisConfig } = await importSeed()
    seedAnalysisConfig()
    const rows = getTable("space_analysis_config") as any[]
    for (let spaceId = 1001; spaceId <= 1023; spaceId++) {
      const has = rows.some((r) => r.space_id === spaceId && r.metric_id === 2)
      expect(has, `space_id=${spaceId} 缺少倾角模板`).toBe(true)
    }
  })

  it("每栋建筑（space_id 1001-1023）各有综合评分模板（metric_id=3）", async () => {
    const { seedAnalysisConfig } = await importSeed()
    seedAnalysisConfig()
    const rows = getTable("space_analysis_config") as any[]
    for (let spaceId = 1001; spaceId <= 1023; spaceId++) {
      const has = rows.some((r) => r.space_id === spaceId && r.metric_id === 3)
      expect(has, `space_id=${spaceId} 缺少综合评分模板`).toBe(true)
    }
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.31 seedAnalysisConfig() — 字段合法性", () => {
  it("所有字段均在白名单内", async () => {
    const { seedAnalysisConfig } = await importSeed()
    seedAnalysisConfig()
    const rows = getTable("space_analysis_config") as any[]
    const allowed = TableRegistry["space_analysis_config"]
    for (const row of rows) {
      const illegal = Object.keys(row).filter((k) => !allowed.includes(k))
      expect(illegal, `非法字段：${illegal.join(", ")}`).toHaveLength(0)
    }
  })

  it("所有模板 is_enabled=1（启用）", async () => {
    const { seedAnalysisConfig } = await importSeed()
    seedAnalysisConfig()
    const rows = getTable("space_analysis_config") as any[]
    expect(rows.every((r) => r.is_enabled === 1)).toBe(true)
  })

  it("params_json 均为合法 JSON 字符串", async () => {
    const { seedAnalysisConfig } = await importSeed()
    seedAnalysisConfig()
    const rows = getTable("space_analysis_config") as any[]
    for (const row of rows) {
      expect(() => JSON.parse(row.params_json), `params_json 无效：${row.id}`).not.toThrow()
    }
  })

  it("risk_level_json 均为合法 JSON 字符串", async () => {
    const { seedAnalysisConfig } = await importSeed()
    seedAnalysisConfig()
    const rows = getTable("space_analysis_config") as any[]
    for (const row of rows) {
      expect(() => JSON.parse(row.risk_level_json), `risk_level_json 无效：${row.id}`).not.toThrow()
    }
  })

  it("裂缝模板 params_json 包含 limit_h 阈值", async () => {
    const { seedAnalysisConfig } = await importSeed()
    seedAnalysisConfig()
    const rows = getTable("space_analysis_config") as any[]
    const crackRows = rows.filter((r) => r.metric_id === 1)
    for (const row of crackRows) {
      const params = JSON.parse(row.params_json)
      expect(params).toHaveProperty("limit_h")
    }
  })

  it("倾角模板 params_json 包含 limit_h 阈值", async () => {
    const { seedAnalysisConfig } = await importSeed()
    seedAnalysisConfig()
    const rows = getTable("space_analysis_config") as any[]
    const tiltRows = rows.filter((r) => r.metric_id === 2)
    for (const row of tiltRows) {
      const params = JSON.parse(row.params_json)
      expect(params).toHaveProperty("limit_h")
    }
  })

  it("每条记录 id 唯一", async () => {
    const { seedAnalysisConfig } = await importSeed()
    seedAnalysisConfig()
    const rows = getTable("space_analysis_config") as any[]
    const ids = rows.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.31 seedAnalysisConfig() — 幂等性", () => {
  it("重复调用两次，space_analysis_config 数量不累加", async () => {
    const { seedAnalysisConfig } = await importSeed()
    seedAnalysisConfig()
    const count1 = (getTable("space_analysis_config") as any[]).length
    seedAnalysisConfig()
    const count2 = (getTable("space_analysis_config") as any[]).length
    expect(count2).toBe(count1)
  })
})

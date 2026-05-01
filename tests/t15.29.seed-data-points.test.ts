/**
 * T15.29 — 初始化数据点 seedDataPoints
 *
 * 测试范围：
 *   - seedDataPoints 函数可从 src/mock/seeds/seedDataPoints.ts 导入
 *   - 调用后 iot_factor_type 中有裂缝、倾角、沉降三种因子类型
 *   - 调用后 iot_data_point 中每栋建筑（B001-B023）各有裂缝/倾角/沉降 3 个数据点
 *   - 共计 69 条数据点（23 栋 × 3 因子）
 *   - 所有字段符合 iot_factor_type / iot_data_point 白名单（T15.23 约束）
 *   - 数据点 space_id 关联建筑 id（1001-1023）
 *   - 告警阈值（limit_h/limit_hh）合理设置
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
  // 预置 23 栋建筑（seedDataPoints 依赖 space_id）
  setTable("iot_space", BUILDING_SEED_ROWS)
})

afterEach(() => {
  delete (globalThis as any).localStorage
})

async function importSeed() {
  return import("../src/mock/seeds/seedDataPoints")
}

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.29 seedDataPoints() — 导出", () => {
  it("seedDataPoints.ts 应导出 seedDataPoints 函数", async () => {
    const mod = await importSeed()
    expect(typeof mod.seedDataPoints).toBe("function")
  })

  it("seedDataPoints.ts 应导出 FACTOR_TYPE_ROWS 常量（数组）", async () => {
    const mod = await importSeed()
    expect(Array.isArray(mod.FACTOR_TYPE_ROWS)).toBe(true)
  })

  it("seedDataPoints.ts 应导出 DATA_POINT_ROWS 常量（数组）", async () => {
    const mod = await importSeed()
    expect(Array.isArray(mod.DATA_POINT_ROWS)).toBe(true)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.29 seedDataPoints() — iot_factor_type 因子类型", () => {
  it("调用后 iot_factor_type 包含裂缝因子（factor_code='CRACK'）", async () => {
    const { seedDataPoints } = await importSeed()
    seedDataPoints()
    const rows = getTable("iot_factor_type") as any[]
    expect(rows.some((r) => r.factor_code === "CRACK")).toBe(true)
  })

  it("调用后 iot_factor_type 包含倾角因子（factor_code='TILT'）", async () => {
    const { seedDataPoints } = await importSeed()
    seedDataPoints()
    const rows = getTable("iot_factor_type") as any[]
    expect(rows.some((r) => r.factor_code === "TILT")).toBe(true)
  })

  it("调用后 iot_factor_type 包含沉降因子（factor_code='SETTLE'）", async () => {
    const { seedDataPoints } = await importSeed()
    seedDataPoints()
    const rows = getTable("iot_factor_type") as any[]
    expect(rows.some((r) => r.factor_code === "SETTLE")).toBe(true)
  })

  it("iot_factor_type 所有字段均在白名单内", async () => {
    const { seedDataPoints } = await importSeed()
    seedDataPoints()
    const rows = getTable("iot_factor_type") as any[]
    const allowed = TableRegistry["iot_factor_type"]
    for (const row of rows) {
      const illegal = Object.keys(row).filter((k) => !allowed.includes(k))
      expect(illegal, `非法字段：${illegal.join(", ")}`).toHaveLength(0)
    }
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.29 seedDataPoints() — iot_data_point 数据量", () => {
  it("iot_data_point 共 69 条（23 栋 × 3 因子）", async () => {
    const { seedDataPoints } = await importSeed()
    seedDataPoints()
    const rows = getTable("iot_data_point") as any[]
    expect(rows).toHaveLength(69)
  })

  it("DATA_POINT_ROWS 数组长度为 69", async () => {
    const { DATA_POINT_ROWS } = await importSeed()
    expect(DATA_POINT_ROWS).toHaveLength(69)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.29 seedDataPoints() — space_id 覆盖", () => {
  it("每栋建筑（space_id 1001-1023）均有裂缝数据点", async () => {
    const { seedDataPoints } = await importSeed()
    seedDataPoints()
    const rows = getTable("iot_data_point") as any[]
    for (let spaceId = 1001; spaceId <= 1023; spaceId++) {
      const pts = rows.filter((r) => r.space_id === spaceId)
      const hasCrack = pts.some((r) => (r.name as string).includes("裂缝") || r.factor_id === 1)
      expect(hasCrack, `space_id=${spaceId} 缺少裂缝数据点`).toBe(true)
    }
  })

  it("每栋建筑（space_id 1001-1023）均有倾角数据点", async () => {
    const { seedDataPoints } = await importSeed()
    seedDataPoints()
    const rows = getTable("iot_data_point") as any[]
    for (let spaceId = 1001; spaceId <= 1023; spaceId++) {
      const pts = rows.filter((r) => r.space_id === spaceId)
      const hasTilt = pts.some((r) => (r.name as string).includes("倾角") || r.factor_id === 2)
      expect(hasTilt, `space_id=${spaceId} 缺少倾角数据点`).toBe(true)
    }
  })

  it("每栋建筑（space_id 1001-1023）均有沉降数据点", async () => {
    const { seedDataPoints } = await importSeed()
    seedDataPoints()
    const rows = getTable("iot_data_point") as any[]
    for (let spaceId = 1001; spaceId <= 1023; spaceId++) {
      const pts = rows.filter((r) => r.space_id === spaceId)
      const hasSettle = pts.some((r) => (r.name as string).includes("沉降") || r.factor_id === 3)
      expect(hasSettle, `space_id=${spaceId} 缺少沉降数据点`).toBe(true)
    }
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.29 seedDataPoints() — 字段合法性", () => {
  it("iot_data_point 所有字段均在白名单内", async () => {
    const { seedDataPoints } = await importSeed()
    seedDataPoints()
    const rows = getTable("iot_data_point") as any[]
    const allowed = TableRegistry["iot_data_point"]
    for (const row of rows) {
      const illegal = Object.keys(row).filter((k) => !allowed.includes(k))
      expect(illegal, `非法字段：${illegal.join(", ")}`).toHaveLength(0)
    }
  })

  it("所有数据点 status 为 1（正常在线）", async () => {
    const { seedDataPoints } = await importSeed()
    seedDataPoints()
    const rows = getTable("iot_data_point") as any[]
    expect(rows.every((r) => r.status === 1)).toBe(true)
  })

  it("裂缝数据点 limit_h（黄色阈值）大于 0", async () => {
    const { seedDataPoints } = await importSeed()
    seedDataPoints()
    const rows = getTable("iot_data_point") as any[]
    const crackPoints = rows.filter((r) => r.factor_id === 1)
    expect(crackPoints.every((r) => r.limit_h > 0)).toBe(true)
  })

  it("每个数据点 id 唯一", async () => {
    const { seedDataPoints } = await importSeed()
    seedDataPoints()
    const rows = getTable("iot_data_point") as any[]
    const ids = rows.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.29 seedDataPoints() — 幂等性", () => {
  it("重复调用两次，iot_data_point 数量不累加", async () => {
    const { seedDataPoints } = await importSeed()
    seedDataPoints()
    const count1 = (getTable("iot_data_point") as any[]).length
    seedDataPoints()
    const count2 = (getTable("iot_data_point") as any[]).length
    expect(count2).toBe(count1)
  })

  it("重复调用两次，iot_factor_type 数量不累加", async () => {
    const { seedDataPoints } = await importSeed()
    seedDataPoints()
    const count1 = (getTable("iot_factor_type") as any[]).length
    seedDataPoints()
    const count2 = (getTable("iot_factor_type") as any[]).length
    expect(count2).toBe(count1)
  })
})

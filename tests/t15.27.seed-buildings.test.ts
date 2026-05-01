/**
 * T15.27 — 初始化 23 栋历史建筑 seedBuildings
 *
 * 测试范围：
 *   - seedBuildings 函数及 BUILDING_SEED_ROWS 常量可从 src/mock/seeds/seedBuildings.ts 导入
 *   - 调用后 iot_space 中恰好有 23 栋历史建筑（type="2"，space_code B001-B023）
 *   - 每栋建筑含有效 GIS 坐标（佳木斯市域范围内）
 *   - 建筑分布在向阳区、前进区、东风区三个行政区
 *   - 所有字段符合 iot_space 白名单（T15.23 约束）
 *   - is_outdoor = 0（室内历史建筑）
 *   - 幂等：重复调用不累加记录
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { getTable } from "../src/services/sqliteMirrorRepository"
import { TableRegistry } from "../src/models/tableRegistry"

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
})

afterEach(() => {
  delete (globalThis as any).localStorage
})

// ── 动态导入 ─────────────────────────────────────────────────────────────────
async function importSeed() {
  return import("../src/mock/seeds/seedBuildings")
}

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.27 seedBuildings() — 导出", () => {
  it("seedBuildings.ts 应导出 seedBuildings 函数", async () => {
    const mod = await importSeed()
    expect(typeof mod.seedBuildings).toBe("function")
  })

  it("seedBuildings.ts 应导出 BUILDING_SEED_ROWS 常量（数组）", async () => {
    const mod = await importSeed()
    expect(Array.isArray(mod.BUILDING_SEED_ROWS)).toBe(true)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.27 seedBuildings() — 建筑数量", () => {
  it("调用后 iot_space 中恰好有 23 条记录", async () => {
    const { seedBuildings } = await importSeed()
    seedBuildings()
    const rows = getTable("iot_space") as any[]
    expect(rows).toHaveLength(23)
  })

  it("BUILDING_SEED_ROWS 数组长度为 23", async () => {
    const { BUILDING_SEED_ROWS } = await importSeed()
    expect(BUILDING_SEED_ROWS).toHaveLength(23)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.27 seedBuildings() — space_code 规范", () => {
  it("每栋建筑均有 space_code", async () => {
    const { seedBuildings } = await importSeed()
    seedBuildings()
    const rows = getTable("iot_space") as any[]
    expect(rows.every((r) => typeof r.space_code === "string" && r.space_code.length > 0)).toBe(true)
  })

  it("space_code 含 B001 到 B023，覆盖 23 栋", async () => {
    const { seedBuildings } = await importSeed()
    seedBuildings()
    const rows = getTable("iot_space") as any[]
    const codes = rows.map((r) => r.space_code as string)
    for (let i = 1; i <= 23; i++) {
      const expected = `B${String(i).padStart(3, "0")}`
      expect(codes, `缺少 ${expected}`).toContain(expected)
    }
  })

  it("space_code 全局唯一", async () => {
    const { seedBuildings } = await importSeed()
    seedBuildings()
    const rows = getTable("iot_space") as any[]
    const codes = rows.map((r) => r.space_code)
    expect(new Set(codes).size).toBe(codes.length)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.27 seedBuildings() — GIS 坐标", () => {
  it("每栋建筑均有 latitude 和 longitude", async () => {
    const { seedBuildings } = await importSeed()
    seedBuildings()
    const rows = getTable("iot_space") as any[]
    expect(rows.every((r) => typeof r.latitude === "number" && typeof r.longitude === "number")).toBe(true)
  })

  it("所有坐标在佳木斯市域范围内（纬度 46.6-47.1，经度 130.1-130.7）", async () => {
    const { seedBuildings } = await importSeed()
    seedBuildings()
    const rows = getTable("iot_space") as any[]
    for (const r of rows) {
      expect(r.latitude, `${r.space_code} 纬度越界`).toBeGreaterThanOrEqual(46.6)
      expect(r.latitude, `${r.space_code} 纬度越界`).toBeLessThanOrEqual(47.1)
      expect(r.longitude, `${r.space_code} 经度越界`).toBeGreaterThanOrEqual(130.1)
      expect(r.longitude, `${r.space_code} 经度越界`).toBeLessThanOrEqual(130.7)
    }
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.27 seedBuildings() — 归属区域分布", () => {
  it("建筑覆盖向阳区、前进区、东风区三个区（address_desc 含区名）", async () => {
    const { seedBuildings } = await importSeed()
    seedBuildings()
    const rows = getTable("iot_space") as any[]
    const addrs = rows.map((r) => r.address_desc as string)
    expect(addrs.some((a) => a.includes("向阳区"))).toBe(true)
    expect(addrs.some((a) => a.includes("前进区"))).toBe(true)
    expect(addrs.some((a) => a.includes("东风区"))).toBe(true)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.27 seedBuildings() — 字段合法性", () => {
  it("所有写入字段均在 iot_space 白名单内", async () => {
    const { seedBuildings } = await importSeed()
    seedBuildings()
    const rows = getTable("iot_space") as any[]
    const allowed = TableRegistry["iot_space"]
    for (const row of rows) {
      const illegal = Object.keys(row).filter((k) => !allowed.includes(k))
      expect(illegal, `非法字段：${illegal.join(", ")}`).toHaveLength(0)
    }
  })

  it("所有建筑 is_outdoor 为 0（室内历史建筑）", async () => {
    const { seedBuildings } = await importSeed()
    seedBuildings()
    const rows = getTable("iot_space") as any[]
    expect(rows.every((r) => r.is_outdoor === 0)).toBe(true)
  })

  it("所有建筑 type 为 '2'（建筑物）", async () => {
    const { seedBuildings } = await importSeed()
    seedBuildings()
    const rows = getTable("iot_space") as any[]
    expect(rows.every((r) => r.type === "2")).toBe(true)
  })

  it("每个建筑 id 唯一", async () => {
    const { seedBuildings } = await importSeed()
    seedBuildings()
    const rows = getTable("iot_space") as any[]
    const ids = rows.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.27 seedBuildings() — 幂等性", () => {
  it("重复调用两次，建筑数量不累加", async () => {
    const { seedBuildings } = await importSeed()
    seedBuildings()
    const count1 = (getTable("iot_space") as any[]).length
    seedBuildings()
    const count2 = (getTable("iot_space") as any[]).length
    expect(count2).toBe(count1)
  })
})

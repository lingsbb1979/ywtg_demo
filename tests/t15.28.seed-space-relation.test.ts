/**
 * T15.28 — 初始化建筑空间关系 seedSpaceRelation
 *
 * 测试范围：
 *   - seedSpaceRelation 函数可从 src/mock/seeds/seedSpaceRelation.ts 导入
 *   - 调用后 iot_space 中追加 3 个区域节点（向阳区/前进区/东风区，type="1"）
 *   - 23 栋建筑的 parent_id 指向对应区域节点
 *   - digital_archive 中为每栋建筑创建 1 条初始档案记录（共 23 条）
 *   - 所有字段符合 iot_space / digital_archive 白名单（T15.23 约束）
 *   - 幂等：与 seedBuildings 配合调用后结果不累加
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
  // 先写入 23 栋建筑（模拟 seedBuildings 已执行）
  setTable("iot_space", BUILDING_SEED_ROWS)
})

afterEach(() => {
  delete (globalThis as any).localStorage
})

// ── 动态导入 ─────────────────────────────────────────────────────────────────
async function importSeed() {
  return import("../src/mock/seeds/seedSpaceRelation")
}

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.28 seedSpaceRelation() — 导出", () => {
  it("seedSpaceRelation.ts 应导出 seedSpaceRelation 函数", async () => {
    const mod = await importSeed()
    expect(typeof mod.seedSpaceRelation).toBe("function")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.28 seedSpaceRelation() — iot_space 区域节点", () => {
  it("调用后 iot_space 共有 26 条记录（23 建筑 + 3 区域节点）", async () => {
    const { seedSpaceRelation } = await importSeed()
    seedSpaceRelation()
    const rows = getTable("iot_space") as any[]
    expect(rows).toHaveLength(26)
  })

  it("包含 type='1' 的向阳区区域节点", async () => {
    const { seedSpaceRelation } = await importSeed()
    seedSpaceRelation()
    const rows = getTable("iot_space") as any[]
    expect(rows.some((r) => r.type === "1" && (r.name as string).includes("向阳区"))).toBe(true)
  })

  it("包含 type='1' 的前进区区域节点", async () => {
    const { seedSpaceRelation } = await importSeed()
    seedSpaceRelation()
    const rows = getTable("iot_space") as any[]
    expect(rows.some((r) => r.type === "1" && (r.name as string).includes("前进区"))).toBe(true)
  })

  it("包含 type='1' 的东风区区域节点", async () => {
    const { seedSpaceRelation } = await importSeed()
    seedSpaceRelation()
    const rows = getTable("iot_space") as any[]
    expect(rows.some((r) => r.type === "1" && (r.name as string).includes("东风区"))).toBe(true)
  })

  it("iot_space 所有字段均在白名单内", async () => {
    const { seedSpaceRelation } = await importSeed()
    seedSpaceRelation()
    const rows = getTable("iot_space") as any[]
    const allowed = TableRegistry["iot_space"]
    for (const row of rows) {
      const illegal = Object.keys(row).filter((k) => !allowed.includes(k))
      expect(illegal, `非法字段：${illegal.join(", ")}`).toHaveLength(0)
    }
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.28 seedSpaceRelation() — 建筑 parent_id 关联", () => {
  it("向阳区建筑（B001-B008）的 parent_id 指向向阳区节点", async () => {
    const { seedSpaceRelation } = await importSeed()
    seedSpaceRelation()
    const rows = getTable("iot_space") as any[]
    const xiangyang = rows.find((r) => r.type === "1" && (r.name as string).includes("向阳区"))
    expect(xiangyang).toBeDefined()
    const buildings = rows.filter((r) => {
      const code = r.space_code as string
      const n = parseInt(code.replace("B", ""), 10)
      return r.type === "2" && n >= 1 && n <= 8
    })
    expect(buildings).toHaveLength(8)
    expect(buildings.every((b) => b.parent_id === xiangyang.id)).toBe(true)
  })

  it("前进区建筑（B009-B016）的 parent_id 指向前进区节点", async () => {
    const { seedSpaceRelation } = await importSeed()
    seedSpaceRelation()
    const rows = getTable("iot_space") as any[]
    const qianjin = rows.find((r) => r.type === "1" && (r.name as string).includes("前进区"))
    expect(qianjin).toBeDefined()
    const buildings = rows.filter((r) => {
      const code = r.space_code as string
      const n = parseInt(code.replace("B", ""), 10)
      return r.type === "2" && n >= 9 && n <= 16
    })
    expect(buildings).toHaveLength(8)
    expect(buildings.every((b) => b.parent_id === qianjin.id)).toBe(true)
  })

  it("东风区建筑（B017-B023）的 parent_id 指向东风区节点", async () => {
    const { seedSpaceRelation } = await importSeed()
    seedSpaceRelation()
    const rows = getTable("iot_space") as any[]
    const dongfeng = rows.find((r) => r.type === "1" && (r.name as string).includes("东风区"))
    expect(dongfeng).toBeDefined()
    const buildings = rows.filter((r) => {
      const code = r.space_code as string
      const n = parseInt(code.replace("B", ""), 10)
      return r.type === "2" && n >= 17 && n <= 23
    })
    expect(buildings).toHaveLength(7)
    expect(buildings.every((b) => b.parent_id === dongfeng.id)).toBe(true)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.28 seedSpaceRelation() — digital_archive 档案初始化", () => {
  it("调用后 digital_archive 中恰好有 23 条档案记录", async () => {
    const { seedSpaceRelation } = await importSeed()
    seedSpaceRelation()
    const rows = getTable("digital_archive") as any[]
    expect(rows).toHaveLength(23)
  })

  it("每条档案的 building_id 对应一栋建筑（1001-1023）", async () => {
    const { seedSpaceRelation } = await importSeed()
    seedSpaceRelation()
    const rows = getTable("digital_archive") as any[]
    const buildingIds = rows.map((r) => r.building_id as number)
    for (let i = 1001; i <= 1023; i++) {
      expect(buildingIds, `缺少 building_id=${i}`).toContain(i)
    }
  })

  it("building_id 在 digital_archive 中唯一（一建筑一档）", async () => {
    const { seedSpaceRelation } = await importSeed()
    seedSpaceRelation()
    const rows = getTable("digital_archive") as any[]
    const buildingIds = rows.map((r) => r.building_id)
    expect(new Set(buildingIds).size).toBe(buildingIds.length)
  })

  it("所有档案初始 status 为 10（安全）", async () => {
    const { seedSpaceRelation } = await importSeed()
    seedSpaceRelation()
    const rows = getTable("digital_archive") as any[]
    expect(rows.every((r) => r.status === 10)).toBe(true)
  })

  it("digital_archive 所有字段均在白名单内", async () => {
    const { seedSpaceRelation } = await importSeed()
    seedSpaceRelation()
    const rows = getTable("digital_archive") as any[]
    const allowed = TableRegistry["digital_archive"]
    for (const row of rows) {
      const illegal = Object.keys(row).filter((k) => !allowed.includes(k))
      expect(illegal, `非法字段：${illegal.join(", ")}`).toHaveLength(0)
    }
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.28 seedSpaceRelation() — 幂等性", () => {
  it("重复调用两次，iot_space 总数不累加", async () => {
    const { seedSpaceRelation } = await importSeed()
    seedSpaceRelation()
    const count1 = (getTable("iot_space") as any[]).length
    seedSpaceRelation()
    const count2 = (getTable("iot_space") as any[]).length
    expect(count2).toBe(count1)
  })

  it("重复调用两次，digital_archive 总数不累加", async () => {
    const { seedSpaceRelation } = await importSeed()
    seedSpaceRelation()
    const count1 = (getTable("digital_archive") as any[]).length
    seedSpaceRelation()
    const count2 = (getTable("digital_archive") as any[]).length
    expect(count2).toBe(count1)
  })
})

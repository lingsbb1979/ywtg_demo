/**
 * T15.24 TDD — 初始化区域数据
 *
 * 验收标准：生成国家、省、市三级区域演示数据写入 sys_organization 表
 *
 * seedRegion() => void
 *   - 向 sys_organization 写入至少一条国家级（org_level=1）记录
 *   - 向 sys_organization 写入至少一条省级（org_level=2）记录，包含黑龙江省
 *   - 向 sys_organization 写入至少一条市级（org_level=3）记录，包含佳木斯市
 *   - 每行字段必须是 sys_organization 的合法字段（T15.23 白名单校验）
 *   - org_type 统一为区域类型值（1），与功能组织（T15.25）区分
 *   - parent_id 正确关联父级 id，形成树形层级
 *   - 重复调用不累加（先清空再写入，幂等）
 *   - 从 src/mock/seeds/seedRegion.ts 导出
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest"

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

// ── 导出检查 ─────────────────────────────────────────────────────────────────

describe("T15.24 seedRegion() — 导出", () => {
  it("seedRegion.ts 应导出 seedRegion 函数", async () => {
    const mod = await import("../src/mock/seeds/seedRegion")
    expect(typeof mod.seedRegion).toBe("function")
  })
})

// ── 基本写入行为 ──────────────────────────────────────────────────────────────

describe("T15.24 seedRegion() — 基本写入", () => {
  it("调用后 sys_organization 表不为空", async () => {
    const { seedRegion } = await import("../src/mock/seeds/seedRegion")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    seedRegion()
    expect(getTable("sys_organization").length).toBeGreaterThan(0)
  })

  it("包含至少一条国家级记录（org_level=1）", async () => {
    const { seedRegion } = await import("../src/mock/seeds/seedRegion")
    const { list } = await import("../src/services/sqliteMirrorRepository")
    seedRegion()
    const rows = list("sys_organization", { org_level: 1 })
    expect(rows.length).toBeGreaterThanOrEqual(1)
  })

  it("包含至少一条省级记录（org_level=2）", async () => {
    const { seedRegion } = await import("../src/mock/seeds/seedRegion")
    const { list } = await import("../src/services/sqliteMirrorRepository")
    seedRegion()
    const rows = list("sys_organization", { org_level: 2 })
    expect(rows.length).toBeGreaterThanOrEqual(1)
  })

  it("包含至少一条市级记录（org_level=3）", async () => {
    const { seedRegion } = await import("../src/mock/seeds/seedRegion")
    const { list } = await import("../src/services/sqliteMirrorRepository")
    seedRegion()
    const rows = list("sys_organization", { org_level: 3 })
    expect(rows.length).toBeGreaterThanOrEqual(1)
  })
})

// ── 具体演示数据内容 ──────────────────────────────────────────────────────────

describe("T15.24 seedRegion() — 演示数据内容", () => {
  it("包含黑龙江省（org_name = '黑龙江省'）", async () => {
    const { seedRegion } = await import("../src/mock/seeds/seedRegion")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    seedRegion()
    const rows = getTable("sys_organization") as any[]
    expect(rows.some((r) => r.org_name === "黑龙江省")).toBe(true)
  })

  it("包含佳木斯市（org_name = '佳木斯市'）", async () => {
    const { seedRegion } = await import("../src/mock/seeds/seedRegion")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    seedRegion()
    const rows = getTable("sys_organization") as any[]
    expect(rows.some((r) => r.org_name === "佳木斯市")).toBe(true)
  })

  it("佳木斯市的 parent_id 指向黑龙江省", async () => {
    const { seedRegion } = await import("../src/mock/seeds/seedRegion")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    seedRegion()
    const rows = getTable("sys_organization") as any[]
    const province = rows.find((r) => r.org_name === "黑龙江省")
    const city = rows.find((r) => r.org_name === "佳木斯市")
    expect(province).toBeTruthy()
    expect(city).toBeTruthy()
    expect(city.parent_id).toBe(province.id)
  })

  it("黑龙江省的 parent_id 指向国家级记录", async () => {
    const { seedRegion } = await import("../src/mock/seeds/seedRegion")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    seedRegion()
    const rows = getTable("sys_organization") as any[]
    const country = rows.find((r) => r.org_level === 1)
    const province = rows.find((r) => r.org_name === "黑龙江省")
    expect(country).toBeTruthy()
    expect(province.parent_id).toBe(country.id)
  })

  it("区域类型 org_type 统一标记为区域类型（值为 1）", async () => {
    const { seedRegion } = await import("../src/mock/seeds/seedRegion")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    seedRegion()
    const rows = getTable("sys_organization") as any[]
    // 所有区域行的 org_type 均为 1
    expect(rows.every((r) => r.org_type === 1)).toBe(true)
  })

  it("所有记录的 status 为 1（正常）", async () => {
    const { seedRegion } = await import("../src/mock/seeds/seedRegion")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    seedRegion()
    const rows = getTable("sys_organization") as any[]
    expect(rows.every((r) => r.status === 1)).toBe(true)
  })
})

// ── 字段合法性（T15.23 集成）─────────────────────────────────────────────────

describe("T15.24 seedRegion() — 字段合法性", () => {
  it("所有写入字段均在 sys_organization 白名单内", async () => {
    const { seedRegion } = await import("../src/mock/seeds/seedRegion")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    const { TableRegistry } = await import("../src/models/tableRegistry")
    seedRegion()
    const rows = getTable("sys_organization") as any[]
    const allowed = new Set(TableRegistry["sys_organization"])
    for (const row of rows) {
      for (const key of Object.keys(row)) {
        expect(allowed.has(key), `非法字段：${key}`).toBe(true)
      }
    }
  })
})

// ── 幂等性 ────────────────────────────────────────────────────────────────────

describe("T15.24 seedRegion() — 幂等性", () => {
  it("重复调用两次，记录数量不累加", async () => {
    const { seedRegion } = await import("../src/mock/seeds/seedRegion")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    seedRegion()
    const count1 = getTable("sys_organization").length
    seedRegion()
    const count2 = getTable("sys_organization").length
    expect(count2).toBe(count1)
  })
})

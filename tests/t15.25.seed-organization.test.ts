/**
 * T15.25 TDD — 初始化组织数据
 *
 * 验收标准：生成住建局、街道、城管、应急等演示功能组织
 *
 * seedOrganization() => void
 *   - 向 sys_organization 追加功能组织（org_type=2）数据
 *   - 必须包含：住建局（市级 + 区级）、城管局、应急管理局、街道办事处
 *   - id 段从 100 开始，不与区域数据（id 1-99）重叠
 *   - parent_id 正确链接：市级功能组织 → 佳木斯市(id=3)；区级 → 对应区(id=4/5/6)
 *   - org_type=2 与区域数据 org_type=1 明确区分
 *   - 所有字段均在 sys_organization 白名单内（T15.23 校验）
 *   - 幂等：先移除旧的 org_type=2 行再写入，不与区域数据干扰
 *   - 从 src/mock/seeds/seedOrganization.ts 导出
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

describe("T15.25 seedOrganization() — 导出", () => {
  it("seedOrganization.ts 应导出 seedOrganization 函数", async () => {
    const mod = await import("../src/mock/seeds/seedOrganization")
    expect(typeof mod.seedOrganization).toBe("function")
  })
})

// ── 基本写入行为 ──────────────────────────────────────────────────────────────

describe("T15.25 seedOrganization() — 基本写入", () => {
  it("调用后 sys_organization 中存在 org_type=2 的功能组织", async () => {
    const { seedOrganization } = await import("../src/mock/seeds/seedOrganization")
    const { list } = await import("../src/services/sqliteMirrorRepository")
    seedOrganization()
    expect(list("sys_organization", { org_type: 2 }).length).toBeGreaterThan(0)
  })

  it("包含住建局类型组织（org_name 含'住建'或'住房'）", async () => {
    const { seedOrganization } = await import("../src/mock/seeds/seedOrganization")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    seedOrganization()
    const rows = getTable("sys_organization") as any[]
    expect(rows.some((r) => r.org_type === 2 && (r.org_name as string).match(/住建|住房/))).toBe(true)
  })

  it("包含城管局类型组织", async () => {
    const { seedOrganization } = await import("../src/mock/seeds/seedOrganization")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    seedOrganization()
    const rows = getTable("sys_organization") as any[]
    expect(rows.some((r) => r.org_type === 2 && (r.org_name as string).includes("城管"))).toBe(true)
  })

  it("包含应急管理类型组织", async () => {
    const { seedOrganization } = await import("../src/mock/seeds/seedOrganization")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    seedOrganization()
    const rows = getTable("sys_organization") as any[]
    expect(rows.some((r) => r.org_type === 2 && (r.org_name as string).includes("应急"))).toBe(true)
  })

  it("包含街道办事处类型组织", async () => {
    const { seedOrganization } = await import("../src/mock/seeds/seedOrganization")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    seedOrganization()
    const rows = getTable("sys_organization") as any[]
    expect(rows.some((r) => r.org_type === 2 && (r.org_name as string).includes("街道"))).toBe(true)
  })
})

// ── id 段不重叠 ───────────────────────────────────────────────────────────────

describe("T15.25 seedOrganization() — id 段", () => {
  it("所有功能组织 id >= 100", async () => {
    const { seedOrganization } = await import("../src/mock/seeds/seedOrganization")
    const { list } = await import("../src/services/sqliteMirrorRepository")
    seedOrganization()
    const funcOrgs = list("sys_organization", { org_type: 2 }) as any[]
    expect(funcOrgs.every((r) => r.id >= 100)).toBe(true)
  })
})

// ── parent_id 层级关系 ────────────────────────────────────────────────────────

describe("T15.25 seedOrganization() — parent_id 层级", () => {
  it("市级功能组织（org_level=4）parent_id 为 3（佳木斯市）", async () => {
    const { seedOrganization } = await import("../src/mock/seeds/seedOrganization")
    const { list } = await import("../src/services/sqliteMirrorRepository")
    seedOrganization()
    const cityLevel = list("sys_organization", { org_type: 2, org_level: 4 }) as any[]
    expect(cityLevel.length).toBeGreaterThan(0)
    expect(cityLevel.every((r) => r.parent_id === 3)).toBe(true)
  })

  it("区级功能组织（org_level=5）parent_id 在 [4,5,6] 范围内", async () => {
    const { seedOrganization } = await import("../src/mock/seeds/seedOrganization")
    const { list } = await import("../src/services/sqliteMirrorRepository")
    seedOrganization()
    const districtLevel = list("sys_organization", { org_type: 2, org_level: 5 }) as any[]
    expect(districtLevel.length).toBeGreaterThan(0)
    expect(districtLevel.every((r) => [4, 5, 6].includes(r.parent_id))).toBe(true)
  })
})

// ── 字段合法性 ────────────────────────────────────────────────────────────────

describe("T15.25 seedOrganization() — 字段合法性", () => {
  it("所有写入字段均在 sys_organization 白名单内", async () => {
    const { seedOrganization } = await import("../src/mock/seeds/seedOrganization")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    const { TableRegistry } = await import("../src/models/tableRegistry")
    seedOrganization()
    const rows = getTable("sys_organization") as any[]
    const funcRows = rows.filter((r) => r.org_type === 2)
    const allowed = new Set(TableRegistry["sys_organization"])
    for (const row of funcRows) {
      for (const key of Object.keys(row)) {
        expect(allowed.has(key), `非法字段：${key}`).toBe(true)
      }
    }
  })

  it("所有功能组织 status 为 1（正常）", async () => {
    const { seedOrganization } = await import("../src/mock/seeds/seedOrganization")
    const { list } = await import("../src/services/sqliteMirrorRepository")
    seedOrganization()
    const funcOrgs = list("sys_organization", { org_type: 2 }) as any[]
    expect(funcOrgs.every((r) => r.status === 1)).toBe(true)
  })
})

// ── 幂等性 ────────────────────────────────────────────────────────────────────

describe("T15.25 seedOrganization() — 幂等性", () => {
  it("重复调用两次，功能组织数量不累加", async () => {
    const { seedOrganization } = await import("../src/mock/seeds/seedOrganization")
    const { list } = await import("../src/services/sqliteMirrorRepository")
    seedOrganization()
    const count1 = list("sys_organization", { org_type: 2 }).length
    seedOrganization()
    const count2 = list("sys_organization", { org_type: 2 }).length
    expect(count2).toBe(count1)
  })

  it("与 seedRegion 配合：先执行 seedRegion 再执行 seedOrganization，区域数据（org_type=1）不丢失", async () => {
    const { seedRegion } = await import("../src/mock/seeds/seedRegion")
    const { seedOrganization } = await import("../src/mock/seeds/seedOrganization")
    const { list } = await import("../src/services/sqliteMirrorRepository")
    seedRegion()
    seedOrganization()
    // 区域数据不受影响
    expect(list("sys_organization", { org_type: 1 }).length).toBeGreaterThan(0)
    // 功能组织也存在
    expect(list("sys_organization", { org_type: 2 }).length).toBeGreaterThan(0)
  })
})

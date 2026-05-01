/**
 * T15.26 — 初始化用户数据 seedUser
 *
 * 测试范围：
 *   - seedUser 函数及 USER_SEED_ROWS 常量可从 src/mock/seeds/seedUser.ts 导入
 *   - 调用后 sys_user 表含 admin、street01、leader01 三个演示用户
 *   - 所有字段符合 sys_user 白名单（T15.23 约束）
 *   - admin user_type=1（系统管理员），street01 归属街道组织，leader01 存在
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

// ── 动态导入（确保测试文件不存在时也能给出清晰错误）─────────────────────────
async function importSeed() {
  return import("../src/mock/seeds/seedUser")
}

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.26 seedUser() — 导出", () => {
  it("seedUser.ts 应导出 seedUser 函数", async () => {
    const mod = await importSeed()
    expect(typeof mod.seedUser).toBe("function")
  })

  it("seedUser.ts 应导出 USER_SEED_ROWS 常量（数组）", async () => {
    const mod = await importSeed()
    expect(Array.isArray(mod.USER_SEED_ROWS)).toBe(true)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.26 seedUser() — 基本写入", () => {
  it("调用后 sys_user 中存在用户记录", async () => {
    const { seedUser } = await importSeed()
    seedUser()
    const rows = getTable("sys_user") as any[]
    expect(rows.length).toBeGreaterThan(0)
  })

  it("包含 admin 用户（username='admin'）", async () => {
    const { seedUser } = await importSeed()
    seedUser()
    const rows = getTable("sys_user") as any[]
    expect(rows.some((r) => r.username === "admin")).toBe(true)
  })

  it("包含街道外勤用户（username='street01'）", async () => {
    const { seedUser } = await importSeed()
    seedUser()
    const rows = getTable("sys_user") as any[]
    expect(rows.some((r) => r.username === "street01")).toBe(true)
  })

  it("包含领导参观用户（username='leader01'）", async () => {
    const { seedUser } = await importSeed()
    seedUser()
    const rows = getTable("sys_user") as any[]
    expect(rows.some((r) => r.username === "leader01")).toBe(true)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.26 seedUser() — 字段合法性", () => {
  it("所有写入字段均在 sys_user 白名单内", async () => {
    const { seedUser } = await importSeed()
    seedUser()
    const rows = getTable("sys_user") as any[]
    const allowed = TableRegistry["sys_user"]
    for (const row of rows) {
      const illegal = Object.keys(row).filter((k) => !allowed.includes(k))
      expect(illegal, `非法字段：${illegal.join(", ")}`).toHaveLength(0)
    }
  })

  it("所有用户 status 为 1（正常）", async () => {
    const { seedUser } = await importSeed()
    seedUser()
    const rows = getTable("sys_user") as any[]
    expect(rows.every((r) => r.status === 1)).toBe(true)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.26 seedUser() — 业务约束", () => {
  it("admin 的 user_type 为 1（系统管理员）", async () => {
    const { seedUser } = await importSeed()
    seedUser()
    const rows = getTable("sys_user") as any[]
    const admin = rows.find((r) => r.username === "admin")
    expect(admin).toBeDefined()
    expect(admin.user_type).toBe(1)
  })

  it("street01 的 org_id 属于街道组织（id 107-109）", async () => {
    const { seedUser } = await importSeed()
    seedUser()
    const rows = getTable("sys_user") as any[]
    const street = rows.find((r) => r.username === "street01")
    expect(street).toBeDefined()
    expect([107, 108, 109]).toContain(street.org_id)
  })

  it("leader01 存在且 real_name 不为空", async () => {
    const { seedUser } = await importSeed()
    seedUser()
    const rows = getTable("sys_user") as any[]
    const leader = rows.find((r) => r.username === "leader01")
    expect(leader).toBeDefined()
    expect(leader.real_name).toBeTruthy()
  })

  it("每个用户 id 唯一", async () => {
    const { seedUser } = await importSeed()
    seedUser()
    const rows = getTable("sys_user") as any[]
    const ids = rows.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.26 seedUser() — 幂等性", () => {
  it("重复调用两次，用户数量不累加", async () => {
    const { seedUser } = await importSeed()
    seedUser()
    const count1 = (getTable("sys_user") as any[]).length
    seedUser()
    const count2 = (getTable("sys_user") as any[]).length
    expect(count2).toBe(count1)
  })
})

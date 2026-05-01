/**
 * T15.19 TDD — 实现通用 update()
 *
 * 验收标准：任意表可按 `id` 局部更新
 *
 * update<T>(tableName, id, patch) => boolean
 *   - 找到行时：将 patch 中的字段合并到该行（Object.assign 语义）
 *   - 找到返回 true，未找到返回 false
 *   - 不允许通过 patch 修改 id 字段（忽略 patch.id）
 *   - 表不存在时返回 false，不抛出异常
 *   - 其他行不受影响
 *   - 从 sqliteMirrorRepository 具名导出
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

describe("T15.19 update() — 导出", () => {
  it("sqliteMirrorRepository 应导出 update 函数", async () => {
    const mod = await import("../src/services/sqliteMirrorRepository")
    expect(typeof mod.update).toBe("function")
  })
})

// ── 基本行为 ─────────────────────────────────────────────────────────────────

describe("T15.19 update() — 基本行为", () => {
  it("找到行时返回 true", async () => {
    const { setTable, update } = await import("../src/services/sqliteMirrorRepository")
    // alarm_record 使用 status 字段（非 alarm_status）
    setTable("alarm_record", [{ id: 1, status: 0 }])
    expect(update("alarm_record", 1, { status: 1 })).toBe(true)
  })

  it("id 不存在时返回 false", async () => {
    const { setTable, update } = await import("../src/services/sqliteMirrorRepository")
    setTable("alarm_record", [{ id: 1, status: 0 }])
    expect(update("alarm_record", 999, { status: 1 })).toBe(false)
  })

  it("表不存在时返回 false（不抛出异常）", async () => {
    const { update } = await import("../src/services/sqliteMirrorRepository")
    expect(update("work_order", 1, { status: 2 })).toBe(false)
  })

  it("patch 字段被合并到目标行", async () => {
    const { setTable, getById, update } = await import("../src/services/sqliteMirrorRepository")
    // alarm_record 字段：status、building_id、alarm_code
    setTable("alarm_record", [{ id: 1, status: 0, building_id: 10, alarm_code: "ALM-001" }])
    update("alarm_record", 1, { status: 3 })
    const row = getById("alarm_record", 1) as any
    expect(row.status).toBe(3)
    expect(row.alarm_code).toBe("ALM-001")   // 未被 patch 的字段保留
    expect(row.building_id).toBe(10)
  })

  it("多字段 patch 全部生效", async () => {
    const { setTable, getById, update } = await import("../src/services/sqliteMirrorRepository")
    // work_order 字段：status、assignee_id、priority
    setTable("work_order", [{ id: 1, status: 0, assignee_id: null, priority: 0 }])
    update("work_order", 1, { status: 2, assignee_id: 99, priority: 1 })
    const row = getById("work_order", 1) as any
    expect(row.status).toBe(2)
    expect(row.assignee_id).toBe(99)
    expect(row.priority).toBe(1)
  })

  it("patch 中的 id 字段被忽略，不修改原始 id", async () => {
    const { setTable, getById, update } = await import("../src/services/sqliteMirrorRepository")
    setTable("iot_space", [{ id: 1, name: "建筑A" }])
    update("iot_space", 1, { id: 999, name: "建筑B" } as any)
    const row = getById("iot_space", 1) as any
    expect(row).not.toBeNull()
    expect(row.id).toBe(1)        // id 不变
    expect(row.name).toBe("建筑B") // name 已更新
  })

  it("其他行不受影响", async () => {
    const { setTable, getById, update } = await import("../src/services/sqliteMirrorRepository")
    setTable("alarm_record", [
      { id: 1, status: 0 },
      { id: 2, status: 0 },
      { id: 3, status: 0 },
    ])
    update("alarm_record", 2, { status: 5 })
    expect((getById("alarm_record", 1) as any).status).toBe(0)
    expect((getById("alarm_record", 3) as any).status).toBe(0)
  })

  it("更新持久化到存储（getTable 能读到新值）", async () => {
    const { setTable, getTable, update } = await import("../src/services/sqliteMirrorRepository")
    setTable("work_order", [{ id: 1, status: 0 }])
    update("work_order", 1, { status: 4 })
    const rows = getTable("work_order") as any[]
    expect(rows[0].status).toBe(4)
  })

  it("字符串 id 同样支持", async () => {
    const { setTable, getById, update } = await import("../src/services/sqliteMirrorRepository")
    setTable("alarm_record", [{ id: "uuid-001", status: 0 }])
    const ok = update("alarm_record", "uuid-001", { status: 9 })
    expect(ok).toBe(true)
    expect((getById("alarm_record", "uuid-001") as any).status).toBe(9)
  })
})

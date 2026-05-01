/**
 * T15.20 TDD — 实现通用 remove()
 *
 * 验收标准：任意表可按 `id` 删除，P0 只用于演示数据维护（P1）
 *
 * remove(tableName, id) => boolean
 *   - 找到行并删除返回 true
 *   - id 不存在时返回 false（不抛出异常）
 *   - 表不存在时返回 false
 *   - 删除后该行不再存在于存储中
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

describe("T15.20 remove() — 导出", () => {
  it("sqliteMirrorRepository 应导出 remove 函数", async () => {
    const mod = await import("../src/services/sqliteMirrorRepository")
    expect(typeof mod.remove).toBe("function")
  })
})

// ── 基本行为 ─────────────────────────────────────────────────────────────────

describe("T15.20 remove() — 基本行为", () => {
  it("找到行时返回 true", async () => {
    const { setTable, remove } = await import("../src/services/sqliteMirrorRepository")
    setTable("alarm_record", [{ id: 1, alarm_code: "ALM-001" }])
    expect(remove("alarm_record", 1)).toBe(true)
  })

  it("id 不存在时返回 false", async () => {
    const { setTable, remove } = await import("../src/services/sqliteMirrorRepository")
    setTable("alarm_record", [{ id: 1 }])
    expect(remove("alarm_record", 999)).toBe(false)
  })

  it("表不存在时返回 false（不抛出异常）", async () => {
    const { remove } = await import("../src/services/sqliteMirrorRepository")
    expect(remove("work_order", 1)).toBe(false)
  })

  it("删除后该行不再存在", async () => {
    const { setTable, getById, remove } = await import("../src/services/sqliteMirrorRepository")
    setTable("iot_space", [{ id: 1, name: "建筑A" }])
    remove("iot_space", 1)
    expect(getById("iot_space", 1)).toBeNull()
  })

  it("删除后表行数减一", async () => {
    const { setTable, getTable, remove } = await import("../src/services/sqliteMirrorRepository")
    setTable("alarm_record", [{ id: 1 }, { id: 2 }, { id: 3 }])
    remove("alarm_record", 2)
    expect(getTable("alarm_record").length).toBe(2)
  })

  it("其他行不受影响", async () => {
    const { setTable, getById, remove } = await import("../src/services/sqliteMirrorRepository")
    setTable("alarm_record", [
      { id: 1, alarm_code: "ALM-001" },
      { id: 2, alarm_code: "ALM-002" },
      { id: 3, alarm_code: "ALM-003" },
    ])
    remove("alarm_record", 2)
    expect((getById("alarm_record", 1) as any).alarm_code).toBe("ALM-001")
    expect((getById("alarm_record", 3) as any).alarm_code).toBe("ALM-003")
  })

  it("字符串 id 同样支持", async () => {
    const { setTable, getById, remove } = await import("../src/services/sqliteMirrorRepository")
    setTable("alarm_record", [{ id: "uuid-001" }, { id: "uuid-002" }])
    expect(remove("alarm_record", "uuid-001")).toBe(true)
    expect(getById("alarm_record", "uuid-001")).toBeNull()
    expect(getById("alarm_record", "uuid-002")).not.toBeNull()
  })

  it("删除持久化到存储（getTable 读不到已删行）", async () => {
    const { setTable, getTable, remove } = await import("../src/services/sqliteMirrorRepository")
    setTable("work_order", [{ id: 1, order_no: "WO-001" }, { id: 2, order_no: "WO-002" }])
    remove("work_order", 1)
    const rows = getTable("work_order") as any[]
    expect(rows.every((r) => r.id !== 1)).toBe(true)
  })
})

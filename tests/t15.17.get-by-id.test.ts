/**
 * T15.17 TDD — 实现通用 getById()
 *
 * 验收标准：任意表可按 `id` 查询详情
 *
 * getById<T>(tableName, id) => T | null
 *   - 找到时返回该行的浅拷贝
 *   - 找不到时返回 null（不抛出异常）
 *   - 表不存在时返回 null
 *   - id 类型：number | string（兼容自增整型和 UUID 字符串）
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

describe("T15.17 getById() — 导出", () => {
  it("sqliteMirrorRepository 应导出 getById 函数", async () => {
    const mod = await import("../src/services/sqliteMirrorRepository")
    expect(typeof mod.getById).toBe("function")
  })
})

// ── 基本行为 ─────────────────────────────────────────────────────────────────

describe("T15.17 getById() — 基本行为", () => {
  it("按数字 id 找到行时返回该行", async () => {
    const { setTable, getById } = await import("../src/services/sqliteMirrorRepository")
    setTable("iot_space", [
      { id: 1, name: "建筑A" },
      { id: 2, name: "建筑B" },
    ])
    const row = getById("iot_space", 1) as any
    expect(row).not.toBeNull()
    expect(row.name).toBe("建筑A")
  })

  it("按字符串 id 找到行时返回该行", async () => {
    const { setTable, getById } = await import("../src/services/sqliteMirrorRepository")
    setTable("alarm_record", [
      { id: "uuid-001", alarm_code: "ALM-001" },
      { id: "uuid-002", alarm_code: "ALM-002" },
    ])
    const row = getById("alarm_record", "uuid-001") as any
    expect(row).not.toBeNull()
    expect(row.alarm_code).toBe("ALM-001")
  })

  it("id 不存在时返回 null", async () => {
    const { setTable, getById } = await import("../src/services/sqliteMirrorRepository")
    setTable("work_order", [{ id: 1, order_no: "WO-001" }])
    expect(getById("work_order", 999)).toBeNull()
  })

  it("表为空时返回 null", async () => {
    const { setTable, getById } = await import("../src/services/sqliteMirrorRepository")
    setTable("alarm_record", [])
    expect(getById("alarm_record", 1)).toBeNull()
  })

  it("表不存在时返回 null（不抛出异常）", async () => {
    const { getById } = await import("../src/services/sqliteMirrorRepository")
    expect(getById("iot_telemetry", 1)).toBeNull()
  })

  it("多行中精准命中正确行", async () => {
    const { setTable, getById } = await import("../src/services/sqliteMirrorRepository")
    const rows = [
      { id: 10, name: "A" },
      { id: 20, name: "B" },
      { id: 30, name: "C" },
    ]
    setTable("iot_space", rows)
    expect((getById("iot_space", 20) as any).name).toBe("B")
  })
})

// ── 隔离性 ───────────────────────────────────────────────────────────────────

describe("T15.17 getById() — 返回值隔离", () => {
  it("修改返回值不影响原始存储数据", async () => {
    const { setTable, getById, getTable } = await import("../src/services/sqliteMirrorRepository")
    setTable("iot_space", [{ id: 1, name: "Original" }])
    const row = getById("iot_space", 1) as any
    row.name = "MUTATED"
    expect((getTable("iot_space")[0] as any).name).toBe("Original")
  })
})

/**
 * T15.18 TDD — 实现通用 insert()
 *
 * 验收标准：任意表可新增记录，并自动补充时间字段
 *
 * insert<T>(tableName, row) => T
 *   - 如果 row 未提供 id，自动生成（现有最大 id + 1，表为空则从 1 开始）
 *   - 如果 row 已提供 id，以 row.id 为准
 *   - 如果该表字段中含 create_time 且 row 未提供，自动补充 ISO 8601 字符串
 *   - 如果该表字段中含 update_time 且 row 未提供，自动补充 ISO 8601 字符串
 *   - 返回最终写入的行（含自动补充字段）
 *   - 新行追加到表末尾
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

describe("T15.18 insert() — 导出", () => {
  it("sqliteMirrorRepository 应导出 insert 函数", async () => {
    const mod = await import("../src/services/sqliteMirrorRepository")
    expect(typeof mod.insert).toBe("function")
  })
})

// ── id 自动生成 ───────────────────────────────────────────────────────────────

describe("T15.18 insert() — id 自动生成", () => {
  it("表为空时 id 从 1 开始", async () => {
    const { insert } = await import("../src/services/sqliteMirrorRepository")
    const row = insert("iot_space", { name: "建筑A" }) as any
    expect(row.id).toBe(1)
  })

  it("表已有行时 id = max(id) + 1", async () => {
    const { setTable, insert } = await import("../src/services/sqliteMirrorRepository")
    setTable("iot_space", [{ id: 3, name: "A" }, { id: 1, name: "B" }, { id: 5, name: "C" }])
    const row = insert("iot_space", { name: "D" }) as any
    expect(row.id).toBe(6)
  })

  it("row 已提供 id 时使用 row.id，不覆盖", async () => {
    const { insert } = await import("../src/services/sqliteMirrorRepository")
    const row = insert("alarm_record", { id: 42, alarm_code: "ALM-042" }) as any
    expect(row.id).toBe(42)
  })
})

// ── 时间字段自动补充 ──────────────────────────────────────────────────────────

describe("T15.18 insert() — 自动补充时间字段", () => {
  it("表有 create_time 且未提供时自动填充 ISO 字符串", async () => {
    const { insert } = await import("../src/services/sqliteMirrorRepository")
    // iot_space 表有 create_time 字段
    const row = insert("iot_space", { name: "建筑A" }) as any
    expect(typeof row.create_time).toBe("string")
    expect(() => new Date(row.create_time)).not.toThrow()
    expect(new Date(row.create_time).getFullYear()).toBeGreaterThan(2020)
  })

  it("表有 create_time 且已提供时不覆盖", async () => {
    const { insert } = await import("../src/services/sqliteMirrorRepository")
    const fixed = "2025-01-01T00:00:00.000Z"
    const row = insert("iot_space", { name: "建筑A", create_time: fixed }) as any
    expect(row.create_time).toBe(fixed)
  })

  it("表无 create_time 字段时不写入 create_time（iot_telemetry 无该字段）", async () => {
    const { insert } = await import("../src/services/sqliteMirrorRepository")
    // iot_telemetry 字段：ts, point_id, value_num, value_str, quality
    const row = insert("iot_telemetry", { ts: "2025-01-01T00:00:00", point_id: 1, value_num: 1.0 }) as any
    expect(row.create_time).toBeUndefined()
  })

  it("表有 update_time 且未提供时自动填充", async () => {
    const { insert } = await import("../src/services/sqliteMirrorRepository")
    // sys_config 有 create_time 和 update_time
    const row = insert("sys_config", { module_code: "M", config_key: "K", config_value: "V", value_type: "STRING", effective_scope: "ALL", status: 1 }) as any
    expect(typeof row.update_time).toBe("string")
  })

  it("表有 update_time 且已提供时不覆盖", async () => {
    const { insert } = await import("../src/services/sqliteMirrorRepository")
    const fixed = "2025-06-01T00:00:00.000Z"
    const row = insert("sys_config", { module_code: "M", config_key: "K", config_value: "V", value_type: "STRING", effective_scope: "ALL", status: 1, update_time: fixed }) as any
    expect(row.update_time).toBe(fixed)
  })
})

// ── 存储与返回值 ──────────────────────────────────────────────────────────────

describe("T15.18 insert() — 存储持久化与行为", () => {
  it("新行追加到表末尾", async () => {
    const { setTable, getTable, insert } = await import("../src/services/sqliteMirrorRepository")
    setTable("alarm_record", [{ id: 1, alarm_code: "A" }, { id: 2, alarm_code: "B" }])
    insert("alarm_record", { alarm_code: "C" })
    const rows = getTable("alarm_record") as any[]
    expect(rows.length).toBe(3)
    expect(rows[2].alarm_code).toBe("C")
  })

  it("返回值含自动补充的所有字段", async () => {
    const { insert } = await import("../src/services/sqliteMirrorRepository")
    const row = insert("iot_space", { name: "建筑X" }) as any
    expect(row).toHaveProperty("id")
    expect(row).toHaveProperty("name", "建筑X")
    expect(row).toHaveProperty("create_time")
  })

  it("getById 可以读到刚插入的行", async () => {
    const { insert, getById } = await import("../src/services/sqliteMirrorRepository")
    const inserted = insert("iot_space", { name: "建筑Y" }) as any
    const found = getById("iot_space", inserted.id) as any
    expect(found).not.toBeNull()
    expect(found.name).toBe("建筑Y")
  })
})

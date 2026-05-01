/**
 * T15.16 TDD — 实现通用 list()
 *
 * 验收标准：任意表可按条件查询列表
 *
 * list<T>(tableName, filter?) => T[]
 *   - 无 filter：返回整张表所有行
 *   - filter 为对象：返回所有与 filter 每个 key-value 均匹配的行（AND 条件）
 *   - filter 为函数：返回 predicate 返回 true 的行
 *   - 表不存在时返回空数组，绝不抛出异常
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

let fakeStorage: Storage

beforeEach(() => {
  fakeStorage = createFakeStorage()
  ;(globalThis as any).localStorage = fakeStorage
})

afterEach(() => {
  delete (globalThis as any).localStorage
})

// ── 导出检查 ─────────────────────────────────────────────────────────────────

describe("T15.16 list() — 导出", () => {
  it("sqliteMirrorRepository 应导出 list 函数", async () => {
    const mod = await import("../src/services/sqliteMirrorRepository")
    expect(typeof mod.list).toBe("function")
  })
})

// ── 行为测试 ─────────────────────────────────────────────────────────────────

describe("T15.16 list() — 无 filter", () => {
  it("表不存在时返回空数组", async () => {
    const { list } = await import("../src/services/sqliteMirrorRepository")
    expect(list("iot_space")).toEqual([])
  })

  it("返回整张表所有行", async () => {
    const { setTable, list } = await import("../src/services/sqliteMirrorRepository")
    setTable("alarm_record", [
      { id: 1, alarm_code: "ALM-001" },
      { id: 2, alarm_code: "ALM-002" },
    ])
    const result = list("alarm_record")
    expect(result.length).toBe(2)
  })

  it("返回的行内容与写入一致（深比较）", async () => {
    const { setTable, list } = await import("../src/services/sqliteMirrorRepository")
    const row = { id: 1, name: "建筑A", space_code: "B01" }
    setTable("iot_space", [row])
    expect(list("iot_space")[0]).toEqual(row)
  })
})

describe("T15.16 list() — 对象 filter（AND 条件）", () => {
  it("单字段 filter：只返回匹配行", async () => {
    const { setTable, list } = await import("../src/services/sqliteMirrorRepository")
    setTable("alarm_record", [
      { id: 1, alarm_status: 0, space_id: 10 },
      { id: 2, alarm_status: 1, space_id: 10 },
      { id: 3, alarm_status: 0, space_id: 20 },
    ])
    const result = list("alarm_record", { alarm_status: 0 })
    expect(result.length).toBe(2)
    expect(result.every((r: any) => r.alarm_status === 0)).toBe(true)
  })

  it("多字段 filter：AND 逻辑", async () => {
    const { setTable, list } = await import("../src/services/sqliteMirrorRepository")
    setTable("alarm_record", [
      { id: 1, alarm_status: 0, space_id: 10 },
      { id: 2, alarm_status: 1, space_id: 10 },
      { id: 3, alarm_status: 0, space_id: 20 },
    ])
    const result = list("alarm_record", { alarm_status: 0, space_id: 10 })
    expect(result.length).toBe(1)
    expect((result[0] as any).id).toBe(1)
  })

  it("无匹配时返回空数组", async () => {
    const { setTable, list } = await import("../src/services/sqliteMirrorRepository")
    setTable("work_order", [{ id: 1, status: 2 }, { id: 2, status: 3 }])
    expect(list("work_order", { status: 99 })).toEqual([])
  })

  it("空 filter 对象等价于无 filter，返回全部", async () => {
    const { setTable, list } = await import("../src/services/sqliteMirrorRepository")
    setTable("iot_space", [{ id: 1 }, { id: 2 }, { id: 3 }])
    expect(list("iot_space", {}).length).toBe(3)
  })
})

describe("T15.16 list() — 函数 filter（predicate）", () => {
  it("predicate 返回 true 的行被包含", async () => {
    const { setTable, list } = await import("../src/services/sqliteMirrorRepository")
    setTable("alarm_record", [
      { id: 1, value_num: 5.0  },
      { id: 2, value_num: 15.0 },
      { id: 3, value_num: 9.0  },
    ])
    const result = list("alarm_record", (row: any) => row.value_num > 10)
    expect(result.length).toBe(1)
    expect((result[0] as any).id).toBe(2)
  })

  it("predicate 全部 false 时返回空数组", async () => {
    const { setTable, list } = await import("../src/services/sqliteMirrorRepository")
    setTable("alarm_record", [{ id: 1 }, { id: 2 }])
    expect(list("alarm_record", () => false)).toEqual([])
  })

  it("predicate 全部 true 时返回所有行", async () => {
    const { setTable, list } = await import("../src/services/sqliteMirrorRepository")
    setTable("iot_space", [{ id: 1 }, { id: 2 }])
    expect(list("iot_space", () => true).length).toBe(2)
  })
})

describe("T15.16 list() — 稳定性", () => {
  it("不影响原始存储数据（返回值为新数组）", async () => {
    const { setTable, getTable, list } = await import("../src/services/sqliteMirrorRepository")
    setTable("iot_space", [{ id: 1, name: "A" }])
    const result = list("iot_space") as any[]
    result[0].name = "MUTATED"
    // 原始数据不受影响
    expect((getTable("iot_space")[0] as any).name).toBe("A")
  })
})

/**
 * T15.23 TDD — 实现字段白名单校验
 *
 * 验收标准：插入和更新时禁止出现 SQL 表不存在的字段
 *
 * validateFields(tableName, fields, operation) => void
 *   - fields 中所有 key 必须存在于 TableRegistry[tableName] 白名单内
 *   - 出现非法字段时抛出 Error，消息中包含表名和非法字段名
 *   - TableRegistry 未登记该表时直接跳过校验（不抛出）
 *   - 从 sqliteMirrorRepository 具名导出
 *
 * insert() 集成校验：
 *   - 用户传入含非法字段的 row 时抛出 Error
 *   - 仅含合法字段时正常写入
 *
 * update() 集成校验：
 *   - 用户传入含非法字段的 patch 时抛出 Error
 *   - 仅含合法字段时正常写入
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

describe("T15.23 validateFields() — 导出", () => {
  it("sqliteMirrorRepository 应导出 validateFields 函数", async () => {
    const mod = await import("../src/services/sqliteMirrorRepository")
    expect(typeof mod.validateFields).toBe("function")
  })
})

// ── validateFields 独立行为 ───────────────────────────────────────────────────

describe("T15.23 validateFields() — 基本行为", () => {
  it("合法字段不抛出", async () => {
    const { validateFields } = await import("../src/services/sqliteMirrorRepository")
    // iot_space 有 id, name, space_code 等合法字段
    expect(() =>
      validateFields("iot_space", { id: 1, name: "建筑A" }, "insert")
    ).not.toThrow()
  })

  it("含非法字段时抛出 Error", async () => {
    const { validateFields } = await import("../src/services/sqliteMirrorRepository")
    expect(() =>
      validateFields("alarm_record", { id: 1, fakeField: "x" }, "insert")
    ).toThrow()
  })

  it("错误消息包含表名", async () => {
    const { validateFields } = await import("../src/services/sqliteMirrorRepository")
    let msg = ""
    try {
      validateFields("alarm_record", { id: 1, fakeField: "x" }, "insert")
    } catch (e: any) {
      msg = e.message
    }
    expect(msg).toContain("alarm_record")
  })

  it("错误消息包含非法字段名", async () => {
    const { validateFields } = await import("../src/services/sqliteMirrorRepository")
    let msg = ""
    try {
      validateFields("alarm_record", { id: 1, fakeField: "x" }, "insert")
    } catch (e: any) {
      msg = e.message
    }
    expect(msg).toContain("fakeField")
  })

  it("多个非法字段时错误消息包含全部字段名", async () => {
    const { validateFields } = await import("../src/services/sqliteMirrorRepository")
    let msg = ""
    try {
      validateFields("work_order", { id: 1, badField1: 1, badField2: 2 }, "update")
    } catch (e: any) {
      msg = e.message
    }
    expect(msg).toContain("badField1")
    expect(msg).toContain("badField2")
  })

  it("operation 为 update 时错误消息体现操作类型", async () => {
    const { validateFields } = await import("../src/services/sqliteMirrorRepository")
    let msg = ""
    try {
      validateFields("work_order", { badField: 1 }, "update")
    } catch (e: any) {
      msg = e.message
    }
    expect(msg.toLowerCase()).toMatch(/update|更新/)
  })

  it("表不在 TableRegistry 时跳过校验（不抛出）", async () => {
    const { validateFields } = await import("../src/services/sqliteMirrorRepository")
    // 直接传入不在 TableRegistry 的表名（绕过 TypeScript 类型检查用 as any）
    expect(() =>
      // @ts-expect-error 测试目的：主动传入未注册表名
      validateFields("non_existent_table" as any, { anyField: 1 }, "insert")
    ).not.toThrow()
  })
})

// ── insert() 集成校验 ─────────────────────────────────────────────────────────

describe("T15.23 insert() — 字段白名单校验集成", () => {
  it("插入合法字段时正常写入，不抛出", async () => {
    const { insert } = await import("../src/services/sqliteMirrorRepository")
    // alarm_record 合法字段：alarm_code, building_id, alarm_level
    expect(() =>
      insert("alarm_record", { alarm_code: "ALM-001", building_id: 1, alarm_level: 2 })
    ).not.toThrow()
  })

  it("插入含非法字段时抛出 Error", async () => {
    const { insert } = await import("../src/services/sqliteMirrorRepository")
    expect(() =>
      insert("alarm_record", { alarm_code: "ALM-001", nonExistentCol: "x" } as any)
    ).toThrow()
  })

  it("insert 错误消息包含表名和非法字段名", async () => {
    const { insert } = await import("../src/services/sqliteMirrorRepository")
    let msg = ""
    try {
      insert("work_order", { status: 0, illegalField: "y" } as any)
    } catch (e: any) {
      msg = e.message
    }
    expect(msg).toContain("work_order")
    expect(msg).toContain("illegalField")
  })

  it("insert 非法字段时不写入任何数据", async () => {
    const { insert, getTable } = await import("../src/services/sqliteMirrorRepository")
    try {
      insert("alarm_record", { alarm_code: "ALM-999", ghost: true } as any)
    } catch {
      // expected
    }
    const rows = getTable("alarm_record")
    expect(rows).toHaveLength(0)
  })
})

// ── update() 集成校验 ─────────────────────────────────────────────────────────

describe("T15.23 update() — 字段白名单校验集成", () => {
  it("更新合法字段时正常生效，不抛出", async () => {
    const { setTable, update } = await import("../src/services/sqliteMirrorRepository")
    // alarm_record 合法字段：status（非 alarm_status）
    setTable("alarm_record", [{ id: 1, status: 0 }])
    expect(() =>
      update("alarm_record", 1, { status: 1 })
    ).not.toThrow()
  })

  it("更新含非法字段时抛出 Error", async () => {
    const { setTable, update } = await import("../src/services/sqliteMirrorRepository")
    setTable("alarm_record", [{ id: 1, alarm_status: 0 }])
    expect(() =>
      update("alarm_record", 1, { alarm_status: 1, fakeCol: "bad" } as any)
    ).toThrow()
  })

  it("update 错误消息包含表名和非法字段名", async () => {
    const { setTable, update } = await import("../src/services/sqliteMirrorRepository")
    setTable("work_order", [{ id: 1, status: 0 }])
    let msg = ""
    try {
      update("work_order", 1, { status: 1, ghostPatch: "z" } as any)
    } catch (e: any) {
      msg = e.message
    }
    expect(msg).toContain("work_order")
    expect(msg).toContain("ghostPatch")
  })

  it("update 非法字段时原行数据不被修改", async () => {
    const { setTable, update, getById } = await import("../src/services/sqliteMirrorRepository")
    setTable("alarm_record", [{ id: 1, alarm_status: 0 }])
    try {
      update("alarm_record", 1, { alarm_status: 99, fakeCol: "bad" } as any)
    } catch {
      // expected
    }
    const row = getById("alarm_record", 1) as any
    expect(row.alarm_status).toBe(0)   // 原值未被污染
  })
})

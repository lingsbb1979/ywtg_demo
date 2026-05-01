/**
 * T15.15 TDD — 实现 resetTables()
 *
 * 验收标准：
 *   - 清除 localStorage 中所有 ywtg.sqlite.* 业务表数据
 *   - 不生成前端自造表（写入后的 key 全部来自 TableNames）
 *   - ywtg.ui.* 键（UI 状态）不受影响，保持原值
 *   - ywtg.session.* 键不受影响
 *   - 重置后 getTable() 对任意真实表返回空数组
 *   - 函数从 sqliteMirrorRepository 导出
 *
 * 说明：
 *   T15.15 只负责"清除"；真实种子数据填充由 T15.24~T15.32 完成。
 *   resetTables() 未来可扩展为"清除 + 调用 seed"，但本任务
 *   的核心约束是：不残留脏数据、不写入自造表。
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

describe("T15.15 resetTables() — 导出", () => {
  it("sqliteMirrorRepository 应导出 resetTables 函数", async () => {
    const mod = await import("../src/services/sqliteMirrorRepository")
    expect(typeof mod.resetTables).toBe("function")
  })
})

// ── 行为测试 ─────────────────────────────────────────────────────────────────

describe("T15.15 resetTables() — 行为", () => {
  it("重置后 getTable 对 iot_space 返回空数组", async () => {
    const { setTable, getTable, resetTables } = await import("../src/services/sqliteMirrorRepository")
    setTable("iot_space", [{ id: 1, name: "建筑A" }])
    resetTables()
    expect(getTable("iot_space").length).toBe(0)
  })

  it("重置后 getTable 对 alarm_record 返回空数组", async () => {
    const { setTable, getTable, resetTables } = await import("../src/services/sqliteMirrorRepository")
    setTable("alarm_record", [{ id: 1, alarm_code: "ALM-001" }])
    resetTables()
    expect(getTable("alarm_record").length).toBe(0)
  })

  it("重置后 getTable 对 work_order 返回空数组", async () => {
    const { setTable, getTable, resetTables } = await import("../src/services/sqliteMirrorRepository")
    setTable("work_order", [{ id: 1, order_no: "WO-001" }, { id: 2, order_no: "WO-002" }])
    resetTables()
    expect(getTable("work_order").length).toBe(0)
  })

  it("重置后多张 P0 表全部清空", async () => {
    const { setTable, getTable, resetTables } = await import("../src/services/sqliteMirrorRepository")
    setTable("iot_space",         [{ id: 1, name: "X" }])
    setTable("iot_telemetry",     [{ ts: "2025-01-01T00:00:00", point_id: 1, value_num: 1.0 }])
    setTable("field_evidence",    [{ id: 1, media_type: "PHOTO" }])
    setTable("work_order_disposal",[{ id: 1, order_id: 1 }])
    resetTables()
    expect(getTable("iot_space").length).toBe(0)
    expect(getTable("iot_telemetry").length).toBe(0)
    expect(getTable("field_evidence").length).toBe(0)
    expect(getTable("work_order_disposal").length).toBe(0)
  })

  it("resetTables 不影响 ywtg.ui.* 键", async () => {
    const { resetTables } = await import("../src/services/sqliteMirrorRepository")
    fakeStorage.setItem("ywtg.ui.demoRole", "DUTY_OFFICER")
    resetTables()
    expect(fakeStorage.getItem("ywtg.ui.demoRole")).toBe("DUTY_OFFICER")
  })

  it("resetTables 不影响 ywtg.session.* 键", async () => {
    const { resetTables } = await import("../src/services/sqliteMirrorRepository")
    fakeStorage.setItem("ywtg.session.auth", JSON.stringify({ isLoggedIn: true }))
    resetTables()
    expect(fakeStorage.getItem("ywtg.session.auth")).not.toBeNull()
  })

  it("重置后不残留任何 ywtg.sqlite.* 键", async () => {
    const { setTable, resetTables } = await import("../src/services/sqliteMirrorRepository")
    setTable("iot_space",     [{ id: 1, name: "A" }])
    setTable("alarm_record",  [{ id: 1, alarm_code: "X" }])
    setTable("system_log",    [{ log_id: 1, operation_type: "LOGIN" }])
    resetTables()
    // 检查 fakeStorage 中没有 ywtg.sqlite. 前缀的键
    let found = false
    for (let i = 0; i < fakeStorage.length; i++) {
      const k = fakeStorage.key(i)!
      if (k.startsWith("ywtg.sqlite.")) { found = true; break }
    }
    expect(found).toBe(false)
  })

  it("不产生任何前端自造表（写入后的 ywtg.sqlite.* 键全来自 TableNames）", async () => {
    const { setTable, resetTables, getTable } = await import("../src/services/sqliteMirrorRepository")
    const { TableNames } = await import("../src/models/tableNames")
    const validValues = new Set(Object.values(TableNames) as string[])

    setTable("iot_space", [{ id: 1 }])
    resetTables()

    // 重置后 localStorage 中如有 ywtg.sqlite.* 键，其表名必须在 TableNames 里
    for (let i = 0; i < fakeStorage.length; i++) {
      const k = fakeStorage.key(i)!
      if (k.startsWith("ywtg.sqlite.")) {
        const tableName = k.replace("ywtg.sqlite.", "")
        expect(validValues.has(tableName), `发现自造表: ${tableName}`).toBe(true)
      }
    }
    // 重置后不应有任何业务表 key
    expect(getTable("iot_space").length).toBe(0)
  })
})

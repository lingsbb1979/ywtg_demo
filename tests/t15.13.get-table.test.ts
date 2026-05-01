/**
 * T15.13 TDD — 实现 getTable()
 *
 * 验收标准：
 *   - 可从 `ywtg.sqlite.<tableName>` 读取真实表数组
 *   - tableName 参数必须受 TableName 联合类型约束（只接受 完整SQL.md 中存在的表名）
 *   - 返回空数组（从未写入时），而非 null / undefined / 抛出异常
 *   - localStorage 不可用时（Node 测试环境）回退到内存存储
 *   - 读取到的数组元素数量与写入时一致
 *   - 从 sqliteMirrorRepository 导出（不新建文件）
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

describe("T15.13 getTable() — 导出", () => {
  it("sqliteMirrorRepository 应导出 getTable 函数", async () => {
    const mod = await import("../src/services/sqliteMirrorRepository")
    expect(typeof mod.getTable).toBe("function")
  })
})

// ── 行为测试 ─────────────────────────────────────────────────────────────────

describe("T15.13 getTable() — 行为", () => {
  it("从未写入的表返回空数组（非 null）", async () => {
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    const rows = getTable("iot_space")
    expect(Array.isArray(rows)).toBe(true)
    expect(rows.length).toBe(0)
  })

  it("返回值类型是数组", async () => {
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    const result = getTable("alarm_record")
    expect(Array.isArray(result)).toBe(true)
  })

  it("写入后 getTable 能读回相同数量的行", async () => {
    const { getTable, setTable } = await import("../src/services/sqliteMirrorRepository")
    const rows = [
      { id: 1, name: "建筑A", space_code: "B001", create_time: "2025-01-01" },
      { id: 2, name: "建筑B", space_code: "B002", create_time: "2025-01-01" },
    ]
    setTable("iot_space", rows)
    const result = getTable("iot_space")
    expect(result.length).toBe(2)
  })

  it("写入后 getTable 读回的内容与写入一致", async () => {
    const { getTable, setTable } = await import("../src/services/sqliteMirrorRepository")
    const rows = [
      { id: 10, ts: "2025-01-01T00:00:00", point_id: 1, value_num: 3.14, value_str: null },
    ]
    setTable("iot_telemetry", rows)
    const result = getTable("iot_telemetry")
    expect(result[0]).toMatchObject({ id: 10, value_num: 3.14 })
  })

  it("key 前缀必须是 ywtg.sqlite.（不是 ywtg.ui.）", async () => {
    const { getTable, setTable } = await import("../src/services/sqliteMirrorRepository")
    setTable("work_order", [{ id: 1, order_no: "WO-001" }])
    // 验证 localStorage 实际使用的 key
    const raw = fakeStorage.getItem("ywtg.sqlite.work_order")
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw!)[0].order_no).toBe("WO-001")
  })

  it("不同表互相隔离（写 iot_space 不影响 alarm_record）", async () => {
    const { getTable, setTable } = await import("../src/services/sqliteMirrorRepository")
    setTable("iot_space", [{ id: 1, name: "X" }])
    const alarms = getTable("alarm_record")
    expect(alarms.length).toBe(0)
  })

  it("localStorage 不可用时回退内存存储，不抛出异常", async () => {
    // 临时删除 localStorage
    delete (globalThis as any).localStorage
    const { getTable, setTable } = await import("../src/services/sqliteMirrorRepository")
    setTable("field_evidence", [{ id: 1, media_type: "PHOTO" }])
    const rows = getTable("field_evidence")
    expect(rows.length).toBe(1)
    // 恢复
    ;(globalThis as any).localStorage = fakeStorage
  })

  it("存入 3 条 work_order 记录后可全部读回", async () => {
    const { getTable, setTable } = await import("../src/services/sqliteMirrorRepository")
    const orders = [
      { id: 1, order_no: "WO-001", status: 0 },
      { id: 2, order_no: "WO-002", status: 1 },
      { id: 3, order_no: "WO-003", status: 2 },
    ]
    setTable("work_order", orders)
    const result = getTable("work_order")
    expect(result.length).toBe(3)
    expect((result as any[])[1].order_no).toBe("WO-002")
  })
})

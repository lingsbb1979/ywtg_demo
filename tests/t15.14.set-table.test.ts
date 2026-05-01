/**
 * T15.14 TDD — 实现 setTable()
 *
 * 验收标准：
 *   - 可把真实表数组写回 `ywtg.sqlite.<tableName>`
 *   - tableName 参数受 TableName 联合类型约束（只接受 完整SQL.md 中存在的表名）
 *   - 覆盖写入（整张表替换，不做增量合并）
 *   - 写入后立即可用 getTable() 读回
 *   - 写入空数组后，getTable() 返回空数组
 *   - localStorage 不可用时（Node 测试环境）回退内存存储，不抛出异常
 *   - 从 sqliteMirrorRepository 导出（与 getTable 同文件）
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

describe("T15.14 setTable() — 导出", () => {
  it("sqliteMirrorRepository 应导出 setTable 函数", async () => {
    const mod = await import("../src/services/sqliteMirrorRepository")
    expect(typeof mod.setTable).toBe("function")
  })
})

// ── 行为测试 ─────────────────────────────────────────────────────────────────

describe("T15.14 setTable() — 行为", () => {
  it("写入后 getTable 能立即读回", async () => {
    const { setTable, getTable } = await import("../src/services/sqliteMirrorRepository")
    setTable("iot_space", [{ id: 1, name: "历史建筑A", space_code: "B001" }])
    const rows = getTable("iot_space")
    expect(rows.length).toBe(1)
  })

  it("覆盖写入：第二次写入替换第一次写入", async () => {
    const { setTable, getTable } = await import("../src/services/sqliteMirrorRepository")
    setTable("alarm_record", [{ id: 1, alarm_code: "ALM-001", status: 0 }])
    setTable("alarm_record", [{ id: 2, alarm_code: "ALM-002", status: 1 },
                               { id: 3, alarm_code: "ALM-003", status: 1 }])
    const rows = getTable("alarm_record")
    expect(rows.length).toBe(2)
    expect((rows as any[])[0].alarm_code).toBe("ALM-002")
  })

  it("写入空数组后 getTable 返回空数组", async () => {
    const { setTable, getTable } = await import("../src/services/sqliteMirrorRepository")
    setTable("work_order", [{ id: 1, order_no: "WO-001" }])
    setTable("work_order", [])
    const rows = getTable("work_order")
    expect(rows.length).toBe(0)
  })

  it("实际写入 localStorage 的 key 格式为 ywtg.sqlite.<tableName>", async () => {
    const { setTable } = await import("../src/services/sqliteMirrorRepository")
    setTable("field_evidence", [{ id: 1, media_type: "PHOTO", file_url: "/img/1.jpg" }])
    const raw = fakeStorage.getItem("ywtg.sqlite.field_evidence")
    expect(raw).not.toBeNull()
  })

  it("写入的 JSON 数组内容与传入对象完全一致", async () => {
    const { setTable } = await import("../src/services/sqliteMirrorRepository")
    const disposal = { id: 5, order_id: 10, disposal_desc: "已处置", gps_location: "46.8,130.3" }
    setTable("work_order_disposal", [disposal])
    const raw = fakeStorage.getItem("ywtg.sqlite.work_order_disposal")!
    const parsed = JSON.parse(raw)
    expect(parsed[0].disposal_desc).toBe("已处置")
    expect(parsed[0].gps_location).toBe("46.8,130.3")
  })

  it("不同表写入互不干扰", async () => {
    const { setTable, getTable } = await import("../src/services/sqliteMirrorRepository")
    setTable("iot_space",    [{ id: 1, name: "建筑A" }])
    setTable("alarm_record", [{ id: 1, alarm_code: "X" }, { id: 2, alarm_code: "Y" }])
    expect((getTable("iot_space") as any[]).length).toBe(1)
    expect((getTable("alarm_record") as any[]).length).toBe(2)
  })

  it("localStorage 不可用时回退内存存储，不抛出异常", async () => {
    delete (globalThis as any).localStorage
    const { setTable, getTable } = await import("../src/services/sqliteMirrorRepository")
    expect(() => setTable("system_log", [{ log_id: 1, operation_type: "LOGIN" }])).not.toThrow()
    const rows = getTable("system_log")
    expect(rows.length).toBe(1)
    ;(globalThis as any).localStorage = fakeStorage
  })

  it("写入多张 P0 表后各自独立保存", async () => {
    const { setTable, getTable } = await import("../src/services/sqliteMirrorRepository")
    setTable("iot_telemetry",      [{ ts: "2025-01-01T00:00:00", point_id: 1, value_num: 1.5 }])
    setTable("work_order_disposal",[{ id: 1, order_id: 1, disposal_desc: "OK" }])
    setTable("field_evidence",     [{ id: 1, task_id: 1, media_type: "PHOTO" },
                                    { id: 2, task_id: 1, media_type: "GPS_CHECKIN" }])
    expect((getTable("iot_telemetry") as any[]).length).toBe(1)
    expect((getTable("work_order_disposal") as any[]).length).toBe(1)
    expect((getTable("field_evidence") as any[]).length).toBe(2)
  })
})

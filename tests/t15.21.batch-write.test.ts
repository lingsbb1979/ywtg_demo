/**
 * T15.21 TDD — 实现批量写入 batchWrite()
 *
 * 验收标准：一个业务动作能同时更新告警、工单、日志等多张表
 *
 * batchWrite(writes) => void
 *   writes: Array<{ tableName: TableName; rows: Row[] }>
 *   - 将每张表的行数组整体覆盖写入（setTable 语义）
 *   - 多张表原子性顺序写入（localStorage 同步操作天然串行）
 *   - 空数组入参不抛出异常
 *   - 不影响未在 writes 中列出的表
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

describe("T15.21 batchWrite() — 导出", () => {
  it("sqliteMirrorRepository 应导出 batchWrite 函数", async () => {
    const mod = await import("../src/services/sqliteMirrorRepository")
    expect(typeof mod.batchWrite).toBe("function")
  })
})

// ── 基本行为 ─────────────────────────────────────────────────────────────────

describe("T15.21 batchWrite() — 基本行为", () => {
  it("空数组入参不抛出异常", async () => {
    const { batchWrite } = await import("../src/services/sqliteMirrorRepository")
    expect(() => batchWrite([])).not.toThrow()
  })

  it("单张表写入后可被 getTable 读到", async () => {
    const { batchWrite, getTable } = await import("../src/services/sqliteMirrorRepository")
    batchWrite([
      { tableName: "alarm_record", rows: [{ id: 1, alarm_code: "ALM-001" }] },
    ])
    const rows = getTable("alarm_record") as any[]
    expect(rows.length).toBe(1)
    expect(rows[0].alarm_code).toBe("ALM-001")
  })

  it("多张表同时写入，全部生效", async () => {
    const { batchWrite, getTable } = await import("../src/services/sqliteMirrorRepository")
    batchWrite([
      { tableName: "alarm_record",  rows: [{ id: 1, alarm_code: "ALM-001", alarm_status: 3 }] },
      { tableName: "work_order",    rows: [{ id: 1, order_no: "WO-001", status: 1 }] },
      { tableName: "system_log",    rows: [{ id: 1, operation_type: "ALARM_CLOSE" }] },
    ])
    expect((getTable("alarm_record") as any[])[0].alarm_status).toBe(3)
    expect((getTable("work_order") as any[])[0].order_no).toBe("WO-001")
    expect((getTable("system_log") as any[])[0].operation_type).toBe("ALARM_CLOSE")
  })

  it("覆盖写入（setTable 语义）：旧数据被替换", async () => {
    const { setTable, batchWrite, getTable } = await import("../src/services/sqliteMirrorRepository")
    setTable("alarm_record", [{ id: 1 }, { id: 2 }, { id: 3 }])
    batchWrite([
      { tableName: "alarm_record", rows: [{ id: 99, alarm_code: "NEW" }] },
    ])
    const rows = getTable("alarm_record") as any[]
    expect(rows.length).toBe(1)
    expect(rows[0].id).toBe(99)
  })

  it("不影响未在 writes 中列出的表", async () => {
    const { setTable, batchWrite, getTable } = await import("../src/services/sqliteMirrorRepository")
    setTable("iot_space", [{ id: 1, name: "建筑A" }])
    batchWrite([
      { tableName: "alarm_record", rows: [{ id: 1 }] },
    ])
    // iot_space 未在 writes 中，应保持原值
    const spaces = getTable("iot_space") as any[]
    expect(spaces.length).toBe(1)
    expect(spaces[0].name).toBe("建筑A")
  })

  it("写入空行数组等价于清空该表", async () => {
    const { setTable, batchWrite, getTable } = await import("../src/services/sqliteMirrorRepository")
    setTable("work_order", [{ id: 1 }, { id: 2 }])
    batchWrite([{ tableName: "work_order", rows: [] }])
    expect(getTable("work_order").length).toBe(0)
  })

  it("业务场景：告警关闭同时更新告警状态和工单状态", async () => {
    const { setTable, batchWrite, getTable } = await import("../src/services/sqliteMirrorRepository")
    setTable("alarm_record", [{ id: 1, alarm_status: 0 }, { id: 2, alarm_status: 0 }])
    setTable("work_order",   [{ id: 1, status: 1, alarm_id: 1 }])

    // 关闭告警 1：更新 alarm_record 和 work_order
    const updatedAlarms = [{ id: 1, alarm_status: 9 }, { id: 2, alarm_status: 0 }]
    const updatedOrders = [{ id: 1, status: 4, alarm_id: 1 }]
    batchWrite([
      { tableName: "alarm_record", rows: updatedAlarms },
      { tableName: "work_order",   rows: updatedOrders },
    ])

    const alarms = getTable("alarm_record") as any[]
    const orders = getTable("work_order") as any[]
    expect(alarms.find((r: any) => r.id === 1).alarm_status).toBe(9)
    expect(alarms.find((r: any) => r.id === 2).alarm_status).toBe(0)
    expect(orders[0].status).toBe(4)
  })
})

/**
 * T15.22 TDD — 实现事件日志写入
 *
 * 验收标准：每次触发场景、派单、处置、销号都写入真实表 system_log
 *
 * system_log 字段（来自 tableRegistry）：
 *   log_id, user_id, operation_type, operation_content,
 *   ip_address, user_agent, status, create_time
 *
 * appendLog(entry) => SystemLogRow
 *   - 向 system_log 追加一条日志
 *   - log_id 自动递增（复用 insert 的自增逻辑，但字段名是 log_id 而非 id）
 *   - create_time 未提供时自动补充 ISO 时间
 *   - status 未提供时默认为 1（成功）
 *   - 返回最终写入的完整行
 *   - 从 src/services/logService.ts 导出（单独服务文件）
 *
 * operation_type 典型值（不做枚举约束，使用字符串）：
 *   SCENARIO_TRIGGER / WORK_ORDER_CREATE / WORK_ORDER_DISPOSE / ALARM_CLOSE
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

describe("T15.22 appendLog() — 导出", () => {
  it("logService 应导出 appendLog 函数", async () => {
    const mod = await import("../src/services/logService")
    expect(typeof mod.appendLog).toBe("function")
  })
})

// ── 基本行为 ─────────────────────────────────────────────────────────────────

describe("T15.22 appendLog() — 基本行为", () => {
  it("写入后 system_log 表有一行", async () => {
    const { appendLog } = await import("../src/services/logService")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    appendLog({ operation_type: "SCENARIO_TRIGGER", operation_content: "橙色裂缝场景触发" })
    expect(getTable("system_log").length).toBe(1)
  })

  it("返回的行包含传入的 operation_type", async () => {
    const { appendLog } = await import("../src/services/logService")
    const row = appendLog({ operation_type: "WORK_ORDER_CREATE", operation_content: "派单给张三" }) as any
    expect(row.operation_type).toBe("WORK_ORDER_CREATE")
    expect(row.operation_content).toBe("派单给张三")
  })

  it("多次调用，日志追加不覆盖", async () => {
    const { appendLog } = await import("../src/services/logService")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    appendLog({ operation_type: "SCENARIO_TRIGGER" })
    appendLog({ operation_type: "WORK_ORDER_CREATE" })
    appendLog({ operation_type: "ALARM_CLOSE" })
    expect(getTable("system_log").length).toBe(3)
  })
})

// ── 自动字段补充 ──────────────────────────────────────────────────────────────

describe("T15.22 appendLog() — 自动字段", () => {
  it("log_id 自动递增，第一条为 1", async () => {
    const { appendLog } = await import("../src/services/logService")
    const row = appendLog({ operation_type: "TEST" }) as any
    expect(row.log_id).toBe(1)
  })

  it("log_id 连续递增", async () => {
    const { appendLog } = await import("../src/services/logService")
    const r1 = appendLog({ operation_type: "A" }) as any
    const r2 = appendLog({ operation_type: "B" }) as any
    const r3 = appendLog({ operation_type: "C" }) as any
    expect(r1.log_id).toBe(1)
    expect(r2.log_id).toBe(2)
    expect(r3.log_id).toBe(3)
  })

  it("create_time 未提供时自动补充 ISO 字符串", async () => {
    const { appendLog } = await import("../src/services/logService")
    const row = appendLog({ operation_type: "TEST" }) as any
    expect(typeof row.create_time).toBe("string")
    expect(new Date(row.create_time).getFullYear()).toBeGreaterThan(2020)
  })

  it("create_time 已提供时不覆盖", async () => {
    const { appendLog } = await import("../src/services/logService")
    const fixed = "2025-01-01T00:00:00.000Z"
    const row = appendLog({ operation_type: "TEST", create_time: fixed }) as any
    expect(row.create_time).toBe(fixed)
  })

  it("status 未提供时默认为 1", async () => {
    const { appendLog } = await import("../src/services/logService")
    const row = appendLog({ operation_type: "TEST" }) as any
    expect(row.status).toBe(1)
  })

  it("status 已提供时以传入值为准", async () => {
    const { appendLog } = await import("../src/services/logService")
    const row = appendLog({ operation_type: "TEST", status: 0 }) as any
    expect(row.status).toBe(0)
  })
})

// ── 业务场景 ──────────────────────────────────────────────────────────────────

describe("T15.22 appendLog() — 业务场景", () => {
  it("场景触发日志：写入 operation_type=SCENARIO_TRIGGER", async () => {
    const { appendLog } = await import("../src/services/logService")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    appendLog({ operation_type: "SCENARIO_TRIGGER", operation_content: "演示：橙色-裂缝" })
    const logs = getTable("system_log") as any[]
    expect(logs[0].operation_type).toBe("SCENARIO_TRIGGER")
  })

  it("派单日志：写入 operation_type=WORK_ORDER_CREATE", async () => {
    const { appendLog } = await import("../src/services/logService")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    appendLog({ operation_type: "WORK_ORDER_CREATE", user_id: 2, operation_content: "派单WO-001给张三" })
    const logs = getTable("system_log") as any[]
    expect(logs[0].user_id).toBe(2)
    expect(logs[0].operation_type).toBe("WORK_ORDER_CREATE")
  })

  it("销号日志：写入 operation_type=ALARM_CLOSE", async () => {
    const { appendLog } = await import("../src/services/logService")
    appendLog({ operation_type: "ALARM_CLOSE", operation_content: "确认消警ALM-001" })
    const row = appendLog({ operation_type: "WORK_ORDER_DISPOSE" }) as any
    // 两条日志，log_id 递增
    expect(row.log_id).toBe(2)
  })
})

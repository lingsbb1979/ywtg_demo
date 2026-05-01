/**
 * T15.45 — 实现确认告警 confirmAlarm
 *
 * 告警状态从"待确认"（PENDING）变为"已确认"（ACTIVE），记录确认人和确认时间。
 * 写入 alarm_record 中的 handle_user、handle_time、update_time、status 字段。
 *
 * 测试范围：
 *   - confirmAlarm 可从 alarmService 导入
 *   - id 不存在时返回 { ok: false, error }
 *   - 正常确认返回 { ok: true }
 *   - 返回 ok=true 时包含 id / status / handleUser / handleTime 字段
 *   - 确认后 alarm_record 中 status 变为 ACTIVE
 *   - 确认后 handle_user 被写入
 *   - 确认后 handle_time 被写入（非空字符串）
 *   - 确认后 update_time 被写入
 *   - 不提供 operator 时 handle_user 为默认值（非空）
 *   - 自定义 operator 时 handle_user = operator
 *   - 自定义 confirmedAt 时 handle_time = confirmedAt
 *   - 已是 ACTIVE 状态也可重复确认（幂等）
 *   - 告警为 CLOSED 时返回 { ok: false }（不允许确认已关闭告警）
 *   - 确认只影响指定 id，不影响其他告警
 *   - 确认后可通过 getAlarm 查到更新后的状态
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { setTable, getTable } from "../src/services/sqliteMirrorRepository"
import { seedBuildings } from "../src/mock/seeds/seedBuildings"

// ── fake localStorage ─────────────────────────────────────────────────────────

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
  seedBuildings()
})

afterEach(() => {
  delete (globalThis as any).localStorage
})

async function importService() {
  return import("../src/services/alarmService")
}

// ── 测试数据 ──────────────────────────────────────────────────────────────────

const PENDING_ALARM = {
  id: 1, alarm_id: "ALM-001", alarm_code: "CRACK-001",
  building_id: 1001, alarm_title: "裂缝超限告警",
  alarm_level: "ORANGE", status: "PENDING",
  trigger_time: "2024-03-08 10:00:00", create_time: "2024-03-08 10:00:00",
  handle_time: null, handle_user: null, update_time: null,
}

const ACTIVE_ALARM = {
  id: 2, alarm_id: "ALM-002", alarm_code: "TILT-001",
  building_id: 1002, alarm_title: "倾斜超限告警",
  alarm_level: "RED", status: "ACTIVE",
  trigger_time: "2024-03-08 11:00:00", create_time: "2024-03-08 11:00:00",
  handle_time: "2024-03-08 11:05:00", handle_user: "李四", update_time: "2024-03-08 11:05:00",
}

const CLOSED_ALARM = {
  id: 3, alarm_id: "ALM-003", alarm_code: "SETTLE-001",
  building_id: 1003, alarm_title: "沉降异常告警",
  alarm_level: "YELLOW", status: "CLOSED",
  trigger_time: "2024-03-07 09:00:00", create_time: "2024-03-07 09:00:00",
  handle_time: "2024-03-07 12:00:00", handle_user: "张三", update_time: "2024-03-07 12:00:00",
}

const OTHER_ALARM = {
  id: 4, alarm_id: "ALM-004", alarm_code: "CRACK-002",
  building_id: 1001, alarm_title: "裂缝异常告警",
  alarm_level: "ORANGE", status: "PENDING",
  trigger_time: "2024-03-09 08:00:00", create_time: "2024-03-09 08:00:00",
  handle_time: null, handle_user: null, update_time: null,
}

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.45 confirmAlarm() — 导出", () => {
  it("confirmAlarm 可从 alarmService 导入", async () => {
    const { confirmAlarm } = await importService()
    expect(typeof confirmAlarm).toBe("function")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.45 confirmAlarm() — 错误处理", () => {
  beforeEach(() => setTable("alarm_record", [PENDING_ALARM]))

  it("id 不存在时返回 { ok: false }", async () => {
    const { confirmAlarm } = await importService()
    expect(confirmAlarm(9999).ok).toBe(false)
  })

  it("id 不存在时包含 error 字段", async () => {
    const { confirmAlarm } = await importService()
    const r = confirmAlarm(9999)
    expect(!r.ok && typeof r.error).toBe("string")
  })

  it("CLOSED 状态告警返回 { ok: false }", async () => {
    setTable("alarm_record", [CLOSED_ALARM])
    const { confirmAlarm } = await importService()
    expect(confirmAlarm(3).ok).toBe(false)
  })

  it("CLOSED 状态告警 error 含提示信息", async () => {
    setTable("alarm_record", [CLOSED_ALARM])
    const { confirmAlarm } = await importService()
    const r = confirmAlarm(3)
    expect(!r.ok && typeof r.error).toBe("string")
    expect(!r.ok && r.error.length > 0).toBe(true)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.45 confirmAlarm() — 返回结构", () => {
  beforeEach(() => setTable("alarm_record", [PENDING_ALARM]))

  it("确认成功返回 ok=true", async () => {
    const { confirmAlarm } = await importService()
    expect(confirmAlarm(1).ok).toBe(true)
  })

  it("返回结果包含 id", async () => {
    const { confirmAlarm } = await importService()
    const r = confirmAlarm(1)
    expect(r.ok && r.id).toBe(1)
  })

  it("返回结果包含 status", async () => {
    const { confirmAlarm } = await importService()
    const r = confirmAlarm(1)
    if (!r.ok) throw new Error("should be ok")
    expect("status" in r).toBe(true)
  })

  it("返回结果包含 handleUser", async () => {
    const { confirmAlarm } = await importService()
    const r = confirmAlarm(1)
    if (!r.ok) throw new Error("should be ok")
    expect("handleUser" in r).toBe(true)
  })

  it("返回结果包含 handleTime", async () => {
    const { confirmAlarm } = await importService()
    const r = confirmAlarm(1)
    if (!r.ok) throw new Error("should be ok")
    expect("handleTime" in r).toBe(true)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.45 confirmAlarm() — 状态变更", () => {
  beforeEach(() => setTable("alarm_record", [PENDING_ALARM, OTHER_ALARM]))

  it("确认后 alarm_record 中 status 变为 ACTIVE", async () => {
    const { confirmAlarm } = await importService()
    confirmAlarm(1)
    const rows = getTable<{ id: number; status: string }>("alarm_record")
    expect(rows.find((r) => r.id === 1)?.status).toBe("ACTIVE")
  })

  it("确认后 handle_user 被写入", async () => {
    const { confirmAlarm } = await importService()
    confirmAlarm(1, { operator: "王五" })
    const rows = getTable<{ id: number; handle_user: string }>("alarm_record")
    expect(rows.find((r) => r.id === 1)?.handle_user).toBe("王五")
  })

  it("确认后 handle_time 为非空字符串", async () => {
    const { confirmAlarm } = await importService()
    confirmAlarm(1)
    const rows = getTable<{ id: number; handle_time: string }>("alarm_record")
    const ht = rows.find((r) => r.id === 1)?.handle_time
    expect(typeof ht).toBe("string")
    expect((ht as string).length).toBeGreaterThan(0)
  })

  it("确认后 update_time 被写入", async () => {
    const { confirmAlarm } = await importService()
    confirmAlarm(1)
    const rows = getTable<{ id: number; update_time: string }>("alarm_record")
    const ut = rows.find((r) => r.id === 1)?.update_time
    expect(typeof ut).toBe("string")
    expect((ut as string).length).toBeGreaterThan(0)
  })

  it("确认只影响指定 id，不影响其他告警", async () => {
    const { confirmAlarm } = await importService()
    confirmAlarm(1)
    const rows = getTable<{ id: number; status: string }>("alarm_record")
    expect(rows.find((r) => r.id === 4)?.status).toBe("PENDING")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.45 confirmAlarm() — 参数选项", () => {
  beforeEach(() => setTable("alarm_record", [PENDING_ALARM]))

  it("不提供 operator 时 handle_user 非空", async () => {
    const { confirmAlarm } = await importService()
    confirmAlarm(1)
    const rows = getTable<{ id: number; handle_user: string }>("alarm_record")
    const hu = rows.find((r) => r.id === 1)?.handle_user
    expect(hu).toBeTruthy()
  })

  it("自定义 operator 时 handle_user = operator", async () => {
    const { confirmAlarm } = await importService()
    confirmAlarm(1, { operator: "赵六" })
    const rows = getTable<{ id: number; handle_user: string }>("alarm_record")
    expect(rows.find((r) => r.id === 1)?.handle_user).toBe("赵六")
  })

  it("自定义 confirmedAt 时 handle_time = confirmedAt", async () => {
    const { confirmAlarm } = await importService()
    confirmAlarm(1, { confirmedAt: "2024-03-08 12:00:00" })
    const rows = getTable<{ id: number; handle_time: string }>("alarm_record")
    expect(rows.find((r) => r.id === 1)?.handle_time).toBe("2024-03-08 12:00:00")
  })

  it("已是 ACTIVE 状态也可重复确认（幂等）", async () => {
    setTable("alarm_record", [ACTIVE_ALARM])
    const { confirmAlarm } = await importService()
    expect(confirmAlarm(2).ok).toBe(true)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.45 confirmAlarm() — 与 getAlarm 联动", () => {
  beforeEach(() => {
    setTable("alarm_record", [PENDING_ALARM])
  })

  it("确认后 getAlarm 返回 status=ACTIVE", async () => {
    const { confirmAlarm, getAlarm } = await importService()
    confirmAlarm(1, { operator: "王五" })
    const r = getAlarm(1)
    expect(r.ok && r.data.status).toBe("ACTIVE")
  })

  it("确认后 getAlarm 返回 handleUser=operator", async () => {
    const { confirmAlarm, getAlarm } = await importService()
    confirmAlarm(1, { operator: "王五" })
    const r = getAlarm(1)
    expect(r.ok && r.data.handleUser).toBe("王五")
  })
})

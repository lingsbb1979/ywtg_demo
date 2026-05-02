/**
 * T15.68 — 场景引擎 simulateDataRecovery()
 *
 * 核查前可把裂缝/风险数据恢复到"安全"或"关注"区间。
 * 具体：将 alarm_record 中 building_id=1003、alarm_type=CRACK 的活跃告警状态改为 CLOSED。
 *
 * 函数签名：
 *   simulateDataRecovery(options?: RecoveryOptions): void
 *   interface RecoveryOptions { nowStr?: string }
 *
 * 逻辑：
 *   - 遍历 alarm_record，把满足以下条件的告警状态改为 CLOSED，handle_time 设为 nowStr：
 *       building_id=1003 && alarm_type=CRACK && status=ACTIVE
 *   - 不修改其他告警
 *   - 不影响 work_order、iot_space、supervision_order
 *
 * 测试范围（12 条）：
 *   - 导出检查
 *   - 目标告警 status 改为 CLOSED
 *   - 目标告警 handle_time 等于 nowStr
 *   - 不符合条件的告警不被修改（其他 building 的告警保持 ACTIVE）
 *   - 非 ACTIVE 告警不被重复修改
 *   - alarm_type 不是 CRACK 的告警不被修改
 *   - 调用两次后 status 仍为 CLOSED（幂等）
 *   - 不影响 work_order
 *   - 不影响 iot_space
 *   - alarm_record 条数不变（只修改不增删）
 *   - handle_time 默认值非空（不传 nowStr）
 *   - 多条目标告警全部被 CLOSED
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { getTable, setTable } from "../src/services/sqliteMirrorRepository"

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

type AlarmRow = {
  id: number; building_id: number | null; alarm_type: string | null
  status: string; handle_time: string | null
}

const CRACK_ACTIVE  = { id: 1, alarm_id: "ALM-CRACK-003", alarm_type: "CRACK", building_id: 1003, status: "ACTIVE",  handle_time: null }
const CRACK_ACTIVE2 = { id: 2, alarm_id: "ALM-CRACK-003B", alarm_type: "CRACK", building_id: 1003, status: "ACTIVE", handle_time: null }
const OTHER_ALARM   = { id: 3, alarm_id: "ALM-TILT-001",  alarm_type: "TILT",  building_id: 1001, status: "ACTIVE",  handle_time: null }
const CLOSED_ALARM  = { id: 4, alarm_id: "ALM-CRACK-003C", alarm_type: "CRACK", building_id: 1003, status: "CLOSED", handle_time: "2024-01-01 00:00:00" }

beforeEach(() => {
  ;(globalThis as any).localStorage = createFakeStorage()
  setTable("alarm_record",      [])
  setTable("work_order",        [])
  setTable("iot_space",         [])
  setTable("supervision_order", [])
})

afterEach(() => {
  delete (globalThis as any).localStorage
})

async function importService() {
  return import("../src/services/scenarioService")
}

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.68 simulateDataRecovery() — 导出", () => {
  it("simulateDataRecovery 可从 scenarioService 导入", async () => {
    const { simulateDataRecovery } = await importService()
    expect(typeof simulateDataRecovery).toBe("function")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.68 simulateDataRecovery() — 修改目标告警", () => {
  it("目标告警 status 改为 CLOSED", async () => {
    setTable("alarm_record", [CRACK_ACTIVE])
    const { simulateDataRecovery } = await importService()
    simulateDataRecovery()
    expect((getTable<AlarmRow>("alarm_record")).find((a) => a.id === 1)?.status).toBe("CLOSED")
  })

  it("目标告警 handle_time 等于 nowStr", async () => {
    setTable("alarm_record", [CRACK_ACTIVE])
    const { simulateDataRecovery } = await importService()
    simulateDataRecovery({ nowStr: "2024-03-09 08:00:00" })
    expect((getTable<AlarmRow>("alarm_record")).find((a) => a.id === 1)?.handle_time).toBe("2024-03-09 08:00:00")
  })

  it("多条目标告警全部被 CLOSED", async () => {
    setTable("alarm_record", [CRACK_ACTIVE, CRACK_ACTIVE2])
    const { simulateDataRecovery } = await importService()
    simulateDataRecovery()
    const rows = getTable<AlarmRow>("alarm_record")
    expect(rows.every((a) => a.status === "CLOSED")).toBe(true)
  })

  it("handle_time 不传 nowStr 时有默认值（非空）", async () => {
    setTable("alarm_record", [CRACK_ACTIVE])
    const { simulateDataRecovery } = await importService()
    simulateDataRecovery()
    expect((getTable<AlarmRow>("alarm_record"))[0].handle_time).toBeTruthy()
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.68 simulateDataRecovery() — 不修改其他告警", () => {
  it("其他 building 的告警保持 ACTIVE", async () => {
    setTable("alarm_record", [CRACK_ACTIVE, OTHER_ALARM])
    const { simulateDataRecovery } = await importService()
    simulateDataRecovery()
    expect((getTable<AlarmRow>("alarm_record")).find((a) => a.id === 3)?.status).toBe("ACTIVE")
  })

  it("alarm_type 不是 CRACK 的告警不被修改", async () => {
    setTable("alarm_record", [OTHER_ALARM])
    const { simulateDataRecovery } = await importService()
    simulateDataRecovery()
    expect((getTable<AlarmRow>("alarm_record"))[0].status).toBe("ACTIVE")
  })

  it("已 CLOSED 的告警不被重复处理（handle_time 不被覆盖）", async () => {
    setTable("alarm_record", [CLOSED_ALARM])
    const { simulateDataRecovery } = await importService()
    simulateDataRecovery({ nowStr: "2024-03-09 08:00:00" })
    expect((getTable<AlarmRow>("alarm_record"))[0].handle_time).toBe("2024-01-01 00:00:00")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.68 simulateDataRecovery() — 副作用", () => {
  it("alarm_record 条数不变（只修改不增删）", async () => {
    setTable("alarm_record", [CRACK_ACTIVE, OTHER_ALARM])
    const { simulateDataRecovery } = await importService()
    simulateDataRecovery()
    expect(getTable("alarm_record").length).toBe(2)
  })

  it("调用两次后 status 仍为 CLOSED（幂等）", async () => {
    setTable("alarm_record", [CRACK_ACTIVE])
    const { simulateDataRecovery } = await importService()
    simulateDataRecovery()
    simulateDataRecovery()
    expect((getTable<AlarmRow>("alarm_record"))[0].status).toBe("CLOSED")
  })

  it("不影响 work_order", async () => {
    setTable("work_order", [{ id: 1, status: "PENDING" }])
    const { simulateDataRecovery } = await importService()
    simulateDataRecovery()
    expect(getTable("work_order").length).toBe(1)
  })

  it("不影响 iot_space", async () => {
    setTable("iot_space", [{ id: 1003, name: "C栋" }])
    const { simulateDataRecovery } = await importService()
    simulateDataRecovery()
    expect(getTable("iot_space").length).toBe(1)
  })
})

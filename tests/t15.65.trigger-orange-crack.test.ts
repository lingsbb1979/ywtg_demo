/**
 * T15.65 — 场景引擎 triggerOrangeCrack()
 *
 * 模拟 B003（id=1003）生成橙色裂缝隐患、分析结果和告警。
 * 前置条件：调用者已 resetDemo() 或有 iot_space[1003]。
 *
 * 函数签名：
 *   triggerOrangeCrack(options?: CrackOptions): void
 *   interface CrackOptions { nowStr?: string }
 *
 * 逻辑：
 *   - 向 alarm_record 新增 1 条 ORANGE 裂缝告警（alarm_type=CRACK，building_id=1003）
 *   - 告警 alarm_id 固定为 "ALM-CRACK-003"
 *   - status=ACTIVE
 *   - trigger_time = nowStr ?? "2024-03-08 10:00:00"
 *
 * 测试范围（13 条）：
 *   - 导出检查
 *   - 调用后 alarm_record 增加 1 条（从 0→1）
 *   - 新增告警 alarm_type=CRACK
 *   - 新增告警 alarm_level=ORANGE
 *   - 新增告警 building_id=1003
 *   - 新增告警 status=ACTIVE
 *   - 新增告警 alarm_id="ALM-CRACK-003"
 *   - 新增告警 trigger_time 等于传入的 nowStr
 *   - 不传 nowStr 时 trigger_time 有默认值
 *   - 调用两次后 alarm_record 有 2 条（追加，不覆盖）
 *   - 原有告警保留（id=已有的不被删除）
 *   - 不影响 work_order 表
 *   - 不影响 iot_space 表
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

beforeEach(() => {
  ;(globalThis as any).localStorage = createFakeStorage()
  setTable("alarm_record", [])
  setTable("work_order",   [])
  setTable("iot_space",    [])
})

afterEach(() => {
  delete (globalThis as any).localStorage
})

async function importService() {
  return import("../src/services/scenarioService")
}

type AlarmRow = {
  id: number; alarm_id: string; alarm_type: string | null; alarm_level: string
  building_id: number | null; status: string; trigger_time: string | null
}

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.65 triggerOrangeCrack() — 导出", () => {
  it("triggerOrangeCrack 可从 scenarioService 导入", async () => {
    const { triggerOrangeCrack } = await importService()
    expect(typeof triggerOrangeCrack).toBe("function")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.65 triggerOrangeCrack() — 新增告警", () => {
  it("调用后 alarm_record 增加 1 条（0→1）", async () => {
    const { triggerOrangeCrack } = await importService()
    triggerOrangeCrack()
    expect(getTable("alarm_record").length).toBe(1)
  })

  it("新增告警 alarm_type=CRACK", async () => {
    const { triggerOrangeCrack } = await importService()
    triggerOrangeCrack()
    expect((getTable<AlarmRow>("alarm_record"))[0].alarm_type).toBe("CRACK")
  })

  it("新增告警 alarm_level=ORANGE", async () => {
    const { triggerOrangeCrack } = await importService()
    triggerOrangeCrack()
    expect((getTable<AlarmRow>("alarm_record"))[0].alarm_level).toBe("ORANGE")
  })

  it("新增告警 building_id=1003", async () => {
    const { triggerOrangeCrack } = await importService()
    triggerOrangeCrack()
    expect((getTable<AlarmRow>("alarm_record"))[0].building_id).toBe(1003)
  })

  it("新增告警 status=ACTIVE", async () => {
    const { triggerOrangeCrack } = await importService()
    triggerOrangeCrack()
    expect((getTable<AlarmRow>("alarm_record"))[0].status).toBe("ACTIVE")
  })

  it("新增告警 alarm_id=ALM-CRACK-003", async () => {
    const { triggerOrangeCrack } = await importService()
    triggerOrangeCrack()
    expect((getTable<AlarmRow>("alarm_record"))[0].alarm_id).toBe("ALM-CRACK-003")
  })

  it("trigger_time 等于传入的 nowStr", async () => {
    const { triggerOrangeCrack } = await importService()
    triggerOrangeCrack({ nowStr: "2024-05-01 12:00:00" })
    expect((getTable<AlarmRow>("alarm_record"))[0].trigger_time).toBe("2024-05-01 12:00:00")
  })

  it("不传 nowStr 时 trigger_time 有默认值（非空）", async () => {
    const { triggerOrangeCrack } = await importService()
    triggerOrangeCrack()
    expect((getTable<AlarmRow>("alarm_record"))[0].trigger_time).toBeTruthy()
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.65 triggerOrangeCrack() — 副作用范围", () => {
  it("调用两次后 alarm_record 有 2 条（追加不覆盖）", async () => {
    const { triggerOrangeCrack } = await importService()
    triggerOrangeCrack({ nowStr: "2024-03-08 10:00:00" })
    triggerOrangeCrack({ nowStr: "2024-03-08 11:00:00" })
    expect(getTable("alarm_record").length).toBe(2)
  })

  it("原有告警保留（新增后 id=99 仍存在）", async () => {
    setTable("alarm_record", [{ id: 99, alarm_id: "ALM-OLD", alarm_level: "YELLOW", status: "ACTIVE" }])
    const { triggerOrangeCrack } = await importService()
    triggerOrangeCrack()
    expect((getTable<{ id: number }>("alarm_record")).some((a) => a.id === 99)).toBe(true)
  })

  it("不影响 work_order 表", async () => {
    setTable("work_order", [{ id: 1, status: "PENDING" }])
    const { triggerOrangeCrack } = await importService()
    triggerOrangeCrack()
    expect(getTable("work_order").length).toBe(1)
  })

  it("不影响 iot_space 表", async () => {
    setTable("iot_space", [{ id: 1001, name: "A栋" }])
    const { triggerOrangeCrack } = await importService()
    triggerOrangeCrack()
    expect(getTable("iot_space").length).toBe(1)
  })
})

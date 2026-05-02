/**
 * T15.66 — 场景引擎 triggerRedAlert()
 *
 * 模拟 B012（id=1012）生成红色倾斜告警，并附一条工单（PENDING）。
 *
 * 函数签名：
 *   triggerRedAlert(options?: RedAlertOptions): void
 *   interface RedAlertOptions { nowStr?: string }
 *
 * 逻辑：
 *   - 向 alarm_record 追加 1 条 RED 倾斜告警（alarm_type=TILT，building_id=1012）
 *   - alarm_id 固定为 "ALM-TILT-012"，status=ACTIVE
 *   - 向 work_order 追加 1 条工单（status=PENDING）
 *   - 工单 alarm_id="ALM-TILT-012"，building_id=1012，order_level="URGENT"
 *   - trigger_time / dispatch_time = nowStr ?? "2024-03-08 11:00:00"
 *
 * 测试范围（14 条）：
 *   - 导出检查
 *   - alarm_record 增加 1 条
 *   - 告警 alarm_type=TILT
 *   - 告警 alarm_level=RED
 *   - 告警 building_id=1012
 *   - 告警 status=ACTIVE
 *   - 告警 alarm_id=ALM-TILT-012
 *   - work_order 增加 1 条
 *   - 工单 status=PENDING
 *   - 工单 order_level=URGENT
 *   - 工单 alarm_id=ALM-TILT-012
 *   - 工单 building_id=1012
 *   - 告警 trigger_time 等于 nowStr
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
type WoRow = {
  id: number; status: string; order_level: string | null
  alarm_id: string | null; building_id: number | null
}

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.66 triggerRedAlert() — 导出", () => {
  it("triggerRedAlert 可从 scenarioService 导入", async () => {
    const { triggerRedAlert } = await importService()
    expect(typeof triggerRedAlert).toBe("function")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.66 triggerRedAlert() — 告警", () => {
  it("alarm_record 增加 1 条", async () => {
    const { triggerRedAlert } = await importService()
    triggerRedAlert()
    expect(getTable("alarm_record").length).toBe(1)
  })

  it("告警 alarm_type=TILT", async () => {
    const { triggerRedAlert } = await importService()
    triggerRedAlert()
    expect((getTable<AlarmRow>("alarm_record"))[0].alarm_type).toBe("TILT")
  })

  it("告警 alarm_level=RED", async () => {
    const { triggerRedAlert } = await importService()
    triggerRedAlert()
    expect((getTable<AlarmRow>("alarm_record"))[0].alarm_level).toBe("RED")
  })

  it("告警 building_id=1012", async () => {
    const { triggerRedAlert } = await importService()
    triggerRedAlert()
    expect((getTable<AlarmRow>("alarm_record"))[0].building_id).toBe(1012)
  })

  it("告警 status=ACTIVE", async () => {
    const { triggerRedAlert } = await importService()
    triggerRedAlert()
    expect((getTable<AlarmRow>("alarm_record"))[0].status).toBe("ACTIVE")
  })

  it("告警 alarm_id=ALM-TILT-012", async () => {
    const { triggerRedAlert } = await importService()
    triggerRedAlert()
    expect((getTable<AlarmRow>("alarm_record"))[0].alarm_id).toBe("ALM-TILT-012")
  })

  it("告警 trigger_time 等于 nowStr", async () => {
    const { triggerRedAlert } = await importService()
    triggerRedAlert({ nowStr: "2024-06-01 09:00:00" })
    expect((getTable<AlarmRow>("alarm_record"))[0].trigger_time).toBe("2024-06-01 09:00:00")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.66 triggerRedAlert() — 工单", () => {
  it("work_order 增加 1 条", async () => {
    const { triggerRedAlert } = await importService()
    triggerRedAlert()
    expect(getTable("work_order").length).toBe(1)
  })

  it("工单 status=PENDING", async () => {
    const { triggerRedAlert } = await importService()
    triggerRedAlert()
    expect((getTable<WoRow>("work_order"))[0].status).toBe("PENDING")
  })

  it("工单 order_level=URGENT", async () => {
    const { triggerRedAlert } = await importService()
    triggerRedAlert()
    expect((getTable<WoRow>("work_order"))[0].order_level).toBe("URGENT")
  })

  it("工单 alarm_id=ALM-TILT-012", async () => {
    const { triggerRedAlert } = await importService()
    triggerRedAlert()
    expect((getTable<WoRow>("work_order"))[0].alarm_id).toBe("ALM-TILT-012")
  })

  it("工单 building_id=1012", async () => {
    const { triggerRedAlert } = await importService()
    triggerRedAlert()
    expect((getTable<WoRow>("work_order"))[0].building_id).toBe(1012)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.66 triggerRedAlert() — 副作用", () => {
  it("不影响 iot_space 表", async () => {
    setTable("iot_space", [{ id: 1001, name: "A栋" }])
    const { triggerRedAlert } = await importService()
    triggerRedAlert()
    expect(getTable("iot_space").length).toBe(1)
  })
})

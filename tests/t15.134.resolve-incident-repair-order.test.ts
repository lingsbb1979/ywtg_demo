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
  setTable("emergency_incident", [{
    id: 1,
    incident_no: "EM-001",
    source_type: 1,
    building_id: 1012,
    level: 3,
    status: 10,
    trigger_time: "2026-05-05 08:06:07",
    report_to_province: 0,
    evacuation_status: 0,
    plan_id: 1,
    current_step: 5,
    close_type: null,
    alarm_record_id: 9,
  }])
  setTable("alarm_record", [{
    id: 9,
    alarm_id: "ALM-TILT-012",
    alarm_title: "L栋倾斜超限",
    status: "DISPATCHED",
  }])
  setTable("work_order", [])
  setTable("work_order_log", [])
  setTable("work_order_disposal", [])
})

afterEach(() => {
  delete (globalThis as any).localStorage
})

describe("T15.134 resolveIncident(REPAIR_ORDER)", () => {
  it("生成 EMERGENCY 修缮工单时直接进入 CHECKING", async () => {
    const { resolveIncident } = await import("../src/services/emergencyService")
    const result = resolveIncident(1, "REPAIR_ORDER")
    expect(result.ok).toBe(true)

    const orders = getTable<{ status: string; source_type: string; current_node: string; order_no: string }>("work_order")
    expect(orders).toHaveLength(1)
    expect(orders[0].order_no).toBe("WO-EM-0001")
    expect(orders[0].source_type).toBe("EMERGENCY")
    expect(orders[0].status).toBe("CHECKING")
    expect(orders[0].current_node).toBe("CHECK")
  })

  it("同时写入处置记录、流程日志，并关闭原告警与应急事件", async () => {
    const { resolveIncident } = await import("../src/services/emergencyService")
    resolveIncident(1, "REPAIR_ORDER")

    const incident = getTable<{ status: number; close_type: string | null }>("emergency_incident")[0]
    const alarm = getTable<{ status: string }>("alarm_record")[0]
    const disposals = getTable<{ order_id: number; disposal_desc: string }>("work_order_disposal")
    const logs = getTable<{ order_id: number; node_type: string; action_desc: string }>("work_order_log")

    expect(incident.status).toBe(40)
    expect(incident.close_type).toBe("REPAIR_ORDER")
    expect(alarm.status).toBe("CLOSED")
    expect(disposals[0].order_id).toBe(1)
    expect(disposals[0].disposal_desc).toContain("转入修缮工单待核查")
    expect(logs[0].order_id).toBe(1)
    expect(logs[0].node_type).toBe("EMERGENCY_CLOSE")
  })
})
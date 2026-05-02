import { describe, it, expect, beforeEach } from "vitest"
import { setTable } from "../src/services/sqliteMirrorRepository"

const MEM_KEY = "__ywtg_sqlite_mirror_store__"
const CRACK_RISK = JSON.stringify({
  green: { min: 0, max: 5 },
  yellow: { min: 5, max: 10 },
  orange: { min: 10, max: 20 },
  red: { min: 20, max: null },
})

function resetMem() {
  delete (globalThis as any)[MEM_KEY]
}

function seedAnalysis() {
  setTable("iot_data_point", [
    { id: 1, space_id: 1001, point_code: "DP001", name: "crack1",
      factor_code: "CRACK_WIDTH", unit: "mm",
      limit_hh: 20, limit_hi: 10, limit_lo: null, limit_ll: null,
      device_id: 101, is_enabled: 1, create_time: "2024-01-01 00:00:00" },
  ])
  setTable("space_analysis_config", [
    { id: 1, space_id: 1001, metric_id: 1, is_enabled: 1,
      input_source_json: JSON.stringify({ point_ids: [1] }),
      params_json: JSON.stringify({ factor_code: "CRACK_WIDTH", unit: "mm" }),
      risk_level_json: CRACK_RISK,
      create_time: "2024-01-01 00:00:00" },
  ])
}

describe("T15.121 manual data loop", () => {
  beforeEach(resetMem)

  it("step1: resetDemo iot_space has 1001", async () => {
    const { resetDemo } = await import("../src/services/scenarioService")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    resetDemo()
    expect(getTable<{ id: number }>("iot_space").some((s) => s.id === 1001)).toBe(true)
  })

  it("step2: addTelemetry writes to iot_telemetry", async () => {
    const { resetDemo } = await import("../src/services/scenarioService")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    const { addTelemetry } = await import("../src/services/telemetryService")
    resetDemo()
    seedAnalysis()
    const result = addTelemetry({ pointId: 1, valueNum: 15.5, ts: "2026-05-02 10:00:00" })
    expect(result.ok).toBe(true)
    expect(getTable<{ value_num: number }>("iot_telemetry").some((r) => r.value_num === 15.5)).toBe(true)
  })

  it("step3: calculateBuildingRisk writes space_analysis_archive", async () => {
    const { resetDemo } = await import("../src/services/scenarioService")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    const { addTelemetry } = await import("../src/services/telemetryService")
    const { calculateBuildingRisk } = await import("../src/services/analysisService")
    resetDemo()
    seedAnalysis()
    addTelemetry({ pointId: 1, valueNum: 15.5, ts: "2026-05-02 10:00:00" })
    expect(calculateBuildingRisk(1001).ok).toBe(true)
    expect(getTable<{ space_id: number }>("space_analysis_archive").some((a) => a.space_id === 1001)).toBe(true)
  })

  it("step4: riskLevel is not GREEN for 15.5mm crack", async () => {
    const { resetDemo } = await import("../src/services/scenarioService")
    const { addTelemetry } = await import("../src/services/telemetryService")
    const { calculateBuildingRisk } = await import("../src/services/analysisService")
    resetDemo()
    seedAnalysis()
    addTelemetry({ pointId: 1, valueNum: 15.5, ts: "2026-05-02 10:00:00" })
    const r = calculateBuildingRisk(1001)
    expect(r.ok).toBe(true)
    const metrics = (r as any).metrics as { riskLevel: string }[]
    expect(metrics.length).toBeGreaterThan(0)
    expect(metrics.some((m) => m.riskLevel !== "GREEN" && m.riskLevel !== "NORMAL")).toBe(true)
  })

  it("step5: alarm_record has ACTIVE alarm after triggerOrangeCrack", async () => {
    const { resetDemo, triggerOrangeCrack } = await import("../src/services/scenarioService")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    const { addTelemetry } = await import("../src/services/telemetryService")
    const { calculateBuildingRisk } = await import("../src/services/analysisService")
    resetDemo()
    seedAnalysis()
    addTelemetry({ pointId: 1, valueNum: 15.5, ts: "2026-05-02 10:00:00" })
    calculateBuildingRisk(1001)
    triggerOrangeCrack()
    expect(getTable<{ status: string }>("alarm_record").some((a) => a.status === "ACTIVE")).toBe(true)
  })

  it("step6: full loop from alarm to FINISHED work order", async () => {
    const { resetDemo, triggerOrangeCrack } = await import("../src/services/scenarioService")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    const { addTelemetry } = await import("../src/services/telemetryService")
    const { calculateBuildingRisk } = await import("../src/services/analysisService")
    const { confirmAlarm, dispatchAlarm } = await import("../src/services/alarmService")
    const { acceptWorkOrder, submitDisposal, verifyWorkOrder } = await import("../src/services/workOrderService")
    resetDemo()
    seedAnalysis()
    addTelemetry({ pointId: 1, valueNum: 15.5, ts: "2026-05-02 10:00:00" })
    calculateBuildingRisk(1001)
    triggerOrangeCrack()
    const alarms = getTable<{ id: number; status: string }>("alarm_record")
    const active = alarms.find((a) => a.status === "ACTIVE")
    expect(active).toBeDefined()
    confirmAlarm(active!.id, { operatorId: 1, operatorName: "admin" })
    dispatchAlarm(active!.id, {
      dispatchUserId: 1, dispatchOrgId: 10, receiveOrgId: 20, receiveUserId: 5,
      receiveOrg: "org", dispatchOrg: "org2",
    })
    const orders = getTable<{ id: number; status: string }>("work_order")
    const pending = orders.find((o) => o.status === "PENDING")
    expect(pending).toBeDefined()
    acceptWorkOrder(pending!.id, { userId: 5, operatorName: "op" })
    submitDisposal(pending!.id, {
      userId: 5, operatorName: "op",
      disposalDesc: "done", imageUrls: '["img.jpg"]',
    })
    expect(verifyWorkOrder(pending!.id, { operatorId: 1, operatorName: "admin" }).error).toBeUndefined()
    expect(getTable<{ id: number; status: string }>("work_order").find((o) => o.id === pending!.id)?.status).toBe("FINISHED")
  })
})

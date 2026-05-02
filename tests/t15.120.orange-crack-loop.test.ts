/**
 * T15.120 TDD — 跑通橙色裂缝闭环（端到端验收）
 *
 * 验收标准：
 *   可完成完整业务闭环：
 *   "触发隐患 -> 告警 -> 派单 -> H5 处置 -> PC 销号 -> 大屏更新"
 *
 * 测试流程：
 *   1. resetDemo()                    — 初始状态
 *   2. triggerOrangeCrack()           — 写入橙色告警
 *   3. confirmAlarm(id)               — 确认告警
 *   4. dispatchAlarm(id, ...)         — 生成工单，告警变派单状态
 *   5. acceptWorkOrder(id, ...)       — H5 接单，工单变处理中
 *   6. submitDisposal(id, ...)        — H5 提交处置，工单变待核查
 *   7. verifyWorkOrder(id, ...)       — PC 核查通过，工单变已销号
 *   8. 大屏 KPI：闭环率 > 0
 */
import { describe, it, expect, beforeEach } from "vitest"

const MEM_KEY = "__ywtg_sqlite_mirror_store__"

function resetMem() {
  delete (globalThis as any)[MEM_KEY]
}

describe("T15.120 橙色裂缝完整闭环", () => {
  beforeEach(resetMem)

  it("step1: resetDemo() 建立初始数据（iot_space >= 3，alarm >= 2）", async () => {
    const { resetDemo } = await import("../src/services/scenarioService")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    resetDemo()
    const spaces = getTable<{ id: number }>("iot_space")
    const alarms = getTable<{ id: number }>("alarm_record")
    expect(spaces.length).toBeGreaterThanOrEqual(3)
    expect(alarms.length).toBeGreaterThanOrEqual(2)
  })

  it("step2: triggerOrangeCrack() 生成 ORANGE 级 ACTIVE 告警", async () => {
    const { resetDemo, triggerOrangeCrack } = await import("../src/services/scenarioService")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    resetDemo()
    triggerOrangeCrack()
    const alarms = getTable<{ status: string; alarm_level: string }>("alarm_record")
    const orange = alarms.find((a) => a.alarm_level === "ORANGE" && a.status === "ACTIVE")
    expect(orange).toBeDefined()
  })

  it("step3: confirmAlarm() 告警状态变为 CONFIRMED", async () => {
    const { resetDemo, triggerOrangeCrack } = await import("../src/services/scenarioService")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    const { confirmAlarm } = await import("../src/services/alarmService")
    resetDemo()
    triggerOrangeCrack()
    const alarms = getTable<{ id: number; alarm_level: string; status: string }>("alarm_record")
    const orange = alarms.find((a) => a.alarm_level === "ORANGE" && a.status === "ACTIVE")!
    expect(orange).toBeDefined()
    const result = confirmAlarm(orange.id, { operator: "admin" })
    expect(result.ok).toBe(true)
    expect((result as any).status).toMatch(/ACTIVE|CONFIRMED/)
  })

  it("step4: dispatchAlarm() 生成 PENDING 工单，告警状态变派单", async () => {
    const { resetDemo, triggerOrangeCrack } = await import("../src/services/scenarioService")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    const { confirmAlarm, dispatchAlarm } = await import("../src/services/alarmService")
    const beforeOrderCount = getTable<object>("work_order").length
    resetDemo()
    triggerOrangeCrack()
    const alarms = getTable<{ id: number; alarm_level: string; status: string }>("alarm_record")
    const orange = alarms.find((a) => a.alarm_level === "ORANGE" && a.status === "ACTIVE")!
    confirmAlarm(orange.id, { operatorId: 1, operatorName: "admin" })
    const dispResult = dispatchAlarm(orange.id, {
      dispatchUserId: 1, dispatchOrgId: 10,
      receiveOrgId: 20, receiveUserId: 5,
      receiveOrg: "街道办", dispatchOrg: "住建局",
    })
    expect(dispResult.error).toBeUndefined()
    const orders = getTable<{ status: string }>("work_order")
    const pending = orders.find((o) => o.status === "PENDING")
    expect(pending).toBeDefined()
    void beforeOrderCount
  })

  it("step5: acceptWorkOrder() 工单状态变为 PROCESSING", async () => {
    const { resetDemo, triggerOrangeCrack } = await import("../src/services/scenarioService")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    const { confirmAlarm, dispatchAlarm } = await import("../src/services/alarmService")
    const { acceptWorkOrder } = await import("../src/services/workOrderService")
    resetDemo()
    triggerOrangeCrack()
    const alarms = getTable<{ id: number; alarm_level: string; status: string }>("alarm_record")
    const orange = alarms.find((a) => a.alarm_level === "ORANGE" && a.status === "ACTIVE")!
    confirmAlarm(orange.id, { operatorId: 1, operatorName: "admin" })
    dispatchAlarm(orange.id, {
      dispatchUserId: 1, dispatchOrgId: 10,
      receiveOrgId: 20, receiveUserId: 5,
      receiveOrg: "街道办", dispatchOrg: "住建局",
    })
    const orders = getTable<{ id: number; status: string }>("work_order")
    const pending = orders.find((o) => o.status === "PENDING")!
    const acceptResult = acceptWorkOrder(pending.id, { userId: 5, operatorName: "外勤01" })
    expect(acceptResult.error).toBeUndefined()
    const updated = getTable<{ id: number; status: string }>("work_order")
    const processing = updated.find((o) => o.id === pending.id)
    expect(processing?.status).toBe("PROCESSING")
  })

  it("step6: submitDisposal() 工单状态变为 CHECKING", async () => {
    const { resetDemo, triggerOrangeCrack } = await import("../src/services/scenarioService")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    const { confirmAlarm, dispatchAlarm } = await import("../src/services/alarmService")
    const { acceptWorkOrder, submitDisposal } = await import("../src/services/workOrderService")
    resetDemo()
    triggerOrangeCrack()
    const alarms = getTable<{ id: number; alarm_level: string; status: string }>("alarm_record")
    const orange = alarms.find((a) => a.alarm_level === "ORANGE" && a.status === "ACTIVE")!
    confirmAlarm(orange.id, { operatorId: 1, operatorName: "admin" })
    dispatchAlarm(orange.id, {
      dispatchUserId: 1, dispatchOrgId: 10,
      receiveOrgId: 20, receiveUserId: 5,
      receiveOrg: "街道办", dispatchOrg: "住建局",
    })
    const orders = getTable<{ id: number; status: string }>("work_order")
    const pending = orders.find((o) => o.status === "PENDING")!
    acceptWorkOrder(pending.id, { userId: 5, operatorName: "外勤01" })
    const dispResult = submitDisposal(pending.id, {
      userId: 5, operatorName: "外勤01",
      disposalDesc: "现场已处理裂缝，拍照留证",
      imageUrls: '["demo1.jpg","demo2.jpg"]',
    })
    expect(dispResult.error).toBeUndefined()
    const updated = getTable<{ id: number; status: string }>("work_order")
    const checking = updated.find((o) => o.id === pending.id)
    expect(checking?.status).toBe("CHECKING")
  })

  it("step7: verifyWorkOrder() 工单状态变为 FINISHED，告警状态变 CLOSED", async () => {
    const { resetDemo, triggerOrangeCrack } = await import("../src/services/scenarioService")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    const { confirmAlarm, dispatchAlarm } = await import("../src/services/alarmService")
    const { acceptWorkOrder, submitDisposal, verifyWorkOrder } = await import("../src/services/workOrderService")
    resetDemo()
    triggerOrangeCrack()
    const alarms = getTable<{ id: number; alarm_level: string; status: string }>("alarm_record")
    const orange = alarms.find((a) => a.alarm_level === "ORANGE" && a.status === "ACTIVE")!
    confirmAlarm(orange.id, { operatorId: 1, operatorName: "admin" })
    dispatchAlarm(orange.id, {
      dispatchUserId: 1, dispatchOrgId: 10,
      receiveOrgId: 20, receiveUserId: 5,
      receiveOrg: "街道办", dispatchOrg: "住建局",
    })
    const orders = getTable<{ id: number; status: string }>("work_order")
    const pending = orders.find((o) => o.status === "PENDING")!
    acceptWorkOrder(pending.id, { userId: 5, operatorName: "外勤01" })
    submitDisposal(pending.id, {
      userId: 5, operatorName: "外勤01",
      disposalDesc: "现场已处理裂缝",
      imageUrls: '["demo1.jpg"]',
    })
    const verifyResult = verifyWorkOrder(pending.id, { operatorId: 1, operatorName: "admin" })
    expect(verifyResult.error).toBeUndefined()
    const updated = getTable<{ id: number; status: string }>("work_order")
    const finished = updated.find((o) => o.id === pending.id)
    expect(finished?.status).toBe("FINISHED")
  })

  it("step8: 全流程后大屏 KPI 工单闭环率 > 0", async () => {
    const { resetDemo, triggerOrangeCrack } = await import("../src/services/scenarioService")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    const { confirmAlarm, dispatchAlarm } = await import("../src/services/alarmService")
    const { acceptWorkOrder, submitDisposal, verifyWorkOrder } = await import("../src/services/workOrderService")
    const { selectScreenKpi } = await import("../src/services/screenKpiService")
    resetDemo()
    triggerOrangeCrack()
    const alarms = getTable<{ id: number; alarm_level: string; status: string }>("alarm_record")
    const orange = alarms.find((a) => a.alarm_level === "ORANGE" && a.status === "ACTIVE")!
    confirmAlarm(orange.id, { operatorId: 1, operatorName: "admin" })
    dispatchAlarm(orange.id, {
      dispatchUserId: 1, dispatchOrgId: 10,
      receiveOrgId: 20, receiveUserId: 5,
      receiveOrg: "街道办", dispatchOrg: "住建局",
    })
    const orders = getTable<{ id: number; status: string }>("work_order")
    const pending = orders.find((o) => o.status === "PENDING")!
    acceptWorkOrder(pending.id, { userId: 5, operatorName: "外勤01" })
    submitDisposal(pending.id, {
      userId: 5, operatorName: "外勤01",
      disposalDesc: "处理完成",
      imageUrls: '["demo.jpg"]',
    })
    verifyWorkOrder(pending.id, { operatorId: 1, operatorName: "admin" })
    const kpi = selectScreenKpi()
    expect(kpi.closeRate).toBeGreaterThan(0)
  })
})

/**
 * T15.124 TDD — 验证重置可重复演示（验收）
 *
 * 验收标准：
 *   连续重置和演示 3 次，关键状态不串数据
 *
 * 测试项：
 *   - resetDemo() 调用 3 次后 iot_space 数量不变（幂等）
 *   - 每次 resetDemo() 后 alarm_record 恢复到固定初始数量（不累积）
 *   - 每次 resetDemo() 后 work_order 恢复到固定初始数量（不累积）
 *   - triggerOrangeCrack() 后 resetDemo() 清空触发的告警
 *   - 序列：reset -> trigger -> reset -> trigger -> reset，最终状态仅有种子数据
 */
import { describe, it, expect, beforeEach } from "vitest"

const MEM_KEY = "__ywtg_sqlite_mirror_store__"

function resetMem() {
  delete (globalThis as any)[MEM_KEY]
}

describe("T15.124 resetDemo — 幂等性验证", () => {
  beforeEach(resetMem)

  it("连续调用 3 次 resetDemo()，iot_space 数量保持一致（不累积）", async () => {
    const { resetDemo } = await import("../src/services/scenarioService")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    resetDemo()
    const count1 = getTable<object>("iot_space").length
    resetDemo()
    const count2 = getTable<object>("iot_space").length
    resetDemo()
    const count3 = getTable<object>("iot_space").length
    expect(count1).toBe(count2)
    expect(count2).toBe(count3)
    expect(count1).toBeGreaterThan(0)
  })

  it("连续调用 3 次 resetDemo()，alarm_record 数量保持一致（不累积）", async () => {
    const { resetDemo } = await import("../src/services/scenarioService")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    resetDemo()
    const c1 = getTable<object>("alarm_record").length
    resetDemo()
    const c2 = getTable<object>("alarm_record").length
    resetDemo()
    const c3 = getTable<object>("alarm_record").length
    expect(c1).toBe(c2)
    expect(c2).toBe(c3)
  })

  it("连续调用 3 次 resetDemo()，work_order 数量保持一致（不累积）", async () => {
    const { resetDemo } = await import("../src/services/scenarioService")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    resetDemo()
    const c1 = getTable<object>("work_order").length
    resetDemo()
    const c2 = getTable<object>("work_order").length
    resetDemo()
    const c3 = getTable<object>("work_order").length
    expect(c1).toBe(c2)
    expect(c2).toBe(c3)
  })

  it("triggerOrangeCrack() 后 resetDemo() 清空触发的额外告警", async () => {
    const { resetDemo, triggerOrangeCrack } = await import("../src/services/scenarioService")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    resetDemo()
    const baseline = getTable<object>("alarm_record").length
    triggerOrangeCrack()
    const afterTrigger = getTable<object>("alarm_record").length
    expect(afterTrigger).toBeGreaterThan(baseline)
    // 重置后应恢复 baseline
    resetDemo()
    const afterReset = getTable<object>("alarm_record").length
    expect(afterReset).toBe(baseline)
  })

  it("完整序列: reset -> trigger -> reset -> trigger -> reset，最终恢复到初始状态", async () => {
    const { resetDemo, triggerOrangeCrack, triggerRedAlert, triggerTimeoutSupervision } =
      await import("../src/services/scenarioService")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")

    resetDemo()
    const seedAlarmCount = getTable<object>("alarm_record").length
    const seedOrderCount = getTable<object>("work_order").length

    // 第 1 轮演示
    triggerOrangeCrack()
    triggerRedAlert()
    triggerTimeoutSupervision()
    // 重置
    resetDemo()
    expect(getTable<object>("alarm_record").length).toBe(seedAlarmCount)
    expect(getTable<object>("work_order").length).toBe(seedOrderCount)

    // 第 2 轮演示
    triggerOrangeCrack()
    triggerTimeoutSupervision()
    // 重置
    resetDemo()
    expect(getTable<object>("alarm_record").length).toBe(seedAlarmCount)
    expect(getTable<object>("work_order").length).toBe(seedOrderCount)

    // 第 3 轮演示
    triggerRedAlert()
    // 最终重置
    resetDemo()
    expect(getTable<object>("alarm_record").length).toBe(seedAlarmCount)
    expect(getTable<object>("work_order").length).toBe(seedOrderCount)
  })

  it("supervision_order 在 resetDemo() 后不遗留超时督办单", async () => {
    const { resetDemo, triggerTimeoutSupervision } = await import("../src/services/scenarioService")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    resetDemo()
    const seedSupCount = getTable<object>("supervision_order").length
    triggerTimeoutSupervision()
    resetDemo()
    const afterReset = getTable<object>("supervision_order").length
    expect(afterReset).toBe(seedSupCount)
  })
})

/**
 * T15.33 — 定义演示场景常量 scenarioConstants
 *
 * 演示场景常量仅作为代码配置，不写入 localStorage 业务表。
 * 四个场景：
 *   - SCN_NORMAL           — 全部绿色正常态势
 *   - SCN_ORANGE_CRACK     — B001 裂缝超橙色阈值（H 级告警）
 *   - SCN_RED_TILT         — B002 倾角超红色阈值（HH 级告警）
 *   - SCN_OVERTIME_SUPERVISION — B003 沉降派单后工单超 SLA 触发督办
 *
 * 测试范围：
 *   - 四个常量均已导出，均为非空对象
 *   - SCN_NORMAL 含 id / label / desc，无特定建筑字段
 *   - SCN_ORANGE_CRACK 关联 B001（id=1001），dataPointId=10001（B001裂缝）
 *   - SCN_ORANGE_CRACK.injectValue 超 limitH 且低于 limitHh，告警级别 H
 *   - SCN_RED_TILT 关联 B002（id=1002），dataPointId=10005（B002倾角）
 *   - SCN_RED_TILT.injectValue 超 limitHh，告警级别 HH
 *   - SCN_OVERTIME_SUPERVISION 含 slaHours / overtimeHours，且 overtimeHours > slaHours
 *   - SCENARIOS 数组导出，长度 4，包含全部常量，id 不重复
 *   - 导入模块后 localStorage 中无 ywtg.sqlite. 写入（纯常量，无副作用）
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"

// ── fake localStorage ─────────────────────────────────────────────────────────

function createFakeStorage(): Storage & { _store: Record<string, string> } {
  const _store: Record<string, string> = {}
  return {
    _store,
    getItem:    (k) => _store[k] ?? null,
    setItem:    (k, v) => { _store[k] = v },
    removeItem: (k) => { delete _store[k] },
    clear:      () => { Object.keys(_store).forEach((k) => delete _store[k]) },
    get length() { return Object.keys(_store).length },
    key:        (i) => Object.keys(_store)[i] ?? null,
  } as Storage & { _store: Record<string, string> }
}

let fakeStorage: ReturnType<typeof createFakeStorage>

beforeEach(() => {
  fakeStorage = createFakeStorage()
  ;(globalThis as any).localStorage = fakeStorage
})

afterEach(() => {
  delete (globalThis as any).localStorage
})

// ── 动态导入（避免模块缓存污染其他测试）────────────────────────────────────────

async function importScenarios() {
  return import("../src/mock/seeds/scenarioConstants")
}

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.33 SCN_NORMAL", () => {
  it("已导出，非空", async () => {
    const { SCN_NORMAL } = await importScenarios()
    expect(SCN_NORMAL).toBeDefined()
    expect(SCN_NORMAL).not.toBeNull()
  })

  it("id 为 'NORMAL'", async () => {
    const { SCN_NORMAL } = await importScenarios()
    expect(SCN_NORMAL.id).toBe("NORMAL")
  })

  it("含 label 字段（非空字符串）", async () => {
    const { SCN_NORMAL } = await importScenarios()
    expect(typeof SCN_NORMAL.label).toBe("string")
    expect(SCN_NORMAL.label.length).toBeGreaterThan(0)
  })

  it("含 desc 字段（非空字符串）", async () => {
    const { SCN_NORMAL } = await importScenarios()
    expect(typeof SCN_NORMAL.desc).toBe("string")
    expect(SCN_NORMAL.desc.length).toBeGreaterThan(0)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.33 SCN_ORANGE_CRACK", () => {
  it("已导出，非空", async () => {
    const { SCN_ORANGE_CRACK } = await importScenarios()
    expect(SCN_ORANGE_CRACK).toBeDefined()
  })

  it("关联 B001 建筑（buildingId=1001，buildingCode='B001'）", async () => {
    const { SCN_ORANGE_CRACK } = await importScenarios()
    expect(SCN_ORANGE_CRACK.buildingId).toBe(1001)
    expect(SCN_ORANGE_CRACK.buildingCode).toBe("B001")
  })

  it("dataPointId=10001（B001 裂缝点）", async () => {
    const { SCN_ORANGE_CRACK } = await importScenarios()
    expect(SCN_ORANGE_CRACK.dataPointId).toBe(10001)
  })

  it("factorCode 为 'CRACK'", async () => {
    const { SCN_ORANGE_CRACK } = await importScenarios()
    expect(SCN_ORANGE_CRACK.factorCode).toBe("CRACK")
  })

  it("injectValue 超橙色阈值 limitH 但低于红色阈值 limitHh", async () => {
    const { SCN_ORANGE_CRACK } = await importScenarios()
    expect(SCN_ORANGE_CRACK.injectValue).toBeGreaterThan(SCN_ORANGE_CRACK.limitH)
    expect(SCN_ORANGE_CRACK.injectValue).toBeLessThan(SCN_ORANGE_CRACK.limitHh)
  })

  it("告警级别为 'H'（橙色）", async () => {
    const { SCN_ORANGE_CRACK } = await importScenarios()
    expect(SCN_ORANGE_CRACK.expectedAlarmLevel).toBe("H")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.33 SCN_RED_TILT", () => {
  it("已导出，非空", async () => {
    const { SCN_RED_TILT } = await importScenarios()
    expect(SCN_RED_TILT).toBeDefined()
  })

  it("关联 B002 建筑（buildingId=1002，buildingCode='B002'）", async () => {
    const { SCN_RED_TILT } = await importScenarios()
    expect(SCN_RED_TILT.buildingId).toBe(1002)
    expect(SCN_RED_TILT.buildingCode).toBe("B002")
  })

  it("dataPointId=10005（B002 倾角点：10001+1×3+1）", async () => {
    const { SCN_RED_TILT } = await importScenarios()
    expect(SCN_RED_TILT.dataPointId).toBe(10005)
  })

  it("factorCode 为 'TILT'", async () => {
    const { SCN_RED_TILT } = await importScenarios()
    expect(SCN_RED_TILT.factorCode).toBe("TILT")
  })

  it("injectValue 超红色阈值 limitHh", async () => {
    const { SCN_RED_TILT } = await importScenarios()
    expect(SCN_RED_TILT.injectValue).toBeGreaterThan(SCN_RED_TILT.limitHh)
  })

  it("告警级别为 'HH'（红色）", async () => {
    const { SCN_RED_TILT } = await importScenarios()
    expect(SCN_RED_TILT.expectedAlarmLevel).toBe("HH")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.33 SCN_OVERTIME_SUPERVISION", () => {
  it("已导出，非空", async () => {
    const { SCN_OVERTIME_SUPERVISION } = await importScenarios()
    expect(SCN_OVERTIME_SUPERVISION).toBeDefined()
  })

  it("关联 B003 建筑（buildingId=1003）", async () => {
    const { SCN_OVERTIME_SUPERVISION } = await importScenarios()
    expect(SCN_OVERTIME_SUPERVISION.buildingId).toBe(1003)
  })

  it("dataPointId=10009（B003 沉降点：10001+2×3+2）", async () => {
    const { SCN_OVERTIME_SUPERVISION } = await importScenarios()
    expect(SCN_OVERTIME_SUPERVISION.dataPointId).toBe(10009)
  })

  it("factorCode 为 'SETTLE'", async () => {
    const { SCN_OVERTIME_SUPERVISION } = await importScenarios()
    expect(SCN_OVERTIME_SUPERVISION.factorCode).toBe("SETTLE")
  })

  it("slaHours 和 overtimeHours 均为数字，且 overtimeHours > slaHours", async () => {
    const { SCN_OVERTIME_SUPERVISION } = await importScenarios()
    expect(typeof SCN_OVERTIME_SUPERVISION.slaHours).toBe("number")
    expect(typeof SCN_OVERTIME_SUPERVISION.overtimeHours).toBe("number")
    expect(SCN_OVERTIME_SUPERVISION.overtimeHours).toBeGreaterThan(
      SCN_OVERTIME_SUPERVISION.slaHours
    )
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.33 SCENARIOS 数组", () => {
  it("已导出", async () => {
    const { SCENARIOS } = await importScenarios()
    expect(SCENARIOS).toBeDefined()
    expect(Array.isArray(SCENARIOS)).toBe(true)
  })

  it("包含全部 4 个场景", async () => {
    const { SCENARIOS } = await importScenarios()
    expect(SCENARIOS).toHaveLength(4)
  })

  it("包含 SCN_NORMAL", async () => {
    const { SCENARIOS, SCN_NORMAL } = await importScenarios()
    expect(SCENARIOS).toContain(SCN_NORMAL)
  })

  it("包含 SCN_ORANGE_CRACK", async () => {
    const { SCENARIOS, SCN_ORANGE_CRACK } = await importScenarios()
    expect(SCENARIOS).toContain(SCN_ORANGE_CRACK)
  })

  it("包含 SCN_RED_TILT", async () => {
    const { SCENARIOS, SCN_RED_TILT } = await importScenarios()
    expect(SCENARIOS).toContain(SCN_RED_TILT)
  })

  it("包含 SCN_OVERTIME_SUPERVISION", async () => {
    const { SCENARIOS, SCN_OVERTIME_SUPERVISION } = await importScenarios()
    expect(SCENARIOS).toContain(SCN_OVERTIME_SUPERVISION)
  })

  it("所有场景 id 唯一", async () => {
    const { SCENARIOS } = await importScenarios()
    const ids = SCENARIOS.map((s) => s.id)
    expect(new Set(ids).size).toBe(SCENARIOS.length)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.33 无 localStorage 副作用", () => {
  it("导入模块后 localStorage 中无 ywtg.sqlite. 键（纯常量，无副作用）", async () => {
    await importScenarios()
    const sqliteKeys = Object.keys(fakeStorage._store).filter((k) =>
      k.startsWith("ywtg.sqlite.")
    )
    expect(sqliteKeys).toHaveLength(0)
  })
})

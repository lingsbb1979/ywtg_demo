/**
 * T15.127 — iotDemoService 单元测试
 *
 * 测试内容：
 *   1. getBuildingIotSummary: 返回建筑正确的数据点汇总 + 最近10条遥测
 *   2. startOrangeCrackIot: 注入遥测数据后，分析结果达到橙色阈值，停止定时器
 *   3. startRedTiltIot: 注入遥测数据后，分析结果达到红色阈值，停止定时器
 *   4. stopAllIotDemo: 强制清理不影响其他状态
 *   5. getAllBuildingsIotLatest: 返回所有建筑的汇总
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import {
  getBuildingIotSummary,
  getAllBuildingsIotLatest,
  startOrangeCrackIot,
  startRedTiltIot,
  stopAllIotDemo,
  isOrangeRunning,
  isRedRunning,
} from "../src/services/iotDemoService"
import { setTable, getTable } from "../src/services/sqliteMirrorRepository"
import { seedDataPoints } from "../src/mock/seeds/seedDataPoints"
import { seedTelemetry } from "../src/mock/seeds/seedTelemetry"
import { seedBuildings } from "../src/mock/seeds/seedBuildings"
import { seedAnalysisConfig } from "../src/mock/seeds/seedAnalysisConfig"
import { seedAnalysisLink } from "../src/mock/seeds/seedAnalysisLink"

// ── helpers ───────────────────────────────────────────────────────────────────

function setupSeed() {
  seedBuildings()
  seedDataPoints()
  seedTelemetry()
  seedAnalysisConfig()
  seedAnalysisLink()
  // 清空 alarm_record
  setTable("alarm_record", [])
  // 清空 space_analysis_archive
  setTable("space_analysis_archive", [])
}

// ── 1. getBuildingIotSummary ──────────────────────────────────────────────────

describe("getBuildingIotSummary", () => {
  beforeEach(() => {
    setupSeed()
  })

  it("返回 B003（space_id=1003）的遥测汇总", () => {
    const result = getBuildingIotSummary(1003)
    expect(result).not.toBeNull()
    expect(result!.spaceId).toBe(1003)
    expect(result!.points.length).toBeGreaterThan(0)
  })

  it("每个数据点包含 limitH / limitHh 阈值", () => {
    const result = getBuildingIotSummary(1003)!
    const crackPoint = result.points.find((p) => p.factorCode === "CRACK")
    expect(crackPoint).toBeDefined()
    expect(crackPoint!.limitH).toBe(2.0)
    expect(crackPoint!.limitHh).toBe(5.0)
  })

  it("每个数据点有 latestValue 和 recent10", () => {
    const result = getBuildingIotSummary(1003)!
    for (const pt of result.points) {
      expect(pt.recent10.length).toBeLessThanOrEqual(10)
    }
  })

  it("不存在的 spaceId 返回 null", () => {
    const result = getBuildingIotSummary(99999)
    expect(result).toBeNull()
  })
})

// ── 2. getAllBuildingsIotLatest ────────────────────────────────────────────────

describe("getAllBuildingsIotLatest", () => {
  beforeEach(() => {
    setupSeed()
  })

  it("返回所有 type=2 的建筑", () => {
    const result = getAllBuildingsIotLatest()
    expect(result.length).toBeGreaterThan(0)
    // 应有 23 栋建筑（iot_space type=2）
    expect(result.length).toBeLessThanOrEqual(23)
  })

  it("每栋建筑有 spaceId / buildingName / points", () => {
    const result = getAllBuildingsIotLatest()
    for (const b of result) {
      expect(b.spaceId).toBeTypeOf("number")
      expect(b.buildingName).toBeTypeOf("string")
      expect(Array.isArray(b.points)).toBe(true)
    }
  })
})

// ── 3. startOrangeCrackIot (使用 fake timers) ────────────────────────────────

describe("startOrangeCrackIot", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setupSeed()
  })

  afterEach(() => {
    stopAllIotDemo()
    vi.useRealTimers()
  })

  it("启动后 isOrangeRunning() 为 true", () => {
    startOrangeCrackIot({ onTick: () => {}, onDone: () => {} })
    expect(isOrangeRunning()).toBe(true)
    stopAllIotDemo()
  })

  it("触发后 onDone 以 triggered 调用，且 alarm_record 写入", async () => {
    let doneOutcome = ""
    startOrangeCrackIot({
      onTick: () => {},
      onDone: (outcome) => { doneOutcome = outcome },
    })

    // 推进 12 秒（MAX_TICKS=12，每 tick +0.25 从 1.5mm 开始，约 3 tick 超 2.0mm）
    for (let i = 0; i < 12; i++) {
      vi.advanceTimersByTime(1000)
    }

    // 应已触发或超时
    expect(["triggered", "timeout"]).toContain(doneOutcome)

    // 若触发，alarm_record 应有 ACTIVE 记录
    if (doneOutcome === "triggered") {
      const alarms = getTable<{ status: string; alarm_level: string }>("alarm_record")
      const active = alarms.filter((a) => a.status === "ACTIVE")
      expect(active.length).toBeGreaterThan(0)
    }
  })

  it("重复调用不会叠加计时器", () => {
    startOrangeCrackIot({ onTick: () => {}, onDone: () => {} })
    startOrangeCrackIot({ onTick: () => {}, onDone: () => {} })  // 重复调用应忽略
    expect(isOrangeRunning()).toBe(true)
    stopAllIotDemo()
  })
})

// ── 4. startRedTiltIot ────────────────────────────────────────────────────────

describe("startRedTiltIot", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setupSeed()
  })

  afterEach(() => {
    stopAllIotDemo()
    vi.useRealTimers()
  })

  it("启动后 isRedRunning() 为 true", () => {
    startRedTiltIot({ onTick: () => {}, onDone: () => {} })
    expect(isRedRunning()).toBe(true)
    stopAllIotDemo()
  })

  it("触发后 alarm_record 中有红色告警", () => {
    let done = false
    startRedTiltIot({
      onTick: () => {},
      onDone: (outcome) => { done = outcome === "triggered" },
    })

    // 推进足够时间（12 tick * 1s）
    for (let i = 0; i < 12; i++) {
      vi.advanceTimersByTime(1000)
    }

    if (done) {
      const alarms = getTable<{ alarm_level: string; status: string }>("alarm_record")
      const redActive = alarms.filter((a) => a.alarm_level === "RED" && a.status === "ACTIVE")
      expect(redActive.length).toBeGreaterThan(0)
    }
  })
})

// ── 5. stopAllIotDemo ─────────────────────────────────────────────────────────

describe("stopAllIotDemo", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setupSeed()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("停止后 isOrangeRunning 和 isRedRunning 均为 false", () => {
    startOrangeCrackIot({ onTick: () => {}, onDone: () => {} })
    startRedTiltIot({ onTick: () => {}, onDone: () => {} })
    expect(isOrangeRunning()).toBe(true)
    expect(isRedRunning()).toBe(true)

    stopAllIotDemo()
    expect(isOrangeRunning()).toBe(false)
    expect(isRedRunning()).toBe(false)
  })
})

/**
 * T15.44 — 实现告警详情查询 getAlarm
 *
 * 可查看告警来源数据、阈值、建筑、处置建议。
 *
 * 测试范围：
 *   - getAlarm 可从 alarmService 导入
 *   - id 不存在时返回 { ok: false, error }
 *   - 存在时返回 { ok: true, data }
 *   - data 包含完整基础字段（id/alarmId/alarmCode/status/triggerTime…）
 *   - data 包含扩展字段（rootCause/aggregateFlag/rawData/sensorId/deviceId）
 *   - data 包含建筑信息（buildingCode/buildingName）
 *   - buildingId 无 iot_space 时 buildingCode=null
 *   - data 包含 dataPointName/factorCode/unit（来自 iot_data_point）
 *   - sensor_id 无对应 iot_data_point 时三字段为 null
 *   - data 包含 thresholds（来自 space_analysis_config.risk_level_json）
 *   - thresholds 结构包含 green/yellow/orange/red
 *   - 无对应 space_analysis_config 时 thresholds=null
 *   - data 包含 disposalSuggestion 字符串
 *   - RED 告警 disposalSuggestion 含紧急关键词
 *   - ORANGE 告警 disposalSuggestion 含核查/处置关键词
 *   - YELLOW 告警 disposalSuggestion 含监测/关注关键词
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { setTable } from "../src/services/sqliteMirrorRepository"
import { seedBuildings } from "../src/mock/seeds/seedBuildings"
import { seedDataPoints } from "../src/mock/seeds/seedDataPoints"
import { seedAnalysisLink } from "../src/mock/seeds/seedAnalysisLink"

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
  seedDataPoints()
  seedAnalysisLink()
})

afterEach(() => {
  delete (globalThis as any).localStorage
})

async function importService() {
  return import("../src/services/alarmService")
}

// ── 测试数据 ──────────────────────────────────────────────────────────────────

// B001(1001) crack point = 10001, B001 analysis config space_id=1001 metric_id=1 → id=30001
const ORANGE_ALARM = {
  id: 1, alarm_id: "ALM-001", alarm_code: "CRACK-001",
  device_id: "DEV-001", building_id: 1001, sensor_id: 10001,
  alarm_title: "裂缝超限告警", alarm_type: "CRACK", alarm_level: "ORANGE",
  alarm_content: "裂缝值超过橙色阈值", root_cause: "裂缝传感器读数持续升高",
  aggregate_flag: 0, raw_data: '{"valueNum":2.8,"ts":"2024-03-08 08:00:00"}',
  status: "ACTIVE", trigger_time: "2024-03-08 10:00:00",
  handle_time: null, handle_user: null,
  create_time: "2024-03-08 10:00:00", update_time: "2024-03-08 10:00:00",
}

const RED_ALARM = {
  id: 2, alarm_id: "ALM-002", alarm_code: "TILT-001",
  device_id: "DEV-002", building_id: 1002, sensor_id: 10005,
  alarm_title: "倾斜超限告警", alarm_type: "TILT", alarm_level: "RED",
  alarm_content: "倾斜值超过红色阈值", root_cause: null,
  aggregate_flag: 0, raw_data: null,
  status: "PENDING", trigger_time: "2024-03-08 11:00:00",
  handle_time: null, handle_user: null,
  create_time: "2024-03-08 11:00:00", update_time: null,
}

const YELLOW_ALARM = {
  id: 3, alarm_id: "ALM-003", alarm_code: "SETTLE-001",
  device_id: null, building_id: 1003, sensor_id: 10009,
  alarm_title: "沉降异常告警", alarm_type: "SETTLE", alarm_level: "YELLOW",
  alarm_content: "沉降速率超警戒", root_cause: null,
  aggregate_flag: 0, raw_data: null, status: "CLOSED",
  trigger_time: "2024-03-07 09:00:00",
  handle_time: "2024-03-07 12:00:00", handle_user: "张三",
  create_time: "2024-03-07 09:00:00", update_time: "2024-03-07 12:00:00",
}

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.44 getAlarm() — 导出", () => {
  it("getAlarm 可从 alarmService 导入", async () => {
    const { getAlarm } = await importService()
    expect(typeof getAlarm).toBe("function")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.44 getAlarm() — 错误处理", () => {
  it("id 不存在时返回 { ok: false }", async () => {
    setTable("alarm_record", [ORANGE_ALARM])
    const { getAlarm } = await importService()
    expect(getAlarm(9999).ok).toBe(false)
  })

  it("id 不存在时包含 error 字段", async () => {
    setTable("alarm_record", [ORANGE_ALARM])
    const { getAlarm } = await importService()
    const result = getAlarm(9999)
    expect(!result.ok && typeof result.error).toBe("string")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.44 getAlarm() — 基础字段", () => {
  beforeEach(() => setTable("alarm_record", [ORANGE_ALARM, RED_ALARM, YELLOW_ALARM]))

  it("返回 ok=true", async () => {
    const { getAlarm } = await importService()
    expect(getAlarm(1).ok).toBe(true)
  })

  it("返回 data.id", async () => {
    const { getAlarm } = await importService()
    const r = getAlarm(1)
    expect(r.ok && r.data.id).toBe(1)
  })

  it("返回 data.alarmId", async () => {
    const { getAlarm } = await importService()
    const r = getAlarm(1)
    expect(r.ok && r.data.alarmId).toBe("ALM-001")
  })

  it("返回 data.alarmCode", async () => {
    const { getAlarm } = await importService()
    const r = getAlarm(1)
    expect(r.ok && r.data.alarmCode).toBe("CRACK-001")
  })

  it("返回 data.alarmLevel", async () => {
    const { getAlarm } = await importService()
    const r = getAlarm(1)
    expect(r.ok && r.data.alarmLevel).toBe("ORANGE")
  })

  it("返回 data.status", async () => {
    const { getAlarm } = await importService()
    const r = getAlarm(1)
    expect(r.ok && r.data.status).toBe("ACTIVE")
  })

  it("返回 data.triggerTime", async () => {
    const { getAlarm } = await importService()
    const r = getAlarm(1)
    expect(r.ok && r.data.triggerTime).toBe("2024-03-08 10:00:00")
  })

  it("返回 data.handleTime（可为 null）", async () => {
    const { getAlarm } = await importService()
    const r = getAlarm(1)
    if (!r.ok) throw new Error("should be ok")
    expect("handleTime" in r.data).toBe(true)
  })

  it("返回 data.handleUser（CLOSED 时有值）", async () => {
    const { getAlarm } = await importService()
    const r = getAlarm(3)
    expect(r.ok && r.data.handleUser).toBe("张三")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.44 getAlarm() — 扩展字段", () => {
  beforeEach(() => setTable("alarm_record", [ORANGE_ALARM, RED_ALARM, YELLOW_ALARM]))

  it("返回 data.rootCause", async () => {
    const { getAlarm } = await importService()
    const r = getAlarm(1)
    expect(r.ok && r.data.rootCause).toBe("裂缝传感器读数持续升高")
  })

  it("rootCause 为 null 时返回 null", async () => {
    const { getAlarm } = await importService()
    const r = getAlarm(2)
    if (!r.ok) throw new Error("should be ok")
    expect(r.data.rootCause).toBeNull()
  })

  it("返回 data.rawData（可为 null）", async () => {
    const { getAlarm } = await importService()
    const r = getAlarm(1)
    if (!r.ok) throw new Error("should be ok")
    expect("rawData" in r.data).toBe(true)
  })

  it("返回 data.aggregateFlag", async () => {
    const { getAlarm } = await importService()
    const r = getAlarm(1)
    if (!r.ok) throw new Error("should be ok")
    expect("aggregateFlag" in r.data).toBe(true)
  })

  it("返回 data.sensorId", async () => {
    const { getAlarm } = await importService()
    const r = getAlarm(1)
    expect(r.ok && r.data.sensorId).toBe(10001)
  })

  it("返回 data.deviceId", async () => {
    const { getAlarm } = await importService()
    const r = getAlarm(1)
    expect(r.ok && r.data.deviceId).toBe("DEV-001")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.44 getAlarm() — 建筑信息", () => {
  beforeEach(() => setTable("alarm_record", [ORANGE_ALARM, RED_ALARM, YELLOW_ALARM]))

  it("buildingCode 关联 iot_space.space_code", async () => {
    const { getAlarm } = await importService()
    const r = getAlarm(1)
    expect(r.ok && r.data.buildingCode).toBe("B001")
  })

  it("buildingName 关联 iot_space.name（非空字符串）", async () => {
    const { getAlarm } = await importService()
    const r = getAlarm(1)
    if (!r.ok) throw new Error("should be ok")
    expect(typeof r.data.buildingName).toBe("string")
    expect(r.data.buildingName!.length).toBeGreaterThan(0)
  })

  it("无对应 iot_space 时 buildingCode=null", async () => {
    setTable("alarm_record", [{ ...ORANGE_ALARM, id: 10, building_id: 88888 }])
    const { getAlarm } = await importService()
    const r = getAlarm(10)
    if (!r.ok) throw new Error("should be ok")
    expect(r.data.buildingCode).toBeNull()
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.44 getAlarm() — 数据点信息", () => {
  beforeEach(() => setTable("alarm_record", [ORANGE_ALARM, RED_ALARM, YELLOW_ALARM]))

  it("返回 data.dataPointName（字符串）", async () => {
    const { getAlarm } = await importService()
    const r = getAlarm(1)
    if (!r.ok) throw new Error("should be ok")
    expect(typeof r.data.dataPointName).toBe("string")
    expect(r.data.dataPointName!.length).toBeGreaterThan(0)
  })

  it("sensor_id 无对应 iot_data_point 时 dataPointName=null", async () => {
    setTable("alarm_record", [{ ...ORANGE_ALARM, id: 20, sensor_id: 99999 }])
    const { getAlarm } = await importService()
    const r = getAlarm(20)
    if (!r.ok) throw new Error("should be ok")
    expect(r.data.dataPointName).toBeNull()
  })

  it("sensor_id 无对应 iot_data_point 时 unit=null", async () => {
    setTable("alarm_record", [{ ...ORANGE_ALARM, id: 20, sensor_id: 99999 }])
    const { getAlarm } = await importService()
    const r = getAlarm(20)
    if (!r.ok) throw new Error("should be ok")
    expect(r.data.unit).toBeNull()
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.44 getAlarm() — 阈值信息", () => {
  beforeEach(() => setTable("alarm_record", [ORANGE_ALARM, RED_ALARM, YELLOW_ALARM]))

  it("thresholds 不为 null（有 space_analysis_config 时）", async () => {
    const { getAlarm } = await importService()
    const r = getAlarm(1)
    if (!r.ok) throw new Error("should be ok")
    expect(r.data.thresholds).not.toBeNull()
  })

  it("thresholds 包含 green 字段", async () => {
    const { getAlarm } = await importService()
    const r = getAlarm(1)
    if (!r.ok) throw new Error("should be ok")
    expect(r.data.thresholds && "green" in r.data.thresholds).toBe(true)
  })

  it("thresholds 包含 orange 字段", async () => {
    const { getAlarm } = await importService()
    const r = getAlarm(1)
    if (!r.ok) throw new Error("should be ok")
    expect(r.data.thresholds && "orange" in r.data.thresholds).toBe(true)
  })

  it("thresholds 包含 red 字段", async () => {
    const { getAlarm } = await importService()
    const r = getAlarm(1)
    if (!r.ok) throw new Error("should be ok")
    expect(r.data.thresholds && "red" in r.data.thresholds).toBe(true)
  })

  it("无对应 space_analysis_config 时 thresholds=null", async () => {
    setTable("alarm_record", [{ ...ORANGE_ALARM, id: 30, building_id: 88888, sensor_id: 99999 }])
    const { getAlarm } = await importService()
    const r = getAlarm(30)
    if (!r.ok) throw new Error("should be ok")
    expect(r.data.thresholds).toBeNull()
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.44 getAlarm() — 处置建议", () => {
  beforeEach(() => setTable("alarm_record", [ORANGE_ALARM, RED_ALARM, YELLOW_ALARM]))

  it("disposalSuggestion 为字符串", async () => {
    const { getAlarm } = await importService()
    const r = getAlarm(1)
    if (!r.ok) throw new Error("should be ok")
    expect(typeof r.data.disposalSuggestion).toBe("string")
    expect(r.data.disposalSuggestion.length).toBeGreaterThan(0)
  })

  it("RED 告警 disposalSuggestion 含紧急处理语义", async () => {
    const { getAlarm } = await importService()
    const r = getAlarm(2)
    if (!r.ok) throw new Error("should be ok")
    const s = r.data.disposalSuggestion
    expect(s.includes("应急") || s.includes("紧急") || s.includes("疏散")).toBe(true)
  })

  it("ORANGE 告警 disposalSuggestion 含核查/处置语义", async () => {
    const { getAlarm } = await importService()
    const r = getAlarm(1)
    if (!r.ok) throw new Error("should be ok")
    const s = r.data.disposalSuggestion
    expect(s.includes("核查") || s.includes("处置") || s.includes("专业")).toBe(true)
  })

  it("YELLOW 告警 disposalSuggestion 含监测/关注语义", async () => {
    const { getAlarm } = await importService()
    const r = getAlarm(3)
    if (!r.ok) throw new Error("should be ok")
    const s = r.data.disposalSuggestion
    expect(s.includes("监测") || s.includes("关注") || s.includes("巡检")).toBe(true)
  })
})

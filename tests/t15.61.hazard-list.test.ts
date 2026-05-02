/**
 * T15.61 — 实现隐患清单选择器 selectHazardList
 *
 * 大屏右侧可按风险等级显示重点隐患，用于左侧"隐患清单"面板。
 *
 * 函数签名：
 *   selectHazardList(query?: HazardListQuery): HazardListItem[]
 *
 * query 参数：
 *   alarmLevel?  — 过滤告警等级（RED / ORANGE / YELLOW）
 *   buildingId?  — 过滤建筑
 *   keyword?     — 模糊匹配 alarm_title
 *   limit?       — 最多返回条数，默认 20
 *
 * 逻辑：
 *   - 查询 alarm_record 中 status ≠ CLOSED/CANCELLED 的未销号隐患
 *   - 关联 iot_space(building_id→id) 获取建筑名
 *   - 按 alarm_level 降序（RED→ORANGE→YELLOW），同级按 trigger_time 倒序
 *   - 应用 query 过滤
 *   - 截取 limit 条
 *
 * 返回字段：
 *   id, alarmId, alarmTitle, alarmLevel, alarmType, buildingId, buildingName,
 *   status, triggerTime
 *
 * 测试范围（22 条）：
 *   - 导出检查
 *   - 无数据返回空数组
 *   - 返回类型为数组
 *   - 只返回未销号（非 CLOSED/CANCELLED）
 *   - 返回 RED 级优先排序
 *   - 同级按 triggerTime 倒序
 *   - alarmLevel 过滤
 *   - buildingId 过滤
 *   - keyword 过滤 alarmTitle
 *   - limit 截断
 *   - 含字段 id / alarmId / alarmTitle / alarmLevel / buildingId / status / triggerTime
 *   - buildingName 来自 iot_space.name
 *   - 无匹配 iot_space 时 buildingName=null
 *   - CLOSED 不返回
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { setTable } from "../src/services/sqliteMirrorRepository"

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
  setTable("iot_space",    [])
})

afterEach(() => {
  delete (globalThis as any).localStorage
})

async function importService() {
  return import("../src/services/screenKpiService")
}

const SPACE_A = { id: 1001, space_code: "B001", name: "建筑A", type: "2", latitude: 46.82, longitude: 130.36 }
const SPACE_B = { id: 1002, space_code: "B002", name: "建筑B", type: "2", latitude: 46.83, longitude: 130.37 }

const ALARM_RED = {
  id: 1, alarm_id: "ALM-001", alarm_title: "裂缝超限", alarm_type: "CRACK",
  alarm_level: "RED", building_id: 1001, status: "ACTIVE",
  trigger_time: "2024-03-08 09:00:00",
}
const ALARM_ORANGE = {
  id: 2, alarm_id: "ALM-002", alarm_title: "沉降异常", alarm_type: "SETTLE",
  alarm_level: "ORANGE", building_id: 1001, status: "ACTIVE",
  trigger_time: "2024-03-08 10:00:00",
}
const ALARM_YELLOW = {
  id: 3, alarm_id: "ALM-003", alarm_title: "倾斜超阈", alarm_type: "TILT",
  alarm_level: "YELLOW", building_id: 1002, status: "PENDING",
  trigger_time: "2024-03-08 11:00:00",
}
const ALARM_CLOSED = {
  id: 4, alarm_id: "ALM-004", alarm_title: "旧裂缝", alarm_type: "CRACK",
  alarm_level: "RED", building_id: 1001, status: "CLOSED",
  trigger_time: "2024-03-07 08:00:00",
}
const ALARM_ORANGE_NEWER = {
  id: 5, alarm_id: "ALM-005", alarm_title: "ORANGE较新", alarm_type: "SETTLE",
  alarm_level: "ORANGE", building_id: 1002, status: "ACTIVE",
  trigger_time: "2024-03-08 12:00:00",
}

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.61 selectHazardList() — 导出", () => {
  it("selectHazardList 可从 screenKpiService 导入", async () => {
    const { selectHazardList } = await importService()
    expect(typeof selectHazardList).toBe("function")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.61 selectHazardList() — 空数据", () => {
  it("无告警时返回空数组", async () => {
    const { selectHazardList } = await importService()
    expect(selectHazardList()).toEqual([])
  })

  it("返回类型为数组", async () => {
    const { selectHazardList } = await importService()
    expect(Array.isArray(selectHazardList())).toBe(true)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.61 selectHazardList() — 基础查询", () => {
  beforeEach(() => {
    setTable("iot_space",    [SPACE_A, SPACE_B])
    setTable("alarm_record", [ALARM_RED, ALARM_ORANGE, ALARM_YELLOW, ALARM_CLOSED])
  })

  it("只返回未销号（3 条，排除 CLOSED）", async () => {
    const { selectHazardList } = await importService()
    expect(selectHazardList().length).toBe(3)
  })

  it("CLOSED 不返回", async () => {
    const { selectHazardList } = await importService()
    const list = selectHazardList()
    expect(list.every((r: any) => r.status !== "CLOSED")).toBe(true)
  })

  it("RED 排在最前", async () => {
    const { selectHazardList } = await importService()
    expect(selectHazardList()[0].alarmLevel).toBe("RED")
  })

  it("含字段 id", async () => {
    const { selectHazardList } = await importService()
    expect(typeof selectHazardList()[0].id).toBe("number")
  })

  it("含字段 alarmId", async () => {
    const { selectHazardList } = await importService()
    expect(selectHazardList()[0].alarmId).toBe("ALM-001")
  })

  it("含字段 alarmTitle", async () => {
    const { selectHazardList } = await importService()
    expect(selectHazardList()[0].alarmTitle).toBe("裂缝超限")
  })

  it("含字段 buildingId", async () => {
    const { selectHazardList } = await importService()
    expect(selectHazardList()[0].buildingId).toBe(1001)
  })

  it("含字段 status", async () => {
    const { selectHazardList } = await importService()
    expect(selectHazardList()[0].status).toBe("ACTIVE")
  })

  it("含字段 triggerTime", async () => {
    const { selectHazardList } = await importService()
    expect(selectHazardList()[0].triggerTime).toBe("2024-03-08 09:00:00")
  })

  it("buildingName 来自 iot_space.name", async () => {
    const { selectHazardList } = await importService()
    expect(selectHazardList()[0].buildingName).toBe("建筑A")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.61 selectHazardList() — 排序", () => {
  it("同级 ORANGE 按 triggerTime 倒序（较新在前）", async () => {
    setTable("alarm_record", [ALARM_ORANGE, ALARM_ORANGE_NEWER])
    const { selectHazardList } = await importService()
    const list = selectHazardList()
    expect(list[0].triggerTime).toBe("2024-03-08 12:00:00")
    expect(list[1].triggerTime).toBe("2024-03-08 10:00:00")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.61 selectHazardList() — 过滤", () => {
  beforeEach(() => {
    setTable("iot_space",    [SPACE_A, SPACE_B])
    setTable("alarm_record", [ALARM_RED, ALARM_ORANGE, ALARM_YELLOW])
  })

  it("alarmLevel=RED 只返回 1 条", async () => {
    const { selectHazardList } = await importService()
    expect(selectHazardList({ alarmLevel: "RED" }).length).toBe(1)
  })

  it("buildingId=1001 只返回该建筑的告警", async () => {
    const { selectHazardList } = await importService()
    const list = selectHazardList({ buildingId: 1001 })
    expect(list.every((r: any) => r.buildingId === 1001)).toBe(true)
  })

  it("keyword 模糊匹配 alarmTitle", async () => {
    const { selectHazardList } = await importService()
    expect(selectHazardList({ keyword: "裂缝" }).length).toBe(1)
  })

  it("limit=2 截断为 2 条", async () => {
    const { selectHazardList } = await importService()
    expect(selectHazardList({ limit: 2 }).length).toBe(2)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.61 selectHazardList() — 无匹配建筑", () => {
  it("无对应 iot_space 时 buildingName=null", async () => {
    setTable("iot_space",    [])
    setTable("alarm_record", [ALARM_RED])
    const { selectHazardList } = await importService()
    expect(selectHazardList()[0].buildingName).toBeNull()
  })
})

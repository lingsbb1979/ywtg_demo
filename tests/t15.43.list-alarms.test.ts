/**
 * T15.43 — 实现告警列表查询 listAlarms
 *
 * 告警中心可按等级（alarmLevel）、状态（status）、建筑（buildingId）、关键字筛选。
 * 结果中关联 iot_space 带出建筑编码和名称。
 * 按 trigger_time 倒序排列（最新在前）。
 *
 * 测试范围：
 *   - listAlarms 可从 alarmService 导入
 *   - alarm_record 为空时返回 []
 *   - 返回 AlarmListItem 结构字段完整
 *   - 按 alarmLevel 筛选
 *   - 按 status 筛选
 *   - 按 buildingId 筛选
 *   - 关键字模糊匹配 alarmTitle / alarmCode
 *   - 关联 iot_space 带出 buildingCode / buildingName
 *   - buildingId 无对应 iot_space 时字段为 null
 *   - 默认按 trigger_time 倒序
 *   - 多条件同时筛选
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { setTable } from "../src/services/sqliteMirrorRepository"
import { seedBuildings } from "../src/mock/seeds/seedBuildings"

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
})

afterEach(() => {
  delete (globalThis as any).localStorage
})

async function importService() {
  return import("../src/services/alarmService")
}

// ── 测试数据 ──────────────────────────────────────────────────────────────────

const ALARM_ROWS = [
  {
    id: 1, alarm_id: "ALM-001", alarm_code: "CRACK-001",
    building_id: 1001, alarm_title: "裂缝超限告警",
    alarm_type: "CRACK", alarm_level: "ORANGE",
    alarm_content: "裂缝值超过橙色阈值", status: "ACTIVE",
    trigger_time: "2024-03-08 10:00:00", create_time: "2024-03-08 10:00:00",
  },
  {
    id: 2, alarm_id: "ALM-002", alarm_code: "TILT-001",
    building_id: 1002, alarm_title: "倾斜超限告警",
    alarm_type: "TILT", alarm_level: "RED",
    alarm_content: "倾斜值超过红色阈值", status: "PENDING",
    trigger_time: "2024-03-08 11:00:00", create_time: "2024-03-08 11:00:00",
  },
  {
    id: 3, alarm_id: "ALM-003", alarm_code: "SETTLE-001",
    building_id: 1001, alarm_title: "沉降异常告警",
    alarm_type: "SETTLE", alarm_level: "YELLOW",
    alarm_content: "沉降速率超警戒", status: "CLOSED",
    trigger_time: "2024-03-07 09:00:00", create_time: "2024-03-07 09:00:00",
  },
  {
    id: 4, alarm_id: "ALM-004", alarm_code: "CRACK-002",
    building_id: 1003, alarm_title: "裂缝异常告警",
    alarm_type: "CRACK", alarm_level: "ORANGE",
    alarm_content: "裂缝宽度急增", status: "ACTIVE",
    trigger_time: "2024-03-09 08:00:00", create_time: "2024-03-09 08:00:00",
  },
]

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.43 listAlarms() — 导出", () => {
  it("listAlarms 可从 alarmService 导入", async () => {
    const { listAlarms } = await importService()
    expect(typeof listAlarms).toBe("function")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.43 listAlarms() — 空数据", () => {
  it("alarm_record 为空时返回空数组", async () => {
    const { listAlarms } = await importService()
    expect(listAlarms()).toEqual([])
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.43 listAlarms() — 返回结构字段", () => {
  beforeEach(() => setTable("alarm_record", ALARM_ROWS))

  it("返回数组非空", async () => {
    const { listAlarms } = await importService()
    expect(listAlarms().length).toBeGreaterThan(0)
  })

  it("返回 id 字段", async () => {
    const { listAlarms } = await importService()
    const item = listAlarms()[0]
    expect(typeof item.id).toBe("number")
  })

  it("返回 alarmId 字段", async () => {
    const { listAlarms } = await importService()
    const item = listAlarms()[0]
    expect("alarmId" in item).toBe(true)
  })

  it("返回 alarmCode 字段", async () => {
    const { listAlarms } = await importService()
    const item = listAlarms()[0]
    expect("alarmCode" in item).toBe(true)
  })

  it("返回 buildingId 字段", async () => {
    const { listAlarms } = await importService()
    const item = listAlarms()[0]
    expect("buildingId" in item).toBe(true)
  })

  it("返回 buildingCode 字段", async () => {
    const { listAlarms } = await importService()
    const item = listAlarms()[0]
    expect("buildingCode" in item).toBe(true)
  })

  it("返回 buildingName 字段", async () => {
    const { listAlarms } = await importService()
    const item = listAlarms()[0]
    expect("buildingName" in item).toBe(true)
  })

  it("返回 alarmTitle 字段", async () => {
    const { listAlarms } = await importService()
    const item = listAlarms()[0]
    expect("alarmTitle" in item).toBe(true)
  })

  it("返回 alarmLevel 字段", async () => {
    const { listAlarms } = await importService()
    const item = listAlarms()[0]
    expect("alarmLevel" in item).toBe(true)
  })

  it("返回 status 字段", async () => {
    const { listAlarms } = await importService()
    const item = listAlarms()[0]
    expect("status" in item).toBe(true)
  })

  it("返回 triggerTime 字段", async () => {
    const { listAlarms } = await importService()
    const item = listAlarms()[0]
    expect("triggerTime" in item).toBe(true)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.43 listAlarms() — 按告警等级筛选", () => {
  beforeEach(() => setTable("alarm_record", ALARM_ROWS))

  it("筛选 alarmLevel=ORANGE 返回 2 条", async () => {
    const { listAlarms } = await importService()
    expect(listAlarms({ alarmLevel: "ORANGE" }).length).toBe(2)
  })

  it("筛选 alarmLevel=RED 返回 1 条", async () => {
    const { listAlarms } = await importService()
    expect(listAlarms({ alarmLevel: "RED" }).length).toBe(1)
  })

  it("筛选 alarmLevel=YELLOW 返回 1 条", async () => {
    const { listAlarms } = await importService()
    expect(listAlarms({ alarmLevel: "YELLOW" }).length).toBe(1)
  })

  it("筛选不存在的等级返回空数组", async () => {
    const { listAlarms } = await importService()
    expect(listAlarms({ alarmLevel: "GREEN" })).toEqual([])
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.43 listAlarms() — 按状态筛选", () => {
  beforeEach(() => setTable("alarm_record", ALARM_ROWS))

  it("筛选 status=ACTIVE 返回 2 条", async () => {
    const { listAlarms } = await importService()
    expect(listAlarms({ status: "ACTIVE" }).length).toBe(2)
  })

  it("筛选 status=PENDING 返回 1 条", async () => {
    const { listAlarms } = await importService()
    expect(listAlarms({ status: "PENDING" }).length).toBe(1)
  })

  it("筛选 status=CLOSED 返回 1 条", async () => {
    const { listAlarms } = await importService()
    expect(listAlarms({ status: "CLOSED" }).length).toBe(1)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.43 listAlarms() — 按建筑筛选", () => {
  beforeEach(() => setTable("alarm_record", ALARM_ROWS))

  it("筛选 buildingId=1001 返回 2 条", async () => {
    const { listAlarms } = await importService()
    expect(listAlarms({ buildingId: 1001 }).length).toBe(2)
  })

  it("筛选 buildingId=1002 返回 1 条", async () => {
    const { listAlarms } = await importService()
    expect(listAlarms({ buildingId: 1002 }).length).toBe(1)
  })

  it("筛选不存在的 buildingId 返回空数组", async () => {
    const { listAlarms } = await importService()
    expect(listAlarms({ buildingId: 9999 })).toEqual([])
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.43 listAlarms() — 关键字模糊匹配", () => {
  beforeEach(() => setTable("alarm_record", ALARM_ROWS))

  it("keyword=裂缝 匹配 alarmTitle 返回 2 条", async () => {
    const { listAlarms } = await importService()
    expect(listAlarms({ keyword: "裂缝" }).length).toBe(2)
  })

  it("keyword=SETTLE-001 匹配 alarmCode 返回 1 条", async () => {
    const { listAlarms } = await importService()
    expect(listAlarms({ keyword: "SETTLE-001" }).length).toBe(1)
  })

  it("keyword 不区分大小写：settle 匹配 SETTLE-001", async () => {
    const { listAlarms } = await importService()
    expect(listAlarms({ keyword: "settle" }).length).toBe(1)
  })

  it("keyword 无匹配时返回空数组", async () => {
    const { listAlarms } = await importService()
    expect(listAlarms({ keyword: "不存在关键字XYZ" })).toEqual([])
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.43 listAlarms() — 关联建筑信息", () => {
  beforeEach(() => setTable("alarm_record", ALARM_ROWS))

  it("buildingCode 关联 iot_space.space_code（B001）", async () => {
    const { listAlarms } = await importService()
    const items = listAlarms({ buildingId: 1001 })
    expect(items[0].buildingCode).toBe("B001")
  })

  it("buildingName 关联 iot_space.name", async () => {
    const { listAlarms } = await importService()
    const items = listAlarms({ buildingId: 1001 })
    expect(typeof items[0].buildingName).toBe("string")
    expect(items[0].buildingName!.length).toBeGreaterThan(0)
  })

  it("building_id 无对应 iot_space 时 buildingCode=null", async () => {
    setTable("alarm_record", [
      { id: 99, building_id: 88888, alarm_level: "RED", status: "ACTIVE" },
    ])
    const { listAlarms } = await importService()
    const items = listAlarms({ buildingId: 88888 })
    expect(items[0].buildingCode).toBeNull()
    expect(items[0].buildingName).toBeNull()
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.43 listAlarms() — 排序", () => {
  beforeEach(() => setTable("alarm_record", ALARM_ROWS))

  it("默认按 trigger_time 倒序（最新在前）", async () => {
    const { listAlarms } = await importService()
    const items = listAlarms()
    for (let i = 0; i < items.length - 1; i++) {
      const t1 = items[i].triggerTime ?? ""
      const t2 = items[i + 1].triggerTime ?? ""
      expect(t1 >= t2).toBe(true)
    }
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.43 listAlarms() — 多条件组合", () => {
  beforeEach(() => setTable("alarm_record", ALARM_ROWS))

  it("buildingId=1001 + status=ACTIVE 返回 1 条", async () => {
    const { listAlarms } = await importService()
    expect(listAlarms({ buildingId: 1001, status: "ACTIVE" }).length).toBe(1)
  })

  it("alarmLevel=ORANGE + status=ACTIVE 返回 2 条", async () => {
    const { listAlarms } = await importService()
    expect(listAlarms({ alarmLevel: "ORANGE", status: "ACTIVE" }).length).toBe(2)
  })

  it("buildingId=1001 + alarmLevel=ORANGE + status=ACTIVE 返回 1 条", async () => {
    const { listAlarms } = await importService()
    expect(
      listAlarms({ buildingId: 1001, alarmLevel: "ORANGE", status: "ACTIVE" }).length
    ).toBe(1)
  })
})

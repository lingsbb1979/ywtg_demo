/**
 * T15.47 — 实现工单列表查询 listWorkOrders
 *
 * 管理端可按状态、等级、责任单位（receiveOrgId / dispatchOrgId）、建筑、关键字筛选工单。
 * 关联 iot_space 带出建筑编码和名称；关联 alarm_record 带出告警标题。
 * 结果按 create_time 倒序（最新在前）。
 *
 * 测试范围：
 *   - listWorkOrders 可从 workOrderService 导入
 *   - work_order 为空时返回 []
 *   - 返回 WorkOrderListItem 结构字段完整
 *   - 按 status 筛选
 *   - 按 orderLevel / alarmLevel 筛选
 *   - 按 receiveOrgId 筛选
 *   - 按 dispatchOrgId 筛选
 *   - 按 buildingId 筛选
 *   - 关键字模糊匹配 order_no / order_code
 *   - 关联 iot_space 带出 buildingCode / buildingName
 *   - buildingId 无对应 iot_space 时字段为 null
 *   - 关联 alarm_record 带出 alarmTitle
 *   - alarm_id 无对应 alarm_record 时 alarmTitle=null
 *   - 默认按 create_time 倒序
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
  return import("../src/services/workOrderService")
}

// ── 测试数据 ──────────────────────────────────────────────────────────────────

const ALARM_ROWS = [
  { id: 1, alarm_id: "ALM-001", alarm_title: "裂缝超限告警", building_id: 1001, alarm_level: "ORANGE", status: "DISPATCHED" },
  { id: 2, alarm_id: "ALM-002", alarm_title: "倾斜超限告警", building_id: 1002, alarm_level: "RED",    status: "DISPATCHED" },
]

const ORDER_ROWS = [
  {
    id: 101, order_no: "WO-20240308-0001", order_code: "WO-20240308-0001",
    alarm_id: "ALM-001", building_id: 1001,
    order_type: "CRACK", order_level: "ORANGE", alarm_level: "ORANGE",
    dispatch_org_id: 104, receive_org_id: 105, assignee_id: 201,
    status: "PENDING", current_node: "DISPATCH",
    dispatch_time: "2024-03-08 10:10:00",
    create_time: "2024-03-08 10:10:00", update_time: "2024-03-08 10:10:00",
  },
  {
    id: 102, order_no: "WO-20240308-0002", order_code: "WO-20240308-0002",
    alarm_id: "ALM-002", building_id: 1002,
    order_type: "TILT", order_level: "RED", alarm_level: "RED",
    dispatch_org_id: 104, receive_org_id: 106, assignee_id: 202,
    status: "PROCESSING", current_node: "HANDLE",
    dispatch_time: "2024-03-08 11:10:00", accept_time: "2024-03-08 11:30:00",
    create_time: "2024-03-08 11:10:00", update_time: "2024-03-08 11:30:00",
  },
  {
    id: 103, order_no: "WO-20240307-0001", order_code: "WO-20240307-0001",
    alarm_id: null, building_id: 1003,
    order_type: "SETTLE", order_level: "YELLOW", alarm_level: "YELLOW",
    dispatch_org_id: 105, receive_org_id: 105, assignee_id: 203,
    status: "CHECKING", current_node: "CHECK",
    dispatch_time: "2024-03-07 09:10:00", finish_time: "2024-03-07 10:00:00",
    create_time: "2024-03-07 09:10:00", update_time: "2024-03-07 10:00:00",
  },
  {
    id: 104, order_no: "WO-20240306-0001", order_code: "WO-20240306-0001",
    alarm_id: null, building_id: 1001,
    order_type: "CRACK", order_level: "ORANGE", alarm_level: "ORANGE",
    dispatch_org_id: 104, receive_org_id: 105, assignee_id: 201,
    status: "FINISHED", current_node: "DONE",
    dispatch_time: "2024-03-06 08:00:00", finish_time: "2024-03-06 14:00:00", check_time: "2024-03-06 15:00:00",
    create_time: "2024-03-06 08:00:00", update_time: "2024-03-06 15:00:00",
  },
]

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.47 listWorkOrders() — 导出", () => {
  it("listWorkOrders 可从 workOrderService 导入", async () => {
    const { listWorkOrders } = await importService()
    expect(typeof listWorkOrders).toBe("function")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.47 listWorkOrders() — 空数据", () => {
  it("work_order 为空时返回空数组", async () => {
    const { listWorkOrders } = await importService()
    expect(listWorkOrders()).toEqual([])
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.47 listWorkOrders() — 返回结构字段", () => {
  beforeEach(() => {
    setTable("alarm_record", ALARM_ROWS)
    setTable("work_order", ORDER_ROWS)
  })

  it("返回数组非空", async () => {
    const { listWorkOrders } = await importService()
    expect(listWorkOrders().length).toBeGreaterThan(0)
  })

  it("返回 id 字段", async () => {
    const { listWorkOrders } = await importService()
    expect("id" in listWorkOrders()[0]).toBe(true)
  })

  it("返回 orderNo 字段", async () => {
    const { listWorkOrders } = await importService()
    expect("orderNo" in listWorkOrders()[0]).toBe(true)
  })

  it("返回 orderCode 字段", async () => {
    const { listWorkOrders } = await importService()
    expect("orderCode" in listWorkOrders()[0]).toBe(true)
  })

  it("返回 status 字段", async () => {
    const { listWorkOrders } = await importService()
    expect("status" in listWorkOrders()[0]).toBe(true)
  })

  it("返回 orderLevel 字段", async () => {
    const { listWorkOrders } = await importService()
    expect("orderLevel" in listWorkOrders()[0]).toBe(true)
  })

  it("返回 buildingId 字段", async () => {
    const { listWorkOrders } = await importService()
    expect("buildingId" in listWorkOrders()[0]).toBe(true)
  })

  it("返回 buildingCode 字段", async () => {
    const { listWorkOrders } = await importService()
    expect("buildingCode" in listWorkOrders()[0]).toBe(true)
  })

  it("返回 buildingName 字段", async () => {
    const { listWorkOrders } = await importService()
    expect("buildingName" in listWorkOrders()[0]).toBe(true)
  })

  it("返回 alarmTitle 字段", async () => {
    const { listWorkOrders } = await importService()
    expect("alarmTitle" in listWorkOrders()[0]).toBe(true)
  })

  it("返回 dispatchTime 字段", async () => {
    const { listWorkOrders } = await importService()
    expect("dispatchTime" in listWorkOrders()[0]).toBe(true)
  })

  it("返回 createTime 字段", async () => {
    const { listWorkOrders } = await importService()
    expect("createTime" in listWorkOrders()[0]).toBe(true)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.47 listWorkOrders() — 按状态筛选", () => {
  beforeEach(() => setTable("work_order", ORDER_ROWS))

  it("筛选 status=PENDING 返回 1 条", async () => {
    const { listWorkOrders } = await importService()
    expect(listWorkOrders({ status: "PENDING" }).length).toBe(1)
  })

  it("筛选 status=PROCESSING 返回 1 条", async () => {
    const { listWorkOrders } = await importService()
    expect(listWorkOrders({ status: "PROCESSING" }).length).toBe(1)
  })

  it("筛选 status=FINISHED 返回 1 条", async () => {
    const { listWorkOrders } = await importService()
    expect(listWorkOrders({ status: "FINISHED" }).length).toBe(1)
  })

  it("筛选不存在的状态返回空数组", async () => {
    const { listWorkOrders } = await importService()
    expect(listWorkOrders({ status: "UNKNOWN" })).toEqual([])
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.47 listWorkOrders() — 按等级筛选", () => {
  beforeEach(() => setTable("work_order", ORDER_ROWS))

  it("筛选 orderLevel=ORANGE 返回 2 条", async () => {
    const { listWorkOrders } = await importService()
    expect(listWorkOrders({ orderLevel: "ORANGE" }).length).toBe(2)
  })

  it("筛选 orderLevel=RED 返回 1 条", async () => {
    const { listWorkOrders } = await importService()
    expect(listWorkOrders({ orderLevel: "RED" }).length).toBe(1)
  })

  it("筛选 alarmLevel=RED 返回 1 条", async () => {
    const { listWorkOrders } = await importService()
    expect(listWorkOrders({ alarmLevel: "RED" }).length).toBe(1)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.47 listWorkOrders() — 按责任单位筛选", () => {
  beforeEach(() => setTable("work_order", ORDER_ROWS))

  it("筛选 receiveOrgId=105 返回 3 条", async () => {
    const { listWorkOrders } = await importService()
    expect(listWorkOrders({ receiveOrgId: 105 }).length).toBe(3)
  })

  it("筛选 receiveOrgId=106 返回 1 条", async () => {
    const { listWorkOrders } = await importService()
    expect(listWorkOrders({ receiveOrgId: 106 }).length).toBe(1)
  })

  it("筛选 dispatchOrgId=105 返回 1 条", async () => {
    const { listWorkOrders } = await importService()
    expect(listWorkOrders({ dispatchOrgId: 105 }).length).toBe(1)
  })

  it("筛选不存在的 receiveOrgId 返回空数组", async () => {
    const { listWorkOrders } = await importService()
    expect(listWorkOrders({ receiveOrgId: 9999 })).toEqual([])
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.47 listWorkOrders() — 按建筑筛选", () => {
  beforeEach(() => setTable("work_order", ORDER_ROWS))

  it("筛选 buildingId=1001 返回 2 条", async () => {
    const { listWorkOrders } = await importService()
    expect(listWorkOrders({ buildingId: 1001 }).length).toBe(2)
  })

  it("筛选不存在的 buildingId 返回空数组", async () => {
    const { listWorkOrders } = await importService()
    expect(listWorkOrders({ buildingId: 9999 })).toEqual([])
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.47 listWorkOrders() — 关键字模糊匹配", () => {
  beforeEach(() => setTable("work_order", ORDER_ROWS))

  it("keyword=WO-20240308 匹配 2 条", async () => {
    const { listWorkOrders } = await importService()
    expect(listWorkOrders({ keyword: "WO-20240308" }).length).toBe(2)
  })

  it("keyword 不区分大小写", async () => {
    const { listWorkOrders } = await importService()
    expect(listWorkOrders({ keyword: "wo-20240307" }).length).toBe(1)
  })

  it("keyword 无匹配时返回空数组", async () => {
    const { listWorkOrders } = await importService()
    expect(listWorkOrders({ keyword: "不存在XYZ" })).toEqual([])
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.47 listWorkOrders() — 关联建筑信息", () => {
  beforeEach(() => setTable("work_order", ORDER_ROWS))

  it("buildingCode 关联 iot_space.space_code（B001）", async () => {
    const { listWorkOrders } = await importService()
    const items = listWorkOrders({ buildingId: 1001 })
    expect(items.every((i) => i.buildingCode === "B001")).toBe(true)
  })

  it("buildingName 为非空字符串", async () => {
    const { listWorkOrders } = await importService()
    const items = listWorkOrders({ buildingId: 1001 })
    expect(items.every((i) => typeof i.buildingName === "string" && i.buildingName.length > 0)).toBe(true)
  })

  it("无对应 iot_space 时 buildingCode=null", async () => {
    setTable("work_order", [{ ...ORDER_ROWS[0], id: 200, building_id: 88888 }])
    const { listWorkOrders } = await importService()
    expect(listWorkOrders({ buildingId: 88888 })[0].buildingCode).toBeNull()
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.47 listWorkOrders() — 关联告警标题", () => {
  beforeEach(() => {
    setTable("alarm_record", ALARM_ROWS)
    setTable("work_order", ORDER_ROWS)
  })

  it("alarmTitle 关联 alarm_record.alarm_title", async () => {
    const { listWorkOrders } = await importService()
    const item = listWorkOrders({ buildingId: 1001, status: "PENDING" })[0]
    expect(item.alarmTitle).toBe("裂缝超限告警")
  })

  it("alarm_id 无对应 alarm_record 时 alarmTitle=null", async () => {
    const { listWorkOrders } = await importService()
    const item = listWorkOrders({ buildingId: 1003 })[0]
    expect(item.alarmTitle).toBeNull()
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.47 listWorkOrders() — 排序", () => {
  beforeEach(() => setTable("work_order", ORDER_ROWS))

  it("默认按 create_time 倒序（最新在前）", async () => {
    const { listWorkOrders } = await importService()
    const items = listWorkOrders()
    for (let i = 0; i < items.length - 1; i++) {
      expect((items[i].createTime ?? "") >= (items[i + 1].createTime ?? "")).toBe(true)
    }
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.47 listWorkOrders() — 多条件组合", () => {
  beforeEach(() => setTable("work_order", ORDER_ROWS))

  it("buildingId=1001 + status=PENDING 返回 1 条", async () => {
    const { listWorkOrders } = await importService()
    expect(listWorkOrders({ buildingId: 1001, status: "PENDING" }).length).toBe(1)
  })

  it("orderLevel=ORANGE + status=FINISHED 返回 1 条", async () => {
    const { listWorkOrders } = await importService()
    expect(listWorkOrders({ orderLevel: "ORANGE", status: "FINISHED" }).length).toBe(1)
  })
})

/**
 * T15.48 — 实现工单详情查询 getWorkOrder
 *
 * 根据 id 查询单个工单完整详情，包括：
 *   - work_order 所有字段（驼峰）
 *   - 关联 iot_space 带出 buildingCode / buildingName
 *   - 关联 alarm_record 带出 alarmTitle / alarmLevel（来源告警）
 *   - 关联 work_order_log（处理流程日志，按 action_time 升序）
 *   - 关联 work_order_disposal（处置记录，按 disposal_time 升序）
 *
 * 测试范围：
 *   - getWorkOrder 可从 workOrderService 导入
 *   - 不存在的 id 返回 null
 *   - 返回 WorkOrderDetail 字段完整
 *   - buildingCode / buildingName 关联 iot_space
 *   - building_id 无对应 iot_space 时相关字段为 null
 *   - alarmTitle 关联 alarm_record
 *   - alarm_id 无对应 alarm_record 时相关字段为 null
 *   - logs 包含 work_order_log 记录，按 action_time 升序
 *   - logs 为空时返回空数组
 *   - disposals 包含 work_order_disposal 记录，按 disposal_time 升序
 *   - disposals 为空时返回空数组
 *   - 多条 log / disposal 正确排序
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
  {
    id: 1, alarm_id: "ALM-001", alarm_title: "裂缝超限告警",
    building_id: 1001, alarm_level: "ORANGE", status: "DISPATCHED",
    trigger_time: "2024-03-08 10:00:00",
  },
]

const ORDER_ROWS = [
  {
    id: 101, order_no: "WO-20240308-0001", order_code: "WO-20240308-0001",
    alarm_id: "ALM-001", building_id: 1001,
    order_type: "CRACK", order_level: "ORANGE", alarm_level: "ORANGE",
    dispatch_type: "AUTO",
    dispatch_org_id: 104, dispatch_user_id: null, dispatch_org: "指挥中心",
    receive_org_id: 105, receive_user_id: null, receive_org: "维修一队",
    receive_role_key: "maintain_worker", assignee_id: 201,
    priority: 2, status: "PROCESSING", current_node: "HANDLE",
    source_id: null, source_type: "ALARM",
    dispatch_time: "2024-03-08 10:10:00", accept_time: "2024-03-08 10:30:00",
    finish_time: null, check_time: null,
    create_time: "2024-03-08 10:10:00", update_time: "2024-03-08 10:30:00",
  },
  {
    id: 102, order_no: "WO-20240307-0001", order_code: "WO-20240307-0001",
    alarm_id: null, building_id: 9999, // 无对应 iot_space
    order_type: "SETTLE", order_level: "YELLOW", alarm_level: "YELLOW",
    dispatch_type: "MANUAL",
    dispatch_org_id: 104, dispatch_user_id: null, dispatch_org: "指挥中心",
    receive_org_id: 105, receive_user_id: null, receive_org: "维修一队",
    receive_role_key: "maintain_worker", assignee_id: 202,
    priority: 3, status: "PENDING", current_node: "DISPATCH",
    source_id: null, source_type: null,
    dispatch_time: "2024-03-07 09:00:00", accept_time: null,
    finish_time: null, check_time: null,
    create_time: "2024-03-07 09:00:00", update_time: "2024-03-07 09:00:00",
  },
]

const LOG_ROWS = [
  {
    id: 1, order_id: 101, node_type: "DISPATCH", node_name: "派单",
    operator_id: 301, operator_name: "张三", operator: "张三",
    action_desc: "系统自动派单", action_time: "2024-03-08 10:10:00",
    detail_json: null, remark: null, create_time: "2024-03-08 10:10:00",
  },
  {
    id: 2, order_id: 101, node_type: "ACCEPT", node_name: "接单",
    operator_id: 201, operator_name: "李四", operator: "李四",
    action_desc: "维修人员接单", action_time: "2024-03-08 10:30:00",
    detail_json: null, remark: null, create_time: "2024-03-08 10:30:00",
  },
  {
    id: 3, order_id: 101, node_type: "HANDLE", node_name: "处置",
    operator_id: 201, operator_name: "李四", operator: "李四",
    action_desc: "现场勘查中", action_time: "2024-03-08 11:00:00",
    detail_json: null, remark: null, create_time: "2024-03-08 11:00:00",
  },
]

const DISPOSAL_ROWS = [
  {
    id: 1, order_id: 101, user_id: 201,
    gps_location: "31.2304,121.4737", address_desc: "南侧外墙",
    image_urls: '["img1.jpg","img2.jpg"]', video_url: null,
    disposal_desc: "已对裂缝进行临时封堵处理",
    disposal_time: "2024-03-08 11:30:00", create_time: "2024-03-08 11:30:00",
  },
]

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.48 getWorkOrder() — 导出", () => {
  it("getWorkOrder 可从 workOrderService 导入", async () => {
    const { getWorkOrder } = await importService()
    expect(typeof getWorkOrder).toBe("function")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.48 getWorkOrder() — 不存在", () => {
  beforeEach(() => setTable("work_order", ORDER_ROWS))

  it("id 不存在时返回 null", async () => {
    const { getWorkOrder } = await importService()
    const result = getWorkOrder(9999)
    expect(result).toBeNull()
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.48 getWorkOrder() — 基础字段", () => {
  beforeEach(() => {
    setTable("alarm_record", ALARM_ROWS)
    setTable("work_order", ORDER_ROWS)
    setTable("work_order_log", LOG_ROWS)
    setTable("work_order_disposal", DISPOSAL_ROWS)
  })

  it("返回非 null", async () => {
    const { getWorkOrder } = await importService()
    expect(getWorkOrder(101)).not.toBeNull()
  })

  it("返回 id 字段", async () => {
    const { getWorkOrder } = await importService()
    expect(getWorkOrder(101)!.id).toBe(101)
  })

  it("返回 orderNo 字段", async () => {
    const { getWorkOrder } = await importService()
    expect(getWorkOrder(101)!.orderNo).toBe("WO-20240308-0001")
  })

  it("返回 orderCode 字段", async () => {
    const { getWorkOrder } = await importService()
    expect(getWorkOrder(101)!.orderCode).toBe("WO-20240308-0001")
  })

  it("返回 alarmId 字段", async () => {
    const { getWorkOrder } = await importService()
    expect(getWorkOrder(101)!.alarmId).toBe("ALM-001")
  })

  it("返回 orderType 字段", async () => {
    const { getWorkOrder } = await importService()
    expect(getWorkOrder(101)!.orderType).toBe("CRACK")
  })

  it("返回 orderLevel 字段", async () => {
    const { getWorkOrder } = await importService()
    expect(getWorkOrder(101)!.orderLevel).toBe("ORANGE")
  })

  it("返回 alarmLevel 字段", async () => {
    const { getWorkOrder } = await importService()
    expect(getWorkOrder(101)!.alarmLevel).toBe("ORANGE")
  })

  it("返回 dispatchType 字段", async () => {
    const { getWorkOrder } = await importService()
    expect(getWorkOrder(101)!.dispatchType).toBe("AUTO")
  })

  it("返回 dispatchOrg 字段", async () => {
    const { getWorkOrder } = await importService()
    expect(getWorkOrder(101)!.dispatchOrg).toBe("指挥中心")
  })

  it("返回 receiveOrg 字段", async () => {
    const { getWorkOrder } = await importService()
    expect(getWorkOrder(101)!.receiveOrg).toBe("维修一队")
  })

  it("返回 assigneeId 字段", async () => {
    const { getWorkOrder } = await importService()
    expect(getWorkOrder(101)!.assigneeId).toBe(201)
  })

  it("返回 priority 字段", async () => {
    const { getWorkOrder } = await importService()
    expect(getWorkOrder(101)!.priority).toBe(2)
  })

  it("返回 status 字段", async () => {
    const { getWorkOrder } = await importService()
    expect(getWorkOrder(101)!.status).toBe("PROCESSING")
  })

  it("返回 currentNode 字段", async () => {
    const { getWorkOrder } = await importService()
    expect(getWorkOrder(101)!.currentNode).toBe("HANDLE")
  })

  it("返回 dispatchTime 字段", async () => {
    const { getWorkOrder } = await importService()
    expect(getWorkOrder(101)!.dispatchTime).toBe("2024-03-08 10:10:00")
  })

  it("返回 acceptTime 字段", async () => {
    const { getWorkOrder } = await importService()
    expect(getWorkOrder(101)!.acceptTime).toBe("2024-03-08 10:30:00")
  })

  it("finishTime 为 null 时返回 null", async () => {
    const { getWorkOrder } = await importService()
    expect(getWorkOrder(101)!.finishTime).toBeNull()
  })

  it("返回 createTime 字段", async () => {
    const { getWorkOrder } = await importService()
    expect(getWorkOrder(101)!.createTime).toBe("2024-03-08 10:10:00")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.48 getWorkOrder() — 关联建筑信息", () => {
  beforeEach(() => {
    setTable("work_order", ORDER_ROWS)
    setTable("work_order_log", [])
    setTable("work_order_disposal", [])
  })

  it("buildingCode 关联 iot_space.space_code", async () => {
    const { getWorkOrder } = await importService()
    expect(getWorkOrder(101)!.buildingCode).toBe("B001")
  })

  it("buildingName 为非空字符串", async () => {
    const { getWorkOrder } = await importService()
    expect(typeof getWorkOrder(101)!.buildingName).toBe("string")
    expect((getWorkOrder(101)!.buildingName ?? "").length).toBeGreaterThan(0)
  })

  it("building_id 无对应 iot_space 时 buildingCode=null", async () => {
    const { getWorkOrder } = await importService()
    expect(getWorkOrder(102)!.buildingCode).toBeNull()
  })

  it("building_id 无对应 iot_space 时 buildingName=null", async () => {
    const { getWorkOrder } = await importService()
    expect(getWorkOrder(102)!.buildingName).toBeNull()
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.48 getWorkOrder() — 关联告警标题", () => {
  beforeEach(() => {
    setTable("alarm_record", ALARM_ROWS)
    setTable("work_order", ORDER_ROWS)
    setTable("work_order_log", [])
    setTable("work_order_disposal", [])
  })

  it("alarmTitle 关联 alarm_record.alarm_title", async () => {
    const { getWorkOrder } = await importService()
    expect(getWorkOrder(101)!.alarmTitle).toBe("裂缝超限告警")
  })

  it("alarm_id 为 null 时 alarmTitle=null", async () => {
    const { getWorkOrder } = await importService()
    expect(getWorkOrder(102)!.alarmTitle).toBeNull()
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.48 getWorkOrder() — 流程日志 logs", () => {
  beforeEach(() => {
    setTable("alarm_record", ALARM_ROWS)
    setTable("work_order", ORDER_ROWS)
    setTable("work_order_disposal", DISPOSAL_ROWS)
  })

  it("logs 字段为数组", async () => {
    setTable("work_order_log", LOG_ROWS)
    const { getWorkOrder } = await importService()
    expect(Array.isArray(getWorkOrder(101)!.logs)).toBe(true)
  })

  it("logs 包含 3 条记录", async () => {
    setTable("work_order_log", LOG_ROWS)
    const { getWorkOrder } = await importService()
    expect(getWorkOrder(101)!.logs.length).toBe(3)
  })

  it("logs 每条包含 nodeType 字段", async () => {
    setTable("work_order_log", LOG_ROWS)
    const { getWorkOrder } = await importService()
    const logs = getWorkOrder(101)!.logs
    expect(logs[0].nodeType).toBeDefined()
  })

  it("logs 每条包含 actionDesc 字段", async () => {
    setTable("work_order_log", LOG_ROWS)
    const { getWorkOrder } = await importService()
    const logs = getWorkOrder(101)!.logs
    expect(logs[0].actionDesc).toBeDefined()
  })

  it("logs 按 action_time 升序排列（最早在前）", async () => {
    setTable("work_order_log", [LOG_ROWS[2], LOG_ROWS[0], LOG_ROWS[1]]) // 乱序写入
    const { getWorkOrder } = await importService()
    const logs = getWorkOrder(101)!.logs
    expect(logs[0].actionTime).toBe("2024-03-08 10:10:00")
    expect(logs[1].actionTime).toBe("2024-03-08 10:30:00")
    expect(logs[2].actionTime).toBe("2024-03-08 11:00:00")
  })

  it("无 log 记录时 logs 返回空数组", async () => {
    setTable("work_order_log", [])
    const { getWorkOrder } = await importService()
    expect(getWorkOrder(101)!.logs).toEqual([])
  })

  it("只返回当前工单的 log（过滤其他工单的 log）", async () => {
    const otherLog = { ...LOG_ROWS[0], id: 99, order_id: 102 }
    setTable("work_order_log", [otherLog, LOG_ROWS[0]])
    const { getWorkOrder } = await importService()
    expect(getWorkOrder(101)!.logs.length).toBe(1)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.48 getWorkOrder() — 处置记录 disposals", () => {
  beforeEach(() => {
    setTable("alarm_record", ALARM_ROWS)
    setTable("work_order", ORDER_ROWS)
    setTable("work_order_log", LOG_ROWS)
  })

  it("disposals 字段为数组", async () => {
    setTable("work_order_disposal", DISPOSAL_ROWS)
    const { getWorkOrder } = await importService()
    expect(Array.isArray(getWorkOrder(101)!.disposals)).toBe(true)
  })

  it("disposals 包含 1 条记录", async () => {
    setTable("work_order_disposal", DISPOSAL_ROWS)
    const { getWorkOrder } = await importService()
    expect(getWorkOrder(101)!.disposals.length).toBe(1)
  })

  it("disposal 包含 disposalDesc 字段", async () => {
    setTable("work_order_disposal", DISPOSAL_ROWS)
    const { getWorkOrder } = await importService()
    expect(getWorkOrder(101)!.disposals[0].disposalDesc).toBe("已对裂缝进行临时封堵处理")
  })

  it("disposal 包含 imageUrls 字段", async () => {
    setTable("work_order_disposal", DISPOSAL_ROWS)
    const { getWorkOrder } = await importService()
    expect(getWorkOrder(101)!.disposals[0].imageUrls).toBeDefined()
  })

  it("disposal 包含 disposalTime 字段", async () => {
    setTable("work_order_disposal", DISPOSAL_ROWS)
    const { getWorkOrder } = await importService()
    expect(getWorkOrder(101)!.disposals[0].disposalTime).toBe("2024-03-08 11:30:00")
  })

  it("无 disposal 记录时 disposals 返回空数组", async () => {
    setTable("work_order_disposal", [])
    const { getWorkOrder } = await importService()
    expect(getWorkOrder(101)!.disposals).toEqual([])
  })

  it("只返回当前工单的 disposal（过滤其他工单的记录）", async () => {
    const otherDisposal = { ...DISPOSAL_ROWS[0], id: 99, order_id: 102 }
    setTable("work_order_disposal", [otherDisposal, DISPOSAL_ROWS[0]])
    const { getWorkOrder } = await importService()
    expect(getWorkOrder(101)!.disposals.length).toBe(1)
  })

  it("多条 disposal 按 disposal_time 升序排列", async () => {
    const d2 = {
      id: 2, order_id: 101, user_id: 201,
      gps_location: null, address_desc: null,
      image_urls: null, video_url: null,
      disposal_desc: "第二次记录",
      disposal_time: "2024-03-08 14:00:00", create_time: "2024-03-08 14:00:00",
    }
    setTable("work_order_disposal", [d2, DISPOSAL_ROWS[0]]) // 乱序写入
    const { getWorkOrder } = await importService()
    const disposals = getWorkOrder(101)!.disposals
    expect(disposals[0].disposalTime).toBe("2024-03-08 11:30:00")
    expect(disposals[1].disposalTime).toBe("2024-03-08 14:00:00")
  })
})

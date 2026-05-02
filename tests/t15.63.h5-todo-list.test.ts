/**
 * T15.63 — 实现 H5 待办选择器 selectH5TodoList
 *
 * H5 端只显示当前外勤可处理的工单（待接单 + 处理中），
 * 并附上建筑名、告警标题，按紧急程度排序。
 *
 * 函数签名：
 *   selectH5TodoList(query?: H5TodoQuery): H5TodoItem[]
 *
 * query 参数：
 *   assigneeId?  — 外勤人员 id（筛选 work_order.assignee_id）
 *   receiveOrgId? — 接收机构 id（筛选 work_order.receive_org_id）
 *   limit?       — 最多返回条数，默认 50
 *
 * 逻辑：
 *   - 只取 status=PENDING / PROCESSING 的工单
 *   - 关联 iot_space(building_id) 获取 buildingName
 *   - 关联 alarm_record(alarm_id) 获取 alarmTitle
 *   - 按 order_level 降序（URGENT > HIGH > NORMAL），同级按 dispatch_time 升序（最早的最优先）
 *   - 应用 query 过滤
 *
 * 返回字段：
 *   id, orderNo, status, orderLevel, alarmLevel, buildingId, buildingName,
 *   alarmId, alarmTitle, dispatchTime, currentNode
 *
 * 测试范围（22 条）：
 *   - 导出检查
 *   - 空数据返回空数组
 *   - 只返回 PENDING + PROCESSING
 *   - FINISHED 不返回
 *   - CHECKING 不返回
 *   - 含字段 id / orderNo / status / orderLevel / alarmLevel / buildingId / buildingName / alarmId / alarmTitle / dispatchTime / currentNode
 *   - buildingName 来自 iot_space
 *   - alarmTitle 来自 alarm_record
 *   - 无匹配 building 时 buildingName=null
 *   - 无匹配 alarm 时 alarmTitle=null
 *   - URGENT 排在 NORMAL 前
 *   - 同级按 dispatchTime 升序
 *   - assigneeId 过滤
 *   - limit 截断
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
  setTable("work_order",   [])
  setTable("iot_space",    [])
  setTable("alarm_record", [])
})

afterEach(() => {
  delete (globalThis as any).localStorage
})

async function importService() {
  return import("../src/services/screenKpiService")
}

const SPACE_A = { id: 1001, space_code: "B001", name: "建筑A", type: "2" }

const ALARM_1 = { id: 1, alarm_id: "ALM-001", alarm_title: "裂缝超限", status: "DISPATCHED" }

const ORDER_PENDING_URGENT = {
  id: 1, order_no: "WO-001", status: "PENDING",
  order_level: "URGENT", alarm_level: "RED",
  building_id: 1001, alarm_id: "ALM-001",
  assignee_id: 201, receive_org_id: 10,
  dispatch_time: "2024-03-08 10:00:00", current_node: "DISPATCH",
}
const ORDER_PROCESSING_NORMAL = {
  id: 2, order_no: "WO-002", status: "PROCESSING",
  order_level: "NORMAL", alarm_level: "YELLOW",
  building_id: 1001, alarm_id: null,
  assignee_id: 201, receive_org_id: 10,
  dispatch_time: "2024-03-08 09:00:00", current_node: "HANDLE",
}
const ORDER_PENDING_NORMAL_OLDER = {
  id: 3, order_no: "WO-003", status: "PENDING",
  order_level: "NORMAL", alarm_level: "ORANGE",
  building_id: 1001, alarm_id: null,
  assignee_id: 202, receive_org_id: 20,
  dispatch_time: "2024-03-08 08:00:00", current_node: "DISPATCH",
}
const ORDER_FINISHED = {
  id: 4, order_no: "WO-004", status: "FINISHED",
  order_level: "NORMAL", alarm_level: "YELLOW",
  building_id: 1001, alarm_id: null,
  assignee_id: 201, receive_org_id: 10,
  dispatch_time: "2024-03-07 08:00:00", current_node: "DONE",
}
const ORDER_CHECKING = {
  id: 5, order_no: "WO-005", status: "CHECKING",
  order_level: "HIGH", alarm_level: "ORANGE",
  building_id: 1001, alarm_id: null,
  assignee_id: 201, receive_org_id: 10,
  dispatch_time: "2024-03-08 07:00:00", current_node: "CHECK",
}

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.63 selectH5TodoList() — 导出", () => {
  it("selectH5TodoList 可从 screenKpiService 导入", async () => {
    const { selectH5TodoList } = await importService()
    expect(typeof selectH5TodoList).toBe("function")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.63 selectH5TodoList() — 空数据", () => {
  it("无工单时返回空数组", async () => {
    const { selectH5TodoList } = await importService()
    expect(selectH5TodoList()).toEqual([])
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.63 selectH5TodoList() — 状态过滤", () => {
  beforeEach(() => {
    setTable("work_order", [
      ORDER_PENDING_URGENT, ORDER_PROCESSING_NORMAL,
      ORDER_FINISHED, ORDER_CHECKING,
    ])
  })

  it("只返回 PENDING + PROCESSING（2 条）", async () => {
    const { selectH5TodoList } = await importService()
    expect(selectH5TodoList().length).toBe(2)
  })

  it("FINISHED 不返回", async () => {
    const { selectH5TodoList } = await importService()
    expect(selectH5TodoList().every((r: any) => r.status !== "FINISHED")).toBe(true)
  })

  it("CHECKING 不返回", async () => {
    const { selectH5TodoList } = await importService()
    expect(selectH5TodoList().every((r: any) => r.status !== "CHECKING")).toBe(true)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.63 selectH5TodoList() — 字段", () => {
  beforeEach(() => {
    setTable("iot_space",    [SPACE_A])
    setTable("alarm_record", [ALARM_1])
    setTable("work_order",   [ORDER_PENDING_URGENT])
  })

  it("含字段 id", async () => {
    const { selectH5TodoList } = await importService()
    expect(selectH5TodoList()[0].id).toBe(1)
  })

  it("含字段 orderNo", async () => {
    const { selectH5TodoList } = await importService()
    expect(selectH5TodoList()[0].orderNo).toBe("WO-001")
  })

  it("含字段 status", async () => {
    const { selectH5TodoList } = await importService()
    expect(selectH5TodoList()[0].status).toBe("PENDING")
  })

  it("含字段 orderLevel", async () => {
    const { selectH5TodoList } = await importService()
    expect(selectH5TodoList()[0].orderLevel).toBe("URGENT")
  })

  it("含字段 currentNode", async () => {
    const { selectH5TodoList } = await importService()
    expect(selectH5TodoList()[0].currentNode).toBe("DISPATCH")
  })

  it("buildingName 来自 iot_space.name", async () => {
    const { selectH5TodoList } = await importService()
    expect(selectH5TodoList()[0].buildingName).toBe("建筑A")
  })

  it("alarmTitle 来自 alarm_record.alarm_title", async () => {
    const { selectH5TodoList } = await importService()
    expect(selectH5TodoList()[0].alarmTitle).toBe("裂缝超限")
  })

  it("无匹配 building 时 buildingName=null", async () => {
    setTable("iot_space", [])
    const { selectH5TodoList } = await importService()
    expect(selectH5TodoList()[0].buildingName).toBeNull()
  })

  it("无匹配 alarm 时 alarmTitle=null", async () => {
    setTable("work_order",   [ORDER_PROCESSING_NORMAL])
    setTable("alarm_record", [])
    const { selectH5TodoList } = await importService()
    expect(selectH5TodoList()[0].alarmTitle).toBeNull()
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.63 selectH5TodoList() — 排序", () => {
  it("URGENT 排在 NORMAL 前", async () => {
    setTable("work_order", [ORDER_PROCESSING_NORMAL, ORDER_PENDING_URGENT])
    const { selectH5TodoList } = await importService()
    expect(selectH5TodoList()[0].orderLevel).toBe("URGENT")
  })

  it("同级 NORMAL 按 dispatchTime 升序（较早在前）", async () => {
    setTable("work_order", [ORDER_PROCESSING_NORMAL, ORDER_PENDING_NORMAL_OLDER])
    const { selectH5TodoList } = await importService()
    // OLDER dispatch 08:00, NORMAL dispatch 09:00 → OLDER 排前
    expect(selectH5TodoList()[0].dispatchTime).toBe("2024-03-08 08:00:00")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.63 selectH5TodoList() — query 过滤", () => {
  beforeEach(() => {
    setTable("work_order", [ORDER_PENDING_URGENT, ORDER_PROCESSING_NORMAL, ORDER_PENDING_NORMAL_OLDER])
  })

  it("assigneeId=201 过滤（2 条）", async () => {
    const { selectH5TodoList } = await importService()
    expect(selectH5TodoList({ assigneeId: 201 }).length).toBe(2)
  })

  it("limit=1 截断", async () => {
    const { selectH5TodoList } = await importService()
    expect(selectH5TodoList({ limit: 1 }).length).toBe(1)
  })
})

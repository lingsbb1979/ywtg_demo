/**
 * T15.35 — 实现建筑详情查询 getBuilding
 *
 * 可查看单栋建筑的：
 *   - 建筑基础信息（来自 iot_space）
 *   - 责任单位（来自 sys_organization，通过区域 → 住建局静态映射）
 *   - 最新风险（来自 space_analysis_archive，最新一条）
 *   - 关联工单（来自 work_order，building_id 匹配）
 *   - 数字档案状态（来自 digital_archive）
 *
 * 测试范围：
 *   - getBuilding 可从 buildingService 导入
 *   - 未知 id 返回 null
 *   - 已知 id=1001 返回 B001 基础信息字段
 *   - responsibleOrg：无 org 数据时为 null；注入后返回 {id, orgName}
 *   - 区域→责任单位静态映射：向阳区(901)→org 104、前进区(902)→org 105、东风区(903)→org 106
 *   - latestRisk：无分析记录时为 null；注入后返回最新一条的 riskLevel/valueNum/calcTime
 *   - workOrders：无工单时为 []；注入后返回属于该建筑的工单摘要
 *   - workOrders 只包含该建筑的工单，不含其他建筑的
 *   - archiveStatus / archiveId：无档案时为 null；注入后正确返回
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { setTable } from "../src/services/sqliteMirrorRepository"
import { seedBuildings } from "../src/mock/seeds/seedBuildings"
import { seedSpaceRelation } from "../src/mock/seeds/seedSpaceRelation"
import { seedOrganization } from "../src/mock/seeds/seedOrganization"

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
  seedSpaceRelation()
  // 不在 beforeEach 中注入 org/analysis/workorder，由各测试按需注入
})

afterEach(() => {
  delete (globalThis as any).localStorage
})

async function importService() {
  return import("../src/services/buildingService")
}

// ── 注入辅助 ──────────────────────────────────────────────────────────────────

function injectOrg() {
  seedOrganization()
}

function injectAnalysisArchive(rows: object[]) {
  setTable("space_analysis_archive", rows)
}

function injectWorkOrders(rows: object[]) {
  setTable("work_order", rows)
}

/** 最小工单行，building_id 可自定义 */
function makeWorkOrder(id: number, buildingId: number, status = "PENDING") {
  return {
    id,
    order_no:        `WO-2024-${String(id).padStart(4, "0")}`,
    order_code:      `WO${id}`,
    alarm_id:        null,
    building_id:     buildingId,
    order_type:      "REPAIR",
    order_level:     "ORANGE",
    alarm_level:     "H",
    dispatch_type:   "AUTO",
    dispatch_org_id: 101,
    dispatch_user_id:1,
    dispatch_org:    "住建局",
    receive_org_id:  104,
    receive_user_id: 2,
    receive_org:     "向阳区住建局",
    receive_role_key:"STREET_WORKER",
    assignee_id:     2,
    priority:        2,
    status,
    current_node:    "ACCEPT",
    source_id:       null,
    source_type:     "ALARM",
    dispatch_time:   "2024-03-07 09:00:00",
    accept_time:     null,
    finish_time:     null,
    check_time:      null,
    create_time:     "2024-03-07 09:00:00",
    update_time:     "2024-03-07 09:00:00",
  }
}

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.35 getBuilding() — 导出", () => {
  it("getBuilding 可从 buildingService 导入", async () => {
    const { getBuilding } = await importService()
    expect(typeof getBuilding).toBe("function")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.35 getBuilding() — 基础查询", () => {
  it("未知 id 返回 null", async () => {
    const { getBuilding } = await importService()
    expect(getBuilding(9999)).toBeNull()
  })

  it("id=1001 返回非 null 对象", async () => {
    const { getBuilding } = await importService()
    expect(getBuilding(1001)).not.toBeNull()
  })

  it("返回正确的 id 和 spaceCode", async () => {
    const { getBuilding } = await importService()
    const detail = getBuilding(1001)!
    expect(detail.id).toBe(1001)
    expect(detail.spaceCode).toBe("B001")
  })

  it("返回正确的 name", async () => {
    const { getBuilding } = await importService()
    const detail = getBuilding(1001)!
    expect(detail.name).toBe("向阳路1号历史建筑")
  })

  it("返回 latitude / longitude", async () => {
    const { getBuilding } = await importService()
    const detail = getBuilding(1001)!
    expect(typeof detail.latitude).toBe("number")
    expect(typeof detail.longitude).toBe("number")
  })

  it("返回 parentId（向阳区=901）", async () => {
    const { getBuilding } = await importService()
    const detail = getBuilding(1001)!
    expect(detail.parentId).toBe(901)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.35 getBuilding() — 责任单位", () => {
  it("无 sys_organization 数据时 responsibleOrg 为 null", async () => {
    const { getBuilding } = await importService()
    const detail = getBuilding(1001)!
    expect(detail.responsibleOrg).toBeNull()
  })

  it("注入 org 后 B001（向阳区）responsibleOrg.id 为 104", async () => {
    injectOrg()
    const { getBuilding } = await importService()
    const detail = getBuilding(1001)!
    expect(detail.responsibleOrg).not.toBeNull()
    expect(detail.responsibleOrg!.id).toBe(104)
  })

  it("responsibleOrg.orgName 包含 '向阳区'", async () => {
    injectOrg()
    const { getBuilding } = await importService()
    const detail = getBuilding(1001)!
    expect(detail.responsibleOrg!.orgName).toContain("向阳区")
  })

  it("B009（前进区）responsibleOrg.id 为 105", async () => {
    injectOrg()
    const { getBuilding } = await importService()
    const detail = getBuilding(1009)!
    expect(detail.responsibleOrg!.id).toBe(105)
  })

  it("B017（东风区）responsibleOrg.id 为 106", async () => {
    injectOrg()
    const { getBuilding } = await importService()
    const detail = getBuilding(1017)!
    expect(detail.responsibleOrg!.id).toBe(106)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.35 getBuilding() — 最新风险", () => {
  it("无分析记录时 latestRisk 为 null", async () => {
    const { getBuilding } = await importService()
    const detail = getBuilding(1001)!
    expect(detail.latestRisk).toBeNull()
  })

  it("注入单条 ORANGE 记录后 latestRisk.riskLevel 为 'ORANGE'", async () => {
    injectAnalysisArchive([{
      id: 1, space_id: 1001, metric_id: 1,
      calc_time: "2024-03-07 08:00:00", value_num: 2.8,
      risk_level: "ORANGE", status_code: "H",
      source_data_ids: "[10001]", create_time: "2024-03-07 08:00:00",
    }])
    const { getBuilding } = await importService()
    const detail = getBuilding(1001)!
    expect(detail.latestRisk!.riskLevel).toBe("ORANGE")
  })

  it("latestRisk.valueNum 正确", async () => {
    injectAnalysisArchive([{
      id: 1, space_id: 1001, metric_id: 1,
      calc_time: "2024-03-07 08:00:00", value_num: 2.8,
      risk_level: "ORANGE", status_code: "H",
      source_data_ids: "[10001]", create_time: "2024-03-07 08:00:00",
    }])
    const { getBuilding } = await importService()
    const detail = getBuilding(1001)!
    expect(detail.latestRisk!.valueNum).toBe(2.8)
  })

  it("多条记录取最新 calc_time 的那条（RED 应覆盖旧 ORANGE）", async () => {
    injectAnalysisArchive([
      {
        id: 1, space_id: 1001, metric_id: 1,
        calc_time: "2024-03-06 08:00:00", value_num: 2.8,
        risk_level: "ORANGE", status_code: "H",
        source_data_ids: "[10001]", create_time: "2024-03-06 08:00:00",
      },
      {
        id: 2, space_id: 1001, metric_id: 1,
        calc_time: "2024-03-07 09:00:00", value_num: 5.5,
        risk_level: "RED", status_code: "HH",
        source_data_ids: "[10001]", create_time: "2024-03-07 09:00:00",
      },
    ])
    const { getBuilding } = await importService()
    const detail = getBuilding(1001)!
    expect(detail.latestRisk!.riskLevel).toBe("RED")
  })

  it("latestRisk.calcTime 正确返回", async () => {
    injectAnalysisArchive([{
      id: 1, space_id: 1001, metric_id: 1,
      calc_time: "2024-03-07 08:00:00", value_num: 2.8,
      risk_level: "ORANGE", status_code: "H",
      source_data_ids: "[10001]", create_time: "2024-03-07 08:00:00",
    }])
    const { getBuilding } = await importService()
    const detail = getBuilding(1001)!
    expect(detail.latestRisk!.calcTime).toBe("2024-03-07 08:00:00")
  })

  it("其他建筑的分析记录不影响 B001 的 latestRisk", async () => {
    injectAnalysisArchive([{
      id: 1, space_id: 1002, metric_id: 1,  // B002 的记录
      calc_time: "2024-03-07 08:00:00", value_num: 3.5,
      risk_level: "RED", status_code: "HH",
      source_data_ids: "[10005]", create_time: "2024-03-07 08:00:00",
    }])
    const { getBuilding } = await importService()
    const detail = getBuilding(1001)!
    expect(detail.latestRisk).toBeNull()
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.35 getBuilding() — 关联工单", () => {
  it("无工单时 workOrders 为空数组", async () => {
    const { getBuilding } = await importService()
    const detail = getBuilding(1001)!
    expect(detail.workOrders).toEqual([])
  })

  it("注入 B001 工单后 workOrders 长度为 1", async () => {
    injectWorkOrders([makeWorkOrder(1, 1001)])
    const { getBuilding } = await importService()
    const detail = getBuilding(1001)!
    expect(detail.workOrders).toHaveLength(1)
  })

  it("工单摘要含 id / orderNo / status 字段", async () => {
    injectWorkOrders([makeWorkOrder(1, 1001, "PENDING")])
    const { getBuilding } = await importService()
    const detail = getBuilding(1001)!
    const wo = detail.workOrders[0]
    expect(typeof wo.id).toBe("number")
    expect(typeof wo.orderNo).toBe("string")
    expect(typeof wo.status).toBe("string")
  })

  it("工单摘要含 orderLevel 字段", async () => {
    injectWorkOrders([makeWorkOrder(1, 1001)])
    const { getBuilding } = await importService()
    const detail = getBuilding(1001)!
    expect(detail.workOrders[0].orderLevel).toBe("ORANGE")
  })

  it("多条工单只返回该建筑的工单（building_id=1001）", async () => {
    injectWorkOrders([
      makeWorkOrder(1, 1001),   // B001 的工单
      makeWorkOrder(2, 1002),   // B002 的工单
      makeWorkOrder(3, 1001),   // B001 的第 2 条工单
    ])
    const { getBuilding } = await importService()
    const detail = getBuilding(1001)!
    expect(detail.workOrders).toHaveLength(2)
    expect(detail.workOrders.every(w => w.buildingId === 1001)).toBe(true)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.35 getBuilding() — 数字档案", () => {
  it("无档案时 archiveStatus 为 null", async () => {
    setTable("digital_archive", [])
    const { getBuilding } = await importService()
    const detail = getBuilding(1001)!
    expect(detail.archiveStatus).toBeNull()
  })

  it("无档案时 archiveId 为 null", async () => {
    setTable("digital_archive", [])
    const { getBuilding } = await importService()
    const detail = getBuilding(1001)!
    expect(detail.archiveId).toBeNull()
  })

  it("seedSpaceRelation 已写入档案，archiveStatus 为 10（安全）", async () => {
    const { getBuilding } = await importService()
    const detail = getBuilding(1001)!
    expect(detail.archiveStatus).toBe(10)
  })

  it("seedSpaceRelation 已写入档案，archiveId 为 2001", async () => {
    const { getBuilding } = await importService()
    const detail = getBuilding(1001)!
    expect(detail.archiveId).toBe(2001)
  })

  it("注入 status=40 后 archiveStatus 为 40（危险）", async () => {
    setTable("digital_archive", [{
      id: 9001, building_id: 1001,
      base_info_version: "1.0", last_audit_time: null, status: 40,
    }])
    const { getBuilding } = await importService()
    const detail = getBuilding(1001)!
    expect(detail.archiveStatus).toBe(40)
  })
})

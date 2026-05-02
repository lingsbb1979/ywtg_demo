/**
 * T15.56 — 实现闭环归档 archiveWorkOrder
 *
 * 工单销号（FINISHED）后：
 *   1. 按 building_id 查找 digital_archive；不存在则新建
 *   2. 更新 digital_archive.last_audit_time 为 work_order.check_time
 *   3. 追加 archive_relation（source_type=2 工单, relation_type=2 处置记录）
 *
 * 业务规则：
 *   - 只有 status=FINISHED 的工单可归档
 *   - 非 FINISHED 返回 { ok: false, error }
 *   - id 不存在返回 { ok: false, error }
 *   - building_id 无对应 digital_archive 时自动创建（status=10 安全）
 *   - 同一 building_id 已有档案时复用（更新 last_audit_time）
 *   - 每次归档追加 1 条 archive_relation
 *
 * 测试范围（22 条）：
 *   - 导出检查
 *   - 正常归档：ok=true, archiveId 数字
 *   - 新建档案：digital_archive +1 条, building_id, status=10, last_audit_time
 *   - archive_relation 追加：+1 条, archive_id, source_type=2, source_id=orderId, relation_type=2
 *   - 已有档案时复用（count 不增加，last_audit_time 更新）
 *   - 已有档案时 archive_relation 仍追加
 *   - 异常：非 FINISHED 返回 ok=false, 不写表
 *   - 异常：id 不存在返回 ok=false
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { getTable, setTable } from "../src/services/sqliteMirrorRepository"

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
  setTable("digital_archive",  [])
  setTable("archive_relation", [])
})

afterEach(() => {
  delete (globalThis as any).localStorage
})

async function importService() {
  return import("../src/services/workOrderService")
}

const FINISHED_ORDER = {
  id: 101, order_no: "WO-20240308-0001",
  building_id: 1001, alarm_id: "ALM-001",
  alarm_level: "ORANGE", order_level: "NORMAL",
  status: "FINISHED", current_node: "DONE",
  check_time:  "2024-03-08 15:00:00",
  create_time: "2024-03-08 10:00:00",
  update_time: "2024-03-08 15:00:00",
}

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.56 archiveWorkOrder() — 导出", () => {
  it("archiveWorkOrder 可从 workOrderService 导入", async () => {
    const { archiveWorkOrder } = await importService()
    expect(typeof archiveWorkOrder).toBe("function")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.56 archiveWorkOrder() — 正常归档（无已有档案）", () => {
  beforeEach(() => setTable("work_order", [FINISHED_ORDER]))

  it("返回 ok=true", async () => {
    const { archiveWorkOrder } = await importService()
    expect(archiveWorkOrder(101).ok).toBe(true)
  })

  it("返回 archiveId（数字）", async () => {
    const { archiveWorkOrder } = await importService()
    expect(typeof archiveWorkOrder(101).archiveId).toBe("number")
  })

  it("digital_archive 新增 1 条", async () => {
    const { archiveWorkOrder } = await importService()
    archiveWorkOrder(101)
    expect(getTable("digital_archive").length).toBe(1)
  })

  it("digital_archive.building_id=1001", async () => {
    const { archiveWorkOrder } = await importService()
    archiveWorkOrder(101)
    const rows = getTable<{ building_id: number }>("digital_archive")
    expect(rows[0].building_id).toBe(1001)
  })

  it("digital_archive.status=10（安全）", async () => {
    const { archiveWorkOrder } = await importService()
    archiveWorkOrder(101)
    const rows = getTable<{ status: number }>("digital_archive")
    expect(rows[0].status).toBe(10)
  })

  it("digital_archive.last_audit_time=工单 check_time", async () => {
    const { archiveWorkOrder } = await importService()
    archiveWorkOrder(101)
    const rows = getTable<{ last_audit_time: string }>("digital_archive")
    expect(rows[0].last_audit_time).toBe("2024-03-08 15:00:00")
  })

  it("archive_relation 追加 1 条", async () => {
    const { archiveWorkOrder } = await importService()
    archiveWorkOrder(101)
    expect(getTable("archive_relation").length).toBe(1)
  })

  it("archive_relation.source_type=2（工单）", async () => {
    const { archiveWorkOrder } = await importService()
    archiveWorkOrder(101)
    const rows = getTable<{ source_type: number }>("archive_relation")
    expect(rows[0].source_type).toBe(2)
  })

  it("archive_relation.source_id=101", async () => {
    const { archiveWorkOrder } = await importService()
    archiveWorkOrder(101)
    const rows = getTable<{ source_id: number }>("archive_relation")
    expect(rows[0].source_id).toBe(101)
  })

  it("archive_relation.relation_type=2（处置记录）", async () => {
    const { archiveWorkOrder } = await importService()
    archiveWorkOrder(101)
    const rows = getTable<{ relation_type: number }>("archive_relation")
    expect(rows[0].relation_type).toBe(2)
  })

  it("archive_relation.archive_id 等于新建档案的 id", async () => {
    const { archiveWorkOrder } = await importService()
    const result = archiveWorkOrder(101)
    const rels = getTable<{ archive_id: number }>("archive_relation")
    expect(rels[0].archive_id).toBe(result.archiveId)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.56 archiveWorkOrder() — 复用已有档案", () => {
  const EXISTING_ARCHIVE = {
    id: 5, building_id: 1001, base_info_version: "20240101_120000",
    last_audit_time: "2024-01-01 12:00:00", status: 10,
  }

  beforeEach(() => {
    setTable("work_order", [FINISHED_ORDER])
    setTable("digital_archive", [EXISTING_ARCHIVE])
  })

  it("digital_archive 数量不增加（仍为 1）", async () => {
    const { archiveWorkOrder } = await importService()
    archiveWorkOrder(101)
    expect(getTable("digital_archive").length).toBe(1)
  })

  it("返回已有档案的 archiveId=5", async () => {
    const { archiveWorkOrder } = await importService()
    expect(archiveWorkOrder(101).archiveId).toBe(5)
  })

  it("更新已有档案的 last_audit_time", async () => {
    const { archiveWorkOrder } = await importService()
    archiveWorkOrder(101)
    const rows = getTable<{ last_audit_time: string }>("digital_archive")
    expect(rows[0].last_audit_time).toBe("2024-03-08 15:00:00")
  })

  it("archive_relation 仍追加 1 条", async () => {
    const { archiveWorkOrder } = await importService()
    archiveWorkOrder(101)
    expect(getTable("archive_relation").length).toBe(1)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.56 archiveWorkOrder() — 异常场景", () => {
  it("id 不存在返回 ok=false", async () => {
    setTable("work_order", [FINISHED_ORDER])
    const { archiveWorkOrder } = await importService()
    expect(archiveWorkOrder(9999).ok).toBe(false)
  })

  it("id 不存在时 error 字段非空", async () => {
    setTable("work_order", [FINISHED_ORDER])
    const { archiveWorkOrder } = await importService()
    expect(typeof archiveWorkOrder(9999).error).toBe("string")
  })

  it("status=CHECKING 时返回 ok=false", async () => {
    setTable("work_order", [{ ...FINISHED_ORDER, status: "CHECKING" }])
    const { archiveWorkOrder } = await importService()
    expect(archiveWorkOrder(101).ok).toBe(false)
  })

  it("status=PROCESSING 时返回 ok=false", async () => {
    setTable("work_order", [{ ...FINISHED_ORDER, status: "PROCESSING" }])
    const { archiveWorkOrder } = await importService()
    expect(archiveWorkOrder(101).ok).toBe(false)
  })

  it("非 FINISHED 时 digital_archive 不写入", async () => {
    setTable("work_order", [{ ...FINISHED_ORDER, status: "CHECKING" }])
    const { archiveWorkOrder } = await importService()
    archiveWorkOrder(101)
    expect(getTable("digital_archive").length).toBe(0)
  })

  it("非 FINISHED 时 archive_relation 不写入", async () => {
    setTable("work_order", [{ ...FINISHED_ORDER, status: "CHECKING" }])
    const { archiveWorkOrder } = await importService()
    archiveWorkOrder(101)
    expect(getTable("archive_relation").length).toBe(0)
  })
})

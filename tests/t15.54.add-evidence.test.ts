/**
 * T15.54 — 实现证据新增 addEvidence
 *
 * H5 在工单处理过程中（PROCESSING 状态）可随时追加照片、定位、说明等证据，
 * 写入 work_order_disposal，不改变工单状态。
 *
 * 业务规则：
 *   - 只有 status=PROCESSING 的工单可新增证据
 *   - 非 PROCESSING 状态返回 { ok: false, error }
 *   - id 不存在返回 { ok: false, error }
 *   - 同一工单可多次追加，形成多条 work_order_disposal 记录
 *   - 不写入 work_order_log（静默新增）
 *
 * 测试范围：
 *   - addEvidence 可从 workOrderService 导入
 *   - 正常新增返回 ok=true 且 evidenceId（数字）
 *   - work_order_disposal 表增加 1 条记录
 *   - disposal.order_id=工单 id
 *   - disposal.image_urls 来自 payload.imageUrls
 *   - disposal.gps_location 来自 payload.gpsLocation
 *   - disposal.disposal_desc 来自 payload.evidenceDesc
 *   - disposal.user_id 来自 payload.userId
 *   - 同一工单第二次追加 id=max+1
 *   - 连续两次追加后 work_order_disposal 共 2 条
 *   - 非 PROCESSING 状态返回 ok=false
 *   - id 不存在返回 ok=false
 *   - 非 PROCESSING 时 work_order_disposal 不写入
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
  setTable("work_order_disposal", [])
})

afterEach(() => {
  delete (globalThis as any).localStorage
})

async function importService() {
  return import("../src/services/workOrderService")
}

const PROCESSING_ORDER = {
  id: 101, order_no: "WO-20240308-0001",
  status: "PROCESSING", current_node: "HANDLE",
  create_time: "2024-03-08 10:10:00", update_time: "2024-03-08 10:30:00",
}

const BASE_PAYLOAD = {
  imageUrls:   '["photo1.jpg","photo2.jpg"]',
  gpsLocation: "31.2304,121.4737",
  addressDesc: "南侧外墙裂缝处",
  evidenceDesc: "现场拍摄裂缝照片，宽度约 2mm",
  userId:      201,
  evidenceTime: "2024-03-08 11:00:00",
}

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.54 addEvidence() — 导出", () => {
  it("addEvidence 可从 workOrderService 导入", async () => {
    const { addEvidence } = await importService()
    expect(typeof addEvidence).toBe("function")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.54 addEvidence() — 正常新增", () => {
  beforeEach(() => setTable("work_order", [PROCESSING_ORDER]))

  it("返回 ok=true", async () => {
    const { addEvidence } = await importService()
    expect(addEvidence(101, BASE_PAYLOAD).ok).toBe(true)
  })

  it("返回 evidenceId（数字）", async () => {
    const { addEvidence } = await importService()
    expect(typeof addEvidence(101, BASE_PAYLOAD).evidenceId).toBe("number")
  })

  it("work_order_disposal 增加 1 条记录", async () => {
    const { addEvidence } = await importService()
    addEvidence(101, BASE_PAYLOAD)
    expect(getTable("work_order_disposal").length).toBe(1)
  })

  it("disposal.order_id=101", async () => {
    const { addEvidence } = await importService()
    addEvidence(101, BASE_PAYLOAD)
    const rows = getTable<{ order_id: number }>("work_order_disposal")
    expect(rows[0].order_id).toBe(101)
  })

  it("disposal.image_urls 来自 payload.imageUrls", async () => {
    const { addEvidence } = await importService()
    addEvidence(101, BASE_PAYLOAD)
    const rows = getTable<{ image_urls: string }>("work_order_disposal")
    expect(rows[0].image_urls).toBe('["photo1.jpg","photo2.jpg"]')
  })

  it("disposal.gps_location 来自 payload.gpsLocation", async () => {
    const { addEvidence } = await importService()
    addEvidence(101, BASE_PAYLOAD)
    const rows = getTable<{ gps_location: string }>("work_order_disposal")
    expect(rows[0].gps_location).toBe("31.2304,121.4737")
  })

  it("disposal.disposal_desc 来自 payload.evidenceDesc", async () => {
    const { addEvidence } = await importService()
    addEvidence(101, BASE_PAYLOAD)
    const rows = getTable<{ disposal_desc: string }>("work_order_disposal")
    expect(rows[0].disposal_desc).toBe("现场拍摄裂缝照片，宽度约 2mm")
  })

  it("disposal.user_id 来自 payload.userId", async () => {
    const { addEvidence } = await importService()
    addEvidence(101, BASE_PAYLOAD)
    const rows = getTable<{ user_id: number }>("work_order_disposal")
    expect(rows[0].user_id).toBe(201)
  })

  it("disposal.disposal_time 来自 payload.evidenceTime", async () => {
    const { addEvidence } = await importService()
    addEvidence(101, BASE_PAYLOAD)
    const rows = getTable<{ disposal_time: string }>("work_order_disposal")
    expect(rows[0].disposal_time).toBe("2024-03-08 11:00:00")
  })

  it("evidenceTime 缺省时 disposal_time 自动生成", async () => {
    const { addEvidence } = await importService()
    addEvidence(101, { ...BASE_PAYLOAD, evidenceTime: undefined })
    const rows = getTable<{ disposal_time: string }>("work_order_disposal")
    expect(typeof rows[0].disposal_time).toBe("string")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.54 addEvidence() — id 自增", () => {
  beforeEach(() => setTable("work_order", [PROCESSING_ORDER]))

  it("空表时第一条 evidenceId=1", async () => {
    const { addEvidence } = await importService()
    expect(addEvidence(101, BASE_PAYLOAD).evidenceId).toBe(1)
  })

  it("连续两次追加后 work_order_disposal 共 2 条", async () => {
    const { addEvidence } = await importService()
    addEvidence(101, BASE_PAYLOAD)
    addEvidence(101, BASE_PAYLOAD)
    expect(getTable("work_order_disposal").length).toBe(2)
  })

  it("第二次追加 evidenceId = max + 1", async () => {
    const { addEvidence } = await importService()
    addEvidence(101, BASE_PAYLOAD)
    const r2 = addEvidence(101, BASE_PAYLOAD)
    expect(r2.evidenceId).toBe(2)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.54 addEvidence() — 异常场景", () => {
  it("id 不存在返回 ok=false", async () => {
    setTable("work_order", [PROCESSING_ORDER])
    const { addEvidence } = await importService()
    expect(addEvidence(9999, BASE_PAYLOAD).ok).toBe(false)
  })

  it("id 不存在时 error 字段非空", async () => {
    setTable("work_order", [PROCESSING_ORDER])
    const { addEvidence } = await importService()
    expect(typeof addEvidence(9999, BASE_PAYLOAD).error).toBe("string")
  })

  it("status=CHECKING 时返回 ok=false", async () => {
    setTable("work_order", [{ ...PROCESSING_ORDER, status: "CHECKING" }])
    const { addEvidence } = await importService()
    expect(addEvidence(101, BASE_PAYLOAD).ok).toBe(false)
  })

  it("status=PENDING 时返回 ok=false", async () => {
    setTable("work_order", [{ ...PROCESSING_ORDER, status: "PENDING" }])
    const { addEvidence } = await importService()
    expect(addEvidence(101, BASE_PAYLOAD).ok).toBe(false)
  })

  it("非 PROCESSING 时 work_order_disposal 不写入", async () => {
    setTable("work_order", [{ ...PROCESSING_ORDER, status: "CHECKING" }])
    const { addEvidence } = await importService()
    addEvidence(101, BASE_PAYLOAD)
    expect(getTable("work_order_disposal").length).toBe(0)
  })
})

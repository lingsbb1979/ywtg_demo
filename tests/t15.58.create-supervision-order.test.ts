/**
 * T15.58 — 实现督办记录生成 createSupervisionOrder
 *
 * 超时工单可生成 supervision_order 记录（市内督办流程）。
 *
 * 函数签名：
 *   createSupervisionOrder(payload: CreateSupervisionPayload): CreateSupervisionResult
 *
 * payload 字段：
 *   relatedOrderId?  — 关联工单 id（source_type=2 工单）
 *   title?           — 督办标题
 *   content?         — 督办内容
 *   levelCode?       — 督办级别（GENERAL / IMPORTANT / URGENT，默认 GENERAL）
 *   fromOrgId?       — 发起机构 id
 *   toOrgId?         — 被督办机构 id
 *   issueTime?       — 下发时间，默认 now
 *   deadline?        — 截止时间（由调用方传入，或根据 levelCode 自动计算）
 *   operator?        — 操作人
 *   operatorId?      — 操作人 id
 *
 * 业务规则：
 *   - id = max(id) + 1，空表时 = 1
 *   - supervision_no = SUP-YYYYMMDDHHmmss-XXXX（4 位随机数）
 *   - status = "PENDING"（待处理）
 *   - source_type = 2（工单）当 relatedOrderId 存在时
 *   - related_event_id = relatedOrderId（若有）
 *   - deadline 未传时按 levelCode 自动计算：
 *       URGENT: +120 分钟, IMPORTANT: +1440 分钟, GENERAL: +4320 分钟
 *   - 写入 1 条 supervision_order，返回 { ok: true, supervisionId, supervisionNo }
 *
 * 测试范围（20 条）：
 *   - 导出检查
 *   - 正常生成：ok=true, supervisionId 数字, supervisionNo 字符串
 *   - supervision_order 新增 1 条
 *   - supervision_no 格式 SUP-开头
 *   - status="PENDING"
 *   - source_type=2 当 relatedOrderId 存在
 *   - related_event_id=relatedOrderId
 *   - title 来自 payload.title
 *   - level_code 来自 payload.levelCode
 *   - 连续两次生成 id 自增
 *   - deadline 未传时 URGENT 自动计算（issueTime + 120 min）
 *   - deadline 未传时 GENERAL 自动计算（issueTime + 4320 min）
 *   - deadline 已传时直接使用
 *   - from_org_id 来自 payload.fromOrgId
 *   - to_org_id 来自 payload.toOrgId
 *   - relatedOrderId 为空时 source_type 为 null 或未设置
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
  setTable("supervision_order", [])
})

afterEach(() => {
  delete (globalThis as any).localStorage
})

async function importService() {
  return import("../src/services/workOrderService")
}

const BASE_PAYLOAD = {
  relatedOrderId: 101,
  title:          "请核查超时未处置工单",
  content:        "工单 WO-20240308-0001 已超时 60 分钟，请立即处置",
  levelCode:      "IMPORTANT",
  fromOrgId:      10,
  toOrgId:        20,
  issueTime:      "2024-03-08 14:00:00",
}

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.58 createSupervisionOrder() — 导出", () => {
  it("createSupervisionOrder 可从 workOrderService 导入", async () => {
    const { createSupervisionOrder } = await importService()
    expect(typeof createSupervisionOrder).toBe("function")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.58 createSupervisionOrder() — 正常生成", () => {
  it("返回 ok=true", async () => {
    const { createSupervisionOrder } = await importService()
    expect(createSupervisionOrder(BASE_PAYLOAD).ok).toBe(true)
  })

  it("返回 supervisionId（数字）", async () => {
    const { createSupervisionOrder } = await importService()
    expect(typeof createSupervisionOrder(BASE_PAYLOAD).supervisionId).toBe("number")
  })

  it("返回 supervisionNo（字符串）", async () => {
    const { createSupervisionOrder } = await importService()
    expect(typeof createSupervisionOrder(BASE_PAYLOAD).supervisionNo).toBe("string")
  })

  it("supervision_order 新增 1 条", async () => {
    const { createSupervisionOrder } = await importService()
    createSupervisionOrder(BASE_PAYLOAD)
    expect(getTable("supervision_order").length).toBe(1)
  })

  it("supervision_no 以 SUP- 开头", async () => {
    const { createSupervisionOrder } = await importService()
    createSupervisionOrder(BASE_PAYLOAD)
    const rows = getTable<{ supervision_no: string }>("supervision_order")
    expect(rows[0].supervision_no.startsWith("SUP-")).toBe(true)
  })

  it("status='PENDING'", async () => {
    const { createSupervisionOrder } = await importService()
    createSupervisionOrder(BASE_PAYLOAD)
    const rows = getTable<{ status: string }>("supervision_order")
    expect(rows[0].status).toBe("PENDING")
  })

  it("source_type=2 当 relatedOrderId 存在", async () => {
    const { createSupervisionOrder } = await importService()
    createSupervisionOrder(BASE_PAYLOAD)
    const rows = getTable<{ source_type: number }>("supervision_order")
    expect(rows[0].source_type).toBe(2)
  })

  it("related_event_id=101", async () => {
    const { createSupervisionOrder } = await importService()
    createSupervisionOrder(BASE_PAYLOAD)
    const rows = getTable<{ related_event_id: number }>("supervision_order")
    expect(rows[0].related_event_id).toBe(101)
  })

  it("title 来自 payload.title", async () => {
    const { createSupervisionOrder } = await importService()
    createSupervisionOrder(BASE_PAYLOAD)
    const rows = getTable<{ title: string }>("supervision_order")
    expect(rows[0].title).toBe("请核查超时未处置工单")
  })

  it("level_code 来自 payload.levelCode", async () => {
    const { createSupervisionOrder } = await importService()
    createSupervisionOrder(BASE_PAYLOAD)
    const rows = getTable<{ level_code: string }>("supervision_order")
    expect(rows[0].level_code).toBe("IMPORTANT")
  })

  it("from_org_id 来自 payload.fromOrgId", async () => {
    const { createSupervisionOrder } = await importService()
    createSupervisionOrder(BASE_PAYLOAD)
    const rows = getTable<{ from_org_id: number }>("supervision_order")
    expect(rows[0].from_org_id).toBe(10)
  })

  it("to_org_id 来自 payload.toOrgId", async () => {
    const { createSupervisionOrder } = await importService()
    createSupervisionOrder(BASE_PAYLOAD)
    const rows = getTable<{ to_org_id: number }>("supervision_order")
    expect(rows[0].to_org_id).toBe(20)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.58 createSupervisionOrder() — id 自增", () => {
  it("空表时第一条 supervisionId=1", async () => {
    const { createSupervisionOrder } = await importService()
    expect(createSupervisionOrder(BASE_PAYLOAD).supervisionId).toBe(1)
  })

  it("连续两次生成 id 自增", async () => {
    const { createSupervisionOrder } = await importService()
    const r1 = createSupervisionOrder(BASE_PAYLOAD)
    const r2 = createSupervisionOrder(BASE_PAYLOAD)
    expect(r2.supervisionId).toBe(r1.supervisionId + 1)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.58 createSupervisionOrder() — deadline 自动计算", () => {
  it("URGENT 时 deadline = issueTime + 120 min", async () => {
    const { createSupervisionOrder } = await importService()
    createSupervisionOrder({ ...BASE_PAYLOAD, levelCode: "URGENT", issueTime: "2024-03-08 14:00:00" })
    const rows = getTable<{ deadline: string }>("supervision_order")
    expect(rows[0].deadline).toBe("2024-03-08 16:00:00")
  })

  it("GENERAL 时 deadline = issueTime + 4320 min（3 天）", async () => {
    const { createSupervisionOrder } = await importService()
    createSupervisionOrder({ ...BASE_PAYLOAD, levelCode: "GENERAL", issueTime: "2024-03-08 14:00:00" })
    const rows = getTable<{ deadline: string }>("supervision_order")
    expect(rows[0].deadline).toBe("2024-03-11 14:00:00")
  })

  it("deadline 已传时直接使用", async () => {
    const { createSupervisionOrder } = await importService()
    createSupervisionOrder({ ...BASE_PAYLOAD, deadline: "2024-03-09 10:00:00" })
    const rows = getTable<{ deadline: string }>("supervision_order")
    expect(rows[0].deadline).toBe("2024-03-09 10:00:00")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.58 createSupervisionOrder() — 无关联工单", () => {
  it("relatedOrderId 为空时 source_type 为 null", async () => {
    const { createSupervisionOrder } = await importService()
    createSupervisionOrder({ ...BASE_PAYLOAD, relatedOrderId: undefined })
    const rows = getTable<{ source_type: any }>("supervision_order")
    expect(rows[0].source_type == null).toBe(true)
  })
})

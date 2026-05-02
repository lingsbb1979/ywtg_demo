/**
 * T15.67 — 场景引擎 triggerTimeoutSupervision()
 *
 * 模拟生成一条超时工单 + 督办建议（supervision_order）。
 *
 * 函数签名：
 *   triggerTimeoutSupervision(options?: SupervisionOptions): void
 *   interface SupervisionOptions { nowStr?: string }
 *
 * 逻辑：
 *   - 向 work_order 追加 1 条状态为 PENDING 的工单，
 *     dispatch_time = nowStr 倒推 200 分钟（固定写 "2024-03-08 07:40:00"，nowStr 默认 "2024-03-08 11:00:00"）
 *   - 向 supervision_order 追加 1 条督办单：
 *       source_type = "WORK_ORDER"
 *       level_code  = "GENERAL"
 *       status      = "ISSUED"
 *       issue_time  = nowStr
 *       title 含 "超时" 字样
 *
 * 测试范围（13 条）：
 *   - 导出检查
 *   - work_order 增加 1 条
 *   - 工单 status=PENDING
 *   - 工单 dispatch_time = "2024-03-08 07:40:00"（默认 nowStr）
 *   - supervision_order 增加 1 条
 *   - 督办 source_type=WORK_ORDER
 *   - 督办 level_code=GENERAL
 *   - 督办 status=ISSUED
 *   - 督办 issue_time 等于 nowStr
 *   - 督办 title 含"超时"
 *   - 调用两次不重置（追加，各表各 2 条）
 *   - 不影响 alarm_record
 *   - 不影响 iot_space
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
  setTable("alarm_record",     [])
  setTable("work_order",       [])
  setTable("supervision_order", [])
  setTable("iot_space",        [])
})

afterEach(() => {
  delete (globalThis as any).localStorage
})

async function importService() {
  return import("../src/services/scenarioService")
}

type WoRow = { id: number; status: string; dispatch_time: string | null }
type SupRow = {
  id: number; source_type: string; level_code: string
  status: string; issue_time: string | null; title: string
}

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.67 triggerTimeoutSupervision() — 导出", () => {
  it("triggerTimeoutSupervision 可从 scenarioService 导入", async () => {
    const { triggerTimeoutSupervision } = await importService()
    expect(typeof triggerTimeoutSupervision).toBe("function")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.67 triggerTimeoutSupervision() — 工单", () => {
  it("work_order 增加 1 条", async () => {
    const { triggerTimeoutSupervision } = await importService()
    triggerTimeoutSupervision()
    expect(getTable("work_order").length).toBe(1)
  })

  it("工单 status=PENDING", async () => {
    const { triggerTimeoutSupervision } = await importService()
    triggerTimeoutSupervision()
    expect((getTable<WoRow>("work_order"))[0].status).toBe("PENDING")
  })

  it("工单 dispatch_time=2024-03-08 07:40:00（默认 nowStr 倒退 200min）", async () => {
    const { triggerTimeoutSupervision } = await importService()
    triggerTimeoutSupervision()
    expect((getTable<WoRow>("work_order"))[0].dispatch_time).toBe("2024-03-08 07:40:00")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.67 triggerTimeoutSupervision() — 督办单", () => {
  it("supervision_order 增加 1 条", async () => {
    const { triggerTimeoutSupervision } = await importService()
    triggerTimeoutSupervision()
    expect(getTable("supervision_order").length).toBe(1)
  })

  it("督办 source_type=WORK_ORDER", async () => {
    const { triggerTimeoutSupervision } = await importService()
    triggerTimeoutSupervision()
    expect((getTable<SupRow>("supervision_order"))[0].source_type).toBe("WORK_ORDER")
  })

  it("督办 level_code=GENERAL", async () => {
    const { triggerTimeoutSupervision } = await importService()
    triggerTimeoutSupervision()
    expect((getTable<SupRow>("supervision_order"))[0].level_code).toBe("GENERAL")
  })

  it("督办 status=ISSUED", async () => {
    const { triggerTimeoutSupervision } = await importService()
    triggerTimeoutSupervision()
    expect((getTable<SupRow>("supervision_order"))[0].status).toBe("ISSUED")
  })

  it("督办 issue_time 等于 nowStr", async () => {
    const { triggerTimeoutSupervision } = await importService()
    triggerTimeoutSupervision({ nowStr: "2024-07-01 15:00:00" })
    expect((getTable<SupRow>("supervision_order"))[0].issue_time).toBe("2024-07-01 15:00:00")
  })

  it("督办 title 包含 '超时'", async () => {
    const { triggerTimeoutSupervision } = await importService()
    triggerTimeoutSupervision()
    expect((getTable<SupRow>("supervision_order"))[0].title).toContain("超时")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.67 triggerTimeoutSupervision() — 副作用", () => {
  it("调用两次后 work_order=2 supervision_order=2（追加不覆盖）", async () => {
    const { triggerTimeoutSupervision } = await importService()
    triggerTimeoutSupervision()
    triggerTimeoutSupervision()
    expect(getTable("work_order").length).toBe(2)
    expect(getTable("supervision_order").length).toBe(2)
  })

  it("不影响 alarm_record", async () => {
    setTable("alarm_record", [{ id: 1, status: "ACTIVE" }])
    const { triggerTimeoutSupervision } = await importService()
    triggerTimeoutSupervision()
    expect(getTable("alarm_record").length).toBe(1)
  })

  it("不影响 iot_space", async () => {
    setTable("iot_space", [{ id: 1001, name: "A栋" }])
    const { triggerTimeoutSupervision } = await importService()
    triggerTimeoutSupervision()
    expect(getTable("iot_space").length).toBe(1)
  })
})

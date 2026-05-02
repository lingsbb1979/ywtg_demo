/**
 * T15.64 — 场景引擎 resetDemo()
 *
 * 一键清空并重建固定演示数据，新建 scenarioService.ts。
 *
 * 函数签名：
 *   resetDemo(): void
 *
 * 逻辑（最小可测试版本）：
 *   - 调用 resetTables() 清空所有表
 *   - 写入固定演示种子数据：
 *       iot_space:    3 栋建筑（id=1001/1002/1003）
 *       alarm_record: 2 条告警（id=1/2，status=ACTIVE）
 *       work_order:   2 条工单（id=1 PENDING, id=2 PROCESSING）
 *   - 不返回值
 *
 * 测试范围（14 条）：
 *   - 导出检查
 *   - 调用后 iot_space 有 3 条
 *   - 调用后 alarm_record 有 2 条
 *   - 调用后 work_order 有 2 条
 *   - 调用两次后数据不会翻倍（幂等性）
 *   - iot_space 含 id=1001
 *   - iot_space 含 id=1002
 *   - iot_space 含 id=1003
 *   - alarm_record 第 1 条 status=ACTIVE
 *   - alarm_record 第 2 条 status=ACTIVE
 *   - work_order id=1 status=PENDING
 *   - work_order id=2 status=PROCESSING
 *   - work_order 含 building_id
 *   - work_order 含 dispatch_time
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
})

afterEach(() => {
  delete (globalThis as any).localStorage
})

async function importService() {
  return import("../src/services/scenarioService")
}

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.64 resetDemo() — 导出", () => {
  it("resetDemo 可从 scenarioService 导入", async () => {
    const { resetDemo } = await importService()
    expect(typeof resetDemo).toBe("function")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.64 resetDemo() — 种子数据数量", () => {
  it("调用后 iot_space 有 3 条", async () => {
    const { resetDemo } = await importService()
    resetDemo()
    expect(getTable("iot_space").length).toBe(3)
  })

  it("调用后 alarm_record 有 2 条", async () => {
    const { resetDemo } = await importService()
    resetDemo()
    expect(getTable("alarm_record").length).toBe(2)
  })

  it("调用后 work_order 有 2 条", async () => {
    const { resetDemo } = await importService()
    resetDemo()
    expect(getTable("work_order").length).toBe(2)
  })

  it("调用两次后 work_order 不翻倍（幂等）", async () => {
    const { resetDemo } = await importService()
    resetDemo()
    resetDemo()
    expect(getTable("work_order").length).toBe(2)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.64 resetDemo() — iot_space 种子", () => {
  it("含 id=1001", async () => {
    const { resetDemo } = await importService()
    resetDemo()
    expect((getTable<{ id: number }>("iot_space")).some((s) => s.id === 1001)).toBe(true)
  })

  it("含 id=1002", async () => {
    const { resetDemo } = await importService()
    resetDemo()
    expect((getTable<{ id: number }>("iot_space")).some((s) => s.id === 1002)).toBe(true)
  })

  it("含 id=1003", async () => {
    const { resetDemo } = await importService()
    resetDemo()
    expect((getTable<{ id: number }>("iot_space")).some((s) => s.id === 1003)).toBe(true)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.64 resetDemo() — alarm_record 种子", () => {
  it("第 1 条 status=ACTIVE", async () => {
    const { resetDemo } = await importService()
    resetDemo()
    expect((getTable<{ status: string }>("alarm_record"))[0].status).toBe("ACTIVE")
  })

  it("第 2 条 status=ACTIVE", async () => {
    const { resetDemo } = await importService()
    resetDemo()
    expect((getTable<{ status: string }>("alarm_record"))[1].status).toBe("ACTIVE")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.64 resetDemo() — work_order 种子", () => {
  it("id=1 status=PENDING", async () => {
    const { resetDemo } = await importService()
    resetDemo()
    const wo = getTable<{ id: number; status: string }>("work_order")
    expect(wo.find((o) => o.id === 1)?.status).toBe("PENDING")
  })

  it("id=2 status=PROCESSING", async () => {
    const { resetDemo } = await importService()
    resetDemo()
    const wo = getTable<{ id: number; status: string }>("work_order")
    expect(wo.find((o) => o.id === 2)?.status).toBe("PROCESSING")
  })

  it("含字段 building_id", async () => {
    const { resetDemo } = await importService()
    resetDemo()
    expect((getTable<{ building_id: number }>("work_order"))[0].building_id).toBeDefined()
  })

  it("含字段 dispatch_time", async () => {
    const { resetDemo } = await importService()
    resetDemo()
    expect((getTable<{ dispatch_time: string }>("work_order"))[0].dispatch_time).toBeDefined()
  })
})

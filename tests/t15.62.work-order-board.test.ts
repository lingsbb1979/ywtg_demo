/**
 * T15.62 — 实现工单看板选择器 selectWorkOrderBoard
 *
 * 大屏和管理端可显示各状态工单数量看板。
 *
 * 函数签名：
 *   selectWorkOrderBoard(): WorkOrderBoard
 *
 * 返回字段：
 *   pending    — status=PENDING（待接单）
 *   processing — status=PROCESSING（处理中）
 *   checking   — status=CHECKING（待核查）
 *   finished   — status=FINISHED（已销号）
 *   total      — 总工单数
 *   overdueCount — 超时工单数（PENDING/PROCESSING/CHECKING 中 dispatch_time 超 120 分钟）
 *
 * nowStr 参数用于测试注入当前时间（覆盖 overdueCount 计算）。
 *
 * 测试范围（20 条）：
 *   - 导出检查
 *   - 空数据时全部为 0
 *   - pending 计数
 *   - processing 计数
 *   - checking 计数
 *   - finished 计数
 *   - total = 所有工单数
 *   - 各状态独立计数（互不影响）
 *   - overdueCount 超时工单数
 *   - overdueCount 未超时时为 0
 *   - 含字段 pending/processing/checking/finished/total/overdueCount
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
  setTable("work_order", [])
})

afterEach(() => {
  delete (globalThis as any).localStorage
})

async function importService() {
  return import("../src/services/screenKpiService")
}

const NOW = "2024-03-08 14:00:00"

const ORDERS = [
  { id: 1, status: "PENDING",    dispatch_time: "2024-03-08 11:00:00" }, // 超时 60min
  { id: 2, status: "PENDING",    dispatch_time: "2024-03-08 13:30:00" }, // 未超时 30min
  { id: 3, status: "PROCESSING", dispatch_time: "2024-03-08 10:00:00" }, // 超时 120min
  { id: 4, status: "CHECKING",   dispatch_time: "2024-03-08 13:00:00" }, // 未超时 60min
  { id: 5, status: "FINISHED",   dispatch_time: "2024-03-07 08:00:00" },
  { id: 6, status: "FINISHED",   dispatch_time: "2024-03-07 09:00:00" },
]

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.62 selectWorkOrderBoard() — 导出", () => {
  it("selectWorkOrderBoard 可从 screenKpiService 导入", async () => {
    const { selectWorkOrderBoard } = await importService()
    expect(typeof selectWorkOrderBoard).toBe("function")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.62 selectWorkOrderBoard() — 空数据", () => {
  it("无工单时 pending=0", async () => {
    const { selectWorkOrderBoard } = await importService()
    expect(selectWorkOrderBoard().pending).toBe(0)
  })

  it("无工单时 processing=0", async () => {
    const { selectWorkOrderBoard } = await importService()
    expect(selectWorkOrderBoard().processing).toBe(0)
  })

  it("无工单时 checking=0", async () => {
    const { selectWorkOrderBoard } = await importService()
    expect(selectWorkOrderBoard().checking).toBe(0)
  })

  it("无工单时 finished=0", async () => {
    const { selectWorkOrderBoard } = await importService()
    expect(selectWorkOrderBoard().finished).toBe(0)
  })

  it("无工单时 total=0", async () => {
    const { selectWorkOrderBoard } = await importService()
    expect(selectWorkOrderBoard().total).toBe(0)
  })

  it("无工单时 overdueCount=0", async () => {
    const { selectWorkOrderBoard } = await importService()
    expect(selectWorkOrderBoard({ nowStr: NOW }).overdueCount).toBe(0)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.62 selectWorkOrderBoard() — 正常计数", () => {
  beforeEach(() => setTable("work_order", ORDERS))

  it("pending=2", async () => {
    const { selectWorkOrderBoard } = await importService()
    expect(selectWorkOrderBoard().pending).toBe(2)
  })

  it("processing=1", async () => {
    const { selectWorkOrderBoard } = await importService()
    expect(selectWorkOrderBoard().processing).toBe(1)
  })

  it("checking=1", async () => {
    const { selectWorkOrderBoard } = await importService()
    expect(selectWorkOrderBoard().checking).toBe(1)
  })

  it("finished=2", async () => {
    const { selectWorkOrderBoard } = await importService()
    expect(selectWorkOrderBoard().finished).toBe(2)
  })

  it("total=6", async () => {
    const { selectWorkOrderBoard } = await importService()
    expect(selectWorkOrderBoard().total).toBe(6)
  })

  it("overdueCount 超时工单数（注入 now）", async () => {
    const { selectWorkOrderBoard } = await importService()
    // PENDING id=1(180min>120), PROCESSING id=3(240min>120) → 2 条
    expect(selectWorkOrderBoard({ nowStr: NOW }).overdueCount).toBe(2)
  })

  it("未注入 nowStr 时 overdueCount 为 number", async () => {
    const { selectWorkOrderBoard } = await importService()
    expect(typeof selectWorkOrderBoard().overdueCount).toBe("number")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.62 selectWorkOrderBoard() — 字段完整性", () => {
  it("返回包含 pending / processing / checking / finished / total / overdueCount", async () => {
    const { selectWorkOrderBoard } = await importService()
    const board = selectWorkOrderBoard()
    expect("pending"      in board).toBe(true)
    expect("processing"   in board).toBe(true)
    expect("checking"     in board).toBe(true)
    expect("finished"     in board).toBe(true)
    expect("total"        in board).toBe(true)
    expect("overdueCount" in board).toBe(true)
  })
})

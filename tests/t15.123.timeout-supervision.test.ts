/**
 * T15.123 TDD — 跑通超时督办轻量流程（验收）
 *
 * 验收标准：
 *   可生成超时工单、督办建议和绩效变化
 *
 * 测试项：
 *   - triggerTimeoutSupervision() 写入超时 PENDING 工单（dispatch_time 在 200 分钟前）
 *   - triggerTimeoutSupervision() 写入 supervision_order 督办单
 *   - listOverdueWorkOrders() 能识别超时工单（dispatch_time > SLA）
 *   - 大屏 KPI overdueCount > 0（超时工单数统计）
 *   - AdminSupervisionView.vue 文件存在
 */
import { describe, it, expect, beforeEach } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const projectRoot = process.cwd()
const MEM_KEY = "__ywtg_sqlite_mirror_store__"

function resetMem() {
  delete (globalThis as any)[MEM_KEY]
}

describe("T15.123 triggerTimeoutSupervision — 超时工单和督办单写入", () => {
  beforeEach(resetMem)

  it("triggerTimeoutSupervision() 写入 PENDING 工单", async () => {
    const { resetDemo, triggerTimeoutSupervision } = await import("../src/services/scenarioService")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    resetDemo()
    triggerTimeoutSupervision()
    const orders = getTable<{ status: string }>("work_order")
    expect(orders.some((o) => o.status === "PENDING")).toBe(true)
  })

  it("triggerTimeoutSupervision() 写入 supervision_order 督办单", async () => {
    const { resetDemo, triggerTimeoutSupervision } = await import("../src/services/scenarioService")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    resetDemo()
    triggerTimeoutSupervision()
    const sups = getTable<{ id: number }>("supervision_order")
    expect(sups.length).toBeGreaterThan(0)
  })

  it("超时工单的 dispatch_time 比 nowStr 早 >= 120 分钟（超出 SLA）", async () => {
    const { resetDemo, triggerTimeoutSupervision } = await import("../src/services/scenarioService")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    resetDemo()
    const nowStr = "2026-05-02 10:00:00"
    triggerTimeoutSupervision({ nowStr })
    const orders = getTable<{ dispatch_time: string | null; status: string }>("work_order")
    const timeoutOrder = orders.find((o) => o.status === "PENDING" && o.dispatch_time)
    expect(timeoutOrder).toBeDefined()
    const dispatchMs = Date.parse(timeoutOrder!.dispatch_time!.replace(" ", "T"))
    const nowMs      = Date.parse(nowStr.replace(" ", "T"))
    const diffMin = (nowMs - dispatchMs) / 60000
    expect(diffMin).toBeGreaterThanOrEqual(120)
  })

  it("listOverdueWorkOrders() 能识别超时工单", async () => {
    const { resetDemo, triggerTimeoutSupervision } = await import("../src/services/scenarioService")
    const { listOverdueWorkOrders } = await import("../src/services/workOrderService")
    resetDemo()
    triggerTimeoutSupervision({ nowStr: "2026-05-02 10:00:00" })
    const overdue = listOverdueWorkOrders({ defaultSlaMins: 120, nowStr: "2026-05-02 10:00:00" })
    expect(overdue.length).toBeGreaterThan(0)
  })

  it("大屏 KPI overdueCount 在超时工单存在时 > 0", async () => {
    const { resetDemo, triggerTimeoutSupervision } = await import("../src/services/scenarioService")
    const { selectWorkOrderBoard } = await import("../src/services/screenKpiService")
    resetDemo()
    triggerTimeoutSupervision({ nowStr: "2026-05-02 10:00:00" })
    const board = selectWorkOrderBoard({ nowStr: "2026-05-02 10:00:00" })
    expect(board.overdueCount).toBeGreaterThan(0)
  })
})

describe("T15.123 AdminSupervisionView — 督办页面存在", () => {
  it("AdminSupervisionView.vue 文件应存在", () => {
    const { existsSync } = require("node:fs")
    expect(existsSync(
      join(projectRoot, "src", "views", "admin", "AdminSupervisionView.vue"),
    )).toBe(true)
  })

  it("督办页有督办单列表区域（supervision 或督办相关标记）", () => {
    const src = readFileSync(
      join(projectRoot, "src", "views", "admin", "AdminSupervisionView.vue"),
      "utf-8",
    )
    expect(src).toMatch(/supervision|督办/)
  })
})

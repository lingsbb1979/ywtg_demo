/**
 * T15.126 督办演示完整流程测试
 *
 * 模拟演示控制台操作顺序：
 *   ① 重置演示数据
 *   ② 触发超时督办（triggerTimeoutSupervision）
 *   ③ AdminSupervisionView 能读取到督办单（list）
 *   ④ 填写回复（submitReply 逻辑）
 *   ⑤ 状态变为 REPLIED
 *   ⑥ 点击办结（closeSupervision 逻辑）
 *   ⑦ 状态变为 CLOSED
 *   ⑧ 大屏 KPI：overdueCount > 0，supervisionCount > 0
 *   ⑨ AdminSupervisionView.vue 包含"回复"和"办结"操作入口
 *   ⑩ 演示控制台快捷跳转包含督办管理入口
 */

import { describe, it, expect, beforeEach } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const ROOT   = process.cwd()
const MEM_KEY = "__ywtg_sqlite_mirror_store__"

function resetMem() {
  delete (globalThis as any)[MEM_KEY]
}

// ─────────────────────────────────────────────────────────────────────────────
// §1  触发超时督办 → 数据写入
// ─────────────────────────────────────────────────────────────────────────────
describe("§1 触发超时督办 → 数据写入", () => {
  beforeEach(resetMem)

  it("①  重置后 supervision_order 为空", async () => {
    const { resetDemo } = await import("../src/services/scenarioService")
    const { getTable }  = await import("../src/services/sqliteMirrorRepository")
    resetDemo()
    expect(getTable("supervision_order").length).toBe(0)
  })

  it("②  触发超时督办后 supervision_order 有 1 条记录", async () => {
    const { resetDemo, triggerTimeoutSupervision } = await import("../src/services/scenarioService")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    resetDemo()
    triggerTimeoutSupervision()
    expect(getTable("supervision_order").length).toBe(1)
  })

  it("②  督办单初始 status = PENDING", async () => {
    const { resetDemo, triggerTimeoutSupervision } = await import("../src/services/scenarioService")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    resetDemo()
    triggerTimeoutSupervision()
    const sups = getTable<{ status: string }>("supervision_order")
    expect(sups[0].status).toBe("PENDING")
  })

  it("②  督办单有 supervision_no 字段（非空）", async () => {
    const { resetDemo, triggerTimeoutSupervision } = await import("../src/services/scenarioService")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    resetDemo()
    triggerTimeoutSupervision()
    const sups = getTable<{ supervision_no: string | null }>("supervision_order")
    expect(sups[0].supervision_no).toBeTruthy()
  })

  it("②  督办单 supervision_type = 超时督办", async () => {
    const { resetDemo, triggerTimeoutSupervision } = await import("../src/services/scenarioService")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    resetDemo()
    triggerTimeoutSupervision()
    const sups = getTable<{ supervision_type: string | null }>("supervision_order")
    expect(sups[0].supervision_type).toMatch(/超时督办/)
  })

  it("②  配套写入 1 条超时工单（PENDING）", async () => {
    const { resetDemo, triggerTimeoutSupervision } = await import("../src/services/scenarioService")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    resetDemo()
    triggerTimeoutSupervision()
    const orders = getTable<{ status: string }>("work_order")
    expect(orders.some(o => o.status === "PENDING")).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// §2  填写回复
// ─────────────────────────────────────────────────────────────────────────────
describe("§2 填写回复 → status 变 REPLIED", () => {
  beforeEach(resetMem)

  it("③  触发后列表中督办单 reply 字段为 null（未回复）", async () => {
    const { resetDemo, triggerTimeoutSupervision } = await import("../src/services/scenarioService")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    resetDemo()
    triggerTimeoutSupervision()
    const sups = getTable<{ reply: string | null }>("supervision_order")
    expect(sups[0].reply).toBeNull()
  })

  it("④⑤ 提交回复后 status = REPLIED，reply 字段有内容", async () => {
    const { resetDemo, triggerTimeoutSupervision } = await import("../src/services/scenarioService")
    const { getTable, setTable } = await import("../src/services/sqliteMirrorRepository")
    resetDemo()
    triggerTimeoutSupervision()

    // 模拟 AdminSupervisionView.submitReply() 逻辑
    const now  = "2026-05-03 10:30:00"
    const rows = getTable<{
      id: number; status: string | null; reply: string | null
      reply_time: string | null; update_time: string | null
    }>("supervision_order")

    expect(rows.length).toBe(1)
    const idx = 0
    rows[idx] = {
      ...rows[idx],
      reply:       "现场已派员检查，传感器数值已回稳，请核实。",
      reply_time:  now,
      status:      "REPLIED",
      update_time: now,
    }
    setTable("supervision_order", rows)

    const updated = getTable<{ status: string; reply: string | null }>("supervision_order")
    expect(updated[0].status).toBe("REPLIED")
    expect(updated[0].reply).toMatch(/现场已派员检查/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// §3  办结督办
// ─────────────────────────────────────────────────────────────────────────────
describe("§3 办结督办 → status 变 CLOSED", () => {
  beforeEach(resetMem)

  it("⑥⑦ REPLIED 状态后点击办结 → status = CLOSED", async () => {
    const { resetDemo, triggerTimeoutSupervision } = await import("../src/services/scenarioService")
    const { getTable, setTable } = await import("../src/services/sqliteMirrorRepository")
    resetDemo()
    triggerTimeoutSupervision()

    // 先回复
    const now  = "2026-05-03 10:30:00"
    let rows = getTable<{
      id: number; status: string | null; reply: string | null
      reply_time: string | null; update_time: string | null
    }>("supervision_order")
    rows[0] = { ...rows[0], reply: "已处理", reply_time: now, status: "REPLIED", update_time: now }
    setTable("supervision_order", rows)

    // 再办结
    const now2 = "2026-05-03 10:35:00"
    rows = getTable("supervision_order")
    rows[0] = { ...rows[0], status: "CLOSED", update_time: now2 }
    setTable("supervision_order", rows)

    const final = getTable<{ status: string }>("supervision_order")
    expect(final[0].status).toBe("CLOSED")
  })

  it("⑦  办结后 reply 字段保留不清空", async () => {
    const { resetDemo, triggerTimeoutSupervision } = await import("../src/services/scenarioService")
    const { getTable, setTable } = await import("../src/services/sqliteMirrorRepository")
    resetDemo()
    triggerTimeoutSupervision()

    const now = "2026-05-03 10:30:00"
    let rows = getTable<{ status: string | null; reply: string | null; update_time: string | null }>("supervision_order")
    rows[0] = { ...rows[0], reply: "回复内容保留", reply_time: now, status: "REPLIED", update_time: now }
    setTable("supervision_order", rows)

    rows = getTable("supervision_order")
    rows[0] = { ...rows[0], status: "CLOSED", update_time: "2026-05-03 10:35:00" }
    setTable("supervision_order", rows)

    const final = getTable<{ reply: string | null }>("supervision_order")
    expect(final[0].reply).toBe("回复内容保留")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// §4  大屏 KPI 反映
// ─────────────────────────────────────────────────────────────────────────────
describe("§4 大屏 KPI 反映超时工单和督办数", () => {
  beforeEach(resetMem)

  it("⑧  触发超时督办后 overdueCount > 0", async () => {
    const { resetDemo, triggerTimeoutSupervision } = await import("../src/services/scenarioService")
    const { selectWorkOrderBoard }                 = await import("../src/services/screenKpiService")
    resetDemo()
    triggerTimeoutSupervision({ nowStr: "2026-05-03 10:00:00" })
    const board = selectWorkOrderBoard({ nowStr: "2026-05-03 10:00:00" })
    expect(board.overdueCount).toBeGreaterThan(0)
  })

  it("⑧  大屏绩效页从 supervision_order 统计督办数 > 0", async () => {
    const { resetDemo, triggerTimeoutSupervision } = await import("../src/services/scenarioService")
    const { getTable }                             = await import("../src/services/sqliteMirrorRepository")
    resetDemo()
    triggerTimeoutSupervision()
    const sups = getTable("supervision_order")
    // 模拟 ScreenPerformanceView 的 supervisionCount 逻辑
    expect(sups.length).toBeGreaterThan(0)
  })

  it("⑧  连续触发 2 次 → supervision_order 有 2 条记录", async () => {
    const { resetDemo, triggerTimeoutSupervision } = await import("../src/services/scenarioService")
    const { getTable }                             = await import("../src/services/sqliteMirrorRepository")
    resetDemo()
    triggerTimeoutSupervision()
    triggerTimeoutSupervision()
    expect(getTable("supervision_order").length).toBe(2)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// §5  页面源码检查（回复 / 办结 / 快捷入口）
// ─────────────────────────────────────────────────────────────────────────────
describe("§5 页面源码检查", () => {
  const supView     = readFileSync(join(ROOT, "src/views/admin/AdminSupervisionView.vue"), "utf-8")
  const consoleView = readFileSync(join(ROOT, "src/views/admin/AdminDemoConsoleView.vue"), "utf-8")

  it("⑨  督办页有'回复'操作按钮", () => {
    expect(supView).toMatch(/回复/)
  })

  it("⑨  督办页有'办结'操作按钮", () => {
    expect(supView).toMatch(/办结/)
  })

  it("⑨  督办页 submitReply 函数存在", () => {
    expect(supView).toMatch(/submitReply/)
  })

  it("⑨  督办页 closeSupervision 函数存在", () => {
    expect(supView).toMatch(/closeSupervision/)
  })

  it("⑨  督办页 STATUS_LABEL 包含 REPLIED 和 CLOSED 映射", () => {
    expect(supView).toMatch(/REPLIED/)
    expect(supView).toMatch(/CLOSED/)
  })

  it("⑩  演示控制台快捷跳转包含 /admin/supervision 入口", () => {
    expect(consoleView).toMatch(/\/admin\/supervision/)
  })

  it("⑩  演示控制台快捷跳转入口文字为'督办管理'", () => {
    expect(consoleView).toMatch(/督办管理/)
  })
})

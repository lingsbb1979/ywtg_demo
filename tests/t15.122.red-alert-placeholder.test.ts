/**
 * T15.122 TDD — 跑通红色告警占位（验收）
 *
 * 验收标准：
 *   可触发红色告警并跳转应急占位页
 *
 * 测试项：
 *   - triggerRedAlert() 写入 RED 级别 ACTIVE 告警到 alarm_record
 *   - triggerRedAlert() 写入 PENDING 工单到 work_order
 *   - ScreenEmergencyView.vue 文件存在（应急占位页）
 *   - 应急占位页有路由 /screen/emergency
 *   - 大屏页有跳转应急的入口（router-link 或条件渲染）
 */
import { describe, it, expect, beforeEach } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const projectRoot = process.cwd()
const MEM_KEY = "__ywtg_sqlite_mirror_store__"

function resetMem() {
  delete (globalThis as any)[MEM_KEY]
}

describe("T15.122 triggerRedAlert — 红色告警写入验证", () => {
  beforeEach(resetMem)

  it("triggerRedAlert() 写入 alarm_level=RED 的 ACTIVE 告警", async () => {
    const { resetDemo, triggerRedAlert } = await import("../src/services/scenarioService")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    resetDemo()
    triggerRedAlert()
    const alarms = getTable<{ alarm_level: string; status: string }>("alarm_record")
    const red = alarms.find((a) => a.alarm_level === "RED" && a.status === "ACTIVE")
    expect(red).toBeDefined()
  })

  it("triggerRedAlert() 写入 alarm_level=RED 的 PENDING 工单", async () => {
    const { resetDemo, triggerRedAlert } = await import("../src/services/scenarioService")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    resetDemo()
    triggerRedAlert()
    const orders = getTable<{ alarm_level: string; status: string }>("work_order")
    const pending = orders.find((o) => o.alarm_level === "RED" && o.status === "PENDING")
    expect(pending).toBeDefined()
  })

  it("重复触发 triggerRedAlert() 不应清空已有数据", async () => {
    const { resetDemo, triggerRedAlert } = await import("../src/services/scenarioService")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    resetDemo()
    const beforeCount = getTable<object>("alarm_record").length
    triggerRedAlert()
    triggerRedAlert()
    const afterCount = getTable<object>("alarm_record").length
    expect(afterCount).toBeGreaterThan(beforeCount)
  })
})

describe("T15.122 ScreenEmergencyView — 应急占位页存在", () => {
  it("ScreenEmergencyView.vue 文件应存在", () => {
    const { existsSync } = require("node:fs")
    expect(existsSync(join(projectRoot, "src", "views", "screen", "ScreenEmergencyView.vue"))).toBe(true)
  })

  it("应急占位页有红色告警相关文字或占位说明", () => {
    const src = readFileSync(
      join(projectRoot, "src", "views", "screen", "ScreenEmergencyView.vue"),
      "utf-8",
    )
    expect(src).toMatch(/emergency|应急|红色|RED|占位/)
  })
})

describe("T15.122 路由配置 — /screen/emergency 路由存在", () => {
  it("routes.ts 中有 /screen/emergency 路由", () => {
    const src = readFileSync(join(projectRoot, "src", "router", "routes.ts"), "utf-8")
    expect(src).toMatch(/screen\/emergency|screen.*emergency/)
  })
})

describe("T15.122 大屏 — 有跳转应急占位页的入口", () => {
  it("ScreenAlarmDispatchView.vue 或 ScreenHomeView.vue 有 emergency 入口", () => {
    const homeS = readFileSync(
      join(projectRoot, "src", "views", "screen", "ScreenHomeView.vue"),
      "utf-8",
    )
    const dispatchS = readFileSync(
      join(projectRoot, "src", "views", "screen", "ScreenAlarmDispatchView.vue"),
      "utf-8",
    )
    const combined = homeS + dispatchS
    expect(combined).toMatch(/emergency|应急/)
  })
})

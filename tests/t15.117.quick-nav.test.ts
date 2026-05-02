/**
 * T15.117 TDD — 演示快捷跳转
 *
 * 验收标准：
 *   - AdminDemoConsoleView.vue 存在 data-zone="shortcut" 区块
 *   - 包含打开大屏的链接（/screen/home 或 screen）
 *   - 包含打开 H5 的链接（/h5/work-orders 或 h5）
 *   - 包含打开当前工单详情的跳转逻辑（computed 或 动态路由 admin/work-orders/:id）
 *   - 包含 window.open 或 router-link/to 形式的导航
 *   - 包含告警中心跳转（/admin/alarms）
 */
import { describe, it, expect } from "vitest"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

const projectRoot = process.cwd()
const consolePath = join(
  projectRoot, "src", "views", "admin", "AdminDemoConsoleView.vue"
)

function src(): string {
  return readFileSync(consolePath, "utf-8")
}

// ── 文件存在 ─────────────────────────────────────────────────────────────────

describe("T15.117 AdminDemoConsoleView — 文件存在", () => {
  it("AdminDemoConsoleView.vue 文件应存在", () => {
    expect(existsSync(consolePath)).toBe(true)
  })
})

// ── 快捷跳转区 ────────────────────────────────────────────────────────────────

describe("T15.117 AdminDemoConsoleView — 快捷跳转区结构", () => {
  it("应包含 data-zone=\"shortcut\" 区块", () => {
    expect(src()).toContain('data-zone="shortcut"')
  })

  it("应包含打开大屏的链接（/screen/home 或 screen）", () => {
    expect(src()).toMatch(/\/screen\/home|screen-home/)
  })

  it("应包含打开 H5 的链接（/h5 路径）", () => {
    expect(src()).toMatch(/\/h5\/|h5-work-orders/)
  })

  it("应包含告警中心跳转（/admin/alarms）", () => {
    expect(src()).toContain("/admin/alarms")
  })

  it("应包含工单中心跳转（/admin/work-orders）", () => {
    expect(src()).toContain("/admin/work-orders")
  })

  it("应包含当前工单详情跳转逻辑（动态路由 work-orders/:id 或 currentOrderId）", () => {
    // 检查是否有动态跳转到特定工单详情的逻辑
    expect(src()).toMatch(
      /work-orders\/\$\{|work-orders\/:id|currentOrderId|latestOrderId|currentOrder|goToOrder/
    )
  })
})

// ── 脚本逻辑 ─────────────────────────────────────────────────────────────────

describe("T15.117 AdminDemoConsoleView — 快捷跳转脚本逻辑", () => {
  it("应包含 ref( 或 computed（响应式当前工单）", () => {
    expect(src()).toMatch(/ref\(|computed\(/)
  })

  it("应包含 window.open 或 router-link/router.push（导航方式）", () => {
    expect(src()).toMatch(/window\.open|router-link|router\.push|<router-link/)
  })
})

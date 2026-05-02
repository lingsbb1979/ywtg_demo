/**
 * T15.86 管理端演示控制台 /admin/demo-console
 *
 * 验收标准：可重置数据、触发橙色隐患、触发红色告警、触发超时督办
 *
 * 业务场景：
 * 演示准备：打开控制台 → 重置数据 → 逐步触发场景 → 验证数据变化
 *
 * 设计规范要求：
 * - 沿用 AdminDashboardView PC 管理端浅色企业主题
 * - pc-card / admin-card 卡片容器
 * - pc tokens（--pc-primary / --pc-bg-page / --pc-border）
 * - btn-pc-primary / btn-pc-secondary 按钮规范
 * - 场景引擎：resetDemo / triggerOrangeCrack / triggerRedAlert / triggerTimeoutSupervision
 * - 每个按钮有操作反馈（loading 状态 / 成功消息）
 * - SQLiteMirror：所有操作写入真实表
 *
 * 覆盖范围：
 * §1 路由与文件存在性
 * §2 页面布局结构
 * §3 重置数据区
 * §4 场景触发区
 * §5 快捷跳转区
 * §6 UI 规范符合性
 * §7 数据绑定与服务层
 */

import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "fs"
import { resolve } from "path"

const SRC    = resolve(__dirname, "../src")
const ROUTES = resolve(SRC, "router/routes.ts")

function getView() {
  return readFileSync(resolve(SRC, "views/admin/AdminDemoConsoleView.vue"), "utf-8")
}

describe("T15.86 管理端演示控制台 /admin/demo-console", () => {

  // ─────────────────────────────────────────
  // §1 路由与文件存在性
  // ─────────────────────────────────────────
  describe("路由与文件存在性", () => {
    it("AdminDemoConsoleView.vue 文件存在", () => {
      expect(existsSync(resolve(SRC, "views/admin/AdminDemoConsoleView.vue"))).toBe(true)
    })

    it("routes.ts 包含 /admin/demo-console 路由路径", () => {
      expect(readFileSync(ROUTES, "utf-8")).toMatch(/\/admin\/demo-console|admin-demo-console/)
    })

    it("routes.ts 引入 AdminDemoConsoleView", () => {
      expect(readFileSync(ROUTES, "utf-8")).toMatch(/AdminDemoConsoleView/)
    })

    it("页面包含低保真线框注释（T15.86 演示控制台）", () => {
      expect(getView()).toMatch(/T15\.86|demo-console|演示控制台/)
    })
  })

  // ─────────────────────────────────────────
  // §2 页面布局结构
  // ─────────────────────────────────────────
  describe("页面布局结构", () => {
    it("使用 pc-card 或 admin-card 卡片容器", () => {
      expect(getView()).toMatch(/pc-card|admin-card/)
    })

    it("使用 --pc-primary 或 pc tokens", () => {
      expect(getView()).toMatch(/--pc-primary|--pc-bg-page|--pc-border/)
    })

    it("包含页面标题（演示控制台）", () => {
      expect(getView()).toMatch(/演示控制台|demo.*console|Demo.*Console/)
    })

    it("使用 data-zone 属性标注功能区域", () => {
      expect(getView()).toMatch(/data-zone=/)
    })
  })

  // ─────────────────────────────────────────
  // §3 重置数据区
  // ─────────────────────────────────────────
  describe("重置数据区", () => {
    it("包含重置数据按钮", () => {
      expect(getView()).toMatch(/重置|reset|resetDemo/)
    })

    it("包含 data-zone=\"reset\" 或 reset 功能区", () => {
      expect(getView()).toMatch(/zone.*reset|reset.*zone|重置演示数据|resetDemo/)
    })

    it("调用 resetDemo 函数", () => {
      expect(getView()).toMatch(/resetDemo/)
    })

    it("重置按钮使用 btn-pc 样式", () => {
      expect(getView()).toMatch(/btn-pc-primary|btn-pc-secondary|btn-pc-danger/)
    })
  })

  // ─────────────────────────────────────────
  // §4 场景触发区
  // ─────────────────────────────────────────
  describe("场景触发区", () => {
    it("包含触发橙色裂缝按钮（triggerOrangeCrack）", () => {
      expect(getView()).toMatch(/triggerOrangeCrack|橙色.*裂缝|裂缝.*隐患|orange.*crack/i)
    })

    it("包含触发红色告警按钮（triggerRedAlert）", () => {
      expect(getView()).toMatch(/triggerRedAlert|红色.*告警|告警.*红色|red.*alert/i)
    })

    it("包含触发超时督办按钮（triggerTimeoutSupervision）", () => {
      expect(getView()).toMatch(/triggerTimeoutSupervision|超时.*督办|督办.*超时|timeout.*supervision/i)
    })

    it("包含模拟数据恢复按钮（simulateDataRecovery）", () => {
      expect(getView()).toMatch(/simulateDataRecovery|数据恢复|数据回稳|data.*recovery/i)
    })
  })

  // ─────────────────────────────────────────
  // §5 快捷跳转区
  // ─────────────────────────────────────────
  describe("快捷跳转区", () => {
    it("包含跳转到大屏的链接", () => {
      expect(getView()).toMatch(/\/screen\/home|screen.*home|打开大屏/)
    })

    it("包含跳转到 H5 的链接", () => {
      expect(getView()).toMatch(/\/h5\/work-orders|h5.*work.*orders|打开 H5|移动端/)
    })

    it("包含跳转到告警中心的链接", () => {
      expect(getView()).toMatch(/\/admin\/alarms|admin.*alarms|告警中心/)
    })
  })

  // ─────────────────────────────────────────
  // §6 UI 规范符合性
  // ─────────────────────────────────────────
  describe("UI 规范符合性", () => {
    it("按钮使用 btn-pc-primary 或 btn-pc-secondary 规范", () => {
      expect(getView()).toMatch(/btn-pc-primary|btn-pc-secondary/)
    })

    it("包含操作反馈机制（消息/状态/加载）", () => {
      expect(getView()).toMatch(/msg|message|feedback|loading|v-if.*success|success.*v-if|actionLog|操作日志/)
    })

    it("包含成功/危险操作颜色区分", () => {
      expect(getView()).toMatch(/btn-pc-danger|danger|var\(--color-danger|#EF4444|red|reset.*danger|danger.*reset/)
    })

    it("包含描述文字说明每个场景的效果", () => {
      expect(getView()).toMatch(/B003|B012|橙色裂缝|红色倾斜|超时督办|数据恢复/)
    })
  })

  // ─────────────────────────────────────────
  // §7 数据绑定与服务层
  // ─────────────────────────────────────────
  describe("数据绑定与服务层", () => {
    it("从 scenarioService 导入场景函数", () => {
      expect(getView()).toMatch(/scenarioService|from.*scenario/)
    })

    it("使用 ref() 或 reactive() 响应式状态", () => {
      expect(getView()).toMatch(/ref\(|reactive\(/)
    })

    it("包含当前 localStorage 状态展示（表记录数）", () => {
      expect(getView()).toMatch(/alarm_record|work_order|iot_space|getTable|localStorage/)
    })

    it("操作后刷新状态视图", () => {
      expect(getView()).toMatch(/loadStats|refresh|reloadStats|loadData|loadState|getTable\(/)
    })
  })
})

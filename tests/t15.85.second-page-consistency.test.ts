/**
 * T15.85 第二页一致性复核
 *
 * 验收标准：大屏、管理端、H5 第二页与 UI 规范一致，后续页面必须按规范扩展
 *
 * 背景：
 * 三端首屏（ScreenHomeView / AdminDashboardView / H5WorkOrdersView）已完成。
 * 第二页（ScreenAlarmDispatchView / AdminAlarmsView / H5WorkOrderDetailView）已实现。
 * 本测试集专注于复核三个第二页与设计规范的一致性，确保：
 *   1. 大屏第二页：沿用深色科技主题 + screen tokens
 *   2. 管理端第二页：沿用浅色企业主题 + pc tokens
 *   3. H5 第二页：沿用移动卡片主题 + h5 tokens
 *   4. 三端之间的公共设计语言一致（badge / risk-dot / tabular-nums）
 *
 * 覆盖范围：
 * §1 大屏第二页（ScreenAlarmDispatchView）规范符合性复核
 * §2 管理端第二页（AdminAlarmsView）规范符合性复核
 * §3 H5 第二页（H5WorkOrderDetailView）规范符合性复核
 * §4 三端公共设计语言一致性
 * §5 组件样式基座引用完整性
 */

import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "fs"
import { resolve } from "path"

const SRC    = resolve(__dirname, "../src")
const STYLES = resolve(SRC, "styles")

function getScreen2() {
  return readFileSync(resolve(SRC, "views/screen/ScreenAlarmDispatchView.vue"), "utf-8")
}
function getAdmin2() {
  return readFileSync(resolve(SRC, "views/admin/AdminAlarmsView.vue"), "utf-8")
}
function getH52() {
  return readFileSync(resolve(SRC, "views/h5/H5WorkOrderDetailView.vue"), "utf-8")
}

describe("T15.85 三端第二页一致性复核", () => {

  // ─────────────────────────────────────────
  // §1 大屏第二页（ScreenAlarmDispatchView）规范符合性复核
  // ─────────────────────────────────────────
  describe("大屏第二页（ScreenAlarmDispatchView）规范符合性", () => {
    it("大屏第二页文件存在", () => {
      expect(existsSync(resolve(SRC, "views/screen/ScreenAlarmDispatchView.vue"))).toBe(true)
    })

    it("大屏第二页使用 screen-glass-card 沿用首页玻璃卡片", () => {
      expect(getScreen2()).toMatch(/screen-glass-card/)
    })

    it("大屏第二页使用 --screen-bg-base 深色背景 token", () => {
      expect(getScreen2()).toMatch(/--screen-bg-base|#060D1F/)
    })

    it("大屏第二页使用 --screen-shadow-card 卡片阴影 token", () => {
      expect(getScreen2()).toMatch(/--screen-shadow-card/)
    })

    it("大屏第二页使用 --screen-border-glow 发光边框 token", () => {
      expect(getScreen2()).toMatch(/--screen-border-glow/)
    })
  })

  // ─────────────────────────────────────────
  // §2 管理端第二页（AdminAlarmsView）规范符合性复核
  // ─────────────────────────────────────────
  describe("管理端第二页（AdminAlarmsView）规范符合性", () => {
    it("管理端第二页文件存在", () => {
      expect(existsSync(resolve(SRC, "views/admin/AdminAlarmsView.vue"))).toBe(true)
    })

    it("管理端第二页使用 pc-card 或 admin-card 沿用工作台卡片", () => {
      expect(getAdmin2()).toMatch(/pc-card|admin-card/)
    })

    it("管理端第二页使用 admin-filter-tab 沿用工作台筛选标签", () => {
      expect(getAdmin2()).toMatch(/admin-filter-tab/)
    })

    it("管理端第二页使用 table-pc 表格规范", () => {
      expect(getAdmin2()).toMatch(/table-pc/)
    })

    it("管理端第二页包含 admin-drawer 详情抽屉（非新增全量页面）", () => {
      expect(getAdmin2()).toMatch(/admin-drawer/)
    })
  })

  // ─────────────────────────────────────────
  // §3 H5 第二页（H5WorkOrderDetailView）规范符合性复核
  // ─────────────────────────────────────────
  describe("H5 第二页（H5WorkOrderDetailView）规范符合性", () => {
    it("H5 第二页文件存在", () => {
      expect(existsSync(resolve(SRC, "views/h5/H5WorkOrderDetailView.vue"))).toBe(true)
    })

    it("H5 第二页使用 h5-header 沿用待办列表顶栏规范", () => {
      expect(getH52()).toMatch(/h5-header/)
    })

    it("H5 第二页使用 h5-card 或 h5-wo-card 沿用卡片规范", () => {
      expect(getH52()).toMatch(/h5-card|h5-wo-card|h5-detail/)
    })

    it("H5 第二页使用 --h5-primary 或 --h5-bg-card token", () => {
      expect(getH52()).toMatch(/--h5-primary|--h5-bg-card|--h5-border|h5-gradient/)
    })

    it("H5 第二页包含 h5-sla 或 SLA 相关展示", () => {
      expect(getH52()).toMatch(/h5-sla|SLA|sla/)
    })
  })

  // ─────────────────────────────────────────
  // §4 三端公共设计语言一致性
  // ─────────────────────────────────────────
  describe("三端公共设计语言一致性", () => {
    it("三端第二页均使用 badge 或 admin-badge 或 badge-screen 状态徽章", () => {
      expect(getScreen2()).toMatch(/badge-screen--|badge/)
      expect(getAdmin2()).toMatch(/admin-badge|badge/)
      expect(getH52()).toMatch(/badge/)
    })

    it("三端第二页均使用 risk-dot 风险等级颜色点", () => {
      expect(getScreen2()).toMatch(/risk-dot/)
      expect(getAdmin2()).toMatch(/risk-dot/)
      expect(getH52()).toMatch(/risk-dot/)
    })

    it("三端第二页均使用 tabular-nums 数字等宽", () => {
      expect(getScreen2()).toMatch(/tabular-nums/)
      expect(getAdmin2()).toMatch(/tabular-nums/)
      expect(getH52()).toMatch(/tabular-nums/)
    })

    it("三端第二页均使用 computed() 进行筛选/过滤计算", () => {
      expect(getScreen2()).toMatch(/computed\(/)
      expect(getAdmin2()).toMatch(/computed\(/)
      expect(getH52()).toMatch(/computed\(|getWorkOrder/)
    })

    it("三端第二页均从 SQLiteMirror 服务层读取数据", () => {
      expect(getScreen2()).toMatch(/alarmService|listAlarms/)
      expect(getAdmin2()).toMatch(/alarmService|listAlarms/)
      expect(getH52()).toMatch(/workOrderService|getWorkOrder/)
    })
  })

  // ─────────────────────────────────────────
  // §5 组件样式基座引用完整性
  // ─────────────────────────────────────────
  describe("组件样式基座引用完整性", () => {
    it("design-tokens.css 文件存在", () => {
      expect(existsSync(resolve(STYLES, "design-tokens.css"))).toBe(true)
    })

    it("components.css 文件存在（T15.81 样式基座）", () => {
      expect(existsSync(resolve(STYLES, "components.css"))).toBe(true)
    })

    it("main.css 引入 design-tokens.css", () => {
      const mainCss = readFileSync(resolve(STYLES, "main.css"), "utf-8")
      expect(mainCss).toMatch(/@import.*design-tokens/)
    })

    it("main.css 引入 components.css", () => {
      const mainCss = readFileSync(resolve(STYLES, "main.css"), "utf-8")
      expect(mainCss).toMatch(/@import.*components/)
    })

    it("大屏/管理端/H5 三端路由均已在 routes.ts 注册", () => {
      const routes = readFileSync(resolve(SRC, "router/routes.ts"), "utf-8")
      expect(routes).toMatch(/\/screen\/alarm-dispatch/)
      expect(routes).toMatch(/\/admin\/alarms/)
      expect(routes).toMatch(/\/h5\/work-orders\/:id|h5-work-order-detail/)
    })
  })
})

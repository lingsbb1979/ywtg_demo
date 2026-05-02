/**
 * T15.87 管理端工作台 /admin/dashboard
 *
 * 验收标准：展示今日告警、待办工单、重点隐患、演示快捷入口
 *
 * 业务场景：
 * 管理员登录后第一屏：一眼看到今日状态 → 直接操作告警/工单 → 快捷进入演示控制台
 *
 * 设计规范要求：
 * - 沿用 AdminDashboardView PC 管理端浅色企业主题
 * - pc-card / admin-card 卡片容器
 * - pc tokens（--pc-primary / --pc-bg-page / --pc-border）
 * - KPI 数字卡片（admin-kpi-card + tabular-nums）
 * - 工单看板（待处理/处理中/待核查/已销号）
 * - 告警/隐患清单（admin-hazard-list 或 admin-alarm-list）
 * - 演示控制台快捷入口（链接到 /admin/demo-console）
 * - 快速跳转到大屏、H5、告警中心、工单中心
 * - SQLiteMirror：从 screenKpiService + workOrderService 读取
 *
 * 覆盖范围：
 * §1 路由与文件存在性
 * §2 页面布局结构（KPI 卡片行）
 * §3 KPI 数字区（今日告警/待办工单/重点隐患/闭环率）
 * §4 工单看板区
 * §5 告警/隐患清单
 * §6 演示快捷入口（demo-control 区）
 * §7 UI 规范符合性
 * §8 数据绑定与服务层
 */

import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "fs"
import { resolve } from "path"

const SRC    = resolve(__dirname, "../src")
const ROUTES = resolve(SRC, "router/routes.ts")

function getView() {
  return readFileSync(resolve(SRC, "views/admin/AdminDashboardView.vue"), "utf-8")
}

describe("T15.87 管理端工作台 /admin/dashboard", () => {

  // ─────────────────────────────────────────
  // §1 路由与文件存在性
  // ─────────────────────────────────────────
  describe("路由与文件存在性", () => {
    it("AdminDashboardView.vue 文件存在", () => {
      expect(existsSync(resolve(SRC, "views/admin/AdminDashboardView.vue"))).toBe(true)
    })

    it("routes.ts 包含 /admin/dashboard 路由路径", () => {
      expect(readFileSync(ROUTES, "utf-8")).toMatch(/admin.*dashboard|dashboard.*admin/)
    })

    it("routes.ts 引入 AdminDashboardView", () => {
      expect(readFileSync(ROUTES, "utf-8")).toMatch(/AdminDashboardView/)
    })

    it("页面包含低保真线框注释或标识", () => {
      expect(getView()).toMatch(/T15\.73|T15\.74|T15\.87|admin.*dashboard|工作台/)
    })
  })

  // ─────────────────────────────────────────
  // §2 页面布局结构（KPI 卡片行）
  // ─────────────────────────────────────────
  describe("页面布局结构", () => {
    it("使用 pc-card 或 admin-card 卡片容器", () => {
      expect(getView()).toMatch(/pc-card|admin-card/)
    })

    it("使用 --pc-primary 等 pc tokens", () => {
      expect(getView()).toMatch(/--pc-primary|--pc-bg-page|--pc-border/)
    })

    it("包含 KPI 卡片行（admin-kpi-row 或 kpi-stats）", () => {
      expect(getView()).toMatch(/admin-kpi-row|kpi-row|kpi-stats|kpi.*card/)
    })

    it("使用 data-zone 属性标注功能区域", () => {
      expect(getView()).toMatch(/data-zone=/)
    })
  })

  // ─────────────────────────────────────────
  // §3 KPI 数字区
  // ─────────────────────────────────────────
  describe("KPI 数字区（今日告警/待办工单/重点隐患/闭环率）", () => {
    it("显示活跃告警数（activeAlarms 或 告警）", () => {
      expect(getView()).toMatch(/activeAlarms|活跃告警|今日告警/)
    })

    it("显示待处理工单数（pending 或 待处理工单）", () => {
      expect(getView()).toMatch(/待处理工单|board\.pending|pending.*工单/)
    })

    it("显示重点隐患数（openHazards 或 重点隐患）", () => {
      expect(getView()).toMatch(/openHazards|重点隐患|open.*hazard/i)
    })

    it("显示工单闭环率（closeRate）", () => {
      expect(getView()).toMatch(/closeRate|工单闭环率|闭环率/)
    })

    it("KPI 数字使用 tabular-nums 等宽字体", () => {
      expect(getView()).toMatch(/tabular-nums/)
    })
  })

  // ─────────────────────────────────────────
  // §4 工单看板区
  // ─────────────────────────────────────────
  describe("工单看板区（workorder-board）", () => {
    it("包含工单看板容器（workorder-board 或 wo-board）", () => {
      expect(getView()).toMatch(/workorder-board|wo.*board|admin-wo-board/)
    })

    it("展示待处理/处理中/待核查/已销号四个状态", () => {
      expect(getView()).toMatch(/待处理/)
      expect(getView()).toMatch(/处理中/)
      expect(getView()).toMatch(/待核查/)
      expect(getView()).toMatch(/已销号|已办结|已完成/)
    })

    it("工单数字使用 tabular-nums", () => {
      expect(getView()).toMatch(/tabular-nums/)
    })
  })

  // ─────────────────────────────────────────
  // §5 告警/隐患清单
  // ─────────────────────────────────────────
  describe("告警/隐患清单", () => {
    it("包含告警/隐患清单区域", () => {
      expect(getView()).toMatch(/alarm-list|hazard-list|admin-hazard|告警|隐患/)
    })

    it("告警/隐患使用 risk-dot 或风险点样式", () => {
      expect(getView()).toMatch(/risk-dot|admin-risk-dot|risk.*dot/)
    })

    it("显示风险等级徽章（badge 或 admin-badge）", () => {
      expect(getView()).toMatch(/badge|admin-badge/)
    })

    it("包含查看全部链接（跳转告警中心或工单中心）", () => {
      expect(getView()).toMatch(/\/admin\/alarms|\/admin\/work-orders|查看全部|查看工单/)
    })
  })

  // ─────────────────────────────────────────
  // §6 演示快捷入口（demo-control 区）
  // ─────────────────────────────────────────
  describe("演示快捷入口", () => {
    it("包含演示控制台入口链接", () => {
      expect(getView()).toMatch(/demo-console|demo.*control|演示控制台/)
    })

    it("包含跳转到大屏的链接", () => {
      expect(getView()).toMatch(/\/screen\/home|screen.*home|打开大屏/)
    })

    it("包含跳转到 H5 的链接", () => {
      expect(getView()).toMatch(/\/h5\/work-orders|h5.*work.*orders|打开 H5/)
    })

    it("演示入口使用 data-zone=\"demo-control\"", () => {
      expect(getView()).toMatch(/zone.*demo.*control|demo.*control.*zone|demo-control/)
    })
  })

  // ─────────────────────────────────────────
  // §7 UI 规范符合性
  // ─────────────────────────────────────────
  describe("UI 规范符合性", () => {
    it("包含 pc-card 卡片阴影 token（--pc-shadow-sm 或 pc-shadow）", () => {
      expect(getView()).toMatch(/--pc-shadow|pc-card|box-shadow/)
    })

    it("包含 admin-page-title 或页面标题样式", () => {
      expect(getView()).toMatch(/admin-page-title|page-title|工作台/)
    })

    it("卡片包含头部/标题区（admin-card__header 或 admin-card__title）", () => {
      expect(getView()).toMatch(/admin-card__header|admin-card__title|card.*header|card.*title/)
    })
  })

  // ─────────────────────────────────────────
  // §8 数据绑定与服务层
  // ─────────────────────────────────────────
  describe("数据绑定与服务层", () => {
    it("从 screenKpiService 导入 selectScreenKpi", () => {
      expect(getView()).toMatch(/selectScreenKpi|screenKpiService/)
    })

    it("使用 ref() 或 reactive() 响应式状态", () => {
      expect(getView()).toMatch(/ref\(|reactive\(/)
    })

    it("使用 onMounted 初始化数据", () => {
      expect(getView()).toMatch(/onMounted/)
    })

    it("包含工单看板选择器（selectWorkOrderBoard 或等价逻辑）", () => {
      expect(getView()).toMatch(/selectWorkOrderBoard|WorkOrderBoard|work.*order.*board/i)
    })
  })
})

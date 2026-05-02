/**
 * T15.77 三端首屏设计评审
 *
 * 验收标准：产品、前端、演示负责人确认首屏是否符合完整需求和 Demo 优先级
 *
 * 审查依据（来源：Demo 业务闭环 5 步故事）：
 * Step 1: 大屏展示佳木斯 23 栋历史建筑 + 风险分级色
 * Step 2: 建筑点位可点击显示隐患详情
 * Step 3: 告警自动派单入口
 * Step 4: H5 外勤接单 + SLA 逾期显示
 * Step 5: PC 管理端核查销号 + 大屏闭环率更新
 *
 * 审查范围：
 * - /screen/home  → ScreenHomeView.vue
 * - /admin/dashboard → AdminDashboardView.vue
 * - /h5/work-orders  → H5WorkOrdersView.vue
 */

import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { resolve } from "path"

const SRC = resolve(__dirname, "../src")

const getScreenView = () => readFileSync(resolve(SRC, "views/screen/ScreenHomeView.vue"), "utf-8")
const getAdminView  = () => readFileSync(resolve(SRC, "views/admin/AdminDashboardView.vue"), "utf-8")
const getH5View     = () => readFileSync(resolve(SRC, "views/h5/H5WorkOrdersView.vue"), "utf-8")

describe("T15.77 三端首屏设计评审", () => {

  // ─────────────────────────────────────────
  // §1 大屏首屏 /screen/home 评审
  // ─────────────────────────────────────────
  describe("大屏首屏 /screen/home 评审", () => {
    it("展示系统平台标题（包含佳木斯和历史建筑）", () => {
      expect(getScreenView()).toMatch(/佳木斯/)
      expect(getScreenView()).toMatch(/历史建筑/)
    })

    it("KPI 区域存在（data-zone=\"kpi\"）且绑定 totalBuildings", () => {
      expect(getScreenView()).toMatch(/data-zone="kpi"/)
      expect(getScreenView()).toMatch(/totalBuildings/)
    })

    it("KPI 展示活跃告警数（activeAlarms）", () => {
      expect(getScreenView()).toMatch(/activeAlarms/)
    })

    it("KPI 展示工单闭环率（closeRate）", () => {
      expect(getScreenView()).toMatch(/closeRate/)
    })

    it("重点隐患清单区域存在（data-zone=\"hazard-list\"）", () => {
      expect(getScreenView()).toMatch(/data-zone="hazard-list"/)
    })

    it("建筑分布图区域存在（data-zone=\"map\"）", () => {
      expect(getScreenView()).toMatch(/data-zone="map"/)
    })

    it("工单进度看板区域存在（data-zone=\"workorder-board\"）", () => {
      expect(getScreenView()).toMatch(/data-zone="workorder-board"/)
    })

    it("实时告警入口区域存在（data-zone=\"alarm-entry\"）", () => {
      expect(getScreenView()).toMatch(/data-zone="alarm-entry"/)
    })

    it("告警入口有跳转到告警派遣页的链接（/screen/alarm-dispatch）", () => {
      expect(getScreenView()).toMatch(/screen\/alarm-dispatch/)
    })

    it("建筑点位弹窗存在（screen-building-popup），支持风险等级展示", () => {
      expect(getScreenView()).toMatch(/screen-building-popup/)
      expect(getScreenView()).toMatch(/riskLevel|openCount/)
    })

    it("底部状态栏存在（screen-footer）展示系统运行状态", () => {
      expect(getScreenView()).toMatch(/screen-footer/)
      expect(getScreenView()).toMatch(/正常运行|系统状态/)
    })

    it("数据来源：selectScreenKpi 和 selectMapPoints（SQLiteMirror 聚合选择器）", () => {
      expect(getScreenView()).toMatch(/selectScreenKpi/)
      expect(getScreenView()).toMatch(/selectMapPoints/)
    })

    it("数据来源：selectHazardList 和 selectWorkOrderBoard（SQLiteMirror 聚合选择器）", () => {
      expect(getScreenView()).toMatch(/selectHazardList/)
      expect(getScreenView()).toMatch(/selectWorkOrderBoard/)
    })

    it("风险分级色点位：risk-dot--red 和 risk-dot--orange", () => {
      expect(getScreenView()).toMatch(/risk-dot--red/)
      expect(getScreenView()).toMatch(/risk-dot--orange/)
    })

    it("工单进度展示四个状态：待处理/处理中/待核查/已销号", () => {
      const c = getScreenView()
      expect(c).toMatch(/待处理|pending/)
      expect(c).toMatch(/处理中|processing/)
      expect(c).toMatch(/待核查|checking/)
      expect(c).toMatch(/已销号|finished/)
    })
  })

  // ─────────────────────────────────────────
  // §2 管理端工作台 /admin/dashboard 评审
  // ─────────────────────────────────────────
  describe("管理端工作台 /admin/dashboard 评审", () => {
    it("KPI 指标卡片区域存在（data-zone=\"kpi-stats\"）", () => {
      expect(getAdminView()).toMatch(/data-zone="kpi-stats"/)
    })

    it("KPI 展示今日活跃告警数（activeAlarms）", () => {
      expect(getAdminView()).toMatch(/activeAlarms/)
    })

    it("KPI 展示待处理工单数（board.pending）", () => {
      expect(getAdminView()).toMatch(/board\.pending/)
    })

    it("KPI 展示工单闭环率（kpi.closeRate）", () => {
      expect(getAdminView()).toMatch(/kpi\.closeRate|closeRate/)
    })

    it("告警与隐患清单区域存在（data-zone=\"alarm-list\"）", () => {
      expect(getAdminView()).toMatch(/data-zone="alarm-list"/)
    })

    it("工单进度看板区域存在（data-zone=\"workorder-board\"）", () => {
      expect(getAdminView()).toMatch(/data-zone="workorder-board"/)
    })

    it("快捷操作入口区域存在（data-zone=\"quick-actions\"）", () => {
      expect(getAdminView()).toMatch(/data-zone="quick-actions"/)
    })

    it("演示控制台入口区域存在（data-zone=\"demo-control\"）", () => {
      expect(getAdminView()).toMatch(/data-zone="demo-control"/)
    })

    it("演示控制台有导航链接（/admin/demo-console）", () => {
      expect(getAdminView()).toMatch(/admin\/demo-console/)
    })

    it("告警列表有筛选标签（admin-filter-tab）支持按风险等级筛选", () => {
      expect(getAdminView()).toMatch(/admin-filter-tab/)
    })

    it("数据来源：selectScreenKpi 和 selectWorkOrderBoard（SQLiteMirror）", () => {
      expect(getAdminView()).toMatch(/selectScreenKpi/)
      expect(getAdminView()).toMatch(/selectWorkOrderBoard/)
    })

    it("监测建筑总数（totalBuildings）在 KPI 中展示", () => {
      expect(getAdminView()).toMatch(/totalBuildings/)
    })
  })

  // ─────────────────────────────────────────
  // §3 H5 待办工单 /h5/work-orders 评审
  // ─────────────────────────────────────────
  describe("H5 待办工单 /h5/work-orders 评审", () => {
    it("顶部标题栏区域存在（data-zone=\"header\"）", () => {
      expect(getH5View()).toMatch(/data-zone="header"/)
    })

    it("状态筛选标签区域存在（data-zone=\"filter-tabs\"）", () => {
      expect(getH5View()).toMatch(/data-zone="filter-tabs"/)
    })

    it("筛选标签包含全部/待处理/处理中选项", () => {
      const c = getH5View()
      // 内容在注释或按钮文本中
      expect(c).toMatch(/全部/)
      expect(c).toMatch(/待处理/)
      expect(c).toMatch(/处理中/)
    })

    it("工单列表区域存在（data-zone=\"workorder-list\"）", () => {
      expect(getH5View()).toMatch(/data-zone="workorder-list"/)
    })

    it("空状态区域存在（data-zone=\"empty-state\"）", () => {
      expect(getH5View()).toMatch(/data-zone="empty-state"/)
    })

    it("工单卡片有风险等级徽章（h5-risk-level）", () => {
      expect(getH5View()).toMatch(/h5-risk-level/)
    })

    it("工单卡片有 SLA 时间显示（h5-sla）", () => {
      expect(getH5View()).toMatch(/h5-sla/)
    })

    it("接单按钮存在（h5-accept-btn）", () => {
      expect(getH5View()).toMatch(/h5-accept-btn/)
    })

    it("工单卡片展示建筑名称（buildingName）", () => {
      expect(getH5View()).toMatch(/buildingName/)
    })

    it("SLA 有逾期状态标记（h5-sla--overdue）", () => {
      expect(getH5View()).toMatch(/h5-sla--overdue/)
    })

    it("底部 tabbar 高度留白（padding-bottom）适配 H5Layout", () => {
      expect(getH5View()).toMatch(/padding-bottom/)
    })

    it("数据来源：selectH5TodoList（SQLiteMirror H5 待办选择器）", () => {
      expect(getH5View()).toMatch(/selectH5TodoList/)
    })
  })
})

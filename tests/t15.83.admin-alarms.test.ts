/**
 * T15.83 按规范设计 /admin/alarms（管理端第二页）
 *
 * 验收标准：管理端第二页沿用工作台规范，完成筛选、表格、详情抽屉、确认派单按钮样式
 *
 * 业务场景：
 * 演示步骤 4：管理员查看告警列表 → 点击告警 → 弹出详情抽屉 → 确认告警 → 派单
 *
 * 设计规范要求：
 * - 沿用 AdminDashboardView PC 管理端浅色企业主题
 * - pc-card / admin-card 卡片容器
 * - pc tokens（--pc-primary / --pc-bg-page / --pc-border / --pc-text-h1）
 * - 筛选标签（admin-filter-tab）+ 搜索输入框（input-pc）
 * - 告警表格（table-pc）含等级、状态、建筑、时间列
 * - 详情抽屉（admin-drawer）含确认告警/派单按钮
 * - 状态徽章（badge / admin-badge）
 * - 风险等级颜色点（risk-dot / admin-risk-dot）
 * - SQLiteMirror 数据：从 alarmService.listAlarms() 读取
 *
 * 覆盖范围：
 * §1 路由与文件存在性
 * §2 页面布局结构（沿用 PC 管理端规范）
 * §3 筛选区域（状态筛选标签 + 搜索 + 等级筛选）
 * §4 告警表格（table-pc 含必要列）
 * §5 详情抽屉（admin-drawer + 操作按钮）
 * §6 UI 规范符合性（tokens / 徽章 / 风险点 / 按钮）
 * §7 数据绑定与服务层
 */

import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "fs"
import { resolve } from "path"

const SRC    = resolve(__dirname, "../src")
const ROUTES = resolve(SRC, "router/routes.ts")

function getAlarmsView() {
  return readFileSync(resolve(SRC, "views/admin/AdminAlarmsView.vue"), "utf-8")
}

describe("T15.83 管理端告警中心 /admin/alarms", () => {

  // ─────────────────────────────────────────
  // §1 路由与文件存在性
  // ─────────────────────────────────────────
  describe("路由与文件存在性", () => {
    it("AdminAlarmsView.vue 文件存在", () => {
      expect(existsSync(resolve(SRC, "views/admin/AdminAlarmsView.vue"))).toBe(true)
    })

    it("routes.ts 包含 /admin/alarms 路由路径", () => {
      expect(readFileSync(ROUTES, "utf-8")).toMatch(/\/admin\/alarms|admin-alarms/)
    })

    it("routes.ts 引入 AdminAlarmsView", () => {
      expect(readFileSync(ROUTES, "utf-8")).toMatch(/AdminAlarmsView/)
    })

    it("页面包含低保真线框注释（告警中心 wireframe）", () => {
      expect(getAlarmsView()).toMatch(/T15\.83|admin.*alarms|告警中心|告警列表/)
    })
  })

  // ─────────────────────────────────────────
  // §2 页面布局结构（沿用 PC 管理端规范）
  // ─────────────────────────────────────────
  describe("页面布局结构（沿用 PC 管理端规范）", () => {
    it("使用 pc-card 或 admin-card 卡片容器", () => {
      expect(getAlarmsView()).toMatch(/pc-card|admin-card/)
    })

    it("使用 --pc-primary 或 --pc-bg-page token", () => {
      expect(getAlarmsView()).toMatch(/--pc-primary|--pc-bg-page|--pc-border/)
    })

    it("包含页面标题（告警中心/告警列表）", () => {
      expect(getAlarmsView()).toMatch(/告警中心|告警列表|告警管理/)
    })

    it("使用 data-zone 属性标注功能区域", () => {
      expect(getAlarmsView()).toMatch(/data-zone/)
    })
  })

  // ─────────────────────────────────────────
  // §3 筛选区域（状态筛选标签 + 搜索）
  // ─────────────────────────────────────────
  describe("筛选区域", () => {
    it("包含状态筛选标签（admin-filter-tab）", () => {
      expect(getAlarmsView()).toMatch(/admin-filter-tab/)
    })

    it("筛选标签包含全部/红色/橙色等选项", () => {
      expect(getAlarmsView()).toMatch(/全部|RED|ORANGE|橙色/)
    })

    it("包含搜索输入框（input-pc 或 admin-search-input）", () => {
      expect(getAlarmsView()).toMatch(/input-pc|admin-search-input|search/)
    })

    it("包含 admin-table-filter-tabs 或 admin-table-toolbar", () => {
      expect(getAlarmsView()).toMatch(/admin-table-filter-tabs|admin-table-toolbar/)
    })

    it("筛选支持告警等级筛选（alarmLevel / alarm_level）", () => {
      expect(getAlarmsView()).toMatch(/alarmLevel|alarm_level|alarmLevel|level/)
    })
  })

  // ─────────────────────────────────────────
  // §4 告警表格（table-pc 含必要列）
  // ─────────────────────────────────────────
  describe("告警表格（table-pc）", () => {
    it("包含 table-pc 表格类", () => {
      expect(getAlarmsView()).toMatch(/table-pc/)
    })

    it("表格包含风险等级列（risk-dot 或 badge）", () => {
      expect(getAlarmsView()).toMatch(/risk-dot|admin-risk-dot|badge/)
    })

    it("表格包含告警状态列（badge 类）", () => {
      expect(getAlarmsView()).toMatch(/admin-badge|badge.*status|status.*badge/)
    })

    it("表格包含建筑名称列（buildingName）", () => {
      expect(getAlarmsView()).toMatch(/buildingName|building_name|建筑/)
    })

    it("表格包含时间列（triggerTime 或 createTime）", () => {
      expect(getAlarmsView()).toMatch(/triggerTime|createTime|trigger_time|create_time|时间/)
    })

    it("包含 tabular-nums 数字等宽", () => {
      expect(getAlarmsView()).toMatch(/tabular-nums/)
    })
  })

  // ─────────────────────────────────────────
  // §5 详情抽屉（admin-drawer + 操作按钮）
  // ─────────────────────────────────────────
  describe("详情抽屉（admin-drawer）", () => {
    it("包含 admin-drawer 抽屉容器类", () => {
      expect(getAlarmsView()).toMatch(/admin-drawer/)
    })

    it("抽屉包含关闭功能（v-if 或 visible 控制）", () => {
      expect(getAlarmsView()).toMatch(/drawerVisible|showDrawer|v-if.*drawer|drawer.*v-if/)
    })

    it("包含确认告警按钮（confirmAlarm 相关）", () => {
      expect(getAlarmsView()).toMatch(/confirmAlarm|确认告警|confirm.*alarm/i)
    })

    it("包含派单按钮（dispatchAlarm 相关）", () => {
      expect(getAlarmsView()).toMatch(/dispatchAlarm|dispatch|派单/)
    })

    it("抽屉按钮使用 btn-pc-primary 或 btn-pc-secondary", () => {
      expect(getAlarmsView()).toMatch(/btn-pc-primary|btn-pc-secondary/)
    })
  })

  // ─────────────────────────────────────────
  // §6 UI 规范符合性（tokens / 徽章 / 风险点 / 按钮）
  // ─────────────────────────────────────────
  describe("UI 规范符合性", () => {
    it("使用 admin-badge 或 badge 状态徽章类", () => {
      expect(getAlarmsView()).toMatch(/admin-badge|badge/)
    })

    it("使用风险颜色点（risk-dot）", () => {
      expect(getAlarmsView()).toMatch(/risk-dot/)
    })

    it("使用 --pc-shadow-sm 或 pc-card 阴影", () => {
      expect(getAlarmsView()).toMatch(/--pc-shadow-sm|--pc-shadow|pc-card/)
    })

    it("包含 admin-detail-grid 或 admin-detail-item 详情展示", () => {
      expect(getAlarmsView()).toMatch(/admin-detail-grid|admin-detail-item|detail-field|detail-grid/)
    })

    it("使用 admin-timeline 或时间轴展示处置状态", () => {
      expect(getAlarmsView()).toMatch(/admin-timeline|timeline/)
    })
  })

  // ─────────────────────────────────────────
  // §7 数据绑定与服务层
  // ─────────────────────────────────────────
  describe("数据绑定与服务层", () => {
    it("从 alarmService 导入 listAlarms", () => {
      expect(getAlarmsView()).toMatch(/listAlarms|alarmService/)
    })

    it("使用 ref() 或 reactive() 响应式状态", () => {
      expect(getAlarmsView()).toMatch(/ref\(|reactive\(/)
    })

    it("使用 computed() 计算筛选列表", () => {
      expect(getAlarmsView()).toMatch(/computed\(/)
    })

    it("包含 selectedAlarm 或 currentAlarm 当前选中告警", () => {
      expect(getAlarmsView()).toMatch(/selectedAlarm|currentAlarm|activeAlarm/)
    })

    it("confirmAlarm 调用 update 更新 alarm_record 状态", () => {
      expect(getAlarmsView()).toMatch(/update.*alarm_record|alarm_record.*update|update\(.*alarm/)
    })
  })
})

/**
 * T15.75 H5 待办工单第一版低保真布局定型
 *
 * 验收标准：确定待办工单列表、风险等级、SLA、接单入口、底部导航结构
 *
 * 低保真版面关系（390px × 844px 竖屏）：
 * ┌─────────── zone:header ─────────────────┐
 * │ sticky header: 工单数量 + 筛选入口        │
 * ├─────────── zone:filter-tabs ────────────┤
 * │ 全部 │ 待处理 │ 处理中（状态筛选标签）     │
 * ├─────────── zone:workorder-list ─────────┤
 * │  [card: 风险等级 · 建筑 · 告警]           │
 * │  [SLA 派单时间 · 接单按钮]                │
 * │  [card: ...]                             │
 * │  ...                                     │
 * ├─────────── zone:empty-state ────────────┤
 * │  📭 暂无待处理工单                        │
 * └─────────────────────────────────────────┘
 * （底部 tabbar 由 H5Layout 提供，不在本视图中）
 */

import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { resolve } from "path"

const SRC = resolve(__dirname, "../src")

function getViewContent() {
  return readFileSync(resolve(SRC, "views/h5/H5WorkOrdersView.vue"), "utf-8")
}

describe("T15.75 H5 待办工单第一版低保真布局定型", () => {
  // ─────────────────────────────────────────
  // §1 视图文件存在性
  // ─────────────────────────────────────────
  describe("视图文件", () => {
    it("src/views/h5/H5WorkOrdersView.vue 文件存在", () => {
      expect(() => getViewContent()).not.toThrow()
    })
  })

  // ─────────────────────────────────────────
  // §2 低保真四区布局（data-zone 标注）
  // ─────────────────────────────────────────
  describe("低保真四区布局", () => {
    it('页面顶部区域标注 data-zone="header"', () => {
      expect(getViewContent()).toMatch(/data-zone="header"/)
    })

    it('筛选标签区域标注 data-zone="filter-tabs"', () => {
      expect(getViewContent()).toMatch(/data-zone="filter-tabs"/)
    })

    it('工单列表区域标注 data-zone="workorder-list"', () => {
      expect(getViewContent()).toMatch(/data-zone="workorder-list"/)
    })

    it('空状态区域标注 data-zone="empty-state"', () => {
      expect(getViewContent()).toMatch(/data-zone="empty-state"/)
    })

    it("四个 data-zone 区域同时存在于同一视图文件", () => {
      const content = getViewContent()
      expect(content).toMatch(/data-zone="header"/)
      expect(content).toMatch(/data-zone="filter-tabs"/)
      expect(content).toMatch(/data-zone="workorder-list"/)
      expect(content).toMatch(/data-zone="empty-state"/)
    })
  })

  // ─────────────────────────────────────────
  // §3 版面注解（低保真约束）
  // ─────────────────────────────────────────
  describe("版面关系结构注解", () => {
    it("视图包含低保真版面注解（wireframe 关键字）", () => {
      expect(getViewContent()).toMatch(/低保真|wireframe|版面关系|lofi/i)
    })

    it("header 区域在 filter-tabs 之前", () => {
      const content = getViewContent()
      const headerIdx     = content.indexOf('data-zone="header"')
      const filterTabsIdx = content.indexOf('data-zone="filter-tabs"')
      expect(headerIdx).toBeGreaterThanOrEqual(0)
      expect(filterTabsIdx).toBeGreaterThan(headerIdx)
    })

    it("filter-tabs 区域在 workorder-list 之前", () => {
      const content = getViewContent()
      const filterTabsIdx    = content.indexOf('data-zone="filter-tabs"')
      const workorderListIdx = content.indexOf('data-zone="workorder-list"')
      expect(filterTabsIdx).toBeGreaterThanOrEqual(0)
      expect(workorderListIdx).toBeGreaterThan(filterTabsIdx)
    })

    it("workorder-list 区域在 empty-state 之前", () => {
      const content = getViewContent()
      const listIdx  = content.indexOf('data-zone="workorder-list"')
      const emptyIdx = content.indexOf('data-zone="empty-state"')
      expect(listIdx).toBeGreaterThanOrEqual(0)
      expect(emptyIdx).toBeGreaterThan(listIdx)
    })
  })

  // ─────────────────────────────────────────
  // §4 筛选标签（filter-tabs）内容
  // ─────────────────────────────────────────
  describe("筛选标签区（filter-tabs）", () => {
    it("筛选标签有全部选项", () => {
      const content = getViewContent()
      const filterIdx = content.indexOf('data-zone="filter-tabs"')
      const snippet   = content.slice(filterIdx, filterIdx + 400)
      expect(snippet).toMatch(/全部|all/i)
    })

    it("筛选标签有待处理选项", () => {
      const content = getViewContent()
      const filterIdx = content.indexOf('data-zone="filter-tabs"')
      const snippet   = content.slice(filterIdx, filterIdx + 400)
      expect(snippet).toMatch(/待处理|PENDING/i)
    })

    it("筛选标签有处理中选项", () => {
      const content = getViewContent()
      const filterIdx = content.indexOf('data-zone="filter-tabs"')
      const snippet   = content.slice(filterIdx, filterIdx + 400)
      expect(snippet).toMatch(/处理中|PROCESSING/i)
    })
  })

  // ─────────────────────────────────────────
  // §5 工单列表区（workorder-list）内容
  // ─────────────────────────────────────────
  describe("工单列表区（workorder-list）", () => {
    it("工单卡片展示风险等级（h5-risk-level）", () => {
      expect(getViewContent()).toMatch(/h5-risk-level/)
    })

    it("工单卡片展示建筑名称", () => {
      expect(getViewContent()).toMatch(/buildingName|建筑/)
    })

    it("工单卡片展示 SLA 派单时间（h5-sla）", () => {
      expect(getViewContent()).toMatch(/h5-sla/)
    })

    it("工单列表有接单按钮（h5-accept-btn）", () => {
      expect(getViewContent()).toMatch(/h5-accept-btn/)
    })
  })

  // ─────────────────────────────────────────
  // §6 空状态（empty-state）内容
  // ─────────────────────────────────────────
  describe("空状态区（empty-state）", () => {
    it("空状态有暂无工单提示文字", () => {
      const content    = getViewContent()
      const emptyIdx   = content.indexOf('data-zone="empty-state"')
      const snippet    = content.slice(emptyIdx, emptyIdx + 300)
      expect(snippet).toMatch(/暂无|empty|无待处理/i)
    })
  })

  // ─────────────────────────────────────────
  // §7 数据绑定验证
  // ─────────────────────────────────────────
  describe("数据绑定", () => {
    it("视图绑定 todoList 工单列表数据", () => {
      expect(getViewContent()).toMatch(/todoList/)
    })

    it("视图使用 selectH5TodoList 服务", () => {
      expect(getViewContent()).toMatch(/selectH5TodoList/)
    })
  })
})

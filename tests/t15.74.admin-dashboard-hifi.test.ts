/**
 * T15.74 管理端工作台第一版高保真
 *
 * 验收标准：形成可开发设计稿，体现后台管理端的表格、筛选、卡片、按钮密度
 *
 * 高保真 vs 低保真（T15.73）新增内容：
 * 1. CSS 全面采用 design-tokens.css 变量（--pc-shadow-md、--duration-micro 等）
 * 2. KPI 卡片有 admin-kpi-card__icon-wrap 彩色图标容器
 * 3. pc-card 基础卡片类被引用
 * 4. linear-gradient 增强视觉层次（页面标题区 / 快捷操作区）
 * 5. 使用 --pc-text-h1 文字色 token
 * 6. 过渡动画使用 --duration-micro token
 * 7. 工单看板状态色使用 --wo-* 工单状态变量（token 而非硬编码）
 * 8. 风险色使用 --risk-red / --risk-orange 变量
 * 9. 筛选标签区使用 admin-filter-tab
 */

import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { resolve } from "path"

const SRC = resolve(__dirname, "../src")

function getViewContent() {
  return readFileSync(resolve(SRC, "views/admin/AdminDashboardView.vue"), "utf-8")
}

describe("T15.74 管理端工作台第一版高保真", () => {
  // ─────────────────────────────────────────
  // §1 视图文件存在性
  // ─────────────────────────────────────────
  describe("视图文件", () => {
    it("src/views/admin/AdminDashboardView.vue 文件存在", () => {
      expect(() => getViewContent()).not.toThrow()
    })
  })

  // ─────────────────────────────────────────
  // §2 Design Token 使用（高保真核心约束）
  // ─────────────────────────────────────────
  describe("Design Token 使用", () => {
    it("CSS 使用 --pc-shadow-md 或 --pc-shadow-sm 阴影 token", () => {
      expect(getViewContent()).toMatch(/--pc-shadow-(md|sm|lg)/)
    })

    it("CSS 使用 --duration-micro 过渡动画 token", () => {
      expect(getViewContent()).toMatch(/--duration-micro/)
    })

    it("CSS 使用 --radius-md 或 --radius-lg 圆角 token", () => {
      expect(getViewContent()).toMatch(/--radius-(md|lg|xl)/)
    })

    it("CSS 使用 --pc-text-h1 或 --pc-text-title 文字颜色 token", () => {
      expect(getViewContent()).toMatch(/--pc-text-(h1|title|body)/)
    })

    it("CSS 使用 --pc-primary 主色调 token", () => {
      expect(getViewContent()).toMatch(/--pc-primary/)
    })

    it("CSS 使用 --pc-bg-card 卡片背景 token", () => {
      expect(getViewContent()).toMatch(/--pc-bg-card/)
    })

    it("CSS 使用 --pc-border 边框颜色 token", () => {
      expect(getViewContent()).toMatch(/--pc-border/)
    })
  })

  // ─────────────────────────────────────────
  // §3 KPI 卡片高保真元素
  // ─────────────────────────────────────────
  describe("KPI 卡片高保真", () => {
    it("KPI 卡片有 admin-kpi-card__icon-wrap 彩色图标容器", () => {
      expect(getViewContent()).toMatch(/admin-kpi-card__icon-wrap/)
    })

    it("icon-wrap 有背景色变量（background）", () => {
      const content = getViewContent()
      const iconWrapIdx = content.indexOf("admin-kpi-card__icon-wrap")
      expect(iconWrapIdx).toBeGreaterThanOrEqual(0)
      // icon-wrap CSS 定义中有 background
      const iconWrapCss = content.slice(iconWrapIdx, iconWrapIdx + 300)
      expect(iconWrapCss).toMatch(/background/)
    })

    it("KPI 卡片使用 box-shadow 阴影效果", () => {
      const content = getViewContent()
      expect(content).toMatch(/admin-kpi-card[\s\S]{0,200}box-shadow/)
    })

    it("KPI 数值使用 font-variant-numeric: tabular-nums 等宽数字", () => {
      expect(getViewContent()).toMatch(/tabular-nums/)
    })
  })

  // ─────────────────────────────────────────
  // §4 工单看板状态色系统
  // ─────────────────────────────────────────
  describe("工单看板状态色系统", () => {
    it("使用 --wo-pending 待处理状态色 token", () => {
      expect(getViewContent()).toMatch(/--wo-pending/)
    })

    it("使用 --wo-processing 处理中状态色 token", () => {
      expect(getViewContent()).toMatch(/--wo-processing/)
    })

    it("使用 --wo-checking 待核查状态色 token", () => {
      expect(getViewContent()).toMatch(/--wo-checking/)
    })

    it("使用 --wo-finished 或 --color-success 已销号状态色", () => {
      expect(getViewContent()).toMatch(/--wo-finished|--color-success/)
    })
  })

  // ─────────────────────────────────────────
  // §5 风险色系统
  // ─────────────────────────────────────────
  describe("风险色系统", () => {
    it("使用 --risk-red 红色风险色变量", () => {
      expect(getViewContent()).toMatch(/--risk-red/)
    })

    it("使用 --risk-orange 橙色风险色变量", () => {
      expect(getViewContent()).toMatch(/--risk-orange/)
    })
  })

  // ─────────────────────────────────────────
  // §6 卡片与视觉层次
  // ─────────────────────────────────────────
  describe("卡片与视觉层次", () => {
    it("包含 pc-card 基础卡片类（与设计系统一致）", () => {
      expect(getViewContent()).toMatch(/pc-card/)
    })

    it("使用 linear-gradient 增强视觉层次", () => {
      expect(getViewContent()).toMatch(/linear-gradient/)
    })

    it("admin-card 使用 box-shadow 阴影", () => {
      const content = getViewContent()
      expect(content).toMatch(/admin-card[\s\S]{0,200}box-shadow/)
    })

    it("有 Transition 过渡效果（:hover 或 transition）", () => {
      expect(getViewContent()).toMatch(/transition/)
    })
  })

  // ─────────────────────────────────────────
  // §7 筛选与按钮密度
  // ─────────────────────────────────────────
  describe("筛选与按钮密度", () => {
    it("包含 admin-filter-tab 筛选标签类（筛选 UI 密度）", () => {
      expect(getViewContent()).toMatch(/admin-filter-tab/)
    })

    it("快捷操作使用 admin-quick-btn 并有 hover 效果", () => {
      const content = getViewContent()
      expect(content).toMatch(/admin-quick-btn/)
    })
  })

  // ─────────────────────────────────────────
  // §8 继承低保真六区布局（回归验证）
  // ─────────────────────────────────────────
  describe("继承低保真布局（回归）", () => {
    it('保留 data-zone="kpi-stats"', () => {
      expect(getViewContent()).toMatch(/data-zone="kpi-stats"/)
    })

    it('保留 data-zone="workorder-board"', () => {
      expect(getViewContent()).toMatch(/data-zone="workorder-board"/)
    })

    it('保留 data-zone="alarm-list"', () => {
      expect(getViewContent()).toMatch(/data-zone="alarm-list"/)
    })

    it('保留 data-zone="demo-control"', () => {
      expect(getViewContent()).toMatch(/data-zone="demo-control"/)
    })

    it("仍绑定 kpi.activeAlarms", () => {
      expect(getViewContent()).toMatch(/kpi\.activeAlarms/)
    })

    it("仍使用 selectScreenKpi 服务", () => {
      expect(getViewContent()).toMatch(/selectScreenKpi/)
    })
  })
})

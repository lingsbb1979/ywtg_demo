/**
 * T15.81 落地前端样式基座
 *
 * 验收标准：把设计规范转成 CSS 变量、主题 token、基础组件样式和页面布局约束
 *
 * 输出物：
 * - source/src/styles/components.css（基础组件样式，来自三端样式指南）
 * - source/src/styles/main.css 中 @import components.css
 *
 * 覆盖范围：
 * §1 文件存在性
 * §2 大屏端组件样式（screen-kpi-card / screen-section-title / screen-building-item / screen-timeline）
 * §3 大屏端布局样式（screen-root / screen-header / screen-main / screen-panel / screen-footer）
 * §4 PC 管理端组件样式（admin-sidebar / admin-nav-item / admin-topbar / admin-card / admin-kpi-card）
 * §5 H5 移动端组件样式（h5-header / h5-tabbar / h5-card / h5-tabbar-item）
 * §6 通用按钮（btn-screen-primary / btn-pc-primary / btn-pc-secondary）
 * §7 页面布局约束（大屏 1920×1080 / PC 200px 侧边栏 / H5 max-width 414px）
 */

import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "fs"
import { resolve } from "path"

const STYLES = resolve(__dirname, "../src/styles")

function getComponents() {
  return readFileSync(resolve(STYLES, "components.css"), "utf-8")
}

function getMainCss() {
  return readFileSync(resolve(STYLES, "main.css"), "utf-8")
}

describe("T15.81 落地前端样式基座", () => {

  // ─────────────────────────────────────────
  // §1 文件存在性
  // ─────────────────────────────────────────
  describe("文件存在性", () => {
    it("source/src/styles/components.css 文件存在", () => {
      expect(existsSync(resolve(STYLES, "components.css"))).toBe(true)
    })

    it("source/src/styles/main.css 通过 @import 引入 components.css", () => {
      expect(getMainCss()).toMatch(/@import.*components/)
    })
  })

  // ─────────────────────────────────────────
  // §2 大屏端组件样式
  // ─────────────────────────────────────────
  describe("大屏端组件样式", () => {
    it(".screen-kpi-card 类存在（大屏 KPI 卡片）", () => {
      expect(getComponents()).toMatch(/\.screen-kpi-card/)
    })

    it(".screen-kpi-card__value 类存在（KPI 数值样式）", () => {
      expect(getComponents()).toMatch(/\.screen-kpi-card__value/)
    })

    it(".screen-kpi-card__label 类存在（KPI 标签样式）", () => {
      expect(getComponents()).toMatch(/\.screen-kpi-card__label/)
    })

    it(".screen-section-title 类存在（大屏区块标题）", () => {
      expect(getComponents()).toMatch(/\.screen-section-title/)
    })

    it(".screen-section-title__icon 类存在（标题装饰竖条）", () => {
      expect(getComponents()).toMatch(/\.screen-section-title__icon/)
    })

    it(".screen-section-title__text 类存在（标题文字）", () => {
      expect(getComponents()).toMatch(/\.screen-section-title__text/)
    })

    it(".screen-building-item 类存在（建筑风险列表项）", () => {
      expect(getComponents()).toMatch(/\.screen-building-item/)
    })

    it(".screen-building-item__rank 类存在（排名数字）", () => {
      expect(getComponents()).toMatch(/\.screen-building-item__rank/)
    })

    it(".screen-building-item__name 类存在（建筑名称）", () => {
      expect(getComponents()).toMatch(/\.screen-building-item__name/)
    })

    it(".screen-timeline 类存在（底部告警时间轴）", () => {
      expect(getComponents()).toMatch(/\.screen-timeline/)
    })

    it(".screen-timeline-item 类存在（时间轴节点）", () => {
      expect(getComponents()).toMatch(/\.screen-timeline-item/)
    })

    it("大屏 KPI 数值使用 --screen-cyan token（青色数据高亮）", () => {
      expect(getComponents()).toMatch(/--screen-cyan/)
    })

    it("大屏区块标题使用 linear-gradient 渐变竖线装饰", () => {
      expect(getComponents()).toMatch(/linear-gradient/)
    })
  })

  // ─────────────────────────────────────────
  // §3 大屏端布局样式
  // ─────────────────────────────────────────
  describe("大屏端布局样式", () => {
    it(".screen-root 类存在（大屏根容器 1920×1080）", () => {
      expect(getComponents()).toMatch(/\.screen-root/)
    })

    it(".screen-header 类存在（顶部标题栏 60px）", () => {
      expect(getComponents()).toMatch(/\.screen-header/)
    })

    it(".screen-main 类存在（三列网格主区域）", () => {
      expect(getComponents()).toMatch(/\.screen-main/)
    })

    it(".screen-panel 类存在（左右面板）", () => {
      expect(getComponents()).toMatch(/\.screen-panel/)
    })

    it(".screen-footer 类存在（底部状态栏 72px）", () => {
      expect(getComponents()).toMatch(/\.screen-footer/)
    })

    it("大屏根容器宽度为 1920px（固定全屏基准）", () => {
      expect(getComponents()).toMatch(/1920px/)
    })

    it("大屏根容器高度为 1080px", () => {
      expect(getComponents()).toMatch(/1080px/)
    })

    it("大屏顶部栏使用 linear-gradient 渐变背景（科技感）", () => {
      // screen-header 的背景渐变
      expect(getComponents()).toMatch(/screen-header[\s\S]{0,500}linear-gradient|linear-gradient[\s\S]{0,500}screen-bg-panel/)
    })

    it("大屏主区域使用三列 grid（260px + 1fr + 280px）", () => {
      expect(getComponents()).toMatch(/260px.*1fr.*280px|grid-template-columns.*260/)
    })
  })

  // ─────────────────────────────────────────
  // §4 PC 管理端组件样式
  // ─────────────────────────────────────────
  describe("PC 管理端组件样式", () => {
    it(".admin-sidebar 类存在（PC 侧边栏 200px）", () => {
      expect(getComponents()).toMatch(/\.admin-sidebar/)
    })

    it(".admin-nav-item 类存在（导航菜单项）", () => {
      expect(getComponents()).toMatch(/\.admin-nav-item/)
    })

    it(".admin-nav-item--active 类存在（激活导航项）", () => {
      expect(getComponents()).toMatch(/\.admin-nav-item--active/)
    })

    it(".admin-topbar 类存在（顶部工具栏）", () => {
      expect(getComponents()).toMatch(/\.admin-topbar/)
    })

    it(".admin-card 类存在（PC 数据卡片）", () => {
      expect(getComponents()).toMatch(/\.admin-card/)
    })

    it("PC 侧边栏使用 --pc-bg-sidebar token", () => {
      expect(getComponents()).toMatch(/--pc-bg-sidebar/)
    })

    it("PC 卡片使用 --pc-shadow-sm 或 --pc-shadow-md", () => {
      const c = getComponents()
      expect(c).toMatch(/--pc-shadow-sm|--pc-shadow-md/)
    })

    it("PC 导航项高度为 44px（最小触控区域）", () => {
      expect(getComponents()).toMatch(/44px/)
    })
  })

  // ─────────────────────────────────────────
  // §5 H5 移动端组件样式
  // ─────────────────────────────────────────
  describe("H5 移动端组件样式", () => {
    it(".h5-header 类存在（H5 顶部栏）", () => {
      expect(getComponents()).toMatch(/\.h5-header/)
    })

    it(".h5-header 使用渐变背景（135deg 蓝色渐变）", () => {
      expect(getComponents()).toMatch(/h5-header[\s\S]{0,300}135deg|h5-gradient-banner/)
    })

    it(".h5-tabbar 类存在（H5 底部导航）", () => {
      expect(getComponents()).toMatch(/\.h5-tabbar/)
    })

    it(".h5-tabbar-item 类存在（底部导航项）", () => {
      expect(getComponents()).toMatch(/\.h5-tabbar-item/)
    })

    it(".h5-tabbar-item--active 类存在（激活底部导航项）", () => {
      expect(getComponents()).toMatch(/\.h5-tabbar-item--active/)
    })

    it(".h5-card 类存在（H5 内容卡片）", () => {
      expect(getComponents()).toMatch(/\.h5-card/)
    })

    it("H5 底部导航高度使用 --h5-tabbar-height token", () => {
      expect(getComponents()).toMatch(/--h5-tabbar-height/)
    })

    it("H5 顶部栏高度使用 --h5-header-height token", () => {
      expect(getComponents()).toMatch(/--h5-header-height/)
    })
  })

  // ─────────────────────────────────────────
  // §6 通用按钮样式
  // ─────────────────────────────────────────
  describe("通用按钮样式", () => {
    it(".btn-screen-primary 类存在（大屏主按钮）", () => {
      expect(getComponents()).toMatch(/\.btn-screen-primary/)
    })

    it(".btn-pc-primary 类存在（PC 主按钮）", () => {
      expect(getComponents()).toMatch(/\.btn-pc-primary/)
    })

    it(".btn-pc-secondary 类存在（PC 次级按钮）", () => {
      expect(getComponents()).toMatch(/\.btn-pc-secondary/)
    })

    it("大屏主按钮使用 linear-gradient 渐变背景", () => {
      expect(getComponents()).toMatch(/btn-screen-primary[\s\S]{0,200}linear-gradient/)
    })
  })

  // ─────────────────────────────────────────
  // §7 页面布局约束
  // ─────────────────────────────────────────
  describe("页面布局约束", () => {
    it("大屏根容器固定为 1920×1080 基准（transform-origin: top left）", () => {
      expect(getComponents()).toMatch(/transform-origin.*top left|top left/)
    })

    it("PC 侧边栏默认宽度 200px，折叠后 56px", () => {
      const c = getComponents()
      expect(c).toMatch(/200px/)
      expect(c).toMatch(/56px/)
    })

    it("H5 页面设置 touch-action: manipulation（防止双击缩放）", () => {
      expect(getComponents()).toMatch(/touch-action.*manipulation|manipulation/)
    })
  })
})

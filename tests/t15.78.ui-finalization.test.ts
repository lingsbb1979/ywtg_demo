/**
 * T15.78 三端首屏设计定型
 *
 * 验收标准：根据评审修改首屏，冻结第一版视觉方向和交互模式
 *
 * 定型内容（来源：设计评审结论）：
 * 1. 三端统一主色 #1B6FE8（--screen-primary / --pc-primary / --h5-primary）
 * 2. 大屏：深色科技主题（--screen-bg-base、screen-glass-card、linear-gradient、--screen-shadow-card）
 * 3. 管理端：浅色企业主题（--pc-bg-page、pc-card、--pc-shadow-sm/md、--pc-text-h1）
 * 4. H5：移动卡片主题（--h5-bg-page、linear-gradient banner、max-width: 414px、--h5-touch-min）
 * 5. 动画：--duration-micro token（管理端/H5 已用，大屏过渡已有）
 * 6. 数字显示：tabular-nums 等宽规范
 * 7. 数据来源：三端均从 screenKpiService 聚合选择器读取
 * 8. 版面关系：data-zone 区域标注冻结
 */

import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { resolve } from "path"

const SRC = resolve(__dirname, "../src")

const getScreenView = () => readFileSync(resolve(SRC, "views/screen/ScreenHomeView.vue"), "utf-8")
const getAdminView  = () => readFileSync(resolve(SRC, "views/admin/AdminDashboardView.vue"), "utf-8")
const getH5View     = () => readFileSync(resolve(SRC, "views/h5/H5WorkOrdersView.vue"), "utf-8")

describe("T15.78 三端首屏设计定型", () => {

  // ─────────────────────────────────────────
  // §1 三端统一主色冻结
  // ─────────────────────────────────────────
  describe("三端统一主色 #1B6FE8", () => {
    it("大屏引用主色变量（--screen-primary 或 #1B6FE8）", () => {
      expect(getScreenView()).toMatch(/--screen-primary|#1B6FE8/i)
    })

    it("管理端引用主色变量（--pc-primary 或 #1B6FE8）", () => {
      expect(getAdminView()).toMatch(/--pc-primary|#1B6FE8/i)
    })

    it("H5 引用主色变量（--h5-primary 或 #1B6FE8）", () => {
      expect(getH5View()).toMatch(/--h5-primary|#1B6FE8/i)
    })
  })

  // ─────────────────────────────────────────
  // §2 大屏视觉方向冻结（深色科技主题）
  // ─────────────────────────────────────────
  describe("大屏视觉方向冻结（深色科技主题）", () => {
    it("大屏使用深色背景变量（--screen-bg-base 或 #060D1F）", () => {
      expect(getScreenView()).toMatch(/--screen-bg-base|#060D1F/i)
    })

    it("大屏使用玻璃卡片工具类（screen-glass-card）", () => {
      expect(getScreenView()).toMatch(/screen-glass-card/)
    })

    it("大屏顶部标题栏使用 linear-gradient 渐变（科技感）", () => {
      expect(getScreenView()).toMatch(/linear-gradient/)
    })

    it("大屏使用 --screen-text-h2 文字 token", () => {
      expect(getScreenView()).toMatch(/--screen-text-h2/)
    })

    it("大屏边框使用 --screen-border-glow 光效 token", () => {
      expect(getScreenView()).toMatch(/--screen-border-glow/)
    })

    it("大屏玻璃卡片使用 --screen-shadow-card 阴影 token（高保真定型）", () => {
      // 大屏 screen-glass-card 或 screen-panel 应使用 --screen-shadow-card 阴影 token
      expect(getScreenView()).toMatch(/--screen-shadow-card/)
    })

    it("大屏青色调使用 --screen-cyan token", () => {
      expect(getScreenView()).toMatch(/--screen-cyan/)
    })

    it("大屏工单状态色使用 --wo-* token", () => {
      const c = getScreenView()
      expect(c).toMatch(/--wo-pending|--wo-processing|--wo-checking|--wo-finished/)
    })
  })

  // ─────────────────────────────────────────
  // §3 管理端视觉方向冻结（浅色企业主题）
  // ─────────────────────────────────────────
  describe("管理端视觉方向冻结（浅色企业主题）", () => {
    it("管理端使用 --pc-bg-page 背景变量", () => {
      expect(getAdminView()).toMatch(/--pc-bg-page/)
    })

    it("管理端使用 pc-card 基础卡片类", () => {
      expect(getAdminView()).toMatch(/pc-card/)
    })

    it("管理端使用 --pc-shadow-sm 阴影 token", () => {
      expect(getAdminView()).toMatch(/--pc-shadow-sm/)
    })

    it("管理端使用 --pc-shadow-md 阴影 token（悬停强化）", () => {
      expect(getAdminView()).toMatch(/--pc-shadow-md/)
    })

    it("管理端使用 --pc-text-h1 主标题文字 token", () => {
      expect(getAdminView()).toMatch(/--pc-text-h1/)
    })

    it("管理端使用 --duration-micro 动画 token（冻结交互节奏）", () => {
      expect(getAdminView()).toMatch(/--duration-micro/)
    })

    it("管理端标题区使用 linear-gradient 视觉增强", () => {
      expect(getAdminView()).toMatch(/linear-gradient/)
    })

    it("管理端 KPI 卡片有彩色图标容器（admin-kpi-card__icon-wrap）", () => {
      expect(getAdminView()).toMatch(/admin-kpi-card__icon-wrap/)
    })
  })

  // ─────────────────────────────────────────
  // §4 H5 视觉方向冻结（移动卡片主题）
  // ─────────────────────────────────────────
  describe("H5 视觉方向冻结（移动卡片主题）", () => {
    it("H5 使用 --h5-bg-page 背景变量", () => {
      expect(getH5View()).toMatch(/--h5-bg-page/)
    })

    it("H5 使用 --h5-shadow-card 阴影 token", () => {
      expect(getH5View()).toMatch(/--h5-shadow-card/)
    })

    it("H5 header 使用 linear-gradient 渐变蓝（移动端 banner 规范）", () => {
      expect(getH5View()).toMatch(/linear-gradient/)
    })

    it("H5 布局约束 max-width: 414px（移动端宽度规范）", () => {
      expect(getH5View()).toMatch(/max-width.*414px|414px/)
    })

    it("H5 接单按钮使用 min-height: var(--h5-touch-min) 触控规范（44px）", () => {
      expect(getH5View()).toMatch(/--h5-touch-min/)
    })

    it("H5 卡片边框使用 --h5-border token", () => {
      expect(getH5View()).toMatch(/--h5-border/)
    })

    it("H5 主文字使用 --h5-text-h1 token", () => {
      expect(getH5View()).toMatch(/--h5-text-h1/)
    })
  })

  // ─────────────────────────────────────────
  // §5 交互模式一致性冻结
  // ─────────────────────────────────────────
  describe("交互模式一致性冻结", () => {
    it("大屏使用 tabular-nums 等宽数字", () => {
      expect(getScreenView()).toMatch(/tabular-nums/)
    })

    it("管理端使用 tabular-nums 等宽数字", () => {
      expect(getAdminView()).toMatch(/tabular-nums/)
    })

    it("H5 使用 tabular-nums 等宽数字", () => {
      expect(getH5View()).toMatch(/tabular-nums/)
    })

    it("三端数据来源统一：均从 screenKpiService 聚合选择器读取", () => {
      expect(getScreenView()).toMatch(/screenKpiService/)
      expect(getAdminView()).toMatch(/screenKpiService/)
      expect(getH5View()).toMatch(/screenKpiService/)
    })

    it("大屏版面关系冻结：data-zone kpi + map 区域标注", () => {
      const c = getScreenView()
      expect(c).toMatch(/data-zone="kpi"/)
      expect(c).toMatch(/data-zone="map"/)
    })

    it("管理端版面关系冻结：data-zone kpi-stats + alarm-list", () => {
      const c = getAdminView()
      expect(c).toMatch(/data-zone="kpi-stats"/)
      expect(c).toMatch(/data-zone="alarm-list"/)
    })

    it("H5 版面关系冻结：data-zone header + workorder-list", () => {
      const c = getH5View()
      expect(c).toMatch(/data-zone="header"/)
      expect(c).toMatch(/data-zone="workorder-list"/)
    })

    it("大屏有 Transition 弹窗动画（建筑详情 Popup）", () => {
      expect(getScreenView()).toMatch(/<Transition/)
    })

    it("大屏使用 badge-screen 系列大屏专属徽章类", () => {
      expect(getScreenView()).toMatch(/badge-screen--red|badge-screen--orange/)
    })
  })
})

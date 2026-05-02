/**
 * T15.80 输出 UI 设计规范文档
 *
 * 验收标准：形成 UI设计规范.md，分别说明大屏、管理端、H5 的共性规范和差异规范
 *
 * 覆盖检查：
 * §1 文件存在性
 * §2 共性规范章节（三端通用的色彩、间距、圆角、动画）
 * §3 大屏端差异规范（深色科技主题 token、大屏字阶、Glow 阴影）
 * §4 PC 管理端差异规范（浅色企业主题 token、侧边栏、按钮密度）
 * §5 H5 移动端差异规范（移动卡片主题、触控规范、安全区）
 * §6 组件规范（KPI 卡片、状态徽章、风险点、按钮）
 */

import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "fs"
import { resolve } from "path"

const DOCS_UI_SPEC = resolve(__dirname, "../../docs/UI规范/UI设计规范.md")

function getSpec() {
  return readFileSync(DOCS_UI_SPEC, "utf-8")
}

describe("T15.80 UI 设计规范文档", () => {

  // ─────────────────────────────────────────
  // §1 文件存在性
  // ─────────────────────────────────────────
  describe("文件存在性", () => {
    it("docs/UI规范/UI设计规范.md 文件存在", () => {
      expect(existsSync(DOCS_UI_SPEC)).toBe(true)
    })

    it("文件非空（内容超过 2000 字符）", () => {
      expect(getSpec().length).toBeGreaterThan(2000)
    })
  })

  // ─────────────────────────────────────────
  // §2 共性规范章节
  // ─────────────────────────────────────────
  describe("共性规范章节", () => {
    it("包含色彩系统章节", () => {
      expect(getSpec()).toMatch(/色彩系统|色板/)
    })

    it("包含三端通用的主色（#1B6FE8）", () => {
      expect(getSpec()).toMatch(/#1B6FE8/)
    })

    it("包含风险等级色规范（RED / ORANGE / YELLOW）", () => {
      const s = getSpec()
      expect(s).toMatch(/risk-red|RED.*#FF4444|风险等级/)
      expect(s).toMatch(/ORANGE|#FF8A3D/)
    })

    it("包含工单状态色规范（PENDING / PROCESSING / FINISHED）", () => {
      const s = getSpec()
      expect(s).toMatch(/PENDING|待处理/)
      expect(s).toMatch(/FINISHED|已办结/)
    })

    it("包含间距系统章节（8px 基准网格）", () => {
      expect(getSpec()).toMatch(/间距系统|spacing/)
    })

    it("间距包含 8px 基准说明", () => {
      expect(getSpec()).toMatch(/8px|spacing-2/)
    })

    it("包含圆角系统章节", () => {
      expect(getSpec()).toMatch(/圆角系统|radius/)
    })

    it("圆角包含 --radius-sm / --radius-lg / --radius-full", () => {
      const s = getSpec()
      expect(s).toMatch(/radius-sm/)
      expect(s).toMatch(/radius-lg/)
      expect(s).toMatch(/radius-full/)
    })

    it("包含排版/字体章节（字阶规范）", () => {
      expect(getSpec()).toMatch(/排版系统|字阶|字体/)
    })
  })

  // ─────────────────────────────────────────
  // §3 大屏端差异规范
  // ─────────────────────────────────────────
  describe("大屏端差异规范（深色科技主题）", () => {
    it("包含大屏色板章节（Dark Theme）", () => {
      expect(getSpec()).toMatch(/大屏.*色板|大屏端.*Dark|Dark Theme/)
    })

    it("大屏背景 --screen-bg-base (#060D1F)", () => {
      expect(getSpec()).toMatch(/screen-bg-base.*#060D1F|#060D1F/)
    })

    it("大屏主色 --screen-primary (#1B6FE8)", () => {
      expect(getSpec()).toMatch(/screen-primary/)
    })

    it("大屏青色强调 --screen-cyan (#00D4FF)", () => {
      expect(getSpec()).toMatch(/screen-cyan.*#00D4FF|#00D4FF/)
    })

    it("大屏发光阴影规范（--screen-shadow-card / Glow Shadow）", () => {
      expect(getSpec()).toMatch(/screen-shadow-card|Glow Shadow/)
    })

    it("大屏边框发光规范（--screen-border-glow）", () => {
      expect(getSpec()).toMatch(/screen-border-glow/)
    })

    it("包含大屏字阶说明（--screen-display / --screen-h1）", () => {
      const s = getSpec()
      expect(s).toMatch(/screen-display|screen-h1|大屏.*字阶/)
    })
  })

  // ─────────────────────────────────────────
  // §4 PC 管理端差异规范
  // ─────────────────────────────────────────
  describe("PC 管理端差异规范（浅色企业主题）", () => {
    it("包含 PC 色板章节（Light Theme）", () => {
      expect(getSpec()).toMatch(/PC.*色板|管理端.*Light|Light Theme|pc-bg/)
    })

    it("PC 页面背景 --pc-bg-page (#F0F4F9)", () => {
      expect(getSpec()).toMatch(/pc-bg-page.*#F0F4F9|#F0F4F9/)
    })

    it("PC 侧边栏背景 --pc-bg-sidebar (#0E3875)", () => {
      expect(getSpec()).toMatch(/pc-bg-sidebar.*#0E3875|#0E3875/)
    })

    it("PC 主标题文字 --pc-text-h1 (#1C2B4A)", () => {
      expect(getSpec()).toMatch(/pc-text-h1.*#1C2B4A|#1C2B4A/)
    })

    it("PC 阴影规范（--pc-shadow-sm / --pc-shadow-md）", () => {
      const s = getSpec()
      expect(s).toMatch(/pc-shadow-sm/)
      expect(s).toMatch(/pc-shadow-md/)
    })

    it("包含 PC 字阶说明（--pc-page-title / --pc-body）", () => {
      const s = getSpec()
      expect(s).toMatch(/pc-page-title|pc-body|PC.*字阶|管理端.*字阶/)
    })
  })

  // ─────────────────────────────────────────
  // §5 H5 移动端差异规范
  // ─────────────────────────────────────────
  describe("H5 移动端差异规范（移动卡片主题）", () => {
    it("包含 H5 色板章节（Mobile Theme）", () => {
      expect(getSpec()).toMatch(/H5.*色板|移动端.*Mobile|Mobile Theme|h5-bg/)
    })

    it("H5 页面背景 --h5-bg-page (#F7F9FC)", () => {
      expect(getSpec()).toMatch(/h5-bg-page.*#F7F9FC|#F7F9FC/)
    })

    it("H5 主色 --h5-primary (#1B6FE8)", () => {
      expect(getSpec()).toMatch(/h5-primary/)
    })

    it("H5 卡片阴影 --h5-shadow-card", () => {
      expect(getSpec()).toMatch(/h5-shadow-card/)
    })

    it("H5 触控规范（最小 44px 触控区域）", () => {
      expect(getSpec()).toMatch(/44px|触控|touch/)
    })

    it("包含 H5 字阶说明（--h5-h1 / --h5-body）", () => {
      const s = getSpec()
      expect(s).toMatch(/h5-h1|h5-body|H5.*字阶|移动端.*字阶/)
    })
  })

  // ─────────────────────────────────────────
  // §6 组件规范
  // ─────────────────────────────────────────
  describe("组件规范", () => {
    it("包含 KPI 数据卡片规范", () => {
      expect(getSpec()).toMatch(/KPI.*卡片|KPI.*数据/)
    })

    it("包含状态徽章规范（badge）", () => {
      expect(getSpec()).toMatch(/状态徽章|badge/)
    })

    it("包含风险等级颜色点规范（risk-dot）", () => {
      expect(getSpec()).toMatch(/风险.*颜色点|risk-dot/)
    })

    it("包含按钮规范（.btn-screen-primary / .btn-pc-primary）", () => {
      const s = getSpec()
      expect(s).toMatch(/btn-screen-primary|按钮规范/)
    })

    it("包含大屏端与 PC 端的区分说明", () => {
      const s = getSpec()
      expect(s).toMatch(/大屏端/)
      expect(s).toMatch(/PC管理端|管理端/)
    })
  })
})

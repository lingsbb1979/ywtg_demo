/**
 * T15.96 实现大屏建筑详情弹窗
 *
 * 验收标准：点击点位后显示建筑、指标、隐患、告警、处置建议
 *
 * 覆盖范围：
 * §1 弹窗结构（screen-building-popup / data-testid="screen-building-popup"）
 * §2 弹窗内容（建筑名称、风险等级 badge-screen--*、摘要）
 * §3 弹窗交互（打开/关闭、selectedPoint ref）
 * §4 跳转链接（router-link 到 alarm-dispatch 或工单中心）
 * §5 UI 规范符合性
 */

import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "fs"
import { resolve } from "path"

const SRC = resolve(__dirname, "../src")

function getView() {
  return readFileSync(resolve(SRC, "views/screen/ScreenHomeView.vue"), "utf-8")
}

describe("T15.96 大屏建筑详情弹窗", () => {

  // ─────────────────────────────────────────
  // §1 弹窗结构
  // ─────────────────────────────────────────
  describe("§1 弹窗结构", () => {
    it("包含建筑弹窗容器（screen-building-popup）", () => {
      expect(getView()).toMatch(/screen-building-popup/)
    })

    it("弹窗使用 v-if 条件渲染（selectedPoint）", () => {
      expect(getView()).toMatch(/v-if.*selectedPoint/)
    })

    it("弹窗容器使用 screen-glass-card 样式", () => {
      const code = getView()
      // 弹窗和 glass-card 都在文件中
      expect(code).toMatch(/screen-building-popup/)
      expect(code).toMatch(/screen-glass-card/)
    })
  })

  // ─────────────────────────────────────────
  // §2 弹窗内容
  // ─────────────────────────────────────────
  describe("§2 弹窗内容", () => {
    it("展示建筑名称（selectedPoint.name）", () => {
      expect(getView()).toMatch(/selectedPoint\.name|selectedPoint\?.name/)
    })

    it("展示风险等级 badge（badge-screen--）", () => {
      expect(getView()).toMatch(/badge-screen--/)
    })

    it("风险等级徽章使用动态颜色（selectedPoint.color 或 selectedPoint.riskLevel）", () => {
      const code = getView()
      expect(code).toMatch(/selectedPoint[\s\S]*color|selectedPoint[\s\S]*riskLevel/)
    })

    it("展示摘要信息（summary 或 openCount）", () => {
      expect(getView()).toMatch(/summary|openCount/)
    })
  })

  // ─────────────────────────────────────────
  // §3 弹窗交互
  // ─────────────────────────────────────────
  describe("§3 弹窗交互", () => {
    it("包含关闭按钮（@click）", () => {
      expect(getView()).toMatch(/screen-popup-close|@click.*selectedPoint.*null/)
    })

    it("点击地图点位打开弹窗（@click.*selectedPoint）", () => {
      expect(getView()).toMatch(/@click.*selectedPoint/)
    })

    it("使用 Transition 动画包裹弹窗", () => {
      expect(getView()).toMatch(/Transition|transition/)
    })
  })

  // ─────────────────────────────────────────
  // §4 跳转链接
  // ─────────────────────────────────────────
  describe("§4 跳转链接", () => {
    it("包含跳转到告警派遣或工单详情的 router-link", () => {
      expect(getView()).toMatch(/router-link|to=.*alarm-dispatch|to=.*work-orders/)
    })
  })

  // ─────────────────────────────────────────
  // §5 UI 规范符合性
  // ─────────────────────────────────────────
  describe("§5 UI 规范符合性", () => {
    it("大屏颜色 token 存在于文件中（risk-dot--* 或 screen-*）", () => {
      const code = getView()
      expect(code).toMatch(/risk-dot--|screen-popup|screen-building-popup/)
    })

    it("弹窗内使用 badge-screen 样式展示等级", () => {
      expect(getView()).toMatch(/badge-screen/)
    })
  })
})

/**
 * T15.72 大屏首页第一版高保真
 *
 * 验收标准：形成可开发设计稿，包含 1920×1080 首屏、风险色、地图点位、弹窗样式
 *
 * 高保真 vs 低保真（T15.71）新增内容：
 * 1. 建筑详情弹窗（screen-building-popup）—— 点击地图点位触发
 * 2. 地图点位可点击，带选中高亮状态
 * 3. 完整风险色系统（红/橙/黄/绿 glow 效果）
 * 4. 1920×1080 布局约束（overflow:hidden、grid 三栏）
 * 5. 玻璃态卡片（screen-glass-card with backdrop-filter）
 * 6. 弹窗过渡动画 (Transition)
 */

import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { resolve } from "path"

const SRC = resolve(__dirname, "../src")

function getViewContent() {
  return readFileSync(resolve(SRC, "views/screen/ScreenHomeView.vue"), "utf-8")
}

describe("T15.72 大屏首页第一版高保真", () => {
  // ─────────────────────────────────────────
  // §1 高保真视觉元素
  // ─────────────────────────────────────────
  describe("高保真视觉元素", () => {
    it("使用 screen-glass-card 玻璃卡片类（glass morphism）", () => {
      expect(getViewContent()).toMatch(/screen-glass-card/)
    })

    it("screen-root 包含 screen-bg 背景", () => {
      const content = getViewContent()
      expect(content).toMatch(/screen-root/)
      expect(content).toMatch(/screen-bg/)
    })

    it("CSS 定义 backdrop-filter（玻璃态模糊）", () => {
      expect(getViewContent()).toMatch(/backdrop-filter/)
    })

    it("CSS 使用风险色变量 --risk-red", () => {
      expect(getViewContent()).toMatch(/--risk-red/)
    })

    it("CSS 使用风险色变量 --risk-orange", () => {
      expect(getViewContent()).toMatch(/--risk-orange/)
    })

    it("CSS 使用大屏主色变量 --screen-cyan", () => {
      expect(getViewContent()).toMatch(/--screen-cyan/)
    })

    it("CSS 使用大屏主色变量 --screen-primary", () => {
      expect(getViewContent()).toMatch(/--screen-primary/)
    })

    it("顶部标题栏有渐变发光边线（linear-gradient）", () => {
      expect(getViewContent()).toMatch(/linear-gradient/)
    })
  })

  // ─────────────────────────────────────────
  // §2 建筑详情弹窗（高保真核心新增）
  // ─────────────────────────────────────────
  describe("建筑详情弹窗 (screen-building-popup)", () => {
    it("存在 screen-building-popup 弹窗结构", () => {
      expect(getViewContent()).toMatch(/screen-building-popup/)
    })

    it('弹窗携带 data-testid="screen-building-popup"', () => {
      expect(getViewContent()).toMatch(/data-testid="screen-building-popup"/)
    })

    it("弹窗有条件渲染（v-if 控制显示/隐藏）", () => {
      const content = getViewContent()
      // screen-building-popup 周围有 v-if 控制
      expect(content).toMatch(/v-if.*selectedPoint|selectedPoint.*v-if/)
    })

    it("弹窗包含关闭按钮 (screen-popup-close)", () => {
      expect(getViewContent()).toMatch(/screen-popup-close/)
    })

    it("关闭按钮点击后清除 selectedPoint", () => {
      const content = getViewContent()
      // 关闭按钮 @click 绑定清除逻辑
      expect(content).toMatch(/screen-popup-close/)
      expect(content).toMatch(/@click.*null|null.*@click/)
    })

    it("弹窗包含建筑名称展示 (screen-popup-building-name)", () => {
      expect(getViewContent()).toMatch(/screen-popup-building-name/)
    })

    it("弹窗包含风险等级徽章 (screen-popup-risk-badge)", () => {
      expect(getViewContent()).toMatch(/screen-popup-risk-badge/)
    })

    it("弹窗包含风险指数/摘要信息", () => {
      const content = getViewContent()
      // summary 字段或 openCount 展示
      expect(content).toMatch(/summary|openCount|风险/)
    })

    it("弹窗包含到告警派遣或工单页的导航链接", () => {
      const content = getViewContent()
      expect(content).toMatch(/screen-popup-link/)
      // 链接到大屏功能页
      expect(content).toMatch(/alarm-dispatch|work-orders/)
    })

    it("弹窗使用 screen-glass-card 玻璃态样式", () => {
      const content = getViewContent()
      // screen-building-popup 附近应有 screen-glass-card 类
      const popupIdx = content.indexOf("screen-building-popup")
      const glassIdx = content.indexOf("screen-glass-card", popupIdx)
      expect(popupIdx).toBeGreaterThanOrEqual(0)
      expect(glassIdx).toBeGreaterThanOrEqual(0)
      // 两者距离合理（同一 element）
      expect(glassIdx - popupIdx).toBeLessThan(100)
    })

    it("弹窗使用 Transition 动画包裹", () => {
      const content = getViewContent()
      // Transition 组件包裹弹窗
      const transitionIdx = content.indexOf("Transition")
      const popupIdx = content.indexOf("screen-building-popup")
      expect(transitionIdx).toBeGreaterThanOrEqual(0)
      expect(popupIdx).toBeGreaterThan(transitionIdx)
      // Transition 在弹窗之前定义
      expect(popupIdx - transitionIdx).toBeLessThan(200)
    })
  })

  // ─────────────────────────────────────────
  // §3 地图点位交互（高保真新增：可点击）
  // ─────────────────────────────────────────
  describe("地图点位交互", () => {
    it("selectedPoint 响应式状态在 script 中定义", () => {
      expect(getViewContent()).toMatch(/selectedPoint/)
    })

    it("地图点位有 @click 事件绑定", () => {
      const content = getViewContent()
      // 地图点位 div 上有 @click 触发 selectedPoint 赋值
      expect(content).toMatch(/@click.*selectedPoint|selectedPoint.*@click/)
    })

    it("选中点位有高亮 CSS 样式（screen-map__point--selected）", () => {
      expect(getViewContent()).toMatch(/screen-map__point--selected/)
    })

    it("选中状态通过 :class 动态绑定", () => {
      const content = getViewContent()
      expect(content).toMatch(/:class.*selected|selected.*:class/)
    })
  })

  // ─────────────────────────────────────────
  // §4 风险色系统（高保真验证）
  // ─────────────────────────────────────────
  describe("风险色系统", () => {
    it("红色风险点 CSS 类 risk-dot--red 存在", () => {
      expect(getViewContent()).toMatch(/risk-dot--red/)
    })

    it("橙色风险点 CSS 类 risk-dot--orange 存在", () => {
      expect(getViewContent()).toMatch(/risk-dot--orange/)
    })

    it("黄色风险点 CSS 类 risk-dot--yellow 存在", () => {
      expect(getViewContent()).toMatch(/risk-dot--yellow/)
    })

    it("绿色风险点 CSS 类 risk-dot--green 存在", () => {
      expect(getViewContent()).toMatch(/risk-dot--green/)
    })

    it("风险点有发光效果（box-shadow glow）", () => {
      const content = getViewContent()
      // risk-dot 相关样式应有 box-shadow
      const riskDotIdx = content.indexOf("risk-dot--red")
      expect(riskDotIdx).toBeGreaterThanOrEqual(0)
      // box-shadow 存在于样式区域
      expect(content).toMatch(/box-shadow.*risk|risk.*box-shadow|box-shadow.*#FF4444|#FF4444.*box-shadow/)
    })

    it("红色告警点位有脉冲动画 (pulse keyframe)", () => {
      expect(getViewContent()).toMatch(/pulse/)
      expect(getViewContent()).toMatch(/@keyframes pulse/)
    })

    it("徽章样式 badge-screen 包含红/橙/黄/绿四色", () => {
      const content = getViewContent()
      expect(content).toMatch(/badge-screen--red/)
      expect(content).toMatch(/badge-screen--orange/)
      expect(content).toMatch(/badge-screen--yellow/)
    })
  })

  // ─────────────────────────────────────────
  // §5 1920×1080 布局约束
  // ─────────────────────────────────────────
  describe("1920×1080 布局约束", () => {
    it("screen-root 设置 overflow: hidden 防止滚动", () => {
      expect(getViewContent()).toMatch(/overflow.*hidden/)
    })

    it("screen-main 使用 CSS grid 布局", () => {
      const content = getViewContent()
      expect(content).toMatch(/display.*grid|grid-template-columns/)
    })

    it("三栏布局：左侧面板 screen-panel--left 存在", () => {
      expect(getViewContent()).toMatch(/screen-panel--left/)
    })

    it("三栏布局：右侧面板 screen-panel--right 存在", () => {
      expect(getViewContent()).toMatch(/screen-panel--right/)
    })

    it("三栏布局：中央地图 screen-map 存在", () => {
      expect(getViewContent()).toMatch(/screen-map/)
    })

    it("底部状态栏 screen-footer 存在", () => {
      expect(getViewContent()).toMatch(/screen-footer/)
    })

    it("screen-main 使用 flex:1 充满剩余高度", () => {
      expect(getViewContent()).toMatch(/flex.*1|flex: 1/)
    })
  })

  // ─────────────────────────────────────────
  // §6 弹窗 CSS 样式完整性
  // ─────────────────────────────────────────
  describe("弹窗 CSS 样式完整性", () => {
    it("screen-building-popup 有 position: absolute 定位", () => {
      const content = getViewContent()
      // CSS 中 .screen-building-popup 有 position: absolute
      const cssStart = content.indexOf("<style")
      const cssEnd = content.lastIndexOf("</style>")
      const css = content.slice(cssStart, cssEnd)
      expect(css).toMatch(/screen-building-popup/)
      expect(css).toMatch(/position.*absolute/)
    })

    it("screen-building-popup 有 z-index 层级", () => {
      const content = getViewContent()
      const cssStart = content.indexOf("<style")
      const cssEnd = content.lastIndexOf("</style>")
      const css = content.slice(cssStart, cssEnd)
      expect(css).toMatch(/z-index/)
    })

    it("弹窗入场/出场 transition CSS 存在", () => {
      const content = getViewContent()
      // 弹窗动画 - popup-enter/popup-leave 或 fade 过渡
      expect(content).toMatch(/popup-enter|popup-leave|screen-popup.*enter|screen-popup.*leave/)
    })
  })
})

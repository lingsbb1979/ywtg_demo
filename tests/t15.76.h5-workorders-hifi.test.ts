/**
 * T15.76 H5 待办工单第一版高保真
 *
 * 验收标准：形成 375px / 390px / 414px 可开发稿，确保移动端可读、可点、可演示
 *
 * 高保真 vs 低保真（T15.75）新增内容：
 * 1. CSS 全面采用 H5 design-tokens（--h5-primary、--h5-bg-card、--h5-border 等）
 * 2. 工单卡片有完整风险色边框系统（h5-wo-card--{level}）
 * 3. SLA 逾期有 h5-sla--overdue 高亮样式
 * 4. 接单按钮满足 min-height: var(--h5-touch-min) 最小触控区域
 * 5. Header 有渐变背景（linear-gradient 或 --h5-gradient-banner）
 * 6. 卡片使用 --h5-shadow-card 阴影 token
 * 7. 响应式约束 max-width: 414px
 * 8. 使用 --h5-text-h1 / --h5-text-muted 文字 token
 * 9. 筛选标签有 active 状态（--h5-primary 高亮）
 * 10. 底部 tabbar 由 H5Layout 提供，视图内有对应 padding-bottom
 */

import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { resolve } from "path"

const SRC = resolve(__dirname, "../src")

function getViewContent() {
  return readFileSync(resolve(SRC, "views/h5/H5WorkOrdersView.vue"), "utf-8")
}

describe("T15.76 H5 待办工单第一版高保真", () => {
  // ─────────────────────────────────────────
  // §1 视图文件存在性
  // ─────────────────────────────────────────
  describe("视图文件", () => {
    it("src/views/h5/H5WorkOrdersView.vue 文件存在", () => {
      expect(() => getViewContent()).not.toThrow()
    })
  })

  // ─────────────────────────────────────────
  // §2 H5 Design Token 使用
  // ─────────────────────────────────────────
  describe("H5 Design Token 使用", () => {
    it("CSS 使用 --h5-primary 主色调 token", () => {
      expect(getViewContent()).toMatch(/--h5-primary/)
    })

    it("CSS 使用 --h5-bg-card 卡片背景 token", () => {
      expect(getViewContent()).toMatch(/--h5-bg-card/)
    })

    it("CSS 使用 --h5-bg-page 页面背景 token", () => {
      expect(getViewContent()).toMatch(/--h5-bg-page/)
    })

    it("CSS 使用 --h5-border 边框颜色 token", () => {
      expect(getViewContent()).toMatch(/--h5-border/)
    })

    it("CSS 使用 --h5-shadow-card 阴影 token", () => {
      expect(getViewContent()).toMatch(/--h5-shadow-card/)
    })

    it("CSS 使用 --h5-text-h1 或 --h5-text-h2 文字颜色 token", () => {
      expect(getViewContent()).toMatch(/--h5-text-(h1|h2|body|muted)/)
    })

    it("CSS 使用 --h5-touch-min 最小触控区域 token", () => {
      expect(getViewContent()).toMatch(/--h5-touch-min/)
    })
  })

  // ─────────────────────────────────────────
  // §3 工单卡片高保真视觉
  // ─────────────────────────────────────────
  describe("工单卡片高保真视觉", () => {
    it("工单卡片有风险色边框（h5-wo-card--red/orange/yellow/green）", () => {
      const content = getViewContent()
      expect(content).toMatch(/h5-wo-card--red|h5-wo-card--orange/)
    })

    it("工单卡片有圆角（--radius-lg 或 border-radius）", () => {
      const content = getViewContent()
      expect(content).toMatch(/border-radius|--radius-/)
    })

    it("工单卡片有盒阴影（box-shadow）", () => {
      const content = getViewContent()
      expect(content).toMatch(/h5-wo-card[\s\S]{0,200}box-shadow/)
    })

    it("风险等级有徽章样式（h5-risk-level--red 等）", () => {
      const content = getViewContent()
      expect(content).toMatch(/h5-risk-level--(red|orange|yellow|green)/)
    })
  })

  // ─────────────────────────────────────────
  // §4 SLA 与逾期高保真
  // ─────────────────────────────────────────
  describe("SLA 与逾期样式", () => {
    it("SLA 逾期有 h5-sla--overdue 样式", () => {
      expect(getViewContent()).toMatch(/h5-sla--overdue/)
    })

    it("SLA 区域有时间显示逻辑（formatDispatchTime 或时间格式化）", () => {
      expect(getViewContent()).toMatch(/formatDispatchTime|dispatchTime/)
    })
  })

  // ─────────────────────────────────────────
  // §5 接单按钮与触控区域
  // ─────────────────────────────────────────
  describe("接单按钮与触控区域", () => {
    it("接单按钮使用 h5-accept-btn 类", () => {
      expect(getViewContent()).toMatch(/h5-accept-btn/)
    })

    it("接单按钮有最小高度（min-height 或 --h5-touch-min）", () => {
      const content = getViewContent()
      expect(content).toMatch(/h5-accept-btn[\s\S]{0,300}(min-height|--h5-touch-min)/)
    })

    it("接单按钮有主色背景（--h5-primary 或 #1B6FE8）", () => {
      const content = getViewContent()
      // 在 h5-accept-btn CSS 定义附近有主色
      const btnIdx = content.indexOf(".h5-accept-btn")
      expect(btnIdx).toBeGreaterThanOrEqual(0)
      const btnCss = content.slice(btnIdx, btnIdx + 300)
      expect(btnCss).toMatch(/--h5-primary|#1B6FE8|#1b6fe8/)
    })
  })

  // ─────────────────────────────────────────
  // §6 Header 渐变背景
  // ─────────────────────────────────────────
  describe("Header 渐变背景", () => {
    it("页面 header 区域有渐变背景（linear-gradient）", () => {
      expect(getViewContent()).toMatch(/linear-gradient/)
    })

    it("header 背景渐变含有深蓝色（#0E3875 或 #1B6FE8）", () => {
      expect(getViewContent()).toMatch(/#0E3875|#0e3875|#1B6FE8|--h5-gradient-banner/)
    })
  })

  // ─────────────────────────────────────────
  // §7 响应式与移动端适配
  // ─────────────────────────────────────────
  describe("响应式与移动端适配", () => {
    it("有 max-width 响应式约束（414px 或更小）", () => {
      expect(getViewContent()).toMatch(/max-width.*414px|max-width.*390px|max-width.*375px/)
    })

    it("有 padding-bottom 为底部 tabbar 预留空间", () => {
      expect(getViewContent()).toMatch(/padding-bottom/)
    })
  })

  // ─────────────────────────────────────────
  // §8 筛选标签高保真
  // ─────────────────────────────────────────
  describe("筛选标签高保真", () => {
    it("筛选标签有激活状态样式（active 或 --active）", () => {
      expect(getViewContent()).toMatch(/filter.*active|active.*filter|h5-filter-tab--active/)
    })

    it("筛选标签激活状态用主色高亮（--h5-primary 或 --pc-primary）", () => {
      const content  = getViewContent()
      const activeIdx = content.indexOf("active")
      const snippet   = content.slice(activeIdx - 50, activeIdx + 300)
      expect(snippet).toMatch(/--h5-primary|--pc-primary|#1B6FE8/)
    })
  })

  // ─────────────────────────────────────────
  // §9 继承低保真布局（回归验证）
  // ─────────────────────────────────────────
  describe("继承低保真布局（回归）", () => {
    it('保留 data-zone="header"', () => {
      expect(getViewContent()).toMatch(/data-zone="header"/)
    })

    it('保留 data-zone="filter-tabs"', () => {
      expect(getViewContent()).toMatch(/data-zone="filter-tabs"/)
    })

    it('保留 data-zone="workorder-list"', () => {
      expect(getViewContent()).toMatch(/data-zone="workorder-list"/)
    })

    it("仍绑定 todoList 数据", () => {
      expect(getViewContent()).toMatch(/todoList/)
    })
  })
})

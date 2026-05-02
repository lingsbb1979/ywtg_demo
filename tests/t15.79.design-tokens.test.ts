/**
 * T15.79 AI 提炼三端 UI 设计规范
 *
 * 验收标准：从三端首屏定稿提炼颜色、字体、间距、圆角、阴影、图标、状态色、按钮、卡片、表格、弹窗规范
 *
 * 输出物：
 * 1. source/src/styles/design-tokens.css（设计规范 token 文件）
 * 2. source/src/styles/main.css 中 @import design-tokens.css
 *
 * 规范覆盖：
 * §1 文件存在性
 * §2 语义色（风险色 + 工单状态色 + 语义色）
 * §3 间距系统（8px 基准网格）
 * §4 圆角系统
 * §5 动画时长
 * §6 大屏端 Tokens（深色科技主题）
 * §7 PC 管理端 Tokens（浅色企业主题）
 * §8 H5 移动端 Tokens（移动卡片主题）
 * §9 全局工具类
 */

import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "fs"
import { resolve } from "path"

const SRC    = resolve(__dirname, "../src")
const STYLES = resolve(SRC, "styles")

function getTokensContent() {
  return readFileSync(resolve(STYLES, "design-tokens.css"), "utf-8")
}

function getMainCssContent() {
  return readFileSync(resolve(STYLES, "main.css"), "utf-8")
}

describe("T15.79 AI 提炼三端 UI 设计规范", () => {

  // ─────────────────────────────────────────
  // §1 设计规范文件存在性
  // ─────────────────────────────────────────
  describe("设计规范文件", () => {
    it("source/src/styles/design-tokens.css 文件存在", () => {
      expect(existsSync(resolve(STYLES, "design-tokens.css"))).toBe(true)
    })

    it("source/src/styles/main.css 通过 @import 引入 design-tokens.css", () => {
      expect(getMainCssContent()).toMatch(/@import.*design-tokens/)
    })
  })

  // ─────────────────────────────────────────
  // §2 语义色规范（风险色 + 工单状态色 + 语义色）
  // ─────────────────────────────────────────
  describe("语义色规范", () => {
    it("风险等级色：--risk-red 定义为 #FF4444", () => {
      expect(getTokensContent()).toMatch(/--risk-red:\s*#FF4444/)
    })

    it("风险等级色：--risk-orange 定义为 #FF8A3D", () => {
      expect(getTokensContent()).toMatch(/--risk-orange:\s*#FF8A3D/)
    })

    it("风险等级色：--risk-yellow 和 --risk-green 均已定义", () => {
      const c = getTokensContent()
      expect(c).toMatch(/--risk-yellow:/)
      expect(c).toMatch(/--risk-green:/)
    })

    it("工单状态色：--wo-pending 和 --wo-processing 均已定义", () => {
      const c = getTokensContent()
      expect(c).toMatch(/--wo-pending:/)
      expect(c).toMatch(/--wo-processing:/)
    })

    it("工单状态色：--wo-checking 和 --wo-finished 均已定义", () => {
      const c = getTokensContent()
      expect(c).toMatch(/--wo-checking:/)
      expect(c).toMatch(/--wo-finished:/)
    })

    it("工单状态背景色：--wo-pending-bg 和 --wo-processing-bg 均已定义", () => {
      const c = getTokensContent()
      expect(c).toMatch(/--wo-pending-bg:/)
      expect(c).toMatch(/--wo-processing-bg:/)
    })

    it("工单状态文字色：--wo-pending-text 和 --wo-processing-text 均已定义", () => {
      const c = getTokensContent()
      expect(c).toMatch(/--wo-pending-text:/)
      expect(c).toMatch(/--wo-processing-text:/)
    })

    it("语义色：--color-success（成功绿）、--color-danger（危险红）、--color-warning（警告橙）", () => {
      const c = getTokensContent()
      expect(c).toMatch(/--color-success:/)
      expect(c).toMatch(/--color-danger:/)
      expect(c).toMatch(/--color-warning:/)
    })

    it("风险半透明色：--risk-red-alpha 和 --risk-orange-alpha（大屏徽章背景）", () => {
      const c = getTokensContent()
      expect(c).toMatch(/--risk-red-alpha:/)
      expect(c).toMatch(/--risk-orange-alpha:/)
    })
  })

  // ─────────────────────────────────────────
  // §3 间距规范（8px 基准网格）
  // ─────────────────────────────────────────
  describe("间距规范（8px 基准网格）", () => {
    it("基础间距：--spacing-1（4px）、--spacing-2（8px）、--spacing-4（16px）", () => {
      const c = getTokensContent()
      expect(c).toMatch(/--spacing-1:\s*4px/)
      expect(c).toMatch(/--spacing-2:\s*8px/)
      expect(c).toMatch(/--spacing-4:\s*16px/)
    })

    it("大间距：--spacing-8（32px）和 --spacing-12（48px）", () => {
      const c = getTokensContent()
      expect(c).toMatch(/--spacing-8:\s*32px/)
      expect(c).toMatch(/--spacing-12:\s*48px/)
    })
  })

  // ─────────────────────────────────────────
  // §4 圆角规范
  // ─────────────────────────────────────────
  describe("圆角规范", () => {
    it("标准圆角：--radius-sm（4px）、--radius-md（8px）、--radius-lg（12px）", () => {
      const c = getTokensContent()
      expect(c).toMatch(/--radius-sm:\s*4px/)
      expect(c).toMatch(/--radius-md:\s*8px/)
      expect(c).toMatch(/--radius-lg:\s*12px/)
    })

    it("全圆角：--radius-full（9999px，用于徽章/按钮）", () => {
      expect(getTokensContent()).toMatch(/--radius-full:\s*9999px/)
    })

    it("大圆角：--radius-xl（16px）", () => {
      expect(getTokensContent()).toMatch(/--radius-xl:\s*16px/)
    })
  })

  // ─────────────────────────────────────────
  // §5 动画时长规范
  // ─────────────────────────────────────────
  describe("动画时长规范", () => {
    it("微动画：--duration-micro（150ms，用于悬停/状态反馈）", () => {
      expect(getTokensContent()).toMatch(/--duration-micro:\s*150ms/)
    })

    it("短动画：--duration-short（200ms）和 --duration-normal（250ms）", () => {
      const c = getTokensContent()
      expect(c).toMatch(/--duration-short:\s*200ms/)
      expect(c).toMatch(/--duration-normal:\s*250ms/)
    })

    it("长动画：--duration-long（300ms）和 --duration-chart（800ms）", () => {
      const c = getTokensContent()
      expect(c).toMatch(/--duration-long:\s*300ms/)
      expect(c).toMatch(/--duration-chart:\s*800ms/)
    })

    it("缓动函数：--ease-standard、--ease-enter、--ease-exit", () => {
      const c = getTokensContent()
      expect(c).toMatch(/--ease-standard:/)
      expect(c).toMatch(/--ease-enter:/)
      expect(c).toMatch(/--ease-exit:/)
    })
  })

  // ─────────────────────────────────────────
  // §6 大屏端 Tokens（深色科技主题）
  // ─────────────────────────────────────────
  describe("大屏端 Tokens（深色科技主题）", () => {
    it("大屏背景：--screen-bg-base（#060D1F，最深背景）", () => {
      expect(getTokensContent()).toMatch(/--screen-bg-base:\s*#060D1F/)
    })

    it("大屏卡片背景：--screen-bg-card（rgba 深色）", () => {
      expect(getTokensContent()).toMatch(/--screen-bg-card:/)
    })

    it("大屏主色：--screen-primary（#1B6FE8）", () => {
      expect(getTokensContent()).toMatch(/--screen-primary:\s*#1B6FE8/)
    })

    it("大屏青色：--screen-cyan（#00D4FF）", () => {
      expect(getTokensContent()).toMatch(/--screen-cyan:\s*#00D4FF/)
    })

    it("大屏文字色：--screen-text-h1（白色）和 --screen-text-muted（半透明）", () => {
      const c = getTokensContent()
      expect(c).toMatch(/--screen-text-h1:/)
      expect(c).toMatch(/--screen-text-muted:/)
    })

    it("大屏阴影：--screen-shadow-card（含 glow 光效）", () => {
      expect(getTokensContent()).toMatch(/--screen-shadow-card:/)
    })

    it("大屏 glow 阴影：--screen-shadow-glow-blue 和 --screen-shadow-glow-cyan", () => {
      const c = getTokensContent()
      expect(c).toMatch(/--screen-shadow-glow-blue:/)
      expect(c).toMatch(/--screen-shadow-glow-cyan:/)
    })

    it("大屏边框：--screen-border-glow（蓝色发光边框）", () => {
      expect(getTokensContent()).toMatch(/--screen-border-glow:/)
    })

    it("大屏字体尺寸：--screen-font-h1 和 --screen-font-body", () => {
      const c = getTokensContent()
      expect(c).toMatch(/--screen-font-h1:/)
      expect(c).toMatch(/--screen-font-body:/)
    })
  })

  // ─────────────────────────────────────────
  // §7 PC 管理端 Tokens（浅色企业主题）
  // ─────────────────────────────────────────
  describe("PC 管理端 Tokens（浅色企业主题）", () => {
    it("PC 页面背景：--pc-bg-page（#F0F4F9）", () => {
      expect(getTokensContent()).toMatch(/--pc-bg-page:\s*#F0F4F9/)
    })

    it("PC 卡片背景：--pc-bg-card（#FFFFFF）", () => {
      expect(getTokensContent()).toMatch(/--pc-bg-card:\s*#FFFFFF/)
    })

    it("PC 主色：--pc-primary（#1B6FE8）", () => {
      expect(getTokensContent()).toMatch(/--pc-primary:\s*#1B6FE8/)
    })

    it("PC 侧边栏：--pc-bg-sidebar（#0E3875）", () => {
      expect(getTokensContent()).toMatch(/--pc-bg-sidebar:\s*#0E3875/)
    })

    it("PC 主标题文字：--pc-text-h1（#1C2B4A）", () => {
      expect(getTokensContent()).toMatch(/--pc-text-h1:\s*#1C2B4A/)
    })

    it("PC 正文文字：--pc-text-body 和 --pc-text-muted", () => {
      const c = getTokensContent()
      expect(c).toMatch(/--pc-text-body:/)
      expect(c).toMatch(/--pc-text-muted:/)
    })

    it("PC 阴影：--pc-shadow-sm 和 --pc-shadow-md", () => {
      const c = getTokensContent()
      expect(c).toMatch(/--pc-shadow-sm:/)
      expect(c).toMatch(/--pc-shadow-md:/)
    })

    it("PC 边框：--pc-border（#E2E8F0）和 --pc-border-focus（#1B6FE8）", () => {
      const c = getTokensContent()
      expect(c).toMatch(/--pc-border:\s*#E2E8F0/)
      expect(c).toMatch(/--pc-border-focus:/)
    })

    it("PC 字体尺寸：--pc-font-page-title 和 --pc-font-body", () => {
      const c = getTokensContent()
      expect(c).toMatch(/--pc-font-page-title:/)
      expect(c).toMatch(/--pc-font-body:/)
    })
  })

  // ─────────────────────────────────────────
  // §8 H5 移动端 Tokens（移动卡片主题）
  // ─────────────────────────────────────────
  describe("H5 移动端 Tokens（移动卡片主题）", () => {
    it("H5 页面背景：--h5-bg-page（#F7F9FC）", () => {
      expect(getTokensContent()).toMatch(/--h5-bg-page:\s*#F7F9FC/)
    })

    it("H5 卡片背景：--h5-bg-card（#FFFFFF）", () => {
      expect(getTokensContent()).toMatch(/--h5-bg-card:\s*#FFFFFF/)
    })

    it("H5 主色：--h5-primary（#1B6FE8）", () => {
      expect(getTokensContent()).toMatch(/--h5-primary:\s*#1B6FE8/)
    })

    it("H5 渐变 banner：--h5-gradient-banner（蓝色渐变顶栏）", () => {
      expect(getTokensContent()).toMatch(/--h5-gradient-banner:/)
    })

    it("H5 文字色：--h5-text-h1（#1C2B4A）和 --h5-text-muted（#94A3B8）", () => {
      const c = getTokensContent()
      expect(c).toMatch(/--h5-text-h1:/)
      expect(c).toMatch(/--h5-text-muted:/)
    })

    it("H5 卡片阴影：--h5-shadow-card（柔和投影）", () => {
      expect(getTokensContent()).toMatch(/--h5-shadow-card:/)
    })

    it("H5 触控规范：--h5-touch-min（44px，最小触控区域）", () => {
      expect(getTokensContent()).toMatch(/--h5-touch-min:\s*44px/)
    })

    it("H5 布局尺寸：--h5-tabbar-height（56px）和 --h5-header-height（56px）", () => {
      const c = getTokensContent()
      expect(c).toMatch(/--h5-tabbar-height:\s*56px/)
      expect(c).toMatch(/--h5-header-height:\s*56px/)
    })

    it("H5 边框：--h5-border（#EEF2F7）", () => {
      expect(getTokensContent()).toMatch(/--h5-border:\s*#EEF2F7/)
    })

    it("H5 字体尺寸：--h5-font-h1 和 --h5-font-body", () => {
      const c = getTokensContent()
      expect(c).toMatch(/--h5-font-h1:/)
      expect(c).toMatch(/--h5-font-body:/)
    })
  })

  // ─────────────────────────────────────────
  // §9 全局工具类
  // ─────────────────────────────────────────
  describe("全局工具类", () => {
    it("大屏玻璃卡片工具类（.screen-glass-card）含 backdrop-filter", () => {
      expect(getTokensContent()).toMatch(/\.screen-glass-card/)
      expect(getTokensContent()).toMatch(/backdrop-filter/)
    })

    it("大屏网格背景工具类（.screen-bg）", () => {
      expect(getTokensContent()).toMatch(/\.screen-bg/)
    })

    it("PC 白卡片工具类（.pc-card）", () => {
      expect(getTokensContent()).toMatch(/\.pc-card/)
    })

    it("H5 卡片工具类（.h5-card）", () => {
      expect(getTokensContent()).toMatch(/\.h5-card/)
    })

    it("工单状态徽章类（.badge--pending / .badge--processing / .badge--finished）", () => {
      const c = getTokensContent()
      expect(c).toMatch(/\.badge--pending/)
      expect(c).toMatch(/\.badge--processing/)
      expect(c).toMatch(/\.badge--finished/)
    })

    it("大屏半透明徽章类（.badge-screen--red / .badge-screen--orange）", () => {
      const c = getTokensContent()
      expect(c).toMatch(/\.badge-screen--red/)
      expect(c).toMatch(/\.badge-screen--orange/)
    })

    it("风险色点类（.risk-dot--red / .risk-dot--orange）", () => {
      const c = getTokensContent()
      expect(c).toMatch(/\.risk-dot--red/)
      expect(c).toMatch(/\.risk-dot--orange/)
    })

    it("等宽数字工具类（.tabular-nums）", () => {
      expect(getTokensContent()).toMatch(/\.tabular-nums/)
    })

    it("骨架屏动画类（.skeleton）", () => {
      expect(getTokensContent()).toMatch(/\.skeleton/)
    })

    it("动画关键帧：fadeIn 淡入动画", () => {
      expect(getTokensContent()).toMatch(/@keyframes fadeIn|fadeIn/)
    })
  })
})

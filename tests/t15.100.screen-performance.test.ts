/**
 * T15.100 实现 /screen/performance 轻量绩效页
 *
 * 验收标准：显示闭环率、平均响应时间、超时数、督办数
 *
 * 覆盖范围：
 * §1 文件与路由注册
 * §2 核心 KPI 展示（闭环率 / 平均响应时间 / 超时数 / 督办数）
 * §3 数据来源
 * §4 UI 规范符合性（screen tokens / screen-glass-card / tabular-nums）
 * §5 响应式绑定
 */

import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "fs"
import { resolve } from "path"

const SRC    = resolve(__dirname, "../src")
const ROUTES = resolve(SRC, "router/routes.ts")

function getView() {
  return readFileSync(resolve(SRC, "views/screen/ScreenPerformanceView.vue"), "utf-8")
}

describe("T15.100 /screen/performance 绩效看板", () => {

  // ─────────────────────────────────────────
  // §1 文件与路由注册
  // ─────────────────────────────────────────
  describe("§1 文件与路由注册", () => {
    it("ScreenPerformanceView.vue 文件存在", () => {
      expect(existsSync(resolve(SRC, "views/screen/ScreenPerformanceView.vue"))).toBe(true)
    })

    it("routes.ts 包含 /screen/performance 路径", () => {
      expect(readFileSync(ROUTES, "utf-8")).toMatch(/screen\/performance|screen-performance/)
    })

    it("routes.ts 引入 ScreenPerformanceView", () => {
      expect(readFileSync(ROUTES, "utf-8")).toMatch(/ScreenPerformanceView/)
    })
  })

  // ─────────────────────────────────────────
  // §2 核心 KPI 展示
  // ─────────────────────────────────────────
  describe("§2 核心 KPI 展示", () => {
    it("展示工单闭环率（closeRate 或 闭环率）", () => {
      expect(getView()).toMatch(/closeRate|闭环率/)
    })

    it("展示平均响应时间（avgResponse 或 平均响应）", () => {
      expect(getView()).toMatch(/avgResponse|平均响应|响应时间/)
    })

    it("展示超时工单数（overdueCount 或 超时）", () => {
      expect(getView()).toMatch(/overdueCount|超时|逾期/)
    })

    it("展示督办数（supervisionCount 或 督办）", () => {
      expect(getView()).toMatch(/supervisionCount|supervision|督办/)
    })

    it("KPI 数值使用 screen-kpi-item 或类似样式", () => {
      expect(getView()).toMatch(/screen-kpi-item|kpi-item|kpi/)
    })
  })

  // ─────────────────────────────────────────
  // §3 数据来源
  // ─────────────────────────────────────────
  describe("§3 数据来源", () => {
    it("从 work_order 表或 screenKpiService 获取工单数据", () => {
      expect(getView()).toMatch(/work_order|screenKpiService|selectScreenKpi|selectWorkOrderBoard/)
    })
  })

  // ─────────────────────────────────────────
  // §4 UI 规范符合性
  // ─────────────────────────────────────────
  describe("§4 UI 规范符合性", () => {
    it("使用 screen-glass-card 玻璃卡片", () => {
      expect(getView()).toMatch(/screen-glass-card/)
    })

    it("使用 tabular-nums 数字等宽显示", () => {
      expect(getView()).toMatch(/tabular-nums/)
    })

    it("使用大屏背景（screen-root / screen-bg）", () => {
      expect(getView()).toMatch(/screen-root|screen-bg/)
    })

    it("包含返回首页的链接", () => {
      expect(getView()).toMatch(/\/screen\/home/)
    })
  })

  // ─────────────────────────────────────────
  // §5 响应式绑定
  // ─────────────────────────────────────────
  describe("§5 响应式绑定", () => {
    it("使用 ref( 或 reactive( 定义响应式数据", () => {
      expect(getView()).toMatch(/ref\(|reactive\(/)
    })

    it("使用 onMounted 或 computed 初始化/计算数据", () => {
      expect(getView()).toMatch(/onMounted|computed/)
    })
  })
})

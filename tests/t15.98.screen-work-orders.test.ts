/**
 * T15.98 实现 /screen/work-orders 大屏工单看板
 *
 * 验收标准：显示工单看板、状态列、闭环时间线
 *
 * 覆盖范围：
 * §1 文件与路由注册
 * §2 工单看板布局（待接单/处理中/待核查/已销号状态列）
 * §3 工单列表渲染
 * §4 数据来源（getTable("work_order") 或 listWorkOrders）
 * §5 UI 规范符合性（screen tokens / screen-glass-card / tabular-nums）
 * §6 响应式绑定
 */

import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "fs"
import { resolve } from "path"

const SRC    = resolve(__dirname, "../src")
const ROUTES = resolve(SRC, "router/routes.ts")

function getView() {
  return readFileSync(resolve(SRC, "views/screen/ScreenWorkOrdersView.vue"), "utf-8")
}

describe("T15.98 /screen/work-orders 大屏工单看板", () => {

  // ─────────────────────────────────────────
  // §1 文件与路由注册
  // ─────────────────────────────────────────
  describe("§1 文件与路由注册", () => {
    it("ScreenWorkOrdersView.vue 文件存在", () => {
      expect(existsSync(resolve(SRC, "views/screen/ScreenWorkOrdersView.vue"))).toBe(true)
    })

    it("routes.ts 包含 /screen/work-orders 路径", () => {
      expect(readFileSync(ROUTES, "utf-8")).toMatch(/screen\/work-orders|screen-work-orders/)
    })

    it("routes.ts 引入 ScreenWorkOrdersView", () => {
      expect(readFileSync(ROUTES, "utf-8")).toMatch(/ScreenWorkOrdersView/)
    })
  })

  // ─────────────────────────────────────────
  // §2 工单看板布局
  // ─────────────────────────────────────────
  describe("§2 工单看板布局", () => {
    it("包含页面标题（工单看板 / 工单中心）", () => {
      expect(getView()).toMatch(/工单看板|工单中心|工单/)
    })

    it("展示待接单状态（PENDING 或 待接单）", () => {
      expect(getView()).toMatch(/PENDING|待接单/)
    })

    it("展示处理中状态（PROCESSING 或 处理中）", () => {
      expect(getView()).toMatch(/PROCESSING|处理中/)
    })

    it("展示待核查状态（CHECKING 或 待核查）", () => {
      expect(getView()).toMatch(/CHECKING|待核查/)
    })

    it("展示已销号状态（FINISHED 或 已销号）", () => {
      expect(getView()).toMatch(/FINISHED|已销号/)
    })

    it("使用 data-zone 标注功能区域", () => {
      expect(getView()).toMatch(/data-zone/)
    })
  })

  // ─────────────────────────────────────────
  // §3 工单列表渲染
  // ─────────────────────────────────────────
  describe("§3 工单列表渲染", () => {
    it("使用 v-for 遍历工单", () => {
      expect(getView()).toMatch(/v-for.*order|v-for.*work|v-for.*item/)
    })

    it("展示工单编号或建筑信息", () => {
      expect(getView()).toMatch(/orderNo|order_no|buildingName|building/)
    })

    it("展示工单状态", () => {
      expect(getView()).toMatch(/status|状态/)
    })
  })

  // ─────────────────────────────────────────
  // §4 数据来源
  // ─────────────────────────────────────────
  describe("§4 数据来源", () => {
    it("从 work_order 表或 workOrderService 获取数据", () => {
      expect(getView()).toMatch(/work_order|listWorkOrders|workOrderService|selectWorkOrderBoard/)
    })
  })

  // ─────────────────────────────────────────
  // §5 UI 规范符合性
  // ─────────────────────────────────────────
  describe("§5 UI 规范符合性", () => {
    it("使用 screen-glass-card 玻璃卡片样式", () => {
      expect(getView()).toMatch(/screen-glass-card/)
    })

    it("使用 tabular-nums 数字等宽显示", () => {
      expect(getView()).toMatch(/tabular-nums/)
    })

    it("使用大屏背景 screen-root 或 screen-bg", () => {
      expect(getView()).toMatch(/screen-root|screen-bg/)
    })

    it("包含返回大屏首页的链接", () => {
      expect(getView()).toMatch(/\/screen\/home|screen-home/)
    })
  })

  // ─────────────────────────────────────────
  // §6 响应式绑定
  // ─────────────────────────────────────────
  describe("§6 响应式绑定", () => {
    it("使用 ref( 或 reactive( 定义响应式数据", () => {
      expect(getView()).toMatch(/ref\(|reactive\(/)
    })

    it("使用 onMounted 或 computed 初始化/计算数据", () => {
      expect(getView()).toMatch(/onMounted|computed/)
    })
  })
})

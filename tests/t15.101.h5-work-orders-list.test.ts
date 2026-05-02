/**
 * T15.101 实现 /h5/work-orders H5 待办工单列表
 *
 * 验收标准：外勤可看到待办工单，橙色/红色优先排列
 *
 * 覆盖范围：
 * §1 文件与路由注册
 * §2 工单列表渲染（v-for / h5-wo-card / 优先级排序）
 * §3 状态筛选标签（全部 / 待处理 / 处理中）
 * §4 UI 规范符合性（h5 tokens / h5-card / tabular-nums）
 * §5 数据绑定与服务层（selectH5TodoList 或 listWorkOrders）
 */

import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "fs"
import { resolve } from "path"

const SRC    = resolve(__dirname, "../src")
const ROUTES = resolve(SRC, "router/routes.ts")

function getView() {
  return readFileSync(resolve(SRC, "views/h5/H5WorkOrdersView.vue"), "utf-8")
}

describe("T15.101 /h5/work-orders H5 待办工单列表", () => {

  // ─────────────────────────────────────────
  // §1 文件与路由注册
  // ─────────────────────────────────────────
  describe("§1 文件与路由注册", () => {
    it("H5WorkOrdersView.vue 文件存在", () => {
      expect(existsSync(resolve(SRC, "views/h5/H5WorkOrdersView.vue"))).toBe(true)
    })

    it("routes.ts 包含 h5/work-orders 路径", () => {
      expect(readFileSync(ROUTES, "utf-8")).toMatch(/h5.*work-orders|h5-work-orders/)
    })

    it("routes.ts 引入 H5WorkOrdersView", () => {
      expect(readFileSync(ROUTES, "utf-8")).toMatch(/H5WorkOrdersView/)
    })
  })

  // ─────────────────────────────────────────
  // §2 工单列表渲染
  // ─────────────────────────────────────────
  describe("§2 工单列表渲染", () => {
    it("使用 v-for 遍历工单列表", () => {
      expect(getView()).toMatch(/v-for.*item|v-for.*order|v-for.*filteredList|v-for.*todoList/)
    })

    it("工单卡片使用 h5-wo-card 或 h5-card 样式", () => {
      expect(getView()).toMatch(/h5-wo-card|h5-card/)
    })

    it("展示工单编号（orderNo）", () => {
      expect(getView()).toMatch(/orderNo|order_no/)
    })

    it("展示告警等级（alarmLevel）或优先级（orderLevel）", () => {
      expect(getView()).toMatch(/alarmLevel|orderLevel/)
    })

    it("展示建筑名称（buildingName）", () => {
      expect(getView()).toMatch(/buildingName/)
    })

    it("红色/橙色优先展示（risk-level 或 h5-risk-level 或颜色动态绑定）", () => {
      expect(getView()).toMatch(/h5-risk-level|alarmLevel.*lower|risk-level|ORANGE|RED/)
    })
  })

  // ─────────────────────────────────────────
  // §3 状态筛选标签
  // ─────────────────────────────────────────
  describe("§3 状态筛选标签", () => {
    it("包含筛选标签（activeFilter）", () => {
      expect(getView()).toMatch(/activeFilter/)
    })

    it("包含待处理状态筛选（PENDING）", () => {
      expect(getView()).toMatch(/PENDING/)
    })

    it("包含处理中状态筛选（PROCESSING）", () => {
      expect(getView()).toMatch(/PROCESSING/)
    })

    it("使用 h5-filter-tab 或类似样式的筛选标签", () => {
      expect(getView()).toMatch(/h5-filter-tab|filter-tab|filter/)
    })
  })

  // ─────────────────────────────────────────
  // §4 UI 规范符合性
  // ─────────────────────────────────────────
  describe("§4 UI 规范符合性", () => {
    it("使用 tabular-nums 数字等宽显示", () => {
      expect(getView()).toMatch(/tabular-nums/)
    })

    it("使用 H5 背景色（--h5-bg-page 或 h5-workorders）", () => {
      expect(getView()).toMatch(/h5-workorders|--h5-bg-page|h5-bg-page/)
    })

    it("SLA 时间显示（h5-sla 或 dispatchTime）", () => {
      expect(getView()).toMatch(/h5-sla|dispatchTime|SLA/)
    })
  })

  // ─────────────────────────────────────────
  // §5 数据绑定与服务层
  // ─────────────────────────────────────────
  describe("§5 数据绑定与服务层", () => {
    it("从 screenKpiService 导入 selectH5TodoList 或从 workOrderService 导入 listWorkOrders", () => {
      expect(getView()).toMatch(/selectH5TodoList|listWorkOrders/)
    })

    it("使用 ref( 或 reactive( 定义响应式数据", () => {
      expect(getView()).toMatch(/ref\(|reactive\(/)
    })

    it("使用 onMounted 初始化数据", () => {
      expect(getView()).toMatch(/onMounted/)
    })

    it("计算属性 filteredList 过滤工单", () => {
      expect(getView()).toMatch(/filteredList|computed/)
    })
  })
})

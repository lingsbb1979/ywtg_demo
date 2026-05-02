/**
 * T15.93 实现 /admin/work-orders — 工单列表、核查通过、退回重办
 *
 * 验收标准：可查看工单列表、详情、核查通过、退回重办
 *
 * 业务场景：
 * 管理员进入工单管理 → 查看工单列表（含状态筛选）→ 对待核查工单点击「核查通过」
 * → 或点击「退回重办」返回处理中 → 点击工单行进入详情页
 *
 * 功能要求：
 * - 工单列表：调用 workOrderService.listWorkOrders()，支持状态筛选
 * - 核查通过：调用 workOrderService.verifyWorkOrder(id)，状态 CHECKING→FINISHED
 * - 退回重办：调用 workOrderService.rejectWorkOrder(id)，状态 CHECKING→PROCESSING
 * - 工单详情：router-link 到 /admin/work-orders/:id
 *
 * 覆盖范围：
 * §1 文件与路由注册
 * §2 页面布局结构
 * §3 状态筛选标签
 * §4 工单列表渲染
 * §5 核查通过（verifyWorkOrder）
 * §6 退回重办（rejectWorkOrder）
 * §7 工单详情链接
 * §8 UI 规范符合性
 * §9 数据绑定与服务层
 */

import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "fs"
import { resolve } from "path"

const SRC    = resolve(__dirname, "../src")
const ROUTES = resolve(SRC, "router/routes.ts")

function getView() {
  return readFileSync(resolve(SRC, "views/admin/AdminWorkOrdersView.vue"), "utf-8")
}

describe("T15.93 /admin/work-orders 工单列表与核查操作", () => {

  // ─────────────────────────────────────────
  // §1 文件与路由注册
  // ─────────────────────────────────────────
  describe("§1 文件与路由注册", () => {
    it("AdminWorkOrdersView.vue 文件存在", () => {
      expect(existsSync(resolve(SRC, "views/admin/AdminWorkOrdersView.vue"))).toBe(true)
    })

    it("routes.ts 包含 work-orders 路径", () => {
      expect(readFileSync(ROUTES, "utf-8")).toMatch(/path.*work-orders|admin-work-orders/)
    })

    it("routes.ts 引入 AdminWorkOrdersView 组件", () => {
      expect(readFileSync(ROUTES, "utf-8")).toMatch(/AdminWorkOrdersView/)
    })

    it("work-orders 路由绑定的是 AdminWorkOrdersView 而非 AdminDashboardView 占位", () => {
      const routes = readFileSync(ROUTES, "utf-8")
      // 在 work-orders 路由段中应出现 AdminWorkOrdersView
      expect(routes).toMatch(/AdminWorkOrdersView/)
      // 不能只用 AdminDashboardView 作为 work-orders 的 component
      expect(routes).not.toMatch(
        /path.*['""]work-orders['""][\s\S]{0,60}component:\s*AdminDashboardView/
      )
    })
  })

  // ─────────────────────────────────────────
  // §2 页面布局结构
  // ─────────────────────────────────────────
  describe("§2 页面布局结构", () => {
    it("使用 pc-card 或 admin-card 卡片容器", () => {
      expect(getView()).toMatch(/pc-card|admin-card/)
    })

    it("使用 PC 设计 token（--pc-primary / --pc-bg-page / --pc-border）", () => {
      expect(getView()).toMatch(/--pc-primary|--pc-bg-page|--pc-border/)
    })

    it("包含页面标题（工单管理 / 工单列表）", () => {
      expect(getView()).toMatch(/工单管理|工单列表|工单中心/)
    })

    it("使用 data-zone 属性标注功能区域", () => {
      expect(getView()).toMatch(/data-zone=/)
    })
  })

  // ─────────────────────────────────────────
  // §3 状态筛选标签
  // ─────────────────────────────────────────
  describe("§3 状态筛选标签", () => {
    it("包含 admin-filter-tab 状态筛选标签", () => {
      expect(getView()).toMatch(/admin-filter-tab/)
    })

    it("包含「待核查」筛选状态", () => {
      expect(getView()).toMatch(/CHECKING|待核查/)
    })

    it("包含「处理中」或「已销号」筛选状态", () => {
      expect(getView()).toMatch(/PROCESSING|处理中|FINISHED|已销号/)
    })
  })

  // ─────────────────────────────────────────
  // §4 工单列表渲染
  // ─────────────────────────────────────────
  describe("§4 工单列表渲染", () => {
    it("使用 v-for 遍历工单", () => {
      expect(getView()).toMatch(/v-for.*order/)
    })

    it("展示工单编号 orderNo 或 order_no", () => {
      expect(getView()).toMatch(/orderNo|order_no/)
    })

    it("展示告警等级 alarmLevel 或 alarm_level", () => {
      expect(getView()).toMatch(/alarmLevel|alarm_level/)
    })

    it("展示工单状态 badge 或 status", () => {
      expect(getView()).toMatch(/badge|status/)
    })

    it("展示派单时间 dispatchTime 或 create_time", () => {
      expect(getView()).toMatch(/dispatchTime|dispatch_time|createTime|create_time/)
    })
  })

  // ─────────────────────────────────────────
  // §5 核查通过（verifyWorkOrder）
  // ─────────────────────────────────────────
  describe("§5 核查通过功能", () => {
    it("从 workOrderService 导入 verifyWorkOrder", () => {
      const code = getView()
      expect(code).toMatch(/verifyWorkOrder/)
      expect(code).toMatch(/workOrderService/)
    })

    it("调用 verifyWorkOrder 函数（含参数）", () => {
      expect(getView()).toMatch(/verifyWorkOrder\s*\(/)
    })

    it("包含核查通过按钮文字或标识", () => {
      expect(getView()).toMatch(/核查通过|verify|FINISHED/)
    })
  })

  // ─────────────────────────────────────────
  // §6 退回重办（rejectWorkOrder）
  // ─────────────────────────────────────────
  describe("§6 退回重办功能", () => {
    it("从 workOrderService 导入 rejectWorkOrder", () => {
      const code = getView()
      expect(code).toMatch(/rejectWorkOrder/)
      expect(code).toMatch(/workOrderService/)
    })

    it("调用 rejectWorkOrder 函数（含参数）", () => {
      expect(getView()).toMatch(/rejectWorkOrder\s*\(/)
    })

    it("包含退回重办按钮文字或标识", () => {
      expect(getView()).toMatch(/退回重办|退回|reject/)
    })
  })

  // ─────────────────────────────────────────
  // §7 工单详情链接
  // ─────────────────────────────────────────
  describe("§7 工单详情链接", () => {
    it("包含 router-link 或 $router.push 跳转到工单详情", () => {
      expect(getView()).toMatch(/router-link|router\.push|\$router/)
    })

    it("链接包含工单 id 动态参数", () => {
      expect(getView()).toMatch(/work-orders.*id|:id|order\.id/)
    })
  })

  // ─────────────────────────────────────────
  // §8 UI 规范符合性
  // ─────────────────────────────────────────
  describe("§8 UI 规范符合性", () => {
    it("tabular-nums 数字等宽显示", () => {
      expect(getView()).toMatch(/tabular-nums/)
    })

    it("使用 badge 或 admin-badge 状态徽章", () => {
      expect(getView()).toMatch(/admin-badge|badge/)
    })

    it("使用 btn-pc-primary 或 btn-pc-secondary 操作按钮", () => {
      expect(getView()).toMatch(/btn-pc-primary|btn-pc-secondary|btn-icon-sm/)
    })
  })

  // ─────────────────────────────────────────
  // §9 数据绑定与服务层
  // ─────────────────────────────────────────
  describe("§9 数据绑定与服务层", () => {
    it("调用 listWorkOrders 加载工单数据", () => {
      expect(getView()).toMatch(/listWorkOrders/)
    })

    it("使用 ref 或 reactive 管理响应式状态", () => {
      expect(getView()).toMatch(/ref\(|reactive\(/)
    })

    it("使用 onMounted 加载初始数据", () => {
      expect(getView()).toMatch(/onMounted/)
    })

    it("包含搜索输入框 input-pc 或 admin-search", () => {
      expect(getView()).toMatch(/input-pc|admin-search/)
    })
  })
})

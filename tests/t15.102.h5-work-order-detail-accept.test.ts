/**
 * T15.102 实现 /h5/work-orders/:id H5 工单详情与接单
 *
 * 验收标准：可查看详情并点击接单
 *
 * 覆盖范围：
 * §1 文件与路由注册
 * §2 工单详情展示（建筑、告警、工单信息、SLA）
 * §3 接单功能（h5-accept-btn / 接单按钮 / 状态变更）
 * §4 处置入口（/h5/dispose/:id 链接）
 * §5 时间轴（处置流程时间线）
 * §6 UI 规范符合性（h5 tokens / h5-card / tabular-nums）
 * §7 数据绑定与服务层（getWorkOrder / update）
 */

import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "fs"
import { resolve } from "path"

const SRC    = resolve(__dirname, "../src")
const ROUTES = resolve(SRC, "router/routes.ts")

function getView() {
  return readFileSync(resolve(SRC, "views/h5/H5WorkOrderDetailView.vue"), "utf-8")
}

describe("T15.102 /h5/work-orders/:id H5 工单详情与接单", () => {

  // ─────────────────────────────────────────
  // §1 文件与路由注册
  // ─────────────────────────────────────────
  describe("§1 文件与路由注册", () => {
    it("H5WorkOrderDetailView.vue 文件存在", () => {
      expect(existsSync(resolve(SRC, "views/h5/H5WorkOrderDetailView.vue"))).toBe(true)
    })

    it("routes.ts 包含 h5/work-orders/:id 路径", () => {
      expect(readFileSync(ROUTES, "utf-8")).toMatch(/work-orders\/:id|h5-work-order-detail/)
    })

    it("routes.ts 引入 H5WorkOrderDetailView", () => {
      expect(readFileSync(ROUTES, "utf-8")).toMatch(/H5WorkOrderDetailView/)
    })
  })

  // ─────────────────────────────────────────
  // §2 工单详情展示
  // ─────────────────────────────────────────
  describe("§2 工单详情展示", () => {
    it("展示工单编号（orderNo 或 orderCode）", () => {
      expect(getView()).toMatch(/orderNo|orderCode|order_no/)
    })

    it("展示建筑名称（buildingName 或 buildingId）", () => {
      expect(getView()).toMatch(/buildingName|buildingId/)
    })

    it("展示告警等级（alarmLevel）", () => {
      expect(getView()).toMatch(/alarmLevel/)
    })

    it("展示工单状态（status）", () => {
      expect(getView()).toMatch(/STATUS_LABEL|status/)
    })

    it("展示 SLA 时间（dispatchTime / sla / SLA）", () => {
      expect(getView()).toMatch(/dispatchTime|h5-sla|SLA|sla/)
    })

    it("使用 h5-card 样式", () => {
      expect(getView()).toMatch(/h5-card/)
    })
  })

  // ─────────────────────────────────────────
  // §3 接单功能
  // ─────────────────────────────────────────
  describe("§3 接单功能", () => {
    it("包含接单按钮（h5-accept-btn）", () => {
      expect(getView()).toMatch(/h5-accept-btn/)
    })

    it("接单按钮在 PENDING 状态时显示", () => {
      expect(getView()).toMatch(/PENDING/)
    })

    it("包含接单处理函数（acceptOrder 或 acceptWorkOrder）", () => {
      expect(getView()).toMatch(/acceptOrder|acceptWorkOrder/)
    })

    it("接单后工单状态变为 PROCESSING", () => {
      expect(getView()).toMatch(/PROCESSING/)
    })

    it("操作结果反馈信息（actionMsg）", () => {
      expect(getView()).toMatch(/actionMsg/)
    })
  })

  // ─────────────────────────────────────────
  // §4 处置入口
  // ─────────────────────────────────────────
  describe("§4 处置入口", () => {
    it("包含去处置按钮或链接（/h5/dispose/）", () => {
      expect(getView()).toMatch(/h5\/dispose|goDispose|处置/)
    })
  })

  // ─────────────────────────────────────────
  // §5 时间轴
  // ─────────────────────────────────────────
  describe("§5 处置时间轴", () => {
    it("包含时间轴组件（h5-timeline）", () => {
      expect(getView()).toMatch(/h5-timeline|timeline/)
    })
  })

  // ─────────────────────────────────────────
  // §6 UI 规范符合性
  // ─────────────────────────────────────────
  describe("§6 UI 规范符合性", () => {
    it("使用 tabular-nums 数字等宽显示", () => {
      expect(getView()).toMatch(/tabular-nums/)
    })

    it("使用 H5 背景色（--h5-bg-page 或 h5-work-order-detail）", () => {
      expect(getView()).toMatch(/h5-work-order-detail|--h5-bg-page|h5-main/)
    })

    it("顶部返回按钮（h5-header__back 或 goBack）", () => {
      expect(getView()).toMatch(/h5-header__back|goBack/)
    })
  })

  // ─────────────────────────────────────────
  // §7 数据绑定与服务层
  // ─────────────────────────────────────────
  describe("§7 数据绑定与服务层", () => {
    it("从 workOrderService 导入 getWorkOrder", () => {
      expect(getView()).toMatch(/getWorkOrder/)
    })

    it("工单状态变更使用 update 或 acceptWorkOrder", () => {
      expect(getView()).toMatch(/update.*work_order|acceptWorkOrder|work_order.*update/)
    })

    it("使用 ref( 定义响应式数据", () => {
      expect(getView()).toMatch(/ref\(/)
    })

    it("使用 onMounted 加载工单数据", () => {
      expect(getView()).toMatch(/onMounted/)
    })

    it("从路由参数获取工单 ID（route.params.id）", () => {
      expect(getView()).toMatch(/route\.params\.id|useRoute/)
    })
  })
})

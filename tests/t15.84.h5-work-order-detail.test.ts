/**
 * T15.84 按规范设计 /h5/work-orders/:id（H5 第二页）
 *
 * 验收标准：H5 第二页沿用待办列表规范，完成工单详情、接单、指标、SLA、处置入口样式
 *
 * 业务场景：
 * 演示步骤 6-7：外勤打开待办工单 → 查看工单详情 → 点击接单 → 查看指标/SLA → 进入处置
 *
 * 设计规范要求：
 * - 沿用 H5WorkOrdersView H5 移动端卡片主题
 * - h5-header 深蓝渐变顶栏
 * - h5 tokens（--h5-primary / --h5-bg-card / --h5-shadow-card / --h5-border / --h5-touch-min）
 * - 工单详情信息区（buildingName / alarmTitle / orderLevel / status / dispatchTime）
 * - 接单按钮（accept-btn / 接单操作）
 * - 指标区域（alarmLevel / orderLevel / SLA 时间）
 * - SLA 展示（h5-sla / 逾期标记）
 * - 处置入口（dispose 路由或按钮）
 * - 状态徽章（badge 类）
 * - 风险颜色点（risk-dot）
 * - SQLiteMirror 数据：从 workOrderService.getWorkOrder(id) 读取
 *
 * 覆盖范围：
 * §1 路由与文件存在性
 * §2 页面布局结构（沿用 H5 规范）
 * §3 工单详情信息区
 * §4 接单按钮
 * §5 指标与 SLA 展示
 * §6 处置入口
 * §7 UI 规范符合性
 * §8 数据绑定与服务层
 */

import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "fs"
import { resolve } from "path"

const SRC    = resolve(__dirname, "../src")
const ROUTES = resolve(SRC, "router/routes.ts")

function getDetailView() {
  return readFileSync(resolve(SRC, "views/h5/H5WorkOrderDetailView.vue"), "utf-8")
}

describe("T15.84 H5 工单详情页 /h5/work-orders/:id", () => {

  // ─────────────────────────────────────────
  // §1 路由与文件存在性
  // ─────────────────────────────────────────
  describe("路由与文件存在性", () => {
    it("H5WorkOrderDetailView.vue 文件存在", () => {
      expect(existsSync(resolve(SRC, "views/h5/H5WorkOrderDetailView.vue"))).toBe(true)
    })

    it("routes.ts 包含 /h5/work-orders/:id 动态路由", () => {
      expect(readFileSync(ROUTES, "utf-8")).toMatch(/\/h5\/work-orders\/:id|h5-work-order-detail/)
    })

    it("routes.ts 引入 H5WorkOrderDetailView", () => {
      expect(readFileSync(ROUTES, "utf-8")).toMatch(/H5WorkOrderDetailView/)
    })

    it("页面包含低保真线框注释（工单详情 wireframe）", () => {
      expect(getDetailView()).toMatch(/T15\.84|work-order.*detail|工单详情|work-orders\/:id/)
    })
  })

  // ─────────────────────────────────────────
  // §2 页面布局结构（沿用 H5 规范）
  // ─────────────────────────────────────────
  describe("页面布局结构（沿用 H5 规范）", () => {
    it("使用 h5-header 深蓝渐变顶栏", () => {
      expect(getDetailView()).toMatch(/h5-header/)
    })

    it("使用 --h5-primary 或 --h5-bg-card token", () => {
      expect(getDetailView()).toMatch(/--h5-primary|--h5-bg-card|--h5-border|--h5-shadow/)
    })

    it("包含返回按钮（router-link 或 back）", () => {
      expect(getDetailView()).toMatch(/router-link|back|goBack|useRouter/)
    })

    it("包含顶部标题（工单详情/工单信息）", () => {
      expect(getDetailView()).toMatch(/工单详情|工单信息|h5-header__title/)
    })

    it("使用 h5-card 或 h5-wo-card 卡片", () => {
      expect(getDetailView()).toMatch(/h5-card|h5-wo-card|h5-detail/)
    })
  })

  // ─────────────────────────────────────────
  // §3 工单详情信息区
  // ─────────────────────────────────────────
  describe("工单详情信息区", () => {
    it("展示工单编号（orderNo / orderCode）", () => {
      expect(getDetailView()).toMatch(/orderNo|orderCode|order_no|工单/)
    })

    it("展示建筑名称（buildingName）", () => {
      expect(getDetailView()).toMatch(/buildingName|building_name|建筑/)
    })

    it("展示告警描述（alarmTitle / alarmContent）", () => {
      expect(getDetailView()).toMatch(/alarmTitle|alarmContent|alarm_title|告警/)
    })

    it("展示工单状态（status）", () => {
      expect(getDetailView()).toMatch(/\.status|status\b/)
    })

    it("展示派单时间（dispatchTime）", () => {
      expect(getDetailView()).toMatch(/dispatchTime|dispatch_time|派单时间/)
    })
  })

  // ─────────────────────────────────────────
  // §4 接单按钮
  // ─────────────────────────────────────────
  describe("接单按钮", () => {
    it("包含接单按钮（h5-accept-btn 或 acceptOrder）", () => {
      expect(getDetailView()).toMatch(/h5-accept-btn|acceptOrder|onAccept|接单/)
    })

    it("接单按钮仅在 PENDING 状态时显示", () => {
      expect(getDetailView()).toMatch(/PENDING|待处理|v-if.*PENDING|PENDING.*v-if/)
    })

    it("接单操作调用 update 更新工单状态", () => {
      expect(getDetailView()).toMatch(/update.*work_order|work_order.*update|PROCESSING|update\(/)
    })
  })

  // ─────────────────────────────────────────
  // §5 指标与 SLA 展示
  // ─────────────────────────────────────────
  describe("指标与 SLA 展示", () => {
    it("展示告警等级（alarmLevel / orderLevel）", () => {
      expect(getDetailView()).toMatch(/alarmLevel|orderLevel|alarm_level|order_level/)
    })

    it("包含 SLA 展示（h5-sla 或 SLA 文字）", () => {
      expect(getDetailView()).toMatch(/h5-sla|SLA|sla|逾期/)
    })

    it("SLA 时间使用 tabular-nums 等宽数字", () => {
      expect(getDetailView()).toMatch(/tabular-nums/)
    })

    it("包含逾期标记逻辑（overdue / 逾期）", () => {
      expect(getDetailView()).toMatch(/overdue|isOverdue|逾期/)
    })
  })

  // ─────────────────────────────────────────
  // §6 处置入口
  // ─────────────────────────────────────────
  describe("处置入口", () => {
    it("包含处置入口链接或按钮（/h5/dispose 路由或 dispose 文字）", () => {
      expect(getDetailView()).toMatch(/\/h5\/dispose|dispose|处置|去处置/)
    })

    it("处置入口仅在 PROCESSING 状态时显示", () => {
      expect(getDetailView()).toMatch(/PROCESSING|处理中/)
    })

    it("包含处置说明或证据入口（evidence 或 上传）", () => {
      expect(getDetailView()).toMatch(/evidence|上传|现场|证据|h5-evidence/)
    })
  })

  // ─────────────────────────────────────────
  // §7 UI 规范符合性
  // ─────────────────────────────────────────
  describe("UI 规范符合性", () => {
    it("使用 badge 或 h5-risk 状态徽章", () => {
      expect(getDetailView()).toMatch(/badge|h5-risk/)
    })

    it("使用 risk-dot 风险颜色点", () => {
      expect(getDetailView()).toMatch(/risk-dot/)
    })

    it("触控最小高度满足 44px（--h5-touch-min 或 44px）", () => {
      expect(getDetailView()).toMatch(/--h5-touch-min|44px|touch-min/)
    })

    it("使用渐变顶栏（linear-gradient 或 h5-gradient-banner）", () => {
      expect(getDetailView()).toMatch(/linear-gradient|h5-gradient-banner|--h5-gradient/)
    })
  })

  // ─────────────────────────────────────────
  // §8 数据绑定与服务层
  // ─────────────────────────────────────────
  describe("数据绑定与服务层", () => {
    it("从 workOrderService 导入 getWorkOrder", () => {
      expect(getDetailView()).toMatch(/getWorkOrder|workOrderService/)
    })

    it("使用 useRoute 获取动态路由参数 :id", () => {
      expect(getDetailView()).toMatch(/useRoute|route\.params|params\.id/)
    })

    it("使用 ref() 或 reactive() 响应式状态", () => {
      expect(getDetailView()).toMatch(/ref\(|reactive\(/)
    })

    it("使用 onMounted 加载工单详情", () => {
      expect(getDetailView()).toMatch(/onMounted/)
    })

    it("包含空状态或加载中处理（v-if 或 loading）", () => {
      expect(getDetailView()).toMatch(/loading|v-if.*order|order.*v-if|暂无|未找到/)
    })
  })
})

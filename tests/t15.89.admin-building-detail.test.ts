/**
 * T15.89 管理端建筑详情页 /admin/buildings/:id
 *
 * 验收标准：展示基础信息、指标、告警、工单、档案记录
 *
 * 业务场景：
 * 从建筑列表点击某栋建筑 → 进入详情页 → 查看基础信息、风险指标、
 * 关联告警、处置工单、数字档案记录
 *
 * 设计规范要求：
 * - 沿用 PC 管理端企业浅色主题
 * - pc-card / admin-card 卡片容器
 * - pc tokens（--pc-primary / --pc-bg-page / --pc-border）
 * - risk-dot 风险颜色点
 * - tabular-nums 数字字体
 * - 数据来源：buildingService.getBuilding + analysisService.getAnalysisResult
 *
 * 覆盖范围：
 * §1 路由与文件存在性
 * §2 页面布局结构
 * §3 基础信息区
 * §4 风险指标区
 * §5 关联告警区
 * §6 关联工单区
 * §7 UI 规范符合性
 * §8 数据绑定与服务层
 */

import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "fs"
import { resolve } from "path"

const SRC    = resolve(__dirname, "../src")
const ROUTES = resolve(SRC, "router/routes.ts")

function getView() {
  return readFileSync(resolve(SRC, "views/admin/AdminBuildingDetailView.vue"), "utf-8")
}

describe("T15.89 管理端建筑详情页 /admin/buildings/:id", () => {

  // ─────────────────────────────────────────
  // §1 路由与文件存在性
  // ─────────────────────────────────────────
  describe("路由与文件存在性", () => {
    it("AdminBuildingDetailView.vue 文件存在", () => {
      expect(existsSync(resolve(SRC, "views/admin/AdminBuildingDetailView.vue"))).toBe(true)
    })

    it("routes.ts 包含 /admin/buildings/:id 动态路由", () => {
      expect(readFileSync(ROUTES, "utf-8")).toMatch(/\/admin\/buildings\/:id|buildings.*:id|admin-building-detail/)
    })

    it("routes.ts 引入 AdminBuildingDetailView", () => {
      expect(readFileSync(ROUTES, "utf-8")).toMatch(/AdminBuildingDetailView/)
    })

    it("页面包含低保真线框注释（T15.89 建筑详情）", () => {
      expect(getView()).toMatch(/T15\.89|building.*detail|建筑详情|建筑档案/)
    })
  })

  // ─────────────────────────────────────────
  // §2 页面布局结构
  // ─────────────────────────────────────────
  describe("页面布局结构", () => {
    it("使用 pc-card 或 admin-card 卡片容器", () => {
      expect(getView()).toMatch(/pc-card|admin-card/)
    })

    it("使用 --pc-primary 等 pc tokens", () => {
      expect(getView()).toMatch(/--pc-primary|--pc-bg-page|--pc-border/)
    })

    it("包含页面标题（建筑详情相关）", () => {
      expect(getView()).toMatch(/建筑详情|建筑档案|建筑信息|历史建筑/)
    })

    it("使用 data-zone 属性标注功能区域", () => {
      expect(getView()).toMatch(/data-zone=/)
    })
  })

  // ─────────────────────────────────────────
  // §3 基础信息区
  // ─────────────────────────────────────────
  describe("基础信息区", () => {
    it("展示建筑名称字段", () => {
      expect(getView()).toMatch(/\.name|building\.name|buildingName|建筑名称/)
    })

    it("展示建筑编码字段", () => {
      expect(getView()).toMatch(/spaceCode|space_code|\.code|建筑编码|building.*code/)
    })

    it("展示地址信息", () => {
      expect(getView()).toMatch(/addressDesc|address_desc|address|地址/)
    })

    it("展示风险点或风险等级", () => {
      expect(getView()).toMatch(/risk-dot|latestRiskLevel|latestRisk|riskLevel|风险等级/)
    })

    it("包含返回建筑列表的链接", () => {
      expect(getView()).toMatch(/\/admin\/buildings|buildings.*link|返回列表|返回建筑/)
    })
  })

  // ─────────────────────────────────────────
  // §4 风险指标区
  // ─────────────────────────────────────────
  describe("风险指标区", () => {
    it("包含指标区域（data-zone）", () => {
      expect(getView()).toMatch(/zone.*metric|metric.*zone|zone.*analysis|analysis.*zone|data-zone.*metric|data-zone.*analysis/)
    })

    it("展示指标值或分析结果", () => {
      expect(getView()).toMatch(/latestValue|value_num|valueNum|指标值|分析结果|风险评分/)
    })

    it("展示指标风险等级", () => {
      expect(getView()).toMatch(/riskLevel|risk_level|风险等级|RED|ORANGE|YELLOW|GREEN/)
    })

    it("展示计算时间", () => {
      expect(getView()).toMatch(/calcTime|calc_time|计算时间|更新时间|分析时间/)
    })
  })

  // ─────────────────────────────────────────
  // §5 关联告警区
  // ─────────────────────────────────────────
  describe("关联告警区", () => {
    it("包含告警列表区域", () => {
      expect(getView()).toMatch(/alarm.*list|alarms|告警列表|关联告警|data-zone.*alarm/)
    })

    it("展示告警等级或状态", () => {
      expect(getView()).toMatch(/alarm_level|alarmLevel|alarm.*status|告警等级|告警状态/)
    })

    it("告警为空时有空状态提示", () => {
      expect(getView()).toMatch(/暂无告警|v-if.*alarm|alarms.*length|no.*alarm|empty/)
    })
  })

  // ─────────────────────────────────────────
  // §6 关联工单区
  // ─────────────────────────────────────────
  describe("关联工单区", () => {
    it("包含工单列表区域", () => {
      expect(getView()).toMatch(/work.*order|workOrder|工单列表|关联工单|data-zone.*order/)
    })

    it("展示工单编号或状态", () => {
      expect(getView()).toMatch(/orderNo|order_no|工单编号|工单状态|order.*status/)
    })

    it("工单可点击跳转到工单详情", () => {
      expect(getView()).toMatch(/\/admin\/work-orders|work-order.*id|router.*push.*order|查看工单/)
    })
  })

  // ─────────────────────────────────────────
  // §7 UI 规范符合性
  // ─────────────────────────────────────────
  describe("UI 规范符合性", () => {
    it("使用 --pc-shadow 或 box-shadow", () => {
      expect(getView()).toMatch(/--pc-shadow|box-shadow|pc-card/)
    })

    it("包含 tabular-nums 等字体规范", () => {
      expect(getView()).toMatch(/tabular-nums|font-variant-numeric|admin-card__title|admin-page-title/)
    })

    it("使用 risk-dot 风险颜色点", () => {
      expect(getView()).toMatch(/risk-dot--|riskLevel|latestRiskLevel|risk.*dot/)
    })
  })

  // ─────────────────────────────────────────
  // §8 数据绑定与服务层
  // ─────────────────────────────────────────
  describe("数据绑定与服务层", () => {
    it("引入 getBuilding 建筑详情服务", () => {
      expect(getView()).toMatch(/getBuilding|buildingService/)
    })

    it("引入 getAnalysisResult 分析结果服务", () => {
      expect(getView()).toMatch(/getAnalysisResult|analysisService/)
    })

    it("使用 ref( 或 reactive( 声明响应式状态", () => {
      expect(getView()).toMatch(/ref\(|reactive\(/)
    })

    it("使用 onMounted 加载数据", () => {
      expect(getView()).toMatch(/onMounted/)
    })

    it("使用 useRoute 获取动态路由参数 id", () => {
      expect(getView()).toMatch(/useRoute|route\.params|params\.id/)
    })
  })
})

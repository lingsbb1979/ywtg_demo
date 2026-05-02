/**
 * T15.91 管理端数据分析页 /admin/analysis
 *
 * 验收标准：可查看分析结果，并点击重新计算风险
 *
 * 业务场景：
 * 管理员进入分析页 → 选择建筑 → 查看最新分析结果（裂缝/倾角/综合评分）→
 * 点击"重新计算"触发 calculateBuildingRisk → 结果刷新
 *
 * 设计规范要求：
 * - 沿用 PC 管理端企业浅色主题
 * - pc-card / admin-card 卡片容器
 * - pc tokens（--pc-primary / --pc-bg-page / --pc-border）
 * - risk-dot 风险颜色点
 * - tabular-nums 数字字体
 * - 数据来源：analysisService.getAnalysisResult + calculateBuildingRisk
 *
 * 覆盖范围：
 * §1 路由与文件存在性
 * §2 页面布局结构
 * §3 建筑选择区
 * §4 分析结果展示区
 * §5 重新计算功能
 * §6 UI 规范符合性
 * §7 数据绑定与服务层
 */

import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "fs"
import { resolve } from "path"

const SRC    = resolve(__dirname, "../src")
const ROUTES = resolve(SRC, "router/routes.ts")

function getView() {
  return readFileSync(resolve(SRC, "views/admin/AdminAnalysisView.vue"), "utf-8")
}

describe("T15.91 管理端数据分析页 /admin/analysis", () => {

  // ─────────────────────────────────────────
  // §1 路由与文件存在性
  // ─────────────────────────────────────────
  describe("路由与文件存在性", () => {
    it("AdminAnalysisView.vue 文件存在", () => {
      expect(existsSync(resolve(SRC, "views/admin/AdminAnalysisView.vue"))).toBe(true)
    })

    it("routes.ts 包含 /admin/analysis 路由路径", () => {
      expect(readFileSync(ROUTES, "utf-8")).toMatch(/\/admin\/analysis|admin-analysis/)
    })

    it("routes.ts 引入 AdminAnalysisView", () => {
      expect(readFileSync(ROUTES, "utf-8")).toMatch(/AdminAnalysisView/)
    })

    it("页面包含低保真线框注释（T15.91 数据分析）", () => {
      expect(getView()).toMatch(/T15\.91|analysis|数据分析|风险分析|分析结果/)
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

    it("包含页面标题（数据分析相关）", () => {
      expect(getView()).toMatch(/数据分析|风险分析|分析结果|分析中心/)
    })

    it("使用 data-zone 属性标注功能区域", () => {
      expect(getView()).toMatch(/data-zone=/)
    })
  })

  // ─────────────────────────────────────────
  // §3 建筑选择区
  // ─────────────────────────────────────────
  describe("建筑选择区", () => {
    it("包含建筑选择下拉或列表", () => {
      expect(getView()).toMatch(/select.*building|building.*select|selectedBuilding|buildingId|建筑选择|选择建筑/)
    })

    it("建筑选项来自 listBuildings 或 iot_space", () => {
      expect(getView()).toMatch(/listBuildings|iot_space|buildings|buildingList|buildingOptions/)
    })

    it("包含查询/分析触发按钮", () => {
      expect(getView()).toMatch(/btn-pc-primary|查询|查看分析|loadAnalysis|fetchAnalysis|doAnalysis/)
    })
  })

  // ─────────────────────────────────────────
  // §4 分析结果展示区
  // ─────────────────────────────────────────
  describe("分析结果展示区", () => {
    it("包含分析结果展示区域", () => {
      expect(getView()).toMatch(/zone.*result|result.*zone|zone.*analysis|analysis.*result|data-zone.*result/)
    })

    it("展示指标 ID 或名称（裂缝/倾角/综合）", () => {
      expect(getView()).toMatch(/metricId|metric_id|裂缝|倾角|综合评分|指标/)
    })

    it("展示最新值和风险等级", () => {
      expect(getView()).toMatch(/latestValue|valueNum|value_num|风险等级|riskLevel/)
    })

    it("展示风险颜色点", () => {
      expect(getView()).toMatch(/risk-dot--|risk-dot|riskLevel|风险色/)
    })

    it("展示计算时间", () => {
      expect(getView()).toMatch(/calcTime|calc_time|计算时间|最新计算/)
    })

    it("无分析结果时有空状态提示", () => {
      expect(getView()).toMatch(/暂无分析|v-if.*metrics|metrics.*length|empty|no.*result|尚未计算/)
    })
  })

  // ─────────────────────────────────────────
  // §5 重新计算功能
  // ─────────────────────────────────────────
  describe("重新计算功能", () => {
    it("包含重新计算按钮", () => {
      expect(getView()).toMatch(/重新计算|重算|btn.*calc|calc.*btn|recalculate|doCalc/)
    })

    it("重新计算调用 calculateBuildingRisk", () => {
      expect(getView()).toMatch(/calculateBuildingRisk|calcRisk|doCalculate/)
    })

    it("计算完成有操作反馈", () => {
      expect(getView()).toMatch(/msg|message|loading|success|计算完成|已更新/)
    })
  })

  // ─────────────────────────────────────────
  // §6 UI 规范符合性
  // ─────────────────────────────────────────
  describe("UI 规范符合性", () => {
    it("使用 --pc-shadow 或 box-shadow", () => {
      expect(getView()).toMatch(/--pc-shadow|box-shadow|pc-card/)
    })

    it("使用 tabular-nums 数字规范", () => {
      expect(getView()).toMatch(/tabular-nums|font-variant-numeric|font-feature-settings/)
    })

    it("使用 badge 展示风险等级标签", () => {
      expect(getView()).toMatch(/badge|admin-badge|risk.*badge|badge.*risk/)
    })
  })

  // ─────────────────────────────────────────
  // §7 数据绑定与服务层
  // ─────────────────────────────────────────
  describe("数据绑定与服务层", () => {
    it("引入 getAnalysisResult 分析结果查询", () => {
      expect(getView()).toMatch(/getAnalysisResult|analysisService/)
    })

    it("引入 calculateBuildingRisk 风险计算", () => {
      expect(getView()).toMatch(/calculateBuildingRisk|analysisService/)
    })

    it("引入 listBuildings 获取建筑列表", () => {
      expect(getView()).toMatch(/listBuildings|buildingService/)
    })

    it("使用 ref( 或 reactive( 声明响应式状态", () => {
      expect(getView()).toMatch(/ref\(|reactive\(/)
    })

    it("使用 onMounted 初始化数据", () => {
      expect(getView()).toMatch(/onMounted/)
    })
  })
})

/**
 * T15.104 实现 /h5/building/:id/metrics H5 建筑指标页
 *
 * 验收标准：可查看建筑指标简版和风险说明
 *
 * 覆盖范围：
 * §1 文件与路由注册
 * §2 建筑基本信息（建筑名称 / 建筑编码 / 风险等级）
 * §3 指标展示（传感器数据 / 分析结果 / 风险等级说明）
 * §4 数据来源（getTable / analysisService）
 * §5 UI 规范符合性（h5 tokens / h5-card / tabular-nums）
 * §6 响应式绑定
 */

import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "fs"
import { resolve } from "path"

const SRC    = resolve(__dirname, "../src")
const ROUTES = resolve(SRC, "router/routes.ts")

function getView() {
  return readFileSync(resolve(SRC, "views/h5/H5BuildingMetricsView.vue"), "utf-8")
}

describe("T15.104 /h5/building/:id/metrics H5 建筑指标页", () => {

  // ─────────────────────────────────────────
  // §1 文件与路由注册
  // ─────────────────────────────────────────
  describe("§1 文件与路由注册", () => {
    it("H5BuildingMetricsView.vue 文件存在", () => {
      expect(existsSync(resolve(SRC, "views/h5/H5BuildingMetricsView.vue"))).toBe(true)
    })

    it("routes.ts 包含 h5/building/:id/metrics 路径", () => {
      expect(readFileSync(ROUTES, "utf-8")).toMatch(/building\/:id\/metrics|h5-building-metrics/)
    })

    it("routes.ts 引入 H5BuildingMetricsView", () => {
      expect(readFileSync(ROUTES, "utf-8")).toMatch(/H5BuildingMetricsView/)
    })
  })

  // ─────────────────────────────────────────
  // §2 建筑基本信息
  // ─────────────────────────────────────────
  describe("§2 建筑基本信息", () => {
    it("展示建筑名称（buildingName 或 building.name）", () => {
      expect(getView()).toMatch(/buildingName|building\.name|building\?\.name/)
    })

    it("展示风险等级（riskLevel 或 risk_level 或 风险）", () => {
      expect(getView()).toMatch(/riskLevel|risk_level|风险/)
    })

    it("使用 h5-card 卡片样式", () => {
      expect(getView()).toMatch(/h5-card/)
    })
  })

  // ─────────────────────────────────────────
  // §3 指标展示
  // ─────────────────────────────────────────
  describe("§3 指标展示", () => {
    it("展示建筑监测指标（指标 / metrics / 传感器 / 数据）", () => {
      expect(getView()).toMatch(/指标|metrics|传感器|数据|sensor/)
    })

    it("使用 v-for 遍历指标列表", () => {
      expect(getView()).toMatch(/v-for/)
    })

    it("展示告警状态（alarm_level 或 alarmLevel 或 告警）", () => {
      expect(getView()).toMatch(/alarmLevel|alarm_level|告警/)
    })
  })

  // ─────────────────────────────────────────
  // §4 数据来源
  // ─────────────────────────────────────────
  describe("§4 数据来源", () => {
    it("从 iot_space 或 space_analysis_archive 或其他相关表获取数据", () => {
      expect(getView()).toMatch(/iot_space|space_analysis_archive|iot_measure_point|getTable|analysisService/)
    })
  })

  // ─────────────────────────────────────────
  // §5 UI 规范符合性
  // ─────────────────────────────────────────
  describe("§5 UI 规范符合性", () => {
    it("使用 tabular-nums 数字等宽显示", () => {
      expect(getView()).toMatch(/tabular-nums/)
    })

    it("使用 H5 背景或容器（--h5-bg-page 或 h5-building 或 h5-main）", () => {
      expect(getView()).toMatch(/--h5-bg-page|h5-building|h5-main/)
    })

    it("顶部返回导航（h5-header 或 goBack 或 返回）", () => {
      expect(getView()).toMatch(/h5-header|goBack|←|返回/)
    })
  })

  // ─────────────────────────────────────────
  // §6 响应式绑定
  // ─────────────────────────────────────────
  describe("§6 响应式绑定", () => {
    it("使用 ref( 定义响应式数据", () => {
      expect(getView()).toMatch(/ref\(/)
    })

    it("使用 onMounted 初始化数据", () => {
      expect(getView()).toMatch(/onMounted/)
    })

    it("从路由参数获取建筑 ID（route.params.id）", () => {
      expect(getView()).toMatch(/route\.params\.id|useRoute/)
    })
  })
})

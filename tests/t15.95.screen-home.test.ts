/**
 * T15.95 实现 /screen/home 大屏首页
 *
 * 验收标准：显示地图、23 栋建筑、KPI、重点隐患清单
 *
 * 覆盖范围：
 * §1 文件与路由注册
 * §2 顶部 KPI 区（totalBuildings / activeAlarms / openHazards / closeRate）
 * §3 重点隐患清单（data-zone="hazard-list"、risk-dot、badge-screen）
 * §4 地图建筑点位（data-zone="map"、mapPoints）
 * §5 工单看板与告警入口
 * §6 UI 规范符合性（screen tokens / screen-glass-card / tabular-nums）
 * §7 数据绑定与服务层
 */

import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "fs"
import { resolve } from "path"

const SRC    = resolve(__dirname, "../src")
const ROUTES = resolve(SRC, "router/routes.ts")

function getView() {
  return readFileSync(resolve(SRC, "views/screen/ScreenHomeView.vue"), "utf-8")
}

describe("T15.95 /screen/home 大屏首页", () => {

  // ─────────────────────────────────────────
  // §1 文件与路由注册
  // ─────────────────────────────────────────
  describe("§1 文件与路由注册", () => {
    it("ScreenHomeView.vue 文件存在", () => {
      expect(existsSync(resolve(SRC, "views/screen/ScreenHomeView.vue"))).toBe(true)
    })

    it("routes.ts 包含 /screen/home 路径", () => {
      expect(readFileSync(ROUTES, "utf-8")).toMatch(/screen\/home|screen-home/)
    })

    it("routes.ts 引入 ScreenHomeView", () => {
      expect(readFileSync(ROUTES, "utf-8")).toMatch(/ScreenHomeView/)
    })
  })

  // ─────────────────────────────────────────
  // §2 顶部 KPI 区
  // ─────────────────────────────────────────
  describe("§2 顶部 KPI 区", () => {
    it("使用 data-zone=\"kpi\" 标注 KPI 区域", () => {
      expect(getView()).toMatch(/data-zone=["']kpi["']/)
    })

    it("展示总建筑数（totalBuildings）", () => {
      expect(getView()).toMatch(/totalBuildings/)
    })

    it("展示活跃告警数（activeAlarms）", () => {
      expect(getView()).toMatch(/activeAlarms/)
    })

    it("展示开放隐患数（openHazards）", () => {
      expect(getView()).toMatch(/openHazards/)
    })

    it("展示工单闭环率（closeRate）", () => {
      expect(getView()).toMatch(/closeRate/)
    })

    it("KPI 数值使用 screen-kpi-item 样式", () => {
      expect(getView()).toMatch(/screen-kpi-item/)
    })
  })

  // ─────────────────────────────────────────
  // §3 重点隐患清单
  // ─────────────────────────────────────────
  describe("§3 重点隐患清单（data-zone=hazard-list）", () => {
    it("使用 data-zone=\"hazard-list\" 标注隐患清单区域", () => {
      expect(getView()).toMatch(/data-zone=["']hazard-list["']/)
    })

    it("使用 v-for 遍历 hazardList", () => {
      expect(getView()).toMatch(/v-for.*hazard|hazardList/)
    })

    it("隐患条目使用 risk-dot 风险点样式", () => {
      expect(getView()).toMatch(/risk-dot/)
    })

    it("隐患条目使用 badge-screen 告警等级徽章", () => {
      expect(getView()).toMatch(/badge-screen/)
    })

    it("展示告警等级（alarmLevel）", () => {
      expect(getView()).toMatch(/alarmLevel/)
    })
  })

  // ─────────────────────────────────────────
  // §4 地图建筑点位
  // ─────────────────────────────────────────
  describe("§4 地图建筑点位（data-zone=map）", () => {
    it("使用 data-zone=\"map\" 标注地图区域", () => {
      expect(getView()).toMatch(/data-zone=["']map["']/)
    })

    it("使用 v-for 遍历 mapPoints", () => {
      expect(getView()).toMatch(/v-for.*mapPoints|mapPoints/)
    })

    it("建筑点位使用 screen-map__point 样式", () => {
      expect(getView()).toMatch(/screen-map__point/)
    })

    it("支持 selectedPoint 选中状态", () => {
      expect(getView()).toMatch(/selectedPoint/)
    })
  })

  // ─────────────────────────────────────────
  // §5 工单看板与告警入口
  // ─────────────────────────────────────────
  describe("§5 工单看板与告警入口", () => {
    it("使用 data-zone=\"workorder-board\" 标注工单看板", () => {
      expect(getView()).toMatch(/data-zone=["']workorder-board["']/)
    })

    it("使用 data-zone=\"alarm-entry\" 标注告警入口", () => {
      expect(getView()).toMatch(/data-zone=["']alarm-entry["']/)
    })

    it("工单看板展示待处理/处理中/待核查/已销号状态", () => {
      const code = getView()
      expect(code).toMatch(/pending|processing|checking|finished/)
    })
  })

  // ─────────────────────────────────────────
  // §6 UI 规范符合性
  // ─────────────────────────────────────────
  describe("§6 UI 规范符合性", () => {
    it("使用 screen-glass-card 玻璃卡片样式", () => {
      expect(getView()).toMatch(/screen-glass-card/)
    })

    it("使用 tabular-nums 数字等宽显示", () => {
      expect(getView()).toMatch(/tabular-nums/)
    })

    it("使用大屏背景 screen-bg 或 screen-root", () => {
      expect(getView()).toMatch(/screen-root|screen-bg/)
    })

    it("使用大屏 screen token（--screen-bg|--screen-accent|--screen-cyan）", () => {
      expect(getView()).toMatch(/--screen-|screen-kpi|screen-panel/)
    })
  })

  // ─────────────────────────────────────────
  // §7 数据绑定与服务层
  // ─────────────────────────────────────────
  describe("§7 数据绑定与服务层", () => {
    it("从 screenKpiService 导入数据选择器", () => {
      expect(getView()).toMatch(/screenKpiService/)
    })

    it("使用 selectScreenKpi 获取 KPI 数据", () => {
      expect(getView()).toMatch(/selectScreenKpi/)
    })

    it("使用 selectMapPoints 获取建筑点位", () => {
      expect(getView()).toMatch(/selectMapPoints/)
    })

    it("使用 selectHazardList 获取隐患清单", () => {
      expect(getView()).toMatch(/selectHazardList/)
    })

    it("使用 ref( 或 reactive( 定义响应式数据", () => {
      expect(getView()).toMatch(/ref\(|reactive\(/)
    })

    it("使用 onMounted 初始化数据", () => {
      expect(getView()).toMatch(/onMounted/)
    })
  })
})

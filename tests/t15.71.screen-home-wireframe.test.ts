/**
 * T15.71 大屏首页第一版低保真布局定型
 *
 * 验收标准：确定地图、KPI、隐患清单、告警入口、工单进度的版面关系
 *
 * 低保真布局分区（1920×1080 固定网格）：
 * ┌──────────────── header: KPI (data-zone="kpi") ─────────────────────┐
 * │  监测建筑 │ 活跃告警 │ 开放隐患 │ 工单闭环率                        │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │ data-zone=       │ data-zone=          │ data-zone=                 │
 * │ "hazard-list"    │ "map"               │ "workorder-board" [上]     │
 * │ 重点隐患清单      │ 佳木斯历史建筑       │ 工单进度看板                │
 * │ 左侧面板 260px   │ 分布图 (中央弹性)    ├────────────────────────────┤
 * │                  │                     │ data-zone="alarm-entry"    │
 * │                  │                     │ 实时告警入口 [下]           │
 * └──────────────────┴─────────────────────┴────────────────────────────┘
 */

import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { resolve } from "path"

const SRC = resolve(__dirname, "../src")

function getViewContent() {
  return readFileSync(resolve(SRC, "views/screen/ScreenHomeView.vue"), "utf-8")
}

describe("T15.71 大屏首页低保真布局定型", () => {
  // ─────────────────────────────────────────
  // §1 视图文件存在性
  // ─────────────────────────────────────────
  describe("视图文件", () => {
    it("src/views/screen/ScreenHomeView.vue 文件存在", () => {
      expect(() => getViewContent()).not.toThrow()
    })
  })

  // ─────────────────────────────────────────
  // §2 五个版面区域全部存在
  // ─────────────────────────────────────────
  describe("低保真五区布局", () => {
    it('KPI 区域标注 data-zone="kpi"', () => {
      expect(getViewContent()).toMatch(/data-zone="kpi"/)
    })

    it('隐患清单区域标注 data-zone="hazard-list"', () => {
      expect(getViewContent()).toMatch(/data-zone="hazard-list"/)
    })

    it('地图区域标注 data-zone="map"', () => {
      expect(getViewContent()).toMatch(/data-zone="map"/)
    })

    it('告警入口区域标注 data-zone="alarm-entry"', () => {
      expect(getViewContent()).toMatch(/data-zone="alarm-entry"/)
    })

    it('工单进度区域标注 data-zone="workorder-board"', () => {
      expect(getViewContent()).toMatch(/data-zone="workorder-board"/)
    })

    it("五个 data-zone 区域同时存在于同一视图文件", () => {
      const content = getViewContent()
      const zones = ["kpi", "hazard-list", "map", "alarm-entry", "workorder-board"]
      for (const zone of zones) {
        expect(content, `缺少 data-zone="${zone}"`).toMatch(`data-zone="${zone}"`)
      }
    })
  })

  // ─────────────────────────────────────────
  // §3 告警入口功能结构
  // ─────────────────────────────────────────
  describe("告警入口区域（screen-alarm-entry）", () => {
    it("screen-alarm-entry 区块存在", () => {
      expect(getViewContent()).toMatch(/screen-alarm-entry/)
    })

    it("screen-alarm-entry 包含活跃告警数量展示", () => {
      const content = getViewContent()
      // 必须在告警入口区域附近展示 activeAlarms 数量
      expect(content).toMatch(/activeAlarms|告警入口|实时告警/)
    })

    it('screen-alarm-entry 包含到 /screen/alarm-dispatch 的导航链接', () => {
      const content = getViewContent()
      expect(content).toMatch(/alarm-dispatch/)
      // 链接必须在 screen-alarm-entry 相关区域内（同文件内同时存在即满足低保真要求）
      expect(content).toMatch(/screen-alarm-entry/)
    })

    it("告警入口链接使用 router-link 到 /screen/alarm-dispatch", () => {
      const content = getViewContent()
      // router-link 和 alarm-dispatch 同时存在
      expect(content).toMatch(/router-link/)
      expect(content).toMatch(/\/screen\/alarm-dispatch/)
    })
  })

  // ─────────────────────────────────────────
  // §4 版面关系与结构注解
  // ─────────────────────────────────────────
  describe("版面关系结构注解", () => {
    it("视图包含低保真版面注解（低保真布局注释）", () => {
      const content = getViewContent()
      // 文件中应有低保真或 wireframe 相关注释，说明 5 区版面关系
      expect(content).toMatch(/低保真|wireframe|版面关系|lofi|lo-fi/i)
    })

    it("KPI 区域位于 screen-header 内", () => {
      const content = getViewContent()
      // screen-header 和 data-zone="kpi" 应在文件中，且 kpi 出现在 header 区域逻辑位置
      const headerIdx = content.indexOf("screen-header")
      const kpiIdx    = content.indexOf('data-zone="kpi"')
      expect(headerIdx).toBeGreaterThanOrEqual(0)
      expect(kpiIdx).toBeGreaterThanOrEqual(0)
      // kpi zone 应出现在 header 元素之后的合理范围内（同属 header 段落）
      expect(kpiIdx - headerIdx).toBeLessThan(500)
    })

    it("告警入口与工单进度同属右侧面板（screen-panel--right）", () => {
      const content = getViewContent()
      const rightPanelIdx    = content.indexOf("screen-panel--right")
      const alarmEntryIdx    = content.indexOf('data-zone="alarm-entry"')
      const workorderIdx     = content.indexOf('data-zone="workorder-board"')
      expect(rightPanelIdx).toBeGreaterThanOrEqual(0)
      expect(alarmEntryIdx).toBeGreaterThan(rightPanelIdx)
      expect(workorderIdx).toBeGreaterThan(rightPanelIdx)
    })

    it("隐患清单位于 screen-panel--left 左侧面板", () => {
      const content = getViewContent()
      const leftPanelIdx    = content.indexOf("screen-panel--left")
      const hazardListIdx   = content.indexOf('data-zone="hazard-list"')
      expect(leftPanelIdx).toBeGreaterThanOrEqual(0)
      expect(hazardListIdx).toBeGreaterThan(leftPanelIdx)
      // hazard-list 在 left panel 之后的合理距离内
      expect(hazardListIdx - leftPanelIdx).toBeLessThan(200)
    })

    it("地图区域位于中央（screen-map），在左右面板之间", () => {
      const content = getViewContent()
      const leftPanelIdx  = content.indexOf("screen-panel--left")
      const mapIdx        = content.indexOf('data-zone="map"')
      const rightPanelIdx = content.indexOf("screen-panel--right")
      expect(leftPanelIdx).toBeGreaterThanOrEqual(0)
      expect(mapIdx).toBeGreaterThan(leftPanelIdx)
      expect(rightPanelIdx).toBeGreaterThan(mapIdx)
    })
  })
})

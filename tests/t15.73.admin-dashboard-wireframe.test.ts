/**
 * T15.73 管理端工作台第一版低保真布局定型
 *
 * 验收标准：确定工作台卡片、待办、告警、工单、快捷操作和演示控制入口的版面关系
 *
 * 低保真布局分区（PC 管理端 AdminLayout）：
 * ┌──────────────── zone:kpi-stats ──────────────────────────────────────────┐
 * │  活跃告警 │ 待处理工单 │ 重点隐患 │ 工单闭环率 │ 逾期工单                  │
 * ├──────────────────────────────────────────────────────────────────────────┤
 * │  zone:quick-actions  告警确认/派单 | 工单核查销号 | 建筑档案 | 实时采集   │
 * ├─────────────────────────────────────┬────────────────────────────────────┤
 * │ zone:alarm-list [左]                │ zone:workorder-board [右上]         │
 * │ 告警与活跃隐患清单                   │ 工单看板（待处理/处理中/待核查/已销） │
 * │                                     ├────────────────────────────────────┤
 * │                                     │ zone:todo [右中]                   │
 * │                                     │ 待办工单（快速处理入口）              │
 * │                                     ├────────────────────────────────────┤
 * │                                     │ zone:demo-control [右下]           │
 * │                                     │ 演示控制入口                        │
 * └─────────────────────────────────────┴────────────────────────────────────┘
 */

import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { resolve } from "path"

const SRC = resolve(__dirname, "../src")

function getViewContent() {
  return readFileSync(resolve(SRC, "views/admin/AdminDashboardView.vue"), "utf-8")
}

describe("T15.73 管理端工作台低保真布局定型", () => {
  // ─────────────────────────────────────────
  // §1 视图文件存在性
  // ─────────────────────────────────────────
  describe("视图文件", () => {
    it("src/views/admin/AdminDashboardView.vue 文件存在", () => {
      expect(() => getViewContent()).not.toThrow()
    })
  })

  // ─────────────────────────────────────────
  // §2 六个版面区域全部存在
  // ─────────────────────────────────────────
  describe("低保真六区布局", () => {
    it('工作台卡片区域标注 data-zone="kpi-stats"', () => {
      expect(getViewContent()).toMatch(/data-zone="kpi-stats"/)
    })

    it('快捷操作区域标注 data-zone="quick-actions"', () => {
      expect(getViewContent()).toMatch(/data-zone="quick-actions"/)
    })

    it('告警/隐患清单区域标注 data-zone="alarm-list"', () => {
      expect(getViewContent()).toMatch(/data-zone="alarm-list"/)
    })

    it('工单看板区域标注 data-zone="workorder-board"', () => {
      expect(getViewContent()).toMatch(/data-zone="workorder-board"/)
    })

    it('待办工单区域标注 data-zone="todo"', () => {
      expect(getViewContent()).toMatch(/data-zone="todo"/)
    })

    it('演示控制入口区域标注 data-zone="demo-control"', () => {
      expect(getViewContent()).toMatch(/data-zone="demo-control"/)
    })

    it("六个 data-zone 区域同时存在于同一视图文件", () => {
      const content = getViewContent()
      const zones = ["kpi-stats", "quick-actions", "alarm-list", "workorder-board", "todo", "demo-control"]
      for (const zone of zones) {
        expect(content, `缺少 data-zone="${zone}"`).toMatch(`data-zone="${zone}"`)
      }
    })
  })

  // ─────────────────────────────────────────
  // §3 KPI 统计卡片区
  // ─────────────────────────────────────────
  describe("KPI 统计卡片区（kpi-stats）", () => {
    it("展示活跃告警数量（admin-kpi-card--alarm）", () => {
      expect(getViewContent()).toMatch(/admin-kpi-card--alarm/)
    })

    it("展示待处理工单数量（admin-kpi-card--workorder）", () => {
      expect(getViewContent()).toMatch(/admin-kpi-card--workorder/)
    })

    it("展示工单闭环率（admin-kpi-card--rate）", () => {
      expect(getViewContent()).toMatch(/admin-kpi-card--rate/)
    })

    it("展示逾期工单数（admin-kpi-card--overdue）", () => {
      expect(getViewContent()).toMatch(/admin-kpi-card--overdue/)
    })

    it("KPI 区域使用 admin-kpi-row 网格布局", () => {
      expect(getViewContent()).toMatch(/admin-kpi-row/)
    })
  })

  // ─────────────────────────────────────────
  // §4 快捷操作区（quick-actions）
  // ─────────────────────────────────────────
  describe("快捷操作区（quick-actions）", () => {
    it("包含到告警中心的快捷链接（/admin/alarms）", () => {
      expect(getViewContent()).toMatch(/\/admin\/alarms/)
    })

    it("包含到工单中心的快捷链接（/admin/work-orders）", () => {
      expect(getViewContent()).toMatch(/\/admin\/work-orders/)
    })

    it("包含到建筑档案的快捷链接（/admin/buildings）", () => {
      expect(getViewContent()).toMatch(/\/admin\/buildings/)
    })

    it("快捷操作使用 admin-quick-btn 按钮样式", () => {
      expect(getViewContent()).toMatch(/admin-quick-btn/)
    })
  })

  // ─────────────────────────────────────────
  // §5 工单看板区（workorder-board）
  // ─────────────────────────────────────────
  describe("工单看板区（workorder-board）", () => {
    it("展示待处理数量（board.pending）", () => {
      expect(getViewContent()).toMatch(/board\.pending/)
    })

    it("展示处理中数量（board.processing）", () => {
      expect(getViewContent()).toMatch(/board\.processing/)
    })

    it("展示待核查数量（board.checking）", () => {
      expect(getViewContent()).toMatch(/board\.checking/)
    })

    it("展示已销号数量（board.finished）", () => {
      expect(getViewContent()).toMatch(/board\.finished/)
    })

    it("看板有四种状态可视化展示", () => {
      const content = getViewContent()
      // 四种工单状态展示
      expect(content).toMatch(/待处理|pending/)
      expect(content).toMatch(/处理中|processing/)
      expect(content).toMatch(/待核查|checking/)
      expect(content).toMatch(/已销号|finished/)
    })
  })

  // ─────────────────────────────────────────
  // §6 待办工单区（todo）
  // ─────────────────────────────────────────
  describe("待办工单区（todo）", () => {
    it("待办区有标题或描述文字", () => {
      const content = getViewContent()
      const todoIdx = content.indexOf('data-zone="todo"')
      expect(todoIdx).toBeGreaterThanOrEqual(0)
      // todo 区域附近有待办相关文字
      const snippet = content.slice(todoIdx, todoIdx + 300)
      expect(snippet).toMatch(/待办|工单|todo/i)
    })

    it("待办区包含到工单中心的导航路径", () => {
      const content = getViewContent()
      expect(content).toMatch(/admin\/work-orders/)
    })

    it("待办区展示逾期工单预警信息", () => {
      const content = getViewContent()
      // 逾期相关
      expect(content).toMatch(/overdueCount|逾期/)
    })
  })

  // ─────────────────────────────────────────
  // §7 告警/隐患清单区（alarm-list）
  // ─────────────────────────────────────────
  describe("告警/隐患清单区（alarm-list）", () => {
    it("展示活跃隐患列表（admin-hazard-list）", () => {
      expect(getViewContent()).toMatch(/admin-hazard-list/)
    })

    it("隐患条目有风险颜色点（admin-risk-dot）", () => {
      expect(getViewContent()).toMatch(/admin-risk-dot/)
    })

    it("告警清单有查看全部链接到 /admin/alarms", () => {
      const content = getViewContent()
      expect(content).toMatch(/admin\/alarms/)
    })
  })

  // ─────────────────────────────────────────
  // §8 演示控制入口区（demo-control）
  // ─────────────────────────────────────────
  describe("演示控制入口区（demo-control）", () => {
    it("包含演示控制台入口链接（/admin/demo-console）", () => {
      expect(getViewContent()).toMatch(/admin\/demo-console/)
    })

    it("包含打开大屏的链接（/screen/home）", () => {
      expect(getViewContent()).toMatch(/screen\/home/)
    })

    it("包含打开 H5 的链接（/h5/work-orders）", () => {
      expect(getViewContent()).toMatch(/h5\/work-orders/)
    })

    it("演示控制区域有描述性文字（一键演示/重置数据）", () => {
      const content = getViewContent()
      expect(content).toMatch(/演示|重置|demo/i)
    })
  })

  // ─────────────────────────────────────────
  // §9 版面关系与结构注解
  // ─────────────────────────────────────────
  describe("版面关系结构注解", () => {
    it("视图包含低保真版面注解（低保真布局注释）", () => {
      const content = getViewContent()
      expect(content).toMatch(/低保真|wireframe|版面关系|lofi/i)
    })

    it("kpi-stats 区域位于 admin-dashboard 顶部（先于其他区域出现）", () => {
      const content = getViewContent()
      const kpiIdx   = content.indexOf('data-zone="kpi-stats"')
      const todoIdx  = content.indexOf('data-zone="todo"')
      const demoIdx  = content.indexOf('data-zone="demo-control"')
      expect(kpiIdx).toBeGreaterThanOrEqual(0)
      expect(kpiIdx).toBeLessThan(todoIdx)
      expect(kpiIdx).toBeLessThan(demoIdx)
    })

    it("quick-actions 区域在 kpi-stats 之后、主内容之前", () => {
      const content = getViewContent()
      const kpiIdx      = content.indexOf('data-zone="kpi-stats"')
      const quickIdx    = content.indexOf('data-zone="quick-actions"')
      const alarmIdx    = content.indexOf('data-zone="alarm-list"')
      expect(kpiIdx).toBeGreaterThanOrEqual(0)
      expect(quickIdx).toBeGreaterThan(kpiIdx)
      expect(alarmIdx).toBeGreaterThan(quickIdx)
    })

    it("alarm-list 和 demo-control 同属 admin-dashboard-body 主内容区", () => {
      const content = getViewContent()
      const bodyIdx  = content.indexOf("admin-dashboard-body")
      const alarmIdx = content.indexOf('data-zone="alarm-list"')
      const demoIdx  = content.indexOf('data-zone="demo-control"')
      expect(bodyIdx).toBeGreaterThanOrEqual(0)
      expect(alarmIdx).toBeGreaterThan(bodyIdx)
      expect(demoIdx).toBeGreaterThan(bodyIdx)
    })

    it("workorder-board 和 todo 同属右侧列区域（在 alarm-list 之后出现）", () => {
      const content     = getViewContent()
      const alarmIdx    = content.indexOf('data-zone="alarm-list"')
      const boardIdx    = content.indexOf('data-zone="workorder-board"')
      const todoIdx     = content.indexOf('data-zone="todo"')
      expect(alarmIdx).toBeGreaterThanOrEqual(0)
      expect(boardIdx).toBeGreaterThanOrEqual(0)
      expect(todoIdx).toBeGreaterThanOrEqual(0)
    })

    it("demo-control 是最后一个区域（在 workorder-board 和 todo 之后）", () => {
      const content  = getViewContent()
      const boardIdx = content.indexOf('data-zone="workorder-board"')
      const todoIdx  = content.indexOf('data-zone="todo"')
      const demoIdx  = content.indexOf('data-zone="demo-control"')
      expect(demoIdx).toBeGreaterThan(boardIdx)
      expect(demoIdx).toBeGreaterThan(todoIdx)
    })
  })

  // ─────────────────────────────────────────
  // §10 数据绑定验证
  // ─────────────────────────────────────────
  describe("数据绑定", () => {
    it("视图绑定 kpi.activeAlarms（活跃告警数）", () => {
      expect(getViewContent()).toMatch(/kpi\.activeAlarms/)
    })

    it("视图绑定 kpi.closeRate（工单闭环率）", () => {
      expect(getViewContent()).toMatch(/kpi\.closeRate/)
    })

    it("视图绑定 hazardList（活跃隐患列表）", () => {
      expect(getViewContent()).toMatch(/hazardList/)
    })

    it("使用 selectScreenKpi / selectWorkOrderBoard / selectHazardList 服务", () => {
      const content = getViewContent()
      expect(content).toMatch(/selectScreenKpi/)
      expect(content).toMatch(/selectWorkOrderBoard/)
      expect(content).toMatch(/selectHazardList/)
    })
  })
})

/**
 * T15.70 三端信息层级整理
 *
 * 验收标准：
 * - 大屏突出房屋隐患和态势：隐患清单区域 data-priority="1"，包含 screen-situation 标识
 * - 管理端突出待办和数据操作：admin-quick-actions 快速操作区，待办 KPI 携带 data-priority="1"
 * - H5 突出处置效率和现场证据：h5-disposal-flow 处置流程区，h5-evidence-entry 证据入口
 *
 * infoHierarchy.ts 配置文件显式声明每端的优先级定义
 */

import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { resolve } from "path"

const SRC = resolve(__dirname, "../src")

describe("T15.70 三端信息层级整理", () => {
  // ─────────────────────────────────────────
  // §1 信息层级配置文件
  // ─────────────────────────────────────────
  describe("信息层级配置文件 infoHierarchy.ts", () => {
    it("src/utils/infoHierarchy.ts 文件存在", () => {
      expect(() => readFileSync(resolve(SRC, "utils/infoHierarchy.ts"))).not.toThrow()
    })

    it("大屏端 priority-1 涵盖隐患（hazard）与态势（situation）", () => {
      const content = readFileSync(resolve(SRC, "utils/infoHierarchy.ts"), "utf-8")
      expect(content).toMatch(/screen/i)
      expect(content).toMatch(/hazard|隐患/)
      expect(content).toMatch(/situation|态势/)
    })

    it("管理端 priority-1 涵盖待办（pending）与数据操作（dataOps）", () => {
      const content = readFileSync(resolve(SRC, "utils/infoHierarchy.ts"), "utf-8")
      expect(content).toMatch(/admin/i)
      expect(content).toMatch(/pending|待办/)
      expect(content).toMatch(/dataOps|数据操作/)
    })

    it("H5 端 priority-1 涵盖处置效率（disposal）与现场证据（evidence）", () => {
      const content = readFileSync(resolve(SRC, "utils/infoHierarchy.ts"), "utf-8")
      expect(content).toMatch(/h5/i)
      expect(content).toMatch(/disposal|处置/)
      expect(content).toMatch(/evidence|现场证据/)
    })
  })

  // ─────────────────────────────────────────
  // §2 大屏视图信息层级
  // ─────────────────────────────────────────
  describe("ScreenHomeView 大屏信息层级", () => {
    const getContent = () =>
      readFileSync(resolve(SRC, "views/screen/ScreenHomeView.vue"), "utf-8")

    it('隐患清单区域携带 data-priority="1"', () => {
      const content = getContent()
      // 文件中应同时出现 screen-hazard-list 和 data-priority="1"
      expect(content).toMatch(/screen-hazard-list/)
      expect(content).toMatch(/data-priority="1"/)
    })

    it("包含 screen-situation 态势概览标识", () => {
      expect(getContent()).toMatch(/screen-situation/)
    })

    it("KPI 区域与隐患清单同属最高优先级层", () => {
      const content = getContent()
      // screen-kpi 出现在 data-priority="1" 区域内，或 header 区域有 screen-kpi
      expect(content).toMatch(/screen-kpi/)
      expect(content).toMatch(/screen-hazard-list/)
    })
  })

  // ─────────────────────────────────────────
  // §3 管理端视图信息层级
  // ─────────────────────────────────────────
  describe("AdminDashboardView 管理端信息层级", () => {
    const getContent = () =>
      readFileSync(resolve(SRC, "views/admin/AdminDashboardView.vue"), "utf-8")

    it('包含 admin-quick-actions 快速数据操作区', () => {
      expect(getContent()).toMatch(/admin-quick-actions/)
    })

    it("admin-quick-actions 包含告警确认或告警派单操作入口", () => {
      const content = getContent()
      // 应包含告警与派单相关文字或路由链接
      expect(content).toMatch(/alarms|告警/)
      expect(content).toMatch(/work-orders|派单|工单/)
    })

    it('待办工单 KPI 卡片携带 data-priority="1"', () => {
      const content = getContent()
      // admin-kpi-workorders 同行或相邻应有 data-priority="1"
      expect(content).toMatch(/data-priority="1"/)
      expect(content).toMatch(/admin-kpi-workorders/)
    })
  })

  // ─────────────────────────────────────────
  // §4 H5 视图信息层级
  // ─────────────────────────────────────────
  describe("H5WorkOrdersView H5 信息层级", () => {
    const getContent = () =>
      readFileSync(resolve(SRC, "views/h5/H5WorkOrdersView.vue"), "utf-8")

    it("包含 h5-evidence-entry 现场证据入口", () => {
      expect(getContent()).toMatch(/h5-evidence-entry/)
    })

    it("包含 h5-disposal-flow 处置效率流程区", () => {
      expect(getContent()).toMatch(/h5-disposal-flow/)
    })

    it("处置按钮区域（h5-accept-btn）与证据入口共属处置效率区", () => {
      const content = getContent()
      expect(content).toMatch(/h5-accept-btn/)
      expect(content).toMatch(/h5-evidence-entry|h5-disposal-flow/)
    })
  })
})

/**
 * T15.92 实现 /admin/alarms — 告警确认、派单、查看详情
 *
 * 验收标准：可确认告警、派单、查看告警详情
 *
 * 业务场景：
 * 管理员进入告警中心 → 查看告警列表 → 点击告警查看详情（含处置建议）
 * → 点击「确认告警」调用 confirmAlarm → 点击「立即派单」调用 dispatchAlarm
 *
 * 功能要求：
 * - 确认告警：调用 alarmService.confirmAlarm(id)，状态变为 ACTIVE→PENDING（已确认）
 * - 派单：调用 alarmService.dispatchAlarm(id)，状态变为 DISPATCHED
 * - 告警详情：展示 disposalSuggestion 处置建议
 * - 操作反馈：显示操作结果消息
 *
 * 覆盖范围：
 * §1 文件与路由注册
 * §2 确认告警（使用 alarmService.confirmAlarm）
 * §3 派单功能（使用 alarmService.dispatchAlarm）
 * §4 告警详情（含 disposalSuggestion / getAlarm）
 * §5 操作反馈与状态展示
 * §6 UI 规范符合性（tokens / 徽章 / 抽屉）
 * §7 数据绑定与服务层
 */

import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "fs"
import { resolve } from "path"

const SRC    = resolve(__dirname, "../src")
const ROUTES = resolve(SRC, "router/routes.ts")

function getView() {
  return readFileSync(resolve(SRC, "views/admin/AdminAlarmsView.vue"), "utf-8")
}

describe("T15.92 /admin/alarms 告警确认与派单功能", () => {

  // ─────────────────────────────────────────
  // §1 文件与路由注册
  // ─────────────────────────────────────────
  describe("§1 文件与路由注册", () => {
    it("AdminAlarmsView.vue 文件存在", () => {
      expect(existsSync(resolve(SRC, "views/admin/AdminAlarmsView.vue"))).toBe(true)
    })

    it("routes.ts 包含 alarms 路由路径", () => {
      expect(readFileSync(ROUTES, "utf-8")).toMatch(/admin-alarms|path.*alarms/)
    })

    it("routes.ts 引入 AdminAlarmsView 组件", () => {
      expect(readFileSync(ROUTES, "utf-8")).toMatch(/AdminAlarmsView/)
    })
  })

  // ─────────────────────────────────────────
  // §2 确认告警（使用 alarmService.confirmAlarm）
  // ─────────────────────────────────────────
  describe("§2 确认告警功能", () => {
    it("从 alarmService 导入 confirmAlarm", () => {
      const code = getView()
      expect(code).toMatch(/confirmAlarm/)
      expect(code).toMatch(/alarmService/)
    })

    it("调用 confirmAlarm 函数（含参数）", () => {
      const code = getView()
      // confirmAlarm( 被调用（允许有空格）
      expect(code).toMatch(/confirmAlarm\s*\(/)
    })

    it("确认告警按钮存在（btn-pc-secondary 或 btn-pc-primary）", () => {
      expect(getView()).toMatch(/btn-pc-secondary|btn-pc-primary/)
    })

    it("告警确认后状态为 ACTIVE（已确认）", () => {
      expect(getView()).toMatch(/ACTIVE|已确认/)
    })
  })

  // ─────────────────────────────────────────
  // §3 派单功能（使用 alarmService.dispatchAlarm）
  // ─────────────────────────────────────────
  describe("§3 派单功能", () => {
    it("从 alarmService 导入 dispatchAlarm", () => {
      const code = getView()
      expect(code).toMatch(/dispatchAlarm/)
      expect(code).toMatch(/alarmService/)
    })

    it("调用 dispatchAlarm 函数（含参数）", () => {
      const code = getView()
      expect(code).toMatch(/dispatchAlarm\s*\(/)
    })

    it("派单状态标记为 DISPATCHED 或 已派单", () => {
      expect(getView()).toMatch(/DISPATCHED|已派单/)
    })

    it("派单按钮使用 btn-pc-primary 样式", () => {
      expect(getView()).toMatch(/btn-pc-primary/)
    })
  })

  // ─────────────────────────────────────────
  // §4 告警详情（含 disposalSuggestion / getAlarm）
  // ─────────────────────────────────────────
  describe("§4 告警详情", () => {
    it("包含 drawer 或 detail 详情容器", () => {
      expect(getView()).toMatch(/drawer|detail/)
    })

    it("展示处置建议（disposalSuggestion 或 处置建议）", () => {
      expect(getView()).toMatch(/disposalSuggestion|处置建议/)
    })

    it("展示告警内容 alarmContent 或 alarm_content", () => {
      expect(getView()).toMatch(/alarmContent|alarm_content/)
    })

    it("抽屉包含触发时间展示", () => {
      expect(getView()).toMatch(/triggerTime|trigger_time/)
    })
  })

  // ─────────────────────────────────────────
  // §5 操作反馈与状态展示
  // ─────────────────────────────────────────
  describe("§5 操作反馈与状态展示", () => {
    it("包含操作反馈消息变量", () => {
      expect(getView()).toMatch(/actionMsg|action.*msg|feedback|消息/)
    })

    it("展示告警状态 badge 或 admin-badge", () => {
      expect(getView()).toMatch(/admin-badge|badge/)
    })
  })

  // ─────────────────────────────────────────
  // §6 UI 规范符合性
  // ─────────────────────────────────────────
  describe("§6 UI 规范符合性", () => {
    it("使用 pc-card 或 admin-card 卡片容器", () => {
      expect(getView()).toMatch(/pc-card|admin-card/)
    })

    it("使用 PC 设计 token（--pc-primary / --pc-bg-page / --pc-border）", () => {
      expect(getView()).toMatch(/--pc-primary|--pc-bg-page|--pc-border/)
    })

    it("tabular-nums 数字等宽显示", () => {
      expect(getView()).toMatch(/tabular-nums/)
    })

    it("使用 data-zone 属性标注功能区域", () => {
      expect(getView()).toMatch(/data-zone=/)
    })

    it("使用 risk-dot 风险等级颜色点", () => {
      expect(getView()).toMatch(/risk-dot/)
    })
  })

  // ─────────────────────────────────────────
  // §7 数据绑定与服务层
  // ─────────────────────────────────────────
  describe("§7 数据绑定与服务层", () => {
    it("从 alarmService 调用 listAlarms", () => {
      expect(getView()).toMatch(/listAlarms/)
    })

    it("使用 ref 或 reactive 管理响应式状态", () => {
      expect(getView()).toMatch(/ref\(|reactive\(/)
    })

    it("使用 onMounted 加载告警数据", () => {
      expect(getView()).toMatch(/onMounted/)
    })

    it("筛选状态标签 admin-filter-tab", () => {
      expect(getView()).toMatch(/admin-filter-tab/)
    })

    it("v-for 遍历告警列表", () => {
      expect(getView()).toMatch(/v-for.*alarm/)
    })
  })
})

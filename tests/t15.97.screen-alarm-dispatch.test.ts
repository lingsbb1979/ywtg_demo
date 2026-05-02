/**
 * T15.97 实现 /screen/alarm-dispatch
 *
 * 验收标准：显示告警列表、告警详情、确认和派单入口
 *
 * 覆盖范围：
 * §1 文件与路由注册
 * §2 三列布局（alarm-list / alarm-detail / dispatch-action）
 * §3 确认告警功能（confirmAlarm）
 * §4 派单功能（dispatchAlarm）
 * §5 告警筛选与统计
 * §6 UI 规范符合性（screen tokens / screen-glass-card / badge-screen / risk-dot）
 * §7 数据绑定与服务层（alarmService）
 */

import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "fs"
import { resolve } from "path"

const SRC    = resolve(__dirname, "../src")
const ROUTES = resolve(SRC, "router/routes.ts")

function getView() {
  return readFileSync(resolve(SRC, "views/screen/ScreenAlarmDispatchView.vue"), "utf-8")
}

describe("T15.97 /screen/alarm-dispatch 告警派遣中心", () => {

  // ─────────────────────────────────────────
  // §1 文件与路由注册
  // ─────────────────────────────────────────
  describe("§1 文件与路由注册", () => {
    it("ScreenAlarmDispatchView.vue 文件存在", () => {
      expect(existsSync(resolve(SRC, "views/screen/ScreenAlarmDispatchView.vue"))).toBe(true)
    })

    it("routes.ts 包含 alarm-dispatch 路径", () => {
      expect(readFileSync(ROUTES, "utf-8")).toMatch(/alarm-dispatch/)
    })

    it("routes.ts 引入 ScreenAlarmDispatchView", () => {
      expect(readFileSync(ROUTES, "utf-8")).toMatch(/ScreenAlarmDispatchView/)
    })
  })

  // ─────────────────────────────────────────
  // §2 三列布局
  // ─────────────────────────────────────────
  describe("§2 三列布局", () => {
    it("包含告警列表区域（data-zone=\"alarm-list\"）", () => {
      expect(getView()).toMatch(/data-zone=["']alarm-list["']/)
    })

    it("包含告警详情区域（data-zone=\"alarm-detail\"）", () => {
      expect(getView()).toMatch(/data-zone=["']alarm-detail["']/)
    })

    it("包含派单操作区域（data-zone=\"dispatch-action\"）", () => {
      expect(getView()).toMatch(/data-zone=["']dispatch-action["']/)
    })

    it("使用 screen-glass-card 玻璃卡片样式", () => {
      expect(getView()).toMatch(/screen-glass-card/)
    })
  })

  // ─────────────────────────────────────────
  // §3 确认告警功能
  // ─────────────────────────────────────────
  describe("§3 确认告警功能", () => {
    it("包含确认告警按钮或触发逻辑", () => {
      expect(getView()).toMatch(/confirmAlarm|确认告警/)
    })

    it("confirmAlarm 被调用（含括号）", () => {
      expect(getView()).toMatch(/confirmAlarm\s*\(/)
    })
  })

  // ─────────────────────────────────────────
  // §4 派单功能
  // ─────────────────────────────────────────
  describe("§4 派单功能", () => {
    it("包含派单按钮或触发逻辑", () => {
      expect(getView()).toMatch(/dispatchAlarm|自动派单|派单/)
    })

    it("dispatchAlarm 被调用（含括号）", () => {
      expect(getView()).toMatch(/dispatchAlarm\s*\(/)
    })

    it("派单状态标记为 DISPATCHED", () => {
      expect(getView()).toMatch(/DISPATCHED/)
    })
  })

  // ─────────────────────────────────────────
  // §5 告警筛选与统计
  // ─────────────────────────────────────────
  describe("§5 告警筛选与统计", () => {
    it("包含筛选按钮（activeFilter）", () => {
      expect(getView()).toMatch(/activeFilter/)
    })

    it("使用 filteredAlarms 计算属性过滤告警列表", () => {
      expect(getView()).toMatch(/filteredAlarms/)
    })

    it("展示活跃告警数（activeCount）", () => {
      expect(getView()).toMatch(/activeCount/)
    })

    it("包含选中告警状态（selectedAlarm）", () => {
      expect(getView()).toMatch(/selectedAlarm/)
    })
  })

  // ─────────────────────────────────────────
  // §6 UI 规范符合性
  // ─────────────────────────────────────────
  describe("§6 UI 规范符合性", () => {
    it("使用 badge-screen 或 badge-screen-- 告警等级徽章", () => {
      expect(getView()).toMatch(/badge-screen/)
    })

    it("使用 risk-dot 风险点样式", () => {
      expect(getView()).toMatch(/risk-dot/)
    })

    it("使用 tabular-nums 数字等宽显示", () => {
      expect(getView()).toMatch(/tabular-nums/)
    })

    it("顶部返回链接（router-link to=/screen/home）", () => {
      expect(getView()).toMatch(/\/screen\/home/)
    })
  })

  // ─────────────────────────────────────────
  // §7 数据绑定与服务层
  // ─────────────────────────────────────────
  describe("§7 数据绑定与服务层", () => {
    it("从 alarmService 导入 listAlarms", () => {
      expect(getView()).toMatch(/listAlarms|alarmService/)
    })

    it("使用 ref( 或 reactive( 定义响应式数据", () => {
      expect(getView()).toMatch(/ref\(|reactive\(/)
    })

    it("使用 onMounted 初始化数据", () => {
      expect(getView()).toMatch(/onMounted/)
    })

    it("告警列表使用 v-for 遍历", () => {
      expect(getView()).toMatch(/v-for.*alarm|v-for.*filteredAlarms/)
    })
  })
})

/**
 * T15.82 按规范设计 /screen/alarm-dispatch（大屏第二页）
 *
 * 验收标准：大屏第二页沿用首页规范，完成告警列表、确认、派单、详情样式
 *
 * 业务场景：
 * 演示步骤 4-5：大屏大屏展示告警列表 → 确认告警 → 自动派单 → 生成工单
 *
 * 设计规范要求：
 * - 沿用 ScreenHomeView 大屏深色科技主题
 * - screen-glass-card 玻璃卡片布局
 * - screen tokens（--screen-bg-base / --screen-primary / --screen-cyan / --screen-shadow-card）
 * - 告警状态徽章（badge-screen--red / --orange / --yellow）
 * - 风险等级颜色点（risk-dot）
 * - data-zone 标注（alarm-list / alarm-detail / dispatch-action）
 * - SQLiteMirror 数据：从 alarmService.listAlarms() 读取
 * - 派单按钮调用业务操作
 *
 * 覆盖范围：
 * §1 路由与文件存在性
 * §2 页面布局结构（三端首页规范沿用）
 * §3 告警列表区域（data-zone="alarm-list"）
 * §4 告警详情区域（data-zone="alarm-detail"）
 * §5 派单操作区域（data-zone="dispatch-action"）
 * §6 UI 规范符合性（tokens / 玻璃卡片 / 徽章 / 风险点）
 * §7 数据绑定与服务层
 */

import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "fs"
import { resolve } from "path"

const SRC     = resolve(__dirname, "../src")
const ROUTES  = resolve(SRC, "router/routes.ts")

function getAlarmDispatchView() {
  return readFileSync(
    resolve(SRC, "views/screen/ScreenAlarmDispatchView.vue"),
    "utf-8"
  )
}

describe("T15.82 大屏告警派遣页 /screen/alarm-dispatch", () => {

  // ─────────────────────────────────────────
  // §1 路由与文件存在性
  // ─────────────────────────────────────────
  describe("路由与文件存在性", () => {
    it("ScreenAlarmDispatchView.vue 文件存在", () => {
      expect(existsSync(
        resolve(SRC, "views/screen/ScreenAlarmDispatchView.vue")
      )).toBe(true)
    })

    it("routes.ts 包含 /screen/alarm-dispatch 路由路径", () => {
      expect(readFileSync(ROUTES, "utf-8")).toMatch(/\/screen\/alarm-dispatch|screen-alarm-dispatch/)
    })

    it("routes.ts 引入 ScreenAlarmDispatchView", () => {
      expect(readFileSync(ROUTES, "utf-8")).toMatch(/ScreenAlarmDispatchView/)
    })

    it("页面包含低保真线框注释（告警派遣页 wireframe）", () => {
      expect(getAlarmDispatchView()).toMatch(/T15\.82|alarm-dispatch|告警派遣/)
    })
  })

  // ─────────────────────────────────────────
  // §2 页面布局结构（沿用大屏规范）
  // ─────────────────────────────────────────
  describe("页面布局结构（沿用大屏首页规范）", () => {
    it("使用大屏深色背景（--screen-bg-base 或 #060D1F）", () => {
      expect(getAlarmDispatchView()).toMatch(/--screen-bg-base|#060D1F/)
    })

    it("使用 screen-glass-card 玻璃卡片工具类", () => {
      expect(getAlarmDispatchView()).toMatch(/screen-glass-card/)
    })

    it("使用 --screen-border-glow 发光边框 token", () => {
      expect(getAlarmDispatchView()).toMatch(/--screen-border-glow/)
    })

    it("使用 --screen-shadow-card 阴影 token", () => {
      expect(getAlarmDispatchView()).toMatch(/--screen-shadow-card/)
    })

    it("页面包含返回大屏首页的链接（/screen/home）", () => {
      expect(getAlarmDispatchView()).toMatch(/\/screen\/home/)
    })

    it("大屏页面标题包含「告警」或「派遣」关键词", () => {
      expect(getAlarmDispatchView()).toMatch(/告警.*派遣|派遣.*告警|告警中心|告警派遣/)
    })
  })

  // ─────────────────────────────────────────
  // §3 告警列表区域
  // ─────────────────────────────────────────
  describe("告警列表区域（data-zone=\"alarm-list\"）", () => {
    it("存在 data-zone=\"alarm-list\" 告警列表区域", () => {
      expect(getAlarmDispatchView()).toMatch(/data-zone="alarm-list"/)
    })

    it("告警列表循环渲染告警数据（v-for alarms）", () => {
      expect(getAlarmDispatchView()).toMatch(/v-for.*alarm/)
    })

    it("告警列表显示告警标题（alarmTitle / alarm_title）", () => {
      expect(getAlarmDispatchView()).toMatch(/alarmTitle|alarm_title|告警标题/)
    })

    it("告警列表显示告警等级（alarmLevel / alarm_level）", () => {
      expect(getAlarmDispatchView()).toMatch(/alarmLevel|alarm_level/)
    })

    it("告警列表显示触发时间（triggerTime / trigger_time）", () => {
      expect(getAlarmDispatchView()).toMatch(/triggerTime|trigger_time/)
    })

    it("告警列表显示告警状态（status）", () => {
      expect(getAlarmDispatchView()).toMatch(/\.status|status/)
    })

    it("告警列表使用风险色点（risk-dot）", () => {
      expect(getAlarmDispatchView()).toMatch(/risk-dot/)
    })

    it("告警列表使用大屏半透明徽章（badge-screen--）", () => {
      expect(getAlarmDispatchView()).toMatch(/badge-screen--/)
    })

    it("告警列表可以点击选中某条告警（@click 事件）", () => {
      expect(getAlarmDispatchView()).toMatch(/@click/)
    })
  })

  // ─────────────────────────────────────────
  // §4 告警详情区域
  // ─────────────────────────────────────────
  describe("告警详情区域（data-zone=\"alarm-detail\"）", () => {
    it("存在 data-zone=\"alarm-detail\" 告警详情区域", () => {
      expect(getAlarmDispatchView()).toMatch(/data-zone="alarm-detail"/)
    })

    it("详情区显示建筑名称（buildingName / building_name）", () => {
      expect(getAlarmDispatchView()).toMatch(/buildingName|building_name|建筑名称/)
    })

    it("详情区显示告警内容（alarmContent / alarm_content）", () => {
      expect(getAlarmDispatchView()).toMatch(/alarmContent|alarm_content/)
    })

    it("详情区显示告警来源建筑编码（buildingCode / spaceCode）", () => {
      expect(getAlarmDispatchView()).toMatch(/buildingCode|spaceCode|building_code/)
    })

    it("详情区未选中时显示空状态提示", () => {
      expect(getAlarmDispatchView()).toMatch(/未选中|请选择|暂无告警|v-if|v-else/)
    })
  })

  // ─────────────────────────────────────────
  // §5 派单操作区域
  // ─────────────────────────────────────────
  describe("派单操作区域（data-zone=\"dispatch-action\"）", () => {
    it("存在 data-zone=\"dispatch-action\" 操作区域", () => {
      expect(getAlarmDispatchView()).toMatch(/data-zone="dispatch-action"/)
    })

    it("存在「确认告警」按钮（confirmAlarm / 确认）", () => {
      expect(getAlarmDispatchView()).toMatch(/confirmAlarm|确认告警|确认/)
    })

    it("存在「自动派单」或「派单」按钮", () => {
      expect(getAlarmDispatchView()).toMatch(/dispatch|自动派单|派单/)
    })

    it("按钮使用 .btn-screen-primary 大屏主按钮样式", () => {
      expect(getAlarmDispatchView()).toMatch(/btn-screen-primary/)
    })

    it("派单按钮绑定事件处理器（@click dispatch）", () => {
      expect(getAlarmDispatchView()).toMatch(/@click.*dispatch|dispatchAlarm|dispatchSelected/)
    })

    it("按钮在未选中告警时禁用（:disabled 或 v-if）", () => {
      expect(getAlarmDispatchView()).toMatch(/:disabled|v-if.*selected|selectedAlarm/)
    })
  })

  // ─────────────────────────────────────────
  // §6 UI 规范符合性
  // ─────────────────────────────────────────
  describe("UI 规范符合性（tokens / 玻璃卡片 / 色板）", () => {
    it("使用 --screen-primary 主色 token", () => {
      expect(getAlarmDispatchView()).toMatch(/--screen-primary/)
    })

    it("使用 --screen-cyan 青色 token（数据高亮）", () => {
      expect(getAlarmDispatchView()).toMatch(/--screen-cyan/)
    })

    it("使用 --screen-text-h1 或 --screen-text-h2 文字 token", () => {
      expect(getAlarmDispatchView()).toMatch(/--screen-text-h[12]/)
    })

    it("使用 --duration-micro 动画时长 token（过渡动效）", () => {
      expect(getAlarmDispatchView()).toMatch(/--duration-micro/)
    })

    it("使用 tabular-nums 等宽数字（时间/数据展示）", () => {
      expect(getAlarmDispatchView()).toMatch(/tabular-nums/)
    })

    it("使用 --radius-lg 或 --radius-md 圆角 token", () => {
      expect(getAlarmDispatchView()).toMatch(/--radius-lg|--radius-md/)
    })

    it("大屏玻璃卡片包含 backdrop-filter blur", () => {
      expect(getAlarmDispatchView()).toMatch(/backdrop-filter.*blur|blur.*backdrop-filter/)
    })

    it("告警等级色使用 --risk-* token（或对应颜色值）", () => {
      expect(getAlarmDispatchView()).toMatch(/--risk-red|--risk-orange|risk-dot/)
    })
  })

  // ─────────────────────────────────────────
  // §7 数据绑定与服务层
  // ─────────────────────────────────────────
  describe("数据绑定与服务层", () => {
    it("从 alarmService 导入 listAlarms 函数", () => {
      expect(getAlarmDispatchView()).toMatch(/listAlarms|alarmService/)
    })

    it("组件使用 ref 或 computed 响应式数据（Vue 3 Composition API）", () => {
      expect(getAlarmDispatchView()).toMatch(/ref\(|computed\(/)
    })

    it("页面数据从 SQLiteMirror 读取（getTable 或通过 service）", () => {
      expect(getAlarmDispatchView()).toMatch(/getTable|alarmService|listAlarms/)
    })

    it("onMounted 或 watchEffect 触发数据加载", () => {
      expect(getAlarmDispatchView()).toMatch(/onMounted|watchEffect|onActivated/)
    })

    it("selectedAlarm 响应式变量用于记录当前选中告警", () => {
      expect(getAlarmDispatchView()).toMatch(/selectedAlarm|selected/)
    })

    it("告警数量统计（alarms.length 或 count）", () => {
      expect(getAlarmDispatchView()).toMatch(/alarms\.length|\.length|count/)
    })

    it("筛选按钮或状态过滤（ACTIVE / PENDING / 全部）", () => {
      expect(getAlarmDispatchView()).toMatch(/ACTIVE|PENDING|全部|filter/)
    })
  })
})

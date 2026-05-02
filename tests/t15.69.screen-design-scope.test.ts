/**
 * T15.69  确认三端首屏设计范围
 *
 * 验收标准：
 *  - `/screen/home`、`/admin/dashboard`、`/h5/work-orders` 三条路由均已注册
 *  - 每个视图文件存在，且包含规定的业务信息区域（通过 data-testid 锚点验证）
 *  - 每个视图明确调用与其端对应的数据服务
 *
 * 业务信息清单（出自 §15.7 T15.69 设计准备定义）：
 *  /screen/home       → screen-header / screen-kpi / screen-map / screen-hazard-list / screen-workorder-board
 *  /admin/dashboard   → admin-kpi-alarms / admin-kpi-workorders / admin-kpi-hazards / admin-demo-control
 *  /h5/work-orders    → h5-workorder-list / h5-risk-level / h5-sla / h5-accept-btn
 */

import { describe, expect, it } from "vitest"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import type { RouteRecordRaw } from "vue-router"
import { routes } from "../src/router/routes"

const projectRoot = process.cwd()

function pathExists(...segments: string[]) {
  return existsSync(join(projectRoot, ...segments))
}

function readSrc(...segments: string[]) {
  return readFileSync(join(projectRoot, ...segments), "utf-8")
}

/** 递归展平路由，生成绝对路径列表 */
function flattenRoutePaths(list: RouteRecordRaw[], parentPath = ""): string[] {
  return list.flatMap((r) => {
    const full = r.path.startsWith("/")
      ? r.path
      : `${parentPath}/${r.path}`.replace(/\/+/g, "/")
    const children = r.children ? flattenRoutePaths(r.children, full) : []
    return [full, ...children]
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// §1 路由注册
// ─────────────────────────────────────────────────────────────────────────────
describe("T15.69 § 路由：三端首屏路由注册", () => {
  const allPaths = flattenRoutePaths(routes)

  it("/screen/home 路由已注册", () => {
    expect(allPaths).toContain("/screen/home")
  })

  it("/admin/dashboard 路由已注册（嵌套或绝对）", () => {
    expect(
      allPaths.includes("/admin/dashboard") ||
      allPaths.includes("/admin//dashboard"),
      "routes 中找不到 /admin/dashboard"
    ).toBe(true)
  })

  it("/h5/work-orders 路由已注册（嵌套或绝对）", () => {
    expect(
      allPaths.includes("/h5/work-orders") ||
      allPaths.includes("/h5//work-orders"),
      "routes 中找不到 /h5/work-orders"
    ).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// §2 大屏首页 /screen/home — ScreenHomeView.vue
// ─────────────────────────────────────────────────────────────────────────────
describe("T15.69 § 大屏首页 ScreenHomeView：业务信息区域", () => {
  const file = ["src", "views", "screen", "ScreenHomeView.vue"]

  it("ScreenHomeView.vue 文件存在", () => {
    expect(pathExists(...file)).toBe(true)
  })

  it("包含平台标题区（screen-header）", () => {
    const c = readSrc(...file)
    expect(
      c.includes("screen-header") || c.includes('testid="screen-header"'),
      "缺少 screen-header 区域"
    ).toBe(true)
  })

  it("包含 KPI 指标区（screen-kpi）— 总建筑数/活跃告警/在处工单/闭环率", () => {
    const c = readSrc(...file)
    expect(
      c.includes("screen-kpi") || c.includes('testid="screen-kpi"'),
      "缺少 screen-kpi KPI区域"
    ).toBe(true)
  })

  it("包含地图区域（screen-map）— 23栋建筑点位", () => {
    const c = readSrc(...file)
    expect(
      c.includes("screen-map") || c.includes('testid="screen-map"'),
      "缺少 screen-map 地图区域"
    ).toBe(true)
  })

  it("包含隐患清单区（screen-hazard-list）", () => {
    const c = readSrc(...file)
    expect(
      c.includes("screen-hazard-list") || c.includes('testid="screen-hazard-list"'),
      "缺少 screen-hazard-list 隐患清单"
    ).toBe(true)
  })

  it("包含工单看板区（screen-workorder-board）", () => {
    const c = readSrc(...file)
    expect(
      c.includes("screen-workorder-board") || c.includes('testid="screen-workorder-board"'),
      "缺少 screen-workorder-board 工单看板"
    ).toBe(true)
  })

  it("调用 selectScreenKpi 大屏 KPI 服务", () => {
    const c = readSrc(...file)
    expect(c.includes("selectScreenKpi"), "未调用 selectScreenKpi").toBe(true)
  })

  it("调用 selectMapPoints 地图点位服务", () => {
    const c = readSrc(...file)
    expect(c.includes("selectMapPoints"), "未调用 selectMapPoints").toBe(true)
  })

  it("调用 selectHazardList 隐患清单服务", () => {
    const c = readSrc(...file)
    expect(c.includes("selectHazardList"), "未调用 selectHazardList").toBe(true)
  })

  it("调用 selectWorkOrderBoard 工单看板服务", () => {
    const c = readSrc(...file)
    expect(c.includes("selectWorkOrderBoard"), "未调用 selectWorkOrderBoard").toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// §3 管理端工作台 /admin/dashboard — AdminDashboardView.vue
// ─────────────────────────────────────────────────────────────────────────────
describe("T15.69 § 管理端工作台 AdminDashboardView：业务信息区域", () => {
  const file = ["src", "views", "admin", "AdminDashboardView.vue"]

  it("AdminDashboardView.vue 文件存在", () => {
    expect(pathExists(...file)).toBe(true)
  })

  it("包含今日告警 KPI 卡片（admin-kpi-alarms）", () => {
    const c = readSrc(...file)
    expect(
      c.includes("admin-kpi-alarms") || c.includes('testid="admin-kpi-alarms"'),
      "缺少 admin-kpi-alarms 告警卡片"
    ).toBe(true)
  })

  it("包含待办工单 KPI 卡片（admin-kpi-workorders）", () => {
    const c = readSrc(...file)
    expect(
      c.includes("admin-kpi-workorders") || c.includes('testid="admin-kpi-workorders"'),
      "缺少 admin-kpi-workorders 工单卡片"
    ).toBe(true)
  })

  it("包含重点隐患 KPI 卡片（admin-kpi-hazards）", () => {
    const c = readSrc(...file)
    expect(
      c.includes("admin-kpi-hazards") || c.includes('testid="admin-kpi-hazards"'),
      "缺少 admin-kpi-hazards 隐患卡片"
    ).toBe(true)
  })

  it("包含演示控制台入口（admin-demo-control）", () => {
    const c = readSrc(...file)
    expect(
      c.includes("admin-demo-control") || c.includes('testid="admin-demo-control"'),
      "缺少 admin-demo-control 演示控制台入口"
    ).toBe(true)
  })

  it("调用 selectScreenKpi 或 selectWorkOrderBoard 数据服务", () => {
    const c = readSrc(...file)
    expect(
      c.includes("selectScreenKpi") || c.includes("selectWorkOrderBoard"),
      "未调用任何 KPI/工单看板数据服务"
    ).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// §4 H5待办工单 /h5/work-orders — H5WorkOrdersView.vue
// ─────────────────────────────────────────────────────────────────────────────
describe("T15.69 § H5待办工单 H5WorkOrdersView：业务信息区域", () => {
  const file = ["src", "views", "h5", "H5WorkOrdersView.vue"]

  it("H5WorkOrdersView.vue 文件存在", () => {
    expect(pathExists(...file)).toBe(true)
  })

  it("包含工单列表区（h5-workorder-list）", () => {
    const c = readSrc(...file)
    expect(
      c.includes("h5-workorder-list") || c.includes('testid="h5-workorder-list"'),
      "缺少 h5-workorder-list 工单列表区"
    ).toBe(true)
  })

  it("包含风险等级标识（h5-risk-level 或 risk-dot 或 alarm-level）", () => {
    const c = readSrc(...file)
    expect(
      c.includes("h5-risk-level") ||
      c.includes("risk-dot") ||
      c.includes("alarm-level") ||
      c.includes("alarmLevel") ||
      c.includes("orderLevel"),
      "缺少风险等级标识区域"
    ).toBe(true)
  })

  it("包含 SLA / 派单时间显示（h5-sla 或 dispatch-time 或 dispatchTime）", () => {
    const c = readSrc(...file)
    expect(
      c.includes("h5-sla") ||
      c.includes("dispatch-time") ||
      c.includes("dispatchTime") ||
      c.includes("sla"),
      "缺少 SLA 时间显示区域"
    ).toBe(true)
  })

  it("包含接单按钮入口（h5-accept-btn 或 接单 文字）", () => {
    const c = readSrc(...file)
    expect(
      c.includes("h5-accept-btn") ||
      c.includes("接单") ||
      c.includes("accept"),
      "缺少接单按钮入口"
    ).toBe(true)
  })

  it("调用 selectH5TodoList H5待办服务", () => {
    const c = readSrc(...file)
    expect(c.includes("selectH5TodoList"), "未调用 selectH5TodoList").toBe(true)
  })
})

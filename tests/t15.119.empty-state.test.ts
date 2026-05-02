/**
 * T15.119 TDD — 空状态和错误提示（兜底体验）
 *
 * 验收标准：
 *   - 大屏首页（ScreenHomeView）：建筑点位为空时有提示 + 演示控制台入口
 *   - 管理端工作台（AdminDashboardView）：待办为空时有提示，有演示控制台快捷链接
 *   - H5 待办列表（H5WorkOrdersView）：无工单时有空状态提示 + 重置入口
 *   - 多个页面的空状态需有 data-zone="empty-state" 或同等标记
 *   - 重置入口链接指向 /admin/demo-console 或有 reset 相关文字
 */
import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const projectRoot = process.cwd()

function readView(path: string): string {
  return readFileSync(join(projectRoot, path), "utf-8")
}

describe("T15.119 ScreenHomeView — 空状态提示", () => {
  it("地图区域有空状态元素（screen-map__empty）", () => {
    expect(readView("src/views/screen/ScreenHomeView.vue")).toMatch(/screen-map__empty/)
  })

  it("空状态文字含初始化提示", () => {
    expect(readView("src/views/screen/ScreenHomeView.vue"))
      .toMatch(/暂无建筑点位数据|初始化演示数据|请先初始化/)
  })

  it("隐患清单空状态应有提示（screen-hazard-list__empty 或 data-zone='hazard-list'）", () => {
    expect(readView("src/views/screen/ScreenHomeView.vue"))
      .toMatch(/hazard-list.*empty|empty.*hazard|暂无活跃隐患/)
  })

  it("告警入口空状态应有提示", () => {
    expect(readView("src/views/screen/ScreenHomeView.vue"))
      .toMatch(/alarm-entry.*empty|empty.*alarm|暂无活跃告警/)
  })

  it("快捷链接区有演示控制台入口（/admin/demo-console）", () => {
    expect(readView("src/views/screen/ScreenHomeView.vue"))
      .toMatch(/admin\/demo-console|demo-console/)
  })
})

describe("T15.119 AdminDashboardView — 空状态提示", () => {
  it("管理端工作台有空待办提示（admin-todo-empty 或类似）", () => {
    const src = readView("src/views/admin/AdminDashboardView.vue")
    expect(src).toMatch(/admin-todo-empty|暂无紧急待办|待办.*空/)
  })

  it("管理端工作台隐患空状态有提示", () => {
    const src = readView("src/views/admin/AdminDashboardView.vue")
    expect(src).toMatch(/admin-empty|暂无活跃隐患|暂无隐患/)
  })

  it("管理端工作台有演示控制台快捷入口（/admin/demo-console）", () => {
    const src = readView("src/views/admin/AdminDashboardView.vue")
    expect(src).toMatch(/admin\/demo-console|demo-console/)
  })
})

describe("T15.119 H5WorkOrdersView — 空状态提示", () => {
  it("H5 工单列表有 data-zone='empty-state' 标记", () => {
    const src = readView("src/views/h5/H5WorkOrdersView.vue")
    expect(src).toMatch(/data-zone="empty-state"/)
  })

  it("H5 空状态有提示文字", () => {
    const src = readView("src/views/h5/H5WorkOrdersView.vue")
    expect(src).toMatch(/暂无待处理工单|暂无工单/)
  })

  it("H5 空状态有演示提示（触发演示场景或初始化）", () => {
    const src = readView("src/views/h5/H5WorkOrdersView.vue")
    expect(src).toMatch(/演示场景|初始化数据|触发/)
  })
})

describe("T15.119 AdminAlarmsView — 空状态提示", () => {
  it("管理端告警中心有无告警提示或 admin-empty 类", () => {
    const src = readView("src/views/admin/AdminAlarmsView.vue")
    expect(src).toMatch(/暂无告警|admin-empty|empty|no-data/)
  })
})

describe("T15.119 AdminWorkOrdersView — 空状态提示", () => {
  it("管理端工单中心有无工单提示", () => {
    const src = readView("src/views/admin/AdminWorkOrdersView.vue")
    expect(src).toMatch(/暂无工单|admin-empty|empty|no-data/)
  })
})

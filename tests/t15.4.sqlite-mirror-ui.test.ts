import { describe, expect, it } from "vitest"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

const projectRoot = process.cwd()

function pathExists(...segments: string[]) {
  return existsSync(join(projectRoot, ...segments))
}

describe("T15.4 SQLiteMirror + UI (TDD 骨架)", () => {
  it("应提供 sqliteMirrorRepository 文件（最小实现）", () => {
    expect(pathExists("src", "services", "sqliteMirrorRepository.ts"),
      "缺少 src/services/sqliteMirrorRepository.ts").toBe(true)
  })

  it("应提供 workOrderService 文件（最小实现）", () => {
    expect(pathExists("src", "services", "workOrderService.ts"),
      "缺少 src/services/workOrderService.ts").toBe(true)
  })

  it("应提供管理端工单详情页面占位", () => {
    expect(pathExists("src", "views", "admin", "WorkOrderDetailView.vue"),
      "缺少 src/views/admin/WorkOrderDetailView.vue").toBe(true)
  })

  it("应提供 H5 待办列表页面占位", () => {
    expect(pathExists("src", "views", "h5", "WorkOrdersView.vue"),
      "缺少 src/views/h5/WorkOrdersView.vue").toBe(true)
  })

  it("router/routes.ts 应包含工单相关路由定义", () => {
    const routesFile = join(projectRoot, "src", "router", "routes.ts")
    expect(pathExists("src", "router", "routes.ts"), "缺少 src/router/routes.ts").toBe(true)
    const content = readFileSync(routesFile, "utf-8")
    // 工单路由可能以嵌套子路由形式存在（path: "work-orders" 或完整 "/admin/work-orders"）
    expect(
      content.includes("work-orders"),
      "routes.ts 未包含 work-orders 相关路由"
    ).toBe(true)
    expect(content.includes("/h5/work-orders"), "routes.ts 未包含 /h5/work-orders").toBe(true)
  })
})

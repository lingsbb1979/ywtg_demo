import { describe, expect, it } from "vitest"
import { createMemoryHistory, createRouter } from "vue-router"
import { routes } from "../src/router/routes"
import type { RouteRecordRaw } from "vue-router"

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes
  })
}

/** 递归收集路由树中所有路径（含嵌套 children） */
function allRoutePaths(list: RouteRecordRaw[], parentPath = ""): string[] {
  return list.flatMap((r) => {
    const fullPath = r.path.startsWith("/") ? r.path : `${parentPath}/${r.path}`.replace(/\/+/g, "/")
    const childPaths = r.children ? allRoutePaths(r.children, fullPath) : []
    return [fullPath, ...childPaths]
  })
}

describe("T15.2 接入 Vue Router", () => {
  it("根路由重定向到大屏首页", async () => {
    const router = createTestRouter()

    await router.push("/")
    await router.isReady()

    expect(router.currentRoute.value.fullPath).toBe("/screen/home")
  })

  it("根路由重定向目标必须存在", () => {
    const routePaths = allRoutePaths(routes)

    expect(routePaths).toContain("/screen/home")
  })

  it("预留管理端工作台路由，便于后续 T15.3 扩展三端入口", () => {
    const routePaths = allRoutePaths(routes)

    expect(routePaths).toContain("/admin/dashboard")
  })
})
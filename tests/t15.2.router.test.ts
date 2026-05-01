import { describe, expect, it } from "vitest"
import { createMemoryHistory, createRouter } from "vue-router"
import { routes } from "../src/router/routes"

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes
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
    const routePaths = routes.map((route) => route.path)

    expect(routePaths).toContain("/screen/home")
  })

  it("预留管理端工作台路由，便于后续 T15.3 扩展三端入口", () => {
    const routePaths = routes.map((route) => route.path)

    expect(routePaths).toContain("/admin/dashboard")
  })
})
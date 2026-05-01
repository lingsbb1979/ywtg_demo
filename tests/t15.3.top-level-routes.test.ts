import { describe, expect, it } from "vitest"
import { createMemoryHistory, createRouter } from "vue-router"
import { routes } from "../src/router/routes"

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes
  })
}

describe("T15.3 配置三端顶层路由", () => {
  it.each([
    ["/screen", "/screen/home"],
    ["/admin", "/admin/dashboard"],
    ["/h5", "/h5/work-orders"]
  ])("%s 顶层入口可访问并进入默认页 %s", async (entryPath, expectedPath) => {
    const router = createTestRouter()

    await router.push(entryPath)
    await router.isReady()

    expect(router.currentRoute.value.fullPath).toBe(expectedPath)
  })

  it("保留三端默认页面路由", () => {
    const routePaths = routes.map((route) => route.path)

    expect(routePaths).toContain("/screen/home")
    expect(routePaths).toContain("/admin/dashboard")
    expect(routePaths).toContain("/h5/work-orders")
  })
})
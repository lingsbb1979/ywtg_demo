import { describe, expect, it, beforeEach } from "vitest"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

const projectRoot = process.cwd()

function pathExists(...segments: string[]) {
  return existsSync(join(projectRoot, ...segments))
}

function readSrc(...segments: string[]) {
  return readFileSync(join(projectRoot, ...segments), "utf-8")
}

describe("T15.5 管理端布局 AdminLayout（TDD）", () => {
  it("应提供 AdminLayout 布局文件", () => {
    expect(
      pathExists("src", "layouts", "AdminLayout.vue"),
      "缺少 src/layouts/AdminLayout.vue"
    ).toBe(true)
  })

  it("AdminLayout 应包含侧边菜单区（aside / sidebar）", () => {
    const content = readSrc("src", "layouts", "AdminLayout.vue")
    expect(
      content.includes("aside") || content.includes("sidebar") || content.includes("admin-layout__sidebar"),
      "AdminLayout 缺少侧边栏区域（aside / sidebar）"
    ).toBe(true)
  })

  it("AdminLayout 应包含顶部视角切换区（header / topbar）", () => {
    const content = readSrc("src", "layouts", "AdminLayout.vue")
    expect(
      content.includes("header") || content.includes("topbar") || content.includes("admin-layout__header"),
      "AdminLayout 缺少顶部区域（header / topbar）"
    ).toBe(true)
  })

  it("AdminLayout 应包含内容插槽或 router-view", () => {
    const content = readSrc("src", "layouts", "AdminLayout.vue")
    expect(
      content.includes("<slot") || content.includes("<router-view"),
      "AdminLayout 缺少内容插槽（slot 或 router-view）"
    ).toBe(true)
  })

  it("应提供演示角色 Pinia store（demoRole）", () => {
    expect(
      pathExists("src", "stores", "demoRole.ts"),
      "缺少 src/stores/demoRole.ts"
    ).toBe(true)
  })

  it("demoRole store 应包含角色枚举与当前角色状态", () => {
    const content = readSrc("src", "stores", "demoRole.ts")
    expect(
      content.includes("LEADER") || content.includes("leader"),
      "demoRole store 缺少领导参观视角枚举值"
    ).toBe(true)
    expect(
      content.includes("currentRole") || content.includes("current_role"),
      "demoRole store 缺少 currentRole 状态"
    ).toBe(true)
  })

  it("routes.ts 中 /admin 路由应引用 AdminLayout 或包含嵌套子路由", () => {
    const content = readSrc("src", "router", "routes.ts")
    expect(
      content.includes("AdminLayout") || content.includes("children"),
      "routes.ts 中 admin 路由未使用 AdminLayout 或缺少 children 子路由"
    ).toBe(true)
  })
})

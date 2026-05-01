import { describe, expect, it } from "vitest"
import { existsSync, readFileSync } from "fs"
import { join } from "path"

const projectRoot = join(__dirname, "..")

function pathExists(...segments: string[]): boolean {
  return existsSync(join(projectRoot, ...segments))
}

describe("T15.6 实现 H5 布局 H5Layout", () => {
  it("src/layouts/H5Layout.vue 文件存在", () => {
    expect(pathExists("src", "layouts", "H5Layout.vue")).toBe(true)
  })

  it("H5Layout 包含移动端容器类名（h5-layout 或 mobile-layout）", () => {
    const content = readFileSync(
      join(projectRoot, "src", "layouts", "H5Layout.vue"),
      "utf-8"
    )
    expect(content.includes("h5-layout") || content.includes("mobile-layout")).toBe(true)
  })

  it("H5Layout 包含底部导航（tabbar / bottom-nav / <nav）", () => {
    const content = readFileSync(
      join(projectRoot, "src", "layouts", "H5Layout.vue"),
      "utf-8"
    )
    expect(
      content.includes("tabbar") ||
        content.includes("bottom-nav") ||
        content.includes("<nav")
    ).toBe(true)
  })

  it("H5Layout 包含内容区 <router-view 或 <slot", () => {
    const content = readFileSync(
      join(projectRoot, "src", "layouts", "H5Layout.vue"),
      "utf-8"
    )
    expect(content.includes("<router-view") || content.includes("<slot")).toBe(true)
  })

  it("H5Layout 包含移动端宽度适配（375 / 390 / 414 或 max-width）", () => {
    const content = readFileSync(
      join(projectRoot, "src", "layouts", "H5Layout.vue"),
      "utf-8"
    )
    expect(
      content.includes("375") ||
        content.includes("390") ||
        content.includes("414") ||
        content.includes("max-width")
    ).toBe(true)
  })

  it("H5Layout 底部 tabbar 包含工单入口链接（work-orders）", () => {
    const content = readFileSync(
      join(projectRoot, "src", "layouts", "H5Layout.vue"),
      "utf-8"
    )
    expect(content.includes("work-orders")).toBe(true)
  })

  it("routes.ts 中 /h5 路由使用 H5Layout 或包含 children 嵌套", () => {
    const content = readFileSync(
      join(projectRoot, "src", "router", "routes.ts"),
      "utf-8"
    )
    expect(
      content.includes("H5Layout") ||
        (content.includes("/h5") && content.includes("children"))
    ).toBe(true)
  })
})

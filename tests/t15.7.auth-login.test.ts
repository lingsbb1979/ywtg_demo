/**
 * T15.7 TDD — 实现固定账号登录
 *
 * 验收标准：`admin/admin` 可登录，登录后进入 `/admin/dashboard`
 * 架构约束：
 *   - 登录状态存在 Pinia store，不得写入 ywtg.sqlite.* 业务表
 *   - login() 返回 Promise，模拟真实 HTTP 异步调用
 *   - 路由守卫拦截未认证访问 /admin、/h5
 */
import { describe, it, expect, beforeEach } from "vitest"
import { setActivePinia, createPinia } from "pinia"
import { existsSync, readFileSync } from "fs"
import { join } from "path"

const projectRoot = join(__dirname, "..")

function pathExists(...segments: string[]): boolean {
  return existsSync(join(projectRoot, ...segments))
}

// ────────────────────────────── 文件存在性 ──────────────────────────────

describe("T15.7 固定账号登录 — 文件存在", () => {
  it("src/stores/auth.ts 文件存在", () => {
    expect(pathExists("src", "stores", "auth.ts")).toBe(true)
  })

  it("src/views/auth/LoginView.vue 文件存在", () => {
    expect(pathExists("src", "views", "auth", "LoginView.vue")).toBe(true)
  })

  it("routes.ts 包含 /login 路由", () => {
    const content = readFileSync(join(projectRoot, "src", "router", "routes.ts"), "utf-8")
    expect(content.includes('"/login"') || content.includes("'/login'")).toBe(true)
  })

  it("router/index.ts 包含路由守卫 beforeEach", () => {
    const content = readFileSync(join(projectRoot, "src", "router", "index.ts"), "utf-8")
    expect(content.includes("beforeEach")).toBe(true)
  })
})

// ────────────────────────────── auth store 行为 ──────────────────────────────

describe("T15.7 固定账号登录 — useAuthStore 行为", () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it("初始状态 isLoggedIn 为 false", async () => {
    const { useAuthStore } = await import("../src/stores/auth")
    const store = useAuthStore()
    expect(store.isLoggedIn).toBe(false)
  })

  it("login('admin','admin') 成功，success 为 true，isLoggedIn 变为 true", async () => {
    const { useAuthStore } = await import("../src/stores/auth")
    const store = useAuthStore()
    const result = await store.login("admin", "admin")
    expect(result.success).toBe(true)
    expect(store.isLoggedIn).toBe(true)
  })

  it("login 错误密码失败，success 为 false，isLoggedIn 仍为 false", async () => {
    const { useAuthStore } = await import("../src/stores/auth")
    const store = useAuthStore()
    const result = await store.login("admin", "wrong_password")
    expect(result.success).toBe(false)
    expect(store.isLoggedIn).toBe(false)
  })

  it("login 错误用户名失败，success 为 false", async () => {
    const { useAuthStore } = await import("../src/stores/auth")
    const store = useAuthStore()
    const result = await store.login("hacker", "admin")
    expect(result.success).toBe(false)
    expect(store.isLoggedIn).toBe(false)
  })

  it("登录成功后 currentUser 为 'admin'", async () => {
    const { useAuthStore } = await import("../src/stores/auth")
    const store = useAuthStore()
    await store.login("admin", "admin")
    expect(store.currentUser).toBe("admin")
  })

  it("logout() 后 isLoggedIn 为 false，currentUser 为 null", async () => {
    const { useAuthStore } = await import("../src/stores/auth")
    const store = useAuthStore()
    await store.login("admin", "admin")
    store.logout()
    expect(store.isLoggedIn).toBe(false)
    expect(store.currentUser).toBeNull()
  })

  it("auth.ts 不使用 ywtg.sqlite.* 业务表键（登录状态不写业务表）", () => {
    const content = readFileSync(join(projectRoot, "src", "stores", "auth.ts"), "utf-8")
    expect(content.includes("ywtg.sqlite.")).toBe(false)
  })

  it("login() 返回 Promise（异步调用）", async () => {
    const { useAuthStore } = await import("../src/stores/auth")
    const store = useAuthStore()
    const promise = store.login("admin", "admin")
    expect(promise).toBeInstanceOf(Promise)
    await promise
  })
})

// ────────────────────────────── 路由守卫 ──────────────────────────────

describe("T15.7 固定账号登录 — 路由守卫", () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it("管理端路由 meta 标记 requiresAuth 或 router/index.ts 有 beforeEach 守卫", () => {
    const routesContent = readFileSync(
      join(projectRoot, "src", "router", "routes.ts"),
      "utf-8"
    )
    const indexContent = readFileSync(
      join(projectRoot, "src", "router", "index.ts"),
      "utf-8"
    )
    // 路由守卫必须在 index.ts 中实现
    expect(indexContent.includes("beforeEach")).toBe(true)
    // routes.ts 中 /admin 路由有 requiresAuth 或者由 index.ts 统一拦截
    const hasRequiresAuth = routesContent.includes("requiresAuth")
    const hasGuardInIndex = indexContent.includes("requiresAuth") || indexContent.includes("isLoggedIn") || indexContent.includes("login")
    expect(hasRequiresAuth || hasGuardInIndex).toBe(true)
  })

  it("LoginView 包含用户名和密码输入框", () => {
    const content = readFileSync(
      join(projectRoot, "src", "views", "auth", "LoginView.vue"),
      "utf-8"
    )
    // 应包含 username / password 或 用户名 / 密码 相关 input
    expect(
      (content.includes("username") || content.includes("用户名")) &&
        (content.includes("password") || content.includes("密码"))
    ).toBe(true)
  })

  it("LoginView 包含提交 / 登录按钮", () => {
    const content = readFileSync(
      join(projectRoot, "src", "views", "auth", "LoginView.vue"),
      "utf-8"
    )
    expect(
      content.includes("submit") ||
        content.includes("登录") ||
        content.includes("type=\"submit\"")
    ).toBe(true)
  })
})

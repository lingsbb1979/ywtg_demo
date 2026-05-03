import { createRouter, createWebHistory } from "vue-router"
import { routes } from "./routes"
import { useAuthStore } from "@/stores/auth"
import { useDemoRoleStore, ROLE_ACCOUNT } from "@/stores/demoRole"
import type { DemoRole } from "@/stores/demoRole"

export { routes } from "./routes"

const router = createRouter({
  history: createWebHistory(),
  routes
})

/**
 * 路由守卫：判断路由是否需要登录
 *
 * 规则：
 *   - meta.requiresAuth === true 且未登录 → 跳转 /login
 *   - 已登录访问 /login → 跳转 /admin/dashboard
 *   - 大屏端 (/screen) 无需登录
 */
router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some((r) => r.meta?.requiresAuth === true)

  /**
   * 带 _role 参数：新标签页打开时自动初始化角色和登录状态。
   * 在路由守卫最早时机处理，确保 store 状态在组件渲染前就已就绪。
   * 仅写内存（loginNoSave / setRoleNoSave），不影响其他标签页的 localStorage。
   */
  if (to.query._role) {
    const role = to.query._role as DemoRole
    if (role in ROLE_ACCOUNT) {
      const demoRoleStore = useDemoRoleStore()
      const account = ROLE_ACCOUNT[role]
      await authStore.loginNoSave(account.username, account.password)
      demoRoleStore.setRoleNoSave(role)
    }
    // 删除 _role 参数后重新导航，URL 保持干净；replace 避免历史堆积
    const newQuery = { ...to.query }
    delete newQuery._role
    return { path: to.path, query: newQuery, replace: true }
  }

  if (requiresAuth && !authStore.isLoggedIn) {
    return { name: "login", query: { redirect: to.fullPath } }
  }

  if (to.name === "login" && authStore.isLoggedIn) {
    return { name: "admin-dashboard" }
  }
})

export default router
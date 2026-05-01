import { createRouter, createWebHistory } from "vue-router"
import { routes } from "./routes"
import { useAuthStore } from "@/stores/auth"

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
router.beforeEach((to) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some((r) => r.meta?.requiresAuth === true)

  if (requiresAuth && !authStore.isLoggedIn) {
    return { name: "login", query: { redirect: to.fullPath } }
  }

  if (to.name === "login" && authStore.isLoggedIn) {
    return { name: "admin-dashboard" }
  }
})

export default router
import type { RouteRecordRaw } from "vue-router"
import AdminDashboardView from "@/views/admin/AdminDashboardView.vue"
import ScreenHomeView from "@/views/screen/ScreenHomeView.vue"

export const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "root",
    redirect: "/screen/home"
  },
  {
    path: "/screen/home",
    name: "screen-home",
    component: ScreenHomeView,
    meta: {
      title: "大屏首页"
    }
  },
  {
    path: "/admin/dashboard",
    name: "admin-dashboard",
    component: AdminDashboardView,
    meta: {
      title: "管理端工作台"
    }
  }
]
import type { RouteRecordRaw } from "vue-router"
import AdminDashboardView from "@/views/admin/AdminDashboardView.vue"
import H5WorkOrdersView from "@/views/h5/H5WorkOrdersView.vue"
import ScreenHomeView from "@/views/screen/ScreenHomeView.vue"

export const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "root",
    redirect: "/screen/home"
  },
  {
    path: "/screen",
    name: "screen-root",
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
    path: "/admin",
    name: "admin-root",
    redirect: "/admin/dashboard"
  },
  {
    path: "/admin/dashboard",
    name: "admin-dashboard",
    component: AdminDashboardView,
    meta: {
      title: "管理端工作台"
    }
  },
  {
    path: "/h5",
    name: "h5-root",
    redirect: "/h5/work-orders"
  },
  {
    path: "/h5/work-orders",
    name: "h5-work-orders",
    component: H5WorkOrdersView,
    meta: {
      title: "H5 待办工单"
    }
  }
]
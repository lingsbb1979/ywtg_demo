import type { RouteRecordRaw } from "vue-router"
import AdminDashboardView from "@/views/admin/AdminDashboardView.vue"
import WorkOrderDetailView from "@/views/admin/WorkOrderDetailView.vue"
import H5WorkOrdersView from "@/views/h5/H5WorkOrdersView.vue"
import ScreenHomeView from "@/views/screen/ScreenHomeView.vue"
import AdminLayout from "@/layouts/AdminLayout.vue"
import H5Layout from "@/layouts/H5Layout.vue"
import H5MineView from "@/views/h5/H5MineView.vue"

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
    meta: { title: "大屏首页" }
  },
  // 管理端：使用 AdminLayout 嵌套子路由
  {
    path: "/admin",
    component: AdminLayout,
    children: [
      {
        path: "",
        name: "admin-root",
        redirect: "/admin/dashboard"
      },
      {
        path: "dashboard",
        name: "admin-dashboard",
        component: AdminDashboardView,
        meta: { title: "管理端工作台" }
      },
      {
        path: "work-orders",
        name: "admin-work-orders",
        component: AdminDashboardView,
        meta: { title: "管理端工单" }
      },
      {
        path: "work-orders/:id",
        name: "admin-work-order-detail",
        component: WorkOrderDetailView,
        meta: { title: "工单详情" }
      }
    ]
  },
  // H5 移动端：使用 H5Layout 嵌套子路由
  {
    path: "/h5",
    component: H5Layout,
    children: [
      {
        path: "",
        name: "h5-root",
        redirect: "/h5/work-orders"
      },
      {
        path: "work-orders",
        name: "h5-work-orders",
        component: H5WorkOrdersView,
        meta: { title: "H5 待办工单" }
      },
      {
        path: "mine",
        name: "h5-mine",
        component: H5MineView,
        meta: { title: "我的" }
      }
    ]
  }
]
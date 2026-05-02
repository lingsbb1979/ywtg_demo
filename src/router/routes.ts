import type { RouteRecordRaw } from "vue-router"
import AdminDashboardView from "@/views/admin/AdminDashboardView.vue"
import AdminAlarmsView from "@/views/admin/AdminAlarmsView.vue"
import AdminDemoConsoleView from "@/views/admin/AdminDemoConsoleView.vue"
import AdminBuildingsView from "@/views/admin/AdminBuildingsView.vue"
import AdminBuildingDetailView from "@/views/admin/AdminBuildingDetailView.vue"
import AdminTelemetryView from "@/views/admin/AdminTelemetryView.vue"
import AdminAnalysisView from "@/views/admin/AdminAnalysisView.vue"
import AdminWorkOrdersView from "@/views/admin/AdminWorkOrdersView.vue"
import AdminSupervisionView from "@/views/admin/AdminSupervisionView.vue"
import WorkOrderDetailView from "@/views/admin/WorkOrderDetailView.vue"
import H5WorkOrdersView from "@/views/h5/H5WorkOrdersView.vue"
import H5WorkOrderDetailView from "@/views/h5/H5WorkOrderDetailView.vue"
import ScreenHomeView from "@/views/screen/ScreenHomeView.vue"
import ScreenAlarmDispatchView from "@/views/screen/ScreenAlarmDispatchView.vue"
import AdminLayout from "@/layouts/AdminLayout.vue"
import H5Layout from "@/layouts/H5Layout.vue"
import H5MineView from "@/views/h5/H5MineView.vue"
import LoginView from "@/views/auth/LoginView.vue"

export const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "root",
    redirect: "/screen/home"
  },
  // 登录页：无需认证
  {
    path: "/login",
    name: "login",
    component: LoginView,
    meta: { title: "登录", requiresAuth: false }
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
  {
    path: "/screen/alarm-dispatch",
    name: "screen-alarm-dispatch",
    component: ScreenAlarmDispatchView,
    meta: { title: "告警派遣中心" }
  },
  // 管理端：使用 AdminLayout 嵌套子路由（需要登录）
  {
    path: "/admin",
    component: AdminLayout,
    meta: { requiresAuth: true },
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
        component: AdminWorkOrdersView,
        meta: { title: "工单管理" }
      },
      {
        path: "work-orders/:id",
        name: "admin-work-order-detail",
        component: WorkOrderDetailView,
        meta: { title: "工单详情" }
      },
      {
        path: "alarms", // /admin/alarms
        name: "admin-alarms",
        component: AdminAlarmsView,
        meta: { title: "告警中心" }
      },
      {
        path: "demo-console", // /admin/demo-console
        name: "admin-demo-console",
        component: AdminDemoConsoleView,
        meta: { title: "演示控制台" }
      },
      {
        path: "buildings", // /admin/buildings
        name: "admin-buildings",
        component: AdminBuildingsView,
        meta: { title: "建筑档案" }
      },
      {
        path: "buildings/:id", // /admin/buildings/:id
        name: "admin-building-detail",
        component: AdminBuildingDetailView,
        meta: { title: "建筑详情" }
      },
      {
        path: "telemetry", // /admin/telemetry
        name: "admin-telemetry",
        component: AdminTelemetryView,
        meta: { title: "采集数据" }
      },
      {
        path: "analysis", // /admin/analysis
        name: "admin-analysis",
        component: AdminAnalysisView,
        meta: { title: "数据分析" }
      },
      {
        path: "supervision", // /admin/supervision
        name: "admin-supervision",
        component: AdminSupervisionView,
        meta: { title: "督办管理" }
      }
    ]
  },
  // H5 移动端：使用 H5Layout 嵌套子路由（需要登录）
  {
    path: "/h5",
    component: H5Layout,
    meta: { requiresAuth: true },
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
        path: "work-orders/:id",
        name: "h5-work-order-detail",
        component: H5WorkOrderDetailView,
        meta: { title: "工单详情" }
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
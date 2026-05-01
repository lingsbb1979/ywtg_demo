import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router"
import PlaceholderView from "@/views/PlaceholderView.vue"

export const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "root",
    component: PlaceholderView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
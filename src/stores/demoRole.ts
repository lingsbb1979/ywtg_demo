import { defineStore } from "pinia"
import { ref, computed } from "vue"

/**
 * 演示视角枚举 — 不进入 SQLiteMirror 业务表，
 * UI 状态持久化到 ywtg.ui.demoRole。
 * 对应 T15.8：实现演示角色切换（可切换市级值班员、街道外勤、领导参观视角）
 */
export type DemoRole =
  | "LEADER"       // 领导参观
  | "DUTY_OFFICER" // 市级值班员
  | "FIELD_WORKER" // 街道外勤
  | "PROVINCIAL"   // 省级监管（占位）
  | "NATIONAL"     // 国家监管（占位）

export interface DemoRoleOption {
  value: DemoRole
  label: string
  description: string
}

/** 菜单项定义 */
export interface DemoMenuItem {
  path: string
  label: string
}

/** UI 状态 localStorage key（与 SQLiteMirror 表完全隔离） */
const UI_ROLE_KEY = "ywtg.ui.demoRole"

/** 默认角色 */
const DEFAULT_ROLE: DemoRole = "DUTY_OFFICER"

/** 角色配置：每个视角的默认跳转路径和可见菜单 */
const ROLE_CONFIG: Record<
  DemoRole,
  { defaultPath: string; visibleMenus: DemoMenuItem[] }
> = {
  DUTY_OFFICER: {
    defaultPath: "/admin/dashboard",
    visibleMenus: [
      { path: "/admin/dashboard",   label: "工作台" },
      { path: "/admin/alarms",      label: "告警中心" },
      { path: "/admin/work-orders", label: "工单中心" },
      { path: "/admin/supervision", label: "督办管理" },
    ],
  },
  FIELD_WORKER: {
    defaultPath: "/h5/work-orders",
    visibleMenus: [
      { path: "/h5/work-orders", label: "待办工单" },
      { path: "/h5/mine",        label: "我的" },
    ],
  },
  LEADER: {
    defaultPath: "/screen/home",
    visibleMenus: [
      { path: "/screen/home",         label: "大屏首页" },
      { path: "/admin/dashboard",     label: "工作台" },
      { path: "/admin/supervision",   label: "督办管理" },
      { path: "/admin/buildings",     label: "建筑档案" },
    ],
  },
  PROVINCIAL: {
    defaultPath: "/screen/home",
    visibleMenus: [
      { path: "/screen/home",     label: "大屏首页" },
      { path: "/admin/buildings", label: "建筑档案" },
    ],
  },
  NATIONAL: {
    defaultPath: "/screen/home",
    visibleMenus: [
      { path: "/screen/home", label: "大屏首页" },
    ],
  },
}

/** 安全读取 localStorage（Node 测试环境降级） */
function readUiRole(): DemoRole {
  try {
    const v = globalThis.localStorage?.getItem(UI_ROLE_KEY)
    if (v && v in ROLE_CONFIG) return v as DemoRole
  } catch { /* ignore */ }
  return DEFAULT_ROLE
}

/** 安全写入 localStorage */
function writeUiRole(role: DemoRole): void {
  try {
    globalThis.localStorage?.setItem(UI_ROLE_KEY, role)
  } catch { /* ignore */ }
}

export const DEMO_ROLE_OPTIONS: DemoRoleOption[] = [
  { value: "LEADER",       label: "领导参观",   description: "大屏首页、绩效指标、督办、成果数据" },
  { value: "DUTY_OFFICER", label: "市级值班员", description: "告警、派单、待处理工单" },
  { value: "FIELD_WORKER", label: "街道外勤",   description: "H5 待办、处置、指标一览" },
  { value: "PROVINCIAL",   label: "省级监管",   description: "汇总态势、督办占位" },
  { value: "NATIONAL",     label: "国家监管",   description: "全国态势占位、督办占位" },
]

export const useDemoRoleStore = defineStore("demoRole", () => {
  // 从 ywtg.ui.demoRole 恢复上次选择的视角
  const currentRole = ref<DemoRole>(readUiRole())
  const roleOptions = DEMO_ROLE_OPTIONS

  /** 当前视角的默认跳转路径 */
  const defaultPath = computed(() => ROLE_CONFIG[currentRole.value].defaultPath)

  /** 当前视角可见菜单列表 */
  const visibleMenus = computed<DemoMenuItem[]>(
    () => ROLE_CONFIG[currentRole.value].visibleMenus
  )

  /** 切换视角，并持久化到 ywtg.ui.demoRole */
  function setRole(role: DemoRole): void {
    currentRole.value = role
    writeUiRole(role)
  }

  return {
    currentRole,
    roleOptions,
    defaultPath,
    visibleMenus,
    setRole,
  }
})

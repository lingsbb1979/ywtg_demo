import { defineStore } from "pinia"
import { ref } from "vue"

/**
 * 演示视角枚举 — 不进入 localStorage 业务表，只影响 UI 视角和默认筛选。
 * 对应 15.7 T15.8：实现演示角色切换
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

export const DEMO_ROLE_OPTIONS: DemoRoleOption[] = [
  { value: "LEADER",       label: "领导参观",   description: "大屏首页、绩效指标、督办、成果数据" },
  { value: "DUTY_OFFICER", label: "市级值班员", description: "告警、派单、待处理工单" },
  { value: "FIELD_WORKER", label: "街道外勤",   description: "H5 待办、处置、指标一览" },
  { value: "PROVINCIAL",   label: "省级监管",   description: "汇总态势、督办占位" },
  { value: "NATIONAL",     label: "国家监管",   description: "全国态势占位、督办占位" },
]

export const useDemoRoleStore = defineStore("demoRole", () => {
  const currentRole = ref<DemoRole>("DUTY_OFFICER")
  const roleOptions = DEMO_ROLE_OPTIONS

  function setRole(role: DemoRole) {
    currentRole.value = role
  }

  return {
    currentRole,
    roleOptions,
    setRole,
  }
})

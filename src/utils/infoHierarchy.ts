/**
 * 三端信息层级定义
 *
 * 每个端的信息优先级（priority-1 = 最高优先级，用户打开页面第一眼必须看到的内容）。
 *
 * T15.70 | UI 设计 | 整理三端信息层级 | 设计准备
 * - 大屏突出房屋隐患和态势
 * - 管理端突出待办和数据操作
 * - H5 突出处置效率和现场证据
 */

export interface InfoPriorityLevel {
  /** 优先级等级：1 = 最高，3 = 最低 */
  level: 1 | 2 | 3
  /** 展示区域的语义标识 */
  zone: string
  /** 中文描述 */
  label: string
  /** 关联的 CSS class 或 data-testid */
  cssClass: string
}

export interface TerminalInfoHierarchy {
  /** 端标识 */
  terminal: "screen" | "admin" | "h5"
  /** 终端名称 */
  name: string
  /** 用户角色定位 */
  audience: string
  /** 各优先级信息区域 */
  priorities: InfoPriorityLevel[]
}

/**
 * 大屏端信息层级
 * - P1：房屋隐患（hazard）+ 安全态势（situation）—— 领导参观必看
 * - P2：建筑分布地图 —— 定位和态势辅助
 * - P3：工单闭环看板 —— 处置进度辅助
 */
export const SCREEN_HIERARCHY: TerminalInfoHierarchy = {
  terminal: "screen",
  name: "大屏端",
  audience: "领导参观 / 一线指挥",
  priorities: [
    {
      level: 1,
      zone: "hazard-situation",
      label: "房屋隐患 + 安全态势（隐患清单 + KPI 态势概览）",
      cssClass: "screen-hazard-list screen-situation",
    },
    {
      level: 2,
      zone: "map",
      label: "建筑分布地图（地理可视化）",
      cssClass: "screen-map",
    },
    {
      level: 3,
      zone: "workorder-board",
      label: "工单闭环看板",
      cssClass: "screen-workorder-board",
    },
  ],
}

/**
 * 管理端信息层级
 * - P1：待办工单（pending）+ 快速数据操作（dataOps）—— 值班员首要任务
 * - P2：活跃隐患列表 —— 风险态势感知
 * - P3：演示控制 / 系统设置 —— 管理辅助
 */
export const ADMIN_HIERARCHY: TerminalInfoHierarchy = {
  terminal: "admin",
  name: "管理端",
  audience: "PC 管理员 / 市级值班员",
  priorities: [
    {
      level: 1,
      zone: "pending-dataOps",
      label: "待办工单 + 数据操作（告警确认 / 派单 / 核查 / 销号）",
      cssClass: "admin-kpi-workorders admin-quick-actions",
    },
    {
      level: 2,
      zone: "hazard-list",
      label: "活跃隐患列表",
      cssClass: "admin-hazard-list",
    },
    {
      level: 3,
      zone: "demo-control",
      label: "演示控制台",
      cssClass: "admin-demo-control",
    },
  ],
}

/**
 * H5 端信息层级
 * - P1：处置效率（disposal）+ 现场证据（evidence）—— 外勤首要任务
 * - P2：工单基本信息（建筑 / 隐患 / SLA）
 * - P3：系统导航 / 我的
 */
export const H5_HIERARCHY: TerminalInfoHierarchy = {
  terminal: "h5",
  name: "H5 移动端",
  audience: "外勤人员 / 现场处置员",
  priorities: [
    {
      level: 1,
      zone: "disposal-evidence",
      label: "处置效率（接单 / 去处置）+ 现场证据入口（上传照片 / 提交处置）",
      cssClass: "h5-disposal-flow h5-evidence-entry h5-accept-btn",
    },
    {
      level: 2,
      zone: "workorder-info",
      label: "工单基本信息（建筑 / 隐患 / SLA / 逾期状态）",
      cssClass: "h5-workorder-list h5-sla h5-risk-level",
    },
    {
      level: 3,
      zone: "navigation",
      label: "导航 / 我的",
      cssClass: "h5-nav",
    },
  ],
}

/** 所有端的信息层级汇总 */
export const INFO_HIERARCHY: TerminalInfoHierarchy[] = [
  SCREEN_HIERARCHY,
  ADMIN_HIERARCHY,
  H5_HIERARCHY,
]

/**
 * T15.33 — 演示场景常量 scenarioConstants
 *
 * 定义四个固定演示场景的配置常量，供演示切换、大屏 Demo 和测试使用。
 * 本文件 **不调用 setTable**，不向 localStorage 写入任何数据。
 *
 * 场景说明：
 *   SCN_NORMAL              — 正常态势：全部绿色，无告警
 *   SCN_ORANGE_CRACK        — 橙色裂缝告警：B001 裂缝值超 H 阈值
 *   SCN_RED_TILT            — 红色倾斜告警：B002 倾角值超 HH 阈值
 *   SCN_OVERTIME_SUPERVISION — 超时督办：B003 沉降工单超 SLA 触发督办
 *
 * 数据点 id 规则（来自 T15.29 seedDataPoints）：
 *   point_id = 10001 + bIdx × 3 + fIdx
 *   fIdx: 0=裂缝, 1=倾角, 2=沉降
 *   B001 (bIdx=0): crack=10001, tilt=10002, settle=10003
 *   B002 (bIdx=1): crack=10004, tilt=10005, settle=10006
 *   B003 (bIdx=2): crack=10007, tilt=10008, settle=10009
 */

// ── 类型定义 ──────────────────────────────────────────────────────────────────

export interface ScenarioBase {
  id: string
  label: string
  desc: string
}

export interface ScenarioAlarm extends ScenarioBase {
  buildingId: number
  buildingCode: string
  buildingName: string
  dataPointId: number
  factorCode: "CRACK" | "TILT" | "SETTLE"
  factorUnit: string
  injectValue: number
  limitH: number
  limitHh: number
  expectedAlarmLevel: "H" | "HH"
}

export interface ScenarioOvertimeSupervision extends ScenarioAlarm {
  slaHours: number
  overtimeHours: number
}

// ── SCN_NORMAL ────────────────────────────────────────────────────────────────

/** 正常态势：全部 23 栋建筑绿色，传感器值均低于阈值，无告警，无超时工单 */
export const SCN_NORMAL: ScenarioBase = {
  id:    "NORMAL",
  label: "正常态势",
  desc:  "全部 23 栋建筑绿色，传感器数值均在正常范围内，无待处置告警，无超时工单",
}

// ── SCN_ORANGE_CRACK ──────────────────────────────────────────────────────────

/**
 * 橙色裂缝告警：向阳路1号历史建筑（B001）裂缝宽度超橙色阈值（H 级）
 * 触发橙色告警并生成工单，建议派住建局处置
 * 注入值 2.8mm > limitH=2.0mm；低于 limitHh=5.0mm
 */
export const SCN_ORANGE_CRACK: ScenarioAlarm = {
  id:                 "ORANGE_CRACK",
  label:              "橙色裂缝告警",
  desc:               "向阳路1号历史建筑（B001）裂缝宽度超橙色阈值，触发 H 级告警并生成工单",
  buildingId:         1001,
  buildingCode:       "B001",
  buildingName:       "向阳路1号历史建筑",
  dataPointId:        10001,  // 10001 + 0×3 + 0
  factorCode:         "CRACK",
  factorUnit:         "mm",
  injectValue:        2.8,    // mm；超 limitH=2.0，低于 limitHh=5.0
  limitH:             2.0,
  limitHh:            5.0,
  expectedAlarmLevel: "H",
}

// ── SCN_RED_TILT ──────────────────────────────────────────────────────────────

/**
 * 红色倾斜告警：中山街旧址建筑（B002）倾角超红色阈值（HH 级）
 * 触发红色告警，建议转应急处置
 * 注入值 3.5° > limitHh=3.0°
 */
export const SCN_RED_TILT: ScenarioAlarm = {
  id:                 "RED_TILT",
  label:              "红色倾斜告警",
  desc:               "中山街旧址建筑（B002）倾角超红色阈值，触发 HH 级告警，建议转应急处置",
  buildingId:         1002,
  buildingCode:       "B002",
  buildingName:       "中山街旧址建筑",
  dataPointId:        10005,  // 10001 + 1×3 + 1
  factorCode:         "TILT",
  factorUnit:         "°",
  injectValue:        3.5,    // °；超 limitHh=3.0
  limitH:             1.0,
  limitHh:            3.0,
  expectedAlarmLevel: "HH",
}

// ── SCN_OVERTIME_SUPERVISION ──────────────────────────────────────────────────

/**
 * 超时督办场景：光复路老宅院（B003）沉降告警派发工单后超 SLA 未处置
 * 工单超时 48 小时（SLA=24h），触发督办流程
 * 注入值 12.0mm > limitH=10.0mm（橙色），低于 limitHh=30.0mm
 */
export const SCN_OVERTIME_SUPERVISION: ScenarioOvertimeSupervision = {
  id:                 "OVERTIME_SUPERVISION",
  label:              "超时督办场景",
  desc:               "光复路老宅院（B003）沉降告警派发工单后超 SLA 未处置，触发督办流程",
  buildingId:         1003,
  buildingCode:       "B003",
  buildingName:       "光复路老宅院",
  dataPointId:        10009,  // 10001 + 2×3 + 2
  factorCode:         "SETTLE",
  factorUnit:         "mm",
  injectValue:        12.0,   // mm；超 limitH=10.0，低于 limitHh=30.0
  limitH:             10.0,
  limitHh:            30.0,
  expectedAlarmLevel: "H",
  slaHours:           24,     // 工单 SLA：24 小时
  overtimeHours:      48,     // 模拟已超时 48 小时
}

// ── 场景注册表 ────────────────────────────────────────────────────────────────

/** 全部演示场景，按优先级排列（正常 → 橙色 → 红色 → 督办） */
export const SCENARIOS = [
  SCN_NORMAL,
  SCN_ORANGE_CRACK,
  SCN_RED_TILT,
  SCN_OVERTIME_SUPERVISION,
] as const

/**
 * iotDemoService — IoT 驱动的演示触发服务
 *
 * 提供两类新触发按钮（不影响现有 scenarioService）：
 *   1. startOrangeCrackIot(onTick, onDone) — 每秒写入裂缝原始遥测数据，10s 内超橙色阈值
 *   2. startRedTiltIot(onTick, onDone) — 每秒写入倾角遥测数据，10s 内超红色阈值
 *
 * 流程：
 *   1. setInterval 每秒追加一条 iot_telemetry 记录（point_id 对应目标数据点）
 *   2. 每次写入后调用 calculateBuildingRisk() 执行分析
 *   3. 若分析结果达到目标等级，写入 alarm_record 并停止定时器
 *   4. 最多运行 MAX_TICKS 次（防死循环，节约 localStorage）
 *
 * SQLite mirror 约束：只写 iot_telemetry、space_analysis_archive、alarm_record —
 * 均为 tableRegistry.ts 登记的真实表。
 *
 * 建筑/数据点对应：
 *   橙色：B003（space_id=1003）裂缝数据点 id=10007，limit_h=2.0mm，limit_hh=5.0mm
 *   红色：B012（space_id=1012）倾角数据点 id=10034，limit_h=1.0°，limit_hh=3.0°
 */

import { getTable, setTable } from "./sqliteMirrorRepository"
import { calculateBuildingRisk } from "./analysisService"

// ── 常量 ──────────────────────────────────────────────────────────────────────

/** 每次注入间隔（ms） */
const TICK_MS = 1000

/** 最多注入多少次（防止 localStorage 爆满） */
const MAX_TICKS = 12

/**
 * B003 裂缝数据点：
 *   space_id=1003，bIdx=2，fIdx=0 → id = 10001 + 2*3 + 0 = 10007
 *   limit_h=2.0（橙色），limit_hh=5.0（红色）
 */
const CRACK_POINT_ID = 10007
const CRACK_SPACE_ID = 1003
const CRACK_LIMIT_H  = 2.0   // 橙色阈值

/**
 * B012 倾角数据点：
 *   space_id=1012，bIdx=11，fIdx=1 → id = 10001 + 11*3 + 1 = 10035
 *   limit_h=1.0（橙色），limit_hh=3.0（红色）
 */
const TILT_POINT_ID  = 10035
const TILT_SPACE_ID  = 1012
const TILT_LIMIT_HH  = 3.0   // 红色阈值（倾角超红色用 limit_hh）

// ── 状态（防止重复触发） ───────────────────────────────────────────────────────

let orangeTimer: ReturnType<typeof setInterval> | null = null
let redTimer:    ReturnType<typeof setInterval> | null = null

// ── 辅助 ──────────────────────────────────────────────────────────────────────

/** 获取当前 ISO 时间字符串（格式："YYYY-MM-DD HH:mm:ss"） */
function nowStr(): string {
  return new Date().toISOString().replace("T", " ").substring(0, 19)
}

/**
 * 往 iot_telemetry 追加一条记录（不替换，只追加）。
 * 严格遵守 SQLite Mirror：字段为 ts / point_id / value_num / value_str。
 */
function appendTelemetry(pointId: number, valueNum: number): void {
  const all = getTable<{ ts: string; point_id: number; value_num: number | null; value_str: string | null }>(
    "iot_telemetry"
  )
  setTable("iot_telemetry", [
    ...all,
    { ts: nowStr(), point_id: pointId, value_num: valueNum, value_str: null },
  ])
}

/**
 * 写入告警记录（alarm_record），仅当该建筑该类型无活跃告警时写入。
 */
function ensureAlarm(params: {
  buildingId: number
  buildingName: string
  alarmType: string
  alarmTitle: string
  alarmLevel: string   // "ORANGE" | "RED"
  factorCode: string
}): boolean {
  const records = getTable<{
    id: number
    building_id: number | null
    alarm_type: string | null
    status: string | null
  }>("alarm_record")

  // 去重：该建筑该类型已有 ACTIVE 告警则不重复写入
  const exists = records.some(
    (r) =>
      r.building_id === params.buildingId &&
      r.alarm_type === params.alarmType &&
      r.status === "PENDING"
  )
  if (exists) return false

  const nextId = records.reduce((m, r) => Math.max(m, r.id), 0) + 1
  const ts = nowStr()
  const alarmCode = `IOT-${params.alarmType}-${String(params.buildingId).padStart(4, "0")}-${String(nextId).padStart(3, "0")}`

  setTable("alarm_record", [
    ...records,
    {
      id:            nextId,
      alarm_id:      alarmCode,
      alarm_code:    alarmCode,
      device_id:     null,
      building_id:   params.buildingId,
      sensor_id:     null,
      alarm_title:   params.alarmTitle,
      alarm_type:    params.alarmType,
      alarm_level:   params.alarmLevel,
      alarm_content: `IoT 遥测数据持续超过${params.alarmLevel === "ORANGE" ? "橙" : "红"}色阈值，自动触发`,
      root_cause:    null,
      aggregate_flag: 0,
      raw_data:      null,
      status:        "PENDING",
      trigger_time:  ts,
      handle_time:   null,
      handle_user:   null,
      create_time:   ts,
      update_time:   ts,
    },
  ])
  return true
}

// ── 公开 API ──────────────────────────────────────────────────────────────────

export interface IotDemoCallbacks {
  /** 每次 tick 回调，传入当前 tick 计数（1-based）和最新注入值 */
  onTick: (tick: number, value: number) => void
  /** 触发成功（告警写入）或超时后回调 */
  onDone: (outcome: "triggered" | "timeout", riskLevel?: string) => void
}

export function isOrangeRunning(): boolean {
  return orangeTimer !== null
}

export function isRedRunning(): boolean {
  return redTimer !== null
}

/**
 * 启动橙色裂缝 IoT 模拟：每秒注入递增裂缝值，超过 limit_h=2.0mm 后触发橙色告警停止。
 */
export function startOrangeCrackIot(callbacks: IotDemoCallbacks): void {
  if (orangeTimer !== null) return   // 防止重复启动

  let tick = 0
  // 从 0 开始逐步被增至 2.0mm：每 tick +0.25mm，第 8 次足跟橙色阈值，屏幕下方时序条能展示完整 8 步上升过程
  let value = 0.0

  orangeTimer = setInterval(() => {
    tick++
    value = Math.round((value + 0.25) * 1000) / 1000

    appendTelemetry(CRACK_POINT_ID, value)
    callbacks.onTick(tick, value)

    // 执行风险分析（写入 space_analysis_archive，如果配置已存在）
    calculateBuildingRisk(CRACK_SPACE_ID)

    // 直接基于注入值判断阈值，不依赖 space_analysis_config 是否已播种
    const triggered = value >= CRACK_LIMIT_H

    if (triggered) {
      ensureAlarm({
        buildingId:   CRACK_SPACE_ID,
        buildingName: "杏林路民国砖楼（B003）",
        alarmType:    "CRACK_DEFORM",
        alarmTitle:   "裂缝宽度超限（IoT驱动）",
        alarmLevel:   "ORANGE",
        factorCode:   "CRACK",
      })
      clearInterval(orangeTimer!)
      orangeTimer = null
      callbacks.onDone("triggered", "ORANGE")
      return
    }

    if (tick >= MAX_TICKS) {
      clearInterval(orangeTimer!)
      orangeTimer = null
      callbacks.onDone("timeout")
    }
  }, TICK_MS)
}

/**
 * 启动红色倾斜 IoT 模拟：每秒注入递增倾角值，超过 limit_hh=3.0° 后触发红色告警停止。
 */
export function startRedTiltIot(callbacks: IotDemoCallbacks): void {
  if (redTimer !== null) return  // 防止重复启动

  let tick = 0
  // 从 0.2° 开始，每 tick +0.3°，第 10 次赐3.2° 足跟红色阈值
  // 屏幕时序条：2格绿 → 7格橙 → 1格红，视觉上展示完整风险升级过程
  let value = 0.2

  redTimer = setInterval(() => {
    tick++
    value = Math.round((value + 0.3) * 1000) / 1000

    appendTelemetry(TILT_POINT_ID, value)
    callbacks.onTick(tick, value)

    // 执行风险分析（写入 space_analysis_archive，如果配置已存在）
    calculateBuildingRisk(TILT_SPACE_ID)

    // 直接基于注入值判断阈值，不依赖 space_analysis_config 是否已播种
    const triggered = value >= TILT_LIMIT_HH

    if (triggered) {
      ensureAlarm({
        buildingId:   TILT_SPACE_ID,
        buildingName: "前进路俄式民居（B012）",
        alarmType:    "STRUCT_TILT",
        alarmTitle:   "倾斜角超红色阈值（IoT驱动）",
        alarmLevel:   "RED",
        factorCode:   "TILT",
      })
      clearInterval(redTimer!)
      redTimer = null
      callbacks.onDone("triggered", "RED")
      return
    }

    if (tick >= MAX_TICKS) {
      clearInterval(redTimer!)
      redTimer = null
      callbacks.onDone("timeout")
    }
  }, TICK_MS)
}

/**
 * 强制停止所有 IoT 模拟定时器（用于页面卸载或重置时清理）。
 */
export function stopAllIotDemo(): void {
  if (orangeTimer !== null) { clearInterval(orangeTimer); orangeTimer = null }
  if (redTimer !== null)    { clearInterval(redTimer);    redTimer    = null }
}

// ── 查询辅助 ──────────────────────────────────────────────────────────────────

export interface BuildingIotSummary {
  spaceId:      number
  buildingName: string
  spaceCode:    string
  points: Array<{
    pointId:      number
    factorCode:   string
    factorName:   string
    unit:         string
    latestValue:  number | null
    latestTs:     string | null
    recent10:     Array<{ ts: string; value: number | null }>
    limitH:       number | null   // 橙色阈值
    limitHh:      number | null   // 红色阈值
  }>
}

/**
 * 获取单栋建筑最新及最近10条遥测数据汇总（用于大屏/PC端展示）。
 */
export function getBuildingIotSummary(spaceId: number): BuildingIotSummary | null {
  const spaces = getTable<{ id: number; name: string; space_code: string; type: string }>("iot_space")
  const building = spaces.find((s) => s.id === spaceId && s.type === "2")
  if (!building) return null

  const dataPoints = getTable<{
    id: number
    space_id: number
    factor_id: number
    limit_h: number | null
    limit_hh: number | null
  }>("iot_data_point").filter((p) => p.space_id === spaceId)

  const factorTypes = getTable<{
    id: number
    factor_code: string
    factor_name: string
    unit: string
  }>("iot_factor_type")

  const telemetry = getTable<{ ts: string; point_id: number; value_num: number | null }>(
    "iot_telemetry"
  )

  const points = dataPoints.map((dp) => {
    const factor = factorTypes.find((f) => f.id === dp.factor_id)
    const rows = telemetry
      .filter((r) => r.point_id === dp.id)
      .sort((a, b) => (a.ts > b.ts ? -1 : a.ts < b.ts ? 1 : 0))   // 降序

    const latest = rows[0] ?? null
    const SPARKLINE_COUNT = 10
    const rawRecent = rows.slice(0, SPARKLINE_COUNT).map((r) => ({ ts: r.ts, value: r.value_num }))
    // 补齐到恰好 10 个槽：旧数据在左（历史早的在左），旰数据在右（最新在右）
    const padded = Array.from({ length: SPARKLINE_COUNT - rawRecent.length }, () => ({ ts: '', value: null }))
    const recent10 = [...padded, ...rawRecent.reverse()]

    return {
      pointId:     dp.id,
      factorCode:  factor?.factor_code ?? "?",
      factorName:  factor?.factor_name ?? "未知",
      unit:        factor?.unit ?? "",
      latestValue: latest?.value_num ?? null,
      latestTs:    latest?.ts ?? null,
      recent10,
      limitH:      dp.limit_h,
      limitHh:     dp.limit_hh,
    }
  })

  return {
    spaceId:      building.id,
    buildingName: building.name,
    spaceCode:    building.space_code,
    points,
  }
}

/**
 * 获取所有建筑的最新遥测值（用于大屏列表展示）。
 * 每栋建筑只返回每种因子的最新一条。
 */
export function getAllBuildingsIotLatest(): BuildingIotSummary[] {
  const spaces = getTable<{ id: number; name: string; space_code: string; type: string }>("iot_space")
  const buildings = spaces.filter((s) => s.type === "2")
  return buildings
    .map((b) => getBuildingIotSummary(b.id))
    .filter((b): b is BuildingIotSummary => b !== null)
}

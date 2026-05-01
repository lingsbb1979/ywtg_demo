/**
 * T15.32 — seedAnalysisLink
 *
 * 在 T15.31 模板基础上，写入完整的分析配置到 space_analysis_config：
 * input_source_json 明确包含 point_ids 数组，将建筑（space_id）、
 * 数据点（point_ids）和公式（params_json）三者关联起来。
 *
 * 数据点 ID 布局（来自 T15.29 seedDataPoints）：
 *   point_id = 10001 + bIdx * 3 + fIdx
 *   fIdx: 0=裂缝, 1=倾角, 2=沉降
 *   bIdx: 0-22 对应 space_id 1001-1023
 */

import { setTable } from "../../services/sqliteMirrorRepository"

// ── 常量 ──────────────────────────────────────────────────────────────────────

const BUILDING_COUNT       = 23
const DATA_POINT_ID_START  = 10001
const FACTOR_COUNT         = 3   // 裂缝/倾角/沉降
const ANALYSIS_LINK_ID_START = 30001

// ── 公共参数模板 ──────────────────────────────────────────────────────────────

const CRACK_PARAMS = {
  factor_code: "CRACK", unit: "mm",
  limit_h: 2.0, limit_hh: 5.0,
  smooth_window: 3, trend_days: 7,
}

const TILT_PARAMS = {
  factor_code: "TILT", unit: "°",
  limit_h: 1.0, limit_hh: 3.0,
  smooth_window: 3, trend_days: 7,
}

const SCORE_PARAMS = {
  formula: "S = w_crack * score_crack + w_tilt * score_tilt + w_settle * score_settle",
  w_crack: 0.4, w_tilt: 0.35, w_settle: 0.25,
  score_range: { min: 0, max: 100 },
}

const CRACK_RISK = {
  green:  { min: 0,   max: 1.0 },
  yellow: { min: 1.0, max: 2.0 },
  orange: { min: 2.0, max: 5.0 },
  red:    { min: 5.0, max: null },
}

const TILT_RISK = {
  green:  { min: 0,   max: 0.5 },
  yellow: { min: 0.5, max: 1.0 },
  orange: { min: 1.0, max: 3.0 },
  red:    { min: 3.0, max: null },
}

const SCORE_RISK = {
  green:  { min: 0,  max: 30 },
  yellow: { min: 30, max: 60 },
  orange: { min: 60, max: 80 },
  red:    { min: 80, max: 100 },
}

// ── 生成关联配置行 ─────────────────────────────────────────────────────────────

/** 根据建筑索引 bIdx 计算各因子的 point_id */
function pointId(bIdx: number, fIdx: number): number {
  return DATA_POINT_ID_START + bIdx * FACTOR_COUNT + fIdx
}

export const ANALYSIS_LINK_ROWS = Array.from({ length: BUILDING_COUNT }, (_, bIdx) => {
  const spaceId  = 1001 + bIdx
  const pidCrack  = pointId(bIdx, 0)
  const pidTilt   = pointId(bIdx, 1)
  const pidSettle = pointId(bIdx, 2)
  const baseId   = ANALYSIS_LINK_ID_START + bIdx * 3

  return [
    // metric_id=1 裂缝阈值分析：关联 crack point
    {
      id:               baseId,
      space_id:         spaceId,
      metric_id:        1,
      calc_freq:        10,
      calc_freq_unit:   "MINUTE",
      input_source_json: JSON.stringify({
        table:     "iot_telemetry",
        point_ids: [pidCrack],
        space_id:  spaceId,
      }),
      params_json:      JSON.stringify(CRACK_PARAMS),
      risk_level_json:  JSON.stringify(CRACK_RISK),
      is_enabled:       1,
      create_time:      "2024-01-01 00:00:00",
      update_time:      "2024-01-01 00:00:00",
    },
    // metric_id=2 倾角阈值分析：关联 tilt point
    {
      id:               baseId + 1,
      space_id:         spaceId,
      metric_id:        2,
      calc_freq:        10,
      calc_freq_unit:   "MINUTE",
      input_source_json: JSON.stringify({
        table:     "iot_telemetry",
        point_ids: [pidTilt],
        space_id:  spaceId,
      }),
      params_json:      JSON.stringify(TILT_PARAMS),
      risk_level_json:  JSON.stringify(TILT_RISK),
      is_enabled:       1,
      create_time:      "2024-01-01 00:00:00",
      update_time:      "2024-01-01 00:00:00",
    },
    // metric_id=3 综合评分：关联 crack + tilt + settle 三个 point
    {
      id:               baseId + 2,
      space_id:         spaceId,
      metric_id:        3,
      calc_freq:        30,
      calc_freq_unit:   "MINUTE",
      input_source_json: JSON.stringify({
        table:     "iot_telemetry",
        point_ids: [pidCrack, pidTilt, pidSettle],
        space_id:  spaceId,
      }),
      params_json:      JSON.stringify(SCORE_PARAMS),
      risk_level_json:  JSON.stringify(SCORE_RISK),
      is_enabled:       1,
      create_time:      "2024-01-01 00:00:00",
      update_time:      "2024-01-01 00:00:00",
    },
  ]
}).flat()

// ── 入口 ─────────────────────────────────────────────────────────────────────

export function seedAnalysisLink(): void {
  setTable("space_analysis_config", ANALYSIS_LINK_ROWS)
}

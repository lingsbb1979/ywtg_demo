/**
 * T15.30 — seedTelemetry
 *
 * 为 69 个数据点写入 7 天正常状态基线采集值到 iot_telemetry。
 *
 * 规则：
 *   - 数据点 ID 范围：10001-10069（与 seedDataPoints 保持一致）
 *   - 时间范围：2024-03-01 至 2024-03-07，每天 08:00:00 一条
 *   - 值域：正常状态（远低于 limit_h 告警阈值）
 *     · 裂缝(factor 0)：~0.10-0.30mm（阈值 2.0mm）
 *     · 倾角(factor 1)：~0.05-0.20°（阈值 1.0°）
 *     · 沉降(factor 2)：~0.80-2.50mm（阈值 10.0mm）
 *   - 幂等：直接覆盖整张表
 */

import { setTable } from "../../services/sqliteMirrorRepository"

// ── 时间轴：7 天日期 ──────────────────────────────────────────────────────────

const BASELINE_DATES = [
  "2024-03-01",
  "2024-03-02",
  "2024-03-03",
  "2024-03-04",
  "2024-03-05",
  "2024-03-06",
  "2024-03-07",
]

const SAMPLE_TIME = "08:00:00"

// ── 正常基线值生成 ─────────────────────────────────────────────────────────────

/**
 * 根据因子类型索引、天数索引、建筑索引生成正常基线值
 * 使用确定性公式，值随时间缓慢微增但始终低于 limit_h
 *
 * @param factorIdx  0=裂缝, 1=倾角, 2=沉降
 * @param dayIdx     0-6
 * @param bldgIdx    0-22
 */
function baselineValue(factorIdx: number, dayIdx: number, bldgIdx: number): number {
  // 建筑间微小差异 + 每天微小增量（模拟正常老化）
  const bldgOffset = (bldgIdx % 7) * 0.01
  const dayTrend   = dayIdx * 0.005

  if (factorIdx === 0) {
    // 裂缝：0.10 ~ 0.30mm，远低于 limit_h=2.0mm
    return parseFloat((0.10 + bldgOffset + dayTrend).toFixed(3))
  }
  if (factorIdx === 1) {
    // 倾角：0.05 ~ 0.20°，远低于 limit_h=1.0°
    return parseFloat((0.05 + bldgOffset * 0.5 + dayTrend * 0.5).toFixed(3))
  }
  // 沉降：0.80 ~ 2.50mm，远低于 limit_h=10.0mm
  return parseFloat((0.80 + bldgOffset * 2 + dayTrend * 2).toFixed(3))
}

// ── 生成遥测记录 ──────────────────────────────────────────────────────────────

/** 数据点 ID 起始，与 seedDataPoints.ts 保持一致 */
const DATA_POINT_ID_START = 10001
const BUILDING_COUNT      = 23
const FACTOR_COUNT        = 3   // 裂缝/倾角/沉降

/**
 * 483 条遥测记录：23 栋 × 3 因子 × 7 天
 * point_id 布局：buildingIdx * 3 + factorIdx，从 10001 起
 */
export const TELEMETRY_ROWS = BASELINE_DATES.flatMap((date, dayIdx) =>
  Array.from({ length: BUILDING_COUNT }, (_, bIdx) =>
    Array.from({ length: FACTOR_COUNT }, (_, fIdx) => ({
      ts:        `${date} ${SAMPLE_TIME}`,
      point_id:  DATA_POINT_ID_START + bIdx * FACTOR_COUNT + fIdx,
      value_num: baselineValue(fIdx, dayIdx, bIdx),
      value_str: null,
    }))
  ).flat()
)

// ── 入口 ─────────────────────────────────────────────────────────────────────

export function seedTelemetry(): void {
  setTable("iot_telemetry", TELEMETRY_ROWS)
}

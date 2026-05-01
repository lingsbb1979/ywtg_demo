/**
 * T15.29 — seedDataPoints
 *
 * 为 23 栋历史建筑写入演示数据点：
 *   - iot_factor_type：裂缝 / 倾角 / 沉降 三种因子类型（id 1-3）
 *   - iot_data_point：每栋建筑各 3 个数据点，共 69 条（id 10001-10069）
 *
 * 幂等：直接覆盖整张表。
 */

import { setTable } from "../../services/sqliteMirrorRepository"

// ── 因子类型 ─────────────────────────────────────────────────────────────────

export const FACTOR_TYPE_ROWS = [
  {
    id: 1,
    business_id: 1,
    name: "裂缝监测",
    code: "CRACK",
    create_time: "2024-01-01 00:00:00",
    factor_code: "CRACK",
    factor_name: "裂缝宽度",
    unit: "mm",
    data_type: "FLOAT",
    precision: 2,
  },
  {
    id: 2,
    business_id: 1,
    name: "倾角监测",
    code: "TILT",
    create_time: "2024-01-01 00:00:00",
    factor_code: "TILT",
    factor_name: "倾斜角度",
    unit: "°",
    data_type: "FLOAT",
    precision: 3,
  },
  {
    id: 3,
    business_id: 1,
    name: "沉降监测",
    code: "SETTLE",
    create_time: "2024-01-01 00:00:00",
    factor_code: "SETTLE",
    factor_name: "沉降量",
    unit: "mm",
    data_type: "FLOAT",
    precision: 2,
  },
]

// ── 数据点 ────────────────────────────────────────────────────────────────────

/**
 * 因子配置：factor_id 对应 FACTOR_TYPE_ROWS 中的 id
 * limit_h  = 橙色告警阈值（黄色/高）
 * limit_hh = 红色告警阈值（超高）
 */
const FACTOR_CONFIG = [
  {
    factor_id: 1,
    nameSuffix: "裂缝",
    tag_key_prefix: "CRACK",
    unit_type_id: 11,
    limit_h: 2.0,    // mm  橙色
    limit_hh: 5.0,   // mm  红色
  },
  {
    factor_id: 2,
    nameSuffix: "倾角",
    tag_key_prefix: "TILT",
    unit_type_id: 12,
    limit_h: 1.0,    // °   橙色
    limit_hh: 3.0,   // °   红色
  },
  {
    factor_id: 3,
    nameSuffix: "沉降",
    tag_key_prefix: "SETTLE",
    unit_type_id: 13,
    limit_h: 10.0,   // mm  橙色
    limit_hh: 30.0,  // mm  红色
  },
]

/** 建筑 space_id 范围：1001-1023，对应 B001-B023 */
const BUILDING_SPACE_IDS = Array.from({ length: 23 }, (_, i) => 1001 + i)

/** 数据点起始 id，避免与 buildings(1001-1023) / regions(901-903) / archives(2001-2023) 冲突 */
const DATA_POINT_ID_START = 10001

export const DATA_POINT_ROWS = BUILDING_SPACE_IDS.flatMap((spaceId, bIdx) =>
  FACTOR_CONFIG.map((fc, fIdx) => {
    const id = DATA_POINT_ID_START + bIdx * FACTOR_CONFIG.length + fIdx
    const buildingNo = String(spaceId - 1000).padStart(3, "0") // "001"-"023"
    return {
      id,
      measure_point_id: null,
      name: `B${buildingNo}-${fc.nameSuffix}传感器`,
      tag_key: `${fc.tag_key_prefix}_B${buildingNo}`,
      offset_address: null,
      unit_type_id: fc.unit_type_id,
      coefficient: 1.0,
      decimal_places: 2,
      is_alarm: 1,
      limit_hh: fc.limit_hh,
      limit_h: fc.limit_h,
      limit_l: null,
      limit_ll: null,
      create_time: "2024-01-01 00:00:00",
      space_id: spaceId,
      factor_id: fc.factor_id,
      device_sn: `DEV-${fc.tag_key_prefix}-${buildingNo}`,
      point_name: `${fc.nameSuffix}监测点`,
      install_date: "2024-03-01",
      status: 1,
    }
  })
)

// ── 入口 ─────────────────────────────────────────────────────────────────────

export function seedDataPoints(): void {
  setTable("iot_factor_type", FACTOR_TYPE_ROWS)
  setTable("iot_data_point", DATA_POINT_ROWS)
}

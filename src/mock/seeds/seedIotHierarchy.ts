/**
 * T15.128 — seedIotHierarchy
 *
 * 为 23 栋历史建筑播种 IoT 六级接入层级静态数据：
 *   iot_gateway (23条) → iot_driver (23条) → iot_link (23条)
 *   → iot_device (23条) → iot_measure_point (69条, 3条/楼)
 *
 * ID 规则：
 *   - gateway / driver / link / device: 1-23（与建筑序号一一对应）
 *   - measure_point: 1-69（bIdx * 3 + fIdx + 1）
 *
 * 对应 DATA_POINT_ROWS 中的 measure_point_id：
 *   data_point id=10001 → measure_point_id=1 (B001-裂缝测点)
 *   data_point id=10002 → measure_point_id=2 (B001-倾角测点)
 *   data_point id=10003 → measure_point_id=3 (B001-沉降测点)
 *   data_point id=10004 → measure_point_id=4 (B002-裂缝测点)
 *   ...
 */

import { setTable } from "../../services/sqliteMirrorRepository"

const BUILDING_CODES = Array.from({ length: 23 }, (_, i) => `B${String(i + 1).padStart(3, "0")}`)

/** 因子名称，与 seedDataPoints.ts 中 FACTOR_CONFIG 顺序一致 */
const FACTOR_NAMES   = ["裂缝", "倾角", "沉降"] as const
const FACTOR_MP_CODES = ["CRACK", "TILT", "SETTLE"] as const

export const GATEWAY_ROWS = BUILDING_CODES.map((code, i) => ({
  id:           i + 1,
  name:         `${code}-网关`,
  code:         `GW-${code}`,
  ip_address:   `192.168.${Math.floor(i / 254) + 1}.${(i % 254) + 2}`,
  gateway_ip:   `192.168.${Math.floor(i / 254) + 1}.1`,
  subnet_mask:  "255.255.255.0",
  is_video_gw:  0,
  create_time:  "2024-01-01 00:00:00",
}))

export const DRIVER_ROWS = BUILDING_CODES.map((code, i) => ({
  id:            i + 1,
  gateway_id:    i + 1,
  name:          `${code}-Modbus驱动`,
  code:          `DRV-${code}`,
  protocol_type: "MODBUS_TCP",
  is_enabled:    1,
  create_time:   "2024-01-01 00:00:00",
}))

export const LINK_ROWS = BUILDING_CODES.map((code, i) => ({
  id:             i + 1,
  driver_id:      i + 1,
  name:           `${code}-链路`,
  code:           `LNK-${code}`,
  timeout_ms:     3000,
  remote_ip_port: null,
  com_port:       null,
  baud_rate:      9600,
  data_bits:      8,
  stop_bits:      1,
  parity:         "NONE",
  create_time:    "2024-01-01 00:00:00",
}))

export const DEVICE_ROWS = BUILDING_CODES.map((code, i) => ({
  id:              i + 1,
  link_id:         i + 1,
  business_id:     1,
  name:            `${code}-监测设备`,
  code:            `DEV-${code}`,
  model:           "IoT-Monitor-v2",
  manufacturer_id: 1,
  device_type_id:  1,
  create_time:     "2024-01-01 00:00:00",
}))

export const MEASURE_POINT_ROWS = BUILDING_CODES.flatMap((code, bIdx) =>
  FACTOR_NAMES.map((factorName, fIdx) => ({
    id:                   bIdx * 3 + fIdx + 1,
    device_id:            bIdx + 1,
    point_type:           "ANALOG",
    slave_address:        String(fIdx + 1),
    start_address:        String(fIdx * 2),
    name:                 `${code}-${factorName}测点`,
    code:                 `MP-${code}-${FACTOR_MP_CODES[fIdx]}`,
    data_type:            "FLOAT",
    function_code:        "03",
    install_location_id:  null,
    install_location_desc: null,
    create_time:          "2024-01-01 00:00:00",
  }))
)

export function seedIotHierarchy(): void {
  setTable("iot_gateway",       GATEWAY_ROWS)
  setTable("iot_driver",        DRIVER_ROWS)
  setTable("iot_link",          LINK_ROWS)
  setTable("iot_device",        DEVICE_ROWS)
  setTable("iot_measure_point", MEASURE_POINT_ROWS)
}

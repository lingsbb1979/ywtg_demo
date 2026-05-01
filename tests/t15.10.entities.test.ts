/**
 * T15.10 TDD — 定义核心实体类型
 *
 * 验收标准：
 *   - 完成建筑、数据点、采集值、分析结果、隐患视图、告警、工单、证据实体类型
 *   - 字段名必须与 完整SQL.md 的 CREATE TABLE 完全一致（全 snake_case）
 *   - 不允许出现 camelCase 字段名（如 alarmId、buildingId、createdAt 等）
 *   - 所有接口从 src/models/entities.ts 导出
 *   - 隐患（HazardView）是运行时计算视图，不是 localStorage 实体，字段不受 SQL 约束
 *
 * 字段检测方式：读取源文件文本，精确匹配字段声明（避免运行时类型擦除问题）
 */
import { describe, it, expect } from "vitest"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

const projectRoot = process.cwd()
const entitiesPath = join(projectRoot, "src", "models", "entities.ts")

function src(): string {
  return readFileSync(entitiesPath, "utf-8")
}

// 辅助：检测字段是否声明在文件中（格式：`  fieldName` 开头加可选 ?/:）
function hasField(source: string, field: string): boolean {
  // 匹配：行首空白 + 字段名 + 可选? + :
  return new RegExp(`\\b${field}\\??\\s*:`).test(source)
}

// ── 文件存在 ─────────────────────────────────────────────────────────────────

describe("T15.10 核心实体类型 — 文件结构", () => {
  it("应存在 src/models/entities.ts 文件", () => {
    expect(existsSync(entitiesPath), "缺少 src/models/entities.ts").toBe(true)
  })

  it("应导出 IotSpace 接口（建筑空间）", () => {
    expect(src()).toMatch(/export\s+interface\s+IotSpace\b/)
  })

  it("应导出 IotDataPoint 接口（数据点）", () => {
    expect(src()).toMatch(/export\s+interface\s+IotDataPoint\b/)
  })

  it("应导出 IotTelemetry 接口（采集值）", () => {
    expect(src()).toMatch(/export\s+interface\s+IotTelemetry\b/)
  })

  it("应导出 SpaceAnalysisArchive 接口（分析结果）", () => {
    expect(src()).toMatch(/export\s+interface\s+SpaceAnalysisArchive\b/)
  })

  it("应导出 HazardView 接口（隐患运行时视图）", () => {
    expect(src()).toMatch(/export\s+interface\s+HazardView\b/)
  })

  it("应导出 AlarmRecord 接口（告警记录）", () => {
    expect(src()).toMatch(/export\s+interface\s+AlarmRecord\b/)
  })

  it("应导出 WorkOrder 接口（工单）", () => {
    expect(src()).toMatch(/export\s+interface\s+WorkOrder\b/)
  })

  it("应导出 WorkOrderDisposal 接口（处置记录）", () => {
    expect(src()).toMatch(/export\s+interface\s+WorkOrderDisposal\b/)
  })

  it("应导出 FieldEvidence 接口（现场证据）", () => {
    expect(src()).toMatch(/export\s+interface\s+FieldEvidence\b/)
  })
})

// ── IotSpace 字段（对应 iot_space 表）──────────────────────────────────────

describe("T15.10 IotSpace — 字段与 SQL 一致", () => {
  it("应有 id 字段", () => { expect(hasField(src(), "id")).toBe(true) })
  it("应有 space_code 字段（非 spaceCode）", () => { expect(hasField(src(), "space_code")).toBe(true) })
  it("应有 name 字段", () => { expect(hasField(src(), "name")).toBe(true) })
  it("应有 latitude 字段（非 lat）", () => { expect(hasField(src(), "latitude")).toBe(true) })
  it("应有 longitude 字段（非 lng/lon）", () => { expect(hasField(src(), "longitude")).toBe(true) })
  it("应有 create_time 字段（非 createdAt）", () => { expect(hasField(src(), "create_time")).toBe(true) })
})

// ── IotDataPoint 字段（对应 iot_data_point 表）─────────────────────────────

describe("T15.10 IotDataPoint — 字段与 SQL 一致", () => {
  it("应有 measure_point_id 字段（非 measurePointId）", () => { expect(hasField(src(), "measure_point_id")).toBe(true) })
  it("应有 tag_key 字段（非 tagKey）", () => { expect(hasField(src(), "tag_key")).toBe(true) })
  it("应有 space_id 字段（非 spaceId）", () => { expect(hasField(src(), "space_id")).toBe(true) })
  it("应有 is_alarm 字段（非 isAlarm）", () => { expect(hasField(src(), "is_alarm")).toBe(true) })
})

// ── IotTelemetry 字段（对应 iot_telemetry 表）─────────────────────────────

describe("T15.10 IotTelemetry — 字段与 SQL 一致", () => {
  it("应有 ts 字段（时间戳，非 timestamp）", () => { expect(hasField(src(), "ts")).toBe(true) })
  it("应有 point_id 字段（非 pointId）", () => { expect(hasField(src(), "point_id")).toBe(true) })
  it("应有 value_num 字段（非 valueNum）", () => { expect(hasField(src(), "value_num")).toBe(true) })
  it("应有 value_str 字段（非 valueStr）", () => { expect(hasField(src(), "value_str")).toBe(true) })
})

// ── SpaceAnalysisArchive 字段（对应 space_analysis_archive 表）────────────

describe("T15.10 SpaceAnalysisArchive — 字段与 SQL 一致", () => {
  it("应有 space_id 字段", () => { expect(hasField(src(), "space_id")).toBe(true) })
  it("应有 metric_id 字段（非 metricId）", () => { expect(hasField(src(), "metric_id")).toBe(true) })
  it("应有 calc_time 字段（非 calcTime）", () => { expect(hasField(src(), "calc_time")).toBe(true) })
  it("应有 risk_level 字段（非 riskLevel）", () => { expect(hasField(src(), "risk_level")).toBe(true) })
})

// ── AlarmRecord 字段（对应 alarm_record 表）────────────────────────────────

describe("T15.10 AlarmRecord — 字段与 SQL 一致", () => {
  it("应有 alarm_code 字段（非 alarmCode）", () => { expect(hasField(src(), "alarm_code")).toBe(true) })
  it("应有 building_id 字段（非 buildingId）", () => { expect(hasField(src(), "building_id")).toBe(true) })
  it("应有 alarm_level 字段（非 alarmLevel）", () => { expect(hasField(src(), "alarm_level")).toBe(true) })
  it("应有 trigger_time 字段（非 triggerTime）", () => { expect(hasField(src(), "trigger_time")).toBe(true) })
  it("应有 status 字段", () => { expect(hasField(src(), "status")).toBe(true) })
})

// ── WorkOrder 字段（对应 work_order 表）────────────────────────────────────

describe("T15.10 WorkOrder — 字段与 SQL 一致（修正 T15.4 占位）", () => {
  it("应有 order_no 字段（非 orderNo）", () => { expect(hasField(src(), "order_no")).toBe(true) })
  it("应有 alarm_id 字段（非 alarmId）", () => { expect(hasField(src(), "alarm_id")).toBe(true) })
  it("应有 building_id 字段（非 buildingId）", () => { expect(hasField(src(), "building_id")).toBe(true) })
  it("应有 assignee_id 字段（非 assignedTo/assigneeId）", () => { expect(hasField(src(), "assignee_id")).toBe(true) })
  it("应有 dispatch_time 字段（非 dispatchTime）", () => { expect(hasField(src(), "dispatch_time")).toBe(true) })
  it("应有 create_time 字段（非 createdAt）", () => { expect(hasField(src(), "create_time")).toBe(true) })
  it("不应有 camelCase 字段 alarmId（已修正）", () => {
    // 检测 camelCase 错误字段不在 WorkOrder 接口体内（简单检查整个文件不含 `alarmId?:` 或 `alarmId:`）
    expect(/\balarmId\s*\??\s*:/.test(src())).toBe(false)
  })
  it("不应有 camelCase 字段 createdAt", () => {
    expect(/\bcreatedAt\s*\??\s*:/.test(src())).toBe(false)
  })
  it("不应有 camelCase 字段 assignedTo", () => {
    expect(/\bassignedTo\s*\??\s*:/.test(src())).toBe(false)
  })
})

// ── WorkOrderDisposal 字段（对应 work_order_disposal 表）──────────────────

describe("T15.10 WorkOrderDisposal — 字段与 SQL 一致", () => {
  it("应有 order_id 字段（非 orderId）", () => { expect(hasField(src(), "order_id")).toBe(true) })
  it("应有 disposal_desc 字段（非 disposalDesc）", () => { expect(hasField(src(), "disposal_desc")).toBe(true) })
  it("应有 image_urls 字段（非 photos/imageUrls）", () => { expect(hasField(src(), "image_urls")).toBe(true) })
  it("应有 gps_location 字段（非 gpsLocation）", () => { expect(hasField(src(), "gps_location")).toBe(true) })
})

// ── FieldEvidence 字段（对应 field_evidence 表）────────────────────────────

describe("T15.10 FieldEvidence — 字段与 SQL 一致", () => {
  it("应有 task_id 字段（非 taskId）", () => { expect(hasField(src(), "task_id")).toBe(true) })
  it("应有 media_type 字段（非 mediaType）", () => { expect(hasField(src(), "media_type")).toBe(true) })
  it("应有 file_url 字段（非 fileUrl）", () => { expect(hasField(src(), "file_url")).toBe(true) })
  it("应有 gps_lat 字段（非 lat/gpsLat）", () => { expect(hasField(src(), "gps_lat")).toBe(true) })
  it("应有 watermark_text 字段（非 watermarkText）", () => { expect(hasField(src(), "watermark_text")).toBe(true) })
})

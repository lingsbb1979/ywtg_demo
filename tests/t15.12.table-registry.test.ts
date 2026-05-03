/**
 * T15.12 TDD — 定义 SQLiteMirror 表注册表
 *
 * 验收标准：
 *   - 只登记 完整SQL.md 中存在的真实表名和字段顺序（共 83 张表）
 *   - 每张表的字段数组与 SQL CREATE TABLE 中的字段声明顺序一致
 *   - 所有字段名为 snake_case
 *   - 所有表名来自 TableNames 常量（禁止自造表）
 *   - 导出 TableRegistry: Record<string, readonly string[]>
 *   - 核心 P0 表（iot_space, iot_telemetry, alarm_record, work_order,
 *     field_evidence, work_order_disposal, system_log）字段顺序严格校验
 */
import { describe, it, expect } from "vitest"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

const projectRoot = process.cwd()
const registryPath = join(projectRoot, "src", "models", "tableRegistry.ts")

function src(): string {
  return readFileSync(registryPath, "utf-8")
}

// ── 文件存在 ─────────────────────────────────────────────────────────────────

describe("T15.12 表注册表 — 文件结构", () => {
  it("应存在 src/models/tableRegistry.ts 文件", () => {
    expect(existsSync(registryPath), "缺少 src/models/tableRegistry.ts").toBe(true)
  })

  it("应导出 TableRegistry 对象", () => {
    expect(src()).toContain("export const TableRegistry")
  })

  it("TableRegistry 应覆盖全部 83 张 SQL 真实表", async () => {
    const { TableRegistry } = await import("../src/models/tableRegistry")
    expect(Object.keys(TableRegistry).length).toBe(83)
  })

  it("TableRegistry 的每个条目值必须是非空数组", async () => {
    const { TableRegistry } = await import("../src/models/tableRegistry")
    for (const [table, fields] of Object.entries(TableRegistry)) {
      expect(Array.isArray(fields), `${table} 的字段列表不是数组`).toBe(true)
      expect((fields as string[]).length > 0, `${table} 字段列表为空`).toBe(true)
    }
  })

  it("所有字段名必须为 snake_case（禁止驼峰）", async () => {
    const { TableRegistry } = await import("../src/models/tableRegistry")
    for (const [table, fields] of Object.entries(TableRegistry)) {
      for (const f of fields as string[]) {
        expect(/^[a-z][a-z0-9_]*$/.test(f), `${table}.${f} 不是合法 snake_case`).toBe(true)
      }
    }
  })
})

// ── P0 核心表字段顺序严格校验 ───────────────────────────────────────────────

describe("T15.12 iot_space — 字段顺序与 SQL 一致", () => {
  it("字段顺序正确", async () => {
    const { TableRegistry } = await import("../src/models/tableRegistry")
    expect(TableRegistry["iot_space"]).toEqual([
      "id", "parent_id", "space_code", "name", "short_name",
      "type", "latitude", "longitude", "address_desc", "is_outdoor",
      "latlng_type", "create_time",
    ])
  })
})

describe("T15.12 iot_telemetry — 字段顺序与 SQL 一致", () => {
  it("字段顺序正确（复合主键 ts+point_id）", async () => {
    const { TableRegistry } = await import("../src/models/tableRegistry")
    expect(TableRegistry["iot_telemetry"]).toEqual([
      "ts", "point_id", "value_num", "value_str",
    ])
  })
})

describe("T15.12 alarm_record — 字段顺序与 SQL 一致", () => {
  it("字段顺序正确", async () => {
    const { TableRegistry } = await import("../src/models/tableRegistry")
    expect(TableRegistry["alarm_record"]).toEqual([
      "id", "alarm_id", "alarm_code", "device_id", "building_id", "sensor_id",
      "alarm_title", "alarm_type", "alarm_level", "alarm_content", "root_cause",
      "aggregate_flag", "raw_data", "status", "trigger_time", "handle_time",
      "handle_user", "create_time", "update_time",
    ])
  })
})

describe("T15.12 work_order — 字段顺序与 SQL 一致", () => {
  it("字段顺序正确（28 个字段）", async () => {
    const { TableRegistry } = await import("../src/models/tableRegistry")
    expect(TableRegistry["work_order"]).toEqual([
      "id", "order_no", "order_code", "alarm_id", "building_id",
      "order_type", "order_level", "alarm_level", "dispatch_type",
      "dispatch_org_id", "dispatch_user_id", "dispatch_org",
      "receive_org_id", "receive_user_id", "receive_org", "receive_role_key",
      "assignee_id", "priority", "status", "current_node",
      "source_id", "source_type", "dispatch_time", "accept_time",
      "finish_time", "check_time", "create_time", "update_time",
    ])
  })
})

describe("T15.12 work_order_disposal — 字段顺序与 SQL 一致", () => {
  it("字段顺序正确", async () => {
    const { TableRegistry } = await import("../src/models/tableRegistry")
    expect(TableRegistry["work_order_disposal"]).toEqual([
      "id", "order_id", "user_id", "gps_location", "address_desc",
      "image_urls", "video_url", "disposal_desc", "disposal_time", "create_time",
    ])
  })
})

describe("T15.12 field_evidence — 字段顺序与 SQL 一致", () => {
  it("字段顺序正确", async () => {
    const { TableRegistry } = await import("../src/models/tableRegistry")
    expect(TableRegistry["field_evidence"]).toEqual([
      "id", "task_id", "media_type", "file_url",
      "gps_lat", "gps_lng", "timestamp", "watermark_text",
    ])
  })
})

describe("T15.12 system_log — 字段顺序与 SQL 一致", () => {
  it("字段顺序正确", async () => {
    const { TableRegistry } = await import("../src/models/tableRegistry")
    expect(TableRegistry["system_log"]).toEqual([
      "log_id", "user_id", "operation_type", "operation_content",
      "ip_address", "user_agent", "status", "create_time",
    ])
  })
})

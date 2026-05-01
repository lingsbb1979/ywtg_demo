/**
 * T15.9 TDD — 定义 SQLite 真实表名常量
 *
 * 验收标准：
 *   - 建立 `TableNames`，只覆盖 完整SQL.md 中已存在的表
 *   - 包含核心演示表：iot_space, iot_telemetry, alarm_record, work_order
 *   - 不允许出现 完整SQL.md 中不存在的表名
 *   - 表名值必须全为 snake_case（无驼峰）
 *   - 导出 TableName 联合类型，供 Repository 类型约束使用
 */
import { describe, it, expect } from "vitest"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

const projectRoot = process.cwd()

// 完整SQL.md 中所有真实表名（83个），作为白名单
const VALID_SQL_TABLES = new Set([
  "sys_organization", "sys_user", "sys_role", "sys_menu",
  "sys_user_role", "sys_role_menu", "sys_config",
  "sys_dict_type", "sys_dict_data", "biz_config_change_log",
  "analysis_metric_template", "analysis_metric_param_def",
  "iot_business_type", "iot_factor_type", "iot_manufacturer",
  "iot_unit_type", "iot_device_type", "iot_gateway", "iot_driver",
  "iot_link", "iot_device", "iot_measure_point", "iot_data_point",
  "iot_data_point_factor_rel", "iot_video_point",
  "iot_alarm_strategy", "iot_alarm_linkage",
  "device_info", "sensor_data", "user_info", "device_user_rel",
  "system_log", "device_config",
  "iot_space", "iot_telemetry",
  "space_analysis_config", "space_analysis_archive",
  "alarm_level_config", "alarm_type_config", "alarm_rule_config",
  "notify_channel_config", "alarm_notify_policy", "alarm_route_rule",
  "alarm_record",
  "work_order_flow_template", "work_order_node_config",
  "work_order_dispatch_rule", "work_order_sla_policy",
  "work_order_site_rule_config",
  "work_order", "work_order_log", "work_order_disposal",
  "mobile_verify_record",
  "emergency_level_config", "emergency_plan_config",
  "emergency_flow_node_config", "emergency_command_type_config",
  "emergency_incident", "emergency_order",
  "archive_category_config", "archive_status_rule_config",
  "renovation_type_config", "digital_archive", "archive_relation",
  "renovation_record",
  "supervision_level_config", "supervision_flow_config",
  "supervision_order", "national_supervision_order",
  "supervision_reply", "major_event_report",
  "screen_metric_def", "metric_variable_map",
  "screen_page_def", "page_metric_bind",
  "duty_alert_policy", "user_profile_matrix",
  "mobile_menu_config", "mobile_rule_config", "mobile_session",
  "offline_task_cache", "field_evidence", "mobile_operation_log",
])

describe("T15.9 TableNames 常量", () => {
  it("应存在 src/models/tableNames.ts 文件", () => {
    const exists = existsSync(join(projectRoot, "src", "models", "tableNames.ts"))
    expect(exists, "缺少 src/models/tableNames.ts").toBe(true)
  })

  it("TableNames 应导出所有 83 个 SQL 真实表名", async () => {
    const { TableNames } = await import("../src/models/tableNames")
    const values = Object.values(TableNames) as string[]
    expect(values.length, "TableNames 中表数量不等于 83").toBe(83)
  })

  it("TableNames 的所有值必须是 完整SQL.md 中存在的表名（禁止自造表）", async () => {
    const { TableNames } = await import("../src/models/tableNames")
    const values = Object.values(TableNames) as string[]
    for (const v of values) {
      expect(VALID_SQL_TABLES.has(v), `'${v}' 不在 完整SQL.md 中，禁止自造表`).toBe(true)
    }
  })

  it("TableNames 的所有值必须为 snake_case（禁止驼峰）", async () => {
    const { TableNames } = await import("../src/models/tableNames")
    const values = Object.values(TableNames) as string[]
    for (const v of values) {
      expect(/^[a-z][a-z0-9_]*$/.test(v), `'${v}' 不是合法 snake_case`).toBe(true)
    }
  })

  it("必须包含核心演示 P0 表：iot_space", async () => {
    const { TableNames } = await import("../src/models/tableNames")
    const values = Object.values(TableNames) as string[]
    expect(values).toContain("iot_space")
  })

  it("必须包含核心演示 P0 表：iot_telemetry", async () => {
    const { TableNames } = await import("../src/models/tableNames")
    const values = Object.values(TableNames) as string[]
    expect(values).toContain("iot_telemetry")
  })

  it("必须包含核心演示 P0 表：alarm_record", async () => {
    const { TableNames } = await import("../src/models/tableNames")
    const values = Object.values(TableNames) as string[]
    expect(values).toContain("alarm_record")
  })

  it("必须包含核心演示 P0 表：work_order", async () => {
    const { TableNames } = await import("../src/models/tableNames")
    const values = Object.values(TableNames) as string[]
    expect(values).toContain("work_order")
  })

  it("必须包含 system_log（事件日志表，T15.22 依赖）", async () => {
    const { TableNames } = await import("../src/models/tableNames")
    const values = Object.values(TableNames) as string[]
    expect(values).toContain("system_log")
  })

  it("必须包含 field_evidence（现场证据表）", async () => {
    const { TableNames } = await import("../src/models/tableNames")
    const values = Object.values(TableNames) as string[]
    expect(values).toContain("field_evidence")
  })

  it("TableName 联合类型应可被 TypeScript 正常使用（导出检查）", () => {
    // 仅检查文件导出符号名，避免在 Node 测试中引入 TypeScript 编译器
    const content = readFileSync(
      join(projectRoot, "src", "models", "tableNames.ts"),
      "utf-8"
    )
    expect(content).toContain("export type TableName")
    expect(content).toContain("export const TableNames")
  })
})

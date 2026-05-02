/**
 * T15.115 TDD — 导出 SQL 自检
 *
 * 验收标准：
 *   - sqlExportService.ts 导出 exportToSql() 和 generateCreateTableDdl()
 *   - 导出的 SQL 字符串包含 CREATE TABLE
 *   - 导出的 SQL 字符串包含 INSERT INTO
 *   - 表名来自真实表注册（TableRegistry）
 *   - 字段名与注册表一致
 *   - 无数据的表不生成多余的 INSERT
 */
import { describe, it, expect, beforeEach } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const projectRoot = process.cwd()
const svcPath = join(projectRoot, "src", "services", "sqlExportService.ts")

function src(): string {
  return readFileSync(svcPath, "utf-8")
}

describe("T15.115 sqlExportService — 文件结构", () => {
  it("应导出 exportToSql 函数", () => {
    expect(src()).toMatch(/export.*function.*exportToSql|export.*exportToSql.*=/)
  })

  it("应导出 generateCreateTableDdl 函数", () => {
    expect(src()).toMatch(/export.*function.*generateCreateTableDdl|export.*generateCreateTableDdl.*=/)
  })
})

describe("T15.115 generateCreateTableDdl — 生成 DDL", () => {
  it("iot_space 生成含 CREATE TABLE 的 DDL", async () => {
    const { generateCreateTableDdl } = await import("../src/services/sqlExportService")
    const ddl = generateCreateTableDdl("iot_space")
    expect(ddl).toMatch(/CREATE TABLE/)
    expect(ddl).toContain("iot_space")
  })

  it("生成的 DDL 包含 TableRegistry 中的字段名", async () => {
    const { generateCreateTableDdl } = await import("../src/services/sqlExportService")
    const { TableRegistry } = await import("../src/models/tableRegistry")
    const ddl = generateCreateTableDdl("alarm_record")
    for (const field of TableRegistry["alarm_record"]!) {
      expect(ddl, `DDL 应包含字段 ${field}`).toContain(field)
    }
  })
})

describe("T15.115 exportToSql — 完整输出自检", () => {
  beforeEach(() => {
    // 清理并写入测试数据
    const MEM_KEY = "__ywtg_sqlite_mirror_store__"
    const mem = ((globalThis as any)[MEM_KEY] ??= {})
    // 写入一条测试工单
    mem["ywtg.sqlite.alarm_record"] = JSON.stringify([
      {
        id: 1, alarm_id: "A-001", alarm_code: "TEST-001",
        device_id: null, building_id: 1, sensor_id: null,
        alarm_title: "测试告警", alarm_type: "manual", alarm_level: "ORANGE",
        alarm_content: "裂缝超阈值", root_cause: null, aggregate_flag: 0,
        raw_data: null, status: "ACTIVE", trigger_time: "2026-05-01T10:00:00Z",
        handle_time: null, handle_user: null,
        create_time: "2026-05-01T10:00:00Z", update_time: "2026-05-01T10:00:00Z",
      },
    ])
  })

  it("exportToSql() 返回字符串", async () => {
    const { exportToSql } = await import("../src/services/sqlExportService")
    const sql = exportToSql({ tableNames: ["alarm_record"] })
    expect(typeof sql).toBe("string")
  })

  it("exportToSql() 包含 CREATE TABLE", async () => {
    const { exportToSql } = await import("../src/services/sqlExportService")
    const sql = exportToSql({ tableNames: ["alarm_record"] })
    expect(sql).toMatch(/CREATE TABLE/)
  })

  it("exportToSql() 包含 INSERT INTO", async () => {
    const { exportToSql } = await import("../src/services/sqlExportService")
    const sql = exportToSql({ tableNames: ["alarm_record"] })
    expect(sql).toMatch(/INSERT INTO/)
  })

  it("exportToSql() 包含真实表名 alarm_record", async () => {
    const { exportToSql } = await import("../src/services/sqlExportService")
    const sql = exportToSql({ tableNames: ["alarm_record"] })
    expect(sql).toContain("alarm_record")
  })

  it("exportToSql() 无数据的表不生成 INSERT（空表不报错）", async () => {
    const { exportToSql } = await import("../src/services/sqlExportService")
    // work_order 未写入任何数据
    const sql = exportToSql({ tableNames: ["work_order"] })
    expect(sql).not.toMatch(/INSERT INTO work_order/)
  })
})

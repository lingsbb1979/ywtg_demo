/**
 * T15.109 TDD — 导出 SQLite 兼容 SQL
 *
 * 验收标准：
 *   - exportToSql() 可把 ywtg.sqlite.<tableName> 逐表导出为 SQL 字符串
 *   - 支持 tableNames 参数限定导出范围
 *   - 不指定 tableNames 时自动扫描所有 ywtg.sqlite.* 键
 *   - 导出的 SQL 字符串可作为 demo_seed.sql 文件内容
 *   - 含表头注释（--）
 */
import { describe, it, expect, beforeEach } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const projectRoot = process.cwd()
const svcPath = join(projectRoot, "src", "services", "sqlExportService.ts")

function src(): string {
  return readFileSync(svcPath, "utf-8")
}

const MEM_KEY = "__ywtg_sqlite_mirror_store__"

function resetMem() {
  delete (globalThis as any)[MEM_KEY]
}

describe("T15.109 sqlExportService — exportToSql 接口", () => {
  it("sqlExportService.ts 文件应存在", () => {
    const { existsSync } = require("node:fs")
    expect(existsSync(svcPath)).toBe(true)
  })

  it("应导出 exportToSql 函数", () => {
    expect(src()).toMatch(/export.*function.*exportToSql|export.*exportToSql/)
  })
})

describe("T15.109 exportToSql — 内容验证", () => {
  beforeEach(() => {
    resetMem()
    const mem = ((globalThis as any)[MEM_KEY] ??= {})
    mem["ywtg.sqlite.work_order"] = JSON.stringify([
      {
        id: 1, order_no: "WO-2026-001", order_code: null,
        alarm_id: 1, building_id: 3, order_type: "REPAIR",
        order_level: "ORANGE", alarm_level: "ORANGE",
        dispatch_type: "AUTO", dispatch_org_id: 2, dispatch_user_id: null,
        dispatch_org: "住建局", receive_org_id: 3, receive_user_id: 5,
        receive_org: "街道办", receive_role_key: "FIELD",
        assignee_id: 5, priority: 2, status: "PENDING", current_node: "DISPATCH",
        source_id: 1, source_type: "ALARM",
        dispatch_time: "2026-05-01T10:00:00Z", accept_time: null,
        sla_deadline: "2026-05-01T12:00:00Z", close_time: null,
        remark: null, create_time: "2026-05-01T10:00:00Z",
        update_time: "2026-05-01T10:00:00Z",
      },
    ])
  })

  it("指定 tableNames 时只导出该表", async () => {
    const { exportToSql } = await import("../src/services/sqlExportService")
    const sql = exportToSql({ tableNames: ["work_order"] })
    expect(sql).toContain("work_order")
    expect(sql).not.toContain("alarm_record")
  })

  it("导出包含表头注释行（--）", async () => {
    const { exportToSql } = await import("../src/services/sqlExportService")
    const sql = exportToSql({ tableNames: ["work_order"] })
    expect(sql).toMatch(/--/)
  })

  it("导出包含 CREATE TABLE work_order", async () => {
    const { exportToSql } = await import("../src/services/sqlExportService")
    const sql = exportToSql({ tableNames: ["work_order"] })
    expect(sql).toMatch(/CREATE TABLE.*work_order/)
  })

  it("导出包含 INSERT INTO work_order", async () => {
    const { exportToSql } = await import("../src/services/sqlExportService")
    const sql = exportToSql({ tableNames: ["work_order"] })
    expect(sql).toMatch(/INSERT INTO work_order/)
  })

  it("导出包含工单编号 WO-2026-001", async () => {
    const { exportToSql } = await import("../src/services/sqlExportService")
    const sql = exportToSql({ tableNames: ["work_order"] })
    expect(sql).toContain("WO-2026-001")
  })

  it("不指定 tableNames 时自动扫描 ywtg.sqlite.* 键", async () => {
    const { exportToSql } = await import("../src/services/sqlExportService")
    const sql = exportToSql()
    // 有 work_order 数据，应包含它
    expect(sql).toContain("work_order")
  })
})

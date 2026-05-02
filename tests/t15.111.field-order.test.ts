/**
 * T15.111 TDD — SQL 字段顺序注册表（导出用途）
 *
 * 验收标准：
 *   - sqlExportService.ts 引用 TableRegistry
 *   - generateInsertStatement() 生成的列顺序与 TableRegistry 一致
 *   - generateInsertStatement() 生成的 VALUES 顺序与列顺序一致
 *   - P0 核心表（iot_space, alarm_record, work_order）字段按注册表顺序导出
 */
import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const projectRoot = process.cwd()
const svcPath = join(projectRoot, "src", "services", "sqlExportService.ts")

function src(): string {
  return readFileSync(svcPath, "utf-8")
}

describe("T15.111 sqlExportService — 引用 TableRegistry", () => {
  it("sqlExportService.ts 应引用 tableRegistry", () => {
    expect(src()).toMatch(/tableRegistry|TableRegistry/)
  })

  it("应导出 generateInsertStatement 函数", () => {
    expect(src()).toMatch(/export.*function.*generateInsertStatement|export.*generateInsertStatement.*=/)
  })
})

describe("T15.111 generateInsertStatement — 字段顺序与注册表一致", () => {
  it("iot_space: INSERT 列按注册表顺序", async () => {
    const { generateInsertStatement } = await import("../src/services/sqlExportService")
    const { TableRegistry } = await import("../src/models/tableRegistry")
    const fields = TableRegistry["iot_space"]!
    const row: Record<string, unknown> = { id: 1, name: "测试建筑" }
    const sql = generateInsertStatement("iot_space", row)
    // 验证 INSERT INTO 格式
    expect(sql).toMatch(/INSERT INTO iot_space/)
    // 验证列按注册表顺序（第一个字段是 id）
    const colMatch = sql.match(/INSERT INTO iot_space \(([^)]+)\)/)
    expect(colMatch).not.toBeNull()
    const cols = colMatch![1].split(",").map((s) => s.trim())
    expect(cols).toEqual(fields)
  })

  it("alarm_record: INSERT 列按注册表顺序（19 个字段）", async () => {
    const { generateInsertStatement } = await import("../src/services/sqlExportService")
    const { TableRegistry } = await import("../src/models/tableRegistry")
    const fields = TableRegistry["alarm_record"]!
    const row = { id: 1, alarm_code: "A001", status: "ACTIVE" }
    const sql = generateInsertStatement("alarm_record", row)
    const colMatch = sql.match(/INSERT INTO alarm_record \(([^)]+)\)/)
    expect(colMatch).not.toBeNull()
    const cols = colMatch![1].split(",").map((s) => s.trim())
    expect(cols).toEqual(fields)
  })

  it("work_order: INSERT 包含所有注册字段", async () => {
    const { generateInsertStatement } = await import("../src/services/sqlExportService")
    const { TableRegistry } = await import("../src/models/tableRegistry")
    const fields = TableRegistry["work_order"]!
    const row = { id: 1, order_no: "WO-001", status: "PENDING" }
    const sql = generateInsertStatement("work_order", row)
    for (const field of fields) {
      expect(sql).toContain(field)
    }
  })
})

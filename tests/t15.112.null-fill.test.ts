/**
 * T15.112 TDD — 空字段补齐
 *
 * 验收标准：
 *   - sqlExportService.ts 导出 fillNullFields()
 *   - fillNullFields(tableName, row) 返回新对象，字段顺序按 TableRegistry
 *   - 行中存在的字段值保持不变
 *   - 行中缺少的字段值补 null
 *   - 不在 TableRegistry 中的表名直接返回 row 副本（不抛出）
 */
import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const projectRoot = process.cwd()
const svcPath = join(projectRoot, "src", "services", "sqlExportService.ts")

function src(): string {
  return readFileSync(svcPath, "utf-8")
}

describe("T15.112 sqlExportService — fillNullFields 文件结构", () => {
  it("应导出 fillNullFields 函数", () => {
    expect(src()).toMatch(/export.*function.*fillNullFields|export.*fillNullFields.*=/)
  })
})

describe("T15.112 fillNullFields — 行为验证", () => {
  it("alarm_record: 只有 id 字段时，其余字段补 null", async () => {
    const { fillNullFields } = await import("../src/services/sqlExportService")
    const { TableRegistry } = await import("../src/models/tableRegistry")
    const result = fillNullFields("alarm_record", { id: 1 })
    // 所有 alarm_record 字段都应存在
    for (const field of TableRegistry["alarm_record"]!) {
      expect(Object.prototype.hasOwnProperty.call(result, field),
        `fillNullFields 应补充字段 ${field}`).toBe(true)
    }
    // id 应保持原值
    expect(result["id"]).toBe(1)
    // 其他字段为 null
    expect(result["status"]).toBeNull()
    expect(result["alarm_level"]).toBeNull()
  })

  it("work_order: 已有字段值不被覆盖", async () => {
    const { fillNullFields } = await import("../src/services/sqlExportService")
    const result = fillNullFields("work_order", {
      id: 5,
      order_no: "WO-2024-001",
      status: "PENDING",
    })
    expect(result["id"]).toBe(5)
    expect(result["order_no"]).toBe("WO-2024-001")
    expect(result["status"]).toBe("PENDING")
  })

  it("未注册的表名不抛出，返回行副本", async () => {
    const { fillNullFields } = await import("../src/services/sqlExportService")
    expect(() => fillNullFields("unknown_table_xyz", { id: 1 })).not.toThrow()
    const result = fillNullFields("unknown_table_xyz", { id: 1, name: "test" })
    expect(result["id"]).toBe(1)
    expect(result["name"]).toBe("test")
  })

  it("fillNullFields 返回新对象，不修改原始 row", async () => {
    const { fillNullFields } = await import("../src/services/sqlExportService")
    const original = { id: 1 }
    const result = fillNullFields("alarm_record", original)
    expect(result).not.toBe(original)
    expect(Object.keys(original).length).toBe(1) // 原始未被修改
  })
})
